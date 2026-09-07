import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

const readBookings = () => {
  try {
    return JSON.parse(localStorage.getItem('ceylon_paradise_bookings') || '[]');
  } catch {
    return [];
  }
};

const syncBookingInquiry = (booking) => {
  const current = readBookings();
  const next = [booking, ...current].slice(0, 200);
  localStorage.setItem('ceylon_paradise_bookings', JSON.stringify(next));

  const inquiry = {
    id: booking.id || Date.now(),
    name: booking.user_name,
    email: booking.user_email,
    type: 'booking',
    status: 'Pending',
    travelers: Number(booking.guests || 1),
    route: booking.tour_title ? [booking.tour_title] : ['Custom inquiry'],
    notes: booking.notes || 'Booking inquiry submitted from the website.',
    created_at: booking.created_at || new Date().toISOString(),
  };

  const currentInquiries = JSON.parse(localStorage.getItem('ceylon_paradise_inquiries') || '[]');
  localStorage.setItem('ceylon_paradise_inquiries', JSON.stringify([inquiry, ...currentInquiries]));
  window.dispatchEvent(new Event('cp-bookings-updated'));
};

export default function BookingForm({ selectedTour, onClose }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    user_name: '',
    user_email: '',
    tour_id: selectedTour?.id || '',
    date: '',
    notes: '',
  });

  const [status, setStatus] = useState({ type: '', message: '' });

  useEffect(() => {
    const handleKeyDown = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const token = localStorage.getItem('ceylon_paradise_token');

    if (!token) {
      navigate('/login?next=/');
      return;
    }

    setStatus({ type: 'loading', message: 'Submitting your request...' });

    const bookingRecord = {
      id: Date.now(),
      user_name: formData.user_name,
      user_email: formData.user_email,
      tour_id: Number(formData.tour_id || selectedTour?.id || 0),
      tour_title: selectedTour?.title || 'Custom itinerary',
      date: formData.date,
      notes: formData.notes,
      guests: 1,
      status: 'pending',
      payment_status: 'pending',
      payment_method: 'credit-card',
      total_amount: Number(selectedTour?.price || 0),
      created_at: new Date().toISOString(),
    };

    try {
      try {
        await api.submitBooking({
          ...formData,
          tour_id: Number(formData.tour_id || selectedTour?.id || 0),
          guests: 1,
          payment_method: 'credit-card',
          payment_status: 'pending',
          total_amount: Number(selectedTour?.price || 0),
        });
      } catch (error) {
        console.warn('Booking API not available, saved locally instead:', error);
      }

      syncBookingInquiry(bookingRecord);
      setStatus({ type: 'success', message: 'Booking inquiry submitted successfully.' });
      setFormData({
        user_name: '',
        user_email: '',
        tour_id: selectedTour?.id || '',
        date: '',
        notes: '',
      });
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Unable to submit booking inquiry.' });
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-brand font-semibold">Booking</p>
            <h3 className="text-2xl font-bold text-slate-900">Reserve your trip</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Close booking dialog" className="text-slate-500 hover:text-slate-800 text-2xl">✕</button>
        </div>

        {selectedTour && (
          <div className="mb-5 rounded-2xl bg-slate-800 text-white p-4 border border-slate-700">
            <p className="text-sm text-slate-300">Selected Tour</p>
            <p className="text-lg font-bold text-white">{selectedTour.title}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <input
              type="text"
              name="user_name"
              value={formData.user_name}
              onChange={handleChange}
              placeholder="Full name"
              className="border border-slate-200 rounded-xl p-3 w-full"
              required
            />
            <input
              type="email"
              name="user_email"
              value={formData.user_email}
              onChange={handleChange}
              placeholder="Email address"
              className="border border-slate-200 rounded-xl p-3 w-full"
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <input
              type="number"
              name="tour_id"
              value={formData.tour_id}
              onChange={handleChange}
              placeholder="Tour ID"
              className="border border-slate-200 rounded-xl p-3 w-full"
              required
            />
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="border border-slate-200 rounded-xl p-3 w-full"
              required
            />
          </div>

          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="4"
            placeholder="Tell us about your preferences or travel needs"
            className="border border-slate-200 rounded-xl p-3 w-full"
          />

          {status.message && (
            <p
              className={`text-sm ${
                status.type === 'success'
                  ? 'text-emerald-600'
                  : status.type === 'error'
                    ? 'text-red-600'
                    : 'text-slate-600'
              }`}
            >
              {status.message}
            </p>
          )}

          <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 border border-slate-200 text-slate-700 font-semibold px-5 py-3 rounded-full">Cancel</button>
          <button
            type="submit"
            disabled={status.type === 'loading'}
            className="flex-1 bg-brand hover:bg-brand-dark text-white font-semibold px-5 py-3 rounded-full transition-colors disabled:opacity-60"
          >
            {status.type === 'loading' ? 'Submitting...' : 'Submit Booking Inquiry'}
          </button>
          </div>
        </form>
      </div>
    </div>
  );
}
