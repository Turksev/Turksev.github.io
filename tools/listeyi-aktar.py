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
#
# Alt uc yeniden bantlandi (25.08.2026): eski 20/15/10 esikleri 4-5-6. katmani
# 1058/1564/3128 yapiyordu, yani kelimelerin %40'i tek kovada yigiliyordu.
# 17/12/10 ile ucu de ~1900 oluyor (1822/2040/1888). Ust uc bilerek elle
# surulmedi: 1-4. katman zaten dengeliydi (657/720/701) ve 40 esigi Temel'i
# "zaten biliyorsundur, atlanabilir" kalibinda tutuyor.
KATMANLAR = [
    (1, 'Temel',        40, 1e9),
    (2, 'Çekirdek',     30, 40),
    (3, 'Orta',         25, 30),
    (4, 'İleri',        17, 25),
    (5, 'Geniş',        12, 17),
    (6, 'Geniş+',       10, 12),
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


def ek_puanlari_oku():
    """tools/ek-puanlar.js — siteye elle eklenen kelimelerin gerçek puanları.

    Değerler ana puanlama SQLite'ından aynı STRUCTURAL_PROXY formülüyle
    alınır. Burada yalnız yeniden üretimde kaybolmamaları için tutulurlar.
    """
    yol = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ek-puanlar.js')
    if not os.path.exists(yol):
        return {}
    metin = open(yol, encoding='utf-8').read()
    i = metin.find('window.EK_PUANLAR')
    if i == -1:
        return {}
    return {json.loads('"%s"' % ad): float(puan)
            for ad, puan in re.findall(r'"((?:[^"\\]|\\.)*)"\s*:\s*(\d+(?:\.\d+)?)', metin[i:])}


def kelime_duzeltmelerini_oku():
    """PDF/sözlük denetimiyle kanonikleştirilen başlık ve anlamlar.

    Aynı dosyadaki ``eskiler`` alanı tarayıcıdaki ilerleme göçünün de tek
    kaynağıdır. Böylece veri yeniden üretildiğinde kart başlığı ile göç
    tablosu birbirinden kopamaz.
    """
    yol = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                       'kelime-duzeltmeleri.json')
    if not os.path.exists(yol):
        return {'duzeltmeler': [], 'korunan_kaynak_kayitlari': []}
    with open(yol, encoding='utf-8') as f:
        veri = json.load(f)
    if not isinstance(veri.get('duzeltmeler'), list):
        raise ValueError('kelime-duzeltmeleri.json: duzeltmeler dizisi eksik')
    gorulen_ilerleme_kimlikleri = set()
    for d in veri.get('duzeltmeler', []):
        kimlik = d.get('ilerleme_kimligi')
        if not kimlik:
            continue
        if not isinstance(kimlik, str) or not kimlik.startswith('@kelime:'):
            raise ValueError('Geçersiz ilerleme_kimligi: %r' % kimlik)
        if kimlik != '@kelime:' + d.get('yeni', ''):
            raise ValueError('İlerleme kimliği başlıktan türemiyor: %s' % kimlik)
        if kimlik in gorulen_ilerleme_kimlikleri:
            raise ValueError('Yinelenen ilerleme_kimligi: %s' % kimlik)
        gorulen_ilerleme_kimlikleri.add(kimlik)
    return veri


def kelime_duzeltmelerini_uygula(kelimeler, veri):
    """Eski başlıkları birleştirip denetlenmiş kanonik kaydı kurar."""
    uygulanan = 0
    for d in veri.get('duzeltmeler', []):
        yeni = d['yeni']
        adlar = list(dict.fromkeys(list(d.get('eskiler', [])) + [yeni]))
        bulunan = []
        for ad in adlar:
            if ad in kelimeler:
                bulunan.append((ad, kelimeler.pop(ad)))
        if not bulunan:
            raise ValueError('Kelime düzeltmesinin kaynak kaydı yok: %s' % yeni)

        # Birden çok bozuk başlık aynı kavrama aitse en yüksek sınav puanını
        # koru. Diğer site metadata'sını da mümkün olduğunca birleştir.
        taban = max(bulunan,
                    key=lambda x: x[1].get('puan') if x[1].get('puan') is not None else -1)[1]
        puanlar = [k.get('puan') for _ad, k in bulunan if k.get('puan') is not None]
        if puanlar:
            taban['puan'] = max(puanlar)
        esler = []
        for _ad, k in bulunan:
            esler.extend(x.strip() for x in str(k.get('es') or '').split(',') if x.strip())
        if esler:
            taban['es'] = ', '.join(dict.fromkeys(esler))

        taban['tip'] = d['tip']
        taban['anlamlar'] = d['anlamlar']
        if d.get('kalip'):
            taban['kalip'] = d['kalip']
        kelimeler[yeni] = taban
        uygulanan += 1
    return uygulanan


