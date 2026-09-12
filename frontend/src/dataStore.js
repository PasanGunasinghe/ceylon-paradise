export const STORAGE_KEYS = {
  tours: 'app_tours',
  destinations: 'app_destinations',
  mapPins: 'app_map_pins',
  gallery: 'app_gallery',
  reviews: 'app_reviews',
};

const legacyKeys = {
  tours: 'ceylon_paradise_tours',
  destinations: 'ceylon_paradise_destinations',
  mapPins: 'ceylon_paradise_mapPins',
  gallery: 'ceylon_paradise_memories',
  reviews: 'app_reviews',
};

const customMapPinsKey = 'custom_map_pins';

export const safeSetLocalStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    if (error?.name !== 'QuotaExceededError') {
      console.warn(`Failed to save ${key} to localStorage:`, error);
    }
    return false;
  }
};

const safeGetLocalStorage = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const readList = (name, fallback = []) => {
  if (name === 'tours') return fallback;

  const keys = name === 'mapPins'
    ? [STORAGE_KEYS[name], legacyKeys[name], customMapPinsKey]
    : [STORAGE_KEYS[name], legacyKeys[name]];

  for (const key of keys) {
    const raw = safeGetLocalStorage(key);
    if (raw === null) continue;

    try {
      const value = JSON.parse(raw);
      return Array.isArray(value) ? value : fallback;
    } catch {
      return fallback;
    }
  }

  return fallback;
};

export const hasList = (name) => {
  if (name === 'tours') return false;
  const customExists = name === 'mapPins' && safeGetLocalStorage(customMapPinsKey) !== null;
  return safeGetLocalStorage(STORAGE_KEYS[name]) !== null || safeGetLocalStorage(legacyKeys[name]) !== null || customExists;
};

export const writeList = (name, value) => {
  if (name !== 'tours') {
    safeSetLocalStorage(STORAGE_KEYS[name], value);
    safeSetLocalStorage(legacyKeys[name], value);
    if (name === 'mapPins') safeSetLocalStorage('custom_map_pins', value);
  }
  window.dispatchEvent(new CustomEvent('app-data-updated', { detail: { name, value } }));
  if (name === 'tours') window.dispatchEvent(new Event('toursUpdated'));
  if (name === 'mapPins') window.dispatchEvent(new Event('mapUpdated'));
};

export const getInitialList = (name, fallback = []) => readList(name, fallback);
