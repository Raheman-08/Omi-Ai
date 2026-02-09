/**
 * Tasks API – task list and create.
 */
import { apiCallWithAuthRefresh } from './client';

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  due_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export async function getTasks(): Promise<Task[]> {
  const res = await apiCallWithAuthRefresh<Task[] | Task>('v1/tasks', { method: 'GET' });
  if (!res.ok || !res.data) return [];
  const data = res.data;
  const list = Array.isArray(data) ? data : [data];
  return list.filter((t) => t && (t as Task).id);
}

export interface CreateTaskParams {
  title: string;
  completed?: boolean;
  due_at?: string | null;
}

export async function createTask(params: CreateTaskParams): Promise<Task | null> {
  const res = await apiCallWithAuthRefresh<Task>('v1/tasks', {
    method: 'POST',
    body: JSON.stringify({
      title: params.title.trim(),
      completed: params.completed ?? false,
      ...(params.due_at != null && { due_at: params.due_at }),
    }),
  });
  if (!res.ok || !res.data) return null;
  return res.data as Task;
}
