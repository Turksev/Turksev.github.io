# -*- coding: utf-8 -*-
"""
Kalici kelime aileleri manifesti  ->  data/aileler.js

Yayinin tek dogruluk kaynagi tools/aile-manifest.json dosyasidir. Yazimsal
sonek/onek kurallari aile YAYIMLAMAZ; yalniz insan incelemesine aday baglar
gosterebilir. Bu ayrim more/moral, injury/jury ve should/shoulder gibi bicimsel
olarak ikna edici ama anlamsal olarak yanlis baglarin sessizce canliya girmesini
engeller.

Kullanim:
  python tools/aile-cikar.py                 # data/aileler.js dosyasini uret
  python tools/aile-cikar.py --check         # dosyaya dokunmadan senkronu denetle
  python tools/aile-cikar.py --adaylari-goster  # yalniz onaysiz kural adaylari
"""
import argparse
import json
import os
import re
import sys
from collections import defaultdict

# Yeni bir sarmalayici kurmak yerine kodlamayi yerinde degistir: sarmalayici,
# betik baska bir yerden ice aktarildiginda alttaki tamponu kapatiyor.
sys.stdout.reconfigure(encoding='utf-8')

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VERI = os.path.join(SITE, 'data')
MANIFEST_YOLU = os.path.join(SITE, 'tools', 'aile-manifest.json')

# ---------------------------------------------------------------- kurallar

SONEK = [
    ('ly', ['', 'e', 'le']), ('ness', ['', 'e', 'y']),
    ('ility', ['le', 'il']), ('ity', ['', 'e', 'ous']),
    ('ation', ['e', '', 'ate']), ('ition', ['e', '']),
    ('tion', ['te', 't', '']), ('sion', ['de', 'd', 's', '']),
    ('ment', ['', 'e']), ('ance', ['', 'e', 'ant']), ('ence', ['', 'e', 'ent']),
    ('ancy', ['ant', '', 'e']), ('ency', ['ent', '', 'e']),
    ('able', ['', 'e', 'y']), ('ible', ['', 'e']),
    ('ive', ['e', '', 'ion']), ('ous', ['', 'e', 'y']),
    ('ful', ['', 'e']), ('less', ['', 'e']),
    ('ical', ['', 'e', 'y', 'ic']), ('ial', ['', 'e', 'y']), ('al', ['', 'e', 'y']),
    ('ic', ['', 'e', 'y']),
    ('isation', ['e', '']), ('ization', ['e', '']), ('ise', ['', 'e']), ('ize', ['', 'e']),
    ('er', ['', 'e']), ('or', ['', 'e']), ('ist', ['', 'e', 'y']), ('ism', ['', 'e']),
    ('ant', ['', 'e', 'ate']), ('ent', ['', 'e']),
    ('ary', ['', 'e']), ('ory', ['', 'e']), ('ate', ['', 'e']),
    ('ify', ['', 'e', 'y']), ('ship', ['']), ('hood', ['']), ('dom', ['']), ('age', ['', 'e']),
]

OLUMSUZ = ['un', 'in', 'im', 'ir', 'il', 'dis', 'non']
EN_KISA = 4

def tabanlar(w):
    """w'nin turetilmis olabilecegi olasi tabanlar (yalniz sonek yoluyla)."""
    out = set()
    for ek, donusum in SONEK:
        if not w.endswith(ek):
            continue
        govde = w[:-len(ek)]
        if len(govde) < EN_KISA - 1:
            continue
        adaylar = [govde + d for d in donusum]
        if len(govde) > 2 and govde[-1] == govde[-2]:          # running -> run
            adaylar += [govde[:-1] + d for d in donusum]
        if govde.endswith('i'):                                 # happiness -> happy
            adaylar.append(govde[:-1] + 'y')
        out.update(t for t in adaylar if len(t) >= EN_KISA)
    return out


# ---------------------------------------------------------------- veri

def dizini_oku():
    metin = open(os.path.join(VERI, 'kelime-dizin.js'), encoding='utf-8').read()
    kayit = {}
    desen = re.compile(r'\{e:"(.*?)",t:"(.*?)"(?:,p:([\d.]+))?,k:(\d),y:"(.*?)"\}')
    for en, tr, p, k, y in desen.findall(metin):
        kayit[en] = {'tr': tr, 'p': float(p) if p else None, 'k': int(k), 'y': y}
    return kayit


def turler(site, w):
    return set(re.split(r'[,/]\s*', site[w]['y'])) if w in site else set()


