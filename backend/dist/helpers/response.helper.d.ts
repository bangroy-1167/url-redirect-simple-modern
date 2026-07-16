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
export declare function ok<T>(data: T, message?: string, meta?: ApiMeta): ApiSuccess<T>;
export declare function fail(message: string, errors?: ApiError['errors']): ApiError;
export declare function validationFail(errors: Record<string, string[]>): ApiError;
//# sourceMappingURL=response.helper.d.ts.map