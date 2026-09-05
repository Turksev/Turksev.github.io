# -*- coding: utf-8 -*-
"""Service worker sürümü ve içerik özeti — her yayından önce çalıştır.

    python tools/sw-surum.py            özet eskiyse SURUM'u artırır, sw.js'i yazar
    python tools/sw-surum.py --kontrol  yalnız denetler; eskiyse çıkış kodu 1

Neden: sw.js JS/veri dosyalarını önbellek-öncelikli sunar. SURUM artmazsa
kullanıcı her yayından sonraki ilk ziyarette yeni HTML + eski JS/veri görür
(5 Eylül 2026'da yaşandı: kart modu düğmeleri göründü ama çalışmadı). Sürümü
insan hafızasına bırakmak yerine yayımlanan dosyaların özetini sw.js'e yazıyoruz;
tools/test-uretim/sw-surum-test.js aynı özeti hesaplayıp karşılaştırıyor, dosya
değişip sürüm artmamışsa CI kırmızıya döner.

Özet: yayımlanan metin dosyalarının (kök *.html, manifest.webmanifest, assets/,
data/, konu/ altındaki .html .js .css .json .webmanifest .svg .txt .xml) CRLF→LF
normalize edilmiş baytları üzerinden FNV-1a 32 bit; dosya başına özetler yol
sırasıyla birleştirilip yeniden özetlenir. Node testinin birebir aynısı.
"""
import io
import os
import re
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SW = os.path.join(KOK, 'sw.js')
UZANTILAR = {'.html', '.js', '.css', '.json', '.webmanifest', '.svg', '.txt', '.xml'}
KLASORLER = ('assets', 'data', 'konu')
DISLA = {'.git', '.github', 'tools', 'tmp', 'node_modules'}


def fnv1a(veri):
    h = 0x811C9DC5
    for b in veri:
        h ^= b
        h = (h * 0x01000193) & 0xFFFFFFFF
    return h


def yayimlanan_dosyalar():
    yollar = []
    for ad in os.listdir(KOK):
        tam = os.path.join(KOK, ad)
        if os.path.isfile(tam) and ad != 'sw.js' and (ad.endswith('.html') or ad == 'manifest.webmanifest'):
            yollar.append(ad)
    for klasor in KLASORLER:
        for dizin, altlar, dosyalar in os.walk(os.path.join(KOK, klasor)):
            altlar[:] = sorted(a for a in altlar if a not in DISLA)
            for d in dosyalar:
                if os.path.splitext(d)[1] in UZANTILAR:
                    yollar.append(os.path.relpath(os.path.join(dizin, d), KOK).replace(os.sep, '/'))
    return sorted(yollar)


def icerik_ozeti():
    parcalar = []
    bom = []
    for yol in yayimlanan_dosyalar():
        with open(os.path.join(KOK, yol), 'rb') as f:
            veri = f.read().replace(b'\r\n', b'\n')
        if veri.startswith(b'\xef\xbb\xbf'):
            bom.append(yol)
        parcalar.append('%s\n%08x\n' % (yol, fnv1a(veri)))
    return '%08x' % fnv1a(''.join(parcalar).encode('utf-8')), len(parcalar), bom


def main():
    kontrol = '--kontrol' in sys.argv
    metin = io.open(SW, encoding='utf-8').read()
    m_surum = re.search(r"var SURUM = 'yds-v(\d+)';", metin)
    m_ozet = re.search(r"var ICERIK_OZETI = '([0-9a-f]{8})';", metin)
    if not m_surum or not m_ozet:
        print('sw.js içinde SURUM / ICERIK_OZETI satırı bulunamadı')
        return 2
    ozet, n, bom = icerik_ozeti()
    if bom:
        print('UYARI — BOM ile başlayan dosyalar (Node ve tarayıcı kabuğu farklı özetleyebilir):')
        for b in bom:
            print('   ', b)
    eski_surum = int(m_surum.group(1))
    if ozet == m_ozet.group(1):
        print('güncel: yds-v%d, özet %s (%d dosya)' % (eski_surum, ozet, n))
        return 0
    if kontrol:
        print('ESKİ: sw.js özeti %s, içerik %s (%d dosya) — python tools/sw-surum.py çalıştır'
              % (m_ozet.group(1), ozet, n))
        return 1
    yeni_surum = eski_surum + 1
    metin = metin.replace(m_surum.group(0), "var SURUM = 'yds-v%d';" % yeni_surum)
    metin = metin.replace(m_ozet.group(0), "var ICERIK_OZETI = '%s';" % ozet)
    with io.open(SW, 'w', encoding='utf-8', newline='\n') as f:
        f.write(metin)
    print('yds-v%d -> yds-v%d, özet %s -> %s (%d dosya)' % (eski_surum, yeni_surum, m_ozet.group(1), ozet, n))
    return 0


if __name__ == '__main__':
    sys.exit(main())
