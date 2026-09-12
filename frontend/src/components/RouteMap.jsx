import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import { Landmark, PawPrint, Waves } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getImageSource } from '../api';

const waypointIcon = (color) =>
  L.divIcon({
    className: 'custom-waypoint-icon',
    html: `<span style="display:block;width:16px;height:16px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 0 0 3px rgba(15,118,110,0.18);"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

const markerIconFor = (destination, index) => {
  const category = String(destination?.category || '').toLowerCase();
  const Icon = category.includes('beach') || category.includes('coast') ? Waves
    : category.includes('wild') || category.includes('nature') ? PawPrint
      : category.includes('histor') || category.includes('culture') ? Landmark : null;
  return Icon ? L.divIcon({ className: 'custom-waypoint-icon', html: `<span style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:${index === 0 ? '#0f766e' : '#f59e0b'};border:3px solid white;color:white;box-shadow:0 0 0 3px rgba(15,118,110,0.18)">${Icon === Waves ? 'W' : Icon === PawPrint ? 'N' : 'H'}</span>`, iconSize: [28, 28], iconAnchor: [14, 14] }) : waypointIcon(index === 0 ? '#0f766e' : index === 1 ? '#f59e0b' : '#14b8a6');
};

const placeCoordinates = {
  sigiriya: [7.9555, 80.7535],
  ella: [6.8667, 81.0464],
  galle: [6.0535, 80.2118],
  kandy: [7.2906, 80.6337],
  colombo: [6.9271, 79.8612],
  mirissa: [5.9484, 80.4588],
  yala: [6.3725, 81.5185],
};

const coordinatesFor = (destination, index) => {
  const latitude = Number(destination?.latitude ?? destination?.lat);
  const longitude = Number(destination?.longitude ?? destination?.lng ?? destination?.lon);
  if (Number.isFinite(latitude) && Number.isFinite(longitude) && !(latitude === 0 && longitude === 0)) {
    return [latitude, longitude];
  }

  const key = (destination?.name || destination?.location || '').toLowerCase();
  const found = Object.keys(placeCoordinates).find((place) => key.includes(place));
  return found ? placeCoordinates[found] : [7.2 + index * 0.2, 80.7];
};

const curvedRoute = (points) => points.slice(0, -1).flatMap((point, index) => {
  const next = points[index + 1];
  const latitudeOffset = (next[1] - point[1]) * 0.12;
  const longitudeOffset = (point[0] - next[0]) * 0.12;
  const control = [
    (point[0] + next[0]) / 2 + latitudeOffset,
    (point[1] + next[1]) / 2 + longitudeOffset,
  ];

  return Array.from({ length: 9 }, (_, step) => {
    const t = step / 8;
    const inverse = 1 - t;
    return [
      inverse * inverse * point[0] + 2 * inverse * t * control[0] + t * t * next[0],
      inverse * inverse * point[1] + 2 * inverse * t * control[1] + t * t * next[1],
    ];
  }).slice(index ? 1 : 0);
});

function MapRoute({ destinations = [], routeDestinations = [], searchCenter = null, focusDestination = null }) {
  const map = useMap();
  const markerRefs = useRef(new Map());

  useEffect(() => {
    if (searchCenter) {
      map.flyTo(searchCenter, 9, { duration: 1.1 });
    }
  }, [map, searchCenter]);

  useEffect(() => {
    if (!focusDestination) return;
    const destinationIndex = destinations.findIndex((destination) => destination.id === focusDestination.id || destination.name === focusDestination.name);
    if (destinationIndex < 0) return;
    const destination = destinations[destinationIndex];
    const position = coordinatesFor(destination, destinationIndex);
    const markerKey = destination.id || `${destination.name}-${position.join('-')}`;
    map.flyTo(position, 9, { duration: 1.1 });
    markerRefs.current.get(markerKey)?.openPopup();
  }, [destinations, focusDestination, map]);

  const routePoints = useMemo(() => (routeDestinations.length > 1 ? routeDestinations : []), [routeDestinations]);
  const routeCoordinates = useMemo(() => routePoints.map((destination, index) => coordinatesFor(destination, index)), [routePoints]);
  const smoothRoute = useMemo(() => curvedRoute(routeCoordinates), [routeCoordinates]);
  const mapCenter = useMemo(() => searchCenter || (routeCoordinates.length ? routeCoordinates[Math.floor(routeCoordinates.length / 2)] : [7.2, 80.7]), [routeCoordinates, searchCenter]);

  useEffect(() => {
    if (!searchCenter && routeCoordinates.length) {
      map.setView(mapCenter, 7);
    }
  }, [map, mapCenter, routeCoordinates.length, searchCenter]);

  return (
    <>
      {destinations.slice(0, 5).map((destination, index) => {
        const position = coordinatesFor(destination, index);
        const imageUrl = getImageSource(destination);

        return (
              <Marker
                ref={(marker) => marker && markerRefs.current.set(destination.id || `${destination.name}-${position.join('-')}`, marker)}
                key={destination.id || `${destination.name}-${position.join('-')}`}
                position={position}
                icon={markerIconFor(destination, index)}
              >
            <Popup>
              <div className="min-w-[180px] text-sm text-slate-700">
                {imageUrl && <img src={imageUrl} alt={destination.name} className="mb-2 h-24 w-full rounded-xl object-cover" />}
                <strong className="block text-base text-slate-900">{destination.name}</strong>
                <p className="mt-1 text-slate-600">{destination.location || destination.description || 'Sri Lanka'}</p>
                {destination.description && <p className="mt-2 text-slate-700">{destination.description}</p>}
              </div>
            </Popup>
          </Marker>
        );
      })}

      {smoothRoute.length > 1 && (
        <>
          <Polyline positions={smoothRoute} pathOptions={{ color: '#fbbf24', weight: 9, opacity: 0.24, lineCap: 'round', lineJoin: 'round' }} />
          <Polyline positions={smoothRoute} pathOptions={{ color: '#0f766e', weight: 4, opacity: 0.92, dashArray: '1 9', lineCap: 'round', lineJoin: 'round' }} />
        </>
      )}
    </>
  );
}

export default function RouteMap({ destinations = [], routeDestinations = [], searchCenter = null, focusDestination = null }) {
  const routePoints = useMemo(() => (routeDestinations.length ? routeDestinations : destinations.slice(0, 5)), [destinations, routeDestinations]);
  const routeCoordinates = useMemo(() => routePoints.map((destination, index) => coordinatesFor(destination, index)), [routePoints]);
  const mapCenter = useMemo(() => searchCenter || (routeCoordinates.length ? routeCoordinates[Math.floor(routeCoordinates.length / 2)] : [7.2, 80.7]), [routeCoordinates, searchCenter]);

  return (
    <div className="rounded-[2rem] overflow-hidden border border-slate-700/60 shadow-xl bg-slate-800">
      <div className="px-6 py-5 border-b border-slate-700/60 bg-slate-800 text-white">
        <p className="text-sm uppercase tracking-[0.2em] text-brand font-semibold">Route planner</p>
        <h3 className="mt-2 text-2xl font-bold text-white">Ceylon highlights in one journey</h3>
      </div>

      <div className="h-[420px] w-full">
        <MapContainer center={mapCenter} zoom={7} scrollWheelZoom={false} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapRoute destinations={destinations} routeDestinations={routeDestinations} searchCenter={searchCenter} focusDestination={focusDestination} />
        </MapContainer>
      </div>
    </div>
  );
}
