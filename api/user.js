// api/user.js - For Neon Database on Vercel
// FIXED: Column name is total_questions, not questions_asked

import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const walletAddress = req.method === 'GET' 
      ? req.query.wallet_address 
      : req.body.wallet_address;

    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address required' });
    }

    // GET - Fetch user data
    if (req.method === 'GET') {
      const { rows } = await sql`
        SELECT * FROM users WHERE wallet_address = ${walletAddress}
      `;

      // Map database column to frontend expectation
      const user = rows[0] ? {
        ...rows[0],
        questions_asked: rows[0].total_questions // Map for backwards compatibility
      } : null;

      return res.status(200).json({
        user: user,
        exists: !!rows[0]
      });
    }

    // POST/PUT - Create or update user data
    if (req.method === 'POST' || req.method === 'PUT') {
      const { wallet_type, xp, questions_asked } = req.body;

      // Check if user exists
      const { rows: existingRows } = await sql`
        SELECT * FROM users WHERE wallet_address = ${walletAddress}
      `;

      if (existingRows.length > 0) {
        // Update existing user
        const existingUser = existingRows[0];
        const { rows: updatedRows } = await sql`
          UPDATE users 
          SET 
            wallet_type = ${wallet_type || existingUser.wallet_type},
            xp = ${xp !== undefined ? xp : existingUser.xp},
            total_questions = ${questions_asked !== undefined ? questions_asked : existingUser.total_questions},
            last_active = NOW()
          WHERE wallet_address = ${walletAddress}
          RETURNING *
        `;

        // Map back for response
        const user = {
          ...updatedRows[0],
          questions_asked: updatedRows[0].total_questions
        };

        return res.status(200).json({
          user: user,
          action: 'updated'
        });
      } else {
        // Create new user
        const { rows: newRows } = await sql`
          INSERT INTO users (wallet_address, wallet_type, xp, total_questions, created_at, last_active)
          VALUES (${walletAddress}, ${wallet_type || 'unknown'}, ${xp || 20}, ${questions_asked || 0}, NOW(), NOW())
          RETURNING *
        `;

        // Map back for response
        const user = {
          ...newRows[0],
          questions_asked: newRows[0].total_questions
        };

        return res.status(201).json({
          user: user,
          action: 'created'
        });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
