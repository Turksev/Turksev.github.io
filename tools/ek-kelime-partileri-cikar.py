# -*- coding: utf-8 -*-
"""Yayımlanmış veride olup listeyi-aktar.py'nin ana kaynaklarından üretilmeyen
kelime ve öbekleri tam kart verisiyle bir "ek kelime partisi"ne çıkarır.

Kullanım (openpyxl gerektiği için kaynak projenin sanal ortamıyla):
  "C:\\Users\\Trk\\Desktop\\YDS\\03_calisma_listesi\\.venv\\Scripts\\python.exe" \\
      tools/ek-kelime-partileri-cikar.py [--parti-id AD] [--arsiv DIZIN] [--kuru]

Ne yapar:
  1. listeyi-aktar.py'yi içe aktarır ve ek partiler OLMADAN (ek_partileri=[])
     birlestir() / obekleri_topla() çağırır. Böylece "ana kaynak kümesi"
     (xlsx + ek-kelimeler.js + ek-aile-uyeleri.js + aile-kart-partileri +
     modal-kartlar.json + düzeltmeler) betiğin kendi mantığıyla çıkar.
  2. data/kelime-dizin.js, data/kelime-k1..k7.js ve data/obekler.js dosyalarını
     JS çalıştırmadan okur (anahtarlar tırnaklanıp JSON olarak ayrıştırılır).
  3. Yayımlanmış olup üretilmeyen kayıtları dizin alanları (t, p, k, y) ve tam
     kart (a, kl, es) ile tools/ek-kelime-partileri/<parti_id>.json dosyasına
     yazar. Çıktı listeyi-aktar.py'nin ek_kelime_partilerini_oku() şemasıdır.
  4. Arşivdeki NIHAI_KELIME.csv, NIHAI2023_KELIME.csv, ONERILEN_TUREVLER.csv,
     NIHAI_OBEK.csv, NIHAI2023_OBEK.csv ve eksik_turevler2.json bulunursa her
     kayda grup (g) ve telifsiz kanıt (kanit: sınav kimliği | rol | soru |
     sayfa, sınav sayısı, yıllar, zipf) ekler; tools/aile-kart-bekleyenler.json
     içindeki exam-evidence-add kararları da kanıta işlenir.

Kaynak dosyalara YAZILMAZ; yalnız parti dosyası yazılır.
"""

from pathlib import Path as _YdsPath
import sys as _yds_sys
_yds_site = next(p for p in _YdsPath(__file__).resolve().parents if (p / "sw.js").is_file())
_yds_sys.path.insert(0, str(_yds_site / "tools"))
from yds_paths import site_path, yds_path, scratch_path
import argparse
import collections
import csv
import importlib.util
import json
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

ARACLAR = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(ARACLAR)
VERI = os.path.join(SITE, 'data')
ARSIV_VARSAYILAN = yds_path('03_calisma_listesi', '06_sandbox_2026-09')
PARTI_ID_VARSAYILAN = '2026-09-05_denetim-A2_korunan'

