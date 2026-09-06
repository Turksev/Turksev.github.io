# -*- coding: utf-8 -*-
"""Kelime bilgi notu (data/kelime-bilgi.js) baglam temizligi — B2 denetimi, 5 Eylul 2026.

bilgi_kart_veri.py (soru koku secimi) ve bilgi_js_uret.py (cikti) ortak kullanir.
Korpustan gelen soru koku (k) ve sik metni (sk) alanlarinda gorulen ayiklama artiklari:

  * OSYM'nin Turkce cevap kagidi / sinav yonergesi metinleri ("Isaretlediginiz bir
    cevabi degistirmek istediginizde...") soru numarasina yanlis baglanmis (duz3
    korpusu, 2013-2015). Yonerge blogu baglam olarak kullanilmaz; ayni sorunun
    gercek koku korpusta (duz4) bulunursa onunla degistirilir (kok_onar), yoksa atilir.
  * Kitapcik basligi / altbilgi tokenleri metnin basinda ya da ortasinda
    ("2024 Sonbahar YDS", "2013-YDS Ilkbahar/INGILIZCE", "9 Mart 2025 YDS",
    "Go on to the next page.", "Diger sayfaya geciniz.", "OSYM"). Soru kokunde token
    silinir (sayfa sonu birlesmesi), sik metninde ilk tokenden sonrasi kesilir
    (sonraki sayfanin metni sikin parcasi degildir).
  * e-YDS koklerindeki "4) " soru numarasi oneki.
  * PDF satir sonu tire bolmesi "sil- me", "trumpet- like": sozluk/korpusa bakarak
    "silme" ya da "trumpet-like" (tire_birlestir); askida tire ("19th- and") korunur,
    noktalama tiresi ("growth- will") uzun tireye cevrilir.
  * "Large collections Sof books" -> "of"; 2013-2016 PDF kenar harfi ("reactors. M",
    "chaMracteristics") atilir.
  * Kucuk harfle baslayan parca: korpusta parcayi kapsayan tam cumle aranir
    (a4_onarim_hazirlik.py'deki akilli cumle siniri); bulunamazsa "N. yuzyil..."
    kaliplarinda soru numarasina yutulan "N." geri konur.
  * Kesme: kelime ortasindan degil, sozcuk sinirindan ve "…" ile (kisalt).

Kullanim (bilgi_js_uret.py):
    korpus, sozluk = Korpus(), Sozluk()
    kok = temizle_kok(kok, soru_no, korpus, sozluk)     # '' donerse baglam atilir
    sk  = temizle_sik(sik_metni, sozluk)
"""

from pathlib import Path as _YdsPath
import sys as _yds_sys
_yds_site = next(p for p in _YdsPath(__file__).resolve().parents if (p / "sw.js").is_file())
_yds_sys.path.insert(0, str(_yds_site / "tools"))
from yds_paths import site_path, yds_path, scratch_path
import io
import json
import os
import re

KOK = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
VERI = os.path.join(KOK, 'data')
# Guncel korpus (KAYNAK_NOTU.md): duz3 arsive kopyalanmadi, duz4 kopyalandi.
KORPUS = os.path.join(yds_path('03_calisma_listesi', '06_sandbox_2026-09'),
                      'sandbox', 'duz4', '02_korpus', 'korpus.jsonl')


def bosluk(m):
    return ' '.join((m or '').split())


# ------------------------------------------------------------------ yonerge
TR_HARF = re.compile(r'[çğıöşüÇĞİÖŞÜ]')
# Turkce yonerge anahtar sozcukleri: cevap kagidi, kitapcik, sinav kurallari, soru grubu yonergesi.
YONERGE_KW = re.compile(
    r'(?:işaretlediğiniz|işaretleyiniz|işaretlenmiş|cevap k[âa]ğıd|unutmayınız|soru kitapçı|kitapçığ'
    r'|kurşun kalem|değerlendirmeye alınmayacak|sınav görevli|görevlilerin|görevlilere|sınav salon'
    r'|sınavda uyulacak|cevaplarınızı|sınav süresi|cevaplama süresi|silme işlemi|kamera ile'
    r'|adayların|cevaplamaya|doğru cevap sayısı|doğru cevabı vardır|yanlış cevaplanmış|cevap yeri'
    r'|sınava girmek|kesinlikle yasaktır|sınav kuralları|sınav sırasında|sınavınızın|cevaplar dikkate'
    r'|elektronik/mekanik|sorularda,? (?:cümlede|aşağıdaki|verilen|parçada|karşılıklı)'
    r'|bu testte \d+ soru)', re.I)