def kelime_duzeltme_dosyalarini_yaz(veri, modal_kartlar=None):
    """Tarayıcı alias tablosunu ve telifsiz öğe provenansını üretir."""
    aliaslar = {}
    ilerleme_kimlikleri = {}
    for d in veri.get('duzeltmeler', []):
        for eski in d.get('eskiler', []):
            if eski != d['yeni']:
                aliaslar[eski] = d['yeni']
        if d.get('ilerleme_kimligi'):
            ilerleme_kimlikleri[d['yeni']] = d['ilerleme_kimligi']
    for kart in modal_kartlar or []:
        kimlik = kart.get('progress_id')
        if not kimlik:
            continue
        if kart['e'] in ilerleme_kimlikleri:
            raise ValueError('Yinelenen ilerleme kimliği başlığı: %s' % kart['e'])
        ilerleme_kimlikleri[kart['e']] = kimlik
    js = (
        '/* Kelime başlığı aliasları — kelime-duzeltmeleri.json ve modal-kartlar.json kaynaklıdır. */\n'
        'window.YDS_KELIME_ALIASES = %s;\n'
        'window.YDS_KELIME_ILERLEME_KIMLIKLERI = %s;\n' % (
            json.dumps(aliaslar, ensure_ascii=False, sort_keys=True),
            json.dumps(ilerleme_kimlikleri, ensure_ascii=False, sort_keys=True))
    )
    yaz(os.path.join(VERI, 'kelime-aliaslari.js'), js)

    acik = {
        'sema_surumu': veri.get('sema_surumu', 1),
        'aciklama': ('Denetlenen kelime başlıklarının telifli soru metnini '
                     'kopyalamayan öğe düzeyi kaynak kaydı.'),
        'duzeltmeler': veri.get('duzeltmeler', []),
        'korunan_kaynak_kayitlari': veri.get('korunan_kaynak_kayitlari', []),
    }
    yaz(os.path.join(VERI, 'kelime-provenans.json'),
        json.dumps(acik, ensure_ascii=False, indent=2) + '\n')


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
    arac = os.path.dirname(os.path.abspath(__file__))

    def oku(dosya, degisken):
        yol = os.path.join(arac, dosya)
        if not os.path.exists(yol):
            return {}
        metin = open(yol, encoding='utf-8').read()
        bas = metin.index('{', metin.index(degisken))
        govde = metin[bas:metin.rindex('}') + 1]
        # Dosyada bolum basliklari icin /* … */ yorumlari olabilir.
        govde = re.sub(r'/\*.*?\*/', '', govde, flags=re.S)
        return json.loads(govde)

    sonuc = oku('ek-ornekler.js', 'EK_ORNEKLER')
    # Denetim düzeltmeleri aynı anahtarı bilinçli olarak geçersiz kılar.
    sonuc.update(oku('ornek-duzeltmeleri.js', 'ORNEK_DUZELTMELERI'))
    return sonuc


def pdf_anlam_duzeltmelerini_oku():
    """Resmî sınav bağlamıyla doğrulanan anlam/tür düzeltmelerini oku.

    Bu katman mevcut doğru ikincil anlamları koruyup YDS'de görülen baskın
    anlamı öne ekleyebilir (``prepend``), kaydı bütünüyle değiştirebilir
    (``replace``) veya yalnız tür etiketini düzeltebilir (``type``).
    """
    yol = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                       'pdf-anlam-duzeltmeleri.json')
    if not os.path.exists(yol):
        return {'corrections': []}
    with open(yol, encoding='utf-8') as f:
        veri = json.load(f)
    if not isinstance(veri.get('corrections'), list):
        raise ValueError('pdf-anlam-duzeltmeleri.json: corrections dizisi eksik')
    return veri


