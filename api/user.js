import { isWalletAddress } from '../shared/product.js';
import { loadUser } from './lib/sessions.js';

function cors(res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'GET') {
    return res.status(400).json({
      error: 'XP and question counts are counted on the server. Sign in with your wallet, then ask a question. Profile updates go to /api/profile.',
    });
  }

  try {
    const walletAddress = req.query.wallet_address;
    if (!isWalletAddress(walletAddress)) {
      return res.status(400).json({ error: 'Wallet address required' });
    }
    const user = await loadUser(walletAddress);
    return res.status(200).json({
      user,
      exists: Boolean(user),
    });
  } catch (error) {
    console.error('User API error:', error);
    return res.status(500).json({ error: 'Could not load that wallet.' });
  }
}
