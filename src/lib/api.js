export const SESSION_AUTH_KEY = 'smsai_session';
export const VISIT_COUNT_KEY = 'smsai_visit_counted';

export function authHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const token = sessionStorage.getItem(SESSION_AUTH_KEY);
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export function rememberSession(token) {
  if (token) sessionStorage.setItem(SESSION_AUTH_KEY, token);
}

export function applyLogout(stores) {
  const visitBefore = stores.session.getItem(VISIT_COUNT_KEY);
  stores.session.removeItem(SESSION_AUTH_KEY);
  stores.local.removeItem('smsai_wallet');
  stores.local.removeItem('smsai_wallet_type');
  return {
    sessionCleared: stores.session.getItem(SESSION_AUTH_KEY) == null,
    visitUnchanged: stores.session.getItem(VISIT_COUNT_KEY) === visitBefore,
  };
}

export function clearSession() {
  applyLogout({ session: sessionStorage, local: localStorage });
}
