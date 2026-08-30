# -*- coding: utf-8 -*-
"""Baslik ve kayit hijyeni denetimi (SALT OKUNUR).

  python baslik-denetim.py

"row /raʊ/" olayindan sonra eklendi: baslik icine gomulen aciklama/telaffuz
cekim motorunu, seslendirmeyi ve ipucu boslugunu bozuyor. Bu betik ayni
sinifi ve komsu bozukluk turlerini tarar.
"""
import glob
import io
import json
import os
import re
import sys
from collections import defaultdict

import cekim

sys.stdout.reconfigure(encoding='utf-8')
SITE = cekim.SITE
JSTR = r'"(?:[^"\\]|\\.)*"'
q = json.loads
ANLAM = re.compile(r'\{tr:(%s),ex:(%s),exTr:(%s)(?:,yz:(\d))?\}' % (JSTR, JSTR, JSTR))
# Yalniz gercek IPA harfleri; "(bilgi/su/vb.)" gibi egik cizgiler sayilmaz.
IPA = re.compile(r'[ʊɪəɑæɛɔθðʃʒŋːˈˌʌɒɜʁ]')
# Baslikta beklenen: kucuk harf, bosluk, tire, kesme, nokta (ör. "a.m." yok ama olabilir)
BASLIK_OK = re.compile(r"^[a-z][a-z' \-]*[a-z']$|^[a-z]$")

bulgu = defaultdict(list)


def ekle(tur, mesaj):
    bulgu[tur].append(mesaj)


# ---------------------------------------------------------------- veriyi oku
dizin = {}
metin = io.open(os.path.join(SITE, 'data', 'kelime-dizin.js'), encoding='utf-8').read()
for m in re.finditer(r'\{e:(%s),t:(%s),(?:p:([\d.]+),)?k:(\d),y:(%s)\}' % (JSTR, JSTR, JSTR), metin):
    dizin[q(m.group(1))] = {'t': q(m.group(2)), 'p': m.group(3), 'k': int(m.group(4)),
                            'y': q(m.group(5))}

tam = {}
for kat in range(1, 8):
    yol = os.path.join(SITE, 'data', 'kelime-k%d.js' % kat)
    if not os.path.exists(yol):
        continue
    for satir in io.open(yol, encoding='utf-8'):
        satir = satir.strip().rstrip(',')
        m = re.match(r'^(%s):\{a:\[' % JSTR, satir)
        if not m:
            continue
        tam[q(m.group(1))] = [{'tr': q(a), 'ex': q(b), 'exTr': q(c), 'yz': int(d) if d else 0}
                              for a, b, c, d in ANLAM.findall(satir)]

obek = set()
for m in re.finditer(r'\{f:(%s),' % JSTR,
                     io.open(os.path.join(SITE, 'data', 'obekler.js'), encoding='utf-8').read()):
    obek.add(q(m.group(1)))

modal = set()
myol = os.path.join(SITE, 'tools', 'modal-kartlar.json')
if os.path.exists(myol):
    modal = {c['e'] for c in json.load(io.open(myol, encoding='utf-8'))['cards']}

print('dizin %d kelime · öbek %d · modal kart %d' % (len(dizin), len(obek), len(modal)))

# ---------------------------------------------------------------- 1) baslik hijyeni
taban_harita = defaultdict(list)
# Modal kartlar kelime degil DILBILGISI KALIBI: "would have + V3" boyle
# yazilir, basligindaki +/V3/egik cizgi kusur degildir. Cekim motoru da
# artik onlari elemeye aliyor (cekim.js: butun parcalar harf olmali).
for e in dizin:
    if e in modal:
        continue
    if IPA.search(e):
        ekle('BAŞLIKTA TELAFFUZ/IPA', e)
    if '(' in e or ')' in e or '/' in e:
        ekle('BAŞLIKTA AÇIKLAMA İŞARETİ', e)
    if re.search(r'\d', e):
        ekle('BAŞLIKTA RAKAM', e)
    if e != e.lower():
        ekle('BAŞLIKTA BÜYÜK HARF', e)
    if e != e.strip() or '  ' in e:
        ekle('BAŞLIKTA FAZLA BOŞLUK', repr(e))
    if not BASLIK_OK.match(e):
        ekle('BAŞLIK DESENE UYMUYOR', e)
    # ayirt edici eki soyulunca cakisan basliklar (row /raʊ/ olayi)
    taban = re.sub(r'\s*[/(].*$', '', e).strip()
    if taban:
        taban_harita[taban].append(e)

