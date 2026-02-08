import { useState, useCallback, useEffect } from 'react';
import { getConversations, searchConversations } from '../api/conversations';
import { hasValidToken } from '../api/authStore';
import type { ServerConversation } from '../api/types';

export interface ConversationItem {
  id: string;
  type: 'Other' | 'Chat' | 'Notes';
  icon: string;
  title: string;
  description: string;
  timestamp: string;
}

function mapStatusToType(status: string): 'Other' | 'Chat' | 'Notes' {
  if (status === 'in_progress') return 'Chat';
  if (status === 'completed') return 'Notes';
  return 'Other';
}

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
  } catch {
    return '';
  }
}

function serverToItem(c: ServerConversation): ConversationItem {
  const structured = c.structured ?? { title: 'Untitled', overview: '' };
  return {
    id: c.id,
    type: mapStatusToType(c.status ?? 'completed'),
    icon: c.starred ? 'star' : 'brain',
    title: structured.title ?? 'Untitled',
    description: structured.overview ?? '',
    timestamp: formatTimestamp(c.created_at),
  };
}

export function useConversations(params: { limit?: number; offset?: number } = {}) {
  const [items, setItems] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    if (!hasValidToken()) {
      setItems([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await getConversations({ limit: params.limit ?? 50, offset: params.offset ?? 0 });
      setItems(list.map(serverToItem));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load conversations');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [params.limit, params.offset]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const search = useCallback(async (query: string): Promise<ConversationItem[]> => {
    if (!hasValidToken() || !query.trim()) return [];
    try {
      const { items: results } = await searchConversations({
        query: query.trim(),
        per_page: 20,
        include_discarded: true,
      });
      return results.map(serverToItem);
    } catch {
      return [];
    }
  }, []);

  return { items, loading, error, refresh: fetchConversations, search };
}
