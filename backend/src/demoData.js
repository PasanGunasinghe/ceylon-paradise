const demoTours = [
  {
    id: 1,
    title: 'Cultural Triangle Escape',
    price: 220.0,
    duration: '3 Days / 2 Nights',
    description: 'Explore Sri Lanka\'s heritage sites including Sigiriya, Kandy, and Dambulla.',
    category: 'Cultural',
    destination: 'Central Province',
    image_url: 'https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=1200&q=80',
    availability: 'Available',
    itinerary: 'Sigiriya, Dambulla, Kandy',
  },
  {
    id: 2,
    title: 'Ella Scenic Adventure',
    price: 310.0,
    duration: '4 Days / 3 Nights',
    description: 'A scenic getaway filled with waterfalls, mountains, and train rides.',
    category: 'Adventure',
    destination: 'Uva Province',
    image_url: 'https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=1200&q=80',
    availability: 'Available',
    itinerary: 'Ella, Nine Arch Bridge, Ravana Falls',
  },
  {
    id: 3,
    title: 'Southern Coast Retreat',
    price: 280.0,
    duration: '3 Days / 2 Nights',
    description: 'Relax by the coast, discover Galle, and enjoy beach experiences.',
    category: 'Beach',
    destination: 'Southern Province',
    image_url: 'https://images.unsplash.com/photo-1566296566094-1a92a5477d9c?auto=format&fit=crop&w=1200&q=80',
    availability: 'Limited',
    itinerary: 'Galle, Unawatuna, Mirissa',
  },
];

const demoDestinations = [
  {
    id: 1,
    name: 'Sigiriya Rock Fortress',
    description: 'Ancient rock fortress with panoramic views and stunning frescoes.',
    image_url: 'https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=1200&q=80',
    location: 'Central Province',
    activities: ['Sunrise climb and panoramic views', 'Heritage and fresco exploration', 'Elephant safari and village visit'],
    weather: 'Warm with cooler evenings',
    best_time: 'December to April',
  },
  {
    id: 2,
    name: 'Ella',
    description: 'Green hills, tea estates, waterfalls, and scenic railway routes.',
    image_url: 'https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=1200&q=80',
    location: 'Uva Province',
    activities: ['Tea estate walks', 'Waterfall hikes', 'Scenic train rides'],
    weather: 'Cool and misty mountain climate',
    best_time: 'January to March',
  },
  {
    id: 3,
    name: 'Galle Fort',
    description: 'Historic colonial fort with ocean views and charming town streets.',
    image_url: 'https://images.unsplash.com/photo-1566296566094-1a92a5477d9c?auto=format&fit=crop&w=1200&q=80',
    location: 'Southern Province',
    activities: ['Heritage walks and boutique shopping', 'Beach sunset dining', 'Coastal day trips'],
    weather: 'Warm and breezy coastal weather',
    best_time: 'November to March',
  },
];

const demoUsers = [
  {
    id: 1,
    name: 'Admin User',
    email: 'admin@ceylonparadise.com',
    password: '$2a$10$lSHyLyWpdtaq4zCAl14M8.CUfSzSaQDLjLj8ucmbE0fXWM8aRyCUe',
    role: 'admin',
  },
  {
    id: 2,
    name: 'Tourist User',
    email: 'user@ceylonparadise.com',
    password: '$2a$10$16S7skInYzdbtM3SmGNmguZ4dIOWXntSVW2Dq5yPu1UvNLgACVSYO',
    role: 'user',
  },
];

const demoBookings = [
  {
    id: 1,
    user_name: 'Nimal Perera',
    user_email: 'nimal@example.com',
    tour_id: 1,
    tour_title: 'Cultural Triangle Escape',
    date: '2026-09-15',
    status: 'pending',
    payment_status: 'pending',
    payment_method: 'credit-card',
    guests: 2,
    total_amount: 440,
    booking_reference: 'CP-1001',
    notes: 'Need pickup from Colombo.',
  },
  {
    id: 2,
    user_name: 'Aisha Silva',
    user_email: 'aisha@example.com',
    tour_id: 2,
    tour_title: 'Ella Scenic Adventure',
    date: '2026-09-20',
    status: 'confirmed',
    payment_status: 'paid',
    payment_method: 'paypal',
    guests: 1,
    total_amount: 310,
    booking_reference: 'CP-1002',
    notes: 'Interested in a private guide.',
  },
];

const demoReviews = [
  {
    id: 1,
    tour_id: 1,
    user_name: 'Nimal Perera',
    rating: 5,
    review: 'The cultural trip was well organized and truly memorable.',
  },
];

module.exports = {
  demoTours,
  demoDestinations,
  demoUsers,
  demoBookings,
  demoReviews,
};
