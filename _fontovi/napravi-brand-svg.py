# -*- coding: utf-8 -*-
"""
Pravi brand.svg — natpis MARMIS kao vektorske konture, iz EB Garamonda.

    python _fontovi/napravi-brand-svg.py

Stari brand.svg je bio iscrtan iz Louize Displaya, pa je i on nosio probnu
licencu: konture su izvedene iz fonta, iako je fajl samo SVG.

Zadrzava se `<symbol id="logo" viewBox="0 0 100 31">` i `fill="currentColor"`,
jer se na njih oslanjaju i HTML i chunk 0rr86m823plm1.js. Natpis se, kao i pre,
razvlaci na punu sirinu (100) i centrira po visini.
"""
import os

from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.misc.transform import Transform

TU = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(TU)
TTF = os.path.join(TU, 'EBGaramond-Regular.ttf')
IZLAZ = os.path.join(ROOT, 'brand.svg')

NATPIS = 'MARMIS'
VB_W, VB_H = 100.0, 31.0     # isti viewBox kao stari fajl

# Dodatni razmak medju slovima, u jedinicama fonta (upm = 1000). Prirodni razmak
# EB Garamonda je za ovoliki natpis pretesan — stari Louize logotip je imao
# osetno vise vazduha (prosek 1.75 naspram 0.91 jedinica viewBox-a po procepu).
# Ista vrednost stoji i u napravi-logo.js, da se SVG i 3D natpis ne raziđu.
RAZMAK = 35.0


def main():
    if not os.path.exists(TTF):
        raise SystemExit('nema %s — prvo: python _fontovi/napravi-fontove.py' % TTF)

    font = TTFont(TTF)
    gs = font.getGlyphSet()
    cmap = font.getBestCmap()
    hmtx = font['hmtx']

    # 1) slozi natpis u koordinatama fonta (y nagore)
    konture, pen_x = [], 0.0
    for ch in NATPIS:
        ime = cmap[ord(ch)]
        konture.append((ime, pen_x))
        pen_x += hmtx[ime][0] + RAZMAK

    # 2) izmeri stvarne granice mastila (ne napredovanja)
    bp = BoundsPen(gs)
    for ime, x in konture:
        gs[ime].draw(TransformPen(bp, Transform().translate(x, 0)))
    x0, y0, x1, y1 = bp.bounds

    # 3) mastilo -> viewBox: na punu sirinu, y se obrce, pa centriranje po visini
    k = VB_W / (x1 - x0)
    visina = (y1 - y0) * k
    gore = (VB_H - visina) / 2.0
    # SVG y nadole: tacka (x0, y1) fonta ide u (0, gore)
    osnova = Transform().translate(-x0 * k, gore + y1 * k).scale(k, -k)

    # Koordinate su u jedinicama viewBox-a (0-100), pa su tri decimale vise nego
    # dovoljne; pun zapis udvostrucuje fajl bez ikakve razlike na ekranu.
    def broj(n):
        return ('%.3f' % n).rstrip('0').rstrip('.') or '0'

    putanje = []
    for ime, x in konture:
        sp = SVGPathPen(gs, ntos=broj)
        gs[ime].draw(TransformPen(sp, osnova.translate(x, 0)))
        putanje.append(sp.getCommands())

    svg = ['<svg xmlns="http://www.w3.org/2000/svg" fill="none">',
           '  <symbol id="logo" viewBox="0 0 %g %g">' % (VB_W, VB_H),
           '    <g fill="currentColor">']
    for d in putanje:
        svg.append('      <path d="%s" fill="currentColor" />' % d)
    svg += ['    </g>', '  </symbol>', '</svg>', '']

    with open(IZLAZ, 'w', encoding='utf-8', newline='\n') as f:
        f.write('\n'.join(svg))

    print('  brand.svg: %d putanja, mastilo %.2f x %.2f u viewBox-u %g x %g'
          % (len(putanje), VB_W, visina, VB_W, VB_H))
    print('  (stari: 100.00 x 20.15 — EB Garamond je pri istoj sirini nizi)')
    print('  %.1f kB' % (os.path.getsize(IZLAZ) / 1024))
    font.close()


if __name__ == '__main__':
    main()
