// Each source = one adapter returning normalised Paper[]. Add one and register it in ADAPTERS.
import { isSpaceQuery, isStrongSpace } from "./space";

export type Paper = {
  id: string; title: string; authors: string[]; year?: number; venue?: string; abstract?: string;
  doi?: string; url: string; pdf?: string; citations?: number; kind: "journal" | "preprint";
  sources: string[]; score?: number; note?: string; coll?: string; cat?: string;
};
// `enabled` lets an adapter that needs a key stay silent (no error row) when the key is not set.
export type Adapter = { name: string; enabled?: () => boolean; search: (q: string, fromYear?: number) => Promise<Paper[]> };

export const get = (u: string, headers: Record<string, string> = {}, ms = 9000) =>
  fetch(u, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(ms), headers: { "User-Agent": "Aphelion/0.1", ...headers } });
const decode = (s: string) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&amp;/g, "&");
const tag = (s: string, t: string) => { const v = (s.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`)) || [])[1]; return v === undefined ? undefined : decode(v.replace(/\s+/g, " ").trim()); };
const MAILTO = () => process.env.OPENALEX_MAILTO || process.env.CROSSREF_MAILTO || "";

// ---- arXiv ---------------------------------------------------------------------------------------------
// Boolean support: AND / OR / NOT / "exact phrase" / ( grouping ); adjacent terms are ANDed.
function arxivQuery(q: string) {
  const out: string[] = []; let prevOp = true;
  for (const t of q.match(/"[^"]+"|[()]|[^\s()]+/g) || []) {
    if (t === "(") { if (!prevOp) out.push("AND"); out.push("%28"); prevOp = true; }
    else if (t === ")") { out.push("%29"); prevOp = false; }
    else if (/^(AND|OR|NOT)$/.test(t)) { out.push(t === "NOT" ? "ANDNOT" : t); prevOp = true; }
    else { if (!prevOp) out.push("AND"); out.push("all:" + encodeURIComponent(t)); prevOp = false; }
  }
  return out.join("+");
}
export function parseArxiv(xml: string, from?: number): Paper[] {
  return xml.split("<entry>").slice(1).map((e) => {
    const id = tag(e, "id")!; const year = +(tag(e, "published") || "").slice(0, 4);
    return { id, title: tag(e, "title")!, abstract: tag(e, "summary"), year, url: id,
      authors: [...e.matchAll(/<author>\s*<name>([^<]+)<\/name>/g)].map((m) => m[1]),
      doi: tag(e, "arxiv:doi"), pdf: (e.match(/<link title="pdf" href="([^"]+)"/) || [])[1],
      venue: "arXiv preprint", kind: "preprint" as const, sources: ["arXiv"], cat: (e.match(/<arxiv:primary_category[^>]*term="([^"]+)"/) || [])[1] };
  }).filter((p) => !from || !p.year || p.year >= from);
}
// Keep arXiv papers in astronomy/space categories, or whose own text is clearly about space (drops e.g. cs.LG "space" hits).
export const onTopicArxiv = (p: Paper) => !p.cat || /^(astro-ph|gr-qc|physics\.(space-ph|plasm-ph|ao-ph|geo-ph))/.test(p.cat) || isStrongSpace(`${p.title} ${p.abstract || ""}`);
const arxiv: Adapter = { name: "arXiv", async search(q, from) {
  const r = await get(`https://export.arxiv.org/api/query?search_query=${arxivQuery(q)}&max_results=15&sortBy=relevance`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return parseArxiv(await r.text(), from).filter(onTopicArxiv);
} };

