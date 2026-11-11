/* Prêt à Porter à Pois — parti comuni a tutte le pagine:
   intestazione, menu, ricerca, borsa, preferiti, lingua, cookie, piè di pagina.
   Testi/foto/offerte da data/contenuti.json (admin), capi da data/catalogo.json (poi: database). */
window.PAP = (() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = () => innerWidth <= 900;
const euro = n => n.toLocaleString('it-IT', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }) + ' €';
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (_) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} }
};
const IS_HOME = !!document.body.dataset.home;
const SECTIONS = ['novita', 'collezione', 'ribassi', 'tour', 'boutique'];

/* ---------------- icone ---------------- */
const ICONS = {
  menu: '<path d="M4 8h16M4 16h11"/>', search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>',
  heart: '<path d="M12 20s-7-4.4-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.6-9 9-9 9z"/>', user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
  bag: '<path d="M5 8h14l-1 12H6z"/><path d="M9 8a3 3 0 0 1 6 0"/>', arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>', left: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  down: '<path d="M6 9l6 6 6-6"/>', check: '<path d="M5 12l5 5 9-10"/>', filter: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
  spark: '<path d="M12 3l1.8 4.6L18.5 9.4l-4.7 1.8L12 16l-1.8-4.8L5.5 9.4l4.7-1.8z"/><path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>',
  hanger: '<path d="M12 7a2 2 0 1 1 2-2"/><path d="M12 7v2L3 16h18l-9-7"/>', tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="7.5" r="1.3"/>',
  car: '<path d="M4 16v-4l2.2-5h11.6L20 12v4z"/><path d="M4 12h16M6.5 16v2.5M17.5 16v2.5"/>',
  pin: '<path d="M12 21s-7-7.5-7-12a7 7 0 0 1 14 0c0 4.5-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
  plane: '<path d="M2 16l20-6-2-3-7 2-5-6H6l2 7-4 1-2-2H1z"/>', train: '<rect x="5" y="3" width="14" height="14" rx="3"/><path d="M5 11h14M8 21l2-4M16 21l-2-4"/>',
  truck: '<path d="M2 7h12v10H2zM14 11h4l3 3v3h-7"/><circle cx="6" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>', store: '<path d="M4 9l1.5-5h13L20 9"/><path d="M4 9h16v11H4z"/><path d="M10 20v-6h4v6"/>',
  return: '<path d="M4 12a8 8 0 1 0 2.5-5.8"/><path d="M4 4v5h5"/>', card: '<rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 10h18M7 15h4"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>', ruler: '<path d="M3 15 15 3l6 6L9 21z"/><path d="M7 11l2 2M10 8l2 2M13 5l2 2"/>',
  chat: '<path d="M4 18.5V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H8z"/>', share: '<circle cx="6" cy="12" r="2.5"/><circle cx="17" cy="6" r="2.5"/><circle cx="17" cy="18" r="2.5"/><path d="M8.3 10.8 14.7 7.2M8.3 13.2l6.4 3.6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
  sweater: '<path d="M9 4 4 6.5l1.5 5 2-.8V20h9v-9.3l2 .8 1.5-5L15 4a3 3 0 0 1-6 0z"/>', shirt: '<path d="M9 4 4 6.5l1.5 5 2-.8V20h9v-9.3l2 .8 1.5-5L15 4l-3 3z"/><path d="M12 7v13"/>',
  jeans: '<path d="M7 3h10l1 18h-4.5L12 10l-1.5 11H6z"/><path d="M7 6h10M9 6q.5 2 2.5 1.5"/>', pants: '<path d="M7 3h10l1 18h-4.5L12 10l-1.5 11H6z"/><path d="M7 6h10"/>',
  blazer: '<path d="M9 4 4 6.5l1.5 5 2-.8V20h9v-9.3l2 .8 1.5-5L15 4"/><path d="M9 4l3 7 3-7M12 11v9"/>', coat: '<path d="M9 3 4 5.5 5.5 12l2-1V21h9V11l2 1L20 5.5 15 3"/><path d="M9 3l3 4 3-4M12 7v14"/>',
  hoodie: '<path d="M9 5 4 7.5l1.5 5 2-.8V20h9v-8.3l2 .8 1.5-5L15 5"/><path d="M9 5a3 3 0 0 1 6 0c0 2-1.5 3-3 3S9 7 9 5z"/>', set: '<path d="M9 3 5 5l1 3 2-.8V12h8V7.2l2 .8 1-3-4-2a3 3 0 0 1-6 0z"/><path d="M8 14h8l1 7h-3l-2-4-2 4H7z"/>',
  dress: '<path d="M9.5 3h5l-1 5 5 13H5.5l5-13z"/><path d="M9.5 8h5"/>', handbag: '<path d="M5 9h14l1 12H4z"/><path d="M9 9V7a3 3 0 0 1 6 0v2"/>'
};
const icon = (n, c = 'ico') => `<svg class="${c}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`;
function paintIcons(root = document) { $$('svg[data-ico]', root).forEach(s => { s.setAttribute('viewBox', '0 0 24 24'); s.innerHTML = ICONS[s.dataset.ico] || ''; }); }

