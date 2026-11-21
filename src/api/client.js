import axios from 'axios';

const TOKEN_KEY = 'agritrack_access_token';

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
    return user;
  },

  async googleLogin(credential) {
    const response = await api.post('/api/auth/google', { credential });
    const { accessToken, user } = response.data.data;
    window.sessionStorage.setItem(TOKEN_KEY, accessToken);
    return user;
  },

  async currentUser() {
    const response = await api.get('/api/auth/me');
    return response.data.data;
  },

  async logout() {
    if (!window.sessionStorage.getItem(TOKEN_KEY)) return;
    await api.post('/api/auth/logout');
  },

  clearToken() {
    window.sessionStorage.removeItem(TOKEN_KEY);
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
