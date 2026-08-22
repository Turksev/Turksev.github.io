# Turksev.github.io — YDS Hazırlık

YDS'ye hazırlananlar için statik bir çalışma sitesi. Sunucu, kurulum ya da kayıt gerekmez;
tüm ilerleme ziyaretçinin kendi tarayıcısında (`localStorage`) saklanır.

Yayında: <https://turksev.github.io>

## Sayfalar

| Dosya | İçerik |
| --- | --- |
| `index.html` | Ana sayfa ve ilerleme paneli: tekrar durumu, yanlış defteri, deneme geçmişi, kategori karnesi |
| `kelimeler.html` | 7.859 kelime, 7 katman + **aralıklı tekrar (Leitner)**: bugünün destesi, kart modu, ipucu, sesli okuma |
| `obekler.html` | 2.067 kelime öbeği (phrasal verb, deyimsel fiil, sabit ifade) — ayrı Leitner destesi |
| `quiz.html` | Alıştırma soruları: 12 kategori, anında çözüm, yanlış defterinden çalışma |
| `deneme.html` | **Süreli deneme sınavı**: geri sayım, soru ızgarası, işaretleme, net hesabı, kategori karnesi |
| `gramer.html` | 10 başlıkta konu anlatımı, kural tabloları ve sınav tuzakları |
| `baglaclar.html` | Bağlaçlar ve geçiş ifadeleri: çözüm yöntemi, yapı tabloları, filtrelenebilir 155 kayıtlık banka |
| `ara.html` | Site geneli arama: kelimeler, öbekler, bağlaçlar, sorular ve gramer konuları |

## İçerik

