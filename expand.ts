// Synonyms/acronyms (for ranking), spelling suggestions and related searches. Pure functions, no network.
import { VOCAB, PHRASES } from "./space";

const GROUPS: string[][] = [
  ["jwst", "james webb", "webb telescope"], ["hst", "hubble"], ["exoplanet", "extrasolar planet", "extrasolar"], ["cmb", "cosmic microwave background"],
  ["agn", "active galactic nucleus", "active galactic nuclei"], ["iss", "international space station"], ["gw", "gravitational wave"], ["ligo", "gravitational wave"],
  ["frb", "fast radio burst"], ["grb", "gamma-ray burst", "gamma ray burst"], ["eht", "event horizon telescope"], ["seti", "extraterrestrial intelligence"],
  ["neo", "near-earth object", "near earth object"], ["cme", "coronal mass ejection"], ["sgr a", "sagittarius a"], ["smbh", "supermassive black hole"],
  ["moon", "lunar"], ["sun", "solar"], ["planet", "planetary"], ["star", "stellar"], ["galaxy", "galactic"], ["comet", "cometary"], ["asteroid", "minor planet"],
  ["dwarf galaxy", "dwarf galaxies"], ["reionization", "reionisation"], ["spectroscopy", "spectroscopic", "spectra"],
];
const stem = (w: string) => (w.length > 4 ? (w.endsWith("ies") ? w.slice(0, -3) + "y" : w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w) : w);
const IDX = new Map<string, string[]>();
for (const g of GROUPS) for (const m of g) { const k = m.split(" ").map(stem).join(" "); IDX.set(k, [...(IDX.get(k) || []), ...g.filter((x) => x !== m)]); }
export const synonymsOf = (term: string) => IDX.get(term.toLowerCase().split(" ").map(stem).join(" ")) || [];

// Optimal-string-alignment distance (counts an adjacent swap as one edit).
export function osa(a: string, b: string) {
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
  }
  return d[a.length][b.length];
}
const V = [...VOCAB];
// Returns a corrected query, or the same string when nothing looks misspelled. Only touches plain words of 5+ letters.
export function correct(q: string): string {
  return q.replace(/[A-Za-z]{5,}/g, (w) => {
    const l = w.toLowerCase();
    if (/^(and|or|not)$/.test(l) || VOCAB.has(l) || VOCAB.has(stem(l)) || VOCAB.has(l.replace(/(ic|al|ary)$/, "e"))) return w;
    const max = l.length >= 8 ? 2 : 1; let best = "", bd = 99;
    for (const c of V) { if (c[0] !== l[0] || Math.abs(c.length - l.length) > max) continue; const dd = osa(l, c); if (dd < bd) { bd = dd; best = c; } }
    return best && bd <= max ? (w[0] === w[0].toUpperCase() ? best[0].toUpperCase() + best.slice(1) : best) : w;
  });
}

// Space phrases that occur in the top results but not in the query: cheap "related searches".
export function related(q: string, texts: string[], n = 5): string[] {
  const ql = q.toLowerCase(), c = new Map<string, number>();
  for (const t of texts) { const l = t.toLowerCase(); for (const p of PHRASES) { const pl = p.toLowerCase(); if (!ql.includes(pl) && !pl.includes(ql) && new RegExp(`\\b${pl.replace(/[-.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(l)) c.set(p, (c.get(p) || 0) + 1); } }
  return [...c.entries()].sort((a, b) => b[1] - a[1] || a[0].length - b[0].length).slice(0, n).map(([p]) => p);
}
