# -*- coding: utf-8 -*-
"""
Olumsuz karsiliklar  ->  data/olumsuzlar.js

Sitedeki her kelime icin, olumsuzluk ekiyle uretilmis ve GERCEKTEN var olan
karsiligi bulur: sufficient -> insufficient, regular -> irregular, home -> homeless.

Uydurma form uretmemek icin her aday uc suzgecten gecer:
  1. Master sozlukte var, arkaik degil, Zipf >= 2.5 (gercekten kullanilan kelime)
  2. Tur ortusmesi (door/indoor gibi eslesmeler elenir)
  3. Ingilizce tanimda olumsuzluk isareti (not / without / lacking / …)

Bu uc suzgec de yetmiyor; 276 aday tek tek okundu ve olumsuzluk OLMAYAN
17 tanesi ENGELLI listesine yazildi (come->income, cover->discover,
famous->infamous gibi). Ozellikle interested->disinterested bilerek
cikarildi: disinterested "ilgisiz" degil "tarafsiz" demektir, olumsuz diye
gostermek yanlis ogretirdi.

Kullanim:
  "C:/Users/Trk/Desktop/english claude/.venv/Scripts/python.exe" tools/olumsuz-cikar.py
"""
import csv
import io
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
ARAC = os.path.dirname(os.path.abspath(__file__))
MASTER = r'C:\Users\Trk\Desktop\english claude\04_cikti\YDS_Kelime_Listesi_master.csv'

ZIPF_ESIK = 2.5
ONEK = ['un', 'in', 'im', 'ir', 'il', 'dis', 'non']

# Uc suzgeci de gecen ama olumsuzluk OLMAYAN eslesmeler (elle denetlendi)
ENGELLI = {
    ('case', 'incase'), ('come', 'income'), ('corporate', 'incorporate'),
    ('cover', 'discover'), ('appointment', 'disappointment'),
    ('difference', 'indifference'), ('famous', 'infamous'),
    ('field', 'infield'), ('flow', 'inflow'), ('interested', 'disinterested'),
    ('migrate', 'immigrate'), ('patch', 'dispatch'), ('patient', 'inpatient'),
    ('place', 'displace'), ('position', 'imposition'), ('sight', 'insight'),
    ('cool', 'uncool'),
}

TUR_ESLEME = {'noun': 'isim', 'verb': 'fiil', 'adjective': 'sıfat',
              'adverb': 'zarf', 'preposition': 'edat', 'conjunction': 'bağlaç'}

OLUMSUZ_ISARET = re.compile(
    r'\b(not|non|without|lacking|lack of|absence|absent|failure to|'
    r'opposite|contrary|deprived|devoid|no longer|inability|unable|un\w+)\b')


def dizini_oku():
    metin = open(os.path.join(VERI, 'kelime-dizin.js'), encoding='utf-8').read()
    kayit = {}
    for m in re.finditer(r'\{e:"(.*?)",t:"(.*?)"(?:,p:([\d.]+))?,k:(\d),y:"(.*?)"\}', metin):
        en, tr, p, k, y = m.groups()
        kayit[en] = {'tr': tr, 'p': float(p) if p else None, 'k': int(k), 'y': y}
    return kayit


def elle_yazilan_oku():
    """tools/ek-olumsuzlar.js — sitede olmayan olumsuz formlarin Turkce karsiliklari."""
    yol = os.path.join(ARAC, 'ek-olumsuzlar.js')
    if not os.path.exists(yol):
        return {}
    metin = open(yol, encoding='utf-8').read()
    bas = metin.index('{', metin.index('EK_OLUMSUZLAR'))
    govde = metin[bas:metin.rindex('}') + 1]
    # Bolum basliklari icin /* … */ yorumu konabiliyor; JSON bunlari kabul etmez.
    govde = re.sub(r'/\*.*?\*/', '', govde, flags=re.S)
    return json.loads(govde)


