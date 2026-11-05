import { sql } from '@vercel/postgres';
import { evaluateLaunchReset, LAUNCH_RESET_ID, LAUNCH_RESET_SQL } from './lib/launch-reset.js';

/**
 * One-time launch reset. Default off.
 * Zeros users.xp and users.total_questions only.
 * Does not read or write the visits counter.
 * A successful run inserts launch_resets.phase1-xp so a second call does not zero anyone again.
 * Do not call this during development, preview, or from the app UI.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed', reset: false });
  }

  const decision = evaluateLaunchReset({
    env: process.env,
    headerSecret: req.headers['x-launch-reset-secret'] || '',
    body: req.body || {},
  });
  if (!decision.proceed) {
    return res.status(decision.status).json(decision.body);
  }

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS launch_resets (
        id TEXT PRIMARY KEY,
        ran_at TIMESTAMPTZ NOT NULL,
        rows_zeroed INTEGER NOT NULL
      )
    `;

    const result = await sql.query(LAUNCH_RESET_SQL);
    const claimed = Number(result.rows[0]?.claimed ?? 0);
    const rowsZeroed = Number(result.rows[0]?.rows_zeroed ?? 0);

    if (claimed !== 1) {
      return res.status(409).json({
        error: 'This one-time leaderboard reset already ran. It will not run again.',
        reset: false,
        visits_untouched: true,
      });
    }

    await sql`
      UPDATE launch_resets
      SET rows_zeroed = ${rowsZeroed}
      WHERE id = ${LAUNCH_RESET_ID}
    `;

    return res.status(200).json({
      reset: true,
      rows_zeroed: rowsZeroed,
      visits_untouched: true,
    });
  } catch (error) {
    console.error('Launch reset failed:', error);
    return res.status(500).json({
      error: 'Launch reset failed before it could finish.',
      reset: false,
    });
  }
}
