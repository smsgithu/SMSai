export function privyAppId() {
  const value = import.meta.env.VITE_PRIVY_APP_ID;
  return typeof value === 'string' ? value.trim() : '';
}

export function privyClientId() {
  const value = import.meta.env.VITE_PRIVY_CLIENT_ID;
  return typeof value === 'string' ? value.trim() : '';
}

export function privyEnabled() {
  return privyAppId().length > 0;
}
