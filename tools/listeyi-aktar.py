# -*- coding: utf-8 -*-
"""
Calisma_Listesi_v3.xlsx + Kelime_Obekleri_v3.xlsx  ->  site veri dosyalari

Uretilen dosyalar:
  data/kelime-dizin.js    tum kelimeler: yazilis, kisa anlam, puan, katman, tur
                          (her sayfada yuklenir; liste, arama ve Leitner ozeti bunu kullanir)
  data/kelime-k1..k5.js   katman katman tam kayitlar: anlamlar + ornek cumleler
                          (yalniz gerekince yuklenir)
  data/obekler.js         kelime obekleri, ayri deste

Kullanim (kaynak projenin sanal ortamiyla):
  "C:\\Users\\Trk\\Desktop\\english claude\\.venv\\Scripts\\python.exe" tools/listeyi-aktar.py

Kaynak dosyalara YAZILMAZ, yalniz okunur.
"""
import io
import json
import os
import re
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import openpyxl

KAYNAK_DIZIN = r'C:\Users\Trk\Desktop\english claude\04_cikti'
SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VERI = os.path.join(SITE, 'data')

# Katman sinirlari: (anahtar, ad, alt puan, ust puan)
KATMANLAR = [
    (1, 'Temel',    40, 1e9),
    (2, 'Çekirdek', 30, 40),
    (3, 'Orta',     25, 30),
    (4, 'İleri',    20, 25),
    (5, 'Geniş',    15, 20),
]

# Cloze sik numaralarindan sizan artiklar
ARTIKLAR = {'ii', 'iii', 'iv'}


def katman_bul(puan):
    for k, _ad, alt, ust in KATMANLAR:
        if alt <= puan < ust:
            return k
    return 5


# Anlam sutunundaki tur oneki: "i." "s." "s./z." "z./i./s." gibi bir veya daha
# cok kisaltmanin egik cizgiyle baglanmis hali.
TUR_ONEKI = re.compile(r'^\s*[ifsze]\.(?:/[ifsze]\.)*\s*')


def kisa_anlam(anlamlar, sinir=60):
    """Dizin icin kisa ozet: tur onekleri atilir, anlamlar birlestirilir."""
    parcalar = []
    for a in anlamlar:
        m = TUR_ONEKI.sub('', a['tr'] or '').strip()
        if m:
            parcalar.append(m)
    metin = '; '.join(parcalar)
    if len(metin) > sinir:
        metin = metin[:sinir - 1].rsplit(' ', 1)[0] + '…'
    return metin


def xlsx_oku(dosya, sayfa):
    wb = openpyxl.load_workbook(os.path.join(KAYNAK_DIZIN, dosya), read_only=True)
    satirlar = list(wb[sayfa].iter_rows(values_only=True))
    wb.close()
    return satirlar[0], satirlar[1:]


# ---------------------------------------------------------------- kelimeler

def kelimeleri_topla():
    _bas, satirlar = xlsx_oku('Calisma_Listesi_v3.xlsx', 'Calisma_Listesi')
    kelimeler = {}
    for _sira, kelime, tur, puan, anlam, ornek, ceviri in satirlar:
        if not kelime or kelime.lower() in ARTIKLAR:
            continue
        kayit = kelimeler.setdefault(kelime, {
            'tip': (tur or '').strip(),
            'puan': round(float(puan), 1),
            'anlamlar': [],
        })
        kayit['anlamlar'].append({
            'tr': (anlam or '').strip(),
            'ex': (ornek or '').strip(),
            'exTr': (ceviri or '').strip(),
        })
    return kelimeler


def site_kelimelerini_oku():
    """tools/ek-kelimeler.js — es anlamlilari ve listede olmayan kelimeleri korumak icin."""
    yol = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ek-kelimeler.js')
    if not os.path.exists(yol):
        return {}
    metin = open(yol, encoding='utf-8').read()
    kayitlar = {}
    desen = re.compile(
        r'\{en:"(.*?)",\s*tr:"(.*?)",\s*tip:"(.*?)",\s*sv:"(.*?)",\s*'
        r'ex:"(.*?)",\s*exTr:"(.*?)",\s*es:"(.*?)"\}', re.S)
    for en, tr, tip, sv, ex, exTr, es in desen.findall(metin):
        kayitlar[en] = {'tr': tr, 'tip': tip, 'sv': sv, 'ex': ex, 'exTr': exTr, 'es': es}
    return kayitlar


