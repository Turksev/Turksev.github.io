# -*- coding: utf-8 -*-
# KALICI KOPYA (5 Eylul 2026): ozgun betik 03_calisma_listesi/06_sandbox_2026-09/ altinda;
# girdi/cikti klasorleri orada oldugu icin SP/BURASI o klasore sabitlendi.
"""Uretilen gunun-testi cumlelerini dogrula.py'nin girdi/cikti bicimine cevirir.

Ajanlar "f" alanina serbest etiket ("yalin"/"cekimli"/"turemis") yazdi; oysa
dogrula.py yalnizca ['', 's', 'past', 'pp', 'ing', 'pl'] kodlarini kabul edip
cekim.uyar_mi ile dogruluyor. Dogru kodu, reponun kendi cekim modulunu
kullanarak b (bosluga gelen bicim) uzerinden turetiyoruz; boylece uretilen
paket dogrulayiciyla birebir tutarli olur.
"""
import io
import json
import os
import re
import sys

BURASI = "C:/Users/Trk/Desktop/YDS/03_calisma_listesi/06_sandbox_2026-09"
SITE = r"C:\Users\Trk\Desktop\YDS\04_Github"
URETIM = os.path.join(SITE, 'tools', 'test-uretim')
sys.path.insert(0, URETIM)
import cekim  # noqa: E402

sys.stdout.reconfigure(encoding='utf-8')

KAYNAK = os.path.join(BURASI, 'gunun_testi')
BICIMLER = ['', 's', 'past', 'pp', 'ing', 'pl']
YAZ = '--yaz' in sys.argv

# kelime turu (dizin) — tur-bicim celiskisini onceden elemek icin
dizin = {}
_src = io.open(os.path.join(SITE, 'data', 'kelime-dizin.js'), encoding='utf-8').read()
for m in re.finditer(r'\{e:"(.*?)",t:"(.*?)"(?:,p:([\d.]+))?,k:(\d),y:"(.*?)"\}', _src):
    dizin[m.group(1)] = {'k': int(m.group(4)), 'y': m.group(5)}


def sozluk_bicimi(e):
    return re.sub(r'\s+/[^/]+/$', '', e).strip()


def es_varyanti(a, b):
    """flamingos / flamingoes gibi yalnizca -s / -es farki olan cogul bicimler."""
    if a == b:
        return True
    if a.endswith('es') and b.endswith('s') and a[:-2] == b[:-1]:
        return True
    if b.endswith('es') and a.endswith('s') and b[:-2] == a[:-1]:
        return True
    return False


def bicim_sec(e, b):
    """(kod, b) dondurur. b'yi e'den uretebilen gecerli kodu bulur; tur
    celiskisi olmayani yegler. Ajan cekimi motordan farkli yazmissa (flamingos
    yerine motor flamingoes uretir) motorun bicimini esas alir — celdiriciler
    de ayni motorla uretildigi icin tutarlilik sart."""
    ad = sozluk_bicimi(e)
    d = dizin.get(e)

    def tur_uyumlu(f):
        if not f or not d:
            return True
        return ('isim' in d['y']) if f == 'pl' else ('fiil' in d['y'])

    uyanlar = [f for f in BICIMLER if cekim.uyar_mi(ad, f, b)]
    if uyanlar:
        temiz = [f for f in uyanlar if tur_uyumlu(f)]
        return (temiz or uyanlar)[0], b

    # Motorun urettigi bicime dus: adaylari topla, tur uyumlusunu yegle.
    adaylar = []
    for f in BICIMLER:
        uret = cekim.cek(ad, f)
        if uret and es_varyanti(uret, b) and cekim.uyar_mi(ad, f, uret):
            adaylar.append((f, uret))
    if adaylar:
        temiz = [x for x in adaylar if tur_uyumlu(x[0])]
        return (temiz or adaylar)[0]
    return None, b


# TEST_MODAL havuzu: dilbilgisi kaliplari ("be able to", "would have + V3")
# zaten orada, kendi mantigiyla (b == sozluk bicimi) yazilmis. test_parcala.py
# yalniz test-k1..k7'ye baktigi icin bunlari eksik saymisti; disliyoruz.
_modal = io.open(os.path.join(SITE, 'data', 'test-modal.js'), encoding='utf-8').read()
MODAL = set(re.findall(r'^"((?:[^"]|\\")+)":\{c:', _modal, re.M))
print('TEST_MODAL kaydi: %d' % len(MODAL))

girdiler = sorted(os.listdir(os.path.join(KAYNAK, 'girdi')))
paketler, sorunlu, atlanan = [], [], []
toplam = 0

for ad in girdiler:
    g = json.load(io.open(os.path.join(KAYNAK, 'girdi', ad), encoding='utf-8'))
    yol = os.path.join(KAYNAK, 'cikti', ad)
    if not os.path.exists(yol):
        sorunlu.append('%s: cikti yok' % ad)
        continue
    c = json.loads(io.open(yol, encoding='utf-8-sig').read())
    harita = {r['e']: r for r in c.get('kayitlar', []) if r.get('e')}

    yeni_girdi, yeni_cikti = [], []
    for oge in g['ogeler']:
        e = oge['kelime']
        if e in MODAL:
            atlanan.append(e)
            continue
        toplam += 1
        yeni_girdi.append({'e': e, 'ornek': [oge['kart_ornegi']] if oge.get('kart_ornegi') else []})
        r = harita.get(e)
        if not r:
            sorunlu.append('%s %s: kayit yok' % (ad, e))
            continue
        b = str(r.get('b') or '').strip().lower()
        f, b = bicim_sec(e, b)
        if f is None:
            sorunlu.append('%s %s: b=%r hicbir bicimden uretilemiyor' % (ad, e, b))
            f = ''
        yeni_cikti.append({'e': e, 'c': r.get('c', ''), 'b': b, 'f': f, 'tr': r.get('tr', '')})

    paketler.append((ad, yeni_girdi, yeni_cikti))

print('toplam oge: %d' % toplam)
print('paket: %d' % len(paketler))
print('TEST_MODAL zaten iceriyor, atlanan: %d' % len(atlanan))
print('sorunlu: %d' % len(sorunlu))
for s in sorunlu[:25]:
    print('  ', s)

if not YAZ:
    print('\n(dry-run — yazmak icin --yaz)')
    raise SystemExit(0)

for ad, gi, ci in paketler:
    hedef = 'gt-' + ad.replace('G_', '').replace('.json', '') + '.json'
    for klasor, veri in (('girdi', gi), ('cikti', ci)):
        with io.open(os.path.join(URETIM, klasor, hedef), 'w', encoding='utf-8', newline='\n') as fh:
            json.dump(veri, fh, ensure_ascii=False, indent=1)
            fh.write('\n')
print('\n%d paket cifti yazildi (gt-*.json)' % len(paketler))
