'use strict';
// Pravi cist staticki deploy folder za marmis.rs (Vercel).
//
//   node _deploy-build.js                       -> _deploy/
//   node _deploy-build.js --domain https://x.rs -> drugi domen
//   node _deploy-build.js --out ../izlaz        -> drugi izlazni folder
//
// Sta radi:
//   1. kopira samo ono sto ide na server (bez backupa, izvornih slika, 3D izvora)
//   2. gasi tudju telemetriju (PostHog, Vercel Analytics, BotID, Sanity live)
//   3. brise potpis originalnog studija i njihov mejl iz poruke o gresci
//   4. pravi /images/xei5vqg0/production/ kopije iz media/ (za hosting bez
//      _local-server.js — vidi _README-mirror.md, "Kako slike stizu do browsera")
//   5. og:image i twitter:image pretvara u apsolutne URL-ove (skreperi to traze)
//   6. pise sitemap.xml sa punim URL-ovima, site.webmanifest kao fajl i vercel.json
//
// Svaka zakrpa se broji: ako se ne primeni tacno onoliko puta koliko se ocekuje,
// skripta puca. Tiha neuspela zakrpa je ovde jedini opasan ishod.

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;

function arg(name, fallback) {
  const i = process.argv.indexOf('--' + name);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const DOMAIN = arg('domain', 'https://marmis.rs').replace(/\/+$/, '');
const OUT = path.resolve(ROOT, arg('out', '_deploy'));

// ---------------------------------------------------------------- pomocno

let patched = 0;

function patch(text, find, replace, expect, label) {
  let count = 0;
  let out;
  if (find instanceof RegExp) {
    const re = new RegExp(find.source, find.flags.includes('g') ? find.flags : find.flags + 'g');
    out = text.replace(re, (...a) => { count++; return typeof replace === 'function' ? replace(...a) : replace; });
  } else {
    out = text.split(find);
    count = out.length - 1;
    out = out.join(replace);
  }
  if (count !== expect) {
    throw new Error(`zakrpa "${label}": ocekivano ${expect} pojavljivanja, naslo ${count}`);
  }
  patched++;
  return out;
}

function copyFile(rel, relOut) {
  const src = path.join(ROOT, rel);
  const dst = path.join(OUT, relOut || rel);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
}

function copyDir(rel, filter) {
  for (const entry of fs.readdirSync(path.join(ROOT, rel), { withFileTypes: true })) {
    const child = rel + '/' + entry.name;
    if (entry.isDirectory()) copyDir(child, filter);
    else if (!filter || filter(child)) copyFile(child);
  }
}

function readOut(rel) { return fs.readFileSync(path.join(OUT, rel), 'utf8'); }
function writeOut(rel, text) {
  const dst = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.writeFileSync(dst, text);
}

function dirSize(dir) {
  let total = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    total += e.isDirectory() ? dirSize(p) : fs.statSync(p).size;
  }
  return total;
}

// ---------------------------------------------------------------- 1. kopiranje

console.log('MARMIS deploy build -> ' + OUT);
console.log('domen: ' + DOMAIN + '\n');

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

copyFile('index.html');
copyFile('kontakt/index.html');
copyFile('registry/index.html');          // rezervno preusmerenje, uz vercel.json redirect
copyDir('_next');
copyDir('fonts');
copyDir('webgl');
// media/ se kopira tek posle koraka 4 — ono sto ide kroz /images/xei5vqg0/ ne
// sme da se salje dvaput (vidi dole).
copyDir('images');                        // images/registry/dress.png
copyDir('marmis', (f) => !f.startsWith('marmis/_alati/'));
for (const f of [
  'android-chrome-192x192.png', 'android-chrome-512x512.png', 'apple-touch-icon.png',
  'favicon-dark-16x16.png', 'favicon-dark-32x32.png',
  'favicon-light-16x16.png', 'favicon-light-32x32.png',
  'brand.svg', 'icons.svg', 'robots.txt',
]) copyFile(f);

// ---------------------------------------------------------------- 2. HTML

