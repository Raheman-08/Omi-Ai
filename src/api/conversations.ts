/**
 * Conversations API – mirrors backend/http/api/conversations.dart
 */
import { apiCallWithAuthRefresh } from './client';
import type {
  ServerConversation,
  CreateConversationResponse,
  ActionItemsResponse,
} from './types';

export interface GetConversationsParams {
  limit?: number;
  offset?: number;
  statuses?: string[];
  includeDiscarded?: boolean;
  startDate?: string;
  endDate?: string;
  folderId?: string;
  starred?: boolean;
}

export async function getConversations(params: GetConversationsParams = {}): Promise<ServerConversation[]> {
  const {
    limit = 50,
    offset = 0,
    statuses = [],
    includeDiscarded = true,
    startDate,
    endDate,
    folderId,
    starred,
  } = params;
  const statusQuery = statuses.length ? `&statuses=${statuses.join(',')}` : '';
  const start = startDate ? `&start_date=${startDate}` : '';
  const end = endDate ? `&end_date=${endDate}` : '';
  const folder = folderId != null ? `&folder_id=${folderId}` : '';
  const star = starred != null ? `&starred=${starred}` : '';
  const path = `v1/conversations?include_discarded=${includeDiscarded}&limit=${limit}&offset=${offset}${statusQuery}${start}${end}${folder}${star}`;
  const res = await apiCallWithAuthRefresh<ServerConversation[] | { conversations?: ServerConversation[]; data?: ServerConversation[] }>(path, { method: 'GET' });
  const raw = res.data;
  const list: ServerConversation[] = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { conversations?: ServerConversation[] })?.conversations)
      ? (raw as { conversations: ServerConversation[] }).conversations
      : Array.isArray((raw as { data?: ServerConversation[] })?.data)
        ? (raw as { data: ServerConversation[] }).data
        : [];
  if (!res.ok) return [];
  return list;
}

export async function getConversationById(conversationId: string): Promise<ServerConversation | null> {
  const res = await apiCallWithAuthRefresh<ServerConversation>(`v1/conversations/${conversationId}`, {
    method: 'GET',
  });
  return res.ok ? res.data : null;
}

export async function createConversation(): Promise<CreateConversationResponse | null> {
  const res = await apiCallWithAuthRefresh<CreateConversationResponse>('v1/conversations', {
    method: 'POST',
    body: {},
  });
  return res.ok ? res.data : null;
}

export async function deleteConversation(conversationId: string): Promise<boolean> {
  const res = await apiCallWithAuthRefresh(`v1/conversations/${conversationId}`, {
    method: 'DELETE',
  });
  return res.status === 204;
}

export async function updateConversationTitle(
  conversationId: string,
  title: string
): Promise<boolean> {
  const encoded = encodeURIComponent(title);
  const res = await apiCallWithAuthRefresh(
    `v1/conversations/${conversationId}/title?title=${encoded}`,
    { method: 'PATCH' }
  );
  return res.ok && res.status === 200;
}

export async function searchConversations(params: {
  query: string;
  page?: number;
  per_page?: number;
  include_discarded?: boolean;
}): Promise<{ items: ServerConversation[]; current_page: number; total_pages: number }> {
  const res = await apiCallWithAuthRefresh<{
    items: ServerConversation[];
    current_page: number;
    total_pages: number;
  }>('v1/conversations/search', {
    method: 'POST',
    body: {
      query: params.query,
      page: params.page ?? 1,
      per_page: params.per_page ?? 10,
      include_discarded: params.include_discarded ?? true,
    },
  });
  if (!res.ok || !res.data)
    return { items: [], current_page: 0, total_pages: 0 };
  return res.data;
}

export async function getActionItems(params: {
  limit?: number;
  offset?: number;
  includeCompleted?: boolean;
  startDate?: string;
  endDate?: string;
}): Promise<ActionItemsResponse> {
  const {
    limit = 50,
    offset = 0,
    includeCompleted = true,
    startDate,
    endDate,
  } = params;
  let path = `v1/action-items?limit=${limit}&offset=${offset}&include_completed=${includeCompleted}`;
  if (startDate) path += `&start_date=${startDate}`;
  if (endDate) path += `&end_date=${endDate}`;
  const res = await apiCallWithAuthRefresh<ActionItemsResponse>(path, { method: 'GET' });
  if (!res.ok || !res.data)
    return { action_items: [], has_more: false };
  return res.data;
}
