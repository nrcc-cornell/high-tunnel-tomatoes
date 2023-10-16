const rootDepthInches = 18;
const rootDepthMeters = convertInToM(rootDepthInches);
const somKN = 0.000083;
const fastKN = 0.1;
const mediumKN = 0.003;
const slowKN = 0.0002;

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
  fastN: number,
  mediumN: number,
  slowN: number
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

  console.log(gTheta, fastKN, fastN, gTheta * fastKN * fastN);


  let somLbs = convertOMPercentToLbAcre(som);
  console.log(`somLbs: ${somLbs}`);
  const somMineralizedLbs = gTheta * somKN * somLbs;
  console.log(`somMineralizedLbs: ${somMineralizedLbs}`);
  const fastMineralizedLbs = gTheta * fastKN * fastN;
  console.log(`fastMineralizedLbs: ${fastMineralizedLbs}`);
  const mediumMineralizedLbs = gTheta * mediumKN * mediumN;
  console.log(`mediumMineralizedLbs: ${mediumMineralizedLbs}`);
  const slowMineralizedLbs = gTheta * slowKN * slowN;
  console.log(`slowMineralizedLbs: ${slowMineralizedLbs}`);

  const tnLbs = tin + somMineralizedLbs + fastMineralizedLbs + mediumMineralizedLbs + slowMineralizedLbs;
  const tnKgs = convertLbAcreToKgM2(tnLbs);
  const tnV = calcTNV(tnKgs, plantUptakeTheta);
  const UN = hasPlants ? calcPlantUptake(tnV, pet) : 0;
  const QN = calcTransported(tnV, drainage);

  
  const newTinKgs = tnKgs - UN - QN;
  const newTinLbs = convertKgM2ToLbAcre(newTinKgs);

  const otherRemoved = (convertKgM2ToLbAcre(UN) + convertKgM2ToLbAcre(QN)) / 4;

  console.log(`TIN LBS/ACRE: ${newTinLbs}`);
  console.log(`UN: ${convertKgM2ToLbAcre(UN)}   QN: ${convertKgM2ToLbAcre(QN)}`);
  console.log(fastN, fastMineralizedLbs, otherRemoved, fastN - fastMineralizedLbs - otherRemoved);

  return {
    tin: Math.max(newTinLbs, 0),
    som: Math.max(convertLbAcreToOMPercent(somLbs - somMineralizedLbs - otherRemoved), 0),
    fastN: Math.max(fastN - fastMineralizedLbs - otherRemoved, 0),
    mediumN: Math.max(mediumN - mediumMineralizedLbs - otherRemoved, 0),
    slowN: Math.max(slowN - slowMineralizedLbs - otherRemoved, 0)
  };
}