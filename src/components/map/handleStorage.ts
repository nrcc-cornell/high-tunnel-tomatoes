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

function addLocation(currLocs, newLoc) {
  const latIdx = currLocs.findIndex(cl => cl.lat === newLoc.lat);
  const lonIdx = currLocs.findIndex(cl => cl.lon === newLoc.lon);
  if (latIdx < 0 || lonIdx < 0) {
    console.log('add marker');
    const newLocs = [...currLocs, newLoc];
    setStorage(LOCATIONS_KEY, newLocs)
    return newLocs;
  }
  return null;
}

function removeLocation(currLocs, removeLoc) {
  console.log(currLocs, removeLoc);
  const newLocs = currLocs.filter(cl => cl.lat !== removeLoc.lat || cl.lon !== removeLoc.lon);
  console.log('here');
  setStorage(LOCATIONS_KEY, newLocs)
  console.log(newLocs);
  return newLocs;
}

function updateActiveLocation(newLoc) {
  setStorage(ACTIVE_LOCATION_KEY, newLoc);
  return newLoc;
}

export { loadLocations, addLocation, removeLocation, updateActiveLocation };