// Space-only validation + Arabic->English query normalisation.
// Add terms to TERMS as "arabic|english", one per line, in base (indefinite) form:
// the matcher already tolerates the "ال" prefix, clitics (و ف ب ل ك), hamza/ya/ta-marbuta spelling variants and diacritics.
// An empty English side deletes the word (stopword).
const TERMS = `
المجموعة الشمسية|solar system
شمس|Sun
شمسي|solar
شمسية|solar
رياح شمسية|solar wind
عواصف شمسية|solar storms
توهج شمسي|solar flare
توهجات شمسية|solar flares
بقع شمسية|sunspots
كلف شمسي|sunspots
اكليل شمسي|solar corona
انبعاث كتلي اكليلي|coronal mass ejection
غلاف شمسي|heliosphere
دورة شمسية|solar cycle
طقس فضائي|space weather
عطارد|Mercury
زهرة|Venus
ارض|Earth
مريخ|Mars
مريخي|Martian
مشتري|Jupiter
زحل|Saturn
اورانوس|Uranus
نبتون|Neptune
بلوتو|Pluto
قمر|Moon
قمري|lunar
قمرية|lunar
اقمار|moons
قمر صناعي|satellite
اقمار صناعية|satellites
تيتان|Titan
يوروبا|Europa
انسيلادوس|Enceladus
غانيميد|Ganymede
كاليستو|Callisto
تريتون|Triton
فوبوس|Phobos
ديموس|Deimos
شارون|Charon
كوكب|planet
كواكب|planets
كوكبي|planetary
كوكبية|planetary
كوكب قزم|dwarf planet
كواكب قزمة|dwarf planets
سيريس|Ceres
ايريس|Eris
كويكب|asteroid
كويكبات|asteroids
حزام الكويكبات|asteroid belt
حزام كايبر|Kuiper belt
سحابة اورت|Oort cloud
مذنب|comet
مذنبات|comets
شهاب|meteor
شهب|meteors
نيزك|meteorite
نيازك|meteorites
غبار كوني|cosmic dust
كواكب صخرية|rocky planets
عملاق غازي|gas giant
عمالقة غازية|gas giants
عملاق جليدي|ice giant
كوكب خارجي|exoplanet
كواكب خارجية|exoplanets
كوكب خارج المجموعة الشمسية|exoplanet
كواكب خارج المجموعة الشمسية|exoplanets
منطقة صالحة للسكن|habitable zone
صالح للسكن|habitable
صالحة للسكن|habitable
قابلية السكن|habitability
حياة خارج الارض|extraterrestrial life
حياة فضائية|extraterrestrial life
علم الاحياء الفلكي|astrobiology
بصمات حيوية|biosignatures
طريقة العبور|transit method
عبور كوكبي|planetary transit
سرعة شعاعية|radial velocity
تصوير مباشر|direct imaging
عدسة جاذبية|gravitational lensing
عدسات الجاذبية|gravitational lensing
غلاف جوي|atmosphere
مجال مغناطيسي|magnetic field
حقل مغناطيسي|magnetic field
نجم|star
نجوم|stars
نجمي|stellar
نجمية|stellar
نجم نيوتروني|neutron star
نجوم نيوترونية|neutron stars
نجم نابض|pulsar
نجوم نابضة|pulsars
نابض|pulsar
مستعر اعظم|supernova
مستعرات عظمى|supernovae
نوفا|nova
سديم الجبار|Orion Nebula
سديم السرطان|Crab Nebula
سديم|nebula
سدم|nebulae
عنقود نجمي|star cluster
عناقيد نجمية|star clusters
نجم ثنائي|binary star
نجوم ثنائية|binary stars
قزم احمر|red dwarf
قزم ابيض|white dwarf
قزم بني|brown dwarf
تطور نجمي|stellar evolution
تكون النجوم|star formation
تشكل النجوم|star formation
تكون الكواكب|planet formation
تشكل الكواكب|planet formation
رياح نجمية|stellar winds
قيفاويات|Cepheids
متغير قيفاوي|Cepheid variable
مجرة|galaxy
مجرات|galaxies
مجري|galactic
مجرية|galactic
درب التبانة|Milky Way
مجرة اندروميدا|Andromeda Galaxy
مجرة حلزونية|spiral galaxy
مجرات حلزونية|spiral galaxies
مجرة اهليلجية|elliptical galaxy
مجرات قزمة|dwarf galaxies
عنقود مجري|galaxy cluster
عناقيد مجرية|galaxy clusters
كوازار|quasar
كوازارات|quasars
نواة مجرية نشطة|active galactic nucleus
نوى مجرية نشطة|active galactic nuclei
ثقب اسود|black hole
ثقوب سوداء|black holes
ثقب اسود فائق الكتلة|supermassive black hole
ثقوب سوداء فائقة الكتلة|supermassive black holes
افق الحدث|event horizon
قرص التراكم|accretion disk
انفجار عظيم|Big Bang
انفجار كبير|Big Bang
اشعاع كوني خلفي|cosmic microwave background
خلفية كونية ميكروية|cosmic microwave background
تضخم كوني|cosmic inflation
توسع الكون|expansion of the universe
تمدد الكون|expansion of the universe
ثابت هابل|Hubble constant
ازاحة حمراء|redshift
انزياح احمر|redshift
شبكة كونية|cosmic web
بنية واسعة النطاق|large-scale structure
مادة مظلمة|dark matter
طاقة مظلمة|dark energy
موجات ثقالية|gravitational waves
موجات الجاذبية|gravitational waves
نسبية عامة|general relativity
نسبية خاصة|special relativity
جاذبية|gravity
جاذبية صغرى|microgravity
انعدام الوزن|weightlessness
اشعة كونية|cosmic rays
اشعة غاما|gamma rays
انفجارات اشعة غاما|gamma-ray bursts
انفجار اشعة غاما|gamma-ray burst
اشعة سينية|X-rays
اشعة تحت الحمراء|infrared
نيوترينو|neutrino
نيوترينوات|neutrinos
كون|universe
كوني|cosmic
كونية|cosmic
علم الكونيات|cosmology
علم الفلك|astronomy
فلك|astronomy
فلكي|astronomical
فلكية|astronomical
فيزياء فلكية|astrophysics
علوم الفضاء|space science
استكشاف الفضاء|space exploration
طيران فضائي|spaceflight
رحلات فضائية|spaceflight
رواد الفضاء|astronauts
رائد فضاء|astronaut
محطة الفضاء الدولية|International Space Station
محطة فضائية|space station
مكوك فضائي|space shuttle
فضاء سحيق|deep space
فضاء بين النجوم|interstellar space
بين النجوم|interstellar
بين المجرات|intergalactic
فضاء|space
فضائي|space
فضائية|space
علم الفلك الراديوي|radio astronomy
فلك راديوي|radio astronomy
تلسكوب|telescope
تلسكوبات|telescopes
مرصد فلكي|astronomical observatory
مرصد|observatory
مطيافية|spectroscopy
تحليل طيفي|spectroscopy
قياس الضوء|photometry
قياسات فلكية|astrometry
صاروخ|rocket
صواريخ|rockets
محرك صاروخي|rocket engine
وقود صاروخي|rocket propellant
دفع|propulsion
دفع ايوني|ion propulsion
محرك ايوني|ion engine
دفع كهربائي|electric propulsion
شراع شمسي|solar sail
صواريخ قابلة لاعادة الاستخدام|reusable rockets
مدار|orbit
مدار حول الارض|Earth orbit
مدار ارضي منخفض|low Earth orbit
مدار ثابت|geostationary orbit
هبوط على القمر|Moon landing
هبوط على المريخ|Mars landing
مسبار|spacecraft
مسبار فضائي|space probe
مركبة فضائية|spacecraft
مركبات فضائية|spacecraft
مركبة الهبوط|lander
مركبة جوالة|rover
مسبار جوال|rover
حطام فضائي|space debris
نفايات فضائية|space debris
درع حراري|heat shield
دخول جوي|atmospheric entry
اشعاع فضائي|space radiation
حماية من الاشعاع|radiation shielding
استعمار الفضاء|space colonization
موائل فضائية|space habitats
اتصالات فضائية|space communications
شبكة الفضاء العميق|Deep Space Network
ملاحة فضائية|space navigation
رصد الارض|Earth observation satellites
ناسا|NASA
وكالة الفضاء الاوروبية|ESA
ايسا|ESA
وكالة الفضاء الاماراتية|UAE Space Agency
وكالة الفضاء السعودية|Saudi Space Agency
هيئة الفضاء السعودية|Saudi Space Agency
وكالة الفضاء اليابانية|JAXA
جاكسا|JAXA
روسكوزموس|Roscosmos
وكالة الفضاء الصينية|China National Space Administration
مسبار الامل|Emirates Mars Mission Hope probe
المرصد الجنوبي الاوروبي|European Southern Observatory
التلسكوب الكبير جدا|Very Large Telescope
مرصد فيرا روبن|Vera C. Rubin Observatory
مصفوفة الكيلومتر المربع|Square Kilometre Array
جيمس ويب|James Webb
تلسكوب جيمس ويب|James Webb Space Telescope
هابل|Hubble
تلسكوب هابل|Hubble Space Telescope
كبلر|Kepler
تيس|TESS
غايا|Gaia
تشاندرا|Chandra
سبيتزر|Spitzer
فيرمي|Fermi
ليغو|LIGO
ليزا|LISA
فوياجر|Voyager
فويجر|Voyager
كاسيني|Cassini
جونو|Juno
مسبار باركر|Parker Solar Probe
نيو هورايزنز|New Horizons
روزيتا|Rosetta
هايابوسا|Hayabusa
اوسيريس ركس|OSIRIS-REx
كيوريوسيتي|Curiosity
بيرسيفيرنس|Perseverance
اوبورتيونيتي|Opportunity
انجينيويتي|Ingenuity
فايكنج|Viking
ارتميس|Artemis
برنامج ارتميس|Artemis program
ابولو|Apollo
سبيس اكس|SpaceX
ستارلينك|Starlink
ستارشيب|Starship
بلو اوريجين|Blue Origin
تشانغ اي|Chang'e
تيانقونغ|Tiangong
شنتشو|Shenzhou
تشاندرايان|Chandrayaan
مانجليان|Mangalyaan
ماء|water
مياه|water
جليد|ice
غاز|gas
غبار|dust
اكسجين|oxygen
هيدروجين|hydrogen
هيليوم|helium
ميثان|methane
ثاني اكسيد الكربون|carbon dioxide
براكين|volcanoes
ريغوليث|regolith
تربة قمرية|lunar regolith
تكون|formation
ذكاء اصطناعي|artificial intelligence
تعلم الالة|machine learning
تعلم عميق|deep learning
شبكات عصبية|neural networks
تحليل البيانات|data analysis
تاثير|effect
كتلة|mass
كثافة|density
درجة الحرارة|temperature
ابحاث|
بحوث|
بحث|
دراسة|
دراسات|
حول|
عن|
`;

