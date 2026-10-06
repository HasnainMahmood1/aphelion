import { NextResponse } from "next/server";
import { get, parseArxiv, parseOpenAlex, Paper } from "@/lib/adapters";
import { isSpaceQuery } from "@/lib/space";
export const dynamic = "force-dynamic";
async function trending(): Promise<Paper[]> {
  const y = new Date().getFullYear(), mail = process.env.OPENALEX_MAILTO ? `&mailto=${encodeURIComponent(process.env.OPENALEX_MAILTO)}` : "";
  const search = '("exoplanets" OR "black holes" OR "gravitational waves" OR "dark matter" OR "dark energy" OR "James Webb" OR "Mars" OR "cosmology" OR "spacecraft" OR "neutron stars" OR "galaxies")';
  const r = await get(`https://api.openalex.org/works?search=${encodeURIComponent(search)}&filter=from_publication_date:${y - 2}-01-01,type:article&sort=cited_by_count:desc&per-page=15${mail}`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return parseOpenAlex((await r.json()).results).filter((p) => isSpaceQuery(`${p.title} ${p.abstract || ""}`)).slice(0, 6);
}
async function latest(): Promise<Paper[]> {
  const cats = ["EP", "GA", "CO", "HE", "SR", "IM"].map((c) => `cat:astro-ph.${c}`).join("+OR+");
  const r = await get(`https://export.arxiv.org/api/query?search_query=${cats}&sortBy=submittedDate&sortOrder=descending&max_results=6`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return parseArxiv(await r.text());
}
async function planets(): Promise<any[]> {
  const sql = "select top 8 pl_name,hostname,disc_year,discoverymethod from ps where default_flag=1 order by releasedate desc";
  const r = await get(`https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=${encodeURIComponent(sql)}&format=json`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}
export async function GET() {
  const [t, l, p] = await Promise.allSettled([trending(), latest(), planets()]);
  const val = (s: PromiseSettledResult<any>) => (s.status === "fulfilled" ? s.value : []);
  return NextResponse.json({ trending: val(t), latest: val(l), planets: val(p),
    errors: [t, l, p].map((s, i) => (s.status === "rejected" ? ["trending", "latest", "planets"][i] : null)).filter(Boolean) });
}
