# -*- coding: utf-8 -*-
"""Cumle bankasi + ceviriler -> site verisi: data/cumleler/<yil>.js + data/cumleler-dizin.js

Girdi (arsiv, 06_sandbox_2026-09/cumleler): girdi/*.json {cumleler:[{id,en,sinav_adi,bolum,soru,yil}]},
cikti/*.json {ceviriler:[{id,tr}]}. Ceviri tamamlanmamis olsa da calisir.

Uygulanan duzeltmeler (sirayla):
  1. tools/cumle/cumle_duzeltmeleri.json — icerik anahtarli (sinav, ham metin) tablosu:
     A4 temizliginin (5 Eylul 2026) elle onarilan/silinen kayitlari. Yeniden uretimde
     kaybolmasin diye dizine degil metne baglidir; cumle_tablo_turet.py ile turetildi.
  2. Genel kurallar (yeni cumleler icin de): kitapcik basligi / soru numarasi onekleri,
     "Go on to the next page", yonerge satirlari, sona yapisan soru/sayfa numarasi,
     basa yapisan kapanis tirnagi (devam parcasi onceki kayda eklenir), kucuk harfle
     baslayan sik parcalari, ayni sinavda birebir yinelenenler.

Cikti: yil dosyalari (window.CUMLELER_YIL["2013"] = [...]) ve dizin (window.CUMLELER_DIZIN).
Tek dosya (data/cumleler.js, 2,7 MB) artik uretilmez; sayfa yil dosyalarini yeniden eskiye
sirayla yukler (assets/js/cumleler.js).
"""
import collections
import glob
import io
import json
import os
import re
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

SP = "C:/Users/Trk/Desktop/YDS/03_calisma_listesi/06_sandbox_2026-09"
C = os.path.join(SP, 'cumleler')
VERI = r"C:\Users\Trk\Desktop\YDS\04_Github\data"
BURASI = os.path.dirname(os.path.abspath(__file__))
TABLO = os.path.join(BURASI, 'cumle_duzeltmeleri.json')

# --- girdi cumleleri
cumle = {}
for p in sorted(glob.glob(os.path.join(C, 'girdi', '*.json'))):
    for c in json.load(open(p, encoding='utf-8'))['cumleler']:
        cumle[c['id']] = c
print(f"cumle bankasi   : {len(cumle):,}")

# --- ceviriler
ceviri = {}
for p in sorted(glob.glob(os.path.join(C, 'cikti', '*.json'))):
    try:
        d = json.load(open(p, encoding='utf-8'))
    except Exception as e:
        print(f"  ! {os.path.basename(p)} okunamadi: {e}"); continue
    for t in d.get('ceviriler', []):
        tr = (t.get('tr') or '').strip()
        if tr:
            ceviri[t['id']] = tr
print(f"ceviri hazir    : {len(ceviri):,}  (%{len(ceviri)/max(len(cumle),1)*100:.0f})")

BOLUM_KISA = {
    'Kelime Bilgisi': 'Kelime Bilgisi', 'Dil Bilgisi': 'Dil Bilgisi',
    'Cloze Test': 'Cloze Test', 'Cümle Tamamlama': 'Cümle Tamamlama',
    'Çeviri': 'Çeviri', 'Paragraf / Okuma': 'Paragraf / Okuma',
    'Diyalog Tamamlama': 'Diyalog Tamamlama', 'Anlamca En Yakın': 'Anlamca En Yakın',
    'Paragraf Tamamlama': 'Paragraf Tamamlama',
    'Anlam Bütünlüğünü Bozan': 'Anlam Bütünlüğünü Bozan',
}

kayitlar = []
for cid, c in sorted(cumle.items()):
    kayitlar.append({'id': cid, 'e': c['en'], 's': c['sinav_adi'],
                     'b': BOLUM_KISA.get(c.get('bolum') or '', c.get('bolum') or ''),
                     'n': int(c.get('soru') or 0), 't': ceviri.get(cid, ''), 'y': str(c['yil'])})

# ------------------------------------------------------------------ 1. icerik anahtarli tablo
def norm(e):
    return ' '.join(str(e).split())

