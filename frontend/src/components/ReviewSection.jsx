import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../api';
import { fetchWithAuth } from '../auth';

export default function ReviewSection({ tourId }) {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [photos, setPhotos] = useState([]);

  const loadReviews = async () => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/reviews`);
      if (!response.ok) throw new Error('Failed to fetch reviews');
      const data = await response.json();
      setReviews(Array.isArray(data) ? data.filter((item) => item && item.tour_id === Number(tourId)) : []);
    } catch {
      setReviews([]);
    }
  };

  useEffect(() => {
    if (tourId) loadReviews();
  }, [tourId]);

  const submitReview = async (event) => {
    event.preventDefault();
    const token = localStorage.getItem('ceylon_paradise_token');

    if (!token) {
      navigate('/login?next=/');
      return;
    }

    const user = JSON.parse(localStorage.getItem('ceylon_paradise_user') || 'null');
    if (!tourId || !Number.isInteger(Number(tourId)) || !Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5 || !review.trim()) {
      window.alert('Please fill all required fields correctly!');
      return;
    }
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/reviews`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ tour_id: tourId, rating, review, photos }) });
      if (!response.ok) throw new Error('Failed to submit review');
      await loadReviews();
    } catch (error) {
      console.error(error);
      return;
    }
    setReview('');
    setRating(5);
    setPhotos([]);
  };

  return (
    <div className="mt-8 bg-white rounded-3xl p-6 shadow-sm">
      <h3 className="text-2xl font-bold mb-4">Reviews</h3>

      <div className="space-y-4 mb-6">
        {reviews.length === 0 ? <p>No reviews yet.</p> : reviews.map((item) => (
          <div key={item.id} className="border rounded-2xl p-4">
            <div className="flex justify-between">
              <p className="font-semibold">{item.user_name}</p>
              <p className="text-brand font-semibold">{item.rating}/5</p>
            </div>
            <p className="mt-2 text-slate-600">{item.review}</p>
            {item.photos?.length > 0 && <div className="mt-3 flex gap-2">{item.photos.map((photo) => <img key={photo} src={photo} alt="Review attachment" className="h-16 w-16 rounded-lg object-cover" />)}</div>}
          </div>
        ))}
      </div>

      <form onSubmit={submitReview} className="space-y-3">
          <select name="rating" value={rating} onChange={(e) => setRating(Number(e.target.value))} className="form-control rounded-xl p-3 w-full">
          {[5, 4, 3, 2, 1].map((value) => (
            <option key={value} value={value}>{value} stars</option>
          ))}
        </select>
        <textarea name="review" value={review} onChange={(e) => setReview(e.target.value)} rows="3" className="w-full border rounded-xl p-3" placeholder="Share your experience" required />
        <input name="photos" value="" type="file" accept="image/*" multiple onChange={(event) => {
          const files = Array.from(event.target.files || []).slice(0, 5);
          files.forEach((file) => { const reader = new FileReader(); reader.onload = () => setPhotos((current) => [...current, reader.result].slice(0, 5)); reader.readAsDataURL(file); });
        }} className="block w-full text-sm text-slate-600" />
        {photos.length > 0 && <div className="flex gap-2">{photos.map((photo) => <img key={photo} src={photo} alt="Selected review attachment" className="h-14 w-14 rounded-lg object-cover" />)}</div>}
        <button type="submit" className="bg-brand text-white px-5 py-3 rounded-full">Submit Review</button>
      </form>
    </div>
  );
}
