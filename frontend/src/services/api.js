import axios from 'axios';
import { toast } from 'sonner';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    let token;
    try {
      const storedAuthState = JSON.parse(localStorage.getItem('auth-storage'));
      token = storedAuthState?.state?.token;
    } catch (parseError) {
      console.warn('Failed to parse auth storage during request', parseError);
    }
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const authStore = (await import('../stores/authStore')).useAuthStore.getState();
      const refreshed = await authStore.refreshAccessToken();

      if (refreshed) {
        originalRequest.headers['Authorization'] = `Bearer ${authStore.token}`;
        return api(originalRequest);
      } else {
        authStore.logout();
        window.location.href = '/login';
      }
    }

    if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    }

    return Promise.reject(error);
  }
);

export default api;