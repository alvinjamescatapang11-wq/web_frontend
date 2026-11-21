import axios from 'axios';

const TOKEN_KEY = 'agritrack_access_token';
const USER_KEY = 'agritrack_user';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/',
  headers: { Accept: 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = window.sessionStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = ['Bearer', token].join(' ');
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && window.sessionStorage.getItem(TOKEN_KEY)) {
      window.sessionStorage.removeItem(TOKEN_KEY);
      window.sessionStorage.removeItem(USER_KEY);
      window.dispatchEvent(new Event('agritrack:unauthorized'));
    }
    return Promise.reject(error);
  },
);

export const authApi = {
  async login(credentials) {
    const response = await api.post('/api/auth/login', credentials);
    const { accessToken, user } = response.data.data;
    window.sessionStorage.setItem(TOKEN_KEY, accessToken);
    this.cacheUser(user);
    return user;
  },

  async googleLogin(credential) {
    const response = await api.post('/api/auth/google', { credential });
    const { accessToken, user } = response.data.data;
    window.sessionStorage.setItem(TOKEN_KEY, accessToken);
    this.cacheUser(user);
    return user;
  },

  async currentUser() {
    const response = await api.get('/api/auth/me');
    const user = response.data.data;
    this.cacheUser(user);
    return user;
  },

  cacheUser(user) {
    window.sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  getCachedUser() {
    if (!window.sessionStorage.getItem(TOKEN_KEY)) {
      window.sessionStorage.removeItem(USER_KEY);
      return null;
    }

    const cachedUser = window.sessionStorage.getItem(USER_KEY);
    if (!cachedUser) return null;

    try {
      const user = JSON.parse(cachedUser);
      if (!user || typeof user !== 'object' || typeof user.role !== 'string') {
        window.sessionStorage.removeItem(USER_KEY);
        return null;
      }
      return user;
    } catch {
      window.sessionStorage.removeItem(USER_KEY);
      return null;
    }
  },

  async logout() {
    if (!window.sessionStorage.getItem(TOKEN_KEY)) return;
    await api.post('/api/auth/logout');
  },

  clearToken() {
    window.sessionStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.removeItem(USER_KEY);
  },

  hasToken() {
    return Boolean(window.sessionStorage.getItem(TOKEN_KEY));
  },
};

export function getApiErrorMessage(error) {
  return error.response?.data?.error?.message
    || error.message
    || 'The server could not complete the request.';
}
