import { Link } from 'react-router-dom';
import { getTourImage, normalizeTours } from '../api';

const fallbackImage = 'https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=1200&q=80';

export default function ToursPage({ tours = [], onBookNow, onCheckout }) {
  const liveTours = normalizeTours(tours).filter((tour) => tour && tour.title);
  return (
    <div className="page-shell pb-20">
      <section className="page-hero page-hero-tours small">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <p className="eyebrow">Packages & escapes</p>
          <h1>Find your ideal Sri Lankan journey</h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-200">Choose from culturally rich, luxury, scenic, and adventure-led tours designed around your pace and interests.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {liveTours.map((tour) => (
            <article key={tour.id} className="glass-card group overflow-hidden rounded-[2rem] border border-slate-700/60 bg-slate-800 shadow-xl shadow-slate-950/30 transition duration-300 hover:-translate-y-1 hover:shadow-emerald-950/30">
              <div className="relative overflow-hidden"><img src={getTourImage(tour) || fallbackImage} alt={tour.title} className="h-64 w-full object-cover transition duration-700 group-hover:scale-105" onError={(e) => { e.currentTarget.src = fallbackImage; }} /></div>
              <div className="p-6">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full border border-emerald-500/40 bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-300">{tour.category || 'Tour'}</span>
                </div>
                <h2 className="mt-4 text-2xl font-bold text-white">{tour.title}</h2>
                <p className="mt-2 text-sm text-slate-300">{tour.duration || 'Flexible duration'}</p>
                <p className="mt-3 text-slate-700">{tour.description || 'A thoughtfully curated itinerary designed around your travel style.'}</p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-200"><span className="rounded-full bg-slate-900 px-3 py-1">{tour.destination || 'Sri Lanka'}</span><span className="rounded-full border border-amber-400/40 bg-amber-500/20 px-3 py-1 text-amber-300">Tailor-made</span></div>
                <div className="mt-5">
                  <Link to={`/tours/${tour.id}`} className="block w-full rounded-full bg-emerald-500 px-4 py-3 text-center font-semibold text-white transition hover:bg-emerald-400">More Details</Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
