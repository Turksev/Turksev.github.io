# -*- coding: utf-8 -*-
"""Obek test cumlelerini denetler, gecenleri data/test-obek.js olarak yazar.

  python obek-test-dogrula.py            -> rapor + dosya
  python obek-test-dogrula.py --rapor    -> yalniz rapor
"""
import io
import json
import os
import re
import sys

import cekim

SITE = cekim.SITE
BURASI = os.path.dirname(os.path.abspath(__file__))
GIRDI = os.path.join(BURASI, 'obek-test-girdi')
CIKTI = os.path.join(BURASI, 'obek-test-cikti')
YALNIZ_RAPOR = '--rapor' in sys.argv
BICIMLER = ['', 's', 'past', 'pp', 'ing']
sys.stdout.reconfigure(encoding='utf-8')


def benzer(a, b):
    A = set(re.findall(r"[a-z']+", a.lower()))
    B = set(re.findall(r"[a-z']+", b.lower()))
    if not A or not B:
        return 0.0
    return len(A & B) / max(1, min(len(A), len(B)))


sonuc, hatalar, eksik = {}, [], []
toplam = gecen = 0

for ad in sorted(os.listdir(GIRDI)):
    girdi = json.load(io.open(os.path.join(GIRDI, ad), encoding='utf-8'))
    yol = os.path.join(CIKTI, ad)
    if not os.path.exists(yol):
        eksik.append(ad + ' (dosya yok)')
        continue
    try:
        cikti = json.loads(io.open(yol, encoding='utf-8-sig').read())
    except Exception as e:
        eksik.append('%s (JSON bozuk: %s)' % (ad, str(e)[:60]))
        continue
    harita = {r['e']: r for r in cikti if isinstance(r, dict) and r.get('e')}
    for g in girdi:
        toplam += 1
        e = g['e']
        r = harita.get(e)
        if not r:
            hatalar.append('%s %s: kayıt yok' % (ad, e))
            continue
        c = str(r.get('c') or '')
        b = str(r.get('b') or '').strip()
        f = '' if r.get('f') is None else str(r.get('f'))
        tr = str(r.get('tr') or '')
        sorunlar = []
        if len(re.findall(r'----', c)) != 1:
            sorunlar.append('boşluk sayısı ≠ 1')
        if re.search(r'(?<!-)-{2,3}(?!-)|-{5,}', c):
            sorunlar.append('başka tire grubu')
        n = len(re.findall(r'\S+', c.replace('----', 'x')))
        if n < 15 or n > 36:
            sorunlar.append('uzunluk %d' % n)
        if f not in BICIMLER:
            sorunlar.append('f geçersiz: ' + f)
        elif not b:
            sorunlar.append('b boş')
        elif b.lower() != b:
            sorunlar.append('b büyük harf')
        elif not cekim.uyar_mi(e, f, b):
            # Kaynak biçimi zaten çekimliyse ("thanks for", "paid to") sözlük biçimi
            # türetilemez; parçalar aynı ve ilk kelime aynı kökten görünüyorsa kabul.
            eb, bb = re.split(r'[-\s]+', e), re.split(r'[-\s]+', b)
            if not (len(eb) == len(bb) and eb[1:] == bb[1:] and
                    eb[0][:3].lower() == bb[0][:3].lower() and f in ('past', 'pp', 's', 'ing')):
                sorunlar.append('çekim uyumsuz: %s+%s ≠ %s' % (e, f, b))
        # Öbeğin ilk kelimesi (fiil) cümlede tekrar etmemeli
        ilk = re.split(r'[-\s]+', e)[0]
        if len(ilk) > 2 and re.search(r'\b' + re.escape(ilk[:max(4, len(ilk) - 2)]) + r'\w*',
                                      c.replace('----', ' '), re.I):
            sorunlar.append('öbeğin fiili cümlede tekrar')
        # Edat boşluğun DIŞINA taşmış mı? "to/of/in" cümlede başka yerde doğal olarak
        # geçebilir; asıl hata boşluğun hemen bitişiğinde durmasıdır: "---- to".
        parcalar = re.split(r'[-\s]+', e)[1:]
        if parcalar:
            oncesi, _, sonrasi = c.partition('----')
            sonraki = (re.findall(r"[A-Za-z']+", sonrasi) or [''])[0].lower()
            onceki = (re.findall(r"[A-Za-z']+", oncesi) or [''])[-1].lower()
            if sonraki and sonraki == parcalar[-1].lower():
                sorunlar.append('edat "%s" boşluğun hemen sağında' % sonraki)
            elif onceki and onceki == re.split(r'[-\s]+', e)[0].lower():
                sorunlar.append('fiil boşluğun hemen solunda')
        for o in g.get('ornek') or []:
            if benzer(c.replace('----', b), o) > 0.6:
                sorunlar.append('kart örneğine benziyor')
                break
        if len(tr) < 20:
            sorunlar.append('çeviri yok/kısa')
        if re.search(r'[“”‘’—]', c):
            sorunlar.append('tipografik işaret')
        if sorunlar:
            hatalar.append('%s %s: %s' % (ad, e, '; '.join(sorunlar)))
            continue
        gecen += 1
        sonuc[e] = {'c': c, 'b': b, 'f': f, 'tr': tr}

print('toplam %d  geçen %d  hatalı %d  eksik paket %d' % (toplam, gecen, len(hatalar), len(eksik)))
for x in eksik:
    print('  EKSIK', x)
for h in hatalar:
    print('  HATA', h)
io.open(os.path.join(BURASI, 'obek-hatalar.txt'), 'w', encoding='utf-8').write('\n'.join(eksik + hatalar))


def js(v):
    return json.dumps(v, ensure_ascii=False)


if not YALNIZ_RAPOR and sonuc:
    satirlar = ['%s:{c:%s,b:%s,f:%s,tr:%s}' % (js(e), js(v['c']), js(v['b']), js(v['f']), js(v['tr']))
                for e, v in sorted(sonuc.items())]
    icerik = (
        '/* Öbekler — günün testi cümleleri · %d öbek\n'
        '   Deyimsel fiiller ve edat kalıpları için, karttaki örnekten bağımsız\n'
        '   YDS düzeyinde boşluk doldurma cümleleri.\n'
        '   Alanlar: c=boşluklu cümle, b=boşluğa gelen biçim, f=çekim türü, tr=Türkçesi.\n'
        '   Üretim: tools/test-uretim (agent yazımı + obek-test-dogrula.py). */\n\n'
        'window.TEST_OBEK = {\n' % len(satirlar)
    ) + ',\n'.join(satirlar) + '\n};\n'
    io.open(os.path.join(SITE, 'data', 'test-obek.js'), 'w', encoding='utf-8', newline='\n').write(icerik)
    print('yazıldı data/test-obek.js (%d)' % len(satirlar))
