import { memo } from 'react';
import { useHeroCarousel } from '../heroCarousel';
import { useVideoPlaylist } from '../videoPlaylist';

function Hero() {
  const { activeVideoSlot, handleTimeUpdate, setVideoRef, switchToNextVideo, videoSources } = useVideoPlaylist();
  const { activeDestination, visible: carouselVisible } = useHeroCarousel();

  return (
    <section className="relative overflow-hidden bg-slate-950 text-white">
      {videoSources.map((source, slot) => (
        <video
          key={slot}
          ref={setVideoRef(slot)}
          src={source}
          autoPlay
          muted
          playsInline
          preload={slot === activeVideoSlot ? 'auto' : slot === 1 - activeVideoSlot ? 'metadata' : 'none'}
          onTimeUpdate={(event) => handleTimeUpdate(slot, event)}
          onEnded={() => slot === activeVideoSlot && switchToNextVideo()}
          className={`will-change-transform transform-gpu translate-z-0 object-cover w-full h-full absolute inset-0 transition-opacity duration-1000 ease-in-out ${activeVideoSlot === slot ? 'z-10 opacity-100' : 'z-0 opacity-0'}`}
        >
          <track kind="captions" />
        </video>
      ))}
      <div className="absolute inset-0 z-20 bg-slate-900/50" />
      <div className="relative z-30 mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-24 md:grid-cols-2 lg:px-8">
        <div>
          <p className="inline-block bg-white/10 border border-white/20 px-3 py-1 rounded-full text-sm mb-5">
            Discover Sri Lanka with us
          </p>
          <h1 className="mb-6 text-3xl font-black leading-tight sm:text-5xl lg:text-6xl">
            Curated journeys through the heart of Ceylon.
          </h1>
          <p className="text-lg text-teal-50 max-w-xl mb-8">
            Explore ancient ruins, lush tea hills, golden beaches, and unforgettable cultural moments with our expertly guided trips.
          </p>
          <div className="flex flex-wrap gap-4">
            <button className="bg-white text-brand px-6 py-3 rounded-full font-semibold hover:bg-slate-100 transition-colors">
              Explore Tours
            </button>
            <button className="border border-white/60 text-white px-6 py-3 rounded-full font-semibold hover:bg-white/10 transition-colors">
              View Destinations
            </button>
          </div>
        </div>

        <div className="relative">
          <div key={activeDestination.fileName} className="rounded-3xl overflow-hidden shadow-2xl ring-8 ring-white/10">
            <img src={activeDestination.src} alt={`${activeDestination.title} landscape`} className={`w-full h-[500px] object-cover transition-opacity duration-300 ${carouselVisible ? 'opacity-100' : 'opacity-0'}`} />
          </div>
          <div key={`${activeDestination.fileName}-details`} className="absolute -bottom-6 left-6 bg-white text-slate-800 p-4 rounded-2xl shadow-xl">
            <p className="text-sm text-slate-500">Popular escape</p>
            <p className="text-xl font-bold">{activeDestination.title}</p>
            <p className="text-brand font-semibold">From $220</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default memo(Hero);
