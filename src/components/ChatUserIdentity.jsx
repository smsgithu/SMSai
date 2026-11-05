import { AVATARS, chatIdentityLabel } from '../../shared/product.js';

export default function ChatUserIdentity({ name, avatarId, address }) {
  const chosen = AVATARS.find((item) => item.id === avatarId) || AVATARS[0];
  const label = chatIdentityLabel({ name, address });
  const outlined = chosen.id === 'night' || chosen.id === 'white';
  return (
    <span
      className="chat-user-identity"
      data-testid="chat-user-name"
      style={{
        background: chosen.background,
        color: chosen.color,
        border: outlined ? '1px solid rgba(255,255,255,0.16)' : 'none',
      }}
    >
      {label}
    </span>
  );
}
