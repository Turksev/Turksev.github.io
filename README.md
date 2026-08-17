# Turksev.github.io — YDS Hazırlık

YDS'ye hazırlananlar için statik bir çalışma sitesi. Sunucu, kurulum ya da kayıt gerekmez;
tüm ilerleme ziyaretçinin kendi tarayıcısında (`localStorage`) saklanır.

Yayında: <https://turksev.github.io>

## Sayfalar

| Dosya | İçerik |
| --- | --- |
| `index.html` | Ana sayfa ve ilerleme paneli: tekrar durumu, yanlış defteri, deneme geçmişi, kategori karnesi |
| `kelimeler.html` | Kelime listesi + **aralıklı tekrar (Leitner)**: bugünün destesi, 5 kutu, kart modu, sesli okuma |
| `quiz.html` | Alıştırma soruları: 12 kategori, anında çözüm, yanlış defterinden çalışma |
| `deneme.html` | **Süreli deneme sınavı**: geri sayım, soru ızgarası, işaretleme, net hesabı, kategori karnesi |
| `gramer.html` | 10 başlıkta konu anlatımı, kural tabloları ve sınav tuzakları |
| `baglaclar.html` | Bağlaçlar ve geçiş ifadeleri: çözüm yöntemi, yapı tabloları, filtrelenebilir 155 kayıtlık banka |
| `ara.html` | Site geneli arama: kelimeler, bağlaçlar, sorular ve gramer konuları tek yerde |

## İçerik

- **181 kelime** — örnek cümleli, seviye ve tür etiketli
- **125 soru** — 12 kategori: Kelime, Dil Bilgisi, Bağlaç, Preposition, Cloze Test, Çeviri,
  Cümle Tamamlama, Restatement, Paragraf Tamamlama, Anlamı Bozan Cümle, Diyalog, Okuma
- **155 bağlaç** — anlam ilişkisi ve "sonrasında ne gelir" etiketleriyle
- **10 gramer konusu** — tablolar ve örneklerle

## Dosya düzeni

```
index.html  kelimeler.html  quiz.html  deneme.html
gramer.html  baglaclar.html  ara.html
assets/
  css/style.css       tüm sayfaların ortak stili (açık/koyu tema)
  js/main.js          tema, gezinme, localStorage, service worker kaydı
  js/ilerleme.js      Leitner, yanlış defteri, kategori istatistiği, geçmiş
  js/kelimeler.js     kelime sayfası
  js/quiz.js          alıştırma soruları
  js/deneme.js        süreli sınav
  js/baglaclar.js     bağlaç bankası
  js/ara.js           site geneli arama
  img/                PWA ikonları (tools ile üretildi)
data/
  kelimeler.js        kelime verisi
  sorular.js          soru bankası + okuma parçaları
  baglaclar.js        bağlaç verisi
tools/
  docx-aktar.js       Word belgelerini düz metne çevirir
manifest.webmanifest  telefona kurulum
sw.js                 çevrimdışı çalışma
sitemap.xml  robots.txt
```

Veriler `fetch` yerine düz `<script>` ile yüklenir; böylece dosyaları çift tıklayıp
`file://` üzerinden de açabilirsin, ayrı bir yerel sunucuya gerek kalmaz.
(Service worker yalnızca HTTPS ve `localhost` üzerinde etkinleşir.)

## Aralıklı tekrar nasıl çalışıyor?

Her kelime 1–5 arası bir kutuda durur. Kart modunda **✓ Bildim** dersen bir üst kutuya
çıkar ve daha seyrek sorulur; **✗ Bilemedim** dersen 1. kutuya döner.

| Kutu | Sonraki tekrar |
| --- | --- |
| 1 | 1 gün sonra |
| 2 | 3 gün sonra |
| 3 | 7 gün sonra |
| 4 | 15 gün sonra |
| 5 | 30 gün sonra |

4. ve 5. kutudakiler "öğrenilmiş" sayılır. Aralıkları değiştirmek istersen
`assets/js/ilerleme.js` içindeki `ARALIK` tablosunu düzenle.

## İçerik eklemek

