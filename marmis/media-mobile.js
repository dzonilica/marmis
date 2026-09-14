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
 * Skripta mora da se ucita bez defer/async, u <head>, da bi MutationObserver
 * uhvatio <video> cim ga parser napravi — pre nego sto krene preuzimanje.
 */
(function () {
  "use strict";

  var DESKTOP = "Media-module-scss-module__lFYlva__desktop";
  var MOBILE = "Media-module-scss-module__lFYlva__mobile";
  var BREAKPOINT = "(min-width: 930px)";

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
    try {
      video.load();
      var p = video.play();
      if (p && p.catch) p.catch(function () {});
    } catch (e) {}
  }

  function apply(video) {
    var kind = variantOf(video);
    if (!kind) return;
    if (kind === (mq.matches ? "desktop" : "mobile")) unpark(video);
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