def masteri_oku():
    kayit = {}
    with open(MASTER, encoding='utf-8-sig', newline='') as f:
        for r in csv.DictReader(f):
            w = r['kelime']
            if not re.fullmatch(r'[a-z]+', w):
                continue
            try:
                zipf, puan = float(r['zipf'] or 0), float(r['puan'])
            except ValueError:
                continue
            k = kayit.setdefault(w, {'puan': puan, 'zipf': zipf, 'turler': set(),
                                     'tanim': [], 'arkaik': r['arkaik_bayragi']})
            k['puan'] = max(k['puan'], puan)
            k['turler'].add(TUR_ESLEME.get(r['tur'], r['tur']))
            if r['tanim']:
                k['tanim'].append(r['tanim'].lower())
    return kayit


def adaylar(w):
    out = [(on + w, on + '-') for on in ONEK]
    out.append((w + 'less', '-less'))
    if w.endswith('y'):
        out.append((w[:-1] + 'iless', '-less'))
    if w.endswith('e'):
        out.append((w[:-1] + 'less', '-less'))
    return out


def main():
    site = dizini_oku()
    master = masteri_oku()
    elle = elle_yazilan_oku()

    sonuc = {}
    turkcesi_yok = []
    sayac = defaultdict(int)

    for w in sorted(site):
        if not re.fullmatch(r'[a-z]+', w) or len(w) < 4:
            continue
        gorulen = set()
        site_turleri = set(re.split(r'[,/]\s*', site[w]['y']))

        for aday, ek in adaylar(w):
            if aday in gorulen or aday == w or (w, aday) in ENGELLI:
                continue
            gorulen.add(aday)

            m = master.get(aday)
            if not m or m['arkaik'] == '1' or m['zipf'] < ZIPF_ESIK:
                continue
            if not (site_turleri & m['turler']):
                continue
            tanim = ' '.join(m['tanim'])
            if not tanim or not OLUMSUZ_ISARET.search(tanim):
                continue

            # Turkce karsilik: once sitedeki kaydindan, yoksa elle yazilandan
            if aday in site:
                tr = site[aday]['tr']
            elif aday in elle:
                tr = elle[aday]
            else:
                turkcesi_yok.append((w, aday, m['puan'], tanim[:60]))
                continue

            sonuc.setdefault(w, []).append({'f': aday, 'tr': tr, 'ek': ek,
                                            'sitede': aday in site})
            sayac[ek] += 1

    govde = ',\n'.join(
        '%s:[%s]' % (json.dumps(w, ensure_ascii=False),
                     ','.join('{f:%s,tr:%s%s}' % (
                         json.dumps(x['f'], ensure_ascii=False),
                         json.dumps(x['tr'], ensure_ascii=False),
                         ',s:1' if x['sitede'] else '') for x in v))
        for w, v in sorted(sonuc.items()))

    toplam = sum(len(v) for v in sonuc.values())
    basli = (
        '/* ============================================================\n'
        '   Olumsuz karşılıklar — %d kelime, %d form\n'
        '   Alanlar: anahtar = kelime, f = olumsuz biçim, tr = Türkçe karşılık,\n'
        '            s:1 = bu biçim sitede ayrı bir kelime olarak da var\n'
        '   tools/olumsuz-cikar.py ile üretilir; elle düzenleme.\n'
        '   ============================================================ */\n\n'
        'window.OLUMSUZLAR = {\n' % (len(sonuc), toplam)
    )
    yol = os.path.join(VERI, 'olumsuzlar.js')
    with open(yol, 'w', encoding='utf-8', newline='\n') as f:
        f.write(basli + govde + '\n};\n')

    print('Kelime           :', len(sonuc))
    print('Olumsuz form     :', toplam)
    print('  sitede olan    :', sum(1 for v in sonuc.values() for x in v if x['sitede']))
    print('Eke göre         :', dict(sorted(sayac.items(), key=lambda x: -x[1])))
    print('Dosya            : %.0f KB' % (os.path.getsize(yol) / 1024))

    if turkcesi_yok:
        print('\nTÜRKÇESİ YAZILMAMIŞ %d FORM — tools/ek-olumsuzlar.js dosyasına ekle:' % len(turkcesi_yok))
        turkcesi_yok.sort(key=lambda t: -t[2])
        for w, aday, puan, tanim in turkcesi_yok:
            print('  "%s": "",%s// %s ← %s · %s' % (
                aday, ' ' * max(1, 22 - len(aday)), aday, w, tanim))


if __name__ == '__main__':
    main()
