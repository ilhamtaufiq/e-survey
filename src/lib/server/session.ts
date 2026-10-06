// Helper cookie sesi. Workers-safe (Web API saja).
export const SESSION_COOKIE = 'esurvey_session';
export const SESSION_MAX_AGE = 12 * 60 * 60; // 12 jam

export function getCookie(req: Request, name: string): string | null {
  const raw = req.headers.get('cookie');
  if (!raw) return null;
  for (const part of raw.split(';')) {
    const idx = part.indexOf('=');
    if (idx < 0) continue;
    if (part.slice(0, idx).trim() === name) {
      return decodeURIComponent(part.slice(idx + 1).trim());
    }
  }
  return null;
}

export function buildSessionCookie(token: string, reqUrl: string): string {
  const secure = new URL(reqUrl).protocol === 'https:';
  const parts = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${SESSION_MAX_AGE}`,
  ];
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

export function buildClearCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

/** Redirect dengan Set-Cookie (bisa beberapa cookie). */
export function redirectWithCookies(url: string, status: 302 | 303, cookies: string[]): Response {
  const headers = new Headers({ location: url });
  for (const c of cookies) headers.append('set-cookie', c);
  return new Response(null, { status, headers });
}
