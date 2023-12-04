import { differenceInDays, isAfter, isBefore, subYears, subDays, addDays, format } from 'date-fns';

async function fetchAcisObs(lat, lon, eDate) {
  const response = await fetch('https://grid2.rcc-acis.org/GridData', {
    method: 'POST',
    body: JSON.stringify({
      loc: `${lon},${lat}`,
      grid: 'nrcc-model',
      sDate: `${parseInt(eDate.slice(0,4)) - 1}-01-01`,
      eDate,
      elems: [{ name: 'pcpn' },{ name: 'avgt' }]
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

function convertHrlyToDaily(hourArrs, valueIdx, sumOrAvg='sum', initObj={ sum: 0, count: 0 }) {
  // Loop hourly data summing values at given index through 7:00am
  // then start a new daily sum by storing the current total and resetting to 0
  const returnArr = [];
  hourArrs.forEach(hour => {
    let value = hour[valueIdx];
    if (value === 'M') {
      value = 0;
    } else {
      value = parseFloat(value);
    }
    initObj.sum += value;
    initObj.count += 1;

    if (hour[0].slice(11,13) === '07') {
      returnArr.push([hour[0].slice(0,10), sumOrAvg === 'sum' ? initObj.sum : (initObj.count > 0 ? (initObj.sum / initObj.count) : 0)]);
      initObj={ sum: 0, count: 0 };
    }
  });
  return {returnArr, remainder: initObj};
}

function calcDailyFromHrly(dataObj, obsIdx, foreIdx, sumOrAvg) {
  // Sum observed hourly in daily and get the remaining sum to intialize forecast hourly with
  const {returnArr: obsArr, remainder} = convertHrlyToDaily(dataObj.hrlyData, obsIdx, sumOrAvg);
  
  // Cap forecast hourly at 72hrs and calculate the rest of the forecast from it
  const endIdx = Math.min(72, dataObj.fcstData.findIndex(arr => arr[11] === 'M'));
  const { returnArr: foreArr } = convertHrlyToDaily(dataObj.fcstData.slice(0, endIdx), foreIdx, sumOrAvg, remainder);
  
  return obsArr.concat(foreArr);
}

async function fetchLocHourlyFore(lat, lon, sDate) {
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
  const precipDaily = calcDailyFromHrly(results, 2, 11, 'sum');
  const tempFDaily = calcDailyFromHrly(results, 3, 2, 'avg');
  const daily = [];
  for (let i = 0; i < precipDaily.length; i++) {
    daily.push([ ...precipDaily[i], tempFDaily[i][1] ]);
  }
  return daily;
}

async function fetchAcisData(lat, lon, eDate) {
  const [obs, fore] = await Promise.all([
    fetchAcisObs(lat, lon, eDate),
    fetchLocHourlyFore(lat, lon, eDate)
  ])


  while (fore.length && obs[obs.length - 1][0] === fore[0][0]) {
    fore.shift();
  }

  return {
    weather: obs.concat(fore),
    weatherFcstLength: fore.length
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

const calcSoilTemp = (dateStr, tempF) => {
  const tempC = (tempF - 32) * (5 / 9);
  const date = new Date(dateStr + 'T00:00');
  const apr1 = new Date(date.getFullYear(), 3, 1);
  const oct31 = new Date(date.getFullYear(), 9, 31);
  if (isBefore(date, apr1) || isAfter(date, oct31)) {
    return 0.264 * tempC + 4.8;
  } else {
    return 0.481 * tempC + 11.1;
  }
};

export async function getWeatherData({ lat, lon }, date) {
  try {
    // fetch PET and precip
    let [
      { weather, weatherFcstLength },
      { pet: lastYearPet },
      { pet, petFcstLength }
    ] = await Promise.all([
      fetchAcisData(lat, lon, date),
      fetchPETData(lat, lon, date, 1),
      fetchPETData(lat, lon, date)
    ]);

    pet = lastYearPet.concat(pet);
    
    // adjust pet and weather to have matching lengths
    const lengthDiff = weather.length - pet.length;
    if (lengthDiff > 0) {
      weatherFcstLength = Math.max(weatherFcstLength - lengthDiff, 0);
      weather = weather.slice(0, weather.length - lengthDiff)
    } else if (lengthDiff < 0) {
      petFcstLength = Math.max(petFcstLength - lengthDiff, 0);
      pet = pet.slice(0, pet.length - lengthDiff)
    }

    // instantiate results obj and determine the number of forecast days that will be in results
    const results = {
      dates: [],
      pet: [],
      precip: [],
      soilTemp: [],
      fcstLength: Math.max(weatherFcstLength, petFcstLength)
    };

    // loop through data pushing to results obj and ensuring that the dates match
    for (let i = 0; i < Math.min(pet.length, weather.length); i++) {
      const [petDate, petValue] = pet[i];
      const [weatherDate, precipValue, tempFValue] = weather[i];
      
      if (petDate === weatherDate) {
        results.dates.push(petDate);
        results.pet.push(petValue);
        results.precip.push(precipValue);
        results.soilTemp.push(calcSoilTemp(petDate, tempFValue));
      } else {
        throw 'PET, precip, and temp dates do not match';
      }
    }
    return results;
  } catch (e) {
    console.error(e);
    return null;
  }
}