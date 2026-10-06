"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Paper } from "@/lib/adapters";
import { V, Ask, askQs, Explore, Orbits, Detail, SavedView, HomeFeeds } from "./views";
import { Advanced, type AdvOut } from "./advanced";
import { loadSaved, syncSaved, cloudEnabled } from "@/lib/store";

const T = {
  en: { dir: "ltr", ph: "Search the universe…", go: "Search", h: "Search papers, missions, objects & discoveries", type: "Content type", all: "All", journal: "Journal article", preprint: "Preprint (not peer-reviewed)", date: "Date", any: "Any time", y1: "Past year", y5: "Past 5 years", y10: "Past 10 years",
    oa: "PDF / open access only", read: "Read", pdf: "PDF", save: "Save", saved: "Saved", reject: "This search engine is specialized in space science and exploration. Try searching for planets, spacecraft, astronomy, astrophysics, satellites, missions, or space research.",
    none: "No results found.", err: "Source unavailable", cites: "citations", asAs: "Searched as", noAbs: "Abstract not available from source.", count: "results", rank: "Ranked by relevance, source type, recency and citations.", saved_n: "Saved", ai: "Research assistant: requires local model configuration (not enabled).", adv: "Advanced search", since: "Since", sort: "Sort by", rel: "Relevance", new: "Newest", cited: "Most cited", dym: "Did you mean", relS: "Related searches" },
  ar: { dir: "rtl", ph: "ابحث في الكون…", go: "بحث", h: "ابحث في الأبحاث والمهام والأجرام والاكتشافات", type: "نوع المحتوى", all: "الكل", journal: "مقالة في مجلة علمية", preprint: "نسخة أولية (غير محكّمة)", date: "التاريخ", any: "أي وقت", y1: "آخر سنة", y5: "آخر 5 سنوات", y10: "آخر 10 سنوات",
    oa: "ملفات PDF / وصول مفتوح فقط", read: "قراءة البحث", pdf: "PDF", save: "حفظ", saved: "تم الحفظ", reject: "محرك البحث هذا متخصص في علوم الفضاء واستكشافه. جرّب البحث عن الكواكب أو المركبات الفضائية أو علم الفلك أو الفيزياء الفلكية أو الأقمار الصناعية أو المهام أو الأبحاث الفضائية.",
    none: "لم يتم العثور على نتائج.", err: "المصدر غير متاح", cites: "استشهاد", asAs: "تم البحث بصيغة", noAbs: "الملخص غير متوفر من المصدر.", count: "نتيجة", rank: "الترتيب حسب الصلة ونوع المصدر والحداثة وعدد الاستشهادات.", saved_n: "المحفوظات", ai: "المساعد البحثي: يتطلب إعداد نموذج محلي (غير مفعّل).", adv: "بحث متقدم", since: "منذ", sort: "الترتيب", rel: "الصلة", new: "الأحدث", cited: "الأكثر استشهادًا", dym: "هل تقصد", relS: "عمليات بحث ذات صلة" },
} as const;

const Logo = () => (<svg width="26" height="26" viewBox="0 0 32 32" fill="none" stroke="#5b9bd5" strokeWidth="1.6" aria-hidden><circle cx="16" cy="16" r="3"/><ellipse cx="16" cy="16" rx="13" ry="6" transform="rotate(-25 16 16)"/><circle cx="26.2" cy="11" r="1.6" fill="#6fc3d0" stroke="none"/></svg>);

