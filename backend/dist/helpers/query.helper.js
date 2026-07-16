"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildWhere = buildWhere;
const OPS = {
    eq: 'equals',
    ne: 'not',
    lt: 'lt',
    lte: 'lte',
    gt: 'gt',
    gte: 'gte',
    in: 'in',
    contains: 'contains',
    starts: 'startsWith',
    ends: 'endsWith',
};
function coerceValue(v) {
    if (Array.isArray(v))
        return v;
    if (typeof v !== 'string')
        return v;
    const s = v.trim();
    if (s === 'true')
        return true;
    if (s === 'false')
        return false;
    if (s === 'null')
        return null;
    return s;
}
function compileFilter(raw) {
    if (raw === undefined || raw === null)
        return undefined;
    if (typeof raw === 'object' && !Array.isArray(raw)) {
        // format { op: value }
        const entries = Object.entries(raw);
        const supported = entries.filter(([k]) => OPS[k]);
        if (!supported.length)
            return coerceValue(raw);
        const out = {};
        for (const [k, v] of supported) {
            const prismaOp = OPS[k];
            let val = coerceValue(v);
            if (k === 'in' && typeof val === 'string')
                val = String(val).split(',');
            if (['contains', 'starts', 'ends'].includes(k)) {
                out[prismaOp] = val;
                // Note: mode: 'insensitive' not supported in MySQL
            }
            else {
                out[prismaOp] = val;
            }
        }
        return out;
    }
    return coerceValue(raw);
}
function buildWhere(opts) {
    const and = [];
    // Filters
    const filters = opts.filters ?? {};
    const whitelist = opts.allowedFilters && opts.allowedFilters.length > 0 ? new Set(opts.allowedFilters) : null;
    const filterBlock = {};
    for (const [field, raw] of Object.entries(filters)) {
        if (whitelist && !whitelist.has(field))
            continue;
        const compiled = compileFilter(raw);
        if (compiled !== undefined)
            filterBlock[field] = compiled;
    }
    if (Object.keys(filterBlock).length)
        and.push(filterBlock);
    // Search (OR contains across fields)
    if (opts.search?.term && opts.search.fields && opts.search.fields.length) {
        const or = opts.search.fields.map((f) => ({
            [f]: { contains: opts.search.term },
        }));
        and.push({ OR: or });
    }
    // Extra (merged)
    if (opts.extra)
        and.push(opts.extra);
    if (and.length === 0)
        return {};
    if (and.length === 1)
        return and[0];
    return { AND: and };
}
//# sourceMappingURL=query.helper.js.map