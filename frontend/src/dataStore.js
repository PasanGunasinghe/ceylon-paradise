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

export const readList = (name, fallback = []) => {
  const keys = name === 'mapPins'
    ? [STORAGE_KEYS[name], legacyKeys[name], customMapPinsKey]
    : [STORAGE_KEYS[name], legacyKeys[name]];

  for (const key of keys) {
    const raw = localStorage.getItem(key);
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
  const customExists = name === 'mapPins' && localStorage.getItem(customMapPinsKey) !== null;
  return localStorage.getItem(STORAGE_KEYS[name]) !== null || localStorage.getItem(legacyKeys[name]) !== null || customExists;
};

export const writeList = (name, value) => {
  const serialized = JSON.stringify(value);
  localStorage.setItem(STORAGE_KEYS[name], serialized);
  localStorage.setItem(legacyKeys[name], serialized);
  if (name === 'mapPins') localStorage.setItem('custom_map_pins', serialized);
  window.dispatchEvent(new CustomEvent('app-data-updated', { detail: { name, value } }));
  if (name === 'tours') window.dispatchEvent(new Event('toursUpdated'));
  if (name === 'mapPins') window.dispatchEvent(new Event('mapUpdated'));
};

export const getInitialList = (name, fallback = []) => readList(name, fallback);
