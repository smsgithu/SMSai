import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const { rows } = await sql`SELECT visit_count FROM stats WHERE id = 'global'`;
      return res.status(200).json({ count: rows[0]?.visit_count || 0 });
    }

    if (req.method === 'POST') {
      const { rows } = await sql`UPDATE stats SET visit_count = visit_count + 1 WHERE id = 'global' RETURNING visit_count`;
      return res.status(200).json({ count: rows[0]?.visit_count || 0 });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Visits API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
