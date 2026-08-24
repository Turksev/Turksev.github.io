# -*- coding: utf-8 -*-
"""Kart ornek cumlelerinde IPUCUNU ZAYIFLATAN kayitlari bulur.

Kartin "ipucu" dugmesi kelimeyi boslar. Bosluktan sonra cumlede
  (a) ayni kokten baska bir kelime,
  (b) ayni aileden bir kelime,
  (c) birden cok bosluk
kaliyorsa ipucu ise yaramaz. Bu betik o kayitlari toplayip
ipucu-girdi.json olarak yazar; ajan bu cumleleri yeniden yazar.
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

# --- düzensiz biçim -> kök ---
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


# --- aileler ---
aile = {}
s = io.open(os.path.join(SITE, 'data', 'aileler.js'), encoding='utf-8').read()
for m in re.finditer(r'\{k:"(.*?)",u:\[(.*?)\]\}', s):
    uyeler = re.findall(r'"(.*?)"', m.group(2))
    for u in uyeler:
        aile.setdefault(u, set()).update(uyeler)

# --- kelime kayıtları ---
kayit = {}
for k in range(1, 8):
    yol = os.path.join(SITE, 'data', 'kelime-k%d.js' % k)
    if not os.path.exists(yol):
        continue
    t = io.open(yol, encoding='utf-8').read()
    for m in re.finditer(r'"([a-z\-\' ]+)":\{a:\[(.*?)\](,es:"(?:.*?)")?\}', t):
        anlamlar = [{'tr': a, 'ex': b, 'exTr': c}
                    for a, b, c in re.findall(r'\{tr:"(.*?)",ex:"(.*?)",exTr:"(.*?)"\}', m.group(2))]
        kayit[m.group(1)] = {'katman': k, 'anlamlar': anlamlar}


def bosla(kelime, cumle):
    kok = re.sub(r'(e|y)$', '', kelime.lower())
    if len(kok) < 3:
        kok = kelime.lower()
    kalip = re.compile(r'\b' + re.escape(kok) + r'[a-z]*\b', re.I)
    return kalip.sub('----', cumle) if kalip.search(cumle) else None


sorunlu = {}
for e, v in kayit.items():
    if ' ' in e or '-' in e:
        continue
    for i, a in enumerate(v['anlamlar']):
        ex = a['ex']
        if not ex:
            continue
        b = bosla(e, ex)
        if b is None:
            continue
        nedenler = []
        if b.count('----') > 1:
            nedenler.append('ipucunda %d boşluk' % b.count('----'))
        hedef = lemma(e)
        if len(hedef) >= 4:
            ayni = sorted({t for t in re.findall(r"[A-Za-z']+", b) if lemma(t) == hedef})
            if ayni:
                nedenler.append('aynı kök kalıyor: ' + ', '.join(ayni))
        akraba = []
        for x in aile.get(e, set()) - {e}:
            for bicim in {x} | {cekim.cek(x, f) for f in ('s', 'past', 'pp', 'ing', 'pl')}:
                if bicim and re.search(r'\b' + re.escape(bicim) + r'\b', b, re.I):
                    akraba.append(bicim)
                    break
        if akraba:
            nedenler.append('akraba kelime kalıyor: ' + ', '.join(sorted(set(akraba))))
        if nedenler:
            sorunlu.setdefault(e, {'e': e, 'katman': v['katman'],
                                   'anlamlar': v['anlamlar'], 'sorun': []})
            sorunlu[e]['sorun'].append({'sira': i, 'ex': ex, 'neden': '; '.join(nedenler)})

liste = sorted(sorunlu.values(), key=lambda x: x['e'])
io.open(os.path.join(BURASI, 'ipucu-girdi.json'), 'w', encoding='utf-8').write(
    json.dumps(liste, ensure_ascii=False, indent=1))
print('sorunlu kelime:', len(liste), '· düzeltilecek cümle:',
      sum(len(x['sorun']) for x in liste))
for x in liste:
    for s2 in x['sorun']:
        print('  %-14s k%d  %s' % (x['e'], x['katman'], s2['neden']))
