# -*- coding: utf-8 -*-
"""A4 — birlestirme adaylari icin komsu kayitlar + ham korpus baglami.

Ayrica: bas harf/kisaltmayla biten kayitlar, rakamla baslayan parcalar,
sonunda soru/sayfa numarasi kalan kayitlar (" 28." / " 4 5.").
"""
import io
import json
import re
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
YOL = r"C:\Users\Trk\Desktop\YDS\04_Github\data\cumleler.js"
KORPUS = r"C:\Users\Trk\Desktop\YDS\03_calisma_listesi\06_sandbox_2026-09\sandbox\duz4\02_korpus\korpus.jsonl"


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
for i, d in enumerate(K):
    d['i'] = i

korpus = []
for l in io.open(KORPUS, encoding='utf-8'):
    l = l.strip()
    if l:
        try:
            korpus.append(json.loads(l))
        except Exception:
            pass


def baglam(parca, gen=260):
    parca = parca.strip()
    anahtar = parca[:45]
    for k in korpus:
        m = str(k.get('metin') or '')
        j = m.find(anahtar)
        if j >= 0:
            return '[%s s%s q%s] …%s…' % (k.get('exam_id'), k.get('sayfa'), k.get('soru_no'),
                                          m[max(0, j - 120):j + gen].replace('\n', ' '))
    return '(korpusta bulunamadi)'


def goster(i, etiket=''):
    d = K[i]
    print('  [%d] %s%s' % (i, etiket, d['e'][:150]))
    print('        t: %s' % (d.get('t') or '')[:120])


print('=' * 78)
print('A) BAS HARF / KISALTMAYLA BITEN KAYITLAR (sonraki kayitla birlesme adayi)')
SON = re.compile(r"(\b[A-Z]|\(c|\bSt|\bDr|\bMr|\bMrs|\bMs|\bJr|\bSr|\be\.g|\bi\.e|\bNo|\bvs|\bvol|\bpp|\bapprox|\bca|\bcf|\bet al|\bPh\.D)\.$")
adaylar = [d for d in K if SON.search(d['e'])]
print('aday: %d' % len(adaylar))
for d in adaylar:
    i = d['i']
    print('-' * 78)
    if i > 0:
        goster(i - 1, 'ONCEKI: ')
    goster(i, 'BU    : ')
    if i + 1 < len(K):
        goster(i + 1, 'SONRAKI: ')
    print('        korpus: %s' % baglam(d['e'])[:420])

print()
print('=' * 78)
print('B) RAKAMLA BASLAYAN PARCALAR (yil/sinav basligi disinda)')
for d in K:
    e = d['e']
    if re.match(r'^\d', e) and not re.match(r'^\d{4}[ -]', e) and not re.match(r'^\d{1,2}\)', e):
        goster(d['i'])

print()
print('=' * 78)
print('C) SONUNDA SORU/SAYFA NUMARASI KALANLAR')
for d in K:
    e = d['e']
    if re.search(r'\s\d{1,2}(\s\d{1,2})?\.$', e) and not re.search(r'\b(19|20)\d\d\.$', e) and not re.search(r'\b(No|Symphony|page|vol|Article|Chapter|Section|aged?|of|by|to|than|about|over|under|only|around|nearly|almost|least|most)\s\d{1,2}\.$', e):
        goster(d['i'])

print()
print('=' * 78)
print('D) DIGER KUCUK HARFLI PARCALARIN ONCEKI KAYDI (sik/kok iliskisi)')
for i in (741, 984, 1208, 1334, 1352, 1374, 1440, 1449, 2404, 3145, 3146, 4238, 4507, 5609,
          5789, 5791, 5867, 5969, 6789, 6805, 6923, 7171):
    print('-' * 78)
    if i > 0:
        goster(i - 1, 'ONCEKI: ')
    goster(i, 'BU    : ')

print()
print('=' * 78)
print('E) X. fastidiosa zinciri')
for d in K:
    if d['e'].startswith('fastidiosa') or d['e'].endswith(' X.') or ' X. fastidiosa' in d['e'] or d['e'].endswith('X.'):
        goster(d['i'])
