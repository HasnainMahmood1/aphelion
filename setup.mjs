// Next.js needs app/ and lib/ folders, but this repo is kept flat (loose files only) so it can be uploaded without folders.
// This script copies each file to its real location. It runs automatically on `npm install` and before dev/build/test/typecheck.
import { mkdirSync, copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const MAP = {
  "layout.tsx": "app/layout.tsx", "page.tsx": "app/page.tsx", "views.tsx": "app/views.tsx", "advanced.tsx": "app/advanced.tsx",
  "orbit3d.tsx": "app/orbit3d.tsx", "globals.css": "app/globals.css",
  "route-search.ts": "app/api/search/route.ts", "route-entity.ts": "app/api/entity/route.ts",
  "route-home.ts": "app/api/home/route.ts", "route-assistant.ts": "app/api/assistant/route.ts",
  "adapters.ts": "lib/adapters.ts", "space.ts": "lib/space.ts", "store.ts": "lib/store.ts", "rank.ts": "lib/rank.ts", "expand.ts": "lib/expand.ts",
  "tests.ts": "tests/t.ts", "schema.sql": "supabase/schema.sql",
};
for (const [src, dst] of Object.entries(MAP)) {
  if (!existsSync(src)) { console.warn(`setup: missing ${src}`); continue; }
  mkdirSync(dirname(dst), { recursive: true });
  if (!existsSync(dst) || readFileSync(src, "utf8") !== readFileSync(dst, "utf8")) copyFileSync(src, dst);
}
if (!existsSync("next-env.d.ts")) writeFileSync("next-env.d.ts", '/// <reference types="next" />\n');
