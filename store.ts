// Saved papers: Supabase (Postgres) when NEXT_PUBLIC_SUPABASE_* are set, localStorage otherwise.
// Each browser signs in anonymously, so row-level security keeps every visitor's rows private without a login screen.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Paper } from "./adapters";

let sb: SupabaseClient | null | undefined;
const client = () => {
  if (sb === undefined) {
    const u = process.env.NEXT_PUBLIC_SUPABASE_URL, k = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    sb = u && k ? createClient(u, k, { auth: { persistSession: true, autoRefreshToken: true } }) : null;
  }
  return sb;
};
export const cloudEnabled = () => !!client();

async function userId() {
  const c = client()!;
  const { data: { session } } = await c.auth.getSession();
  if (session) return session.user.id;
  const { data, error } = await c.auth.signInAnonymously();
  if (error || !data.user) throw error || new Error("anonymous sign-in failed");
  return data.user.id;
}
const local = (): Paper[] => { try { return JSON.parse(localStorage.getItem("saved") || "[]"); } catch { return []; } };
const row = (uid: string, p: Paper) => { const { note, coll, ...paper } = p; return { user_id: uid, paper_id: p.id, paper, note: note ?? null, coll: coll ?? null }; };

// On first connect, anything already saved in this browser is copied up so nothing is lost.
export async function loadSaved(): Promise<{ items: Paper[]; cloud: boolean }> {
  const c = client(), loc = local();
  if (!c) return { items: loc, cloud: false };
  try {
    const uid = await userId();
    const { data, error } = await c.from("saved_items").select("paper_id,paper,note,coll").order("created_at", { ascending: true });
    if (error) throw error;
    const items = (data || []).map((r: any) => ({ ...r.paper, note: r.note ?? undefined, coll: r.coll ?? undefined }) as Paper);
    const have = new Set(items.map((p) => p.id)), missing = loc.filter((p) => !have.has(p.id));
    if (missing.length) {
      const { error: e2 } = await c.from("saved_items").upsert(missing.map((p) => row(uid, p)), { onConflict: "user_id,paper_id" });
      if (e2) throw e2;
      items.push(...missing);
    }
    return { items, cloud: true };
  } catch { return { items: loc, cloud: false }; }
}

export async function syncSaved(prev: Paper[], next: Paper[]) {
  const c = client(); if (!c) return;
  const uid = await userId(), old = new Map(prev.map((p) => [p.id, p]));
  const up = next.filter((p) => { const o = old.get(p.id); return !o || o.note !== p.note || o.coll !== p.coll; });
  const gone = prev.filter((p) => !next.some((n) => n.id === p.id)).map((p) => p.id);
  if (up.length) { const { error } = await c.from("saved_items").upsert(up.map((p) => row(uid, p)), { onConflict: "user_id,paper_id" }); if (error) throw error; }
  if (gone.length) { const { error } = await c.from("saved_items").delete().in("paper_id", gone); if (error) throw error; }
}
