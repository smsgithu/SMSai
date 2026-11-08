let ready = false;

export async function ensureSchema(sql) {
  if (ready) return;

  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_id TEXT`;
  await sql`
    CREATE TABLE IF NOT EXISTS auth_challenges (
      nonce TEXT PRIMARY KEY,
      wallet_address TEXT NOT NULL,
      message TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS auth_sessions (
      token_hash TEXT PRIMARY KEY,
      wallet_address TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS privy_accounts (
      privy_user_id TEXT PRIMARY KEY,
      embedded_wallet TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS wallet_links (
      linked_wallet TEXT PRIMARY KEY,
      privy_user_id TEXT NOT NULL,
      embedded_wallet TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  try {
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS users_wallet_address_uidx
      ON users (wallet_address)
    `;
  } catch (error) {
    console.error('Unique wallet index was not added:', error.message);
  }

  ready = true;
}

export function resetSchemaCache() {
  ready = false;
}