for taban, adlar in sorted(taban_harita.items()):
    if len(adlar) > 1:
        ekle('AYNI TABANA İNEN BAŞLIKLAR', '%s -> %s' % (taban, adlar))

# ---------------------------------------------------------------- 2) cekim bozulmasi
for e in dizin:
    if ' ' in e or '-' in e:
        continue                      # gercek cok sozcuklu basliklar (modal, deyim)
    for f in ('s', 'past', 'pp', 'ing', 'pl'):
        b = cekim.cek(e, f)
        if b and re.search(r'[^a-z]', b):
            ekle('ÇEKİM BOZUK', '%s + %s -> %s' % (e, f, b))
            break

# ---------------------------------------------------------------- 3) anlam/kisa anlam hijyeni
for e, anlamlar in tam.items():
    for a in anlamlar:
        if IPA.search(a['tr']):
            ekle('ANLAMDA TELAFFUZ/IPA', '%s: %s' % (e, a['tr']))
        if not a['tr'].strip() or not a['ex'].strip() or not a['exTr'].strip():
            ekle('BOŞ ALAN', e)
        if re.search(r'[“”‘’]', a['ex'] + a['exTr']):
            ekle('TİPOGRAFİK TIRNAK', '%s: %s' % (e, a['ex'][:50]))
for e, d in dizin.items():
    # Turkce ek gosterimiyle baslamak normal: "-ebilmek", "-e ragmen".
    if d['t'] and not re.match(r'^[\w(-]', d['t'], re.U):
        ekle('KISA ANLAM GARİP BAŞLIYOR', '%s: %s' % (e, d['t'][:50]))
    if IPA.search(d['t']):
        ekle('KISA ANLAMDA IPA', '%s: %s' % (e, d['t'][:50]))

# ---------------------------------------------------------------- 4) ornekte kelime yok (ipucu bozulur)
for e, anlamlar in tam.items():
    if e in modal or not anlamlar or not anlamlar[0]['ex']:
        continue
    bicimler = {e} | {cekim.cek(e, f) for f in ('s', 'past', 'pp', 'ing', 'pl')}
    son = e[-1] if e else ''
    bicimler |= {e + 'ed', e + 'd', e + 's', e + 'ing', e + son + 'ed', e + son + 'ing'}
    if '-' in e:
        bicimler |= {e.replace('-', ' '), e.replace('-', ''), e + 's'}
    if ' ' in e:
        bicimler |= {e.replace(' ', '-'), e.replace(' ', '')}
    bicimler = {b for b in bicimler if b}
    ex = anlamlar[0]['ex']
    if not any(re.search(r'\b' + re.escape(b) + r'\b', ex, re.I) for b in bicimler):
        ekle('İLK ÖRNEKTE KELİME YOK (ipucu düşer)', '%s: %s' % (e, ex[:70]))

# ---------------------------------------------------------------- 5) dizin <-> katman tutarliligi
for e in dizin:
    if e not in tam:
        ekle('TAM KAYIT YOK', e)
for e in tam:
    if e not in dizin:
        ekle('DİZİNDE YOK', e)

# ---------------------------------------------------------------- rapor
toplam = sum(len(v) for v in bulgu.values())
print('\nbulgu türü %d · toplam %d' % (len(bulgu), toplam))
for tur in sorted(bulgu, key=lambda t: -len(bulgu[t])):
    liste = bulgu[tur]
    print('\n== %s (%d)' % (tur, len(liste)))
    for x in liste[:25]:
        print('   ' + x)
    if len(liste) > 25:
        print('   … %d tane daha' % (len(liste) - 25))
if not toplam:
    print('temiz.')
