# -*- coding: utf-8 -*-
"""Ham cumle uretimi ile temizlenmis data/cumleler.js arasindaki farklari ICERIK-ANAHTARLI
duzeltme tablosuna cevirir: tools/cumle/cumle_duzeltmeleri.json

Neden: A4 temizligi (5 Eylul 2026) kayit dizinine gore uygulanmisti; yeniden uretimde
dizinler kayar ve temizlik kaybolur. Bu tablo ham (sinav, Ingilizce metin) anahtariyla
"su kayit soyle olacak / silinecek" der; cumle_js_uret.py her uretimde uygular.

Kullanim: python cumle_tablo_turet.py [--yaz]
"""
import collections
import glob
import io
import json
import os
import re
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
SP = "C:/Users/Trk/Desktop/YDS/03_calisma_listesi/06_sandbox_2026-09"
C = os.path.join(SP, 'cumleler')
VERI = r"C:\Users\Trk\Desktop\YDS\04_Github\data"
TABLO = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cumle_duzeltmeleri.json')
YAZ = '--yaz' in sys.argv


def ham_kayitlar():
    cumle = {}
    for p in sorted(glob.glob(os.path.join(C, 'girdi', '*.json'))):
        for c in json.load(open(p, encoding='utf-8'))['cumleler']:
            cumle[c['id']] = c
    ceviri = {}
    for p in sorted(glob.glob(os.path.join(C, 'cikti', '*.json'))):
        try:
            d = json.load(open(p, encoding='utf-8'))
        except Exception:
            continue
        for t in d.get('ceviriler', []):
            tr = (t.get('tr') or '').strip()
            if tr:
                ceviri[t['id']] = tr
    out = []
    for cid, c in sorted(cumle.items()):
        out.append({'id': cid, 'e': c['en'], 's': c['sinav_adi'], 'b': c.get('bolum') or '',
                    'n': c.get('soru') or 0, 't': ceviri.get(cid, ''), 'y': c['yil']})
    return out


def js_str(s, i):
    out = []
    i += 1
    while i < len(s):
        ch = s[i]
        if ch == '\\':
            out.append(s[i + 1]); i += 2; continue
        if ch == '"':
            return ''.join(out), i + 1
        out.append(ch); i += 1
    raise ValueError


def kayit_ayir(satir):
    d, i = {}, 1
    while i < len(satir) and satir[i] != '}':
        m = re.match(r'\s*,?\s*([A-Za-z_]+):', satir[i:])
        if not m:
            break
        k = m.group(1); i += m.end()
        if satir[i] == '"':
            v, i = js_str(satir, i)
        else:
            m2 = re.match(r'[^,}]+', satir[i:]); v = m2.group(0); i += m2.end()
        d[k] = v
    return d


def temiz_kayitlar():
    return [kayit_ayir(l.rstrip(',')) for l in io.open(os.path.join(VERI, 'cumleler.js'), encoding='utf-8').read().split('\n') if l.startswith('{e:"')]


def norm(e):
    return ' '.join(e.split())


def tokenler(e):
    return set(re.findall(r"[a-z0-9']+", e.lower()))


ham = ham_kayitlar()
temiz = temiz_kayitlar()
print('ham: %d  temiz: %d' % (len(ham), len(temiz)))

temiz_idx = collections.defaultdict(list)
for t in temiz:
    temiz_idx[(t['s'], norm(t['e']))].append(t)
ham_idx = collections.defaultdict(list)
for h in ham:
    ham_idx[(h['s'], norm(h['e']))].append(h)

tablo = []           # {s, eski, id, islem: 'degistir'|'sil', e, t}
istat = collections.Counter()
eslesmeyen_ham = []
kullanilan_temiz = set()

# 1) birebir ayni metin: yalniz ceviri farkiysa 'ceviri' islemi
for h in ham:
    k = (h['s'], norm(h['e']))
    if k in temiz_idx:
        t = temiz_idx[k][0]
        kullanilan_temiz.add(id(t))
        if (t.get('t') or '') != h['t'] or (t.get('b') or '') != (h['b'] or '') or str(t.get('n') or 0) != str(h['n'] or 0):
            tablo.append({'s': h['s'], 'eski': h['e'], 'id': h['id'], 'islem': 'degistir',
                          'e': t['e'], 't': t.get('t', ''), 'b': t.get('b', ''), 'n': int(t['n']) if t.get('n') else 0})
            istat['ayni metin, alan farki'] += 1
        else:
            istat['degismemis'] += 1
    else:
        eslesmeyen_ham.append(h)

