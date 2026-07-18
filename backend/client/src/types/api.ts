// API Types for modernURL8

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  meta?: ApiMeta;
  errors?: Record<string, string[]>;
}

export interface ApiMeta {
  page?: number;
  per_page?: number;
  total?: number;
  total_pages?: number;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  search?: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'ADMIN' | 'USER';
  isActive: boolean;
  language?: string; // User's preferred language
  createdAt: string;
}

export interface Url8 {
  id: number;
  shortUrl: string;
  targetUrl: string;
  title?: string;
  keterangan?: string;
  description?: string;
  password?: string | null;
  expiresAt?: string | null;
  expDate?: string | null;
  hitCounter: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  userId?: number;
  user?: Pick<User, 'id' | 'username' | 'email'>;
}

export interface Stats {
  totalUrls: number;
  totalUsers: number;
  totalHits: number;
  activeUrls: number;
  inactiveUrls: number;
  topUrls: Array<{
    id: number;
    shortUrl: string;
    title?: string;
    hitCounter: number;
  }>;
  recentActivity: Array<{
    date: string;
    count: number;
  }>;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface CreateUrlRequest {
  shortUrl?: string;
  targetUrl: string;
  title?: string;
  keterangan?: string;
  password?: string;
  expiresAt?: string;
}

export interface UpdateUrlRequest {
  shortUrl?: string;
  targetUrl?: string;
  title?: string;
  keterangan?: string;
  password?: string | null;
  expiresAt?: string | null;
  isActive?: boolean;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  role?: 'ADMIN' | 'USER';
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  password?: string;
  role?: 'ADMIN' | 'USER';
  isActive?: boolean;
  language?: string;
}

export interface PaginationParams {
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  search?: string;
}