# ---------------------------------------------------------------- graf

def manifesti_oku(yol=MANIFEST_YOLU):
    """Kalici aile tabanini ve insan denetimli kararlari sikica denetle."""
    with open(yol, encoding='utf-8') as f:
        manifest = json.load(f)

    if manifest.get('schemaVersion') != 1:
        raise ValueError('aile manifesti schemaVersion=1 olmali')
    politika = manifest.get('policy')
    if not isinstance(politika, dict):
        raise ValueError('policy nesne olmali')
    if politika.get('source') != 'migrated-baseline':
        raise ValueError('policy.source migrated-baseline olmali')
    inceleme = politika.get('reviewStatus')
    if not isinstance(inceleme, dict):
        raise ValueError('policy.reviewStatus nesne olmali')
    if inceleme.get('approvedFamilies') != 'migrated-not-fully-reviewed':
        raise ValueError('approvedFamilies inceleme durumu gercegi yansitmali')
    for alan in ('requiredFamilies', 'forbiddenPairs'):
        if inceleme.get(alan) != 'human-reviewed':
            raise ValueError('%s inceleme durumu human-reviewed olmali' % alan)
    if politika.get('automaticRules') != 'candidate-only':
        raise ValueError('otomatik kurallar yalniz aday uretebilir')
    for alan in ('approvedFamilies', 'requiredFamilies'):
        if not isinstance(manifest.get(alan), dict):
            raise ValueError('%s nesne olmali' % alan)
    if not isinstance(manifest.get('forbiddenPairs'), list):
        raise ValueError('forbiddenPairs dizi olmali')

    kararlar = manifest.get('reviewedDecisions')
    if not isinstance(kararlar, dict):
        raise ValueError('reviewedDecisions nesne olmali')
    if kararlar.get('posSource') != 'data/kelime-dizin.js:y':
        raise ValueError('reviewedDecisions.posSource gecersiz')
    if kararlar.get('partsOfSpeechOrder') != 'matches-target-member-order':
        raise ValueError('partsOfSpeech sirasi hedef uye sirasi olmali')
    kanitlar = kararlar.get('evidenceCatalog')
    gerekceler = kararlar.get('reasonCatalog')
    if not isinstance(kanitlar, dict) or not isinstance(gerekceler, dict):
        raise ValueError('karar kanit/gerekce kataloglari nesne olmali')
    aile_kararlari = kararlar.get('requiredFamilies')
    yasak_kararlari = kararlar.get('forbiddenPairs')
    if not isinstance(aile_kararlari, dict) or not isinstance(yasak_kararlari, dict):
        raise ValueError('reviewedDecisions karar listeleri nesne olmali')
    if set(aile_kararlari) != set(manifest['requiredFamilies']):
        raise ValueError('requiredFamilies karar metadatasi bire bir eslesmiyor')

    def karari_denetle(hedef, karar, uyeler, beklenen):
        if not isinstance(karar, dict) or karar.get('decision') != beklenen:
            raise ValueError('%s karar turu %s olmali' % (hedef, beklenen))
        pos = karar.get('partsOfSpeech')
        if (not isinstance(pos, list) or len(pos) != len(uyeler) or
                not all(isinstance(x, str) and x.strip() for x in pos)):
            raise ValueError('%s POS listesi uye sirasi ile eslesmiyor' % hedef)
        if karar.get('evidence') not in kanitlar:
            raise ValueError('%s kanit kodu katalogda yok' % hedef)
        if karar.get('reason') not in gerekceler:
            raise ValueError('%s gerekce kodu katalogda yok' % hedef)

    for kok, uyeler in manifest['requiredFamilies'].items():
        karari_denetle('requiredFamilies/%s' % kok, aile_kararlari[kok],
                       uyeler, 'same-family')

    yasak_anahtarlari = ['|'.join(cift) for cift in manifest['forbiddenPairs']]
    if set(yasak_kararlari) != set(yasak_anahtarlari):
        raise ValueError('forbiddenPairs karar metadatasi bire bir eslesmiyor')
    for cift, anahtar in zip(manifest['forbiddenPairs'], yasak_anahtarlari):
        karari_denetle('forbiddenPairs/%s' % anahtar, yasak_kararlari[anahtar],
                       cift, 'keep-separate')

    eklenen_kartlar = kararlar.get('addedCards')
    if not isinstance(eklenen_kartlar, dict):
        raise ValueError('reviewedDecisions.addedCards nesne olmali')
    roller = {'metin', 'soru_koku', 'dogru_secenek', 'celdirici'}
    for kelime, karar in eklenen_kartlar.items():
        if not isinstance(karar, dict) or karar.get('decision') != 'add':
            raise ValueError('addedCards/%s karar turu add olmali' % kelime)
        kok = karar.get('familyRoot')
        if kok not in manifest['requiredFamilies'] or kelime not in manifest['requiredFamilies'][kok]:
            raise ValueError('addedCards/%s aile bagina sahip degil' % kelime)
        uyeler = karar.get('familyMembers')
        if (not isinstance(uyeler, list) or len(uyeler) < 2 or uyeler[0] != kelime or
                not set(uyeler) <= set(manifest['requiredFamilies'][kok])):
            raise ValueError('addedCards/%s familyMembers manifestle uyusmuyor' % kelime)
        if not isinstance(karar.get('partOfSpeech'), str) or not karar['partOfSpeech'].strip():
            raise ValueError('addedCards/%s POS eksik' % kelime)
        puan = karar.get('source_score')
        if (not isinstance(puan, (int, float)) or
                karar.get('displayScore') != round(float(puan), 1)):
            raise ValueError('addedCards/%s source_score/displayScore gecersiz' % kelime)
        if (not isinstance(karar.get('exams'), int) or karar['exams'] < 0 or
                not isinstance(karar.get('freq'), int) or karar['freq'] < 0):
            raise ValueError('addedCards/%s exams/freq gecersiz' % kelime)
        kaynaklar = karar.get('source_refs')
        if not isinstance(kaynaklar, list) or len(kaynaklar) != karar['exams']:
            raise ValueError('addedCards/%s source_refs sayisi exams ile uyusmuyor' % kelime)
        sinavlar = set()
        for ref in kaynaklar:
            if (not isinstance(ref, dict) or
                    set(ref) != {'exam_id', 'page', 'question', 'surface', 'role'} or
                    ref.get('role') not in roller):
                raise ValueError('addedCards/%s source_ref gecersiz' % kelime)
            sinavlar.add(ref.get('exam_id'))
        if len(sinavlar) != karar['exams']:
            raise ValueError('addedCards/%s benzersiz sinav sayisi gecersiz' % kelime)
        if (not isinstance(karar.get('reason'), str) or not karar['reason'].strip() or
                not isinstance(karar.get('batchId'), str) or not karar['batchId'].strip()):
            raise ValueError('addedCards/%s reason/batchId eksik' % kelime)

    temel_uye = {}
    for alan in ('approvedFamilies', 'requiredFamilies'):
        for kok, uyeler in manifest[alan].items():
            if not isinstance(kok, str) or not isinstance(uyeler, list) or len(uyeler) < 2:
                raise ValueError('%s/%s en az iki uyeli bir dizi olmali' % (alan, kok))
            if kok not in uyeler:
                raise ValueError('%s/%s: kok uyeler arasinda olmali' % (alan, kok))
            if len(uyeler) != len(set(uyeler)):
                raise ValueError('%s/%s: yinelenen uye var' % (alan, kok))
            for uye in uyeler:
                if not isinstance(uye, str) or not re.fullmatch(r"[a-z][a-z' -]*", uye):
                    raise ValueError('%s/%s: gecersiz uye %r' % (alan, kok, uye))
                # Zorunlu aileler temel aileleri bilerek birlestirebilir; iki
                # ayri temel ailede ayni uye ise manifest belirsizdir.
                if alan == 'approvedFamilies' and uye in temel_uye:
                    raise ValueError('%s iki temel ailede: %s, %s'
                                     % (uye, temel_uye[uye], kok))
                if alan == 'approvedFamilies':
                    temel_uye[uye] = kok

    yasak = set()
    for i, cift in enumerate(manifest['forbiddenPairs']):
        if (not isinstance(cift, list) or len(cift) != 2 or
                not all(isinstance(x, str) for x in cift) or cift[0] == cift[1]):
            raise ValueError('forbiddenPairs[%d] iki farkli kelime olmali' % i)
        anahtar = tuple(sorted(cift))
        if anahtar in yasak:
            raise ValueError('yinelenen yasak bag: %s / %s' % anahtar)
        yasak.add(anahtar)

    return manifest


