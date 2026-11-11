/* Prêt à Porter à Pois — strato dati.
   MODALITÀ PROVA: i dati modificati dall'admin restano in QUESTO browser (IndexedDB).
   Il sito, aperto nello stesso browser, mostra subito le modifiche; altrove vede i file originali.
   Per andare online davvero basta sostituire questo file con la versione Supabase:
   le funzioni (load, saveContenuti, saveCatalogo, putPhoto, url…) restano le stesse. */
window.DB = (() => {
'use strict';
const NAME = 'pap-prova', VER = 1;
let dbp = null;
function open() {
  if (dbp) return dbp;
  dbp = new Promise((res, rej) => {
    if (!('indexedDB' in window)) return rej(new Error('IndexedDB non disponibile'));
    const r = indexedDB.open(NAME, VER);
    r.onupgradeneeded = () => { const d = r.result; if (!d.objectStoreNames.contains('kv')) d.createObjectStore('kv'); if (!d.objectStoreNames.contains('foto')) d.createObjectStore('foto'); };
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
  return dbp;
}
async function tx(store, mode, fn) {
  const d = await open();
  return new Promise((res, rej) => { const t = d.transaction(store, mode), s = t.objectStore(store); const out = fn(s); t.oncomplete = () => res(out instanceof IDBRequest ? out.result : out); t.onerror = () => rej(t.error); });
}
const kvGet = k => tx('kv', 'readonly', s => s.get(k)).catch(() => undefined);
const kvSet = (k, v) => tx('kv', 'readwrite', s => s.put(v, k));
const kvDel = k => tx('kv', 'readwrite', s => s.delete(k));

/* ---------- foto ---------- */
const urls = new Map();                         // 'idb:xxx' → objectURL
const newId = () => 'idb:' + (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
async function putPhoto(blob) { const id = newId(); await tx('foto', 'readwrite', s => s.put(blob, id)); urls.set(id, URL.createObjectURL(blob)); return id; }
async function delPhoto(id) { if (!id?.startsWith('idb:')) return; await tx('foto', 'readwrite', s => s.delete(id)); const u = urls.get(id); if (u) URL.revokeObjectURL(u); urls.delete(id); }
async function preload(ids) {
  const need = [...new Set(ids)].filter(i => i?.startsWith('idb:') && !urls.has(i));
  if (!need.length) return;
  await Promise.all(need.map(async id => { const b = await tx('foto', 'readonly', s => s.get(id)).catch(() => null); if (b) urls.set(id, URL.createObjectURL(b)); }));
}
const url = id => urls.get(id) || '';
/* riduce la foto (lato lungo 1400 px, JPEG) prima di salvarla: veloce anche da telefono */
async function compress(file, max = 1400, q = .82) {
  const bmp = await createImageBitmap(file).catch(() => null);
  if (!bmp) return file;
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise(r => c.toBlob(b => r(b || file), 'image/jpeg', q));
}

/* ---------- contenuti e catalogo ---------- */
const fetchJSON = p => fetch(p, { cache: 'no-store' }).then(r => r.json());
async function load() {
  const [c, k] = await Promise.all([kvGet('contenuti'), kvGet('catalogo')]);
  const contenuti = c || await fetchJSON('data/contenuti.json');
  const catalogo = k || await fetchJSON('data/catalogo.json');
  const ids = [];
  catalogo.modelli.forEach(m => (m.foto || []).forEach(f => ids.push(f)));
  const walk = o => { if (typeof o === 'string') { if (o.startsWith('idb:')) ids.push(o); } else if (o && typeof o === 'object') Object.values(o).forEach(walk); };
  walk(contenuti);
  await preload(ids);
  return { contenuti, catalogo, modificato: !!(c || k) };
}
const saveContenuti = c => kvSet('contenuti', c);
const saveCatalogo = k => kvSet('catalogo', k);
const getOrders = async () => (await kvGet('ordini')) || [];
const saveOrders = o => kvSet('ordini', o);
async function reset() {
  await Promise.all([kvDel('contenuti'), kvDel('catalogo'), kvDel('ordini')]);
  await tx('foto', 'readwrite', s => s.clear());
  urls.forEach(u => URL.revokeObjectURL(u)); urls.clear();
}
async function originals() { return { contenuti: await fetchJSON('data/contenuti.json'), catalogo: await fetchJSON('data/catalogo.json') }; }

return { mode: 'prova', load, saveContenuti, saveCatalogo, putPhoto, delPhoto, preload, url, compress, getOrders, saveOrders, reset, originals, kvGet, kvSet };
})();
