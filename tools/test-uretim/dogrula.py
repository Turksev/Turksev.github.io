# -*- coding: utf-8 -*-
"""dogrula.js'in Python surumu (node kaldirildi).

  python dogrula.py            -> rapor + data/test-k{n}.js uretimi
  python dogrula.py --rapor    -> yalniz rapor
  python dogrula.py --karakter-testi -> Turkce karakter regresyon fixture'i
"""
import io
import json
import os
import re
import sys

import cekim

SITE = cekim.SITE
BURASI = os.path.dirname(os.path.abspath(__file__))
GIRDI = os.path.join(BURASI, 'girdi')
CIKTI = os.path.join(BURASI, 'cikti')
YALNIZ_RAPOR = '--rapor' in sys.argv
KARAKTER_TESTI = '--karakter-testi' in sys.argv
BICIMLER = ['', 's', 'past', 'pp', 'ing', 'pl']

# Türkçe çevirinin tamamını yalnızca "özel harf var mı?" diye sınamak doğru
# değildir: "Meral her sabah erken kalkar." gibi kusursuz bir cümlede ç, ğ, ı,
# ö, ş veya ü bulunmayabilir. Bunun yerine, 2026-08 düzeltmesinde gerçekten
# ASCII'ye düşmüş 140 kayıttan türetilen kesin bozulma biçimlerini arıyoruz.
# Sözcükler tam eşleşir; örneğin doğru Türkçe "aksam" (parçalar) bilerek yoktur.
ASCII_TURKCE_KAYIP_IMZALARI = frozenset({
    'acik', 'actigi', 'agac', 'aliskanliklarina', 'aninda', 'arasindaki',
    'arsivin', 'asagi', 'bagirsak', 'baska', 'basindan', 'bicimde', 'birkac',
    'cikmasini', 'cogu', 'cunku', 'dayaniyordu', 'degil', 'doga',
    'elestirmenler', 'erzaginin', 'farkli', 'gecici', 'genisleyen',
    'gosterir', 'gozlemevi', 'hicbir', 'icinde', 'icin', 'iktisatcilar',
    'inanilan', 'islek', 'kararlastirdi', 'kokten', 'kurami', 'mutevelliler',
    'oldugunu', 'ortacag', 'osmanli', 'surucunun', 'savas', 'tereddutsuz',
    'teskilatini', 'tulumbayi', 'uretilmeden', 'yalnizca',
    'yetistiriciliginin', 'yogunlugunun', 'yonetimi', 'yonetmelikleri',
    'yuzden',
})

sys.stdout.reconfigure(encoding='utf-8')


def turkce_karakter_kaybi_imzalari(metin):
    """Kesin ASCII-kaybı sözcüklerini döndürür; salt diakritik yokluğunu hata saymaz."""
    kelimeler = set(re.findall(r'[a-z]+', str(metin or '').lower()))
    return sorted(kelimeler & ASCII_TURKCE_KAYIP_IMZALARI)


def turkce_yazim_sorunlari(ingilizce, turkce):
    """Bağlama göre güvenle ayırt edilebilen Türkçe yazım sorunlarını döndürür."""
    kaynak = str(ingilizce or '')
    ceviri = str(turkce or '')
    sorunlar = []
    # “hala” akrabalık adıdır; “still” karşılığı ise şapkalı “hâlâ” yazılır.
    if (re.search(r'(?<!\w)hala(?!\w)', ceviri, re.I)
            and not re.search(r'\baunt(?:ie|y)?s?\b', kaynak, re.I)):
        sorunlar.append("'hâlâ' yerine 'hala'")
    return sorunlar


def karakter_regresyon_testi():
    yol = os.path.join(BURASI, 'turkce-karakter-fixtur.json')
    veri = json.load(io.open(yol, encoding='utf-8'))
    hatalar = []
    for kayit in veri['bozuk']:
        if (not turkce_karakter_kaybi_imzalari(kayit['tr'])
                and not turkce_yazim_sorunlari(kayit.get('en', ''), kayit['tr'])):
            hatalar.append('yakalanmadı: ' + kayit['ad'])
    for kayit in veri['gecerli']:
        bulunan = turkce_karakter_kaybi_imzalari(kayit['tr'])
        yazim = turkce_yazim_sorunlari(kayit.get('en', ''), kayit['tr'])
        if bulunan or yazim:
            hatalar.append('yanlış alarm: %s (%s)' % (
                kayit['ad'], ', '.join(bulunan + yazim)))
    if hatalar:
        raise AssertionError('; '.join(hatalar))
    print('Türkçe karakter regresyon testi: %d bozuk yakalandı, %d geçerli geçti' % (
        len(veri['bozuk']), len(veri['gecerli'])))


if KARAKTER_TESTI:
    karakter_regresyon_testi()
    raise SystemExit(0)

ICERIK_REGRESYONLARI = {
    kayit['e']: kayit for kayit in json.load(io.open(
        os.path.join(BURASI, 'test-ceviri-regresyon.json'), encoding='utf-8'))
}

