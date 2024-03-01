import { calcMineralizedLbs, adjustForExtraMineralization } from "./nitrogenHelpers";

function convertInToM(inches: number) {
  // inches / 39.37 = meters
  return inches / 39.37
}

function convertLbAcreToKgM2(lbPerAcre: number) {
  // lbs/acre * 0.0001121 = kg/m2
  return lbPerAcre * 0.0001121;
}

function convertKgM2ToLbAcre(kgPerM2: number) {
  // kg/m2 / 0.0001121 = lbs/acre
  return kgPerM2 / 0.0001121;
}

function convertOMPercentToLbAcre(percent: number) {
  // 1% OM = 2000lb/acre
  return percent * 2000;
}

function convertLbAcreToOMPercent(lbPerAcre: number) {
  // 2000lb/acre = 1% OM
  return lbPerAcre / 2000;
}

function calcTNV(tnKgs, vwc, rootDepthMeters) {
  return tnKgs / (rootDepthMeters * vwc);
}

function calcPlantUptake(tnV: number, petInches: number) {
  const petMeters = convertInToM(petInches);
  return tnV * petMeters;
}

function calcTransported(tnV: number, drainageInches: number) {
  const drainageMeters = convertInToM(drainageInches);
  return tnV * drainageMeters;
}

function countSources(vals: (number | [string, number][])[]) {
  const availableSources = vals.filter(val => {
    if (typeof val === 'number') {
      return val > 0;
    } else {
      return (val.find(arr => arr[1] > 0) || ['',0])[1];
    }
  });
  return availableSources.length;
}

export default function balanceNitrogen(
  vwc: number,
  gTheta: number,
  drainage: number,
  hasPlants: boolean,
  soilTempC: number,
  pet: number,
  tin: number,
  som: number,
  fastN: [string, number][],
  mediumN: [string, number][],
  slowN: [string, number][],
  date: string,
  somKN: number,
  mineralizationAdjustmentFactor: number,
  rootDepth: number
) {
  //  -------------------------------------------------------------
  //  Calculate soil inorganic nitrogen (lbs/acre) from daily volumetric water content, 
  //    nitrogen application dates and amounts, and an initial soil organic matter percentage
  //  -------------------------------------------------------------
  
  const lowTempShutOff = soilTempC < 5;

  let somLbs = convertOMPercentToLbAcre(som);
  const somMineralizedLbs = lowTempShutOff ? 0 : mineralizationAdjustmentFactor * gTheta * somKN * somLbs;
  const { amountMineralized: fastMineralizedLbs } = lowTempShutOff ? { amountMineralized: 0 } : calcMineralizedLbs(mineralizationAdjustmentFactor, gTheta, fastN);
  const { amountMineralized: mediumMineralizedLbs } = lowTempShutOff ? { amountMineralized: 0 } : calcMineralizedLbs(mineralizationAdjustmentFactor, gTheta, mediumN);
  const { amountMineralized: slowMineralizedLbs } = lowTempShutOff ? { amountMineralized: 0 } : calcMineralizedLbs(mineralizationAdjustmentFactor, gTheta, slowN);
  
  const tnLbs = tin + somMineralizedLbs + fastMineralizedLbs + mediumMineralizedLbs + slowMineralizedLbs;
  const tnKgs = convertLbAcreToKgM2(tnLbs);

  const rootDepthMeters = convertInToM(rootDepth);
  const tnV = calcTNV(tnKgs, vwc, rootDepthMeters);
  
  const UN = hasPlants ? calcPlantUptake(tnV, pet) : 0;
  const QN = lowTempShutOff ? 0 : calcTransported(tnV, drainage);
  
  const newTinKgs = tnKgs - UN - QN;
  const newTinLbs = convertKgM2ToLbAcre(newTinKgs);
  
  const unLbs = convertKgM2ToLbAcre(UN);
  const qnLbs = convertKgM2ToLbAcre(QN);

  const numSources = countSources([somLbs, fastN, mediumN, slowN]);
  const otherRemoved = numSources ? qnLbs / numSources : 0;

  console.log(date, soilTempC, somMineralizedLbs);

  return {
    tin: Math.max(newTinLbs, 0),
    som: Math.max(convertLbAcreToOMPercent(somLbs - somMineralizedLbs - otherRemoved), 0),
    fastN: adjustForExtraMineralization(fastMineralizedLbs + otherRemoved, fastN),
    mediumN: adjustForExtraMineralization(mediumMineralizedLbs + otherRemoved, mediumN),
    slowN: adjustForExtraMineralization(slowMineralizedLbs + otherRemoved, slowN),
    leached: Math.max(Math.round(qnLbs * 1000) / 1000,0),
    tableOut: [
      date,
      Math.round(tin * 100000) / 100000,
      Math.max(Math.round(newTinLbs * 100000) / 100000, 0),
      Math.round(mineralizationAdjustmentFactor * 100000) / 100000,
      Math.max(Math.round(somMineralizedLbs * 100000) / 100000,0),
      Math.max(Math.round(fastMineralizedLbs * 100000) / 100000,0),
      Math.max(Math.round(mediumMineralizedLbs * 100000) / 100000,0),
      Math.max(Math.round(slowMineralizedLbs * 100000) / 100000,0),
      Math.max(Math.round(unLbs * 100000) / 100000,0),
      Math.max(Math.round(qnLbs * 100000) / 100000,0)
    ]
  };
}