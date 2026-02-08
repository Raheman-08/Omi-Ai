/**
 * Types mirroring backend/schema/conversation.dart for API responses.
 */

export type ConversationStatus = 'in_progress' | 'processing' | 'merging' | 'completed' | 'failed';

export interface Structured {
  id?: number;
  title: string;
  overview: string;
  emoji?: string;
  category?: string;
  action_items?: Array<{ description: string; completed?: boolean }>;
  events?: Array<{
    title: string;
    startsAt?: number;
    start?: string;
    duration: number;
    description?: string;
    created?: boolean;
  }>;
}

export interface ServerConversation {
  id: string;
  created_at: string;
  started_at?: string;
  finished_at?: string;
  structured: Structured;
  transcript_segments?: unknown[];
  apps_results?: unknown[];
  suggested_summarization_apps?: string[];
  geolocation?: unknown;
  photos?: unknown[];
  audio_files?: unknown[];
  discarded: boolean;
  deleted?: boolean;
  source?: string;
  language?: string;
  external_data?: { text: string };
  status: ConversationStatus;
  is_locked?: boolean;
  starred: boolean;
  folder_id?: string;
}

export interface CreateConversationResponse {
  messages: ServerMessage[];
  conversation?: ServerConversation;
  memory?: ServerConversation;
}

export interface ServerMessage {
  id: string;
  created_at: string;
  text: string;
  sender: 'ai' | 'human';
  type?: string;
  app_id?: string;
  from_integration?: boolean;
  files?: MessageFile[];
  file_ids?: string[];
  memories?: MessageConversation[];
  ask_for_nps?: boolean;
  rating?: number;
}

export interface MessageFile {
  id: string;
  openai_file_id: string;
  thumbnail?: string;
  name: string;
  mime_type: string;
  created_at: string;
  thumb_name?: string;
}

export interface MessageConversation {
  id: string;
  created_at: string;
  structured: { title: string; emoji: string };
}

export interface ActionItemsResponse {
  action_items: Array<{ description: string; completed: boolean; conversation_id?: string; [key: string]: unknown }>;
  has_more: boolean;
}
