import { PrivyClient } from '@privy-io/node';
import { embeddedSolanaWallet, privyConfigStatus } from './email-auth.js';

export async function verifyPrivyEmbeddedWallet({ accessToken, walletAddress }) {
  const config = privyConfigStatus(process.env);
  if (!config.ok) return config;
  if (typeof accessToken !== 'string' || !accessToken.trim()) {
    return { ok: false, status: 401, error: 'Email sign-in could not be checked. Try the code again.' };
  }

  try {
    const privy = new PrivyClient({ appId: config.appId, appSecret: config.appSecret });
    const claims = await privy.utils().auth().verifyAccessToken(accessToken.trim());
    const user = await privy.users()._get(claims.user_id);
    const wallet = embeddedSolanaWallet(user, walletAddress);
    if (!wallet) {
      return { ok: false, status: 401, error: 'That wallet is not the Solana wallet for this email sign-in.' };
    }
    return { ok: true, privyUserId: claims.user_id, appId: claims.app_id };
  } catch (error) {
    console.error('Privy verification failed:', error?.message || error);
    return { ok: false, status: 401, error: 'Email sign-in could not be checked. Try the code again.' };
  }
}