for (const page of ['index.html', 'kontakt/index.html']) {
  let s = readOut(page);

  // Potpis originalnog studija u konzoli. Stoji na dva mesta — u SSR <script> i u
  // RSC payload-u — i mora da nestane sa oba, inace ga React vrati posle hidracije.
  s = patch(s,
    /console\.log\((?:\\*")*%cDeveloped by plutot\.cool[\s\S]*?border-radius: 2px;\\*"\)/g,
    '', 2, page + ': potpis u konzoli');

  // og:image / twitter:image moraju biti apsolutni — Facebook, WhatsApp, Viber i
  // Twitter odbacuju relativne putanje. Opet oba mesta.
  if (page === 'index.html') {
    s = patch(s, /content="\/images\//g, 'content="' + DOMAIN + '/images/', 2, page + ': og:image SSR');
    s = patch(s, /\\"content\\":\\"\/images\//g, '\\"content\\":\\"' + DOMAIN + '/images/', 2, page + ': og:image RSC');
  }

  writeOut(page, s);
}

// ---------------------------------------------------------------- 3. JS chunkovi

{
  const f = '_next/static/chunks/0pfr5ypyk26l~.js';
  let s = readOut(f);

  // PostHog: init ostaje definisan, ali se nikad ne pozove.
  s = patch(s,
    '"requestIdleCallback"in window?window.requestIdleCallback(e,{timeout:3e3}):setTimeout(e,2e3)',
    'void e', 1, 'PostHog init');

  // Vercel BotID: stitio je /checkout koja u ovoj kopiji ne postoji. Sa praznom
  // listom zakrpa nad fetch/XHR postaje prolaz, a /149e9513-.../ se ne ucitava.
  s = patch(s,
    '({protect:[{path:"/checkout",method:"POST"}]})',
    '({protect:[]})', 1, 'Vercel BotID');

  writeOut(f, s);
}

{
  const f = '_next/static/chunks/0hk_b7xgkd4m6.js';
  let s = readOut(f);

  // Vercel Web Analytics: ubacivac skripte izlazi odmah. useEffect ostaje na
  // mestu, pa je broj hook-ova nepromenjen i hidracija prolazi.
  s = patch(s,
    '!function(e={debug:!0}){var t;if(!o())return;',
    '!function(e={debug:!0}){var t;if(!0)return;', 1, 'Vercel Analytics');

  writeOut(f, s);
}

{
  const f = '_next/static/chunks/02unrdx1lxkac.js';
  let s = readOut(f);

  // Sanity live events: pretplata na tudji CMS (xei5vqg0) koja svaki put pada na
  // CORS i ponavlja se u petlji. useEffect ostaje, telo se prazni.
  s = patch(s,
    '(0,rc.useEffect)(()=>{let e=v.live.events({includeDrafts:!!a,tag:g}).subscribe({next:R,error:e=>{y(e)}});return()=>e.unsubscribe()},[v.live,y,g,a])',
    '(0,rc.useEffect)(()=>{},[v.live,y,g,a])', 1, 'Sanity live events');

  // Isti komponent je na svaki povratak na tab i na svako vracanje mreze zvao
  // router.refresh(). Na statickom hostingu RSC payload ne postoji, pa je svaki
  // takav poziv povlacio ceo HTML (~145 kB) i odbacivao ga. Obe zastavice stizu
  // kao $undefined iz RSC-a, pa je dovoljno oboriti podrazumevane vrednosti.
  s = patch(s,
    'refreshOnFocus:f=!c&&("u"<typeof window||window.self===window.top),refreshOnReconnect:p=!0,',
    'refreshOnFocus:f=!1,refreshOnReconnect:p=!1,', 1, 'Sanity refresh on focus/reconnect');

  writeOut(f, s);
}

{
  const f = '_next/static/chunks/07yqe6s1w-tze.js';
  let s = readOut(f);

  // Poruka koju korisnik vidi ako stranica pukne — bila je na engleskom i slala
  // je na advisory@verostudio.com.
  s = patch(s, 'children:"Something went wrong"', 'children:"Došlo je do greške"', 1, 'greska: naslov');
  s = patch(s,
    'children:"We hit an unexpected error. Please try again — if it keeps happening, contact us at advisory@verostudio.com."',
    'children:"Stranica nije mogla da se učita. Pokušajte ponovo — ako se ponavlja, pozovite nas na 063 609158."',
    1, 'greska: tekst');
  s = patch(s, 'children:"Try again"', 'children:"Pokušajte ponovo"', 1, 'greska: dugme');

  writeOut(f, s);
}

for (const f of [
  '_next/static/chunks/0hv4wn13v946q.js',
  '_next/static/chunks/0r5tos1dh~iwd.js',
  '_next/static/chunks/0vis6xobz7tev.js',
]) {
  let s = readOut(f);
  s = patch(s, '"https://verostudio.com"', '"' + DOMAIN + '"', 1, f + ': fallback URL');
  s = patch(s, '"https://vero-website-99m9ozc38-verostudio.vercel.app"', '"' + DOMAIN + '"', 1, f + ': BASE_URL');
  // Mrtva konstanta — nijedan chunk je ne cita — ali je to i dalje tudja adresa
  // za zakazivanje. Kod nas se zakazuje telefonom.
  s = patch(s, '"https://calendly.com/verostudio/30min"', '"tel:+38163609158"', 1, f + ': CALENDLY_LINK');
  writeOut(f, s);
}

// Mape koda nisu ni skinute — bez ovoga svako otvaranje DevTools-a pravi 404.
{
  let stripped = 0;
  const walk = (rel) => {
    for (const e of fs.readdirSync(path.join(OUT, rel), { withFileTypes: true })) {
      const child = rel + '/' + e.name;
      if (e.isDirectory()) { walk(child); continue; }
      if (!/\.(js|css)$/.test(e.name)) continue;
      const s = readOut(child);
      const out = s.replace(/\n?\/\/# sourceMappingURL=[^\s]*/g, '')
                   .replace(/\n?\/\*# sourceMappingURL=[^\s]*\*\//g, '');
      if (out !== s) { writeOut(child, out); stripped++; }
    }
  };
  walk('_next');
  console.log('  sourceMappingURL uklonjen iz ' + stripped + ' fajlova');
}

// ---------------------------------------------------------------- 4. slike

// Bez _local-server.js nema prevodjenja /images/xei5vqg0/production/<ime> u
// media/. Fajlovi se zato kopiraju pod imenima koja HTML zaista trazi. Ime se
// NE sme menjati — iz njega @sanity/image-url parsira ref (README, isto poglavlje).
const SANITY_MAP = JSON.parse(fs.readFileSync(path.join(ROOT, 'media', 'sanity-map.json'), 'utf8'));
const mismatched = [];
let copied = 0;

for (const [sanityName, localName] of Object.entries(SANITY_MAP)) {
  const src = path.join(ROOT, 'media', localName);
  if (!fs.existsSync(src)) throw new Error('nedostaje media/' + localName + ' (iz sanity-map.json)');
  const dst = path.join(OUT, 'images', 'xei5vqg0', 'production', sanityName);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
  copied++;
  // Vise imena iz Sanity-ja ima .png nastavak, a fajl je JPEG. Browser to svakako
  // prepozna po magicnim bajtovima, ali dajemo i tacan content-type u vercel.json.
  if (path.extname(sanityName).toLowerCase() !== path.extname(localName).toLowerCase()) {
    mismatched.push('/images/xei5vqg0/production/' + sanityName);
  }
}
console.log('  slike: ' + copied + ' kopija u images/xei5vqg0/production/ (' + mismatched.length + ' sa netacnim nastavkom)');

// Tek sada media/: samo ono na sta HTML zaista pokazuje preko /media/ (galerija i
// video). Sve ostalo stize kroz /images/xei5vqg0/production/ i vec je kopirano —
// bez ovog filtera bi ~3 MB islo na server dvaput.
{
  const viaSanity = new Set(Object.values(SANITY_MAP));
  let mediaCopied = 0, skipped = 0;
  for (const name of fs.readdirSync(path.join(ROOT, 'media'))) {
    if (name === 'sanity-map.json') continue;          // alat, ne sadrzaj
    if (viaSanity.has(name)) { skipped++; continue; }
    copyFile('media/' + name);
    mediaCopied++;
  }
  console.log('  media/: ' + mediaCopied + ' fajlova (' + skipped + ' preskoceno, idu kroz /images/)');
}

// ---------------------------------------------------------------- 5. korenski fajlovi

// U kopiji je site.webmanifest folder sa index.html — na Vercelu mora da bude fajl.
writeOut('site.webmanifest', fs.readFileSync(path.join(ROOT, 'site.webmanifest', 'index.html'), 'utf8'));

// Sitemap je imao relativne ./index.html lokacije; standard trazi pune URL-ove.
const today = new Date().toISOString().slice(0, 10);
writeOut('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${DOMAIN}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${DOMAIN}/kontakt</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
`);

// robots.txt vec pokazuje na marmis.rs; prepisujemo samo ako je zadat drugi domen.
if (DOMAIN !== 'https://marmis.rs') {
  let r = readOut('robots.txt');
  r = r.replace(/https:\/\/marmis\.rs/g, DOMAIN);
  writeOut('robots.txt', r);
}

// ---------------------------------------------------------------- 6. vercel.json

// cleanUrls: /kontakt umesto /kontakt/ — tako je bilo i na zivom originalu, pa
// relativni preload fonta ("fonts/X.woff2") ponovo pogadja /fonts/X.woff2.
const vercel = {
  $schema: 'https://openapi.vercel.sh/vercel.json',
  cleanUrls: true,
  trailingSlash: false,
  redirects: [
    { source: '/registry', destination: '/kontakt', permanent: true },
    { source: '/registry/', destination: '/kontakt', permanent: true },
  ],
  headers: [
    {
      // Imena su hesirana — smeju da stoje u kesu zauvek.
      source: '/_next/static/(.*)',
      headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
    },
    {
      source: '/fonts/(.*)',
      headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
    },
    {
      // Slike, video i 3D se mogu zameniti pod istim imenom — zato dan, uz SWR.
      source: '/(media|images|webgl)/(.*)',
      headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
    },
    {
      source: '/marmis/(.*)',
      headers: [{ key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' }],
    },
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'X-DNS-Prefetch-Control', value: 'on' },
      ],
    },
    ...mismatched.map((p) => ({
      source: p,
      headers: [{ key: 'Content-Type', value: 'image/jpeg' }],
    })),
  ],
};
writeOut('vercel.json', JSON.stringify(vercel, null, 2) + '\n');

// ---------------------------------------------------------------- gotovo

const size = dirSize(OUT);
console.log('\n  zakrpa primenjeno: ' + patched);
console.log('  ukupno: ' + (size / 1024 / 1024).toFixed(1) + ' MB');
console.log('\nspremno. provera lokalno (servira se kao na Vercelu):');
console.log('  node _deploy-preview.js ' + path.relative(ROOT, OUT) + '   ->  http://localhost:8100/');
