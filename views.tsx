"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { Paper } from "@/lib/adapters";
import { cloudEnabled } from "@/lib/store";
const Scene = dynamic(() => import("./orbit3d"), { ssr: false, loading: () => <div className="skel" style={{ height: 420 }} /> });
type L = "en" | "ar";
export const V = {
  en: { search: "Search", missions: "Missions", objects: "Space Objects", orbits: "Solar System", saved: "Saved", detail: "Details", back: "Back", related: "Related papers", assistant: "Research assistant (local model)",
    basis: "Answers use only the retrieved abstracts, never full texts.", noai: "Not configured. Install Ollama and set OLLAMA_MODEL in .env.local (see README). Search works without it.", aierr: "The local model could not be reached.",
    summ: "Summarize", method: "Methodology", find: "Main findings", limit: "Limitations", g10: "Explain for Grade 10", ph: "Search a mission or object…", go: "Search",
    src: "Background from Wikipedia. Verify scientific claims with NASA, ESA or the papers. Mission status is not live.", exo: "NASA Exoplanet Archive matches", nf: "Information could not be verified.",
    rej: "This search engine is specialized in space science and exploration. Try searching for planets, spacecraft, astronomy, astrophysics, satellites, missions, or space research.",
    orb: "Illustrative 3D model: circular, coplanar orbits, radius scaled by √distance, planet sizes not to scale, not real-time positions. Distances and periods are standard values. Drag to rotate, scroll or pinch to zoom.", empty: "Nothing saved yet.", note: "Notes", coll: "Collection", rm: "Remove",
    abs: "Abstract", auth: "Authors", pub: "Published", nofull: "Only the abstract was retrieved; the full text was not read.", open: "Open source", pdf: "PDF", cites: "citations", trend: "Trending research", trendSub: "Most-cited papers published in the past two years (OpenAlex).", latest: "Latest discoveries", latestSub: "Newest astrophysics preprints on arXiv — not peer-reviewed.", newPl: "Recently released exoplanets", newPlSub: "NASA Exoplanet Archive, by release date.", feedFail: "Could not load this section right now.", cloud: "Saved items sync to your database.", localOnly: "Saved items are stored in this browser only." },
  ar: { search: "بحث", missions: "المهام", objects: "الأجرام الفضائية", orbits: "النظام الشمسي", saved: "المحفوظات", detail: "التفاصيل", back: "رجوع", related: "أبحاث ذات صلة", assistant: "المساعد البحثي (نموذج محلي)",
    basis: "تعتمد الإجابات على الملخصات المسترجعة فقط وليس على النصوص الكاملة.", noai: "غير مُعدّ. ثبّت Ollama واضبط OLLAMA_MODEL في ملف .env.local (انظر README). البحث يعمل بدونه.", aierr: "تعذّر الوصول إلى النموذج المحلي.",
    summ: "لخّص", method: "المنهجية", find: "أبرز النتائج", limit: "القيود", g10: "اشرحه لطالب الصف العاشر", ph: "ابحث عن مهمة أو جرم فضائي…", go: "بحث",
    src: "معلومات خلفية من ويكيبيديا. تحقق من الادعاءات العلمية عبر ناسا أو وكالة الفضاء الأوروبية أو الأبحاث. حالة المهمة ليست مباشرة.", exo: "نتائج من أرشيف ناسا للكواكب الخارجية", nf: "تعذّر التحقق من المعلومات.",
    rej: "محرك البحث هذا متخصص في علوم الفضاء واستكشافه. جرّب البحث عن الكواكب أو المركبات الفضائية أو علم الفلك أو الفيزياء الفلكية أو الأقمار الصناعية أو المهام أو الأبحاث الفضائية.",
    orb: "نموذج ثلاثي الأبعاد توضيحي: مدارات دائرية في مستوى واحد بنصف قطر متناسب مع الجذر التربيعي للمسافة، وأحجام الكواكب غير متناسبة، وليست مواقع آنية. المسافات والدورات قيم معيارية. اسحب للتدوير وكبّر بالتمرير أو بالقرص.", empty: "لا توجد عناصر محفوظة.", note: "ملاحظات", coll: "المجموعة", rm: "إزالة",
    abs: "الملخص", auth: "المؤلفون", pub: "سنة النشر", nofull: "تم استرجاع الملخص فقط ولم تتم قراءة النص الكامل.", open: "فتح المصدر", pdf: "PDF", cites: "استشهاد", trend: "أبحاث رائجة", trendSub: "الأبحاث الأكثر استشهادًا ضمن آخر سنتين (OpenAlex).", latest: "أحدث الاكتشافات", latestSub: "أحدث النسخ الأولية في الفيزياء الفلكية على arXiv — غير محكّمة.", newPl: "كواكب خارجية أُضيفت حديثًا", newPlSub: "أرشيف ناسا للكواكب الخارجية، حسب تاريخ الإصدار.", feedFail: "تعذّر تحميل هذا القسم الآن.", cloud: "تتم مزامنة المحفوظات مع قاعدة بياناتك.", localOnly: "تُحفظ العناصر في هذا المتصفح فقط." },
} as const;
const PM = [["Voyager 1", "فوياجر 1"], ["James Webb Space Telescope", "تلسكوب جيمس ويب الفضائي"], ["Hubble Space Telescope", "تلسكوب هابل الفضائي"], ["Parker Solar Probe", "مسبار باركر الشمسي"], ["Curiosity (rover)", "كيوريوسيتي (مسبار)"], ["Europa Clipper", "يوروبا كليبر"], ["Artemis program", "برنامج أرتميس"]];
const PO = [["Mars", "المريخ"], ["Jupiter", "المشتري"], ["Saturn", "زحل"], ["Titan (moon)", "تيتان (قمر)"], ["Ceres (dwarf planet)", "سيريس (كوكب قزم)"], ["Halley's Comet", "مذنب هالي"], ["Andromeda Galaxy", "مجرة أندروميدا"], ["Crab Nebula", "سديم السرطان"], ["TRAPPIST-1", "ترابيست-1"]];