tablo = {}
if os.path.exists(TABLO):
    for x in json.load(io.open(TABLO, encoding='utf-8'))['kayitlar']:
        tablo[(x['s'], norm(x['eski']))] = x
istat = collections.Counter()
sonuc = []
for k in kayitlar:
    x = tablo.get((k['s'], norm(k['e'])))
    if x is None:
        sonuc.append(k); continue
    if x['islem'] == 'sil':
        istat['tablo: silindi'] += 1; continue
    k = dict(k, e=x['e'], t=x.get('t', '') or k['t'], b=x.get('b', '') or k['b'], n=x.get('n') or k['n'])
    istat['tablo: degistirildi'] += 1
    sonuc.append(k)
kayitlar = sonuc

# ------------------------------------------------------------------ 2. genel kurallar
BASLIK_E = re.compile(r'^(?:\d{4}-YDS \S+/\S+ |\d{4} (?:İlkbahar|Sonbahar|Yaz|Aralık|Temmuz|İLKBAHAR|SONBAHAR) YDS |\d{1,2} Mart \d{4} YDS |(?:İlkbahar|Sonbahar|Yaz) YDS |Mart \d{4} YDS )')
BASLIK_T = re.compile(r'^(?:\d{4}-YDS \S+/\S+\s*[—–:-]?\s*|\d{1,2} Mart \d{4} YDS\.?\s*|\d{4} (?:İlkbahar|Sonbahar|Yaz|Aralık|Temmuz) YDS\s*[—–:.-]?\s*)')
YONERGE = re.compile(r'^(?:For these questions|option to complete|word\(s\) or expression\(s\)|word or expression to fill|rephrased form of|accurate Turkish translation|\d{1,2}-\d{1,2}: For these questions|Answer the following)', re.I)


def genel_kurallar(kayitlar):
    out = []
    for k in kayitlar:
        e, t = k['e'].strip(), (k['t'] or '').strip()
        if 'Go on to the next page' in e:
            istat['kural: altbilgi silindi'] += 1; continue
        if YONERGE.match(e):
            istat['kural: yonerge silindi'] += 1; continue
        d = 0
        while BASLIK_E.match(e) and d < 3:
            e = BASLIK_E.sub('', e, count=1); d += 1
        while BASLIK_T.match(t) and d < 6:
            t = BASLIK_T.sub('', t, count=1); d += 1
        if d:
            istat['kural: baslik oneki kirpildi'] += 1
        m = re.match(r'^\d{1,2}\)\s+', e)
        if m:
            e = e[m.end():]; t = re.sub(r'^\(?\d{1,2}\)\s*', '', t); istat['kural: soru no oneki kirpildi'] += 1
        e2 = re.sub(r'\s\d{1,2}(?:\s\d{1,2})?\.$', '.', e)
        if e2 != e and not re.search(r'\b(?:19|20)\d\d\.$', e) and not re.search(r'\b(?:No|Symphony|page|vol|aged?|of|to|than|about|over|under|between|and)\s\d{1,2}\.$', e):
            e = e2; istat['kural: kuyruk numarasi kirpildi'] += 1
        if e.endswith(' .'):
            e = e[:-2] + '.'
        e = re.sub(r' {2,}', ' ', e)
        # basa yapisan kapanis tirnagi
        if e.startswith('"') and e.count('"') == 1:
            govde = e[1:].lstrip()
            if re.match(r'^(?:[a-z]|,)', govde) and out:
                o = out[-1]
                o['e'] = o['e'].rstrip() + '"' + (govde if govde.startswith(',') else ' ' + govde)
                if o['e'].count('"') % 2 == 1:
                    o['e'] += '"'
                if t:
                    o['t'] = (o.get('t', '') + ' ' + re.sub(r'^[”"“]?\s*,?\s*', '', t)).strip()
                istat['kural: alinti devami birlestirildi'] += 1
                continue
            e = govde; t = re.sub(r'^[”"“]\s*', '', t)
            istat['kural: tirnak kirpildi'] += 1
        if re.match(r'^[a-z]', e) and not re.match(r'^e-', e):
            istat['kural: kucuk harfli parca silindi'] += 1; continue
        if len(e) < 12:
            istat['kural: cok kisa silindi'] += 1; continue
        out.append(dict(k, e=e, t=t))
    # ayni sinavda birebir yinelenen
    gor = set(); son = []
    for k in out:
        a = (k['s'], norm(k['e']).lower())
        if a in gor:
            istat['kural: yinelenen silindi'] += 1; continue
        gor.add(a); son.append(k)
    return son


