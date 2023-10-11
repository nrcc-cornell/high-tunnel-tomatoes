const rootDepthInches = 18;
const rootDepthMeters = convertInToM(rootDepthInches);
const somKN = 0.000083;
const fastKN = 0.1;
const mediumKN = 0.003;
const slowKN = 0.0002;

function convertInToM(inches: number) {
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



  //// Valid output of model
  //// add flags or something to indicate application and test event
  //// style the nitrogen chart, organize them too




  let somLbs = convertOMPercentToLbAcre(som);
  const somMineralizedLbs = gTheta * somKN * somLbs;
  const fastMineralizedLbs = gTheta * fastKN * fastN;
  const mediumMineralizedLbs = gTheta * mediumKN * mediumN;
  const slowMineralizedLbs = gTheta * slowKN * slowN;

  const tnLbs = tin + somMineralizedLbs + fastMineralizedLbs + mediumMineralizedLbs + slowMineralizedLbs;
  const tnKgs = convertLbAcreToKgM2(tnLbs);
  const tnV = calcTNV(tnKgs, plantUptakeTheta);
  const UN = hasPlants ? calcPlantUptake(tnV, pet) : 0;
  const QN = calcTransported(tnV, drainage);

  
  const newTinKgs = tnKgs - UN - QN;
  const newTinLbs = convertKgM2ToLbAcre(newTinKgs);

  const otherRemoved = (convertKgM2ToLbAcre(UN) + convertKgM2ToLbAcre(QN)) / 4;

  return {
    tin: newTinLbs,
    som: convertLbAcreToOMPercent(somLbs - somMineralizedLbs - otherRemoved),
    fastN: fastN - fastMineralizedLbs - otherRemoved,
    mediumN: mediumN - mediumMineralizedLbs - otherRemoved,
    slowN: slowN - slowMineralizedLbs - otherRemoved
  };
}


// //// Next steps:
// //// // add irrigation stuff into water model
// //// // stub a temporary irrigation schedule for now
// //// // build out nitrogen model
// //// // account for planting date (no plant uptake if not planted)
// //// // account for nitrogen applications
// //// // account for testing adjustments