export function Ask({ lang, papers, qs }: { lang: L; papers: Paper[]; qs: [string, string][] }) {
  const v = V[lang]; const [a, setA] = useState(""); const [l, setL] = useState(false);
  const run = async (q: string) => { setL(true); setA("");
    try { const r = await fetch("/api/assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: q, lang, papers: papers.slice(0, 6).map((p) => ({ title: p.title, abstract: (p.abstract || "").slice(0, 900) })) }) });
      const j = await r.json(); setA(j.configured === false ? v.noai : j.error ? v.aierr : j.answer); } catch { setA(v.aierr); } setL(false); };
  return (<div style={{ marginTop: 18 }}><h4>{v.assistant}</h4><p className="meta">{v.basis}</p>
    <div className="chips">{qs.map(([lb, pr]) => <button key={lb} className="chip" disabled={l || !papers.length} onClick={() => run(pr)}>{lb}</button>)}</div>
    {l && <div className="skel" />}{a && <p className="note" dir="auto" style={{ whiteSpace: "pre-wrap" }}>{a}</p>}</div>);
}
export const askQs = (lang: L): [string, string][] => { const v = V[lang]; return [[v.summ, "Summarize the key points."], [v.method, "What methodology was used?"], [v.find, "What were the main findings?"], [v.limit, "What are the limitations?"], [v.g10, "Explain this to a Grade 10 student."]]; };

export function Explore({ kind, lang, onSearch }: { kind: "missions" | "objects"; lang: L; onSearch: (s: string) => void }) {
  const v = V[lang]; const [q, setQ] = useState(""); const [d, setD] = useState<any>(null); const [l, setL] = useState(false);
  useEffect(() => { setD(null); }, [kind]);
  const go = async (s: string, pre = false) => { if (!s.trim()) return; setQ(s); setL(true); setD(null);
    try { setD(await (await fetch(`/api/entity?q=${encodeURIComponent(s)}&lang=${lang}&pre=${pre ? 1 : 0}&exo=${kind === "objects" ? 1 : 0}`)).json()); } catch { setD({}); } setL(false); };
  return (<main className="wrap">
    <form className="search" onSubmit={(e) => { e.preventDefault(); go(q); }}><input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder={v.ph} /><button className="go">{v.go}</button></form>
    <div className="chips">{(kind === "missions" ? PM : PO).map(([e, a]) => <button key={e} className="chip" onClick={() => go(lang === "ar" ? a : e, true)}>{lang === "ar" ? a : e}</button>)}</div>
    {l && <div className="skel" />}
    {d?.rejected && <p className="note">{v.rej}</p>}
    {d && !d.rejected && !d.title && !d.planets?.length && <p className="note">{v.nf}</p>}
    {d?.title && <article className="res">{d.thumb && <img src={d.thumb} alt="" className="thumb" />}<h3 dir="auto">{d.title}</h3><div className="meta" dir="auto">{d.description}</div><p className="abs" dir="auto">{d.extract}</p>
      <span className="tag">Wikipedia</span><div className="acts"><a href={d.url} target="_blank" rel="noreferrer">{v.open}</a><button onClick={() => onSearch(d.title)}>{v.related}</button></div><p className="meta">{v.src}</p></article>}
    {d?.planets?.length > 0 && <div><h4 className="meta">{v.exo}</h4><div style={{ overflowX: "auto" }}><table><thead><tr>{["Planet", "Host", "Year", "Method", "R⊕", "M⊕", "P (d)", "pc"].map((h) => <th key={h}>{h}</th>)}</tr></thead>
      <tbody>{d.planets.map((r: any) => <tr key={r.pl_name} dir="ltr">{["pl_name", "hostname", "disc_year", "discoverymethod", "pl_rade", "pl_bmasse", "pl_orbper", "sy_dist"].map((k) => <td key={k}>{r[k] ?? "—"}</td>)}</tr>)}</tbody></table></div><span className="tag">NASA Exoplanet Archive</span></div>}
  </main>);
}

export function Orbits({ lang }: { lang: L }) {
  return <main className="wrap"><Scene lang={lang} /><p className="note">{V[lang].orb}</p></main>;
}

export function Detail({ p, lang, onBack, onSearch, onSave, isSaved }: { p: Paper; lang: L; onBack: () => void; onSearch: (s: string) => void; onSave: () => void; isSaved: boolean }) {
  const v = V[lang];
  return (<main className="wrap"><div className="acts"><button onClick={onBack}>← {v.back}</button></div>
    <h2 dir="auto" style={{ margin: 0, fontWeight: 500 }}>{p.title}</h2>
    <div className="meta" dir="auto">{v.auth}: {p.authors.join(", ")} · {v.pub}: {p.year ?? "—"} · {p.venue || "—"}{p.citations != null ? ` · ${p.citations}` : ""}</div>
    <div>{p.sources.map((s) => <span className="tag" key={s}>{s}</span>)}{p.doi && <span className="tag" dir="ltr">DOI {p.doi}</span>}</div>
    <h4 className="meta">{v.abs}</h4><p className="abs" dir="auto">{p.abstract || "—"}</p>
    <div className="acts"><a href={p.url} target="_blank" rel="noreferrer">{v.open}</a>{p.pdf && <a href={p.pdf} target="_blank" rel="noreferrer">{v.pdf}</a>}<button onClick={() => onSearch(p.title)}>{v.related}</button><button onClick={onSave}>{isSaved ? "✓" : "+"}</button></div>
    <p className="meta">{v.nofull}</p><Ask lang={lang} papers={[p]} qs={askQs(lang)} /></main>);
}

export function SavedView({ lang, saved, setSaved, onOpen }: { lang: L; saved: Paper[]; setSaved: (f: (s: Paper[]) => Paper[]) => void; onOpen: (p: Paper) => void }) {
  const v = V[lang]; const cloud = cloudEnabled(); const upd = (id: string, k: "note" | "coll", val: string) => setSaved((s) => s.map((p) => (p.id === id ? { ...p, [k]: val } : p)));
  const list = [...saved].sort((a, b) => (a.coll || "").localeCompare(b.coll || ""));
  return (<main className="wrap"><p className="meta">{cloud ? v.cloud : v.localOnly}</p>{!list.length && <p className="note">{v.empty}</p>}{list.map((p) => (<article className="res" key={p.id}>
    <h3 dir="auto"><a href="#" onClick={(e) => { e.preventDefault(); onOpen(p); }}>{p.title}</a></h3><div className="meta" dir="auto">{p.authors.slice(0, 3).join(", ")} · {p.year ?? "—"}</div>
    <input type="text" placeholder={v.coll} value={p.coll || ""} onChange={(e) => upd(p.id, "coll", e.target.value)} style={{ marginInlineEnd: 8, marginBlock: 6 }} />
    <input type="text" placeholder={v.note} value={p.note || ""} onChange={(e) => upd(p.id, "note", e.target.value)} style={{ width: "min(420px,100%)" }} />
    <div className="acts"><button onClick={() => setSaved((s) => s.filter((x) => x.id !== p.id))}>{v.rm}</button></div></article>))}</main>);
}

export function HomeFeeds({ lang, data, onOpen, onSearch }: { lang: L; data: any; onOpen: (p: Paper) => void; onSearch: (s: string) => void }) {
  const v = V[lang];
  const list = (ps: Paper[]) => ps.map((p) => (<div className="hitem" key={p.id}>
    <a href="#" dir="auto" onClick={(e) => { e.preventDefault(); onOpen(p); }}>{p.title}</a>
    <div className="meta" dir="auto">{p.authors.slice(0, 3).join(", ")}{p.authors.length > 3 ? " …" : ""} · {p.year ?? "—"}{p.citations != null ? ` · ${p.citations} ${v.cites}` : ""}</div></div>));
  const failed = (k: string) => data?.errors?.includes(k);
  return (<section className="home">
    <div><h4>{v.trend}</h4><p className="meta">{v.trendSub}</p>
      {!data && [0, 1, 2].map((i) => <div className="skel" key={i} />)}
      {data && (failed("trending") ? <p className="note">{v.feedFail}</p> : list(data.trending || []))}</div>
    <div><h4>{v.latest}</h4><p className="meta">{v.latestSub}</p>
      {!data && [0, 1, 2].map((i) => <div className="skel" key={i} />)}
      {data && (failed("latest") ? <p className="note">{v.feedFail}</p> : list(data.latest || []))}
      {data?.planets?.length > 0 && <><h4 style={{ marginTop: 18 }}>{v.newPl}</h4><p className="meta">{v.newPlSub}</p>
        <div className="chips" dir="ltr">{data.planets.map((r: any) => <button key={r.pl_name} className="chip" title={`${r.hostname} · ${r.disc_year} · ${r.discoverymethod}`} onClick={() => onSearch(r.pl_name + " exoplanet")}>{r.pl_name}</button>)}</div></>}</div>
  </section>);
}
