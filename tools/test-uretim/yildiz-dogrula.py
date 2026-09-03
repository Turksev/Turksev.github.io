# -*- coding: utf-8 -*-
"""Yildiz cikti paketlerini denetler ve tools/anlam-yildiz.js dosyasini yazar.

  python yildiz-dogrula.py            -> rapor + tools/anlam-yildiz.js
  python yildiz-dogrula.py --rapor    -> yalniz rapor

Yildizlar anlam METNINE baglanir, siraya degil: listeyi-aktar.py anlamlari
yildiza gore yeniden siraladigi icin indise guvenmek kirilgan olurdu.
"""
import io
import json
import os
import sys
from collections import Counter

sys.stdout.reconfigure(encoding='utf-8')
SITE = r'C:\Users\Trk\Desktop\YDS\04_uygulama'
BURASI = os.path.dirname(os.path.abspath(__file__))
GIRDI = os.path.join(BURASI, 'yildiz-girdi')
CIKTI = os.path.join(BURASI, 'yildiz-cikti')
YALNIZ_RAPOR = '--rapor' in sys.argv

sonuc, hatalar, eksik = {}, [], []
toplam = gecen = 0
dagilim = Counter()

# "ek-" paketleri sonradan gelen duzeltmelerdir; en sonda islenir ki ayni
# kelimenin eski (anlam metni degismis, artik eslesmeyen) kaydini ezsinler.
# Alfabetik sirada "ek-" < "k1-" oldugu icin bu ayarlama sart.
def sira(ad):
    return (1 if ad.startswith('ek-') else 0, ad)


for ad in sorted(os.listdir(GIRDI), key=sira):
    girdi = json.load(io.open(os.path.join(GIRDI, ad), encoding='utf-8'))
    yol = os.path.join(CIKTI, ad)
    if not os.path.exists(yol):
        eksik.append(ad)
        continue
    try:
        cikti = json.loads(io.open(yol, encoding='utf-8-sig').read())
    except Exception as e:
        eksik.append('%s (JSON bozuk: %s)' % (ad, str(e)[:50]))
        continue

    harita = {r['e']: r for r in cikti if isinstance(r, dict) and r.get('e')}
    for g in girdi:
        toplam += 1
        e = g['e']
        r = harita.get(e)
        if r is None:
            hatalar.append('%s %s: kayıt yok' % (ad, e))
            continue
        yz = r.get('yz')
        if not isinstance(yz, list) or len(yz) != len(g['a']):
            hatalar.append('%s %s: yz %s, %d anlam bekleniyordu'
                           % (ad, e, yz, len(g['a'])))
            continue
        if not all(isinstance(x, int) and 1 <= x <= 4 for x in yz):
            hatalar.append('%s %s: yıldızlar 1-4 tamsayı değil: %s' % (ad, e, yz))
            continue
        if max(yz) < 3:
            hatalar.append('%s %s: en yüksek yıldız 3\'ten küçük: %s' % (ad, e, yz))
            continue
        sonuc[e] = [{'tr': a['tr'], 'yz': x} for a, x in zip(g['a'], yz)]
        gecen += 1
        for x in yz:
            dagilim[x] += 1

print('kayıt %d · geçen %d · hatalı %d · eksik paket %d'
      % (toplam, gecen, len(hatalar), len(eksik)))
if dagilim:
    print('  yıldız dağılımı: ' + ' · '.join(
        '%d★ %d' % (y, dagilim[y]) for y in (4, 3, 2, 1)))
for x in eksik[:6]:
    print('  EKSIK', x)
for h in hatalar[:25]:
    print('  HATA', h)
if len(hatalar) > 25:
    print('  … %d hata daha' % (len(hatalar) - 25))

if not YALNIZ_RAPOR and sonuc:
    satirlar = []
    for e in sorted(sonuc):
        icerik = ', '.join('{tr:%s,yz:%d}' % (json.dumps(a['tr'], ensure_ascii=False), a['yz'])
                           for a in sonuc[e])
        satirlar.append('%s: [%s]' % (json.dumps(e, ensure_ascii=False), icerik))
    icerik = (
        '/* ============================================================\n'
        '   Anlam yıldızları — dönüştürücü girdisi (site bu dosyayı YÜKLEMEZ)\n\n'
        '   Çok anlamlı kelimelerde her anlamın YDS önemi: 4 = sınavda asıl\n'
        '   sorulan anlam, 1 = nadir/ikincil. Her kelimenin en yüksek yıldızı\n'
        '   en az 3\'tür. listeyi-aktar.py bunu okuyup anlamlara "yz" alanı\n'
        '   olarak yazar ve anlamları yıldıza göre büyükten küçüğe sıralar.\n\n'
        '   Yıldız anlam METNİNE bağlıdır; kaynak listedeki sıra değişse bile\n'
        '   eşleşme bozulmaz. Metin değişirse o anlam yıldızsız kalır.\n'
        '   Üretim: tools/test-uretim (agent + yildiz-dogrula.py) · %d kelime\n'
        '   ============================================================ */\n\n'
        'window.ANLAM_YILDIZ = {\n' % len(sonuc)
    ) + ',\n'.join(satirlar) + '\n};\n'
    io.open(os.path.join(SITE, 'tools', 'anlam-yildiz.js'), 'w',
            encoding='utf-8', newline='\n').write(icerik)
    print('yazıldı tools/anlam-yildiz.js (%d kayıt)' % len(sonuc))
