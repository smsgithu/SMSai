import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { Buffer } from 'node:buffer';
import { decodeBase58, encodeBase58 } from '../../shared/base58.js';
import {
  FREE_QUESTION_LIMIT,
  LAUNCH_RESET_CONFIRM,
  XP_ON_CONNECT,
  XP_PER_QUESTION,
  buildSignInMessage,
  isDiscordWebhook,
  leaderboardLabel,
  looksLikeSecret,
  validateDisplayName,
  validateHelpRequest,
} from '../../shared/product.js';
import { verifyWalletSignature } from './signature.js';
import { LAUNCH_RESET_SQL, evaluateLaunchReset } from './launch-reset.js';

test('base58 round-trips and keeps leading zero bytes', () => {
  assert.equal(encodeBase58(Uint8Array.of(0)), '1');
  assert.equal(encodeBase58(Uint8Array.of(0, 0)), '11');
  assert.equal(encodeBase58(Uint8Array.of(0, 1)), '12');
  const bytes = Uint8Array.from([0, 0, 255, 16, 32, 7]);
  assert.deepEqual(decodeBase58(encodeBase58(bytes)), bytes);
  assert.throws(() => decodeBase58('0OIl'));
});

test('wallet signatures verify the exact signed message', () => {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  const message = buildSignInMessage({ wallet: 'WalletAddressHere1111111111111111111111', nonce: 'abc' });
  const signature = sign(null, Buffer.from(message), privateKey);
  const spki = publicKey.export({ format: 'der', type: 'spki' });
  const raw = spki.subarray(spki.length - 32);
  const wallet = encodeBase58(raw);
  const encodedSignature = encodeBase58(signature);

  assert.equal(verifyWalletSignature(Buffer.from(message), encodedSignature, wallet), true);
  assert.equal(verifyWalletSignature(Buffer.from(`${message}\n`), encodedSignature, wallet), false);
  assert.equal(verifyWalletSignature(Buffer.from(message), encodedSignature, encodeBase58(Buffer.alloc(32, 3))), false);
  assert.equal(verifyWalletSignature(Buffer.from(message), 'not-a-signature', wallet), false);
});

test('launch reset stays off unless every guard matches', () => {
  const off = evaluateLaunchReset({ env: {}, headerSecret: 'secret', body: { confirm: LAUNCH_RESET_CONFIRM } });
  assert.equal(off.proceed, false);
  assert.equal(off.status, 404);

  const badSecret = evaluateLaunchReset({
    env: { LEADERBOARD_LAUNCH_RESET: 'confirm', LEADERBOARD_LAUNCH_RESET_SECRET: 'correct-secret' },
    headerSecret: 'wrong-secret',
    body: { confirm: LAUNCH_RESET_CONFIRM },
  });
  assert.equal(badSecret.status, 403);

  const badConfirm = evaluateLaunchReset({
    env: { LEADERBOARD_LAUNCH_RESET: 'confirm', LEADERBOARD_LAUNCH_RESET_SECRET: 'correct-secret' },
    headerSecret: 'correct-secret',
    body: { confirm: 'please wipe' },
  });
  assert.equal(badConfirm.status, 400);

  const ready = evaluateLaunchReset({
    env: { LEADERBOARD_LAUNCH_RESET: 'confirm', LEADERBOARD_LAUNCH_RESET_SECRET: 'correct-secret' },
    headerSecret: 'correct-secret',
    body: { confirm: LAUNCH_RESET_CONFIRM },
  });
  assert.equal(ready.proceed, true);
});

