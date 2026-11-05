import { createPublicKey, verify as cryptoVerify } from 'node:crypto';
import { decodeBase58 } from '../../shared/base58.js';

const ED25519_SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');

export function verifyWalletSignature(message, signatureBase58, walletAddress) {
  try {
    const signature = decodeBase58(signatureBase58);
    const publicKey = decodeBase58(walletAddress);
    if (signature.length !== 64 || publicKey.length !== 32) return false;
    const key = createPublicKey({
      key: Buffer.concat([ED25519_SPKI_PREFIX, Buffer.from(publicKey)]),
      format: 'der',
      type: 'spki',
    });
    const data = Buffer.isBuffer(message) ? message : Buffer.from(message);
    return cryptoVerify(null, data, key, Buffer.from(signature));
  } catch {
    return false;
  }
}
