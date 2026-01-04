import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    const { wallet_address, wallet_type, action } = req.body;

    if (!wallet_address) {
      return res.status(400).json({ error: 'Wallet address required' });
    }

    try {
      // Find or create user
      let user = await sql`
        SELECT * FROM users WHERE wallet_address = ${wallet_address}
      `.then(result => result.rows[0]);

      if (!user) {
        // Create new user
        const newUser = await sql`
          INSERT INTO users (wallet_address, wallet_type, xp, total_questions)
          VALUES (${wallet_address}, ${wallet_type}, 20, 0)
          RETURNING *
        `;
        user = newUser.rows[0];

        // Log wallet connection XP
        await sql`
          INSERT INTO xp_logs (user_id, action, xp_earned)
          VALUES (${user.id}, 'wallet_connected', 20)
        `;
      } else {
        // Update last active
        await sql`
          UPDATE users 
          SET last_active = NOW()
          WHERE id = ${user.id}
        `;
      }

      // If action is asking a question, update XP
      if (action === 'question') {
        const newXP = user.xp + 5;
        const newQuestions = user.total_questions + 1;

        await sql`
          UPDATE users 
          SET xp = ${newXP}, total_questions = ${newQuestions}
          WHERE id = ${user.id}
        `;

        await sql`
          INSERT INTO xp_logs (user_id, action, xp_earned)
          VALUES (${user.id}, 'question_asked', 5)
        `;

        user.xp = newXP;
        user.total_questions = newQuestions;
      }

      return res.status(200).json({
        user: {
          id: user.id,
          wallet_address: user.wallet_address,
          xp: user.xp,
          total_questions: user.total_questions
        }
      });

    } catch (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Database error' });
    }
  }

  if (req.method === 'GET') {
    const { wallet_address } = req.query;

    if (!wallet_address) {
      return res.status(400).json({ error: 'Wallet address required' });
    }

    try {
      const result = await sql`
        SELECT * FROM users WHERE wallet_address = ${wallet_address}
      `;

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = result.rows[0];

      return res.status(200).json({
        user: {
          id: user.id,
          wallet_address: user.wallet_address,
          xp: user.xp,
          total_questions: user.total_questions
        }
      });

    } catch (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Database error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}