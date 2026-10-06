# eSurvey — Air Minum & Sanitasi

Aplikasi survey lapangan untuk pembangunan **SPAM**, **sumur bor**, dan **MCK**.
Dibangun dengan [Astro](https://astro.build) SSR + Tailwind CSS v4, deployable ke
**Cloudflare Workers** (hanya Web API di runtime — tanpa `node:fs`, `node:path`, dsb).

## Arsitektur singkat

- **Frontend/SSR**: Astro `output: 'server'` + adapter `@astrojs/cloudflare`.
- **Auth**: SSO via portal Arumanis (handoff code sekali pakai, 60 detik).
  Token Sanctum disimpan di cookie httpOnly `esurvey_session` (tidak pernah di localStorage).
- **Backend data**: Laravel API `apiamis` (`APIAMIS_BASE_URL`), diakses server-side
  dengan Bearer token dari cookie.
- **Offline**: draft survey + foto tersimpan di IndexedDB, disinkronkan saat online.

## Alur SSO

1. Pengguna buka `/login` → redirect 302 ke `{PORTAL_URL}/sign-in?redirect=<esurvey origin>/auth/callback`.
2. Jika sudah login di portal, portal langsung membuat handoff code dan redirect ke
   `/auth/callback?code=XXX&redirect=...` (lihat `buildExternalAppCallbackUrl` di portal).
3. Worker `POST {APIAMIS}/api/auth/handoff/exchange {code}` → `{user, token}`.
4. Token disimpan di cookie httpOnly `esurvey_session` (Max-Age 12 jam), redirect ke `/`.
5. `src/middleware.ts` menjaga semua halaman (kecuali `/login`, `/auth/callback`,
   `/favicon.ico`): verifikasi via `GET {APIAMIS}/api/auth/me`, simpan user di `Astro.locals`.
6. `/logout` → hapus cookie + best-effort `POST {APIAMIS}/api/auth/logout` → redirect portal.

## Pengembangan lokal

Prasyarat: Node.js 20+, npm. Portal (`bun`, Vite **:5173** + BFF :8787) dan `apiamis` (`http://apiamis.test`) jalan.

```bash
cd C:\laragon\www\arumanis-hq\esurvey
cp .dev.vars.example .dev.vars   # sesuaikan bila perlu
npm install
npm run dev                      # http://localhost:4321
```

Isi `.dev.vars`:

```ini
APIAMIS_BASE_URL=http://apiamis.test/api
PORTAL_URL=http://localhost:5173
```

> Catatan: origin `http://localhost:4321` harus terdaftar sebagai trusted external
> origin di portal (`isTrustedExternalOrigin`), jika tidak redirect SSO ditolak portal.

## Build & deploy

```bash
npm run build        # wajib hijau sebelum deploy
npx wrangler deploy  # deploy ke Cloudflare Workers (nama: esurvey)
```

Environment produksi diisi via dashboard Workers / `wrangler secret` atau `vars`:
`APIAMIS_BASE_URL`, `PORTAL_URL`.

## Struktur

```
src/
  layouts/Base.astro        header nav + user chip
  lib/survey.ts             konstanta jenis/status, role helpers (shared)
  lib/server/env.ts         baca env Workers-safe
  lib/server/apiamis.ts     helper fetch + ApiError
  lib/server/session.ts     cookie sesi
  middleware.ts             guard auth
  pages/
    index.astro             → /dashboard
    login.astro             redirect SSO portal
    auth/callback.astro     exchange code → cookie
    logout.astro
    dashboard.astro         statistik + terbaru
    survey/index.astro      filter + tabel + pagination
    survey/baru.astro       form + peta Leaflet + draft offline
    survey/[id].astro       detail + verifikasi admin
    survey/[id]/edit.astro  edit + kelola foto
    draft.astro             daftar draft offline
    api/wilayah/*.ts        proxy kecamatan/desa (token server-side)
    api/sync-draft.ts       forward draft offline → apiamis
  scripts/offline-queue.js  IndexedDB queue (ES module)
```

## Kontrak API (apiamis)

- `GET /api/survey-lokasi?jenis=&status=&search=&page=&per_page=`
- `GET /api/survey-lokasi/stats`
- `POST /api/survey-lokasi` (JSON / multipart + `foto[]`)
- `GET|PUT|DELETE /api/survey-lokasi/{id}`
- `POST /api/survey-lokasi/{id}/verifikasi` (admin)
- `POST /api/survey-lokasi/{id}/foto`, `DELETE /api/survey-lokasi/{id}/foto/{mediaId}`
- `GET /api/kecamatan`, `GET /api/desa/kecamatan/{id}`, `GET /api/desa`
