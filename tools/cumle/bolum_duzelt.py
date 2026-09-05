# -*- coding: utf-8 -*-
# KALICI KOPYA (5 Eylul 2026): ozgun betik 03_calisma_listesi/06_sandbox_2026-09/ altinda;
# girdi/cikti klasorleri orada oldugu icin SP/BURASI o klasore sabitlendi.
"""Denetcilerin buldugu sistematik hatayi TUM bloklara uygular ve sonuclari birlestirir.

Kural (denetci gerekcesi):
  Çeviri (37-42)        -> Turkce kok dil suzgecinde duser, geriye 5 Ingilizce sik kalir
  Anlamca En Yakın (68-71) -> 6 cumle: 1 kok + 5 parafraz sik
Ayrica sayfa konumu her iki bolumu de ayirt eder.
"""
import os, sys, io, re, json, glob, collections
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

SP = "C:/Users/Trk/Desktop/YDS/03_calisma_listesi/06_sandbox_2026-09"
B = os.path.join(SP, 'bolum')

girdi = {}
for p in glob.glob(os.path.join(B, 'girdi', '*.json')):
    for b in json.load(open(p, encoding='utf-8'))['bloklar']:
        girdi[b['id']] = b

karar = {}
for p in glob.glob(os.path.join(B, 'cikti', '*.json')):
    d = json.load(open(p, encoding='utf-8'))
    for k in d.get('kararlar', []):
        karar[k['id']] = k
print(f"girdi blok: {len(girdi)}  |  karar: {len(karar)}")

CUM = re.compile(r'[^.!?]+[.!?]')
def cumle_sayisi(t):
    return len([c for c in CUM.findall(t) if len(c.split()) >= 5])

def bant_ort(ar):
    return None if not ar else (ar[0] + ar[1]) / 2

# Denetcilerin blogu tek tek inceleyerek buldugu hatalar (heuristikten guvenilir)
DENETCI = {'B0025': 'Çeviri', 'B0026': 'Çeviri', 'B0027': 'Çeviri',
           'B0041': 'Çeviri', 'B0042': 'Çeviri', 'B0043': 'Çeviri'}

duzeltilen, dagilim = [], collections.Counter()
for bid, yeni in DENETCI.items():
    k = karar.get(bid)
    if k and k.get('bolum') != yeni:
        duzeltilen.append({'id': bid, 'eski': k['bolum'], 'yeni': yeni,
                           'cumle': cumle_sayisi(girdi[bid]['metin']) if bid in girdi else None,
                           'aralik': girdi.get(bid, {}).get('sayfa_araligi'),
                           'kaynak': 'denetci'})
        k['bolum'] = yeni
        k['gerekce'] = k.get('gerekce', '') + ' [DENETCI DUZELTMESI: kok dusmus ceviri sorusu]'

for bid, k in karar.items():
    g = girdi.get(bid)
    if not g:
        continue
    bol = k.get('bolum')
    if bol == 'Anlamca En Yakın':
        n = cumle_sayisi(g['metin'])
        ar = g.get('sayfa_araligi')
        ort = bant_ort(ar)
        # 5 veya daha az cumle -> kok dusmus, Ceviri
        # sayfa araligi 37-42'ye daha yakinsa -> Ceviri
        ceviri_yon = (ort is not None and ort < 55)
        if n <= 5 and (ceviri_yon or ar is None):
            duzeltilen.append({'id': bid, 'eski': bol, 'yeni': 'Çeviri',
                               'cumle': n, 'aralik': ar})
            k['bolum'] = 'Çeviri'
            k['gerekce'] = (k.get('gerekce', '') +
                            f' [DUZELTME: {n} Ingilizce cumle = kok dusmus ceviri sikki]')
    dagilim[k['bolum']] += 1

print(f"\nsistematik duzeltme: {len(duzeltilen)} blok  Anlamca En Yakın -> Çeviri")
for d in duzeltilen[:10]:
    print(f"  {d['id']}  cumle={d['cumle']}  sayfa_araligi={d['aralik']}")

print("\n=== LLM siniflandirmasi (duzeltilmis) ===")
for k, v in dagilim.most_common():
    print(f"  {k:<28} {v:>4}")

# --- kural sonuclariyla birlestir
kural = json.load(open(os.path.join(SP, 'bolum_kural2.json'), encoding='utf-8'))['kural']
tum = collections.Counter()
for r in kural:
    tum[r['bolum']] += 1
for k in karar.values():
    if k['bolum'] != 'kararsiz':
        tum[k['bolum']] += 1

print("\n=== TUM ETIKETSIZ BLOKLARIN NIHAI DAGILIMI ===")
top = sum(tum.values())
for k, v in tum.most_common():
    print(f"  {k:<28} {v:>4}")
print(f"  {'TOPLAM':<28} {top:>4} / 990")
print(f"  {'kararsiz / cozulemeyen':<28} {990-top:>4}")

json.dump({'kural': kural, 'llm': list(karar.values()), 'duzeltilen': duzeltilen},
          open(os.path.join(SP, 'bolum_nihai.json'), 'w', encoding='utf-8'), ensure_ascii=False)
print("\nbolum_nihai.json yazildi")