def tr_orani(m):
    harf = sum(1 for c in m if c.isalpha())
    return len(TR_HARF.findall(m)) / harf if harf else 0.0


def yonerge_mi(m):
    """Blok OSYM'nin Turkce yonergesi mi? Turkce ozgu harf orani yuksek VE anahtar sozcuk var."""
    m = m or ''
    return bool(YONERGE_KW.search(m)) and tr_orani(m) > 0.02


def yonerge_kok_mu(kok):
    """Soru koku yonerge mi? Baslik/altbilgi tokenleri ("Diğer sayfaya geçiniz. ÖSYM 2014-YDS ...")
    sayfa sonunda Ingilizce koke yapisabildigi icin once onlar silinir."""
    return yonerge_mi(baslik_kirp(kok))


# ------------------------------------------------------------------ baslik / altbilgi / soru no
AY = (r'İlkbahar|Sonbahar|Yaz|Aralık|Temmuz|Nisan|Mayıs|Haziran|Ağustos|Eylül|Ekim|Kasım'
      r'|İLKBAHAR|SONBAHAR|YAZ|ARALIK|TEMMUZ|NİSAN|NISAN|MAYIS|HAZİRAN|AĞUSTOS|EYLÜL|EKİM|KASIM')
BASLIK = re.compile(
    r'(?:ÖSYM\s+)?\d{4}-YDS\s+\S+/\S+(?:\s+İNGİLİZCE)?'                      # 2013-YDS İlkbahar/İNGİLİZCE İNGİLİZCE
    r'|\d{4}\s+(?:' + AY + r')\s+(?:e-)?YDS(?:\s+\d{4}\s+(?:' + AY + r'))?'    # 2024 İlkbahar YDS ; 2013 NİSAN YDS 2013 NİSAN
    r'|\d{1,2}\s+Mart\s+\d{4}\s+YDS'                                          # 9 Mart 2025 YDS
    r'|(?:İlkbahar|Sonbahar|Yaz)\s+YDS|Mart\s+\d{4}\s+YDS'
    r'|e-YDS\s*\d{4}/\d'                                                      # e-YDS 2015/1
    r'|DOĞRU\s*CEVAP:\s*[A-E]\b'
    r'|YDS\s+Soru\s+No:?'
    r'|\bÖSYM\b'
    r'|Go on to the next page\.?'
    r'|Diğer sayfaya geçiniz\.?'
    r'|Bu testte \d+ soru vardır\.?')
SORUNO = re.compile(r'^\d{1,2}\)\s+')


def baslik_kirp(m):
    """Soru koku: baslik/altbilgi tokenlerini metnin neresinde olursa olsun siler."""
    return bosluk(BASLIK.sub(' ', m or ''))


def sik_baslik_kirp(sk):
    """Sik metni: bastaki tokeni siler, ortadaki tokenden sonrasini keser."""
    sk = bosluk(sk)
    while True:
        m = BASLIK.search(sk)
        if not m:
            return sk
        if m.start() == 0:
            sk = sk[m.end():].lstrip()
        else:
            return sk[:m.start()].rstrip()


def soruno_kirp(m):
    return SORUNO.sub('', m or '')


# ------------------------------------------------------------------ tire birlestirme
class Sozluk(object):
    """Sitedeki kelime dizini + veri dosyalarinda gecen tireli sozcukler."""

    def __init__(self, veri=VERI):
        self.kelimeler = set()
        self.tireli = set()
        dz = io.open(os.path.join(veri, 'kelime-dizin.js'), encoding='utf-8').read()
        for mm in re.finditer(r'\{e:"((?:[^"\\]|\\.)+)"', dz):
            w = mm.group(1).lower()
            self.kelimeler.add(w)
            if '-' in w:
                self.tireli.add(w)
        for ad in sorted(os.listdir(veri)):
            if re.match(r'kelime-k\d\.js$', ad) or ad in ('cumleler.js', 'obekler.js'):
                metin = io.open(os.path.join(veri, ad), encoding='utf-8').read()
                for t in re.findall(r'\b[A-Za-z]+-[a-z]+\b', metin):
                    self.tireli.add(t.lower())

    @staticmethod
    def govdeler(w):
        out = {w}
        if len(w) > 4 and w.endswith('ies'):
            out.add(w[:-3] + 'y')
        if len(w) > 3 and w.endswith('es'):
            out.add(w[:-2])
        if len(w) > 3 and w.endswith('s'):
            out.add(w[:-1])
        if len(w) > 4 and w.endswith('ed'):
            out.add(w[:-2]); out.add(w[:-1])
        if len(w) > 5 and w.endswith('ing'):
            out.add(w[:-3]); out.add(w[:-3] + 'e')
        return out

    def kelime_mi(self, w):
        return any(g in self.kelimeler for g in self.govdeler(w))

    def tireli_mi(self, w):
        return any(g in self.tireli for g in self.govdeler(w))