- **7.859 kelime** — 49 gerçek YDS sınavındaki geçme sıklığına göre puanlanmış, yedi katmana ayrılmış;
  her birinde Türkçe anlam + İngilizce örnek cümle + çeviri (1.113'ünde ikinci anlam da var)
- **2.067 kelime öbeği** — phrasal verb, deyimsel fiil ve sabit ifadeler, kaç sınavda geçtiği bilgisiyle
- **125 soru** — 12 kategori: Kelime, Dil Bilgisi, Bağlaç, Preposition, Cloze Test, Çeviri,
  Cümle Tamamlama, Restatement, Paragraf Tamamlama, Anlamı Bozan Cümle, Diyalog, Okuma
- **155 bağlaç** — anlam ilişkisi ve "sonrasında ne gelir" etiketleriyle
- **10 gramer konusu** — tablolar ve örneklerle

### Kelime katmanları

Kelimeler, `YDS Öncelik Puanı`na göre beşe ayrıldı. Puan
`100 × (0.50·S + 0.20·F + 0.30·P)` formülünden gelir — S: kaç farklı sınavda geçtiği (ana kriter),
F: toplam frekans, P: akademik önsel (NGSL/NAWL/AWL üyeliği + Zipf).

| Katman | Puan | Kelime | Dosya (gzip) |
| --- | --- | --- | --- |
| 1 · Temel | ≥ 40 | 657 | 92 K |
| 2 · Çekirdek | 30–40 | 720 | 95 K |
| 3 · Orta | 25–30 | 708 | 90 K |
| 4 · İleri | 20–25 | 1.073 | 151 K |
| 5 · Geniş | 15–20 | 1.565 | 205 K |
| 6 · Geniş+ | 10–15 | 3.135 | 353 K |
| 7 · Aile üyeleri | puansız | (kaynağa göre) | — |

6. katman 21.08.2026'da eşik 15 → 10'a indirilince geldi (`Calisma_Listesi_v4_site_tam.xlsx`);
5. katmanı genişletmek yerine ayrı katman açıldı ki isteyen açsın, mevcut desteler değişmesin.

Kullanıcı hangi katmanları seçerse yalnız onlar indirilir. Çekirdekten çalışan biri toplam
**~263 K** veri indirir; hepsini açan ~1,15 MB. Dizin (`data/kelime-dizin.js`, 168 K gzip) her sayfada
yüklüdür ve yazılış + kısa anlam + puan + katman bilgisini taşır; örnek cümleler katman
dosyalarındadır.

1. katman sınavın her yerinde geçen çok temel kelimelerdir (*much, can, people, make*) — büyük
olasılıkla zaten biliyorsundur, atlanabilir. Gerçek YDS kelimeleri 2. katmandan itibaren başlar.

## Dosya düzeni

```
index.html  kelimeler.html  obekler.html  quiz.html  deneme.html
gramer.html  baglaclar.html  ara.html
assets/
  css/style.css       tüm sayfaların ortak stili (açık/koyu tema)
  js/main.js          tema, gezinme, localStorage, service worker kaydı
  js/cekim.js         çekim motoru (test şıkları için)
  js/kelime-testi.js  günün testi: soru kurma, şıklar, sonuç
  js/ilerleme.js      Leitner, yanlış defteri, kategori istatistiği, geçmiş
  js/esitleme-ayar.js Firebase yapılandırması (null ise eşitleme kapalı)
  js/esitleme.js      cihazlar arası eşitleme: Google girişi + Firestore
  js/veri.js          kelime katmanlarını ve öbekleri istendiğinde yükler
  js/kelimeler.js     kelime sayfası
  js/obekler.js       öbek sayfası
  js/quiz.js          alıştırma soruları
  js/deneme.js        süreli sınav
  js/baglaclar.js     bağlaç bankası
  js/ara.js           site geneli arama
  img/                PWA ikonları (tools ile üretildi)
data/
  kelime-dizin.js     7.859 kelime: yazılış, kısa anlam, puan, katman, tür
  test-k1..k7.js      günün testi cümleleri (katman başına, üretildikçe)
  kelime-k1..k7.js    katman katman tam kayıtlar (örnek cümleler)
  obekler.js          2.067 kelime öbeği
  sayilar.js          içerik sayaçları (üretilir)
  sorular.js          soru bankası + okuma parçaları
  baglaclar.js        bağlaç verisi
tools/
  listeyi-aktar.py    XLSX kaynaklardan kelime/öbek veri dosyalarını üretir
  ek-kelimeler.js     dönüştürücü girdisi: elle yazılmış 181 kelime
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

4. ve 5. kutudakiler "öğrenilmiş" sayılır. Kelimeler ve öbekler aynı kutu tablosunu paylaşır
(anahtarlar çakışmaz: öbeklerde boşluk var), ama her sayfanın "sıfırla" düğmesi yalnız kendi
kayıtlarını siler. Aralıkları değiştirmek istersen
`assets/js/ilerleme.js` içindeki `ARALIK` tablosunu düzenle.

**İpucu düğmesi.** Kartın ön yüzünde, kelimenin kendi örnek cümlesini hedef sözcük
`----` ile gizlenmiş olarak gösterir — YDS'nin kelime sorusu formatı. İpucuya baktıktan
sonra "Bildim" dersen kelime **terfi etmez**, aynı kutuda kalıp yeniden zamanlanır; böylece
bağlamla hatırlamak, kelimeyi tek başına bilmekle aynı sayılmaz.

Kelimeyi cümlede bulmak düz aramayla olmuyor, çünkü örnekler çekimli biçim kullanabiliyor
(`accumulate` → "accumulated"). `bosluklaCumle()` sondaki `e`/`y` harfini atıp kökle başlayan
sözcüğü arıyor; bu **4.760 kelimenin 4.747'sini** (%99,7) ve **2.067 öbeğin tamamını** yakalıyor.
Yakalanamayan 13 kelime çoğunlukla düzensiz çekim (`undertake` → "undertook") ya da tireli
varyant (`give-up`, `turn-out`); o kartlarda ipucu düğmesi hiç gösterilmiyor.

Öbeklerde her sözcük ayrı ayrı maskeleniyor (`stem from` → "----  ---- " birleştirilip tek `----`
oluyor), çünkü çekim öbeğin herhangi bir parçasında olabiliyor: *stems from*, *coped with*.

## Günün testi (boşluk doldurma)

Deste bitince (ya da deste kartındaki **Günün testi** düğmesiyle) bugün çalışılan kelimelerden
en çok 20 soruluk, 5 şıklı boşluk doldurma testi açılır. Cümleler **karttaki örnekten bağımsız**,
YDS okuma parçası kayıtında özgün cümlelerdir; `data/test-k{n}.js` içinde durur
(`{kelime: {c, b, f, tr}}` — c boşluklu cümle, b boşluğa gelen çekimli biçim, f çekim türü
`'' | s | past | pp | ing | pl`, tr Türkçesi). Katman dosyası yoksa o katmanın kelimeleri teste girmez.

Şıklar aynı türden, yakın katmandan kelimelerden kurulur ve boşluktaki biçimle **aynı çekime**
sokulur (`assets/js/cekim.js`: düzenli kurallar + düzensiz fiil/isim tablosu); biçim uyumu
cevabı ele vermez. Aynı kök, eş anlamlı ve cümlede geçen kelimeler çeldirici olmaz.

Sonuç Leitner kutusunu **değiştirmez**; bilinemeyen kelime `yds-test-yanlis` defterine girer
(listede ve Durumum'da "testte ✗" rozeti), sonraki testte önce sorulur, doğru bilinince düşer.
Defter cihazlar arasında eşitlenir.

Cümle üretimi: kelimeler 70'lik paketlere bölünüp (scratchpad `test/paketle.js`) brief ile
yazdırılır, `test/dogrula.js` her kaydı denetler (tek boşluk, 15–36 kelime, çekim-b uyumu,
tür-biçim tutarlılığı, kökün cümlede tekrar etmemesi, kart örneğine benzememe) ve geçenleri
`data/test-k{n}.js` olarak yazar.

## Cihazlar arası eşitleme (Firebase)

İlerleme localStorage'da yaşar; eşitleme açıksa bunun bir bulut kopyası da tutulur.
Başlıktaki **⇅** düğmesiyle Google hesabına bir kez giriş yapılır; sonrası görünmezdir:

- Açılışta bulut ile yerel **birleştirilir** — her kelimede en son çalışılan kayıt
  kazanır (tekrar gününden geriye hesaplanır), yanlış defteri ve geçmiş birleşir,
  rekorun yükseği kalır, katman/eksen tercihleri yalnız boşsa buluttan alınır.
  Yerel veri değiştiyse sayfa bir kez yenilenir (sessionStorage işareti döngüyü keser).
- Sonraki her değişiklik 2,5 sn gecikmeyle buluta yazılır; sekme kapanırken hemen.
- Veri, kullanıcı başına tek Firestore belgesidir: `kullanicilar/{uid}` içinde
  `{ surum, zaman, json }`. Bütün yds-* anahtarları tek JSON metni olarak durur
  (Firestore alan adları her karakteri kaldırmıyor). Karşılaştırmalar anahtar
  sıralayan kararlı JSON ile yapılır ki iki cihaz aynı veriyi farklı sırayla
  yazıp durmasın.
- `esitleme-ayar.js` içindeki `FIREBASE_AYAR` null ise her şey kapalıdır; site
  yalnız yerel depoyla çalışır. Çıkış yapmak yerel veriyi silmez.

Firebase tarafı (bir kerelik kurulum): konsolda proje aç → Web uygulaması ekle ve
çıkan yapılandırmayı `esitleme-ayar.js`'e koy → Authentication'da Google
sağlayıcısını aç → Authorized domains'e `turksev.github.io` ekle → Firestore
veritabanı oluştur ve şu kuralları yayınla:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /kullanicilar/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

`apiKey` gizli değildir (tarayıcıya zaten iner); veriyi koruyan bu kurallardır.

## Kelime ve öbek verisini yeniden üretmek

`data/kelime-*.js` ve `data/obekler.js` **elle düzenlenmez** — kaynak XLSX dosyalarından üretilir:

```bash
"C:/Users/Trk/Desktop/english claude/.venv/Scripts/python.exe" tools/listeyi-aktar.py
```

Okuduğu kaynaklar (salt okunur, hiçbirine yazılmaz):

| Kaynak | Ne verir |
| --- | --- |
| `english claude/04_cikti/Calisma_Listesi_v4_site_tam.xlsx` | 7.837 puanlanmış kelime (puan ≥ 10), anlam ve örnek cümlelerle; Tür sütunundaki `· temel` / `· çekim` etiketleri atılır |
| `english claude/04_cikti/Kelime_Obekleri_v3.xlsx` | 2.067 öbek |
| `tools/ek-kelimeler.js` | Listede olmayan 52 kelime + ortak 129 kelimenin eş anlamlıları |

Betik `ii`, `iii`, `iv` gibi cloze şık numarası artıklarını atar, harf varyantlarını birleştirir ve
`data/sayilar.js` içindeki sayaçları günceller. Yeni kelimeyi elle eklemek istersen
`tools/ek-kelimeler.js` sonuna yaz ve betiği yeniden çalıştır:

```js
{en:"prudent", tr:"tedbirli, sağduyulu", tip:"sıfat", sv:"ileri",
 ex:"It would be prudent to wait for the results.",
 exTr:"Sonuçları beklemek tedbirli olur.", es:"cautious, sensible"}
```

`sv` alanı (`temel`/`orta`/`ileri`) bu kelimenin hangi katmana gireceğini belirler: sırasıyla 2, 3, 4.

## İçerik eklemek

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

## Konu anlatımı ekleme (düzenli iş akışı)

Konu haritasındaki 129 ünitenin şu an **6'sının** anlatımı var. Yenisini eklemek için:

1. Anlatımı `.docx` olarak hazırla. Dosya adı **ünite koduyla başlasın**:
   `T07_Niceleyici_ve_Butun_Parca.docx`, `E14_Zaman_ve_Kosul_Yan_Cumleleri.docx`
2. Dosyayı `C:\Users\Trk\Desktop\English konu - chatgpt` klasörünün **herhangi bir yerine**
   koy — alt klasörler de taranır, ayrı bir yere koyman gerekmez.
3. Aktarıcıyı çalıştır:

```bash
"C:/Users/Trk/Desktop/english claude/.venv/Scripts/python.exe" tools/konu-aktar.py
```

Betik hangi ünitelerin dolduğunu ve hangilerinin boş kaldığını yazar; haritada olmayan bir
kod, okunamayan dosya ya da şüpheli kısalıkta bir metin varsa uyarır.

**Belge yapısı.** Dönüştürücü mevcut altı konunun iskeletini bekler; aynı biçimi korursan
sayfa kendiliğinden doğru çıkar:

| Belgede | Sitede |
| --- | --- |
| İlk iki `Başlık 1` | Konu adı ve alt başlık (sayfa üstünde ayrıca yazılır) |
| Sonraki `Başlık 1`'ler | Bölüm başlıkları — içindekiler bunlardan üretilir |
| `Başlık 2` | Alt başlık |
| Word tablosu | Tablo (tek hücreli olan vurgu kutusu olur) |
| Madde imli liste | Liste |

Yeni ünite **kodu** eklemek istersen (haritada olmayan bir konu), önce iki `.md`
haritasından ilgili olanına satır ekle; aktarıcı kodu haritada bulamazsa belgeyi atlar.

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
