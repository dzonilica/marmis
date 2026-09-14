'use strict';
// Local server for the verostudio.com mirror.
//   node _local-server.js [port]
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const ROOT = __dirname;
const PORT = Number(process.argv[2]) || 8080;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json',
  '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp', '.avif': 'image/avif', '.ico': 'image/x-icon',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.otf': 'font/otf',
};

// <sanity ime fajla> -> <fajl u media/>, vidi media/sanity-map.json
let SANITY_MEDIA = {};
try { SANITY_MEDIA = JSON.parse(fs.readFileSync(path.join(ROOT, 'media', 'sanity-map.json'), 'utf8')); }
catch (e) { console.warn('media/sanity-map.json nije ucitan:', e.message); }

http.createServer((req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(url.parse(req.url).pathname); }
  catch (e) { res.writeHead(400); return res.end('bad request'); }

  // Sanity image URLs are rebuilt in the browser by @sanity/image-url from the
  // asset ref, so the file name (<hash>-WxH.ext) cannot be renamed in the HTML.
  // The bundle is patched to emit them same-origin; map them to media/ here.
  {
    const m = pathname.match(/^\/images\/xei5vqg0\/production\/(.+)$/);
    if (m) {
      const local = SANITY_MEDIA[m[1]];
      if (local) pathname = '/media/' + local;
    }
  }

  // stara adresa druge strane (Usluge) -> nova (Kontakt)
  if (/^\/registry\/?$/.test(pathname)) {
    res.writeHead(301, { Location: '/kontakt/' });
    return res.end();
  }

  // block traversal outside ROOT
  const target = path.normalize(path.join(ROOT, pathname));
  if (!target.startsWith(ROOT)) { res.writeHead(403); return res.end('forbidden'); }

  let file = target;
  const isDir = fs.existsSync(file) && fs.statSync(file).isDirectory();

  // pages are saved as <route>/index.html; relative asset links only resolve
  // correctly from a trailing-slash URL, so redirect when it is missing
  if (isDir) {
    if (!pathname.endsWith('/')) {
      res.writeHead(301, { Location: pathname + '/' });
      return res.end();
    }
    file = path.join(file, 'index.html');
  } else if (!fs.existsSync(file) && fs.existsSync(file + '/index.html')) {
    res.writeHead(301, { Location: pathname + '/' });
    return res.end();
  }

  // Pages preload fonts with a relative href ("fonts/X.woff2"). On the live site
  // the page URL has no trailing slash so that resolves to /fonts/X.woff2; here
  // every page is served from <route>/ , which would make it 404. Map it back.
  if (!fs.existsSync(file)) {
    const m = pathname.match(/^\/.+\/(fonts\/[^/]+)$/);
    if (m && fs.existsSync(path.join(ROOT, m[1]))) file = path.join(ROOT, m[1]);
  }

  // Served with byte-range support (206). Without it iOS Safari refuses to play
  // <video> at all, and every seek re-downloads the whole file.
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) {
      res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
      return res.end('<h1>404</h1><p>Not in mirror: ' + pathname + '</p>');
    }

    const head = {
      'content-type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'cache-control': 'no-cache',
      'accept-ranges': 'bytes',
    };

    let start = 0;
    let end = st.size - 1;
    let code = 200;
    const range = req.headers.range;

    if (range && st.size > 0) {
      const m = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
      const unsatisfiable = () => {
        res.writeHead(416, { 'content-range': 'bytes */' + st.size, 'accept-ranges': 'bytes' });
        res.end();
      };
      if (!m || (m[1] === '' && m[2] === '')) return unsatisfiable();
      if (m[1] === '') start = Math.max(0, st.size - Number(m[2]));
      else {
        start = Number(m[1]);
        if (m[2] !== '') end = Math.min(end, Number(m[2]));
      }
      if (!(start <= end) || start >= st.size) return unsatisfiable();
      code = 206;
      head['content-range'] = 'bytes ' + start + '-' + end + '/' + st.size;
    }

    head['content-length'] = st.size === 0 ? 0 : end - start + 1;
    res.writeHead(code, head);
    if (req.method === 'HEAD' || st.size === 0) return res.end();

    const stream = fs.createReadStream(file, { start, end });
    stream.on('error', () => res.destroy());
    res.on('close', () => stream.destroy());
    stream.pipe(res);
  });
}).listen(PORT, () => {
  console.log('verostudio.com mirror -> http://localhost:' + PORT + '/');
});
