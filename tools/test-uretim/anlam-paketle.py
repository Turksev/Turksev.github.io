# -*- coding: utf-8 -*-
"""Tum kelimeleri anlam denetimi icin paketler.

  python anlam-paketle.py     -> anlam-girdi/k{n}-pNN.json (180'er kelime)

25.08.2026 pilotu (320 kelime, %4,1 orneklem) %4,4 sorun buldu; bu hat
havuzun tamamini tarar. Ajanlar anlam-cikti/'ye YALNIZ sorunlari yazar;
duzeltmeler elden gecirilip tools/ek-ornekler.js uzerinden uygulanir.
"""
import io
import json
import os
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')
S = r'C:\Users\Trk\Desktop\Turksev.github.io'
BURASI = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(BURASI, 'anlam-girdi')
os.makedirs(OUT, exist_ok=True)
os.makedirs(os.path.join(BURASI, 'anlam-cikti'), exist_ok=True)
BOY = 180
JSTR = r'"(?:[^"\\]|\\.)*"'
q = json.loads
ANLAM = re.compile(r'\{tr:(%s),ex:(%s),exTr:(%s)(?:,yz:(\d))?\}' % (JSTR, JSTR, JSTR))

dizin = {}
for m in re.finditer(r'\{e:(%s),t:%s,(?:p:([\d.]+),)?k:(\d),y:(%s)\}' % (JSTR, JSTR, JSTR),
                     io.open(os.path.join(S, 'data', 'kelime-dizin.js'), encoding='utf-8').read()):
    dizin[q(m.group(1))] = {'p': m.group(2) or '', 'y': q(m.group(3))}

toplam = paket = 0
for kat in range(1, 8):
    yol = os.path.join(S, 'data', 'kelime-k%d.js' % kat)
    if not os.path.exists(yol):
        continue
    kayitlar = []
    for satir in io.open(yol, encoding='utf-8'):
        satir = satir.strip().rstrip(',')
        m = re.match(r'^(%s):\{a:\[' % JSTR, satir)
        if not m:
            continue
        e = q(m.group(1))
        anlamlar = [{'tr': q(a), 'ex': q(b), 'exTr': q(c)} for a, b, c, _d in ANLAM.findall(satir)]
        kayitlar.append({'e': e, 'k': kat, 'y': dizin[e]['y'], 'p': dizin[e]['p'], 'a': anlamlar})
    for i in range(0, len(kayitlar), BOY):
        ad = 'k%d-p%02d.json' % (kat, i // BOY + 1)
        io.open(os.path.join(OUT, ad), 'w', encoding='utf-8').write(
            json.dumps(kayitlar[i:i + BOY], ensure_ascii=False, indent=1))
        paket += 1
    toplam += len(kayitlar)
    print('katman %d: %d kelime, %d paket' % (kat, len(kayitlar), (len(kayitlar) + BOY - 1) // BOY))
print('toplam %d kelime, %d paket' % (toplam, paket))
