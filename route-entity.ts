import { NextRequest, NextResponse } from "next/server";
import { normalizeQuery, isSpaceQuery } from "@/lib/space";
const clean = (s: string) => s.replace(/[^\p{L}\p{N}\s.\-+*]/gu, "").slice(0, 80).trim();
const opt = () => ({ next: { revalidate: 86400 }, signal: AbortSignal.timeout(9000), headers: { "User-Agent": "Aphelion/0.1" } }) as any;

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams, q = clean(sp.get("q") || "");
  const lang = sp.get("lang") === "ar" ? "ar" : "en";
  if (!q) return NextResponse.json({});
  const wiki = async () => {
    const s = await (await fetch(`https://${lang}.wikipedia.org/w/rest.php/v1/search/page?q=${encodeURIComponent(q)}&limit=1`, opt())).json();
    const key = s.pages?.[0]?.key; if (!key) return null;
    const d = await (await fetch(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(key)}`, opt())).json();
    return { title: d.title, description: d.description, extract: d.extract, thumb: d.thumbnail?.source, url: d.content_urls?.desktop?.page };
  };
  const exo = async () => {
    if (sp.get("exo") !== "1") return [];
    const sql = `select top 5 pl_name,hostname,disc_year,discoverymethod,pl_rade,pl_bmasse,pl_orbper,sy_dist from ps where default_flag=1 and (pl_name like '%${q}%' or hostname like '%${q}%')`;
    const r = await fetch(`https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=${encodeURIComponent(sql)}&format=json`, opt());
    return r.ok ? await r.json() : [];
  };
  const [w, x] = await Promise.allSettled([wiki(), exo()]);
  const page = w.status === "fulfilled" ? w.value : null, planets = x.status === "fulfilled" ? x.value : [];
  if (sp.get("pre") !== "1" && !planets.length && !isSpaceQuery(normalizeQuery(`${q} ${page?.description || ""} ${page?.extract || ""}`)))
    return NextResponse.json({ rejected: true });
  return NextResponse.json({ ...(page || {}), planets });
}