/* ---------------- contenuti e lingua ---------------- */
const P = { C: null, MODELS: [], lang: store.get('pap-lang', 'it') };
const T = (k, fb = '') => { const v = P.C?.testi?.[k]; return v ? (v[P.lang] ?? v.it) : fb; };
const L = o => o ? (typeof o === 'string' ? o : (o[P.lang] ?? o.it ?? '')) : '';
const en = () => P.lang === 'en';
const tr = (it, e) => en() ? e : it;
const fill = s => String(s).replace('{soglia}', P.C.offerte.spedizione_gratis_da).replace('{news}', P.C.offerte.newsletter_sconto);
const img = (src, w = 640) => !src ? '' : src.startsWith('unsplash:') ? FOTO.U(src.slice(9), w) : src.startsWith('idb:') ? DB.url(src) : src;
const catName = k => k === 'tutto' ? tr('Tutto', 'All') : L(P.C.categorie[k]) || k;
const homeLink = s => IS_HOME ? '#' + s : 'index.html#' + s;
const renderers = [];
function applyTexts(root = document) {
  $$('[data-k]', root).forEach(el => { const v = T(el.dataset.k, null); if (v != null) el.textContent = v; });
  $$('[data-k-html]', root).forEach(el => { const v = T(el.dataset.kHtml, null); if (v != null) el.innerHTML = v; });
  $$('[data-k-ph]', root).forEach(el => { const v = T(el.dataset.kPh, null); if (v != null) el.placeholder = v; });
  document.documentElement.lang = P.lang;
  $$('#lang b').forEach((b, i) => b.classList.toggle('on', (i === 0) === !en()));
}
function renderAll() { applyTexts(); buildAnn(); renderMenu(); renderFooter(); renderCart(); renderers.forEach(f => f()); }

