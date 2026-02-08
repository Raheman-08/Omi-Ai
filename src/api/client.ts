import { API_CONFIG, isApiUrl } from './config';
import { getAuthToken, hasValidToken } from './authStore';
import { getDeviceIdHashForApi } from './deviceIdHash';

export type ApiResponse<T = unknown> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; data: null; error?: string };

function buildDefaultHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'X-Request-Start-Time': (Date.now() / 1000).toString(),
    'X-App-Platform': 'react-native',
    'X-App-Version': '0.0.1',
  };
}

function buildHeaders(extra: Record<string, string>, deviceIdHash: string | null): Record<string, string> {
  const headers = { ...buildDefaultHeaders(), ...extra };
  if (deviceIdHash) headers['X-Device-Id-Hash'] = deviceIdHash;
  if (isApiUrl(API_CONFIG.baseUrl) && hasValidToken()) {
    const token = getAuthToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function parseResponse<T>(res: Response): Promise<ApiResponse<T>> {
  const status = res.status;
  let data: T | null = null;
  let error: string | undefined;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text) as T;
    } catch {
      error = text.slice(0, 200);
    }
  }
  if (res.ok) {
    return { ok: true, status, data: (data ?? {}) as T };
  }
  return {
    ok: false,
    status,
    data: null,
    error: (data as { message?: string; error?: string })?.message ?? (data as { message?: string })?.error ?? error,
  };
}

export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: string | object;
  headers?: Record<string, string>;
  timeout?: number;
};

/**
 * Make a JSON API request. Auth header is added automatically when token is set.
 */
export async function apiCall<T = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { method = 'GET', body, headers: extraHeaders = {}, timeout } = options;
  const url = path.startsWith('http') ? path : `${API_CONFIG.baseUrl}${path.replace(/^\//, '')}`;
  const deviceIdHash = await getDeviceIdHashForApi();
  const headers = buildHeaders(extraHeaders, deviceIdHash);
  const bodyStr =
    body === undefined || body === null
      ? undefined
      : typeof body === 'string'
        ? body
        : JSON.stringify(body);
  if (bodyStr && method !== 'GET') {
    headers['Content-Type'] = 'application/json';
  }

  const controller = new AbortController();
  const timeoutMs = timeout ?? (method === 'GET' ? API_CONFIG.requestTimeoutReadMs : API_CONFIG.requestTimeoutWriteMs);
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: method === 'GET' ? undefined : bodyStr,
      signal: controller.signal,
    });
    clearTimeout(id);
    return parseResponse<T>(res);
  } catch (e) {
    clearTimeout(id);
    const err = e instanceof Error ? e : new Error(String(e));
    return {
      ok: false,
      status: 0,
      data: null,
      error: err.message,
    };
  }
}

/** Callback to refresh auth token (e.g. get new Firebase ID token). Set by app. */
export let onRefreshToken: (() => Promise<string | null>) | null = null;

export function setOnRefreshToken(fn: () => Promise<string | null>): void {
  onRefreshToken = fn;
}

/**
 * Same as apiCall but retries once with a new token on 401 if onRefreshToken is set.
 */
export async function apiCallWithAuthRefresh<T = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const first = await apiCall<T>(path, options);
  if (first.ok || first.status !== 401 || !onRefreshToken) return first;
  const newToken = await onRefreshToken();
  if (!newToken) return first;
  const retry = await apiCall<T>(path, { ...options, headers: { ...options.headers } });
  return retry;
}
