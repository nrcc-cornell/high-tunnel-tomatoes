const APP_NAME = 'high-tunnel-tomatoes';
const LOCATIONS_KEY = 'locations';
const ACTIVE_LOCATION_KEY = 'active-location';

function setStorage(key, newValue) {
  localStorage.setItem(`${APP_NAME}-${key}`, JSON.stringify(newValue));
}

function getStorage(key) {
  const stored = localStorage.getItem(`${APP_NAME}-${key}`);
  if (stored) return JSON.parse(stored);
  else return null;
}

function loadLocations() {
  const storedLocations = getStorage(LOCATIONS_KEY);
  const storedActiveLocation = getStorage(ACTIVE_LOCATION_KEY);
  return { storedLocations, storedActiveLocation };
}

function addLocationToStorage(currLocs, newLoc) {
  let newLocs = null;
  if (currLocs) {
    const latIdx = currLocs.findIndex(cl => cl.lat === newLoc.lat);
    const lonIdx = currLocs.findIndex(cl => cl.lon === newLoc.lon);
    if (latIdx >= 0 && lonIdx >= 0) return newLocs;
    newLocs = [...currLocs, newLoc];
  } else {
    newLocs = [newLoc];
  }
  setStorage(LOCATIONS_KEY, newLocs)
  return newLocs;
}

function removeLocationFromStorage(currLocs, removeLoc) {
  const newLocs = currLocs.filter(cl => cl.lat !== removeLoc.lat || cl.lon !== removeLoc.lon);
  setStorage(LOCATIONS_KEY, newLocs)
  return newLocs;
}

function updateActiveLocationInStorage(newLoc) {
  setStorage(ACTIVE_LOCATION_KEY, newLoc);
  return newLoc;
}

export { loadLocations, addLocationToStorage, removeLocationFromStorage, updateActiveLocationInStorage };