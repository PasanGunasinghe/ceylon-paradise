import { useEffect, useState } from 'react';
import { api, getImageSource } from '../api';
import { getInitialList, writeList } from '../dataStore';

const fallbackImage = 'https://images.unsplash.com/photo-1534177616072-ef7dc120449d?auto=format&fit=crop&w=1200&q=80';

export default function GalleryPage() {
  const [memories, setMemories] = useState(() => getInitialList('gallery'));

  useEffect(() => {
    const loadMemories = async () => {
      try {
        const data = await api.getMemories();
        if (!Array.isArray(data)) return;
        setMemories(data.filter((memory) => memory.pinned !== false).slice(0, 9));
        writeList('gallery', data);
      } catch (error) {
        setMemories([]);
      }
    };

    loadMemories();
    const updateGallery = (event) => {
      if (!event.detail || event.detail.name === 'gallery') loadMemories();
    };
    window.addEventListener('app-data-updated', updateGallery);
    window.addEventListener('storage', updateGallery);
    return () => {
      window.removeEventListener('app-data-updated', updateGallery);
      window.removeEventListener('storage', updateGallery);
    };
  }, []);

  const galleryShots = memories.length ? memories.map(getImageSource).filter(Boolean) : [];

  return (
    <div className="page-shell page-background-full pb-20" style={{ backgroundImage: "url('/images/kandy.jpg')" }}>
      <section className="page-hero page-hero-gallery small">
        <div className="content-container mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <p className="eyebrow">Moments captured</p>
          <h1>Gallery & memories</h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-200">A glimpse into the landscapes, people, and extraordinary experiences that define a Ceylon journey.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {galleryShots.length === 0 ? (
            <div className="col-span-full text-center text-slate-500">No pinned memories available yet.</div>
          ) : (
            galleryShots.map((image, index) => (
              <div key={image + index} className="glass-card group relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-lg shadow-slate-200/50">
                <img src={image} alt={`Travel memory ${index + 1}`} className="h-80 w-full object-cover transition duration-500 group-hover:scale-105" onError={(e) => { e.currentTarget.src = fallbackImage; }} />
                <span className="absolute bottom-4 left-4 rounded-full bg-slate-950/70 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">Ceylon memory {index + 1}</span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
