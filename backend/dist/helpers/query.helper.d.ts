/**
 * helpers/query.helper.ts
 *
 * Build Prisma `where` dari filter/search terstandar.
 *
 * search → OR dari substring (`contains`, case-insensitive) pada fields yang diizinkan.
 * filters → map field → value, atau field → { op: value } dengan op yang didukung.
 *
 * Operator yang didukung:
 *   eq, ne, lt, lte, gt, gte, in, contains, starts, ends
 *
 * Contoh:
 *   buildWhere({
 *     search: { term: 'document', fields: ['title', 'shortUrl', 'keterangan'] },
 *     filters: {
 *       isActive: { eq: true },
 *       userId: { in: [1, 2, 3] },
 *     },
 *     extra: { deletedAt: null },
 *     allowedFilters: ['isActive', 'userId', 'createdAt'],
 *   });
 */
export interface SearchConfig {
    term?: string;
    fields?: string[];
}
export interface BuildWhereOptions {
    search?: SearchConfig;
    filters?: Record<string, unknown>;
    allowedFilters?: string[];
    extra?: Record<string, unknown>;
}
export declare function buildWhere(opts: BuildWhereOptions): Record<string, unknown>;
//# sourceMappingURL=query.helper.d.ts.map