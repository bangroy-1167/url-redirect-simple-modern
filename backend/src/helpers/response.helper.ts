/**
 * helpers/response.helper.ts
 *
 * Format respons API konsisten di seluruh aplikasi modernURL8.
 * Mengadopsi kontrak spesifikasi (`success`, `message`, `data`, `meta`, `errors`).
 */

export interface ApiMeta {
  page?: number;
  per_page?: number;
  total?: number;
  total_pages?: number;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, unknown>;
  [k: string]: unknown;
}

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
  meta?: ApiMeta;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[] | string> | unknown;
}

export function ok<T>(data: T, message: string = 'Success', meta?: ApiMeta): ApiSuccess<T> {
  return meta ? { success: true, message, data, meta } : { success: true, message, data };
}

export function fail(message: string, errors?: ApiError['errors']): ApiError {
  return errors ? { success: false, message, errors } : { success: false, message };
}

export function validationFail(errors: Record<string, string[]>): ApiError {
  return { success: false, message: 'Validation error', errors };
}
