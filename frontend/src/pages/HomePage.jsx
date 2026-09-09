import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../theme.jsx';
import { useHeroCarousel } from '../heroCarousel';
import { useVideoPlaylist } from '../videoPlaylist';
import { api, getTourImage, normalizeTours } from '../api';

const heroImage = 'https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=2000&q=80';

const stats = [
  { label: 'Tailor-made journeys', value: '120+' },
  { label: 'Happy travellers', value: '18k' },
  { label: 'Average rating', value: '4.9/5' },
];

const trustBadges = ['Trusted local experts', 'Flexible custom plans', '24/7 on-trip support'];

const fallbackImage = 'https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=1200&q=80';

const imageWithFallback = (src) => src || fallbackImage;

export default function HomePage({ authUser, destinations = [], tours = [], onBookNow, onCheckout }) {
  const { activeVideoSlot, handleTimeUpdate, setVideoRef, switchToNextVideo, videoSources } = useVideoPlaylist();
  const [syncedDestinations, setSyncedDestinations] = useState(destinations);
  const [syncedTours, setSyncedTours] = useState(normalizeTours(tours));
  const destinationCards = syncedDestinations.filter((destination) => destination && destination.name).slice(0, 3);
  const tourCards = syncedTours.filter((tour) => tour && tour.title).slice(0, 3);
  const { t } = useTheme();
  const { activeDestination, visible: carouselVisible } = useHeroCarousel();

  useEffect(() => {
    const loadContent = async () => {
      try {
        const [tourData, destinationData] = await Promise.all([api.getTours(), api.getDestinations()]);
        setSyncedTours(normalizeTours(tourData));
        setSyncedDestinations(Array.isArray(destinationData) ? destinationData : []);
      } catch {
        setSyncedTours([]);
        setSyncedDestinations([]);
      }
    };

    loadContent();
    window.addEventListener('storage', loadContent);
    window.addEventListener('toursUpdated', loadContent);
    return () => {
      window.removeEventListener('storage', loadContent);
      window.removeEventListener('toursUpdated', loadContent);
    };
  }, []);

  return (
    <div className="page-shell">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.35),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(251,191,36,0.18),_transparent_30%)]" />
        {videoSources.map((source, slot) => (
          <video
            key={slot}
            ref={setVideoRef(slot)}
            src={source}
            autoPlay
            muted
            playsInline
            preload="auto"
            onTimeUpdate={(event) => handleTimeUpdate(slot, event)}
            onEnded={() => slot === activeVideoSlot && switchToNextVideo()}
            className={`will-change-transform transform-gpu translate-z-0 object-cover w-full h-full absolute inset-0 transition-opacity duration-1000 ease-in-out ${activeVideoSlot === slot ? 'z-10 opacity-100' : 'z-0 opacity-0'}`}
          >
            <track kind="captions" />
          </video>
        ))}
        <div className="absolute inset-0 z-20 bg-slate-900/50" />
        <div className="relative z-30 mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-100 backdrop-blur-md">
                {t.premiumEscapes}
              </span>
              <h1 className="mt-6 text-3xl sm:text-5xl lg:text-6xl font-black leading-tight text-white">
                {t.discoverCeylon}
              </h1>
              <p className="mt-5 max-w-xl text-lg text-slate-200">
                {t.routeSubtitle}
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link to="/tours" className="rounded-full bg-amber-400 px-6 py-3.5 font-semibold text-slate-900 shadow-lg shadow-amber-500/20 transition hover:-translate-y-0.5">
                  {t.exploreTours}
                </Link>
                <Link to="/destinations" className="rounded-full border border-white/30 bg-white/5 px-6 py-3.5 font-semibold text-white backdrop-blur-sm transition hover:bg-white/10">
                  {t.viewDestinations}
                </Link>
              </div>
              <div className="mt-8 grid sm:grid-cols-3 gap-4 max-w-xl">
                {stats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                    <p className="text-2xl font-black text-white">{stat.value}</p>
                    <p className="mt-1 text-sm text-slate-200">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div key={activeDestination.fileName} className="rounded-[2rem] border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur-xl">
              <img src={activeDestination.src} alt={`${activeDestination.title} landscape`} className={`h-[420px] w-full rounded-[1.5rem] object-cover transition-opacity duration-300 ${carouselVisible ? 'opacity-100' : 'opacity-0'}`} />
              <div key={`${activeDestination.fileName}-details`} className="mt-4 grid gap-3 rounded-[1.5rem] bg-slate-900/60 p-4 text-sm text-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Most loved escape</span>
                  <span className="font-semibold text-amber-300">From $220</span>
                </div>
                <p className="text-xl font-bold text-white">{activeDestination.title}</p>
                <div className="flex flex-wrap gap-2">
                  {trustBadges.map((badge) => (
                    <span key={badge} className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-200">
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="page-background-full overflow-x-hidden" style={{ backgroundImage: "url('/images/sigiriya.jpg')" }}>
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="mb-10 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">{t.destinations}</p>
            <h2 className="mt-3 text-3xl font-black text-slate-900 md:text-4xl">{t.travelMoments}</h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {destinationCards.map((destination) => (
            <div key={destination.id} className="group overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-lg shadow-slate-200/50 transition duration-300 hover:-translate-y-1 hover:shadow-xl">
              <img src={imageWithFallback(destination.image_url || destination.image)} alt={destination.name} className="h-72 w-full object-cover transition duration-500 group-hover:scale-105" onError={(e) => { e.currentTarget.src = fallbackImage; }} />
              <div className="p-6">
                <p className="text-sm text-slate-500">{destination.location || 'Sri Lanka'}</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">{destination.name}</h3>
                <p className="mt-3 text-slate-600">{destination.description || 'An iconic travel experience shaped by heritage, scenery, and unforgettable local culture.'}</p>
                <Link to={`/destinations/${destination.id}`} className="mt-5 inline-flex items-center font-semibold text-emerald-700">Explore destination →</Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-900/20 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">{t.tours}</p>
              <h2 className="mt-3 text-3xl font-black text-slate-900 md:text-4xl">{t.premiumEscapes}</h2>
            </div>
            <Link to="/tours" className="text-sm font-semibold text-slate-700 transition hover:text-emerald-700">{t.browseAll} →</Link>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tourCards.map((tour) => (
              <article key={tour.id} className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-lg shadow-slate-200/50">
                <img src={imageWithFallback(getTourImage(tour))} alt={tour.title} className="h-64 w-full object-cover" onError={(e) => { e.currentTarget.src = fallbackImage; }} />
                <div className="p-6">
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-800">{tour.category || 'Tour'}</span>
                  </div>
                  <h3 className="mt-4 text-xl font-bold text-slate-900">{tour.title}</h3>
                  <p className="mt-2 text-sm text-slate-500">{tour.duration || 'Flexible duration'}</p>
                  <p className="mt-3 text-slate-600">{tour.description || 'A thoughtfully designed itinerary tailored to your travel style and pace.'}</p>
                  <div className="mt-5">
                    <Link to={`/tours/${tour.id}`} className="block w-full rounded-full bg-emerald-500 px-4 py-3 text-center font-semibold text-white transition hover:bg-emerald-400">More Details</Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      </div>
    </div>
  );
}
