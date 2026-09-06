# -*- coding: utf-8 -*-
"""Güncel korpus puanlamasından (duz5) site için puan güncelleme tablosu üretir.

Çıktı: tools/puan-guncellemesi.json — listeyi-aktar.py kelimeleri birleştirdikten sonra
uygular: puanı olan her kelimenin puanı buradaki değerle değişir; katmanı sabitlenmemiş
(katman_zorla olmayan) kelimelerde katman yeni puana göre yeniden bantlanır.

Neden (denetim 2, B1): site puanları 22 Ağustos xlsx'inden geliyordu; 6 tam kitapçık ve
2023 transkriptleri korpusa girince (duz5, 6 Eylül 2026: 2022 ayrıştırıcı düzeltmesi + kitapçık
şablon metinleri dışlanmış) 5.000'den fazla kelimenin puanı değişti.

Dışlananlar: modal fiil/yapı kartları (lemmatizer should→shall, could→can, might→may
eşlemesi yaptığı için modal sayımları kaynağa göre kaymış olur) ve puanı olmayan kalıplar.

Kullanım: python tools/puan-guncellemesi-uret.py [--yaz]
"""
import collections
import io
import json
import os
import re
import sqlite3
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
G = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUA = r"C:\Users\Trk\Desktop\YDS\03_calisma_listesi\06_sandbox_2026-09\sandbox\duz5\03_puanlama\puanlama.sqlite"
CIKTI = os.path.join(G, 'tools', 'puan-guncellemesi.json')
RAPOR = os.path.join(G, 'tools', 'puan-guncellemesi-rapor.md')
MODAL_LEMMA = {'shall', 'can', 'may', 'will', 'must', 'ought', 'need', 'dare'}
YAZ = '--yaz' in sys.argv


def bant(p):
    return 1 if p >= 40 else 2 if p >= 30 else 3 if p >= 25 else 4 if p >= 17 else 5 if p >= 12 else 6 if p >= 10 else 7


dz = {}
for m in re.finditer(r'\{e:"((?:[^"\\]|\\.)+)",t:"(?:[^"\\]|\\.)*"(?:,p:([\d.]+))?,k:(\d),y:"([^"]*)"\}',
                     io.open(os.path.join(G, 'data', 'kelime-dizin.js'), encoding='utf-8').read()):
    dz[m.group(1)] = {'p': float(m.group(2)) if m.group(2) else None, 'k': int(m.group(3)), 'y': m.group(4)}
print('dizin: %d' % len(dz))

con = sqlite3.connect('file:%s?mode=ro' % PUA.replace(os.sep, '/'), uri=True)
pu = {}
for w, p, gs, tf in con.execute('select kelime, puan, gectigi_sinav, toplam_frekans from puan where puan is not null'):
    w = str(w).lower()
    if w not in pu or p > pu[w][0]:
        pu[w] = (float(p), int(gs or 0), int(tf or 0))
con.close()

kayit = {}
atla = collections.Counter()
for w, d in dz.items():
    if d['p'] is None:
        atla['puansız kalıp'] += 1; continue
    if 'modal' in d['y'] or w.lower() in MODAL_LEMMA:
        atla['modal'] += 1; continue
    q = pu.get(w.lower())
    if q is None:
        atla['duz5\'te yok'] += 1; continue
    kayit[w] = {'p': round(q[0], 1), 's': q[1], 'f': q[2]}

degisen = [(w, dz[w]['p'], v['p']) for w, v in kayit.items() if abs(v['p'] - dz[w]['p']) >= 0.05]
gecis = collections.Counter()
ornek = collections.defaultdict(list)
for w, v in kayit.items():
    d = dz[w]
    if d['k'] == 7 or (d['k'] == 6 and d['p'] < 10) or bant(d['p']) != d['k']:
        continue          # katmanı elle sabitlenmiş kelimeler (aile, denetimli ek, ek-kelimeler)
    nb = bant(v['p'])
    if nb != d['k']:
        gecis[(d['k'], nb)] += 1
        if len(ornek[(d['k'], nb)]) < 3:
            ornek[(d['k'], nb)].append('%s %.1f→%.1f' % (w, d['p'], v['p']))
print('güncellenecek kelime: %d (puanı değişen: %d) | atlanan: %s' % (len(kayit), len(degisen), dict(atla)))
print('katman geçişi (elle sabitlenmemişler): %d' % sum(gecis.values()))
for (a, b), n in sorted(gecis.items()):
    print('  %d → %d: %4d   %s' % (a, b, n, '; '.join(ornek[(a, b)])))
buyuk = sorted(degisen, key=lambda x: -abs(x[2] - x[1]))[:15]
print('en büyük değişimler:', ', '.join('%s %.1f→%.1f' % x for x in buyuk))

if YAZ:
    json.dump({'sema': 1, 'kaynak': 'duz5 puanlama.sqlite (03_calisma_listesi/06_sandbox_2026-09/sandbox/duz5)',
               'tarih': '2026-09-06',
               'aciklama': 'Güncel korpus (49 sınav; 6 tam kitapçık + 2023 transkriptleri; 2022 ayrıştırıcı düzeltmesi; '
                           'kitapçık şablon metinleri dışlanmış) ile yeniden hesaplanan YDS öncelik puanları. '
                           'listeyi-aktar.py birleşimden sonra uygular; modal kartlar ve puansız kalıplar dışında tutulur.',
               'alanlar': {'p': 'puan (100 × (0.50·S + 0.20·F + 0.30·P))', 's': 'kaç farklı sınavda geçti', 'f': 'toplam frekans'},
               'kayitlar': dict(sorted(kayit.items()))},
              io.open(CIKTI, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    satir = ['# Puan güncellemesi raporu — 6 Eylül 2026 (duz5)', '',
             'Güncellenen kelime: %d · puanı değişen: %d · atlanan: %s' % (len(kayit), len(degisen), dict(atla)), '',
             '| Geçiş | Kelime | Örnek |', '|---|---|---|']
    for (a, b), n in sorted(gecis.items()):
        satir.append('| %d → %d | %d | %s |' % (a, b, n, '; '.join(ornek[(a, b)])))
    satir += ['', 'En büyük değişimler: ' + ', '.join('%s %.1f→%.1f' % x for x in buyuk), '',
              'Not: katmanı elle sabitlenmiş kelimeler (aile üyeleri, denetimli ekler, ek-kelimeler) yalnız puan alır; katmanları değişmez.']
    io.open(RAPOR, 'w', encoding='utf-8', newline='\n').write('\n'.join(satir) + '\n')
    print('yazıldı:', CIKTI, 've', RAPOR)
else:
    print('(kuru koşum — yazmak için --yaz)')
