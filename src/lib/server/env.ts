// Workers-safe: tidak boleh pakai node:fs / node:path di runtime.
// Baca env dari Astro.locals.runtime.env bila ada (Cloudflare),
// fallback ke import.meta.env / process.env untuk dev lokal.

function readLocal<K extends string>(key: K): string | undefined {
  try {
    const meta = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
    const v = meta?.[key];
    if (v) return v;
  } catch {
    // abaikan
  }
  try {
    const proc = (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process;
    const v = proc?.env?.[key];
    if (v) return v;
  } catch {
    // abaikan
  }
  return undefined;
}

/** Ambil satu nilai env: prioritas runtime Cloudflare → import.meta.env → process.env */
export function getEnv(locals: App.Locals | undefined, key: string): string | undefined {
  const fromRuntime = (locals?.runtime?.env as Record<string, unknown> | undefined)?.[key];
  if (typeof fromRuntime === 'string' && fromRuntime.length > 0) return fromRuntime;
  return readLocal(key);
}

function stripTrailingSlash(v: string): string {
  return v.replace(/\/+$/, '');
}

export function getApiBase(locals?: App.Locals): string {
  const raw = getEnv(locals, 'APIAMIS_BASE_URL') ?? '';
  if (!raw) return '';
  // Pastikan berakhiran /api tanpa slash ganda
  const cleaned = stripTrailingSlash(raw.trim());
  return cleaned;
}

export function getPortalUrl(locals?: App.Locals): string {
  const raw = getEnv(locals, 'PORTAL_URL') ?? '';
  if (!raw) return '';
  return stripTrailingSlash(raw.trim());
}
