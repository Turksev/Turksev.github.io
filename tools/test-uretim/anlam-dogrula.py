# -*- coding: utf-8 -*-
"""Anlam denetimi ciktilarini toplar ve dogrular.

  python anlam-dogrula.py            -> rapor + anlam-bulgular.json (birlesik)
  python anlam-dogrula.py --rapor    -> yalniz rapor

Bulgular otomatik uygulanMAZ: elden gecirilip tools/ek-ornekler.js (anlam/ornek)
ya da tools/tur-duzeltme.js (tur) uzerinden siteye islenir.
"""
import io
import json
import os
import sys
from collections import Counter

sys.stdout.reconfigure(encoding='utf-8')
BURASI = os.path.dirname(os.path.abspath(__file__))
GIRDI = os.path.join(BURASI, 'anlam-girdi')
CIKTI = os.path.join(BURASI, 'anlam-cikti')
YALNIZ_RAPOR = '--rapor' in sys.argv

bulgular, hatalar, eksik = [], [], []
taranan = 0
sev = Counter()
alan = Counter()

for ad in sorted(os.listdir(GIRDI)):
    girdi = json.load(io.open(os.path.join(GIRDI, ad), encoding='utf-8'))
    kelimeler = {r['e'] for r in girdi}
    yol = os.path.join(CIKTI, ad)
    if not os.path.exists(yol):
        eksik.append(ad)
        continue
    try:
        cikti = json.loads(io.open(yol, encoding='utf-8-sig').read())
    except Exception as e:
        eksik.append('%s (JSON bozuk: %s)' % (ad, str(e)[:50]))
        continue
    taranan += len(girdi)
    for r in cikti:
        if not isinstance(r, dict) or not r.get('e'):
            hatalar.append('%s: bozuk kayıt' % ad)
            continue
        if r['e'] not in kelimeler:
            hatalar.append('%s: pakette olmayan kelime "%s"' % (ad, r['e']))
            continue
        if r.get('sev') not in ('hata', 'süpheli', 'supheli'):
            hatalar.append('%s %s: sev alanı geçersiz' % (ad, r['e']))
            continue
        r['paket'] = ad
        bulgular.append(r)
        sev[r['sev']] += 1
        alan[r.get('alan', '?')] += 1

print('taranan %d kelime · bulgu %d (hata %d, süpheli %d) · biçim hatası %d · eksik paket %d'
      % (taranan, len(bulgular), sev['hata'], sev['süpheli'] + sev['supheli'],
         len(hatalar), len(eksik)))
if alan:
    print('  alanlara göre: ' + ' · '.join('%s %d' % (k, v) for k, v in alan.most_common()))
for x in eksik[:8]:
    print('  EKSIK', x)
for h in hatalar[:10]:
    print('  HATA', h)

if not YALNIZ_RAPOR and bulgular:
    io.open(os.path.join(BURASI, 'anlam-bulgular.json'), 'w', encoding='utf-8',
            newline='\n').write(json.dumps(bulgular, ensure_ascii=False, indent=1))
    print('yazıldı anlam-bulgular.json (%d bulgu)' % len(bulgular))
