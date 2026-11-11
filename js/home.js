/* Prêt à Porter à Pois — homepage (hero + sezioni selezionabili). Le parti comuni sono in core.js. */
(() => {
'use strict';
const { $, $$, reduce, mobile, euro, esc, icon, T, L, tr, fill, img, catName, P, priceNow, photo, cardHTML, bindCards, toast } = PAP;
let cat = 'tutto', current = 'novita';

/* ---------------- hero: foto che si alternano ---------------- */
let slideI = 0, slideT;
function renderHero() {
  const f = P.C.hero.foto;
  $('#slides').innerHTML = f.map((s, i) => `<img src="${img(s, 1800)}" alt="" ${i ? 'loading="lazy"' : 'fetchpriority="high"'}>`).join('');
  $('#dotsnav').innerHTML = f.map((_, i) => `<button aria-label="Foto ${i + 1}"></button>`).join('');
  $$('#dotsnav button').forEach((b, i) => b.onclick = () => goSlide(i));
  goSlide(0);
}
function goSlide(i) {
  slideI = i; clearTimeout(slideT);
  $$('#slides img').forEach((im, j) => im.classList.toggle('on', j === i));
  $$('#dotsnav button').forEach((b, j) => { b.classList.remove('on'); if (j === i) { void b.offsetWidth; b.classList.add('on'); } });
  slideT = setTimeout(() => goSlide((slideI + 1) % P.C.hero.foto.length), 6000);
}
function renderHeroArt() {
  $('#ringTxt').textContent = P.C.hero.anello;
  const picks = ['maglieria', 'jeans', 'giacche'].map(k => P.MODELS.find(m => m.categoria === k));
  $$('.polaroid').forEach((p, i) => { p.querySelector('img').src = img(P.C.hero.polaroid[i], 300); const m = picks[i]; p.querySelector('small').textContent = m ? euro(priceNow(m)) : ''; });
}

/* pois rosa che compaiono intorno al mouse sull'hero */
(() => {
  const cv = $('#dots'), ctx = cv.getContext('2d');
  let W, H, pts = [], mx = -999, my = -999, tmx = -999, tmy = -999;
  const t0 = performance.now();
  function size() {
    const r = cv.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
    W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const g = W < 640 ? 26 : 32; pts = [];
    for (let y = g / 2; y < H; y += g) for (let x = g / 2 + ((y / g | 0) % 2 ? g / 2 : 0); x < W; x += g) pts.push([x, y]);
  }
  size(); addEventListener('resize', size);
  const host = cv.parentElement;
  host.addEventListener('pointermove', e => { const r = cv.getBoundingClientRect(); tmx = e.clientX - r.left; tmy = e.clientY - r.top; });
  host.addEventListener('pointerleave', () => { tmx = tmy = -999; });
  let vis = true; new IntersectionObserver(e => vis = e[0].isIntersecting).observe(cv);
  (function frame(now) {
    requestAnimationFrame(frame);
    if (!vis || document.hidden) return;
    const t = (now - t0) / 1000;
    if (tmx < -900) { mx += (W * .72 + Math.cos(t * .4) * W * .18 - mx) * .05; my += (H * .5 + Math.sin(t * .6) * H * .28 - my) * .05; }
    else { mx += (tmx - mx) * .12; my += (tmy - my) * .12; }
    ctx.clearRect(0, 0, W, H);
    for (const [x, y] of pts) {
      const dx = x - mx, dy = y - my, d = Math.hypot(dx, dy), k = Math.max(0, 1 - d / 190);
      if (k <= 0) continue;
      const r = 1 + k * k * 6, push = k * 10;
      ctx.fillStyle = `rgba(240,146,154,${k * .9})`;
      ctx.beginPath(); ctx.arc(x + (d ? dx / d * push : 0), y + (d ? dy / d * push : 0), r, 0, 6.283); ctx.fill();
    }
  })(t0);
})();

/* ---------------- sezioni selezionabili ---------------- */
const PANELS = ['novita', 'collezione', 'ribassi', 'tour', 'boutique'];
function moveBlob() {
  const b = $(`#seg button[data-p="${current}"]`), blob = $('#seg .blob'); if (!b) return;
  blob.style.left = b.offsetLeft + 'px'; blob.style.width = b.offsetWidth + 'px';
}
function show(id, scroll) {
  if (!PANELS.includes(id)) return;
  current = id;
  $$('.panel').forEach(p => p.classList.toggle('on', p.id === 'p-' + id));
  $$('#seg button').forEach(b => b.classList.toggle('on', b.dataset.p === id));
  moveBlob();
  history.replaceState(null, '', '#' + id);
  if (scroll) {
    const top = $('#stage').getBoundingClientRect().top + scrollY - (mobile() ? 60 : 64);
    if (Math.abs(scrollY - top) > 40) scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
  }
  if (id === 'ribassi') autoTag();
}
$('#seg').addEventListener('click', e => { const b = e.target.closest('button'); if (b) show(b.dataset.p, true); });
document.addEventListener('click', e => {
  const g = e.target.closest('[data-go]'); if (g) { e.preventDefault(); show(g.dataset.go, true); return; }
  const a = e.target.closest('a[href^="#"]'); if (a && PANELS.includes(a.getAttribute('href').slice(1))) { e.preventDefault(); show(a.getAttribute('href').slice(1), true); }
});
addEventListener('hashchange', () => { const h = location.hash.slice(1); if (PANELS.includes(h) && h !== current) show(h, true); });
addEventListener('resize', moveBlob);

/* ---------------- novità ---------------- */
function counts() { const c = { tutto: 0 }; P.MODELS.forEach(m => { c[m.categoria] = (c[m.categoria] || 0) + m.varianti.length; c.tutto += m.varianti.length; }); return c; }
function renderChips() {
  const c = counts();
  $('#chips').innerHTML = ['tutto', ...Object.keys(P.C.categorie)].filter(k => c[k]).map(k => `<button class="chip ${k === cat ? 'on' : ''}" data-c="${k}">${icon(k === 'tutto' ? 'grid' : P.C.categorie[k].icona)}${esc(catName(k))} <small>${c[k]}</small></button>`).join('');
  $('#allTxt').textContent = tr('Tutto il catalogo · ', 'Full catalogue · ') + c.tutto + tr(' capi', ' pieces');
}
function renderRail(anim) {
  const list = P.MODELS.filter(m => cat === 'tutto' || m.categoria === cat).sort((a, b) => (b.caricato || '').localeCompare(a.caricato || '') || b.off - a.off).slice(0, 16);
  const r = $('#rail'); r.style.gridAutoColumns = list.length ? '' : '100%'; r.innerHTML = list.length ? list.map(cardHTML).join('') : `<div class="empty-cat" style="grid-column:1/-1;padding:40px 10px"><span class="script">${tr('Nuovi capi in arrivo', 'New pieces coming soon')}</span>${tr('Stiamo preparando la collezione: torna a trovarci presto.', 'We’re preparing the collection: come back soon.')}</div>`;
  if (anim) { r.classList.remove('swap'); void r.offsetWidth; r.classList.add('swap'); $$('.card', r).forEach((c, i) => c.style.animationDelay = i * 50 + 'ms'); r.scrollTo({ left: 0 }); }
  $('#allBtn').href = 'catalogo.html' + (cat === 'tutto' ? '' : '?cat=' + cat);
}
function setCat(k) { cat = k; $$('#chips .chip').forEach(x => x.classList.toggle('on', x.dataset.c === k)); renderRail(true); }
$('#chips').addEventListener('click', e => { const b = e.target.closest('.chip'); if (b && b.dataset.c !== cat) setCat(b.dataset.c); });
bindCards($('#rail'), { drag: true }); bindCards($('#railSale'), { drag: true });
const step = () => ($('#rail .card')?.offsetWidth || 240) + 18;
$('#railPrev').onclick = () => $('#rail').scrollBy({ left: -step() * 2, behavior: 'smooth' });
$('#railNext').onclick = () => $('#rail').scrollBy({ left: step() * 2, behavior: 'smooth' });

/* ---------------- collezione ---------------- */
function renderTiles() {
  const c = counts();
  $('#tiles').innerHTML = Object.keys(P.C.categorie).filter(k => c[k]).map((k, i) => `<a class="tile st" style="--i:${i}" href="catalogo.html?cat=${k}">
    <img src="${P.C.foto_campione === false ? (photo(P.MODELS.find(m => m.categoria === k) || {}, 0, 520)) : FOTO.pick(k, 0, 520)}" alt="" loading="lazy"><div class="cap"><div><b>${esc(catName(k))}</b><small>${c[k]} ${tr('capi', 'pieces')}</small></div><span class="go">${icon('arrow')}</span></div></a>`).join('');
}

/* ---------------- ribassi ---------------- */
const stepOf = (v, key) => P.C.offerte.ribassi.reduce((o, r) => v >= r[key] ? r.sconto : o, 0);
function renderSteps() { $('#steps').innerHTML = P.C.offerte.ribassi.map(r => `<li><b>−${r.sconto}%</b><span>${esc(T('rib.step').replace('{giorni}', r.giorni).replace('{venduto}', r.venduto))}</span></li>`).join(''); }
function renderSale() { $('#railSale').innerHTML = P.MODELS.filter(m => m.off).sort((a, b) => b.off - a.off).slice(0, 12).map(cardHTML).join(''); }
let TAGM = null, lastOff = -1, shown = 0;
function updateTag(reset) {
  if (!TAGM) TAGM = P.MODELS.find(m => m.categoria === 'giacche' && m.prezzo >= 45) || P.MODELS[0] || { nome: 'Giacca', prezzo: 55, h: 1, categoria: 'giacche', foto: [] };
  if (reset) { $('#tagImg').src = photo(TAGM, 0, 200); $('#tagName').textContent = TAGM.nome; if (!shown) shown = TAGM.prezzo; }
  const d = +$('#days').value, s = +$('#sold').value;
  $('#days').style.setProperty('--p', d / 120 * 100 + '%'); $('#sold').style.setProperty('--p', s + '%');
  $('#dV').textContent = d; $('#sV').textContent = s + '%';
  const od = stepOf(d, 'giorni'), os = stepOf(s, 'venduto'), off = Math.max(od, os);
  const target = Math.round(TAGM.prezzo * (1 - off / 100));
  const o = $('#tagOff');
  o.textContent = off ? `−${off}% · ${od >= os ? tr('da un po’ in vetrina', 'in the window a while') : tr('ultimi pezzi', 'last pieces')}` : tr('prezzo pieno', 'full price');
  o.classList.toggle('zero', !off);
  if (off !== lastOff) { o.classList.remove('pulse'); void o.offsetWidth; o.classList.add('pulse'); lastOff = off; }
  $('#tagOld').textContent = off ? euro(TAGM.prezzo) : '';
  const from = shown, t0 = performance.now();
  (function anim(now) { const k = Math.min(1, (now - t0) / 500), e = 1 - Math.pow(1 - k, 3); shown = from + (target - from) * e; $('#tagPrice').textContent = euro(Math.round(shown)); if (k < 1) requestAnimationFrame(anim); })(t0);
}
$('#days').addEventListener('input', () => updateTag()); $('#sold').addEventListener('input', () => updateTag());
let tagDone = false;
function autoTag() { if (tagDone || reduce) return; tagDone = true; let d = 0; const iv = setInterval(() => { d += 3; $('#days').value = d; updateTag(); if (d >= 66) clearInterval(iv); }, 45); }

/* ---------------- shopping tour ---------------- */
function renderTour() {
  const t = P.C.tour;
  $('#tourImg').src = img(t.foto, 1600);
  $('#tourFrom').innerHTML = t.partenze.map(p => `<li><i>${icon(p.icona)}</i><b>${esc(p.breve)}</b></li>`).join('');
  $('#tourShops').innerHTML = P.C.boutique.map(s => `<li><i>${icon('pin')}</i><div><b>${esc(s.nome)}</b><small>${esc(L(s.descr))}</small></div></li>`).join('');
  $('#tourVals').innerHTML = t.valori.map(v => `<span>${esc(L(v))}</span>`).join('');
  $('#tmFrom').innerHTML = t.partenze.map(p => `<option>${esc(p.nome)}</option>`).join('');
  $('#tmShops').innerHTML = `<span style="width:100%;font-size:10px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)">${tr('Boutique da visitare', 'Boutiques to visit')}</span>` + P.C.boutique.map(s => `<label><input type="checkbox" checked> ${esc(s.nome)}</label>`).join('');
}
(() => {
  const g = $('.map .paths'), ys = [30, 110, 190, 270], hub = [200, 150], ns = 'http://www.w3.org/2000/svg';
  const Lp = y => `M0 ${y} C 90 ${y}, 110 ${hub[1]}, ${hub[0] - 32} ${hub[1]}`, Rp = y => `M${hub[0] + 32} ${hub[1]} C 290 ${hub[1]}, 310 ${y}, 400 ${y}`;
  g.innerHTML = ys.map(y => `<path class="p" d="${Lp(y)}"/><path class="p" d="${Rp(y)}"/><circle cx="0" cy="${y}" r="4" fill="#F0929A"/><circle cx="400" cy="${y}" r="4" fill="none" stroke="#F0929A" stroke-width="1.5"/>`).join('');
  const routes = ys.map((y, i) => { const p = document.createElementNS(ns, 'path'); p.setAttribute('d', `M0 ${y} C 90 ${y}, 110 ${hub[1]}, ${hub[0]} ${hub[1]} C 290 ${hub[1]}, 310 ${ys[(i + 1) % 4]}, 400 ${ys[(i + 1) % 4]}`); p.setAttribute('fill', 'none'); g.appendChild(p); return p; });
  const car = $('#car'); let r = 0, t0 = performance.now();
  (function go(now) {
    requestAnimationFrame(go);
    if (current !== 'tour') return;
    const p = routes[r], len = p.getTotalLength(), k = Math.max(0, Math.min(1, (now - t0) / 3600));
    const e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    const pt = p.getPointAtLength(e * len); car.setAttribute('transform', `translate(${pt.x},${pt.y})`);
    if (k >= 1) { r = (r + 1) % routes.length; t0 = now + 400; }
  })(t0);
})();
const closeModal = () => $('#tourModal').classList.remove('on');
$('#openTour').onclick = () => $('#tourModal').classList.add('on');
$$('#tourModal [data-close]').forEach(b => b.onclick = closeModal);
addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
$('#tourForm').onsubmit = e => { e.preventDefault(); closeModal(); toast(tr('Anteprima: nella versione completa la richiesta arriva alla boutique', 'Preview: in the full version the request reaches the boutique')); };

/* ---------------- boutique ---------------- */
function renderShops() {
  $('#shops').innerHTML = P.C.boutique.map((s, i) => `<article class="shop">
    <div class="im"><img src="${img(s.foto, 640)}" alt="" loading="lazy"><span class="num">0${i + 1}</span>${s.principale ? `<span class="flag">${tr('Principale', 'Flagship')}</span>` : ''}</div>
    <div class="bd"><h3>${esc(s.nome)}</h3><p>${esc(L(s.descr))}</p>
    <div class="meta">${s.indirizzo ? `<b>${esc(s.indirizzo)}</b><span>${esc(s.citta)}</span>` : `<span class="soon">${tr('Indirizzo in arrivo', 'Address coming soon')}</span>`}${s.orari ? `<span>${esc(s.orari)}</span>` : ''}</div>
    ${s.indirizzo ? `<div class="go"><a class="btn sm" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.indirizzo + ' ' + (s.citta.includes('Frascati') ? 'Frascati' : 'Roma'))}"><span>${tr('Indicazioni', 'Directions')}</span><span class="bi">${icon('arrow')}</span></a></div>` : ''}</div>
  </article>`).join('');
}

/* ---------------- club ---------------- */
function renderClub() {
  $('#newsPct').textContent = `−${P.C.offerte.newsletter_sconto}%`;
  $('#perks').innerHTML = P.C.servizi.map(s => `<div class="perk"><i>${icon(s.icona)}</i><div><b>${esc(L(s.titolo))}</b><small>${esc(fill(L(s.testo)))}</small></div></div>`).join('');
}
$('#newsForm').onsubmit = e => { e.preventDefault(); e.target.reset(); toast(tr('Grazie! Il codice arriva nella tua email.', 'Thank you! Your code is on its way.')); };

/* ---------------- avvio ---------------- */
function renderPage() { renderHeroArt(); renderChips(); renderRail(); renderTiles(); renderSteps(); renderSale(); renderTour(); renderShops(); renderClub(); updateTag(true); moveBlob(); }
PAP.onRender(renderPage);
PAP.start(() => {
  renderHero();
  const h = location.hash.slice(1);
  show(PANELS.includes(h) ? h : 'novita', false);
});
})();
