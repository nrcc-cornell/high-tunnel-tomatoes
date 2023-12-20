const APP_NAME = 'high-tunnel-tomatoes';
const LOCATIONS_KEY = 'locations';
const ACTIVE_LOCATION_ID_KEY = 'active-location-id';
const OPTIONS_KEY = 'options';

function setStorage(key, newValue) {
  localStorage.setItem(`${APP_NAME}-${key}`, JSON.stringify(newValue));
}

function getStorage(key) {
  const stored = localStorage.getItem(`${APP_NAME}-${key}`);
  if (stored) return JSON.parse(stored);
  else return null;
}

function loadActiveLocationId() {
  return getStorage(ACTIVE_LOCATION_ID_KEY);
}
function loadLocations() {
  return getStorage(LOCATIONS_KEY);
}

function findKey(object, value) { 
  for (let prop in object) { 
    if (object.hasOwnProperty(prop)) { 
      if (object[prop] === value) {
        return prop; 
      }
    } 
  } 
} 

function addLocationToStorage(currLocs, newLoc) {
  let newLocs = null;
  if (currLocs) {
    const latMatch = findKey(currLocs, newLoc.lat);
    const lonMatch = findKey(currLocs, newLoc.lon);
    if (latMatch && lonMatch) return newLocs;
    newLocs = { ...currLocs, [newLoc.id]: newLoc };
  } else {
    newLocs = { [newLoc.id]: newLoc };
  }
  setStorage(LOCATIONS_KEY, newLocs);
  return newLocs;
}

function removeLocationFromStorage(currLocs, removeId) {
  const newLocs = JSON.parse(JSON.stringify(currLocs));
  delete newLocs[removeId];
  setStorage(LOCATIONS_KEY, newLocs);

  // Also delete corresponing location options
  const options = loadOptions() || {};
  if (Object.keys(options).includes(removeId)) {
    delete options[removeId];
    setStorage(OPTIONS_KEY, options);
  }
  return newLocs;
}

function updateActiveLocationIdInStorage(newId) {
  setStorage(ACTIVE_LOCATION_ID_KEY, newId);
  return newId;
}

function loadOptions() {
  return getStorage(OPTIONS_KEY);
}

function updateOptionsInStorage(locId, newOptions) {
  const options = loadOptions() || {};
  options[locId] = newOptions;
  setStorage(OPTIONS_KEY, options);
}

async function overwriteStorage(locations, activeLocationId, options) {
  setStorage(LOCATIONS_KEY, locations);
  setStorage(ACTIVE_LOCATION_ID_KEY, activeLocationId);
  setStorage(OPTIONS_KEY, options);
}

function backUpOptionsToFile() {
  const options = loadOptions();
  const activeLocationId = loadActiveLocationId();
  const locations = loadLocations();

  const objStr = JSON.stringify({ options, activeLocationId, locations });
  const encoded = btoa(objStr);

  var a = document.createElement("a");
  var file = new Blob([encoded], {type: 'application/octet-stream'});
  a.href = URL.createObjectURL(file);
  a.download = 'high-tunnel-backup.dat';
  a.click();
}

export {
  loadOptions,
  loadLocations,
  loadActiveLocationId,
  addLocationToStorage,
  removeLocationFromStorage,
  updateActiveLocationIdInStorage,
  updateOptionsInStorage,
  overwriteStorage,
  backUpOptionsToFile
};