def pdf_anlam_duzeltmelerini_uygula(kelimeler, veri):
    """Denetlenmiş anlamları veri kaydına uygula ve uygulanan adedi döndür."""
    gorulen = set()
    uygulanan = 0
    for sira, d in enumerate(veri.get('corrections', [])):
        en = d.get('e')
        if not isinstance(en, str) or not en.strip():
            raise ValueError('Anlam düzeltmesi %d: e alanı eksik' % sira)
        if en in gorulen:
            raise ValueError('Yinelenen anlam düzeltmesi: %s' % en)
        gorulen.add(en)
        if en not in kelimeler:
            raise ValueError('Anlam düzeltmesinin kaynak kaydı yok: %s' % en)

        islem = d.get('operation')
        if islem not in ('prepend', 'replace', 'type'):
            raise ValueError('%s: geçersiz anlam düzeltme işlemi %r' % (en, islem))
        tip = d.get('type')
        if not isinstance(tip, str) or not tip.strip():
            raise ValueError('%s: type alanı eksik' % en)

        yeni_anlamlar = d.get('meanings', [])
        if not isinstance(yeni_anlamlar, list):
            raise ValueError('%s: meanings bir dizi olmalı' % en)
        if islem != 'type' and not yeni_anlamlar:
            raise ValueError('%s: %s işlemi anlam gerektiriyor' % (en, islem))
        if islem == 'type' and yeni_anlamlar:
            raise ValueError('%s: type işlemi meanings taşımamalı' % en)

        temiz = []
        for anlam_sira, anlam in enumerate(yeni_anlamlar):
            if not isinstance(anlam, dict):
                raise ValueError('%s meanings[%d]: nesne olmalı' % (en, anlam_sira))
            for alan in ('tr', 'ex', 'exTr'):
                if not isinstance(anlam.get(alan), str) or not anlam[alan].strip():
                    raise ValueError('%s meanings[%d].%s eksik' % (en, anlam_sira, alan))
            yz = anlam.get('yz')
            if not isinstance(yz, int) or not 1 <= yz <= 4:
                raise ValueError('%s meanings[%d].yz 1-4 olmalı' % (en, anlam_sira))
            temiz.append({
                'tr': anlam['tr'].strip(),
                'ex': anlam['ex'].strip(),
                'exTr': anlam['exTr'].strip(),
                'yz': yz,
            })

        kayit = kelimeler[en]
        kayit['tip'] = tip.strip()
        if islem == 'replace':
            kayit['anlamlar'] = temiz
        elif islem == 'prepend':
            varsayilan = d.get('existing_default_yz', 2)
            if not isinstance(varsayilan, int) or not 1 <= varsayilan <= 4:
                raise ValueError('%s: existing_default_yz 1-4 olmalı' % en)
            yeni_metinler = {a['tr'] for a in temiz}
            eskiler = []
            for anlam in kayit['anlamlar']:
                if anlam.get('tr') in yeni_metinler:
                    continue
                kopya = dict(anlam)
                kopya.setdefault('yz', varsayilan)
                eskiler.append(kopya)
            kayit['anlamlar'] = temiz + eskiler
        uygulanan += 1
    return uygulanan


def modal_kartlarini_oku():
    """Puanlanmış modal sözcük ve yapı kartlarını oku.

    Ana kaynak listede bulunmayan çok sözcüklü dil bilgisi yapılarını da
    kelime çalışma/Leitner sistemine sokar. ``k`` açıkça saklanır; böylece
    puanı 10'un altındaki pedagojik kartlar kullanıcı isteği doğrultusunda
    6. (son puanlı) katmanda kalır.
    """
    yol = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                       'modal-kartlar.json')
    if not os.path.exists(yol):
        return []
    with open(yol, encoding='utf-8') as f:
        veri = json.load(f)
    kartlar = veri.get('cards')
    if not isinstance(kartlar, list):
        raise ValueError('modal-kartlar.json: cards dizisi eksik')
    return kartlar


