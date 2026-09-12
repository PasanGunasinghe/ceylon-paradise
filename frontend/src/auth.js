const TOKEN_KEY = 'ceylon_paradise_token';

export const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token) => localStorage.setItem(TOKEN_KEY, token),
  clearToken: () => localStorage.removeItem(TOKEN_KEY),
  getUser: () => {
    try {
      return JSON.parse(localStorage.getItem('ceylon_paradise_user') || 'null');
    } catch {
      return null;
    }
  },
  setUser: (user) => localStorage.setItem('ceylon_paradise_user', JSON.stringify(user)),
  clearUser: () => localStorage.removeItem('ceylon_paradise_user'),
};

export function getAuthHeaders() {
  const token = authStorage.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function isAuthenticationRequest(url = '') {
  const pathname = new URL(url, window.location.origin).pathname.toLowerCase();
  return pathname === '/login'
    || pathname.endsWith('/login')
    || pathname.includes('/auth/');
}

export async function fetchWithAuth(url, options = {}) {
  const response = await fetch(url, options);

  if (response.status === 403 && !isAuthenticationRequest(url)) {
    const body = await response.clone().json().catch(() => null);
    if (body?.message === 'Invalid or expired token') {
      authStorage.clearToken();
      authStorage.clearUser();
      if (window.location.pathname !== '/login') window.location.assign('/login');
    }
  }

  return response;
}