def karar_poslarini_dogrula(site, manifest):
    """Manifestte kayitli POS kanitini mevcut kart diziniyle eslestir."""
    kararlar = manifest['reviewedDecisions']
    for kok, uyeler in manifest['requiredFamilies'].items():
        pos = kararlar['requiredFamilies'][kok]['partsOfSpeech']
        for uye, beklenen in zip(uyeler, pos):
            if uye in site and site[uye]['y'] != beklenen:
                raise ValueError('%s POS kaniti kartla eslesmiyor: %s != %s'
                                 % (uye, beklenen, site[uye]['y']))
    for cift in manifest['forbiddenPairs']:
        pos = kararlar['forbiddenPairs']['|'.join(cift)]['partsOfSpeech']
        for uye, beklenen in zip(cift, pos):
            if uye in site and site[uye]['y'] != beklenen:
                raise ValueError('%s POS kaniti kartla eslesmiyor: %s != %s'
                                 % (uye, beklenen, site[uye]['y']))
    for kelime, karar in kararlar.get('addedCards', {}).items():
        if kelime in site and site[kelime]['y'] != karar['partOfSpeech']:
            raise ValueError('%s ek kart POS kaniti kartla eslesmiyor: %s != %s'
                             % (kelime, karar['partOfSpeech'], site[kelime]['y']))


