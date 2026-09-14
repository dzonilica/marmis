'use strict';
// Gradi sve izvedene slike/video u media/ iz izvornih fajlova u korenu.
//   node _media-build.js
// Trazi ffmpeg u PATH-u. Ne dira index.html — vidi _README-mirror.md,
// odeljak "Fotografije".
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'media');
fs.mkdirSync(OUT, { recursive: true });

// ---- izvorne fotografije --------------------------------------
const RS = 'realslike/';
const SRC = {
  // --- prave fotografije naručioca (realslike/, 2026-09-13) ---------------
  // pejzaž 16:9 — desktop verzije tri koraka
  V1: RS + '16kroz9.png',   // žuta haljina, stepenište sa palmama
  V2: RS + '16kroz92.png',  // brokatna haljina, terasa, s leđa
  V3: RS + '16KROZ93.png',  // brokatna haljina, zid sa lampom i vazom
  // portret — mobilne verzije istih koraka, sa istog snimanja kao V1..V3
  W1: RS + '800246312_1699065457828061_8079509315790983082_n.jpg', // uz V1
  W2: RS + '805783466_4526175324335174_1823468076662799479_n.jpg', // uz V2
  W3: RS + '802455369_4866716730227649_5184531865912780819_n.jpg', // uz V3
  // portret — diptih i galerija
  X1: RS + '804443033_1082039287971885_8171777585784356911_n.jpg', // brokat izbliza, sedi
  X2: RS + '807698684_941310555101199_8527694346816541240_n.jpg',  // s leđa, suknja od ruža
  X3: RS + '802108638_4197033593921159_4620814789772504309_n.jpg', // žuta haljina sa volanima, ogledalo
  X4: RS + '801243479_1638534137986655_2925377210356568533_n.jpg', // korset i balon suknja od ruža
  X5: RS + '803539693_1392945269025986_7129514946255023815_n.jpg', // crvena svečana haljina, proslava
  X6: RS + '806197600_830203513472422_7528895890078943084_n.jpg',  // brokat uz zid od cigle
  X7: RS + '805876240_1630297228891296_5984413449624884774_n.jpg', // brokat, zid od ogledala
  Y1: RS + '801937090_1409356097801733_7674735183995497670_n.jpg', // brokat uz zgradu od cigle
  Y2: RS + '800468491_1019580754443962_4021087809775009719_n.jpg', // brokat, sedi na klupi
  Y3: RS + '801008300_2704289986668976_255003800361952674_n.jpg',  // crno-belo, tamni hodnik

  // --- materijal iz radionice (koren) -------------------------------------
  E: 'galerija1.jpg',  // proba na lutki, ruke
  F: 'slika2.jpg',     // makaze, metar, konac
  G: 'slika3.jpg',     // sivaca masina
  H: 'slika4.jpg',     // haljina i harfa
  P: 'slika11.jpg',    // makaze, metar, konac, dugmad (odozgo)
  Q: 'slika12.jpg',    // radionica sa skicama, masina, lutka
  T: 'slika15.jpg',    // crno-belo: draperija na lutki, masina

  // Vise se ne koriste (2026-09-13 zamenjeni pravim fotografijama iz realslike/):
  //   B,C,D,N = 'ChatGPT Image ...' | I='slika5' J='slika6' K='slika7'
  //   L='slika8' M='slika9' O='slika10' R='slika13' U='slika16'
  //   | S='slika14' je i obrisan iz korena.
};
// Svaka izvorna slika se na pocetnoj koristi TACNO JEDNOM:
//   koraci V1..V3 (desktop) + W1..W3 (mobilni) | diptih X1, G, E, H, Y1, X2
//   | galerija X3, F, Y2, X4, X5, P, Q, X6, X7, T, Y3.
const LOGO = 'logo.png';
const VIDEO = 'herovideo.mp4';

// vidljivi deo logotipa unutar logo.png (ostalo je providno)
const LOGO_CROP = 'crop=1083:994:216:15';

