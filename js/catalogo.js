/* Prêt à Porter à Pois — catalogo completo con filtri, ordinamento e "carica altri". */
(() => {
'use strict';
const { $, $$, esc, icon, tr, catName, P, priceNow, cardHTML, bindCards, favs, SIZES, img } = PAP;
const PAGE = 24;
const PRICES = [[0, 30], [30, 50], [50, 80], [80, 9999]];
const u = new URLSearchParams(location.search);
const F = {
  cat: u.get('cat') || 'tutto', q: u.get('q') || '', ord: u.get('ord') || 'novita', pref: u.get('pref') === '1',
  cols: new Set((u.get('col') || '').split(',').filter(Boolean)), sizes: new Set((u.get('tg') || '').split(',').filter(Boolean)),
  price: u.get('pr') ? +u.get('pr') : null, sale: u.get('sale') === '1', nuovo: u.get('new') === '1'
};
let shown = PAGE, draft = null;

/* ---------- colori disponibili (nome → tinta) ---------- */
function colorMap() {
  const map = new Map();
  P.MODELS.forEach(m => m.colors.forEach(c => (c.colore || '').split(' / ').forEach((n, i) => { if (!n) return; const e = map.get(n) || { hex: c.hex?.[i] || '#ccc', n: 0 }; e.n++; map.set(n, e); })));
  return [...map.entries()].sort((a, b) => b[1].n - a[1].n);
}
const colorsOf = m => new Set(m.colors.flatMap(c => (c.colore || '').split(' / ').filter(Boolean)));
const sizesOf = m => new Set(m.colors.flatMap(c => c.taglie));

/* ---------- filtro e ordinamento ---------- */
function match(m, f, skipCat) {
  if (!skipCat && f.cat !== 'tutto' && m.categoria !== f.cat) return false;
  if (f.pref && !favs.has(m.id)) return false;
  if (f.q) { const s = (m.nome + ' ' + m.colors.map(c => c.colore).join(' ') + ' ' + catName(m.categoria)).toLowerCase(); if (!f.q.toLowerCase().split(/\s+/).every(w => s.includes(w))) return false; }
  if (f.cols.size) { const c = colorsOf(m); if (![...f.cols].some(x => c.has(x))) return false; }
  if (f.sizes.size) { const s = sizesOf(m); if (![...f.sizes].some(x => s.has(x))) return false; }
  if (f.price != null) { const [a, b] = PRICES[f.price], p = priceNow(m); if (p < a || p >= b) return false; }
  if (f.sale && !m.off) return false;
  if (f.nuovo && !m.isNew) return false;
  return true;
}
const SORTS = {
  novita: (a, b) => (b.caricato || '').localeCompare(a.caricato || '') || b.off - a.off,
  ribasso: (a, b) => b.off - a.off || priceNow(a) - priceNow(b),
  'prezzo-su': (a, b) => priceNow(a) - priceNow(b),
  'prezzo-giu': (a, b) => priceNow(b) - priceNow(a),
  nome: (a, b) => a.nome.localeCompare(b.nome, 'it')
};
const list = f => P.MODELS.filter(m => match(m, f)).sort(SORTS[f.ord] || SORTS.novita);
const nFilters = f => f.cols.size + f.sizes.size + (f.price != null) + f.sale + f.nuovo;

/* ---------- testata ---------- */
function renderHead(n) {
  let title;
  if (F.pref) title = tr('I tuoi <i>preferiti</i>', 'Your <i>favourites</i>');
  else if (F.q) title = tr('Ricerca: <i>', 'Search: <i>') + esc(F.q) + '</i>';
  else if (F.cat !== 'tutto') title = esc(catName(F.cat));
  else title = tr('La <i>collezione</i>', 'The <i>collection</i>');
  $('#pTitle').innerHTML = title;
  document.title = $('#pTitle').textContent + ' · Prêt à Porter à Pois';
  $('#crumbCat').innerHTML = F.cat !== 'tutto' ? `<i></i>${esc(catName(F.cat))}` : '';
  $('#pCount').textContent = n + ' ' + (n === 1 ? tr('capo', 'piece') : tr('capi', 'pieces'));
  const src = F.cat !== 'tutto' && P.C.foto_campione !== false ? FOTO.pick(F.cat, 2, 1800) : img(P.C.hero.foto[0], 1800);
  if ($('#pheroImg').getAttribute('src') !== src) $('#pheroImg').src = src;
}

/* ---------- barra ---------- */
function renderChips() {
  const c = { tutto: 0 }; P.MODELS.forEach(m => { if (match(m, F, true)) { c[m.categoria] = (c[m.categoria] || 0) + 1; c.tutto++; } });
  $('#chips').innerHTML = ['tutto', ...Object.keys(P.C.categorie)].map(k => `<button class="chip ${k === F.cat ? 'on' : ''}" data-c="${k}" ${c[k] ? '' : 'disabled style="opacity:.35"'}>${icon(k === 'tutto' ? 'grid' : P.C.categorie[k].icona)}${esc(catName(k))} <small>${c[k] || 0}</small></button>`).join('');
  $('#chips .chip.on')?.scrollIntoView({ inline: 'center', block: 'nearest' });
  const n = nFilters(F); $('#fN').hidden = !n; $('#fN').textContent = n;
  $('#fLbl').textContent = tr('Filtri', 'Filters');
  const o = $('#sort').options; const names = [tr('Novità', 'Newest'), tr('Ribasso maggiore', 'Biggest drop'), tr('Prezzo crescente', 'Price: low to high'), tr('Prezzo decrescente', 'Price: high to low'), tr('Nome A–Z', 'Name A–Z')];
  [...o].forEach((op, i) => op.textContent = names[i]);
  $('#sort').value = F.ord;
}
function renderActive() {
  const chips = [];
  F.cols.forEach(c => chips.push([`col:${c}`, c]));
  F.sizes.forEach(s => chips.push([`tg:${s}`, tr('Taglia ', 'Size ') + s]));
  if (F.price != null) chips.push(['pr', priceLabel(F.price)]);
  if (F.sale) chips.push(['sale', tr('In ribasso', 'Price drop')]);
  if (F.nuovo) chips.push(['new', tr('Novità', 'New')]);
  if (F.q) chips.push(['q', '“' + F.q + '”']);
  if (F.pref) chips.push(['pref', tr('Preferiti', 'Favourites')]);
  $('#active').innerHTML = chips.map(([k, l]) => `<button data-rm="${esc(k)}">${esc(l)}${icon('x')}</button>`).join('') + (chips.length > 1 ? `<button class="clear" data-rm="all">${tr('Azzera tutto', 'Clear all')}</button>` : '');
}
$('#active').addEventListener('click', e => {
  const b = e.target.closest('[data-rm]'); if (!b) return;
  const k = b.dataset.rm;
  if (k === 'all') { F.cols.clear(); F.sizes.clear(); F.price = null; F.sale = F.nuovo = F.pref = false; F.q = ''; }
  else if (k.startsWith('col:')) F.cols.delete(k.slice(4));
  else if (k.startsWith('tg:')) F.sizes.delete(k.slice(3));
  else if (k === 'pr') F.price = null; else if (k === 'sale') F.sale = false; else if (k === 'new') F.nuovo = false; else if (k === 'q') F.q = ''; else if (k === 'pref') F.pref = false;
  update(true);
});
const priceLabel = i => { const [a, b] = PRICES[i]; return b > 999 ? tr(`Oltre ${a} €`, `Over €${a}`) : a === 0 ? tr(`Fino a ${b} €`, `Up to €${b}`) : `${a}–${b} €`; };

/* ---------- griglia ---------- */
function quoteTile() {
  return `<div class="quote"><img src="${img(P.C.hero.foto[2] || P.C.hero.foto[0], 1000)}" alt="" loading="lazy"><div><p>${tr('Mai lo stesso capo <i>due volte</i>.', 'Never the same piece <i>twice</i>.')}</p><small>${tr('Quando finisce, arriva qualcosa di nuovo', 'When it’s gone, something new arrives')}</small></div></div>`;
}
function renderGrid() {
  const l = list(F), part = l.slice(0, shown);
  renderHead(l.length);
  const g = $('#grid');
  if (!l.length) {
    g.innerHTML = ''; $('#more').innerHTML = `<div class="empty-cat"><span class="script">${F.pref ? tr('Ancora nessun preferito', 'No favourites yet') : tr('Nessun capo', 'Nothing here')}</span>${tr('Prova a togliere qualche filtro: ogni settimana arrivano capi nuovi.', 'Try removing a filter: new pieces arrive every week.')}</div>`;
    return;
  }
  const html = part.map(cardHTML);
  if (!F.q && !F.pref && part.length > 7) html.splice(7, 0, quoteTile());
  g.innerHTML = html.join('');
  $$('.card', g).forEach((c, i) => c.style.animationDelay = Math.min(i % PAGE, 12) * 40 + 'ms');
  $('#more').innerHTML = `<small>${tr('Hai visto', 'You’ve seen')} ${part.length} ${tr('di', 'of')} ${l.length}</small><div class="bar"><i style="width:${part.length / l.length * 100}%"></i></div>` +
    (part.length < l.length ? `<button class="btn" id="moreBtn"><span>${tr('Mostra altri', 'Show more')}</span><span class="bi">${icon('plus')}</span></button>` : '');
}
$('#more').addEventListener('click', e => { if (e.target.closest('#moreBtn')) { shown += PAGE; renderGrid(); } });
bindCards($('#grid'));

/* ---------- stato nell'indirizzo ---------- */
function syncUrl() {
  const p = new URLSearchParams();
  if (F.cat !== 'tutto') p.set('cat', F.cat); if (F.q) p.set('q', F.q); if (F.ord !== 'novita') p.set('ord', F.ord); if (F.pref) p.set('pref', '1');
  if (F.cols.size) p.set('col', [...F.cols].join(',')); if (F.sizes.size) p.set('tg', [...F.sizes].join(','));
  if (F.price != null) p.set('pr', F.price); if (F.sale) p.set('sale', '1'); if (F.nuovo) p.set('new', '1');
  history.replaceState(null, '', 'catalogo.html' + (p.toString() ? '?' + p : ''));
}
function update(resetPage) { if (F.cat !== 'tutto' && !P.C.categorie[F.cat]) F.cat = 'tutto'; if (resetPage) shown = PAGE; renderChips(); renderActive(); renderGrid(); syncUrl(); }
$('#chips').addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b || b.disabled) return; F.cat = b.dataset.c; update(true); scrollTo({ top: 0, behavior: 'smooth' }); });
$('#sort').addEventListener('change', e => { F.ord = e.target.value; update(true); });

