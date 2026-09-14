'use strict';
// Zajednicki alati: dekodiranje/kodiranje RSC push-eva, mini "React" za
// generisanje istog stabla i kao SSR HTML i kao RSC JSON.
const fs = require('fs');

const PUSH_RE = /<script>self\.__next_f\.push\((\[1,[\s\S]*?\])\)<\/script>/g;

function splitPage(html) {
  const re = new RegExp(PUSH_RE.source, 'g');
  let m, first = -1, last = -1, parts = [];
  while ((m = re.exec(html))) {
    if (first < 0) first = m.index;
    if (last >= 0 && m.index !== last) throw new Error('push skripte nisu uzastopne');
    parts.push(JSON.parse(m[1])[1]);
    last = m.index + m[0].length;
  }
  return { before: html.slice(0, first), flight: parts.join(''), after: html.slice(last) };
}

// redovi: "id:payload\n" (T redovi ne postoje u ovim stranicama; proverava se)
function parseRows(flight) {
  const rows = [];
  let i = 0;
  while (i < flight.length) {
    const nl = flight.indexOf('\n', i);
    if (nl < 0) throw new Error('red bez kraja');
    const line = flight.slice(i, nl);
    const c = line.indexOf(':');
    const id = line.slice(0, c);
    const body = line.slice(c + 1);
    if (body[0] === 'T') throw new Error('T red nije podrzan: ' + id);
    rows.push({ id, body });
    i = nl + 1;
  }
  return rows;
}
function joinRows(rows) { return rows.map(r => r.id + ':' + r.body + '\n').join(''); }

function encodePushes(flight) {
  // grupisi cele redove u push-eve do ~4 KB; '<' kodiran da string ne zatvori <script>
  const lines = flight.split('\n');
  lines.pop();
  const chunks = [];
  let cur = '';
  for (const l of lines) {
    if (cur && cur.length + l.length > 4000) { chunks.push(cur); cur = ''; }
    cur += l + '\n';
  }
  if (cur) chunks.push(cur);
  return chunks.map(c =>
    '<script>self.__next_f.push([1,' + JSON.stringify(c).replace(/</g, '\\u003c') + '])</script>'
  ).join('');
}

function rowObj(rows, id) {
  const r = rows.find(r => r.id === id);
  if (!r) throw new Error('nema reda ' + id);
  return r;
}
function editRow(rows, id, fn) {
  const r = rowObj(rows, id);
  const obj = JSON.parse(r.body);
  if (JSON.stringify(obj) !== r.body) throw new Error('red ' + id + ' se ne serijalizuje isto');
  const out = fn(obj);
  r.body = JSON.stringify(out === undefined ? obj : out);
}

// obilazak svih objekata u JSON stablu
function walk(v, fn) {
  if (Array.isArray(v)) { v.forEach(x => walk(x, fn)); return; }
  if (v && typeof v === 'object') { fn(v); Object.keys(v).forEach(k => walk(v[k], fn)); }
}

// ---- mini React: h() -> SSR HTML i RSC -----------------------------------
function h(type, props, ...children) {
  return { type, props: props || {}, children: children.flat(Infinity).filter(c => c != null && c !== false) };
}
// komponenta iz payload-a (npr. Button) sa rucno zadatim SSR-om
function comp(rsc, html) { return { comp: true, rsc, html }; }

const VOID = new Set(['img', 'br', 'hr', 'input', 'meta', 'link']);
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
}
function styleStr(o) {
  return Object.keys(o).map(k =>
    (k.startsWith('--') ? k : k.replace(/[A-Z]/g, c => '-' + c.toLowerCase())) + ':' + o[k]).join(';');
}
function toHTML(n) {
  if (typeof n === 'string') return esc(n);
  if (n.comp) return n.html;
  let s = '<' + n.type;
  for (const k of Object.keys(n.props)) {
    const v = n.props[k];
    if (k === 'key' || v == null || v === false) continue;
    const name = k === 'className' ? 'class' : k;
    s += ' ' + name + '="' + esc(k === 'style' ? styleStr(v) : v) + '"';
  }
  if (VOID.has(n.type)) return s + '/>';
  s += '>';
  let prevText = false;
  for (const c of n.children) {
    const t = typeof c === 'string';
    if (t && prevText) s += '<!-- -->';
    s += toHTML(c);
    prevText = t;
  }
  return s + '</' + n.type + '>';
}
function toRSC(n) {
  if (typeof n === 'string') return n;
  if (n.comp) return n.rsc;
  const props = {};
  let key = null;
  for (const k of Object.keys(n.props)) {
    if (k === 'key') { if (n.props.key != null) key = String(n.props.key); continue; }
    if (n.props[k] == null || n.props[k] === false) continue;
    props[k] = n.props[k];
  }
  const ch = n.children.map(toRSC);
  if (ch.length === 1) props.children = ch[0];
  else if (ch.length > 1) props.children = ch;
  return ['$', n.type, key, props];
}

// ---- dugme sajta: Button ($L30) + ButtonAnimatedRichText ($L31) ----------
const BTN = 'Button-module-scss-module__VLzsWq__';
// spans: [[marks[], text], ...] -> portable text blok
function richBlock(key, spans) {
  return {
    _key: key, _type: 'block',
    children: spans.map((s, i) => ({ _key: key + 's' + i, _type: 'span', marks: s[0], text: s[1] })),
    markDefs: [], style: 'normal',
  };
}
function richHTML(spans) {
  return spans.map(s => {
    let t = esc(s[1]);
    if (s[0].includes('uppercase')) t = '<span class="uppercase">' + t + '</span>';
    if (s[0].includes('em')) t = '<em>' + t + '</em>';
    return t;
  }).join('');
}
function button({ className, href, key, spans }) {
  const inner = '<div><p>' + richHTML(spans) + '</p></div>';
  const html = '<a class="' + BTN + 'Button ' + className + ' ' + BTN + 'theme-plain" href="' + href + '">' +
    '<div class="' + BTN + 'ButtonAnimatedText"><span class="' + BTN + 'wrapper">' +
    '<span class="' + BTN + 'content">' + inner + '</span>' +
    '<span class="' + BTN + 'copy" aria-hidden="true">' + inner + '</span></span></div></a>';
  const rsc = ['$', '$L30', null, {
    theme: 'plain', className, href,
    children: ['$', '$L31', null, { content: [richBlock(key, spans)] }],
  }];
  return comp(rsc, html);
}

function count(hay, needle) { let n = 0, i = 0; while ((i = hay.indexOf(needle, i)) >= 0) { n++; i += needle.length; } return n; }
function replaceExact(hay, from, to, expected, label) {
  const n = count(hay, from);
  if (n !== expected) throw new Error((label || from.slice(0, 60)) + ': ocekivano ' + expected + ', nadjeno ' + n);
  return hay.split(from).join(to);
}

module.exports = {
  fs, splitPage, parseRows, joinRows, encodePushes, rowObj, editRow, walk,
  h, comp, toHTML, toRSC, button, richBlock, esc, count, replaceExact,
};
