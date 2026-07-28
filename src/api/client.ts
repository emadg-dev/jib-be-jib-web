import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true, // Crucial for HTTP-only cookies
  headers: { 'Content-Type': 'application/json' }
});

apiClient.interceptors.request.use((config) => {
  console.log("REQUEST");
  console.log(config.url);
  console.log(config.withCredentials);
  return config;
});

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.log('========== API ERROR ==========');
    console.log('URL:', error.config?.url);
    console.log('Status:', error.response?.status);
    console.log('Headers:', error.response?.headers);
    console.log('Error:', error);

    // if (error.response?.status === 401) {
    //   window.dispatchEvent(new Event('auth-error'));
    // }
    console.log(error.config);
  //   if (
  //     error.response?.status === 401 &&
  //     error.config?.url?.includes('/auth/me')
  // ) {
  //     window.dispatchEvent(new Event('auth-error'));
  // }

    return Promise.reject(error.response?.data || error.message);
  }
);