/* Prêt à Porter à Pois — lettura dell'inventario Excel (formato "INVENTARIO 2026").
   Colonne: A T/F · B FORN · D CODICE · E PREZZO FINITO · F DATA · G DESCRIZIONE · H PREZZO (costo) · M PVEND · O DATA SCARICO · P PREZZO VENDUTO.
   Ogni riga è un pezzo; le righe con stesso codice e stesso nome formano un "modello" con più colori/taglie. */
window.INV = (() => {
'use strict';
const CAT = [
  [['JEANS'], 'jeans'], [['PANTA', 'PANTALONE'], 'pantaloni'], [['CAMICIA', 'CAMICIONE', 'CAMICIONA'], 'camicie'],
  [['MAGLIONCINO', 'MAGLIONE', 'MAGLIA', 'PULL', 'CASHMIRINA', 'CASHMERINA', 'CARDIGAN', 'TOP+CARDIGAN', 'TSH'], 'maglieria'],
  [['FELPA'], 'felpe'], [['TUTA', 'COMPLETO'], 'completi'], [['GIACCA', 'GIUBBINO', 'GIACCHETTO', 'GIUBBETTO', 'GIACCHINO', 'BLAZER'], 'giacche'],
  [['CAPPOTTINO', 'PIUMINO'], 'capispalla'], [['GONNA', 'VESTITINO'], 'abiti'], [['BORSA', 'BALENCIAGA'], 'borse']
];
const COL = {
  ROSA: ['Rosa', '#F2B5BE'], NERO: ['Nero', '#1A1A1A'], NERA: ['Nero', '#1A1A1A'], NER: ['Nero', '#1A1A1A'], MARRONE: ['Marrone', '#7A5236'], MARR: ['Marrone', '#7A5236'],
  CELESTE: ['Celeste', '#A9CBE8'], CEL: ['Celeste', '#A9CBE8'], BLU: ['Blu', '#22386B'], BURRO: ['Burro', '#F3E3B0'], GIALLA: ['Giallo', '#F2D16B'], GIALLO: ['Giallo', '#F2D16B'],
  GRIGIO: ['Grigio', '#9A9A9A'], GRIGIA: ['Grigio', '#9A9A9A'], PANNA: ['Panna', '#F4EEDF'], MILITARE: ['Verde militare', '#5B6340'], VDE: ['Verde', '#5B6340'],
  BCA: ['Bianco', '#FFFFFF'], BIANCO: ['Bianco', '#FFFFFF'], BIANCA: ['Bianco', '#FFFFFF'], BCO: ['Bianco', '#FFFFFF'], BGE: ['Beige', '#D9C3A5'], BEIGE: ['Beige', '#D9C3A5'],
  BORDEAUX: ['Bordeaux', '#6D1A2A'], BORDEAU: ['Bordeaux', '#6D1A2A'], PERLA: ['Perla', '#ECE8E1'], TORTORA: ['Tortora', '#A89A8C'], LILLA: ['Lilla', '#C8B2DC'],
  FUXIA: ['Fucsia', '#D63C8C'], FUX: ['Fucsia', '#D63C8C'], ROSSO: ['Rosso', '#C0262D'], CIPRIA: ['Cipria', '#F1C9C3'], ACQUA: ['Acqua', '#9ED9D2']
};
const SIZES = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL'];
const EXP = [
  [/\bTSH\b/g, 'T-shirt'], [/\bM\/L\b/g, 'manica lunga'], [/\bM\/C\b/g, 'manica corta'], [/\bM 3\/4\b/g, 'manica 3/4'], [/\b1\/2 COLLO\b/g, 'mezzo collo'],
  [/^PANTA\b/g, 'Pantalone'], [/\bG\/C\b/g, 'girocollo'], [/\bELAST\b/g, 'elasticizzata'], [/\bCASHMIRINA\b/g, 'cashmerina'], [/\bBUGGY\b/g, 'baggy'],
  [/\bOVER\b/g, 'oversize'], [/\bLAT\b/g, 'laterale'], [/\bBOTT\b/g, 'bottoni'], [/\b[cC]\//g, 'con '], [/\bCAPP\b/g, 'cappuccio'], [/\bPELICCIA\b/g, 'pelliccia']
];
const slug = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
function categoria(desc) { const w = desc.trim().split(/\s+/)[0]; for (const [k, c] of CAT) if (k.includes(w)) return c; return 'altro'; }
function parse(desc) {
  let d = desc.trim().replace(/\s+/g, ' '), size = null;
  const m = d.match(/\bTG\.?\s*(X{0,2}S|M|X{0,2}L)\b/);
  if (m) { size = m[1]; d = (d.slice(0, m.index) + d.slice(m.index + m[0].length)).trim(); }
  const toks = d.split(' '); let colors = [];
  while (toks.length) {
    const t = toks[toks.length - 1].replace('COL.', '').replace(/^\/+|\/+$/g, '');
    const parts = t.split('/').filter(Boolean);
    if (parts.length && parts.every(p => COL[p])) { colors = parts.map(p => COL[p]).concat(colors); toks.pop(); }
    else if (SIZES.includes(t) && !size) { size = t; toks.pop(); }
    else break;
  }
  let name = toks.join(' ');
  EXP.forEach(([a, b]) => name = name.replace(a, b));
  name = name.replace(/\s+/g, ' ').trim().toLowerCase(); name = name.charAt(0).toUpperCase() + name.slice(1);
  const seen = new Set(); colors = colors.filter(c => !seen.has(c[0]) && seen.add(c[0]));
  return { name, colors, size };
}
const num = v => typeof v === 'number' ? v : (v && !isNaN(parseFloat(String(v).replace(',', '.'))) ? parseFloat(String(v).replace(',', '.')) : null);
const dateStr = v => v instanceof Date ? v.toISOString().slice(0, 10) : (typeof v === 'number' ? new Date(Math.round((v - 25569) * 864e5)).toISOString().slice(0, 10) : (v ? String(v) : null));

/* righe (array di array, come da SheetJS) → modelli */
function fromRows(rows, opts = {}) {
  const models = new Map(), skipped = [];
  let pieces = 0, sold = 0;
  rows.forEach((r, i) => {
    const desc = r[6];
    if (!desc || typeof desc !== 'string' || /DESCRIZIONE/i.test(desc)) { if (i && r.some(x => x != null && x !== '')) skipped.push(i + 1); return; }
    const sku = r[3] ? String(r[3]).trim() : '';
    const { name, colors, size } = parse(desc);
    const pv = num(r[12]), finito = num(r[4]);
    const id = slug(`${sku}-${name}`) || slug(name);
    let m = models.get(id);
    if (!m) {
      m = { id, sku, nome: name, categoria: categoria(desc), prezzo: pv, prezzo_min: finito != null && pv != null && finito < pv ? finito : null,
            fornitore: r[1] || null, costo: num(r[7]), caricato: dateStr(r[5]), varianti: [] };
      models.set(id, m);
    }
    const isSold = opts.venduti !== false && (r[14] != null && r[14] !== '' || r[15] != null && r[15] !== '');
    m.varianti.push({ id: `${id}-${m.varianti.length + 1}`, colore: colors.map(c => c[0]).join(' / ') || null, hex: colors.length ? colors.map(c => c[1]) : null, taglia: size,
      stato: isSold ? 'venduto' : 'disponibile', negozio: r[0] || null, ...(isSold ? { venduto_il: dateStr(r[14]), prezzo_venduto: num(r[15]) } : {}) });
    pieces++; if (isSold) sold++;
  });
  return { modelli: [...models.values()], pieces, sold, skipped };
}

/* confronto con il magazzino attuale: cosa cambierebbe */
function diff(current, incoming) {
  const cur = new Map(current.map(m => [m.id, m]));
  const nuovi = [], aggiornati = [], invariati = [];
  incoming.forEach(m => {
    const c = cur.get(m.id);
    if (!c) return nuovi.push(m);
    const changed = c.prezzo !== m.prezzo || c.varianti.length !== m.varianti.length || c.varianti.filter(v => v.stato === 'venduto').length !== m.varianti.filter(v => v.stato === 'venduto').length;
    (changed ? aggiornati : invariati).push(m);
  });
  const inc = new Set(incoming.map(m => m.id));
  const assenti = current.filter(m => !inc.has(m.id));
  return { nuovi, aggiornati, invariati, assenti };
}
/* unisce: mantiene foto, testi e impostazioni già inserite dall'admin */
function merge(current, incoming, replace) {
  const cur = new Map(current.map(m => [m.id, m]));
  const keep = ['foto', 'descr', 'composizione', 'nome_en', 'ribasso_auto', 'sconto_manuale', 'online', 'nome'];
  const out = incoming.map(m => { const c = cur.get(m.id); if (!c) return m; const k = {}; keep.forEach(f => { if (c[f] !== undefined) k[f] = c[f]; }); if (c.prezzo_min != null && m.prezzo_min == null) k.prezzo_min = c.prezzo_min; return { ...m, ...k }; });
  if (!replace) { const inc = new Set(incoming.map(m => m.id)); current.forEach(m => { if (!inc.has(m.id)) out.push(m); }); }
  return out;
}

/* modelli → righe per l'esportazione in Excel (stesse colonne dell'inventario) */
function toRows(models) {
  const head = ['NEG', 'FORN', '', 'CODICE', 'PREZZO FINITO', 'DATA CARICO', 'DESCRIZIONE', 'PREZZO', 'IVA 22%', 'PREZ.IVATO', 'X2', 'X 3', 'PVEND', 'NEGOZIO', 'DATA SCARICO', 'PREZZO VENDUTO', 'STATO', 'FOTO'];
  const rows = [head];
  models.forEach(m => m.varianti.forEach(v => {
    const c = m.costo;
    rows.push([v.negozio || '', m.fornitore || '', '', m.sku || '', m.prezzo_min ?? m.prezzo ?? '', m.caricato || '', `${m.nome.toUpperCase()} ${(v.colore || '').toUpperCase().replace(/ \/ /g, '/')}${v.taglia ? ' TG ' + v.taglia : ''}`.trim(),
      c ?? '', c != null ? +(c * .22).toFixed(2) : '', c != null ? +(c * 1.22).toFixed(2) : '', c != null ? +(c * 2.44).toFixed(2) : '', c != null ? +(c * 3.66).toFixed(2) : '',
      m.prezzo ?? '', '', v.venduto_il || '', v.prezzo_venduto ?? '', v.stato, (m.foto || []).length ? 'sì' : 'no']);
  }));
  return rows;
}

return { parse, categoria, fromRows, diff, merge, toRows, COL, SIZES, slug };
})();
