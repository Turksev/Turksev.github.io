# -*- coding: utf-8 -*-
"""
Konu haritalari ve konu anlatimlari  ->  data/konular.js + data/konu-metinleri.js

Kaynak: C:\\Users\\Trk\\Desktop\\English konu - chatgpt
  A_Turkce_Eksenli_...md      61 unitelik Turkce eksenli harita
  B_Ingilizce_Eksenli_...md   68 unitelik Ingilizce eksenli omurga
  Türkçe Eksenli\\*.docx       yazilmis konu anlatimlari (su an 6 tane)

Haritalar .md'den okunur (.xlsx ile ayni tabloyu tasiyor; xlsx'te ek olarak
bos takip sutunlari var — Durum / Tani % / Gecikmeli % — onlari site kendi
tutuyor, dosyadan almiyoruz).

Konu anlatimlari docx'ten cikarilip HTML'e cevrilir; hepsi ayni 9 bolumlu
iskelette oldugu icin tek bir donusturucu yetiyor.

Kullanim:
  "C:/Users/Trk/Desktop/english claude/.venv/Scripts/python.exe" tools/konu-aktar.py
Kaynak klasore YAZILMAZ.
"""
import html
import json
import os
import re
import subprocess
import sys

sys.stdout.reconfigure(encoding='utf-8')

KAYNAK = r'C:\Users\Trk\Desktop\English konu - chatgpt'
SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VERI = os.path.join(SITE, 'data')

EKSENLER = [
    ('tr', 'Türkçe eksenli', 'A_Turkce_Eksenli_YDS_Konu_Haritasi_Gelistirilmis.md',
     'Türkçe–İngilizce çarpışma noktalarından başlar: Türkçedeki bir yapının '
     'İngilizcede nereye dağıldığını gösterir.'),
    ('en', 'İngilizce eksenli', 'B_Ingilizce_Eksenli_YDS_Konu_Omurgasi_Gelistirilmis.md',
     'Standart İngilizce yapılarından başlar: cümle çözümlemeden kipliğe '
     'doğru ilerleyen klasik omurga.'),
]

METIN_KLASORU = os.path.join(KAYNAK, 'Türkçe Eksenli')


# ---------------------------------------------------------------- harita

def haritayi_oku(dosya):
    metin = open(os.path.join(KAYNAK, dosya), encoding='utf-8').read()
    uniteler = []
    for satir in metin.splitlines():
        if not satir.startswith('| ') or satir.startswith('|---'):
            continue
        hucre = [h.strip() for h in satir.strip('|').split('|')]
        if len(hucre) < 10 or hucre[0] in ('Kod',):
            continue
        if not re.fullmatch(r'[TE]\d+', hucre[0]):
            continue
        uniteler.append({
            'k': hucre[0],
            'ad': hucre[1],
            'kapsam': hucre[2],
            'kat': hucre[3],
            'katman': hucre[4],
            'etki': hucre[5],
            'soru': hucre[6],
            'risk': hucre[7],
            'zor': hucre[8],
            'on': hucre[9],
        })
    return uniteler


# ---------------------------------------------------------------- konu metni

def docx_metni(yol):
    arac = os.path.join(SITE, 'tools', 'docx-aktar.js')
    return subprocess.run(['node', arac, yol], capture_output=True,
                          encoding='utf-8', check=True).stdout


def k(s):
    return html.escape(s or '', quote=False)


def metni_html_yap(ham):
    """docx-aktar çıktısını (# başlık, - madde, [TABLO]) HTML'e çevirir."""
    satirlar = ham.splitlines()
    cikti = []
    i = 0
    baslik_sayaci = 0
    madde_acik = False

    def madde_kapat():
        nonlocal madde_acik
        if madde_acik:
            cikti.append('</ul>')
            madde_acik = False

    while i < len(satirlar):
        s = satirlar[i].rstrip()

        if not s.strip():
            i += 1
            continue

        if s == '[TABLO]':
            madde_kapat()
            satir_listesi = []
            i += 1
            while i < len(satirlar) and satirlar[i] != '[/TABLO]':
                hucre = [h.strip() for h in satirlar[i].strip().strip('|').split('|')]
                satir_listesi.append([h for h in hucre])
                i += 1
            i += 1

            # Tek hücreli tablo = vurgu kutusu (Ana fikir, Not gibi)
            if len(satir_listesi) == 1 and len(satir_listesi[0]) == 1:
                cikti.append('<div class="tip">' + k(satir_listesi[0][0]) + '</div>')
                continue

            gov = ['<table class="rule-table">']
            for j, r in enumerate(satir_listesi):
                etiket = 'th' if j == 0 else 'td'
                gov.append('<tr>' + ''.join(
                    '<%s>%s</%s>' % (etiket, k(c), etiket) for c in r) + '</tr>')
            gov.append('</table>')
            cikti.append(''.join(gov))
            continue

        if s.startswith('## '):
            madde_kapat()
            cikti.append('<h3>' + k(s[3:]) + '</h3>')
            i += 1
            continue

        if s.startswith('# '):
            madde_kapat()
            baslik_sayaci += 1
            # İlk iki başlık konu adı ve alt başlığı; sayfa üstünde ayrıca yazılıyor
            if baslik_sayaci <= 2:
                i += 1
                continue
            cikti.append('<h2>' + k(s[2:]) + '</h2>')
            i += 1
            continue

        if s.startswith('- '):
            if not madde_acik:
                cikti.append('<ul>')
                madde_acik = True
            cikti.append('<li>' + k(s[2:]) + '</li>')
            i += 1
            continue

        madde_kapat()
        cikti.append('<p>' + k(s) + '</p>')
        i += 1

    madde_kapat()
    return '\n'.join(cikti)