kayitlar = genel_kurallar(kayitlar)
print('duzeltmeler:', dict(istat))

# ------------------------------------------------------------------ cikti
J = lambda s: json.dumps(s, ensure_ascii=False)


def satir(c):
    alan = ['e:' + J(c['e']), 's:' + J(c['s'])]
    if c.get('b'):
        alan.append('b:' + J(c['b']))
    if c.get('n'):
        alan.append('n:%d' % int(c['n']))
    if c.get('t'):
        alan.append('t:' + J(c['t']))
    alan.append('y:%s' % int(c['y']))
    return '{' + ','.join(alan) + '}'


klasor = os.path.join(VERI, 'cumleler')
os.makedirs(klasor, exist_ok=True)
yillar = collections.defaultdict(list)
for k in kayitlar:
    yillar[k['y']].append(k)
for eski in glob.glob(os.path.join(klasor, '*.js')):
    os.remove(eski)
toplam_kb = 0
for y in sorted(yillar):
    kayit = yillar[y]
    cevirili = sum(1 for k in kayit if k.get('t'))
    icerik = ('/* YDS cümleleri — %s · %d cümle (%d çevirili)\n'
              '   Alanlar: e=İngilizce cümle, t=Türkçe çeviri, s=sınav, b=bölüm, n=soru numarası, y=yıl.\n'
              '   tools/cumle/cumle_js_uret.py üretir; elle düzenleme. */\n'
              'window.CUMLELER_YIL = window.CUMLELER_YIL || {};\n'
              'window.CUMLELER_YIL[%s] = [\n' % (y, len(kayit), cevirili, J(y))
              + ',\n'.join(satir(k) for k in kayit) + '\n];\n')
    yol = os.path.join(klasor, '%s.js' % y)
    open(yol, 'w', encoding='utf-8', newline='\n').write(icerik)
    toplam_kb += len(icerik.encode('utf-8')) // 1024
bolumler = collections.Counter(k['b'] for k in kayitlar if k.get('b'))
dizin = {
    'toplam': len(kayitlar),
    'cevirili': sum(1 for k in kayitlar if k.get('t')),
    'yillar': [{'y': y, 'n': len(yillar[y])} for y in sorted(yillar)],
    'bolumler': [{'b': b, 'n': n} for b, n in bolumler.most_common()],
}
dizin_js = ('/* YDS cümleleri dizini — %d cümle, %d yıl dosyası (data/cumleler/<yıl>.js)\n'
            '   Filtre seçenekleri ve sayılar buradan gelir; yıl dosyaları sayfa açıkken\n'
            '   yeniden eskiye sırayla yüklenir. tools/cumle/cumle_js_uret.py üretir. */\n'
            'window.CUMLELER_DIZIN = %s;\n' % (len(kayitlar), len(yillar), J(dizin)))
open(os.path.join(VERI, 'cumleler-dizin.js'), 'w', encoding='utf-8', newline='\n').write(dizin_js)
tek = os.path.join(VERI, 'cumleler.js')
if os.path.exists(tek):
    os.remove(tek)
    print('data/cumleler.js kaldirildi (yil dosyalarina bolundu)')
print(f"\nyazildi: {len(yillar)} yil dosyasi ({toplam_kb} KB) + cumleler-dizin.js")
print(f"  cumle   : {len(kayitlar):,}   cevirili: {dizin['cevirili']:,}")
print('  yillar  : ' + ', '.join('%s %d' % (y, len(yillar[y])) for y in sorted(yillar)))
