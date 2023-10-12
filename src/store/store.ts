import { writable, derived, get } from 'svelte/store';
import asyncDerived from '../lib/asyncDerived';
import { getSoilCharacteristics } from '../lib/soilCharacteristics';
import { getWaterData } from '../lib/waterData';
import { handleRunNutrientModel, SOIL_DATA } from '../lib/devNutrientModel';
import { constructWaterChartDetails, constructNitrogenChartDetails } from '../lib/chartParts';
import { loadActiveLocationId, loadLocations, loadOptions } from '../lib/handleStorage';
import type { LocationObj } from '../global';

// Clamp date between 3/1 and 10/31
let todayDate = new Date();
if (todayDate.getMonth() > 9) {
  todayDate = new Date(todayDate.getFullYear(), 9, 31);
} else if (todayDate.getMonth() < 2) {
  todayDate = new Date(todayDate.getFullYear() - 1, 9, 31);
}
export const endDate = todayDate.toISOString().slice(0,10);

// Handle showing loading screen
export const isLoadingLocation = writable(false);
export const isLoadingData = writable({
  waterData: false,
  soilCharacteristics: false,
  nutrientModel: false
});

// Toggles the loading values, object is used to smooth loading (flashes in and out if single value toggling several times)
function changeLoading(key, setTo) {
  isLoadingData.set({
    ...get(isLoadingData),
    [key]: setTo
  });
}

export const locations = writable<null | { [key: string]: LocationObj }>(loadLocations());
export const activeLocationId = writable(loadActiveLocationId());
export const activeLocation = derived([locations, activeLocationId], ([$locations, $activeLocationId]) => {
  if ($locations && $activeLocationId && Object.keys($locations).includes($activeLocationId)) {
    isLoadingData.set({
      ...get(isLoadingData),
      waterData: true,
      soilCharacteristics: true,
      nutrientModel: true
    });
    return $locations[$activeLocationId];
  } else {
    return null;
  }
}, null);

// Fetches precip and PET data for location
export const waterData = asyncDerived(activeLocation, async ($activeLocation) => {
  let results = null;
  if ($activeLocation) {
    results = await getWaterData($activeLocation, endDate);
    changeLoading('waterData', false);
    changeLoading('nutrientModel', results === null ? false : true);
  }
  return results;
}, null);

// Fetches soil properties used in nutrient model
export const soilCharacteristics = asyncDerived(activeLocation, async ($activeLocation) => {
  let newSC = null;
  if ($activeLocation) {
    newSC = await getSoilCharacteristics($activeLocation);

    let newUO = null;
    const loaded = loadOptions();
    if (loaded && Object.keys(loaded).includes($activeLocation.id)) {
      newUO = loaded[$activeLocation.id];
    } else if (newSC) {
      newUO = {
        waterCapacity: newSC.waterCapacity,
        initialOrganicMatter: newSC.organicMatter,
        plantingDate: null,
        terminationDate: null,
        applications: {},
        testResults: {}
        // applications: {
        //   123456: {
        //     id: 123456,
        //     date: '2023-03-01',
        //     waterAmount: 0,
        //     fastN: 60,
        //     mediumN: 60,
        //     slowN: 60,
        //     inorganicN: 0
        //   },
        //   123457: {
        //     id: 123457,
        //     date: '2023-05-06',
        //     waterAmount: 0.4,
        //     fastN: 10,
        //     mediumN: 0,
        //     slowN: 60,
        //     inorganicN: 0
        //   },
        //   123458: {
        //     id: 123458,
        //     date: '2023-05-12',
        //     waterAmount: 0,
        //     fastN: 0,
        //     mediumN: 30,
        //     slowN: 0,
        //     inorganicN: 60
        //   }
        // },
        // testResults: {
        //   4321: {
        //     id: 4321,
        //     date: '2023-05-01',
        //     organicMatter: 6,
        //     inorganicN: 50
        //   },
        //   5432: {
        //     id: 5432,
        //     date: '2023-06-01',
        //     organicMatter: 8,
        //     inorganicN: 100
        //   },
        //   6543: {
        //     id: 6543,
        //     date: '2023-10-10',
        //     organicMatter: 3,
        //     inorganicN: 20
        //   }
        // }
      };
    }
    userOptions.set(newUO);
  }
  changeLoading('soilCharacteristics', false);
  return newSC;
}, null);

export const devOptions = writable(JSON.parse(JSON.stringify(SOIL_DATA)));
export let userOptions = writable(null);

// Run the nutrient model when options or precip/PET data change
export const nutrientData = derived([devOptions, userOptions, waterData], ([$devOptions, $userOptions, $waterData]) => {
  let results = null;
  if ($devOptions && $userOptions && $waterData) {
    const nmRes = handleRunNutrientModel($devOptions, $userOptions, $waterData);

    const {
      prewiltingpoint,
      stressthreshold,
      fieldcapacity,
      saturation
    } = $devOptions.soilmoistureoptions[$userOptions.waterCapacity];
  
    const vwcThresholds = [
      prewiltingpoint,
      stressthreshold,
      fieldcapacity,
      saturation
    ].map(t => Math.round(t / 18 * 1000) / 1000);

    const plantingDateIdx = $waterData.dates.findIndex(d => d === $userOptions.plantingDate);
    const terminationDateIdx = $waterData.dates.findIndex(d => d === $userOptions.terminationDate);
    const vwcChartDetails = constructWaterChartDetails(vwcThresholds, nmRes.vwc, $userOptions.applications, $waterData.dates, plantingDateIdx, terminationDateIdx);
    const tinChartDetails = constructNitrogenChartDetails(nmRes.tin, $userOptions.testResults, $waterData.dates, plantingDateIdx, terminationDateIdx);

    results = { ...nmRes, ...vwcChartDetails, ...tinChartDetails };
  }
  if ($devOptions && $userOptions && $waterData !== null) {
    changeLoading('nutrientModel', false);
  }
  return results;
}, null);

export const hoverIdxPos = writable(null);
export const hoverXPos = writable(null);
export const isZoomed = writable(true);

export const tooltipData = derived([hoverIdxPos], ([$hoverIdxPos]) => {
  if ($hoverIdxPos === null) return null;

  const { applications, testResults } = get(userOptions);
  const { dates, vwc, tin, fastN, mediumN, slowN } = get(nutrientData);

  const date = dates[$hoverIdxPos];
  const vwcValue = vwc[$hoverIdxPos];
  const tinPpmValue = tin[$hoverIdxPos];
  const fastNPpmValue = fastN[$hoverIdxPos];
  const mediumNPpmValue = mediumN[$hoverIdxPos];
  const slowNPpmValue = slowN[$hoverIdxPos];
  const application = Object.values(applications).find((obj: {date: string}) => obj.date === date);
  const testResult = Object.values(testResults).find((obj: {date: string}) => obj.date === date);

  return {
    date,
    vwc: vwcValue,
    tin: { ppm: tinPpmValue, lbsPerAcre: tinPpmValue * 2 },
    fastN: { ppm: fastNPpmValue, lbsPerAcre: fastNPpmValue * 2 },
    mediumN: { ppm: mediumNPpmValue, lbsPerAcre: mediumNPpmValue * 2 },
    slowN: { ppm: slowNPpmValue, lbsPerAcre: slowNPpmValue * 2 },
    application: application || null,
    testResult: testResult || null
  };
}, null);


// Spinner colors:
// #FF3E00 - red
// #40B3FF - blue
// #676778 - gray