// Letters only (no marks), used for word-boundary checks.
const AR_LETTER = "\\u0621-\\u064A";
const strip = (s: string) =>
  s.replace(/[\u064B-\u065F\u0670\u0640]/g, "").replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/ئ/g, "ي").replace(/ؤ/g, "و");

// Each Arabic word may carry the article "ال" and a one-letter clitic (و ف ب ل ك, or "لل") and must not touch other Arabic letters.
const RULES: [RegExp, string][] = (() => {
  const m = new Map<string, string>();
  for (const line of TERMS.split("\n")) {
    const i = line.indexOf("|"); if (i < 1) continue;
    m.set(strip(line.slice(0, i).trim()), line.slice(i + 1).trim());
  }
  return [...m.entries()].sort((a, b) => b[0].length - a[0].length).map(([k, en]) => {
    const body = k.split(/\s+/).join("\\s+(?:ال)?");
    return [new RegExp(`(?<![${AR_LETTER}])(?:لل|[وفبكل]?(?:ال)?)${body}(?![${AR_LETTER}])`, "g"), en] as [RegExp, string];
  });
})();

export function normalizeQuery(q: string): string {
  if (!/[\u0600-\u06FF]/.test(q)) return q.replace(/\s+/g, " ").trim();
  let s = strip(q)
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[«»]/g, '"').replace(/[،؛؟]/g, " ");
  for (const [re, en] of RULES) s = s.replace(re, () => ` ${en} `);
  s = s.replace(/\s+/g, " ").trim();
  // Unknown Arabic words would zero out the English sources, so drop them once something was translated.
  if (/[A-Za-z]/.test(s)) s = s.split(" ").filter((w) => !/[\u0600-\u06FF]/.test(w)).join(" ");
  return s;
}

