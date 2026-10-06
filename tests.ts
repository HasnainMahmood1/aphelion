import { normalizeQuery, isSpaceQuery } from "../lib/space";
import { parseArxiv, parseOpenAlex } from "../lib/adapters";
import { buildQuery } from "../app/advanced";
let pass=0, fail=0;
const ok=(n:string,c:boolean,x?:any)=>{c?pass++:fail++; console.log((c?"PASS ":"FAIL ")+n+(c?"":"  -> "+JSON.stringify(x)));};

// Arabic normalisation
const N=(s:string)=>normalizeQuery(s);
ok("ar: ثقب أسود", N("ثقب أسود").trim()==="black hole", N("ثقب أسود"));
ok("ar: الثقوب السوداء", /black holes/.test(N("الثقوب السوداء")), N("الثقوب السوداء"));
ok("ar: كواكب خارج المجموعة الشمسية", /exoplanets/.test(N("كواكب خارج المجموعة الشمسية")), N("كواكب خارج المجموعة الشمسية"));
ok("ar: تلسكوب جيمس ويب", /James Webb/.test(N("تلسكوب جيمس ويب")), N("تلسكوب جيمس ويب"));
ok("ar: سديم الجبار (Orion)", /Orion/i.test(N("سديم الجبار")), N("سديم الجبار"));
ok("ar: الماء على المريخ", /water/.test(N("الماء على المريخ"))&&/Mars/.test(N("الماء على المريخ")), N("الماء على المريخ"));
ok("ar: المريخ and word 'على'", !/[\u0600-\u06FF]/.test(N("أبحاث عن المريخ")), N("أبحاث عن المريخ"));
ok("ar: بحث عن الثقوب السوداء in EN-only mixed", !/[\u0600-\u06FF]/.test(N("black holes الجبار")), N("black holes الجبار"));
// Space filter: should accept
for (const q of ["Mars rover","black holes","James Webb","exoplanet atmospheres","Crab Nebula","TRAPPIST-1","Europa Clipper","Betelgeuse","Andromeda Galaxy","Sagittarius A*","Halley's Comet","pulsar timing array","Proxima Centauri","Oumuamua","SpaceX Starship","lunar regolith","Sun corona","Perseverance"])
  ok("accept: "+q, isSpaceQuery(N(q)));
// Should reject
for (const q of ["Hilbert space operators","molecular orbital theory","solar panel efficiency","neutron scattering","mercury poisoning","banana bread","stock market","sun cream","rover mobile app","machine learning","Gaia hypothesis ecology","juno film","Kepler conjecture"])
  ok("reject: "+q, !isSpaceQuery(N(q)), "wrongly accepted");

// buildQuery
ok("buildQuery all", buildQuery({all:"mars water",phrase:"",any:"",none:""})==="mars water");
ok("buildQuery full", buildQuery({all:"mars",phrase:"ice cap",any:"water ice",none:"rover"})==='mars "ice cap" (water OR ice) NOT rover', buildQuery({all:"mars",phrase:"ice cap",any:"water ice",none:"rover"}));
ok("buildQuery empty", buildQuery({all:"",phrase:"",any:"",none:"x"})==="");

// arXiv parse
const xml=`<feed><entry><id>http://arxiv.org/abs/2401.00001v1</id><published>2024-01-01T00:00:00Z</published><title>Dark   matter &amp; halos
 in galaxies</title><summary> We study &lt;b&gt;x&lt;/b&gt;. </summary><author><name>A One</name></author><author><name>B Two</name></author><link title="pdf" href="http://arxiv.org/pdf/2401.00001v1" rel="related" type="application/pdf"/><arxiv:doi>10.1/abc</arxiv:doi></entry></feed>`;
const a=parseArxiv(xml)[0];
ok("arxiv: fields", a.authors.length===2 && a.year===2024 && a.doi==="10.1/abc" && !!a.pdf, a);
ok("arxiv: html entities decoded in title", !/&amp;/.test(a.title), a.title);
ok("arxiv: html entities decoded in abstract", !/&lt;/.test(a.abstract||""), a.abstract);
ok("arxiv: year filter", parseArxiv(xml,2025).length===0);
// arXiv multi-author with affiliation tag
const xml2=xml.replace("<name>A One</name>","<name>A One</name><arxiv:affiliation>MIT</arxiv:affiliation>");
ok("arxiv: author w/ affiliation", parseArxiv(xml2)[0].authors.includes("A One"), parseArxiv(xml2)[0].authors);

// OpenAlex parse
const oa=parseOpenAlex([{id:"https://openalex.org/W1",title:"JWST view",doi:"https://doi.org/10.2/x",publication_year:2023,cited_by_count:50,
 abstract_inverted_index:{"We":[0],"observe":[1],"stars":[2]},authorships:[{author:{display_name:"Z"}}],primary_location:{source:{type:"journal",display_name:"ApJ"}},open_access:{oa_url:"https://x/y.pdf"}},
 {id:"W2",title:"Prepr",primary_location:{source:{type:"repository",display_name:"arXiv"}}},{id:"W3",title:null}]);
ok("openalex: parse+filter", oa.length===2 && oa[0].abstract==="We observe stars" && oa[0].kind==="journal" && oa[1].kind==="preprint", oa);
ok("openalex: no source -> kind", parseOpenAlex([{id:"W4",title:"x",primary_location:null}])[0].kind==="journal", "");