// ---- mapiranje: sanity ime fajla -> [izlaz, izvor, maxSirina, cx, cy, ar?] -
// Odnos stranica se cita iz sanity imena (…-SIRINAxVISINA.ext) jer width/height
// atributi u HTML-u ostaju netaknuti; isecanje na taj odnos cuva layout.
// Izuzetak je sesti clan `ar`: kad okvir daje CSS a ne atributi (dip-2 i dip-5
// su u DiptychDoubleMaskMedia, koji slici zada i width i height), atributi su
// mrtvo slovo i isecanje na njih baca pola slike — vidi _README-mirror.md.
const MAP = {
  // sekcija sa 3 koraka koja "zaustavlja" skrol
  'cfe716ebeb9d1a0676a59f41aa92b2e678dce13c-2887x1800.jpg': ['korak-1.jpg', 'V1', 1920, 0.50, 0.50],
  '86f18c27c5853ee326c8418f1e8e97911092056d-1417x1999.jpg': ['korak-1-m.jpg', 'W1', 1000, 0.50, 0.15],
  '457833e548c061d08e21f99cae765b488c1489b1-1843x1003.jpg': ['korak-2.jpg', 'V2', 1920, 0.50, 0.50],
  '7fe6426b99b805680fdde5f94132ac75697ea425-1286x2000.jpg': ['korak-2-m.jpg', 'W2', 1000, 0.50, 0.50],
  '62dddffa9563718a6437deb91cb2a91ceb0e01f2-2975x1800.jpg': ['korak-3.jpg', 'V3', 1920, 0.45, 0.50],
  '396f260c54896295fa31fe6985dd256a8da113e5-1521x2000.jpg': ['korak-3-m.jpg', 'W3', 1000, 0.50, 0.50],

  // "Kupljeno u radnji. Nikad bas po vama."
  '47390300c18860bb900a2917240973e7b33110f0-1658x1926.png': ['dip-1.jpg', 'X1', 1300, 0.50, 0.10],
  'b3b607284914f093fff0c6656892ff078ab7427a-800x670.png': ['dip-2.jpg', 'G', 900, 0.50, 0.45],
  '042f1a38d440362b5028b2c08b587898242a650a-814x1120.png': ['dip-3.jpg', 'E', 900, 0.50, 0.35],
  '597b9a1b9c489ca52c96323795934d92eeab636c-346x476.png': ['dip-4.jpg', 'H', 900, 0.50, 0.30],
  '506b316b2e93b2df03dbff106a6e92c634a37926-1416x2000.jpg': ['dip-4-m.jpg', 'H', 1000, 0.50, 0.30],
  // okvir je 0.72 (CSS), a ne 800/660 iz atributa
  '42de2234b2f357fcb7e1c2cebbe68a21fef5556c-800x660.png': ['dip-5.jpg', 'Y1', 900, 0.50, 0.50, 0.72],
  '99a443e367fa310be12b24ac9df09078e8f2eb71-814x1120.png': ['dip-6.jpg', 'X2', 900, 0.50, 0.20],

  // og:image / twitter:image i poster hero videa
  '8e3034304dca200363d214d56484cafa014a2326-20604x11590.jpg': ['og.jpg', null, 0, 0, 0],
  'fe9dfb2b06f0b04fa45dc0ebd925dc3b39517dc5-1728x1001.jpg': ['hero-poster.jpg', null, 0, 0, 0],
};

