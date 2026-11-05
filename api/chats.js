import { sql } from '@vercel/postgres';
import { isWalletAddress } from '../shared/product.js';
import { requireSession } from './lib/sessions.js';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const session = await requireSession(req);
    if (!session) return res.status(401).json({ error: 'Sign in with your wallet to use saved chats.' });

    const walletAddress = req.method === 'GET' || req.method === 'DELETE'
      ? req.query.wallet_address
      : req.body?.wallet_address;

    if (!isWalletAddress(walletAddress)) {
      return res.status(400).json({ error: 'Wallet address required' });
    }
    if (walletAddress !== session.wallet_address) {
      return res.status(403).json({ error: 'That wallet does not match this sign-in.' });
    }

    if (req.method === 'GET') {
      const { rows } = await sql`
        SELECT id, title, messages, created_at, updated_at
        FROM chats
        WHERE wallet_address = ${walletAddress}
        ORDER BY updated_at DESC
        LIMIT 50
      `;
      return res.status(200).json({ chats: rows });
    }

    if (req.method === 'POST') {
      const { chat_id, title, messages } = req.body || {};
      const safeTitle = String(title || 'New Chat').slice(0, 80);
      const payload = JSON.stringify(Array.isArray(messages) ? messages : []);

      if (chat_id) {
        const { rows } = await sql`
          UPDATE chats
          SET title = ${safeTitle}, messages = ${payload}, updated_at = NOW()
          WHERE id = ${chat_id} AND wallet_address = ${walletAddress}
          RETURNING id
        `;
        return res.status(200).json({ chat_id: rows[0]?.id || chat_id });
      }

      const { rows } = await sql`
        INSERT INTO chats (wallet_address, title, messages, created_at, updated_at)
        VALUES (${walletAddress}, ${safeTitle}, ${payload}, NOW(), NOW())
        RETURNING id
      `;
      return res.status(201).json({ chat_id: rows[0].id });
    }

    if (req.method === 'DELETE') {
      const chatId = req.query.chat_id;
      await sql`
        DELETE FROM chats
        WHERE id = ${chatId} AND wallet_address = ${walletAddress}
      `;
      return res.status(200).json({ deleted: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Chats API Error:', error);
    return res.status(500).json({ error: 'Could not update saved chats.' });
  }
}
