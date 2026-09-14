'use strict';
/**
 * Pravi MSDF atlas za 3D natpis MARMIS (webgl/logo/) iz EB Garamonda i racuna
 * raspored slova koji scena koristi.
 *
 *   npm --prefix _fontovi install msdf-bmfont-xml
 *   node _fontovi/napravi-logo.js
 *
 * Zasto uopste: stari atlas je bio iscrtan iz Louize Displaya, pa je i on pod
 * probnom licencom — isto kao i sam font. Atlas je slika slova, ne font, ali je
 * izveden iz njega.
 *
 * Scena (chunk 11sswtocfulc~.js) crta po jedan kvadrat za svako slovo. Atlas daje
 * samo UV isecak; POLOZAJ i VELICINA svakog slova stoje zakucani u nizu u tom
 * chunku, u stotinkama jedinice:
 *
 *   {id, char, x, y, width, height}   // x,y = gornje levo teme MASTILA slova
 *
 * Scena sama racuna ukupne granice iz tog niza (dimensions.size), pa ukupna
 * sirina ne mora da bude ista kao pre — ali je drzimo istom da kadriranje u
 * herou i klizanje u zaglavlje ostanu nepromenjeni.
 *
 * Izlaz: webgl/logo/font.png, webgl/logo/font.json, _fontovi/logo-raspored.json
 */

const fs = require('fs');
const path = require('path');
const generateBMFont = require('msdf-bmfont-xml');

const ROOT = path.dirname(__dirname);
const TTF = path.join(__dirname, 'EBGaramond-Regular.ttf');
const OUT = path.join(ROOT, 'webgl', 'logo');

const NATPIS = 'MARMIS';
const VELICINA = 150;     // isto kao stari atlas
const PADDING = 12;       // isto
const DOMET = 25;         // distanceRange starog atlasa
const SIRINA_CILJ = 450.04;   // ukupna sirina starog rasporeda, u stotinkama
// Dodatni razmak medju slovima, u jedinicama fonta (upm = 1000). Mora da bude
// ista vrednost kao RAZMAK u napravi-brand-svg.py — isti natpis se crta na dva
// mesta (3D u herou, SVG u zaglavlju) i ne sme da se razidje.
const RAZMAK = 35.0;

if (!fs.existsSync(TTF)) {
  console.error('nema ' + path.relative(ROOT, TTF) + ' — prvo: python _fontovi/napravi-fontove.py');
  process.exit(1);
}

generateBMFont(TTF, {
  outputType: 'json',
  filename: 'font',
  charset: [...new Set(NATPIS)].join(''),   // M A R I S
  fontSize: VELICINA,
  distanceRange: DOMET,
  texturePadding: 0,
  border: 0,
  fieldType: 'msdf',
  textureSize: [1024, 512],
  smartSize: true,
  pot: false,
  rtl: false,
}, (err, textures, font) => {
  if (err) { console.error(err); process.exit(1); }

  fs.mkdirSync(OUT, { recursive: true });
  for (const t of textures) fs.writeFileSync(path.join(OUT, 'font.png'), t.texture);

  const data = JSON.parse(font.data);
  // Scena trazi padding u info.padding[0] i ocekuje MSDF opis kao stari atlas.
  data.distanceField = { fieldType: 'msdf', distanceRange: DOMET };
  fs.writeFileSync(path.join(OUT, 'font.json'), JSON.stringify(data, null, 0));

  // ---- raspored slova -------------------------------------------------------
  const po = {};
  for (const c of data.chars) po[c.char] = c;

  // Slozi natpis po pravim sirinama fonta; mastilo je celija bez padding-a.
  let pen = 0;
  const kutije = [...NATPIS].map((ch, i) => {
    const g = po[ch];
    const k = {
      id: i, char: ch,
      x: pen + g.xoffset + PADDING,
      y: g.yoffset + PADDING,
      width: g.width - 2 * PADDING,
      height: g.height - 2 * PADDING,
    };
    pen += g.xadvance + RAZMAK * (VELICINA / 1000);   // upm EB Garamonda je 1000
    return k;
  });

  // Pomeri na nulu i skaliraj na istu ukupnu sirinu kao stari raspored.
  const minX = Math.min(...kutije.map((k) => k.x));
  const minY = Math.min(...kutije.map((k) => k.y));
  const maxX = Math.max(...kutije.map((k) => k.x + k.width));
  const K = SIRINA_CILJ / (maxX - minX);
  const r2 = (n) => Math.round(n * 100) / 100;

  const raspored = kutije.map((k) => ({
    id: k.id, char: k.char,
    x: r2((k.x - minX) * K), y: r2((k.y - minY) * K),
    width: r2(k.width * K), height: r2(k.height * K),
  }));

  fs.writeFileSync(path.join(__dirname, 'logo-raspored.json'), JSON.stringify(raspored, null, 2) + '\n');

  const visina = Math.max(...raspored.map((k) => k.y + k.height));
  console.log('atlas:    %d x %d, %d glifova', data.common.scaleW, data.common.scaleH, data.chars.length);
  console.log('raspored: %s x %s (stari: 450.04 x 89.55)', r2(SIRINA_CILJ), r2(visina));
  for (const k of raspored) {
    console.log("  " + k.char + "  x=" + k.x + "  y=" + k.y + "  w=" + k.width + "  h=" + k.height);
  }
});
