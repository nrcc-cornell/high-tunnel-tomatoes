import { SoilMoistureOptionLevel } from './waterDeficitModel';

type SoilHorizonData = number[];

type SoilTypeData = {
  percent: number;
  horizons: (number | null)[][];
}

type SoilHorizonWeightsReduce = {
  depthAccountedFor: number;
  depths: number[];
}

type SoilTypeReduce = {
  [key: string]: SoilTypeData;
}

type AsyncReturnType<T extends (...args: any) => Promise<any>> = T extends (
  ...args: any
) => Promise<infer R>
  ? R
  : any;

type SDMReturn = AsyncReturnType<typeof fetchSoilColumnDataViaPostRest>;

function noNulls<TValue>(value: (TValue | null)[]): value is TValue[] {
  return !(value.includes(null));
}

class SoilType {
  columnDepthCm = 45;
  name: string;
  areaWeight: number;
  horizons: SoilHorizonData[];

  constructor(name: string, typeData: SoilTypeData) {
    this.name = name;
    this.areaWeight = typeData.percent / 100;
    const goodHorizons = typeData.horizons.filter(noNulls);
    this.horizons = goodHorizons.map(h => {
      const newH = [...h];
      if (newH.length === 6) {
        newH.splice(4, 0, 1.3);
      }
      return newH;
    });
  }

  calcHorizonDepth(horizon: SoilHorizonData) {
    const top = horizon[5];
    const bottom = horizon[6] > this.columnDepthCm ? this.columnDepthCm : horizon[6];
    return top >= this.columnDepthCm ? 0 : bottom - top;
  }

  calcHorizonWeightedValues(horizon: SoilHorizonData, weight: number) {
    return horizon.slice(0,5).map(val => val * weight);
  }

  calcHorizonWeights() {
    const { depthAccountedFor, depths } = this.horizons.reduce<SoilHorizonWeightsReduce>((acc, horizon) => {
      const thisHorizonDepth = this.calcHorizonDepth(horizon);
      acc.depthAccountedFor += thisHorizonDepth;
      acc.depths.push(thisHorizonDepth);
      return acc;
    }, { depthAccountedFor: 0, depths: [] });
    return depths.map(depth => depth / depthAccountedFor);
  }

  calcWeightedAvgs() {
    const weights = this.calcHorizonWeights();
    return this.horizons.reduce((acc, horizon, weightIndex) => {
      const weightedValues = this.calcHorizonWeightedValues(horizon, weights[weightIndex]);
      for (let i = 0; i < weightedValues.length; i++) {
        acc[i] += weightedValues[i];
      }
      return acc;
    }, [0,0,0,0,0]);
  }
}

const fetchSoilColumnDataViaPostRest = (lngLat: [number, number]) => {
  const query = `SELECT claytotal_r, sandtotal_r, silttotal_r, om_r, dbovendry_r, dbthirdbar_r, hzdept_r, hzdepb_r, comppct_r, compname
    FROM mapunit AS mu
    LEFT OUTER JOIN component AS c ON mu.mukey = c.mukey
    INNER JOIN chorizon AS ch ON c.cokey = ch.cokey
    WHERE mu.mukey IN (SELECT * from SDA_Get_Mukey_from_intersection_with_WktWgs84('point (${lngLat.join(' ')})')) AND hzdept_r <= 45`;

  return fetch(
    'https://sdmdataaccess.sc.egov.usda.gov/tabular/post.rest',
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        format: 'JSON',
        query: query,
      }),
    }
  )
    .then((res) => res.json())
    .then((jData) => {
      return jData.Table;
    })
    .catch((e) => {
      console.error('Failed soil data: ', e);
      return null;
    });
};

const convertIntoSoilTypes = (soilColumnData: SDMReturn) => {
  const sortedByName = soilColumnData.reduce((acc: SoilTypeReduce, horizon: string[]) => {
    if (!(horizon[9] in acc)) acc[horizon[9]] = { percent: parseInt(horizon[8]), horizons: [] };
    let hasBD = false;
    acc[horizon[9]].horizons.push(horizon.slice(0,8).reduce((acc, val, i) => {
      if (i <= 2 || i >= 6) {
        acc.push(val === null ? null : parseInt(val));
      } else if (i === 3) {
        acc.push(val === null ? null : parseFloat(val));
      } else if (!hasBD && val !== null) {
        hasBD = true;
        acc.push(parseFloat(val));
      } return acc;
    }, []));
    return acc;
  }, {});

  const areaSum = Object.keys(sortedByName).reduce((sum,name) => sum += sortedByName[name].percent, 0);
  if (areaSum < 100) {
    const unaccounted = 100 - areaSum;
    const portion = unaccounted / Object.keys(sortedByName).length;
    Object.keys(sortedByName).forEach(name => sortedByName[name].percent += portion);
  }

  return Object.keys(sortedByName).map(name => new SoilType(name, sortedByName[name]));
};

const calcAvgSoilComp = (soilTypes: SoilType[]) => {
  return soilTypes.reduce((acc, soilType) => {
    const typeComposition = soilType.calcWeightedAvgs();
    for (let i = 0; i < typeComposition.length; i++) {
      acc[i] += typeComposition[i] * soilType.areaWeight;
    }
    return acc;
  }, [0,0,0,0,0]);
};

const categorizeTexture = (clay: number, sand: number, silt: number): SoilMoistureOptionLevel => {
  let type: SoilMoistureOptionLevel = SoilMoistureOptionLevel.MEDIUM;
  
  if (sand >= 50 && clay < 20) {
    type = SoilMoistureOptionLevel.LOW;
  } else if (clay >= 36 || silt >= 50 || (clay >= 30 && sand < 45)) {
    type = SoilMoistureOptionLevel.HIGH;
  }

  return type;
};

export async function getSoilCharacteristics(activeLocation) {
  if (!activeLocation) return null;
  const soilColumnData = await fetchSoilColumnDataViaPostRest([activeLocation.lon, activeLocation.lat]);
  const soilTypes = convertIntoSoilTypes(soilColumnData);
  const [ avgClay, avgSand, avgSilt, avgOM, avgBD ] = calcAvgSoilComp(soilTypes);
  return {
    waterCapacity: categorizeTexture(avgClay, avgSand, avgSilt),
    composition: { clay: Math.round(avgClay), sand: Math.round(avgSand), silt: Math.round(avgSilt) },
    organicMatter: Math.round(avgOM),
    bulkDensity: avgBD
  };
}