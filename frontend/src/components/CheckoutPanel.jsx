import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../api';

export default function CheckoutPanel({ tour, onClose }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [booking, setBooking] = useState({
    date: '',
    guests: 2,
    contactName: '',
    email: '',
    phone: '',
    paymentMethod: 'credit-card',
    notes: '',
  });
  const [status, setStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmation, setConfirmation] = useState(null);

  useEffect(() => {
    const handleKeyDown = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const total = useMemo(() => Number(tour?.price || 0) * Number(booking.guests || 1), [tour, booking.guests]);

  const updateField = (field, value) => {
    setBooking((prev) => ({ ...prev, [field]: value }));
  };

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 5));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleCheckout = async () => {
    const token = localStorage.getItem('ceylon_paradise_token');
    if (!token) {
      navigate('/login?next=/');
      return;
    }

    setIsProcessing(true);
    setStatus('');

    try {
      const payload = {
        user_name: booking.contactName,
        user_email: booking.email,
        tour_id: tour.id,
        date: booking.date,
        notes: booking.notes,
        guests: Number(booking.guests),
        payment_method: booking.paymentMethod,
        payment_status: booking.paymentMethod === 'pay-on-arrival' ? 'pending' : 'paid',
        total_amount: total,
      };

      const response = await fetch(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to book tour');

      setConfirmation(data.booking || payload);
      setStep(5);
      setStatus('Booking confirmed successfully.');
      window.alert('Booking confirmed successfully. We will contact you shortly.');
    } catch (error) {
      setStatus(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!tour) return null;

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Travel date</label>
              <input type="date" value={booking.date} onChange={(e) => updateField('date', e.target.value)} className="w-full border rounded-xl p-3" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Guests</label>
              <input type="number" min="1" max="12" value={booking.guests} onChange={(e) => updateField('guests', Number(e.target.value || 1))} className="w-full border rounded-xl p-3" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Trip notes</label>
              <textarea rows="4" value={booking.notes} onChange={(e) => updateField('notes', e.target.value)} placeholder="Any special preferences?" className="w-full border rounded-xl p-3" />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-2xl p-4">
              <p className="text-sm text-slate-500">Package</p>
              <p className="text-xl font-bold text-slate-900">{tour.title}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
              <div className="bg-teal-50 rounded-xl p-3">Date: {booking.date || 'Not set'}</div>
              <div className="bg-teal-50 rounded-xl p-3">Guests: {booking.guests}</div>
            </div>
            <div className="border rounded-2xl p-4">
              <div className="flex justify-between text-slate-700 mt-2"><span>Guests</span><span>x {booking.guests}</span></div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <input value={booking.contactName} onChange={(e) => updateField('contactName', e.target.value)} placeholder="Full name" className="w-full border rounded-xl p-3" required />
            <input type="email" value={booking.email} onChange={(e) => updateField('email', e.target.value)} placeholder="Email address" className="w-full border rounded-xl p-3" required />
            <input type="tel" value={booking.phone} onChange={(e) => updateField('phone', e.target.value)} placeholder="Phone number" className="w-full border rounded-xl p-3" />
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <label className="block">
              <input type="radio" checked={booking.paymentMethod === 'credit-card'} onChange={() => updateField('paymentMethod', 'credit-card')} className="mr-2" />
              Mock Credit Card
            </label>
            <label className="block">
              <input type="radio" checked={booking.paymentMethod === 'paypal'} onChange={() => updateField('paymentMethod', 'paypal')} className="mr-2" />
              PayPal
            </label>
            <label className="block">
              <input type="radio" checked={booking.paymentMethod === 'pay-on-arrival'} onChange={() => updateField('paymentMethod', 'pay-on-arrival')} className="mr-2" />
              Pay on Arrival
            </label>
            {booking.paymentMethod !== 'pay-on-arrival' && (
              <div className="space-y-3 pt-2">
                <input type="text" placeholder="Cardholder name" className="w-full border rounded-xl p-3" />
                <input type="text" placeholder="Card number" className="w-full border rounded-xl p-3" />
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="MM/YY" className="w-full border rounded-xl p-3" />
                  <input type="text" placeholder="CVV" className="w-full border rounded-xl p-3" />
                </div>
              </div>
            )}
          </div>
        );
      case 5:
        return (
          <div className="space-y-4 text-center">
            <div className="text-5xl">✅</div>
            <h3 className="text-2xl font-bold text-slate-900">Booking confirmed</h3>
            <p className="text-slate-600">Your reservation has been saved successfully.</p>
            <div className="bg-slate-50 rounded-2xl p-4 text-left">
              <p><strong>Reference:</strong> {confirmation?.booking_reference || 'CP-' + Date.now().toString().slice(-6)}</p>
              <p><strong>Tour:</strong> {tour.title}</p>
              <p><strong>Date:</strong> {booking.date}</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-xl p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-brand font-semibold">Checkout</p>
            <h3 className="text-2xl font-bold">Complete your booking</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Close checkout dialog" className="text-slate-500 text-2xl">✕</button>
        </div>

        <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className={`flex-1 h-2 rounded-full ${step >= item ? 'bg-brand' : 'bg-slate-200'}`} />
          ))}
        </div>

        <div className="bg-teal-50 border border-teal-100 rounded-2xl p-4 mb-5">
          <p className="text-sm text-slate-500">Selected package</p>
          <p className="text-xl font-bold">{tour.title}</p>
        </div>

        {renderStep()}

        {status && <p className="mt-4 text-sm text-slate-600">{status}</p>}

        {step < 5 && (
          <div className="mt-6 flex justify-between gap-3">
            <button type="button" onClick={onClose} className="flex-1 border border-slate-200 rounded-full py-3 font-semibold">
              Cancel
            </button>
            <button type="button" onClick={prevStep} disabled={step === 1} className="flex-1 border border-slate-200 rounded-full py-3 font-semibold disabled:opacity-40">
              Back
            </button>
            {step < 4 ? (
              <button type="button" onClick={nextStep} className="flex-1 bg-brand text-white rounded-full py-3 font-semibold">
                Continue
              </button>
            ) : (
              <button type="button" onClick={handleCheckout} disabled={isProcessing} className="flex-1 bg-brand text-white rounded-full py-3 font-semibold disabled:opacity-60">
                {isProcessing ? 'Processing...' : 'Confirm booking'}
              </button>
            )}
          </div>
        )}

        {step === 5 && (
          <button type="button" onClick={onClose} className="mt-6 w-full bg-slate-900 text-white rounded-full py-3 font-semibold">
            Close
          </button>
        )}
      </div>
    </div>
  );
}
