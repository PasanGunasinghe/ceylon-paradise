import { useEffect, useMemo, useState } from 'react';
import RouteMap from './RouteMap';
import { api } from '../api';
import { getInitialList } from '../dataStore';

export default function MapPlanner({ destinations = [], orderedRoute = [], focusDestination = null }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchCenter, setSearchCenter] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [customPins, setCustomPins] = useState(() => getInitialList('mapPins'));
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadCustomPins = () => {
      api.getMapPins().then((pins) => { setCustomPins(Array.isArray(pins) ? pins : []); setIsLoading(false); }).catch(() => { setCustomPins([]); setIsLoading(false); });
    };

    loadCustomPins();
    const onAppDataUpdated = (event) => {
      if (event.detail?.name === 'mapPins') loadCustomPins();
    };
    window.addEventListener('custom-map-pins-updated', loadCustomPins);
    window.addEventListener('app-data-updated', onAppDataUpdated);
    window.addEventListener('mapUpdated', loadCustomPins);
    window.addEventListener('storage', loadCustomPins);
    return () => {
      window.removeEventListener('custom-map-pins-updated', loadCustomPins);
      window.removeEventListener('app-data-updated', onAppDataUpdated);
      window.removeEventListener('mapUpdated', loadCustomPins);
      window.removeEventListener('storage', loadCustomPins);
    };
  }, []);

  const mapDestinations = useMemo(() => {
    const validDestinations = destinations.filter((destination) => {
      const latitude = Number(destination.latitude ?? destination.lat);
      const longitude = Number(destination.longitude ?? destination.lng ?? destination.lon);
      return Number.isFinite(latitude) && Number.isFinite(longitude) && latitude !== 0 && longitude !== 0;
    });
    const existingKeys = new Set(validDestinations.map((destination) => `${destination.name}-${destination.lat || ''}-${destination.lng || destination.lon || ''}`));
    const newPins = customPins.filter((pin) => {
      const lat = Number(pin.latitude ?? pin.lat);
      const lng = Number(pin.longitude ?? pin.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat === 0 || lng === 0) return false;
      const key = `${pin.name}-${lat}-${lng}`;
      return !existingKeys.has(key);
    });
    return [...validDestinations, ...newPins];
  }, [customPins, destinations]);

  const handleSearch = async (event) => {
    event.preventDefault();
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(searchTerm)}`
      );
      const results = await response.json();
      const selected = results?.[0];

      if (selected) {
        setSearchCenter([Number(selected.lat), Number(selected.lon)]);
      }
    } catch (error) {
      console.error('Location search failed', error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex flex-col gap-3 rounded-[1.5rem] border border-slate-700/60 bg-slate-800 p-4 shadow-xl shadow-slate-950/20 md:flex-row">
        <input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search destination, city, or landmark"
          className="flex-1 rounded-full border border-slate-600 bg-slate-900 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none"
        />
        <button type="submit" className="rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400">
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </form>

      {isLoading && <p className="rounded-2xl border border-slate-700 bg-slate-800 p-4 text-sm text-slate-300">Loading saved map pins...</p>}
      {!isLoading && mapDestinations.length === 0 && <p className="rounded-2xl border border-slate-700 bg-slate-800 p-4 text-sm text-slate-300">No saved map pins yet. Search for a destination to explore the map.</p>}
      <RouteMap destinations={mapDestinations} routeDestinations={orderedRoute} searchCenter={searchCenter} focusDestination={focusDestination} />
    </div>
  );
}
