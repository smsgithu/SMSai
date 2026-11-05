export const XP_ON_CONNECT = 20;
export const XP_PER_QUESTION = 5;
export const LEADERBOARD_LIMIT = 50;
export const FREE_QUESTION_LIMIT = 5;

export const NIGHT = '#0B0B0B';
export const WHITE = '#FFFFFF';
export const FINE_PRINT = '#8C8C8C';
export const SOLANA_PURPLE = '#9945FF';
export const SOLANA_GREEN = '#14F195';

export const AVATARS = [
  { id: 'purple', label: 'Purple', background: '#9945FF', color: '#FFFFFF' },
  { id: 'green', label: 'Green', background: '#14F195', color: '#0B0B0B' },
  { id: 'night', label: 'Night', background: '#161616', color: '#FFFFFF' },
  { id: 'grey', label: 'Grey', background: '#8C8C8C', color: '#0B0B0B' },
  { id: 'white', label: 'White', background: '#FFFFFF', color: '#0B0B0B' },
  { id: 'gradient', label: 'Solana', background: 'linear-gradient(135deg, #9945FF, #14F195)', color: '#0B0B0B' },
];

export const HELP_TOPICS = [
  'Connecting a wallet',
  'Questions and XP',
  'Profile and leaderboard',
  'Staying safe',
  'Something else',
];

export const LAUNCH_RESET_CONFIRM = 'ZERO_LEADERBOARD_KEEP_VISITS';
export const LAUNCH_RESET_ID = 'phase1-xp';

export const WALLET_TYPES = ['phantom', 'solflare', 'backpack', 'seedvault', 'jupiter', 'unknown'];

export const WELCOME_MESSAGE = `Welcome to **SMSai**

Your AI Guide to Solana, from Solana Made Simple. Ask about wallets, seed phrases, staking, DeFi, and how Solana works.

You get 5 free questions. Connect a wallet when you want to keep asking and earn XP.

This is education, not financial advice. Never share your seed phrase, not even with SMSai.`;

export function isWalletAddress(value) {
  return typeof value === 'string' && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value);
}

export function shortenAddress(address) {
  if (!address || address.length < 8) return address || '';
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function validateDisplayName(input) {
  if (typeof input !== 'string') return { ok: false, error: 'Display name is required.' };
  const name = input.trim().replace(/\s+/g, ' ');
  if (!name) return { ok: false, error: 'Display name is required.' };
  if (name.length < 2) return { ok: false, error: 'Display name needs at least 2 characters.' };
  if (name.length > 24) return { ok: false, error: 'Display name can be at most 24 characters.' };
  if (!/^[\p{L}\p{N}](?:[\p{L}\p{N} _.'-]*[\p{L}\p{N}])?$/u.test(name)) {
    return { ok: false, error: 'Use letters, numbers, spaces, and simple punctuation only.' };
  }
  return { ok: true, name };
}

export function validateAvatarId(input) {
  if (input == null || input === '') return { ok: true, avatar_id: null };
  const found = AVATARS.find((avatar) => avatar.id === input);
  if (!found) return { ok: false, error: 'Pick one of the avatar colors, or leave it blank.' };
  return { ok: true, avatar_id: found.id };
}

export function initialsFromName(name) {
  const cleaned = String(name || '').trim();
  if (!cleaned) return '';
  const parts = cleaned.split(/\s+/).slice(0, 2);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return parts.map((part) => part[0]).join('').toUpperCase();
}

export function leaderboardLabel(user) {
  const name = String(user?.display_name || '').trim();
  if (name) return name;
  return shortenAddress(user?.wallet_address || '');
}

export function normalizeWalletType(value) {
  const type = String(value || '').toLowerCase();
  return WALLET_TYPES.includes(type) ? type : 'unknown';
}

export function buildSignInMessage({ wallet, nonce }) {
  return [
    'SMSai sign-in',
    '',
    'Site: smsai.fun',
    `Wallet: ${wallet}`,
    `Nonce: ${nonce}`,
    '',
    'Sign this message to prove you control this wallet.',
    'This does not move any funds and does not share your seed phrase.',
  ].join('\n');
}

export function mapUserRow(row) {
  if (!row) return null;
  const displayName = row.display_name ? String(row.display_name) : null;
  return {
    wallet_address: row.wallet_address,
    wallet_type: row.wallet_type || 'unknown',
    xp: Number(row.xp ?? 0),
    questions_asked: Number(row.total_questions ?? row.questions_asked ?? 0),
    display_name: displayName,
    avatar_id: row.avatar_id || null,
    needs_profile: !displayName,
  };
}

export function looksLikeSecret(text) {
  const value = String(text || '');
  if (/[1-9A-HJ-NP-Za-km-z]{64,}/.test(value)) return true;
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 12 && words.length <= 24 && words.every((word) => /^[a-z]{3,8}$/.test(word))) {
    return true;
  }
  return false;
}

export function validateDiscordUsername(input) {
  if (input == null || String(input).trim() === '') return { ok: true, username: null };
  const username = String(input).trim().replace(/^@+/, '');
  if (!/^[A-Za-z0-9._]{2,32}$/.test(username)) {
    return {
      ok: false,
      error: 'Discord username can use letters, numbers, dots, and underscores. Or leave it blank.',
    };
  }
  return { ok: true, username };
}

export function validateHelpRequest({ topic, description, discordUsername }) {
  if (!HELP_TOPICS.includes(topic)) {
    return { ok: false, error: 'Pick a topic from the list.' };
  }
  if (typeof description !== 'string') {
    return { ok: false, error: 'Add a short description.' };
  }
  const note = description.trim();
  if (note.length < 8) return { ok: false, error: 'Add a few more words so we can tell what you need.' };
  if (note.length > 1500) return { ok: false, error: 'Keep the description under 1500 characters.' };
  if (looksLikeSecret(note) || looksLikeSecret(topic)) {
    return {
      ok: false,
      error: 'Remove anything that looks like a seed phrase or private key. SMSai will never ask for those.',
    };
  }
  const username = validateDiscordUsername(discordUsername);
  if (!username.ok) return username;
  return { ok: true, topic, description: note, username: username.username };
}

export function isDiscordWebhook(raw) {
  if (typeof raw !== 'string' || !raw.trim()) return false;
  let url;
  try {
    url = new URL(raw.trim());
  } catch {
    return false;
  }
  if (url.protocol !== 'https:') return false;
  if (url.username || url.password) return false;
  const host = url.hostname.toLowerCase();
  if (host !== 'discord.com' && host !== 'discordapp.com') return false;
  return /^\/api\/webhooks\/\d+\/[\w-]+\/?$/.test(url.pathname);
}
