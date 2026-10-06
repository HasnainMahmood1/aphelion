import { NextRequest, NextResponse } from "next/server";
export async function POST(req: NextRequest) {
  const { question, papers, lang } = await req.json();
  const model = process.env.OLLAMA_MODEL;
  if (!model) return NextResponse.json({ configured: false });
  const ctx = (papers || []).slice(0, 6).map((p: any, i: number) => `[${i + 1}] ${p.title}\n${p.abstract || "(no abstract)"}`).join("\n\n");
  try {
    const r = await fetch(`${process.env.OLLAMA_URL || "http://localhost:11434"}/api/chat`, {
      method: "POST", signal: AbortSignal.timeout(120000),
      body: JSON.stringify({ model, stream: false, messages: [
        { role: "system", content: `You are a space-science research assistant. Use ONLY the numbered sources. Cite as [n]. If they do not contain the answer, say so. You only have abstracts, never full texts. Reply in ${lang === "ar" ? "Modern Standard Arabic" : "English"}.` },
        { role: "user", content: `${ctx}\n\nQuestion: ${String(question).slice(0, 300)}` }] }) });
    const j = await r.json();
    return NextResponse.json({ answer: j.message?.content, error: j.message ? undefined : "no answer" });
  } catch (e) { return NextResponse.json({ error: String(e) }); }
}