export default function Home() {
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [q, setQ] = useState(""); const [sub, setSub] = useState("");
  const [data, setData] = useState<any>(null); const [loading, setLoading] = useState(false);
  const [kind, setKind] = useState<"all" | "journal" | "preprint">("all"); const [years, setYears] = useState(0); const [oa, setOa] = useState(false);
  const [saved, setSaved] = useState<Paper[]>([]); const input = useRef<HTMLInputElement>(null);
  const [sort, setSort] = useState<"rel" | "new" | "cited">("rel"); const [toYear, setToYear] = useState(0); const [adv, setAdv] = useState(false); const [home, setHome] = useState<any>(null); const [, setCloud] = useState(false);
  const loaded = useRef(false); const prev = useRef<Paper[]>([]);
  const t = T[lang]; const v = V[lang];
  const [view, setView] = useState<"search" | "missions" | "objects" | "orbits" | "saved">("search"); const [open, setOpen] = useState<Paper | null>(null);
  const goSearch = (s: string) => { setQ(s); setSub(s); setView("search"); setOpen(null); };

  useEffect(() => { if (localStorage.getItem("lang") === "ar") setLang("ar");
    loadSaved().then(({ items, cloud }) => { prev.current = items; setSaved(items); setCloud(cloud); loaded.current = true; });
    const k = (e: KeyboardEvent) => { if (e.key === "/" && document.activeElement?.tagName !== "INPUT") { e.preventDefault(); input.current?.focus(); } };
    addEventListener("keydown", k); return () => removeEventListener("keydown", k); }, []);
  useEffect(() => { document.documentElement.lang = lang; document.documentElement.dir = T[lang].dir; localStorage.setItem("lang", lang); }, [lang]);
  // Mirror to localStorage immediately; push changes to the database (if configured) after a short pause.
  useEffect(() => { if (!loaded.current) return; localStorage.setItem("saved", JSON.stringify(saved));
    const t = setTimeout(() => { const before = prev.current; syncSaved(before, saved).then(() => { prev.current = saved; setCloud(cloudEnabled()); }).catch(() => setCloud(false)); }, 500);
    return () => clearTimeout(t); }, [saved]);
  useEffect(() => { if (view === "search" && !sub && home === null) fetch("/api/home").then((r) => r.json()).then(setHome).catch(() => setHome({ errors: ["trending", "latest"] })); }, [view, sub, home]);
  useEffect(() => { if (!sub) return; const from = years ? new Date().getFullYear() - years : ""; setLoading(true);
    const ctl = new AbortController();
    fetch(`/api/search?q=${encodeURIComponent(sub)}&from=${from}`, { signal: ctl.signal }).then((r) => r.json()).then(setData).catch(() => {}).finally(() => setLoading(false));
    return () => ctl.abort(); }, [sub, years]);

  const shown: Paper[] = useMemo(() => (data?.results || []).filter((p: Paper) => (kind === "all" || p.kind === kind) && (!oa || p.pdf) && (!toYear || !p.year || p.year <= toYear)), [data, kind, oa, toYear]);
  const ordered: Paper[] = useMemo(() => sort === "rel" ? shown : [...shown].sort((a, b) => sort === "new" ? (b.year ?? 0) - (a.year ?? 0) : (b.citations ?? 0) - (a.citations ?? 0)), [shown, sort]);
  const hl = (txt: string) => { const ws = (data?.terms || []).filter((w: string) => w.length > 2).map((w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")); if (!ws.length) return txt; return txt.split(new RegExp(`(${ws.join("|")})`, "gi")).map((x, i) => i % 2 ? <mark key={i}>{x}</mark> : x); };
  const runAdv = (o: AdvOut) => { setQ(o.q); setKind(o.kind); setOa(o.oa); setYears(o.from ? Math.max(1, new Date().getFullYear() - o.from) : 0); setToYear(o.to); setAdv(false); setSub(o.q); };
  const submit = (e: React.FormEvent) => { e.preventDefault(); if (q.trim()) setSub(q.trim()); };
  const toggle = (p: Paper) => setSaved((s) => (s.some((x) => x.id === p.id) ? s.filter((x) => x.id !== p.id) : [...s, p]));
  const box = (
    <form className="search" onSubmit={submit}>
      <input ref={input} type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.ph} aria-label={t.ph} />
      <button className="go">{t.go}</button>
    </form>);

  return (<div id="root">
    <header>
      <span className="logo"><Logo />APHELION</span>
      <nav className="nav">{(["search", "missions", "objects", "orbits", "saved"] as const).map((k) => <button key={k} className={view === k ? "on" : ""} onClick={() => { setView(k); setOpen(null); }}>{v[k]}</button>)}</nav>{view === "search" && sub && box}<span className="sp" />
      <span className="meta">{t.saved_n}: {saved.length}</span>
      <span className="lang"><button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>EN</button>|<button className={lang === "ar" ? "on" : ""} onClick={() => setLang("ar")}>العربية</button></span>
    </header>
    {view === "missions" || view === "objects" ? <Explore kind={view} lang={lang} onSearch={goSearch} /> : view === "orbits" ? <Orbits lang={lang} /> : view === "saved" ? <SavedView lang={lang} saved={saved} setSaved={setSaved} onOpen={(p) => { setOpen(p); setView("search"); }} /> : open ? <Detail p={open} lang={lang} onBack={() => setOpen(null)} onSearch={goSearch} onSave={() => toggle(open)} isSaved={saved.some((x) => x.id === open.id)} /> : !sub ? (<><main className="hero"><span className="coord">α 00h 00m · δ +00° 00′</span><h1>{t.h}</h1>{box}
      <span className="meta">arXiv · OpenAlex · Crossref · SIMBAD · NASA ADS · AND OR NOT "exact phrase" ( )</span>
      <button className="chip" onClick={() => setAdv(!adv)}>{t.adv}</button>
      {adv && <Advanced lang={lang} onSubmit={runAdv} onClose={() => setAdv(false)} />}</main>
      <HomeFeeds lang={lang} data={home} onOpen={setOpen} onSearch={goSearch} /></>) : (
    <main className="layout">
      <aside>
        <button className="chip" style={{ marginBottom: 14 }} onClick={() => setAdv(!adv)}>{t.adv}</button>
        <h4>{t.type}</h4>
        {(["all", "journal", "preprint"] as const).map((k) => <label key={k}><input type="radio" checked={kind === k} onChange={() => setKind(k)} /> {t[k]}</label>)}
        <h4 style={{ marginTop: 18 }}>{t.date}</h4>
        <select value={years} onChange={(e) => { setYears(+e.target.value); setToYear(0); }}><option value={0}>{t.any}</option>{![0, 1, 5, 10].includes(years) && <option value={years}>{t.since} {new Date().getFullYear() - years}</option>}<option value={1}>{t.y1}</option><option value={5}>{t.y5}</option><option value={10}>{t.y10}</option></select>
        <h4 style={{ marginTop: 18 }}>PDF</h4>
        <label><input type="checkbox" checked={oa} onChange={(e) => setOa(e.target.checked)} /> {t.oa}</label>
        <Ask lang={lang} papers={shown} qs={askQs(lang).slice(0, 1)} />
      </aside>
      <section>
        {adv && <Advanced lang={lang} onSubmit={runAdv} onClose={() => setAdv(false)} />}
        {loading && [0, 1, 2, 3].map((i) => <div className="skel" key={i} />)}
        {!loading && data?.rejected && <p className="note">{data.didYouMean && <>{t.dym}: <a href="#" onClick={(e) => { e.preventDefault(); goSearch(data.didYouMean); }}>{data.didYouMean}</a>?<br /></>}{t.reject}</p>}
        {!loading && data && !data.rejected && (<>
          <p className="meta">{shown.length} {t.count}{data.searchedAs ? ` · ${t.asAs}: “${data.searchedAs}”` : ""} · {t.rank}</p>
          {data.didYouMean && shown.length < 5 && <p className="note">{t.dym}: <a href="#" onClick={(e) => { e.preventDefault(); goSearch(data.didYouMean); }}>{data.didYouMean}</a>?</p>}
          <p className="meta">{t.sort}: <select value={sort} onChange={(e) => setSort(e.target.value as any)} style={{ padding: ".2rem .4rem" }}><option value="rel">{t.rel}</option><option value="new">{t.new}</option><option value="cited">{t.cited}</option></select></p>
          {data.errors?.map((e: string) => <p className="note" key={e}>{t.err}: {e}</p>)}
          {!shown.length && !data.errors?.length && <p className="note">{t.none}</p>}
          {ordered.map((p) => (<article className="res" key={p.id}>
            <h3 dir="auto"><a href={p.url} target="_blank" rel="noreferrer">{hl(p.title)}</a></h3>
            <div className="meta" dir="auto">{p.authors.slice(0, 5).join(", ")}{p.authors.length > 5 ? " …" : ""} · {p.year ?? "—"} · {p.venue || "—"}{p.citations != null ? ` · ${p.citations} ${t.cites}` : ""}</div>
            <p className="abs" dir="auto">{p.abstract ? hl(p.abstract.slice(0, 340) + (p.abstract.length > 340 ? "…" : "")) : t.noAbs}</p>
            <div><span className={"tag" + (p.kind === "preprint" ? " pre" : "")}>{t[p.kind]}</span>
              {p.sources.map((s) => <span className="tag" key={s}>{s}</span>)}{p.doi && <span className="tag" dir="ltr">DOI {p.doi}</span>}</div>
            <div className="acts"><a href={p.url} target="_blank" rel="noreferrer">{t.read}</a>
              {p.pdf && <a href={p.pdf} target="_blank" rel="noreferrer">{t.pdf}</a>}
              <button onClick={() => setOpen(p)}>{v.detail}</button>
              <button onClick={() => toggle(p)}>{saved.some((x) => x.id === p.id) ? t.saved : t.save}</button></div>
          </article>))}{data.related?.length > 0 && <div style={{ marginTop: 18 }}><h4 className="meta">{t.relS}</h4><div className="chips">{data.related.map((r: string) => <button key={r} className="chip" onClick={() => goSearch(r)}>{r}</button>)}</div></div>}</>)}
      </section>
    </main>)}
  </div>);
}