def modal_kartlarini_uygula(kelimeler, kartlar):
    """Modal kartları ekle; mevcut başlıkları silmeden anlamlarını yenile."""
    gorulen = set()
    eklenen = 0
    guncellenen = 0
    for sira, kart in enumerate(kartlar):
        en = kart.get('e')
        if not isinstance(en, str) or not en.strip():
            raise ValueError('Modal kart %d: e alanı eksik' % sira)
        if en in gorulen:
            raise ValueError('Yinelenen modal kart: %s' % en)
        gorulen.add(en)
        puan = kart.get('p')
        katman = kart.get('k')
        tip = kart.get('y')
        anlamlar = kart.get('a')
        if not isinstance(puan, (int, float)) or not 0 <= puan <= 100:
            raise ValueError('%s: geçersiz modal puanı' % en)
        if not isinstance(katman, int) or not 1 <= katman <= 6:
            raise ValueError('%s: geçersiz modal katmanı' % en)
        if not isinstance(tip, str) or not tip.strip():
            raise ValueError('%s: modal türü eksik' % en)
        if not isinstance(anlamlar, list) or not anlamlar:
            raise ValueError('%s: modal anlamları eksik' % en)
        ilerleme_kimligi = kart.get('progress_id')
        if ilerleme_kimligi is not None and ilerleme_kimligi != '@kelime:' + en:
            raise ValueError('%s: geçersiz modal ilerleme kimliği' % en)

        temiz = []
        for anlam_sira, anlam in enumerate(anlamlar):
            for alan in ('tr', 'ex', 'exTr'):
                if not isinstance(anlam.get(alan), str) or not anlam[alan].strip():
                    raise ValueError('%s meanings[%d].%s eksik' %
                                     (en, anlam_sira, alan))
            yz = anlam.get('yz')
            if len(anlamlar) > 1 and (not isinstance(yz, int) or not 1 <= yz <= 4):
                raise ValueError('%s: çok anlamlı modal kartta yz eksik' % en)
            kayit = {alan: anlam[alan].strip() for alan in ('tr', 'ex', 'exTr')}
            if yz is not None:
                kayit['yz'] = yz
            temiz.append(kayit)

        if en in kelimeler:
            # Kaynakta zaten bulunan can/must/will gibi sözcüklerin resmî
            # puanını ve katmanını koru; yalnız denetlenmiş anlam/türü yenile.
            kelimeler[en]['tip'] = tip.strip()
            kelimeler[en]['anlamlar'] = temiz
            guncellenen += 1
        else:
            kelimeler[en] = {
                'tip': tip.strip(),
                'puan': round(float(puan), 1),
                'katman_zorla': katman,
                'anlamlar': temiz,
            }
            eklenen += 1
    return eklenen, guncellenen


def tur_duzeltmelerini_oku():
    """tools/tur-duzeltme.js — dizindeki yanlis tur etiketleri {kelime: tur}.

    Kaynagin Tur sutunu islev kelimelerinde yanlisti ("do" isim, "except"
    fiil). Tur, gunun testinde celdirici havuzunu belirledigi icin duzeltilir;
    ilk tur bas turdur. 25.08.2026 denetimi."""
    yol = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'tur-duzeltme.js')
    if not os.path.exists(yol):
        return {}
    metin = open(yol, encoding='utf-8').read()
    i = metin.find('window.TUR_DUZELTME')
    if i == -1:
        return {}
    return {json.loads('"%s"' % a): json.loads('"%s"' % b)
            for a, b in re.findall(r'"((?:[^"\\]|\\.)*)":\s*"((?:[^"\\]|\\.)*)"', metin[i:])}


def yildizlari_oku():
    """tools/anlam-yildiz.js — cok anlamli kelimelerde anlam basina YDS onemi.

    {kelime: {anlam_metni: yildiz}}. Yildiz siraya degil anlam METNINE baglidir;
    boylece anlamlari yeniden siralamak eslesmeyi bozmaz."""
    yol = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'anlam-yildiz.js')
    if not os.path.exists(yol):
        return {}
    metin = open(yol, encoding='utf-8').read()
    i = metin.find('window.ANLAM_YILDIZ')
    if i == -1:
        return {}
    sonuc = {}
    for m in re.finditer(r'"((?:[^"\\]|\\.)*)":\s*\[(.*?)\]', metin[i:], re.S):
        anahtar = json.loads('"' + m.group(1) + '"')
        esleme = {}
        for tr, yz in re.findall(r'\{tr:"((?:[^"\\]|\\.)*)",yz:(\d)\}', m.group(2)):
            esleme[json.loads('"' + tr + '"')] = int(yz)
        if esleme:
            sonuc[anahtar] = esleme
    return sonuc