GRUPLAR = collections.OrderedDict([
    ('tam-kitapcik-2024-2026', {
        'aciklama': (
            'YDS 2024/1, 2024/2, 2025/1, 2025/2, 2025/İngilizce ve 2026/1 tam '
            'kitapçıklarından (3 Eylül 2026 arşivi; resmî %10 yayınıyla 8/8 çapraz '
            'doğrulama) çıkarılıp 4 Eylül 2026\'da siteye eklenen kelime ve öbekler. '
            'Kaynak notu: data/KAYNAK_2026-09-04_yeni_sinavlar.md; commit ac72df1. '
            'Puan, a45 formülünün ham değeridir (sandbox puanlama.sqlite); katman puan '
            'bandıyla verildi, taban 6 (7 verilmedi: sınav metninde bizzat geçen '
            'kelimeler, aile dolgusu değil).'),
        'kaynak_csv': 'NIHAI_KELIME.csv / NIHAI_OBEK.csv (06_sandbox_2026-09)',
    }),
    ('gorsel-transkript-2023', {
        'aciklama': (
            'YDS 2023/1 ve 2023/2 kitapçıklarının sayfa görüntülerinden görsel '
            'transkriptle çıkarılıp 5 Eylül 2026\'da eklenen kelime ve öbekler '
            '(commit 4b58364; arşiv: 06_sandbox_2026-09/kartlar2023, transkript/, '
            'sayfalar/). Puan ve katman kuralı 2024-2026 grubuyla aynıdır (taban 6).'),
        'kaynak_csv': 'NIHAI2023_KELIME.csv / NIHAI2023_OBEK.csv (06_sandbox_2026-09)',
    }),
    ('aile-turevi-zipf', {
        'aciklama': (
            'Sitedeki kelime ailelerinin eksik türevleri: sözlük türetmeleriyle bulunup '
            'Zipf >= 3,0 süzgecinden geçen 74 türev (5 Eylül 2026, commit e238e36; '
            'turev_filtre.py -> ONERILEN_TUREVLER.csv -> turev_ekle.py). Sınavda '
            'geçmedikleri için puan yalnız P bileşenidir (100 x 0,30 x 0,5 x '
            'min(zipf/7, 1)); katman 7 (Aile üyeleri). dc8891b ile 6\'sı '
            '(disposition, harmonic, spiritually, fondly, connective, dispenser) '
            'test havuzu eşitlemesinde düşürüldü; bu partide 68 kalır.'),
        'kaynak_csv': 'ONERILEN_TUREVLER.csv + eksik_turevler2.json (06_sandbox_2026-09)',
    }),
    ('kaynagi-belirsiz', {
        'aciklama': (
            'Yayımlanmış veride bulunan ama arşiv CSV\'lerinin hiçbirinde izi '
            'çıkmayan kayıtlar; kaynağı elle araştırılmalıdır.'),
    }),
])
GRUP_SIRASI = {g: i for i, g in enumerate(GRUPLAR)}


# ---------------------------------------------------------------- JS veri okuma

def js_govde(metin, degisken):
    i = metin.index(degisken)
    j = metin.index('=', i)
    k = j + 1
    while metin[k] in ' \t\r\n':
        k += 1
    kapa = ']' if metin[k] == '[' else '}'
    return metin[k:metin.rindex(kapa) + 1]


def js_json(s):
    """Tırnaksız nesne anahtarlarını tırnaklar; dize içlerine dokunmaz."""
    out = []
    i, n = 0, len(s)
    dizede = False
    while i < n:
        c = s[i]
        if dizede:
            out.append(c)
            if c == '\\':
                out.append(s[i + 1])
                i += 2
                continue
            if c == '"':
                dizede = False
            i += 1
            continue
        if c == '"':
            dizede = True
            out.append(c)
            i += 1
            continue
        if c.isalpha() or c in '_$':
            j = i
            while j < n and (s[j].isalnum() or s[j] in '_$'):
                j += 1
            k = j
            while k < n and s[k] in ' \t\r\n':
                k += 1
            out.append('"%s"' % s[i:j] if k < n and s[k] == ':' else s[i:j])
            i = j
            continue
        out.append(c)
        i += 1
    return ''.join(out)


def js_yukle(dosya, degisken):
    with open(os.path.join(VERI, dosya), encoding='utf-8') as f:
        return json.loads(js_json(js_govde(f.read(), degisken)))


def yayimlanmis_veriyi_oku():
    dizin = collections.OrderedDict((x['e'], x) for x in js_yukle('kelime-dizin.js', 'window.KELIME_DIZIN'))
    kartlar = {}
    for k in range(1, 8):
        for en, kart in js_yukle('kelime-k%d.js' % k, 'window.KELIME_K%d' % k).items():
            if en in kartlar:
                raise ValueError('%s iki katman dosyasında' % en)
            kartlar[en] = (k, kart)
    obekler = collections.OrderedDict((x['f'], x) for x in js_yukle('obekler.js', 'window.OBEKLER'))
    return dizin, kartlar, obekler


# ---------------------------------------------------------------- ana kaynak kümesi

def listeyi_aktar_yukle():
    spec = importlib.util.spec_from_file_location(
        'listeyi_aktar', os.path.join(ARACLAR, 'listeyi-aktar.py'))
    modul = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(modul)
    return modul


# ---------------------------------------------------------------- arşiv kanıtı

def csv_oku(arsiv, ad):
    yol = os.path.join(arsiv, ad)
    if not os.path.exists(yol):
        return {}
    with open(yol, encoding='utf-8-sig', newline='') as f:
        satirlar = list(csv.DictReader(f))
    return {(s.get('kelime') or '').strip().lower(): s for s in satirlar if (s.get('kelime') or '').strip()}


