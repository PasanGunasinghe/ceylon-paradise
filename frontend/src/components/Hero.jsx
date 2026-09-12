import { memo, useEffect, useRef } from 'react';
import { useHeroCarousel } from '../heroCarousel';
import { videoPlaylist } from '../videoPlaylist';

function Hero() {
  const { activeDestination, visible: carouselVisible } = useHeroCarousel();
  const videoRef = useRef(null);
  const videoIndexRef = useRef(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    video.src = videoPlaylist[videoIndexRef.current];
    video.load();
    video.play().catch(() => {});

    return () => {
      video.pause();
      video.removeAttribute('src');
      video.load();
    };
  }, []);

  const advanceVideo = () => {
    const video = videoRef.current;
    if (!video) return;

    videoIndexRef.current = (videoIndexRef.current + 1) % videoPlaylist.length;
    const nextSource = videoPlaylist[videoIndexRef.current];
    if (video.currentSrc.endsWith(nextSource) || video.src.endsWith(nextSource)) return;

    video.src = nextSource;
    video.load();
    video.play().catch(() => {});
  };

  return (
    <section className="relative overflow-hidden bg-slate-950 text-white">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        preload="none"
        onEnded={advanceVideo}
        className="will-change-transform transform-gpu translate-z-0 object-cover w-full h-full absolute inset-0 z-10 opacity-100"
      >
        <track kind="captions" />
      </video>
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
