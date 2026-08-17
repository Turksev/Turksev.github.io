# -*- coding: utf-8 -*-
"""
Kelime aileleri cikarimi  ->  data/aileler.js

Yontem: bir kelime, bilinen bir turetme ekiyle listedeki baska bir kelimeden
uretilebiliyorsa ikisi ayni ailedendir. Baglar graf olusturur, bilesenler aile olur.

Iki onemli sinir:
  1. Onek soyma yalniz OLUMSUZLUK onekleri icin ve yalniz TUR ORTUSMESI varsa
     yapilir. Yoksa "really -> ally", "present -> sent", "relate -> late" gibi
     sacma baglar cikiyor.
  2. Bicimsel olarak dogru ama anlamca yanlis baglar kural ile elenemez
     ("several" ile "severe", "career" ile "care"). Bunlar ENGELLI listesinde
     elle tutulur. Liste 4+ uyeli butun aileler tek tek okunarak olusturuldu.

Kullanim:
  "C:/Users/Trk/Desktop/english claude/.venv/Scripts/python.exe" tools/aile-cikar.py
"""
import io
import json
import os
import re
import sys
from collections import defaultdict

# Yeni bir sarmalayici kurmak yerine kodlamayi yerinde degistir: sarmalayici,
# betik baska bir yerden ice aktarildiginda alttaki tamponu kapatiyor.
sys.stdout.reconfigure(encoding='utf-8')

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VERI = os.path.join(SITE, 'data')

# ---------------------------------------------------------------- kurallar

SONEK = [
    ('ly', ['', 'e', 'le']), ('ness', ['', 'e', 'y']),
    ('ility', ['le', 'il']), ('ity', ['', 'e', 'ous']),
    ('ation', ['e', '', 'ate']), ('ition', ['e', '']),
    ('tion', ['te', 't', '']), ('sion', ['de', 'd', 's', '']),
    ('ment', ['', 'e']), ('ance', ['', 'e', 'ant']), ('ence', ['', 'e', 'ent']),
    ('ancy', ['ant', '', 'e']), ('ency', ['ent', '', 'e']),
    ('able', ['', 'e', 'y']), ('ible', ['', 'e']),
    ('ive', ['e', '', 'ion']), ('ous', ['', 'e', 'y']),
    ('ful', ['', 'e']), ('less', ['', 'e']),
    ('ical', ['', 'e', 'y', 'ic']), ('ial', ['', 'e', 'y']), ('al', ['', 'e', 'y']),
    ('ic', ['', 'e', 'y']),
    ('isation', ['e', '']), ('ization', ['e', '']), ('ise', ['', 'e']), ('ize', ['', 'e']),
    ('er', ['', 'e']), ('or', ['', 'e']), ('ist', ['', 'e', 'y']), ('ism', ['', 'e']),
    ('ant', ['', 'e', 'ate']), ('ent', ['', 'e']),
    ('ary', ['', 'e']), ('ory', ['', 'e']), ('ate', ['', 'e']),
    ('ify', ['', 'e', 'y']), ('ship', ['']), ('hood', ['']), ('dom', ['']), ('age', ['', 'e']),
]

OLUMSUZ = ['un', 'in', 'im', 'ir', 'il', 'dis', 'non']
EN_KISA = 4

# Bicimsel olarak kurulan ama anlamca yanlis olan baglar.
# (turemis, taban) — 4+ uyeli butun aileler elle okunarak belirlendi.
ENGELLI = {
    ('possible', 'pose'), ('positive', 'position'), ('impossible', 'impose'),
    ('former', 'form'), ('formation', 'format'), ('information', 'formation'),
    ('partial', 'party'), ('partition', 'party'),
    ('organise', 'organ'), ('organize', 'organ'),
    ('organisation', 'organ'), ('organization', 'organ'),
    ('commence', 'come'), ('commence', 'comment'), ('comment', 'come'), ('income', 'come'),
    ('passion', 'pass'), ('passive', 'passion'),
    ('lateral', 'later'), ('latter', 'late'),
    ('final', 'fine'), ('finance', 'fine'),
    ('operation', 'opera'),
    ('static', 'state'), ('station', 'state'),
    ('several', 'severe'),
    ('important', 'import'), ('importance', 'import'),
    ('primer', 'prime'),
    ('tradition', 'trade'),
    ('successor', 'success'),
    ('career', 'care'),
    ('native', 'nation'),
    ('intense', 'tense'),
    ('currency', 'cure'), ('current', 'cure'),
}


def tabanlar(w):
    """w'nin turetilmis olabilecegi olasi tabanlar (yalniz sonek yoluyla)."""
    out = set()
    for ek, donusum in SONEK:
        if not w.endswith(ek):
            continue
        govde = w[:-len(ek)]
        if len(govde) < EN_KISA - 1:
            continue
        adaylar = [govde + d for d in donusum]
        if len(govde) > 2 and govde[-1] == govde[-2]:          # running -> run
            adaylar += [govde[:-1] + d for d in donusum]
        if govde.endswith('i'):                                 # happiness -> happy
            adaylar.append(govde[:-1] + 'y')
        out.update(t for t in adaylar if len(t) >= EN_KISA)
    return out


# ---------------------------------------------------------------- veri

