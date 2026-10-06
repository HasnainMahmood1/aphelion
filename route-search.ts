import { NextRequest, NextResponse } from "next/server";
import { ADAPTERS, Paper } from "@/lib/adapters";
import { merge, rank, parseBool } from "@/lib/rank";
import { normalizeQuery, isSpaceQuery } from "@/lib/space";
import { correct, related } from "@/lib/expand";

export async function GET(req: NextRequest) {
  const raw = (req.nextUrl.searchParams.get("q") || "").trim().slice(0, 300);
  const from = +(req.nextUrl.searchParams.get("from") || 0) || undefined;
  if (!raw) return NextResponse.json({ results: [], errors: [] });
  const q = normalizeQuery(raw);
  const fix = correct(q), didYouMean = fix !== q ? fix : undefined;
  // A misspelled space query ("blakc holes") would be rejected; offer the corrected spelling instead of a dead end.
  if (!isSpaceQuery(q)) return NextResponse.json({ rejected: true, results: [], errors: [], didYouMean: didYouMean && isSpaceQuery(didYouMean) ? didYouMean : undefined });
  const active = ADAPTERS.filter((a) => !a.enabled || a.enabled());
  const settled = await Promise.allSettled(active.map((a) => a.search(q, from)));
  const errors: string[] = [];
  const all = settled.flatMap((s, i) => (s.status === "fulfilled" ? s.value : (errors.push(`${active[i].name}: ${(s.reason as Error).message}`), [])));
  const { negs, phrases, terms, full } = parseBool(q);
  // Crossref flattens Boolean logic and ADS applies it loosely, so enforce NOT terms (and exact phrases when an abstract exists) here.
  const text = (p: Paper) => `${p.title} ${p.abstract || ""}`.toLowerCase();
  const okBool = (p: Paper) => !negs.some((n) => text(p).includes(n)) && phrases.every((ph) => !p.abstract || text(p).includes(ph));
  const results = merge(all.filter(okBool)).map((p) => ({ ...p, score: rank(p, terms, full) })).sort((a, b) => b.score! - a.score!);
  return NextResponse.json({ results, errors, terms, didYouMean, related: related(q, results.slice(0, 10).map((p) => `${p.title} ${(p.abstract || "").slice(0, 300)}`)), searchedAs: q !== raw ? q : undefined });
}