# --- kelime dizini ---
dizin = {}
_src = io.open(os.path.join(SITE, 'data', 'kelime-dizin.js'), encoding='utf-8').read()
for m in re.finditer(r'\{e:"(.*?)",t:"(.*?)"(?:,p:([\d.]+))?,k:(\d),y:"(.*?)"\}', _src):
    dizin[m.group(1)] = {'e': m.group(1), 't': m.group(2), 'k': int(m.group(4)), 'y': m.group(5)}


def kok_deseni(e):
    kok = e if len(e) <= 4 else e[:max(4, len(e) - 2)]
    return re.compile(r'\b' + re.escape(kok) + r'\w*', re.I)


def benzer(a, b):
    A = set(re.findall(r"[a-z']+", a.lower()))
    B = set(re.findall(r"[a-z']+", b.lower()))
    if not A or not B:
        return 0.0
    return len(A & B) / max(1, min(len(A), len(B)))


sonuc, hatalar, eksik, elenen = {}, [], [], []
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
        d = dizin.get(e)
        # Elenen kelime (tools/kelime-eleme.js) artık dizinde yok: test cümlesi de yazılmaz.
        if not d:
            elenen.append(e)
            continue
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
            sorunlar.append('çekim uyumsuz: %s+%s ≠ %s' % (e, f, b))
        if f and d:
            if ('isim' not in d['y']) if f == 'pl' else ('fiil' not in d['y']):
                sorunlar.append('tür-biçim çelişkisi: %s / %s' % (d['y'], f))
        if kok_deseni(e).search(c.replace('----', ' ')):
            sorunlar.append('kök cümlede tekrar')
        for o in g.get('ornek') or []:
            if benzer(c.replace('----', b), o) > 0.6:
                sorunlar.append('kart örneğine benziyor')
                break
        if len(tr) < 20:
            sorunlar.append('çeviri yok/kısa')
        kayip_imzalari = turkce_karakter_kaybi_imzalari(tr)
        if kayip_imzalari:
            sorunlar.append('çeviride Türkçe karakter kaybı: ' + ', '.join(kayip_imzalari))
        yazim_sorunlari = turkce_yazim_sorunlari(c.replace('----', b), tr)
        if yazim_sorunlari:
            sorunlar.append('çeviride Türkçe yazım sorunu: ' + ', '.join(yazim_sorunlari))
        regresyon = ICERIK_REGRESYONLARI.get(e)
        if regresyon:
            tr_kucuk = tr.casefold()
            for parca in regresyon.get('icerir', []):
                if parca.casefold() not in tr_kucuk:
                    sorunlar.append('çeviri regresyonu, eksik ifade: ' + parca)
            for parca in regresyon.get('icermez', []):
                if parca.casefold() in tr_kucuk:
                    sorunlar.append('çeviri regresyonu, yasak ifade: ' + parca)
        if re.search(r'[“”‘’—]', c):
            sorunlar.append('tipografik işaret')
        if sorunlar:
            hatalar.append('%s %s: %s' % (ad, e, '; '.join(sorunlar)))
            continue
        gecen += 1
        k = d['k'] if d else 0
        sonuc.setdefault(k, {})[e] = {'c': c, 'b': b, 'f': f, 'tr': tr}

print('toplam %d  geçen %d  hatalı %d  eksik paket %d%s' % (
    toplam, gecen, len(hatalar), len(eksik),
    ('  elenen %d' % len(elenen)) if elenen else ''))
for x in eksik:
    print('  EKSIK', x)
for h in hatalar:
    print('  HATA', h)
io.open(os.path.join(BURASI, 'hatalar.txt'), 'w', encoding='utf-8').write('\n'.join(eksik + hatalar))


def js(v):
    return json.dumps(v, ensure_ascii=False)


if not YALNIZ_RAPOR:
    for k in sorted(sonuc):
        kayitlar = sonuc[k]
        satirlar = ['%s:{c:%s,b:%s,f:%s,tr:%s}' % (js(e), js(v['c']), js(v['b']), js(v['f']), js(v['tr']))
                    for e, v in sorted(kayitlar.items())]
        icerik = (
            '/* %d. katman — günün testi cümleleri · %d kelime\n'
            '   Karttaki örnekten bağımsız, YDS düzeyinde boşluk doldurma cümleleri.\n'
            '   Alanlar: c=boşluklu cümle, b=boşluğa gelen biçim, f=çekim türü, tr=Türkçesi.\n'
            '   Üretim: scratchpad/test (agent yazımı + dogrula.py); elle düzenleme yerine oradan yeniden üret. */\n\n'
            'window.TEST_K%d = {\n' % (k, len(satirlar), k)
        ) + ',\n'.join(satirlar) + '\n};\n'
        io.open(os.path.join(SITE, 'data', 'test-k%d.js' % k), 'w', encoding='utf-8', newline='\n').write(icerik)
        print('yazıldı data/test-k%d.js (%d)' % (k, len(satirlar)))
