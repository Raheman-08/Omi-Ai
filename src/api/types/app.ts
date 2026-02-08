/**
 * App types – mirror backend/schema/app.dart for API responses.
 */
export interface ServerApp {
  id: string;
  name: string;
  author?: string;
  description?: string;
  image?: string;
  category?: string;
  status?: string;
  rating_avg?: number;
  rating_count?: number;
  deleted?: boolean;
  is_popular?: boolean;
  enabled?: boolean;
  [key: string]: unknown;
}

export interface AppsSearchResponse {
  data: ServerApp[];
  pagination: { total?: number; count?: number; offset?: number; limit?: number };
  filters?: Record<string, unknown>;
}
