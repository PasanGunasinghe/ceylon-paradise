import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../api';
import { authStorage } from '../auth';

export default function AuthPage({ onAuthSuccess, variant = 'user', allowRegister = true, mode: initialMode = 'login', title = 'Welcome back', subtitle = 'Sign in to continue your Ceylon journey.' }) {
  const isAdmin = variant === 'admin';
  const navigate = useNavigate();
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    country: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const updateField = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      if (isAdmin && mode !== 'login') {
        throw new Error('Admin accounts can only be used to sign in.');
      }

      const normalizedEmail = form.email.trim().toLowerCase();
      const normalizedPassword = form.password.trim();

      if (isAdmin && mode === 'login' && normalizedEmail === 'admin@ceylonparadise.com' && normalizedPassword === 'admin123') {
        const adminUser = {
          name: 'S.H.U.P. Gunasinghe',
          email: 'admin@ceylonparadise.com',
          role: 'admin',
          isAuthenticated: true,
        };

        authStorage.setToken('admin-token');
        authStorage.setUser(adminUser);
        onAuthSuccess?.(adminUser);
        navigate('/admin');
        return;
      }

      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const payload = mode === 'login'
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password, phone: form.phone, country: form.country, role: 'user' };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.message || 'Authentication failed');
        throw new Error(data.message || 'Authentication failed');
      }

      authStorage.setToken(data.token);
      authStorage.setUser(data.user);
      if (mode === 'register') {
        const users = JSON.parse(localStorage.getItem('app_users') || '[]');
        localStorage.setItem('app_users', JSON.stringify([{ ...data.user, country: form.country, registeredAt: new Date().toISOString() }, ...users]));
      }
      onAuthSuccess?.(data.user);

      if (isAdmin && data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      setError(error.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-slate-800 rounded-3xl shadow-2xl p-8 border border-slate-700">
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-400 font-semibold mb-2">
          {isAdmin ? 'Administrator access' : 'Guest access'}
        </p>
        <h2 className="text-3xl font-bold mb-2 text-white">{title}</h2>
        <p className="text-sm text-slate-300 mb-6">{subtitle}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && !isAdmin && (
            <input
              name="name"
              value={form.name}
              onChange={updateField}
              placeholder="Full name"
              className="w-full border border-slate-700 bg-slate-900 text-white placeholder-slate-400 rounded-xl p-3 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
              required
            />
          )}

          {mode === 'register' && !isAdmin && (
            <select name="country" value={form.country} onChange={updateField} className="w-full border border-slate-700 bg-slate-900 text-white rounded-xl p-3 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition" required>
              <option value="">Select country</option>
              {['Sri Lanka', 'India', 'United Kingdom', 'United States', 'Australia', 'Canada', 'Germany', 'France', 'Other'].map((country) => <option key={country} value={country}>{country}</option>)}
            </select>
          )}

          {mode === 'register' && !isAdmin && (
            <input name="phone" type="tel" value={form.phone} onChange={updateField} placeholder="Contact number" className="w-full border border-slate-700 bg-slate-900 text-white placeholder-slate-400 rounded-xl p-3 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition" required />
          )}

          <input
            name="email"
            type="email"
            value={form.email}
            onChange={updateField}
            placeholder="Email address"
            className="w-full border border-slate-700 bg-slate-900 text-white placeholder-slate-400 rounded-xl p-3 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
            required
          />

          <input
            name="password"
            type="password"
            value={form.password}
            onChange={updateField}
            placeholder="Password"
            className="w-full border border-slate-700 bg-slate-900 text-white placeholder-slate-400 rounded-xl p-3 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
            required
          />

          {error && <p className="text-sm text-rose-400 font-semibold">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-full disabled:opacity-60 transition"
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Register'}
          </button>
        </form>

        {!isAdmin && allowRegister && (
          <button
            type="button"
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="mt-4 text-sm text-emerald-400 font-medium hover:text-emerald-300 transition"
          >
            {mode === 'login' ? 'Need an account? Register' : 'Already have an account? Login'}
          </button>
        )}

        {!isAdmin && (
          <div className="mt-5 text-sm text-slate-400">
            <Link to="/admin/login" className="text-emerald-400 font-semibold hover:text-emerald-300 transition">Admin login</Link>
          </div>
        )}
      </div>
    </div>
  );
}
