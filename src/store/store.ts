import { writable } from 'svelte/store';
import asyncDerived from './asyncDerived';
import { getSoilCharacteristics } from './soilCharacteristics';
import { getWaterData } from './waterData';

const today = new Date().toISOString().slice(0,10);

export const activeLocation = writable(null);
export const locations = writable(null);
export const isLoadingLocation = writable(false);

export const soilCharacteristics = asyncDerived(activeLocation, getSoilCharacteristics, null);
export const waterData = asyncDerived(activeLocation, (loc) => getWaterData(loc, today), null);

// Spinner colors:
// #FF3E00 - red
// #40B3FF - blue
// #676778 - gray