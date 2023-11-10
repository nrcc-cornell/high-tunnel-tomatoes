import { differenceInDays, isAfter, subYears, subDays, addDays, format } from 'date-fns';

async function fetchObsPrecip(lat, lon, eDate) {
  const response = await fetch('https://grid2.rcc-acis.org/GridData', {
    method: 'POST',
    body: JSON.stringify({
      loc: `${lon},${lat}`,
      grid: 'nrcc-model',
      sDate: `${parseInt(eDate.slice(0,4)) - 1}-01-01`,
      eDate,
      elems: [{ name: 'pcpn' }]
    }),
  });

  if (!response.ok) {
    throw new Error(response.statusText);
  }

  const results = (await response.json()).data;
  while (results[results.length - 1].includes(-999)) {
    results.pop();
  }
  return results;
};

function calcDailyPrecipFromHrly(valuesArr, precipIdx, initSum=0) {
  // Loop hourly data summing precip at given index through 7:00am
  // then start a new daily sum by storing the current total and resetting to 0
  const returnArr = [];
  let sum = initSum;
  valuesArr.forEach(arr => {
    let precip = arr[precipIdx];
    if (precip === 'M') {
      precip = 0;
    } else {
      precip = parseFloat(precip);
    }
    sum += precip;

    if (arr[0].slice(11,13) === '07') {
      returnArr.push([arr[0].slice(0,10), sum]);
      sum = 0;
    }
  });
  return {returnArr, remainingSum: sum};
}

async function fetchForePrecip(lat, lon, sDate) {
  // Make start date one day earlier to ensure full coverage
  let date = new Date(sDate + 'T00:00');
  date.setDate((date.getDate() - 1));
  const strDate = date.toISOString().slice(0,10).replace('-','').replace('-','') + '08';
  
  const response = await fetch('https://hrly.nrcc.cornell.edu/locHrly', {
    method: 'POST',
    body: JSON.stringify({
      lon: lon,
      lat: lat,
      tzo: -5,
      sdate:  strDate,
      edate: "now"
    }),
  });

  if (!response.ok) {
    throw new Error(response.statusText);
  }

  const results = await response.json();

  // Sum observed hourly in daily and get the remaining sum to intialize forecast hourly with
  const {returnArr: obsArr, remainingSum} = calcDailyPrecipFromHrly(results.hrlyData, 2);
  
  // Cap forecast hourly at 72hrs and calculate the rest of the forecast from it
  const endIdx = Math.min(72, results.fcstData.findIndex(arr => arr[11] === 'M'));
  const { returnArr: foreArr } = calcDailyPrecipFromHrly(results.fcstData.slice(0, endIdx), 11, remainingSum);
  
  return obsArr.concat(foreArr);
}

async function fetchPrecip(lat, lon, eDate) {
  const [obsPrecip, forePrecip] = await Promise.all([
    fetchObsPrecip(lat, lon, eDate),
    fetchForePrecip(lat, lon, eDate)
  ])


  while (forePrecip.length && obsPrecip[obsPrecip.length - 1][0] === forePrecip[0][0]) {
    forePrecip.shift();
  }

  return {
    precip: obsPrecip.concat(forePrecip),
    precipFcstLength: forePrecip.length
  };
}

const generateOutOfSeasonArray = (d1, d2) => {
  const arr = [];
  for (let i = 0; i < differenceInDays(d1, d2); i++) {
    arr.push([format(addDays(d2, i), 'yyyy-MM-dd'), 0]);
  }
  return arr;
};

const isOnOrPastDate = (date, compDate, isPastYear) => {
  return isAfter(date, subDays(compDate, 1)) || isPastYear;
};

async function fetchPETData(lat, lon, todayStr, yearAdjustment=0) {
  if (yearAdjustment < 0) yearAdjustment = Math.abs(yearAdjustment);
  const targetDate = subYears(new Date(todayStr + 'T00:00'), yearAdjustment);
  const isPastYear = yearAdjustment > 0;

  const marchFirst = new Date(targetDate.getFullYear(), 2, 1);
  const hasSeasonStarted = isOnOrPastDate(targetDate, marchFirst, isPastYear);
  
  const novFirst = new Date(targetDate.getFullYear(),10,1);
  const hasSeasonEnded = isOnOrPastDate(targetDate, novFirst, isPastYear);

  const janFirst = new Date(targetDate.getFullYear(), 0, 1);
  const janFirstNextYear = new Date (targetDate.getFullYear() + 1, 0, 1);

  const preSeason = generateOutOfSeasonArray(hasSeasonStarted ? marchFirst : targetDate, janFirst);
  const postSeason = hasSeasonEnded ? generateOutOfSeasonArray(isPastYear ? janFirstNextYear : targetDate, novFirst) : [];
  
  let season = [];
  let forecast = [];
  if (hasSeasonStarted) {
    const year = targetDate.getFullYear();
    const response = await fetch(`https://x6xfv2cdrl.execute-api.us-east-1.amazonaws.com/production/irrigation?lat=${lat}&lon=${lon}&year=${year}`);
  
    if (!response.ok) {
      throw new Error(response.statusText);
    }

    const results = await response.json();
    season = results.pet.map((pet,i) => ([year + '-' + results.dates_pet[i].split('/').join('-'), pet]));

    if (!isPastYear) {
      if (hasSeasonEnded) {
        const lastObsDate = new Date(postSeason[postSeason.length - 1][0] + 'T00:00');
        for (let i = 1; i < 4; i++) {
          forecast.push([format(addDays(lastObsDate, i), 'yyyy-MM-dd'), 0]);
        }
      } else {
        forecast = results.pet_fcst.map((pet,i) => ([year + '-' + results.dates_pet_fcst[i].split('/').join('-'), pet]));
      }
    }
  }

  return {
    pet: [...preSeason, ...season, ...postSeason, ...forecast],
    petFcstLength: forecast.length
  };
};

export async function getWaterData({ lat, lon }, date) {
  try {
    // fetch PET and precip
    let [
      { precip, precipFcstLength },
      { pet: lastYearPet },
      { pet, petFcstLength }
    ] = await Promise.all([
      fetchPrecip(lat, lon, date),
      fetchPETData(lat, lon, date, 1),
      fetchPETData(lat, lon, date)
    ]);

    pet = lastYearPet.concat(pet);
    
    // adjust pet and precip to have matching lengths
    const lengthDiff = precip.length - pet.length;
    if (lengthDiff > 0) {
      precipFcstLength = Math.max(precipFcstLength - lengthDiff, 0);
      precip = precip.slice(0, precip.length - lengthDiff)
    } else if (lengthDiff < 0) {
      petFcstLength = Math.max(petFcstLength - lengthDiff, 0);
      pet = pet.slice(0, pet.length - lengthDiff)
    }

    // instantiate results obj and determine the number of forecast days that will be in results
    const results = {
      dates: [],
      pet: [],
      precip: [],
      fcstLength: Math.max(precipFcstLength, petFcstLength)
    };

    // loop through data pushing to results obj and ensuring that the dates match
    for (let i = 0; i < Math.min(pet.length, precip.length); i++) {
      const [petDate, petValue] = pet[i];
      const [precipDate, precipValue] = precip[i];
      
      if (petDate === precipDate) {
        results.dates.push(petDate);
        results.pet.push(petValue);
        results.precip.push(precipValue);
      } else {
        throw 'PET and precip dates do not match';
      }
    }
    return results;
  } catch (e) {
    console.error(e);
    return null;
  }
}