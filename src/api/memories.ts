/**
 * Memories API – list, create, filter, bulk privacy, delete, knowledge graph.
 */
import { apiCallWithAuthRefresh } from './client';

export type MemoryCategory = 'about_you' | 'insights' | 'manual';
export type MemoryVisibility = 'public' | 'private';

export interface Memory {
  id: string;
  content: string;
  category?: MemoryCategory;
  visibility: MemoryVisibility;
  created_at?: string;
  updated_at?: string;
}

export interface MemoryStats {
  total: number;
  public: number;
  private: number;
}

export interface GetMemoriesParams {
  q?: string;
  categories?: MemoryCategory[];
  visibility?: MemoryVisibility;
  limit?: number;
  offset?: number;
}

export async function getMemories(params: GetMemoriesParams = {}): Promise<Memory[]> {
  const searchParams = new URLSearchParams();
  if (params.q?.trim()) searchParams.set('q', params.q.trim());
  if (params.categories?.length) searchParams.set('categories', params.categories.join(','));
  if (params.visibility) searchParams.set('visibility', params.visibility);
  if (params.limit != null) searchParams.set('limit', String(params.limit));
  if (params.offset != null) searchParams.set('offset', String(params.offset));
  const query = searchParams.toString();
  const path = query ? `v1/memories?${query}` : 'v1/memories';
  const res = await apiCallWithAuthRefresh<Memory[] | { memories?: Memory[] }>(path, { method: 'GET' });
  if (!res.ok || !res.data) return [];
  const raw = res.data;
  if (Array.isArray(raw)) return raw;
  return (raw as { memories?: Memory[] }).memories ?? [];
}

export async function getMemoryStats(): Promise<MemoryStats> {
  const res = await apiCallWithAuthRefresh<MemoryStats | { stats?: MemoryStats }>('v1/memories/stats', {
    method: 'GET',
  });
  if (!res.ok || !res.data) return { total: 0, public: 0, private: 0 };
  const raw = res.data;
  if (raw && typeof (raw as MemoryStats).total === 'number') return raw as MemoryStats;
  return (raw as { stats?: MemoryStats }).stats ?? { total: 0, public: 0, private: 0 };
}

export interface CreateMemoryParams {
  content: string;
  category?: MemoryCategory;
  visibility?: MemoryVisibility;
}

export async function createMemory(params: CreateMemoryParams): Promise<Memory | null> {
  const res = await apiCallWithAuthRefresh<Memory>('v1/memories', {
    method: 'POST',
    body: JSON.stringify({
      content: (params.content ?? '').trim(),
      ...(params.category && { category: params.category }),
      ...(params.visibility && { visibility: params.visibility }),
    }),
  });
  if (!res.ok || !res.data) return null;
  return res.data as Memory;
}

export async function makeAllMemoriesPrivate(): Promise<boolean> {
  const res = await apiCallWithAuthRefresh<unknown>('v1/memories/visibility', {
    method: 'PATCH',
    body: JSON.stringify({ visibility: 'private' }),
  });
  return res.ok;
}

export async function makeAllMemoriesPublic(): Promise<boolean> {
  const res = await apiCallWithAuthRefresh<unknown>('v1/memories/visibility', {
    method: 'PATCH',
    body: JSON.stringify({ visibility: 'public' }),
  });
  return res.ok;
}

export async function deleteAllMemories(): Promise<boolean> {
  const res = await apiCallWithAuthRefresh<unknown>('v1/memories', { method: 'DELETE' });
  return res.ok;
}

export async function buildKnowledgeGraph(): Promise<boolean> {
  const res = await apiCallWithAuthRefresh<unknown>('v1/memories/graph/build', { method: 'POST' });
  return res.ok;
}
