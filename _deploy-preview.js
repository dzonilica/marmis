'use strict';
// Pregled _deploy/ foldera tacno onako kako ga servira Vercel: cleanUrls,
// trailingSlash:false, redirect /registry -> /kontakt, content-type iz vercel.json.
// Nema sanity mapiranja ni font fallback-a — ako radi ovde, radi i na Vercelu.
//
//   node _deploy-preview.js            -> http://localhost:8100/
//   node _deploy-preview.js _deploy 9000
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, process.argv[2] || '_deploy');
const PORT = Number(process.argv[3]) || 8100;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json', '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.mp4': 'video/mp4', '.woff': 'font/woff', '.woff2': 'font/woff2', '.glb': 'model/gltf-binary',
};

const CT_OVERRIDE = {};
try {
  for (const h of JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8')).headers || []) {
    const ct = (h.headers || []).find((x) => x.key.toLowerCase() === 'content-type');
    if (ct && !h.source.includes('(')) CT_OVERRIDE[h.source] = ct.value;
  }
} catch (e) {}

http.createServer((req, res) => {
  let pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname);

  if (/^\/registry\/?$/.test(pathname)) {
    res.writeHead(308, { Location: '/kontakt' });
    return res.end();
  }
  // trailingSlash: false
  if (pathname.length > 1 && pathname.endsWith('/')) {
    res.writeHead(308, { Location: pathname.replace(/\/+$/, '') });
    return res.end();
  }

  const key = pathname;
  let file = path.join(ROOT, pathname);
  if (pathname === '/') file = path.join(ROOT, 'index.html');
  else if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    // cleanUrls: /kontakt -> kontakt/index.html
    if (fs.existsSync(file + '.html')) file = file + '.html';
    else if (fs.existsSync(path.join(file, 'index.html'))) file = path.join(file, 'index.html');
  }

  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) {
      console.log('404', pathname);
      res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
      return res.end('<h1>404</h1>' + pathname);
    }
    const head = {
      'content-type': CT_OVERRIDE[key] || MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'accept-ranges': 'bytes',
    };
    let start = 0, end = st.size - 1, code = 200;
    const m = req.headers.range && /^bytes=(\d*)-(\d*)$/.exec(req.headers.range.trim());
    if (m) {
      if (m[1] === '') start = Math.max(0, st.size - Number(m[2]));
      else { start = Number(m[1]); if (m[2] !== '') end = Math.min(end, Number(m[2])); }
      code = 206;
      head['content-range'] = `bytes ${start}-${end}/${st.size}`;
    }
    head['content-length'] = end - start + 1;
    res.writeHead(code, head);
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file, { start, end }).pipe(res);
  });
}).listen(PORT, () => console.log('vercel-sim -> http://localhost:' + PORT + '/  (root: ' + ROOT + ')'));
