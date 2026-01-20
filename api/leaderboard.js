import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const result = await sql`
      SELECT wallet_address, xp, total_questions as questions_asked FROM users WHERE xp > 0 ORDER BY xp DESC LIMIT 50
      FROM users 
      WHERE xp > 0
      ORDER BY xp DESC 
      LIMIT 50
    `;

    return res.status(200).json({ 
      leaderboard: result.rows 
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
}
