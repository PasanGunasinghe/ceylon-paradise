const { demoTours, demoDestinations, demoUsers, demoBookings, demoReviews } = require('./demoData');

const defaultCategories = [
  { id: 1, name: 'Wild', slug: 'wild', description: 'Safari, wildlife, and nature-led escapes' },
  { id: 2, name: 'Scenery', slug: 'scenery', description: 'Mountain, tea, and coastal views' },
  { id: 3, name: 'Historical', slug: 'historical', description: 'Ancient cities, heritage, and culture' },
  { id: 4, name: 'Luxury', slug: 'luxury', description: 'Tailored premium experiences' },
];

const defaultMemories = [
  {
    id: 1,
    title: 'Sunrise over Ella Gap',
    image_url: 'https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=1200&q=80',
    summary: 'A misty start with breathtaking ridge views and tea country silence.',
    pinned: true,
  },
  {
    id: 2,
    title: 'Sigiriya at golden hour',
    image_url: 'https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=1200&q=80',
    summary: 'The fortress glows in the late afternoon light across the valley.',
    pinned: true,
  },
];

const defaultMapPins = [
  { id: 1, name: 'Ella Gap', lat: 6.8667, lng: 81.0464, description: 'Scenic ridge and tea valley', photo_url: 'https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=1200&q=80' },
  { id: 2, name: 'Sigiriya', lat: 7.9555, lng: 80.7535, description: 'Ancient rock fortress', photo_url: 'https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=1200&q=80' },
  { id: 3, name: 'Mirissa Beach', lat: 5.9484, lng: 80.4588, description: 'Sunset coast and whale watching', photo_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80' },
];

const defaultInquiries = [
  {
    id: 1,
    name: 'Mila Johnson',
    email: 'mila@example.com',
    type: 'custom-route',
    status: 'Pending',
    notes: 'Interested in combining Sigiriya, Kandy, and Ella with a luxury stay.',
    travelers: 2,
    route: ['Sigiriya', 'Kandy', 'Ella'],
    created_at: new Date().toISOString(),
  },
];

const state = {
  tours: [...demoTours],
  destinations: [...demoDestinations],
  users: [...demoUsers],
  bookings: [...demoBookings],
  reviews: [...demoReviews],
  categories: [...defaultCategories],
  memories: [...defaultMemories],
  mapPins: [...defaultMapPins],
  inquiries: [...defaultInquiries],
  notifications: [],
};

const getNextId = (collection) => {
  const maxId = collection.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0);
  return maxId + 1;
};

module.exports = {
  state,
  getNextId,
};
