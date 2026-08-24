# -*- coding: utf-8 -*-
"""
Calisma_Listesi_v4_site_tam.xlsx + Kelime_Obekleri_v3.xlsx  ->  site veri dosyalari

Uretilen dosyalar:
  data/kelime-dizin.js    tum kelimeler: yazilis, kisa anlam, puan, katman, tur
                          (her sayfada yuklenir; liste, arama ve Leitner ozeti bunu kullanir)
  data/kelime-k1..k7.js   katman katman tam kayitlar: anlamlar + ornek cumleler
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

# Yeni bir sarmalayici kurmak yerine kodlamayi yerinde degistir: sarmalayici,
# betik baska bir yerden ice aktarildiginda alttaki tamponu kapatiyor.
sys.stdout.reconfigure(encoding='utf-8')

import openpyxl

KAYNAK_DIZIN = r'C:\Users\Trk\Desktop\english claude\04_cikti'
SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VERI = os.path.join(SITE, 'data')

# Katman sinirlari: (anahtar, ad, alt puan, ust puan)
# 6. katman (Genis+) v4 listesiyle geldi: esik 15'ten 10'a indi (21.08.2026).
# 7. katman puana gore degil, kaynagina gore olusur: kelime ailelerini
# tamamlamak icin eklenen, puani 10'un altinda kalmis turevler.
KATMANLAR = [
    (1, 'Temel',        40, 1e9),
    (2, 'Çekirdek',     30, 40),
    (3, 'Orta',         25, 30),
    (4, 'İleri',        20, 25),
    (5, 'Geniş',        15, 20),
    (6, 'Geniş+',       10, 15),
    (7, 'Aile üyeleri', -1, 10),
]
AILE_KATMANI = 7

# v4_site_tam'da Tur sutunu "sıfat · temel" / "isim · çekim" etiketi tasir:
# temel = bilindigi varsayilan yaygin kelime, cekim = koke birlestirilmis bicim.
# Site icin ikisi de siradan kelimedir; etiket atilir.
TUR_ETIKETI = re.compile(r'\s*·\s*(temel|çekim)\s*$')

# Cloze sik numaralarindan sizan artiklar
ARTIKLAR = {'ii', 'iii', 'iv'}


def katman_bul(puan):
    for k, _ad, alt, ust in KATMANLAR:
        if alt <= puan < ust:
            return k
    return 6


# Anlam sutunundaki tur oneki: "i." "s." "s./z." "z./i./s." gibi bir veya daha
# cok kisaltmanin egik cizgiyle baglanmis hali.
TUR_ONEKI = re.compile(r'^\s*[ifsze]\.(?:/[ifsze]\.)*\s*')

# Bir anlam satirinda birden cok tur olabiliyor: "i. fotoğraf; f. fotoğrafını çekmek".
# Bunlari ayri anlamlara boleriz ki her turun kendi ornek cumlesi olabilsin.
# Yalniz ARDINDAN tur kisaltmasi gelen noktali virgulden boler; boylece
# "f. denemek; çabalamak; i. deneme" -> ["f. denemek; çabalamak", "i. deneme"]
ANLAM_BASI = re.compile(r'(^|;\s*)((?:[ifsze]\.(?:/[ifsze]\.)*)\s)')


def anlamlari_bol(tr):
    kesme = []
    for m in ANLAM_BASI.finditer(tr):
        kesme.append(m.start() + len(m.group(1)))
    if len(kesme) < 2:
        return [tr]
    parcalar = []
    for i, bas in enumerate(kesme):
        son = kesme[i + 1] if i + 1 < len(kesme) else len(tr)
        parcalar.append(tr[bas:son].rstrip('; ').strip())
    return parcalar


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
    _bas, satirlar = xlsx_oku('Calisma_Listesi_v4_site_tam.xlsx', 'Calisma_Listesi')
    kelimeler = {}
    for _sira, kelime, tur, puan, anlam, ornek, ceviri in satirlar:
        if not kelime or kelime.lower() in ARTIKLAR:
            continue
        kayit = kelimeler.setdefault(kelime, {
            'tip': TUR_ETIKETI.sub('', (tur or '').strip()),
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


def ek_ornekleri_oku():
    """tools/ek-ornekler.js — cok turlu kelimelerin ikinci/ucuncu ornekleri.

    Bicim:  window.EK_ORNEKLER = {
              "photograph": [
                {tr:"i. fotoğraf",            ex:"…", exTr:"…"},
                {tr:"f. fotoğrafını çekmek",  ex:"…", exTr:"…"}
              ], … };

    Bir kelime burada gecerse, listeden gelen tek anlamli kaydin YERINE
    bu anlamlar kullanilir. Boylece her turun kendi ornegi olur.
    """
    yol = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ek-ornekler.js')
    if not os.path.exists(yol):
        return {}
    metin = open(yol, encoding='utf-8').read()
    bas = metin.index('{', metin.index('EK_ORNEKLER'))
    govde = metin[bas:metin.rindex('}') + 1]
    # Dosyada bolum basliklari icin /* … */ yorumlari var; JSON bunlari kabul etmez.
    govde = re.sub(r'/\*.*?\*/', '', govde, flags=re.S)
    return json.loads(govde)


def kaliplari_oku():
    """tools/kaliplar.js — kelimelerin kullanim kaliplari {kelime: [{en, tr}]}.

    Kelimenin anlami degil, nasil kullanildigi: hangi edati alir, hangi
    sozcuklerle gelir. Katman dosyalarina 'kl' alani olarak yazilir."""
    yol = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'kaliplar.js')
    if not os.path.exists(yol):
        return {}
    metin = open(yol, encoding='utf-8').read()
    i = metin.find('window.KALIPLAR')
    if i == -1:
        return {}
    sonuc = {}
    for m in re.finditer(r'"([^"]+)":\s*\[(.*?)\]', metin[i:], re.S):
        kaliplar = [{'en': a, 'tr': b} for a, b in
                    re.findall(r'\{en:"(.*?)",tr:"(.*?)"\}', m.group(2))]
        if kaliplar:
            sonuc[m.group(1)] = kaliplar
    return sonuc


def elenecekleri_oku():
    """tools/kelime-eleme.js — listeye hic girmeyecek kelimeler.

    Korpus frekansindan sizan kaba/argo sozcukler ve ozel adlar. Dizin ve
    katman dosyalarina yazilmaz."""
    yol = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'kelime-eleme.js')
    if not os.path.exists(yol):
        return set()
    metin = open(yol, encoding='utf-8').read()
    i = metin.find('window.KELIME_ELEME')
    if i == -1:
        return set()
    return {m.group(1) for m in re.finditer(r'"([a-z\-\' ]+)"', metin[i:])}


def aile_uyelerini_oku():
    """tools/ek-aile-uyeleri.js — kelime ailelerini tamamlayan turevler.

    Bunlar Calisma_Listesi'nde yok cunku puanlari 15'in altinda kalmis
    (cogu 49 sinavin hicbirinde gecmemis). Ama aileyi eksik birakiyorlar:
    sufficient/sufficiently var, suffice/sufficiency yok. Zipf >= 2.5
    suzgecinden gecmis, yani gercekten kullanilan kelimeler.

    Bicim: {"suffice": {"tip":"fiil","p":7.4,"tr":"f. yeterli olmak",
                        "ex":"…","exTr":"…"}, …}
    """
    yol = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ek-aile-uyeleri.js')
    if not os.path.exists(yol):
        return {}
    metin = open(yol, encoding='utf-8').read()
    bas = metin.index('{', metin.index('EK_AILE_UYELERI'))
    govde = re.sub(r'/\*.*?\*/', '', metin[bas:metin.rindex('}') + 1], flags=re.S)
    return json.loads(govde)


def birlestir():
    kelimeler = kelimeleri_topla()
    site = site_kelimelerini_oku()
    ek = ek_ornekleri_oku()
    aile_uye = aile_uyelerini_oku()

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

    # Aile uyeleri: her zaman son katman
    aile_eklenen = 0
    for en, v in aile_uye.items():
        if en in kelimeler:
            continue                      # zaten listede, dokunma
        kelimeler[en] = {
            'tip': v['tip'],
            'puan': v.get('p'),
            'katman_zorla': AILE_KATMANI,
            'anlamlar': [{'tr': v['tr'], 'ex': v['ex'], 'exTr': v['exTr']}],
        }
        aile_eklenen += 1

    # Cok turlu anlamlari ayri ornekleriyle degistir
    ek_uygulanan = 0
    for en, anlamlar in ek.items():
        if en in kelimeler:
            kelimeler[en]['anlamlar'] = anlamlar
            ek_uygulanan += 1

    # Elenecekler: kaba/argo ve ozel adlar hic yazilmaz.
    elenen = 0
    for en in list(kelimeler.keys()):
        if en in elenecekleri_oku():
            del kelimeler[en]
            elenen += 1

    # Kullanim kaliplari
    kalip = kaliplari_oku()
    kalipli = 0
    for en, k in kelimeler.items():
        if en in kalip:
            k['kalip'] = kalip[en]
            kalipli += 1

    for en, k in kelimeler.items():
        k['katman'] = k.get('katman_zorla') or katman_bul(k['puan'])

    # Hala bolunmesi gereken (cok turlu ama tek ornekli) kayitlari say
    bekleyen = [en for en, k in kelimeler.items()
                if len(k['anlamlar']) == 1 and len(anlamlari_bol(k['anlamlar'][0]['tr'])) > 1]

    return kelimeler, ortak, yalniz_site, ek_uygulanan, bekleyen, aile_eklenen, elenen, kalipli


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
        '   Örnek cümleler katman dosyalarındadır (data/kelime-k1..k7.js).\n'
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
            if k.get('kalip'):
                ek += ',kl:[' + ','.join(
                    '{en:%s,tr:%s}' % (json.dumps(x['en'], ensure_ascii=False),
                                       json.dumps(x['tr'], ensure_ascii=False))
                    for x in k['kalip']) + ']'
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

def obek_turlerini_oku():
    """tools/obek-turleri.js — elle duzeltilmis tur etiketleri {obek: tur}.

    Kaynak xlsx'teki etiketler karisik: gercek phrasal verb'lerle duz fiil+edat
    birlesmeleri ayni torbada. Bu dosya siniflandirma sonucunu tasir ve
    kaynak etiketin uzerine yazar."""
    yol = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'obek-turleri.js')
    if not os.path.exists(yol):
        return {}
    metin = open(yol, encoding='utf-8').read()
    return {m.group(1): m.group(2)
            for m in re.finditer(r'"(.*?)"\s*:\s*"(.*?)"', metin)}


def ek_obekleri_oku():
    """tools/ek-obekler.js — kaynak listede olmayan, elle eklenen obekler."""
    yol = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ek-obekler.js')
    if not os.path.exists(yol):
        return []
    metin = open(yol, encoding='utf-8').read()
    desen = re.compile(
        r'\{f:"(.*?)",\s*t:"(.*?)",\s*tr:"(.*?)",\s*ex:"(.*?)",\s*exTr:"(.*?)"\}', re.S)
    return [{'f': m.group(1), 't': m.group(2), 'tr': m.group(3),
             'ex': m.group(4), 'exTr': m.group(5)} for m in desen.finditer(metin)]


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

    # Elle eklenen obekler (kaynak listede yok)
    ek_eklenen = 0
    for e in ek_obekleri_oku():
        if e['f'] in obekler:
            continue
        obekler[e['f']] = {
            'tip': e['t'], 'puan': None, 'sinav': 0, 'kaynak': 'ek',
            'anlamlar': [{'tr': e['tr'], 'ex': e['ex'], 'exTr': e['exTr']}],
        }
        ek_eklenen += 1

    # Elle duzeltilmis tur etiketleri kaynagin uzerine yazar; "siradan" atilir.
    turler = obek_turlerini_oku()
    atilan = 0
    for ad in list(obekler.keys()):
        yeni = turler.get(ad)
        if not yeni:
            continue
        if yeni == 'sıradan':
            del obekler[ad]
            atilan += 1
        else:
            obekler[ad]['tip'] = yeni

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
    return sirali, os.path.getsize(yol), ek_eklenen, atilan


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
    kelimeler, ortak, yalniz_site, ek_uygulanan, bekleyen, aile_eklenen, elenen, kalipli = birlestir()
    sirali, ozet = kelimeleri_yaz(kelimeler)
    obekler, obek_boyut, obek_ek, obek_atilan = obekleri_yaz()
    sayilari_yaz(sirali, ozet, obekler)

    print('KELIMELER')
    print('  toplam            :', len(sirali))
    print('  listeden           :', len(sirali) - yalniz_site)
    print('  yalniz sitede olan :', yalniz_site, '(puansiz, seviyesine gore katmanlandi)')
    print('  es anlamli tasinan :', ortak)
    print('  cok anlamli        :', sum(1 for _e, k in sirali if len(k['anlamlar']) > 1))
    print('  ek ornek uygulanan :', ek_uygulanan)
    print('  ornegi eksik kalan :', len(bekleyen), '(cok turlu ama tek ornekli)')
    print('  aile uyesi eklenen :', aile_eklenen, '(%d. katman)' % AILE_KATMANI)
    print('  elenen (kaba/ozel) :', elenen)
    print('  kalibi olan        :', kalipli)
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
    print('  elle eklenen      :', obek_ek)
    print('  siradan diye atilan:', obek_atilan)
    import collections as _c
    for tur, n in _c.Counter(o['tip'] for _f, o in obekler).most_common():
        print('    %-16s %5d' % (tur, n))
    print('  dosya             : %.0f KB' % (obek_boyut / 1024))


if __name__ == '__main__':
    main()
