import { calcMineralizedLbs, adjustForExtraMineralization } from "./nitrogenHelpers";

const rootDepthInches = 18;
const rootDepthMeters = convertInToM(rootDepthInches);
// const somKN = 0.000083;
// const fastKN = 0.1;
// const mediumKN = 0.003;
// const slowKN = 0.0002;

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

function calcTNV(tnKgs, plantUptakeTheta) {
  return tnKgs / (rootDepthMeters * plantUptakeTheta);
}

function calcPlantUptake(tnV: number, petInches: number) {
  const petMeters = convertInToM(petInches);
  return tnV * petMeters;
}

function calcTransported(tnV: number, drainageInches: number) {
  const drainageMeters = convertInToM(drainageInches);
  return tnV * drainageMeters;
}

export default function balanceNitrogen(
  vwc: number,
  fc: number,
  mp: number,
  drainage: number,
  hasPlants: boolean,
  pet: number,
  tin: number,
  som: number,
  fastN: number[],
  mediumN: number[],
  slowN: number[],
  date: string,
  somKN: number,
  mineralizationAdjustmentFactor: number
) {
  //  -------------------------------------------------------------
  //  Calculate soil inorganic nitrogen (lbs/acre) from daily volumetric water content, 
  //    nitrogen application dates and amounts, and an initial soil organic matter percentage
  //
  //  initOM                : initial soil organic matter (%)
  //  nitrogenApplications  : array of [date as 'YYYY-MM-DD', amount of nitrogen applied (lbs/acre)]
  //  water                 : daily array of [date as 'YYYY-MM-DD', volumetric water content as decimal, 24hr drainage (inches)]
  //
  //  -------------------------------------------------------------
  
  const gTheta = (fc - mp)/(vwc - mp); //// supposed to be equation from Josef
  const plantUptakeTheta = 0.25; //// unknown from Arts calcs doc

  let somLbs = convertOMPercentToLbAcre(som);
  const somMineralizedLbs = mineralizationAdjustmentFactor * gTheta * somKN * somLbs;
  const { amountMineralized: fastMineralizedLbs } = calcMineralizedLbs(mineralizationAdjustmentFactor, gTheta, fastN);
  const { amountMineralized: mediumMineralizedLbs } = calcMineralizedLbs(mineralizationAdjustmentFactor, gTheta, mediumN);
  const { amountMineralized: slowMineralizedLbs } = calcMineralizedLbs(mineralizationAdjustmentFactor, gTheta, slowN);
  
  const tnLbs = tin + somMineralizedLbs + fastMineralizedLbs + mediumMineralizedLbs + slowMineralizedLbs;
  const tnKgs = convertLbAcreToKgM2(tnLbs);
  const tnV = calcTNV(tnKgs, plantUptakeTheta);
  const UN = hasPlants ? calcPlantUptake(tnV, pet) : 0;
  const QN = calcTransported(tnV, drainage);
  
  const newTinKgs = tnKgs - UN - QN;
  const newTinLbs = convertKgM2ToLbAcre(newTinKgs);
  
  const unLbs = convertKgM2ToLbAcre(UN);
  const qnLbs = convertKgM2ToLbAcre(QN);
  const otherRemoved = (unLbs + qnLbs) / 4;

  return {
    tin: Math.max(newTinLbs, 0),
    som: Math.max(convertLbAcreToOMPercent(somLbs - somMineralizedLbs - otherRemoved), 0),
    fastN: adjustForExtraMineralization(otherRemoved, fastN),
    mediumN: adjustForExtraMineralization(otherRemoved, mediumN),
    slowN: adjustForExtraMineralization(otherRemoved, slowN),
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