/* MARMIS — sekcija sa tri koraka ("stop scroll") na telefonu.
 *
 * Problem: na telefonu se vidi samo prva slika, druga i treca nikad ne dodju.
 *
 * Kako sekcija radi: sva tri kadra su jedan preko drugog (position: sticky),
 * i svaki se otkriva clip-path-om koji citira CSS promenljivu --mask-progress:
 *
 *   clip-path: polygon(calc((1 - var(--mask-progress)) * 100%) 0, ...)
 *
 * React tu promenljivu racuna iz kesiranih mera (visina prozora i pozicija
 * sekcije, uzete pri montiranju) i upisuje je na skrol. Prvi kadr ima
 * clip-path: none, pa se on vidi uvek; drugi i treci zavise iskljucivo od te
 * promenljive. Dve stvari to obaraju bas na telefonu:
 *
 *   1. 100lvh (visina kadra) nije isto sto i window.innerHeight dok je vidljiva
 *      adresna traka, a traka se na skrol pojavljuje i nestaje, pa se kesirane
 *      mere razidju sa stvarnim rasporedom;
 *   2. WebKit ne preslikava promenu *neregistrovane* CSS promenljive unutar
 *      calc() u clip-path-u — vrednost se promeni, ali se element ne precrta.
 *
 * U oba slucaja ostane clip-path za progres 0, tj. kadr ostane skroz odsecen.
 *
 * Resenje: ispod 930px (isti prelom koji sajt vec koristi) progres se racuna
 * ovde, iz zivih mera na svakom kadru (getBoundingClientRect, bez kesiranja i
 * bez window.innerHeight), i upisuje kao *obican* inline clip-path. Obicno
 * svojstvo svaki engine precrta, pa promenljiva vise nije na kriticnom putu.
 * Racunica je ista kao originalna: kadr krece da se otkriva kad "beacon" ispred
 * njega prodje vrh ekrana i otkrije se preko jedne svoje visine skrola.
 *
 * VAZNO (zasto ovo nije radilo do 2026-09-14): skripta ide sa `defer`, dakle
 * pre React hidracije. React pri hidraciji zameni te DOM cvorove novima, pa su
 * elementi zapamceni pri pokretanju odvojeni od stranice — clip-path se i dalje
 * upisivao, ali na cvorove kojih vise nema na ekranu. Zato se sada pri svakom
 * kadru proverava `isConnected` i lista se skuplja iznova cim se cvorovi
 * zamene; uz to se skuplja jos jednom na `load` i kratko posle njega.
 *
 * Dok je sekcija blizu ekrana racuna se u neprekidnoj rAF petlji, a ne samo na
 * `scroll` dogadjaj: iOS zna da priguši skrol dogadjaje dok traje inercija, pa
 * bi se kadrovi tada zaustavljali u pola otkrivanja.
 *
 * Struktura se ne dira (vidi _README-mirror.md): menja se samo inline
 * clip-path, koji React ne dodeljuje, pa ga ni ne brise pri iscrtavanju.
 * Iznad 930px se inline vrednost sklanja i sve vodi originalni CSS.
 */
(function () {
  'use strict';
  if (window.__mgKoraci) return;
  window.__mgKoraci = true;

  var K = 'FullSizeScrollerStepper-module-scss-module__K-7siW__';
  var SECTION = '.' + K + 'FullSizeScrollerStepper';
  var ITEM = '.' + K + 'FullSizeScrollerStepperItem';
  var DESKTOP = '(min-width: 930px)';

  var mq = window.matchMedia(DESKTOP);
  var groups = [];
  var io = null;
  var looping = false;
  var queued = false;
  var lastCollect = 0;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  function collect() {
    lastCollect = Date.now();
    if (io) io.disconnect();
    groups = [];
    var sections = document.querySelectorAll(SECTION);
    for (var i = 0; i < sections.length; i++) {
      var items = sections[i].querySelectorAll(ITEM);
      var list = [];
      /* prvi kadr ima clip-path: none iz CSS-a — njega ne diramo */
      for (var j = 1; j < items.length; j++) {
        var beacon = items[j].previousElementSibling;
        if (beacon) list.push({ el: items[j], beacon: beacon, last: null });
      }
      if (list.length) groups.push({ section: sections[i], items: list, near: true });
    }
    if (groups.length) watch();
    return groups.length > 0;
  }

  /* React pri hidraciji ume da zameni cvorove — tada zapamceni elementi vise
     nisu na stranici i treba ih pokupiti iznova */
  function stale() {
    for (var g = 0; g < groups.length; g++) {
      if (!groups[g].section.isConnected) return true;
      var items = groups[g].items;
      for (var i = 0; i < items.length; i++) {
        if (!items[i].el.isConnected || !items[i].beacon.isConnected) return true;
      }
    }
    return false;
  }

  function reveal(p) {
    if (p >= 1) return 'none';
    var x = ((1 - p) * 100).toFixed(2) + '%';
    return 'polygon(' + x + ' 0, 100% 0, 100% 100%, ' + x + ' 100%)';
  }

  function frame() {
    queued = false;
    if (stale() || (!groups.length && Date.now() - lastCollect > 500)) {
      if (!collect()) { looping = false; return; }
    }
    if (!groups.length) { looping = false; return; }
    var mobile = !mq.matches;
    var live = false;
    for (var g = 0; g < groups.length; g++) {
      if (!groups[g].near) continue;
      live = true;
      var items = groups[g].items;
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        if (!mobile) {
          if (it.last !== null) { it.el.style.clipPath = ''; it.last = null; }
          continue;
        }
        /* koliko je skrolovano otkako je beacon ispred kadra presao vrh ekrana;
           sve iz zive mere, pa promena visine prozora ne moze da razidje racun */
        var span = it.el.offsetHeight || window.innerHeight || 1;
        var past = -it.beacon.getBoundingClientRect().bottom;
        var p = clamp(past / span, 0, 1);
        var v = reveal(p);
        if (v !== it.last) { it.el.style.clipPath = v; it.last = v; }
      }
    }
    /* dok je sekcija na ekranu vrtimo se svaki kadr (iOS inercija) */
    if (live) { looping = true; requestAnimationFrame(frame); }
    else looping = false;
  }

  function schedule() {
    if (looping || queued) return;
    queued = true;
    requestAnimationFrame(frame);
  }

  function watch() {
    if (!('IntersectionObserver' in window)) return;
    io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        for (var g = 0; g < groups.length; g++) {
          if (groups[g].section === entries[i].target) groups[g].near = entries[i].isIntersecting;
        }
      }
      schedule();
    }, { rootMargin: '100% 0px' });
    for (var g = 0; g < groups.length; g++) io.observe(groups[g].section);
  }

  function start() {
    collect();
    schedule();
    addEventListener('scroll', schedule, { passive: true });
    addEventListener('resize', schedule, { passive: true });
    addEventListener('orientationchange', schedule, { passive: true });
    addEventListener('load', function () { collect(); schedule(); });
    /* React montira posle `load`; par kasnijih provera hvata i tu zamenu */
    setTimeout(function () { collect(); schedule(); }, 1200);
    setTimeout(function () { collect(); schedule(); }, 4000);
    if (window.visualViewport) {
      visualViewport.addEventListener('resize', schedule);
      visualViewport.addEventListener('scroll', schedule);
    }
    if (mq.addEventListener) mq.addEventListener('change', schedule);
    else if (mq.addListener) mq.addListener(schedule);
  }

  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', start);
  else start();
})();
