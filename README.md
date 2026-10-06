# Aphelion — space-only research search ($0 API cost)
    npm install && npm run dev     # http://localhost:3000  (no keys needed)
Requires Node 18.18+. Optional: copy `env.example` to `.env.local`.

## What's new in v0.3
- **Smarter ranking** (`lib/rank.ts`): stemming, acronym/synonym matching (JWST = James Webb, CMB, GRB, FRB...), exact-phrase bonus, citations normalised by paper age.
- **Fuzzy de-duplication**: near-identical titles across sources merge.
- **On-topic filtering**: arXiv categories and OpenAlex topics drop off-topic hits.
- **"Did you mean"** spelling suggestions (also rescue misspelled queries), **related searches**, **sort** (relevance / newest / most cited) and **term highlighting**.
- Tests: `npx tsx tests/t.ts` (offline, fixture-based).

## Features
- **Search**: arXiv + OpenAlex + Crossref (+ NASA ADS, ESA via ADS, with a token) + SIMBAD in parallel → AR→EN normalisation → space-only validation → dedupe (DOI/title) → ranking. Boolean: `AND OR NOT "exact phrase" ( )`. Filters: type, date, PDF.
- **Advanced search**: form for all / exact / any / none words, content type, year range, PDF-only. It builds the same Boolean query the search box accepts.
- **Homepage**: *Trending research* (most-cited space papers of the past two years, OpenAlex) and *Latest discoveries* (newest astro-ph preprints on arXiv + recently released NASA Exoplanet Archive entries). Cached 1 h.
- **Paper page**: metadata, abstract, DOI, links, related papers (title search), notes/collections in **Saved**.
- **Missions / Space Objects**: Wikipedia (EN/AR) background + NASA Exoplanet Archive TAP table (objects). Mission status is NOT live; verify with NASA/ESA.
- **Solar System**: illustrative 3D view (Three.js; circular coplanar orbits, labelled not real-time; drag to rotate, scroll to zoom, speed slider).
- **Saved items**: Supabase Postgres when configured (anonymous per-browser sign-in + row-level security), otherwise localStorage. Items already in the browser are copied up on first connect.
- **Assistant (optional)**: local Ollama only. `ollama pull llama3.2`, set `OLLAMA_MODEL=llama3.2`. Uses abstracts only.
- **EN/AR** with RTL (logical CSS). Arabic→English term list: ~400 entries in `space.ts` (`TERMS`, one `arabic|english` per line; article, clitics and spelling variants are handled automatically).

## Setup: database (optional)
1. Create a Supabase project. Run `schema.sql` in the SQL editor.
2. Authentication → Sign In / Providers → enable **Allow anonymous sign-ins**.
3. Put the project URL and anon key in `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
Anonymous accounts live in the browser: clearing site data detaches the saved items from that browser. Add email sign-in if you need cross-device sync.

## Sources and limits
| Source | Key | Notes |
|---|---|---|
| arXiv | none | ~1 req/3 s |
| OpenAlex | none (`OPENALEX_MAILTO` recommended) | ~100k credits/day |
| Crossref | none | all disciplines, so results are filtered to space topics; Boolean operators are flattened to plain text |
| NASA ADS | `ADS_API_TOKEN` (free) | astronomy collection; 5,000 requests/day |
| ESA (ADS) | same token | there is no public ESA paper-search API, so this is ADS filtered to ESA-affiliated authors (ESA, ESAC, ESTEC, ESOC) |
| SIMBAD | none | object database: returns papers for a query that is an object name (e.g. `Crab Nebula`); other queries return nothing from it |
Wikipedia REST ~200 req/s · Exoplanet Archive TAP: reasonable use. Responses are cached 1–24 h.

## Structure (flat repo)
All files live in the repository root so the repo can be uploaded without folders. `setup.mjs` copies them into the folders Next.js needs
(`app/`, `app/api/*`, `lib/`, `tests/`, `supabase/`); it runs automatically on `npm install` and before `dev`, `build`, `test` and `typecheck`.
Those generated folders are git-ignored. **Edit the root files, not the generated copies.**

    page.tsx views.tsx advanced.tsx orbit3d.tsx layout.tsx globals.css      UI           -> app/
    route-search.ts route-entity.ts route-home.ts route-assistant.ts        API routes   -> app/api/<name>/route.ts
    adapters.ts space.ts rank.ts expand.ts store.ts                         logic        -> lib/
    schema.sql   tests.ts   env.example                                     DB / tests / env template
    setup.mjs                                                               builds the folder layout

Copy `env.example` to `.env.local` to configure optional keys.

## Add sources
Implement `{ name, enabled?, search(q, fromYear) }` and add it to ADAPTERS.

## Development
    npm run typecheck   # tsc --noEmit
    npm test            # offline fixture tests, no network
    npm run build

## Known limitations
- "Journal article" vs "Preprint" is inferred from source metadata; peer review is not verified.
- "PDF only" keeps results with a PDF/open-access link, which can be a landing page.
- The optional local assistant (Ollama) can still make mistakes; it only sees abstracts.
- Space-only filtering is keyword- and category-based, so unusual object names can be rejected. Missions and Space Objects bypass it for the built-in chips.
- Live source behaviour (field names, rate limits) was verified only against fixtures; report mismatches as issues.

## License
MIT. Data comes from third-party APIs (arXiv, OpenAlex, Crossref, NASA ADS, SIMBAD, Wikipedia, NASA Exoplanet Archive); follow their terms of use.
