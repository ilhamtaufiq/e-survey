// Konstanta & tipe shared. Tanpa API Node — aman dipakai di client & server.

export type JenisSurvey = 'spam_perpipaan' | 'spam_pengeboran' | 'mck_individu' | 'mck_komunal';
export type StatusSurvey = 'diajukan' | 'diverifikasi' | 'ditolak';

export interface PortalUser {
  id: number | string;
  name?: string;
  nama?: string;
  email?: string;
  roles?: Array<string | { name?: string; slug?: string }>;
  [k: string]: unknown;
}

export interface Wilayah {
  id: number | string;
  nama: string;
}

export interface SurveyFoto {
  id: number | string;
  url: string;
  name?: string;
  kategori?: string | null;
}

// Lampiran survey = butir checklist formulir (satu butir bisa beberapa berkas).
// `jenis`: jenis survey yang menampilkan butir ini di form.
export const LAMPIRAN_LIST: Array<{ value: string; label: string; hint: string; jenis: JenisSurvey[] }> = [
  { value: 'dok_foto_broncaptering', label: 'Foto broncaptering + debit', hint: 'Foto lokasi + pengukuran', jenis: ['spam_perpipaan'] },
  { value: 'dok_foto_reservoir', label: 'Foto tapak reservoir', hint: 'Foto lokasi rencana', jenis: ['spam_perpipaan'] },
  { value: 'dok_foto_sumur_menara', label: 'Foto tapak sumur & menara', hint: 'Foto lokasi rencana', jenis: ['spam_pengeboran'] },
  { value: 'dok_foto_ku', label: 'Foto titik-titik kran umum', hint: 'KU 1, KU 2, dst.', jenis: ['spam_pengeboran'] },
  { value: 'dok_foto_mck_septik', label: 'Foto tapak MCK & septic tank', hint: 'Foto lokasi rencana', jenis: ['mck_individu', 'mck_komunal'] },
  { value: 'dok_foto_sumber_air', label: 'Foto sumber air terdekat', hint: 'SPAM / sumur / mata air', jenis: ['mck_individu', 'mck_komunal'] },
  { value: 'dok_sketsa_layout', label: 'Sketsa denah tata letak', hint: 'MCK, wudhu, septic tank', jenis: ['mck_individu', 'mck_komunal'] },
  { value: 'dok_peta_jalur', label: 'Peta / sketsa jalur pipa', hint: 'Foto, sketsa, atau PDF', jenis: ['spam_perpipaan', 'spam_pengeboran', 'mck_individu', 'mck_komunal'] },
  { value: 'dok_surat_hibah', label: 'Surat hibah lahan', hint: 'Foto / scan / PDF', jenis: ['spam_perpipaan', 'spam_pengeboran', 'mck_individu', 'mck_komunal'] },
  { value: 'dok_bnba', label: 'Daftar BNBA', hint: 'Foto / dokumen', jenis: ['spam_perpipaan', 'spam_pengeboran', 'mck_individu', 'mck_komunal'] },
];

export function lampiranLabel(kategori: string | undefined | null): string {
  if (!kategori) return 'Lainnya';
  return LAMPIRAN_LIST.find((l) => l.value === kategori)?.label ?? kategori;
}

export interface SurveyDetail {
  sumber_air?: string;
  debit_liter_detik?: string | number;
  jumlah_kk?: string | number;
  kebutuhan?: 'baru' | 'rehab' | 'perluasan' | string;
  kondisi_existing?: string;
  tipe?: 'individu' | 'komunal' | string;
  jumlah_bilik?: string | number;
  kedalaman_rencana_m?: string | number;
  kondisi_tanah?: string;
  akses_alat?: string;
  [k: string]: unknown;
}

