# Deployment Guide

Propeller Dawn is a fully static site: build → upload. No server, no secrets.

## Targets

**Primary: GitHub Pages** (configured via `.github/workflows/deploy.yml`).
The Vite `base` path is environment-driven so the same build works at a domain root or a project subpath:

```bash
VITE_BASE=/propeller-dawn/ npm run build     # GitHub Pages project site
VITE_BASE=/ npm run build                    # custom domain / root hosting
```

## CI pipeline

`.github/workflows/ci.yml` runs on every push/PR:

1. install (`npm ci`)
2. `lint` · `format:check` · `typecheck` · unit tests
3. e2e build + Playwright suite (chromium + mobile webkit)
4. production build
5. `npm audit --omit=dev`

`.github/workflows/deploy.yml` (push to `main`) re-runs the quality gates and only then deploys `dist/` to GitHub Pages via the official `actions/deploy-pages` flow.

### One-time repository enablement

- Settings → Pages → Source: **GitHub Actions**.
- Ensure the default branch is `main`.

## Manual release

```bash
npm ci
VITE_BASE=/propeller-dawn/ npm run build
npx vite preview            # local smoke of the production bundle
```

Upload `dist/` to any static host if not using the workflow.

## Post-deploy smoke checklist

1. Open `<url>/` — Title renders, no console errors.
2. Start a run; verify movement/fire/bomb/pause.
3. Hard-refresh mid-menu — app boots again cleanly.
4. Deep-link an unknown path (e.g. `/foo`) — `404.html` routes back to the app.
5. Confirm asset requests hit `assets/*.js` with long cache headers and HTML is revalidated (Pages defaults; explicit header control requires Cloudflare Pages/Netlify — see below).

## Caching

GitHub Pages sends `Cache-Control: max-age=600` for all files. For stricter policy (hashed assets immutable, HTML no-cache), host `dist/` on Cloudflare Pages/Netlify and set:

- `assets/*` → `public, max-age=31536000, immutable`
- `index.html`, `404.html` → `no-cache`
- Headers equivalent for CSP/MIME/referrer policies are host-specific; the shipped `index.html` avoids inline scripts except the 404 redirect stub.

## Rollback

- Workflow deployments: re-run `deploy.yml` on the previous commit, or use Actions history → previous successful run → **Re-run deploy** (Pages keeps the artifact).
- External host: redeploy the previous tagged build:

```bash
git checkout v1.0.0 && VITE_BASE=/propeller-dawn/ npm ci && npm run build
# upload dist/
```

## Versioning & diagnostics

`APP_VERSION` lives in `src/version.ts`; the Settings screen footer shows `version · build id`. Build id can be injected with `VITE_BUILD_ID=$(git rev-parse --short HEAD)`. The in-game “Copy Diagnostics” button exports user-agent/viewport/version/scene — no personal data.
