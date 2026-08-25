# Günün testi — cümle üretim kuyruğu

Bu klasör "günün testi" cümlelerinin üretim hattıdır. Kullanıcının talimatıyla çalışır;
kendiliğinden çalışan bir zamanlayıcı **yoktur** (23.08.2026'da alarmlar kapatıldı).

## Başlatma komutu

Kullanıcı **"kuyruğu başlat"** (ya da "test cümlelerine devam et") dediğinde:

1. `python dogrula.py --rapor` — hangi paketler eksik, gör.
2. Eksik paketlerin **ilk 2'si** için birer alt-ajan başlat. Ajan görevi:
   - `brief.md`'yi oku ve harfiyen uy,
   - `girdi/<paket>.json`'u oku,
   - her kelime için bir cümle yazıp **yalnız JSON dizisini** `cikti/<paket>.json`'a yaz,
   - son metin olarak sadece `yazıldı: N kayıt` döndür.
3. Ajanlar bitince `python dogrula.py` — geçen kayıtlar `data/test-k{n}.js` olarak yazılır.
4. `sw.js` içindeki `SURUM` değerini bir artır, commit + push.
5. İki satır özet yaz, dur. Kullanıcı "devam" demeden yeni dalga başlatma.

Aynı anda 6'dan fazla ajan çalıştırma: 11 ajanla oturum limitine, ikinci denemede
haftalık limite çarpıldı. Paket başına yaklaşık **100 bin token**.

## Sıradaki paketler

**Yok — kuyruk boş.** Kelime havuzunun tamamı 25.08.2026'da bitti; bekleyen paket
kalmadı. Listeye yeni kelime eklenirse `paketle.py` ile yeni paket üretilir.

## Tamamlananlar

| Katman | Cümle | Durum |
| --- | --- | --- |
| 1 · Temel | 657 | tamam |
| 2 · Çekirdek | 720 | tamam |
| 3 · Orta | 707 | tamam |
| 4 · İleri | 1.073 | tamam |
| 5 · Geniş | 1.564 | tamam |
| 6 · Geniş+ | 3.127 | tamam (25.08.2026, 45 paket) |
| **Kelime toplamı** | **7.848** | 10 kelime elendi (kaba/özel ad) |
| Öbekler (deyimsel fiil + edat kalıbı) | 892 | tamam |

Öbek hattı ayrı dosyalarda: `obek-test-paketle.py`, `obek-test-brief.md`,
`obek-test-girdi/`, `obek-test-cikti/`, `obek-test-dogrula.py` → `data/test-obek.js`.

## Kullanım kalıpları hattı (ayrı iş, 24.08.2026 tamamlandı)

2–4. katman kelimeleri için "comply with the rules — kurallara uymak" biçiminde
kullanım kalıpları. 27 paketin hepsi yazıldı: **2.500 kelime tarandı, 2.353'üne
5.432 kalıp** yazıldı (kalıbı olmayan somut kelimeler boş bırakıldı).

```
kalip-paketle.py   2-4. katmanı 100'lük paketlere böler -> kalip-girdi/
kalip-brief.md     kalite kuralları (2-5 kelime, en çok 3 kalıp, edat kalıbı önce)
kalip-cikti/       ajan çıktıları — YENİDEN ÜRETİMİ PAHALI, silme
kalip-dogrula.py   denetler ve tools/kaliplar.js yazar
obek-test-sayfa.html  kalıpların sayfada görünüşünü sınayan tarayıcı testi
```

`tools/kaliplar.js` → `listeyi-aktar.py` → `data/kelime-k{n}.js` içine `kl:[{en,tr}]`.
Sırada 5–6. katman kalıpları var (henüz paketlenmedi, ~4.700 kelime).

## Dosyalar

```
brief.md      ajanlara verilen kalite kuralları (YDS kayıtı, 18–32 kelime, çekim etiketi f)
girdi/        70'lik kelime paketleri (kelime + tür + anlam + karttaki örnek)
cikti/        ajanların yazdığı cümleler — YENİDEN ÜRETİMİ PAHALI, silme
dogrula.py    denetler ve data/test-k{n}.js dosyalarını yazar
cekim.py      cekim.js'in Python karşılığı (tabloları JS'ten okur)
parite.html   cekim.py ↔ cekim.js parite testi (headless Chrome; son sonuç: 47.154'te 0 fark)
harness.html  uçtan uca tarayıcı testi (kelimeler.html'i açar, 20 soruluk testi çözer)
paketle.py    girdi paketlerini üreten betik (paketle.js'in Python karşılığı)
```

Node.js 23.08.2026'da makineden kaldırıldı; doğrulama ve testler Python + headless
Chrome ile yapılır.