export interface SurveyLokasi {
  id: number | string;
  jenis: JenisSurvey | string;
  jenis_label?: string;
  nama_lokasi: string;
  tugas_id?: number | string | null;
  tugas?: { id: number | string; judul: string; status?: string } | null;
  kecamatan?: { id: number | string; nama: string } | null;
  kecamatan_id?: number | string;
  desa?: { id: number | string; nama: string } | null;
  desa_id?: number | string;
  alamat?: string;
  latitude?: string | number | null;
  longitude?: string | number | null;
  detail?: SurveyDetail | null;
  status: StatusSurvey | string;
  catatan_verifikasi?: string | null;
  verified_at?: string | null;
  surveyor?: { id: number | string; name?: string } | null;
  verified_by?: { id: number | string; name?: string } | null;
  foto?: SurveyFoto[];
  created_at?: string;
  updated_at?: string;
}

export const JENIS_LIST: Array<{
  value: JenisSurvey;
  label: string;
  deskripsi: string;
}> = [
  {
    value: 'spam_perpipaan',
    label: 'SPAM Perpipaan',
    deskripsi: 'Jaringan perpipaan & sambungan rumah untuk air minum',
  },
  {
    value: 'spam_pengeboran',
    label: 'SPAM Pengeboran',
    deskripsi: 'Sumur bor sebagai sumber air baku SPAM',
  },
  {
    value: 'mck_individu',
    label: 'MCK Individu',
    deskripsi: 'Mandi–Cuci–Kakus untuk satu rumah tangga',
  },
  {
    value: 'mck_komunal',
    label: 'MCK Komunal',
    deskripsi: 'Mandi–Cuci–Kakus bersama untuk beberapa KK',
  },
];

export const JENIS_LABEL: Record<string, string> = {
  spam_perpipaan: 'SPAM Perpipaan',
  spam_pengeboran: 'SPAM Pengeboran',
  mck_individu: 'MCK Individu',
  mck_komunal: 'MCK Komunal',
  // Nilai lama (pra-Oktober 2026) — tetap dikenali bila muncul dari cache/API lama
  spam: 'SPAM Perpipaan',
  sumur_bor: 'SPAM Pengeboran',
  mck: 'MCK Komunal',
};

export function jenisLabel(jenis: string | undefined | null): string {
  if (!jenis) return '-';
  return JENIS_LABEL[jenis] ?? jenis;
}

export const JENIS_SHORT: Record<string, string> = {
  spam_perpipaan: 'SP',
  spam_pengeboran: 'SB',
  mck_individu: 'MI',
  mck_komunal: 'MK',
};

export function jenisShort(jenis: string | undefined | null): string {
  if (!jenis) return '-';
  return JENIS_SHORT[jenis] ?? String(jenis).charAt(0).toUpperCase();
}

