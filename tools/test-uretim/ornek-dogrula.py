# -*- coding: utf-8 -*-
"""Ornek ciktilarini denetler ve gecenleri tools/ek-ornekler.js'e yazar.

  python ornek-dogrula.py            -> rapor + ek-ornekler.js guncelleme
  python ornek-dogrula.py --rapor    -> yalniz rapor

Olcut listesi GIRDI PAKETLERINDEN DEGIL, guncel data/kelime-k*.js'ten cikarilir.
Boylece arada anlam verisi degisirse bayat cikti sessizce uygulanmaz: kelime
artik cok turlu-tek ornekli degilse atlanir, anlam metni degistiyse hata verir.
"""
import io
import json
import os
import re
import sys

import cekim

sys.stdout.reconfigure(encoding='utf-8')
SITE = cekim.SITE
BURASI = os.path.dirname(os.path.abspath(__file__))
CIKTI = os.path.join(BURASI, 'ornek-cikti')
YALNIZ_RAPOR = '--rapor' in sys.argv
TR_HARF = set('çğıöşüÇĞİÖŞÜ')
JSTR = r'"(?:[^"\\]|\\.)*"'
ANLAM = re.compile(r'\{tr:(%s),ex:(%s),exTr:(%s)(?:,yz:(\d))?\}' % (JSTR, JSTR, JSTR))
# listeyi-aktar.py ile ayni bolme mantigi
ANLAM_BASI = re.compile(r'(^|;\s*)((?:[ifsze]\.(?:/[ifsze]\.)*)\s)')


def anlamlari_bol(tr):
    kesme = [m.start() + len(m.group(1)) for m in ANLAM_BASI.finditer(tr)]
    if len(kesme) < 2:
        return [tr]
    return [tr[b:(kesme[i + 1] if i + 1 < len(kesme) else len(tr))].rstrip('; ').strip()
            for i, b in enumerate(kesme)]


def hedefleri_oku():
    """Guncel veride cok turlu ama tek ornekli kalan kelimeler: {kelime: [parcalar]}."""
    hedef = {}
    for kat in range(1, 8):
        yol = os.path.join(SITE, 'data', 'kelime-k%d.js' % kat)
        if not os.path.exists(yol):
            continue
        for satir in io.open(yol, encoding='utf-8'):
            satir = satir.strip().rstrip(',')
            m = re.match(r'^(%s):\{a:\[' % JSTR, satir)
            if not m:
                continue
            anlamlar = ANLAM.findall(satir)
            if len(anlamlar) != 1:
                continue
            parcalar = anlamlari_bol(json.loads(anlamlar[0][0]))
            if len(parcalar) > 1:
                hedef[json.loads(m.group(1))] = parcalar
    return hedef


hedef = hedefleri_oku()
cikti = {}
bozuk = []
for ad in sorted(os.listdir(CIKTI)):
    if not ad.endswith('.json'):
        continue
    try:
        veri = json.loads(io.open(os.path.join(CIKTI, ad), encoding='utf-8-sig').read())
    except Exception as e:
        bozuk.append('%s (JSON bozuk: %s)' % (ad, str(e)[:50]))
        continue
    for r in veri:
        if isinstance(r, dict) and r.get('e'):
            cikti[r['e']] = (ad, r.get('a'))

