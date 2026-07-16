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

const DEFAULT_PER_PAGE = 25;
const MAX_PER_PAGE = 200;

function toInt(v: unknown, def: number, min = 1, max = Number.MAX_SAFE_INTEGER): number {
  const n = Number.parseInt(String(v ?? ''), 10);
  if (!Number.isFinite(n)) return def;
  return Math.min(Math.max(n, min), max);
}

export function parsePagination(
  query: Record<string, unknown>,
  opts: { defaultSortBy?: string; defaultSortDir?: SortDir } = {},
): ParsedPagination {
  const page = toInt((query as any).page, 1, 1);
  const perPage = toInt((query as any).per_page, DEFAULT_PER_PAGE, 1, MAX_PER_PAGE);
  const sortBy = String((query as any).sort_by ?? opts.defaultSortBy ?? 'id');
  const sortDirRaw = String((query as any).sort_dir ?? opts.defaultSortDir ?? 'asc').toLowerCase();
  const sortDir: SortDir = sortDirRaw === 'desc' ? 'desc' : 'asc';
  const searchRaw = (query as any).search;
  const search = typeof searchRaw === 'string' && searchRaw.trim() !== '' ? searchRaw.trim() : undefined;

  // Fastify parses `filter[field]=val` menjadi { filter: { field: val } } secara default.
  const filters = (query as any).filter && typeof (query as any).filter === 'object'
    ? ({ ...(query as any).filter } as Record<string, unknown>)
    : {};

  return {
    page,
    perPage,
    skip: (page - 1) * perPage,
    take: perPage,
    sortBy,
    sortDir,
    search,
    filters,
    orderBy: { [sortBy]: sortDir },
  };
}

export function buildMeta(pg: ParsedPagination, total: number): ApiMeta {
  return {
    page: pg.page,
    per_page: pg.perPage,
    total,
    total_pages: Math.max(1, Math.ceil(total / pg.perPage)),
    sort_by: pg.sortBy,
    sort_dir: pg.sortDir,
    ...(pg.search ? { search: pg.search } : {}),
    ...(Object.keys(pg.filters).length ? { filters: pg.filters } : {}),
  };
}
