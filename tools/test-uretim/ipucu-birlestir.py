# -*- coding: utf-8 -*-
"""ipucu-cikti.json -> tools/ek-ornekler.js (duzeltilmis kart ornekleri).

Ajanin yazdigi kayitlari denetler ve mevcut EK_ORNEKLER sozlugune ekler
(ayni kelime zaten varsa uzerine yazar). Sonra listeyi-aktar.py calistirilir.
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
HEDEF = os.path.join(SITE, 'tools', 'ek-ornekler.js')

girdi = {x['e']: x for x in json.load(io.open(os.path.join(BURASI, 'ipucu-girdi.json'), encoding='utf-8'))}
cikti = json.load(io.open(os.path.join(BURASI, 'ipucu-cikti.json'), encoding='utf-8-sig'))

DUZENSIZ = {}
for kok, formlar in list(cekim.DUZENSIZ_FIIL.items()) + list(cekim.ONEKLI_FIIL.items()):
    for f in formlar:
        DUZENSIZ[f] = kok


def lemma(w):
    w = w.lower()
    if w in DUZENSIZ:
        return DUZENSIZ[w]
    for ek, yer in (('ies', 'y'), ('ing', ''), ('ied', 'y'), ('ed', ''),
                    ('es', ''), ('s', ''), ('ly', ''), ('er', '')):
        if w.endswith(ek) and len(w) - len(ek) >= 4:
            return w[:-len(ek)] + yer
    return w


def bosla(kelime, cumle):
    kok = re.sub(r'(e|y)$', '', kelime.lower())
    if len(kok) < 3:
        kok = kelime.lower()
    kalip = re.compile(r'\b' + re.escape(kok) + r'[a-z]*\b', re.I)
    return kalip.sub('----', cumle) if kalip.search(cumle) else None


hatalar, gecen = [], {}
for r in cikti:
    e = r.get('e')
    g = girdi.get(e)
    if not g:
        hatalar.append('%s: girdide yok' % e)
        continue
    anlamlar = r.get('anlamlar') or []
    if len(anlamlar) != len(g['anlamlar']):
        hatalar.append('%s: anlam sayısı %d ≠ %d' % (e, len(anlamlar), len(g['anlamlar'])))
        continue
    sorun = []
    for i, a in enumerate(anlamlar):
        if a.get('tr') != g['anlamlar'][i]['tr']:
            sorun.append('%d. anlamın tr alanı değişmiş' % i)
            continue
        ex = (a.get('ex') or '').strip()
        n = len(re.findall(r'\S+', ex))
        if n < 12 or n > 30:
            sorun.append('%d. cümle uzunluk %d' % (i, n))
        b = bosla(e, ex)
        if b is None:
            sorun.append('%d. cümlede kelime geçmiyor' % i)
            continue
        if b.count('----') != 1:
            sorun.append('%d. cümlede %d boşluk' % (i, b.count('----')))
        hedef = lemma(e)
        if len(hedef) >= 4 and [t for t in re.findall(r"[A-Za-z']+", b) if lemma(t) == hedef]:
            sorun.append('%d. cümlede aynı kök kalmış' % i)
        if len((a.get('exTr') or '').strip()) < 15:
            sorun.append('%d. çeviri kısa' % i)
    if sorun:
        hatalar.append('%s: %s' % (e, '; '.join(sorun)))
        continue
    gecen[e] = anlamlar

print('gelen %d · geçen %d · hatalı %d' % (len(cikti), len(gecen), len(hatalar)))
for h in hatalar:
    print('  HATA', h)

if not gecen:
    sys.exit(0)

metin = io.open(HEDEF, encoding='utf-8').read()
i = metin.index('{', metin.index('EK_ORNEKLER'))
j = metin.rindex('}')
mevcut_metin = metin[i + 1:j]

# Var olan kelimeleri koru; düzeltilenleri çıkar, sona yeniden ekle.
for e in gecen:
    mevcut_metin = re.sub(r'\n"%s": \[.*?\n\],\n' % re.escape(e), '\n', mevcut_metin, flags=re.S)

bloklar = []
for e in sorted(gecen):
    satirlar = ',\n'.join(
        '  ' + json.dumps({'tr': a['tr'], 'ex': a['ex'], 'exTr': a['exTr']}, ensure_ascii=False)
        for a in gecen[e])
    bloklar.append('"%s": [\n%s\n]' % (e, satirlar))

yeni = (metin[:i + 1] + mevcut_metin.rstrip().rstrip(',') + ',\n\n' +
        '/* --- ipucu sızıntısı düzeltmeleri (tools/test-uretim/ipucu-birlestir.py) --- */\n\n' +
        ',\n\n'.join(bloklar) + '\n' + metin[j:])
io.open(HEDEF, 'w', encoding='utf-8', newline='\n').write(yeni)
print('tools/ek-ornekler.js güncellendi (%d kelime)' % len(gecen))
