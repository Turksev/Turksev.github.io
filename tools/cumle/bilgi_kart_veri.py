# -*- coding: utf-8 -*-
# KALICI KOPYA (5 Eylul 2026): ozgun betik 03_calisma_listesi/06_sandbox_2026-09/ altinda;
# girdi/cikti klasorleri orada oldugu icin SP/BURASI o klasore sabitlendi.
"""Bilgi karti veri katmani: her kelimenin sinavdaki kullanim analizi.

Deterministik — LLM kullanmaz. Ciktida ceviri gerektiren cumleler ayrica isaretlenir.
"""
import os, sys, io, re, json, sqlite3, collections
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

SP = "C:/Users/Trk/Desktop/YDS/03_calisma_listesi/06_sandbox_2026-09"
PUA = os.path.join(SP, 'sandbox', 'duz3', '03_puanlama', 'puanlama.sqlite')
KOR = os.path.join(SP, 'sandbox', 'duz3', '02_korpus', 'korpus.jsonl')
VERI = r"C:\Users\Trk\Desktop\YDS\04_Github\data"

BANT = [(1, 6, 'Kelime Bilgisi'), (7, 16, 'Dil Bilgisi'), (17, 26, 'Cloze Test'),
        (27, 36, 'Cümle Tamamlama'), (37, 42, 'Çeviri'), (43, 62, 'Paragraf / Okuma'),
        (63, 67, 'Diyalog Tamamlama'), (68, 71, 'Anlamca En Yakın'),
        (72, 75, 'Paragraf Tamamlama'), (76, 80, 'Anlam Bütünlüğünü Bozan')]
def bant(n):
    for a, b, ad in BANT:
        if a <= n <= b:
            return ad
    return None

# --- sitedeki kelimeler
site = {}
_dz = open(os.path.join(VERI, 'kelime-dizin.js'), encoding='utf-8').read()
for m in re.finditer(r'\{e:"((?:[^"\\]|\\.)+)".*?p:([0-9.]+),k:(\d)', _dz):
    site[m.group(1).lower()] = {'p': float(m.group(2)), 'k': int(m.group(3))}
print(f"sitede {len(site):,} kelime")

# --- puan tablosu
c = sqlite3.connect('file:%s?mode=ro' % PUA.replace(os.sep, '/'), uri=True)
kanit = {}
for kel, gs, tf, dc, sik, yil in c.execute(
        "select p.kelime, k.gectigi_sinav, k.toplam_frekans, k.dogru_cevap, k.sik, k.yillar "
        "from puan p join entry_kanit k using(entry_id) where p.gectigi_sinav>0"):
    w = kel.lower()
    cur = kanit.get(w)
    if cur is None or tf > cur['tf']:
        kanit[w] = {'sinav': gs, 'tf': tf, 'dogru': dc, 'sik': sik,
                    'yillar': [y for y in (yil or '').split(',') if y]}
print(f"kanit kaydi: {len(kanit):,}")

# --- korpustan gecis yerleri
recs = [json.loads(l) for l in open(KOR, encoding='utf-8')]
by_q = collections.defaultdict(list)          # (exam, soru_no) -> bloklar
for r in recs:
    if r.get('soru_no'):
        by_q[(r['exam_id'], int(r['soru_no']))].append(r)

from lemminflect import getLemma
_lc = {}
def lemma(w):
    if w in _lc:
        return _lc[w]
    s = {w}
    for up in ('VERB', 'NOUN', 'ADJ', 'ADV'):
        for l in (getLemma(w, up, lemmatize_oov=False) or ()):
            s.add(l.lower())
    _lc[w] = s
    return s

def dogru_mu(v):
    return v in (1, '1', True)

def site_eslesmesi(metin):
    """Sik metnindeki site kelimelerini bulur (lemma dahil)."""
    out = set()
    t = (metin or '').strip().lower()
    if not t:
        return out
    if t in site:
        out.add(t)
    for tok in re.findall(r"[a-z][a-z'\-]{1,}", t):
        if tok in site:
            out.add(tok)
        else:
            for l in lemma(tok):
                if l in site:
                    out.add(l)
    return out

gecis = collections.defaultdict(list)
for r in recs:
    if r['dil'] != 'en' or r['blok'] != 'sik':
        continue
    eslesen = site_eslesmesi(r.get('metin'))
    if not eslesen:
        continue
    qn = int(r['soru_no']) if r.get('soru_no') else None
    kok = ''
    for b in by_q.get((r['exam_id'], qn), []):
        if b['blok'] == 'soru_koku':
            kok = b['metin']; break
    for w in eslesen:
        gecis[w].append({
            'sinav': r['exam_id'], 'yil': r['yil'], 'soru': qn,
            'tur': bant(qn) if qn else None,
            'sik_metni': (r.get('metin') or '').strip(),
            'harf': r.get('harf'), 'dogru': dogru_mu(r.get('dogru_mu')),
            'kok': kok[:400],
        })

print(f"sik olarak gecen site kelimesi: {len(gecis):,}")
cev_gerek = sum(1 for v in gecis.values() for g in v if g['kok'])
print(f"ceviri gerektiren soru koku sayisi: {cev_gerek:,}")

# --- kart verisi
kart = {}
for w, s in site.items():
    k = kanit.get(w)
    g = gecis.get(w, [])
    if not k and not g:
        continue
    dogrular = [x for x in g if x['dogru']]
    celdiri = [x for x in g if not x['dogru']]
    turler = collections.Counter(x['tur'] for x in g if x['tur'])
    kart[w] = {
        'p': s['p'], 'k': s['k'],
        'sinav': (k or {}).get('sinav', 0),
        'frekans': (k or {}).get('tf', 0),
        'yillar': (k or {}).get('yillar', []),
        'dogru_cevap': len(dogrular),
        'celdirici': len(celdiri),
        'turler': dict(turler.most_common()),
        'gecisler': (dogrular + celdiri)[:6],
    }

print(f"\nbilgi karti uretilebilen kelime: {len(kart):,}")
print(f"  en az bir kez DOGRU CEVAP olmus : {sum(1 for v in kart.values() if v['dogru_cevap']):,}")
print(f"  en az bir kez celdirici olmus   : {sum(1 for v in kart.values() if v['celdirici']):,}")
print(f"  yalniz metinde gecmis           : {sum(1 for v in kart.values() if not v['gecisler']):,}")

json.dump(kart, open(os.path.join(SP, 'bilgi_kart_veri.json'), 'w', encoding='utf-8'),
          ensure_ascii=False)
print("\nbilgi_kart_veri.json yazildi")

ornek = next((w for w, v in kart.items() if v['dogru_cevap'] and v['celdirici']), None)
if ornek:
    print(f"\nornek — {ornek}:")
    print(json.dumps(kart[ornek], ensure_ascii=False, indent=1)[:900])