// ---- OpenAlex (supports AND / OR / NOT, quotes and parentheses natively) ------------------------------
// OpenAlex tags each work with a topic hierarchy; drop works whose topic is clearly outside astronomy/space unless their text says otherwise.
export function onTopicOpenAlex(w: any) {
  const t = w.primary_topic; if (!t) return true;
  const names = `${t.subfield?.display_name || ""} ${t.field?.display_name || ""}`;
  return /astronom|astrophys|space|planet|earth/i.test(names) || isStrongSpace(`${w.title} ${t.display_name || ""}`);
}
export function parseOpenAlex(results: any[]): Paper[] {
  return (results || []).filter((w: any) => w.title && onTopicOpenAlex(w)).map((w: any) => {
    let abstract: string | undefined;
    if (w.abstract_inverted_index) { const a: string[] = []; for (const [k, ps] of Object.entries<number[]>(w.abstract_inverted_index)) ps.forEach((p) => (a[p] = k)); abstract = a.join(" "); }
    const loc = w.primary_location || {}; const repo = loc.source?.type === "repository";
    const doi = w.doi?.replace("https://doi.org/", "");
    return { id: w.id, title: w.title, abstract, authors: (w.authorships || []).slice(0, 8).map((a: any) => a.author.display_name),
      year: w.publication_year, venue: loc.source?.display_name, doi, url: doi ? `https://doi.org/${doi}` : w.id,
      pdf: w.open_access?.oa_url || undefined, citations: w.cited_by_count, kind: repo ? "preprint" : "journal", sources: ["OpenAlex"] } as Paper;
  });
}
const openalex: Adapter = { name: "OpenAlex", async search(q, from) {
  const mail = process.env.OPENALEX_MAILTO ? `&mailto=${encodeURIComponent(process.env.OPENALEX_MAILTO)}` : "";
  const f = from ? `&filter=from_publication_date:${from}-01-01` : "";
  const r = await get(`https://api.openalex.org/works?search=${encodeURIComponent(q)}&per-page=15${f}${mail}`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return parseOpenAlex((await r.json()).results);
} };

// ---- Crossref (free, no key; plain-text relevance search, so Boolean operators are flattened) ----------
const plain = (q: string) => q.replace(/\bNOT\s+("[^"]+"|\S+)/g, " ").replace(/["()]|\b(AND|OR)\b/g, " ").replace(/\s+/g, " ").trim();
const crossref: Adapter = { name: "Crossref", async search(q, from) {
  const mail = MAILTO() ? `&mailto=${encodeURIComponent(MAILTO())}` : "";
  const flt = ["type:journal-article", "type:posted-content", ...(from ? [`from-pub-date:${from}`] : [])].join(",");
  const r = await get(`https://api.crossref.org/works?query=${encodeURIComponent(plain(q))}&rows=20&filter=${flt}&select=DOI,title,author,issued,container-title,abstract,is-referenced-by-count,link,type,URL${mail}`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const items: any[] = (await r.json()).message?.items || [];
  return items.filter((w) => w.title?.[0]).map((w) => {
    const abstract = w.abstract ? String(w.abstract).replace(/<[^>]+>/g, " ").replace(/^\s*Abstract\s*/i, "").replace(/\s+/g, " ").trim() : undefined;
    return { id: "crossref:" + w.DOI, title: String(w.title[0]).replace(/<[^>]+>/g, ""), abstract,
      authors: (w.author || []).slice(0, 8).map((a: any) => [a.given, a.family].filter(Boolean).join(" ") || a.name || ""),
      year: w.issued?.["date-parts"]?.[0]?.[0], venue: w["container-title"]?.[0], doi: w.DOI, url: w.URL || `https://doi.org/${w.DOI}`,
      pdf: (w.link || []).find((l: any) => l["content-type"] === "application/pdf")?.URL, citations: w["is-referenced-by-count"],
      kind: w.type === "posted-content" ? "preprint" : "journal", sources: ["Crossref"] } as Paper;
    // Crossref covers every discipline, so keep only records that are themselves about space.
  }).filter((p) => isSpaceQuery(`${p.title} ${p.abstract || ""}`));
} };

// ---- NASA ADS (needs a free token: ADS_API_TOKEN) and ESA-affiliated papers via the same index -----------
const adsOn = () => !!process.env.ADS_API_TOKEN;
async function adsSearch(q: string, from: number | undefined, source: string, extraFq?: string): Promise<Paper[]> {
  const fq = [`collection:astronomy`, ...(from ? [`year:[${from} TO 9999]`] : []), ...(extraFq ? [extraFq] : [])].map((f) => `&fq=${encodeURIComponent(f)}`).join("");
  const r = await get(`https://api.adsabs.harvard.edu/v1/search/query?q=${encodeURIComponent(`abs:(${q})`)}${fq}&fl=bibcode,title,author,year,pub,abstract,doi,citation_count,identifier&rows=15&sort=${encodeURIComponent("score desc")}`,
    { Authorization: `Bearer ${process.env.ADS_API_TOKEN}` });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const docs: any[] = (await r.json()).response?.docs || [];
  return docs.filter((d) => d.title?.[0]).map((d) => {
    const ax = (d.identifier || []).find((i: string) => /^arXiv:/i.test(i));
    const doi = d.doi?.[0];
    return { id: "ads:" + d.bibcode, title: d.title[0], abstract: d.abstract, authors: (d.author || []).slice(0, 8), year: +d.year || undefined, venue: d.pub, doi,
      url: `https://ui.adsabs.harvard.edu/abs/${encodeURIComponent(d.bibcode)}/abstract`, pdf: ax ? `https://arxiv.org/pdf/${ax.slice(6)}` : undefined,
      citations: d.citation_count, kind: /arxiv/i.test(d.pub || "") ? "preprint" : "journal", sources: [source] } as Paper;
  });
}
const ads: Adapter = { name: "NASA ADS", enabled: adsOn, search: (q, from) => adsSearch(q, from, "NASA ADS") };
// There is no public ESA paper-search API, so this is ADS filtered to ESA-affiliated authors (ESA, ESAC, ESTEC, ESOC).
const esa: Adapter = { name: "ESA (ADS)", enabled: adsOn, search: (q, from) => adsSearch(q, from, "ESA (ADS)", 'aff:("European Space Agency" OR ESAC OR ESTEC OR ESOC)') };

// ---- SIMBAD (object database): when the query is an object name, return the papers SIMBAD lists for it ----
const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());
// Best effort: SIMBAD is a bonus source, so it gets a short timeout and never shows an error row.
const simbad: Adapter = { name: "SIMBAD", async search(q, from) { try { return await simbadSearch(q, from); } catch { return []; } } };
async function simbadSearch(q: string, from?: number): Promise<Paper[]> {
  const name = q.replace(/"/g, "").replace(/[()]/g, " ").replace(/\s+/g, " ").trim();
  if (!name || /\b(AND|OR|NOT)\b/.test(name) || name.split(" ").length > 4) return []; // only plausible object names
  const esc = (s: string) => s.replace(/'/g, "''");
  const ids = [...new Set([`NAME ${titleCase(name)}`, titleCase(name), name, name.toUpperCase()])].map((i) => `'${esc(i)}'`).join(",");
  const adql = `SELECT TOP 15 ref.bibcode, ref.title, ref.year, ref.journal, ref.doi FROM ident JOIN has_ref ON ident.oidref = has_ref.oidref JOIN ref ON ref.oidbib = has_ref.oidbibref WHERE ident.id IN (${ids})${from ? ` AND ref.year >= ${from}` : ""} ORDER BY ref.year DESC`;
  const r = await get(`https://simbad.cds.unistra.fr/simbad/sim-tap/sync?request=doQuery&lang=adql&format=json&query=${encodeURIComponent(adql)}`, {}, 5000);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const j = await r.json(); const col = (n: string) => (j.metadata || []).findIndex((m: any) => m.name === n);
  const [b, t, y, jn, d] = ["bibcode", "title", "year", "journal", "doi"].map(col);
  return (j.data || []).filter((row: any[]) => row[t]).map((row: any[]) => {
    const doi = Array.isArray(row[d]) ? row[d][0] : row[d] || undefined;
    return { id: "simbad:" + row[b], title: String(row[t]), authors: [], year: row[y] || undefined, venue: row[jn] || undefined, doi,
      url: doi ? `https://doi.org/${doi}` : `https://ui.adsabs.harvard.edu/abs/${encodeURIComponent(row[b])}/abstract`,
      kind: /arxiv/i.test(row[jn] || "") ? "preprint" : "journal", sources: ["SIMBAD"] } as Paper;
  });
}

export const ADAPTERS: Adapter[] = [arxiv, openalex, crossref, ads, esa, simbad];
