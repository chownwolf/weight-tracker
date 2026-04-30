export type UnitSystem = 'metric' | 'imperial';

export interface Profile {
  name: string;
  heightCm: number; // Height in centimeters
  age: number;
  startWeight: number; // Starting weight in kg
  startDate: string; // ISO date string
  units: UnitSystem;
  goalWeight?: number; // Optional target weight in kg
  goalDate?: string; // Optional target date (ISO string)
}

export interface WeightEntry {
  id: string; // UUID for unique identification
  date: string; // ISO date string
  weight: number; // Weight in kg
  notes?: string; // Optional notes
}

export interface NonScaleVictory {
  id: string;
  date: string;
  text: string;
}

export interface AppState {
  profile: Profile | null;
  entries: WeightEntry[];
  victories: NonScaleVictory[];
}

export interface WeightStats {
  currentWeight: number;
  currentBMI: number;
  totalWeightLoss: number;
  weeklyAverageRate: number;
  daysActive: number;
  entryCount: number;
}

export interface GoalProjection {
  projectedDate: string | null; // ISO date string, null if goal unreachable at current rate
  daysToGoal: number | null;
  projectedWeight: number;
}
