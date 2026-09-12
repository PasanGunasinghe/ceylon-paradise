import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuthHeaders, authStorage, fetchWithAuth } from '../auth';
import { API_BASE_URL } from '../api';
import { apiClient } from '../services/api';
import MapPinsEditor from './MapPinsEditor';
import { getInitialList, hasList, writeList } from '../dataStore';
import { ClipboardList, MapPin, Star, Users } from 'lucide-react';

const STATUS_OPTIONS = ['Pending', 'Contacted', 'Negotiating', 'Confirmed', 'Cancelled'];
const statusStyles = {
  Pending: 'border border-amber-400/40 bg-amber-500/20 text-amber-300',
  Contacted: 'border border-slate-600 bg-slate-700 text-slate-200',
  Negotiating: 'border border-blue-400/40 bg-blue-500/20 text-blue-300',
  Confirmed: 'border border-emerald-400/40 bg-emerald-500/20 text-emerald-300',
  Cancelled: 'border border-rose-400/40 bg-rose-500/20 text-rose-300',
};

const emptyTourForm = {
  title: '',
  price: '',
  duration: '',
  description: '',
  category: '',
  destination: '',
  image_url: '',
  image_file: null,
  availability: 'Available',
  itinerary: '',
};

const emptyDestinationForm = {
  name: '',
  location: '',
  rating: '',
  image_url: '',
  description: '',
  activities: '',
  ideal_for: '',
  best_time: '',
  weather: '',
};

const emptyGalleryForm = {
  title: '',
  image_url: '',
  summary: '',
  pinned: true,
};

const emptyPinForm = {
  name: '',
  lat: '',
  lng: '',
  description: '',
  photo_url: '',
  dayNumber: '',
};

const categoryOptions = ['Wildlife & Nature', 'Historical & Cultural', 'Beach & Coastal', 'Adventure & Trekking', 'Wellness & Ayurveda', 'City & Shopping', 'Photography & Scenic'];
const durationOptions = ['1 Day', '2 Days / 1 Night', '3 Days / 2 Nights', '5 Days / 4 Nights', '7 Days / 6 Nights', '10+ Days'];

const readStorageList = (key, fallback = []) => {
  try {
    const stored = JSON.parse(localStorage.getItem(key) || 'null');
    return Array.isArray(stored) ? stored : fallback;
  } catch {
    return fallback;
  }
};

const toDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const asArray = (value) => {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [value];
  } catch {
    return [value];
  }
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [tours, setTours] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [galleryItems, setGalleryItems] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [inquiries, setInquiries] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [mapPins, setMapPins] = useState(() => {
    const resetKey = 'custom_map_pins_reset_v2';
    if (!localStorage.getItem(resetKey)) {
      localStorage.removeItem('custom_map_pins');
      localStorage.removeItem('app_map_pins');
      localStorage.removeItem('ceylon_paradise_mapPins');
      localStorage.setItem(resetKey, 'true');
      return [];
    }
    return [];
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [pinForm, setPinForm] = useState(emptyPinForm);
  const [tourForm, setTourForm] = useState(emptyTourForm);
  const [destinationForm, setDestinationForm] = useState(emptyDestinationForm);
  const [galleryForm, setGalleryForm] = useState(emptyGalleryForm);
  const [editingTourId, setEditingTourId] = useState(null);
  const [editingDestinationId, setEditingDestinationId] = useState(null);
  const [editingGalleryId, setEditingGalleryId] = useState(null);
  const [editingPinId, setEditingPinId] = useState(null);
  const [tourModalOpen, setTourModalOpen] = useState(false);
  const [tourValidation, setTourValidation] = useState({});
  const [destinationModalOpen, setDestinationModalOpen] = useState(false);
  const [mutationError, setMutationError] = useState('');
  const [mutationSuccess, setMutationSuccess] = useState('');
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const beginMutation = () => {
    setMutationError('');
    setMutationSuccess('');
  };

  const changeAdminPassword = async (event) => {
    event.preventDefault();
    beginMutation();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMutationError('New password and confirmation do not match.');
      return;
    }
    try {
      const result = await apiClient.changeAdminPassword({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword }, token);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setMutationSuccess(result.message || 'Password changed successfully.');
    } catch (error) {
      setMutationError(error.message);
    }
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      setTourModalOpen(false);
      setDestinationModalOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const user = useMemo(() => authStorage.getUser(), []);
  const token = useMemo(() => authStorage.getToken(), []);

  useEffect(() => {
    if (!token || !user || user.role !== 'admin') {
      navigate('/admin/login');
    }
  }, [token, user, navigate]);

  const persistList = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
  };

  const loadData = async () => {
    if (!authStorage.getToken() || !token || !user || user.role !== 'admin') return;

    const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };

    try {
      const [tourRes, bookingRes, userRes, inquiryRes, pinRes, destinationRes, memoryRes, reviewRes] = await Promise.all([
        fetchWithAuth(`${API_BASE_URL}/tours`, { headers }),
        fetchWithAuth(`${API_BASE_URL}/bookings`, { headers }),
        fetchWithAuth(`${API_BASE_URL}/admin/users`, { headers }),
        fetchWithAuth(`${API_BASE_URL}/admin/inquiries`, { headers }),
        fetchWithAuth(`${API_BASE_URL}/mappins`, { headers }),
        fetchWithAuth(`${API_BASE_URL}/destinations`, { headers }),
        fetchWithAuth(`${API_BASE_URL}/memories`, { headers }),
        fetchWithAuth(`${API_BASE_URL}/reviews`, { headers }),
      ]);

      const readArray = async (response) => {
        if (!response.ok) return [];
        const data = await response.json();
        if (Array.isArray(data)) return data;
        if (Array.isArray(data.items)) return data.items;
        if (Array.isArray(data.data)) return data.data;
        return [];
      };

      const toursData = await readArray(tourRes);
      const bookingsData = await readArray(bookingRes);
      const usersData = await readArray(userRes);
      const inquiryData = await readArray(inquiryRes);
      const pinData = localStorage.getItem('custom_map_pins_reset_v2') === 'true'
        ? []
        : await readArray(pinRes);
      const destinationData = await readArray(destinationRes);
      const memoryData = await readArray(memoryRes);
      const reviewData = await readArray(reviewRes);

      setTours(toursData);
      setBookings(bookingsData);
      setUsers(usersData);
      setInquiries(inquiryData);
      setMapPins(pinData);
      setDestinations(destinationData);
      setGalleryItems(memoryData);
      setReviews(reviewData);

      writeList('tours', toursData);
      persistList('ceylon_paradise_bookings', bookingsData);
      persistList('ceylon_paradise_inquiries', inquiryData);
      writeList('mapPins', pinData);
      writeList('destinations', destinationData);
      writeList('gallery', memoryData);
      writeList('reviews', reviewData);
    } catch (error) {
      const localTours = readStorageList('ceylon_paradise_tours', []);
      const localBookings = readStorageList('ceylon_paradise_bookings', []);
      const localDestinations = readStorageList('ceylon_paradise_destinations', []);
      const localGallery = readStorageList('ceylon_paradise_memories', []);
      const localInquiries = readStorageList('ceylon_paradise_inquiries', []);
      const localPins = readStorageList('ceylon_paradise_mapPins', []);
      setTours(localTours);
      setBookings(localBookings);
      setDestinations(localDestinations);
      setGalleryItems(localGallery);
      setInquiries(localInquiries);
      setMapPins(localPins);
      setReviews(readStorageList('app_reviews', []));
    }
  };

  useEffect(() => {
    if (!authStorage.getToken() || !token || !user || user.role !== 'admin') return undefined;

    loadData();
    const onBookingUpdate = () => loadData();
    window.addEventListener('cp-bookings-updated', onBookingUpdate);
    return () => window.removeEventListener('cp-bookings-updated', onBookingUpdate);
  }, [token, user]);

  const handleTourChange = (event) => {
    const { name, value } = event.target;
    setTourForm((prev) => ({ ...prev, [name]: value }));
    setTourValidation((prev) => ({ ...prev, [name]: false }));
  };

  const handleDestinationChange = (event) => {
    const { name, value } = event.target;
    setDestinationForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleGalleryChange = (event) => {
    const { name, value, type, checked } = event.target;
    setGalleryForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleFileUpload = async (event, setter, key) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const imgData = await toDataUrl(file);
    setter((prev) => ({ ...prev, [key]: imgData, image_file: file }));
  };

  const saveTour = async (event) => {
    event.preventDefault();
    console.log('--- ADD TOUR SUBMIT TRIGGERED ---', tourForm);
    beginMutation();
    const isEditing = Boolean(editingTourId);
    const price = Number(tourForm.price) || 0;
    const titleValue = String(tourForm.title ?? '').trim();
    const description = tourForm.description.trim();
    const missingFields = {
      title: titleValue.length < 2 || titleValue.length > 200,
      price: !tourForm.price.trim() || !Number.isFinite(price),
      duration: !tourForm.duration,
      category: !tourForm.category,
    };
    if (Object.values(missingFields).some(Boolean)) {
      setTourValidation(missingFields);
      setMutationError(
        missingFields.title
          ? 'Tour title must contain between 2 and 200 characters.'
          : 'Please complete the highlighted required fields.'
      );
      return;
    }
    setTourValidation({});
    const payload = new FormData();
    payload.append('title', titleValue);
    payload.append('price', String(Number(tourForm.price) || 0));
    payload.append('duration', tourForm.duration);
    payload.append('description', description);
    payload.append('category', tourForm.category);
    payload.append('location', tourForm.destination || '');
    payload.append('highlights', JSON.stringify(asArray(tourForm.itinerary)));
    payload.append('availability', tourForm.availability || 'Available');
    if (tourForm.image_file) {
      payload.append('image', tourForm.image_file);
    } else {
      payload.append('image_url', tourForm.image_url || '');
      payload.append('images', JSON.stringify(asArray(tourForm.image_url)));
    }
    console.log('Tour FormData payload:', Array.from(payload.entries()));
    try {
      const savedTour = editingTourId
        ? await apiClient.updateTour(editingTourId, payload, token)
        : await apiClient.createTour(payload, token);
      const updated = editingTourId
        ? tours.map((tour) => (tour.id === editingTourId ? savedTour : tour))
        : [savedTour, ...tours];
      setTours(updated);
      writeList('tours', updated);
      await loadData();
      setEditingTourId(null);
      setMutationSuccess(isEditing ? 'Tour updated successfully.' : 'Tour created successfully.');
    } catch (error) {
      console.error('Submit Error:', error);
      console.error('Submit Error Response:', error.response?.data);
      setMutationError(error.message || 'Unable to save tour package.');
      setMutationSuccess('');
      return;
    }

    setTourForm(emptyTourForm);
    setTourValidation({});
    setTourModalOpen(false);
  };

  const editTour = (tour) => {
    setEditingTourId(tour.id);
    setTourForm({
      title: tour.title || '',
      price: tour.price || '',
      duration: tour.duration || '',
      description: tour.description || '',
      category: tour.category || '',
      destination: tour.destination || '',
      image_url: tour.image_url || '',
      image_file: null,
      availability: tour.availability || 'Available',
      itinerary: tour.itinerary || '',
    });
    setActiveTab('packages');
    setTourModalOpen(true);
    setTourValidation({});
  };

  const deleteTour = async (id) => {
    beginMutation();
    try {
      await apiClient.deleteTour(id, token);
      const updated = tours.filter((tour) => tour.id !== id);
      setTours(updated);
      writeList('tours', updated);
      setMutationSuccess('Tour deleted successfully.');
    } catch (error) {
      setMutationError(error.message);
    }
    if (editingTourId === id) {
      setEditingTourId(null);
      setTourForm(emptyTourForm);
    }
  };

  const saveDestination = async (event) => {
    event.preventDefault();
    beginMutation();
    const isEditing = Boolean(editingDestinationId);
    const destinationFormData = destinationForm;
    const rating = Number(destinationFormData.rating) || 5;
    const payload = {
      name: destinationFormData.name || destinationFormData.title || 'New Destination',
      description: destinationFormData.description || '',
      image_url: destinationFormData.image_url || destinationFormData.image || '',
      location: destinationFormData.location || destinationFormData.region || '',
      rating,
    };
    console.log("SENDING DESTINATION PAYLOAD:", destinationFormData);
    const next = [...destinations];
    try {
      const savedDestination = editingDestinationId
        ? await apiClient.updateDestination(editingDestinationId, payload, token)
        : await apiClient.createDestination(payload, token);
      const updated = editingDestinationId
        ? next.map((item) => (item.id === editingDestinationId ? savedDestination : item))
        : [savedDestination, ...next];
      setDestinations(updated);
      writeList('destinations', updated);
      setEditingDestinationId(null);
      setMutationSuccess(isEditing ? 'Destination updated successfully.' : 'Destination created successfully.');
    } catch (error) {
      setMutationError(error.message);
      return;
    }
    setDestinationForm(emptyDestinationForm);
    setDestinationModalOpen(false);
  };

  const editDestination = (destination) => {
    setEditingDestinationId(destination.id);
    setDestinationForm({
      name: destination.name || '',
      location: destination.location || '',
      image_url: destination.image_url || '',
      description: destination.description || '',
      activities: Array.isArray(destination.activities) ? destination.activities.join(', ') : destination.activities || '',
      ideal_for: Array.isArray(destination.ideal_for) ? destination.ideal_for.join(', ') : destination.ideal_for || '',
      best_time: destination.best_time || '',
      weather: destination.weather || '',
      rating: destination.rating ?? '',
    });
    setDestinationModalOpen(true);
  };

  const deleteDestination = async (id) => {
    beginMutation();
    try {
      await apiClient.deleteDestination(id, token);
      const updated = destinations.filter((item) => item.id !== id);
      setDestinations(updated);
      writeList('destinations', updated);
      setMutationSuccess('Destination deleted successfully.');
    } catch (error) {
      setMutationError(error.message);
    }
    if (editingDestinationId === id) {
      setEditingDestinationId(null);
      setDestinationForm(emptyDestinationForm);
    }
  };

  const saveGalleryItem = async (event) => {
    event.preventDefault();
    beginMutation();
    const isEditing = Boolean(editingGalleryId);
    const payload = {
      title: galleryForm.title.trim(),
      image_url: galleryForm.image_url,
      summary: galleryForm.summary,
      pinned: Boolean(galleryForm.pinned),
    };
    if (!payload.title || !payload.image_url) {
      window.alert('Please select an image and provide a title.');
      return;
    }
    try {
      const savedMemory = editingGalleryId
        ? await apiClient.updateMemory(editingGalleryId, payload, token)
        : await apiClient.createMemory(payload, token);
      const updated = editingGalleryId
        ? galleryItems.map((item) => (item.id === editingGalleryId ? savedMemory : item))
        : [savedMemory, ...galleryItems];
      setGalleryItems(updated);
      writeList('gallery', updated);
      setEditingGalleryId(null);
      setMutationSuccess(isEditing ? 'Gallery image updated successfully.' : 'Gallery image created successfully.');
    } catch (error) {
      setMutationError(error.message);
      return;
    }
    setGalleryForm(emptyGalleryForm);
  };

  const editGalleryItem = (item) => {
    setEditingGalleryId(item.id);
    setGalleryForm({
      title: item.title || '',
      image_url: item.image_url || '',
      summary: item.summary || '',
      pinned: Boolean(item.pinned),
    });
    setActiveTab('gallery');
  };

  const deleteGalleryItem = async (id) => {
    beginMutation();
    try {
      await apiClient.deleteMemory(id, token);
      const updated = galleryItems.filter((item) => item.id !== id);
      setGalleryItems(updated);
      writeList('gallery', updated);
      setMutationSuccess('Gallery image deleted successfully.');
    } catch (error) {
      setMutationError(error.message);
    }
    if (editingGalleryId === id) {
      setEditingGalleryId(null);
      setGalleryForm(emptyGalleryForm);
    }
  };

  const savePin = async (event) => {
    event.preventDefault();
    beginMutation();

    if (!pinForm.name) {
      window.alert('Please fill all required fields correctly!');
      setMutationError('Pin name is required.');
      return;
    }

    const normalizedName = pinForm.name.trim().toLowerCase();
    const latitude = Number(pinForm.lat);
    const longitude = Number(pinForm.lng);
    const dayNumber = parseInt(pinForm.dayNumber, 10) || 1;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude === 0 || longitude === 0) {
      window.alert('Please fill all required fields correctly!');
      setMutationError('Valid non-zero latitude and longitude are required.');
      return;
    }
    const duplicate = mapPins.some((pin) => pin.id !== editingPinId && (
      (pin.name || '').trim().toLowerCase() === normalizedName
      || (Number(pin.lat) === latitude && Number(pin.lng) === longitude)
    ));
    if (duplicate) {
      window.alert('A saved pin already uses this name or exact location.');
      return;
    }

    const payload = {
      latitude,
      longitude,
      title: pinForm.name.trim(),
      details: pinForm.description,
      image_url: pinForm.photo_url,
      day_number: dayNumber,
    };

    const nextPins = [...mapPins];
    const isEditing = Boolean(editingPinId);

    try {
      const savedPin = editingPinId
        ? await apiClient.updateMapPin(editingPinId, payload, token)
        : await apiClient.createMapPin(payload, token);
      const updated = editingPinId
        ? nextPins.map((pin) => (pin.id === editingPinId ? savedPin : pin))
        : [savedPin, ...nextPins];
      setMapPins(updated);
      writeList('mapPins', updated);
      setEditingPinId(null);
      setMutationSuccess(isEditing ? 'Map pin updated successfully.' : 'Map pin created successfully.');
    } catch (error) {
      console.error("400 Error Details:", error.response?.data);
      setMutationError(error.message);
      return;
    }

    setPinForm(emptyPinForm);
  };

  const editPin = (pin) => {
    setEditingPinId(pin.id);
    setPinForm({
      name: pin.name || '',
      lat: Number(pin.lat).toFixed(6),
      lng: Number(pin.lng).toFixed(6),
      description: pin.description || '',
      photo_url: pin.photo_url || '',
      dayNumber: pin.dayNumber || '',
    });
    setActiveTab('pins');
  };

  const deletePin = async (pinId = editingPinId) => {
    if (!pinId) {
      return;
    }

    beginMutation();
    try {
      await apiClient.deleteMapPin(pinId, token);
      const updated = mapPins.filter((pin) => pin.id !== pinId);
      setMapPins(updated);
      writeList('mapPins', updated);
      setMutationSuccess('Map pin deleted successfully.');
    } catch (error) {
      setMutationError(error.message);
      return;
    }
    if (editingPinId === pinId) setEditingPinId(null);
    setPinForm(emptyPinForm);
  };

  const deleteReview = async (id) => {
    beginMutation();
    try {
      await apiClient.deleteReview(id, token);
      const updated = reviews.filter((review) => review.id !== id);
      setReviews(updated);
      writeList('reviews', updated);
      setMutationSuccess('Review deleted successfully.');
    } catch (error) {
      setMutationError(error.message);
    }
  };


  const resetPins = async () => {
    beginMutation();
    try {
      await Promise.all(mapPins.map((pin) => apiClient.deleteMapPin(pin.id, token)));
      setMapPins([]);
      writeList('mapPins', []);
      setEditingPinId(null);
      setPinForm(emptyPinForm);
      setMutationSuccess('All map pins deleted successfully.');
    } catch (error) {
      setMutationError(error.message);
    }
  };

  const updateStatus = async (bookingId, status) => {
    const updated = bookings.map((booking) => (booking.id === bookingId ? { ...booking, status } : booking));
    setBookings(updated);
    persistList('ceylon_paradise_bookings', updated);
  };

  const updateInquiryStatus = async (id, status) => {
    if (!token) return;
    try {
      const inquiry = inquiries.find((item) => item.id === id);
      const savedInquiry = await apiClient.updateRouteInquiry(id, { status, admin_notes: inquiry?.notes || '' }, token);
      const updated = inquiries.map((inquiry) => (inquiry.id === id ? { ...inquiry, ...savedInquiry, status } : inquiry));
      setInquiries(updated);
      persistList('ceylon_paradise_inquiries', updated);
    } catch (error) {
      setMutationError(error.message);
    }
  };

  const saveInquiryNotes = async (id, notes) => {
    if (!token) return;
    try {
      const inquiry = inquiries.find((item) => item.id === id);
      const savedInquiry = await apiClient.updateRouteInquiry(id, { status: inquiry?.status || 'Pending', admin_notes: notes }, token);
      const updated = inquiries.map((item) => (item.id === id ? { ...item, ...savedInquiry, notes } : item));
      setInquiries(updated);
      persistList('ceylon_paradise_inquiries', updated);
    } catch (error) {
      setMutationError(error.message);
    }
  };

  const pendingInquiries = inquiries.filter((inquiry) => (inquiry.status || 'Pending').toLowerCase() === 'pending').length;
  const filteredUsers = users.filter((registeredUser) => {
    const query = userSearch.trim().toLowerCase();
    if (!query) return true;
    return [registeredUser.name, registeredUser.email, registeredUser.phone, registeredUser.contact_number]
      .some((value) => String(value || '').toLowerCase().includes(query));
  });
  const revenueLeads = inquiries.reduce((total, inquiry) => total + Number(inquiry.budget || inquiry.total_amount || 0), 0);
  const navigation = [
    ['overview', 'Overview'],
    ['inquiries', 'Tour Inquiries & Routes'],
    ['destinations', 'Destinations CRUD'],
    ['packages', 'Tour Packages CRUD'],
    ['gallery', 'Gallery CRUD'],
    ['pins', 'Map Pins'],
    ['reviews', 'Reviews Management'],
    ['users', 'Registered Users'],
    ['settings', 'Settings'],
  ];

  return (
    <div className="admin-shell min-h-screen bg-slate-100 p-4 text-slate-800 md:p-6">
      <div className="mx-auto grid max-w-[1500px] gap-5 lg:grid-cols-[250px_1fr]">
        <aside className="admin-sidebar rounded-[1.75rem] bg-slate-950 p-5 text-white shadow-xl lg:min-h-[calc(100vh-3rem)]">
          <div className="border-b border-white/10 pb-6">
            <p className="text-xl font-black">Ceylon Paradise</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.3em] text-amber-300">Control centre</p>
          </div>
          <nav className="mt-7 grid gap-2">
            {navigation.map(([tab, label]) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`flex items-center rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${activeTab === tab ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-950/30' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}>
                {label}
              </button>
            ))}
          </nav>
          <button onClick={() => { authStorage.clearToken(); authStorage.clearUser(); window.location.href = '/'; }} className="mt-8 w-full rounded-xl border border-white/15 px-3 py-3 text-left text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white">Sign out</button>
        </aside>

        <main className="min-w-0">
          {mutationError && <div role="alert" className="mb-5 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{mutationError}</div>}
          {mutationSuccess && <div role="status" className="mb-5 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{mutationSuccess}</div>}
          <div className="mb-5 flex flex-col justify-between gap-4 rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">Admin workspace</p>
              <h2 className="mt-2 text-3xl font-black text-slate-900">Tour operations</h2>
              <p className="mt-1 text-sm text-slate-500">Manage itineraries, bookings, map pins, and travel content from one place.</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">Live content studio</div>
          </div>

          <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ['Total inquiries', inquiries.length, ClipboardList],
              ['Active tours', tours.length, MapPin],
              ['Reviews', reviews.length, Star],
              ['Registered users', users.length, Users],
            ].map(([label, value, Icon]) => (
              <div key={label} className="rounded-2xl border border-slate-700 bg-slate-800 p-5 text-white shadow-sm">
                <div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-300">{label}</p><Icon size={20} className="text-emerald-300" /></div>
                <p className="mt-3 text-3xl font-black">{value}</p>
                <p className="mt-1 text-xs text-slate-400">Updated from live records</p>
              </div>
            ))}
          </div>

          {activeTab === 'overview' && (
            <div className="grid xl:grid-cols-2 gap-8">
              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <h3 className="text-xl font-bold mb-4">Quick overview</h3>
                <div className="space-y-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Total destinations</p>
                    <p className="mt-2 text-3xl font-black text-slate-900">{destinations.length}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Map pins</p>
                    <p className="mt-2 text-3xl font-black text-slate-900">{mapPins.length}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Gallery memories</p>
                    <p className="mt-2 text-3xl font-black text-slate-900">{galleryItems.length}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <h3 className="text-xl font-bold mb-4">Recent bookings</h3>
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {bookings.length === 0 ? <p className="text-slate-500">No bookings yet.</p> : bookings.map((booking) => (
                    <div key={booking.id} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold">{booking.user_name}</p>
                          <p className="text-sm text-slate-500">{booking.user_email}</p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold uppercase">{booking.status || 'pending'}</span>
                      </div>
                      <p className="mt-2 text-sm">Trip: {booking.tour_title || booking.tour_id}</p>
                      <p className="text-sm text-slate-500">Date: {booking.date}</p>
                      <div className="mt-3 flex gap-2">
                        {['pending', 'confirmed', 'cancelled'].map((status) => (
                          <button key={status} onClick={() => updateStatus(booking.id, status)} className="rounded-full bg-brand px-3 py-1.5 text-xs font-semibold text-white">{status}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'destinations' && (
            <div className="space-y-5">
              <button type="button" onClick={() => setDestinationModalOpen(true)} className="rounded-full bg-emerald-600 px-5 py-3 font-semibold text-white shadow-lg">+ Add New Destination</button>
              {destinationModalOpen && <div className="fixed inset-0 z-[1000] flex items-start justify-center overflow-y-auto bg-slate-950/70 p-3 sm:items-center sm:p-4" role="dialog" aria-modal="true">
              <div className="relative my-3 max-h-[calc(100vh-1.5rem)] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-4 shadow-2xl sm:my-0 sm:max-h-[90vh] sm:p-6">
                <button type="button" onClick={() => setDestinationModalOpen(false)} aria-label="Close destination dialog" className="absolute right-5 top-5 text-xl text-slate-500">✕</button>
                <h3 className="text-xl font-bold mb-4">{editingDestinationId ? 'Update Destination' : 'Create Destination'}</h3>
                <form onSubmit={saveDestination} className="space-y-3">
                  <input name="name" value={destinationForm.name} onChange={handleDestinationChange} placeholder="Destination name" className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3" required />
                  <input name="location" value={destinationForm.location} onChange={handleDestinationChange} placeholder="Location (optional)" className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3" />
                  <input name="rating" type="number" min="0" max="5" step="0.1" value={destinationForm.rating} onChange={handleDestinationChange} placeholder="Rating (optional, defaults to 5)" className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3" />
                  <textarea name="description" value={destinationForm.description} onChange={handleDestinationChange} rows="4" placeholder="Description" className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3" />
                  <input name="activities" value={destinationForm.activities} onChange={handleDestinationChange} placeholder="Popular experiences / highlights (comma-separated)" className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3" />
                  <input name="ideal_for" value={destinationForm.ideal_for} onChange={handleDestinationChange} placeholder="Ideal for / travel notes (comma-separated)" className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3" />
                  <div className="grid gap-3 sm:grid-cols-2"><input name="best_time" value={destinationForm.best_time} onChange={handleDestinationChange} placeholder="Best time to visit" className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3" /><input name="weather" value={destinationForm.weather} onChange={handleDestinationChange} placeholder="Weather information" className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3" /></div>
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Image upload</label>
                    <input name="image_url" value="" type="file" accept="image/*" onChange={(event) => handleFileUpload(event, setDestinationForm, 'image_url')} className="block w-full text-sm text-slate-600" />
                  </div>
                  {destinationForm.image_url && <img src={destinationForm.image_url} alt="Destination preview" className="h-32 w-full rounded-xl object-cover" />}
                  <div className="flex gap-3">
                    <button type="submit" className="flex-1 rounded-full bg-brand px-5 py-3 font-semibold text-white">{editingDestinationId ? 'Update' : 'Save destination'}</button>
                    <button type="button" onClick={() => setDestinationModalOpen(false)} className="rounded-full border border-slate-300 px-5 py-3 font-semibold">Cancel</button>
                  </div>
                </form>
              </div>
              </div>}

              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <h3 className="text-xl font-bold mb-4">Destination library</h3>
                <div className="space-y-3">
                  {destinations.map((destination) => (
                    <div key={destination.id} className="flex gap-3 rounded-2xl border border-slate-200 p-3">
                      {destination.image_url && <img src={destination.image_url} alt={destination.name} className="h-16 w-16 rounded-xl object-cover" />}
                      <div className="flex-1">
                        <p className="font-semibold">{destination.name}</p>
                        <p className="text-sm text-slate-500">{destination.location}</p>
                        <div className="mt-2 flex gap-2">
                          <button type="button" onClick={() => editDestination(destination)} className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">Edit</button>
                          <button type="button" onClick={() => deleteDestination(destination.id)} className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600">Delete</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'packages' && (
            <div className="space-y-5">
              <button type="button" onClick={() => setTourModalOpen(true)} className="rounded-full bg-emerald-600 px-5 py-3 font-semibold text-white shadow-lg">+ Add New Tour</button>
              {tourModalOpen && <div className="fixed inset-0 z-[1000] flex items-start justify-center overflow-y-auto bg-slate-950/70 p-3 sm:items-center sm:p-4" role="dialog" aria-modal="true">
              <div className="relative my-3 max-h-[calc(100vh-1.5rem)] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-4 shadow-2xl sm:my-0 sm:max-h-[90vh] sm:p-6">
                <button type="button" onClick={() => setTourModalOpen(false)} aria-label="Close tour dialog" className="absolute right-5 top-5 text-xl text-slate-500">✕</button>
                <h3 className="text-xl font-bold mb-4">{editingTourId ? 'Update Tour Package' : 'Create Tour Package'}</h3>
                <form onSubmit={saveTour} className="space-y-3">
                  <input name="title" value={tourForm.title} onChange={handleTourChange} placeholder="Tour title" maxLength={200} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3" style={tourValidation.title ? { border: '2px solid red' } : undefined} aria-invalid={tourValidation.title || undefined} />
                  {tourValidation.title && <p className="text-sm text-red-600">Enter a tour title between 2 and 200 characters.</p>}
                  <input name="price" value={tourForm.price} onChange={handleTourChange} placeholder="Price" className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3" style={tourValidation.price ? { border: '2px solid red' } : undefined} />
                  <select name="duration" value={tourForm.duration} onChange={handleTourChange} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3" style={tourValidation.duration ? { border: '2px solid red' } : undefined}><option value="">Select duration</option>{durationOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select>
                  <select name="category" value={tourForm.category} onChange={handleTourChange} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3" style={tourValidation.category ? { border: '2px solid red' } : undefined}><option value="">Select category</option>{categoryOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select>
                  <input name="destination" value={tourForm.destination} onChange={handleTourChange} placeholder="Destination" className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3" />
                  <input name="itinerary" value={tourForm.itinerary} onChange={handleTourChange} placeholder="Itinerary" className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3" />
                  <input name="availability" value={tourForm.availability} onChange={handleTourChange} placeholder="Availability" className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3" />
                  <textarea name="description" value={tourForm.description} onChange={handleTourChange} rows="4" placeholder="Description (optional)" className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3" />
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Image upload</label>
                    <input name="image_url" value="" type="file" accept="image/*" onChange={(event) => handleFileUpload(event, setTourForm, 'image_url')} className="block w-full text-sm text-slate-600" />
                  </div>
                  {tourForm.image_url && <img src={tourForm.image_url} alt="Tour preview" className="h-32 w-full rounded-xl object-cover" />}
                  <div className="flex gap-3">
                    <button type="submit" className="flex-1 rounded-full bg-brand px-5 py-3 font-semibold text-white">{editingTourId ? 'Update Tour' : 'Add Tour'}</button>
                    <button type="button" onClick={() => setTourModalOpen(false)} className="rounded-full border border-slate-300 px-5 py-3 font-semibold">Cancel</button>
                    {editingTourId && <button type="button" onClick={() => { setEditingTourId(null); setTourForm(emptyTourForm); }} className="rounded-full border border-slate-300 px-5 py-3 font-semibold">Cancel</button>}
                  </div>
                </form>
              </div>
              </div>}

              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <h3 className="text-xl font-bold mb-4">Tour package library</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {tours.map((tour) => (
                    <div key={tour.id} className="overflow-hidden rounded-2xl border border-slate-200">
                      {tour.image_url && <img src={tour.image_url} alt={tour.title} className="h-36 w-full object-cover" />}
                      <div className="p-4">
                        <p className="font-semibold">{tour.title}</p>
                        <p className="text-sm text-slate-500">{tour.category} • {tour.duration}</p>
                        <p className="mt-2 text-sm text-slate-600">{tour.description}</p>
                        <div className="mt-3 flex gap-2">
                          <button type="button" onClick={() => editTour(tour)} className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white">Edit</button>
                          <button type="button" onClick={() => deleteTour(tour.id)} className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600">Delete</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'gallery' && (
            <div className="grid xl:grid-cols-[0.9fr_1.1fr] gap-8">
              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <h3 className="text-xl font-bold mb-4">{editingGalleryId ? 'Update gallery memory' : 'Create gallery memory'}</h3>
                <form onSubmit={saveGalleryItem} className="space-y-3">
                  <input name="title" value={galleryForm.title} onChange={handleGalleryChange} placeholder="Memory title" className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3" required />
                  <textarea name="summary" value={galleryForm.summary} onChange={handleGalleryChange} rows="3" placeholder="Summary" className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3" />
                  <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" name="pinned" checked={galleryForm.pinned} onChange={handleGalleryChange} /> Pin to gallery</label>
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Image upload</label>
                    <input name="image_url" value="" type="file" accept="image/*" onChange={(event) => handleFileUpload(event, setGalleryForm, 'image_url')} className="block w-full text-sm text-slate-600" />
                  </div>
                  {galleryForm.image_url && <img src={galleryForm.image_url} alt="Gallery preview" className="h-32 w-full rounded-xl object-cover" />}
                  <div className="flex gap-3">
                    <button type="submit" className="flex-1 rounded-full bg-brand px-5 py-3 font-semibold text-white">{editingGalleryId ? 'Update memory' : 'Add memory'}</button>
                    {editingGalleryId && <button type="button" onClick={() => { setEditingGalleryId(null); setGalleryForm(emptyGalleryForm); }} className="rounded-full border border-slate-300 px-5 py-3 font-semibold">Cancel</button>}
                  </div>
                </form>
              </div>

              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <h3 className="text-xl font-bold mb-4">Gallery items</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {galleryItems.map((item) => (
                    <div key={item.id} className="overflow-hidden rounded-2xl border border-slate-200">
                      {item.image_url && <img src={item.image_url} alt={item.title} className="h-40 w-full object-cover" />}
                      <div className="p-4">
                        <p className="font-semibold">{item.title}</p>
                        <p className="mt-2 text-sm text-slate-600">{item.summary}</p>
                        <div className="mt-3 flex gap-2">
                          <button type="button" onClick={() => editGalleryItem(item)} className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white">Edit</button>
                          <button type="button" onClick={() => deleteGalleryItem(item.id)} className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600">Delete</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
              <div className="border-b border-slate-200 p-6"><h3 className="text-xl font-bold text-slate-900">Reviews Management</h3><p className="mt-1 text-sm text-slate-500">Review submissions are published immediately. Delete unwanted submissions.</p></div>
              <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-4 py-3">User Name</th><th className="px-4 py-3">Rating</th><th className="px-4 py-3">Review Text</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Action</th></tr></thead><tbody className="divide-y divide-slate-200">{reviews.length === 0 ? <tr><td colSpan="5" className="px-4 py-8 text-center text-slate-500">No reviews available.</td></tr> : reviews.map((review) => <tr key={review.id} className="text-slate-700"><td className="px-4 py-3 font-semibold text-slate-900">{review.user_name || review.name || 'Traveller'}</td><td className="px-4 py-3 text-amber-600">{review.rating}/5</td><td className="max-w-xs px-4 py-3">{review.review || review.comment}</td><td className="whitespace-nowrap px-4 py-3">{review.date || review.created_at ? new Date(review.date || review.created_at).toLocaleDateString() : 'Recent'}</td><td className="whitespace-nowrap px-4 py-3"><button type="button" onClick={() => deleteReview(review.id)} className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600">Delete</button></td></tr>)}</tbody></table></div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="overflow-hidden rounded-3xl bg-white shadow-sm"><div className="border-b border-slate-200 p-4 sm:p-6"><h3 className="text-xl font-bold text-slate-900">Registered Users</h3><input value={userSearch} onChange={(event) => setUserSearch(event.target.value)} placeholder="Search name, email, or contact number" className="mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-emerald-500" /></div><div className="overflow-x-auto"><table className="min-w-[720px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3">Name</th><th className="px-5 py-3">Email</th><th className="px-5 py-3">Contact Number</th><th className="px-5 py-3">Country</th><th className="px-5 py-3">Date Registered</th></tr></thead><tbody className="divide-y divide-slate-200">{filteredUsers.length === 0 ? <tr><td colSpan="5" className="px-5 py-8 text-center text-slate-500">No matching users available.</td></tr> : filteredUsers.map((registeredUser) => <tr key={registeredUser.id || registeredUser.email} className="text-slate-700"><td className="px-5 py-3 font-semibold text-slate-900">{registeredUser.name}</td><td className="px-5 py-3">{registeredUser.email}</td><td className="px-5 py-3">{registeredUser.phone || registeredUser.contact_number || 'N/A'}</td><td className="px-5 py-3">{registeredUser.country || 'Not provided'}</td><td className="px-5 py-3">{registeredUser.registeredAt ? new Date(registeredUser.registeredAt).toLocaleDateString() : registeredUser.created_at ? new Date(registeredUser.created_at).toLocaleDateString() : 'Available in account record'}</td></tr>)}</tbody></table></div></div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-xl rounded-3xl bg-white p-6 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900">Change Password</h3>
              <p className="mt-1 text-sm text-slate-500">Update the password for this administrator account.</p>
              <form onSubmit={changeAdminPassword} className="mt-5 space-y-4">
                <label className="block text-sm font-semibold text-slate-700">
                  Current Password
                  <input type="password" value={passwordForm.currentPassword} onChange={(event) => setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-normal" required />
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  New Password
                  <input type="password" minLength="8" value={passwordForm.newPassword} onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-normal" required />
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Confirm New Password
                  <input type="password" minLength="8" value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-normal" required />
                </label>
                <button type="submit" className="rounded-full bg-emerald-600 px-5 py-3 font-semibold text-white shadow-lg">Change password</button>
              </form>
            </div>
          )}

          {activeTab === 'inquiries' && (
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h3 className="text-xl font-bold mb-4">Tour Inquiries & Route Requests</h3>
              <div className="space-y-4">
                {inquiries.length === 0 ? <p className="text-slate-500">No incoming inquiries yet.</p> : inquiries.map((inquiry) => (
                  <div key={inquiry.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="font-semibold">{inquiry.name}</p>
                        <p className="text-sm text-slate-500">{inquiry.email}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {STATUS_OPTIONS.map((status) => (
                          <button key={status} onClick={() => updateInquiryStatus(inquiry.id, status)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${inquiry.status === status ? 'bg-brand text-white' : 'bg-slate-100 text-slate-700'}`}>
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>
                    <span className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-bold ${statusStyles[inquiry.status] || statusStyles.Pending}`}>{inquiry.status || 'Pending'}</span>
                    <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                      <p className="font-semibold mb-1">Route:</p>
                      <p>{Array.isArray(inquiry.route) ? inquiry.route.join(' → ') : inquiry.route || 'Not specified'}</p>
                    </div>
                    <textarea name="notes" value={inquiry.notes || ''} onChange={(event) => setInquiries((prev) => prev.map((item) => (item.id === inquiry.id ? { ...item, notes: event.target.value } : item)))} rows="3" className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 p-3" placeholder="Admin notes" />
                    <div className="mt-3 flex justify-end">
                      <button onClick={() => saveInquiryNotes(inquiry.id, inquiry.notes || '')} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Save notes</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'pins' && (
            <div className="space-y-4">
              <div className="rounded-3xl bg-white p-4 shadow-sm">
                <h3 className="text-xl font-bold mb-2">Saved pins</h3>
                <div className="flex flex-wrap gap-2">
                  {mapPins.map((pin) => (
                    <button key={pin.id || `${pin.name}-${pin.lat}-${pin.lng}`} type="button" onClick={() => editPin(pin)} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">{pin.name}</button>
                  ))}
                </div>
              </div>

              <MapPinsEditor
                pinForm={pinForm}
                setPinForm={setPinForm}
                mapPins={mapPins}
                onSave={savePin}
                onDelete={deletePin}
                onEdit={editPin}
                onReset={resetPins}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
