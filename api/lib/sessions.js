import { createHash, randomBytes } from 'node:crypto';
import { sql } from '@vercel/postgres';
import { buildSignInMessage, isWalletAddress, mapUserRow } from '../../shared/product.js';
import { ensureSchema } from './schema.js';

export function bearerToken(req) {
  const header = req.headers?.authorization || req.headers?.Authorization || '';
  const match = /^Bearer\s+(\S+)$/i.exec(String(header));
  return match ? match[1] : '';
}

export function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

export async function createChallenge(walletAddress) {
  if (!isWalletAddress(walletAddress)) {
    const error = new Error('Wallet address is not valid.');
    error.status = 400;
    throw error;
  }
  await ensureSchema(sql);
  const nonce = randomBytes(16).toString('hex');
  const message = buildSignInMessage({ wallet: walletAddress, nonce });
  await sql`DELETE FROM auth_challenges WHERE wallet_address = ${walletAddress} OR expires_at < NOW()`;
  await sql`
    INSERT INTO auth_challenges (nonce, wallet_address, message, expires_at)
    VALUES (${nonce}, ${walletAddress}, ${message}, NOW() + INTERVAL '10 minutes')
  `;
  return { nonce, message };
}

export async function readSession(token) {
  if (!token) return null;
  await ensureSchema(sql);
  const tokenHash = hashToken(token);
  const { rows } = await sql`
    SELECT wallet_address
    FROM auth_sessions
    WHERE token_hash = ${tokenHash}
      AND expires_at > NOW()
    LIMIT 1
  `;
  return rows[0] || null;
}

export async function requireSession(req) {
  const token = bearerToken(req);
  if (!token) return null;
  return readSession(token);
}

export async function issueSession(walletAddress) {
  const token = randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  await sql`
    INSERT INTO auth_sessions (token_hash, wallet_address, expires_at, created_at)
    VALUES (${tokenHash}, ${walletAddress}, NOW() + INTERVAL '14 days', NOW())
  `;
  return token;
}

export async function loadUser(walletAddress) {
  await ensureSchema(sql);
  const { rows } = await sql`
    SELECT wallet_address, wallet_type, xp, total_questions, display_name, avatar_id
    FROM users
    WHERE wallet_address = ${walletAddress}
    LIMIT 1
  `;
  return mapUserRow(rows[0]);
}
