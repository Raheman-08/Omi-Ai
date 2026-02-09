/**
 * Goals API – mirrors backend/http/api/goals.dart
 */
import { apiCallWithAuthRefresh } from './client';

export interface Goal {
  id: string;
  title: string;
  goal_type: string;
  target_value: number;
  current_value: number;
  min_value: number;
  max_value: number;
  unit?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export async function getAllGoals(): Promise<Goal[]> {
  const res = await apiCallWithAuthRefresh<Goal[] | Goal>('v1/goals/all', { method: 'GET' });
  if (!res.ok || !res.data) return [];
  const data = res.data;
  const list = Array.isArray(data) ? data : [data];
  return list.filter((g) => g && (g as Goal).id);
}

export async function getCurrentGoal(): Promise<Goal | null> {
  const res = await apiCallWithAuthRefresh<Goal>('v1/goals', { method: 'GET' });
  if (!res.ok || !res.data) return null;
  return res.data as Goal;
}

export interface CreateGoalParams {
  title: string;
  current_value?: number;
  target_value?: number;
  goal_type?: string;
  min_value?: number;
  max_value?: number;
}

export async function createGoal(params: CreateGoalParams): Promise<Goal | null> {
  const res = await apiCallWithAuthRefresh<Goal>('v1/goals', {
    method: 'POST',
    body: JSON.stringify({
      title: params.title.trim(),
      current_value: params.current_value ?? 0,
      target_value: params.target_value ?? 100,
      goal_type: params.goal_type ?? 'default',
      min_value: params.min_value ?? 0,
      max_value: params.max_value ?? (params.target_value ?? 100),
    }),
  });
  if (!res.ok || !res.data) return null;
  return res.data as Goal;
}
