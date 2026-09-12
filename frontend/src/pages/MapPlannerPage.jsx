import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import MapPlanner from '../components/MapPlanner';
import { API_BASE_URL } from '../api';
import { writeList } from '../dataStore';
import { apiClient } from '../services/api';

export default function MapPlannerPage({ destinations = [] }) {
  const [mapPins, setMapPins] = useState([]);
  const [focusedStop, setFocusedStop] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [submitMessage, setSubmitMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const routeDestinations = useMemo(() => destinations.slice(0, 3), [destinations]);
  const routeStops = useMemo(() => (mapPins.length ? mapPins : routeDestinations).map((pin, index) => ({ ...pin, id: pin.id ?? `${pin.name || pin.title}-${index}` })), [mapPins, routeDestinations]);
  const selectedStops = useMemo(() => routeStops.map((pin, index) => ({ id: pin.id, name: pin.name || pin.title, days: pin.dayNumber ? `Day ${pin.dayNumber}` : `Day ${index + 1}`, note: pin.description || pin.details || 'Pinned destination' })), [routeStops]);
  const selectedRoute = useMemo(() => selectedIds.map((id) => routeStops.find((pin) => pin.id === id)).filter(Boolean), [routeStops, selectedIds]);

  const toggleStop = useCallback((id) => setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]), []);
  const submitRoute = async () => {
    const token = localStorage.getItem('ceylon_paradise_token');
    if (!token) { window.location.href = '/login?next=/map-planner'; return; }
    if (!selectedRoute.length) { setSubmitMessage('Select at least one destination first.'); return; }
    setIsSubmitting(true);
    try {
      await apiClient.submitCustomRoute({ route: selectedRoute.map((pin) => pin.name || pin.title), stops: selectedRoute }, token);
      setSubmitMessage('Route request sent to our travel team.');
    } catch (error) { setSubmitMessage(error.message); } finally { setIsSubmitting(false); }
  };

  useEffect(() => {
    const loadPins = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/mappins`);
        if (!response.ok) return;
        const data = await response.json();
        const validPins = Array.isArray(data) ? data.filter((pin) => Number(pin.latitude ?? pin.lat) !== 0 && Number(pin.longitude ?? pin.lng) !== 0) : [];
        setMapPins(validPins);
        writeList('mapPins', validPins);
      } catch (error) {
        console.error('Failed to load map pins', error);
      }
    };

    loadPins();
  }, []);

  return (
    <div className="page-shell page-background-full pb-20" style={{ backgroundImage: "url('/images/ella.jpg')" }}>
      <section className="page-hero page-hero-map small">
        <div className="content-container mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <p className="eyebrow">Route planner</p>
          <h1>Build your Ceylon itinerary</h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-200">Map your ideal route through heritage trails, scenic highlands, and coastal charms.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="min-w-0">
            <MapPlanner destinations={routeStops} orderedRoute={selectedRoute} focusDestination={focusedStop} />
          </div>

          <div className="space-y-4">
            <div className="mb-4 rounded-2xl border border-emerald-400/30 bg-emerald-950/40 p-4 text-white">
              <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-bold">Select Your Route / Itinerary</h2><span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-slate-950">Selected Destinations: {selectedRoute.length}</span></div>
              <p className="mt-2 text-sm text-emerald-100">Choose destinations in the order you want to visit them.</p>
            </div>
            {selectedStops.map((stop) => (
              <div key={stop.id} className="glass-card block w-full rounded-[1.5rem] border border-slate-700/60 bg-slate-800 p-5 text-left shadow-xl shadow-slate-950/30">
                <label className="flex cursor-pointer items-start gap-3">
                  <input type="checkbox" checked={selectedIds.includes(stop.id)} onChange={() => toggleStop(stop.id)} className="mt-1 h-4 w-4 accent-emerald-500" />
                  <span>
                <h3 className="mt-4 text-xl font-bold text-white">{stop.name}</h3>
                <p className="mt-2 text-slate-700">{stop.note}</p>
                  </span>
                </label>
                <button type="button" onClick={() => setFocusedStop(stop)} className="mt-3 text-sm font-semibold text-emerald-300">Focus on map</button>
              </div>
            ))}

            <button type="button" onClick={submitRoute} disabled={isSubmitting} className="w-full rounded-full bg-amber-400 px-5 py-3 font-semibold text-slate-950 disabled:opacity-60">{isSubmitting ? 'Sending route...' : 'Send selected route'}</button>
            {submitMessage && <p role="status" className="text-sm text-slate-200">{submitMessage}</p>}

            <Link to="/destinations" className="mt-4 inline-flex rounded-full bg-slate-900 px-5 py-3 font-semibold text-white">Browse all destinations</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
