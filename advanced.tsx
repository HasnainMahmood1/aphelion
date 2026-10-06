"use client";
import { useState } from "react";

export type AdvOut = { q: string; kind: "all" | "journal" | "preprint"; from: number; to: number; oa: boolean };

const L = {
  en: { all: "All of these words", phrase: "This exact phrase", any: "Any of these words", none: "None of these words", type: "Content type", t_all: "All", t_journal: "Journal article", t_preprint: "Preprint (not peer-reviewed)",
    from: "From year", to: "To year", oa: "PDF / open access only", go: "Search", reset: "Reset", close: "Close", hint: "Needs at least one of: all words, exact phrase, any words." },
  ar: { all: "كل هذه الكلمات", phrase: "هذه العبارة بالضبط", any: "أي من هذه الكلمات", none: "بدون هذه الكلمات", type: "نوع المحتوى", t_all: "الكل", t_journal: "مقالة في مجلة علمية", t_preprint: "نسخة أولية (غير محكّمة)",
    from: "من سنة", to: "إلى سنة", oa: "ملفات PDF / وصول مفتوح فقط", go: "بحث", reset: "إعادة ضبط", close: "إغلاق", hint: "أدخل على الأقل: كل الكلمات أو العبارة أو أي من الكلمات." },
} as const;

const words = (s: string) => s.replace(/["()]/g, " ").trim().split(/\s+/).filter(Boolean);

// Builds the same Boolean syntax the main search box understands: AND (implicit) / OR / NOT / "phrase" / ( ).
export function buildQuery(f: { all: string; phrase: string; any: string; none: string }) {
  const parts: string[] = [];
  if (words(f.all).length) parts.push(words(f.all).join(" "));
  if (f.phrase.replace(/"/g, "").trim()) parts.push(`"${f.phrase.replace(/"/g, "").trim()}"`);
  const a = words(f.any); if (a.length) parts.push(a.length > 1 ? `(${a.join(" OR ")})` : a[0]);
  if (!parts.length) return "";
  return parts.join(" ") + words(f.none).map((w) => ` NOT ${w}`).join("");
}

export function Advanced({ lang, onSubmit, onClose }: { lang: "en" | "ar"; onSubmit: (o: AdvOut) => void; onClose: () => void }) {
  const t = L[lang], Y = new Date().getFullYear();
  const [f, setF] = useState({ all: "", phrase: "", any: "", none: "" });
  const [kind, setKind] = useState<AdvOut["kind"]>("all"); const [from, setFrom] = useState(""); const [to, setTo] = useState(""); const [oa, setOa] = useState(false);
  const q = buildQuery(f);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  const yr = (v: string) => { const n = +v; return n >= 1900 && n <= Y ? n : 0; };
  const submit = (e: React.FormEvent) => { e.preventDefault(); if (q) onSubmit({ q, kind, from: yr(from), to: yr(to), oa }); };
  return (
    <form className="adv" onSubmit={submit}>
      <label>{t.all}<input type="text" value={f.all} onChange={set("all")} /></label>
      <label>{t.phrase}<input type="text" value={f.phrase} onChange={set("phrase")} /></label>
      <label>{t.any}<input type="text" value={f.any} onChange={set("any")} /></label>
      <label>{t.none}<input type="text" value={f.none} onChange={set("none")} /></label>
      <label>{t.type}<select value={kind} onChange={(e) => setKind(e.target.value as AdvOut["kind"])}>
        <option value="all">{t.t_all}</option><option value="journal">{t.t_journal}</option><option value="preprint">{t.t_preprint}</option></select></label>
      <div className="advrow">
        <label>{t.from}<input type="number" min={1900} max={Y} value={from} onChange={(e) => setFrom(e.target.value)} placeholder="1990" /></label>
        <label>{t.to}<input type="number" min={1900} max={Y} value={to} onChange={(e) => setTo(e.target.value)} placeholder={String(Y)} /></label>
      </div>
      <label className="advcheck"><input type="checkbox" checked={oa} onChange={(e) => setOa(e.target.checked)} /> {t.oa}</label>
      <code className="meta" dir="ltr">{q || t.hint}</code>
      <div className="acts">
        <button className="go" disabled={!q} style={{ padding: ".5rem 1.1rem" }}>{t.go}</button>
        <button type="button" onClick={() => { setF({ all: "", phrase: "", any: "", none: "" }); setKind("all"); setFrom(""); setTo(""); setOa(false); }}>{t.reset}</button>
        <button type="button" onClick={onClose}>{t.close}</button>
      </div>
    </form>
  );
}
