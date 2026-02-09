/**
 * Folders API – mirrors backend/http/api/folders.dart
 */
import { apiCallWithAuthRefresh } from './client';

export interface Folder {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  order?: number;
  is_default?: boolean;
  is_system?: boolean;
  conversation_count?: number;
}

export async function getFolders(): Promise<Folder[]> {
  const res = await apiCallWithAuthRefresh<Folder[]>('v1/folders', { method: 'GET' });
  if (!res.ok || !Array.isArray(res.data)) return [];
  return res.data;
}

export interface CreateFolderParams {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

export async function createFolder(params: CreateFolderParams): Promise<Folder | null> {
  const res = await apiCallWithAuthRefresh<Folder>('v1/folders', {
    method: 'POST',
    body: JSON.stringify({
      name: params.name.trim(),
      ...(params.description?.trim() && { description: params.description.trim() }),
      ...(params.color && { color: params.color }),
      ...(params.icon && { icon: params.icon }),
    }),
  });
  if (!res.ok || !res.data) return null;
  return res.data as Folder;
}
