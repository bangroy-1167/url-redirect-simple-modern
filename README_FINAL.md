v.2.13 changes are committed on local `main` and `feat/expiry-inclusive-v2.13`.
Ready for review and testing before push to `origin/main`.

Summary:
- Backend helper `isExpired()` in `backend/src/routes/public.routes.ts`
  treats expiry date as inclusive end-of-day.
- Frontend helper `getExpiryDisplayInfo()` in
  `backend/client/src/pages/UrlsPage.tsx` shows `!` / `!!` / `!!!` warning
  marks next to Timer icon when expiry is within 3 days.
- README.md updated with v.2.13 changelog.
- Build artefacts intentionally NOT committed; rebuild at deploy time.
