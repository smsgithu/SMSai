// api/user-kv.js - Alternative using Vercel KV (Redis)
// Simpler setup - just add KV in Vercel dashboard

import { kv } from '@vercel/kv';

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

    const key = `user:${walletAddress}`;

    // GET - Fetch user data
    if (req.method === 'GET') {
      const userData = await kv.get(key);
      
      return res.status(200).json({
        user: userData,
        exists: !!userData
      });
    }

    // POST/PUT - Create or update user data
    if (req.method === 'POST' || req.method === 'PUT') {
      const { wallet_type, xp, questions_asked } = req.body;
      
      // Get existing data
      const existingData = await kv.get(key) || {};
      
      // Merge with new data
      const userData = {
        wallet_address: walletAddress,
        wallet_type: wallet_type || existingData.wallet_type || 'unknown',
        xp: xp !== undefined ? xp : (existingData.xp || 0),
        questions_asked: questions_asked !== undefined ? questions_asked : (existingData.questions_asked || 0),
        created_at: existingData.created_at || new Date().toISOString(),
        last_active: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Save to KV
      await kv.set(key, userData);

      return res.status(200).json({
        user: userData,
        action: existingData.wallet_address ? 'updated' : 'created'
      });
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
