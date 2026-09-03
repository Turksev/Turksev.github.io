# -*- coding: utf-8 -*-
"""Cok anlamli kelimeleri ve obekleri yildiz (YDS onemi) uretimi icin paketler.

  python yildiz-paketle.py            -> yildiz-girdi/k{n}-pNN.json, obek-pNN.json
  python yildiz-paketle.py --eksik    -> yalniz yildizi olmayanlar: ek-pNN.json

--eksik, sonradan cok anlamli hale gelen kelimeler icindir (ornegin tur basina
ornek yazilinca bolunenler). Mevcut paketleri hic ellemez; yeni ek-pNN ciftleri
yazar, yildiz-dogrula.py onlari kendiliginden toplar.
"""
import io
import json
import os
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')
SITE = r'C:\Users\Trk\Desktop\YDS\04_Github'
BURASI = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(BURASI, 'yildiz-girdi')
os.makedirs(OUT, exist_ok=True)
BOY = 150
YALNIZ_EKSIK = '--eksik' in sys.argv

# yz alani sonradan geldi; deseni ona kor birakmak starli kayitlari
# "anlamsiz" gosteriyordu.
ANLAM = re.compile(r'\{tr:"(.*?)",ex:"(.*?)",exTr:"(.*?)"(?:,yz:(\d))?\}')


def yildizlilari_oku():
    """tools/anlam-yildiz.js icinde kaydi olan basliklar."""
    yol = os.path.join(SITE, 'tools', 'anlam-yildiz.js')
    if not os.path.exists(yol):
        return set()
    metin = io.open(yol, encoding='utf-8').read()
    i = metin.find('window.ANLAM_YILDIZ')
    if i == -1:
        return set()
    return {json.loads('"%s"' % m)
            for m in re.findall(r'^"((?:[^"\\]|\\.)*)": \[', metin[i:], re.M)}


YILDIZLI = yildizlilari_oku() if YALNIZ_EKSIK else set()


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
eksikler = []
for kat in range(1, 8):
    yol = os.path.join(SITE, 'data', 'kelime-k%d.js' % kat)
    if not os.path.exists(yol):
        continue
    metin = io.open(yol, encoding='utf-8').read()
    kayitlar = []
    for m in re.finditer(r'"([^"]+)":\{a:\[(.*?)\](?=[,}])', metin):
        en = coz(m.group(1))
        ham = ANLAM.findall(m.group(2))
        anlamlar = [{'tr': coz(a), 'ex': coz(b)} for a, b, _c, _yz in ham]
        if len(anlamlar) < 2:
            continue
        kayit = {'e': en, 'k': kat, 'y': tur.get(en, ''),
                 'p': puan.get(en, ''), 'a': anlamlar}
        if YALNIZ_EKSIK:
            # Modal kartlar yildizini modal-kartlar.json'dan alir; anlam-yildiz.js'te
            # gorunmeseler de veride yz tasirlar. Olcut veridir.
            if en not in YILDIZLI and not any(yz for _a, _b, _c, yz in ham):
                eksikler.append(kayit)
            continue
        kayitlar.append(kayit)
    if kayitlar:
        n = paketle(kayitlar, 'k%d' % kat)
        toplam += len(kayitlar)
        print('katman %d: %d cok anlamli kelime, %d paket' % (kat, len(kayitlar), n))

if YALNIZ_EKSIK:
    if eksikler:
        n = paketle(eksikler, 'ek')
        print('yildizi olmayan cok anlamli: %d kelime, %d paket (ek-pNN.json)'
              % (len(eksikler), n))
    else:
        print('yildizi olmayan cok anlamli kelime yok.')
    sys.exit(0)

# ---------------------------------------------------------------- obekler
obek = io.open(os.path.join(SITE, 'data', 'obekler.js'), encoding='utf-8').read()
kayitlar = []
for m in re.finditer(r'\{f:"(.*?)",y:"(.*?)",s:\d+,kn:".*?",a:\[(.*?)\]\}', obek):
    anlamlar = [{'tr': coz(a), 'ex': coz(b)} for a, b, _c, _yz in ANLAM.findall(m.group(3))]
    if len(anlamlar) < 2:
        continue
    kayitlar.append({'e': coz(m.group(1)), 'k': 0, 'y': coz(m.group(2)),
                     'p': '', 'a': anlamlar})
if kayitlar:
    n = paketle(kayitlar, 'obek')
    toplam += len(kayitlar)
    print('obek: %d cok anlamli, %d paket' % (len(kayitlar), n))

print('toplam %d kayit' % toplam)
