# -*- coding: utf-8 -*-
"""Kalip cikti paketlerini denetler ve tools/kaliplar.js dosyasini yazar.

  python kalip-dogrula.py            -> rapor + tools/kaliplar.js
  python kalip-dogrula.py --rapor    -> yalniz rapor
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
GIRDI = os.path.join(BURASI, 'kalip-girdi')
CIKTI = os.path.join(BURASI, 'kalip-cikti')
YALNIZ_RAPOR = '--rapor' in sys.argv
TR_HARF = set('çğıöşüÇĞİÖŞÜ')

sonuc, hatalar, eksik = {}, [], []
toplam = kalipli = kalip_sayisi = 0

for ad in sorted(os.listdir(GIRDI)):
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

    # Paket düzeyinde: Türkçe metinlerde hiç diakritik yoksa ajan ASCII yazmış demektir.
    tum_tr = ' '.join(k.get('tr', '') for r in cikti if isinstance(r, dict)
                      for k in (r.get('k') or []))
    if tum_tr and not (set(tum_tr) & TR_HARF):
        hatalar.append('%s: Türkçe metinlerde hiç ç/ğ/ı/ö/ş/ü yok (diakritiksiz yazılmış)' % ad)
        continue

    harita = {r['e']: r for r in cikti if isinstance(r, dict) and r.get('e')}
    for g in girdi:
        toplam += 1
        e = g['e']
        r = harita.get(e)
        if r is None:
            hatalar.append('%s %s: kayıt yok' % (ad, e))
            continue
        kaliplar = r.get('k') or []
        if not isinstance(kaliplar, list):
            hatalar.append('%s %s: k alanı dizi değil' % (ad, e))
            continue
        if not kaliplar:
            continue

        sorun, temiz = [], []
        if len(kaliplar) > 3:
            sorun.append('%d kalıp (en çok 3)' % len(kaliplar))
        for kl in kaliplar[:3]:
            en = (kl.get('en') or '').strip()
            tr = (kl.get('tr') or '').strip()
            n = len(re.findall(r'\S+', en))
            if not en or not tr:
                sorun.append('boş alan')
                continue
            if n < 2 or n > 6:
                sorun.append('"%s" %d kelime' % (en, n))
                continue
            # hedef kelime kalıpta geçmeli (çekimli olabilir)
            bicimler = {e} | {cekim.cek(e, f) for f in ('s', 'past', 'pp', 'ing', 'pl')}
            # Tireli kelimenin çoğulu bütüne gelir: have-not -> have-nots
            if '-' in e:
                # life-time -> lifetime, give-up -> give up gibi yazım biçimleri
                duz, bitisik = e.replace('-', ' '), e.replace('-', '')
                bicimler |= {e + 's', e + 'es', duz, duz + 's', bitisik, bitisik + 's', bitisik + 'es'}
            bicimler = {b for b in bicimler if b}
            if not any(re.search(r'\b' + re.escape(b) + r'\b', en, re.I) for b in bicimler):
                sorun.append('"%s" kelimeyi içermiyor' % en)
                continue
            temiz.append({'en': en, 'tr': tr})
        if len({k['en'] for k in temiz}) != len(temiz):
            sorun.append('yinelenen kalıp')
        if sorun:
            hatalar.append('%s %s: %s' % (ad, e, '; '.join(sorun)))
            continue
        if temiz:
            sonuc[e] = temiz
            kalipli += 1
            kalip_sayisi += len(temiz)

print('kelime %d · kalıplı %d · kalıp %d · hatalı %d · eksik paket %d' %
      (toplam, kalipli, kalip_sayisi, len(hatalar), len(eksik)))
for x in eksik[:6]:
    print('  EKSIK', x)
for h in hatalar[:25]:
    print('  HATA', h)
if len(hatalar) > 25:
    print('  … %d hata daha' % (len(hatalar) - 25))

if not YALNIZ_RAPOR and sonuc:
    satirlar = []
    for e in sorted(sonuc):
        icerik = ', '.join('{en:%s,tr:%s}' % (json.dumps(k['en'], ensure_ascii=False),
                                              json.dumps(k['tr'], ensure_ascii=False))
                           for k in sonuc[e])
        satirlar.append('%s: [%s]' % (json.dumps(e, ensure_ascii=False), icerik))
    icerik = (
        '/* ============================================================\n'
        '   Kullanım kalıpları — dönüştürücü girdisi (site bu dosyayı YÜKLEMEZ)\n\n'
        '   Kelimenin anlamı değil, NASIL kullanıldığı: hangi edatı alır, hangi\n'
        '   sözcüklerle birlikte gelir. YDS bu kalıpları bolca sorar; Türkçe fiilin\n'
        '   istediği ek İngilizceye taşınınca hata çıkar ("comply to" değil "comply with").\n\n'
        '   Kalıbı olmayan somut kelimeler (tiger, table) burada yoktur.\n'
        '   Üretim: tools/test-uretim (agent + kalip-dogrula.py) · %d kelime, %d kalıp\n'
        '   ============================================================ */\n\n'
        'window.KALIPLAR = {\n' % (len(sonuc), kalip_sayisi)
    ) + ',\n'.join(satirlar) + '\n};\n'
    io.open(os.path.join(SITE, 'tools', 'kaliplar.js'), 'w',
            encoding='utf-8', newline='\n').write(icerik)
    print('yazıldı tools/kaliplar.js (%d kelime, %d kalıp)' % (len(sonuc), kalip_sayisi))
