# -*- coding: utf-8 -*-
"""A4 — cumleler.js artiklarinin kategorili dokumu (kuru kosum; dosyaya yazmaz).

Her kayit: {i (satir sirasi), e, s, b, n, t, y}. Kategoriler:
  BASLIK   kitapcik basligi / sinav adi cumlenin basinda        -> onek kirp (e ve t)
  SORUNO   "9) " soru numarasi basta                              -> onek kirp (e ve t)
  TIRNAK   kapanis tirnagi basta ('" (25)---- ...')               -> tirnak kirp; kucuk harfle basliyorsa onceki kayda ekle
  SIK      onceki sorunun 5 sikki + gercek cumle                  -> onek kirp (e); t yeniden cevrilecek
  KISALT   kisaltmada bolunmus ("St." / "(c.")                    -> sonraki kayitla birlestir; t yeniden cevrilecek
  DIGER    kucuk harfle baslayan / kisa parcalar                  -> elle karar
"""
import collections
import io
import json
import re
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
YOL = r"C:\Users\Trk\Desktop\YDS\04_Github\data\cumleler.js"
DOKUM = r"C:\Users\Trk\AppData\Local\Temp\claude\C--Users-Trk-Desktop-YDS-Soru-Veritaban-\b089b46c-8e62-4379-9378-1d0942c391a0\scratchpad\a4_dokum.json"


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
    raise ValueError('kapanmayan tirnak')


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


satirlar = io.open(YOL, encoding='utf-8').read().split('\n')
kayitlar = []
for idx, l in enumerate(satirlar):
    if l.startswith('{e:"'):
        d = kayit_ayir(l.rstrip(','))
        d['i'] = len(kayitlar); d['satir'] = idx
        kayitlar.append(d)
print('kayit: %d' % len(kayitlar))

BASLIK_E = re.compile(r'^(\d{4}-YDS \S+/\S+ |\d{4} (?:İlkbahar|Sonbahar|Yaz|Aralık|Temmuz) YDS )')
BASLIK_T = re.compile(r'^(\d{4}-YDS [^—–:]+?(?:/[^—–:\s]+)?\s*[—–:-]\s*|\d{4}[- ]YDS [^—–:]+?[—–:]\s*|\d{4} (?:İlkbahar|Sonbahar|Yaz|Aralık|Temmuz|Bahar|Güz) YDS\s*[—–:-]?\s*|\d{4}-YDS\s+\S+\s*)')
SORUNO = re.compile(r'^\(?(\d{1,2})\)\s+(?!----)')
KISALT = re.compile(r'(\(c|\bSt|\bDr|\bMr|\bMrs|\bMs|\be\.g|\bi\.e|\bNo|\bvs|\bvol|\bpp|\bapprox|\bca)\.$')

kat = collections.OrderedDict((k, []) for k in ('BASLIK', 'SORUNO', 'TIRNAK', 'SIK', 'KISALT', 'DIGER'))