def yildizla(anlamlar, esleme):
    """Anlamlara 'yz' alanini ekler ve buyukten kucuge kararli siralar.

    Yildizsiz anlam 0 sayilir ama alan yazilmaz; tek anlamlilar dokunulmaz."""
    if not esleme or len(anlamlar) < 2:
        return False
    bulundu = False
    for a in anlamlar:
        yz = esleme.get(a['tr'].strip())
        if yz:
            # Denetlenmiş düzeltme kaydı açıkça bir yıldız taşıyorsa eski
            # genel eşleme onu ezmemeli; yalnız eksik yıldızı tamamla.
            a.setdefault('yz', yz)
            bulundu = True
    if bulundu:
        anlamlar.sort(key=lambda a: -a.get('yz', 0))
    return bulundu


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
    ek_puan = ek_puanlari_oku()
    ek = ek_ornekleri_oku()
    aile_uye = aile_uyelerini_oku()
    baslik_d = kelime_duzeltmelerini_oku()
    pdf_anlam_d = pdf_anlam_duzeltmelerini_oku()
    modal_kartlar = modal_kartlarini_oku()

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
                'puan': ek_puan.get(en),
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
            # Puani normal esige (10) yetisen uye gercek katmanina girer;
            # 7. katman yalniz sinav kaniti zayif (p<10 ya da puansiz) uyeler icin.
            'katman_zorla': AILE_KATMANI if (v.get('p') or 0) < 10 else None,
            'anlamlar': v.get('anlamlar') or
                        [{'tr': v['tr'], 'ex': v['ex'], 'exTr': v['exTr']}],
        }
        aile_eklenen += 1

    # Cok turlu anlamlari ayri ornekleriyle degistir
    ek_uygulanan = 0
    for en, anlamlar in ek.items():
        if en in kelimeler:
            kelimeler[en]['anlamlar'] = anlamlar
            ek_uygulanan += 1

    # PDF yüzey biçimleri ve güvenilir sözlük yazımlarıyla başlıkları düzelt.
    # Bu adım ek örneklerden sonra yapılır; böylece bozuk başlığa bağlı eski
    # içeriğin yanlışlıkla yeniden görünmesi engellenir.
    baslik_duzeltilen = kelime_duzeltmelerini_uygula(kelimeler, baslik_d)

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

    # Tur duzeltmeleri (dizindeki y alanini duzeltir)
    tur_d = tur_duzeltmelerini_oku()
    for en, tur in tur_d.items():
        if en in kelimeler:
            kelimeler[en]['tip'] = tur

    # Bu denetim katmanı genel tür düzeltmelerinden sonra uygulanır; böylece
    # PDF bağlamıyla doğrulanan tür ve anlam son sözü söyler.
    pdf_anlam_uygulanan = pdf_anlam_duzeltmelerini_uygula(kelimeler, pdf_anlam_d)

    # Modal denetimi en son uygulanır. Böylece hem ana listedeki can/must/will
    # gibi sözcüklerin eksik işlevleri tamamlanır hem de puanlanmış yapılar
    # ilerleme anahtarı olarak kendi başlıklarıyla eklenir.
    modal_eklenen, modal_guncellenen = modal_kartlarini_uygula(kelimeler, modal_kartlar)

    # Anlam yildizlari: onemliyi basa al
    yildiz = yildizlari_oku()
    yildizli = 0
    for en, k in kelimeler.items():
        if yildizla(k['anlamlar'], yildiz.get(en)) or any(a.get('yz') for a in k['anlamlar']):
            yildizli += 1

    for en, k in kelimeler.items():
        k['katman'] = k.get('katman_zorla') or katman_bul(k['puan'])

    # Hala bolunmesi gereken (cok turlu ama tek ornekli) kayitlari say
    bekleyen = [en for en, k in kelimeler.items()
                if len(k['anlamlar']) == 1 and len(anlamlari_bol(k['anlamlar'][0]['tr'])) > 1]

    return (kelimeler, ortak, yalniz_site, ek_uygulanan, bekleyen, aile_eklenen,
            elenen, kalipli, yildizli, baslik_duzeltilen, baslik_d,
            pdf_anlam_uygulanan, modal_eklenen, modal_guncellenen)


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
            anlamlar = ','.join(anlam_yaz(a) for a in k['anlamlar'])
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

    yildiz = yildizlari_oku()
    for ad, o in obekler.items():
        yildizla(o['anlamlar'], yildiz.get(ad))

    sirali = sorted(obekler.items(), key=lambda x: (-x[1]['sinav'], x[0]))
    govde = []
    for ad, o in sirali:
        anlamlar = ','.join(anlam_yaz(a) for a in o['anlamlar'])
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
        '            a=anlamlar [{tr, ex, exTr, yz}] — yz: YDS önemi 1-4\n'
        '   Kaç sınavda geçtiğine göre sıralı. tools/listeyi-aktar.py üretir.\n'
        '   ============================================================ */\n\n'
        'window.OBEKLER = [\n' % len(sirali)
    )
    yol = os.path.join(VERI, 'obekler.js')
    yaz(yol, basli + ',\n'.join(govde) + '\n];\n')
    return sirali, os.path.getsize(yol), ek_eklenen, atilan


