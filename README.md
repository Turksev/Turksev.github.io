# Turksev.github.io — YDS Hazırlık

YDS'ye hazırlananlar için statik bir çalışma sitesi. Sunucu, kurulum ya da kayıt gerekmez;
tüm ilerleme ziyaretçinin kendi tarayıcısında (`localStorage`) saklanır.

Yayında: <https://turksev.github.io>

## Sayfalar

| Dosya | İçerik |
| --- | --- |
| `index.html` | Ana sayfa: **YDS bölüm dağılımı tablosu** (80 sorunun hangi aralıkta hangi bölüm olduğu) ve ilerleme paneli — tekrar durumu, yanlış defteri, deneme geçmişi, kategori karnesi |
| `durum.html` | Çalışılmış her şey tek listede (kelime, öbek, aile üyesi): üstte **sistemdeki toplam kayıt**, kutu sekmelerinde sayı ve bu toplama oranı ("hepsi" dahil), arama/süzme/sıralama |
| `kelimeler.html` | 8.440 kelime ve yapı, 7 katman + **aralıklı tekrar (Leitner)**: bugünün destesi, kart modu, ipucu, sesli okuma |
| `obekler.html` | 1.631 kelime öbeği (560 deyimsel fiil, 333 edat kalıbı, sabit/geçiş ifadeleri) — ayrı Leitner destesi |
| `quiz.html` | Alıştırma soruları: 12 kategori, anında çözüm, yanlış defterinden çalışma |
| `deneme.html` | **Süreli deneme sınavı**: üç sabit 80 soruluk form, geri sayım, soru ızgarası, işaretleme, yenileme sonrası oturum kurtarma, 100 üzerinden YDS puanı, kategori karnesi |
| `gramer.html` | 10 başlıkta konu anlatımı, kural tabloları ve sınav tuzakları |
| `konular.html` | Türkçe ve İngilizce eksenli **129/129 YDS ünitesi**: ayrıntılı anlatım, çözüm yolu, tuzaklar ve mini uygulamalar |
| `baglaclar.html` | Bağlaçlar ve geçiş ifadeleri: çözüm yöntemi, yapı tabloları, filtrelenebilir 155 kayıtlık banka |
| `ara.html` | Site geneli arama: kelimeler, öbekler, bağlaçlar, sorular, gramer konuları, YDS konu haritası üniteleri ve kelime aileleri — sonuç **tek tıklamayla** açılır |

## İçerik

