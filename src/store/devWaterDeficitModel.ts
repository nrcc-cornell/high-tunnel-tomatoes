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

function getSingleCropCoeff(numdays, devSD) {
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

// Derived from Brian's csf-waterdef code
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

function runWaterDeficitModel(
  precip: number[],
  pet: number[],
  soilcap: SoilMoistureOptionLevel,
  plantingDate: Date,
  irrigationIdxs: number[],
  initDeficit: number,
  devSD
) {
  // -----------------------------------------------------------------------------------------
  // Calculate daily water deficit (inches) from daily precipitation, evapotranspiration, soil drainage and runoff.
  //
  // The water deficit is calculated relative to field capacity (i.e. the amount of water available to the plant).
  // Therefore, the water deficit is:
  //    - zero when soil moisture is at field capacity
  //    - a negative value when soil moisture is between field capacity and the wilting point
  //    - a positive value when soil moisture is between field capacity and saturation
  //    - bounded below by the wilting point ( = soil moisture at wilting point minus soil moisture at field capacity )
  //    - bounded above by saturation ( = soil moisture at saturation minus soil moisture at field capacity)
  //
  //  precip         : daily precipitation array (in) : (NRCC ACIS grid 3)
  //  pet            : daily potential evapotranspiration array (in) : (grass reference PET obtained from NRCC MORECS model output)
  //  soilcap        : soil water capacity ('high','medium','low')
  //  plantingDate : date crop was planted
  //  irrigationIdxs : array of indices where the user irrigated
  //  initDeficit    : water deficit used to initialize the model
  //
  // -----------------------------------------------------------------------------------------

  const soil_options = devSD.soilmoistureoptions;
  
  // Total water available to plant
  let TAW: number | null = null;
  // water stress coefficient
  let Ks: number | null = null;
  let Kc: number | null = null;
  let daysSincePlanting =  Math.floor(( Date.parse(plantingDate.getFullYear() + '-03-01') - plantingDate.getTime() ) / 86400000);

  // values of model components for a single day
  let totalDailyPrecip: number | null = null;
  let totalDailyPET: number | null = null;
  let dailyPotentialDrainageRate: number | null = null;

  // hourly rates of model components
  let hourlyPrecip: number | null = null;
  let hourlyPET: number | null = null;
  let hourlyDrainage: number | null = null;
  let hourlyPotentialDrainage: number | null = null;

  // OUTPUT VARS
  // arrays holding daily values of model components
  // deficitDaily is water deficit calculation we are looking for.
  // Other variables are just for potential water balance verification, etc, if the user chooses.
  const deficitDaily: number[] = [];
  const vwcDaily: number[] = [];

  // a running tally of the deficit
  // Initialize deficit
  //   : to zero if saturated soil after irrigation)
  //   : to last observed deficit if running for forecasts
  let deficit = initDeficit;

  // the first elements in our output arrays. It include the water deficit initialization. Others will populate starting Day 2.
  deficitDaily.push(deficit);
  vwcDaily.push((soil_options[soilcap].fieldcapacity + deficit) / 18);

  // Calculate daily drainage rate that occurs when soil water content is between saturation and field capacity
  dailyPotentialDrainageRate = getPotentialDailyDrainage(soil_options[soilcap], devSD.soildrainageoptions[soilcap].daysToDrainToFcFromSat);

  // Loop through all days, starting with the second day (we already have the deficit for the initial day from model initialization)
  for (let idx = 1; idx < pet.length; idx++) {
    // Calculate Ks, the water stress coefficient, using antecedent deficit
    TAW = getTawForPlant(soil_options[soilcap]);
    Ks = getWaterStressCoeff(deficitDaily[idx - 1], TAW, soil_options.p);
    Kc = getSingleCropCoeff(daysSincePlanting, devSD);

    // We already know what the daily total is for Precip and ET
    totalDailyPET = -1 * pet[idx] * devSD.soilmoistureoptions.petAdj * Kc * Ks;
    totalDailyPrecip = precip[idx] + (irrigationIdxs.includes(idx) ? 0.50 : 0);

    // Convert daily rates to hourly rates. For this simple model, rates are constant throughout the day.
    // For precip   : this assumption is about all we can do without hourly observations
    // For PET      : this assumption isn't great. Something following diurnal cycle would be best.
    // For drainage : this assumption is okay
    // ALL HOURLY RATES POSITIVE
    hourlyPrecip = totalDailyPrecip / 24;
    hourlyPET = (-1 * totalDailyPET) / 24;
    hourlyPotentialDrainage = dailyPotentialDrainageRate / 24;

    for (let hr = 1; hr <= 24; hr++) {
      // Calculate hourly drainage estimate. It is bounded by the potential drainage rate and available
      // water in excess of the field capacity. We assume drainage does not occur below field capacity.
      if (deficit > 0) {
        hourlyDrainage = Math.min(deficit, hourlyPotentialDrainage);
      } else {
        hourlyDrainage = 0;
      }

      // Adjust deficit based on hourly water budget.
      // deficit is bound by saturation (soil can't be super-saturated). This effectively reduces deficit by hourly runoff as well.
      deficit = Math.min(
        deficit + hourlyPrecip - hourlyPET - hourlyDrainage,
        soil_options[soilcap].saturation -
          soil_options[soilcap].fieldcapacity
      );

      // deficit is bound by wilting point, but calculations should never reach wilting point based on this model. We bound it below for completeness.
      // In the real world, deficit is able to reach wilting point. The user should note that deficit values NEAR the wilting point
      // from this model should be interpreted as 'danger of wilting exists'.
      deficit = Math.max(
        deficit,
        -1 *
          (soil_options[soilcap].fieldcapacity -
            soil_options[soilcap].wiltingpoint)
      );
    }

    deficitDaily.push(deficit);
    vwcDaily.push((soil_options[soilcap].fieldcapacity + deficit) / 18);
  }

  return {
    vwc: vwcDaily.map(v => Math.round(v * 100) / 100),
    deficitsInches: deficitDaily.map(v => Math.round(v * 100) / 100)
  };
}

export const handleRunWDM = (devOptions, userOptions, waterData) => {
  const { waterCapacity } = userOptions;
  const { dates, pet, precip } = waterData;
  return {
    ...runWaterDeficitModel(
      precip,
      pet,
      waterCapacity,
      new Date(2023, 5, 1),
      [],
      0,
      devOptions
    ),
    dates
  };
}