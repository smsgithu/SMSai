import { sql } from '@vercel/postgres';
import { validateAvatarId, validateDisplayName, mapUserRow } from '../shared/product.js';
import { requireSession } from './lib/sessions.js';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const session = await requireSession(req);
    if (!session) {
      return res.status(401).json({ error: 'Sign in with your wallet before saving a profile.' });
    }

    const name = validateDisplayName(req.body?.display_name);
    if (!name.ok) return res.status(400).json({ error: name.error });
    const avatar = validateAvatarId(req.body?.avatar_id);
    if (!avatar.ok) return res.status(400).json({ error: avatar.error });

    const { rows } = await sql`
      UPDATE users
      SET display_name = ${name.name},
          avatar_id = ${avatar.avatar_id},
          last_active = NOW()
      WHERE wallet_address = ${session.wallet_address}
      RETURNING wallet_address, wallet_type, xp, total_questions, display_name, avatar_id
    `;

    if (!rows[0]) return res.status(404).json({ error: 'Connect your wallet before creating a profile.' });
    return res.status(200).json({ user: mapUserRow(rows[0]) });
  } catch (error) {
    console.error('Profile error:', error);
    return res.status(500).json({ error: 'Could not save that profile.' });
  }
}