**Yeni kelime** — `data/kelimeler.js` sonuna ekle:

```js
{en:"prudent", tr:"tedbirli, sağduyulu", tip:"sıfat", sv:"ileri",
 ex:"It would be prudent to wait for the results.",
 exTr:"Sonuçları beklemek tedbirli olur.", es:"cautious, sensible"}
```

`sv` alanı `temel`, `orta` ya da `ileri`; `tip` alanı filtrelerde `fiil`, `isim`,
`sıfat`, `zarf` sözcükleriyle eşleşir.

**Yeni soru** — `data/sorular.js` sonuna ekle:

```js
{kat:"Kelime", s:"The plan proved ---- in practice.",
 se:["viable","obsolete","reluctant","vague","tedious"], d:0,
 ac:"<b>viable</b> = uygulanabilir."}
```

`d` doğru şıkkın sırasıdır (0'dan başlar); şıklar ekranda karıştırıldığı için sıralamayı
dert etmene gerek yok. `kat` alanına yeni bir ad yazarsan quiz sayfasındaki kategori
menüsüne kendiliğinden eklenir — ancak **süreli denemeye girmesi için**
`assets/js/deneme.js` içindeki `AGIRLIK` tablosuna da bir ağırlık eklemen gerekir.

Uzun metinli sorular için: cloze testlerde soruya gömülü `metin:` alanını, birden çok
soru bağlanan okuma parçalarında ise `data/sorular.js` başındaki `PARCALAR` tablosuna
metni ekleyip soruda `pid:"p5"` alanını kullan.

**Yeni bağlaç** — `data/baglaclar.js` sonuna ekle:

```js
{"f":"in view of","tr":"göz önünde bulundurulduğunda","il":"Neden","yp":"isim","dz":"çekirdek",
 "or":[{"en":"In view of the delay, the deadline was extended.",
        "tr":"Gecikme göz önünde bulundurularak süre uzatıldı."}]}
```

`il` anlam ilişkisi (Neden, Sonuç, Karşıtlık, Ödünleme, Koşul, Zaman, Ekleme, Seçenek,
Örnekleme, Özet, Diğer) — filtre menüsüne kendiliğinden eklenir. `yp` bağlaçtan sonra ne
geldiğidir: `cümle`, `isim`, `zarf`, `eş`, `ikili`. `dz` ise `çekirdek` ya da `ileri`.
Çok anlamlı bağlaçta her örneğe `et` (anlam etiketi) ve `kr` (karşılık) ekle; isteğe bağlı
`nt` alanı kayda bir kullanım notu iliştirir.

**Yeni gramer konusu** — `gramer.html` içinde son `<section class="topic">` bloğunu
kopyala, yeni bir `id` ver, içindekiler listesine (`nav.toc`) bir satır ekle ve
`assets/js/ara.js` içindeki `KONULAR` dizinine kaydını gir.

**Yeni sayfa** eklersen: menüye tüm sayfalarda, `sw.js` içindeki `TEMEL_DOSYALAR`
listesine ve `sitemap.xml`'e ekle; `sw.js` içindeki `SURUM` değerini artır ki eski
önbellek temizlensin.

## Word belgesinden içerik aktarma

`tools/docx-aktar.js` bir .docx dosyasını başlık ve tablo yapısını koruyarak düz metne
çevirir. Bağlaçlar sayfası bu araçla üretildi.

```bash
node tools/docx-aktar.js --klasor "klasör/yolu"        # belgeleri listele
node tools/docx-aktar.js "belge.docx" cikti.txt        # metne çevir
```

Sistemde `unzip` bulunmalı (Git Bash ile birlikte gelir).

## Yerel önizleme

`index.html` dosyasına çift tıklamak yeterli. Service worker'ı da denemek istersen:

```bash
python -m http.server 8000    # sonra http://localhost:8000
```

## Yayınlama

`main` dalına gönderilen her değişiklik GitHub Pages tarafından birkaç dakika içinde
yayımlanır. `sw.js` önbelleğe aldığı için, kullanıcıların güncellemeyi hemen görmesi
gerekiyorsa `SURUM` değerini artırmayı unutma.