BAGLAC = {'and', 'or', 'nor'}                         # askida tire: "19th- and 20th-century"
ISLEV = {'the', 'a', 'an', 'that', 'this', 'these', 'those', 'to', 'will', 'were', 'was', 'is', 'are',
         'which', 'who', 'whom', 'whose', 'in', 'of', 'on', 'at', 'for', 'with', 'by', 'from', 'as',
         'it', 'they', 'he', 'she', 'we', 'you', 'but', 'so', 'if', 'not', 'than', 'then', 'there',
         'their', 'its', 'his', 'her', 'our', 'be', 'been', 'had', 'has', 'have', 'do', 'does', 'did',
         'can', 'could', 'may', 'might', 'should', 'would', 'must', 'because', 'while', 'when', 'where',
         'what', 'how', 'why', 'yet', 'even', 'also', 'such', 'both', 'each', 'all', 'no'}
ONEK = {'self', 'well', 'non', 'pre', 'post', 'anti', 'co', 'ex', 'multi', 'semi', 'sub', 'inter',
        'over', 'under', 're', 'de', 'un', 'mid', 'all', 'cross', 'half', 'high', 'low', 'long',
        'short', 'full', 'part', 'ill', 'best', 'far', 'near', 'ever', 'pro', 'counter', 'extra',
        'ultra', 'micro', 'macro', 'bio', 'eco', 'neo', 'pseudo', 'quasi', 'vice', 'mini', 'beta',
        'alpha', 'omega', 'off', 'out', 'in', 'up', 'down'}
SONEK = {'like', 'based', 'related', 'oriented', 'driven', 'free', 'friendly', 'proof', 'wide',
         'long', 'term', 'level', 'scale', 'style', 'type', 'minded', 'looking', 'making',
         'producing', 'causing', 'fired', 'borne', 'bound', 'ready', 'rich', 'poor', 'old', 'year',
         'shaped', 'sized', 'wise', 'specific', 'dependent', 'linked', 'induced', 'led', 'fed',
         'paid', 'worn', 'known', 'off', 'up', 'out', 'in', 'on', 'down', 'edge', 'being', 'worth'}
TIRE = re.compile(r'\b([A-Za-z]+)- ([a-z]+)(-?)')


def tire_karar(a, b, zincir, sozluk):
    """'a- b' icin sonuc: 'ab' (bitisik), 'a-b' (tireli), 'a – b' (noktalama), None (oldugu gibi)."""
    al, bl = a.lower(), b.lower()
    if zincir:                                       # "pilot- to-controller"
        return a + '-' + b
    if bl in BAGLAC:                                 # "19th- and 20th-century"
        return None
    if sozluk is None:
        return a + b
    if sozluk.tireli_mi(al + '-' + bl):
        return a + '-' + b
    if sozluk.kelime_mi(al + bl):
        return a + b
    if bl in ISLEV and al not in ONEK:               # "growth- will add" : uzun tire
        return a + ' – ' + b
    if (sozluk.kelime_mi(al) or al in ONEK) and (sozluk.kelime_mi(bl) or bl in SONEK):
        return a + '-' + b
    return a + b                                     # "kuralla- rına", "classi- fication"


def tire_birlestir(m, sozluk=None):
    def yer(mm):
        a, b, zincir = mm.group(1), mm.group(2), mm.group(3)
        r = tire_karar(a, b, zincir, sozluk)
        if r is None:
            return mm.group(0)
        return r + zincir if not zincir else r + '-'
    return TIRE.sub(yer, m or '')


