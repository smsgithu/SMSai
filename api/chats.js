import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const walletAddress = req.method === 'GET' || req.method === 'DELETE'
      ? req.query.wallet_address
      : req.body.wallet_address;

    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address required' });
    }

    // GET - Fetch all chats for a wallet
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

    // POST - Create or update a chat
    if (req.method === 'POST') {
      const { chat_id, title, messages } = req.body;

      if (chat_id) {
        // Update existing chat
        const { rows } = await sql`
          UPDATE chats 
          SET title = ${title}, messages = ${JSON.stringify(messages)}, updated_at = NOW()
          WHERE id = ${chat_id} AND wallet_address = ${walletAddress}
          RETURNING id
        `;
        return res.status(200).json({ chat_id: rows[0]?.id || chat_id });
      } else {
        // Create new chat
        const { rows } = await sql`
          INSERT INTO chats (wallet_address, title, messages, created_at, updated_at)
          VALUES (${walletAddress}, ${title}, ${JSON.stringify(messages)}, NOW(), NOW())
          RETURNING id
        `;
        return res.status(201).json({ chat_id: rows[0].id });
      }
    }

    // DELETE - Delete a chat
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
    return res.status(500).json({ error: error.message });
  }
}
