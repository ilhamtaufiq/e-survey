// Antrian draft offline (IndexedDB). Murni Web API — aman di browser & Workers.
// DB: 'esurvey', store 'drafts': { id, payload, photoCount, createdAt }
// Foto disimpan di store terpisah 'draft-photos': { draftId, index, blob, name, type }

const DB_NAME = 'esurvey';
const DB_VERSION = 1;

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB tidak tersedia'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('drafts')) {
        db.createObjectStore('drafts', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('draft-photos')) {
        const store = db.createObjectStore('draft-photos', { keyPath: 'id', autoIncrement: true });
        store.createIndex('by-draft', 'draftId', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('Gagal membuka database lokal'));
  });
}

function txDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('Transaksi DB gagal'));
    tx.onabort = () => reject(tx.error ?? new Error('Transaksi DB dibatalkan'));
  });
}

export function makeDraftId() {
  return `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Simpan draft + daftar foto (File, atau {file, kategori}). */
export async function saveDraft(payload, files) {
  const db = await openDb();
  const id = makeDraftId();
  const tx = db.transaction(['drafts', 'draft-photos'], 'readwrite');
  const count = files ? files.length : 0;
  tx.objectStore('drafts').put({
    id,
    payload,
    photoCount: count,
    createdAt: new Date().toISOString(),
  });
  if (files && files.length > 0) {
    const photos = tx.objectStore('draft-photos');
    files.forEach((item, i) => {
      const f = item && item.file instanceof File ? item.file : item;
      const kategori = item && item.file instanceof File ? (item.kategori || '') : '';
      if (!(f instanceof Blob)) return;
      photos.add({ draftId: id, index: i, blob: f, name: f.name || `foto-${i + 1}.jpg`, type: f.type || '', kategori });
    });
  }
  await txDone(tx);
  db.close();
  return id;
}

export async function listDrafts() {
  const db = await openDb();
  const tx = db.transaction('drafts', 'readonly');
  const req = tx.objectStore('drafts').getAll();
  const rows = await new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result ?? []);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return rows.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
}

async function getPhotos(db, draftId) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('draft-photos', 'readonly');
    const idx = tx.objectStore('draft-photos').index('by-draft');
    const req = idx.getAll(draftId);
    req.onsuccess = () => resolve((req.result ?? []).sort((a, b) => a.index - b.index));
    req.onerror = () => reject(req.error);
  });
}

export async function removeDraft(id) {
  const db = await openDb();
  const tx = db.transaction(['drafts', 'draft-photos'], 'readwrite');
  tx.objectStore('drafts').delete(id);
  const photos = tx.objectStore('draft-photos');
  const idx = photos.index('by-draft');
  const keysReq = idx.getAllKeys(id);
  keysReq.onsuccess = () => {
    for (const k of keysReq.result ?? []) photos.delete(k);
  };
  await txDone(tx);
  db.close();
}

export async function countDrafts() {
  try {
    const db = await openDb();
    const tx = db.transaction('drafts', 'readonly');
    const req = tx.objectStore('drafts').count();
    const n = await new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result ?? 0);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return n;
  } catch {
    return 0;
  }
}

/**
 * Sinkronisasi satu draft ke server via endpoint Astro (/api/sync-draft)
 * yang meneruskan ke apiamis dengan token cookie server-side.
 */
export async function syncDraft(id, onProgress) {
  const db = await openDb();
  const draft = await new Promise((resolve, reject) => {
    const tx = db.transaction('drafts', 'readonly');
    const req = tx.objectStore('drafts').get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  if (!draft) {
    db.close();
    throw new Error('Draft tidak ditemukan');
  }
  const photos = await getPhotos(db, id);
  db.close();

  const fd = new FormData();
  const p = draft.payload ?? {};
  for (const [k, v] of Object.entries(p)) {
    if (v === undefined || v === null || v === '') continue;
    if (typeof v === 'object') fd.append(k, JSON.stringify(v));
    else fd.append(k, String(v));
  }
  for (const ph of photos) {
    const blob = ph.blob instanceof Blob ? ph.blob : new Blob([ph.blob], { type: ph.type || 'application/octet-stream' });
    fd.append('foto', blob, ph.name || 'foto.jpg');
    if (ph.kategori) fd.append('foto_kategori', String(ph.kategori));
    else fd.append('foto_kategori', '');
  }

  if (onProgress) onProgress('mengirim');
  const res = await fetch('/api/sync-draft', { method: 'POST', body: fd });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.message || `Sinkronisasi gagal (${res.status})`);
  }
  await removeDraft(id);
  return data;
}