// ---- galerija na pocetnoj (sve tri verzije koriste istih 11 slika) --------
// Peti i sesti clan su ciljni odnos stranica i centar isecanja; kad ih nema,
// cuva se izvorni odnos slike. Odnos je onaj koji za tu sliku pisu width/height
// atributi u index.html, pa se HTML ne dira. Raspored (aspect-ratio 3/4 +
// object-fit: cover) odlucuje o konacnom isecanju, vidi marmis/galerije.css.
const GALLERY = [
  ['gal-01.jpg', 'X3', 1000 / 1500, 0.50, 0.50], // zuta haljina sa volanima
  ['gal-02.jpg', 'F'],                           // makaze i metar
  ['gal-03.jpg', 'Y2', 3 / 4, 0.50, 0.90],       // brokatna haljina na klupi
  ['gal-04.jpg', 'X4', 736 / 1104, 0.50, 0.50],  // korset i balon suknja od ruza
  ['gal-05.jpg', 'X5', 736 / 982, 0.50, 0.70],   // crvena svecana haljina
  ['gal-06.jpg', 'P'],                           // pribor odozgo
  ['gal-07.jpg', 'Q'],                           // radionica sa skicama
  ['gal-08.jpg', 'X6', 736 / 982, 0.50, 0.30],   // brokatna haljina uz ciglu
  ['gal-09.jpg', 'X7', 734 / 936, 0.50, 0.60],   // brokatna haljina u ogledalu
  ['gal-10.jpg', 'T'],                           // crno-bela draperija
  ['gal-11.jpg', 'Y3', 3 / 4, 0.50, 0.80],       // crno-belo, tamni hodnik
];

// ---- alati ---------------------------------------------------------------
function dim(f) {
  const b = fs.readFileSync(f);
  if (b[0] === 0x89 && b[1] === 0x50) return [b.readUInt32BE(16), b.readUInt32BE(20)];
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const m = b[i + 1];
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc)
        return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
      i += 2 + b.readUInt16BE(i + 2);
    }
  }
  throw new Error('nepoznat format: ' + f);
}
const cache = {};
function sdim(k) { if (!cache[k]) cache[k] = dim(SRC[k]); return cache[k]; }
function ff(args) { execFileSync('ffmpeg', ['-y', '-loglevel', 'error'].concat(args), { cwd: ROOT }); }
function log(name, note) {
  const p = path.join(OUT, name);
  const kb = fs.existsSync(p) ? (fs.statSync(p).size / 1024).toFixed(0) + ' KB' : '???';
  console.log('  ' + name.padEnd(18) + ' ' + String(note).padEnd(14) + ' ' + kb);
}

function make(outName, key, ar, maxW, cx, cy) {
  const wh = sdim(key), W = wh[0], H = wh[1];
  let cw, ch;
  if (W / H > ar) { ch = H; cw = Math.round(H * ar); } else { cw = W; ch = Math.round(W / ar); }
  const x = Math.round((W - cw) * cx), y = Math.round((H - ch) * cy);
  let tw = Math.min(cw, maxW); tw -= tw % 2;
  ff(['-i', SRC[key], '-vf', 'crop=' + cw + ':' + ch + ':' + x + ':' + y +
      ',scale=' + tw + ':-2:flags=lanczos', '-q:v', '3', path.join(OUT, outName)]);
  log(outName, '<- ' + key);
}

// ---- 1. fotografije ------------------------------------------------------
console.log('fotografije:');
Object.keys(MAP).forEach(function (sanity) {
  const v = MAP[sanity];
  if (!v[1]) return; // og.jpg i hero-poster.jpg se prave posebno
  const m = sanity.match(/-(\d+)x(\d+)\./);
  make(v[0], v[1], v[5] || Number(m[1]) / Number(m[2]), v[2], v[3], v[4]);
});

console.log('galerija:');
GALLERY.forEach(function (g) {
  if (g[2]) { make(g[0], g[1], g[2], 1000, g[3], g[4]); return; }
  const w = sdim(g[1])[0];
  let tw = Math.min(w, 1000); tw -= tw % 2;
  ff(['-i', SRC[g[1]], '-vf', 'scale=' + tw + ':-2:flags=lanczos', '-q:v', '3', path.join(OUT, g[0])]);
  log(g[0], '<- ' + g[1]);
});

// og:image mora da bude tacno 1200x630 (tako pise u meta tagovima)
ff(['-i', SRC.V3, '-vf', 'scale=1200:676:flags=lanczos,crop=1200:630:0:23', '-q:v', '3',
    path.join(OUT, 'og.jpg')]);
log('og.jpg', '<- V3  1200x630');

