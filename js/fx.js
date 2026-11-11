/* Prêt à Porter à Pois — sfondo animato: pois luminosi + schizzi di moda che si disegnano e svaniscono */
(() => {
'use strict';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fx = document.getElementById('fx');
if (!fx) return;
const small = () => innerWidth < 700;

/* ---------- pois luminosi (bokeh) ---------- */
const cv = document.getElementById('bokeh'), ctx = cv.getContext('2d');
let W, H, dpr, parts = [];
const COLS = [[240, 146, 154], [247, 180, 186], [243, 220, 203], [255, 255, 255], [201, 96, 109]];
function mk(init) {
  const big = Math.random() < .22;
  const c = COLS[Math.random() * COLS.length | 0];
  return {
    x: Math.random() * W, y: init ? Math.random() * H : H + 60,
    r: big ? 18 + Math.random() * 46 : 1.2 + Math.random() * 3.2,
    a: big ? .05 + Math.random() * .08 : .25 + Math.random() * .45,
    vy: -(.08 + Math.random() * .28), sw: Math.random() * 6.28, ss: .002 + Math.random() * .006,
    depth: .05 + Math.random() * .35, c, big
  };
}
function size() {
  dpr = Math.min(devicePixelRatio || 1, 1.5); W = innerWidth; H = innerHeight;
  cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const n = small() ? 26 : 48;
  parts = Array.from({ length: n }, () => mk(true));
}
size(); addEventListener('resize', size);
let lastY = scrollY;
function frame() {
  requestAnimationFrame(frame);
  if (document.hidden) return;
  const dy = scrollY - lastY; lastY = scrollY;
  ctx.clearRect(0, 0, W, H);
  for (const p of parts) {
    if (!reduce) { p.y += p.vy - dy * p.depth; p.sw += p.ss; }
    const x = p.x + Math.sin(p.sw) * 18;
    if (p.y < -80) Object.assign(p, mk(false));
    if (p.y > H + 90) p.y = -70;
    const [r, g, b] = p.c;
    if (p.big) {
      const gr = ctx.createRadialGradient(x, p.y, 0, x, p.y, p.r);
      gr.addColorStop(0, `rgba(${r},${g},${b},${p.a})`); gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = gr;
    } else ctx.fillStyle = `rgba(${r},${g},${b},${p.a * (.75 + Math.sin(p.sw * 3) * .25)})`;
    ctx.beginPath(); ctx.arc(x, p.y, p.r, 0, 6.283); ctx.fill();
  }
}
requestAnimationFrame(frame);

/* ---------- schizzi di moda ---------- */
// ogni disegno: [viewBox, contenuto]. Tutte le linee hanno pathLength=1 per l'effetto "si disegna da solo".
const P = d => `<path pathLength="1" d="${d}"/>`;
const SK = [
  // abito da sera
  ['0 0 100 200', P('M40 8 L42 40 M60 8 L58 40') + P('M42 40 Q50 47 58 40 L61 70 Q50 75 39 70 Z') + P('M39 70 Q28 120 10 192 Q50 202 90 192 Q72 120 61 70') + P('M46 78 Q40 130 32 195 M54 78 Q61 130 68 195') + P('M39 70 Q50 64 61 70')],
  // décolleté con tacco a spillo
  ['0 0 140 90', P('M12 30 Q14 54 34 56 Q66 58 96 66 Q124 74 128 64 Q124 54 104 50 Q80 44 62 32 Q46 20 32 30 Q22 36 12 30 Z') + P('M16 40 L22 86') + P('M62 32 Q70 46 92 50')],
  // borsa
  ['0 0 100 100', P('M16 40 L84 40 L90 92 L10 92 Z') + P('M33 40 Q33 10 50 10 Q67 10 67 40') + P('M43 52 H57 V62 H43 Z') + P('M16 40 Q50 56 84 40')],
  // cappello a tesa larga
  ['0 0 120 80', P('M4 56 Q60 80 116 56 Q60 40 4 56') + P('M32 54 Q30 22 60 20 Q90 22 88 54') + P('M33 44 Q60 52 87 44') + P('M88 46 Q102 40 106 30')],
  // profumo
  ['0 0 100 120', P('M28 44 H72 Q84 44 84 58 V100 Q84 112 72 112 H28 Q16 112 16 100 V58 Q16 44 28 44 Z') + P('M42 44 V32 H58 V44') + P('M38 32 V16 H62 V32') + P('M30 64 Q50 56 70 64')],
  // occhiali da sole
  ['0 0 120 60', P('M10 22 Q10 50 32 50 Q52 50 52 24 Z') + P('M68 24 Q68 50 88 50 Q110 50 110 22 Z') + P('M52 26 Q60 18 68 26') + P('M10 22 L2 14 M110 22 L118 14')],
  // gruccia con abito
  ['0 0 120 160', P('M60 22 Q60 8 70 10 Q78 16 70 24 Q60 28 60 36') + P('M60 36 L10 66 H110 Z') + P('M34 66 L28 150 Q60 158 92 150 L86 66') + P('M60 70 V150')],
  // manichino sartoriale
  ['0 0 100 180', P('M44 14 H56 V22') + P('M36 22 Q26 26 26 44 Q30 64 36 74 Q28 96 34 116 H66 Q72 96 64 74 Q70 64 74 44 Q74 26 64 22 Q50 18 36 22 Z') + P('M50 116 V166 M34 168 H66') + P('M30 46 Q50 54 70 46')],
  // rossetto
  ['0 0 60 120', P('M18 116 V62 H42 V116 Z') + P('M21 62 V40 L39 28 V62') + P('M18 86 H42')],
  // tacco e fiocco
  ['0 0 100 70', P('M10 40 Q30 20 50 40 Q70 60 90 40 Q70 20 50 40 Q30 60 10 40 Z') + P('M50 40 L42 66 M50 40 L58 66')]
];
const WORDS = ['Haute couture', 'Chic', 'Élégance', 'Roma', 'Glamour', 'Made in Italy', 'à Pois', 'Bellissima', 'Prêt à Porter', 'Frascati'];
const host = document.getElementById('sketches');
let live = 0, last = -1;
function spawn() {
  if (document.hidden || live >= (small() ? 3 : 5)) return;
  let i; do { i = Math.random() * SK.length | 0; } while (i === last); last = i;
  const [vb, body] = SK[i];
  const d = document.createElement('div'); d.className = 'sketch';
  const w = small() ? 80 + Math.random() * 70 : 130 + Math.random() * 150;
  // preferisce i bordi, così non disturba il testo al centro
  const side = Math.random() < .5 ? Math.random() * .28 : .72 + Math.random() * .28;
  d.style.cssText = `left:${side * (innerWidth - w)}px;top:${Math.random() * (innerHeight - w * 1.3)}px;width:${w}px;--rot:${(Math.random() * 16 - 8).toFixed(1)}deg;--op:${(.28 + Math.random() * .2).toFixed(2)};--life:${(8 + Math.random() * 4).toFixed(1)}s;--c:${Math.random() < .7 ? '#F0929A' : '#F3DCCB'}`;
  d.innerHTML = `<svg viewBox="${vb}">${body}</svg>`;
  host.appendChild(d); live++;
  d.addEventListener('animationend', e => { if (e.target === d) { d.remove(); live--; } });
}
function word() {
  if (document.hidden) return;
  const el = document.createElement('div'); el.className = 'word';
  el.textContent = WORDS[Math.random() * WORDS.length | 0];
  const fs = small() ? 26 + Math.random() * 18 : 36 + Math.random() * 40;
  el.style.cssText = `font-size:${fs}px;left:${Math.random() * (innerWidth - fs * 5)}px;top:${Math.random() * (innerHeight - fs)}px;--op:${(.12 + Math.random() * .1).toFixed(2)}`;
  host.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
}
if (!reduce) {
  setTimeout(() => { spawn(); spawn(); }, 1200);
  setInterval(spawn, 1900);
  setInterval(word, 4200);
}
})();
