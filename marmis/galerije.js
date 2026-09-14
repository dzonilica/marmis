/* MARMIS galerija: pokret za galeriju "Otvaranje" na pocetnoj.
   Elemente renderuje React (SSR + RSC, vidi _README-mirror.md); ovde se
   menjaju samo transform/opacity preko inline stila i klasa na <html>,
   struktura se ne dira, pa hidracija ostaje cista.
   Petlja se vrti samo dok je neka galerija blizu ekrana (IntersectionObserver). */
(function () {
  'use strict';
  if (window.__mgInit) return;
  window.__mgInit = true;
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function inOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function all(el, sel) { return Array.prototype.slice.call(el.querySelectorAll(sel)); }
  // priblizi vrednost cilju; kad je dovoljno blizu, zakuca je (da petlja stane sa pisanjem)
  function ease(cur, target, k, eps) {
    if (cur === null) return target;
    var v = lerp(cur, target, k);
    return Math.abs(v - target) < eps ? target : v;
  }

  // Otvaranje: scena je zakucana (sticky), glavna slika se iz centra smanjuje
  //    u svoju celiju, a ostale uleću spolja, dalje slike brze (data-mg-k)
  function Otvaranje(el) {
    var stage = el.querySelector('.mg-o__stage');
    var hero = el.querySelector('.mg-o__hero');
    if (!stage || !hero) return null;
    el.setAttribute('data-mg-live', '');
    var cell = hero.parentNode;
    var items = all(el, '.mg-o__cell:not(.mg-o__cell--x) .mg__fig');
    var fades = all(el, '.mg-o__title, .mg-o__cta');
    var m = null, cur = null, last = null;

    function measure() {
      el.setAttribute('data-mg-live', '');
      hero.style.transform = '';
      items.forEach(function (it) { it.style.transform = ''; });
      var s = stage.getBoundingClientRect();
      var cx = s.left + s.width / 2, cy = s.top + s.height / 2;
      var h = hero.getBoundingClientRect();
      var c = cell.getBoundingClientRect();
      var fh = c.height, fw = fh * 2 / 3;
      if (fw > c.width) { fw = c.width; fh = fw * 1.5; }
      m = {
        sf: h.height ? fh / h.height : 1,
        dx: (c.left + c.width / 2) - (h.left + h.width / 2),
        dy: (c.top + c.height / 2) - (h.top + h.height / 2),
        items: items.map(function (it) {
          var r = it.getBoundingClientRect();
          var k = parseFloat(it.getAttribute('data-mg-k')) || 1.3;
          return { el: it, vx: (r.left + r.width / 2 - cx) * k, vy: (r.top + r.height / 2 - cy) * k };
        })
      };
      last = null;
    }

    return {
      el: el,
      measure: measure,
      frame: function () {
        if (!m) measure();
        if (!el.hasAttribute('data-mg-live')) el.setAttribute('data-mg-live', '');
        var r = el.getBoundingClientRect();
        var len = Math.max(1, r.height - stage.offsetHeight);
        // zum se zavrsi na ~62% zakucanog dela, ostatak je pauza na gotovom mozaiku
        var p = clamp(-r.top / (len * 0.62), 0, 1);
        cur = ease(cur, p, 0.12, 1e-4);
        if (cur === last) return;
        last = cur;
        var e = inOut(cur), q = 1 - e;
        hero.style.transform = 'translate(' + (m.dx * e).toFixed(1) + 'px,' + (m.dy * e).toFixed(1) +
          'px) scale(' + lerp(1, m.sf, e).toFixed(4) + ')';
        var sc = lerp(1.5, 1, e).toFixed(4), op = clamp(e * 1.6 - 0.15, 0, 1).toFixed(3);
        m.items.forEach(function (i) {
          i.el.style.transform = 'translate(' + (i.vx * q).toFixed(1) + 'px,' + (i.vy * q).toFixed(1) + 'px) scale(' + sc + ')';
          i.el.style.opacity = op;
        });
        var f = clamp((e - 0.72) / 0.28, 0, 1);
        fades.forEach(function (x) {
          x.style.opacity = f.toFixed(3);
          x.style.transform = 'translateY(' + ((1 - f) * 18).toFixed(1) + 'px)';
        });
      }
    };
  }

  var TYPES = { otvaranje: Otvaranje };
  var list = [], active = [], raf = 0;

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      var c = en.target.__mg;
      if (!c) return;
      var i = active.indexOf(c);
      if (en.isIntersecting && i < 0) active.push(c);
      if (!en.isIntersecting && i >= 0) active.splice(i, 1);
    });
    kick();
  }, { rootMargin: '30% 0px' });

  function tick() {
    raf = 0;
    if (!active.length) return;
    active.forEach(function (c) { c.frame(); });
    raf = requestAnimationFrame(tick);
  }
  function kick() { if (!raf && active.length) raf = requestAnimationFrame(tick); }

  function scan() {
    all(document, '[data-mg]').forEach(function (el) {
      if (el.__mg) return;
      var make = TYPES[el.getAttribute('data-mg')];
      var c = make && make(el);
      if (!c) return;
      el.__mg = c;
      list.push(c);
      io.observe(el);
    });
    // sekcije koje je React u medjuvremenu uklonio (navigacija na drugu stranu)
    list = list.filter(function (c) {
      if (document.documentElement.contains(c.el)) return true;
      io.unobserve(c.el);
      var i = active.indexOf(c);
      if (i >= 0) active.splice(i, 1);
      return false;
    });
  }

  function remeasure() {
    list.forEach(function (c) { c.measure(); });
    kick();
  }

  function start() {
    // Klasa se NE stavlja na <html>: taj cvor pripada React-u i on pri hidraciji
    // vrati svoj className, pa bi znak nestao (vidi galerije.css). Znak stoji na
    // samoj sekciji, kao atribut, i postavlja ga svaka galerija za sebe.
    scan();
    remeasure();
    var pending = 0;
    new MutationObserver(function () {
      if (pending) return;
      pending = requestAnimationFrame(function () { pending = 0; scan(); });
    }).observe(document.body, { childList: true, subtree: true });
    var rt = 0;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(remeasure, 120);
    });
    window.addEventListener('load', remeasure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
