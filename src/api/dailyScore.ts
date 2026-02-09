/**
 * Daily score breakdown – today’s score, tasks completed, completion rate.
 * Uses v1/daily-score/breakdown when available, otherwise derived from goals.
 */
import { apiCallWithAuthRefresh } from './client';
import { getAllGoals } from './goals';

export interface DailyScoreBreakdown {
  todayScore: number;
  tasksCompleted: number;
  tasksTotal: number;
  completionRate: number | null;
}

async function fromGoals(): Promise<DailyScoreBreakdown> {
  const goals = await getAllGoals();
  const active = goals.filter((g) => g.is_active && g.target_value > 0);
  const tasksTotal = active.length;
  let tasksCompleted = 0;
  let sumProgress = 0;
  for (const g of active) {
    if (g.current_value >= g.target_value) tasksCompleted += 1;
    sumProgress += (g.current_value / g.target_value) * 100;
  }
  const todayScore = tasksTotal > 0 ? Math.round(sumProgress / tasksTotal) : 0;
  const completionRate = tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 100) : null;
  return {
    todayScore,
    tasksCompleted,
    tasksTotal,
    completionRate,
  };
}

export async function getDailyScoreBreakdown(): Promise<DailyScoreBreakdown> {
  const res = await apiCallWithAuthRefresh<{
    today_score?: number;
    tasks_completed?: number;
    tasks_total?: number;
    completion_rate?: number | null;
  }>('v1/daily-score/breakdown', { method: 'GET' });
  if (res.ok && res.data) {
    const d = res.data;
    return {
      todayScore: d.today_score ?? 0,
      tasksCompleted: d.tasks_completed ?? 0,
      tasksTotal: d.tasks_total ?? 0,
      completionRate: d.completion_rate ?? null,
    };
  }
  return fromGoals();
}
