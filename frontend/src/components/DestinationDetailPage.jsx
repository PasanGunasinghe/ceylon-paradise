import { Link, useParams } from 'react-router-dom';
import { getImageSource, getTourImage } from '../api';
import ReviewSection from './ReviewSection';
import RouteMap from './RouteMap';

const defaultActivities = [
  'Scenic drives and guided tours',
  'Cultural heritage experiences',
  'Sunset viewpoints and photo stops',
  'Local food and village experiences',
];

const normalizeRouteParam = (value = '') => String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export default function DestinationDetailPage({ destinations = [], tours = [], onBookNow }) {
  const { destinationId } = useParams();
  const destination = destinations.find((item) => {
    const candidates = [String(item.id), normalizeRouteParam(item.name), normalizeRouteParam(item.location), normalizeRouteParam(item.slug || '')];
    return candidates.includes(String(destinationId)) || candidates.includes(normalizeRouteParam(destinationId));
  });

  const relatedTours = tours.filter((tour) => {
    const destinationName = (destination?.name || '').toLowerCase();
    const location = (destination?.location || '').toLowerCase();
    const tourDestination = (tour.destination || '').toLowerCase();
    return (
      tourDestination.includes(destinationName) ||
      tourDestination.includes(location) ||
      destinationName.includes((tour.destination || '').toLowerCase()) ||
      (destination?.name && tour.title.toLowerCase().includes(destination.name.toLowerCase()))
    );
  });

  if (!destination) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-brand font-semibold">Destination not found</p>
          <h1 className="text-4xl font-bold text-slate-900 mt-4">That destination does not exist.</h1>
          <Link to="/destinations" className="mt-6 inline-block bg-brand text-white px-5 py-3 rounded-full font-semibold">
            Back to destinations
          </Link>
        </div>
      </div>
    );
  }

  const activities = Array.isArray(destination.activities)
    ? destination.activities
    : String(destination.activities || '').split(',').map((item) => item.trim()).filter(Boolean).length
      ? String(destination.activities).split(',').map((item) => item.trim()).filter(Boolean)
      : defaultActivities;
  const weather = destination.weather || 'Warm and tropical';
  const bestTime = destination.best_time || 'December to April';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <Link to="/destinations" className="inline-flex items-center text-brand font-semibold mb-8">
          ← Back to all destinations
        </Link>

        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-start">
          <div className="overflow-hidden rounded-[2rem] shadow-xl border border-slate-200 bg-white">
            <img src={getImageSource(destination) || '/images/sigiriya.jpg'} alt={destination.name} className="w-full h-[520px] object-cover" />
          </div>

          <div className="bg-white rounded-[2rem] p-8 shadow-lg border border-slate-200">
            <p className="text-sm uppercase tracking-[0.2em] text-brand font-semibold">Destination</p>
            <h1 className="text-4xl font-black text-slate-900 mt-3">{destination.name}</h1>
            <p className="text-lg text-slate-500 mt-3">{destination.location}</p>
            <p className="mt-5 text-slate-600 leading-7">{destination.description}</p>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-700 bg-slate-800 p-4 text-slate-100">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Weather</p>
                <p className="mt-2 font-semibold text-slate-100">{weather}</p>
              </div>
              <div className="rounded-2xl border border-slate-700 bg-slate-800 p-4 text-slate-100">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Best time to visit</p>
                <p className="mt-2 font-semibold text-slate-100">{bestTime}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mt-14">
          <div className="bg-white rounded-[2rem] p-8 shadow-lg border border-slate-200">
            <p className="text-sm uppercase tracking-[0.2em] text-brand font-semibold">Highlights</p>
            <h2 className="text-2xl font-bold text-slate-900 mt-3">Popular experiences</h2>
            <ul className="mt-6 space-y-3 text-slate-600">
              {activities.map((activity) => (
                <li key={activity} className="flex items-start gap-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-brand inline-block" />
                  <span>{activity}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-[2rem] p-8 shadow-lg border border-slate-200">
            <p className="text-sm uppercase tracking-[0.2em] text-brand font-semibold">Travel notes</p>
            <h2 className="text-2xl font-bold text-slate-900 mt-3">Ideal for</h2>
            <div className="mt-6 space-y-4 text-slate-600">
              {(Array.isArray(destination.ideal_for) ? destination.ideal_for : String(destination.ideal_for || 'Couples, Families, Solo travellers, Wildlife and heritage enthusiasts').split(',').map((item) => item.trim()).filter(Boolean)).map((note) => (
                <p key={note}>• {note}</p>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-16">
          <RouteMap destinations={destinations} />
        </div>

        <section className="mt-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-brand font-semibold">Tours available</p>
              <h2 className="text-3xl font-bold text-slate-900 mt-2">Packages for this destination</h2>
            </div>
          </div>

          {relatedTours.length === 0 ? (
            <div className="bg-white rounded-[2rem] p-8 shadow-lg border border-slate-200 text-slate-600">
              No tour packages are currently mapped to this destination.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
              {relatedTours.map((tour) => (
                <article key={tour.id} className="bg-white rounded-[2rem] overflow-hidden shadow-lg border border-slate-200">
                  <img src={getTourImage(tour) || getImageSource(destination) || '/images/sigiriya.jpg'} alt={tour.title} className="w-full h-56 object-cover" />
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-3">
                      <span className="bg-teal-100 text-brand text-xs font-semibold px-2 py-1 rounded-full">{tour.category}</span>
                      <span className="text-xl font-bold text-slate-900">${Number(tour.price).toFixed(2)}</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">{tour.title}</h3>
                    <p className="text-sm text-slate-500 mt-2">{tour.duration}</p>
                    <p className="text-slate-600 mt-4">{tour.description}</p>
                    <button
                      onClick={() => onBookNow(tour)}
                      className="mt-6 w-full bg-brand text-white font-semibold py-3 rounded-full"
                    >
                      Book this tour
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {relatedTours[0] && <div className="mt-16"><ReviewSection tourId={relatedTours[0].id} /></div>}
      </div>
    </div>
  );
}
