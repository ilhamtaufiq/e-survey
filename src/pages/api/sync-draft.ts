import type { APIRoute } from 'astro';
import { getApiBase } from '../../lib/server/env';
import { apiPost } from '../../lib/server/apiamis';
import { getCookie } from '../../lib/server/session';

// Menerima multipart dari sync draft offline (IndexedDB) lalu forward ke apiamis.
export const POST: APIRoute = async ({ request, locals }) => {
  const token = getCookie(request, 'esurvey_session') ?? (locals as App.Locals).token ?? null;
  if (!token) {
    return new Response(JSON.stringify({ message: 'Sesi habis. Login ulang lalu sinkronkan kembali.' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    });
  }
  const base = getApiBase(locals as App.Locals);
  let incoming: FormData;
  try {
    incoming = await request.formData();
  } catch {
    return new Response(JSON.stringify({ message: 'Body tidak valid.' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const out = new FormData();
  const detail: Record<string, string | boolean> = {};
  // Field inti survey — selain ini masuk ke `detail` (termasuk field formulir
  // SPAM Perdesaan). `tugas_id` diteruskan apa adanya. Berkas `foto` dan
  // `foto_kategori` sejajar diteruskan sesuai urutan.
  const CORE = new Set([
    'jenis', 'nama_lokasi', 'kecamatan_id', 'desa_id', 'alamat',
    'latitude', 'longitude', 'tugas_id',
  ]);
  const fotoKategoris: string[] = [];

  for (const [k, v] of incoming.entries()) {
    if (v instanceof File) {
      if (v.size > 0) out.append('foto', v, v.name || 'foto.jpg');
      continue;
    }
    if (typeof v !== 'string') continue;
    if (k === 'detail' || k.startsWith('detail[')) continue;
    if (k === 'foto_kategori') {
      fotoKategoris.push(v);
      continue;
    }
    if (CORE.has(k)) {
      out.set(k, v);
      continue;
    }
    if (k.startsWith('dok_')) {
      detail[k] = true;
      continue;
    }
    if (v.trim() !== '') detail[k] = v.trim();
  }
  for (const kat of fotoKategoris) out.append('foto_kategori', kat);
  // Backend menerima JSON atau multipart dengan field detail JSON.
  // Selalu kirim multipart (foto mungkin ada) + detail sebagai JSON string.
  out.set('detail', JSON.stringify(detail));

  if (!out.get('jenis') || !out.get('nama_lokasi')) {
    return new Response(JSON.stringify({ message: 'Draft tidak lengkap (jenis / nama lokasi kosong).' }), {
      status: 422,
      headers: { 'content-type': 'application/json' },
    });
  }

  try {
    const created = await apiPost<unknown>(base, '/survey-lokasi', token, { formData: out });
    return new Response(JSON.stringify({ message: 'Draft tersinkron.', data: created }), {
      status: 201,
      headers: { 'content-type': 'application/json' },
    });
  } catch (e) {
    const status = (e as { status?: number })?.status ?? 502;
    const message = e instanceof Error ? e.message : 'Sinkronisasi gagal.';
    return new Response(JSON.stringify({ message }), {
      status,
      headers: { 'content-type': 'application/json' },
    });
  }
};
