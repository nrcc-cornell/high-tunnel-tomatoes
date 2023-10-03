import { writable, derived } from 'svelte/store';
import asyncDerived from './asyncDerived';
import { getSoilCharacteristics } from './soilCharacteristics';
import { getWaterData } from './waterData';
import { handleRunWDM, SOIL_DATA } from './devWaterDeficitModel';
import { constructAnnotations, calcPointColors } from './chartParts';

const today = new Date().toISOString().slice(0,10);

export const activeLocation = writable(null);
export const locations = writable(null);
export const isLoadingLocation = writable(false);

export const waterData = asyncDerived(activeLocation, (loc) => getWaterData(loc, today), null);

export const devOptions = writable(JSON.parse(JSON.stringify(SOIL_DATA)));
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

export const wdmOutput = derived([devOptions, userOptions, waterData], ([$devOptions, $userOptions, $waterData]) => {
  if ($devOptions && $userOptions && $waterData) {
    const wdmRes = handleRunWDM($devOptions, $userOptions, $waterData);
    const finalValue = wdmRes.deficitsInches.slice(-1)[0];

    const {
      prewiltingpoint,
      stressthreshold,
      fieldcapacity,
      saturation
    } = $devOptions.soilmoistureoptions[$userOptions.waterCapacity];
  
    const thresholds = [
      prewiltingpoint - fieldcapacity,
      stressthreshold - fieldcapacity,
      fieldcapacity - fieldcapacity,
      saturation - fieldcapacity
    ];

    const annotations = constructAnnotations(thresholds, finalValue);
    const deficitsInchesPntColors = calcPointColors(wdmRes.deficitsInches, thresholds);
    return { ...wdmRes, deficitsInchesPntColors, annotations };
  }
  return null;
}, null);


// Spinner colors:
// #FF3E00 - red
// #40B3FF - blue
// #676778 - gray