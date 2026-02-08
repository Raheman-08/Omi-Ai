/**
 * Apps API – mirrors backend/http/api/apps.dart
 */
import { apiCallWithAuthRefresh } from './client';
import type { ServerApp, AppsSearchResponse } from './types/app';

const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/BasedHardware/Omi/main';

export function appImageUrl(app: ServerApp): string {
  const img = app.image;
  if (!img) return '';
  if (img.startsWith('http')) return img;
  return `${GITHUB_RAW_BASE}${img.startsWith('/') ? '' : '/'}${img}`;
}

/** GET v1/apps/popular – list of popular apps */
export async function getPopularApps(): Promise<ServerApp[]> {
  const res = await apiCallWithAuthRefresh<ServerApp[] | ServerApp>('v1/apps/popular', { method: 'GET' });
  if (!res.ok) return [];
  const data = res.data;
  const list = Array.isArray(data) ? data : data ? [data] : [];
  return list.filter((a) => !a.deleted);
}

/** GET v2/apps/search – search/filter apps with pagination */
export async function getAppsSearch(params: {
  q?: string;
  category?: string;
  offset?: number;
  limit?: number;
}): Promise<AppsSearchResponse> {
  const { q, category, offset = 0, limit = 50 } = params;
  const parts: string[] = [`offset=${offset}`, `limit=${limit}`];
  if (q?.trim()) parts.push(`q=${encodeURIComponent(q.trim())}`);
  if (category?.trim()) parts.push(`category=${encodeURIComponent(category.trim())}`);
  const path = `v2/apps/search?${parts.join('&')}`;
  const res = await apiCallWithAuthRefresh<AppsSearchResponse>(path, { method: 'GET' });
  if (!res.ok || !res.data)
    return { data: [], pagination: { total: 0, count: 0, offset, limit } };
  const data = res.data.data;
  const list = Array.isArray(data) ? data.filter((a: ServerApp) => !a.deleted) : [];
  return {
    data: list,
    pagination: res.data.pagination ?? { total: 0, count: 0, offset, limit },
    filters: res.data.filters,
  };
}

/** GET v1/apps/:appId – full app details */
export async function getAppDetails(appId: string): Promise<ServerApp | null> {
  const res = await apiCallWithAuthRefresh<ServerApp>(`v1/apps/${encodeURIComponent(appId)}`, { method: 'GET' });
  if (!res.ok || !res.data) return null;
  const app = res.data;
  return app.deleted ? null : app;
}

/** POST v1/apps/enable?app_id= – install/enable app for the user */
export async function enableApp(appId: string): Promise<boolean> {
  const res = await apiCallWithAuthRefresh<unknown>(
    `v1/apps/enable?app_id=${encodeURIComponent(appId)}`,
    { method: 'POST' }
  );
  return res.ok && res.status === 200;
}

/** POST v1/apps/disable?app_id= – uninstall/disable app for the user */
export async function disableApp(appId: string): Promise<boolean> {
  const res = await apiCallWithAuthRefresh<unknown>(
    `v1/apps/disable?app_id=${encodeURIComponent(appId)}`,
    { method: 'POST' }
  );
  return res.ok && res.status === 200;
}
