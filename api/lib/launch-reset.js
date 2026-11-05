import { timingSafeEqual } from 'node:crypto';
import { LAUNCH_RESET_CONFIRM, LAUNCH_RESET_ID } from '../../shared/product.js';

export { LAUNCH_RESET_CONFIRM, LAUNCH_RESET_ID };

function safeEqual(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string') return false;
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length === 0 || a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Guards for the one-time launch reset.
 * The route stays off unless LEADERBOARD_LAUNCH_RESET is exactly "confirm"
 * and the secret header matches. Nothing here talks to the database.
 */
export function evaluateLaunchReset({ env = {}, headerSecret = '', body = {} } = {}) {
  if (env.LEADERBOARD_LAUNCH_RESET !== 'confirm') {
    return {
      proceed: false,
      status: 404,
      body: {
        error: 'Leaderboard launch reset is off. It does not run on deploy.',
        reset: false,
      },
    };
  }

  const expected = env.LEADERBOARD_LAUNCH_RESET_SECRET || '';
  if (!safeEqual(String(headerSecret || ''), expected)) {
    return {
      proceed: false,
      status: 403,
      body: { error: 'Launch reset secret was rejected.', reset: false },
    };
  }

  if (body?.confirm !== LAUNCH_RESET_CONFIRM) {
    return {
      proceed: false,
      status: 400,
      body: {
        error: `Send {"confirm":"${LAUNCH_RESET_CONFIRM}"} to zero XP and question counts. This does not change the visits counter.`,
        reset: false,
      },
    };
  }

  return { proceed: true };
}

// Static statement used by api/launch-reset.js. It only updates users and launch_resets.
export const LAUNCH_RESET_SQL = `
WITH claim AS (
  INSERT INTO launch_resets (id, ran_at, rows_zeroed)
  VALUES ('${LAUNCH_RESET_ID}', NOW(), 0)
  ON CONFLICT (id) DO NOTHING
  RETURNING id
),
zeroed AS (
  UPDATE users
  SET xp = 0,
      total_questions = 0
  WHERE EXISTS (SELECT 1 FROM claim)
    AND (COALESCE(xp, 0) <> 0 OR COALESCE(total_questions, 0) <> 0)
  RETURNING wallet_address
)
SELECT
  (SELECT COUNT(*)::int FROM claim) AS claimed,
  (SELECT COUNT(*)::int FROM zeroed) AS rows_zeroed
`;
