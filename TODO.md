# TODO — make system work correctly (routes/auth/realtime)

- [ ] Implement realtime throttling + unmount safety in `src/app/routes/AdminDashboard.tsx`.
- [ ] Reduce potential route/path mismatches by verifying links in Admin UI align with `src/app/Router.tsx` paths.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Smoke test: login → visit multiple admin pages → verify no redirect loops and stable realtime refresh.

