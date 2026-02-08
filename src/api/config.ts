/**
 * API configuration. Base URL should be set via .env (EXPO_PUBLIC_API_BASE_URL or API_BASE_URL)
 * or defaults to Omi production API.
 */
const getBaseUrl = (): string => {
  try {
    const env = typeof process !== 'undefined' ? process.env : undefined;
    const url = (env?.EXPO_PUBLIC_API_BASE_URL ?? env?.API_BASE_URL) as string | undefined;
    if (url) return url.endsWith('/') ? url : `${url}/`;
  } catch {
    // no process.env (e.g. some RN environments)
  }
  return 'https://api.omiapi.com/';
};

export const API_CONFIG = {
  baseUrl: getBaseUrl(),
  requestTimeoutReadMs: 30_000,
  requestTimeoutWriteMs: 300_000,
} as const;

export function isApiUrl(url: string): boolean {
  return url.startsWith(API_CONFIG.baseUrl) || url.includes('omiapi.com');
}
