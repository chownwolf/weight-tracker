import type { Profile, WeightEntry, AppState, NonScaleVictory } from '../types';

const STORAGE_KEY = 'weight-tracker-app-state';

/**
 * Load app state from localStorage
 */
export const loadAppState = (): AppState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { profile: null, entries: [], victories: [] };
    }
    const parsed = JSON.parse(stored);
    return { victories: [], ...parsed };
  } catch (error) {
    console.error('Error loading app state:', error);
    return { profile: null, entries: [], victories: [] };
  }
};

/**
 * Save app state to localStorage
 */
export const saveAppState = (state: AppState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Error saving app state:', error);
  }
};

/**
 * Save profile to localStorage
 */
export const saveProfile = (profile: Profile): void => {
  const state = loadAppState();
  state.profile = profile;
  saveAppState(state);
};

/**
 * Load profile from localStorage
 */
export const loadProfile = (): Profile | null => {
  const state = loadAppState();
  return state.profile;
};

/**
 * Add a weight entry
 */
export const addWeightEntry = (entry: WeightEntry): void => {
  const state = loadAppState();
  state.entries.push(entry);
  saveAppState(state);
};

/**
 * Get all weight entries
 */
export const getWeightEntries = (): WeightEntry[] => {
  const state = loadAppState();
  return state.entries;
};

/**
 * Update a weight entry
 */
export const updateWeightEntry = (id: string, updates: Partial<WeightEntry>): void => {
  const state = loadAppState();
  const index = state.entries.findIndex((e) => e.id === id);
  if (index !== -1) {
    state.entries[index] = { ...state.entries[index], ...updates };
    saveAppState(state);
  }
};

/**
 * Delete a weight entry
 */
export const deleteWeightEntry = (id: string): void => {
  const state = loadAppState();
  state.entries = state.entries.filter((e) => e.id !== id);
  saveAppState(state);
};

/**
 * Clear all data (reset app)
 */
export const clearAllData = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

export const addNonScaleVictory = (victory: NonScaleVictory): void => {
  const state = loadAppState();
  state.victories.push(victory);
  saveAppState(state);
};

export const deleteNonScaleVictory = (id: string): void => {
  const state = loadAppState();
  state.victories = state.victories.filter((v) => v.id !== id);
  saveAppState(state);
};

/**
 * Export data as JSON string
 */
export const exportData = (): string => {
  const state = loadAppState();
  return JSON.stringify(state, null, 2);
};

/**
 * Export data as CSV
 */
export const exportDataAsCSV = (): string => {
  const state = loadAppState();

  if (!state.profile || state.entries.length === 0) {
    return 'No data to export';
  }

  let csv = 'Weight Tracker Data Export\n\n';
  csv += 'Profile\n';
  csv += `Name,${state.profile.name}\n`;
  csv += `Height (cm),${state.profile.heightCm}\n`;
  csv += `Age,${state.profile.age}\n`;
  csv += `Start Weight (kg),${state.profile.startWeight}\n`;
  csv += `Start Date,${state.profile.startDate}\n`;
  if (state.profile.goalWeight) {
    csv += `Goal Weight (kg),${state.profile.goalWeight}\n`;
  }
  if (state.profile.goalDate) {
    csv += `Goal Date,${state.profile.goalDate}\n`;
  }

  csv += '\n\nWeight Entries\n';
  csv += 'Date,Weight (kg),Notes\n';
  state.entries
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .forEach((entry) => {
      csv += `${entry.date},${entry.weight},"${entry.notes || ''}"\n`;
    });

  return csv;
};
