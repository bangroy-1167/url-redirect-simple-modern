v.2.14 changes are committed on `main`, `dev/stable`, and `v.2.14-stable`.

Summary:
- Hit counter fix: password-protected URLs now increment `hitCounter` and
  insert `url_hits` analytics rows after successful password verification in
  `POST /api8url/f/:shortUrl/verify` (`backend/src/routes/public.routes.ts`).
  Failed password attempts are NOT counted.
- Non-password URLs keep their existing increment in `GET /:shortUrl`
  (no double-count between the two flows).
- README.md updated with v.2.14 changelog + footer consistency fix.
- Build artefacts (`backend/dist` + `backend/public`) ARE committed, because
  production pulls from git and restarts PM2 without building on server.

Hotfix (same day, post-deploy):
- Production login `/kelola/login` gagal ("login failed") karena bundle
  frontend `index-CuDVLT4j.js` ter-bake `VITE_API_URL=http://<dev-ip>:33002`
  dari `backend/client/.env` saat rebuild. Verify URL berpassword tetap jalan
  karena `UrlFoundPage` memakai `fetch` relatif, sedangkan axios client
  (`src/api/client.ts`) memakai `import.meta.env.VITE_API_URL || '/api8url'`.
- Fix: `.env` -> `.env.development` (konvensi Vite: hanya dibaca saat
  `npm run dev`, diabaikan saat `npm run build`), frontend direbuild, bundle
  bersih `index-BrP7dfhQ.js` (tanpa IP dev) di-commit.
- `.gitignore`: tambah `dev-dist/` dan `.env.development`.
- TIDAK ada prisma migrate/seed yang dijalankan di production; update murni
  `git pull --ff-only` + `pm2 restart`.

Previous (v.2.13):
- Backend helper `isExpired()` treats expiry date as inclusive end-of-day.
- Frontend helper `getExpiryDisplayInfo()` shows `!` / `!!` / `!!!` warning
  marks next to Timer icon when expiry is within 3 days.