def ornek_ref_coz(ref):
    """'YDS_2025_02|metin|q=None|s.13' -> telifsiz kanıt nesnesi."""
    parca = (ref or '').split('|')
    if len(parca) != 4:
        return {'ref': ref}
    soru = parca[2][2:] if parca[2].startswith('q=') else parca[2]
    sayfa = parca[3][2:] if parca[3].startswith('s.') else parca[3]

    def sayi(x):
        # "10(aralikli)" gibi notlu değerler ham bırakılır.
        return None if x in ('None', '') else (int(x) if x.isdigit() else x)
    return {'exam_id': parca[0], 'role': parca[1], 'question': sayi(soru), 'page': sayi(sayfa)}


def sinav_kaniti(satir):
    kanit = {
        'sinav': int(satir.get('gectigi_sinav') or 0),
        'yillar': satir.get('yillar') or '',
        'zipf': float(satir['zipf']) if satir.get('zipf') else None,
        'source_ref': ornek_ref_coz(satir.get('ornek_ref')),
    }
    if satir.get('puan'):
        kanit['puan_ham'] = float(satir['puan'])
    return kanit


def kanitlari_yukle(arsiv):
    """Arşiv CSV'lerinden (varsa) kelime/öbek -> (grup, kanit) eşlemesi."""
    if not arsiv or not os.path.isdir(arsiv):
        print('UYARI: arşiv klasörü yok, kayıtlar grupsuz/kanıtsız yazılacak: %s' % arsiv)
        return {}, {}
    kelime, obek = {}, {}
    for ad, grup in (('NIHAI_KELIME.csv', 'tam-kitapcik-2024-2026'),
                     ('NIHAI2023_KELIME.csv', 'gorsel-transkript-2023')):
        for en, satir in csv_oku(arsiv, ad).items():
            kanit = sinav_kaniti(satir)
            if en in kelime:
                # Aynı kelime iki kaynakta: kart ilk içe aktarımdan gelir (2023
                # aktarımı sitede olanı atladı); yıl bilgisini birleştir.
                onceki = kelime[en][1]
                onceki['yillar'] = ','.join(sorted(set(
                    (onceki['yillar'] + ',' + kanit['yillar']).strip(',').split(','))))
                onceki['sinav'] = max(onceki['sinav'], kanit['sinav'])
                continue
            kelime[en] = (grup, kanit)
    for ad, grup in (('NIHAI_OBEK.csv', 'tam-kitapcik-2024-2026'),
                     ('NIHAI2023_OBEK.csv', 'gorsel-transkript-2023')):
        for f, satir in csv_oku(arsiv, ad).items():
            obek.setdefault(f, (grup, sinav_kaniti(satir)))

    turev_koku = collections.defaultdict(list)
    yol = os.path.join(arsiv, 'eksik_turevler2.json')
    if os.path.exists(yol):
        with open(yol, encoding='utf-8') as f:
            for kok, turevler in json.load(f).items():
                for t in turevler:
                    turev_koku[t.lower()].append(kok)
    for en, satir in csv_oku(arsiv, 'ONERILEN_TUREVLER.csv').items():
        if en in kelime:
            continue
        kelime[en] = ('aile-turevi-zipf', {
            'sinav': 0,
            'zipf': float(satir['zipf']) if satir.get('zipf') else None,
            'listeler': satir.get('listeler') or '',
            'aile_koku': sorted(set(turev_koku.get(en, []))),
        })
    # Son çare: NIHAI_KELIME.csv bazı başlıkları çekimli tutar (acres); siteye
    # aktarılan lemma listesi SITEYE_EKLENECEK.csv'dir (puan/yıl sütunu yok).
    # Türev listesinden SONRA gelir: NIHAI süzgecinde elenip sonra türev olarak
    # eklenen kelime türev grubunda kalmalıdır.
    for en, satir in csv_oku(arsiv, 'SITEYE_EKLENECEK.csv').items():
        kelime.setdefault(en, ('tam-kitapcik-2024-2026', sinav_kaniti(satir)))
    return kelime, obek


