# tools/cumle — Cümleler sekmesi ve kelime bilgi notu üreticileri

`data/cumleler.js` ve `data/kelime-bilgi.js` bu betiklerle üretilir. Girdileri
(korpus, çeviri parçaları, kart parçaları) **repoda değil**, şurada:

    C:\Users\Trk\Desktop\YDS\03_calisma_listesi\06_sandbox_2026-09\

Betiklerdeki `SP`/`BURASI` sabiti o klasöre sabitlenmiştir (özgün kopyalar da
oradadır ve olduğu gibi çalışır; bkz. oradaki `KAYNAK_NOTU.md`).

| Betik | Girdi | Çıktı |
|---|---|---|
| `cumle_bankasi2.py`, `bolum_parcala.py`, `bolum_duzelt.py` | `sandbox/duz4/02_korpus/korpus.jsonl` | cümle bankası + bölüm etiketleri |
| `cumle_js_uret.py` | `cumleler/cikti/C_*.json` (çeviriler), `bolum_nihai.json` | `data/cumleler.js` |
| `ceviri_durum.py` | `cumleler/` | çeviri ilerleme raporu |
| `bilgi_veri.py` → `bilgi_kart_veri.py` → `bilgi_js_uret.py` | korpus + puanlama.sqlite | `data/kelime-bilgi.js` |
| `test_parcala.py` → (ajan) → `gt_pakete_don.py` | `data/kelime-dizin.js`, `data/test-*.js` | `tools/test-uretim/girdi|cikti/gt-*.json` → `dogrula.py` |
| `cumle_temizle.py` | `data/cumleler.js` | artık temizliği (5 Eylül kuralları) |

Cümle listesi yeniden üretilirken uygulanacak kurallar ve açık artıklar:
`06_sandbox_2026-09/KAYNAK_NOTU.md` ve `DENETIM_RAPORU_2026-09-05.md` (A4–A5).

Node kurulu olmadığı için bu betikler Python'dur; makinedeki `python` (3.12) yeterlidir,
ek paket gerekmez (`pypdfium2`/`reportlab` yalnız 2023 tarama betiklerinde).
