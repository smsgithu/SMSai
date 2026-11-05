import { useEffect, useState } from 'react';
import { AVATARS, validateDisplayName } from '../../shared/product.js';
import AvatarBadge from './AvatarBadge.jsx';

export default function ProfileModal({ mode, initialName, initialAvatar, saving, error, onSave, onClose, onDisconnect }) {
  const [name, setName] = useState(initialName || '');
  const [avatarId, setAvatarId] = useState(initialAvatar || '');
  const [localError, setLocalError] = useState('');
  const setup = mode === 'setup';

  useEffect(() => {
    setName(initialName || '');
    setAvatarId(initialAvatar || '');
    setLocalError('');
  }, [initialName, initialAvatar, mode]);

  function submit(event) {
    event.preventDefault();
    const parsed = validateDisplayName(name);
    if (!parsed.ok) {
      setLocalError(parsed.error);
      return;
    }
    setLocalError('');
    onSave({ displayName: parsed.name, avatarId: avatarId || null });
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-end sm:items-center justify-center px-3 py-4" onClick={setup ? undefined : onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-title"
        className="bg-[#161616] border border-white/10 rounded-3xl w-full max-w-md p-5 sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <h2 id="profile-title" className="font-display text-xl text-white">{setup ? 'Set up your profile' : 'Your profile'}</h2>
          {!setup && <button type="button" onClick={onClose} className="text-[#8C8C8C] hover:text-white text-sm">Close</button>}
        </div>
        <p className="text-sm text-[#8C8C8C] mb-4">
          {setup
            ? 'A display name is required to finish setup. The leaderboard shows this name. You can edit it later. This profile stays on the wallet you just connected.'
            : 'Update the name people see on the leaderboard. This profile stays on your connected wallet.'}
        </p>
        <form onSubmit={submit} className="space-y-4">
          <label className="block text-xs text-[#8C8C8C]">
            Display name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={24}
              required
              autoFocus
              className="mt-1 w-full bg-[#0B0B0B] border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
            />
          </label>
          <div>
            <p className="text-xs text-[#8C8C8C] mb-2">Avatar color, optional. Initials are used either way.</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setAvatarId('')}
                className={`rounded-full border px-3 py-1 text-xs ${avatarId === '' ? 'border-[#14F195] text-white' : 'border-white/10 text-[#8C8C8C]'}`}
              >
                Default
              </button>
              {AVATARS.map((avatar) => (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => setAvatarId(avatar.id)}
                  className={`rounded-full border p-1 ${avatarId === avatar.id ? 'border-[#14F195]' : 'border-transparent'}`}
                  aria-label={avatar.label}
                >
                  <AvatarBadge name={name || 'You'} avatarId={avatar.id} size={32} />
                </button>
              ))}
            </div>
          </div>
          {(localError || error) && <p className="text-sm text-red-300">{localError || error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-gradient-to-r from-[#9945FF] to-[#14F195] text-[#0B0B0B] font-semibold rounded-xl px-4 py-2.5 text-sm disabled:opacity-40"
          >
            {saving ? 'Saving...' : setup ? 'Save and finish setup' : 'Save profile'}
          </button>
          {setup && (
            <button type="button" onClick={onDisconnect} className="w-full text-sm text-[#8C8C8C] hover:text-white py-2">
              Disconnect instead
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
