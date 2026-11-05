import { sql } from '@vercel/postgres';
import { XP_ON_CONNECT, XP_PER_QUESTION, normalizeWalletType } from '../../shared/product.js';
import { ensureSchema } from './schema.js';
import { loadUser } from './sessions.js';

export { XP_ON_CONNECT, XP_PER_QUESTION };

export async function createOrTouchUser(walletAddress, walletType) {
  await ensureSchema(sql);
  const type = normalizeWalletType(walletType);
  const existing = await loadUser(walletAddress);
  if (existing) {
    await sql`
      UPDATE users
      SET wallet_type = ${type},
          last_active = NOW()
      WHERE wallet_address = ${walletAddress}
    `;
    return { user: await loadUser(walletAddress), created: false };
  }

  try {
    await sql`
      INSERT INTO users (wallet_address, wallet_type, xp, total_questions, created_at, last_active)
      VALUES (${walletAddress}, ${type}, ${XP_ON_CONNECT}, 0, NOW(), NOW())
    `;
    return { user: await loadUser(walletAddress), created: true };
  } catch (error) {
    if (error.code === '23505') {
      return { user: await loadUser(walletAddress), created: false };
    }
    throw error;
  }
}

export async function awardConnectedQuestion(walletAddress) {
  await ensureSchema(sql);
  const { rows } = await sql`
    UPDATE users
    SET xp = COALESCE(xp, 0) + ${XP_PER_QUESTION},
        total_questions = COALESCE(total_questions, 0) + 1,
        last_active = NOW()
    WHERE wallet_address = ${walletAddress}
    RETURNING xp, total_questions
  `;
  if (!rows[0]) return null;
  return {
    xp: Number(rows[0].xp),
    questions_asked: Number(rows[0].total_questions),
  };
}
