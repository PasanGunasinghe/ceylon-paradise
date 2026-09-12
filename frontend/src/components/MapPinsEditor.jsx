import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const markerIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function SelectedMarker({ value }) {
  const map = useMap();
  const [selectedPosition, setSelectedPosition] = useState(value || [7.8731, 80.7718]);

  useEffect(() => {
    if (value && value.length === 2) {
      setSelectedPosition(value);
      map.flyTo(value, map.getZoom() || 7, { duration: 0.8 });
    }
  }, [value, map]);

  return <Marker position={selectedPosition} icon={markerIcon}><Popup>Search result location</Popup></Marker>;
}

function SearchControl({ onSearch }) {
  const map = useMap();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = async (event) => {
    event.preventDefault();
    if (!query.trim()) return;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      setResults(data.slice(0, 5));
      if (data[0]) {
        const nextPosition = [Number(data[0].lat), Number(data[0].lon)];
        map.flyTo(nextPosition, 10, { duration: 0.9 });
        onSearch(nextPosition, data[0].display_name, data[0].name || data[0].display_name.split(',')[0]);
      }
    } catch (error) {
      console.error('Search error', error);
    }
  };

  return (
    <div className="leaflet-search-wrapper" style={{ position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)', zIndex: 500, width: 'min(360px, calc(100% - 24px))' }}>
      <form onSubmit={handleSearch} className="flex gap-2 rounded-full border border-slate-300 bg-white/95 p-2 shadow-lg backdrop-blur-sm">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search a place or landmark"
          className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-500"
        />
        <button type="submit" className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Find</button>
      </form>
      {results.length > 0 && (
        <div className="mt-2 max-h-40 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
          {results.map((result) => (
            <button key={result.place_id} type="button" onClick={() => { const position = [Number(result.lat), Number(result.lon)]; map.flyTo(position, 10, { duration: 0.8 }); onSearch(position, result.display_name, result.name || result.display_name.split(',')[0]); setResults([]); }} className="block w-full rounded-xl px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100">
              {result.display_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MapPinsEditor({ pinForm, setPinForm, mapPins = [], onSave, onDelete, onEdit, onReset }) {
  const [hasReset, setHasReset] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(
    pinForm.lat && pinForm.lng ? [Number(pinForm.lat), Number(pinForm.lng)] : [7.8731, 80.7718]
  );

  const safeMapPins = useMemo(() => mapPins.filter((pin) => Number.isFinite(Number(pin.lat)) && Number.isFinite(Number(pin.lng))), [mapPins]);

  useEffect(() => {
    const resetKey = 'custom_map_pins_reset_v2';
    if (!localStorage.getItem(resetKey)) {
      localStorage.removeItem('custom_map_pins');
      localStorage.removeItem('app_map_pins');
      localStorage.removeItem('ceylon_paradise_mapPins');
      localStorage.setItem(resetKey, 'true');
      onReset?.();
    }
    setHasReset(true);
  }, []);

  useEffect(() => {
    if (pinForm.lat && pinForm.lng) {
      setSelectedPosition([Number(pinForm.lat), Number(pinForm.lng)]);
    }
  }, [pinForm.lat, pinForm.lng]);

  const handleSearch = (position, title, locationName) => {
    setSelectedPosition(position);
    setPinForm((prev) => ({ ...prev, lat: position[0].toFixed(6), lng: position[1].toFixed(6), name: locationName || title.split(',')[0] || 'New destination' }));
  };

  return (
    <div className="space-y-5">
      {!hasReset && <div className="rounded-2xl bg-white p-4 text-sm text-slate-500">Preparing a fresh map pin workspace...</div>}
      <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
      <div className="rounded-3xl bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-xl font-bold text-slate-900">Interactive map picker</h3>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Search to place</span>
        </div>

        <div className="relative overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-100" style={{ height: '420px' }}>
          <MapContainer center={selectedPosition} zoom={7} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
            <SearchControl onSearch={handleSearch} />
            <SelectedMarker value={selectedPosition} />
            {safeMapPins.map((pin) => (
              <Marker key={pin.id || `${pin.name}-${pin.lat}-${pin.lng}`} position={[Number(pin.lat), Number(pin.lng)]} icon={markerIcon}>
                <Popup>
                  <div className="min-w-[180px] text-sm text-slate-700">
                    <div className="mb-2 font-bold text-slate-900">{pin.name}</div>
                    {(pin.image_url || pin.photo_url) && <img src={pin.image_url || pin.photo_url} alt={pin.name} className="mb-2 h-24 w-full rounded-xl object-cover" />}
                    <div>{pin.description || 'Saved destination'}</div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <h3 className="text-xl font-bold text-slate-900">Pin details</h3>
        <form onSubmit={onSave} className="mt-4 space-y-3">
          <input name="name" value={pinForm.name} onChange={(event) => setPinForm((prev) => ({ ...prev, [event.target.name]: event.target.value }))} placeholder="Pin name" className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3" required />
          <div className="grid grid-cols-2 gap-3">
            <input name="latitude" value={pinForm.lat} onChange={() => {}} readOnly placeholder="Latitude" className="w-full rounded-xl border border-slate-200 bg-slate-100 p-3 text-slate-700" />
            <input name="longitude" value={pinForm.lng} onChange={() => {}} readOnly placeholder="Longitude" className="w-full rounded-xl border border-slate-200 bg-slate-100 p-3 text-slate-700" />
          </div>
          <input name="dayNumber" type="number" min="1" value={pinForm.dayNumber || ''} onChange={(event) => setPinForm((prev) => ({ ...prev, dayNumber: event.target.value }))} placeholder="Day number (optional)" className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3" />
          <textarea name="description" value={pinForm.description} onChange={(event) => setPinForm((prev) => ({ ...prev, [event.target.name]: event.target.value }))} rows="4" placeholder="Pin description" className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3" />
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Pin photo</label>
            <input name="photo_url" value="" type="file" accept="image/*" onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => setPinForm((prev) => ({ ...prev, photo_url: reader.result }));
              reader.readAsDataURL(file);
            }} className="block w-full text-sm text-slate-600" />
          </div>
          {pinForm.photo_url && <img src={pinForm.photo_url} alt="Selected map pin" className="h-32 w-full rounded-xl object-cover" />}
          <div className="flex gap-3">
            <button type="submit" className="flex-1 rounded-full bg-brand px-5 py-3 font-semibold text-white">{pinForm.id ? 'Update pin' : 'Save pin'}</button>
            {pinForm.id && <button type="button" onClick={() => onDelete(pinForm.id)} className="rounded-full border border-rose-200 bg-rose-50 px-5 py-3 font-semibold text-rose-600">Delete pin</button>}
          </div>
        </form>
      </div>
      </div>

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <h3 className="text-xl font-bold text-slate-900">Saved Pins Data Table</h3>
          <p className="mt-1 text-sm text-slate-500">Search results saved by the admin appear here and on the public route planner.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
              <tr>
                <th className="px-5 py-3">Photo Preview</th>
                <th className="px-5 py-3">Pin Name</th>
                <th className="px-5 py-3">Coordinates (Lat, Lng)</th>
                <th className="px-5 py-3">Description Snippet</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {safeMapPins.length === 0 ? (
                <tr><td colSpan="5" className="px-5 py-8 text-center text-slate-500">No saved pins yet. Search for a location to begin.</td></tr>
              ) : safeMapPins.map((pin) => (
                <tr key={pin.id || `${pin.name}-${pin.lat}-${pin.lng}`} className="align-middle">
                  <td className="px-5 py-3">{(pin.image || pin.photo_url) ? <img src={pin.image || pin.photo_url} alt={pin.name} className="h-12 w-16 rounded-lg object-cover" /> : <span className="text-slate-400">No photo</span>}</td>
                  <td className="px-5 py-3 font-semibold text-slate-900">{pin.name}</td>
                  <td className="whitespace-nowrap px-5 py-3 text-slate-600">{Number(pin.lat).toFixed(6)}, {Number(pin.lng).toFixed(6)}</td>
                  <td className="max-w-xs px-5 py-3 text-slate-600">{pin.description || 'No description'}</td>
                  <td className="whitespace-nowrap px-5 py-3">
                    <button type="button" onClick={() => onEdit(pin)} className="mr-2 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white">Edit</button>
                    <button type="button" onClick={() => onDelete(pin.id)} className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
