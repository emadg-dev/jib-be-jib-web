import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true, // Crucial for HTTP-only cookies
  headers: { 'Content-Type': 'application/json' }
});

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      window.dispatchEvent(new Event('auth-error'));
    }
    return Promise.reject(error.response?.data || error.message);
  }
);