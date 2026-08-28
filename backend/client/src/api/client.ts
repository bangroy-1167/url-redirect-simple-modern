import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api8url';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('Interceptor - Token:', token ? 'present' : 'missing');
    if (token) {
      (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token as string);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401) {
      const isAuthEndpoint = originalRequest.url?.includes('/auth/');

      if (!isAuthEndpoint && !originalRequest._retry) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then(token => {
            if (originalRequest.headers) {
              originalRequest.headers['Authorization'] = 'Bearer ' + token;
            }
            return api(originalRequest);
          }).catch(err => {
            return Promise.reject(err);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          try {
            const { data } = await axios.post(API_BASE_URL + '/auth/refresh', { refreshToken });
            const newToken = data.data.token;
            localStorage.setItem('token', newToken);
            if (data.data.refreshToken) {
               localStorage.setItem('refreshToken', data.data.refreshToken);
            }
            if (originalRequest.headers) {
               originalRequest.headers['Authorization'] = 'Bearer ' + newToken;
            }
            processQueue(null, newToken);
            isRefreshing = false;
            return api(originalRequest);
          } catch (refreshError) {
            processQueue(refreshError, null);
            isRefreshing = false;
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            window.location.href = '/kelola/login';
            return Promise.reject(refreshError);
          }
        } else {
          isRefreshing = false;
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/kelola/login';
        }
      } else if (!isAuthEndpoint) {
          // Retry failed, go to login
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/kelola/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: { username: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
  me: () => api.get('/auth/me'),
};

// URL API
export const urlApi = {
  list: (params?: Record<string, unknown>) =>
    api.get('/urls', { params }),
  get: (id: number) =>
    api.get(`/urls/${id}`),
  create: (data: Record<string, unknown>) =>
    api.post('/urls', data),
  update: (id: number, data: Record<string, unknown>) =>
    api.put(`/urls/${id}`, data),
  delete: (id: number) =>
    api.delete(`/urls/${id}`),
  resetCounter: (id: number) =>
    api.post(`/urls/${id}/reset-counter`),
};

// Admin URL API
export const adminUrlApi = {
  list: (params?: Record<string, unknown>) =>
    api.get('/admin/urls', { params }),
};

// Admin User API
export const adminUserApi = {
  list: (params?: Record<string, unknown>) =>
    api.get('/admin/users', { params }),
  get: (id: number) =>
    api.get(`/admin/users/${id}`),
  create: (data: Record<string, unknown>) =>
    api.post('/admin/users', data),
  update: (id: number, data: Record<string, unknown>) =>
    api.put(`/admin/users/${id}`, data),
  delete: (id: number) =>
    api.delete(`/admin/users/${id}`),
};

// Analytics API
export const analyticsApi = {
  overview: () =>
    api.get('/analytics/overview'),
  urlStats: (id: number) =>
    api.get(`/urls/${id}/analytics`),
};

// Admin Stats API
export const adminStatsApi = {
  get: () =>
    api.get('/admin/stats'),
};