def _birlesim_yapisi(site):
    ebeveyn = {w: w for w in site}

    def bul(x):
        while ebeveyn[x] != x:
            ebeveyn[x] = ebeveyn[ebeveyn[x]]
            x = ebeveyn[x]
        return x

    def birlestir(a, b):
        ra, rb = bul(a), bul(b)
        if ra != rb:
            ebeveyn[ra] = rb

    return bul, birlestir


def aileleri_kur(site, manifest):
    """Yalniz manifestte kalici olarak kaydedilmis gruplari birlestir.

    approvedFamilies onceki yayindan tasinmis tabandir ve her uyesi dizinde
    bulunmalidir. requiredFamilies insan denetimli kararlar ile gelecekte eklenecek
    kartlari da yazabilir; yalniz o anda dizinde bulunan uyeler yayina girer.
    Boylece yeni kart eklendiginde sezgisel ek soyma gerekmeden dogru ailesine katilir.
    """
    bul, birlestir = _birlesim_yapisi(site)
    kok_tercihleri = []

    for sira, (kok, uyeler) in enumerate(manifest['approvedFamilies'].items()):
        eksik = [w for w in uyeler if w not in site]
        if eksik:
            raise ValueError('%s temel ailesinin dizinde eksik uyesi: %s'
                             % (kok, ', '.join(eksik)))
        for uye in uyeler[1:]:
            birlestir(uyeler[0], uye)
        kok_tercihleri.append((1, sira, kok))

    for sira, (kok, uyeler) in enumerate(manifest['requiredFamilies'].items()):
        mevcut = [w for w in uyeler if w in site]
        for uye in mevcut[1:]:
            birlestir(mevcut[0], uye)
        if kok in site:
            kok_tercihleri.append((0, sira, kok))

    for a, b in manifest['forbiddenPairs']:
        if a in site and b in site and bul(a) == bul(b):
            raise ValueError('yasak aile bagi olustu: %s / %s' % (a, b))

    gruplar = defaultdict(list)
    for w in site:
        gruplar[bul(w)].append(w)

    kayitlar = []
    for temsilci, uyeler in gruplar.items():
        if len(uyeler) < 2:
            continue
        kokler = [(oncelik, sira, kok) for oncelik, sira, kok in kok_tercihleri
                  if kok in site and bul(kok) == temsilci]
        if not kokler:
            raise ValueError('kok tercihi olmayan aile: %s' % ', '.join(sorted(uyeler)))
        kok = min(kokler)[2]
        sirali = sorted(uyeler, key=lambda w: (-(site[w]['p'] or 0), w))
        kayitlar.append({'k': kok, 'u': sirali})

    kayitlar.sort(key=lambda a: (-len(a['u']), -(site[a['k']]['p'] or 0), a['k']))
    return kayitlar


def aday_baglarini_bul(site, manifest):
    """Eski yazim kurallarindan inceleme adayi uret; aileleri degistirmez."""
    yasak = {tuple(sorted(x)) for x in manifest['forbiddenPairs']}
    adaylar = {}
    for w in sorted(site):
        if not re.fullmatch(r'[a-z]+', w):
            continue
        for taban in sorted(tabanlar(w)):
            if taban in site and taban != w and tuple(sorted((w, taban))) not in yasak:
                adaylar[(w, taban)] = 'sonek'
        for on in OLUMSUZ:
            if not w.startswith(on) or len(w) - len(on) < EN_KISA:
                continue
            taban = w[len(on):]
            if (taban in site and tuple(sorted((w, taban))) not in yasak and
                    turler(site, w) & turler(site, taban)):
                adaylar[(w, taban)] = 'onek'
    return [(a, b, tip) for (a, b), tip in sorted(adaylar.items())]


