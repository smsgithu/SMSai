import { sql } from '@vercel/postgres';
import { isLinkMessage, isSignInMessage, isWalletAddress, normalizeWalletType } from '../shared/product.js';
import { verifyWalletSignature } from './lib/signature.js';
import { ensureSchema } from './lib/schema.js';
import { bindPrivyAccountDecision, linkWalletDecision, privyConfigStatus, xpAwardForLink } from './lib/email-auth.js';
import { verifyPrivyEmbeddedWallet } from './lib/privy-server.js';
import { createChallenge, createLinkChallenge, issueSession, loadUser, requireSession } from './lib/sessions.js';
import { createOrTouchUser } from './lib/xp.js';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const session = await requireSession(req);
      if (!session) return res.status(401).json({ error: 'Sign in with your wallet again.', valid: false });
      const user = await loadUser(session.wallet_address);
      if (!user) return res.status(401).json({ error: 'Sign in with your wallet again.', valid: false });
      return res.status(200).json({ valid: true, user });
    }

    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const action = req.body?.action;
    const walletAddress = req.body?.wallet_address;

    if (!isWalletAddress(walletAddress) && action !== undefined) {
      if (action === 'challenge' || action === 'verify') {
        return res.status(400).json({ error: 'Wallet address is not valid.' });
      }
    }

    if (action === 'challenge') {
      const challenge = await createChallenge(walletAddress);
      return res.status(200).json(challenge);
    }

    if (action === 'verify') {
      await ensureSchema(sql);
      const { signature, nonce } = req.body || {};
      if (!isWalletAddress(walletAddress) || typeof signature !== 'string' || typeof nonce !== 'string') {
        return res.status(400).json({ error: 'Wallet, signature, and nonce are required.' });
      }

      const { rows } = await sql`
        SELECT message, wallet_address
        FROM auth_challenges
        WHERE nonce = ${nonce}
          AND wallet_address = ${walletAddress}
          AND expires_at > NOW()
        LIMIT 1
      `;
      const challenge = rows[0];
      if (!challenge || !isSignInMessage(challenge.message)) {
        return res.status(401).json({ error: 'That sign-in request expired. Try connecting again.' });
      }

      const verified = verifyWalletSignature(Buffer.from(challenge.message, 'utf8'), signature, walletAddress);
      await sql`DELETE FROM auth_challenges WHERE nonce = ${nonce}`;
      if (!verified) return res.status(401).json({ error: 'Signature did not match this wallet.' });

      const { user, created } = await createOrTouchUser(walletAddress, normalizeWalletType(req.body?.wallet_type));
      const token = await issueSession(walletAddress);
      return res.status(200).json({
        token,
        user,
        created,
        xp_awarded: created ? 20 : 0,
      });
    }

    if (action === 'verify-privy' || action === 'link-challenge' || action === 'link-wallet') {
      const config = privyConfigStatus(process.env);
      if (!config.ok) return res.status(config.status).json({ error: config.error, connected: false });
    }

    if (action === 'verify-privy') {
      await ensureSchema(sql);
      const { signature, nonce, access_token: accessToken } = req.body || {};
      if (!isWalletAddress(walletAddress) || typeof signature !== 'string' || typeof nonce !== 'string') {
        return res.status(400).json({ error: 'Wallet, signature, and nonce are required.' });
      }
      const privy = await verifyPrivyEmbeddedWallet({ accessToken, walletAddress });
      if (!privy.ok) return res.status(privy.status).json({ error: privy.error, connected: false });

      const { rows: existingAccounts } = await sql`
        SELECT privy_user_id, embedded_wallet
        FROM privy_accounts
        WHERE privy_user_id = ${privy.privyUserId} OR embedded_wallet = ${walletAddress}
      `;
      const binding = bindPrivyAccountDecision(existingAccounts, privy.privyUserId, walletAddress);
      if (!binding.ok) return res.status(binding.status).json({ error: binding.error, xp_awarded: 0 });

      const { rows: challengeRows } = await sql`
        SELECT message
        FROM auth_challenges
        WHERE nonce = ${nonce}
          AND wallet_address = ${walletAddress}
          AND expires_at > NOW()
        LIMIT 1
      `;
      const challenge = challengeRows[0];
      if (!challenge || !isSignInMessage(challenge.message)) {
        return res.status(401).json({ error: 'That sign-in request expired. Try the code again.' });
      }
      const verified = verifyWalletSignature(Buffer.from(challenge.message, 'utf8'), signature, walletAddress);
      await sql`DELETE FROM auth_challenges WHERE nonce = ${nonce}`;
      if (!verified) return res.status(401).json({ error: 'Signature did not match this wallet.' });

      const { user, created } = await createOrTouchUser(walletAddress, 'privy');
      if (binding.action === 'insert') {
        try {
          await sql`
            INSERT INTO privy_accounts (privy_user_id, embedded_wallet, created_at)
            VALUES (${privy.privyUserId}, ${walletAddress}, NOW())
          `;
        } catch (error) {
          if (error.code !== '23505') throw error;
          return res.status(409).json({ error: 'This email sign-in does not match that wallet. SMSai will not combine them.', xp_awarded: 0 });
        }
      }
      const token = await issueSession(walletAddress);
      return res.status(200).json({
        token,
        user,
        created,
        xp_awarded: created ? 20 : 0,
        balances_merged: false,
      });
    }

    if (action === 'link-challenge' || action === 'link-wallet') {
      await ensureSchema(sql);
      const session = await requireSession(req);
      if (!session) return res.status(401).json({ error: 'Sign in with email before linking a wallet.' });
      const linkedWallet = req.body?.linked_wallet;
      const accessToken = req.body?.access_token;
      if (!isWalletAddress(linkedWallet)) return res.status(400).json({ error: 'Wallet address is not valid.' });
      const privy = await verifyPrivyEmbeddedWallet({ accessToken, walletAddress: session.wallet_address });
      if (!privy.ok) return res.status(privy.status).json({ error: privy.error, connected: false });

      if (action === 'link-challenge') {
        const challenge = await createLinkChallenge({
          embeddedWallet: session.wallet_address,
          linkedWallet,
          privyUserId: privy.privyUserId,
        });
        return res.status(200).json(challenge);
      }

      const { signature, nonce } = req.body || {};
      if (typeof signature !== 'string' || typeof nonce !== 'string') {
        return res.status(400).json({ error: 'Signature and nonce are required.' });
      }
      const { rows: challengeRows } = await sql`
        SELECT message
        FROM auth_challenges
        WHERE nonce = ${nonce}
          AND wallet_address = ${linkedWallet}
          AND expires_at > NOW()
        LIMIT 1
      `;
      const challenge = challengeRows[0];
      const messageOk = challenge && isLinkMessage(challenge.message, {
        embeddedWallet: session.wallet_address,
        linkedWallet,
        privyUserId: privy.privyUserId,
      });
      if (!messageOk) return res.status(401).json({ error: 'That link request expired. Try again.' });
      const verified = verifyWalletSignature(Buffer.from(challenge.message, 'utf8'), signature, linkedWallet);
      await sql`DELETE FROM auth_challenges WHERE nonce = ${nonce}`;
      if (!verified) return res.status(401).json({ error: 'Signature did not match the wallet you want to link.' });

      const { rows: linkRows } = await sql`
        SELECT privy_user_id, embedded_wallet, linked_wallet
        FROM wallet_links
        WHERE linked_wallet = ${linkedWallet}
        LIMIT 1
      `;
      const decision = linkWalletDecision({
        existing: linkRows[0],
        privyUserId: privy.privyUserId,
        embeddedWallet: session.wallet_address,
        linkedWallet,
      });
      if (!decision.ok) return res.status(decision.status).json({ error: decision.error, xp_awarded: 0, balances_merged: false });
      if (decision.action === 'insert') {
        await sql`
          INSERT INTO wallet_links (linked_wallet, privy_user_id, embedded_wallet, created_at)
          VALUES (${linkedWallet}, ${privy.privyUserId}, ${session.wallet_address}, NOW())
        `;
      }
      return res.status(200).json({
        linked: true,
        xp_awarded: xpAwardForLink(),
        balances_merged: false,
      });
    }

    return res.status(400).json({ error: 'Unknown action.' });
  } catch (error) {
    console.error('Auth error:', error);
    const status = error.status || 500;
    return res.status(status).json({ error: status === 400 ? error.message : 'Sign-in failed.' });
  }
}
