# -*- coding: utf-8 -*-
"""Kelime katmanlarini 70'lik girdi paketlerine boler (paketle.js'in Python surumu;
node makineden kaldirildi).

  python paketle.py 5        -> girdi/k5-pNN.json
  python paketle.py 1 5 6
"""
import io
import json
import os
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')
SITE = r'C:\Users\Trk\Desktop\Turksev.github.io'
BURASI = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(BURASI, 'girdi')
os.makedirs(OUT, exist_ok=True)

katmanlar = [int(x) for x in sys.argv[1:]] or [5]

dizin = io.open(os.path.join(SITE, 'data', 'kelime-dizin.js'), encoding='utf-8').read()
kayitlar = [m.groupdict() for m in re.finditer(
    r'\{e:"(?P<e>.*?)",t:"(?P<t>.*?)"(?:,p:[\d.]+)?,k:(?P<k>\d),y:"(?P<y>.*?)"\}', dizin)]

for kat in katmanlar:
    tam = io.open(os.path.join(SITE, 'data', 'kelime-k%d.js' % kat), encoding='utf-8').read()
    ornekler, anlamlar = {}, {}
    for m in re.finditer(r'"([^"]+)":\{a:\[(.*?)\]([,}])', tam):
        parcalar = re.findall(r'\{tr:"(.*?)",ex:"(.*?)",exTr:"(.*?)"\}', m.group(2))
        ornekler[m.group(1)] = [p[1] for p in parcalar if p[1]]
        anlamlar[m.group(1)] = [p[0] for p in parcalar]

    kelimeler = [{
        'e': r['e'], 'y': r['y'], 't': r['t'],
        'ornek': ornekler.get(r['e'], []),
        'anlamlar': anlamlar.get(r['e'], []),
    } for r in kayitlar if int(r['k']) == kat]

    # Paket numaraları katman içinde 1'den başlar: k5-p01, k5-p02, …
    for i in range(0, len(kelimeler), 70):
        ad = 'k%d-p%02d.json' % (kat, i // 70 + 1)
        io.open(os.path.join(OUT, ad), 'w', encoding='utf-8').write(
            json.dumps(kelimeler[i:i + 70], ensure_ascii=False, indent=1))
    print('katman %d: %d kelime, %d paket' % (kat, len(kelimeler), (len(kelimeler) + 69) // 70))
