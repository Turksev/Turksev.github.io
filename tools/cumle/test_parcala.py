# -*- coding: utf-8 -*-
# KALICI KOPYA (5 Eylul 2026): ozgun betik 03_calisma_listesi/06_sandbox_2026-09/ altinda;
# girdi/cikti klasorleri orada oldugu icin SP/BURASI o klasore sabitlendi.
"""Gunun testi cumlesi olmayan kelimeleri parcalara ayirir."""
import os, sys, io, re, json, math, collections
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

SP = "C:/Users/Trk/Desktop/YDS/03_calisma_listesi/06_sandbox_2026-09"
D = r"C:\Users\Trk\Desktop\YDS\04_Github"
VERI = os.path.join(D, 'data')
OUT = os.path.join(SP, 'gunun_testi')
os.makedirs(os.path.join(OUT, 'girdi'), exist_ok=True)
os.makedirs(os.path.join(OUT, 'cikti'), exist_ok=True)
BOYUT = 30

txt = lambda f: open(os.path.join(VERI, f), encoding='utf-8').read()

# dizin: kelime -> (katman, kisa anlam, tur)
dizin = {}
for m in re.finditer(r'\{e:"((?:[^"\\]|\\.)+)",t:"((?:[^"\\]|\\.)*)".*?k:(\d),y:"((?:[^"\\]|\\.)*)"',
                     txt('kelime-dizin.js')):
    dizin[m.group(1)] = {'kelime': m.group(1), 'kisa': m.group(2),
                         'katman': int(m.group(3)), 'tur': m.group(4)}
print(f"dizin: {len(dizin):,}")

# mevcut test havuzu
var = set()
for i in range(1, 8):
    for m in re.finditer(r'\n"((?:[^"\\]|\\.)+)":\{c:', txt('test-k%d.js' % i)):
        var.add(m.group(1))
print(f"test havuzu: {len(var):,}")

eksik = [dizin[w] for w in dizin if w not in var]
print(f"EKSIK: {len(eksik):,}")

# kart kaydindan anlam ve ornek cumle al (ayni cumleyi kullanmayacagiz ama baglam olsun)
kayit = {}
for i in range(1, 8):
    t = txt('kelime-k%d.js' % i)
    for m in re.finditer(r'\n"((?:[^"\\]|\\.)+)":\{a:\[\{tr:"((?:[^"\\]|\\.)*)",ex:"((?:[^"\\]|\\.)*)"', t):
        kayit[m.group(1)] = {'tr': m.group(2), 'ex': m.group(3)}

for e in eksik:
    k = kayit.get(e['kelime'], {})
    e['anlam'] = k.get('tr', e['kisa'])
    e['kart_ornegi'] = k.get('ex', '')

eksik.sort(key=lambda x: (x['katman'], x['kelime'].lower()))
n = math.ceil(len(eksik) / BOYUT)
for i in range(n):
    ch = eksik[i * BOYUT:(i + 1) * BOYUT]
    ad = 'G_%03d' % (i + 1)
    json.dump({'parca': ad, 'ogeler': ch},
              open(os.path.join(OUT, 'girdi', ad + '.json'), 'w', encoding='utf-8'),
              ensure_ascii=False, indent=1)
print(f"\n{n} parca (parca basina {BOYUT})")
kat = collections.Counter(e['katman'] for e in eksik)
print("katman dagilimi:", dict(sorted(kat.items())))
json.dump({'toplam': len(eksik), 'parca': n,
           'adlar': ['G_%03d' % (i + 1) for i in range(n)]},
          open(os.path.join(OUT, 'MANIFEST.json'), 'w', encoding='utf-8'), ensure_ascii=False)
print("\nornek oge:")
print(json.dumps(eksik[0], ensure_ascii=False, indent=1))
