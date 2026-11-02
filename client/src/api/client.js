import axios from 'axios';
import i18n from '../i18n';

let accessToken = null;
let refreshPromise = null;
let refreshHandler = null;

export const setAccessToken = (token) => {
  accessToken = token || null;
};

export const getAccessToken = () => accessToken;

export const setRefreshHandler = (handler) => {
  refreshHandler = handler;
};

export const resolveApiUrl = (path) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  const base = import.meta.env.VITE_API_URL || '';
  if (/^https?:\/\//i.test(base)) {
    return `${base.replace(/\/api\/?$/, '').replace(/\/$/, '')}${path}`;
  }
  return path;
};

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  timeout: 30000
});

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  config.headers['Accept-Language'] = i18n.language || 'rw';
  return config;
});

const isAuthEndpoint = (url = '') =>
  /\/auth\/(login|register|refresh|logout)/.test(url);

export const refreshSession = async () => {
  if (!refreshPromise) {
    refreshPromise = api
      .post('/auth/refresh')
      .then((response) => {
        const data = response.data.data;
        setAccessToken(data.accessToken);
        if (refreshHandler) refreshHandler(data.user);
        return data;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    if (
      status === 401 &&
      original &&
      !original._retry &&
      !isAuthEndpoint(original.url)
    ) {
      original._retry = true;
      try {
        await refreshSession();
        return api(original);
      } catch {
        setAccessToken(null);
        if (refreshHandler) refreshHandler(null);
        window.dispatchEvent(new CustomEvent('govvoice:session-expired'));
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
