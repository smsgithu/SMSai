export function authHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const token = sessionStorage.getItem('smsai_session');
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export function rememberSession(token) {
  if (token) sessionStorage.setItem('smsai_session', token);
}

export function clearSession() {
  sessionStorage.removeItem('smsai_session');
  localStorage.removeItem('smsai_wallet');
  localStorage.removeItem('smsai_wallet_type');
}
