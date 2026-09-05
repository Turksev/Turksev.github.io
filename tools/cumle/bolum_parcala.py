# -*- coding: utf-8 -*-
# KALICI KOPYA (5 Eylul 2026): ozgun betik 03_calisma_listesi/06_sandbox_2026-09/ altinda;
# girdi/cikti klasorleri orada oldugu icin SP/BURASI o klasore sabitlendi.
"""Belirsiz kalan bloklari LLM siniflandirmasi icin parcalara ayirir."""
import os, sys, io, json, math
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

SP = "C:/Users/Trk/Desktop/YDS/03_calisma_listesi/06_sandbox_2026-09"
OUT = os.path.join(SP, 'bolum')
os.makedirs(os.path.join(OUT, 'girdi'), exist_ok=True)
os.makedirs(os.path.join(OUT, 'cikti'), exist_ok=True)

d = json.load(open(os.path.join(SP, 'bolum_kural2.json'), encoding='utf-8'))
bel = d['belirsiz']
for i, b in enumerate(bel):
    b['id'] = f'B{i+1:04d}'

BOYUT = 22
n = math.ceil(len(bel) / BOYUT)
for i in range(n):
    ch = bel[i * BOYUT:(i + 1) * BOYUT]
    ad = f'S_{i+1:02d}'
    json.dump({'parca': ad, 'bloklar': ch},
              open(os.path.join(OUT, 'girdi', ad + '.json'), 'w', encoding='utf-8'),
              ensure_ascii=False, indent=1)
print(f"{len(bel)} belirsiz blok -> {n} parca (parca basina {BOYUT})")
print(f"girdi: {os.path.join(OUT, 'girdi')}")
json.dump({'toplam': len(bel), 'parca': n,
           'adlar': [f'S_{i+1:02d}' for i in range(n)]},
          open(os.path.join(OUT, 'MANIFEST.json'), 'w', encoding='utf-8'), ensure_ascii=False)
