// ------------------------------------------ //
// All derived from Brian's csf-waterdef code //
// ------------------------------------------ //

import balanceNitrogen from "./nitrogenModel";

export enum SoilMoistureOptionLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

type SoilCharacteristics = {
  wiltingpoint: number,
  prewiltingpoint: number,
  stressthreshold: number,
  fieldcapacity: number,
  saturation: number
}

// soildata:
// soil moisture and drainage characteristics for different levels of soil water capacity
// const timesSixInch = 2;
const timesSixInch = 3;
const rounder = 100;
const multiplier = timesSixInch * rounder;
export const SOIL_DATA = {
  soilmoistureoptions: {
    low: {
      wiltingpoint: Math.round(0.4 * multiplier) / rounder,
      prewiltingpoint: Math.round(0.64 * multiplier) / rounder,
      stressthreshold: Math.round(0.8 * multiplier) / rounder,
      fieldcapacity: Math.round(1.2 * multiplier) / rounder,
      saturation: Math.round(2.6 * multiplier) / rounder
    },
    medium: {
      wiltingpoint: Math.round(0.6 * multiplier) / rounder,
      prewiltingpoint: Math.round(0.945 * multiplier) / rounder,
      stressthreshold: Math.round(1.175 * multiplier) / rounder,
      fieldcapacity: Math.round(1.75 * multiplier) / rounder,
      saturation: Math.round(2.9 * multiplier) / rounder
    },
    high: {
      wiltingpoint: Math.round(0.85 * multiplier) / rounder,
      prewiltingpoint: Math.round(1.30 * multiplier) / rounder,
      stressthreshold: Math.round(1.6 * multiplier) / rounder,
      fieldcapacity: Math.round(2.35 * multiplier) / rounder,
      saturation: Math.round(3.25 * multiplier) / rounder
    },
    kc: {
      Lini: {
        name: 'Initial Growth Stage Length',
        value: 30,
        description: 'length (days) of initial growth stage'
      },
      Ldev: {
        name: 'Development Growth Stage Length',
        value: 40,
        description: 'length (days) of development growth stage'
      },
      Lmid: {
        name: 'Mature Growth Stage Length',
        value: 80,
        description: 'length (days) of middle (mature) growth stage'
      },
      Llate: {
        name: 'Late Growth Stage Length',
        value: 30,
        description: 'length (days) of late growth stage'
      },
      Kcini: {
        name: 'Initial Growth Stage Crop Coefficient',
        value: 0.60,
        description: 'crop coefficient for initial growth stage'
      },
      Kcmid: {
        name: 'Mature Growth Stage Crop Coefficient',
        value: 1.15,
        description: 'crop coefficient for middle (mature) growth stage'
      },
      Kcend: {
        name: 'End of Season Crop Coefficient',
        value: 0.80,
        description: 'crop coefficient at end of growing season'
      }
    },
    p: 0.5,
    petAdj: 0.55
  },
  soildrainageoptions: {
    low: { daysToDrainToFcFromSat: 0.125 },
    medium: { daysToDrainToFcFromSat: 1.0 },
    high: { daysToDrainToFcFromSat: 2.0 },
  }
};

function getCropCoeff(numdays, devSD) {
  // -----------------------------------------------------------------------------------------
  // Calculate crop coefficient for a specific growth stage of plant.
  // - Coefficients for initial, middle and end growth stages are assigned directly.
  // - Coefficients for development and late growth stages are determined by linear interpolation between coefficients for surrounding stages.
  // Refer to FAO-56 single crop coefficient reference, along with other sources for values specific for the Northeast US.
  //
  // numdays : days since planting, used to estimate the growth stage.
  // Lini  : length (days) of initial growth stage
  // Ldev  : length (days) of development growth stage
  // Lmid  : length (days) of middle (mature) growth stage
  // Llate : length (days) of late growth stage
  // Kcini : crop coefficient for initial growth stage
  // Kcmid : crop coefficient for middle (mature) growth stage
  // Kcend : crop coefficient at end of growing season
  // Kc    : crop coefficient for this specific growth stage - we use Kc to adjust grass reference ET
  // -----------------------------------------------------------------------------------------
  const {
    Lini,
    Ldev,
    Lmid,
    Llate,
    Kcini,
    Kcmid,
    Kcend
  } = devSD.soilmoistureoptions.kc;
  let Kc = null;

  if (numdays <= Lini.value) {
      // before planting or in initial growth stage
      Kc = Kcini.value
  } else if ((numdays > Lini.value) && (numdays < (Lini.value+Ldev.value))) {
      // in development growth stage
      // linearly interpolate between Kcini and Kcmid to find Kc within development stage
      Kc = Kcini.value + (numdays-Lini.value)*(Kcmid.value-Kcini.value)/Ldev.value
  } else if ((numdays >= (Lini.value+Ldev.value)) && (numdays <= (Lini.value+Ldev.value+Lmid.value))) {
      // in middle (mature) growth stage
      Kc = Kcmid.value
  } else if ((numdays > (Lini.value+Ldev.value+Lmid.value)) && (numdays < (Lini.value+Ldev.value+Lmid.value+Llate.value))) {
      // in late growth stage
      // linearly interpolate between Kcmid and Kcend to find Kc within late growth stage
      Kc = Kcmid.value - (numdays-(Lini.value+Ldev.value+Lmid.value))*(Kcmid.value-Kcend.value)/Llate.value
  } else {
      // at end of growing season
      Kc = Kcend.value
  }

  return Kc
}

