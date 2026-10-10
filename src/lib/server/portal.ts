import { getPortalUrl } from './env';

/**
 * URL masuk ke portal SSO Arumanis. Portal mengembalikan pengguna ke `<origin>/auth/callback`
 * dengan handoff code. Kosong bila PORTAL_URL belum di-set.
 */
export function portalSignInUrl(locals: App.Locals | undefined, origin: string): string {
  const portal = getPortalUrl(locals);
  if (!portal) return '';
  const callback = `${origin}/auth/callback`;
  return `${portal}/sign-in?redirect=${encodeURIComponent(callback)}`;
}
