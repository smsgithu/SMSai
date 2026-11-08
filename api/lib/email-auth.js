import { isWalletAddress, xpForNewWallet } from '../../shared/product.js';

export const EMAIL_NOT_CONNECTED = 'Email sign-in is not connected yet. Connect a wallet to keep going.';

export function privyConfigStatus(env = {}) {
  const appId = String(env.PRIVY_APP_ID || '').trim();
  const appSecret = String(env.PRIVY_APP_SECRET || '').trim();
  if (!appId || !appSecret) {
    return { ok: false, status: 503, error: EMAIL_NOT_CONNECTED };
  }
  return { ok: true, appId, appSecret };
}

function accountField(account, snake, camel) {
  if (!account) return undefined;
  if (account[snake] != null) return account[snake];
  return account[camel];
}

export function embeddedSolanaWallet(user, address) {
  if (!isWalletAddress(address)) return null;
  const accounts = user?.linked_accounts || user?.linkedAccounts || [];
  return accounts.find((account) => {
    if (!account || account.type !== 'wallet') return false;
    if (accountField(account, 'chain_type', 'chainType') !== 'solana') return false;
    if (account.address !== address) return false;
    const client = accountField(account, 'wallet_client_type', 'walletClientType') || account.wallet_client || account.walletClient;
    const connector = accountField(account, 'connector_type', 'connectorType');
    return client === 'privy' && connector === 'embedded';
  }) || null;
}

export function bindPrivyAccountDecision(rows, privyUserId, embeddedWallet) {
  const list = Array.isArray(rows) ? rows : [];
  if (!list.length) return { ok: true, action: 'insert' };
  const same = list.length === 1
    && list[0].privy_user_id === privyUserId
    && list[0].embedded_wallet === embeddedWallet;
  if (same) return { ok: true, action: 'existing' };
  return {
    ok: false,
    status: 409,
    error: 'This email sign-in does not match that wallet. SMSai will not combine them.',
  };
}

export function linkWalletDecision({ existing, privyUserId, embeddedWallet, linkedWallet }) {
  if (!isWalletAddress(embeddedWallet) || !isWalletAddress(linkedWallet)) {
    return { ok: false, status: 400, error: 'Wallet address is not valid.' };
  }
  if (linkedWallet === embeddedWallet) {
    return { ok: false, status: 400, error: 'That is already the email wallet. Nothing was combined.' };
  }
  if (!existing) {
    return { ok: true, action: 'insert', xp_awarded: 0, balances_merged: false };
  }
  if (
    existing.privy_user_id === privyUserId
    && existing.embedded_wallet === embeddedWallet
    && existing.linked_wallet === linkedWallet
  ) {
    return { ok: true, action: 'existing', xp_awarded: 0, balances_merged: false };
  }
  return {
    ok: false,
    status: 409,
    error: 'That wallet is already linked to a different sign-in. XP and balances were not changed.',
    xp_awarded: 0,
    balances_merged: false,
  };
}

export function xpAwardForLogin(userExists) {
  return xpForNewWallet(Boolean(userExists));
}

export function xpAwardForLink() {
  return 0;
}
