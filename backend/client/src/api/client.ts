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
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Only redirect to login if explicitly unauthorized
      // Don't redirect on other errors
      const isAuthEndpoint = error.config?.url?.includes('/auth/');
      if (!isAuthEndpoint) {
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