// ---- 2. hero video + poster ---------------------------------------------
// Sporo je, pa se preskace ako je media/hero.mp4 noviji od izvora
// (node _media-build.js --video forsira ponovno kodiranje).
const heroOut = path.join(OUT, 'hero.mp4');
const videoFresh = fs.existsSync(heroOut) &&
  fs.statSync(heroOut).mtimeMs > fs.statSync(path.join(ROOT, VIDEO)).mtimeMs;
if (videoFresh && process.argv.indexOf('--video') < 0) {
  console.log('video: preskoceno (media/hero.mp4 je azuran)');
} else {
console.log('video:');
ff(['-i', VIDEO, '-an', '-c:v', 'libx264', '-crf', '23', '-preset', 'slow',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
    '-vf', 'scale=1920:1080:flags=lanczos', path.join(OUT, 'hero.mp4')]);
log('hero.mp4', '16:9');
ff(['-i', VIDEO, '-an', '-c:v', 'libx264', '-crf', '24', '-preset', 'slow',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
    '-vf', 'crop=608:1080:656:0,scale=608:1080:flags=lanczos', path.join(OUT, 'hero-mobile.mp4')]);
log('hero-mobile.mp4', '9:16');
ff(['-ss', '1.2', '-i', VIDEO, '-vf', 'crop=1865:1080:27:0,scale=1728:-2:flags=lanczos',
    '-frames:v', '1', '-q:v', '3', path.join(OUT, 'hero-poster.jpg')]);
log('hero-poster.jpg', 'kadar 1.2s');
}

// ---- 3. znak i ikonice ---------------------------------------------------
console.log('znak i ikonice:');
const PAD = 'pad=1300:1300:(ow-iw)/2:(oh-ih)/2:color=0x00000000';
[16, 32].forEach(function (s) {
  ff(['-i', LOGO, '-vf', LOGO_CROP + ',' + PAD + ',scale=' + s + ':' + s +
      ":flags=lanczos,format=rgba,geq=r=24:g=22:b=21:a='alpha(X,Y)'",
      path.join(ROOT, 'favicon-light-' + s + 'x' + s + '.png')]);
  ff(['-i', LOGO, '-vf', LOGO_CROP + ',' + PAD + ',scale=' + s + ':' + s +
      ":flags=lanczos,format=rgba,geq=r=248:g=248:b=248:a='alpha(X,Y)'",
      path.join(ROOT, 'favicon-dark-' + s + 'x' + s + '.png')]);
});
console.log('  favicon-{light,dark}-{16,32}.png');
[['apple-touch-icon.png', 180], ['android-chrome-192x192.png', 192], ['android-chrome-512x512.png', 512]]
  .forEach(function (e) {
    ff(['-f', 'lavfi', '-i', 'color=0xf3f0ed:1300x1300', '-i', LOGO, '-filter_complex',
        '[1:v]' + LOGO_CROP + ',scale=1040:-1:flags=lanczos[m];' +
        '[0:v][m]overlay=(W-w)/2:(H-h)/2,scale=' + e[1] + ':' + e[1],
        '-frames:v', '1', path.join(ROOT, e[0])]);
    console.log('  ' + e[0]);
  });

// ---- 4. slika na stranici Kontakt (isti odnos kao original 1200x1394) ----
// putanja images/registry/ je interna (iz RSC payload-a) i ostaje ista
ff(['-i', SRC.E, '-vf', 'crop=1200:1394:0:113,scale=1100:-2:flags=lanczos',
    path.join(ROOT, 'images', 'registry', 'dress.png')]);
console.log('  images/registry/dress.png  <- E');

// ---- 5. tabela za _local-server.js --------------------------------------
const table = {};
Object.keys(MAP).forEach(function (k) { table[k] = MAP[k][0]; });
fs.writeFileSync(path.join(OUT, 'sanity-map.json'), JSON.stringify(table, null, 1));
console.log('\nmedia/sanity-map.json — ' + Object.keys(table).length + ' unosa');
