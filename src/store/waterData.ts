async function fetchPrecip(lat, lon, eDate) {
  const response = await fetch('https://grid2.rcc-acis.org/GridData', {
    method: 'POST',
    body: JSON.stringify({
      loc: `${lon},${lat}`,
      grid: 'nrcc-model',
      sDate: `${eDate.slice(0,4)}-03-01`,
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

async function fetchPETData(lat, lon, year) {
  return fetch(
    `https://x6xfv2cdrl.execute-api.us-east-1.amazonaws.com/production/irrigation?lat=${lat}&lon=${lon}&year=${year}`
  )
    .then(response => response.json())
    .then(results => results.pet.map((pet,i) => ([year + '-' + results.dates_pet[i].split('/').join('-'), pet])))
    .catch(() => null);
};

export async function getWaterData(activeLocation, date) {
  if (activeLocation) {
    try {
      const { lat, lon } = activeLocation;
      const precip = await fetchPrecip(lat, lon, date);
      const pet = await fetchPETData(lat, lon, date.slice(0,4))
    
      const results = { dates: [], pet: [], precip: [] };
      const len = Math.min(pet.length, precip.length);
      for (let i = 0; i < len; i++) {
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
    }
  }
  return null;
}