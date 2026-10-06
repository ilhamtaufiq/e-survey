import { defineMiddleware } from 'astro:middleware';
import { getApiBase } from './lib/server/env';
import { apiMe } from './lib/server/apiamis';

const SESSION_COOKIE = 'esurvey_session';

// Halaman publik (tanpa guard redirect login)
function isPublic(pathname: string): boolean {
  if (pathname === '/') return true;
  if (pathname === '/login' || pathname.startsWith('/login/')) return true;
  if (pathname === '/auth/callback' || pathname.startsWith('/auth/callback')) return true;
  // Endpoint proxy dibaca browser (fetch) — autentikasi dicek dari cookie di handler,
  // bukan via redirect, agar fetch mendapat 401 JSON bukan HTML login.
  if (pathname === '/api/wilayah' || pathname.startsWith('/api/wilayah/')) return true;
  if (pathname === '/api/sync-draft') return true;
  return false;
}

function getCookie(req: Request, name: string): string | null {
  const raw = req.headers.get('cookie');
  if (!raw) return null;
  const parts = raw.split(';');
  for (const part of parts) {
    const idx = part.indexOf('=');
    if (idx < 0) continue;
    const k = part.slice(0, idx).trim();
    if (k === name) return decodeURIComponent(part.slice(idx + 1).trim());
  }
  return null;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = new URL(context.request.url);

  // Aset statis Astro / vite — lewati guard
  if (
    pathname.startsWith('/_astro/') ||
    pathname.startsWith('/_image') ||
    pathname === '/favicon.ico' ||
    pathname === '/favicon.svg' ||
    pathname === '/arumanis.svg' ||
    pathname === '/logo-arumanis.png' ||
    pathname === '/sw.js' ||
    pathname === '/robots.txt' ||
    pathname === '/manifest.webmanifest'
  ) {
    return next();
  }

  if (isPublic(pathname)) {
    // Untuk endpoint proxy, teruskan token bila ada (tanpa redirect)
    const token = getCookie(context.request, SESSION_COOKIE);
    context.locals.token = token;
    return next();
  }

  const token = getCookie(context.request, SESSION_COOKIE);
  if (!token) {
    return context.redirect('/login', 302);
  }

  const base = getApiBase(context.locals as App.Locals);
  if (!base) {
    return context.redirect('/login', 302);
  }

  try {
    const user = await apiMe(base, token);
    if (!user || (!(user as { id?: unknown }).id && !(user as { email?: unknown }).email && !(user as { name?: unknown }).name)) {
      // user kosong — anggap tidak valid bila benar-benar kosong
      if (!user || Object.keys(user as object).length === 0) {
        return context.redirect('/login', 302);
      }
    }
    context.locals.user = user;
    context.locals.token = token;
    return next();
  } catch (err) {
    const status = (err as { status?: number })?.status;
    if (status === 401) {
      return context.redirect('/login', 302);
    }
    // Backend mati / error jaringan: izinkan halaman tampil dengan user null?
    // Lebih aman: tampilkan 502 informatif daripada loop login.
    if (pathname.startsWith('/api/')) {
      return new Response(JSON.stringify({ message: 'Backend tidak dapat dihubungi. Coba lagi.' }), {
        status: 502,
        headers: { 'content-type': 'application/json' },
      });
    }
    context.locals.user = null;
    context.locals.token = token;
    return next();
  }
});