/* ---------------- capi ---------------- */
const hash = s => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
const SIZES = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL'];
function decorate(m) {
  const h = hash(m.id);
  m.h = h;
  m.tutte = m.varianti;
  m.varianti = m.varianti.filter(v => (v.stato || 'disponibile') === 'disponibile');   // sul sito solo i pezzi disponibili
  if (m.sconto_manuale != null && m.sconto_manuale !== '') m.off = +m.sconto_manuale;  // sconto deciso dall'admin
  else if (m.ribasso_auto === false) m.off = 0;
  else m.off = [0, 0, 0, 10, 20, 0, 30, 0, 10][h % 9];       // ribassi DI ESEMPIO finché non c'è lo storico vendite
  m.days = 8 + h % 80;                                        // giorni in vetrina DI ESEMPIO
  m.isNew = m.caricato >= '2026-02-19';
  m.colors = []; const seen = new Map();
  m.varianti.forEach(v => { const k = v.colore || '—'; if (!seen.has(k)) { seen.set(k, { ...v, taglie: [], pezzi: 0 }); m.colors.push(seen.get(k)); } const c = seen.get(k); c.pezzi++; if (v.taglia && !c.taglie.includes(v.taglia)) c.taglie.push(v.taglia); });
  m.colors.forEach(c => c.taglie.sort((a, b) => SIZES.indexOf(a) - SIZES.indexOf(b)));
  m.sel = 0;
  return m;
}
const minPrice = m => m.prezzo_min != null ? m.prezzo_min : Math.round(m.prezzo * (1 - (P.C?.offerte?.ribasso_massimo ?? 30) / 100));
const priceNow = m => m.off ? Math.max(minPrice(m), Math.round(m.prezzo * (1 - m.off / 100))) : m.prezzo;
const photo = (m, k = 0, w = 640) => m.foto?.length ? img(m.foto[k % m.foto.length], w) : P.C?.foto_campione === false ? 'img/foto-in-arrivo.svg' : FOTO.pick(m.categoria, m.h + k, w);   // foto vera; se manca: campione o "foto in arrivo"
const byId = id => P.MODELS.find(m => m.id === id);
const prodUrl = m => `prodotto.html?id=${encodeURIComponent(m.id)}`;
const swHex = v => v.hex ? (v.hex.length > 1 ? `linear-gradient(135deg,${v.hex.join(',')})` : v.hex[0]) : '#ddd';

function cardHTML(m) {
  const badge = m.off ? `<span class="badge">−${m.off}%</span>` : (m.isNew ? `<span class="badge new">${tr('Nuovo', 'New')}</span>` : '');
  return `<article class="card" data-id="${esc(m.id)}">
    <div class="ph"><a class="lnk" href="${prodUrl(m)}" aria-label="${esc(m.nome)}"><img src="${photo(m, 0, 560)}" alt="${esc(m.nome)}" loading="lazy"><img class="b" src="${photo(m, 1, 560)}" alt="" loading="lazy"></a>${badge}
      <button class="fav ${favs.has(m.id) ? 'on' : ''}" aria-label="${tr('Preferiti', 'Favourites')}">${icon('heart')}</button>
      <button class="add" aria-label="${tr('Aggiungi alla borsa', 'Add to bag')}">${icon('bag')}</button></div>
    <div class="info"><a href="${prodUrl(m)}"><h4>${esc(m.nome)}</h4></a>
      <div class="meta"><div class="price">${m.off ? `<span class="now">${euro(priceNow(m))}</span><s>${euro(m.prezzo)}</s>` : `<span>${euro(m.prezzo)}</span>`}</div>
      <div class="sw">${m.colors.slice(0, 5).map((v, j) => `<button class="${j === m.sel ? 'on' : ''}" data-j="${j}" title="${esc(v.colore || '')}" aria-label="${esc(v.colore || 'colore')}" style="background:${swHex(v)}"></button>`).join('')}</div></div>
    </div></article>`;
}
function bindCards(r, opts = {}) {
  if (opts.drag) {
    let down = false, sx = 0, sl = 0, moved = false;
    r.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = r.scrollLeft; });
    addEventListener('pointermove', e => { if (!down) return; const dx = e.clientX - sx; if (Math.abs(dx) > 5) { moved = true; r.classList.add('drag'); } r.scrollLeft = sl - dx; });
    addEventListener('pointerup', () => { down = false; r.classList.remove('drag'); });
    r.addEventListener('click', e => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
    r.addEventListener('dragstart', e => e.preventDefault());
  }
  r.addEventListener('click', e => {
    const card = e.target.closest('.card'); if (!card) return;
    const m = byId(card.dataset.id);
    const sw = e.target.closest('.sw button'); if (sw) { e.preventDefault(); m.sel = +sw.dataset.j; $$(`.card[data-id="${CSS.escape(m.id)}"]`).forEach(c => c.outerHTML = cardHTML(m)); return; }
    if (e.target.closest('.fav')) { e.preventDefault(); toggleFav(m); return; }
    if (e.target.closest('.add')) { e.preventDefault(); const c = m.colors[m.sel]; if (c.taglie.length > 1) { location.href = prodUrl(m); return; } addToCart(m, { colore: c.colore, taglia: c.taglie[0] || null }, e.target.closest('.add')); }
  });
}