def birlestir():
    kelimeler = kelimeleri_topla()
    site = site_kelimelerini_oku()

    ortak, yalniz_site = 0, 0
    # Sitedeki es anlamli bilgisini tasi
    for en, s in site.items():
        if en in kelimeler:
            kelimeler[en]['es'] = s['es']
            ortak += 1
        else:
            # Listede olmayan site kelimesi: seviyesine gore katman ver, puani yok
            katman = {'temel': 2, 'orta': 3, 'ileri': 4}.get(s['sv'], 3)
            kelimeler[en] = {
                'tip': s['tip'],
                'puan': None,
                'katman_zorla': katman,
                'es': s['es'],
                'anlamlar': [{'tr': s['tr'], 'ex': s['ex'], 'exTr': s['exTr']}],
            }
            yalniz_site += 1

    for en, k in kelimeler.items():
        k['katman'] = k.get('katman_zorla') or katman_bul(k['puan'])

    return kelimeler, ortak, yalniz_site


def kelimeleri_yaz(kelimeler):
    sirali = sorted(kelimeler.items(),
                    key=lambda x: (-(x[1]['puan'] if x[1]['puan'] is not None else -1), x[0]))

    # --- dizin ---
    satirlar = []
    for en, k in sirali:
        alanlar = [
            'e:' + json.dumps(en, ensure_ascii=False),
            't:' + json.dumps(kisa_anlam(k['anlamlar']), ensure_ascii=False),
            'k:%d' % k['katman'],
            'y:' + json.dumps(k['tip'], ensure_ascii=False),
        ]
        if k['puan'] is not None:
            alanlar.insert(2, 'p:%s' % k['puan'])
        satirlar.append('{' + ','.join(alanlar) + '}')

    basli = (
        '/* ============================================================\n'
        '   Kelime dizini — %d kelime\n'
        '   Her sayfada yüklenir; liste, arama ve tekrar özeti bunu kullanır.\n'
        '   Alanlar: e=kelime, t=kısa anlam, p=YDS öncelik puanı, k=katman, y=tür\n'
        '   Örnek cümleler katman dosyalarındadır (data/kelime-k1..k5.js).\n'
        '   Bu dosya tools/listeyi-aktar.py ile üretilir; elle düzenleme.\n'
        '   ============================================================ */\n\n'
        'window.KELIME_DIZIN = [\n' % len(sirali)
    )
    yaz(os.path.join(VERI, 'kelime-dizin.js'), basli + ',\n'.join(satirlar) + '\n];\n')

    # --- katman dosyalari ---
    ozet = []
    for kno, ad, _alt, _ust in KATMANLAR:
        grup = [(en, k) for en, k in sirali if k['katman'] == kno]
        govde = []
        for en, k in grup:
            anlamlar = ','.join(
                '{tr:%s,ex:%s,exTr:%s}' % (
                    json.dumps(a['tr'], ensure_ascii=False),
                    json.dumps(a['ex'], ensure_ascii=False),
                    json.dumps(a['exTr'], ensure_ascii=False))
                for a in k['anlamlar'])
            ek = (',es:' + json.dumps(k['es'], ensure_ascii=False)) if k.get('es') else ''
            govde.append('%s:{a:[%s]%s}' % (json.dumps(en, ensure_ascii=False), anlamlar, ek))

        basli = (
            '/* %d. katman — %s · %d kelime\n'
            '   Tam kayıtlar: anlamlar ve örnek cümleler. Gerektiğinde yüklenir.\n'
            '   tools/listeyi-aktar.py ile üretilir. */\n\n'
            'window.KELIME_K%d = {\n' % (kno, ad, len(grup), kno)
        )
        yol = os.path.join(VERI, 'kelime-k%d.js' % kno)
        yaz(yol, basli + ',\n'.join(govde) + '\n};\n')
        ozet.append((kno, ad, len(grup), os.path.getsize(yol)))
    return sirali, ozet


# ---------------------------------------------------------------- obekler