// ---- merge / rank / boolean ----
import { merge, rank, parseBool, key } from "../lib/rank";
const P=(o:any)=>({id:"x",title:"T",authors:[],url:"u",kind:"journal",sources:["A"],...o});
const m=merge([P({id:"1",title:"Dark Matter Halos",kind:"preprint",sources:["arXiv"],citations:5}),P({id:"2",title:"Dark matter halos.",doi:"10.1/z",citations:40,sources:["OpenAlex"]})]);
ok("merge: preprint + journal version merge", m.length===1 && m[0].doi==="10.1/z" && m[0].citations===40 && m[0].sources.length===2, m);
ok("merge: non-Latin titles not collapsed", merge([P({id:"1",title:"ثقوب سوداء"}),P({id:"2",title:"مجرات بعيدة"})]).length===2);
ok("merge: citations take max", merge([P({title:"A b",citations:90}),P({title:"A b",citations:3})])[0].citations===90);
const b=parseBool('mars NOT rover "ice cap" NOT "sample return"');
ok("parseBool negs", JSON.stringify(b.negs)===JSON.stringify(["rover","sample return"]), b);
ok("parseBool terms exclude negated", !b.terms.includes("rover") && b.terms.includes("mars"), b.terms);
ok("parseBool phrases", JSON.stringify(b.phrases)===JSON.stringify(["ice cap"]), b.phrases);
const hi=rank(P({title:"mars ice",abstract:"mars ice",year:2024,citations:100}),["mars","ice"]), lo=rank(P({title:"unrelated",year:2000}),["mars","ice"]);
ok("rank: relevant > unrelated", hi>lo, [hi,lo]);
// Crossref plain-text flattening isn't exported; check the abort-signal bug is gone
import { readFileSync } from "fs";
ok("entity: timeout signal created per request", /const opt = \(\) =>/.test(readFileSync("app/api/entity/route.ts","utf8")));

// ---- v2: ranking, fuzzy dedupe, spelling, related, topic filters ----
import { correct, related, synonymsOf, osa } from "../lib/expand";
import { onTopicArxiv, onTopicOpenAlex } from "../lib/adapters";
ok("osa swap", osa("blakc","black")===1);
ok("correct: blakc holes", correct("blakc holes")==="black holes", correct("blakc holes"));
ok("correct: exoplanat", correct("exoplanat atmospheres")==="exoplanet atmospheres", correct("exoplanat atmospheres"));
ok("correct: leaves valid words", correct("Mars rover atmosphere formation")==="Mars rover atmosphere formation", correct("Mars rover atmosphere formation"));
ok("correct: leaves operators", correct("mars NOT rover")==="mars NOT rover");
ok("didyoumean rescues rejected query", isSpaceQuery(correct("blakc hole"))&&!isSpaceQuery("blakc hole"), correct("blakc hole"));
ok("synonyms JWST", synonymsOf("jwst").includes("james webb"));
ok("synonyms plural", synonymsOf("exoplanets").includes("extrasolar planet"));
const jw=P({title:"Observations of WASP-39b with the James Webb Space Telescope",abstract:"transit spectra",year:2023,citations:200});
const ot=P({title:"A study of tides",abstract:"nothing",year:2023,citations:200});
ok("rank: acronym JWST matches 'James Webb'", rank(jw,["jwst"])>rank(ot,["jwst"])+0.2, [rank(jw,["jwst"]),rank(ot,["jwst"])]);
ok("rank: plural/stem matches", rank(P({title:"Galaxy formation",year:2020}),["galaxies"])>rank(P({title:"Other",year:2020}),["galaxies"]), "");
const ph=rank(P({title:"black holes in dwarf galaxies",year:2020}),["black","holes"],"black holes"), np=rank(P({title:"holes and black matter",year:2020}),["black","holes"],"black holes");
ok("rank: exact phrase bonus", ph>np, [ph,np]);
const young=rank(P({title:"mars",year:new Date().getFullYear()-2,citations:300}),["mars"]), old=rank(P({title:"mars",year:new Date().getFullYear()-25,citations:300}),["mars"]);
ok("rank: age-normalised citations", young>old, [young,old]);
ok("merge: fuzzy near-identical titles", merge([P({id:"1",title:"Constraints on dark matter from the Milky Way satellites: a new analysis",year:2022,kind:"preprint",sources:["arXiv"]}),P({id:"2",title:"Constraints on Dark Matter from the Milky-Way Satellites – A New Analysis",year:2023,doi:"10.9/q",sources:["OpenAlex"]})]).length===1);
ok("merge: different papers stay separate", merge([P({id:"1",title:"Dark matter in dwarf galaxies",year:2022}),P({id:"2",title:"Dark energy in massive galaxy clusters",year:2022})]).length===2);
ok("arxiv topic: astro-ph kept", onTopicArxiv(P({cat:"astro-ph.GA",title:"Foo bar baz"})));
ok("arxiv topic: cs.LG 'space' dropped", !onTopicArxiv(P({cat:"cs.LG",title:"Latent space models",abstract:"embedding space"})));
ok("arxiv topic: cs.CV with space telescope kept", onTopicArxiv(P({cat:"cs.CV",title:"Deep learning for space telescope images"})));
ok("openalex topic: AI paper dropped", !onTopicOpenAlex({title:"Orbit embeddings",primary_topic:{subfield:{display_name:"Artificial Intelligence"},field:{display_name:"Computer Science"}}}));
ok("openalex topic: astronomy kept", onTopicOpenAlex({title:"NGC 1275 jets",primary_topic:{subfield:{display_name:"Astronomy and Astrophysics"},field:{display_name:"Physics and Astronomy"}}}));
ok("openalex topic: no topic -> kept", onTopicOpenAlex({title:"x"}));
const rel=related("mars",["Dust storms and the atmosphere of Mars from a rover","Mars atmosphere and ice","Water ice at Mars poles"]);
ok("related: suggests phrases not in query", rel.length>0 && !rel.includes("Mars"), rel);

console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
