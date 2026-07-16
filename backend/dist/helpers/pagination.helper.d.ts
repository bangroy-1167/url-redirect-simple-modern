/**
 * helpers/pagination.helper.ts
 *
 * Parse query-string pagination/sort/search menjadi argumen siap dipakai Prisma/MySQL.
 *
 * Konvensi query-string (selaras dengan spesifikasi /api8url):
 *   ?page=1                 (default: 1)
 *   &per_page=25            (default: 25, max: 200)
 *   &sort_by=nama           (default: 'id')
 *   &sort_dir=asc|desc      (default: 'asc')
 *   &search=keyword
 *   &filter[field]=value                   // exact
 *   &filter[field][op]=value               // op: eq, ne, lt, lte, gt, gte, in, contains, starts, ends
 *
 * Contoh pemakaian di route:
 *   const pg = parsePagination(request.query);
 *   const where = buildWhere({
 *     search: { term: pg.search, fields: ['title', 'shortUrl'] },
 *     filters: pg.filters,
 *     extra: { isActive: true },
 *   });
 *   const [items, total] = await prisma.$transaction([
 *     prisma.url8.findMany({ where, orderBy: pg.orderBy, skip: pg.skip, take: pg.take }),
 *     prisma.url8.count({ where }),
 *   ]);
 *   return ok(items, 'OK', buildMeta(pg, total));
 */
import { ApiMeta } from './response.helper';
export type SortDir = 'asc' | 'desc';
export interface ParsedPagination {
    page: number;
    perPage: number;
    skip: number;
    take: number;
    sortBy: string;
    sortDir: SortDir;
    search?: string;
    filters: Record<string, unknown>;
    orderBy: Record<string, SortDir>;
}
export declare function parsePagination(query: Record<string, unknown>, opts?: {
    defaultSortBy?: string;
    defaultSortDir?: SortDir;
}): ParsedPagination;
export declare function buildMeta(pg: ParsedPagination, total: number): ApiMeta;
//# sourceMappingURL=pagination.helper.d.ts.map