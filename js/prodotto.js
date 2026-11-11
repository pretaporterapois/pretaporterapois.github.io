/* Prêt à Porter à Pois — scheda del capo: galleria, colori, taglie, consegna, ribasso, capi correlati. */
(() => {
'use strict';
const { $, $$, euro, esc, icon, tr, L, fill, catName, P, priceNow, photo, byId, cardHTML, bindCards, addToCart, toggleFav, favs, toast, mobile } = PAP;
const id = new URLSearchParams(location.search).get('id');
let m = null, ci = 0, size = null, deliv = 'ship', shopI = 0, gi = 0;
const N_PHOTO = 4;
const pics = (w = 900) => Array.from({ length: N_PHOTO }, (_, k) => photo(m, ci * 2 + k, w));

/* ---------- galleria ---------- */
function renderGallery() {
  const ps = pics(1100), th = pics(160);
  const badges = (m.off ? `<span class="badge">−${m.off}%</span>` : '') + (m.isNew ? `<span class="badge new">${tr('Nuovo', 'New')}</span>` : '');
  $('#stage').innerHTML = `<div class="badges">${badges}</div>` + ps.map((s, k) => `<div class="slide ${k === gi ? 'on' : ''}"><img src="${s}" alt="${esc(m.nome)} – ${k + 1}" ${k ? 'loading="lazy"' : ''}></div>`).join('');
  $('#thumbs').innerHTML = th.map((s, k) => `<button class="${k === gi ? 'on' : ''}" data-g="${k}" aria-label="Foto ${k + 1}"><img src="${s}" alt=""></button>`).join('');
  $('#gdots').innerHTML = ps.map((_, k) => `<i class="${k === 0 ? 'on' : ''}"></i>`).join('');
  if (mobile()) $('#stage').scrollTo({ left: 0 });
}
function goG(k) {
  gi = k; $$('#stage .slide').forEach((s, j) => s.classList.toggle('on', j === k)); $$('#thumbs button').forEach((b, j) => b.classList.toggle('on', j === k));
  $('#stage').classList.remove('zoom');
}
$('#thumbs').addEventListener('click', e => { const b = e.target.closest('[data-g]'); if (b) goG(+b.dataset.g); });
$('#stage').addEventListener('click', () => { if (!mobile()) $('#stage').classList.toggle('zoom'); });
$('#stage').addEventListener('mousemove', e => {
  if (!$('#stage').classList.contains('zoom')) return;
  const r = $('#stage').getBoundingClientRect(), im = $('#stage .slide.on img');
  im.style.transformOrigin = `${(e.clientX - r.left) / r.width * 100}% ${(e.clientY - r.top) / r.height * 100}%`;
});
$('#stage').addEventListener('mouseleave', () => $('#stage').classList.remove('zoom'));
$('#stage').addEventListener('scroll', () => { const k = Math.round($('#stage').scrollLeft / $('#stage').clientWidth); $$('#gdots i').forEach((d, j) => d.classList.toggle('on', j === k)); }, { passive: true });

/* ---------- prossimo ribasso (dimostrativo finché i dati non arrivano dal database) ---------- */
function nextDrop() {
  const next = P.C.offerte.ribassi.find(r => r.sconto > m.off);
  if (!next) return `<div class="nextdrop"><i>${icon('tag')}</i><div>${tr('Questo capo ha raggiunto il <b>prezzo più basso</b>.', 'This piece has reached its <b>lowest price</b>.')}</div></div>`;
  const left = 3 + m.h % 25, tot = 30, np = Math.max(PAP.minPrice(m), Math.round(m.prezzo * (1 - next.sconto / 100)));
  if (np >= priceNow(m)) return `<div class="nextdrop"><i>${icon('tag')}</i><div>${tr('Questo capo ha raggiunto il <b>prezzo più basso</b>.', 'This piece has reached its <b>lowest price</b>.')}</div></div>`;
  return `<div class="nextdrop"><i>${icon('clock')}</i><div>${tr(`Tra <b>${left} giorni</b> scende a <b>${euro(np)}</b>, se è ancora qui.`, `In <b>${left} days</b> it drops to <b>${euro(np)}</b>, if it’s still here.`)}<div class="bar"><span style="width:${(1 - left / tot) * 100}%"></span></div></div></div>`;
}

/* ---------- informazioni ---------- */
function renderInfo() {
  const c = m.colors[ci], pn = priceNow(m), off = P.C.offerte;
  const shops = P.C.boutique.filter(s => s.indirizzo);
  const sizes = c.taglie;
  if (sizes.length === 1) size = sizes[0];
  if (size && !sizes.includes(size)) size = null;
  const desc = tr(
    `${m.nome}, scelto dalla boutique per la collezione di stagione. Disponibile in ${m.colors.length} ${m.colors.length === 1 ? 'colore' : 'colori'}. Come ogni nostro capo è a tiratura limitata: quando finisce non torna.`,
    `${m.nome}, chosen by the boutique for this season’s collection. Available in ${m.colors.length} ${m.colors.length === 1 ? 'colour' : 'colours'}. Like all our pieces it’s a limited run: once it’s gone, it won’t be back.`);
  $('#pinfo').innerHTML = `
    <nav class="crumbs"><a href="index.html">Home</a><i></i><a href="catalogo.html">${esc(T('sec.collezione'))}</a><i></i><a href="catalogo.html?cat=${m.categoria}">${esc(catName(m.categoria))}</a></nav>
    <h1>${esc(m.nome)}</h1>
    <div class="ref">${tr('Rif.', 'Ref.')} ${esc(m.sku || '—')}</div>
    <div class="pprice"><b>${euro(pn)}</b>${m.off ? `<s>${euro(m.prezzo)}</s><span class="off">−${m.off}%</span>` : ''}</div>
    <div class="klarna">${tr('oppure 3 rate da', 'or 3 payments of')} <b>${euro(Math.round(pn / 3 * 100) / 100)}</b> ${tr('senza interessi con', 'interest-free with')} <b>Klarna</b></div>
    ${nextDrop()}
    <div class="opt"><h6><span>${tr('Colore', 'Colour')}<b>${esc(c.colore || '—')}</b></span></h6>
      <div class="pcols">${m.colors.map((v, j) => `<button class="${j === ci ? 'on' : ''}" data-ci="${j}" title="${esc(v.colore || '')}" aria-label="${esc(v.colore || 'colore')}" style="background:${PAP.swHex(v)}"></button>`).join('')}</div></div>
    <div class="opt"><h6><span>${tr('Taglia', 'Size')}${size ? `<b>${size}</b>` : ''}</span><button id="sgOpen">${icon('ruler')}${tr('Guida alle taglie', 'Size guide')}</button></h6>
      ${sizes.length ? `<div class="psizes">${sizes.map(s => `<button class="${s === size ? 'on' : ''}" data-sz="${s}">${s}</button>`).join('')}</div>`
        : `<div class="askbox"><span>${tr('La taglia di questo capo te la confermiamo noi: scrivici e ti rispondiamo subito.', 'We’ll confirm the size for you: message us and we’ll reply right away.')}</span><a class="btn sm" href="${askLink()}" target="_blank" rel="noopener"><span>${tr('Chiedi', 'Ask')}</span><span class="bi">${icon('chat')}</span></a></div>`}
      ${c.pezzi <= 2 ? `<div class="pleft">${c.pezzi === 1 ? tr('Ultimo pezzo disponibile', 'Last piece available') : tr('Ultimi 2 pezzi', 'Last 2 pieces')}</div>` : ''}</div>
    <div class="opt"><h6><span>${tr('Consegna', 'Delivery')}</span></h6><div class="deliv">
      <div class="dopt ${deliv === 'ship' ? 'on' : ''}" data-d="ship"><i>${icon('truck')}</i><div><b>${tr('Spedizione a casa', 'Home delivery')}</b>${tr('24/72 ore · gratis sopra', '24–72 hours · free over')} ${euro(off.spedizione_gratis_da)}</div><em>${pn >= off.spedizione_gratis_da ? tr('Gratis', 'Free') : euro(off.costo_spedizione)}</em></div>
      <div class="dopt ${deliv === 'pickup' ? 'on' : ''}" data-d="pickup"><i>${icon('store')}</i><div><b>${tr('Ritiro in boutique', 'Collect in boutique')}</b>${tr('Pronto in 24 ore, ti avvisiamo noi', 'Ready in 24 hours, we’ll let you know')}
        ${deliv === 'pickup' ? `<select id="shopSel">${shops.map((s, j) => `<option value="${j}" ${j === shopI ? 'selected' : ''}>${esc(s.nome)} · ${esc(s.indirizzo)}</option>`).join('')}</select>` : ''}</div><em>${tr('Gratis', 'Free')}</em></div>
    </div></div>
    <div class="buy"><button class="btn rosa" id="addBtn"><span>${tr('Aggiungi alla borsa', 'Add to bag')}</span><span class="bi">${icon('bag')}</span></button>
      <button class="circ ${favs.has(m.id) ? 'on' : ''}" id="favP" aria-label="${tr('Preferiti', 'Favourites')}">${icon('heart')}</button>
      <button class="circ" id="shareP" aria-label="${tr('Condividi', 'Share')}">${icon('share')}</button></div>
    <div class="acc">
      <details open><summary>${tr('Descrizione', 'Description')}${icon('plus')}</summary><div class="ct">${esc(desc)}</div></details>
      <details><summary>${tr('Composizione e cura', 'Composition & care')}${icon('plus')}</summary><div class="ct">${tr('Tessuto e istruzioni di lavaggio vengono inseriti dalla boutique nella scheda del capo. Per qualsiasi dubbio scrivici: rispondiamo in giornata.', 'Fabric and care details are added by the boutique. Any question? Message us and we’ll answer the same day.')}</div></details>
      <details><summary>${tr('Spedizioni e resi', 'Shipping & returns')}${icon('plus')}</summary><div class="ct"><ul>
        <li>${tr('Spedizione in 24/72 ore:', 'Delivery in 24–72 hours:')} <b>${euro(off.costo_spedizione)}</b>, ${tr('gratis sopra', 'free over')} <b>${euro(off.spedizione_gratis_da)}</b></li>
        <li>${tr('Ritiro gratuito in boutique, pronto in 24 ore', 'Free collection in boutique, ready in 24 hours')}</li>
        <li>${tr('Reso entro 14 giorni dalla consegna', 'Returns within 14 days of delivery')}</li></ul></div></details>
      <details><summary>${tr('Dove trovarlo', 'Where to find it')}${icon('plus')}</summary><div class="ct">${P.C.boutique.map(s => `<div style="margin-bottom:8px"><b>${esc(s.nome)}</b><br>${s.indirizzo ? esc(s.indirizzo + ' · ' + s.citta) : tr('Indirizzo in arrivo', 'Address coming soon')}</div>`).join('')}</div></details>
    </div>`;
  $('#sbName').textContent = m.nome; $('#sbPrice').textContent = euro(pn); $('#sbTxt').textContent = tr('Aggiungi', 'Add');
  watchBuy();
}
function askLink() {
  const c = P.C.contatti, txt = encodeURIComponent(tr(`Ciao! Vorrei sapere la taglia di: ${m.nome} (${m.sku || ''})`, `Hi! I’d like to know the size of: ${m.nome} (${m.sku || ''})`));
  return c.whatsapp ? `https://wa.me/${c.whatsapp}?text=${txt}` : `mailto:${c.email}?subject=${encodeURIComponent(m.nome)}&body=${txt}`;
}
const T = k => PAP.T(k);

/* ---------- azioni ---------- */
function add(btn) {
  const c = m.colors[ci];
  if (c.taglie.length > 1 && !size) {
    toast(tr('Scegli prima la taglia', 'Choose a size first'));
    const s = $('.psizes'); s?.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(8px)' }, { transform: 'translateX(0)' }], { duration: 350 });
    s?.scrollIntoView({ behavior: 'smooth', block: 'center' }); return;
  }
  addToCart(m, { colore: c.colore, taglia: size, consegna: deliv }, btn);
}
$('#pinfo').addEventListener('click', e => {
  const c = e.target.closest('[data-ci]'), s = e.target.closest('[data-sz]'), d = e.target.closest('[data-d]');
  if (c) { ci = +c.dataset.ci; gi = 0; size = null; renderGallery(); renderInfo(); return; }
  if (s) { size = s.dataset.sz; renderInfo(); return; }
  if (d && !e.target.closest('select')) { deliv = d.dataset.d; renderInfo(); return; }
  if (e.target.closest('#addBtn')) return add(e.target.closest('#addBtn'));
  if (e.target.closest('#favP')) { toggleFav(m); $('#favP').classList.toggle('on', favs.has(m.id)); return; }
  if (e.target.closest('#shareP')) {
    if (navigator.share) navigator.share({ title: m.nome, url: location.href }).catch(() => {});
    else navigator.clipboard?.writeText(location.href).then(() => toast(tr('Link copiato', 'Link copied')));
    return;
  }
  if (e.target.closest('#sgOpen')) $('#sizeModal').classList.add('on');
});
$('#pinfo').addEventListener('change', e => { if (e.target.id === 'shopSel') shopI = +e.target.value; });
$('#sbAdd').onclick = e => add(e.currentTarget);
$$('#sizeModal [data-close]').forEach(b => b.onclick = () => $('#sizeModal').classList.remove('on'));
addEventListener('keydown', e => { if (e.key === 'Escape') $('#sizeModal').classList.remove('on'); });

/* barra "aggiungi" fissa sul telefono quando il pulsante principale non si vede */
let io;
function watchBuy() {
  io?.disconnect();
  io = new IntersectionObserver(es => $('#stickybuy').classList.toggle('on', !es[0].isIntersecting && scrollY > 300));
  io.observe($('#addBtn'));
}

/* ---------- correlati ---------- */
function renderRelated() {
  const same = P.MODELS.filter(x => x.id !== m.id && x.categoria === m.categoria);
  const other = P.MODELS.filter(x => x.categoria !== m.categoria && x.h % 7 === m.h % 7);
  $('#rel').innerHTML = [...same.slice(0, 8), ...other.slice(0, 6)].map(cardHTML).join('');
  $('#relEy').textContent = tr('Potrebbe piacerti', 'You may also like');
  $('#relT').innerHTML = tr('Completa il <i>look</i>', 'Complete the <i>look</i>');
}
bindCards($('#rel'), { drag: true });
const step = () => ($('#rel .card')?.offsetWidth || 240) + 18;
$('#relPrev').onclick = () => $('#rel').scrollBy({ left: -step() * 2, behavior: 'smooth' });
$('#relNext').onclick = () => $('#rel').scrollBy({ left: step() * 2, behavior: 'smooth' });

function translateGuide() {
  $('#sgEy').textContent = tr('Guida alle taglie', 'Size guide'); $('#sgT').textContent = tr('Trova la tua misura', 'Find your size');
  $('#sgB').textContent = tr('Seno', 'Bust'); $('#sgW').textContent = tr('Vita', 'Waist'); $('#sgH').textContent = tr('Fianchi', 'Hips');
  $('#sgN').textContent = tr('Misure del corpo in centimetri. Hai un dubbio? Scrivici: ti consigliamo noi.', 'Body measurements in centimetres. Not sure? Message us and we’ll help.');
}

/* ---------- avvio ---------- */
function render() {
  if (!m) return;
  document.title = m.nome + ' · Prêt à Porter à Pois';
  renderInfo(); renderRelated(); translateGuide();
}
PAP.onRender(render);
PAP.start(() => {
  m = byId(id);
  if (!m) {
    $('#prod').innerHTML = `<div class="empty-cat" style="grid-column:1/-1"><span class="script">${tr('Questo capo non c’è più', 'This piece is gone')}</span>${tr('Da noi ogni capo è unico: quando finisce arriva qualcosa di nuovo.', 'Every piece is unique: when it’s gone, something new arrives.')}<div style="margin-top:22px"><a class="btn" href="catalogo.html"><span>${tr('Vai alla collezione', 'Go to the collection')}</span><span class="bi">${icon('arrow')}</span></a></div></div>`;
    $('.related').hidden = true; return;
  }
  renderGallery(); render();
});
})();
