/* Service worker Arumanis e-Survey: cache aset statis saja.
   Halaman SSR tidak di-cache (butuh sesi login). */
const CACHE = 'esurvey-static-v1';

const STATIC_PATTERNS = [
  /\/_astro\//,
  /\/arumanis\.svg$/,
  /\/favicon\.svg$/,
  /\/logo-arumanis\.png$/,
  /\/icon-(192|512|maskable-512)\.png$/,
  /\/manifest\.webmanifest$/,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        cache
          .addAll([
            '/arumanis.svg',
            '/logo-arumanis.png',
            '/icon-192.png',
            '/icon-512.png',
            '/manifest.webmanifest',
          ])
          .catch(() => {}),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }
  if (url.origin !== self.location.origin) return;
  const isStatic = STATIC_PATTERNS.some((re) => re.test(url.pathname));
  if (!isStatic) return;
  event.respondWith(
    caches.match(request).then(
      (hit) =>
        hit ||
        fetch(request).then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return res;
        }),
    ),
  );
});
