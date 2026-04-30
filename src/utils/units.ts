import type { UnitSystem } from '../types';

export const kgToLbs = (kg: number): number => Math.round(kg * 2.20462 * 10) / 10;
export const lbsToKg = (lbs: number): number => lbs / 2.20462;

export const displayWeight = (kg: number, units: UnitSystem): number =>
  units === 'imperial' ? kgToLbs(kg) : Math.round(kg * 100) / 100;

export const inputToKg = (val: number, units: UnitSystem): number =>
  units === 'imperial' ? lbsToKg(val) : val;

export const weightUnit = (units: UnitSystem): string =>
  units === 'imperial' ? 'lbs' : 'kg';
