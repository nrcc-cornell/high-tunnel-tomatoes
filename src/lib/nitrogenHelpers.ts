export const organicAmendments = [{
  name: 'Blood Meal',
  rate: 0.059,
  category: 'fast'
},{
  name: 'Canola Meal',
  rate: 0.04,
  category: 'fast'
},{
  name: 'Cotton Seed Meal',
  rate: 0.0042,
  category: 'fast'
},{
  name: 'Peanut Meal',
  rate: 0.042,
  category: 'fast'
},{
  name: 'Bagged Broiler Litter',
  rate: 0.022,
  category: 'medium'
},{
  name: 'Broiler Litter',
  rate: 0.021,
  category: 'medium'
},{
  name: 'Composted Broiler Litter',
  rate: 0.022,
  category: 'medium'
},{
  name: 'Feather Meal',
  rate: 0.079,
  category: 'slow'
},{
  name: 'Fish Byproducts',
  rate: 0.053,
  category: 'slow'
},{
  name: 'Dairy Solids',
  rate: 0.009,
  category: 'slow'
},{
  name: 'Rabbit Manure',
  rate: 0.016,
  category: 'slow'
},{
  name: 'Composted Dairy Solids',
  rate: 0.009,
  category: 'slow'
},{
  name: 'Composted Rabbit Manure',
  rate: 0.009,
  category: 'slow'
},{
  name: 'Yard Waste Compost',
  rate: 0.009,
  category: 'slow'
},{
  name: 'Alfalfa Meal',
  rate: 0.0008,
  category: 'slow'
},{
  name: 'Other Fast Nitrogen',
  rate: 0.1,
  category: 'fast'
},{
  name: 'Other Medium Nitrogen',
  rate: 0.003,
  category: 'medium'
},{
  name: 'Other Slow Nitrogen',
  rate: 0.0002,
  category: 'slow'
}];

export const calcMineralizedLbs = (mineralizationAdjustmentFactor: number, gTheta:number, nitrogenAppsArr) => {
  let minSum = 0;
  const newNAA = nitrogenAppsArr.map(([appName, lbs]) => {
    const { rate } = organicAmendments.find(app => app.name === appName);
    const amountMineralized = (mineralizationAdjustmentFactor * gTheta * rate * lbs);
    minSum += amountMineralized;
    return [appName, Math.max(lbs - amountMineralized, 0)];
  });
  return { amountMineralized: minSum, newApplicationsArray: newNAA };
};

export const adjustForExtraMineralization = (total, arrs) => {
  if (total === 0 || arrs.length === 0) return arrs;
  const amountPer = total / arrs.length;
  return arrs.map(arr => [arr[0], Math.max(0, arr[1] - amountPer)]);
}