/* MARMIS — na telefonu se ne skida desktop hero video (i obrnuto).
 *
 * Komponenta Media na sajtu iscrtava OBA videa u DOM (desktop i mobilni), pa
 * CSS-om (930px) sakriva onaj koji ne treba. Sakriven <video> i dalje ima src,
 * preload="metadata" i autoplay, pa ga browser svejedno skine: na telefonu je
 * to celih 2,5 MB /media/hero.mp4 preko 0,8 MB /media/hero-mobile.mp4 koji se
 * jedini vidi.
 *
 * Ovde se, pre nego sto React hidrira stranicu, sa nepotrebnog <video>-a skida
 * src (cuva se u data-mg-parked), skida autoplay i stavlja preload="none" —
 * browser tada ne povlaci nista. Ako se sirina prozora promeni (okretanje
 * telefona, promena velicine prozora), src se vrati i video krene.
 *
 * PUTANJE U HTML-U SE NE DIRAJU (vidi _README-mirror.md): src se ne prepisuje,
 * samo privremeno sklanja i vraca nepromenjen.
 *
 * Ovde se drzi i poster. U HTML-u <video> ima poster (prvi kadar, 16-28 KB) da
 * bi hero nesto naslikao dok video jos stize — to je LCP na telefonu. Komponenta
 * Media sa sajta prosledjuje <video>-u samo unapred poznata svojstva (src,
 * aria-label, preload...), a React pri hidraciji izbaci cele SSR <video> elemente
 * i napravi nove, bez postera. Zato se poster ne cita sa elementa nego iz mape
 * POSTERS ispod, i vraca se sve dok video stvarno ne krene: od prvog kadra poster
 * se ionako ne vidi i vise ga ne diramo.
 *
 * Ako se ime hero videa promeni, mapa mora da se promeni sa njim.
 *
 * Skripta mora da se ucita bez defer/async, u <head>, da bi MutationObserver
 * uhvatio <video> cim ga parser napravi — pre nego sto krene preuzimanje.
 */
(function () {
  "use strict";

  var DESKTOP = "Media-module-scss-module__lFYlva__desktop";
  var MOBILE = "Media-module-scss-module__lFYlva__mobile";
  var BREAKPOINT = "(min-width: 930px)";

  /* prvi kadar svakog hero videa; pravi ga ffmpeg, vidi SEO-PREGLED.md */
  var POSTERS = {
    "/media/hero.mp4": "/media/hero-still.jpg",
    "/media/hero-mobile.mp4": "/media/hero-mobile-still.jpg"
  };
  var MAX_RESTORE = 5; /* React ne bi trebalo da se otima; ovo je samo kocnica */

  var mq = window.matchMedia(BREAKPOINT);

  /* u kojoj je varijanti ovaj video — 'desktop', 'mobile' ili nista */
  function variantOf(video) {
    for (var el = video; el && el.classList; el = el.parentElement) {
      if (el.classList.contains(DESKTOP)) return "desktop";
      if (el.classList.contains(MOBILE)) return "mobile";
    }
    return null;
  }

  function park(video) {
    var src = video.getAttribute("src");
    if (!src || video.dataset.mgParked) return;
    video.dataset.mgParked = src;
    video.removeAttribute("src");
    video.removeAttribute("autoplay");
    video.setAttribute("preload", "none");
    video.removeAttribute("poster"); /* sakriven video ne treba ni poster da skida */
    try {
      video.load(); /* prekida preuzimanje ako je vec krenulo */
    } catch (e) {}
  }

  function unpark(video) {
    var src = video.dataset.mgParked;
    if (!src) return;
    delete video.dataset.mgParked;
    video.setAttribute("preload", "metadata");
    video.setAttribute("autoplay", "");
    video.setAttribute("src", src);
    restorePoster(video);
    try {
      video.load();
      var p = video.play();
      if (p && p.catch) p.catch(function () {});
    } catch (e) {}
  }

  /* ---- poster: drzi ga dok video ne krene ---- */

  /* src koji ovaj <video> treba da ima, i kad je trenutno parkiran */
  function posterFor(video) {
    var src = video.dataset.mgParked || video.getAttribute("src") || "";
    return POSTERS[src.split("?")[0]] || null;
  }

  function restorePoster(video) {
    var poster = posterFor(video);
    if (!poster || video.dataset.mgPlayed) return;
    if (video.getAttribute("poster") === poster) return;
    var used = +(video.dataset.mgRestored || 0);
    if (used >= MAX_RESTORE) return;
    video.dataset.mgRestored = used + 1;
    video.dataset.mgRestoring = "1";
    video.setAttribute("poster", poster);
    delete video.dataset.mgRestoring;
  }

  function guardPoster(video) {
    if (video.dataset.mgGuarded) return;
    video.dataset.mgGuarded = "1";
    /* Od prvog kadra poster vise nije vidljiv. */
    video.addEventListener("playing", function () {
      video.dataset.mgPlayed = "1";
    }, { once: true });
    new MutationObserver(function () {
      if (video.dataset.mgRestoring || video.dataset.mgParked) return;
      if (!video.getAttribute("poster")) restorePoster(video);
    }).observe(video, { attributes: true, attributeFilter: ["poster"] });
  }

  function apply(video) {
    var kind = variantOf(video);
    if (!kind) return;
    guardPoster(video);
    if (kind === (mq.matches ? "desktop" : "mobile")) { unpark(video); restorePoster(video); }
    else park(video);
  }

  function scan(node) {
    if (!node || node.nodeType !== 1) return;
    if (node.tagName === "VIDEO") apply(node);
    if (node.querySelectorAll) {
      var list = node.querySelectorAll("video");
      for (var i = 0; i < list.length; i++) apply(list[i]);
    }
  }

  new MutationObserver(function (records) {
    for (var i = 0; i < records.length; i++) {
      var added = records[i].addedNodes;
      for (var j = 0; j < added.length; j++) scan(added[j]);
    }
  }).observe(document.documentElement, { childList: true, subtree: true });

  function applyAll() {
    var list = document.querySelectorAll("video");
    for (var i = 0; i < list.length; i++) apply(list[i]);
  }

  if (mq.addEventListener) mq.addEventListener("change", applyAll);
  else if (mq.addListener) mq.addListener(applyAll);

  document.addEventListener("DOMContentLoaded", applyAll);
  window.addEventListener("load", applyAll);
})();
