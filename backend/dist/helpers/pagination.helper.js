"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePagination = parsePagination;
exports.buildMeta = buildMeta;
const DEFAULT_PER_PAGE = 25;
const MAX_PER_PAGE = 200;
function toInt(v, def, min = 1, max = Number.MAX_SAFE_INTEGER) {
    const n = Number.parseInt(String(v ?? ''), 10);
    if (!Number.isFinite(n))
        return def;
    return Math.min(Math.max(n, min), max);
}
function parsePagination(query, opts = {}) {
    const page = toInt(query.page, 1, 1);
    const perPage = toInt(query.per_page, DEFAULT_PER_PAGE, 1, MAX_PER_PAGE);
    const sortBy = String(query.sort_by ?? opts.defaultSortBy ?? 'id');
    const sortDirRaw = String(query.sort_dir ?? opts.defaultSortDir ?? 'asc').toLowerCase();
    const sortDir = sortDirRaw === 'desc' ? 'desc' : 'asc';
    const searchRaw = query.search;
    const search = typeof searchRaw === 'string' && searchRaw.trim() !== '' ? searchRaw.trim() : undefined;
    // Fastify parses `filter[field]=val` menjadi { filter: { field: val } } secara default.
    const filters = query.filter && typeof query.filter === 'object'
        ? { ...query.filter }
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
function buildMeta(pg, total) {
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
//# sourceMappingURL=pagination.helper.js.map