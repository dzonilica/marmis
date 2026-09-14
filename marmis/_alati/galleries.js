'use strict';
// Galerija "Otvaranje" kao stablo elemenata -> isti SSR HTML i RSC (red 35).
// (Verzije Trake i Kolaz su uklonjene 2026-09-11; stari kod je u _backup-2026-09-11-tri-galerije/.)
const { h, button } = require('./lib.js');

const G = {
  g1: { file: 'gal-01.jpg', w: 1000, h: 1500, cap: 'Haljina sa volanima', alt: 'Ružičasta haljina sa volanima u vrtu ruža' },
  g2: { file: 'gal-02.jpg', w: 1000, h: 1400, cap: 'Krojačke makaze', alt: 'Krojačke makaze i metar' },
  g3: { file: 'gal-03.jpg', w: 720, h: 960, cap: 'Satenska balon haljina', alt: 'Satenska balon haljina na krojačkoj lutki' },
  g4: { file: 'gal-04.jpg', w: 736, h: 1104, cap: 'Korset i balon suknja', alt: 'Bela haljina sa korsetom i balon suknjom' },
  g5: { file: 'gal-05.jpg', w: 736, h: 982, cap: 'Svečana haljina od satena', alt: 'Svečana haljina od belog satena' },
  g6: { file: 'gal-06.jpg', w: 564, h: 1000, cap: 'Pribor za šivenje', alt: 'Makaze, metar, konac i dugmad' },
  g7: { file: 'gal-07.jpg', w: 1000, h: 1778, cap: 'Radionica', alt: 'Radionica sa skicama, šivaćom mašinom i krojačkom lutkom' },
  g8: { file: 'gal-08.jpg', w: 736, h: 982, cap: 'Haljine pred probu', alt: 'Haljine na krojačkim lutkama' },
  g9: { file: 'gal-09.jpg', w: 734, h: 936, cap: 'Komadi na lutkama', alt: 'Sašiveni komadi na krojačkim lutkama' },
  g10: { file: 'gal-10.jpg', w: 816, h: 1456, cap: 'Draperija na lutki', alt: 'Draperija od tkanine na lutki pored šivaće mašine' },
  g11: { file: 'gal-11.jpg', w: 736, h: 1308, cap: 'Korset u izradi', alt: 'Korset u izradi na krojačkoj lutki' },
};

function fig(id, key, className, style, extra) {
  const g = G[id];
  return h('figure', Object.assign({ key, className: 'mg__fig' + (className ? ' ' + className : ''), style }, extra || {}),
    h('div', { className: 'mg__media' },
      h('img', { src: '/media/' + g.file, alt: g.alt, width: g.w, height: g.h, loading: 'lazy', decoding: 'async' })),
    h('figcaption', { className: 'mg__cap' }, h('span', null, g.cap)));
}

const cta = () => button({
  className: 'mg__btn', href: '/kontakt', key: 'mgcta2',
  spans: [[['em'], 'Kontaktirajte'], [[], ' '], [['uppercase'], 'nas']],
});

// ---- Otvaranje --------------------------------------------------------------
function otvaranje() {
  // [slika, oblast u mrezi, visina u celiji, poravnanje x, poravnanje y, faktor udaljenosti]
  const cells = [
    ['g7', 'a', '.92', 'flex-end', 'flex-end', '1.7'],
    ['g3', 'b', '1', 'center', 'flex-end', '1.35'],
    ['g9', 'c', '.92', 'center', 'flex-end', '1.35'],
    ['g2', 'd', '1', 'flex-start', 'flex-end', '1.7'],
    ['g10', 'e', '.9', 'flex-end', 'center', '1.35'],
    ['g5', 'f', '.78', 'flex-end', 'center', '1'],
    ['g4', 'g', '.78', 'flex-start', 'center', '1'],
    ['g6', 'h', '.9', 'flex-start', 'center', '1.35'],
    ['g8', 'i', '1', 'flex-end', 'flex-start', '1.7'],
    ['g11', 'j', '.92', 'flex-start', 'flex-start', '1.35'],
  ];
  return h('section', { className: 'mg', 'aria-label': 'Galerija radova' },
    h('div', { className: 'mg-o', 'data-mg': 'otvaranje' },
      h('div', { className: 'mg-o__stage' },
        h('div', { className: 'mg-o__grid' },
          h('h2', { key: 't', className: 'mg-o__title' },
            h('em', null, 'sašiveno'), h('br'), h('span', { className: 'uppercase' }, 'kod nas')),
          cells.map(c => h('div', {
            key: c[1], className: 'mg-o__cell',
            style: { gridArea: c[1], justifyContent: c[3], alignItems: c[4] },
          }, fig(c[0], null, null, { '--s': c[2] }, { 'data-mg-k': c[5] }))),
          h('div', { key: 'x', className: 'mg-o__cell mg-o__cell--x', style: { gridArea: 'x' } },
            fig('g1', null, 'mg-o__hero')),
          h('div', { key: 'k', className: 'mg-o__cta' }, cta())))));
}

module.exports = [
  { type: 'galerija-otvaranje', key: 'g2', row: '35', tree: otvaranje() },
];
