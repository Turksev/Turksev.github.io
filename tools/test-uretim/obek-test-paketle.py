# -*- coding: utf-8 -*-
"""Deyimsel fiil + edat kalibi obekleri -> gunun testi cumlesi girdi paketleri.
Sinavda cok gecenden aza dogru siralanir; ilk paketler en degerlileri tasir."""
import io
import json
import os
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')
SITE = r'C:\Users\Trk\Desktop\YDS\04_uygulama'
BURASI = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(BURASI, 'obek-test-girdi')
os.makedirs(OUT, exist_ok=True)
HEDEF = ('deyimsel fiil', 'edat kalıbı')

s = io.open(os.path.join(SITE, 'data', 'obekler.js'), encoding='utf-8').read()
kayitlar = []
for m in re.finditer(r'\{f:"(.*?)",y:"(.*?)",s:(\d+),kn:"(.*?)",a:\[(.*?)\]\}', s):
    if m.group(2) not in HEDEF:
        continue
    anlamlar = re.findall(r'\{tr:"(.*?)",ex:"(.*?)",exTr:"(.*?)"\}', m.group(5))
    kayitlar.append({
        'e': m.group(1), 'y': m.group(2), 's': int(m.group(3)),
        't': '; '.join(a[0] for a in anlamlar[:2]),
        'ornek': [a[1] for a in anlamlar if a[1]][:2],
    })

kayitlar.sort(key=lambda k: (-k['s'], k['e']))
print('hedef öbek:', len(kayitlar))
for i in range(0, len(kayitlar), 70):
    ad = 'ot-p%02d.json' % (i // 70 + 1)
    io.open(os.path.join(OUT, ad), 'w', encoding='utf-8').write(
        json.dumps(kayitlar[i:i + 70], ensure_ascii=False, indent=1))
print('paket:', (len(kayitlar) + 69) // 70)
