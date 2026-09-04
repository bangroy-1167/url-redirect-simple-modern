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

Previous (v.2.13):
- Backend helper `isExpired()` treats expiry date as inclusive end-of-day.
- Frontend helper `getExpiryDisplayInfo()` shows `!` / `!!` / `!!!` warning
  marks next to Timer icon when expiry is within 3 days.