def anlam_yaz(a):
    """Bir anlami JS nesnesi olarak yazar; yildizi varsa 'yz' alanini ekler."""
    govde = '{tr:%s,ex:%s,exTr:%s' % (
        json.dumps(a['tr'], ensure_ascii=False),
        json.dumps(a['ex'], ensure_ascii=False),
        json.dumps(a['exTr'], ensure_ascii=False))
    if a.get('yz'):
        govde += ',yz:%d' % a['yz']
    return govde + '}'


def yaz(yol, icerik):
    with open(yol, 'w', encoding='utf-8', newline='\n') as f:
        f.write(icerik)


# ---------------------------------------------------------------- main

def soru_sayisini_oku():
    """Soru bankasindaki kayitlari, JS bicimini calistirmadan guvenle sayar."""
    desen = re.compile(r'(?m)^\s*(?:\{kat:|"kat":)')
    toplam = 0
    for dosya in ('sorular.js', 'sorular-ek.js'):
        yol = os.path.join(VERI, dosya)
        with open(yol, encoding='utf-8') as f:
            toplam += len(desen.findall(f.read()))
    if toplam <= 0:
        raise ValueError('Soru bankasinda sayilacak kayit bulunamadi.')
    return toplam


def sayilari_yaz(sirali, ozet, obekler):
    """Sayfalarin basliklarda kullandigi sayilar; elle guncellenmesin diye uretilir."""
    katman = {str(k): n for k, _ad, n, _b in ozet}
    icerik = (
        '/* Icerik sayaclari — tools/listeyi-aktar.py uretir, elle duzenleme. */\n'
        'window.SAYILAR = %s;\n' % json.dumps(
            {'kelime': len(sirali), 'obek': len(obekler),
             'soru': soru_sayisini_oku(), 'katman': katman},
            ensure_ascii=False, sort_keys=True)
    )
    yaz(os.path.join(VERI, 'sayilar.js'), icerik)


def modal_testlerini_yaz(kartlar):
    """Yeni modal kartların bağımsız Günün Testi cümlelerini yaz."""
    govde = []
    for kart in kartlar:
        test = kart.get('test')
        if not test:
            continue
        en = kart['e']
        for alan in ('c', 'b', 'tr'):
            if not isinstance(test.get(alan), str) or not test[alan].strip():
                raise ValueError('%s: modal test %s alanı eksik' % (en, alan))
        if '----' not in test['c']:
            raise ValueError('%s: modal test cümlesinde ---- eksik' % en)
        govde.append('%s:{c:%s,b:%s,f:"",tr:%s}' % (
            json.dumps(en, ensure_ascii=False),
            json.dumps(test['c'].strip(), ensure_ascii=False),
            json.dumps(test['b'].strip(), ensure_ascii=False),
            json.dumps(test['tr'].strip(), ensure_ascii=False)))
    basli = (
        '/* Modal sözcük ve yapı kartları — Günün Testi cümleleri · %d kayıt\n'
        '   tools/modal-kartlar.json kaynağından tools/listeyi-aktar.py üretir. */\n\n'
        'window.TEST_MODAL = {\n' % len(govde)
    )
    yaz(os.path.join(VERI, 'test-modal.js'), basli + ',\n'.join(govde) + '\n};\n')


def main():
    (kelimeler, ortak, yalniz_site, ek_uygulanan, bekleyen, aile_eklenen,
     elenen, kalipli, yildizli, baslik_duzeltilen, baslik_d,
     pdf_anlam_uygulanan, modal_eklenen, modal_guncellenen) = birlestir()
    sirali, ozet = kelimeleri_yaz(kelimeler)
    obekler, obek_boyut, obek_ek, obek_atilan = obekleri_yaz()
    sayilari_yaz(sirali, ozet, obekler)
    modal_testlerini_yaz(modal_kartlarini_oku())
    kelime_duzeltme_dosyalarini_yaz(baslik_d, modal_kartlarini_oku())

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
    print('  anlami yildizli    :', yildizli)
    print('  basligi duzeltilen :', baslik_duzeltilen)
    print('  PDF anlam duzeltme :', pdf_anlam_uygulanan)
    print('  modal kart eklendi :', modal_eklenen)
    print('  modal kart yenilendi:', modal_guncellenen)
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
