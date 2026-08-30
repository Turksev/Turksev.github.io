# -*- coding: utf-8 -*-
"""Ornek cikti paketlerini denetler ve gecenleri tools/ek-ornekler.js'e ekler.

  python ornek-dogrula.py            -> rapor + ek-ornekler.js guncelleme
  python ornek-dogrula.py --rapor    -> yalniz rapor
"""
import io
import json
import os
import re
import sys

import cekim

sys.stdout.reconfigure(encoding='utf-8')
SITE = cekim.SITE
BURASI = os.path.dirname(os.path.abspath(__file__))
GIRDI = os.path.join(BURASI, 'ornek-girdi')
CIKTI = os.path.join(BURASI, 'ornek-cikti')
YALNIZ_RAPOR = '--rapor' in sys.argv
TR_HARF = set('çğıöşüÇĞİÖŞÜ')

sonuc, hatalar, eksik = {}, [], []
toplam = gecen = 0

for ad in sorted(os.listdir(GIRDI)):
    girdi = json.load(io.open(os.path.join(GIRDI, ad), encoding='utf-8'))
    yol = os.path.join(CIKTI, ad)
    if not os.path.exists(yol):
        eksik.append(ad)
        continue
    try:
        cikti = json.loads(io.open(yol, encoding='utf-8-sig').read())
    except Exception as e:
        eksik.append('%s (JSON bozuk: %s)' % (ad, str(e)[:50]))
        continue

    # paket duzeyinde diakritik denetimi
    tum_tr = ' '.join(a.get('exTr', '') for r in cikti if isinstance(r, dict)
                      for a in (r.get('a') or []))
    if tum_tr and not (set(tum_tr) & TR_HARF):
        hatalar.append('%s: çevirilerde hiç ç/ğ/ı/ö/ş/ü yok' % ad)
        continue

    harita = {r['e']: r for r in cikti if isinstance(r, dict) and r.get('e')}
    for g in girdi:
        toplam += 1
        e = g['e']
        r = harita.get(e)
        if r is None:
            hatalar.append('%s %s: kayıt yok' % (ad, e))
            continue
        a = r.get('a')
        if not isinstance(a, list) or len(a) != len(g['parcalar']):
            hatalar.append('%s %s: anlam sayısı %s, %d bekleniyordu'
                           % (ad, e, len(a) if isinstance(a, list) else '?', len(g['parcalar'])))
            continue
        sorunlar = []
        bicimler = {e} | {cekim.cek(e, f) for f in ('s', 'past', 'pp', 'ing', 'pl')}
        # Yazim varyantlari: diagrammed (son harf ciftlenir), leaped (leapt yaninda)
        son = e[-1] if e else ''
        bicimler |= {e + 'ed', e + 'd', e + 's', e + 'ing',
                     e + son + 'ed', e + son + 'ing'}
        # Parca etiketindeki parantezli turev de kabul: "(knowledgeably) bilgili bicimde"
        for parca in g['parcalar']:
            bicimler |= set(re.findall(r'\(([a-z][a-z -]+)\)', parca))
        if '-' in e:
            duz, bitisik = e.replace('-', ' '), e.replace('-', '')
            bicimler |= {e + 's', duz, bitisik}
        bicimler = {b for b in bicimler if b}
        for i, (parca, anlam) in enumerate(zip(g['parcalar'], a)):
            tr = (anlam.get('tr') or '').strip()
            ex = (anlam.get('ex') or '').strip()
            exTr = (anlam.get('exTr') or '').strip()
            if tr != parca:
                sorunlar.append('[%d] tr değişmiş' % i)
            if not ex or not exTr:
                sorunlar.append('[%d] boş alan' % i)
                continue
            if not any(re.search(r'\b' + re.escape(b) + r'\b', ex, re.I) for b in bicimler):
                sorunlar.append('[%d] kelime örnekte yok' % i)
            if len(exTr) < 15:
                sorunlar.append('[%d] çeviri çok kısa' % i)
            if re.search(r'[“”‘’—]', ex + exTr):
                sorunlar.append('[%d] tipografik işaret' % i)
        # ornekler birbirinin kopyasi olmasin
        if len({x.get('ex') for x in a}) != len(a):
            sorunlar.append('yinelenen örnek')
        if sorunlar:
            hatalar.append('%s %s: %s' % (ad, e, '; '.join(sorunlar)))
            continue
        sonuc[e] = [{'tr': x['tr'].strip(), 'ex': x['ex'].strip(), 'exTr': x['exTr'].strip()}
                    for x in a]
        gecen += 1

print('kelime %d · geçen %d · hatalı %d · eksik paket %d'
      % (toplam, gecen, len(hatalar), len(eksik)))
for x in eksik[:8]:
    print('  EKSIK', x)
for h in hatalar[:20]:
    print('  HATA', h)
if len(hatalar) > 20:
    print('  … %d daha' % (len(hatalar) - 20))

if not YALNIZ_RAPOR and sonuc:
    yol = os.path.join(SITE, 'tools', 'ek-ornekler.js')
    metin = io.open(yol, encoding='utf-8').read()
    mevcut = set(re.findall(r'^"((?:[^"\\]|\\.)*)": \[', metin, re.M))

    def blok_degistir(metin, anahtar, anlamlar):
        bas = metin.index('"%s": [' % anahtar)
        i = metin.index('[', bas)
        derinlik = 0
        for j in range(i, len(metin)):
            if metin[j] == '[':
                derinlik += 1
            elif metin[j] == ']':
                derinlik -= 1
                if derinlik == 0:
                    break
        yeni = '"%s": [\n' % anahtar + ',\n'.join(
            '  ' + json.dumps(x, ensure_ascii=False) for x in anlamlar) + '\n]'
        return metin[:bas] + yeni + metin[j + 1:]

    yerinde = eklendi = 0
    ekler = []
    for e in sorted(sonuc):
        if e in mevcut:
            metin = blok_degistir(metin, e, sonuc[e])
            yerinde += 1
        else:
            ekler.append('%s: [\n' % json.dumps(e, ensure_ascii=False) + ',\n'.join(
                '  ' + json.dumps(x, ensure_ascii=False) for x in sonuc[e]) + '\n],')
            eklendi += 1
    if ekler:
        govde = '\n'.join(ekler)
        if govde.endswith(','):
            govde = govde[:-1]
        assert metin.rstrip().endswith('};')
        son = metin.rstrip()[:-2].rstrip()
        if not son.endswith(','):
            son += ','
        metin = son + '\n\n/* --- ornek-dogrula.py: çok türlü kelimelere tür başına örnek --- */\n' + govde + '\n};\n'
    io.open(yol, 'w', encoding='utf-8', newline='\n').write(metin)
    print('ek-ornekler.js: %d yerinde, %d eklendi' % (yerinde, eklendi))