// Field detail yang relevan per jenis (untuk form dinamis)
export const DETAIL_FIELDS: Record<JenisSurvey, string[]> = {
  spam_perpipaan: [
    'tanggal_survei', 'nama_surveyor_tim', 'dusun', 'rt', 'rw',
    'broncaptering_lat', 'broncaptering_lng', 'broncaptering_elevasi',
    'reservoir_lat', 'reservoir_lng', 'reservoir_elevasi',
    'sumber_air_jenis', 'debit_hujan_lps', 'debit_hujan_bulan',
    'debit_kemarau_lps', 'debit_kemarau_bulan', 'kejernihan', 'bau_rasa', 'ph',
    'lahan_broncaptering_status', 'elevasi_kelayakan', 'jarak_sumber_reservoir_m',
    'reservoir_lahan_status', 'reservoir_lahan_lainnya', 'topografi',
    'selisih_elevasi_m', 'akses_material',
    'pipa_trunk_m', 'pipa_cabang_m', 'lintas_tanah_m', 'lintas_paving_m',
    'lintas_aspal_m', 'lintas_sungai_titik', 'lintas_sungai_lebar_m',
    'washout_titik', 'air_valve_titik',
    'jumlah_kk', 'total_jiwa', 'sumber_eksisting', 'kesediaan_pelanggan',
    'kesediaan_persen', 'kesediaan_iuran', 'tarif_perkiraan', 'bnba',
    'dok_foto_broncaptering', 'dok_foto_reservoir', 'dok_peta_jalur',
    'dok_surat_hibah', 'dok_bnba',
  ],
  spam_pengeboran: [
    'sumur_lat', 'sumur_lng', 'sumur_elevasi', 'ku1_lat', 'ku1_lng',
    'ku2_lat', 'ku2_lng', 'lahan_sumur_status', 'lahan_sumur_lainnya',
    'lahan_panjang_m', 'lahan_lebar_m', 'akuifer_kedalaman_m',
    'sumur_warga_kedalaman_m', 'air_warga_kualitas', 'listrik_jarak_m',
    'listrik_daya', 'akses_rig', 'tanah_menara', 'menara_tinggi',
    'toren_kapasitas', 'toren_kapasitas_lainnya', 'toren_bahan',
    'jumlah_ku_titik', 'ku_rincian', 'kran_per_titik', 'drainase',
    'jumlah_kk', 'total_jiwa', 'kesediaan_kelompok', 'iuran_listrik', 'tarif_perkiraan',
  ],
  mck_individu: [
    'mck_lat', 'mck_lng', 'mck_elevasi',
    'jumlah_pintu', 'jumlah_pintu_lainnya',
    'bilik1_fungsi', 'bilik2_fungsi', 'bilik3_fungsi', 'bilik4_fungsi',
    'kloset_jenis', 'wudhu_ada', 'wudhu_keran', 'wudhu_desain',
    'mck_sumber_air', 'toren_menara', 'toren_dak',
    'septik_jenis', 'septik_bio_kapasitas_m3', 'septik_bio_pengguna',
    'septik_panjang_m', 'septik_lebar_m', 'septik_dalam_m',
    'resapan_jenis', 'resapan_diameter_m', 'resapan_dalam_m',
    'tanah_jenis', 'muka_air_tanah_m', 'jarak_septik_sumur_m',
    'nama_kk', 'anggota_jiwa', 'status_ekonomi',
  ],
  mck_komunal: [
    'mck_lat', 'mck_lng', 'mck_elevasi',
    'jumlah_pintu', 'jumlah_pintu_lainnya',
    'bilik1_fungsi', 'bilik2_fungsi', 'bilik3_fungsi', 'bilik4_fungsi',
    'kloset_jenis', 'wudhu_ada', 'wudhu_keran', 'wudhu_desain',
    'mck_sumber_air', 'toren_menara', 'toren_dak',
    'septik_jenis', 'septik_bio_kapasitas_m3', 'septik_bio_pengguna',
    'septik_panjang_m', 'septik_lebar_m', 'septik_dalam_m',
    'resapan_jenis', 'resapan_diameter_m', 'resapan_dalam_m',
    'tanah_jenis', 'muka_air_tanah_m', 'jarak_septik_sumur_m',
    'target_warga_kk', 'target_warga_jiwa', 'target_jamaah', 'target_santri',
    'pengelola',
  ],
};

export const STATUS_META: Record<string, { label: string; classes: string }> = {
  diajukan: { label: 'Diajukan', classes: 'bg-amber-100 text-amber-800' },
  diverifikasi: { label: 'Diverifikasi', classes: 'bg-emerald-100 text-emerald-800' },
  ditolak: { label: 'Ditolak', classes: 'bg-red-100 text-red-700' },
};

export function statusMeta(status: string | undefined | null): { label: string; classes: string } {
  if (!status) return { label: '-', classes: 'bg-slate-100 text-slate-600' };
  return STATUS_META[status] ?? { label: status, classes: 'bg-slate-100 text-slate-600' };
}

export function normalizeRoleNames(roles: unknown): string[] {
  if (!roles) return [];
  const arr = Array.isArray(roles) ? roles : [roles];
  return arr
    .map((r) => {
      if (typeof r === 'string') return r.toLowerCase();
      if (r && typeof r === 'object') {
        const o = r as { name?: unknown; slug?: unknown };
        const v = o.name ?? o.slug;
        if (typeof v === 'string') return v.toLowerCase();
      }
      return '';
    })
    .filter(Boolean);
}

