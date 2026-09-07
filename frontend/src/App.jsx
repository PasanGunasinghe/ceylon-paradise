import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';
import BookingForm from './components/BookingForm';
import AuthPage from './components/AuthPage';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';
import CheckoutPanel from './components/CheckoutPanel';
import DestinationDetailPage from './components/DestinationDetailPage';
import HomePage from './pages/HomePage';
import DestinationsPage from './pages/DestinationsPage';
import ToursPage from './pages/ToursPage';
import TourDetailPage from './pages/TourDetailPage';
import MapPlannerPage from './pages/MapPlannerPage';
import GalleryPage from './pages/GalleryPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import ScrollToTop from './components/ScrollToTop';
import { api } from './api';
import { authStorage } from './auth';
import { ThemeProvider } from './theme.jsx';
import { getInitialList, writeList } from './dataStore';

function ProtectedRoute({ children, adminOnly = false }) {
  const user = authStorage.getUser();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

function PublicLayout({ authUser, onLogout, children }) {
  return (
    <div className="app-root min-h-screen bg-slate-900 text-slate-100">
      <Header authUser={authUser} onLogout={onLogout} />
      {children}
    </div>
  );
}

function AdminLoginPage({ onAuthSuccess }) {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <AuthPage
          variant="admin"
          allowRegister={false}
          onAuthSuccess={onAuthSuccess}
          title="Admin Sign In"
          subtitle="Use the secure admin portal for tour and booking management."
        />
      </div>
    </div>
  );
}

function MaintenancePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-center text-white">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">Ceylon Paradise</p>
        <h1 className="mt-6 text-5xl font-black tracking-tight sm:text-7xl">503 Service Unavailable</h1>
        <p className="mt-6 text-xl text-slate-300">Scheduled Maintenance in Progress</p>
      </div>
    </main>
  );
}

