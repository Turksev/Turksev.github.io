# -*- coding: utf-8 -*-
# KALICI KOPYA (5 Eylul 2026): ozgun betik 03_calisma_listesi/06_sandbox_2026-09/ altinda;
# girdi/cikti klasorleri orada oldugu icin SP/BURASI o klasore sabitlendi.
"""Cumle bankasini NIHAI bolum etiketleriyle yeniden kurar ve ceviri parcalari uretir."""
import os, sys, io, re, json, math, collections
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

SP = "C:/Users/Trk/Desktop/YDS/03_calisma_listesi/06_sandbox_2026-09"
KOR = os.path.join(SP, 'sandbox', 'duz3', '02_korpus', 'korpus.jsonl')
OUT = os.path.join(SP, 'cumleler')
os.makedirs(os.path.join(OUT, 'girdi'), exist_ok=True)
os.makedirs(os.path.join(OUT, 'cikti'), exist_ok=True)

BANT = [(1, 6, 'Kelime Bilgisi'), (7, 16, 'Dil Bilgisi'), (17, 26, 'Cloze Test'),
        (27, 36, 'Cümle Tamamlama'), (37, 42, 'Çeviri'), (43, 62, 'Paragraf / Okuma'),
        (63, 67, 'Diyalog Tamamlama'), (68, 71, 'Anlamca En Yakın'),
        (72, 75, 'Paragraf Tamamlama'), (76, 80, 'Anlam Bütünlüğünü Bozan')]
def bant(n):
    for a, b, ad in BANT:
        if a <= n <= b:
            return ad
    return None

DONEM = {'01': 'İlkbahar', '02': 'Sonbahar', '03': 'Aralık', 'INGILIZCE': 'Temmuz',
         '04': 'Nisan', '05': 'Mayıs', '06': 'Haziran', '07': 'Temmuz', '08': 'Ağustos',
         '09': 'Eylül', '10': 'Ekim', '11': 'Kasım', '12': 'Aralık'}
def sinav_adi(exam_id, yil):
    p = exam_id.split('_')
    aile = 'YDS' if p[0] == 'YDS' else 'e-YDS'
    return f"{yil} {DONEM.get(p[-1], p[-1])} {aile}"

# --- nihai bolum etiketleri (blok anahtari: exam+sayfa+metin basi)
nihai = json.load(open(os.path.join(SP, 'bolum_nihai.json'), encoding='utf-8'))
girdi_map = {}
import glob
for p in glob.glob(os.path.join(SP, 'bolum', 'girdi', '*.json')):
    for b in json.load(open(p, encoding='utf-8'))['bloklar']:
        girdi_map[b['id']] = b
llm_bolum = {}
for k in nihai['llm']:
    g = girdi_map.get(k['id'])
    if g and k['bolum'] != 'kararsiz':
        llm_bolum[(g['exam_id'], g['sayfa'], g['metin'][:60])] = k['bolum']
kural_bolum = {}
for r in nihai['kural']:
    kural_bolum.setdefault((r['exam_id'], r['sayfa']), []).append(r['bolum'])

recs = [json.loads(l) for l in open(KOR, encoding='utf-8')]
CUM = re.compile(r'[^.!?]+[.!?]')
cumleler = {}
kaynak = collections.Counter()
for r in recs:
    if r['dil'] != 'en' or r['blok'] == 'yonerge':
        continue
    qn = int(r['soru_no']) if r.get('soru_no') else None
    bol = bant(qn) if qn else None
    if not bol:
        anahtar = (r['exam_id'], str(r['sayfa']), (r['metin'] or '')[:60])
        bol = llm_bolum.get(anahtar)
        if not bol:
            aday = kural_bolum.get((r['exam_id'], str(r['sayfa'])), [])
            if len(set(aday)) == 1:
                bol = aday[0]
    for c in CUM.findall(r['metin'] or ''):
        c = ' '.join(c.split())
        if not (35 <= len(c) <= 320):
            continue
        if len(re.findall(r'[A-Za-z]{2,}', c)) < 6:
            continue
        a = c.lower()
        if a in cumleler:
            continue
        cumleler[a] = {'en': c, 'sinav': r['exam_id'], 'yil': r['yil'],
                       'sinav_adi': sinav_adi(r['exam_id'], r['yil']),
                       'soru': qn, 'bolum': bol}
        kaynak['etiketli' if bol else 'etiketsiz'] += 1

lst = list(cumleler.values())
print(f"BENZERSIZ CUMLE: {len(lst):,}")
print(f"  bolum etiketli : {kaynak['etiketli']:,}  (%{kaynak['etiketli']/len(lst)*100:.0f})")
print(f"  etiketsiz      : {kaynak['etiketsiz']:,}")
bol = collections.Counter(v['bolum'] or '(yok)' for v in lst)
for k, v in bol.most_common():
    print(f"    {k:<26} {v:>6,}")

BOYUT = 80
n = math.ceil(len(lst) / BOYUT)
for i in range(n):
    ch = lst[i * BOYUT:(i + 1) * BOYUT]
    ad = f'C_{i+1:03d}'
    for j, c in enumerate(ch):
        c['id'] = f'{ad}_{j+1:02d}'
    json.dump({'parca': ad, 'cumleler': ch},
              open(os.path.join(OUT, 'girdi', ad + '.json'), 'w', encoding='utf-8'),
              ensure_ascii=False, indent=1)
print(f"\n{n} parca (parca basina {BOYUT} cumle)")
json.dump({'toplam': len(lst), 'parca': n,
           'adlar': [f'C_{i+1:03d}' for i in range(n)]},
          open(os.path.join(OUT, 'MANIFEST.json'), 'w', encoding='utf-8'), ensure_ascii=False)
print("MANIFEST yazildi")
