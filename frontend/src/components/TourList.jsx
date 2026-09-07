import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getTourImage } from '../api';

export default function TourList({ tours = [], onBookNow, onCheckout }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadTours = async () => {
      try {
        await api.getTours();
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadTours();
  }, []);

  if (loading && !tours.length) {
    return <div className="text-center py-10 text-slate-600">Loading tours...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-600">Error: {error}</div>;
  }

  return (
    <section className="max-w-7xl mx-auto px-4 py-16" id="tours">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-brand font-semibold">Featured Tours</p>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mt-2">Choose your next escape</h2>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {tours.map((tour) => (
          <article key={tour.id} className="bg-white rounded-3xl overflow-hidden shadow-lg border border-slate-100">
            <img
              src={getTourImage(tour) || 'https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=1200&q=80'}
              alt={tour.title}
              className="w-full h-56 object-cover"
            />
            <div className="p-6">
              <div className="flex justify-between items-center mb-3">
                <span className="bg-teal-100 text-brand text-xs font-semibold px-2 py-1 rounded-full">
                  {tour.category}
                </span>
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-2">{tour.title}</h3>
              <p className="text-sm text-slate-500 mb-3">{tour.duration}</p>
              <p className="text-slate-700 mb-5">{tour.description}</p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    const token = localStorage.getItem('ceylon_paradise_token');
                    if (!token) {
                      navigate('/login?next=/');
                      return;
                    }
                    onBookNow(tour);
                  }}
                  className="bg-brand hover:bg-brand-dark text-white font-semibold py-3 rounded-full transition-colors"
                >
                  Book
                </button>
                <button
                  onClick={() => {
                    const token = localStorage.getItem('ceylon_paradise_token');
                    if (!token) {
                      navigate('/login?next=/');
                      return;
                    }
                    onCheckout(tour);
                  }}
                  className="border border-slate-200 text-slate-700 font-semibold py-3 rounded-full transition-colors"
                >
                  Pay
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
