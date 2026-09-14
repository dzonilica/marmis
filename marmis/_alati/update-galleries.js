'use strict';
// Ponovo generise galeriju (SSR + njen RSC red) u vec izmenjenom index.html.
const L = require('./lib.js');
delete require.cache[require.resolve('./galleries.js')];
const galleries = require('./galleries.js');

// [pocetak, kraj) celog <div data-type="..."> bloka u SSR-u
function ssrBlock(html, type) {
  const a = html.indexOf('<div data-type="' + type + '">');
  if (a < 0) throw new Error(type + ' nije nadjen u SSR');
  const re = /<div\b|<\/div>/g;
  re.lastIndex = a;
  let d = 0, m;
  while ((m = re.exec(html))) {
    d += m[0] === '</div>' ? -1 : 1;
    if (d === 0) return [a, m.index + m[0].length];
  }
  throw new Error(type + ': nezatvoren div');
}

const FILE = process.argv[2];
const src = L.fs.readFileSync(FILE, 'utf8');
const page = L.splitPage(src);
const rows = L.parseRows(page.flight);
let before = page.before;
galleries.forEach(g => {
  L.rowObj(rows, g.row).body = JSON.stringify(['$', '$L18', g.key, { type: g.type, theme: 'ultra-light', locator: '$undefined', children: L.toRSC(g.tree) }]);
  const [a, b] = ssrBlock(before, g.type);
  before = before.slice(0, a) + '<div data-type="' + g.type + '">' + L.toHTML(g.tree) + '</div>' + before.slice(b);
});
const flight = L.joinRows(rows);

const out = before + L.encodePushes(flight) + page.after;
L.fs.writeFileSync(FILE, out);
if (L.splitPage(out).flight !== flight) throw new Error('payload se ne poklapa');
console.log('ok', out.length);
