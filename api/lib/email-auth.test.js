import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { applyLogout, VISIT_COUNT_KEY, SESSION_AUTH_KEY } from '../../src/lib/api.js';
import { buildLinkMessage, buildSignInMessage, isLinkMessage, isSignInMessage, xpForNewWallet } from '../../shared/product.js';
import {
  bindPrivyAccountDecision,
  embeddedSolanaWallet,
  linkWalletDecision,
  privyConfigStatus,
  xpAwardForLink,
  xpAwardForLogin,
} from './email-auth.js';

function memoryStore(seed = {}) {
  const data = { ...seed };
  return {
    getItem(key) { return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null; },
    setItem(key, value) { data[key] = String(value); },
    removeItem(key) { delete data[key]; },
  };
}

const embedded = 'oreoU2P8bN6jkk3jbaiVxYnG1dCXcYxwhwyK9jSybcp';
const external = 'So11111111111111111111111111111111111111112';

test('email sign-in fails closed when Privy config is missing', () => {
  assert.equal(privyConfigStatus({}).ok, false);
  assert.equal(privyConfigStatus({ PRIVY_APP_ID: 'app' }).status, 503);
  assert.equal(privyConfigStatus({ PRIVY_APP_SECRET: 'secret' }).ok, false);
  assert.equal(privyConfigStatus({ PRIVY_APP_ID: ' app ', PRIVY_APP_SECRET: ' secret ' }).ok, true);
});

test('only the Privy embedded Solana wallet counts as the email wallet', () => {
  const user = {
    linked_accounts: [
      { type: 'email', address: 'person@example.com' },
      { type: 'wallet', chain_type: 'solana', address: external, wallet_client_type: 'phantom', connector_type: 'solana_adapter' },
      { type: 'wallet', chain_type: 'solana', address: embedded, wallet_client_type: 'privy', connector_type: 'embedded' },
    ],
  };
  assert.equal(embeddedSolanaWallet(user, embedded)?.address, embedded);
  assert.equal(embeddedSolanaWallet(user, external), null);
  assert.equal(embeddedSolanaWallet(user, 'not-a-wallet'), null);
});

test('email login does not attach to a different wallet or award a second bonus', () => {
  const same = bindPrivyAccountDecision(
    [{ privy_user_id: 'did:privy:one', embedded_wallet: embedded }],
    'did:privy:one',
    embedded,
  );
  assert.equal(same.action, 'existing');
  const conflict = bindPrivyAccountDecision(
    [{ privy_user_id: 'did:privy:one', embedded_wallet: embedded }],
    'did:privy:two',
    embedded,
  );
  assert.equal(conflict.ok, false);
  assert.equal(conflict.status, 409);
  assert.equal(xpAwardForLogin(true), 0);
  assert.equal(xpAwardForLogin(false), 20);
  assert.equal(xpForNewWallet(true), 0);
});

test('linking requires an explicit different wallet and never moves XP', () => {
  const fresh = linkWalletDecision({
    existing: null,
    privyUserId: 'did:privy:one',
    embeddedWallet: embedded,
    linkedWallet: external,
  });
  assert.equal(fresh.action, 'insert');
  assert.equal(fresh.xp_awarded, 0);
  assert.equal(fresh.balances_merged, false);
  assert.equal(linkWalletDecision({
    existing: null,
    privyUserId: 'did:privy:one',
    embeddedWallet: embedded,
    linkedWallet: embedded,
  }).ok, false);
  const taken = linkWalletDecision({
    existing: { privy_user_id: 'did:privy:other', embedded_wallet: 'Sysvar1111111111111111111111111111111111111', linked_wallet: external },
    privyUserId: 'did:privy:one',
    embeddedWallet: embedded,
    linkedWallet: external,
  });
  assert.equal(taken.status, 409);
  assert.equal(taken.xp_awarded, 0);
  assert.equal(xpAwardForLink(), 0);
});

test('sign-in and link messages cannot be swapped', () => {
  const signIn = buildSignInMessage({ wallet: embedded, nonce: 'n1' });
  const link = buildLinkMessage({
    embeddedWallet: embedded,
    linkedWallet: external,
    privyUserId: 'did:privy:one',
    nonce: 'n2',
  });
  assert.equal(isSignInMessage(signIn), true);
  assert.equal(isSignInMessage(link), false);
  assert.equal(isLinkMessage(link, { embeddedWallet: embedded, linkedWallet: external, privyUserId: 'did:privy:one' }), true);
  assert.equal(isLinkMessage(signIn, { embeddedWallet: embedded, linkedWallet: external, privyUserId: 'did:privy:one' }), false);
  assert.equal(isLinkMessage(link, { embeddedWallet: embedded, linkedWallet: external, privyUserId: 'did:privy:other' }), false);
});

test('logout clears the session and leaves the visit flag alone', () => {
  const session = memoryStore({ [SESSION_AUTH_KEY]: 'token', [VISIT_COUNT_KEY]: '1' });
  const local = memoryStore({ smsai_wallet: embedded, smsai_wallet_type: 'privy' });
  const result = applyLogout({ session, local });
  assert.equal(result.sessionCleared, true);
  assert.equal(result.visitUnchanged, true);
  assert.equal(session.getItem(VISIT_COUNT_KEY), '1');
  assert.equal(local.getItem('smsai_wallet'), null);
});

test('link route does not create a user or award XP', () => {
  const source = readFileSync(new URL('../auth.js', import.meta.url), 'utf8');
  const marker = source.indexOf("if (action === 'link-challenge' || action === 'link-wallet')");
  const linkBody = source.slice(marker);
  assert.equal(linkBody.includes('createOrTouchUser'), false);
  assert.match(source, /isSignInMessage\(challenge\.message\)/);
  assert.match(source, /xpAwardForLink\(\)/);
  assert.doesNotMatch(source, /getByEmailAddress/);
});
