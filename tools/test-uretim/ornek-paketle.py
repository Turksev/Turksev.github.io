# -*- coding: utf-8 -*-
"""Cok turlu ama tek ornekli kelimeleri paketler.

  python ornek-paketle.py    -> ornek-girdi/pNN.json (50'ser kelime)

Kaynak listede bazi kelimelerin iki turu tek anlam satirinda birlesmis
("i. fotograf; f. fotografini cekmek") ve tek ornek verilmis. Ajanlar her
tur icin ayri ornek yazar; ornek-dogrula.py gecenleri ek-ornekler.js'e ekler.
"""
import io
import json
import os
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')
S = r'C:\Users\Trk\Desktop\YDS\04_Github'
BURASI = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(BURASI, 'ornek-girdi')
os.makedirs(OUT, exist_ok=True)
os.makedirs(os.path.join(BURASI, 'ornek-cikti'), exist_ok=True)
BOY = 50
JSTR = r'"(?:[^"\\]|\\.)*"'
q = json.loads
ANLAM = re.compile(r'\{tr:(%s),ex:(%s),exTr:(%s)(?:,yz:(\d))?\}' % (JSTR, JSTR, JSTR))
# listeyi-aktar.py'deki bolme mantiginin aynisi
ANLAM_BASI = re.compile(r'(^|;\s*)((?:[ifsze]\.(?:/[ifsze]\.)*)\s)')


def anlamlari_bol(tr):
    kesme = [m.start() + len(m.group(1)) for m in ANLAM_BASI.finditer(tr)]
    if len(kesme) < 2:
        return [tr]
    parcalar = []
    for i, bas in enumerate(kesme):
        son = kesme[i + 1] if i + 1 < len(kesme) else len(tr)
        parcalar.append(tr[bas:son].rstrip('; ').strip())
    return parcalar


dizin = {}
for m in re.finditer(r'\{e:(%s),t:%s,(?:p:([\d.]+),)?k:(\d),y:(%s)\}' % (JSTR, JSTR, JSTR),
                     io.open(os.path.join(S, 'data', 'kelime-dizin.js'), encoding='utf-8').read()):
    dizin[q(m.group(1))] = {'p': m.group(2) or '', 'y': q(m.group(3))}

kayitlar = []
for kat in range(1, 8):
    yol = os.path.join(S, 'data', 'kelime-k%d.js' % kat)
    if not os.path.exists(yol):
        continue
    for satir in io.open(yol, encoding='utf-8'):
        satir = satir.strip().rstrip(',')
        m = re.match(r'^(%s):\{a:\[' % JSTR, satir)
        if not m:
            continue
        e = q(m.group(1))
        anlamlar = [{'tr': q(a), 'ex': q(b), 'exTr': q(c)} for a, b, c, _d in ANLAM.findall(satir)]
        if len(anlamlar) != 1:
            continue
        parcalar = anlamlari_bol(anlamlar[0]['tr'])
        if len(parcalar) < 2:
            continue
        kayitlar.append({'e': e, 'k': kat, 'y': dizin[e]['y'], 'p': dizin[e]['p'],
                         'parcalar': parcalar,
                         'ex': anlamlar[0]['ex'], 'exTr': anlamlar[0]['exTr']})

kayitlar.sort(key=lambda r: (r['k'], r['e']))
for i in range(0, len(kayitlar), BOY):
    ad = 'p%02d.json' % (i // BOY + 1)
    io.open(os.path.join(OUT, ad), 'w', encoding='utf-8').write(
        json.dumps(kayitlar[i:i + BOY], ensure_ascii=False, indent=1))
print('%d kelime, %d paket' % (len(kayitlar), (len(kayitlar) + BOY - 1) // BOY))