def dizini_oku():
    metin = open(os.path.join(VERI, 'kelime-dizin.js'), encoding='utf-8').read()
    kayit = {}
    desen = re.compile(r'\{e:"(.*?)",t:"(.*?)"(?:,p:([\d.]+))?,k:(\d),y:"(.*?)"\}')
    for en, tr, p, k, y in desen.findall(metin):
        kayit[en] = {'tr': tr, 'p': float(p) if p else None, 'k': int(k), 'y': y}
    return kayit


def turler(site, w):
    return set(re.split(r'[,/]\s*', site[w]['y'])) if w in site else set()


# ---------------------------------------------------------------- graf

def aileleri_kur(site):
    ebeveyn = {w: w for w in site}

    def bul(x):
        while ebeveyn[x] != x:
            ebeveyn[x] = ebeveyn[ebeveyn[x]]
            x = ebeveyn[x]
        return x

    def birlestir(a, b):
        ra, rb = bul(a), bul(b)
        if ra != rb:
            ebeveyn[ra] = rb

    baglar = defaultdict(list)          # kok -> [(turemis, taban, tip)]
    sayac = {'sonek': 0, 'onek': 0, 'engellenen': 0, 'tur_uyusmazligi': 0}

    for w in sorted(site):
        if not re.fullmatch(r'[a-z]+', w):
            continue
        for t in sorted(tabanlar(w)):
            if t not in site or t == w:
                continue
            if (w, t) in ENGELLI:
                sayac['engellenen'] += 1
                continue
            birlestir(w, t)
            baglar[w].append((w, t, 'sonek'))
            sayac['sonek'] += 1
        for on in OLUMSUZ:
            if not w.startswith(on) or len(w) - len(on) < EN_KISA:
                continue
            taban = w[len(on):]
            if taban not in site:
                continue
            if (w, taban) in ENGELLI:
                sayac['engellenen'] += 1
                continue
            if not (turler(site, w) & turler(site, taban)):
                sayac['tur_uyusmazligi'] += 1
                continue
            birlestir(w, taban)
            baglar[w].append((w, taban, 'onek'))
            sayac['onek'] += 1

    gruplar = defaultdict(list)
    for w in site:
        gruplar[bul(w)].append(w)
    return [g for g in gruplar.values() if len(g) > 1], sayac


def kok_sec(uyeler, site):
    """Ailenin basligi: baska bir uyeden turetilmemis, en kisa kelime."""
    turetilmis = set()
    for w in uyeler:
        if tabanlar(w) & set(uyeler):
            turetilmis.add(w)
        for on in OLUMSUZ:
            if w.startswith(on) and w[len(on):] in uyeler:
                turetilmis.add(w)
    adaylar = [w for w in uyeler if w not in turetilmis] or list(uyeler)
    # en yuksek puanli, esitlikte en kisa
    return sorted(adaylar, key=lambda w: (-(site[w]['p'] or 0), len(w), w))[0]


# ---------------------------------------------------------------- yazim

def yaz(yol, icerik):
    with open(yol, 'w', encoding='utf-8', newline='\n') as f:
        f.write(icerik)


def main():
    site = dizini_oku()
    aileler, sayac = aileleri_kur(site)

    # Sirala: once buyuk aile, sonra kokun puani
    kayitlar = []
    for uyeler in aileler:
        kok = kok_sec(uyeler, site)
        sirali = sorted(uyeler, key=lambda w: (-(site[w]['p'] or 0), w))
        kayitlar.append({'k': kok, 'u': sirali})
    kayitlar.sort(key=lambda a: (-len(a['u']), -(site[a['k']]['p'] or 0), a['k']))

    govde = ',\n'.join(
        '{k:%s,u:%s}' % (json.dumps(a['k'], ensure_ascii=False),
                         json.dumps(a['u'], ensure_ascii=False))
        for a in kayitlar)

    basli = (
        '/* ============================================================\n'
        '   Kelime aileleri — %d aile, %d kelime\n'
        '   Alanlar: k = ailenin başı, u = üyeler (puana göre sıralı)\n'
        '   Üyelerin anlam ve örnek cümleleri katman dosyalarındadır.\n'
        '   tools/aile-cikar.py ile üretilir; elle düzenleme.\n'
        '   ============================================================ */\n\n'
        'window.AILELER = [\n' % (len(kayitlar), sum(len(a['u']) for a in kayitlar))
    )
    yol = os.path.join(VERI, 'aileler.js')
    yaz(yol, basli + govde + '\n];\n')

    kapsanan = sum(len(a['u']) for a in kayitlar)
    boy = defaultdict(int)
    for a in kayitlar:
        boy[min(len(a['u']), 8)] += 1

    print('Bağ      : %d sonek + %d önek' % (sayac['sonek'], sayac['onek']))
    print('Engellenen: %d (elle) + %d (tür uyuşmazlığı)'
          % (sayac['engellenen'], sayac['tur_uyusmazligi']))
    print('Aile     : %d · kapsanan kelime: %d (%%%d)'
          % (len(kayitlar), kapsanan, kapsanan / len(site) * 100))
    print('Büyüklük :', dict(sorted(boy.items())))
    print('Dosya    : %.0f KB' % (os.path.getsize(yol) / 1024))
    print('\nEn büyük 6 aile:')
    for a in kayitlar[:6]:
        print('  %-16s %s' % (a['k'], ' · '.join(a['u'])))


if __name__ == '__main__':
    main()