def bekleyen_kararlari():
    yol = os.path.join(ARACLAR, 'aile-kart-bekleyenler.json')
    if not os.path.exists(yol):
        return {}
    with open(yol, encoding='utf-8') as f:
        veri = json.load(f)
    return {c['candidate']: c for c in veri.get('candidates', [])
            if c.get('decision') == 'exam-evidence-add'}


# ---------------------------------------------------------------- parti yazımı

def kayit_kur(en, dizin_kaydi, katman, kart, kanitlar, bekleyenler):
    kayit = collections.OrderedDict()
    kayit['e'] = en
    kayit['y'] = dizin_kaydi['y']
    kayit['t'] = dizin_kaydi['t']
    kayit['p'] = dizin_kaydi.get('p')
    kayit['k'] = katman
    grup, kanit = kanitlar.get(en.lower(), ('kaynagi-belirsiz', None))
    kayit['g'] = grup
    kayit['a'] = kart['a']
    if kart.get('kl'):
        kayit['kl'] = kart['kl']
    if kart.get('es'):
        kayit['es'] = kart['es']
    if kanit is not None:
        kanit = dict(kanit)
        if en in bekleyenler:
            b = bekleyenler[en]
            kanit['bekleyenler_karari'] = {
                'decision': b['decision'], 'reason': b.get('reason'),
                'examYears': b.get('examYears'), 'reviewedOn': b.get('reviewedOn'),
            }
        kayit['kanit'] = kanit
    return kayit


def obek_kur(f, obek, kanitlar):
    kayit = collections.OrderedDict()
    kayit['f'] = f
    kayit['y'] = obek['y']
    kayit['s'] = obek['s']
    kayit['kn'] = obek['kn']
    grup, kanit = kanitlar.get(f.lower(), ('kaynagi-belirsiz', None))
    kayit['g'] = grup
    kayit['a'] = obek['a']
    if kanit is not None:
        kayit['kanit'] = kanit
    return kayit


