# -*- coding: utf-8 -*-
"""Yayimlanan sitenin boyutunu olcup data/depo.js dosyasina yazar.

GitHub Pages'in yumusak siniri 1 GB'dir. Bu betik Jekyll'in yayina aldigi
dosyalari tarar, toplam boyutu ve en buyuk klasorleri kaydeder; site alt
bilgide bir cubukla gosterir. Yayindan once calistir:

  python tools/depo-olcu.py
"""
import io
import json
import os
import sys
from datetime import date

sys.stdout.reconfigure(encoding='utf-8')
SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ATLA_DIZINLER = {
    '.git', '.github', '.claude', '__pycache__', 'node_modules', 'tools'
}
ATLA_DOSYALAR = {'_config.yml', 'README.md', 'firebase.json', 'firestore.rules'}

toplam = 0
dosya = 0
klasor = {}

for kok, dizinler, dosyalar in os.walk(SITE):
    dizinler[:] = [d for d in dizinler if d not in ATLA_DIZINLER]
    for ad in dosyalar:
        if ad in ATLA_DOSYALAR:
            continue
        yol = os.path.join(kok, ad)
        try:
            n = os.path.getsize(yol)
        except OSError:
            continue
        toplam += n
        dosya += 1
        bagil = os.path.relpath(yol, SITE).replace('\\', '/')
        ust = bagil.split('/')[0] if '/' in bagil else '(kök)'
        klasor[ust] = klasor.get(ust, 0) + n

buyukler = sorted(klasor.items(), key=lambda x: -x[1])[:5]
veri = {
    'bayt': toplam,
    'dosya': dosya,
    'sinir': 1024 ** 3,                    # GitHub Pages yumuşak sınırı: 1 GB
    'zaman': date.today().isoformat(),
    'klasor': [{'ad': a, 'bayt': b} for a, b in buyukler],
}

icerik = ('/* Depo kullanımı — tools/depo-olcu.py üretir, elle düzenleme.\n'
          '   Yayımlanan dosyaların toplam boyutu; site alt bilgide gösterir. */\n'
          'window.DEPO = %s;\n' % json.dumps(veri, ensure_ascii=False, sort_keys=True))
io.open(os.path.join(SITE, 'data', 'depo.js'), 'w', encoding='utf-8', newline='\n').write(icerik)

print('toplam %.1f MB  ·  %d dosya  ·  1 GB\'ın %%%.2f\'si' %
      (toplam / 1048576.0, dosya, toplam / (1024.0 ** 3) * 100))
for a, b in buyukler:
    print('  %-14s %6.1f MB' % (a, b / 1048576.0))
