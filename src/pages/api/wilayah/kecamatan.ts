import type { APIRoute } from 'astro';
import { getApiBase } from '../../../lib/server/env';
import { apiGet } from '../../../lib/server/apiamis';
import { getCookie } from '../../../lib/server/session';

export const GET: APIRoute = async ({ request, locals }) => {
  const token = getCookie(request, 'esurvey_session') ?? (locals as App.Locals).token ?? null;
  if (!token) {
    return new Response(JSON.stringify({ message: 'Belum login.' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    });
  }
  const base = getApiBase(locals as App.Locals);
  try {
    const data = await apiGet<unknown>(base, '/kecamatan', token, { per_page: 100 });
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (e) {
    const status = (e as { status?: number })?.status ?? 502;
    const message = e instanceof Error ? e.message : 'Gagal memuat kecamatan.';
    return new Response(JSON.stringify({ message }), {
      status,
      headers: { 'content-type': 'application/json' },
    });
  }
};