/* ---------- pannello filtri ---------- */
const cloneF = f => ({ ...f, cols: new Set(f.cols), sizes: new Set(f.sizes) });
function renderFilters() {
  const d = draft;
  $('#fTitle').textContent = tr('Filtri', 'Filters'); $('#fhCol').textContent = tr('Colore', 'Colour'); $('#fhSz').textContent = tr('Taglia', 'Size'); $('#fhPr').textContent = tr('Prezzo', 'Price');
  $('#fSaleL').textContent = tr('Solo in ribasso', 'Price drops only'); $('#fNewL').textContent = tr('Solo novità', 'New in only'); $('#fReset').textContent = tr('Azzera', 'Reset');
  $('#fCols').innerHTML = colorMap().slice(0, 18).map(([n, e]) => `<button class="fcol ${d.cols.has(n) ? 'on' : ''}" data-col="${esc(n)}"><i style="background:${e.hex}"></i>${esc(n)}<small>${e.n}</small></button>`).join('');
  $('#fSizes').innerHTML = SIZES.filter(s => P.MODELS.some(m => sizesOf(m).has(s))).map(s => `<button class="fsz ${d.sizes.has(s) ? 'on' : ''}" data-sz="${s}">${s}</button>`).join('');
  $('#fSzNote').textContent = tr('Molti capi non hanno ancora la taglia inserita: puoi chiederla in boutique.', 'Many pieces don’t list a size yet: ask the boutique.');
  $('#fPrice').innerHTML = PRICES.map((_, i) => `<button class="fsz ${d.price === i ? 'on' : ''}" data-pr="${i}">${priceLabel(i)}</button>`).join('');
  $('#fSale').checked = d.sale; $('#fNew').checked = d.nuovo;
  const n = P.MODELS.filter(m => match(m, d)).length;
  $('#fApplyTxt').textContent = tr(`Mostra ${n} capi`, `Show ${n} pieces`);
}
const openF = on => { if (on) { draft = cloneF(F); renderFilters(); } $('#fdrawer').classList.toggle('on', on); $('#fscrim').classList.toggle('on', on); };
$('#openFilters').onclick = () => openF(true);
$('#closeFilters').onclick = $('#fscrim').onclick = () => openF(false);
$('#fdrawer').addEventListener('click', e => {
  const c = e.target.closest('[data-col]'), s = e.target.closest('[data-sz]'), p = e.target.closest('[data-pr]');
  if (c) { const v = c.dataset.col; draft.cols.has(v) ? draft.cols.delete(v) : draft.cols.add(v); }
  else if (s) { const v = s.dataset.sz; draft.sizes.has(v) ? draft.sizes.delete(v) : draft.sizes.add(v); }
  else if (p) { draft.price = draft.price === +p.dataset.pr ? null : +p.dataset.pr; }
  else return;
  renderFilters();
});
$('#fSale').onchange = e => { draft.sale = e.target.checked; renderFilters(); };
$('#fNew').onchange = e => { draft.nuovo = e.target.checked; renderFilters(); };
$('#fReset').onclick = () => { draft.cols.clear(); draft.sizes.clear(); draft.price = null; draft.sale = draft.nuovo = false; renderFilters(); };
$('#fApply').onclick = () => { Object.assign(F, draft); openF(false); update(true); };
addEventListener('keydown', e => { if (e.key === 'Escape') openF(false); });

/* ---------- avvio ---------- */
PAP.onRender(() => { update(false); if ($('#fdrawer').classList.contains('on')) renderFilters(); });
PAP.start();
})();
