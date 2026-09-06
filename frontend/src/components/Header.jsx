import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useTheme } from '../theme.jsx';

const navItems = [
  { key: 'home', label: 'Home', to: '/' },
  { key: 'destinationsTours', label: 'Destinations & Tours', to: '/destinations' },
  { key: 'mapPlanner', label: 'Map Planner', to: '/map-planner' },
  { key: 'gallery', label: 'Gallery', to: '/gallery' },
  { key: 'about', label: 'About', to: '/about' },
  { key: 'contact', label: 'Contact', to: '/contact' },
];

export default function Header({ authUser, onLogout }) {
  const { theme, setTheme, language, setLanguage, t } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const languageOptions = [
    { value: 'en', label: 'EN' },
    { value: 'de', label: 'DE' },
    { value: 'fr', label: 'FR' },
    { value: 'ru', label: 'RU' },
    { value: 'ja', label: 'JP' },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border-soft)] bg-[var(--surface-glass)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="min-w-0">
          <p className="text-2xl font-black text-[var(--text-primary)]">Ceylon Paradise</p>
          <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--text-muted)]">Expeditions</p>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-[var(--text-muted)] lg:flex">
          {navItems.map((item) => (
            <NavLink key={item.key} to={item.to} end={item.to === '/'} className={({ isActive }) => `relative py-2 transition-colors hover:text-[var(--accent)] ${isActive ? 'font-bold text-[var(--accent)] after:absolute after:inset-x-0 after:-bottom-1 after:h-0.5 after:bg-[var(--accent)]' : ''}`}>
              {t[item.key] || item.label}
            </NavLink>
          ))}

        </nav>

        <button type="button" onClick={() => setMenuOpen((open) => !open)} className="rounded-full border border-[var(--border-soft)] px-3 py-2 text-lg text-[var(--text-primary)] lg:hidden" aria-label="Toggle navigation menu" aria-expanded={menuOpen}>☰</button>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-[var(--surface)] p-1.5 shadow-sm">
            <button
              type="button"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="rounded-full px-2.5 py-1 text-xs font-semibold text-[var(--text-primary)] transition hover:bg-[var(--card-hover)]"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? '☾' : '☀'}
            </button>
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              className="form-control appearance-none rounded-full border-0 bg-transparent px-2 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-primary)] outline-none"
              aria-label="Language selector"
            >
              {languageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {authUser ? (
            <>
              <Link to={authUser.role === 'admin' ? '/admin' : '/dashboard'} className="text-sm font-semibold text-[var(--text-primary)] transition-colors hover:text-[var(--accent)]">
                {authUser.role === 'admin' ? t.adminPanel : t.dashboard}
              </Link>
              <button onClick={onLogout} className="rounded-full bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90">
                {t.logout}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="rounded-full border border-[var(--border-soft)] bg-[var(--surface)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--accent-soft)] hover:text-[var(--accent)]">
                {t.signIn}
              </Link>
              <Link to="/register" className="rounded-full bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90">
                {t.register}
              </Link>
            </>
          )}
        </div>
      </div>
      {menuOpen && <nav className="border-t border-[var(--border-soft)] px-4 py-4 lg:hidden"><div className="mx-auto grid max-w-7xl gap-3 text-sm font-medium text-[var(--text-muted)]">{navItems.map((item) => <NavLink key={item.key} to={item.to} end={item.to === '/'} onClick={() => setMenuOpen(false)} className={({ isActive }) => `rounded-xl px-3 py-2 hover:bg-[var(--card-hover)] hover:text-[var(--accent)] ${isActive ? 'bg-[var(--accent-soft)] font-bold text-[var(--accent)]' : ''}`}>{t[item.key] || item.label}</NavLink>)}</div></nav>}
    </header>
  );
}