function getPotentialDailyDrainage(soilCharacteristics: SoilCharacteristics, drainagecap: number): number {
  // -----------------------------------------------------------------------------------------
  // Calculate potential daily drainage of soil
  // -----------------------------------------------------------------------------------------
  return (
    (soilCharacteristics.saturation -
      soilCharacteristics.fieldcapacity) /
    drainagecap
  );
}

function getTawForPlant(soilCharacteristics: SoilCharacteristics): number {
  // -----------------------------------------------------------------------------------------
  // Calculate total available water (TAW) for plant, defined here as:
  // soil moisture at field capacity minus soil moisture at wilting point
  // -----------------------------------------------------------------------------------------
  return soilCharacteristics.fieldcapacity - soilCharacteristics.wiltingpoint;
}

function getWaterStressCoeff(Dr: number, TAW: number, p: number): number {
  // -----------------------------------------------------------------------------------------
  // Calculate coefficient for adjusting ET when accounting for decreased ET during water stress conditions.
  // Refer to FAO-56 eq 84, pg 169
  // Dr  : the antecedent water deficit (in)
  // TAW : total available (in) water for the plant (soil moisture at field capacity minus soil moisture at wilting point).
  // p   : at what fraction between field capacity and wilting point do we start applying this water stress factor.
  // Ks  : water stress coefficient
  // -----------------------------------------------------------------------------------------
  let Ks: number | null = null;
  Dr = -1 * Dr;
  Ks = Dr <= p * TAW ? 1 : (TAW - Dr) / ((1 - p) * TAW);
  Ks = Math.max(Ks, 0);
  return Ks;
}

