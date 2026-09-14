# -*- coding: utf-8 -*-
"""
Pravi woff2 fajlove za MARMIS iz izvornih Google Fonts TTF-ova.

    python _fontovi/napravi-fontove.py

EB Garamond menja Louize Display, Inter menja Beausite Classic (oba OFL).
Za svaki rez: promenljivi TTF -> fiksna debljina -> isecanje na slova koja sajt
zaista koristi -> woff2. Rezultat je po jedan fajl za svaki rez, kao sto je bio
i original, pa @font-face ostaje jednostavan (bez unicode-range podskupova).

Izlaz: fonts/EBGaramond-Regular.woff2, -Italic, fonts/Inter-Regular, -Medium
       + fonts/LICENSE-EBGaramond.txt, fonts/LICENSE-Inter.txt
"""
import io, os, sys, urllib.request

from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools import subset

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTS = os.path.join(ROOT, 'fonts')
RAW = 'https://raw.githubusercontent.com/google/fonts/main/ofl/'

# Latinica + srpski (č ć ž š đ) + interpunkcija i simboli koje sajt koristi.
# Kompletan latin-ext nije potreban; ovako su fajlovi znatno manji.
UNICODES = (
    'U+0020-007E,'          # osnovna latinica, brojevi, interpunkcija
    'U+00A0-00FF,'          # Latin-1 (akcenti, °, ©, ×)
    'U+0100-017F,'          # Latin Extended-A — tu su č ć ž š đ Č Ć Ž Š Đ
    'U+2010-2015,'          # crtice, en/em dash
    'U+2018-201E,'          # jednostruki i dvostruki navodnici, „ “
    'U+2022,U+2026,'        # bullet, …
    'U+2030,U+2039-203A,'   # ‰, ‹ ›
    'U+20AC,'               # €
    'U+2122,U+2190-2193,'   # ™, strelice
    'U+00D7,U+2212'         # ×, −
)

REZOVI = [
    # (folder u repou, izvorni TTF,               osa,      izlazno ime)
    ('ebgaramond', 'EBGaramond[wght].ttf',        {'wght': 400}, 'EBGaramond-Regular.woff2'),
    ('ebgaramond', 'EBGaramond-Italic[wght].ttf', {'wght': 400}, 'EBGaramond-Italic.woff2'),
    ('inter',      'Inter[opsz,wght].ttf',        {'wght': 400, 'opsz': 14}, 'Inter-Regular.woff2'),
    ('inter',      'Inter[opsz,wght].ttf',        {'wght': 500, 'opsz': 14}, 'Inter-Medium.woff2'),
]

LICENCE = [('ebgaramond', 'LICENSE-EBGaramond.txt'), ('inter', 'LICENSE-Inter.txt')]


def skini(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'marmis-font-build'})
    with urllib.request.urlopen(req, timeout=120) as r:
        return r.read()


def main():
    os.makedirs(FONTS, exist_ok=True)
    kes = {}
    ukupno = 0

    for folder, ttf, ose, izlaz in REZOVI:
        url = RAW + folder + '/' + urllib.parse.quote(ttf)
        if url not in kes:
            sys.stdout.write('  skidam %s ... ' % ttf)
            sys.stdout.flush()
            kes[url] = skini(url)
            print('%.1f MB' % (len(kes[url]) / 1024 / 1024))

        font = TTFont(io.BytesIO(kes[url]))

        # promenljivi font -> jedan fiksan rez
        if 'fvar' in font:
            font = instancer.instantiateVariableFont(font, ose, inplace=False, updateFontNames=True)

        opts = subset.Options()
        opts.flavor = 'woff2'
        opts.desubroutinize = True
        # Samo ono sto zaista utice na iscrtavanje. Sa '*' subsetter povuce i
        # stilske setove, kapitalke i alternative koje sajt nigde ne trazi —
        # EB Garamond je tako bio 161 kB umesto ~70.
        opts.layout_features = ['ccmp', 'locl', 'kern', 'mark', 'mkmk',
                                'liga', 'clig', 'rlig', 'calt']
        opts.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14]   # ukljucujuci licencu
        opts.notdef_outline = True
        opts.drop_tables += ['DSIG']
        s = subset.Subsetter(options=opts)
        s.populate(unicodes=subset.parse_unicodes(UNICODES))
        s.subset(font)

        # MSDF generatoru za 3D logo treba TTF, ne woff2 — vidi napravi-logo.js
        if izlaz == 'EBGaramond-Regular.woff2':
            font.flavor = None
            font.save(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'EBGaramond-Regular.ttf'))

        # opts.flavor vazi samo kad se subset pokrece kao alat iz komandne linije;
        # kroz biblioteku se mora postaviti ovde, inace izadje nekompresovan TTF
        # pod imenom .woff2 (dvostruko veci, a CSS tvrdi da je woff2).
        font.flavor = 'woff2'
        put = os.path.join(FONTS, izlaz)
        font.save(put)
        font.close()
        vel = os.path.getsize(put)
        ukupno += vel
        print('  %-28s %6.1f kB  (%s)' % (izlaz, vel / 1024, ', '.join('%s=%s' % kv for kv in ose.items())))

    for folder, ime in LICENCE:
        put = os.path.join(FONTS, ime)
        with open(put, 'wb') as f:
            f.write(skini(RAW + folder + '/OFL.txt'))
        print('  %-28s %6.1f kB' % (ime, os.path.getsize(put) / 1024))

    print('\n  ukupno woff2: %.1f kB' % (ukupno / 1024))


if __name__ == '__main__':
    import urllib.parse
    main()