- **8.440 kelime ve yapı** — 49 gerçek YDS sınavı temel alınarak puanlanan listeye ek olarak gerekçesi kayıtlı üç puansız kalıp içerir; yedi katmana ayrılmıştır;
  her birinde Türkçe anlam + İngilizce örnek cümle + çeviri (**3.143'ünde birden çok anlam** var)
- **1.631 kelime öbeği** — deyimsel fiil (phrasal verb), edat kalıbı, sabit ve geçiş ifadeleri, kaç sınavda geçtiği bilgisiyle
- **286 soru** — 12 kategori: Kelime, Dil Bilgisi, Bağlaç, Preposition, Cloze Test, Çeviri,
  Cümle Tamamlama, Restatement, Paragraf Tamamlama, Anlamı Bozan Cümle, Diyalog, Okuma
  (80 soruluk A/B/C formlarında 240 farklı soru; doğru şıklar her formda A–E arasında 16'şar kez dağılır)
- **155 bağlaç** — anlam ilişkisi ve "sonrasında ne gelir" etiketleriyle
- **10 gramer konusu** — tablolar ve örneklerle
- **129 YDS konu ünitesi** — Türkçe–İngilizce aktarım sorunları ve İngilizce yapı sistemi
  için çözüm yolu, sık tuzaklar, mini tanı ve gerekçeli cevaplarla eksiksiz anlatım

### Kelime katmanları

Kelimeler, `YDS Öncelik Puanı`na göre yedi katmanda sunulur. Puanlı ilk altı katmanın puanı
`100 × (0.50·S + 0.20·F + 0.30·P)` formülünden gelir — S: kaç farklı sınavda geçtiği (ana kriter),
F: toplam frekans, P: akademik önsel (NGSL/NAWL/AWL üyeliği + Zipf).

| Katman | Puan | Kelime | Dosya (gzip) |
| --- | --- | --- | --- |
| 1 · Temel | ≥ 40 | 667 | 97 K |
| 2 · Çekirdek | 30–40 | 726 | 125 K |
| 3 · Orta | 25–30 | 710 | 117 K |
| 4 · İleri | 17–25 | 1.856 | 313 K |
| 5 · Geniş | 12–17 | 2.069 | 288 K |
| 6 · Geniş+ | 10–12 + denetimli ekler | 1.917 | 241 K |
| 7 · Aile üyeleri | < 10 veya denetimli kök | 495 | 66 K |

6. katman 21.08.2026'da eşik 15 → 10'a indirilince geldi (`Calisma_Listesi_v4_site_tam.xlsx`);
5. katmanı genişletmek yerine ayrı katman açıldı ki isteyen açsın, mevcut desteler değişmesin.

**Alt uç 25.08.2026'da yeniden bantlandı.** Eski 20/15/10 eşikleri 4-5-6. katmanı
1.058 / 1.564 / **3.127** yapıyordu: kelimelerin %40'ı tek kovada yığılıyordu, çünkü
liste 10 puanda kesildiği için puanlar tabana toplanıyor (yalnız 10–11 aralığında 1.142
kelime var). 17/12/10 ile üçü de ~1.900 oldu. Üst uca **bilerek dokunulmadı**: 1-4. katman
zaten dengeliydi (667/726/710) ve 40 eşiği Temel'i "zaten biliyorsundur, atlanabilir"
kıvamında tutuyor — eşiği indirmek oraya `crucial`, `acquire`, `perspective` gibi
çalışılması gereken kelimeleri sokardı. Katman değiştiren kelime: 2.004 (%25); tekrar
ilerlemesi kelime adına bağlı olduğu için (`yds-leitner`) hiçbir kutu etkilenmedi.

Kullanıcı hangi katmanları seçerse yalnız onlar indirilir. Çekirdekten çalışan biri toplam
**~305 K** veri indirir; hepsini açan dizinle birlikte ~1,37 MB. Dizin (`data/kelime-dizin.js`, yaklaşık 184 KiB gzip) her sayfada
yüklüdür ve yazılış + kısa anlam + puan + katman bilgisini taşır; örnek cümleler katman
dosyalarındadır.

1. katman sınavın her yerinde geçen çok temel kelimelerdir (*much, can, people, make*) — büyük
olasılıkla zaten biliyorsundur, atlanabilir. Gerçek YDS kelimeleri 2. katmandan itibaren başlar.

## Dosya düzeni

```
index.html  kelimeler.html  obekler.html  quiz.html  deneme.html
gramer.html  konular.html  baglaclar.html  ara.html
assets/
  css/style.css       tüm sayfaların ortak stili (açık/koyu tema)
  js/main.js          tema, gezinme, localStorage, iki aşamalı onay, service worker kaydı
  js/main.js içinde ayrıca alt bilgideki depo kullanım çubuğu (data/depo.js'i okur)
  js/cekim.js         çekim motoru (test şıkları için)
  js/gunun-testi.js   günün testi (kelime + öbek): soru kurma, şıklar, sonuç
  js/ilerleme.js      Leitner, yanlış defteri, kategori istatistiği, geçmiş
  js/esitleme-ayar.js Firebase yapılandırması (null ise eşitleme kapalı)
  js/esitleme-veri.js kayıt sürümü, silme işareti ve deterministik birleştirme motoru
  js/esitleme-depo.js localStorage köprüsü, sekmeler arası birleşim ve geçiş yedeği
  js/esitleme-v2.js   Google girişi, işlemli Firestore eşitlemesi ve canlı dinleyici
  js/veri.js          kelime katmanlarını ve öbekleri istendiğinde yükler
  js/kelimeler.js     kelime sayfası
  js/obekler.js       öbek sayfası
  js/quiz.js          alıştırma soruları
  js/deneme-oturum.js denemenin sessionStorage içindeki doğrulanan geçici kurtarma kaydı
  js/deneme.js        süreli sınav
  js/baglaclar.js     bağlaç bankası
  js/ara.js           site geneli arama
  img/                PWA ikonları (tools ile üretildi)
data/
  kelime-dizin.js     8.440 kelime/yapı: yazılış, kısa anlam, puan, katman, tür
  test-k1..k7.js      8.375 sözcük için günün testi cümlesi
  test-modal.js       65 yeni modal/özel yapı için günün testi cümlesi
  test-obek.js        öbekler için günün testi cümleleri
  kelime-k1..k7.js    katman katman tam kayıtlar (örnek cümleler)
  aileler.js          kalıcı karar manifestinden üretilen kelime aileleri
  kelime-aliaslari.js eski başlıklardaki ilerlemeyi düzeltilmiş başlıklara taşır
  kelime-provenans.json denetlenen öğelerin sınav kimliği/sayfa/soru kaynakları
  obekler.js          1.631 kelime öbeği
  sayilar.js          içerik sayaçları (üretilir)
  sorular.js          temel soru bankası + okuma parçaları
  sorular-ek.js       özgün ek soru bankası ve pasajlar (üretilir)
  deneme-formlari.js  üç sabit 80 soruluk form ve dengeli şık yerleşimi (üretilir)
  baglaclar.js        bağlaç verisi
  konular.js          129 ünitenin konu haritası
  konu-metinleri.js   temel 6 konu anlatımı
  konu-metinleri-t-ek.js Türkçe ekseninin kalan 55 anlatımı
  konu-metinleri-e1-ek.js, konu-metinleri-e2-ek.js İngilizce ekseninin 68 anlatımı
  kaynak-manifest.json 49 sınav PDF'sinin içerik kopyalamayan provenans kaydı
tools/                geliştirme/üretim araçları; _config.yml ile canlı yayının dışında
  listeyi-aktar.py    XLSX kaynaklardan kelime/öbek veri dosyalarını üretir
  aile-manifest.json  kelime ailelerinin tek doğruluk kaynağı; taşınmış taban ve denetimli kararlar
  aile-kart-bekleyenler.json düşük-Zipf orta adayların kart üretmeyen denetim defteri
  aile-cikar.py       manifestten data/aileler.js üretir; ek kuralları yalnız aday gösterir
  kelime-duzeltmeleri.json PDF/sözlük denetimli dokuz başlık düzeltmesinin tek kaynağı
  ek-kelimeler.js     dönüştürücü girdisi: elle yazılmış 181 kelime
  docx-aktar.js       Word belgelerini düz metne çevirir
manifest.webmanifest  telefona kurulum
sw.js                 çevrimdışı çalışma
firestore.rules       kullanıcıyı yalnız kendi eşitleme belgesiyle sınırlayan kurallar
firebase.json         Firestore kural dosyasının sürümlü dağıtım ayarı
sitemap.xml  robots.txt
```

Veriler `fetch` yerine düz `<script>` ile yüklenir; böylece dosyaları çift tıklayıp
`file://` üzerinden de açabilirsin, ayrı bir yerel sunucuya gerek kalmaz.
(Service worker yalnızca HTTPS ve `localhost` üzerinde etkinleşir.)

## Aralıklı tekrar nasıl çalışıyor?

Her kelime 1–5 arası bir kutuda durur. Kart modunda **✓ Bildim** dersen bir üst kutuya
çıkar ve daha seyrek sorulur; **✗ Bilemedim** dersen bir kutu geri düşer.

| Kutu | Sonraki tekrar |
| --- | --- |
| 1 | 1 gün sonra |
| 2 | 3 gün sonra |
| 3 | 7 gün sonra |
| 4 | 15 gün sonra |
| 5 | **Öğrenildi — yeniden sorulmaz** |

**Yanlış cevap bir kutu geri düşürür** (sıfırlamaz) ve kelimeyi ertesi güne alır: bir aydır
bildiğin kelimeyi tek şaşırmada baştan başlatmak tekrar yükünü katlıyordu.

**5. kutu öğrenildi durumudur.** Kart, kullanıcı ilerlemeyi sıfırlayana kadar çalışma
destesine ve günün kelime testine yeniden girmez.

**Günlük toplam kart tavanı.** Kelime sayfasındaki "Bugün toplam kart" seçicisi destenin
boyunu sınırlar (`yds-gunluk-tavan`, varsayılan 30). Sıra şu: önce vadesi gelmiş tekrarlar
**en çok gecikmiş olandan başlayarak** kapasiteyi doldurur; yalnız kalan yere günlük hedef
kadar yeni kart eklenir. Böylece tekrar borcu varken yeni kartlar otomatik azalır. Sığmayan varsa deste
kutusunda "N tekrar bugünkü sınıra sığmadı" notu çıkar.

**Birikmiş yığını dağıtma.** Eski kurgudan (her "Bilemedim" 1. kutuya atıyordu, tekrara tavan
yoktu) yüzlerce gecikmiş tekrar kalmış olabilir. Bekleyen 40'ı geçince çıkan
"Birikmiş tekrarları günlere dağıt" düğmesi `Ilerleme.birikmisiYay()` çağırır: hiçbir kayıt
silinmez, vadesi geçmiş kelimeler en çok gecikmiş olan önce gelecek şekilde günlük tavana
bölünüp önümüzdeki günlere yayılır.

Kelimeler ve öbekler aynı kutu tablosunda tutulur; görünür başlığı çakışabilen kayıtlar türü
belirten kanonik kimliklerle ayrılır (örneğin kelime `@kelime:hand down`, öbek `hand down`).
Her sayfanın "sıfırla" düğmesi yalnız kendi türündeki kayıtları siler. Aralıkları değiştirmek istersen
`assets/js/ilerleme.js` içindeki `ARALIK` tablosunu düzenle.

Tam ve karma denemelerin yarım kalan oturumu yalnız aynı sekmenin `sessionStorage` alanına
yazılır; eşitlenebilir ilerleme verisine katılmaz. Kayıtta soru/şık metni ve cevap anahtarı yoktur.
Yenilemede soru bankasından doğrulanarak kurulur, mutlak bitiş zamanı korunur; banka değişmişse
eski kayıt reddedilir. Kullanıcı iki aşamalı **Kaydetmeden bırak** düğmesiyle oturumu geçmişe
sonuç yazmadan silebilir.

Kart örnekleri ipucu için boşluklanır; bu yüzden örnek cümlede hedef kelimenin başka bir
çekimi ya da aynı aileden bir sözcük bulunmamalıdır (yoksa ipucu cevabı ele verir).
`tools/test-uretim/ipucu-tara.py` bu kusuru tarar, düzeltilen cümleler
`tools/ek-ornekler.js` üzerinden kaynağın yerine geçer. Boşluklama düzensiz biçimleri de
yakalar (woman → women, undertake → undertook).

### Arama sonucu ayrıntı kartı

`ara.html` içinde bir sonuca tek tıklamak, sayfadan ayrılmadan kaydın tamamını gösterir:
kelimede bütün anlamlar + örnek cümleler + yakın anlamlılar + olumsuzu + kelime ailesi +
tekrar kutusu + varsa günün testi cümlesi; öbek/bağlaç/soruda tam kayıt; ünitede kapsam,
soru türleri ve TR-hata riski; ailede bütün üyeler ve anlamları. Kelimenin örnek cümleleri
o katman dosyasındaysa kart açıkken arka planda indirilip tazelenir.

Karttaki "… sayfasında aç" düğmesi hedef sayfaya sorguyla gider:
`kelimeler.html?q=`, `aileler.html?a=`, `konular.html#KOD`.

**Sıfırlama koruması.** Sıfırlama düğmeleri `YDS.ikiKereSor()` ile **iki ayrı onay** ister
(ilkinde kaç kayıt silineceği ve eşitleme uyarısı yazar). Silmeden önce
`Ilerleme.yedekAl()` son hali `yds-son-yedek` altına kopyalar; düğmenin yanında çıkan
**Geri al** 7 gün boyunca kayıtları geri koyar (birleştirir, hiçbir şeyi silmez).

Not: servis çalışanı dosyaları önbellekten sunup arka planda tazeliyordu, bu yüzden yeni
kod kullanıcıya bir açılış geç ulaşıyordu. Artık `controllerchange` ve ilk bulut birleşimi
aynı yeniden yükleme koordinatöründen geçiyor; aynı sayfa yaşamında en fazla bir kez
yenileniyor. Her açılışta `registration.update()` çağrılıyor.

**Kullanım kalıpları.** Kelimenin tipik kalıpları görünür: `comply with the rules —
kurallara uymak`. Listede ve kart arkasında **örnek cümlelerin üstünde**, ortalanmış bir
şerit olarak durur (`.kalip.ust`); arama kartındaki başlıklı bölümde sola yaslı kalır. Amaç anlamı değil **kullanımı**
öğretmek; Türkçe fiilin istediği ek İngilizceye taşınınca çıkan hatayı önlemek
(*comply to* değil *comply with*). Kalıplar `tools/kaliplar.js` içindedir, katman
dosyalarına `kl` alanı olarak gömülür. Kalıbı olmayan somut kelimelerde (tiger, table) yoktur.
Üretim: `tools/test-uretim/kalip-paketle.py` → agent (`kalip-brief.md`) → `kalip-dogrula.py`.

**Anlam yıldızları.** Çok anlamlı kelimelerde her anlamın yanında YDS önemi durur:
★★★★ = sınavda asıl sorulan anlam, ★★★ = sık geçer, ★★ = ara sıra, ★ = nadir/ikincil.
Yıldız kelimenin genel önemini (o zaten puan rozetinde) değil, **o kelimenin anlamları
arasındaki baskınlığı** gösterir; bu yüzden her kelimenin en yüksek yıldızı en az üçtür.

```
grind   f. öğütmek                            ★★★★
        i. angarya                            ★
fine    s. ince, güzel, iyi                   ★★★
        f. cezalandırmak, para cezası kesmek  ★
```

Anlamlar **yıldıza göre sıralanır**, yani baskın anlam başa gelir. Kaynak listedeki sıra
rastgeleydi: ilk 150 kelimenin 34'ünde önemsiz anlam üstteydi. Sıra düzelince dizindeki
kısa anlam ve İpucu düğmesinin gösterdiği örnek cümle de baskın anlama geçer.

Yıldızlar `tools/anlam-yildiz.js` içindedir ve **anlam metnine** bağlıdır, sıraya değil;
kaynak listedeki sıra değişse bile eşleşme bozulmaz. Katman ve öbek dosyalarına `yz` alanı
olarak gömülür. Üretim: `tools/test-uretim/yildiz-paketle.py` → agent (`yildiz-brief.md`)
→ `yildiz-dogrula.py`.

**Kutu süzgeci.** Deste kartındaki kutu sayaçları (yeni · 1–4. kutu · öğrenildi) tıklanabilir:
bir kutuya basınca liste yalnız o kutudaki kelimeleri/öbekleri gösterir, yeniden basınca süzgeç
kalkar. Kelime ve öbek sayfasının ikisinde de var.

**İpucu düğmesi.** Kartın ön yüzünde, kelimenin kendi örnek cümlesini hedef sözcük
`----` ile gizlenmiş olarak gösterir — YDS'nin kelime sorusu formatı. İpucuya baktıktan
sonra "Bildim" dersen kelime **terfi etmez**, aynı kutuda kalıp yeniden zamanlanır; böylece
bağlamla hatırlamak, kelimeyi tek başına bilmekle aynı sayılmaz.

Kelimeyi cümlede bulmak düz aramayla olmuyor, çünkü örnekler çekimli biçim kullanabiliyor
(`accumulate` → "accumulated"). `bosluklaCumle()` sondaki `e`/`y` harfini atıp kökle başlayan
sözcüğü arıyor; bu **4.760 kelimenin 4.747'sini** (%99,7) ve **öbeklerin tamamını** yakalıyor.
Yakalanamayan 13 kelime çoğunlukla düzensiz çekim (`undertake` → "undertook") ya da tireli
varyant (`give-up`, `turn-out`); o kartlarda ipucu düğmesi hiç gösterilmiyor.

Öbeklerde her sözcük ayrı ayrı maskeleniyor (`stem from` → "----  ---- " birleştirilip tek `----`
oluyor), çünkü çekim öbeğin herhangi bir parçasında olabiliyor: *stems from*, *coped with*.

## Günün testi (boşluk doldurma)

Deste bitince (ya da deste kartındaki **Günün testi** düğmesiyle) bugün çalışılan kelimelerden
en çok 20 soruluk, 5 şıklı boşluk doldurma testi açılır. Cümleler **karttaki örnekten bağımsız**,
YDS okuma parçası kayıtında özgün cümlelerdir; `data/test-k{n}.js` içinde durur
(`{kelime: {c, b, f, tr}}` — c boşluklu cümle, b boşluğa gelen çekimli biçim, f çekim türü
`'' | s | past | pp | ing | pl`, tr Türkçesi). **Havuzun tamamı hazır** (28.08.2026):
7 katman ve modal/özel yapı testleriyle bütün **8.440 kelime ve yapı** için cümle; ayrıca **1.631 öbek kartının 892'si** için bağımsız test cümlesi var.
7. katmanın 495 kaydı için `test-k7.js` bulunur; yükleyici bu katmanı da diğer
katmanlarla aynı biçimde test havuzuna katar.

Şıklar aynı türden, yakın katmandan kelimelerden kurulur ve boşluktaki biçimle **aynı çekime**
sokulur (`assets/js/cekim.js`: düzenli kurallar + düzensiz fiil/isim tablosu); biçim uyumu
cevabı ele vermez. Aynı kök, eş anlamlı ve cümlede geçen kelimeler çeldirici olmaz.

Doğru sonuç Leitner kutusunu yükseltmez; bilinemeyen kelime ise bir kutu geri düşüp ertesi
güne alınır ve `yds-test-yanlis` defterine girer
(listede ve Durumum'da "testte ✗" rozeti), sonraki testte önce sorulur; defterden çıkması
için iki ayrı günde doğru bilinmesi gerekir.
Defter cihazlar arasında eşitlenir.

**Öbekler için de test var.** `obekler.html` aynı test modülünü `kaynak='obek'` ile çağırır;
cümleler `data/test-obek.js` içindedir (deyimsel fiil + edat kalıbı). Şıklar aynı türden
öbeklerden seçilir ve aynı çekime sokulur — çekim öbeğin ilk kelimesine uygulanır
(`bring about` + past → `brought about`), edat aynen kalır.

Cümle üretimi `tools/test-uretim/` altındadır (kuyruk ve çalıştırma yönergesi:
`tools/test-uretim/KUYRUK.md`). Kelimeler 70'lik paketlere bölünüp brief ile
yazdırılır, `dogrula.py` her kaydı denetler (tek boşluk, 15–36 kelime, çekim-b uyumu,
tür-biçim tutarlılığı, kökün cümlede tekrar etmemesi, kart örneğine benzememe) ve geçenleri
`data/test-k{n}.js` olarak yazar. Çekim motorunun Python karşılığı (`cekim.py`) ile JS
sürümünün paritesi `parite.html` üzerinden sınanır; uçtan uca test `harness.html`.

## Depo kullanımı

Alt bilgideki çubuk, yayımlanan dosyaların toplam boyutunu GitHub Pages'in **1 GB**
yumuşak sınırına oranlar. Sayılar `data/depo.js` içindedir ve `tools/depo-olcu.py`
üretir — yayından önce çalıştır:

```
python tools/depo-olcu.py
```

Betik `.git`, `__pycache__`, `tools` gibi yayımlanmayan klasörleri saymaz; toplam boyut,
dosya sayısı ve en büyük beş klasörü yazar (çubuğun üzerine gelince ayrıntı görünür).
%70'i geçince çubuk sarıya, %90'ı geçince kırmızıya döner.

30.08.2026'da çubuk alt bilgide **her sayfada** görünür oldu (önce yalnız `localhost` ya da
`?debug=depo` ile açılıyordu) ve oradaki *Yöntem ve kaynaklar · Gizlilik ve veriler ·
Hata bildir* bağlantı üçlüsünün yerini aldı. `yontem.html` ve `ayarlar.html` sayfaları
duruyor ama artık hiçbir yerden bağlantı verilmiyor; yalnız doğrudan adresle açılırlar.

## Cihazlar arası eşitleme (Firebase)

İlerleme localStorage'da yaşar; eşitleme açıksa bunun bir bulut kopyası da tutulur.
Başlıktaki **⇅** düğmesiyle Google hesabına bir kez giriş yapılır; sonrası görünmezdir:

- Eski `yds-*` anahtarları uygulamanın okuma biçimi olarak korunur. Eşitlenen asıl
  `yds-esitleme-v2` zarfında her kayıt ayrı mantıksal sürüm taşır; silmeler de mezar taşı
  olarak saklanır. Böylece çevrimdışı kalan cihaz eski bir kaydı geri diriltemez ve iki
  cihazın farklı kelimelerde yaptığı çalışmalar birbirini ezmez.
- Açılıştaki birleşim Firestore işlemi içinde eski kök belgeyi ve güncel alan belgelerini
  yeniden okuyarak yapılır. İlk birleşimden sonra belgeler canlı dinlenir; başka cihazın
  değişikliği açık sayfaya gelir.
  Yerel görünüm değişirse sayfa, servis çalışanıyla ortak tek koordinatörden bir kez yenilenir.
- Sonraki her değişiklik 2,5 sn gecikmeyle buluta yazılır; sekme kapanırken hemen denenir.
  Yerel geçiş öncesi görüntü `yds-esitleme-gecis-yedegi`, eski bulut belgesi de
  `yds-esitleme-bulut-gecis-yedegi` altında bir kez korunur.
- Veri, Firestore'un 1 MiB belge sınırına takılmaması için alan başına ayrılır:
  `kullanicilar/{uid}/alanlar/{anahtar}` içinde
  büyük `yds-leitner` ve `yds-test-yanlis` alanları dış `surum: 3` ve iç `k: 2` kısa
  JSON taşır; diğer on alan dış `surum: 2` ve nesne JSON biçiminde kalır. Yerel
  `yds-esitleme-v2` zarfının sürümü 2'dir. Bir kelime çalışıldığında yalnız değişen alan
  okunup yazılır. Önceki sürümün `kullanicilar/{uid}` kök belgesi silinmez; ilk açılışta
  yeni alanlara kayıpsız birleştirilir ve eski açık sekmelerden gelebilecek son kayıtlar
  da dinlenir. Her alan için 900 KiB istemci koruması vardır; sınır yaklaşırsa bulut
  yazımı durur, yerel ilerleme korunur. Yazmalar işlemli olduğu için eşzamanlı cihaz
  güncellemeleri güncel alan belgesiyle yeniden birleştirilir.
- `esitleme-ayar.js` içindeki `FIREBASE_AYAR` null ise her şey kapalıdır; site
  yalnız yerel depoyla çalışır. Firebase CDN erişilemezse küçük bir "Bulut eşitleme
  çevrimdışı" uyarısı görünür; yerel çalışma ve mevcut ilerleme etkilenmez. Çıkış yapmak
  yerel veriyi silmez.

Firebase tarafı (bir kerelik kurulum): konsolda proje aç → Web uygulaması ekle ve
çıkan yapılandırmayı `esitleme-ayar.js`'e koy → Authentication'da Google
sağlayıcısını aç → Authorized domains'e `turksev.github.io` ekle → Firestore
veritabanı oluştur. Güvenlik kuralları `firestore.rules` içinde sürümlenir;
Firebase CLI ile şu komutla yayınlanır:

**Yayın sırası zorunludur:** Önce aşağıdaki Firestore kuralları dağıtılmalı ve başarıyla
etkinleştiği doğrulanmalıdır; Pages/site sürümü ancak bundan sonra yayınlanmalıdır.
Ters sıra, yeni istemcinin dış sürüm 3 belgelerini eski kurallarla yazmaya çalışmasına
yol açar.

```bash
firebase deploy --only firestore:rules --project yds-hazirlik-d05ce
```

Kurallar, oturum açmış kullanıcıya yalnız `kullanicilar/{kendi uid'si}` ağacını açar;
eski kök zarfı ile 12 izinli alan belgesinin kimliğini, şemasını ve boyut üst sınırını
doğrular. `apiKey` gizli değildir (tarayıcıya zaten iner); veriyi koruyan bu kurallardır.
Statik regresyon:

```bash
node tools/test-uretim/firestore-kurallar-test.js
```

## Sınav kaynağı ve provenans

Kelime yazımı, sınavda geçişi ve bağlam anlamı için ana doğruluk kaynağı
`C:\Users\Trk\Desktop\YDS Soru Veritabanı\08_unique_exam_pdfs` klasöründeki 49
YDS/e-YDS PDF'sidir. XLSX dosyaları ve üretilmiş `data/kelime-*.js` kayıtları çalışma
çıktısıdır; PDF ile çeliştiklerinde son söz PDF denetiminindir.

Kaynak zinciri iki ayrı provenans katmanıyla korunur:

1. `data/kaynak-manifest.json`, kullanılan 49 PDF'nin sınav kimliğini, dosya boyutunu ve
   SHA-256 özetini taşır. Böylece önce doğru kaynak kümesi ve dosya bütünlüğü doğrulanır.
2. `data/kelime-provenans.json`, denetlenen kelimenin sınav kimliği, PDF sayfası,
   soru/şık, yüzey biçimi ve bağlam anlamı gibi öğe düzeyi kaynağını tutar. Telifli soru
   metnini kopyalamaz.

Yeniden üretimde öncelik sırası **PDF → kaynak manifesti → öğe provenansı ve doğrulanmış
düzeltme → türetilmiş XLSX/JS çıktısıdır**. Alt basamaktaki veri üst basamaktaki kanıtı
sessizce ezmemelidir. Manifest yeniden üretimi:

```bash
python tools/kaynak-manifesti.py
```

Betik varsayılan olarak `YDS Soru Veritabanı/08_unique_exam_pdfs` klasöründe tam
49 PDF bekler; sayı, dosya adı şeması, sınav kimliği veya içerik özeti yinelenirse
manifesti yazmadan hata verir. Sınav belgeleri ve soru metinleri üzerindeki haklar
ilgili hak sahiplerine aittir; manifestin bulunması yeniden kullanım izni anlamına gelmez.

### Düzeltilen kelime başlıkları ve ilerleme güvenliği

Önceden kullanıcı kararı bekleyen dokuz şüpheli başlık artık PDF bağlamı ve gerektiğinde
yetkili sözlüklerle incelenip sonuçlandırıldı. Kararlar `tools/kelime-duzeltmeleri.json`
içinde tek kaynak olarak tutulur; anlam, örnek, kalıp ve mevcutsa sınav kanıtı buradan
üretime girer. Bekleyen başlık kararı kalmamıştır.

Başlık değişikliği, kullanıcının eski ad altında tuttuğu Leitner kutusunu veya test yanlışını
silmez. Üretimde oluşan `data/kelime-aliaslari.js`, eski başlıkları yeni kanonik başlıklara
eşler; yerel ve bulut birleşimi sırasında iki taraftaki ilerleme kayıpsız biçimde birleştirilir.
`data/kelime-provenans.json` ise bu düzeltmelerin öğe düzeyindeki kaynak izini yayımlanan
veriden bağımsız olarak denetlenebilir kılar.

## Kelime ve öbek verisini yeniden üretmek

`data/kelime-*.js` ve `data/obekler.js` **elle düzenlenmez** — kaynak XLSX dosyalarından üretilir:

```bash
"C:/Users/Trk/Desktop/english claude/.venv/Scripts/python.exe" tools/listeyi-aktar.py
```

Okuduğu kaynaklar (salt okunur, hiçbirine yazılmaz):

| Kaynak | Ne verir |
| --- | --- |
| `english claude/04_cikti/Calisma_Listesi_v4_site_tam.xlsx` | 7.837 puanlanmış kelime (puan ≥ 10), anlam ve örnek cümlelerle; Tür sütunundaki `· temel` / `· çekim` etiketleri atılır |
| `english claude/04_cikti/Kelime_Obekleri_v3.xlsx` | 2.067 öbek (561'i "sıradan" diye elenir) |
| `tools/obek-turleri.js` | Öbeklerin düzeltilmiş tür etiketleri; kaynağın üzerine yazar, "sıradan" olanları listeden düşürür |
| `tools/ek-obekler.js` | Kaynak listede olmayan 119 deyimsel fiil / edat kalıbı |
| `tools/kelime-eleme.js` | Listeye hiç girmeyecek 10 kelime: korpustan sızan kaba/argo sözcükler ve özel adlar |
| `tools/kaliplar.js` | Kelimelerin kullanım kalıpları (2-4. katman); katman dosyalarına `kl` alanı olarak girer |
| `tools/anlam-yildiz.js` | Çok anlamlı kelime ve öbeklerde anlam başına YDS önemi (1-4); `yz` alanı olarak girer ve anlamları sıralar |
| `tools/ek-kelimeler.js` | Listede olmayan 52 kelime + ortak 129 kelimenin eş anlamlıları |
| `tools/modal-kartlar.json` | Modal yapılar ve denetimli özel kalıplar; `p:null` olan kart yalnız Geniş+ katmanında ve zorunlu `reason` gerekçesiyle kabul edilir |
| `tools/kelime-duzeltmeleri.json` | PDF/sözlük denetimi tamamlanan dokuz başlığın kanonik biçimi, anlamı, kalıbı ve kaynak kararı |
| `data/kelime-provenans.json` | Düzeltilen öğelerin telifli soru metnini kopyalamayan sınav kimliği/sayfa/soru kanıtı |
| `tools/aile-kart-partileri/*.json` | İnsan denetimli aile tamamlama kartları; tam kaynak puanı, ayrı anlam/örnekler, bağımsız test ve telifsiz sınav referansları |
| `tools/aile-kart-bekleyenler.json` | Doğrudan sınav kanıtı olmayan, Zipf < 3,5 orta güvenli adayların kart/test üretmeyen denetim defteri |
| `data/aile-kart-provenans.json` | Aile kartı partilerinin soru metni içermeyen yüzey/rol provenansı ve tam puanla verilen katmanı |
| `tools/aile-manifest.json` | Kelime ailelerinin tek kaynağı: önceki yayından taşınmış temel aileler ile insan denetimli zorunlu ve yasak bağlar |

Betik `ii`, `iii`, `iv` gibi cloze şık numarası artıklarını atar, harf varyantlarını birleştirir ve
`data/sayilar.js` içindeki sayaçları günceller. Yeni kelimeyi elle eklemek istersen
`tools/ek-kelimeler.js` sonuna yaz ve betiği yeniden çalıştır:

```js
{en:"prudent", tr:"tedbirli, sağduyulu", tip:"sıfat", sv:"ileri",
 ex:"It would be prudent to wait for the results.",
 exTr:"Sonuçları beklemek tedbirli olur.", es:"cautious, sensible"}
```

`sv` alanı (`temel`/`orta`/`ileri`) bu kelimenin hangi katmana gireceğini belirler: sırasıyla 2, 3, 4.

Aile tamamlama denetimlerinden gelen yeni kartlar tek bir büyük elle düzenlenen dosyada
biriktirilmez. `tools/aile-kart-partileri/` altındaki sürümlü JSON partileri dosya adına göre
kararlı sırada okunur; eski `tools/ek-aile-uyeleri.js` kaynağı geriye dönük olarak çalışmayı
sürdürür. Kartta görünen puan bir ondalıktır, ancak K7 ve diğer katman sınırları her zaman
yuvarlanmamış `source_score` üzerinden hesaplanır. Aynı parti, Günün Testi için kalıcı
`tools/test-uretim/girdi|cikti/<batchId>.json` dosyalarını ve telifsiz provenans çıktısını üretir.
Zipf değeri 3,5'in altında kalan orta güvenli adaylar otomatik kart olmaz; 478 adayın
477'si beklemede, daha önce kök-kart kuralıyla eklenmiş `designate` ise belgeli tarihsel
istisna olarak `tools/aile-kart-bekleyenler.json` içinde tutulur.

### Kelime ailelerini üretmek

`data/aileler.js` elle düzenlenmez. Yalnız `tools/aile-manifest.json` içindeki kalıcı
kararlar yayımlanır; yazıma dayalı ek soyma kuralları kendiliğinden aile kuramaz.
`approvedFamilies`, önceki otomatik yayından taşınmış ve henüz bütünüyle insan
denetiminden geçmiş sayılmayan başlangıç tabanıdır. `requiredFamilies` ve
`forbiddenPairs` ise açıkça insan denetimli kararlardır. Bu kararların sözcük türü
kanıtı, karar türü ve gerekçesi `reviewedDecisions` altında makinece okunur biçimde
saklanır. Yeni bir kart manifestteki
`requiredFamilies` grubunda önceden tanımlıysa,
üretici çalıştığında mevcut üyelerle aynı aileye katılır ve kendi kart kimliğini korur.

```bash
python tools/aile-cikar.py
python tools/aile-cikar.py --check
python tools/aile-cikar.py --adaylari-goster
node tools/test-uretim/aile-manifest-test.js
```

`--check` manifest ile yayımlanan dosyanın bire bir aynı olduğunu dosyaya dokunmadan
denetler. `--adaylari-goster` yalnız insan incelemesi için olası bağları listeler; bu
adaylar manifestte açıkça onaylanmadan yayına girmez.

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

**Üst menü** iki açılır grup içerir: *Gramer* (Konular, Hızlı Gramer, Bağlaçlar) ve
*Sorular* (Alıştırma, Deneme). Her ikisi de `<details class="nav-grup">` ile kurulur, bu
yüzden JS kapalıyken de tıklanınca açılır; `assets/js/main.js` yalnızca “aynı anda tek
panel açık kalsın” ve “dışarı tıklayınca / Esc ile kapan” davranışını ekler. Açık sayfa
bir grubun içindeyse grup başlığı `.nav-grup.etkin` ile vurgulanır. Menü blokları her
sayfada birebir aynıdır; birini değiştirirken hepsini değiştir.

**Yeni sayfa** eklersen: menüye tüm sayfalarda, `sw.js` içindeki `TEMEL_DOSYALAR`
listesine ve `sitemap.xml`'e ekle; `sw.js` içindeki `SURUM` değerini artır ki eski
önbellek temizlensin.

## Konu anlatımı kapsamı ve düzenli iş akışı

`data/konular.js` içindeki **129 ünitenin 129'unun da anlatımı hazırdır**. Kapsam bir
belge bekleme kuyruğuna değil, birlikte yüklenen sürümlü JavaScript veri dosyalarına dayanır:

| Dosya | Kapsam |
| --- | --- |
| `data/konu-metinleri.js` | İlk 6 temel anlatım |
| `data/konu-metinleri-t-ek.js` | T07–T61: Türkçe eksenindeki kalan 55 anlatım |
| `data/konu-metinleri-e1-ek.js` | İngilizce ekseninin ilk ek anlatım grubu |
| `data/konu-metinleri-e2-ek.js` | İngilizce ekseninin kalan anlatım grubu; iki E ek dosyası birlikte E01–E68'i kapsar |

Yeni içerik veya düzeltme, ünitenin bulunduğu dosyada yapılır. Ek dosyalar mevcut
`window.KONU_METINLERI` nesnesine kayıt ekler; temel kayıtları sıfırlamaz. Her değişiklikten
sonra kapsam regresyonunu çalıştır:

```bash
node tools/test-uretim/konu-kapsam-test.js
```

Test; `data/konular.js` ile anlatım kodlarını karşılaştırır, tam **129/129** kapsamı,
çift/yersiz kodları, temel + `konu-metinleri-*-ek.js` dosyalarının birlikte yüklenmesini,
zorunlu alanları, başlık eşleşmesini, gerçek metinle `kelime` sayısını ve ek anlatımların
pedagojik bölüm yapısını denetler. Test geçmeden konu kapsamı tamamlanmış sayılmaz.

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
