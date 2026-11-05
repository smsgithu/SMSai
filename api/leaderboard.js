import { sql } from '@vercel/postgres';
import { LEADERBOARD_LIMIT } from '../shared/product.js';
import { ensureSchema } from './lib/schema.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await ensureSchema(sql);
    const result = await sql`
      SELECT wallet_address, xp, total_questions AS questions_asked, display_name, avatar_id
      FROM users
      WHERE xp > 0
      ORDER BY xp DESC
      LIMIT ${LEADERBOARD_LIMIT}
    `;

    const leaderboard = result.rows.map((row) => ({
      wallet_address: row.wallet_address,
      xp: Number(row.xp ?? 0),
      questions_asked: Number(row.questions_asked ?? 0),
      display_name: row.display_name || null,
      avatar_id: row.avatar_id || null,
    }));

    return res.status(200).json({ leaderboard });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
}
