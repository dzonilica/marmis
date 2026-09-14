'use strict';
/**
 * Uvodi EB Garamond i Inter u sam sajt, umesto Louize Displaya i Beausite
 * Classica (oba probna licenca). Pokrece se jednom; ponovno pokretanje na vec
 * zamenjenom sajtu javi da nema sta da menja i ne dira nista.
 *
 *   python _fontovi/napravi-fontove.py     # woff2 + TTF
 *   node   _fontovi/napravi-logo.js        # MSDF atlas + raspored slova
 *   python _fontovi/napravi-brand-svg.py   # vektorski natpis
 *   node   _fontovi/zameni-u-sajtu.js      # <- ovo
 *
 * Menja se na cetiri mesta:
 *   1. jedan CSS chunk — @font-face i dve porodice (imena fontova nisu nigde
 *      drugde, ni u JS-u ni u HTML-u);
 *   2. obe stranice — preload fonta, po 4 pojavljivanja (2 u SSR <head>, 2 u RSC
 *      payload-u); mora na sva cetiri, inace React posle hidracije vrati staro;
 *   3. chunk sa 3D natpisom — zakucane kutije slova, jer EB Garamond ima druge
 *      sirine od Louizea;
 *   4. fonts/ — probni fajlovi se brisu (kopija je u _backup-fontovi-2026-09-13/).
 *
 * Svaka zamena se broji; ako se ne poklopi, skripta puca i ne upisuje nista.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.dirname(__dirname);
const CSS = path.join(ROOT, '_next/static/chunks/0ot2j1ufaj_~p.css');
const LOGO_JS = path.join(ROOT, '_next/static/chunks/11sswtocfulc~.js');
const STRANE = ['index.html', 'kontakt/index.html'];
const PROBNI = ['LouizeDisplay.woff2', 'LouizeDisplay.woff',
                'LouizeDisplay-Italic.woff2', 'LouizeDisplay-Italic.woff',
                'BeausiteClassicWebTrial-Regular.woff2', 'BeausiteClassicWebTrial-Regular.woff',
                'BeausiteClassicWebTrial-Medium.woff2', 'BeausiteClassicWebTrial-Medium.woff'];

const izmene = [];   // [put, sadrzaj]

function zameni(tekst, trazi, umesto, koliko, opis) {
  const delovi = tekst.split(trazi);
  if (delovi.length - 1 !== koliko) {
    throw new Error(`${opis}: ocekivano ${koliko} pojavljivanja, naslo ${delovi.length - 1}`);
  }
  console.log('  ok  ' + opis);
  return delovi.join(umesto);
}

// ---------------------------------------------------------------- 1. CSS

{
  let s = fs.readFileSync(CSS, 'utf8');
  const face = (fam, file, w, st) =>
    `@font-face{font-family:${fam};src:url(../../../fonts/${file})format("woff2");` +
    `font-weight:${w};font-style:${st};font-display:swap}`;

  const staro =
    '@font-face{font-family:Louize Display;src:url(../../../fonts/LouizeDisplay.woff2)format("woff2"),url(../../../fonts/LouizeDisplay.woff)format("woff");font-weight:400;font-style:normal;font-display:swap}' +
    '@font-face{font-family:Louize Display;src:url(../../../fonts/LouizeDisplay-Italic.woff2)format("woff2"),url(../../../fonts/LouizeDisplay-Italic.woff)format("woff");font-weight:400;font-style:italic;font-display:swap}' +
    '@font-face{font-family:Beausite Classic;src:url(../../../fonts/BeausiteClassicWebTrial-Regular.woff2)format("woff2"),url(../../../fonts/BeausiteClassicWebTrial-Regular.woff)format("woff");font-weight:400;font-style:normal;font-display:swap}' +
    '@font-face{font-family:Beausite Classic;src:url(../../../fonts/BeausiteClassicWebTrial-Medium.woff2)format("woff2"),url(../../../fonts/BeausiteClassicWebTrial-Medium.woff)format("woff");font-weight:500;font-style:normal;font-display:swap}';

  s = zameni(s, staro,
    face('EB Garamond', 'EBGaramond-Regular.woff2', 400, 'normal') +
    face('EB Garamond', 'EBGaramond-Italic.woff2', 400, 'italic') +
    face('Inter', 'Inter-Regular.woff2', 400, 'normal') +
    face('Inter', 'Inter-Medium.woff2', 500, 'normal'),
    1, 'CSS: @font-face (4 reza)');

  // rezervni nizovi ostaju isti — menja se samo prvo ime
  s = zameni(s, '--font-family-primary:"Louize Display", "Georgia"',
                '--font-family-primary:"EB Garamond", "Georgia"', 1, 'CSS: --font-family-primary');
  s = zameni(s, '--font-family-content:"Beausite Classic", "Roboto"',
                '--font-family-content:"Inter", "Roboto"', 1, 'CSS: --font-family-content');
  izmene.push([CSS, s]);
}

// ---------------------------------------------------------------- 2. stranice

for (const strana of STRANE) {
  const put = path.join(ROOT, strana);
  let s = fs.readFileSync(put, 'utf8');
  s = zameni(s, 'fonts/LouizeDisplay-Italic.woff2', 'fonts/EBGaramond-Italic.woff2', 4, strana + ': preload kurziv');
  s = zameni(s, 'fonts/LouizeDisplay.woff2', 'fonts/EBGaramond-Regular.woff2', 4, strana + ': preload uspravni');
  izmene.push([put, s]);
}

// ---------------------------------------------------------------- 3. 3D natpis

{
  const raspored = JSON.parse(fs.readFileSync(path.join(__dirname, 'logo-raspored.json'), 'utf8'));
  const niz = '[' + raspored.map((k) =>
    `{id:${k.id},char:"${k.char}",x:${k.x},y:${k.y},width:${k.width},height:${k.height}}`).join(',') + ']';

  let s = fs.readFileSync(LOGO_JS, 'utf8');
  s = zameni(s,
    '[{id:0,char:"M",x:0,y:2.33,width:105.26,height:87.23},{id:1,char:"A",x:106.53,y:0,width:73.85,height:87.81},' +
    '{id:2,char:"R",x:181.65,y:2.33,width:74.44,height:87.23},{id:3,char:"M",x:255.61,y:2.33,width:105.26,height:87.23},' +
    '{id:4,char:"I",x:363.3,y:2.33,width:29.66,height:85.49},{id:5,char:"S",x:395.38,y:0.58,width:54.66,height:88.97}]',
    niz, 1, '3D natpis: kutije slova');
  izmene.push([LOGO_JS, s]);
}

// ---------------------------------------------------------------- upis

for (const [put, sadrzaj] of izmene) fs.writeFileSync(put, sadrzaj);

let obrisano = 0;
for (const f of PROBNI) {
  const put = path.join(ROOT, 'fonts', f);
  if (fs.existsSync(put)) { fs.unlinkSync(put); obrisano++; }
}

console.log('\n  upisano fajlova: ' + izmene.length);
console.log('  obrisano probnih fontova: ' + obrisano + ' (kopija u _backup-fontovi-2026-09-13/)');
console.log('\nsajt sada koristi EB Garamond + Inter.');