/* ---------------- struttura comune (inserita in ogni pagina) ---------------- */
function shell() {
  const top = document.getElementById('shell-top'), bottom = document.getElementById('shell-bottom');
  if (top) top.outerHTML = `
  <div id="fx" aria-hidden="true"><div class="aurora"></div><canvas id="bokeh"></canvas><div id="sketches"></div><div class="vign"></div><div class="grain"></div></div>
  <div id="loader" aria-hidden="true"><img class="logo" src="img/logo.png" alt=""></div>
  <div class="annunci" aria-label="Avvisi"><div class="track" id="annTrack"></div></div>
  <header class="top ${IS_HOME ? '' : 'solid'}" id="top"><div class="wrap nav">
    <div class="left">
      <button class="tbtn" id="openMenu">${icon('menu')}<span data-k="ui.menu">Menu</span></button>
      <button class="tbtn" id="openSearch">${icon('search')}<span data-k="ui.search">Cerca</span></button>
    </div>
    <a href="index.html" class="brand" aria-label="Prêt à Porter à Pois, home"><img src="img/logo.png" alt=""><b>Prêt à Porter à Pois</b></a>
    <div class="right">
      <button class="lang" id="lang" aria-label="Lingua / Language"><b class="on">IT</b><b>EN</b></button>
      <button class="ic" id="favBtn" aria-label="Preferiti">${icon('heart')}<span class="n" id="favN">0</span></button>
      <button class="ic" id="accBtn" aria-label="Account">${icon('user')}</button>
      <button class="ic" id="cartBtn" aria-label="Borsa">${icon('bag')}<span class="n" id="cartN">0</span></button>
    </div></div></header>`;
  if (bottom) bottom.outerHTML = `
  <footer><div class="wrap">
    <div class="grid">
      <div><img class="logo-f" src="img/logo.png" alt="Prêt à Porter à Pois"><p style="max-width:280px" data-k="ft.p"></p>
        <div class="pay"><span>VISA</span><span>MASTERCARD</span><span>PAYPAL</span><span>APPLE PAY</span><span>G PAY</span><span>KLARNA</span></div></div>
      <div><h5 data-k="ft.shop">Shop</h5><ul><li><a href="catalogo.html" data-k="sec.collezione"></a></li><li><a href="catalogo.html?ord=ribasso" data-k="sec.ribassi"></a></li><li><a href="${homeLink('tour')}">Shopping Tour</a></li><li><a href="${homeLink('boutique')}" data-k="sec.boutique"></a></li></ul></div>
      <div><h5 data-k="ft.help">Aiuto</h5><ul><li><a href="#" data-k="ft.ship"></a></li><li><a href="#" data-k="ft.ret"></a></li><li><a href="#" data-k="ft.terms"></a></li><li><a href="#">Privacy &amp; cookie</a></li><li><a href="#" id="ckReopen">${tr('Preferenze cookie', 'Cookie settings')}</a></li></ul></div>
      <div><h5 data-k="ft.contact">Contatti</h5><ul id="contacts"></ul></div>
    </div>
    <div class="dots-row" aria-hidden="true" id="footDots"></div>
    <div class="legal"><span>© <span id="yr"></span> Prêt à Porter à Pois · <span id="piva"></span></span><span>Roma · Frascati</span></div>
  </div></footer>
  <div class="menu" id="menu" role="dialog" aria-label="Menu"><button class="tbtn mclose" id="closeMenu">${icon('x')}<span data-k="ui.close">Chiudi</span></button><nav id="menuNav"></nav><div class="mimg" id="menuImg"></div></div>
  <div class="scrim" id="scrim"></div>
  <aside class="drawer" id="drawer" aria-label="Borsa">
    <header><b data-k="cart.t">La tua borsa</b><button class="ic" id="closeCart" aria-label="Chiudi">${icon('x')}</button></header>
    <div class="items" id="cartItems"></div>
    <div class="foot"><div class="ship" id="ship"></div><div class="tot"><span data-k="cart.tot">Totale</span><span id="cartTot">0 €</span></div>
      <button class="btn rosa" id="checkout"><span data-k="cart.go">Vai al pagamento</span><span class="bi">${icon('arrow')}</span></button></div>
  </aside>
  <div class="search" id="search" role="dialog" aria-label="Cerca"><div class="bar">${icon('search')}<input id="q" data-k-ph="ui.searchph" autocomplete="off"><button class="ic" id="closeSearch" aria-label="Chiudi">${icon('x')}</button></div><div class="res" id="res"></div></div>
  <div class="cookie" id="cookie" role="dialog" aria-labelledby="ckT" hidden><div class="ck-in">
    <img class="ck-logo" src="img/logo.png" alt="">
    <div class="ck-body"><b id="ckT" data-k="ck.t"></b><p data-k="ck.p"></p>
      <div class="ck-prefs" id="ckPrefs" hidden>
        <label class="sw-row"><span><b data-k="ck.nec"></b><small data-k="ck.necs"></small></span><input type="checkbox" checked disabled><i></i></label>
        <label class="sw-row"><span><b data-k="ck.sta"></b><small data-k="ck.stas"></small></span><input type="checkbox" id="ckSta"><i></i></label>
        <label class="sw-row"><span><b data-k="ck.mkt"></b><small data-k="ck.mkts"></small></span><input type="checkbox" id="ckMkt"><i></i></label>
      </div></div>
    <div class="ck-act"><button class="btn rosa sm" id="ckAll"><span data-k="ck.all"></span><span class="bi">${icon('heart')}</span></button><button class="btn ghost sm" id="ckNec" data-k="ck.only"></button><button class="ck-link" id="ckMore" data-k="ck.more"></button></div>
  </div></div>
  <div class="toast" id="toast"></div>`;
}

