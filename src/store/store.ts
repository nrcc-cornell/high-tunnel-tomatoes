import { writable, derived, readable } from 'svelte/store';
import type { Writable } from 'svelte/store';
import asyncDerived from './asyncDerived';
import { getSoilCharacteristics } from './soilCharacteristics';
import { getWaterData } from './waterData';
import { handleRunWDM, SOIL_DATA } from './waterDeficitModel';

const today = new Date().toISOString().slice(0,10);

export const activeLocation = writable(null);
export const locations = writable(null);
export const isLoadingLocation = writable(false);

export const waterData = asyncDerived(activeLocation, (loc) => getWaterData(loc, today), null);

export let userOptions = writable(null);
export const soilCharacteristics = asyncDerived(activeLocation, async ($activeLocation) => {
  const newSC = await getSoilCharacteristics($activeLocation);
  userOptions.set(newSC ? {
    waterCapacity: newSC.waterCapacity,
    organicMatter: newSC.organicMatter,
    fertilizations: []
  } : null);
  return newSC;
}, null);

export const devOptions = writable(JSON.parse(JSON.stringify(SOIL_DATA)));

export const wdmOutput = derived([devOptions, userOptions, waterData], ([$devOptions, $userOptions, $waterData]) => handleRunWDM($devOptions, $userOptions, $waterData), null);





// import default values
// store as orig object in a readable
// store copy as user defined object
// use the user one as the values and changable in the options component














// Spinner colors:
// #FF3E00 - red
// #40B3FF - blue
// #676778 - gray