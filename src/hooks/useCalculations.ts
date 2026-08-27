import { useMemo } from 'react';
import type { Profile, WeightEntry, WeightStats, GoalProjection, Milestone } from '../types';
import {
  getWeightLossStats,
  daysToGoal,
  projectedGoalDate,
} from '../utils/calculations';

export interface MilestoneProjection {
  milestone: Milestone;
  achieved: boolean;
  daysToGoal: number | null;
  projectedDate: string | null;
}

const calcStreak = (entries: WeightEntry[]): number => {
  if (entries.length === 0) return 0;

  const dates = new Set(entries.map((e) => e.date));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  // Streak is active if today or yesterday has an entry
  const todayStr = fmt(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = fmt(yesterday);

  let cursor = new Date(today);
  if (!dates.has(todayStr)) {
    if (!dates.has(yesterdayStr)) return 0;
    cursor = yesterday;
  }

  let streak = 0;
  while (dates.has(fmt(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};

export const useCalculations = (profile: Profile | null, entries: WeightEntry[]) => {
  const stats = useMemo<WeightStats | null>(() => {
    if (!profile) return null;
    return getWeightLossStats(profile, entries);
  }, [profile, entries]);

  const goalProjection = useMemo<GoalProjection | null>(() => {
    if (!profile || !profile.goalWeight || !stats) return null;

    const daysRemaining = daysToGoal(stats.currentWeight, profile.goalWeight, stats.weeklyAverageRate);
    const projectedDate = projectedGoalDate(
      stats.currentWeight,
      profile.goalWeight,
      stats.weeklyAverageRate
    );

    return {
      projectedDate,
      daysToGoal: daysRemaining,
      projectedWeight: stats.currentWeight,
    };
  }, [profile, stats]);

  const milestoneProjections = useMemo<MilestoneProjection[]>(() => {
    if (!profile || !stats) return [];
    const milestones = [...(profile.milestones ?? [])].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    return milestones.map((m) => {
      const achieved = stats.currentWeight <= m.weight;
      return {
        milestone: m,
        achieved,
        daysToGoal: achieved ? null : daysToGoal(stats.currentWeight, m.weight, stats.weeklyAverageRate),
        projectedDate: achieved ? null : projectedGoalDate(stats.currentWeight, m.weight, stats.weeklyAverageRate),
      };
    });
  }, [profile, stats]);

  const streak = useMemo(() => calcStreak(entries), [entries]);

  return { stats, goalProjection, milestoneProjections, streak };
};