/* ---------------- avvisi, header, menu ---------------- */
function buildAnn() { const a = P.C.annunci.map(x => `<span>${esc(fill(L(x)))}</span>`).join(''); $('#annTrack').innerHTML = a + a + a; }
const MENU_FOTO = { novita: 'unsplash:1580331451062-99ff652288d7', collezione: 'unsplash:1769107805412-90d9191d53e9', ribassi: 'unsplash:1590873802674-55bb8f947bc5', tour: 'unsplash:1761733133824-ab5b1d81e493', boutique: 'unsplash:1769107805511-0bb7075fca27' };
function renderMenu() {
  const link = s => s === 'collezione' ? 'catalogo.html' : homeLink(s);
  $('#menuNav').innerHTML = SECTIONS.map((s, i) => `<a class="msec" href="${link(s)}" data-img="${s}" style="transition-delay:${80 + i * 60}ms"><small>0${i + 1}</small>${esc(T('sec.' + s))}${s === 'tour' ? ' Shopping' : ''}</a>`).join('')
    + `<div class="mcats">${Object.keys(P.C.categorie).map(k => `<a class="chip" href="catalogo.html?cat=${k}">${icon(P.C.categorie[k].icona)}${esc(catName(k))}</a>`).join('')}</div>`;
  $('#menuImg').innerHTML = SECTIONS.map(s => `<img src="${img(MENU_FOTO[s], 1200)}" data-for="${s}" alt="" loading="lazy">`).join('');
  $('#menuImg img').classList.add('on');
  $$('#menuNav .msec').forEach(a => a.onmouseenter = () => $$('#menuImg img').forEach(im => im.classList.toggle('on', im.dataset.for === a.dataset.img)));
}
const closeMenu = () => $('#menu').classList.remove('on');

