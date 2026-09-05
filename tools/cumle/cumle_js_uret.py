# -*- coding: utf-8 -*-
# KALICI KOPYA (5 Eylul 2026): ozgun betik 03_calisma_listesi/06_sandbox_2026-09/ altinda;
# girdi/cikti klasorleri orada oldugu icin SP/BURASI o klasore sabitlendi.
"""Cumle bankasi + mevcut cevirileri -> site icin data/cumleler.js

Ceviri tamamlanmamis olsa da calisir; ceviri gelen cumleler 'tr' alani alir.
Yeni ceviri parcalari geldikce yeniden calistirilir.
"""
import os, sys, io, re, json, glob, collections
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

SP = "C:/Users/Trk/Desktop/YDS/03_calisma_listesi/06_sandbox_2026-09"
C = os.path.join(SP, 'cumleler')
VERI = r"C:\Users\Trk\Desktop\YDS\04_Github\data"

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

J = lambda s: json.dumps(s, ensure_ascii=False)
satir, istat = [], collections.Counter()
for cid, c in sorted(cumle.items()):
    tr = ceviri.get(cid, '')
    alan = ['e:' + J(c['en']), 's:' + J(c['sinav_adi'])]
    if c.get('bolum'):
        alan.append('b:' + J(BOLUM_KISA.get(c['bolum'], c['bolum'])))
        istat['bolumlu'] += 1
    if c.get('soru'):
        alan.append('n:%d' % c['soru'])
    if tr:
        alan.append('t:' + J(tr)); istat['cevirili'] += 1
    alan.append('y:' + J(c['yil']))
    satir.append('{' + ','.join(alan) + '}')

basli = ('/* ============================================================\n'
         '   YDS cümleleri — %d cümle\n'
         '   2013-2026 arası YDS ve e-YDS kitapçıklarında geçen cümleler.\n'
         '   Alanlar: e=İngilizce cümle, t=Türkçe çeviri, s=sınav,\n'
         '            b=sınavın hangi bölümü, n=soru numarası, y=yıl\n'
         '   Çeviri tamamlanmamış cümlelerde t alanı bulunmaz.\n'
         '   tools/ ile üretilir; elle düzenleme.\n'
         '   ============================================================ */\n\n'
         'window.CUMLELER = [\n' % len(satir))
icerik = basli + ',\n'.join(satir) + '\n];\n'
yol = os.path.join(VERI, 'cumleler.js')
open(yol, 'w', encoding='utf-8', newline='\n').write(icerik)
print(f"\ncumleler.js yazildi: {len(satir):,} kayit, {len(icerik)/1024:.0f} KB")
print(f"  bolum etiketli: {istat['bolumlu']:,}")
print(f"  cevirili      : {istat['cevirili']:,}")
