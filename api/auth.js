import { sql } from '@vercel/postgres';
import { isWalletAddress, normalizeWalletType } from '../shared/product.js';
import { verifyWalletSignature } from './lib/signature.js';
import { ensureSchema } from './lib/schema.js';
import { createChallenge, issueSession, loadUser, requireSession } from './lib/sessions.js';
import { createOrTouchUser } from './lib/xp.js';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const session = await requireSession(req);
      if (!session) return res.status(401).json({ error: 'Sign in with your wallet again.', valid: false });
      const user = await loadUser(session.wallet_address);
      if (!user) return res.status(401).json({ error: 'Sign in with your wallet again.', valid: false });
      return res.status(200).json({ valid: true, user });
    }

    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const action = req.body?.action;
    const walletAddress = req.body?.wallet_address;

    if (!isWalletAddress(walletAddress) && action !== undefined) {
      if (action === 'challenge' || action === 'verify') {
        return res.status(400).json({ error: 'Wallet address is not valid.' });
      }
    }

    if (action === 'challenge') {
      const challenge = await createChallenge(walletAddress);
      return res.status(200).json(challenge);
    }

    if (action === 'verify') {
      await ensureSchema(sql);
      const { signature, nonce } = req.body || {};
      if (!isWalletAddress(walletAddress) || typeof signature !== 'string' || typeof nonce !== 'string') {
        return res.status(400).json({ error: 'Wallet, signature, and nonce are required.' });
      }

      const { rows } = await sql`
        SELECT message, wallet_address
        FROM auth_challenges
        WHERE nonce = ${nonce}
          AND wallet_address = ${walletAddress}
          AND expires_at > NOW()
        LIMIT 1
      `;
      const challenge = rows[0];
      if (!challenge) return res.status(401).json({ error: 'That sign-in request expired. Try connecting again.' });

      const verified = verifyWalletSignature(Buffer.from(challenge.message, 'utf8'), signature, walletAddress);
      await sql`DELETE FROM auth_challenges WHERE nonce = ${nonce}`;
      if (!verified) return res.status(401).json({ error: 'Signature did not match this wallet.' });

      const { user, created } = await createOrTouchUser(walletAddress, normalizeWalletType(req.body?.wallet_type));
      const token = await issueSession(walletAddress);
      return res.status(200).json({
        token,
        user,
        created,
        xp_awarded: created ? 20 : 0,
      });
    }

    return res.status(400).json({ error: 'Unknown action.' });
  } catch (error) {
    console.error('Auth error:', error);
    const status = error.status || 500;
    return res.status(status).json({ error: status === 400 ? error.message : 'Sign-in failed.' });
  }
}