def parti_yaz(yol, parti, kayitlar, obekler):
    """Başlık girintili, her kayıt tek satır: okunur ve satır bazında diff'lenir."""
    basli = json.dumps(parti, ensure_ascii=False, indent=2)
    assert basli.endswith('\n}')
    govde = basli[:-2]
    for ad, liste in (('kayitlar', kayitlar), ('obekler', obekler)):
        govde += ',\n  "%s": [\n' % ad
        govde += ',\n'.join('    ' + json.dumps(x, ensure_ascii=False) for x in liste)
        govde += '\n  ]'
    govde += '\n}\n'
    os.makedirs(os.path.dirname(yol), exist_ok=True)
    with open(yol, 'w', encoding='utf-8', newline='\n') as f:
        f.write(govde)


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('--parti-id', default=PARTI_ID_VARSAYILAN)
    ap.add_argument('--arsiv', default=ARSIV_VARSAYILAN,
                    help='NIHAI_*.csv, ONERILEN_TUREVLER.csv, eksik_turevler2.json klasörü')
    ap.add_argument('--kuru', action='store_true', help='yalnız rapor, dosya yazma')
    sec = ap.parse_args()

    la = listeyi_aktar_yukle()
    print('ana kaynaklar okunuyor (xlsx + ek kaynaklar, ek partiler hariç)…')
    uretilen = la.birlestir(ek_partileri=[])[0]
    uretilen_obek = la.obekleri_topla(ek_partileri=[])[0]
    print('  üretilen: %d kelime, %d öbek' % (len(uretilen), len(uretilen_obek)))

    dizin, kartlar, obekler = yayimlanmis_veriyi_oku()
    print('  yayımlanmış: %d kelime, %d öbek' % (len(dizin), len(obekler)))
    if set(dizin) != set(kartlar):
        raise ValueError('dizin ile katman dosyaları farklı: %s' %
                         sorted(set(dizin) ^ set(kartlar))[:10])

    eksik = [en for en in dizin if en not in uretilen]
    eksik_obek = [f for f in obekler if f not in uretilen_obek]
    fazla = sorted(set(uretilen) - set(dizin))
    print('  yayımlanmış olup üretilmeyen: %d kelime, %d öbek' % (len(eksik), len(eksik_obek)))
    if fazla:
        print('  DİKKAT üretilip yayımlanmamış kelime: %d %s' % (len(fazla), fazla[:20]))

    kelime_kaniti, obek_kaniti = kanitlari_yukle(sec.arsiv)
    bekleyenler = bekleyen_kararlari()

    kayitlar = [kayit_kur(en, dizin[en], kartlar[en][0], kartlar[en][1], kelime_kaniti, bekleyenler)
                for en in eksik]
    obek_kayitlari = [obek_kur(f, obekler[f], obek_kaniti) for f in eksik_obek]
    for k in kayitlar:
        if k['k'] != dizin[k['e']]['k']:
            raise ValueError('%s: dizin katmanı ile kart dosyası farklı' % k['e'])
    kayitlar.sort(key=lambda x: (GRUP_SIRASI[x['g']], -(x['p'] if x['p'] is not None else -1), x['e']))
    obek_kayitlari.sort(key=lambda x: (GRUP_SIRASI[x['g']], -x['s'], x['f']))

    grup_sayisi = collections.Counter(x['g'] for x in kayitlar)
    obek_grup_sayisi = collections.Counter(x['g'] for x in obek_kayitlari)
    katman_sayisi = collections.Counter(x['k'] for x in kayitlar)
    bekleyen_sayisi = sum(1 for x in kayitlar if x.get('kanit', {}).get('bekleyenler_karari'))
    puan_uyumsuz = [x['e'] for x in kayitlar
                    if x.get('kanit', {}).get('puan_ham') is not None and
                    round(x['kanit']['puan_ham'], 1) != x['p']]
    print('  grup: %s' % dict(grup_sayisi))
    print('  öbek grup: %s' % dict(obek_grup_sayisi))
    print('  katman: %s' % dict(sorted(katman_sayisi.items())))
    print('  bekleyenler exam-evidence-add ile örtüşen: %d' % bekleyen_sayisi)
    print('  CSV ham puanı dizin puanıyla uyuşmayan: %d %s' % (len(puan_uyumsuz), puan_uyumsuz[:10]))
    turev_katman = [x['e'] for x in kayitlar if (x['g'] == 'aile-turevi-zipf') != (x['k'] == 7)]
    print('  türev grubu <-> K7 uyuşmayan: %d %s' % (len(turev_katman), turev_katman[:10]))
    belirsiz = [x['e'] for x in kayitlar if x['g'] == 'kaynagi-belirsiz']
    belirsiz_obek = [x['f'] for x in obek_kayitlari if x['g'] == 'kaynagi-belirsiz']
    if belirsiz or belirsiz_obek:
        print('  kaynağı belirsiz: %d kelime %s, %d öbek %s' %
              (len(belirsiz), belirsiz[:20], len(belirsiz_obek), belirsiz_obek[:20]))

    gruplar = collections.OrderedDict(
        (g, v) for g, v in GRUPLAR.items() if grup_sayisi[g] or obek_grup_sayisi[g])
    parti = collections.OrderedDict([
        ('sema_surumu', la.EK_PARTI_SEMA),
        ('parti_id', sec.parti_id),
        ('aciklama', (
            'listeyi-aktar.py ana kaynaklarında (Calisma_Listesi_v4_site_tam.xlsx, '
            'ek-kelimeler.js, ek-aile-uyeleri.js, aile-kart-partileri/*.json, '
            'modal-kartlar.json) bulunmayan, yalnız yayımlanmış data/kelime-k*.js ve '
            'data/obekler.js içinde yaşayan kelime ve öbeklerin kaynak düzeyine '
            'taşınmış tam kart verisi. Betik bu partiyi xlsx\'ten sonra okur; xlsx\'te '
            'olan bir kelimeyi asla ezmez (çakışma hatadır) ve k alanını aynen korur.')),
        ('kaynak', collections.OrderedDict([
            ('cikaran', 'tools/ek-kelime-partileri-cikar.py'),
            ('cikarma_tarihi', '2026-09-05'),
            ('kaynak_notu', 'data/KAYNAK_2026-09-04_yeni_sinavlar.md'),
            ('arsiv', '03_calisma_listesi/06_sandbox_2026-09 (KAYNAK_NOTU.md; kartlar/, '
                      'kartlar2023/, NIHAI_KELIME.csv, NIHAI2023_KELIME.csv, NIHAI_OBEK.csv, '
                      'NIHAI2023_OBEK.csv, ONERILEN_TUREVLER.csv, eksik_turevler2.json)'),
            ('commitler', collections.OrderedDict([
                ('ac72df1', '2024-2026 tam kitapçıklarından 874 yeni kelime ve öbek ekle (4 Eylül 2026)'),
                ('e238e36', '74 kelime ailesi türevi ekle (5 Eylül 2026)'),
                ('4b58364', '2023 sınavlarından 243 kelime ve öbek ekle (5 Eylül 2026)'),
                ('dc8891b', 'Günün testi havuzunu dizinle eşitle (6 türev düşürüldü, 52 bekleyen '
                            'aday exam-evidence-add oldu)'),
            ])),
            ('bekleyenler', (
                'tools/aile-kart-bekleyenler.json içinde exam-evidence-add kararı taşıyan '
                '52 aday bu partide kanit.bekleyenler_karari alanıyla işaretlidir: ledger '
                'kurulduğunda sınav kanıtı yoktu, 2024-2026 tam kitapçıkları açılınca '
                'kanıt çıktı ve kartları 4 Eylül aktarımıyla geldi.')),
        ])),
        ('gerekce', (
            '5 Eylül 2026 denetimi (A2): listeyi-aktar.py veri dosyalarını sıfırdan yazar; '
            'bu kayıtların kartları yalnız data/kelime-k*.js ve data/obekler.js içindeydi ve '
            'yeniden üretimde silinecekti. Parti, kayıtları insan denetimli aile partileri '
            'modelinde sürümlü kaynağa taşır; katman, puan, kısa anlam ve kart içeriği '
            'yayımlanan veriyle birebir aynıdır.')),
        ('kurallar', collections.OrderedDict([
            ('xlsx_catisma', 'hata'),
            ('katman_korunur', True),
            ('mevcut_kaydi_ezme', False),
            ('aciklama', 'Kayıt ana kaynaklarda varsa listeyi-aktar.py hata verir; k puan '
                         'bandına göre yeniden hesaplanmaz (çoğu kayıt puanı 10 altı '
                         'denetimli ektir); kl/a/es partiden aynen alınır.'),
        ])),
        ('alanlar', collections.OrderedDict([
            ('kayitlar', 'e kelime, y tür, t kısa anlam (dizin), p puan (bir ondalık; yoksa null '
                         've gerekce zorunlu), k katman 1-7 (aynen korunur), g grup, a anlamlar '
                         '[{tr, ex, exTr, yz}], kl kolokasyonlar [{en, tr}], es eş anlamlılar, '
                         'kanit telifsiz kanıt'),
            ('obekler', 'f öbek, y tür, s kaç sınavda geçti, kn kaynak etiketi, g grup, a anlamlar, '
                        'kanit'),
            ('kanit', 'sinav: geçtiği sınav sayısı; yillar; zipf; source_ref: {exam_id, role, '
                      'question, page} — soru metni içermez; puan_ham: arşiv CSV puanı; '
                      'aile_koku/listeler: türevler için; bekleyenler_karari: ledger kararı'),
        ])),
        ('gruplar', gruplar),
        ('ozet', collections.OrderedDict([
            ('kelime', len(kayitlar)),
            ('obek', len(obek_kayitlari)),
            ('katman', collections.OrderedDict((str(k), n) for k, n in sorted(katman_sayisi.items()))),
            ('grup', collections.OrderedDict((g, grup_sayisi[g]) for g in gruplar if grup_sayisi[g])),
            ('obek_grup', collections.OrderedDict((g, obek_grup_sayisi[g]) for g in gruplar
                                                  if obek_grup_sayisi[g])),
        ])),
    ])

    yol = os.path.join(la.EK_KELIME_PARTILERI, sec.parti_id + '.json')
    if sec.kuru:
        print('(kuru koşum — yazılmadı: %s)' % yol)
        return
    parti_yaz(yol, parti, kayitlar, obek_kayitlari)
    print('yazıldı: %s (%d kelime, %d öbek, %.0f KB)' %
          (os.path.relpath(yol, SITE), len(kayitlar), len(obek_kayitlari),
           os.path.getsize(yol) / 1024))
    # Yazılan dosya betiğin kendi doğrulayıcısından geçmeli.
    la.ek_kelime_partilerini_oku()
    print('şema doğrulaması: tamam')


if __name__ == '__main__':
    main()
