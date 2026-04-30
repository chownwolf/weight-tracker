import type { WeightEntry, Profile } from '../types';
import { differenceInDays } from 'date-fns';

/**
 * Calculate BMI given height and weight
 * BMI = weight (kg) / (height (m))^2
 */
export const calculateBMI = (heightCm: number, weightKg: number): number => {
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 100) / 100;
};

/**
 * Get weight loss statistics from entries
 */
export const getWeightLossStats = (
  profile: Profile,
  entries: WeightEntry[]
) => {
  if (entries.length === 0) {
    return {
      currentWeight: profile.startWeight,
      currentBMI: calculateBMI(profile.heightCm, profile.startWeight),
      totalWeightLoss: 0,
      weeklyAverageRate: 0,
      daysActive: 0,
      entryCount: 0,
    };
  }

  // Sort entries by date
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const currentWeight = sortedEntries[sortedEntries.length - 1].weight;
  const currentBMI = calculateBMI(profile.heightCm, currentWeight);
  const totalWeightLoss = profile.startWeight - currentWeight;

  const daysActive = differenceInDays(
    new Date(sortedEntries[sortedEntries.length - 1].date),
    new Date(profile.startDate)
  );

  // Calculate weekly average rate (kg per week)
  const weeksActive = Math.max(daysActive / 7, 1); // Avoid division by zero
  const weeklyAverageRate = Math.round((totalWeightLoss / weeksActive) * 100) / 100;

  return {
    currentWeight,
    currentBMI,
    totalWeightLoss: Math.round(totalWeightLoss * 100) / 100,
    weeklyAverageRate,
    daysActive,
    entryCount: entries.length,
  };
};

/**
 * Project weight at a given target date based on current loss rate
 */
export const projectWeightAtDate = (
  currentWeight: number,
  weeklyLossRate: number,
  targetDate: string,
  today: Date = new Date()
): number => {
  const daysUntilTarget = differenceInDays(new Date(targetDate), today);
  const weeksUntilTarget = daysUntilTarget / 7;
  const projectedWeight = currentWeight - weeklyLossRate * weeksUntilTarget;
  return Math.round(projectedWeight * 100) / 100;
};

/**
 * Calculate days to reach goal weight at current rate
 */
export const daysToGoal = (
  currentWeight: number,
  goalWeight: number,
  weeklyLossRate: number
): number | null => {
  if (weeklyLossRate <= 0) return null; // Cannot reach goal at this rate
  if (goalWeight >= currentWeight) return null; // Already at or above goal

  const weightToLose = currentWeight - goalWeight;
  const weeksNeeded = weightToLose / weeklyLossRate;
  return Math.round(weeksNeeded * 7);
};

/**
 * Calculate projected date to reach goal
 */
export const projectedGoalDate = (
  currentWeight: number,
  goalWeight: number,
  weeklyLossRate: number,
  today: Date = new Date()
): string | null => {
  const days = daysToGoal(currentWeight, goalWeight, weeklyLossRate);
  if (days === null) return null;

  const projectedDate = new Date(today);
  projectedDate.setDate(projectedDate.getDate() + days);
  return projectedDate.toISOString();
};

/**
 * Get weight entries for a specific date range
 */
export const getEntriesByDateRange = (
  entries: WeightEntry[],
  startDate: Date,
  endDate: Date
): WeightEntry[] => {
  return entries.filter((entry) => {
    const entryDate = new Date(entry.date);
    return entryDate >= startDate && entryDate <= endDate;
  });
};

/**
 * Calculate weekly average weight loss for the last N weeks
 */
export const getWeeklyAverages = (
  entries: WeightEntry[],
  weeks: number = 12
): { week: string; averageWeight: number; weight: number }[] => {
  if (entries.length === 0) return [];

  const sortedEntries = [...entries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const today = new Date();
  const result = [];

  for (let i = weeks - 1; i >= 0; i--) {
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() - i * 7);

    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 7);

    const weekEntries = getEntriesByDateRange(sortedEntries, weekStart, weekEnd);

    if (weekEntries.length > 0) {
      const avgWeight =
        weekEntries.reduce((sum, e) => sum + e.weight, 0) / weekEntries.length;
      result.push({
        week: weekEnd.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        averageWeight: Math.round(avgWeight * 100) / 100,
        weight: weekEntries[weekEntries.length - 1].weight,
      });
    }
  }

  return result;
};
