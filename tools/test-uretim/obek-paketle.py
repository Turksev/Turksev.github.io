# -*- coding: utf-8 -*-
"""data/obekler.js -> tur-siniflandirma icin agent girdi paketleri."""
import io
import json
import os
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')
SITE = r'C:\Users\Trk\Desktop\YDS\04_Github'
BURASI = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(BURASI, 'obek-girdi')
os.makedirs(OUT, exist_ok=True)

s = io.open(os.path.join(SITE, 'data', 'obekler.js'), encoding='utf-8').read()
kayitlar = []
for m in re.finditer(r'\{f:"(.*?)",y:"(.*?)",s:(\d+),kn:"(.*?)",a:\[(.*?)\]\}', s):
    anlamlar = re.findall(r'\{tr:"(.*?)",ex:"(.*?)",exTr:"(.*?)"\}', m.group(5))
    kayitlar.append({
        'f': m.group(1), 'y': m.group(2), 's': int(m.group(3)), 'kn': m.group(4),
        'tr': [a[0] for a in anlamlar][:3],
        'ornek': (anlamlar[0][1] if anlamlar else ''),
    })

print('okunan öbek:', len(kayitlar))
kayitlar.sort(key=lambda k: (-k['s'], k['f']))
for i in range(0, len(kayitlar), 250):
    parca = kayitlar[i:i + 250]
    ad = 'o-p%02d.json' % (i // 250 + 1)
    io.open(os.path.join(OUT, ad), 'w', encoding='utf-8').write(
        json.dumps(parca, ensure_ascii=False, indent=1))
print('paket:', (len(kayitlar) + 249) // 250)
