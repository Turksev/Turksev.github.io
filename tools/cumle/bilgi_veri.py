# -*- coding: utf-8 -*-
# KALICI KOPYA (5 Eylul 2026): ozgun betik 03_calisma_listesi/06_sandbox_2026-09/ altinda;
# girdi/cikti klasorleri orada oldugu icin SP/BURASI o klasore sabitlendi.
"""Bilgi karti icin hangi veriler mevcut?"""
import os, sys, io, json, sqlite3, collections
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

SP = "C:/Users/Trk/Desktop/YDS/03_calisma_listesi/06_sandbox_2026-09"
PUA = os.path.join(SP, 'sandbox', 'duz3', '03_puanlama', 'puanlama.sqlite')
KOR = os.path.join(SP, 'sandbox', 'duz3', '02_korpus', 'korpus.jsonl')

c = sqlite3.connect('file:%s?mode=ro' % PUA.replace(os.sep, '/'), uri=True)
print("=== entry_kanit alanlari ===")
cols = [r[1] for r in c.execute('PRAGMA table_info(entry_kanit)')]
print("  ", cols)
r = c.execute("select * from entry_kanit where dogru_cevap>0 order by toplam_frekans desc limit 3").fetchall()
for row in r:
    print("  ", dict(zip(cols, row)))

print("\n=== dogru_cevap / sik dagilimi ===")
for n, lbl in ((0, 'hic dogru cevap olmamis'), (1, '1 kez'), (2, '2+ kez')):
    q = "select count(*) from entry_kanit where dogru_cevap=0" if n == 0 else \
        ("select count(*) from entry_kanit where dogru_cevap=1" if n == 1 else
         "select count(*) from entry_kanit where dogru_cevap>=2")
    print(f"  {lbl:<26} {c.execute(q).fetchone()[0]:>7,}")
print("  sik (celdirici) olanlar    ", c.execute("select count(*) from entry_kanit where sik>0").fetchone()[0])

print("\n=== korpus: soru bazli veri ===")
recs = [json.loads(l) for l in open(KOR, encoding='utf-8')]
print("  kayit:", len(recs))
print("  alanlar:", sorted({k for r in recs for k in r}))
sk = [r for r in recs if r['blok'] == 'sik']
print(f"  sik blogu: {len(sk):,} | dogru_mu dolu: {sum(1 for r in sk if r.get('dogru_mu') is not None):,}")
soru_no = [r for r in recs if r.get('soru_no')]
print(f"  soru_no atanmis blok: {len(soru_no):,}")
print("\n  ornek sik blogu:")
for r in sk[:2]:
    print("   ", {k: (str(v)[:90]) for k, v in r.items()})

print("\n=== soru turu araligi ile eslestirme mumkun mu ===")
BANT = [(1,6,'Kelime Bilgisi'),(7,16,'Dil Bilgisi'),(17,26,'Cloze'),(27,36,'Cümle Tamamlama'),
        (37,42,'Çeviri'),(43,62,'Paragraf'),(63,67,'Diyalog'),(68,71,'Anlamca Yakın'),
        (72,75,'Paragraf Tamamlama'),(76,80,'Anlam Bozan')]
dag = collections.Counter()
for r in soru_no:
    n = r['soru_no']
    for a, b, ad in BANT:
        if a <= n <= b:
            dag[ad] += 1; break
print("  ", dict(dag))