def konu_metinlerini_oku():
    if not os.path.isdir(METIN_KLASORU):
        return {}
    metinler = {}
    for ad in sorted(os.listdir(METIN_KLASORU)):
        if not ad.lower().endswith('.docx') or ad.startswith('~$'):
            continue
        kod = ad.split('_')[0]
        if not re.fullmatch(r'[TE]\d+', kod):
            continue
        ham = docx_metni(os.path.join(METIN_KLASORU, ad))
        basliklar = [x[2:] for x in ham.splitlines() if x.startswith('# ')]
        metinler[kod] = {
            'baslik': basliklar[0] if basliklar else kod,
            'ozet': basliklar[1] if len(basliklar) > 1 else '',
            'html': metni_html_yap(ham),
            'kelime': len(ham.split()),
        }
    return metinler


# ---------------------------------------------------------------- yazim

def yaz(yol, icerik):
    with open(yol, 'w', encoding='utf-8', newline='\n') as f:
        f.write(icerik)


def main():
    eksenler = []
    for anahtar, ad, dosya, aciklama in EKSENLER:
        uniteler = haritayi_oku(dosya)
        eksenler.append({'e': anahtar, 'ad': ad, 'aciklama': aciklama, 'u': uniteler})
        print('%-16s %3d ünite' % (ad, len(uniteler)))

    metinler = konu_metinlerini_oku()
    print('Yazılmış konu   : %d (%s)' % (len(metinler), ', '.join(sorted(metinler))))

    govde = ',\n'.join(
        '{e:%s,ad:%s,aciklama:%s,u:[\n%s\n]}' % (
            json.dumps(x['e'], ensure_ascii=False),
            json.dumps(x['ad'], ensure_ascii=False),
            json.dumps(x['aciklama'], ensure_ascii=False),
            ',\n'.join(json.dumps(u, ensure_ascii=False) for u in x['u']))
        for x in eksenler)

    basli = (
        '/* ============================================================\n'
        '   YDS konu haritaları — %d ünite (%s)\n'
        '   Alanlar: k=kod, ad, kapsam, kat=kategori, katman, etki=YDS etkisi,\n'
        '            soru=başlıca soru türleri, risk=TR-hata riski, zor=zorluk,\n'
        '            on=ön koşullar\n'
        '   Konu anlatımları data/konu-metinleri.js içinde; ilerleme takibi\n'
        '   tarayıcıda (localStorage) tutulur, bu dosyada değil.\n'
        '   tools/konu-aktar.py ile üretilir; elle düzenleme.\n'
        '   ============================================================ */\n\n'
        'window.KONULAR = [\n' % (
            sum(len(x['u']) for x in eksenler),
            ' + '.join('%s %d' % (x['ad'], len(x['u'])) for x in eksenler))
    )
    yol = os.path.join(VERI, 'konular.js')
    yaz(yol, basli + govde + '\n];\n')
    print('konular.js      : %.0f KB' % (os.path.getsize(yol) / 1024))

    mgovde = ',\n'.join(
        '%s:%s' % (json.dumps(kod), json.dumps(v, ensure_ascii=False))
        for kod, v in sorted(metinler.items()))
    mbasli = (
        '/* Konu anlatımları — %d konu, docx kaynaklarından üretildi.\n'
        '   Alanlar: baslik, ozet, html (bölümler), kelime\n'
        '   tools/konu-aktar.py üretir; elle düzenleme. */\n\n'
        'window.KONU_METINLERI = {\n' % len(metinler)
    )
    myol = os.path.join(VERI, 'konu-metinleri.js')
    yaz(myol, mbasli + mgovde + '\n};\n')
    print('konu-metinleri  : %.0f KB' % (os.path.getsize(myol) / 1024))


if __name__ == '__main__':
    main()
