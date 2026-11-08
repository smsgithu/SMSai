import { useRef, useState } from 'react';
import { useCreateWallet, useExportWallet, useSignMessage, useWallets } from '@privy-io/react-auth/solana';
import { useLoginWithEmail, usePrivy } from '@privy-io/react-auth';
import { encodeBase58 } from '../../shared/base58.js';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function privyWallet(wallets) {
  return wallets.find((wallet) => wallet?.standardWallet?.name === 'Privy' || wallet?.address) || null;
}

async function waitForWallet(readWallets, createWallet) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const found = privyWallet(readWallets());
    if (found?.address) return found;
    await sleep(250);
  }
  const created = await createWallet();
  return created?.address ? created : privyWallet(readWallets());
}

export default function EmailSignInModal({ onClose, onSignedIn }) {
  const { getAccessToken, logout } = usePrivy();
  const { sendCode, loginWithCode } = useLoginWithEmail();
  const { wallets } = useWallets();
  const walletsRef = useRef(wallets);
  walletsRef.current = wallets;
  const { createWallet } = useCreateWallet();
  const { signMessage } = useSignMessage();
  const { exportWallet } = useExportWallet();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [signedInWallet, setSignedInWallet] = useState('');
  const [showExportSteps, setShowExportSteps] = useState(false);

  async function sendEmailCode(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await sendCode({ email: email.trim() });
      setCodeSent(true);
    } catch (sendError) {
      setError(sendError?.message || 'The code could not be sent. Check the email and try again.');
    } finally {
      setBusy(false);
    }
  }

  async function finishSignIn(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await loginWithCode({ code: code.trim() });
      const wallet = await waitForWallet(() => walletsRef.current, createWallet);
      if (!wallet?.address) throw new Error('The Solana wallet for this email is not ready yet. Try again.');
      const accessToken = await getAccessToken();
      const challengeResponse = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'challenge', wallet_address: wallet.address }),
      });
      const challenge = await challengeResponse.json();
      if (!challengeResponse.ok) throw new Error(challenge.error || 'Could not start sign-in.');
      const signed = await signMessage({
        wallet,
        message: new TextEncoder().encode(challenge.message),
        options: { uiOptions: { title: 'Sign in to SMSai' } },
      });
      const signature = encodeBase58(signed.signature);
      const verifyResponse = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify-privy',
          access_token: accessToken,
          wallet_address: wallet.address,
          wallet_type: 'privy',
          signature,
          nonce: challenge.nonce,
        }),
      });
      const verified = await verifyResponse.json();
      if (!verifyResponse.ok) {
        await logout().catch(() => {});
        throw new Error(verified.error || 'Email sign-in was rejected.');
      }
      setSignedInWallet(wallet.address);
      onSignedIn(verified);
    } catch (signInError) {
      setError(signInError?.message || 'Email sign-in did not finish.');
    } finally {
      setBusy(false);
    }
  }

  async function exportKey() {
    setError('');
    try {
      await exportWallet(signedInWallet ? { address: signedInWallet } : undefined);
    } catch (exportError) {
      setError(exportError?.message || 'Export did not open. You can keep using this wallet in SMSai. Try again in a regular browser.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-end sm:items-center justify-center px-3 py-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="email-title"
        className="bg-[#161616] border border-white/10 rounded-3xl w-full max-w-md max-h-[85vh] overflow-y-auto p-5 sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <h2 id="email-title" className="font-display text-xl text-white">Continue with email</h2>
          <button type="button" onClick={onClose} className="text-[#8C8C8C] hover:text-white text-sm">Close</button>
        </div>
        <div className="text-sm text-white/80 space-y-3 mb-4">
          <p>This creates a Solana wallet for you inside SMSai. You do not need a browser extension first.</p>
          <p>We email you a one-time code. That code signs you in. It is not a password, and it is not your private key.</p>
          <p>Use the same email next time and ask for a new code. Your profile, saved chats, and XP stay on this wallet address.</p>
          <p>Phantom, Solflare, Backpack, and Seed Vault still work on their own. Linking one of those later is a separate choice. Linking does not combine XP or balances.</p>
        </div>
        {!signedInWallet && (
          <form onSubmit={codeSent ? finishSignIn : sendEmailCode} className="space-y-3">
            <label className="block text-xs text-[#8C8C8C]">
              Email
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 w-full bg-[#0B0B0B] border border-white/10 rounded-xl px-3 py-3 text-sm text-white"
              />
            </label>
            {codeSent && (
              <label className="block text-xs text-[#8C8C8C]">
                One-time code
                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  className="mt-1 w-full bg-[#0B0B0B] border border-white/10 rounded-xl px-3 py-3 text-sm text-white"
                />
              </label>
            )}
            {error && <p className="text-sm text-red-300">{error}</p>}
            <button type="submit" disabled={busy} className="w-full min-h-11 bg-gradient-to-r from-[#9945FF] to-[#14F195] text-[#0B0B0B] font-semibold rounded-xl px-4 py-2.5 text-sm disabled:opacity-40">
              {busy ? 'Working...' : codeSent ? 'Create wallet and sign in' : 'Email me a code'}
            </button>
          </form>
        )}
        {signedInWallet && (
          <div className="space-y-3 text-sm text-white/80">
            <p>You are signed in. Wallet {signedInWallet.slice(0, 4)}...{signedInWallet.slice(-4)}.</p>
            <button type="button" onClick={() => setShowExportSteps((open) => !open)} className="w-full min-h-11 border border-white/10 rounded-xl px-4 py-2 text-sm text-white">
              {showExportSteps ? 'Hide export steps' : 'How to export this wallet'}
            </button>
            {showExportSteps && (
              <div className="bg-[#0B0B0B] border border-white/10 rounded-xl p-3 space-y-2 text-xs text-[#8C8C8C]">
                <p>Export is optional. You can keep using SMSai without it.</p>
                <p>1. Choose Export wallet key.</p>
                <p>2. Privy opens its own window and shows the key there. SMSai does not see that key.</p>
                <p>3. You can copy it into Phantom or another wallet if you want.</p>
                <p className="text-white">Never share that private key. Not with SMSai. Not in Get Help. Not with anyone who asks.</p>
                <button type="button" onClick={exportKey} className="w-full min-h-11 bg-gradient-to-r from-[#9945FF] to-[#14F195] text-[#0B0B0B] font-semibold rounded-xl px-4 py-2 text-sm">
                  Export wallet key
                </button>
              </div>
            )}
            {error && <p className="text-sm text-red-300">{error}</p>}
            <button type="button" onClick={onClose} className="w-full min-h-11 border border-white/10 rounded-xl px-4 py-2 text-sm text-[#8C8C8C]">Done</button>
          </div>
        )}
      </div>
    </div>
  );
}
