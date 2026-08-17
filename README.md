# Turksev.github.io — YDS Hazırlık

YDS'ye hazırlananlar için statik bir çalışma sitesi. Sunucu, kurulum ya da kayıt gerekmez;
tüm ilerleme ziyaretçinin kendi tarayıcısında (`localStorage`) saklanır.

Yayında: <https://turksev.github.io>

## Sayfalar

| Dosya | İçerik |
| --- | --- |
| `index.html` | Ana sayfa, bölümlere giriş ve ilerleme özeti |
| `kelimeler.html` | Kelime listesi: arama, seviye/tür filtresi, kart (flashcard) modu, "öğrendim" işareti |
| `quiz.html` | Çözümlü deneme soruları: kategori ve soru sayısı seçimi, anlık geri bildirim, sonuç ekranı |
| `gramer.html` | 10 başlıkta konu anlatımı, kural tabloları ve sınav tuzakları |

## Dosya düzeni

```
index.html, kelimeler.html, quiz.html, gramer.html
assets/
  css/style.css       tüm sayfaların ortak stili (açık/koyu tema)
  js/main.js          tema, gezinme, localStorage yardımcıları
  js/kelimeler.js     kelime sayfası mantığı
  js/quiz.js          quiz mantığı
data/
  kelimeler.js        kelime verisi
  sorular.js          soru bankası
```

Veriler `fetch` yerine düz `<script>` ile yüklenir; böylece dosyaları çift tıklayıp
`file://` üzerinden de açabilirsin, ayrı bir yerel sunucuya gerek kalmaz.

## İçerik eklemek

**Yeni kelime** — `data/kelimeler.js` içindeki listenin sonuna ekle:

```js
{en:"prudent", tr:"tedbirli, sağduyulu", tip:"sıfat", sv:"ileri",
 ex:"It would be prudent to wait for the results.",
 exTr:"Sonuçları beklemek tedbirli olur.", es:"cautious, sensible"}
```

`sv` alanı `temel`, `orta` ya da `ileri` olabilir; `tip` alanı filtrelerde
`fiil`, `isim`, `sıfat`, `zarf` sözcükleriyle eşleşir.

**Yeni soru** — `data/sorular.js` içindeki listenin sonuna ekle:

```js
{kat:"Kelime", s:"The plan proved ---- in practice.",
 se:["viable","obsolete","reluctant","vague","tedious"], d:0,
 ac:"<b>viable</b> = uygulanabilir."}
```

`d` doğru şıkkın sırasıdır (0'dan başlar). Şıklar ekranda karıştırıldığı için
sıralamayı dert etmene gerek yok. `kat` alanına yeni bir ad yazarsan quiz
sayfasındaki kategori menüsüne kendiliğinden eklenir. Uzun metinli sorular için
isteğe bağlı `metin:` alanını kullan.

**Yeni gramer konusu** — `gramer.html` içinde son `<section class="topic">` bloğunu
kopyala, yeni bir `id` ver ve içindekiler listesine (`nav.toc`) bir satır ekle.

## Yerel önizleme

`index.html` dosyasına çift tıklamak yeterli. İstersen basit bir sunucu da çalıştırabilirsin:

```bash
python -m http.server 8000
```

## Yayınlama

`main` dalına gönderilen her değişiklik GitHub Pages tarafından birkaç dakika içinde yayımlanır.
