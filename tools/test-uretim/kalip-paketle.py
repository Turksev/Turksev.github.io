# -*- coding: utf-8 -*-
"""2-4. katman kelimelerini kalip uretimi icin paketler.

  python kalip-paketle.py           -> kalip-girdi/k2..k4-pNN.json (100'er kelime)
"""
import io
import json
import os
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')
SITE = r'C:\Users\Trk\Desktop\Turksev.github.io'
BURASI = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(BURASI, 'kalip-girdi')
os.makedirs(OUT, exist_ok=True)
KATMANLAR = [2, 3, 4]
BOY = 100

dizin = io.open(os.path.join(SITE, 'data', 'kelime-dizin.js'), encoding='utf-8').read()
kayitlar = [m.groupdict() for m in re.finditer(
    r'\{e:"(?P<e>.*?)",t:"(?P<t>.*?)"(?:,p:[\d.]+)?,k:(?P<k>\d),y:"(?P<y>.*?)"\}', dizin)]

toplam = 0
for kat in KATMANLAR:
    tam = io.open(os.path.join(SITE, 'data', 'kelime-k%d.js' % kat), encoding='utf-8').read()
    anlam = {}
    for m in re.finditer(r'"([^"]+)":\{a:\[(.*?)\]([,}])', tam):
        anlam[m.group(1)] = [a for a, _b, _c in
                             re.findall(r'\{tr:"(.*?)",ex:"(.*?)",exTr:"(.*?)"\}', m.group(2))]

    kelimeler = [{'e': r['e'], 'y': r['y'], 't': r['t'], 'anlamlar': anlam.get(r['e'], [])}
                 for r in kayitlar if int(r['k']) == kat]
    for i in range(0, len(kelimeler), BOY):
        ad = 'k%d-p%02d.json' % (kat, i // BOY + 1)
        io.open(os.path.join(OUT, ad), 'w', encoding='utf-8').write(
            json.dumps(kelimeler[i:i + BOY], ensure_ascii=False, indent=1))
    toplam += len(kelimeler)
    print('katman %d: %d kelime, %d paket' % (kat, len(kelimeler), (len(kelimeler) + BOY - 1) // BOY))
print('toplam', toplam, 'kelime')
