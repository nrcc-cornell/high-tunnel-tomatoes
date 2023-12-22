import { writable, derived, get } from 'svelte/store';
import asyncDerived from '../lib/asyncDerived';
import { getSoilCharacteristics } from '../lib/soilCharacteristics';
import { getWeatherData } from '../lib/weatherData';
import { handleRunNutrientModel, SOIL_DATA, calcSoilConstants } from '../lib/devNutrientModel';
import { constructWaterChartDetails, constructNitrogenChartDetails } from '../lib/chartParts';
import { loadActiveLocationId, loadLocations, loadOptions } from '../lib/handleStorage';
import type { LocationObj } from '../global';

let todayDate = new Date();
export const endDate = todayDate.toISOString().slice(0,10);
export const isDevelopment = window.location.href !== 'PUT PRODUCTION URL HERE';

// Handle showing loading screen
export const isLoadingLocation = writable(false);
export const isLoadingData = writable({
  weatherData: false,
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
export const activeLocation = derived(activeLocationId, ($activeLocationId) => {
  const locs = get(locations);
  if (locs && $activeLocationId && Object.keys(locs).includes($activeLocationId)) {
    isLoadingData.set({
      ...get(isLoadingData),
      weatherData: true,
      soilCharacteristics: true,
      nutrientModel: true
    });
    return locs[$activeLocationId];
  } else {
    return null;
  }
}, null);

// Fetches precip and PET data for location
export const weatherData = asyncDerived(activeLocation, async ($activeLocation) => {
  let results = null;
  if ($activeLocation) {
    results = await getWeatherData($activeLocation, endDate);
    changeLoading('weatherData', false);
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

      // Converts old f/m/s structure of org N to new org N array
      const appDates = Object.keys(newUO.applications);
      if (appDates.length && typeof newUO.applications[appDates[0]].fastN === 'number') {
        appDates.forEach(d => {
          const { fastN, mediumN, slowN } = newUO.applications[d];
          newUO.applications[d].fastN = [['Other Fast Nitrogen', fastN]];
          newUO.applications[d].mediumN = [['Other Medium Nitrogen', mediumN]];
          newUO.applications[d].slowN = [['Other Slow Nitrogen', slowN]];
        });
      }

      if (!Object.keys(newUO).includes('rootDepth')) {
        newUO.rootDepth = 18;
      }
    } else if (newSC) {
      newUO = {
        rootDepth: 18,
        waterCapacity: newSC.waterCapacity,
        initialOrganicMatter: newSC.organicMatter,
        plantingDate: null,
        terminationDate: null,
        applications: {},
        testResults: {}
      };
    }
    if (get(userOptions) === null && newUO === null) {
      changeLoading('nutrientModel', false);
    }

    const devO = get(devOptions);
    devOptions.set({ ...devO, soilmoistureoptions: { ...devO.soilmoistureoptions, ...calcSoilConstants(newUO.rootDepth) } });
    userOptions.set(newUO);
  }
  changeLoading('soilCharacteristics', false);
  return newSC;
}, null);

export const devOptions = writable(JSON.parse(JSON.stringify(SOIL_DATA())));
export let userOptions = writable(null);

// Run the nutrient model when options or precip/PET data change
export const nutrientData = derived([devOptions, userOptions, weatherData], ([$devOptions, $userOptions, $weatherData]) => {
  let results = null;
  if ($devOptions && $userOptions && $weatherData) {
    const nmRes = handleRunNutrientModel($devOptions, $userOptions, $weatherData);

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

    const plantingDateIdx = $weatherData.dates.findIndex(d => d === $userOptions.plantingDate);
    const terminationDateIdx = $weatherData.dates.findIndex(d => d === $userOptions.terminationDate);
    const vwcChartDetails = constructWaterChartDetails(vwcThresholds, nmRes.vwc, $userOptions.applications, $weatherData.dates, plantingDateIdx, terminationDateIdx);
    const tinChartDetails = constructNitrogenChartDetails(nmRes.tin, $userOptions.testResults, $weatherData.dates, plantingDateIdx, terminationDateIdx);
    results = { ...nmRes, ...vwcChartDetails, ...tinChartDetails };
  }
  if ($devOptions && $userOptions && $weatherData !== null) {
    changeLoading('nutrientModel', false);
  }
  return results;
}, null);

export const hoverIdxPos = writable(null);
export const hoverXPos = writable(null);
export const isZoomed = writable(true);

type ApplicationEvent = {
  date: null,
  waterAmount: number
  fastN: number[]
  mediumN: number[]
  slowN: number[]
  inorganicN: number
  id: string
};

export const tooltipData = derived([hoverIdxPos], ([$hoverIdxPos]) => {
  if ($hoverIdxPos === null) return null;

  const { applications, testResults } = get(userOptions);
  const { dates, vwc, tin, fastN, mediumN, slowN, leached } = get(nutrientData);

  const date = dates[$hoverIdxPos];
  const vwcValue = vwc[$hoverIdxPos];
  const tinPpmValue = tin[$hoverIdxPos];
  const fastNPpmValue = fastN[$hoverIdxPos];
  const mediumNPpmValue = mediumN[$hoverIdxPos];
  const slowNPpmValue = slowN[$hoverIdxPos];
  const leachedNLbsValue = leached[$hoverIdxPos];
  const applicationList = Object.values(applications).filter((obj: ApplicationEvent) => obj.date === date) as ApplicationEvent[];
  const testResult = Object.values(testResults).filter((obj: {date: string}) => obj.date === date);

  let application = null;
  if (applicationList.length) {
    application = applicationList.reduce((acc, app) => {
      if (!acc.date) acc.date = app.date;
      acc.inorganicN += app.inorganicN;
      acc.waterAmount += app.waterAmount;
      acc.fastN = acc.fastN.concat(app.fastN);
      acc.mediumN = acc.mediumN.concat(app.mediumN);
      acc.slowN = acc.slowN.concat(app.slowN);
      return acc;
    }, {
      date: '',
      inorganicN: 0,
      fastN: [],
      mediumN: [],
      slowN: [],
      waterAmount: 0
    });
  }

  return {
    date,
    vwc: vwcValue,
    tin: { ppm: tinPpmValue, lbsPerAcre: tinPpmValue * 2 },
    fastN: { ppm: fastNPpmValue, lbsPerAcre: fastNPpmValue * 2 },
    mediumN: { ppm: mediumNPpmValue, lbsPerAcre: mediumNPpmValue * 2 },
    slowN: { ppm: slowNPpmValue, lbsPerAcre: slowNPpmValue * 2 },
    leached: { ppm: leachedNLbsValue / 2, lbsPerAcre: leachedNLbsValue },
    application,
    testResult: testResult.length ? testResult[testResult.length - 1] : null
  };
}, null);