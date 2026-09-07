import { Link, useParams } from 'react-router-dom';
import { getTourImage } from '../api';

const fallbackImage = 'https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=1200&q=80';

export default function TourDetailPage({ tours = [], onBookNow }) {
  const { tourId } = useParams();
  const tour = tours.find((item) => String(item.id) === String(tourId));

  if (!tour) {
    return (
      <div className="page-shell">
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <p className="eyebrow justify-center">Package not found</p>
          <h1 className="mt-5 text-4xl font-black text-slate-900">This package is not available.</h1>
          <Link to="/tours" className="mt-8 inline-flex rounded-full bg-slate-900 px-6 py-3 font-semibold text-white">Back to tours</Link>
        </div>
      </div>
    );
  }

  const itinerary = tour.itinerary ? tour.itinerary.split(',').map((item) => item.trim()).filter(Boolean) : ['Arrival and welcome', 'Signature destination experience', 'Scenic farewell'];

  return (
    <div className="page-shell pb-20">
      <section className="max-w-7xl mx-auto px-4 py-10 md:py-14">
        <Link to="/tours" className="text-sm font-semibold text-emerald-700">← Back to all packages</Link>
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-lg">
            <img src={getTourImage(tour) || fallbackImage} alt={tour.title} className="h-[480px] w-full object-cover" onError={(e) => { e.currentTarget.src = fallbackImage; }} />
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-lg">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">{tour.category || 'Tour package'}</p>
            <h1 className="mt-4 text-4xl font-black text-slate-900">{tour.title}</h1>
            <p className="mt-3 text-slate-500">{tour.duration || 'Flexible duration'}</p>
            <p className="mt-6 text-slate-600">{tour.description || 'A beautifully curated route designed to offer unforgettable moments from arrival through departure.'}</p>

            <div className="mt-7 space-y-3 text-sm text-slate-600">
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"><span>Destination</span><strong className="text-slate-900">{tour.destination || 'Sri Lanka'}</strong></div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"><span>Availability</span><strong className="text-slate-900">{tour.availability || 'Available'}</strong></div>
            </div>

            <button onClick={() => onBookNow(tour)} className="mt-8 w-full rounded-full bg-slate-900 px-6 py-3.5 font-semibold text-white">Send inquiry</button>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-lg">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">Highlights</p>
            <h2 className="mt-2 text-3xl font-black text-slate-900">What’s included</h2>
            <ul className="mt-6 space-y-3 text-slate-600">
              <li>• Private airport transfers and local assistance</li>
              <li>• Handpicked stays with scenic views</li>
              <li>• Guided cultural and nature experiences</li>
              <li>• Flexible day-by-day itinerary planning</li>
            </ul>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-lg">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">Suggested route</p>
            <h2 className="mt-2 text-3xl font-black text-slate-900">Day-by-day</h2>
            <div className="mt-6 space-y-3">
              {itinerary.map((stop, index) => (
                <div key={stop} className="flex gap-4 rounded-2xl bg-slate-50 p-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">{index + 1}</div>
                  <div className="text-slate-700">{stop}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
