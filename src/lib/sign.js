import { getWallets } from '@wallet-standard/app';
import { encodeBase58 } from '../../shared/base58.js';

function toBase58Signature(result) {
  const signature = result instanceof Uint8Array || typeof result === 'string'
    ? result
    : result?.signature;
  if (typeof signature === 'string' && /^[1-9A-HJ-NP-Za-km-z]+$/.test(signature)) return signature;
  if (signature instanceof Uint8Array) return encodeBase58(signature);
  throw new Error('This wallet did not return a signature.');
}

function findStandardWallet(walletName) {
  const { get } = getWallets();
  return get().find((item) => {
    const name = item.name?.toLowerCase() || '';
    if (walletName === 'jupiter') return name.includes('jupiter') || name === 'jup';
    return name.includes('mobile wallet adapter') || name.includes('seed vault') || name.includes('mwa');
  });
}

export async function signWalletMessage(walletName, address, message) {
  const encoded = new TextEncoder().encode(message);

  if (walletName === 'seedvault' || walletName === 'jupiter') {
    const wallet = findStandardWallet(walletName);
    const feature = wallet?.features?.['solana:signMessage'];
    if (!feature?.signMessage) throw new Error('This wallet cannot sign messages.');
    const account = wallet.accounts?.find((item) => item.address === address) || wallet.accounts?.[0];
    if (!account) throw new Error('No account was available to sign.');
    const outputs = await feature.signMessage({ account, message: encoded });
    const output = Array.isArray(outputs) ? outputs[0] : outputs;
    return toBase58Signature(output);
  }

  const windowKey = { phantom: 'solana', solflare: 'solflare', backpack: 'backpack' }[walletName];
  const walletObj = windowKey ? window[windowKey] : null;
  if (!walletObj?.signMessage) throw new Error('This wallet cannot sign messages.');
  const result = await walletObj.signMessage(encoded, 'utf8');
  return toBase58Signature(result);
}
