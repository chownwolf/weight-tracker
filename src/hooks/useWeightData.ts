import { useState, useEffect, useCallback } from 'react';
import type { Profile, WeightEntry, AppState } from '../types';
import {
  loadAppState,
  saveProfile as storageUpdateProfile,
  addWeightEntry as storageAddEntry,
  updateWeightEntry as storageUpdateEntry,
  deleteWeightEntry as storageDeleteEntry,
  addNonScaleVictory as storageAddVictory,
  deleteNonScaleVictory as storageDeleteVictory,
} from '../utils/storage';

/**
 * Custom hook for managing weight data and profile
 */
export const useWeightData = () => {
  const [state, setState] = useState<AppState>({ profile: null, entries: [], victories: [] });
  const [isLoading, setIsLoading] = useState(true);

  // Load initial state from localStorage
  useEffect(() => {
    const appState = loadAppState();
    setState(appState);
    setIsLoading(false);
  }, []);

  const saveProfile = useCallback((profile: Profile) => {
    setState((prev) => ({ ...prev, profile }));
    storageUpdateProfile(profile);
  }, []);

  const addWeightEntry = useCallback((weight: number, date: string, notes?: string) => {
    const entry: WeightEntry = {
      id: generateId(),
      date,
      weight,
      notes,
    };
    setState((prev) => ({
      ...prev,
      entries: [...prev.entries, entry],
    }));
    storageAddEntry(entry);
  }, []);

  const updateWeightEntry = useCallback(
    (id: string, weight: number, date: string, notes?: string) => {
      setState((prev) => ({
        ...prev,
        entries: prev.entries.map((e) =>
          e.id === id ? { ...e, weight, date, notes } : e
        ),
      }));
      storageUpdateEntry(id, { weight, date, notes });
    },
    []
  );

  const deleteWeightEntry = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      entries: prev.entries.filter((e) => e.id !== id),
    }));
    storageDeleteEntry(id);
  }, []);

  const addVictory = useCallback((text: string, date: string) => {
    const victory = { id: generateId(), date, text };
    setState((prev) => ({ ...prev, victories: [...prev.victories, victory] }));
    storageAddVictory(victory);
  }, []);

  const deleteVictory = useCallback((id: string) => {
    setState((prev) => ({ ...prev, victories: prev.victories.filter((v) => v.id !== id) }));
    storageDeleteVictory(id);
  }, []);

  return {
    profile: state.profile,
    entries: state.entries,
    victories: state.victories,
    isLoading,
    saveProfile,
    addWeightEntry,
    updateWeightEntry,
    deleteWeightEntry,
    addVictory,
    deleteVictory,
  };
};

/**
 * Generate a simple ID (UUID-like)
 * Note: For production, use npm package 'uuid'
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