sonuc, hatalar, atlanan = {}, [], []
for e, (ad, a) in sorted(cikti.items()):
    if e not in hedef:
        atlanan.append(e)          # arada çözülmüş ya da listeden çıkmış
        continue
    parcalar = hedef[e]
    if not isinstance(a, list) or len(a) != len(parcalar):
        hatalar.append('%s %s: anlam sayısı %s, %d bekleniyordu'
                       % (ad, e, len(a) if isinstance(a, list) else '?', len(parcalar)))
        continue

    sorunlar = []
    bicimler = {e} | {cekim.cek(e, f) for f in ('s', 'past', 'pp', 'ing', 'pl')}
    son = e[-1] if e else ''
    # Yazim varyantlari: diagrammed (son harf ciftlenir), leaped (leapt yaninda)
    bicimler |= {e + 'ed', e + 'd', e + 's', e + 'ing', e + son + 'ed', e + son + 'ing'}
    # Parca etiketindeki parantezli turev de kabul: "(knowledgeably) bilgili bicimde"
    for parca in parcalar:
        bicimler |= set(re.findall(r'\(([a-z][a-z -]+)\)', parca))
    if '-' in e:
        bicimler |= {e + 's', e.replace('-', ' '), e.replace('-', '')}
    bicimler = {b for b in bicimler if b}

    for i, (parca, anlam) in enumerate(zip(parcalar, a)):
        tr = (anlam.get('tr') or '').strip()
        ex = (anlam.get('ex') or '').strip()
        exTr = (anlam.get('exTr') or '').strip()
        if tr != parca:
            sorunlar.append('[%d] tr güncel veriyle uyuşmuyor' % i)
        if not ex or not exTr:
            sorunlar.append('[%d] boş alan' % i)
            continue
        if not any(re.search(r'\b' + re.escape(b) + r'\b', ex, re.I) for b in bicimler):
            sorunlar.append('[%d] kelime örnekte yok' % i)
        if len(exTr) < 15:
            sorunlar.append('[%d] çeviri çok kısa' % i)
        if not (set(exTr) & TR_HARF):
            sorunlar.append('[%d] çeviride Türkçe karakter yok' % i)
        if re.search(r'[“”‘’—]', ex + exTr):
            sorunlar.append('[%d] tipografik işaret' % i)
    if len({x.get('ex') for x in a}) != len(a):
        sorunlar.append('yinelenen örnek')
    if sorunlar:
        hatalar.append('%s %s: %s' % (ad, e, '; '.join(sorunlar)))
        continue
    sonuc[e] = [{'tr': x['tr'].strip(), 'ex': x['ex'].strip(), 'exTr': x['exTr'].strip()}
                for x in a]

kalan = sorted(set(hedef) - set(cikti))
print('hedef %d · çıktı %d · geçen %d · hatalı %d · atlanan %d · üretilmeyen %d'
      % (len(hedef), len(cikti), len(sonuc), len(hatalar), len(atlanan), len(kalan)))
for b in bozuk:
    print('  BOZUK', b)
if atlanan:
    print('  atlanan (artık gerekmiyor):', ', '.join(atlanan[:10]))
for h in hatalar[:20]:
    print('  HATA', h)
if len(hatalar) > 20:
    print('  … %d hata daha' % (len(hatalar) - 20))
if kalan:
    print('  üretilmeyen ilk 10:', ', '.join(kalan[:10]))

if not YALNIZ_RAPOR and sonuc:
    yol = os.path.join(SITE, 'tools', 'ek-ornekler.js')
    metin = io.open(yol, encoding='utf-8').read()
    mevcut = set(re.findall(r'^"((?:[^"\\]|\\.)*)": \[', metin, re.M))

    def blok_degistir(metin, anahtar, anlamlar):
        bas = metin.index('"%s": [' % anahtar)
        i = metin.index('[', bas)
        derinlik = 0
        for j in range(i, len(metin)):
            if metin[j] == '[':
                derinlik += 1
            elif metin[j] == ']':
                derinlik -= 1
                if derinlik == 0:
                    break
        yeni = '"%s": [\n' % anahtar + ',\n'.join(
            '  ' + json.dumps(x, ensure_ascii=False) for x in anlamlar) + '\n]'
        return metin[:bas] + yeni + metin[j + 1:]

    yerinde, ekler = 0, []
    for e in sorted(sonuc):
        if e in mevcut:
            metin = blok_degistir(metin, e, sonuc[e])
            yerinde += 1
        else:
            ekler.append('%s: [\n' % json.dumps(e, ensure_ascii=False) + ',\n'.join(
                '  ' + json.dumps(x, ensure_ascii=False) for x in sonuc[e]) + '\n],')
    if ekler:
        govde = '\n'.join(ekler)
        if govde.endswith(','):
            govde = govde[:-1]
        assert metin.rstrip().endswith('};')
        son = metin.rstrip()[:-2].rstrip()
        if not son.endswith(','):
            son += ','
        metin = (son + '\n\n/* --- ornek-dogrula.py: çok türlü kelimelere tür başına örnek --- */\n'
                 + govde + '\n};\n')
    io.open(yol, 'w', encoding='utf-8', newline='\n').write(metin)
    print('ek-ornekler.js: %d yerinde, %d eklendi' % (yerinde, len(ekler)))