# 2) degismis kayitlar: ayni sinavdaki eslesmemis temiz kayitlarla ortusme
temiz_kalan = collections.defaultdict(list)
for t in temiz:
    if id(t) not in kullanilan_temiz:
        temiz_kalan[t['s']].append(t)
print('eslesmeyen ham: %d, eslesmeyen temiz: %d' % (len(eslesmeyen_ham), sum(len(v) for v in temiz_kalan.values())))

atanan_temiz = {}   # id(t) -> ilk ham (degistir hedefi)
for h in eslesmeyen_ham:
    adaylar = temiz_kalan.get(h['s'], [])
    ht = tokenler(h['e'])
    en_iyi, en_iyi_puan = None, 0.0
    for t in adaylar:
        tt = tokenler(t['e'])
        if not ht or not tt:
            continue
        kapsama = len(ht & tt) / len(ht)          # ham parcanin ne kadari temiz kayitta (birlesme)
        kapsama2 = len(ht & tt) / len(tt)         # temiz kaydin ne kadari hamda (sik listesi kirpma)
        jac = len(ht & tt) / len(ht | tt)
        puan = max(kapsama, kapsama2, jac)
        if puan > en_iyi_puan:
            en_iyi, en_iyi_puan = t, puan
    if en_iyi is not None and en_iyi_puan >= 0.5:
        if id(en_iyi) not in atanan_temiz:
            atanan_temiz[id(en_iyi)] = h
            tablo.append({'s': h['s'], 'eski': h['e'], 'id': h['id'], 'islem': 'degistir', 'e': en_iyi['e'],
                          't': en_iyi.get('t', ''), 'b': en_iyi.get('b', ''), 'n': int(en_iyi['n']) if en_iyi.get('n') else 0,
                          'puan': round(en_iyi_puan, 2)})
            istat['degistir'] += 1
        else:
            tablo.append({'s': h['s'], 'eski': h['e'], 'id': h['id'], 'islem': 'sil', 'neden': 'birlestirildi -> ' + en_iyi['e'][:60]})
            istat['sil (birlesme)'] += 1
    else:
        tablo.append({'s': h['s'], 'eski': h['e'], 'id': h['id'], 'islem': 'sil', 'neden': 'temiz listede yok (artik)'})
        istat['sil (artik)'] += 1

kalan_temiz = [t for s, v in temiz_kalan.items() for t in v if id(t) not in atanan_temiz]
print('istatistik:', dict(istat))
print('hicbir ham kayda baglanamayan temiz kayit: %d' % len(kalan_temiz))
for t in kalan_temiz[:10]:
    print('   [%s] %s' % (t['s'], t['e'][:100]))

# dogrulama: tabloyu ham uzerine uygulayinca temiz listeyle ayni kume cikmali
def uygula(ham, tablo):
    T = {(x['s'], norm(x['eski'])): x for x in tablo}
    out = []
    for h in ham:
        x = T.get((h['s'], norm(h['e'])))
        if x is None:
            out.append((h['s'], norm(h['e']), h['t']))
        elif x['islem'] == 'sil':
            continue
        else:
            out.append((x['s'], norm(x['e']), x['t']))
    return out

sonuc = uygula(ham, tablo)
temiz_kume = collections.Counter((t['s'], norm(t['e']), t.get('t', '')) for t in temiz)
sonuc_kume = collections.Counter(sonuc)
eksik = temiz_kume - sonuc_kume
fazla = sonuc_kume - temiz_kume
print('uygulama sonucu: %d kayit; temizde olup uretilmeyen %d, uretilip temizde olmayan %d' % (len(sonuc), sum(eksik.values()), sum(fazla.values())))
for k in list(eksik)[:5]:
    print('   EKSIK:', k[0], '|', k[1][:80])
for k in list(fazla)[:5]:
    print('   FAZLA:', k[0], '|', k[1][:80])

if YAZ:
    json.dump({'sema': 1, 'aciklama': 'Ham cumle uretimine uygulanan icerik-anahtarli duzeltmeler (A4 temizligi, 5 Eylul 2026). '
               'Anahtar: (s, eski). islem=degistir -> e/t/b/n yeni degerler; islem=sil -> kayit atilir.',
               'kayitlar': tablo}, io.open(TABLO, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('yazildi:', TABLO, '(%d kayit)' % len(tablo))
else:
    print('(kuru kosum; yazmak icin --yaz)')
