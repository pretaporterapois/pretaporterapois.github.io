/* Prêt à Porter à Pois — area riservata (modalità prova: i dati restano in questo browser, vedi db.js). */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const euro = n => n == null || isNaN(n) ? '—' : (+n).toLocaleString('it-IT', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }) + ' €';
const today = () => new Date().toISOString().slice(0, 10);
const SIZES = INV.SIZES;

/* ---------------- icone ---------------- */
const ICONS = {
  grid: '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
  hanger: '<path d="M12 7a2 2 0 1 1 2-2"/><path d="M12 7v2L3 16h18l-9-7"/>', camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  excel: '<rect x="4" y="3" width="16" height="18" rx="2.5"/><path d="M8 8l8 8M16 8l-8 8"/>', home: '<path d="M4 11l8-7 8 7v9H4z"/><path d="M10 20v-5h4v5"/>',
  tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="7.5" r="1.3"/>', card: '<rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 10h18M7 15h4"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21h4"/>', bag: '<path d="M5 8h14l-1 12H6z"/><path d="M9 8a3 3 0 0 1 6 0"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>',
  menu: '<path d="M4 8h16M4 16h11"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>', plus: '<path d="M12 5v14M5 12h14"/>', search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>', left: '<path d="M19 12H5M11 6l-6 6 6 6"/>', check: '<path d="M5 12l5 5 9-10"/>', trash: '<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/>',
  star: '<path d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.6 9.6l5.8-.8z"/>', image: '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="m4 18 5-5 4 4 3-3 4 4"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v4h16v-4"/>', download: '<path d="M12 4v12M7 11l5 5 5-5"/><path d="M4 16v4h16v-4"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>', eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>', skip: '<path d="M5 5l9 7-9 7zM18 5v14"/>', sparkle: '<path d="M12 3l1.8 4.6L18.5 9.4l-4.7 1.8L12 16l-1.8-4.8L5.5 9.4l4.7-1.8z"/>'
};
const icon = n => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`;
const bi = n => `<span class="bi">${icon(n)}</span>`;

/* ---------------- stato ---------------- */
let C = null, K = null;
const imgSrc = s => !s ? '' : s.startsWith('idb:') ? DB.url(s) : s.startsWith('unsplash:') ? FOTO.U(s.slice(9), 400) : s;
const avail = m => m.varianti.filter(v => (v.stato || 'disponibile') === 'disponibile');
const hash = s => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
const offOf = m => m.sconto_manuale != null && m.sconto_manuale !== '' ? +m.sconto_manuale : m.ribasso_auto === false ? 0 : [0, 0, 0, 10, 20, 0, 30, 0, 10][hash(m.id) % 9];
const minOf = m => m.prezzo_min != null && m.prezzo_min !== '' ? +m.prezzo_min : Math.round(m.prezzo * (1 - (C.offerte.ribasso_massimo ?? 30) / 100));
const nowOf = m => { const o = offOf(m); return o ? Math.max(minOf(m), Math.round(m.prezzo * (1 - o / 100))) : m.prezzo; };
const catName = k => C.categorie[k]?.it || k;
function defaults() {
  C.offerte.codici ??= [{ codice: 'BENVENUTA10', tipo: '%', valore: 10, scadenza: '', usi: 0, attivo: true }];
  C.offerte.ribasso_massimo ??= 30;
  C.pagamenti ??= { carte: true, wallet: true, paypal: true, klarna: true, ritiro_paga: true, ritiro_ore: 48, ritiro_prepagato: true, stripe_modo: 'prova', stripe_pk: '' };
  C.notifiche ??= { email: { on: true, indirizzo: C.contatti.email || '' }, telegram: { on: false, chat_id: '' }, whatsapp: { on: false, numero: '' } };
}
async function saveK(msg = 'Magazzino salvato') { await DB.saveCatalogo(K); toast(msg + ' · visibile sul sito in questo browser'); renderNav(); }
async function saveC() { await DB.saveContenuti(C); dirtyC = false; $('#savebar')?.classList.remove('on'); toast('Contenuti salvati · visibili sul sito in questo browser'); }

/* ---------------- avvisi e conferme ---------------- */
let tt; function toast(m) { const el = $('#toast'); el.textContent = m; el.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => el.classList.remove('on'), 3400); }
function ask(title, text, yes = 'Conferma') {
  return new Promise(res => {
    const box = $('#confirm'); $('#cfT').textContent = title; $('#cfP').textContent = text; $('#cfYes span').textContent = yes; box.classList.add('on');
    const done = v => { box.classList.remove('on'); $('#cfYes').onclick = null; $$('#confirm [data-no]').forEach(b => b.onclick = null); res(v); };
    $('#cfYes').onclick = () => done(true); $$('#confirm [data-no]').forEach(b => b.onclick = () => done(false));
  });
}

/* ---------------- foto: fotocamera o galleria ---------------- */
function pickFiles(camera) {
  return new Promise(res => {
    const inp = camera ? $('#fileCam') : $('#fileGal');
    inp.value = ''; inp.onchange = () => res([...inp.files]); inp.click();
  });
}
async function storePhotos(files) {
  const ids = [];
  for (const f of files) { const b = await DB.compress(f); ids.push(await DB.putPhoto(b)); }
  return ids;
}

/* ---------------- accesso ---------------- */
const HKEY = 'pap-admin-hash';
const sha = async s => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode('pap:' + s)))].map(b => b.toString(16).padStart(2, '0')).join('');
const lsGet = k => { try { return localStorage.getItem(k); } catch (_) { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (_) {} };
function showLogin() {
  const first = !lsGet(HKEY);
  $('#login').hidden = false; $('#app').hidden = true;
  $('#lTitle').textContent = first ? 'Benvenuta' : 'Bentornata';
  $('#lText').textContent = first ? 'Primo accesso: scegli la password dell’area riservata (almeno 6 caratteri).' : 'Inserisci la password per gestire negozio, magazzino e contenuti.';
  $('#lPw2').hidden = !first; $('#lPw2').required = first; $('#lBtn').textContent = first ? 'Crea e entra' : 'Entra';
  $('#lPw').autocomplete = first ? 'new-password' : 'current-password';
  setTimeout(() => $('#lPw').focus(), 50);
}
$('#lForm').onsubmit = async e => {
  e.preventDefault();
  const first = !lsGet(HKEY), pw = $('#lPw').value, err = $('#lErr');
  if (!crypto.subtle) { err.textContent = 'Questo browser non permette l’accesso sicuro: apri il sito da https o da localhost.'; err.hidden = false; return; }
  if (first) {
    if (pw.length < 6) { err.textContent = 'Usa almeno 6 caratteri.'; err.hidden = false; return; }
    if (pw !== $('#lPw2').value) { err.textContent = 'Le due password non coincidono.'; err.hidden = false; return; }
    lsSet(HKEY, await sha(pw));
  } else if (await sha(pw) !== lsGet(HKEY)) { err.textContent = 'Password non corretta.'; err.hidden = false; $('#lPw').select(); return; }
  try { sessionStorage.setItem('pap-admin-ok', '1'); } catch (_) {}
  err.hidden = true; $('#lForm').reset(); boot();
};
$('#logout').onclick = () => { try { sessionStorage.removeItem('pap-admin-ok'); } catch (_) {} location.reload(); };

/* ---------------- navigazione ---------------- */
const VIEWS = [
  ['dash', 'Panoramica', 'grid'], ['mag', 'Magazzino', 'hanger'], ['foto', 'Scatta le foto', 'camera'], ['imp', 'Excel: importa / esporta', 'excel'], '-',
  ['home', 'Homepage', 'home'], ['off', 'Offerte e ribassi', 'tag'], ['pay', 'Pagamenti', 'card'], ['not', 'Notifiche', 'bell'], ['ord', 'Ordini', 'bag'], '-',
  ['set', 'Impostazioni', 'gear']
];
let cur = 'dash';
function renderNav() {
  const noPh = K.modelli.filter(m => !(m.foto || []).length && avail(m).length).length;
  $('#nav').innerHTML = VIEWS.map(v => v === '-' ? '<div class="sep"></div>' : `<button data-v="${v[0]}" class="${v[0] === cur ? 'on' : ''}">${icon(v[2])}${v[1]}${v[0] === 'foto' && noPh ? `<em>${noPh}</em>` : ''}</button>`).join('');
}
$('#nav').addEventListener('click', e => { const b = e.target.closest('[data-v]'); if (b) go(b.dataset.v); });
$('#burger').innerHTML = icon('menu');
const side = on => { $('#side').classList.toggle('on', on); $('#sscrim').classList.toggle('on', on); };
$('#burger').onclick = () => side(true); $('#sscrim').onclick = () => side(false);
async function go(v) {
  if (dirtyC && !await ask('Modifiche non salvate', 'Hai cambiato dei contenuti senza salvarli. Vuoi uscire lo stesso?', 'Esci senza salvare')) return;
  dirtyC = false; cur = v; history.replaceState(null, '', '#' + v); side(false); renderNav();
  const t = VIEWS.find(x => x[0] === v); $('#vTitle').textContent = t ? t[1] : ''; $('#mact').innerHTML = '';
  $('#view').innerHTML = ''; scrollTo(0, 0);
  ({ dash: vDash, mag: vMag, foto: vFoto, imp: vImp, home: vHome, off: vOff, pay: vPay, not: vNot, ord: vOrd, set: vSet })[v]();
}

/* ================= PANORAMICA ================= */
function vDash() {
  const ms = K.modelli, pz = ms.flatMap(m => m.varianti);
  const disp = pz.filter(v => (v.stato || 'disponibile') === 'disponibile').length, vend = pz.filter(v => v.stato === 'venduto').length;
  const online = ms.filter(m => m.online !== false && avail(m).length).length;
  const noPh = ms.filter(m => !(m.foto || []).length && avail(m).length).length;
  const val = ms.reduce((s, m) => s + avail(m).length * (m.prezzo || 0), 0);
  const inc = pz.filter(v => v.stato === 'venduto').reduce((s, v) => s + (v.prezzo_venduto || 0), 0);
  const cats = {}; ms.forEach(m => { cats[m.categoria] = (cats[m.categoria] || 0) + avail(m).length; });
  const max = Math.max(1, ...Object.values(cats));
  $('#view').innerHTML = `
    ${DB.mode === 'prova' ? `<div class="tip">${icon('info')}<div><b>Modalità prova.</b> Tutto quello che modifichi resta in questo browser: il sito, aperto qui, lo mostra subito. Quando colleghiamo il database (Supabase) le modifiche saranno visibili a tutti.</div></div>` : ''}
    <div class="kpis">
      <div class="kpi"><i>${icon('hanger')}</i><small>Capi online</small><b>${online}</b><span>su ${ms.length} modelli</span></div>
      <div class="kpi"><i>${icon('bag')}</i><small>Pezzi disponibili</small><b>${disp}</b><span>${vend} venduti</span></div>
      <div class="kpi ${noPh ? 'warn' : ''}"><i>${icon('camera')}</i><small>Capi senza foto</small><b>${noPh}</b><span>${noPh ? 'da fotografare' : 'tutto a posto'}</span></div>
      <div class="kpi"><i>${icon('tag')}</i><small>Valore in vetrina</small><b>${euro(Math.round(val))}</b><span>a prezzo pieno</span></div>
      <div class="kpi"><i>${icon('sparkle')}</i><small>Pezzi venduti</small><b>${vend}</b><span>${inc ? euro(Math.round(inc)) + ' incassati' : 'segnati nel magazzino'}</span></div>
    </div>
    <div class="short">
      <button class="shortc" data-go="foto"><i>${icon('camera')}</i><span><b>Scatta le foto mancanti</b><small>Un capo alla volta, dal telefono</small></span></button>
      <button class="shortc" data-go="imp"><i>${icon('excel')}</i><span><b>Importa l’inventario</b><small>Aggiorna tutto il magazzino da Excel</small></span></button>
      <button class="shortc" data-go="home"><i>${icon('home')}</i><span><b>Modifica la homepage</b><small>Testi, foto, boutique, avvisi</small></span></button>
      <button class="shortc" data-go="off"><i>${icon('tag')}</i><span><b>Offerte e ribassi</b><small>Spedizione, codici sconto, regole</small></span></button>
    </div>
    <div class="panelx"><h2>Pezzi disponibili per categoria</h2><p class="sub">Quanti capi ci sono adesso in vetrina, categoria per categoria.</p>
      <div class="bars">${Object.entries(cats).sort((a, b) => b[1] - a[1]).map(([k, n]) => `<div class="barrow"><span>${esc(catName(k))}</span><div class="tr"><i style="width:${n / max * 100}%"></i></div><b>${n}</b></div>`).join('')}</div></div>`;
  $$('[data-go]').forEach(b => b.onclick = () => go(b.dataset.go));
}

/* ================= MAGAZZINO ================= */
const MF = { q: '', cat: '', st: 'tutti' };
function vMag() {
  $('#mact').innerHTML = `<button class="btn sm" id="newM"><span>Nuovo capo</span>${bi('plus')}</button>`;
  $('#newM').onclick = () => openEditor(null);
  $('#view').innerHTML = `
    <div class="mtools"><label class="srch">${icon('search')}<input id="mq" placeholder="Cerca per nome, codice, colore…" value="${esc(MF.q)}"></label>
      <select id="mcat"><option value="">Tutte le categorie</option>${Object.keys(C.categorie).map(k => `<option value="${k}" ${MF.cat === k ? 'selected' : ''}>${esc(catName(k))}</option>`).join('')}</select></div>
    <div class="fchips" id="mst"></div>
    <div class="mlist" id="mlist"></div>`;
  $('#mq').oninput = e => { MF.q = e.target.value; magList(); };
  $('#mcat').onchange = e => { MF.cat = e.target.value; magList(); };
  $('#mst').onclick = e => { const b = e.target.closest('[data-st]'); if (b) { MF.st = b.dataset.st; magList(); } };
  magList();
}
const ST = { tutti: ['Tutti', () => true], nofoto: ['Senza foto', m => !(m.foto || []).length && avail(m).length], disp: ['Disponibili', m => avail(m).length > 0], esauriti: ['Esauriti', m => !avail(m).length], offline: ['Nascosti', m => m.online === false], ribasso: ['Con sconto manuale', m => m.sconto_manuale != null && m.sconto_manuale !== ''] };
function magList() {
  const q = MF.q.toLowerCase().trim();
  const base = K.modelli.filter(m => (!MF.cat || m.categoria === MF.cat) && (!q || (m.nome + ' ' + (m.sku || '') + ' ' + m.varianti.map(v => v.colore).join(' ')).toLowerCase().includes(q)));
  $('#mst').innerHTML = Object.entries(ST).map(([k, [l, f]]) => `<button data-st="${k}" class="${MF.st === k ? 'on' : ''}">${l} <small>${base.filter(f).length}</small></button>`).join('');
  const list = base.filter(ST[MF.st][1]);
  $('#mlist').innerHTML = list.length ? list.map(m => {
    const a = avail(m).length, ph = (m.foto || [])[0], o = offOf(m), now = nowOf(m);
    return `<div class="mrow" data-id="${esc(m.id)}">
      <button class="mthumb ${ph ? '' : 'nophoto'}" data-shot="${esc(m.id)}" title="${ph ? 'Aggiungi foto' : 'Scatta la foto'}">${ph ? `<img src="${imgSrc(ph)}" alt=""><span class="n">${m.foto.length}</span>` : icon('camera')}</button>
      <button class="mname" data-ed="${esc(m.id)}" style="text-align:left;min-width:0"><b>${esc(m.nome)}</b><small>${esc(m.sku || 'senza codice')} · ${m.varianti.length} pz</small></button>
      <span class="mcat">${esc(catName(m.categoria))}</span>
      <span class="mpz"><b>${a}</b> / ${m.varianti.length} disp.</span>
      <span class="mpr">${euro(now)}${o ? `<s>${euro(m.prezzo)}</s>` : ''}</span>
      <span class="mstate">${a ? '<span class="tagx ok">In vendita</span>' : '<span class="tagx no">Esaurito</span>'}${m.online === false ? '<span class="tagx no">Nascosto</span>' : ''}${!ph && a ? '<span class="tagx ro">Foto</span>' : ''}</span>
    </div>`;
  }).join('') : `<div class="empty"><span class="script">Nessun capo</span>Cambia i filtri o importa l’inventario da Excel.</div>`;
}
document.addEventListener('click', async e => {
  const ed = e.target.closest('[data-ed]'); if (ed) return openEditor(ed.dataset.ed);
  const sh = e.target.closest('[data-shot]');
  if (sh) {
    const m = K.modelli.find(x => x.id === sh.dataset.shot); const files = await pickFiles(true); if (!files.length) return;
    m.foto = [...(m.foto || []), ...await storePhotos(files)]; await saveK('Foto salvata'); if (cur === 'mag') magList();
  }
});

/* ---------------- editor del capo ---------------- */
let E = null, isNew = false;
function blankModel() {
  const id = 'nuovo-' + Date.now().toString(36);
  return { id, sku: '', nome: '', categoria: Object.keys(C.categorie)[0], prezzo: null, prezzo_min: null, caricato: today(), foto: [], online: true, ribasso_auto: true, varianti: [{ id: id + '-1', colore: '', hex: ['#F2B5BE'], taglia: null, stato: 'disponibile' }] };
}
function openEditor(id) {
  isNew = !id; E = structuredClone(id ? K.modelli.find(m => m.id === id) : blankModel());
  E.foto ??= []; E.descr ??= { it: '', en: '' };
  renderEditor(); $('#editor').classList.add('on'); $('#escrim').classList.add('on');
}
const closeEditor = () => { $('#editor').classList.remove('on'); $('#escrim').classList.remove('on'); E = null; };
$('#escrim').onclick = closeEditor;
function renderEditor() {
  const m = E, auto = minOf({ ...m, prezzo_min: null, prezzo: +m.prezzo || 0 });
  $('#editor').innerHTML = `
    <div class="ehead"><h3>${isNew ? 'Nuovo capo' : esc(m.nome || 'Capo')}</h3>${!isNew ? `<a class="ic" href="prodotto.html?id=${encodeURIComponent(m.id)}" target="_blank" rel="noopener" title="Vedi sul sito">${icon('eye')}</a>` : ''}<button class="ic" data-x title="Chiudi">${icon('x')}</button></div>
    <div class="ebody">
      <section class="esec"><h4>Foto <span style="color:var(--muted);letter-spacing:.06em;text-transform:none">${m.foto.length ? 'la prima è la copertina' : 'nessuna foto: sul sito appare una foto campione'}</span></h4>
        <div class="pgrid2">${m.foto.map((f, i) => `<div class="ph2"><img src="${imgSrc(f)}" alt="">${i === 0 ? '<span class="cov">COPERTINA</span>' : ''}
          <div class="pa"><button data-pmv="${i}" data-d="-1" title="Sposta a sinistra">${icon('left')}</button>${i ? `<button data-pcov="${i}" title="Usa come copertina">${icon('star')}</button>` : ''}<button data-pdel="${i}" title="Elimina">${icon('trash')}</button></div></div>`).join('')}
          <button class="addph" data-padd="cam"><i>${icon('camera')}</i>Scatta</button><button class="addph" data-padd="gal"><i>${icon('image')}</i>Dalla galleria</button></div></section>
      <section class="esec"><h4>Dati del capo</h4><div class="stack">
        <label class="fld"><span>Nome sul sito</span><input data-f="nome" value="${esc(m.nome)}"></label>
        <label class="fld"><span>Nome in inglese <small>(facoltativo)</small></span><input data-f="nome_en" value="${esc(m.nome_en || '')}"></label>
        <div class="g2"><label class="fld"><span>Categoria</span><select data-f="categoria">${Object.keys(C.categorie).map(k => `<option value="${k}" ${m.categoria === k ? 'selected' : ''}>${esc(catName(k))}</option>`).join('')}</select></label>
          <label class="fld"><span>Codice</span><input data-f="sku" value="${esc(m.sku || '')}"></label></div>
        <div class="g2"><label class="fld"><span>Fornitore</span><input data-f="fornitore" value="${esc(m.fornitore || '')}"></label><label class="fld"><span>Data di carico</span><input type="date" data-f="caricato" value="${esc(m.caricato || '')}"></label></div>
        <label class="sw-row"><span><b>Visibile sul sito</b><small>Spegni per nasconderlo senza cancellarlo</small></span><input type="checkbox" data-f="online" ${m.online !== false ? 'checked' : ''}><i></i></label>
      </div></section>
      <section class="esec"><h4>Prezzo e ribassi</h4><div class="stack">
        <div class="g3"><label class="fld"><span>Prezzo pieno €</span><input type="number" step="0.5" min="0" data-f="prezzo" data-num value="${m.prezzo ?? ''}"></label>
          <label class="fld"><span>Prezzo minimo €</span><input type="number" step="0.5" min="0" data-f="prezzo_min" data-num value="${m.prezzo_min ?? ''}" placeholder="auto: ${m.prezzo ? auto : '—'}"></label>
          <label class="fld"><span>Sconto fisso %</span><input type="number" step="1" min="0" max="90" data-f="sconto_manuale" data-num value="${m.sconto_manuale ?? ''}" placeholder="nessuno"></label></div>
        <label class="sw-row"><span><b>Ribasso automatico</b><small>Scende da solo con i giorni in vetrina e i pezzi venduti</small></span><input type="checkbox" data-f="ribasso_auto" ${m.ribasso_auto !== false ? 'checked' : ''}><i></i></label>
        <div class="preview" id="pv"></div>
      </div></section>
      <section class="esec"><h4>Pezzi <button class="btn ghost sm" data-vadd style="min-height:34px;padding:0 14px">+ Aggiungi pezzo</button></h4>
        <div class="pcs">${m.varianti.map((v, i) => `<div class="pc">
          <input type="color" data-v="${i}" data-vf="hex" value="${esc((v.hex && v.hex[0]) || '#F2B5BE')}" title="Tinta">
          <input data-v="${i}" data-vf="colore" value="${esc(v.colore || '')}" placeholder="Colore (es. Rosa)">
          <select class="tg" data-v="${i}" data-vf="taglia"><option value="">Taglia</option>${[...SIZES, '38', '40', '42', '44', '46', '48', 'Unica'].map(s => `<option ${v.taglia === s ? 'selected' : ''}>${s}</option>`).join('')}</select>
          <select class="st" data-v="${i}" data-vf="stato">${['disponibile', 'riservato', 'venduto'].map(s => `<option ${(v.stato || 'disponibile') === s ? 'selected' : ''}>${s}</option>`).join('')}</select>
          <button class="del" data-vdel="${i}" title="Elimina pezzo">${icon('trash')}</button></div>`).join('')}</div></section>
      <section class="esec"><h4>Testi della scheda</h4><div class="stack">
        <label class="fld"><span>Descrizione</span><textarea data-f="descr.it" placeholder="Se vuoto, il sito scrive una descrizione automatica">${esc(m.descr?.it || '')}</textarea></label>
        <label class="fld"><span>Descrizione in inglese</span><textarea data-f="descr.en">${esc(m.descr?.en || '')}</textarea></label>
        <label class="fld"><span>Composizione e cura</span><textarea data-f="composizione" placeholder="Es. 70% viscosa, 30% poliammide · lavaggio a mano a 30°">${esc(m.composizione || '')}</textarea></label>
      </div></section>
    </div>
    <div class="efoot">${!isNew ? `<button class="btn ghost sm" data-del>Elimina</button><button class="btn ghost sm" data-dup>Duplica</button>` : ''}<button class="btn rosa sm" data-save><span>Salva</span>${bi('check')}</button></div>`;
  preview();
}
function preview() {
  const m = { ...E, prezzo: +E.prezzo || 0 }; if (!m.prezzo) { $('#pv').innerHTML = 'Inserisci il prezzo per vedere come appare sul sito.'; return; }
  const o = offOf(m), n = nowOf(m);
  $('#pv').innerHTML = `Sul sito oggi: <b>${euro(n)}</b>${o ? `<s>${euro(m.prezzo)}</s> · sconto ${o}%` : ''} · minimo ${euro(minOf(m))}`;
}
$('#editor').addEventListener('input', e => {
  const t = e.target;
  if (t.dataset.f) {
    const v = t.type === 'checkbox' ? t.checked : t.dataset.num !== undefined ? (t.value === '' ? null : +t.value) : t.value;
    if (t.dataset.f.includes('.')) { const [a, b] = t.dataset.f.split('.'); E[a] ??= {}; E[a][b] = v; } else E[t.dataset.f] = v;
    if (['prezzo', 'prezzo_min', 'sconto_manuale', 'ribasso_auto'].includes(t.dataset.f)) preview();
  }
  if (t.dataset.v != null) { const v = E.varianti[+t.dataset.v]; if (t.dataset.vf === 'hex') v.hex = [t.value]; else v[t.dataset.vf] = t.value || null; }
});
$('#editor').addEventListener('change', e => { if (e.target.dataset.f === 'online' || e.target.dataset.f === 'ribasso_auto') e.target.dispatchEvent(new Event('input', { bubbles: true })); });
$('#editor').addEventListener('click', async e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.hasAttribute('data-x')) return closeEditor();
  if (b.dataset.padd) { const files = await pickFiles(b.dataset.padd === 'cam'); if (!files.length) return; toast('Salvo le foto…'); E.foto.push(...await storePhotos(files)); renderEditor(); toast(files.length > 1 ? `${files.length} foto aggiunte` : 'Foto aggiunta'); return; }
  if (b.dataset.pdel != null) { E.foto.splice(+b.dataset.pdel, 1); renderEditor(); return; }
  if (b.dataset.pcov != null) { const [f] = E.foto.splice(+b.dataset.pcov, 1); E.foto.unshift(f); renderEditor(); return; }
  if (b.dataset.pmv != null) { const i = +b.dataset.pmv; if (i > 0) { [E.foto[i - 1], E.foto[i]] = [E.foto[i], E.foto[i - 1]]; renderEditor(); } return; }
  if (b.hasAttribute('data-vadd')) { const last = E.varianti[E.varianti.length - 1]; E.varianti.push({ id: E.id + '-' + Date.now().toString(36), colore: last?.colore || '', hex: last?.hex || ['#F2B5BE'], taglia: null, stato: 'disponibile' }); renderEditor(); return; }
  if (b.dataset.vdel != null) { if (E.varianti.length === 1) return toast('Un capo ha almeno un pezzo: per toglierlo usa “Elimina”.'); E.varianti.splice(+b.dataset.vdel, 1); renderEditor(); return; }
  if (b.hasAttribute('data-save')) {
    if (!E.nome?.trim()) return toast('Scrivi il nome del capo');
    if (!(+E.prezzo > 0)) return toast('Inserisci il prezzo');
    E.prezzo = +E.prezzo;
    E.varianti.forEach(v => { if (v.stato === 'venduto' && !v.venduto_il) v.venduto_il = today(); if (v.stato !== 'venduto') { delete v.venduto_il; } });
    if (isNew) { E.id = INV.slug(`${E.sku}-${E.nome}`) + (K.modelli.some(m => m.id === INV.slug(`${E.sku}-${E.nome}`)) ? '-' + Date.now().toString(36) : ''); E.varianti.forEach((v, i) => v.id = `${E.id}-${i + 1}`); K.modelli.unshift(E); }
    else K.modelli[K.modelli.findIndex(m => m.id === E.id)] = E;
    await saveK(isNew ? 'Capo creato' : 'Capo salvato'); closeEditor(); if (cur === 'mag') magList(); return;
  }
  if (b.hasAttribute('data-dup')) { const c = structuredClone(E); c.id = E.id + '-copia-' + Date.now().toString(36); c.nome += ' (copia)'; c.foto = []; c.varianti.forEach((v, i) => { v.id = `${c.id}-${i + 1}`; v.stato = 'disponibile'; }); E = c; isNew = true; renderEditor(); toast('Copia pronta: modifica e salva'); return; }
  if (b.hasAttribute('data-del')) {
    if (!await ask('Eliminare questo capo?', `"${E.nome}" sparirà dal sito e dal magazzino. Se vuoi solo nasconderlo, spegni “Visibile sul sito”.`, 'Elimina')) return;
    K.modelli = K.modelli.filter(m => m.id !== E.id); await saveK('Capo eliminato'); closeEditor(); if (cur === 'mag') magList();
  }
});

/* ================= MODALITÀ SCATTO ================= */
let shootI = 0, shootCat = '';
function vFoto() {
  const queue = K.modelli.filter(m => !(m.foto || []).length && avail(m).length && (!shootCat || m.categoria === shootCat));
  const total = K.modelli.filter(m => avail(m).length && (!shootCat || m.categoria === shootCat)).length;
  if (shootI >= queue.length) shootI = 0;
  const m = queue[shootI];
  $('#view').innerHTML = `<div class="shoot">
    <select id="shCat" style="max-width:280px;margin:0 auto 14px;border-radius:999px"><option value="">Tutte le categorie</option>${Object.keys(C.categorie).map(k => `<option value="${k}" ${shootCat === k ? 'selected' : ''}>${esc(catName(k))}</option>`).join('')}</select>
    <div class="prog"><i style="width:${total ? (total - queue.length) / total * 100 : 100}%"></i></div>
    <div class="cnt">${total - queue.length} di ${total} capi fotografati</div>
    ${m ? `<div class="scard"><h2>${esc(m.nome)}</h2><div class="ref">${esc(m.sku || '')} · ${esc(catName(m.categoria))} · ${avail(m).length} pz</div>
      <div class="cols">${[...new Map(avail(m).map(v => [v.colore, v])).values()].map(v => `<span><i style="background:${(v.hex || ['#ccc'])[0]}"></i>${esc(v.colore || '—')}${v.taglia ? ' · ' + v.taglia : ''}</span>`).join('')}</div>
      <button class="shot" id="shot" aria-label="Scatta la foto">${icon('camera')}</button>
      <p style="color:var(--muted);font-size:12px">Tocca per aprire la fotocamera. Puoi fare più foto dello stesso capo.</p>
      <div class="sthumbs" id="sth"></div>
      <div class="sbtns"><button class="btn ghost sm" id="shGal">Dalla galleria</button><button class="btn ghost sm" id="shSkip">Salta</button><button class="btn sm" id="shNext" hidden><span>Capo successivo</span>${bi('arrow')}</button></div></div>`
      : `<div class="scard"><span class="script" style="font-size:44px;color:var(--rosa)">Brava!</span><h2>Tutti i capi hanno la foto</h2><p style="color:var(--muted);margin-top:8px">Quando arrivano capi nuovi li trovi qui.</p></div>`}
  </div>`;
  $('#shCat').onchange = e => { shootCat = e.target.value; shootI = 0; vFoto(); };
  if (!m) return;
  const add = async cam => {
    const files = await pickFiles(cam); if (!files.length) return;
    const ids = await storePhotos(files); m.foto = [...(m.foto || []), ...ids]; await saveK('Foto salvata');
    $('#sth').innerHTML = m.foto.map(f => `<img src="${imgSrc(f)}" alt="">`).join(''); $('#shNext').hidden = false; $('#shSkip').hidden = true;
  };
  $('#shot').onclick = () => add(true); $('#shGal').onclick = () => add(false);
  $('#shSkip').onclick = () => { shootI++; vFoto(); };
  $('#shNext').onclick = () => vFoto();               // il capo fotografato esce dalla coda da solo
}

/* ================= EXCEL ================= */
let XLSXp = null;
const loadXLSX = () => XLSXp ||= new Promise((res, rej) => { if (window.XLSX) return res(); const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'; s.onload = res; s.onerror = () => { XLSXp = null; rej(new Error('Impossibile caricare il lettore Excel: controlla la connessione.')); }; document.head.appendChild(s); });
let IMP = null, impOpt = { venduti: true, replace: false };
function vImp() {
  $('#view').innerHTML = `
    <div class="panelx"><h2>${icon('upload')} Importa l’inventario</h2><p class="sub">Carica il file Excel con lo stesso formato di “INVENTARIO 2026”. Aggiorna prezzi, pezzi e venduti in un colpo solo. <b style="color:var(--txt)">Foto, testi e impostazioni già inseriti restano.</b></p>
      <div class="xdrop" id="drop"><i>${icon('excel')}</i><b>Trascina qui il file Excel</b><small>oppure tocca per sceglierlo · .xlsx, .xls</small></div>
      <input type="file" id="xf" accept=".xlsx,.xls,.xlsm,.csv" hidden>
      <div class="stack" style="margin-top:16px">
        <label class="sw-row"><span><b>Segna come venduti i pezzi scaricati</b><small>Righe con DATA SCARICO o PREZZO VENDUTO compilati</small></span><input type="checkbox" id="optV" ${impOpt.venduti ? 'checked' : ''}><i></i></label>
        <div class="radios">
          <label class="radio ${!impOpt.replace ? 'on' : ''}"><input type="radio" name="mode" value="merge" ${!impOpt.replace ? 'checked' : ''}><span><b>Aggiorna e aggiungi</b><small>I capi del file vengono aggiornati o aggiunti; quelli che non sono nel file restano.</small></span></label>
          <label class="radio ${impOpt.replace ? 'on' : ''}"><input type="radio" name="mode" value="replace" ${impOpt.replace ? 'checked' : ''}><span><b>Sostituisci tutto il magazzino</b><small>Il magazzino diventa esattamente il file: i capi assenti vengono tolti.</small></span></label>
        </div>
      </div>
      <div id="impRes"></div>
    </div>
    <div class="panelx"><h2>${icon('download')} Esporta</h2><p class="sub">Scarica il magazzino attuale in Excel (stesse colonne dell’inventario, più stato e foto). Utile come copia o per lavorarci e reimportarlo.</p>
      <div class="sbtns" style="justify-content:flex-start"><button class="btn sm" id="xExp"><span>Scarica il magazzino</span>${bi('download')}</button></div></div>`;
  const drop = $('#drop');
  drop.onclick = () => $('#xf').click();
  ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('over'); }));
  drop.addEventListener('drop', e => { const f = e.dataTransfer.files[0]; if (f) readX(f); });
  $('#xf').onchange = e => { const f = e.target.files[0]; if (f) readX(f); };
  $('#optV').onchange = e => { impOpt.venduti = e.target.checked; if (IMP) readX(IMP.file); };
  $$('input[name=mode]').forEach(r => r.onchange = () => { impOpt.replace = r.value === 'replace' && r.checked; $$('.radio').forEach(x => x.classList.toggle('on', x.querySelector('input').checked)); if (IMP) showImp(); });
  $('#xExp').onclick = async () => {
    try { await loadXLSX(); } catch (err) { return toast(err.message); }
    const ws = XLSX.utils.aoa_to_sheet(INV.toRows(K.modelli)), wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Magazzino'); XLSX.writeFile(wb, `magazzino-pret-a-pois-${today()}.xlsx`);
  };
  if (IMP) showImp();
}
async function readX(file) {
  try { await loadXLSX(); } catch (err) { return toast(err.message); }
  $('#impRes').innerHTML = '<p class="sub" style="margin-top:16px">Leggo il file…</p>';
  try {
    const wb = XLSX.read(await file.arrayBuffer(), { cellDates: true });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null });
    const r = INV.fromRows(rows, { venduti: impOpt.venduti });
    if (!r.modelli.length) throw new Error('Nel file non ho trovato capi: controlla che la descrizione sia nella colonna G.');
    IMP = { file, ...r, d: INV.diff(K.modelli, r.modelli) };
    showImp();
  } catch (err) { console.error(err); $('#impRes').innerHTML = `<div class="tip" style="margin-top:16px">${icon('info')}<div><b>Non riesco a leggere il file.</b> ${esc(err.message)}</div></div>`; }
}
function showImp() {
  const { d } = IMP;
  const row = (m, tag) => `<tr><td>${tag}</td><td>${esc(m.nome)}</td><td>${esc(m.sku)}</td><td>${m.varianti.length}</td><td>${m.varianti.filter(v => v.stato === 'venduto').length}</td><td>${euro(m.prezzo)}</td></tr>`;
  $('#impRes').innerHTML = `
    <div class="kpis" style="margin-top:18px">
      <div class="kpi"><small>Nel file</small><b>${IMP.modelli.length}</b><span>${IMP.pieces} pezzi · ${IMP.sold} venduti</span></div>
      <div class="kpi"><small>Capi nuovi</small><b>${d.nuovi.length}</b><span>verranno aggiunti</span></div>
      <div class="kpi"><small>Da aggiornare</small><b>${d.aggiornati.length}</b><span>prezzo o pezzi cambiati</span></div>
      <div class="kpi ${impOpt.replace && d.assenti.length ? 'warn' : ''}"><small>Non nel file</small><b>${d.assenti.length}</b><span>${impOpt.replace ? 'verranno tolti' : 'restano come sono'}</span></div>
    </div>
    ${d.nuovi.length + d.aggiornati.length ? `<div class="tblwrap"><table class="tbl"><thead><tr><th></th><th>Capo</th><th>Codice</th><th>Pezzi</th><th>Venduti</th><th>Prezzo</th></tr></thead><tbody>
      ${d.nuovi.slice(0, 15).map(m => row(m, '<span class="tagx ok">Nuovo</span>')).join('')}${d.aggiornati.slice(0, 15).map(m => row(m, '<span class="tagx ro">Aggiorna</span>')).join('')}</tbody></table></div>
      ${d.nuovi.length + d.aggiornati.length > 30 ? `<p class="sub" style="margin-top:8px">…e altri ${d.nuovi.length + d.aggiornati.length - 30}</p>` : ''}` : '<p class="sub">Il file è identico al magazzino attuale.</p>'}
    <div class="sbtns" style="justify-content:flex-start;margin-top:16px"><button class="btn rosa" id="impGo"><span>Applica l’import</span>${bi('check')}</button><button class="btn ghost sm" id="impNo">Annulla</button></div>`;
  $('#impNo').onclick = () => { IMP = null; $('#impRes').innerHTML = ''; };
  $('#impGo').onclick = async () => {
    if (impOpt.replace && d.assenti.length && !await ask('Sostituire il magazzino?', `${d.assenti.length} capi che non sono nel file verranno tolti dal sito.`, 'Sostituisci')) return;
    K.modelli = INV.merge(K.modelli, IMP.modelli, impOpt.replace); K.importato = today();
    await saveK(`Import completato: ${d.nuovi.length} nuovi, ${d.aggiornati.length} aggiornati`); IMP = null; vImp();
  };
}

/* ================= CONTENUTI: strumenti per i moduli ================= */
let dirtyC = false;
const getP = p => p.reduce((o, k) => o?.[k], C);
function setP(p, v) { let o = C; p.slice(0, -1).forEach((k, i) => { o[k] ??= typeof p[i + 1] === 'number' ? [] : {}; o = o[k]; }); o[p[p.length - 1]] = v; }
const P = p => esc(JSON.stringify(p));
const fTxt = (p, label, ph = '') => `<label class="fld"><span>${label}</span><input data-p="${P(p)}" value="${esc(getP(p) ?? '')}" placeholder="${esc(ph)}"></label>`;
const fNum = (p, label, step = 1) => `<label class="fld"><span>${label}</span><input type="number" step="${step}" min="0" data-p="${P(p)}" data-num value="${getP(p) ?? ''}"></label>`;
const fArea = (p, ph = '') => `<textarea data-p="${P(p)}" placeholder="${esc(ph)}">${esc(getP(p) ?? '')}</textarea>`;
const fTog = (p, label, sub = '', dis = false) => `<label class="sw-row"><span><b>${label}</b>${sub ? `<small>${sub}</small>` : ''}</span><input type="checkbox" data-p="${P(p)}" data-bool ${getP(p) ? 'checked' : ''} ${dis ? 'disabled' : ''}><i></i></label>`;
const fSel = (p, label, opts) => `<label class="fld"><span>${label}</span><select data-p="${P(p)}">${opts.map(([v, l]) => `<option value="${esc(v)}" ${getP(p) === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>`;
const fPhoto = (p, label, del, mv) => { const s = getP(p); return `<div class="slot"><div class="im">${s ? `<img src="${imgSrc(s)}" alt="">` : ''}</div><small>${label}</small><div class="sa">${mv ? `<button data-mv="${P(p)}" title="Sposta prima" style="flex:0 0 32px">←</button>` : ''}<button data-ph="${P(p)}">Sostituisci</button>${del ? `<button data-rm="${P(p)}">Togli</button>` : ''}</div></div>`; };
const saveBar = () => `<div class="savebar" id="savebar"><span><b>●</b> Modifiche non salvate</span><button class="btn rosa sm" id="saveC"><span>Salva</span>${bi('check')}</button></div>`;
function markDirty() { dirtyC = true; $('#savebar')?.classList.add('on'); }
function bindForm(rerender) {
  const v = $('#view');
  v.oninput = e => { const t = e.target; if (!t.dataset.p) return; const p = JSON.parse(t.dataset.p); setP(p, t.dataset.bool !== undefined ? t.checked : t.dataset.num !== undefined ? (t.value === '' ? null : +t.value) : t.value); markDirty(); };
  v.onchange = e => { if (e.target.dataset.bool !== undefined) v.oninput(e); };
  v.onclick = async e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.id === 'saveC') return saveC();
    if (b.dataset.ph) { const files = await pickFiles(false); if (!files.length) return; const [id] = await storePhotos(files.slice(0, 1)); setP(JSON.parse(b.dataset.ph), id); markDirty(); rerender(); return; }
    if (b.dataset.rm) { const p = JSON.parse(b.dataset.rm), arr = getP(p.slice(0, -1)); if (p[0] === 'hero' && arr.length === 1) return toast('Serve almeno una foto nell’apertura: prima aggiungine un’altra'); arr.splice(p[p.length - 1], 1); markDirty(); rerender(); return; }
    if (b.dataset.mv) { const p = JSON.parse(b.dataset.mv), arr = getP(p.slice(0, -1)), i = p[p.length - 1]; if (i > 0) { [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; markDirty(); rerender(); } return; }
    if (b.dataset.add) { const p = JSON.parse(b.dataset.add); (getP(p) || setP(p, []) || getP(p)).push(JSON.parse(b.dataset.tpl)); markDirty(); rerender(); return; }
    if (b.dataset.addph) { const p = JSON.parse(b.dataset.addph); const files = await pickFiles(false); if (!files.length) return; getP(p).push(...await storePhotos(files)); markDirty(); rerender(); }
  };
}
const keepScroll = fn => () => { const y = scrollY; fn(); scrollTo(0, y); };

/* ================= HOMEPAGE ================= */
const GROUPS = { hero: 'Apertura', sec: 'Nomi delle sezioni', nov: 'Novità', col: 'Collezione', rib: 'Ribassi', tour: 'Shopping Tour', bou: 'Boutique', club: 'Newsletter', ft: 'Piè di pagina', cart: 'Borsa', tm: 'Prenotazione tour', ck: 'Cookie', ui: 'Menu e ricerca' };
let homeTab = 'testi';
function vHome() {
  const tabs = [['testi', 'Testi'], ['foto', 'Foto'], ['boutique', 'Boutique'], ['avvisi', 'Avvisi e servizi'], ['tour', 'Shopping Tour'], ['contatti', 'Contatti'], ['categorie', 'Categorie']];
  const r = keepScroll(vHome);
  let body = '';
  if (homeTab === 'testi') {
    const g = {}; Object.keys(C.testi).forEach(k => { const grp = k.split('.')[0]; (g[grp] ||= []).push(k); });
    body = Object.entries(g).map(([grp, keys]) => `<div class="panelx"><h2>${esc(GROUPS[grp] || grp)}</h2><p class="sub">Testo in italiano a sinistra, in inglese a destra. Nelle parti in <i>corsivo</i> puoi usare &lt;i&gt;…&lt;/i&gt;.</p>
      <div class="lang-h"><span></span><span>Italiano</span><span>English</span></div>
      ${keys.map(k => `<div class="trow"><span><b>${esc(k.split('.').slice(1).join('.'))}</b></span>${fArea(['testi', k, 'it'])}${fArea(['testi', k, 'en'])}</div>`).join('')}</div>`).join('');
  } else if (homeTab === 'foto') {
    body = `<div class="panelx"><h2>Foto dell’apertura</h2><p class="sub">Scorrono a tutto schermo nell’ordine qui sotto (← per spostare). Puoi sostituirle, toglierle o aggiungerne quante vuoi. Meglio foto orizzontali, con spazio a sinistra per il testo.</p>
        <div class="slots">${C.hero.foto.map((_, i) => fPhoto(['hero', 'foto', i], 'Foto ' + (i + 1), true, i > 0)).join('')}
        <button class="addph" data-addph="${P(['hero', 'foto'])}" style="aspect-ratio:auto;min-height:150px"><i>${icon('plus')}</i>Aggiungi foto</button></div></div>
      <div class="panelx"><h2>Polaroid intorno al logo</h2><p class="sub">Tre foto verticali.</p><div class="slots">${C.hero.polaroid.map((_, i) => fPhoto(['hero', 'polaroid', i], 'Polaroid ' + (i + 1))).join('')}</div></div>
      <div class="panelx"><h2>Scritta che gira intorno al logo</h2>${fTxt(['hero', 'anello'], 'Testo dell’anello')}</div>`;
  } else if (homeTab === 'boutique') {
    body = `<div class="panelx"><h2>Le boutique</h2><p class="sub">Appaiono nella sezione Boutique, nello Shopping Tour, nel ritiro in negozio e nella prenotazione.</p><div class="listed">
      ${C.boutique.map((s, i) => `<div class="litem"><div class="lh"><span>Boutique ${i + 1}</span><button class="rowact" data-rm="${P(['boutique', i])}" title="Togli">${icon('trash')}</button></div>
        <div class="g2">${fTxt(['boutique', i, 'nome'], 'Nome')}${fTxt(['boutique', i, 'indirizzo'], 'Indirizzo', 'Via …')}</div>
        <div class="g2">${fTxt(['boutique', i, 'citta'], 'CAP e città / metro')}${fTxt(['boutique', i, 'orari'], 'Orari', '10:00–13:00 · 15:30–19:00')}</div>
        <div class="g2"><label class="fld"><span>Descrizione</span>${fArea(['boutique', i, 'descr', 'it'])}</label><label class="fld"><span>In inglese</span>${fArea(['boutique', i, 'descr', 'en'])}</label></div>
        <div class="g2" style="align-items:end">${fPhoto(['boutique', i, 'foto'], 'Foto della boutique')}${fTog(['boutique', i, 'principale'], 'Negozio principale')}</div></div>`).join('')}
      <button class="btn ghost sm" data-add="${P(['boutique'])}" data-tpl="${esc(JSON.stringify({ nome: 'Nuova boutique', indirizzo: '', citta: '', orari: '', foto: '', descr: { it: '', en: '' } }))}">+ Aggiungi boutique</button></div></div>`;
  } else if (homeTab === 'avvisi') {
    body = `<div class="panelx"><h2>Avvisi che scorrono in alto</h2><p class="sub">{soglia} diventa la soglia della spedizione gratuita, {news} lo sconto newsletter.</p><div class="listed">
      ${C.annunci.map((a, i) => `<div class="g2" style="grid-template-columns:1fr 1fr 40px;align-items:center">${fTxt(['annunci', i, 'it'], 'Italiano')}${fTxt(['annunci', i, 'en'], 'English')}<button class="rowact" data-rm="${P(['annunci', i])}">${icon('trash')}</button></div>`).join('')}
      <button class="btn ghost sm" data-add="${P(['annunci'])}" data-tpl='{"it":"","en":""}'>+ Aggiungi avviso</button></div></div>
      <div class="panelx"><h2>Servizi (riquadri sotto la newsletter)</h2><div class="listed">
      ${C.servizi.map((s, i) => `<div class="litem"><div class="lh"><span>Servizio ${i + 1}</span><button class="rowact" data-rm="${P(['servizi', i])}">${icon('trash')}</button></div>
        ${fSel(['servizi', i, 'icona'], 'Icona', [['truck', 'Furgone'], ['store', 'Negozio'], ['return', 'Reso'], ['card', 'Carta'], ['heart', 'Cuore'], ['tag', 'Etichetta'], ['clock', 'Orologio']])}
        <div class="g2">${fTxt(['servizi', i, 'titolo', 'it'], 'Titolo')}${fTxt(['servizi', i, 'titolo', 'en'], 'Title')}</div><div class="g2">${fTxt(['servizi', i, 'testo', 'it'], 'Testo')}${fTxt(['servizi', i, 'testo', 'en'], 'Text')}</div></div>`).join('')}
      <button class="btn ghost sm" data-add="${P(['servizi'])}" data-tpl='{"icona":"heart","titolo":{"it":"","en":""},"testo":{"it":"","en":""}}'>+ Aggiungi servizio</button></div></div>`;
  } else if (homeTab === 'tour') {
    body = `<div class="panelx"><h2>Shopping Tour</h2><div class="slots" style="margin-bottom:14px">${fPhoto(['tour', 'foto'], 'Foto di sfondo')}</div>
      <h4 style="font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--champagne);margin:10px 0">Punti di partenza</h4><div class="listed">
      ${C.tour.partenze.map((p, i) => `<div class="g3" style="grid-template-columns:1fr 1fr 140px 40px;align-items:end">${fTxt(['tour', 'partenze', i, 'nome'], 'Nome completo')}${fTxt(['tour', 'partenze', i, 'breve'], 'Nome breve')}${fSel(['tour', 'partenze', i, 'icona'], 'Icona', [['plane', 'Aereo'], ['train', 'Treno'], ['car', 'Auto'], ['pin', 'Luogo']])}<button class="rowact" data-rm="${P(['tour', 'partenze', i])}">${icon('trash')}</button></div>`).join('')}
      <button class="btn ghost sm" data-add="${P(['tour', 'partenze'])}" data-tpl='{"nome":"","breve":"","icona":"pin"}'>+ Aggiungi partenza</button></div>
      <h4 style="font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--champagne);margin:18px 0 10px">Valori</h4><div class="listed">
      ${C.tour.valori.map((v, i) => `<div class="g2" style="grid-template-columns:1fr 1fr 40px;align-items:end">${fTxt(['tour', 'valori', i, 'it'], 'Italiano')}${fTxt(['tour', 'valori', i, 'en'], 'English')}<button class="rowact" data-rm="${P(['tour', 'valori', i])}">${icon('trash')}</button></div>`).join('')}
      <button class="btn ghost sm" data-add="${P(['tour', 'valori'])}" data-tpl='{"it":"","en":""}'>+ Aggiungi valore</button></div></div>`;
  } else if (homeTab === 'contatti') {
    body = `<div class="panelx"><h2>Contatti e dati del negozio</h2><p class="sub">I campi vuoti non compaiono sul sito (per esempio il pulsante WhatsApp appare solo quando c’è il numero).</p><div class="stack">
      <div class="g2">${fTxt(['contatti', 'email'], 'Email')}${fTxt(['contatti', 'telefono'], 'Telefono', '+39 06 …')}</div>
      <div class="g2">${fTxt(['contatti', 'whatsapp'], 'WhatsApp (solo numeri, con 39)', '39333…')}${fTxt(['contatti', 'instagram'], 'Instagram (nome profilo)', 'porter_apois')}</div>
      <div class="g2">${fTxt(['contatti', 'facebook'], 'Facebook (indirizzo pagina)', 'https://facebook.com/…')}${fTxt(['contatti', 'piva'], 'Partita IVA')}</div></div></div>`;
  } else if (homeTab === 'categorie') {
    body = `<div class="panelx"><h2>Nomi delle categorie</h2><div class="listed">${Object.keys(C.categorie).map(k => `<div class="g2">${fTxt(['categorie', k, 'it'], 'Italiano · ' + k)}${fTxt(['categorie', k, 'en'], 'English')}</div>`).join('')}</div></div>`;
  }
  $('#mact').innerHTML = `<a class="btn ghost sm" href="index.html" target="_blank" rel="noopener">Vedi il sito ↗</a>`;
  $('#view').innerHTML = `<div class="subtabs">${tabs.map(([k, l]) => `<button data-ht="${k}" class="${homeTab === k ? 'on' : ''}">${l}</button>`).join('')}</div>${body}${saveBar()}`;
  if (dirtyC) $('#savebar').classList.add('on');
  bindForm(r);
  $$('[data-ht]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); homeTab = b.dataset.ht; vHome(); }));
}

/* ================= OFFERTE ================= */
function vOff() {
  const r = keepScroll(vOff), o = C.offerte;
  $('#view').innerHTML = `
    <div class="panelx"><h2>Spedizione e newsletter</h2><div class="g4">${fNum(['offerte', 'costo_spedizione'], 'Costo spedizione €', .1)}${fNum(['offerte', 'spedizione_gratis_da'], 'Gratis da €')}${fNum(['offerte', 'newsletter_sconto'], 'Sconto newsletter %')}${fNum(['offerte', 'ribasso_massimo'], 'Ribasso massimo %')}</div>
      <p class="sub" style="margin-top:10px">Il ribasso massimo vale per i capi senza un prezzo minimo proprio: un capo da 50 € con massimo 30% non scende mai sotto 35 €.</p></div>
    <div class="panelx"><h2>Ribassi automatici</h2><p class="sub">Vale lo sconto più alto tra “giorni in vetrina” e “percentuale del modello venduta”.</p>
      <div class="tblwrap"><table class="tbl"><thead><tr><th>Dopo giorni</th><th>Oppure % venduto</th><th>Sconto %</th><th></th></tr></thead><tbody>
      ${o.ribassi.map((x, i) => `<tr><td><input type="number" min="0" data-num data-p="${P(['offerte', 'ribassi', i, 'giorni'])}" value="${x.giorni}"></td><td><input type="number" min="0" max="100" data-num data-p="${P(['offerte', 'ribassi', i, 'venduto'])}" value="${x.venduto}"></td><td><input type="number" min="0" max="90" data-num data-p="${P(['offerte', 'ribassi', i, 'sconto'])}" value="${x.sconto}"></td><td><button class="rowact" data-rm="${P(['offerte', 'ribassi', i])}">${icon('trash')}</button></td></tr>`).join('')}
      </tbody></table></div><button class="btn ghost sm" style="margin-top:10px" data-add="${P(['offerte', 'ribassi'])}" data-tpl='{"giorni":120,"venduto":90,"sconto":40}'>+ Aggiungi scalino</button></div>
    <div class="panelx"><h2>Codici sconto</h2><p class="sub">Le clienti li scrivono nel carrello.</p>
      <div class="tblwrap"><table class="tbl"><thead><tr><th>Codice</th><th>Tipo</th><th>Valore</th><th>Scadenza</th><th>Usi max</th><th>Attivo</th><th></th></tr></thead><tbody>
      ${o.codici.map((c, i) => `<tr><td><input data-p="${P(['offerte', 'codici', i, 'codice'])}" value="${esc(c.codice)}" style="text-transform:uppercase"></td>
        <td><select data-p="${P(['offerte', 'codici', i, 'tipo'])}"><option ${c.tipo === '%' ? 'selected' : ''}>%</option><option ${c.tipo === '€' ? 'selected' : ''}>€</option></select></td>
        <td><input type="number" min="0" data-num data-p="${P(['offerte', 'codici', i, 'valore'])}" value="${c.valore ?? ''}"></td>
        <td><input type="date" data-p="${P(['offerte', 'codici', i, 'scadenza'])}" value="${esc(c.scadenza || '')}"></td>
        <td><input type="number" min="0" data-num data-p="${P(['offerte', 'codici', i, 'usi'])}" value="${c.usi ?? ''}" placeholder="∞"></td>
        <td><label class="sw-row" style="padding:0;background:none;box-shadow:none"><input type="checkbox" data-bool data-p="${P(['offerte', 'codici', i, 'attivo'])}" ${c.attivo ? 'checked' : ''}><i></i></label></td>
        <td><button class="rowact" data-rm="${P(['offerte', 'codici', i])}">${icon('trash')}</button></td></tr>`).join('')}
      </tbody></table></div><button class="btn ghost sm" style="margin-top:10px" data-add="${P(['offerte', 'codici'])}" data-tpl='{"codice":"NUOVO","tipo":"%","valore":10,"scadenza":"","usi":null,"attivo":true}'>+ Aggiungi codice</button></div>
    ${saveBar()}`;
  if (dirtyC) $('#savebar').classList.add('on');
  bindForm(r);
}

/* ================= PAGAMENTI ================= */
function vPay() {
  $('#view').innerHTML = `
    <div class="tip">${icon('info')}<div><b>Stripe non è ancora collegato.</b> Quando il titolare apre il conto Stripe (con la partita IVA del negozio) inseriamo qui la chiave pubblicabile. La chiave <b>segreta</b> non va mai scritta qui: la mettiamo sul server.</div></div>
    <div class="panelx"><h2>Metodi di pagamento</h2><div class="stack">
      ${fTog(['pagamenti', 'carte'], 'Carte di credito e debito', 'Visa, Mastercard, American Express — sempre attive', true)}
      ${fTog(['pagamenti', 'wallet'], 'Apple Pay e Google Pay', 'Pagamento con un tocco dal telefono')}
      ${fTog(['pagamenti', 'paypal'], 'PayPal')}
      ${fTog(['pagamenti', 'klarna'], 'Klarna', 'Paga in 3 rate senza interessi')}
    </div></div>
    <div class="panelx"><h2>Ritiro in boutique</h2><div class="stack">
      ${fTog(['pagamenti', 'ritiro_paga'], 'Paga al ritiro', 'La cliente prenota online e paga in negozio')}
      <div class="g2 one">${fNum(['pagamenti', 'ritiro_ore'], 'Ore per passare a ritirare')}</div>
      ${fTog(['pagamenti', 'ritiro_prepagato'], 'Pagamento anticipato con carta', 'La cliente paga online e ritira')}
    </div></div>
    <div class="panelx"><h2>Stripe</h2><div class="g2">${fSel(['pagamenti', 'stripe_modo'], 'Modalità', [['prova', 'Prova (carte finte)'], ['live', 'Reale']])}${fTxt(['pagamenti', 'stripe_pk'], 'Chiave pubblicabile', 'pk_test_…')}</div></div>
    ${saveBar()}`;
  if (dirtyC) $('#savebar').classList.add('on');
  bindForm(keepScroll(vPay));
}

/* ================= NOTIFICHE ================= */
function vNot() {
  $('#view').innerHTML = `
    <div class="panelx"><h2>Come vuoi sapere che è arrivato un ordine?</h2><p class="sub">Puoi accenderle tutte insieme.</p><div class="stack">
      ${fTog(['notifiche', 'email', 'on'], 'Email', 'Un messaggio per ogni ordine e prenotazione del tour')}
      ${fTxt(['notifiche', 'email', 'indirizzo'], 'Indirizzo email')}
      ${fTog(['notifiche', 'telegram', 'on'], 'Telegram', 'Gratis e immediato sul telefono, tramite un bot')}
      ${fTxt(['notifiche', 'telegram', 'chat_id'], 'Codice chat Telegram', 'te lo diamo noi quando colleghiamo il bot')}
      ${fTog(['notifiche', 'whatsapp', 'on'], 'WhatsApp', 'Da configurare: serve la verifica dell’attività con Meta (una volta sola)', true)}
      ${fTxt(['notifiche', 'whatsapp', 'numero'], 'Numero WhatsApp del negozio', '39333…')}
    </div></div>
    <div class="tip">${icon('info')}<div>I codici segreti (token del bot Telegram, chiave WhatsApp) non vanno scritti qui: li mettiamo sul server quando colleghiamo il database.</div></div>
    ${saveBar()}`;
  if (dirtyC) $('#savebar').classList.add('on');
  bindForm(keepScroll(vNot));
}

/* ================= ORDINI ================= */
const OST = ['Nuovo', 'Pagato', 'Pronto al ritiro', 'Spedito', 'Consegnato', 'Annullato'];
async function vOrd() {
  const ords = await DB.getOrders();
  $('#mact').innerHTML = `<button class="btn ghost sm" id="demoOrd">Crea ordine di prova</button>`;
  $('#demoOrd').onclick = async () => {
    const names = ['Giulia R.', 'Martina S.', 'Francesca L.', 'Sofia B.', 'Chiara M.'], av = K.modelli.filter(m => avail(m).length);
    const pick = Array.from({ length: 1 + Math.floor(Math.random() * 3) }, () => av[Math.floor(Math.random() * av.length)]);
    const tot = pick.reduce((s, m) => s + nowOf(m), 0), ship = Math.random() < .5;
    ords.unshift({ n: 'PAP-' + String(1000 + ords.length + 1), data: new Date().toISOString(), cliente: names[ords.length % names.length], righe: pick.map(m => ({ id: m.id, nome: m.nome, prezzo: nowOf(m) })), totale: tot + (ship && tot < C.offerte.spedizione_gratis_da ? C.offerte.costo_spedizione : 0), consegna: ship ? 'Spedizione' : 'Ritiro · ' + C.boutique[0].nome, stato: 'Nuovo', prova: true });
    await DB.saveOrders(ords); vOrd();
  };
  $('#view').innerHTML = ords.length ? `<div class="mlist">${ords.map((o, i) => `<div class="ord"><span><b>${o.n}</b><small>${new Date(o.data).toLocaleDateString('it-IT')}${o.prova ? ' · prova' : ''}</small></span>
      <span><b>${esc(o.cliente)}</b><small>${o.righe.map(r => esc(r.nome)).join(', ')}</small></span><span><b>${euro(o.totale)}</b><small>${o.righe.length} capi</small></span>
      <span><small>${esc(o.consegna)}</small></span><select data-oi="${i}">${OST.map(s => `<option ${o.stato === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div>`).join('')}</div>`
    : `<div class="panelx"><div class="empty"><span class="script">Ancora nessun ordine</span>Gli ordini arriveranno qui quando colleghiamo il pagamento Stripe. Intanto puoi creare un ordine di prova per vedere come funziona.</div></div>`;
  $$('[data-oi]').forEach(s => s.onchange = async () => { ords[+s.dataset.oi].stato = s.value; await DB.saveOrders(ords); toast('Stato aggiornato: ' + s.value); });
}

/* ================= IMPOSTAZIONI ================= */
function vSet() {
  $('#view').innerHTML = `
    <div class="panelx"><h2>Password</h2><p class="sub">Nella versione online l’accesso sarà con email e password personali.</p>
      <form id="pwF" class="g3" style="align-items:end"><label class="fld"><span>Password attuale</span><input type="password" id="pw0" required autocomplete="current-password"></label>
      <label class="fld"><span>Nuova password</span><input type="password" id="pw1" required minlength="6" autocomplete="new-password"></label>
      <button class="btn sm"><span>Cambia</span>${bi('check')}</button></form></div>
    <div class="panelx"><h2>Copia di sicurezza</h2><p class="sub">Scarica tutti i testi, le impostazioni e il magazzino in un file (le foto restano nel browser).</p>
      <div class="sbtns" style="justify-content:flex-start"><button class="btn sm" id="bkDl"><span>Scarica la copia</span>${bi('download')}</button><button class="btn ghost sm" id="bkUp">Ripristina da file</button></div>
      <input type="file" id="bkF" accept=".json" hidden></div>
    <div class="panelx"><h2>Inizia da zero con i dati veri</h2><p class="sub">Per partire pulita: svuoti il magazzino di prova, poi importi l’inventario vero da Excel e scatti le foto vere. Testi, boutique e offerte della homepage restano.</p>
      <div class="stack">
        <label class="sw-row"><span><b>Foto campione</b><small>Se un capo non ha ancora la sua foto, il sito mostra una foto di esempio. Spenta: compare “Foto in arrivo”.</small></span><input type="checkbox" id="fc" ${C.foto_campione !== false ? 'checked' : ''}><i></i></label>
        <div class="kpis" style="margin:0"><div class="kpi"><small>Capi nel magazzino</small><b>${K.modelli.length}</b><span>${K.modelli.reduce((s, m) => s + m.varianti.length, 0)} pezzi · ${K.modelli.reduce((s, m) => s + (m.foto || []).length, 0)} foto</span></div></div>
        <div class="sbtns" style="justify-content:flex-start"><button class="btn rosa sm" id="wipe"><span>Svuota il magazzino</span>${bi('trash')}</button><button class="btn ghost sm" data-gov="imp">Poi importa l’Excel →</button></div>
      </div></div>
    <div class="panelx"><h2>Ricomincia da capo</h2><p class="sub">Cancella tutte le modifiche fatte in questo browser (foto comprese) e torna ai dati originali dell’anteprima.</p>
      <button class="btn ghost sm" id="rst" style="color:var(--rosa-2)">Azzera i dati di prova</button></div>`;
  $('#fc').onchange = async e => { C.foto_campione = e.target.checked; await DB.saveContenuti(C); toast(e.target.checked ? 'Foto campione accese' : 'Foto campione spente: dove manca la foto compare “Foto in arrivo”'); };
  $('[data-gov]').onclick = () => go('imp');
  $('#wipe').onclick = async () => {
    const n = K.modelli.length;
    if (!n) return toast('Il magazzino è già vuoto: importa l’inventario da Excel');
    if (!await ask('Svuotare il magazzino?', `Verranno cancellati ${n} capi con tutte le loro foto e gli ordini di prova. Il sito resterà senza capi finché non importi l’inventario o ne aggiungi di nuovi. Non si può annullare (puoi prima scaricare la copia di sicurezza).`, 'Svuota tutto')) return;
    for (const m of K.modelli) for (const f of m.foto || []) await DB.delPhoto(f);
    K.modelli = []; K.svuotato = today(); await DB.saveOrders([]);
    C.foto_campione = false; await DB.saveContenuti(C);
    await saveK('Magazzino svuotato: ora importa l’inventario vero'); vSet();
  };
  $('#pwF').onsubmit = async e => {
    e.preventDefault();
    if (await sha($('#pw0').value) !== lsGet(HKEY)) return toast('La password attuale non è corretta');
    if ($('#pw1').value.length < 6) return toast('Usa almeno 6 caratteri');
    lsSet(HKEY, await sha($('#pw1').value)); e.target.reset(); toast('Password cambiata');
  };
  $('#bkDl').onclick = () => {
    const blob = new Blob([JSON.stringify({ tipo: 'pret-a-pois-backup', data: new Date().toISOString(), contenuti: C, catalogo: K }, null, 1)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `backup-pret-a-pois-${today()}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
  $('#bkUp').onclick = () => $('#bkF').click();
  $('#bkF').onchange = async e => {
    try { const d = JSON.parse(await e.target.files[0].text()); if (d.tipo !== 'pret-a-pois-backup') throw 0;
      if (!await ask('Ripristinare la copia?', 'Testi, impostazioni e magazzino verranno sostituiti con quelli del file.', 'Ripristina')) return;
      C = d.contenuti; K = d.catalogo; defaults(); await DB.saveContenuti(C); await DB.saveCatalogo(K); toast('Copia ripristinata'); go('dash');
    } catch (_) { toast('Questo file non è una copia di sicurezza valida'); }
  };
  $('#rst').onclick = async () => {
    if (!await ask('Azzerare i dati di prova?', 'Tutte le modifiche e le foto caricate in questo browser verranno cancellate. Non si può annullare.', 'Azzera tutto')) return;
    await DB.reset(); const d = await DB.load(); C = d.contenuti; K = d.catalogo; defaults(); toast('Dati riportati all’originale'); go('dash');
  };
}

/* ---------------- avvio ---------------- */
async function boot() {
  $('#login').hidden = true; $('#app').hidden = false;
  try { const d = await DB.load(); C = d.contenuti; K = d.catalogo; defaults(); }
  catch (err) { console.error(err); toast('Errore nel caricamento dei dati'); return; }
  const v = location.hash.slice(1);
  go(VIEWS.some(x => x[0] === v) ? v : 'dash');
}
addEventListener('beforeunload', e => { if (dirtyC) { e.preventDefault(); e.returnValue = ''; } });
addEventListener('keydown', e => { if (e.key === 'Escape' && E) closeEditor(); });
let ok = false; try { ok = sessionStorage.getItem('pap-admin-ok') === '1'; } catch (_) {}
ok && lsGet(HKEY) ? boot() : showLogin();
})();