# ---------------------------------------------------------------- yazim

def yaz(yol, icerik):
    with open(yol, 'w', encoding='utf-8', newline='\n') as f:
        f.write(icerik)


def icerik_uret(kayitlar):
    govde = ',\n'.join(
        '{k:%s,u:%s}' % (json.dumps(a['k'], ensure_ascii=False),
                         json.dumps(a['u'], ensure_ascii=False))
        for a in kayitlar)

    basli = (
        '/* ============================================================\n'
        '   Kelime aileleri — %d aile, %d kelime\n'
        '   Alanlar: k = ailenin başı, u = üyeler (puana göre sıralı)\n'
        '   Üyelerin anlam ve örnek cümleleri katman dosyalarındadır.\n'
        '   Tek kaynak: tools/aile-manifest.json; otomatik ek kuralları yayına girmez.\n'
        '   tools/aile-cikar.py ile üretilir; elle düzenleme.\n'
        '   ============================================================ */\n\n'
        'window.AILELER = [\n' % (len(kayitlar), sum(len(a['u']) for a in kayitlar))
    )
    return basli + govde + '\n];\n'


def adaylari_goster(site, manifest, kayitlar):
    aile_no = {}
    for i, aile in enumerate(kayitlar):
        for uye in aile['u']:
            aile_no[uye] = i
    adaylar = [(a, b, tip) for a, b, tip in aday_baglarini_bul(site, manifest)
               if not (aile_no.get(a) is not None and
                       aile_no.get(a) == aile_no.get(b))]
    print('Onaysız otomatik aday: %d' % len(adaylar))
    for a, b, tip in adaylar:
        print('  %-12s %-22s -> %s' % (tip, a, b))


def main(argv=None):
    parser = argparse.ArgumentParser(description='Kalıcı manifestten kelime aileleri üretir.')
    kip = parser.add_mutually_exclusive_group()
    kip.add_argument('--check', action='store_true',
                     help='data/aileler.js manifestle aynı mı; dosyaya yazma')
    kip.add_argument('--adaylari-goster', action='store_true',
                     help='otomatik kuralların onaysız adaylarını göster; dosyaya yazma')
    args = parser.parse_args(argv)

    site = dizini_oku()
    manifest = manifesti_oku()
    karar_poslarini_dogrula(site, manifest)
    kayitlar = aileleri_kur(site, manifest)
    icerik = icerik_uret(kayitlar)
    yol = os.path.join(VERI, 'aileler.js')

    if args.adaylari_goster:
        adaylari_goster(site, manifest, kayitlar)
        return 0

    if args.check:
        mevcut = open(yol, encoding='utf-8').read() if os.path.exists(yol) else ''
        if mevcut != icerik:
            print('HATA: data/aileler.js manifestten üretilen içerikle eşleşmiyor.')
            print('Düzeltmek için: python tools/aile-cikar.py')
            return 1
        print('Aile manifesti ve data/aileler.js senkron.')
        return 0

    yaz(yol, icerik)

    kapsanan = sum(len(a['u']) for a in kayitlar)
    boy = defaultdict(int)
    for a in kayitlar:
        boy[min(len(a['u']), 8)] += 1

    print('Kaynak   : tools/aile-manifest.json (taşınmış taban + insan denetimli kararlar)')
    print('Karar    : %d temel aile + %d zorunlu aile + %d yasak bağ'
          % (len(manifest['approvedFamilies']), len(manifest['requiredFamilies']),
             len(manifest['forbiddenPairs'])))
    print('Aile     : %d · kapsanan kelime: %d (%%%d)'
          % (len(kayitlar), kapsanan, kapsanan / len(site) * 100))
    print('Büyüklük :', dict(sorted(boy.items())))
    print('Dosya    : %.0f KB' % (os.path.getsize(yol) / 1024))
    print('\nEn büyük 6 aile:')
    for a in kayitlar[:6]:
        print('  %-16s %s' % (a['k'], ' · '.join(a['u'])))


if __name__ == '__main__':
    sys.exit(main())
