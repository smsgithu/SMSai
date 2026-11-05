import { AVATARS, initialsFromName } from '../../shared/product.js';

export default function AvatarBadge({ name, avatarId, address, size = 32 }) {
  const chosen = AVATARS.find((item) => item.id === avatarId) || AVATARS[0];
  const letters = initialsFromName(name) || (address ? address.slice(0, 2) : '?');
  return (
    <span
      className="inline-flex items-center justify-center rounded-full font-display font-semibold shrink-0"
      style={{
        width: size,
        height: size,
        background: chosen.background,
        color: chosen.color,
        fontSize: size < 28 ? 10 : 12,
        border: chosen.id === 'night' || chosen.id === 'white' ? '1px solid rgba(255,255,255,0.16)' : 'none',
      }}
      aria-hidden="true"
    >
      {letters}
    </span>
  );
}
