import { useEffect, useState } from 'react';
import { HELP_TOPICS } from '../../shared/product.js';

export default function HelpModal({ onClose, walletAddress }) {
  const [connected, setConnected] = useState(null);
  const [topic, setTopic] = useState(HELP_TOPICS[0]);
  const [description, setDescription] = useState('');
  const [discordUsername, setDiscordUsername] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    let active = true;
    fetch('/api/help')
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!active) return;
        setConnected(Boolean(response.ok && data.connected));
      })
      .catch(() => {
        if (active) setConnected(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function submit(event) {
    event.preventDefault();
    if (connected !== true) return;
    setSending(true);
    setError('');
    try {
      const response = await fetch('/api/help', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          description,
          discord_username: discordUsername,
          wallet_address: walletAddress || null,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.sent) {
        if (data.connected === false || response.status === 503) setConnected(false);
        throw new Error(data.error || 'Help is not connected yet. Your note was not sent.');
      }
      setResult(data);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-end sm:items-center justify-center px-3 py-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-title"
        className="bg-[#161616] border border-white/10 rounded-3xl w-full max-w-md max-h-[86vh] overflow-y-auto p-5 sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <h2 id="help-title" className="font-display text-xl text-white">Get Help</h2>
          <button type="button" onClick={onClose} className="text-[#8C8C8C] hover:text-white text-sm">Close</button>
        </div>

        <p className="text-sm text-white bg-[#9945FF]/15 border border-[#9945FF]/40 rounded-xl px-3 py-2 mb-4">
          Never share a seed phrase, private key, or password. Not in this form, and not with SMSai.
        </p>

        {connected === null && <p className="text-sm text-[#8C8C8C]">Checking whether help is connected...</p>}

        {connected === false && (
          <p className="text-sm text-white/80">
            Help is not connected yet. Nothing you type is sent anywhere. You can still reach Solana Made Simple on X at @smsonx and @solmadesimple.
          </p>
        )}

        {result && (
          <p className="text-sm text-white/85">
            {result.reply_via === 'discord_username'
              ? 'Sent. A reply will come from Solana Made Simple on Discord, to the username you entered. We will not ask for your seed phrase, private key, or password.'
              : 'Sent. Solana Made Simple can see this ticket on Discord, but there is no username to answer directly. Add a Discord username next time if you want a reply there. We will not ask for your seed phrase, private key, or password.'}
          </p>
        )}

        {connected === true && !result && (
          <form onSubmit={submit} className="space-y-3">
            <label className="block text-xs text-[#8C8C8C]">
              Topic
              <select
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                className="mt-1 w-full bg-[#0B0B0B] border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
              >
                {HELP_TOPICS.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label className="block text-xs text-[#8C8C8C]">
              Description
              <textarea
                required
                minLength={8}
                maxLength={1500}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="What happened, and what did you expect?"
                className="mt-1 w-full min-h-28 bg-[#0B0B0B] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30"
              />
            </label>
            <label className="block text-xs text-[#8C8C8C]">
              Discord username, optional
              <input
                value={discordUsername}
                onChange={(event) => setDiscordUsername(event.target.value)}
                placeholder="So we know who to reply to"
                className="mt-1 w-full bg-[#0B0B0B] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30"
              />
            </label>
            {walletAddress && (
              <p className="text-[11px] text-[#8C8C8C]">Your public wallet address is included so support can find the right profile. That address is not a secret.</p>
            )}
            {error && <p className="text-sm text-red-300">{error}</p>}
            <button
              type="submit"
              disabled={sending}
              className="w-full bg-gradient-to-r from-[#9945FF] to-[#14F195] text-[#0B0B0B] font-semibold rounded-xl px-4 py-2.5 text-sm disabled:opacity-40"
            >
              {sending ? 'Sending...' : 'Send to Solana Made Simple'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
