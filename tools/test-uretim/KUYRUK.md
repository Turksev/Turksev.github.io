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

4. katman **tamamlandı** (23.08.2026): 38 paketin hepsi yazıldı, 1.073 cümle.
Sırada 5. katman var; girdi paketleri henüz üretilmedi (aşağıya bak).

## Sonraki katmanlar (girdi paketleri henüz üretilmedi)

`python paketle.js <katman>` yerine — node kaldırıldığı için — paketleri Python ile
üretmek gerekir; `paketle.js` mantığı 70'lik dilimler yazar (bkz. dosya).

| Katman | Kelime | Yaklaşık paket | Yaklaşık maliyet |
| --- | --- | --- | --- |
| 1 · Temel | 657 | 10 | ~1,0 M token |
| 6 · Geniş+ | 3.135 | 45 | ~4,5 M token |

Önerilen sıra: 4 → 5 → 1 → 6 (4 ve 5 bitti). (1. katman zaten bilinen kelimeler, 6. katman en seyrekler.)

## Tamamlananlar

| Katman | Cümle | Durum |
| --- | --- | --- |
| 2 · Çekirdek | 720 | tamam |
| 3 · Orta | 708 | tamam |
| 4 · İleri | 1.073 | tamam |
| 5 · Geniş | 1.565 | tamam |
| Öbekler (deyimsel fiil + edat kalıbı) | 892 | tamam |

Öbek hattı ayrı dosyalarda: `obek-test-paketle.py`, `obek-test-brief.md`,
`obek-test-girdi/`, `obek-test-cikti/`, `obek-test-dogrula.py` → `data/test-obek.js`.

## Dosyalar

```
brief.md      ajanlara verilen kalite kuralları (YDS kayıtı, 18–32 kelime, çekim etiketi f)
girdi/        70'lik kelime paketleri (kelime + tür + anlam + karttaki örnek)
cikti/        ajanların yazdığı cümleler — YENİDEN ÜRETİMİ PAHALI, silme
dogrula.py    denetler ve data/test-k{n}.js dosyalarını yazar
cekim.py      cekim.js'in Python karşılığı (tabloları JS'ten okur)
parite.html   cekim.py ↔ cekim.js parite testi (headless Chrome; son sonuç: 47.154'te 0 fark)
harness.html  uçtan uca tarayıcı testi (kelimeler.html'i açar, 20 soruluk testi çözer)
paketle.js    girdi paketlerini üreten betik (node gerektirir; node şu an kurulu değil)
```

Node.js 23.08.2026'da makineden kaldırıldı; doğrulama ve testler Python + headless
Chrome ile yapılır.
