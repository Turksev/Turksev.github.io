# -*- coding: utf-8 -*-
"""Cok anlamli kelimeleri ve obekleri yildiz (YDS onemi) uretimi icin paketler.

  python yildiz-paketle.py     -> yildiz-girdi/k{n}-pNN.json, obek-pNN.json

Yalnizca birden cok anlami olan kayitlar paketlenir; tek anlamlida siralanacak
ya da karsilastirilacak bir sey yok.
"""
import io
import json
import os
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')
SITE = r'C:\Users\Trk\Desktop\Turksev.github.io'
BURASI = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(BURASI, 'yildiz-girdi')
os.makedirs(OUT, exist_ok=True)
BOY = 150

ANLAM = re.compile(r'\{tr:"(.*?)",ex:"(.*?)",exTr:"(.*?)"\}')


def coz(ham):
    """JS kaynagindaki kacisli diziyi normal metne cevirir."""
    return json.loads('"' + ham + '"')


def paketle(kayitlar, onek):
    for i in range(0, len(kayitlar), BOY):
        ad = '%s-p%02d.json' % (onek, i // BOY + 1)
        io.open(os.path.join(OUT, ad), 'w', encoding='utf-8').write(
            json.dumps(kayitlar[i:i + BOY], ensure_ascii=False, indent=1))
    return (len(kayitlar) + BOY - 1) // BOY


# ---------------------------------------------------------------- kelimeler
dizin = io.open(os.path.join(SITE, 'data', 'kelime-dizin.js'), encoding='utf-8').read()
tur = {}
puan = {}
for m in re.finditer(r'\{e:"(.*?)",t:".*?"(?:,p:([\d.]+))?,k:\d,y:"(.*?)"\}', dizin):
    tur[coz(m.group(1))] = coz(m.group(3))
    if m.group(2):
        puan[coz(m.group(1))] = m.group(2)

toplam = 0
for kat in range(1, 8):
    yol = os.path.join(SITE, 'data', 'kelime-k%d.js' % kat)
    if not os.path.exists(yol):
        continue
    metin = io.open(yol, encoding='utf-8').read()
    kayitlar = []
    for m in re.finditer(r'"([^"]+)":\{a:\[(.*?)\](?=[,}])', metin):
        en = coz(m.group(1))
        anlamlar = [{'tr': coz(a), 'ex': coz(b)} for a, b, _c in ANLAM.findall(m.group(2))]
        if len(anlamlar) < 2:
            continue
        kayitlar.append({'e': en, 'k': kat, 'y': tur.get(en, ''),
                         'p': puan.get(en, ''), 'a': anlamlar})
    if kayitlar:
        n = paketle(kayitlar, 'k%d' % kat)
        toplam += len(kayitlar)
        print('katman %d: %d cok anlamli kelime, %d paket' % (kat, len(kayitlar), n))

# ---------------------------------------------------------------- obekler
obek = io.open(os.path.join(SITE, 'data', 'obekler.js'), encoding='utf-8').read()
kayitlar = []
for m in re.finditer(r'\{f:"(.*?)",y:"(.*?)",s:\d+,kn:".*?",a:\[(.*?)\]\}', obek):
    anlamlar = [{'tr': coz(a), 'ex': coz(b)} for a, b, _c in ANLAM.findall(m.group(3))]
    if len(anlamlar) < 2:
        continue
    kayitlar.append({'e': coz(m.group(1)), 'k': 0, 'y': coz(m.group(2)),
                     'p': '', 'a': anlamlar})
if kayitlar:
    n = paketle(kayitlar, 'obek')
    toplam += len(kayitlar)
    print('obek: %d cok anlamli, %d paket' % (len(kayitlar), n))

print('toplam %d kayit' % toplam)
