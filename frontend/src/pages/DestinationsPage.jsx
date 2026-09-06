import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api, getImageSource } from '../api';

const fallbackImage = 'https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=1200&q=80';

export default function DestinationsPage({ destinations = [] }) {
  const [liveDestinations, setLiveDestinations] = useState(destinations);
  useEffect(() => {
    api.getDestinations().then((data) => setLiveDestinations(Array.isArray(data) ? data.filter((destination) => destination && destination.name) : [])).catch(() => setLiveDestinations(destinations.filter((destination) => destination && destination.name)));
  }, [destinations]);
  return (
    <div className="page-shell page-background-full pb-20" style={{ backgroundImage: "url('/images/sigiriya.jpg')" }}>
      <section className="page-hero page-hero-destinations small">
        <div className="content-container mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <p className="eyebrow">Curated destinations</p>
          <h1>Where your journey begins</h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-200">Explore heritage cities, safari trails, sea cliffs, and mountain escapes crafted for meaningful travel.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {liveDestinations.map((destination) => (
            <div key={destination.id} className="glass-card group overflow-hidden rounded-[2rem] border border-slate-700/60 bg-slate-800 shadow-xl shadow-slate-950/30 transition duration-300 hover:-translate-y-1 hover:shadow-emerald-950/30">
              <img src={getImageSource(destination) || fallbackImage} alt={destination.name} className="h-72 w-full object-cover transition duration-500 group-hover:scale-105" onError={(e) => { e.currentTarget.src = fallbackImage; }} />
              <div className="p-6">
                <p className="text-sm uppercase tracking-[0.2em] text-emerald-300">{destination.location || 'Sri Lanka'}</p>
                <h2 className="mt-3 text-2xl font-bold text-white">{destination.name}</h2>
                <p className="mt-3 text-slate-300">{destination.description || 'Discover the spirit of this beautiful region through immersive local experiences.'}</p>
                <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-slate-200">
                  <span className="rounded-full border border-amber-400/40 bg-amber-500/20 px-3 py-1 text-amber-300">Heritage escape</span>
                  <span className="rounded-full border border-emerald-500/40 bg-emerald-500/20 px-3 py-1 text-emerald-300">Local guide available</span>
                </div>
                <Link to={`/destinations/${destination.id}`} className="mt-5 inline-flex rounded-full bg-emerald-500 px-4 py-2.5 font-semibold text-white transition hover:bg-emerald-400">More Details</Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
