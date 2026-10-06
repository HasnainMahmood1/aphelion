import type { Paper } from "./adapters";
import { synonymsOf } from "./expand";

const STOP = new Set(["the", "and", "for", "with", "from", "that", "this", "are", "was", "were", "its", "into", "using", "study", "paper", "based"]);
export const stem = (w: string) => (w.length > 4 ? (w.endsWith("ies") ? w.slice(0, -3) + "y" : w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w) : w);
export const tokens = (s: string) => (s.toLowerCase().match(/[\p{L}\p{N}]+/gu) || []).map(stem);
// Title-first so an arXiv preprint (no DOI) and its journal version (DOI) merge; non-Latin titles are kept (\p{L}).
export const key = (p: Paper) => { const t = p.title.toLowerCase().replace(/[^\p{L}\p{N}]/gu, ""); return t ? "t:" + t : "d:" + (p.doi?.toLowerCase() ?? p.id); };
const jac = (a: Set<string>, b: Set<string>) => { let i = 0; for (const x of a) if (b.has(x)) i++; return i / (a.size + b.size - i || 1); };

function combine(o: Paper, p: Paper) {
  o.sources = [...new Set([...o.sources, ...p.sources])];
  o.citations = Math.max(o.citations ?? 0, p.citations ?? 0) || undefined; o.pdf = o.pdf || p.pdf; o.doi = o.doi || p.doi;
  if (!o.authors.length) o.authors = p.authors;
  if ((p.abstract || "").length > (o.abstract || "").length) o.abstract = p.abstract;
  if (p.kind === "journal") { o.kind = "journal"; o.venue = p.venue || o.venue; o.url = p.url; }
}
// Exact title match, or (for titles of 4+ distinctive words) near-identical word sets within a year of each other.
export function merge(list: Paper[]): Paper[] {
  const out: { p: Paper; t: Set<string> }[] = [], byKey = new Map<string, number>();
  for (const p of list) {
    const k = key(p), t = new Set(tokens(p.title).filter((w) => !STOP.has(w)));
    let i = byKey.get(k);
    if (i === undefined && t.size >= 4) { const j = out.findIndex((o) => jac(o.t, t) >= 0.88 && (!o.p.year || !p.year || Math.abs(o.p.year - p.year) <= 1)); if (j >= 0) i = j; }
    if (i === undefined) { byKey.set(k, out.length); out.push({ p: { ...p }, t }); continue; }
    combine(out[i].p, p);
  }
  return out.map((o) => o.p);
}

export function rank(p: Paper, terms: string[], full?: string) {
  const t = p.title.toLowerCase(), a = (p.abstract || "").toLowerCase(), tt = new Set(tokens(t)), at = new Set(tokens(a));
  let hit = 0, th = 0;
  for (const w of terms) {
    const alts = [w, ...synonymsOf(w)], m = (x: string, txt: string, set: Set<string>) => (x.includes(" ") || x.includes("-") ? txt.includes(x) : set.has(stem(x)));
    if (alts.some((x) => m(x, t, tt))) { th++; hit++; } else if (alts.some((x) => m(x, a, at))) hit += 0.6;
  }
  const n = terms.length || 1;
  let rel = 0.8 * (0.6 * (hit / n) + 0.4 * (th / n));
  if (full && terms.length > 1) rel += t.includes(full) ? 0.2 : a.includes(full) ? 0.08 : 0;
  const Y = new Date().getFullYear(), rec = p.year ? Math.max(0, 1 - (Y - p.year) / 25) : 0;
  // Citations per year of age, so a 2-year-old paper with 300 citations beats a 25-year-old one with 600.
  const cit = Math.min(1, Math.log10((p.citations || 0) / Math.max(1, Y - (p.year || Y) + 1) + 1) / 2);
  const multi = Math.min(1, (p.sources.length - 1) / 2);
  return 0.55 * rel + 0.12 * rec + 0.15 * cit + 0.06 * (p.kind === "journal" ? 1 : 0.6) + 0.08 * multi + 0.04 * (p.abstract ? 1 : 0);
}

// Pull the NOT terms, exact phrases and ranking terms out of a Boolean query.
export function parseBool(q: string) {
  const negs = [...q.matchAll(/\bNOT\s+("([^"]+)"|[^\s()]+)/g)].map((m) => (m[2] || m[1]).toLowerCase());
  const phrases = [...q.replace(/\bNOT\s+"[^"]+"/g, " ").matchAll(/"([^"]+)"/g)].map((m) => m[1].toLowerCase());
  const terms = q.toLowerCase().replace(/\bnot\s+("[^"]+"|[^\s()]+)/g, " ").replace(/["()]|\b(and|or)\b/g, " ").split(/\s+/).filter((w) => w.length > 2);
  const plain = !/\b(AND|OR|NOT)\b|[()"]/.test(q);
  return { negs, phrases, terms, full: plain && terms.length > 1 ? terms.join(" ") : undefined };
}