for d in kayitlar:
    e, t = d['e'], d.get('t', '')
    kayit = {'i': d['i'], 's': d.get('s'), 'b': d.get('b'), 'n': d.get('n'), 'e': e, 't': t}

    m = BASLIK_E.match(e)
    if m:
        kayit['e_yeni'] = e[m.end():]
        mt = BASLIK_T.match(t)
        kayit['t_onek'] = t[:mt.end()] if mt else None
        kayit['t_yeni'] = t[mt.end():] if mt else t
        kat['BASLIK'].append(kayit); continue

    m = SORUNO.match(e)
    if m and not e.startswith('('):
        kayit['e_yeni'] = e[m.end():]
        mt = re.match(r'^\(?\d{1,2}\)\s*', t)
        kayit['t_onek'] = t[:mt.end()] if mt else None
        kayit['t_yeni'] = t[mt.end():] if mt else t
        kat['SORUNO'].append(kayit); continue

    if e.startswith('"') and e.count('"') == 1:
        govde = e[1:].lstrip()
        kayit['e_yeni'] = govde
        kayit['devam_mi'] = bool(re.match(r'^[a-z]', govde))
        mt = re.match(r'^[”"“]\s*', t)
        kayit['t_onek'] = t[:mt.end()] if mt else None
        kayit['t_yeni'] = t[mt.end():] if mt else t
        if kayit['devam_mi'] and d['i'] > 0:
            kayit['onceki'] = {'i': d['i'] - 1, 'e': kayitlar[d['i'] - 1]['e'], 't': kayitlar[d['i'] - 1].get('t', '')}
        kat['TIRNAK'].append(kayit); continue

    if KISALT.search(e) and d['i'] + 1 < len(kayitlar):
        s = kayitlar[d['i'] + 1]
        kayit['sonraki'] = {'i': s['i'], 'e': s['e'], 't': s.get('t', ''), 's': s.get('s'), 'b': s.get('b')}
        kat['KISALT'].append(kayit); continue

    if re.match(r'^[a-z]', e) and not e.startswith('e-'):
        m = re.search(r' ([A-Z][a-z]+ |\(\d{1,2}\) ----|---- )', e)
        onek = e[:m.start()] if m else e
        if m and 15 <= len(onek) <= 160 and '.' not in onek and not re.search(r'[,;:]', onek):
            kayit['e_onek'] = onek
            kayit['e_yeni'] = e[m.start() + 1:]
            kat['SIK'].append(kayit)
        else:
            kat['DIGER'].append(kayit)
        continue

    if len(e) < 25:
        kat['DIGER'].append(kayit)

for k, v in kat.items():
    print('%-7s %4d' % (k, len(v)))
json.dump({k: v for k, v in kat.items()}, io.open(DOKUM, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

# --- ozet goruntu ---
def kisa(x, n=100):
    x = x or ''
    return x if len(x) <= n else x[:n] + '…'

print('\n=== BASLIK: t oneki yakalanamayanlar (t elle kirpilacak) ===')
for k in kat['BASLIK']:
    if k['t_onek'] is None:
        print('  [%d] %s' % (k['i'], kisa(k['t'], 90)))
print('\n=== BASLIK: t onek ornekleri ===')
for k in kat['BASLIK'][:6]:
    print('  %r -> %r' % (k['t_onek'], kisa(k['t_yeni'], 60)))

print('\n=== SORUNO: t oneki ===')
for k in kat['SORUNO'][:6]:
    print('  e: %s | t_onek: %r' % (kisa(k['e'], 50), k['t_onek']))

print('\n=== TIRNAK ===')
print('  devam (onceki kayda eklenecek): %d, tirnak kirpilacak: %d' % (
    sum(1 for k in kat['TIRNAK'] if k['devam_mi']), sum(1 for k in kat['TIRNAK'] if not k['devam_mi'])))
for k in [x for x in kat['TIRNAK'] if x['devam_mi']][:5]:
    print('  [%d] ONCEKI: %s' % (k['i'], kisa(k['onceki']['e'], 80)))
    print('       BU    : %s' % kisa(k['e'], 80))

print('\n=== SIK (%d) ===' % len(kat['SIK']))
for k in kat['SIK']:
    print('  [%d] %s || %s' % (k['i'], kisa(k['e_onek'], 60), kisa(k['e_yeni'], 70)))
    print('       t: %s' % kisa(k['t'], 110))

print('\n=== KISALT (%d) ===' % len(kat['KISALT']))
for k in kat['KISALT']:
    print('  [%d] %s' % (k['i'], kisa(k['e'], 90)))
    print('       + %s' % kisa(k['sonraki']['e'], 90))
    print('       t: %s || %s' % (kisa(k['t'], 60), kisa(k['sonraki']['t'], 60)))

print('\n=== DIGER (%d) ===' % len(kat['DIGER']))
for k in kat['DIGER']:
    print('  [%d] [%s|%s] %s' % (k['i'], k['s'], k['b'], kisa(k['e'], 110)))
