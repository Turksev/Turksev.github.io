# -*- coding: utf-8 -*-
"""Kelimeleri kalip uretimi icin paketler.

  python kalip-paketle.py           -> kalip-girdi/k2..k4-pNN.json (ilk tur, 2-4. katman)
  python kalip-paketle.py --eksik   -> kalip-girdi/eN-pNN.json (kaliplar.js'te olmayan
                                        her kelime, katman katman)

--eksik neden gerekli: ilk tur 2-4. katman icin kosmustu, sonra puan esikleri
degisti (20/15/10 -> 17/12/10) ve ~800 kelime 5. katmandan 4. katmana kaydi.
Ayrica 1. katman ilk turda hic kapsama alinmamisti. --eksik guncel dizini
kaliplar.js ile karsilastirip yalnizca acik kalanlari paketler; bitmis paketler
yeniden yazilmaz.

Paket adi ilk turda kN-, eksik turunda eN- ile baslar; kalip-dogrula.py girdi
klasorundeki her pakete karsilik bir cikti bekler, boylece kalan is gorunur olur.
"""
import io
import json
import os
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')
SITE = r'C:\Users\Trk\Desktop\YDS\04_Github'
BURASI = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(BURASI, 'kalip-girdi')
os.makedirs(OUT, exist_ok=True)
EKSIK = '--eksik' in sys.argv
BOY = 100

# Once en cok ise yarayan katmanlar: 4 (esik degisiminden dogan bosluk),
# sonra 5-6 (sirada bekleyen is), sonra 1 (hic kapsanmamisti), sonra artiklar.
KATMANLAR = [4, 5, 6, 1, 2, 3, 7] if EKSIK else [2, 3, 4]

dizin = io.open(os.path.join(SITE, 'data', 'kelime-dizin.js'), encoding='utf-8').read()
kayitlar = [m.groupdict() for m in re.finditer(
    r'\{e:"(?P<e>.*?)",t:"(?P<t>.*?)"(?:,p:[\d.]+)?,k:(?P<k>\d),y:"(?P<y>.*?)"\}', dizin)]

bitmis = set()
if EKSIK:
    kal = io.open(os.path.join(SITE, 'tools', 'kaliplar.js'), encoding='utf-8').read()
    bitmis = set(re.findall(r'^"((?:[^"\\]|\\.)*)":', kal, re.M))
    print('kaliplar.js: %d kelime bitmis' % len(bitmis))


def atlanir(e):
    """Dil bilgisi yapilari kalip alamaz: dogrulayici hedef ifadenin kalipta
    birebir gecmesini ister, "would have + V3" ya da "fail/failed to" hicbir
    dogal kalipta oyle gecmez. Bunlar ayri ele alinacak."""
    return '+' in e or '/' in e


toplam = 0
atlanan = []
for kat in KATMANLAR:
    tam = io.open(os.path.join(SITE, 'data', 'kelime-k%d.js' % kat), encoding='utf-8').read()
    anlam = {}
    for m in re.finditer(r'"([^"]+)":\{a:\[(.*?)\]([,}])', tam):
        anlam[m.group(1)] = [a for a, _b, _c in
                             re.findall(r'\{tr:"(.*?)",ex:"(.*?)",exTr:"(.*?)"\}', m.group(2))]

    kelimeler = []
    for r in kayitlar:
        if int(r['k']) != kat or r['e'] in bitmis:
            continue
        if EKSIK and atlanir(r['e']):
            atlanan.append(r['e'])
            continue
        kelimeler.append({'e': r['e'], 'y': r['y'], 't': r['t'],
                          'anlamlar': anlam.get(r['e'], [])})
    if not kelimeler:
        continue
    onek = 'e' if EKSIK else 'k'
    for i in range(0, len(kelimeler), BOY):
        ad = '%s%d-p%02d.json' % (onek, kat, i // BOY + 1)
        io.open(os.path.join(OUT, ad), 'w', encoding='utf-8').write(
            json.dumps(kelimeler[i:i + BOY], ensure_ascii=False, indent=1))
    toplam += len(kelimeler)
    print('katman %d: %d kelime, %d paket' % (kat, len(kelimeler), (len(kelimeler) + BOY - 1) // BOY))

print('toplam', toplam, 'kelime')
if atlanan:
    print('atlanan yapi girdisi (%d): %s' % (len(atlanan), ', '.join(atlanan)))
