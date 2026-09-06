import { useEffect, useState } from 'react';
import Header from './Header';
import { API_BASE_URL } from '../api';
import { authStorage, getAuthHeaders } from '../auth';

const currency = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value || 0));

const statusClass = (status) => {
  const map = {
    pending: 'bg-amber-100 text-amber-700',
    confirmed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-rose-100 text-rose-700',
  };
  return map[status] || 'bg-slate-100 text-slate-700';
};

export default function UserDashboard() {
  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    const token = authStorage.getToken();
    if (!token) return;

    try {
      const [meRes, bookingsRes, notificationsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/users/me`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/bookings/my`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/notifications/user/${authStorage.getUser()?.id}`, { headers: getAuthHeaders() }),
      ]);

      if (meRes.ok) setUser(await meRes.json());
      if (bookingsRes.ok) setBookings(await bookingsRes.json());
      if (notificationsRes.ok) setNotifications(await notificationsRes.json());
    } catch (error) {
      console.error('Failed to load dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const cancelBooking = async (bookingId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/cancel`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Unable to cancel booking');
      await loadProfile();
    } catch (error) {
      alert(error.message);
    }
  };

  const viewReceipt = (booking) => {
    const html = `
      <html>
        <head><title>Booking Receipt</title><style>body{font-family:Arial;padding:24px;color:#1f2937} .box{border:1px solid #e5e7eb;padding:16px;border-radius:12px} h1{margin-top:0}</style></head>
        <body>
          <div class="box">
            <h1>Ceylon Paradise Receipt</h1>
            <p><strong>Receipt:</strong> ${booking.booking_reference || `CP-${booking.id}`}</p>
            <p><strong>Guest:</strong> ${booking.user_name || user?.name}</p>
            <p><strong>Email:</strong> ${booking.user_email || user?.email}</p>
            <p><strong>Trip:</strong> ${booking.tour_title || `Tour #${booking.tour_id}`}</p>
            <p><strong>Date:</strong> ${booking.date}</p>
            <p><strong>Status:</strong> ${booking.status}</p>
            <p><strong>Payment:</strong> ${booking.payment_status || 'pending'}</p>
            <p><strong>Total:</strong> ${currency(booking.total_amount || booking.amount || 0)}</p>
          </div>
        </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const newWindow = window.open(url, '_blank');
    if (newWindow) {
      newWindow.opener = null;
    }
  };

  const logout = () => {
    authStorage.clearToken();
    authStorage.clearUser();
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <Header authUser={user} onLogout={logout} />
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-brand font-semibold">My Dashboard</p>
            <h2 className="text-3xl font-bold text-slate-900 mt-2">{user?.name || 'Traveler Profile'}</h2>
          </div>
          <button onClick={logout} className="bg-slate-900 text-white px-5 py-3 rounded-full">Logout</button>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <p className="text-sm text-slate-500">Profile</p>
            <p className="text-xl font-bold text-slate-900 mt-2">{user?.email || 'Guest user'}</p>
            <p className="text-sm text-slate-600 mt-2">Role: {user?.role || 'user'}</p>
          </div>
          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <p className="text-sm text-slate-500">Bookings</p>
            <p className="text-3xl font-black text-slate-900 mt-2">{bookings.length}</p>
            <p className="text-sm text-slate-600 mt-2">Trip reservations</p>
          </div>
          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <p className="text-sm text-slate-500">Total spend</p>
            <p className="text-3xl font-black text-slate-900 mt-2">{currency(bookings.reduce((sum, booking) => sum + Number(booking.total_amount || booking.amount || 0), 0))}</p>
            <p className="text-sm text-slate-600 mt-2">Across all bookings</p>
          </div>
        </div>

        {notifications.length > 0 && <div className="mb-8 rounded-[2rem] bg-emerald-50 p-6 shadow-sm"><div className="flex items-center justify-between"><h3 className="text-xl font-bold text-slate-900">Notifications</h3><span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white">{notifications.filter((notification) => !notification.read).length} unread</span></div><div className="mt-3 space-y-2">{notifications.map((notification) => <p key={notification.id} className={`rounded-xl bg-white px-4 py-3 text-sm text-slate-700 ${notification.read ? '' : 'border-l-4 border-emerald-500'}`}>{notification.message}</p>)}</div></div>}

        <div className="bg-white rounded-[2rem] p-6 shadow-sm">
          <h3 className="text-2xl font-bold text-slate-900 mb-5">Booking history</h3>

          {loading ? (
            <p className="text-slate-500">Loading bookings...</p>
          ) : bookings.length === 0 ? (
            <p className="text-slate-500">No bookings yet. Start planning your next escape.</p>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div key={booking.id} className="border border-slate-200 rounded-2xl p-5">
                  <div className="flex flex-col lg:flex-row justify-between gap-4">
                    <div>
                      <p className="text-lg font-bold text-slate-900">{booking.tour_title || `Tour #${booking.tour_id}`}</p>
                      <p className="text-sm text-slate-500 mt-1">{booking.date} · {booking.guests || 1} guest(s)</p>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusClass(booking.status)}`}>
                        {booking.status || 'pending'}
                      </span>
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700">
                        Payment: {booking.payment_status || 'pending'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid md:grid-cols-4 gap-3 text-sm text-slate-600">
                    <div className="bg-slate-50 rounded-xl p-3">Reference: {booking.booking_reference || `CP-${booking.id}`}</div>
                    <div className="bg-slate-50 rounded-xl p-3">Method: {booking.payment_method || 'credit-card'}</div>
                    <div className="bg-slate-50 rounded-xl p-3">Amount: {currency(booking.total_amount || booking.amount || 0)}</div>
                    <div className="bg-slate-50 rounded-xl p-3">Status: {booking.status || 'pending'}</div>
                  </div>

                  <div className="flex flex-wrap gap-3 mt-5">
                    {booking.status === 'pending' && (
                      <button onClick={() => cancelBooking(booking.id)} className="bg-rose-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                        Cancel booking
                      </button>
                    )}
                    <button onClick={() => viewReceipt(booking)} className="bg-brand text-white px-4 py-2 rounded-full text-sm font-semibold">
                      View receipt
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