export default function App() {
  return <MaintenancePage />;

  const [destinations, setDestinations] = useState(() => getInitialList('destinations'));
  const [selectedTour, setSelectedTour] = useState(null);
  const [authUser, setAuthUser] = useState(authStorage.getUser());
  const [filters, setFilters] = useState({ destination: '', category: '', minPrice: '', maxPrice: '', duration: '' });
  const [tourData, setTourData] = useState(() => getInitialList('tours'));
  const [checkoutTour, setCheckoutTour] = useState(null);

  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        const data = await api.getDestinations();
        setDestinations(data);
        writeList('destinations', data);
      } catch (error) {
        console.error('Failed to load destinations:', error);
        setDestinations([]);
      }
    };

    const fetchTours = async () => {
      try {
        const data = await api.getTours();
        setTourData(data);
        writeList('tours', data);
      } catch (error) {
        console.error('Failed to load tours:', error);
        setTourData([]);
      }
    };

    fetchDestinations();
    fetchTours();
    const onDataUpdated = (event) => {
      if (event.detail?.name === 'destinations') setDestinations(event.detail.value);
      if (event.detail?.name === 'tours') setTourData(event.detail.value);
      if (event.key === 'app_destinations' || event.key === 'ceylon_paradise_destinations') fetchDestinations();
      if (event.key === 'app_tours' || event.key === 'ceylon_paradise_tours') fetchTours();
    };
    window.addEventListener('app-data-updated', onDataUpdated);
    window.addEventListener('storage', onDataUpdated);
    return () => {
      window.removeEventListener('app-data-updated', onDataUpdated);
      window.removeEventListener('storage', onDataUpdated);
    };
  }, []);

  const applyFilters = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const filteredTours = tourData.filter((tour) => {
    const matchesDestination = !filters.destination || (tour.destination || '').toLowerCase().includes(filters.destination.toLowerCase());
    const matchesCategory = !filters.category || (tour.category || '').toLowerCase().includes(filters.category.toLowerCase());
    const matchesMinPrice = !filters.minPrice || Number(tour.price) >= Number(filters.minPrice);
    const matchesMaxPrice = !filters.maxPrice || Number(tour.price) <= Number(filters.maxPrice);
    const matchesDuration = !filters.duration || (tour.duration || '').toLowerCase().includes(filters.duration.toLowerCase());
    return matchesDestination && matchesCategory && matchesMinPrice && matchesMaxPrice && matchesDuration;
  });

  const handleAuthSuccess = (user) => {
    setAuthUser(user);
    authStorage.setUser(user);
    if (user?.role === 'admin') {
      window.location.href = '/admin';
      return;
    }
    const next = new URLSearchParams(window.location.search).get('next');
    window.location.href = next || '/';
  };

  const handleLogout = () => {
    authStorage.clearToken();
    authStorage.clearUser();
    setAuthUser(null);
    window.location.href = '/';
  };

  const openBooking = (tour) => {
    if (!authUser) {
      window.location.href = '/login?next=/';
      return;
    }
    setSelectedTour(tour);
  };

  const openCheckout = (tour) => {
    if (!authUser) {
      window.location.href = '/login?next=/';
      return;
    }
    setCheckoutTour(tour);
  };

  return (
    <ThemeProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ScrollToTop />
        <Routes>
          <Route
            path="/"
            element={
              <PublicLayout authUser={authUser} onLogout={handleLogout}>
                <HomePage authUser={authUser} destinations={destinations} tours={filteredTours} onBookNow={openBooking} onCheckout={openCheckout} />
                {selectedTour && <BookingForm selectedTour={selectedTour} onClose={() => setSelectedTour(null)} />}
                {checkoutTour && <CheckoutPanel tour={checkoutTour} onClose={() => setCheckoutTour(null)} />}
              </PublicLayout>
            }
          />

          <Route
            path="/destinations"
            element={
              <PublicLayout authUser={authUser} onLogout={handleLogout}>
                <DestinationsPage destinations={destinations} />
              </PublicLayout>
            }
          />

          <Route
            path="/destination/:destinationId"
            element={
              <PublicLayout authUser={authUser} onLogout={handleLogout}>
                <DestinationDetailPage destinations={destinations} tours={filteredTours} onBookNow={openBooking} />
              </PublicLayout>
            }
          />

          <Route
            path="/destinations/:destinationId"
            element={
              <PublicLayout authUser={authUser} onLogout={handleLogout}>
                <DestinationDetailPage destinations={destinations} tours={filteredTours} onBookNow={openBooking} />
              </PublicLayout>
            }
          />

          <Route
            path="/tours"
            element={
              <PublicLayout authUser={authUser} onLogout={handleLogout}>
                <ToursPage tours={filteredTours} onBookNow={openBooking} onCheckout={openCheckout} />
              </PublicLayout>
            }
          />

          <Route
            path="/tours/:tourId"
            element={
              <PublicLayout authUser={authUser} onLogout={handleLogout}>
                <TourDetailPage tours={filteredTours} onBookNow={openBooking} />
              </PublicLayout>
            }
          />

          <Route
            path="/map-planner"
            element={
              <PublicLayout authUser={authUser} onLogout={handleLogout}>
                <MapPlannerPage destinations={destinations} />
              </PublicLayout>
            }
          />

          <Route
            path="/gallery"
            element={
              <PublicLayout authUser={authUser} onLogout={handleLogout}>
                <GalleryPage />
              </PublicLayout>
            }
          />

          <Route
            path="/about"
            element={
              <PublicLayout authUser={authUser} onLogout={handleLogout}>
                <AboutPage />
              </PublicLayout>
            }
          />

          <Route
            path="/contact"
            element={
              <PublicLayout authUser={authUser} onLogout={handleLogout}>
                <ContactPage />
              </PublicLayout>
            }
          />

          <Route path="/login" element={<AuthPage onAuthSuccess={handleAuthSuccess} variant="user" allowRegister />} />
          <Route path="/register" element={<AuthPage onAuthSuccess={handleAuthSuccess} variant="user" mode="register" allowRegister />} />
          <Route path="/admin/login" element={<AdminLoginPage onAuthSuccess={handleAuthSuccess} />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Footer />
        <WhatsAppButton />
      </BrowserRouter>
    </ThemeProvider>
  );
}