export function hasRole(user: PortalUser | null | undefined, ...names: string[]): boolean {
  if (!user) return false;
  const have = new Set(normalizeRoleNames((user as { roles?: unknown }).roles));
  return names.some((n) => have.has(n.toLowerCase()));
}

export function isAdmin(user: PortalUser | null | undefined): boolean {
  return hasRole(user, 'admin');
}

export function userDisplayName(user: PortalUser | null | undefined): string {
  if (!user) return 'Pengguna';
  const n = (user.name ?? user.nama ?? user.email ?? 'Pengguna') as string;
  return String(n);
}

export function canVerify(user: PortalUser | null | undefined): boolean {
  return isAdmin(user);
}

export type StatusTugas = 'ditugaskan' | 'dikerjakan' | 'selesai';

export interface TugasSurvey {
  id: number | string;
  judul: string;
  tahun_anggaran?: number | string;
  jenis?: string | null;
  jenis_label?: string;
  pekerjaan?: { id: number | string; nama_paket?: string } | null;
  pekerjaan_id?: number | string | null;
  kecamatan?: { id: number | string; nama?: string } | null;
  desa?: { id: number | string; nama?: string } | null;
  kecamatan_id?: number | string | null;
  desa_id?: number | string | null;
  lokasi_catatan?: string | null;
  assignee?: { id: number | string; name?: string } | null;
  assignees?: Array<{ id: number | string; name?: string }>;
  assignee_id?: number | string | null;
  creator?: { id: number | string; name?: string } | null;
  status: StatusTugas | string;
  status_label?: string;
  batas_waktu?: string | null;
  catatan_admin?: string | null;
  surveys_count?: number;
  sudah_disurvey?: boolean;
  created_at?: string;
}

export const STATUS_TUGAS_META: Record<string, { label: string; classes: string }> = {
  ditugaskan: { label: 'Ditugaskan', classes: 'bg-orange-100 text-orange-800' },
  dikerjakan: { label: 'Dikerjakan', classes: 'bg-amber-100 text-amber-800' },
  selesai: { label: 'Selesai', classes: 'bg-emerald-100 text-emerald-800' },
};

export function statusTugasMeta(status: string | undefined | null): { label: string; classes: string } {
  if (!status) return { label: '-', classes: 'bg-slate-100 text-slate-600' };
  return STATUS_TUGAS_META[status] ?? { label: status, classes: 'bg-slate-100 text-slate-600' };
}

export function canManageTugas(user: PortalUser | null | undefined): boolean {
  return isAdmin(user);
}

export function canEditSurvey(user: PortalUser | null | undefined, survey: SurveyLokasi): boolean {
  if (!user || !survey) return false;
  if (survey.status !== 'diajukan') return false;
  if (isAdmin(user)) return true;
  const ownerId = survey.surveyor?.id;
  if (ownerId !== undefined && String(ownerId) === String(user.id)) return true;
  // TFL / operator / pengawas boleh ubah selagi masih diajukan
  return hasRole(user, 'tfl', 'operator', 'pengawas', 'konsultan_pengawas');
}

/** Normalisasi respons list: dukung {data:[...]} maupun array langsung */
export function asArray<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === 'object') {
    const o = payload as { data?: unknown };
    if (Array.isArray(o.data)) return o.data as T[];
  }
  return [];
}

/** Normalisasi nama wilayah (backend bisa pakai nama/nama_kecamatan/dll) */
export function wilayahNama(w: unknown): string {
  if (!w || typeof w !== 'object') return '-';
  const o = w as Record<string, unknown>;
  for (const k of ['nama', 'nama_kecamatan', 'nama_desa', 'name']) {
    if (typeof o[k] === 'string' && (o[k] as string).trim()) return o[k] as string;
  }
  return '-';
}

export function toWilayahList(payload: unknown): Wilayah[] {
  return asArray<Record<string, unknown>>(payload).map((o) => ({
    id: (o['id'] ?? o['kode'] ?? '') as number | string,
    nama: wilayahNama(o),
  }));
}