SOF = re.compile(r'(?<=[a-z] )Sof(?= [a-z])')


def sof_duzelt(m):
    return SOF.sub('of', m or '')


# ------------------------------------------------------------------ tam cumle (a4_onarim_hazirlik.py)
KISALTMA = re.compile(r'(?:\b[A-Z]|\b(?:Mr|Mrs|Ms|Dr|Prof|St|Sr|Jr|Mt|Ft|vs|etc|e\.g|i\.e|No|Vol|pp|approx|ca|cf|al|Ph\.D|D\.C|U\.S|U\.K|a\.m|p\.m|Inc|Ltd|Co|Gen|Col|Capt|Lt|Sgt|Rev|Hon|Messrs|Mme|Mlle))\.$')
# Cumle siniri adayi: [.!?] + bosluk + buyuk harf/tirnak/parantez. Ondalik sayilar
# (7.3) zaten bosluksuz; kisaltma ve bas harf ("St.", "John W.") ise adaydan elenir.
SINIR = re.compile(r'[.!?]\s+(?=[A-ZÇĞİÖŞÜ"“(\[])')


def cumleler(metin):
    sinirlar = [0]
    for m in SINIR.finditer(metin):
        if KISALTMA.search(metin[max(0, m.start() - 12):m.start() + 1]):
            continue
        sinirlar.append(m.end())
    sinirlar.append(len(metin))
    return [(sinirlar[i], sinirlar[i + 1]) for i in range(len(sinirlar) - 1)]


class Korpus(object):
    """duz4 korpusu: (exam_id, soru_no) dizini + parca -> tam cumle aramasi."""

    def __init__(self, yol=KORPUS):
        self.kayitlar = []
        self.by_q = {}
        if not os.path.exists(yol):
            return
        for satir in io.open(yol, encoding='utf-8'):
            satir = satir.strip()
            if not satir:
                continue
            r = json.loads(satir)
            r['_metin'] = bosluk(r.get('metin') or '')
            # tam_cumle aramasi onekleri ("7) ", baslik) atlar; yoksa parca kendi blogunda
            # "ortada" bulunup onekiyle geri gelir.
            r['_arama'] = soruno_kirp(baslik_kirp(r['_metin']))
            self.kayitlar.append(r)
            if r.get('soru_no'):
                self.by_q.setdefault((r['exam_id'], int(r['soru_no'])), []).append(r)

    def tam_cumle(self, parca):
        """parca'yi ORTASINDA iceren korpus blogunda parcayi kapsayan tam cumle; yoksa None."""
        anahtar = bosluk(parca)[:40]
        if len(anahtar) < 20:
            return None
        for r in self.kayitlar:
            m = r['_arama']
            j = m.find(anahtar)
            if j <= 0:
                continue
            for a, b in cumleler(m):
                if a <= j < b:
                    return m[a:b].strip()
        return None

    def kok_bul(self, exam_id, soru_no, sik_metni=None):
        """Sorunun yonerge olmayan ilk koku; sik_metni verilirse ayni soruda o sik da olmali."""
        bl = self.by_q.get((exam_id, int(soru_no or 0)), [])
        if sik_metni is not None:
            siks = {b['_metin'] for b in bl if b['blok'] == 'sik'}
            if bosluk(sik_metni) not in siks:
                return ''
        for b in bl:
            if b['blok'] == 'soru_koku' and not yonerge_kok_mu(b['_metin']) and len(b['_metin']) >= 30:
                return b['_metin']
        return ''


def kok_sec(bloklar):
    """bilgi_kart_veri.py: sorunun bloklari arasindan yonerge olmayan ilk soru kokunu secer."""
    for b in bloklar:
        if b['blok'] == 'soru_koku' and not yonerge_kok_mu(b.get('metin') or ''):
            return b['metin']
    return ''


def kok_onar(exam_id, soru_no, sik_metni, korpus):
    """Yonerge olan kok yerine korpustaki gercek koku dondurur ('' = bulunamadi)."""
    if korpus is None:
        return ''
    return korpus.kok_bul(exam_id, soru_no, sik_metni)