/* ---------------- preferiti e borsa (restano salvati tra le pagine) ---------------- */
const favs = new Set(store.get('pap-fav', []));
let cart = store.get('pap-cart', []);           // [{id, colore, taglia}]
const saveCart = () => store.set('pap-cart', cart);
function bump(el, n) { el.textContent = n; el.classList.toggle('show', n > 0); el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
function toggleFav(m) {
  const on = !favs.has(m.id); on ? favs.add(m.id) : favs.delete(m.id); store.set('pap-fav', [...favs]);
  $$(`[data-id="${CSS.escape(m.id)}"] .fav, .fav[data-fid="${CSS.escape(m.id)}"]`).forEach(b => b.classList.toggle('on', on));
  if (on) toast(tr('Salvato. Ti avvisiamo se scende di prezzo.', "Saved. We'll tell you if the price drops."));
  bump($('#favN'), favs.size);
}
function fly(from, done) {
  const to = $('#cartBtn');
  if (reduce || !from) return done();
  const a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
  const d = document.createElement('div'); d.className = 'fly'; document.body.appendChild(d);
  const x0 = a.left + a.width / 2 - 7, y0 = a.top + a.height / 2 - 7, x1 = b.left + b.width / 2 - 7, y1 = b.top + b.height / 2 - 7;
  d.animate([{ transform: `translate(${x0}px,${y0}px)` }, { transform: `translate(${(x0 + x1) / 2}px,${Math.min(y0, y1) - 110}px) scale(1.5)`, offset: .45 }, { transform: `translate(${x1}px,${y1}px) scale(.4)` }], { duration: 750, easing: 'cubic-bezier(.5,0,.4,1)' }).onfinish = () => { d.remove(); done(); };
}
function addToCart(m, opt, btn) {
  fly(btn, () => { cart.push({ id: m.id, colore: opt.colore || null, taglia: opt.taglia || null }); saveCart(); bump($('#cartN'), cart.length); renderCart(); toast(tr('Aggiunto alla borsa', 'Added to your bag')); });
}
function renderCart() {
  const FREE = P.C.offerte.spedizione_gratis_da;
  const rows = cart.map(x => ({ ...x, m: byId(x.id) })).filter(x => x.m);
  $('#cartItems').innerHTML = rows.length ? rows.map((x, i) => `<div class="it"><a href="${prodUrl(x.m)}"><img src="${photo(x.m, 0, 160)}" alt=""></a><div><h6>${esc(x.m.nome)}</h6><small>${esc([x.colore, x.taglia && tr('Taglia ', 'Size ') + x.taglia].filter(Boolean).join(' · '))}</small><br><button data-rm="${i}">${tr('Rimuovi', 'Remove')}</button></div><b>${euro(priceNow(x.m))}</b></div>`).join('')
    : `<div class="empty"><span class="script">${tr('Ancora vuota', 'Empty, for now')}</span>${tr('Dai un’occhiata alle novità.', 'Have a look at what’s new.')}</div>`;
  const tot = rows.reduce((s, x) => s + priceNow(x.m), 0), miss = FREE - tot;
  $('#cartTot').textContent = euro(tot);
  $('#ship').innerHTML = (miss > 0 ? tr(`Ti mancano <b>${euro(miss)}</b> per la spedizione gratuita`, `<b>${euro(miss)}</b> away from free shipping`) : tr('<b>Spedizione gratuita</b>', '<b>Free shipping</b>')) + `<div class="bar"><i style="width:${Math.min(100, tot / FREE * 100)}%"></i></div>`;
  $('#cartN').textContent = cart.length; $('#cartN').classList.toggle('show', cart.length > 0);
  $('#favN').textContent = favs.size; $('#favN').classList.toggle('show', favs.size > 0);
}
const openCart = on => { $('#drawer').classList.toggle('on', on); $('#scrim').classList.toggle('on', on); };

/* ---------------- ricerca ---------------- */
const openSearch = on => { $('#search').classList.toggle('on', on); if (on) { setTimeout(() => $('#q').focus(), 50); searchRun(); } };
function searchRun() {
  const q = $('#q').value.trim().toLowerCase();
  if (q.length < 2) { $('#res').innerHTML = `<div class="hint">${tr('Prova: jeans, rosa, cashmerina, piumino…', 'Try: jeans, rosa, cashmerina, piumino…')}</div>`; return; }
  const words = q.split(/\s+/);
  const hits = P.MODELS.filter(m => { const s = (m.nome + ' ' + m.colors.map(c => c.colore).join(' ') + ' ' + catName(m.categoria)).toLowerCase(); return words.every(w => s.includes(w)); });
  const re = new RegExp(`(${words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  const mark = s => esc(s).replace(re, '<mark>$1</mark>');
  $('#res').innerHTML = hits.length ? hits.slice(0, 8).map(m => `<a href="${prodUrl(m)}"><img src="${photo(m, 0, 120)}" alt=""><span>${mark(m.nome)}<br><small style="color:var(--muted)">${mark(m.colors.map(c => c.colore).filter(Boolean).join(', '))}</small></span><b>${euro(priceNow(m))}</b></a>`).join('')
      + (hits.length > 8 ? `<a class="all" href="catalogo.html?q=${encodeURIComponent(q)}"><span>${tr('Vedi tutti i', 'See all')} ${hits.length} ${tr('risultati', 'results')}</span>${icon('arrow')}</a>` : '')
    : `<div class="hint">${tr('Nessun risultato. Ogni settimana arrivano capi nuovi.', 'Nothing found. New pieces arrive every week.')}</div>`;
}

/* ---------------- piè di pagina ---------------- */
function renderFooter() {
  const c = P.C.contatti;
  $('#contacts').innerHTML = [
    c.email && `<li><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></li>`,
    c.instagram && `<li><a href="https://www.instagram.com/${esc(c.instagram)}/" target="_blank" rel="noopener">Instagram · @${esc(c.instagram)}</a></li>`,
    c.facebook && `<li><a href="${esc(c.facebook)}" target="_blank" rel="noopener">Facebook</a></li>`,
    c.whatsapp && `<li><a href="https://wa.me/${esc(c.whatsapp)}" target="_blank" rel="noopener">WhatsApp</a></li>`,
    c.telefono && `<li><a href="tel:${esc(c.telefono)}">${esc(c.telefono)}</a></li>`,
    P.C.boutique[0] && `<li>${esc(P.C.boutique[0].indirizzo)}, Roma</li>`
  ].filter(Boolean).join('');
  $('#piva').textContent = c.piva ? 'P. IVA ' + c.piva : tr('P. IVA in arrivo', 'VAT no. coming soon');
  // un pois ogni quattro è rosa: il terzo pois rosa (il dodicesimo della fila) apre l'area riservata
  const n = 26, secret = 11;
  $('#footDots').innerHTML = Array.from({ length: n }, (_, i) => i === secret ? '<a href="admin.html" aria-label="." tabindex="-1" rel="nofollow"></a>' : `<i${i % 4 === 3 ? ' class="r"' : ''}></i>`).join('');
  $('#yr').textContent = new Date().getFullYear();
}

/* ---------------- cookie ---------------- */
const CK = 'pap-cookie-v1';
function cookieOpen(force) {
  if (!force && store.get(CK, null)) return;
  const box = $('#cookie'); box.hidden = false;
  setTimeout(() => box.classList.add('on'), force || reduce ? 30 : 1800);
}
function cookieBind() {
  const box = $('#cookie');
  const save = (sta, mkt) => {
    store.set(CK, { necessari: true, statistiche: sta, marketing: mkt, data: new Date().toISOString() });
    box.classList.remove('on'); setTimeout(() => box.hidden = true, 700);
    toast(tr('Preferenze salvate', 'Preferences saved'));
  };
  $('#ckAll').onclick = () => save(true, true);
  $('#ckNec').onclick = () => $('#ckPrefs').hidden ? save(false, false) : save($('#ckSta').checked, $('#ckMkt').checked);
  $('#ckMore').onclick = () => { const p = $('#ckPrefs'); p.hidden = !p.hidden; $('#ckNec').textContent = p.hidden ? T('ck.only') : T('ck.save'); };
  $('#ckReopen').onclick = e => { e.preventDefault(); const s = store.get(CK, {}); $('#ckSta').checked = !!s.statistiche; $('#ckMkt').checked = !!s.marketing; $('#ckPrefs').hidden = false; $('#ckNec').textContent = T('ck.save'); cookieOpen(true); };
}

/* ---------------- toast ---------------- */
let tt; function toast(m) { const el = $('#toast'); el.textContent = m; el.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => el.classList.remove('on'), 3200); }

/* ---------------- collegamenti ---------------- */
function bind() {
  const head = $('#top');
  addEventListener('scroll', () => head.classList.toggle('scrolled', scrollY > 20), { passive: true });
  $('#lang').onclick = () => { P.lang = en() ? 'it' : 'en'; store.set('pap-lang', P.lang); renderAll(); };
  $('#openMenu').onclick = () => $('#menu').classList.add('on');
  $('#closeMenu').onclick = closeMenu;
  $('#menu').addEventListener('click', e => { if (e.target.closest('a')) setTimeout(closeMenu, 50); });
  $('#cartBtn').onclick = () => openCart(true);
  $('#closeCart').onclick = $('#scrim').onclick = () => openCart(false);
  $('#cartItems').addEventListener('click', e => { const b = e.target.closest('[data-rm]'); if (!b) return; cart.splice(+b.dataset.rm, 1); saveCart(); bump($('#cartN'), cart.length); renderCart(); });
  $('#checkout').onclick = () => toast(tr('Anteprima: il pagamento Stripe arriva nella versione completa', 'Preview: Stripe checkout comes in the full version'));
  $('#favBtn').onclick = () => favs.size ? (location.href = 'catalogo.html?pref=1') : toast(tr('Tocca il cuore su un capo per salvarlo', 'Tap the heart on a piece to save it'));
  $('#accBtn').onclick = () => toast(tr('Anteprima: l’area cliente arriva nella versione completa', 'Preview: the customer area comes in the full version'));
  $('#openSearch').onclick = () => openSearch(true);
  $('#closeSearch').onclick = () => openSearch(false);
  $('#q').addEventListener('input', searchRun);
  $('#q').addEventListener('keydown', e => { if (e.key === 'Enter' && $('#q').value.trim()) location.href = 'catalogo.html?q=' + encodeURIComponent($('#q').value.trim()); });
  addEventListener('keydown', e => { if (e.key === 'Escape') { openSearch(false); openCart(false); closeMenu(); } });
  cookieBind();
}

/* ---------------- avvio ---------------- */
// la struttura comune si crea subito, così gli altri script (sfondo animato, pagina) la trovano già pronta
shell(); paintIcons(); bind();
function start(pageInit) {
  DB.load().then(({ contenuti, catalogo }) => {
    P.C = contenuti; P.MODELS = catalogo.modelli.filter(m => m.prezzo && m.online !== false).map(decorate).filter(m => m.varianti.length);
    renderAll();
    pageInit && pageInit();
    applyTexts();
    cookieOpen();
  }).catch(err => { console.error(err); toast('Errore nel caricamento dei contenuti'); })
    .finally(() => {
      setTimeout(() => { $('#loader')?.classList.add('out'); document.body.classList.add('ready'); }, reduce ? 0 : (IS_HOME ? 700 : 250));
      setTimeout(() => $('#loader')?.remove(), 2000);
    });
}

return {
  $, $$, reduce, mobile, euro, esc, store, icon, paintIcons, T, L, tr, en, fill, img, catName, P,
  priceNow, minPrice, photo, byId, prodUrl, swHex, cardHTML, bindCards, addToCart, toggleFav, favs, openCart, toast, applyTexts,
  onRender: f => renderers.push(f), start, SIZES
};
})();