def obekleri_yaz():
    obekler = {}

    _b, sozluk = xlsx_oku('Kelime_Obekleri_v3.xlsx', 'Sozluk_Obekleri')
    for _s, obek, tur, puan, sinav, anlam, ornek, ceviri in sozluk:
        if not obek:
            continue
        k = obekler.setdefault(obek.strip(), {
            'tip': (tur or '').strip(),
            'puan': round(float(puan), 1) if puan else None,
            'sinav': int(sinav) if sinav else 0,
            'kaynak': 'sözlük',
            'anlamlar': [],
        })
        k['anlamlar'].append({'tr': (anlam or '').strip(),
                              'ex': (ornek or '').strip(),
                              'exTr': (ceviri or '').strip()})

    _b, korpus = xlsx_oku('Kelime_Obekleri_v3.xlsx', 'Korpus_Obekleri')
    for _s, obek, bicim, tur, sinav, anlam, ornek, ceviri in korpus:
        if not obek:
            continue
        ad = (bicim or obek).strip()          # sınavdaki gerçek biçim daha öğretici
        k = obekler.setdefault(ad, {
            'tip': (tur or '').strip(),
            'puan': None,
            'sinav': int(sinav) if sinav else 0,
            'kaynak': 'korpus',
            'anlamlar': [],
        })
        k['anlamlar'].append({'tr': (anlam or '').strip(),
                              'ex': (ornek or '').strip(),
                              'exTr': (ceviri or '').strip()})

    sirali = sorted(obekler.items(), key=lambda x: (-x[1]['sinav'], x[0]))
    govde = []
    for ad, o in sirali:
        anlamlar = ','.join(
            '{tr:%s,ex:%s,exTr:%s}' % (
                json.dumps(a['tr'], ensure_ascii=False),
                json.dumps(a['ex'], ensure_ascii=False),
                json.dumps(a['exTr'], ensure_ascii=False))
            for a in o['anlamlar'])
        govde.append('{f:%s,y:%s,s:%d,kn:%s,a:[%s]}' % (
            json.dumps(ad, ensure_ascii=False),
            json.dumps(o['tip'], ensure_ascii=False),
            o['sinav'],
            json.dumps(o['kaynak'], ensure_ascii=False),
            anlamlar))

    basli = (
        '/* ============================================================\n'
        '   Kelime öbekleri — %d öbek\n'
        '   Alanlar: f=öbek, y=tür, s=kaç sınavda geçti, kn=kaynak,\n'
        '            a=anlamlar [{tr, ex, exTr}]\n'
        '   Kaç sınavda geçtiğine göre sıralı. tools/listeyi-aktar.py üretir.\n'
        '   ============================================================ */\n\n'
        'window.OBEKLER = [\n' % len(sirali)
    )
    yol = os.path.join(VERI, 'obekler.js')
    yaz(yol, basli + ',\n'.join(govde) + '\n];\n')
    return sirali, os.path.getsize(yol)


def yaz(yol, icerik):
    with open(yol, 'w', encoding='utf-8', newline='\n') as f:
        f.write(icerik)


# ---------------------------------------------------------------- main

def sayilari_yaz(sirali, ozet, obekler):
    """Sayfalarin basliklarda kullandigi sayilar; elle guncellenmesin diye uretilir."""
    katman = {str(k): n for k, _ad, n, _b in ozet}
    icerik = (
        '/* Icerik sayaclari — tools/listeyi-aktar.py uretir, elle duzenleme. */\n'
        'window.SAYILAR = %s;\n' % json.dumps(
            {'kelime': len(sirali), 'obek': len(obekler), 'katman': katman},
            ensure_ascii=False, sort_keys=True)
    )
    yaz(os.path.join(VERI, 'sayilar.js'), icerik)


def main():
    kelimeler, ortak, yalniz_site = birlestir()
    sirali, ozet = kelimeleri_yaz(kelimeler)
    obekler, obek_boyut = obekleri_yaz()
    sayilari_yaz(sirali, ozet, obekler)

    print('KELIMELER')
    print('  toplam            :', len(sirali))
    print('  listeden           :', len(sirali) - yalniz_site)
    print('  yalniz sitede olan :', yalniz_site, '(puansiz, seviyesine gore katmanlandi)')
    print('  es anlamli tasinan :', ortak)
    print('  cok anlamli        :', sum(1 for _e, k in sirali if len(k['anlamlar']) > 1))
    print()
    print('  katman              kelime      dosya')
    for kno, ad, n, boyut in ozet:
        print('  %d. %-14s %6d   %6.0f KB' % (kno, ad, n, boyut / 1024))
    dizin = os.path.getsize(os.path.join(VERI, 'kelime-dizin.js'))
    print('  %-17s %6s   %6.0f KB' % ('dizin', '', dizin / 1024))
    print()
    print('OBEKLER')
    print('  toplam            :', len(obekler))
    print('  cok anlamli       :', sum(1 for _f, o in obekler if len(o['anlamlar']) > 1))
    print('  dosya             : %.0f KB' % (obek_boyut / 1024))


if __name__ == '__main__':
    main()