// Two tiers: STRONG terms are unambiguous; WEAK terms (sun, orbit, space, mercury...) also occur outside astronomy,
// so they only count when no VETO phrase (Hilbert space, molecular orbital, solar panel...) is present.
const STRONG = /\b(astro\w*|exoplanet\w*|galax\w*|milky way|black holes?|spacecraft|spaceflight|outer space|space (science|exploration|telescopes?|missions?|weather|stations?|debris|travel|agency|probes?|radiation|physics|race|craft|shuttle)|planet\w*|nasa|esa|jaxa|roscosmos|jwst|james webb|hubble|voyager|artemis|apollo|telescopes?|cosmolog\w*|asteroids?|comets?|meteor\w*|pulsars?|magnetars?|neutron stars?|gravitational waves?|dark (matter|energy)|big bang|redshift|supermassive|quasars?|kuiper|oort|nebula\w*|supernova\w*|interstellar|intergalactic|heliosphere|microgravity|seti|universe|astronauts?|habitable zone|habitab\w*|biosignatures?|enceladus|ganymede|callisto|triton|phobos|deimos|charon|ceres|eris|pluto|uranus|neptune|tiangong|shenzhou|chandrayaan|starship|spacex|starlink|gamma.ray bursts?|cosmic microwave|vera rubin|event horizon|trappist\w*|betelgeuse|proxima|centauri|sirius|pleiades|andromeda|sagittarius a|oumuamua|\u2018oumuamua|\'oumuamua|gliese|kepler-\d+|psr [bj]\d+|bepicolombo|osiris-rex|hayabusa|rosetta|new horizons|parker solar probe|europa clipper|solar (system|wind|flares?|corona|cycle|eclipses?|activity|sail|storms?|physics|prominences?)|coronal mass)\b/i;
const WEAK = /\b(space|sun|solar|mars|martian|moons?|lunar|stars?|stellar|satellites?|rockets?|orbit(s|ing|al|ers?)?|mercury|venus|jupiter|saturn|rovers?|landers?|kepler|tess|gaia|chandra|spitzer|cassini|juno|perseverance|curiosity|europa|titan|neutron|gravitational|cosmic|propulsion|regolith|ion engines?|accretion)\b/i;
const VETO = /\b((hilbert|banach|vector|phase|latent|metric|state|feature|colou?r|sample|search|parameter|topological|euclidean|sobolev|function|probability|embedding|configuration|memory|disk|storage|work|living|parking|white|open) space|molecular orbitals?|atomic orbitals?|orbitals? (theory|hybridi[sz]ation)|poison\w*|toxic\w*|cream|sunscreen|sunburn|panels?|photovoltaic|solar (cells?|energy|power|farms?|panels?)|films?|hypothesis|conjecture|mobile app|app store|scattering|batter(y|ies)|stock market|neutron (activation|diffraction|imaging|radiography)|dating app)\b/i;
export const isStrongSpace = (t: string) => STRONG.test(t);
export const isSpaceQuery = (normalized: string) => STRONG.test(normalized) || (WEAK.test(normalized) && !VETO.test(normalized));

// English vocabulary derived from the term list, used for spelling suggestions and related searches.
export const PHRASES: string[] = [...new Set(TERMS.split("\n").filter((l) => l.includes("|")).map((l) => l.slice(l.indexOf("|") + 1).trim()).filter((e) => e.length >= 6))];
export const VOCAB = new Set<string>([...PHRASES.flatMap((e) => e.toLowerCase().match(/[a-z]+/g) || []).filter((w) => w.length >= 4),
  "telescope", "spectra", "spectrum", "observation", "observations", "survey", "simulation", "simulations", "detection", "formation", "evolution", "atmosphere", "atmospheric"]);