test('launch reset SQL zeros score columns and does not touch visits', () => {
  assert.match(LAUNCH_RESET_SQL, /UPDATE users/);
  assert.match(LAUNCH_RESET_SQL, /xp = 0/);
  assert.match(LAUNCH_RESET_SQL, /total_questions = 0/);
  assert.doesNotMatch(LAUNCH_RESET_SQL, /visit_count|stats|visits/i);

  const route = readFileSync(new URL('../launch-reset.js', import.meta.url), 'utf8');
  assert.match(route, /sql\.query\(LAUNCH_RESET_SQL\)/);
  assert.match(route, /evaluateLaunchReset/);
  assert.doesNotMatch(route, /visit_count|FROM stats|UPDATE stats/);
  const guard = readFileSync(new URL('./launch-reset.js', import.meta.url), 'utf8');
  assert.match(guard, /LEADERBOARD_LAUNCH_RESET/);
});

test('visits API is unchanged and user API no longer accepts client XP', () => {
  const visits = readFileSync(new URL('../visits.js', import.meta.url), 'utf8');
  assert.match(visits, /SELECT visit_count FROM stats/);
  assert.match(visits, /UPDATE stats SET visit_count = visit_count \+ 1/);

  const user = readFileSync(new URL('../user.js', import.meta.url), 'utf8');
  assert.match(user, /counted on the server/);
  assert.doesNotMatch(user, /questions_asked !== undefined|xp !== undefined|SET\s+xp = \$\{xp\}/);
});

test('profiles, help, and earn rates follow the phase 1 rules', () => {
  assert.equal(XP_ON_CONNECT, 20);
  assert.equal(XP_PER_QUESTION, 5);
  assert.equal(FREE_QUESTION_LIMIT, 5);
  assert.equal(validateDisplayName('  Sol Kid  ').name, 'Sol Kid');
  assert.equal(validateDisplayName('A').ok, false);
  assert.equal(validateDisplayName('bad!').ok, false);
  assert.equal(leaderboardLabel({ display_name: 'Ada', wallet_address: '11111111111111111111111111111111' }), 'Ada');
  assert.equal(leaderboardLabel({ wallet_address: 'Abcdefghijklmnopqrstuvwxyz1234567890' }).includes('...'), true);

  assert.equal(isDiscordWebhook('https://discord.com/api/webhooks/123/abc_DEF-1'), true);
  assert.equal(isDiscordWebhook('https://discord.com.evil.example/api/webhooks/123/abc'), false);
  assert.equal(isDiscordWebhook('http://discord.com/api/webhooks/123/abc'), false);
  assert.equal(isDiscordWebhook(''), false);

  const seed = Array.from({ length: 12 }, () => 'abandon').join(' ');
  assert.equal(looksLikeSecret(seed), true);
  assert.equal(looksLikeSecret('My wallet will not connect on my phone.'), false);
  const help = validateHelpRequest({ topic: 'Staying safe', description: 'The connect button does nothing.', discordUsername: '@SolUser' });
  assert.equal(help.ok, true);
  assert.equal(help.username, 'SolUser');
  assert.equal(validateHelpRequest({ topic: 'Seed phrase', description: seed, discordUsername: '' }).ok, false);
});

test('app copy uses the brand mark and does not send client XP', () => {
  const app = readFileSync(new URL('../../src/App.jsx', import.meta.url), 'utf8');
  assert.match(app, /logo-wordmark-white\.png/);
  assert.match(app, /id="visit-count"/);
  assert.match(app, /Get Help/);
  assert.doesNotMatch(app, /#00FFA3/i);
  assert.doesNotMatch(app, /xp:\s*\d+|questions_asked:/);
  assert.doesNotMatch(app, /—|–/);
  assert.doesNotMatch(app, /plain English|ebook|\/ebook|\/guide/i);

  const files = [
    '../../src/App.jsx',
    '../../src/components/InfoModal.jsx',
    '../../src/components/HelpModal.jsx',
    '../../src/components/ProfileModal.jsx',
    '../../index.html',
    '../../public/privacy.html',
    '../../public/terms.html',
    '../../public/copyright.html',
    '../chat.js',
  ];
  for (const file of files) {
    const text = readFileSync(new URL(file, import.meta.url), 'utf8');
    assert.doesNotMatch(text, /—|–|#00FFA3/i, file);
  }
});
