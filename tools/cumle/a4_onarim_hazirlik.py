# -*- coding: utf-8 -*-
"""A4 onarim hazirligi: ondalik sayi / kisaltma / bas harf yuzunden bolunmus kayitlar icin
ham korpustan TAM cumleyi akilli sinir kuraliyla cikarir; hangi komsu kayitlarin bu cumlenin
icinde kaldigini (silinecek) isaretler. Cikti: a4_onarim.json (e_tam + yutulan komsular).
"""
import io
import json
import re
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
YOL = r"C:\Users\Trk\Desktop\YDS\04_Github\data\cumleler.js"
KORPUS = r"C:\Users\Trk\Desktop\YDS\03_calisma_listesi\06_sandbox_2026-09\sandbox\duz4\02_korpus\korpus.jsonl"
CIKTI = r"C:\Users\Trk\AppData\Local\Temp\claude\C--Users-Trk-Desktop-YDS-Soru-Veritaban-\b089b46c-8e62-4379-9378-1d0942c391a0\scratchpad\a4_onarim.json"

# Onarilacak "capa" kayitlar: parcanin bulundugu kayit (ondalik/kisaltma bolunmesi)
CAPALAR = [1348, 1826, 2185, 2683, 2706, 3064, 3232, 3444, 4447, 4555, 4578, 4579, 4834, 5005,
           5242, 5478, 5479, 5562, 5584, 5628, 5737, 6221, 6738, 6849, 7009, 1421, 2350, 3238,
           1862, 3415, 3424, 3413, 3426, 3431, 6994, 7170, 1333, 2403, 3001, 1825, 6805, 6789,
           5789, 5794]


def js_str(s, i):
    out = []
    i += 1
    while i < len(s):
        c = s[i]
        if c == '\\':
            out.append(s[i + 1]); i += 2; continue
        if c == '"':
            return ''.join(out), i + 1
        out.append(c); i += 1
    raise ValueError


def kayit_ayir(satir):
    d, i = {}, 1
    while i < len(satir) and satir[i] != '}':
        m = re.match(r'\s*,?\s*([A-Za-z_]+):', satir[i:])
        if not m:
            break
        k = m.group(1); i += m.end()
        if satir[i] == '"':
            v, i = js_str(satir, i)
        else:
            m2 = re.match(r'[^,}]+', satir[i:]); v = m2.group(0); i += m2.end()
        d[k] = v
    return d


K = [kayit_ayir(l.rstrip(',')) for l in io.open(YOL, encoding='utf-8').read().split('\n') if l.startswith('{e:"')]
korpus = []
for l in io.open(KORPUS, encoding='utf-8'):
    l = l.strip()
    if l:
        try:
            korpus.append(json.loads(l))
        except Exception:
            pass

KISALTMA = re.compile(r'(?:\b[A-Z]|\b(?:Mr|Mrs|Ms|Dr|Prof|St|Sr|Jr|Mt|Ft|vs|etc|e\.g|i\.e|No|Vol|pp|approx|ca|cf|al|Ph\.D|D\.C|U\.S|U\.K|a\.m|p\.m|Inc|Ltd|Co|Gen|Col|Capt|Lt|Sgt|Rev|Hon|Messrs|Mme|Mlle))\.$')
# Cumle siniri adayi: [.!?] + bosluk + buyuk harf/tirnak/parantez. Ondalik sayilar
# (7.3) zaten bosluksuz; kisaltma ve bas harf ("St.", "John W.") ise adaydan elenir.
SINIR = re.compile(r'[.!?]\s+(?=[A-Z"“(\[])')


def cumleler(metin):
    sinirlar = [0]
    for m in SINIR.finditer(metin):
        if KISALTMA.search(metin[max(0, m.start() - 12):m.start() + 1]):
            continue
        sinirlar.append(m.end())
    sinirlar.append(len(metin))
    return [(sinirlar[i], sinirlar[i + 1]) for i in range(len(sinirlar) - 1)]


def tam_cumle(parca):
    """parca'yi iceren korpus blogunda, parcayi kapsayan tam cumleyi dondur."""
    anahtar = parca.strip()[:40]
    for k in korpus:
        m = str(k.get('metin') or '').replace('\n', ' ')
        j = m.find(anahtar)
        if j < 0:
            continue
        for a, b in cumleler(m):
            if a <= j < b:
                return m[a:b].strip(), '%s s%s q%s' % (k.get('exam_id'), k.get('sayfa'), k.get('soru_no'))
    return None, None


sonuc = []
for i in CAPALAR:
    d = K[i]
    e = d['e']
    # Bas harfle/kisaltmayla biten kayitta parcanin sonu; rakamla baslayanda basi ariyoruz.
    tam, kaynak = tam_cumle(e if len(e) >= 40 else e)
    if not tam:
        # Baslik onekli kayitlar ("2017-YDS Spring/English One day in 1952, John W.") icin onek kirp
        e2 = re.sub(r'^(\d{4}-YDS \S+/\S+ |\d{4} \S+ YDS |\d+ Mart \d{4} YDS |\(\d+\) ---- )', '', e)
        tam, kaynak = tam_cumle(e2)
    yutulan = []
    if tam:
        for j in (i - 2, i - 1, i + 1, i + 2):
            if 0 <= j < len(K):
                ej = K[j]['e']
                ej_temiz = re.sub(r'^(\d{4}-YDS \S+/\S+ |\d{4} \S+ YDS )', '', ej)
                if len(ej_temiz) >= 8 and ej_temiz.rstrip('.') in tam:
                    yutulan.append(j)
    kayit = {'i': i, 'e': e, 't': d.get('t', ''), 'e_tam': tam, 'kaynak': kaynak, 'yutulan': yutulan,
             'komsu': {str(j): K[j]['e'] for j in (i - 1, i + 1) if 0 <= j < len(K)},
             'komsu_t': {str(j): K[j].get('t', '') for j in (i - 1, i + 1) if 0 <= j < len(K)}}
    sonuc.append(kayit)
    print('=' * 78)
    print('[%d] %s' % (i, e[:140]))
    print('     t: %s' % d.get('t', '')[:120])
    print('     ONCEKI [%d]: %s' % (i - 1, K[i - 1]['e'][:120]))
    print('     SONRAKI[%d]: %s' % (i + 1, K[i + 1]['e'][:120]))
    print('     TAM (%s): %s' % (kaynak, tam))
    print('     yutulan komsular: %s' % yutulan)

json.dump(sonuc, io.open(CIKTI, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('\nyazildi:', CIKTI)
