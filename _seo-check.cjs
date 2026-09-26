'use strict';
// Validate the publishable mirror, including SEO values in React Flight.
// node _deploy-build.js && node _seo-check.cjs
// With a running preview: node _seo-check.cjs --url http://localhost:8100
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const L = require('./marmis/_alati/lib.js');
const root = path.join(__dirname, '_deploy');
const normalize = text => text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

async function check() {
  for (const file of ['index.html', 'kontakt/index.html']) {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    const page = L.splitPage(html);
    const rows = L.parseRows(page.flight);
    const objects = rows.filter(row => /^[\[{]/.test(row.body)).map(row => JSON.parse(row.body));
    const props = [];
    for (const object of objects) L.walk(object, value => props.push(value));
    const metadata = JSON.parse(L.rowObj(rows, 'd').body);
    const getMeta = name => props.find(value => value.name === name || value.property === name);
    const title = metadata.find(node => node[1] === 'title')[3].children;
    assert.equal(html.match(/<title>(.*?)<\/title>/)[1], title, file + ': title differs after hydration');
    assert.equal((page.before.match(/<h1\b/g) || []).length, 1, file + ': expected one main heading');
    assert.match(page.before, /<html[^>]*lang="sr"/);
    for (const name of ['description', 'robots', 'og:title', 'og:description', 'og:url', 'og:image', 'twitter:title', 'twitter:description', 'twitter:image']) {
      const value = getMeta(name).content;
      assert(page.before.includes('content="' + L.esc(value) + '"'), file + ': missing SSR value for ' + name);
    }
    assert.equal(getMeta('robots').content, 'index, follow');
    assert.equal(props.find(value => value.rel === 'canonical').href,
      html.match(/<link rel="canonical" href="([^"]+)"/)[1]);
    assert(!/verostudio\.com|vero-website-/.test(html), file + ': original studio domain');
    assert(!/:H[CD]"https:\/\/xei5vqg0\.api\.sanity\.io/.test(page.flight));
    const staticSchemas = [...page.before.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/g)].map(match => JSON.parse(match[1]));
    const flightSchemas = props.filter(value => value.type === 'application/ld+json').map(value => JSON.parse(value.dangerouslySetInnerHTML.__html));
    assert.deepEqual(staticSchemas, flightSchemas, file + ': schema differs after hydration');
    for (const match of page.before.matchAll(/(?:src|href|poster)="([^"]+)"/g)) {
      const url = match[1];
      if (!url.startsWith('/') || url.startsWith('//')) continue;
      const pathname = url.split(/[?#]/)[0];
      const target = path.join(root, pathname === '/' ? 'index.html' : pathname);
      assert(fs.existsSync(target) || fs.existsSync(path.join(target, 'index.html')), file + ': missing asset or link ' + pathname);
    }
    if (file === 'index.html') {
      const sections = JSON.parse(L.rowObj(rows, '5').body);
      const heroText = sections[0][3].children[3].title[0].children.map(span => span.text).join('');
      assert.equal(normalize(page.before.match(/<h1[^>]*>(.*?)<\/h1>/)[1]), normalize(heroText));
      const dressHeading = JSON.parse(L.rowObj(rows, '1c').body)[3].children[3].title[0].children.map(span => span.text).join('');
      assert(normalize(page.before).includes(normalize(dressHeading)), 'dress heading missing from SSR');
      assert.match(heroText, /Kragujevcu/);
    }
    console.log('PASS ' + file + ': metadata, schema, headings, Flight JSON and asset links');
  }
  assert.match(fs.readFileSync(path.join(root, 'robots.txt'), 'utf8'), /User-Agent: \*\s+Allow: \//);
  const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
  assert.match(sitemap, /<loc>https:\/\/marmis\.rs\/<\/loc>/);
  assert.match(sitemap, /<loc>https:\/\/marmis\.rs\/kontakt<\/loc>/);
  assert(!sitemap.includes('<lastmod>'), 'build date must not masquerade as content update date');
  const urlArg = process.argv.indexOf('--url');
  if (urlArg !== -1) {
    const base = process.argv[urlArg + 1];
    for (const route of ['/', '/kontakt', '/robots.txt', '/sitemap.xml']) {
      const response = await fetch(new URL(route, base));
      assert.equal(response.status, 200, route);
    }
    const redirect = await fetch(new URL('/registry', base), { redirect: 'manual' });
    assert.equal(redirect.status, 308);
    assert.equal(redirect.headers.get('location'), '/kontakt');
    console.log('PASS HTTP: pages, robots, sitemap and legacy redirect');
  }
}
check().catch(error => { console.error(error); process.exitCode = 1; });
