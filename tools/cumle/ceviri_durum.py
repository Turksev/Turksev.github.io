# -*- coding: utf-8 -*-
# KALICI KOPYA (5 Eylul 2026): ozgun betik 03_calisma_listesi/06_sandbox_2026-09/ altinda;
# girdi/cikti klasorleri orada oldugu icin SP/BURASI o klasore sabitlendi.
"""Ceviri ilerlemesi: hangi parcalar bitmis, ilk eksik hangisi."""
import os, sys, io, re, json, glob
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

SP = "C:/Users/Trk/Desktop/YDS/03_calisma_listesi/06_sandbox_2026-09"
C = os.path.join(SP, 'cumleler')
man = json.load(open(os.path.join(C, 'MANIFEST.json'), encoding='utf-8'))
TOPLAM = man['parca']

bitti, bozuk, cev = set(), [], 0
for p in glob.glob(os.path.join(C, 'cikti', 'C_*.json')):
    ad = os.path.basename(p)[:-5]
    try:
        d = json.load(open(p, encoding='utf-8'))
        n = len([t for t in d.get('ceviriler', []) if (t.get('tr') or '').strip()])
    except Exception as e:
        bozuk.append((ad, str(e)[:60])); continue
    if n == 0:
        bozuk.append((ad, 'bos')); continue
    bitti.add(ad); cev += n

eksik = [f'C_{i:03d}' for i in range(1, TOPLAM + 1) if f'C_{i:03d}' not in bitti]
print(f"parca : {len(bitti)}/{TOPLAM} bitti")
print(f"cumle : {cev:,} / {man['toplam']:,}  (%{cev/man['toplam']*100:.0f})")
if bozuk:
    print(f"bozuk/bos: {bozuk}")
print(f"\neksik parca ({len(eksik)}):")
print('  ' + ', '.join(eksik[:24]) + (' ...' if len(eksik) > 24 else ''))
print(f"\nILK_EKSIK={eksik[0] if eksik else 'YOK'}")
print(f"SONRAKI_BASLA={int(eksik[0][2:]) if eksik else 0}")
