/**
 * In-memory auth token store for API client.
 * Set token after sign-in (e.g. Firebase ID token); clear on sign-out.
 * Token expiry is optional; client may refresh when receiving 401.
 */
let authToken: string = '';
let tokenExpirationTime: number = 0;

export function setAuthToken(token: string, expirationTimeMs?: number): void {
  authToken = token;
  tokenExpirationTime = expirationTimeMs ?? 0;
}

export function getAuthToken(): string {
  return authToken;
}

export function getTokenExpirationTime(): number {
  return tokenExpirationTime;
}

export function clearAuth(): void {
  authToken = '';
  tokenExpirationTime = 0;
}

export function hasValidToken(): boolean {
  if (!authToken) return false;
  if (tokenExpirationTime <= 0) return true;
  const bufferMs = 5 * 60 * 1000; // 5 min buffer
  return Date.now() < tokenExpirationTime - bufferMs;
}