def parca_onar(m, soru_no=0, korpus=None):
    """Kucuk harfle baslayan parcayi tam cumleyle onarir."""
    if not m or not re.match(r'^[a-zçğıöşü]', m):
        return m
    if korpus is not None:
        tam = korpus.tam_cumle(m)
        if tam and re.match(r'^[A-ZÇĞİÖŞÜ0-9"“(\[]', tam):
            return tam
    # "20. yüzyılın başlarında ..." : "20." soru numarasi sanilip yutulmus.
    if soru_no and re.match(r'^yüzyıl', m):
        return '%d. %s' % (int(soru_no), m)
    return m


# 2013-2016 YDS PDF'lerinde kenar harfi (M/S/Y) cumle sonuna ya da sozcuk icine yapisiyor:
# "... new reactors. M", "chaMracteristics", "fooMtwear".
KUYRUK_HARF = re.compile(r'([.!?"”)])\s+[A-Z]$')
ICE_HARF = re.compile(r'\b([a-z]+)([A-Z])([a-z]+)\b')


def kuyruk_harf_kirp(m):
    return KUYRUK_HARF.sub(r'\1', m or '')


def ice_harf_kirp(m, sozluk=None):
    """Sozcuk icindeki tek buyuk harfi, harfsiz hali sozlukte varsa (ve harfli hali yoksa) atar."""
    if sozluk is None:
        return m or ''
    def yer(mm):
        a, h, b = mm.groups()
        butun = mm.group(0)
        if not sozluk.kelime_mi(butun.lower()) and sozluk.kelime_mi(a + b):
            return a + b
        return butun
    return ICE_HARF.sub(yer, m or '')


def kisalt(m, n):
    """n karakteri asan metni sozcuk sinirindan keser, '…' ekler (toplam <= n)."""
    m = m or ''
    if len(m) <= n:
        return m
    kes = m[:n - 1]
    i = kes.rfind(' ')
    if i >= n * 0.6:
        kes = kes[:i]
    return kes.rstrip(' ,;:-–') + '…'


# ------------------------------------------------------------------ birlesik
def temizle_kok(kok, soru_no=0, korpus=None, sozluk=None):
    """Soru kokunu temizler; yonerge ise '' dondurur (cagiran kok_onar ile degistirir ya da atar)."""
    m = baslik_kirp(kok)
    if not m or yonerge_mi(m):
        return ''
    m = soruno_kirp(m)
    m = parca_onar(m, soru_no, korpus)
    m = soruno_kirp(baslik_kirp(m))          # korpustan gelen tam cumle de onek tasiyabilir
    m = tire_birlestir(m, sozluk)
    m = sof_duzelt(m)
    m = ice_harf_kirp(m, sozluk)
    m = kuyruk_harf_kirp(bosluk(m))
    return bosluk(m)


def temizle_sik(sk, sozluk=None):
    m = sik_baslik_kirp(sk)
    m = tire_birlestir(m, sozluk)
    m = sof_duzelt(m)
    return bosluk(m)


if __name__ == '__main__':
    import sys
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sz = Sozluk()
    ornekler = [
        'İşaretlediğiniz bir cevabı değiştirmek istediğinizde, sil- me işlemini çok iyi yapmanız gerektiğini unutmayınız.',
        'Bu test için verilen cevaplama süresi 150 dakikadır (2.5 saat).',
        "Ayşegül: I'm really concerned about the high consumption of fast food especially among teenagers. Nilgün: You're absolutely right.",
        '4) A growing number of people are ---- alternatives to antidepressant medications.',
        'Large collections Sof books are often unusable without careful attention to classification.',
        'The common crane is an extremely vocal species known for its distinctive, trumpet- like call and self- worth, well- paid, long- term, heart- related work.',
        'the resemblances between 20th- and the 21st century city design; pilot- to-controller; economic growth- will add; new- borns; pre- schoolers; anti- inflammatory; cutting- edge',
        'safety instructions. 2024 Sonbahar YDS Iceland is one of three countries',
        'Diğer sayfaya geçiniz. ÖSYM 2014-YDS İlkbahar/İNGİLİZCE Nancy: Hello',
    ]
    for o in ornekler:
        print('-', o[:100])
        print('   kok:', temizle_kok(o, 4, None, sz)[:140])
        print('   sik:', temizle_sik(o, sz)[:140])
    print('kisalt:', kisalt('a ' * 200, 260)[-10:], len(kisalt('a ' * 200, 260)))
    print('parca_onar:', parca_onar('yüzyılın başlarında Albert Einstein', 20, None))
