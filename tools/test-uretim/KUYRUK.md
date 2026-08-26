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

Katman sayıları 25.08.2026'da alt uç yeniden bantlanınca değişti (eşikler 20/15/10 →
17/12/10); cümlelerin kendisi kelimeye bağlı olduğu için yalnız hangi dosyada
durdukları değişti, tek bir cümle bile yeniden yazılmadı.

| Katman | Cümle | Durum |
| --- | --- | --- |
| 1 · Temel | 657 | tamam |
| 2 · Çekirdek | 720 | tamam |
| 3 · Orta | 707 | tamam |
| 4 · İleri | 1.837 | tamam |
| 5 · Geniş | 2.039 | tamam |
| 6 · Geniş+ | 1.888 | tamam (25.08.2026, 45 paket) |
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

## Anlam denetimi hattı (26.08.2026 TAMAMLANDI)

Havuzun tamamı tarandı: 46 paket, 7.849 kelime, **420 bulgu** (172 hata,
248 şüpheli). Bulgular elden geçirildi; dört partide ~390 düzeltme uygulandı
(ek-ornekler.js üzerinden), ~20 uydurma/arkaik anlam silindi, gerisi
aşırı titizlik diye reddedildi. Genel hata oranı %5,4 idi; düzeltme sonrası
bilinen hata 0.

```
anlam-paketle.py   tüm kelimeleri 180'lik paketlere böler -> anlam-girdi/ (46 paket)
anlam-brief.md     denetim ölçütleri (tr doğru mu, ex uyumlu mu, exTr sadık mı)
anlam-cikti/       ajan bulguları — YALNIZ sorunlar, [{"e","alan","sorun","oneri","sev"}]
anlam-dogrula.py   toplar, doğrular, anlam-bulgular.json yazar
```

Sözlüklerde bulunmayan, v4 listesinden gelen şüpheli tireli kelimeler (elenmedi,
kullanıcı kararı bekliyor): hand-down, make-peace, boys-and-girls, long-legs,
call-out(düello), start-off, film-make, walk-to, shape-up.
Sıradaki iş: 300 "çok türlü ama tek örnekli" kelimeye tür başına örnek.

## Anlam yıldızları hattı (ayrı iş, 25.08.2026 tamamlandı)

Çok anlamlı kelime ve öbeklerde her anlamın YDS önemi (1-4 yıldız). 22 paketin hepsi
yazıldı: **2.595 kelime + 122 öbek**. Yıldız anlam metnine bağlıdır; `listeyi-aktar.py`
anlamları yıldıza göre büyükten küçüğe sıralar, yani baskın anlam başa gelir.

```
yildiz-paketle.py   çok anlamlı kayıtları 150'lik paketlere böler -> yildiz-girdi/
yildiz-brief.md     ölçek (4 = sınavda asıl sorulan, 1 = nadir) ve karar ölçütleri
yildiz-cikti/       ajan çıktıları — [{"e":"grind","yz":[4,1]}]
yildiz-dogrula.py   denetler ve tools/anlam-yildiz.js yazar
yildiz-onizleme.html  yıldızların sayfada görünüşünü sınayan tarayıcı testi
```

Zorunlu kural: her kaydın en yüksek yıldızı en az 3. Doğrulayıcı bunu, 1-4 aralığını ve
dizi uzunluğunun anlam sayısına eşitliğini denetler.

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
