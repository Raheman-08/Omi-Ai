/**
 * Messages API – mirrors backend/http/api/messages.dart
 */
import { API_CONFIG } from './config';
import { getAuthToken } from './authStore';
import { apiCallWithAuthRefresh } from './client';
import type { ServerMessage, MessageFile } from './types';

export async function getMessages(appId?: string | null): Promise<ServerMessage[]> {
  const q = appId && appId !== 'no_selected' ? `?app_id=${appId}&dropdown_selected=false` : '?dropdown_selected=false';
  const res = await apiCallWithAuthRefresh<ServerMessage[]>(`v2/messages${q}`, { method: 'GET' });
  if (!res.ok || !Array.isArray(res.data)) return [];
  return res.data;
}

export async function clearChat(appId?: string | null): Promise<ServerMessage[]> {
  const path = appId && appId !== 'no_selected' ? `v2/messages?app_id=${appId}` : 'v2/messages';
  const res = await apiCallWithAuthRefresh<ServerMessage | ServerMessage[]>(path, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete chat');
  const data = res.data;
  return Array.isArray(data) ? data : data ? [data] : [];
}

export async function getInitialAppMessage(appId?: string | null): Promise<ServerMessage> {
  const path = appId ? `v2/initial-message?app_id=${appId}` : 'v2/initial-message';
  const res = await apiCallWithAuthRefresh<ServerMessage>(path, { method: 'POST' });
  if (!res.ok || !res.data) throw new Error('Failed to get initial message');
  return res.data;
}

export interface SendMessageParams {
  text: string;
  appId?: string | null;
  fileIds?: string[];
}

/**
 * Send a chat message. Returns the final message when stream completes.
 * For streaming, use a separate streaming client (e.g. EventSource/fetch stream) – not implemented here.
 */
export async function sendMessage(params: SendMessageParams): Promise<ServerMessage | null> {
  const { text, appId, fileIds } = params;
  const path = appId && appId !== 'no_selected' && appId !== 'null' ? `v2/messages?app_id=${appId}` : 'v2/messages';
  const res = await apiCallWithAuthRefresh<ServerMessage>(path, {
    method: 'POST',
    body: { text, file_ids: fileIds ?? [] },
  });
  return res.ok ? res.data ?? null : null;
}

export async function uploadFiles(
  files: { uri: string; name: string; type: string }[],
  appId?: string | null
): Promise<MessageFile[]> {
  const path = appId && appId !== 'no_selected' && appId !== 'null' ? `v2/files?app_id=${appId}` : 'v2/files';
  const formData = new FormData();
  files.forEach((f) => {
    formData.append('files', { uri: f.uri, name: f.name, type: f.type } as unknown as Blob);
  });
  const headers: Record<string, string> = { 'X-Request-Start-Time': (Date.now() / 1000).toString() };
  const token = getAuthToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const url = `${API_CONFIG.baseUrl}${path}`;
  const res = await fetch(url, { method: 'POST', headers, body: formData });
  if (!res.ok) throw new Error(`Failed to upload file: ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : (data?.files ?? data) ?? [];
}

export async function reportMessage(messageId: string): Promise<void> {
  const res = await apiCallWithAuthRefresh(`v2/messages/${messageId}/report`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to report message');
}
