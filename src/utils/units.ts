import type { UnitSystem } from '../types';

export const kgToLbs = (kg: number): number => Math.round(kg * 2.20462 * 10) / 10;
export const lbsToKg = (lbs: number): number => lbs / 2.20462;

export const displayWeight = (kg: number, units: UnitSystem): number =>
  units === 'imperial' ? kgToLbs(kg) : Math.round(kg * 100) / 100;

export const inputToKg = (val: number, units: UnitSystem): number =>
  units === 'imperial' ? lbsToKg(val) : val;

export const weightUnit = (units: UnitSystem): string =>
  units === 'imperial' ? 'lbs' : 'kg';

export const cmToIn = (cm: number): number => Math.round((cm / 2.54) * 10) / 10;
export const inToCm = (inches: number): number => inches * 2.54;

export const displayLength = (cm: number, units: UnitSystem): number =>
  units === 'imperial' ? cmToIn(cm) : Math.round(cm * 100) / 100;

export const inputToCm = (val: number, units: UnitSystem): number =>
  units === 'imperial' ? inToCm(val) : val;

export const lengthUnit = (units: UnitSystem): string =>
  units === 'imperial' ? 'in' : 'cm';