function runNutrientModel(
  precip: number[],
  pet: number[],
  soilcap: SoilMoistureOptionLevel,
  plantingDate: Date,
  terminationDate: Date,
  initialOrganicMatter: number,
  applications: { [key:string]: {
    date: string,
    id: number,
    inorganicN: number,
    fastN: number,
    mediumN: number,
    slowN: number,
    waterAmount: number
  }},
  testResults: { [key:string]: {
    date: string,
    id: number,
    organicMatter: number,
    inorganicN: number
  }},
  dates: string[],
  devSD
) {
  // -----------------------------------------------------------------------------------------
  // Calculate daily volumetric water content (inches H2O / inch soil) from daily precipitation, evapotranspiration, soil drainage and runoff.
  //
  // Soil water amount is:
  //    - bounded below by the wilting point
  //    - bounded above by saturation
  //
  //  precip          : daily precipitation array (in) : (NRCC ACIS grid 3)
  //  pet             : daily potential evapotranspiration array (in) : (grass reference PET obtained from NRCC MORECS model output)
  //  soilcap         : soil water capacity ('high','medium','low')
  //  plantingDate    : date crop was planted
  //  irrigationIdxs  : array of indices where the user irrigated
  //
  // -----------------------------------------------------------------------------------------
  const soil_options = devSD.soilmoistureoptions;
  
  // Calculate number of days since planting, negative value means current days in loop below is before planting
  let daysSincePlanting =  Math.floor(( Date.parse(plantingDate.getFullYear() + '-03-01') - plantingDate.getTime() ) / 86400000 + 1);
  let daysSinceTermination =  Math.floor(( Date.parse(terminationDate.getFullYear() + '-03-01') - terminationDate.getTime() ) / 86400000 + 1);

  // Initialize running tally of the amount of water in the soil
  let deficit = 0;
  const fc = soil_options[soilcap].fieldcapacity;

  // Initialize variables for storing nitrogen values between days
  let tin = 0;
  let som = initialOrganicMatter;
  let fastN = 0;
  let mediumN = 0;
  let slowN = 0;

  // Initialize output arrays
  const vwcDaily = [(deficit + fc) / 18];
  const dd = [deficit];
  const tinDaily = [0];
  const fastDaily = [0];
  const mediumDaily = [0];
  const slowDaily = [0];

  // Calculate daily drainage rate that occurs when soil water content is between saturation and field capacity
  const dailyPotentialDrainageRate = getPotentialDailyDrainage(soil_options[soilcap], devSD.soildrainageoptions[soilcap].daysToDrainToFcFromSat);

  // Loop through all days, starting with the second day (we already have the values for the initial day from model initialization)
  for (let idx = 1; idx < pet.length; idx++) {
    const date = dates[idx];
    daysSincePlanting += 1;
    daysSinceTermination += 1;
    const hasPlants = daysSincePlanting >=0 && daysSinceTermination < 0;

    // Calculate Ks, the water stress coefficient, using antecedent deficit
    const TAW = getTawForPlant(soil_options[soilcap]);
    const Ks = getWaterStressCoeff(deficit, TAW, soil_options.p);
    // Calculate Kc, the crop coefficient, account for if plants exist and what stage they are at
    const Kc = getCropCoeff(hasPlants ? daysSincePlanting : -1, devSD);

    
    // Adjust water movement to account for calculated and provided variables
    const totalDailyPET = -1 * pet[idx] * devSD.soilmoistureoptions.petAdj * Kc * Ks;
    

    // const totalDailyPrecip = precip[idx] + (irrigationIdxs.includes(idx) ? 0.50 : 0);
    let totalDailyPrecip = 0;
    const todaysApplications = Object.values(applications).filter(obj => obj.date === date);
    if (todaysApplications.length) {
      todaysApplications.forEach(obj => {
        totalDailyPrecip += obj.waterAmount;
        fastN += obj.fastN;
        mediumN += obj.mediumN;
        slowN += obj.slowN;
        tin += obj.inorganicN;
      });
    }

    // Convert daily rates to hourly rates. For this simple model, rates are constant throughout the day.
    // For precip   : this assumption is about all we can do without hourly observations
    // For PET      : this assumption isn't great. Something following diurnal cycle would be best.
    // For drainage : this assumption is okay
    // ALL HOURLY RATES POSITIVE
    const hourlyPrecip = totalDailyPrecip / 24;
    const hourlyPET = (-1 * totalDailyPET) / 24;
    const hourlyPotentialDrainage = dailyPotentialDrainageRate / 24;
    
    // Initialize daily drainage total for nitrogen calculations
    let drainageTotal = 0;

    for (let hr = 1; hr <= 24; hr++) {
      // Calculate hourly drainage estimate. It is bounded by the potential drainage rate and available
      // water in excess of the field capacity. We assume drainage does not occur below field capacity.
      let hourlyDrainage;
      if (deficit > 0) {
        hourlyDrainage = Math.min(deficit, hourlyPotentialDrainage);
      } else {
        hourlyDrainage = 0;
      }
      drainageTotal += hourlyDrainage;

      // Adjust soil water based on hourly water budget.
      // soil water is bound by saturation (soil can't be super-saturated). This effectively reduces soil water by hourly runoff as well.
      deficit = Math.min(
        deficit + hourlyPrecip - hourlyPET - hourlyDrainage,
        soil_options[soilcap].saturation - fc
      );

      // soil water is bound by wilting point, but calculations should never reach wilting point based on this model. We bound it below for completeness.
      // In the real world, soil water is able to reach wilting point. The user should note that soil water values NEAR the wilting point
      // from this model should be interpreted as 'danger of wilting exists'.
      deficit = Math.max(
        deficit,
        soil_options[soilcap].wiltingpoint - fc
      );
    }

    // Do something with drainageTotal and calculate tinDaily value
    const todaysTests = Object.values(testResults).filter(obj => obj.date === date);
    if (todaysTests.length) {
      const lastTest = todaysTests[todaysTests.length - 1];
      som = lastTest.organicMatter;
      tin = lastTest.inorganicN;
    }

    console.log('--------------------------------------');
    console.log(date);

    const vwc = (deficit + fc) / 18;
    const mp = 0;   //// matric potential that Josef needs to give for high, medium, low
    ({tin, som, fastN, mediumN, slowN} = balanceNitrogen(
      vwc,
      fc / 18,
      mp,
      drainageTotal,
      hasPlants,
      -1 * totalDailyPET,
      tin,
      som,
      fastN,
      mediumN,
      slowN
    ));

    dd.push(deficit);
    vwcDaily.push(Math.round(vwc * 1000) / 1000);
    tinDaily.push(Math.round((tin / 2) * 1000) / 1000);
    fastDaily.push(Math.round((fastN / 2) * 1000) / 1000);
    mediumDaily.push(Math.round((mediumN / 2) * 1000) / 1000);
    slowDaily.push(Math.round((slowN / 2) * 1000) / 1000);
  }

  return {
    vwc: vwcDaily,
    tin: tinDaily,
    fastN: fastDaily,
    mediumN: mediumDaily,
    slowN: slowDaily,
    // dd
  };
}

export const handleRunNutrientModel = (devOptions, userOptions, waterData) => {
  const { waterCapacity, plantingDate, terminationDate, applications, testResults, initialOrganicMatter } = userOptions;
  const { dates, pet, precip } = waterData;
  return {
    ...runNutrientModel(
      precip,
      pet,
      waterCapacity,
      plantingDate ? new Date(plantingDate + 'T00:00') : new Date(),
      terminationDate ? new Date(terminationDate + 'T00:00') : new Date(),
      initialOrganicMatter,
      applications,
      testResults,
      dates,
      devOptions
    ),
    dates
  };
}