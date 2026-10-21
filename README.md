# Turksev.github.io — YDS Hazırlık

YDS'ye hazırlananlar için statik bir çalışma sitesi. Sunucu, kurulum ya da kayıt gerekmez;
tüm ilerleme ziyaretçinin kendi tarayıcısında (`localStorage`) saklanır.

Yayında: <https://turksev.github.io>

## Bu tarayıcıdaki kullanım istatistiği

İstatistik sayfasında ortak 7/30/90 gün seçicisiyle sayfa ziyaretleri, tahmini aktif
kullanım süresi ve on bir temel eylemin sayısı/kullanıldığı günler gösterilir. 129 konu
ünitesi hafif, bağımsız izleyiciyle tek "Konu üniteleri" grubunda ölçülür. Görünür
sayfada son etkileşimin ardından en çok 90 saniye sayılır; bu bir öğrenme başarısı
veya saatlik hız ölçüsü değildir. Aynı anda kullanılan birden fazla pencerenin
süreleri toplanır; benzersiz çalışma süresi iddiası yoktur.
"Çalışma kartını yanıtlama", Kelimeler/Öbekler/Cümleler çalışma destesindeki
başarılı yanıt değerlendirmelerini sayar; liste yıldızları, aile durum işaretleri
ve toplu işlemler bu eylemin kapsamında değildir. Arka planda tamamlanan deneme
gibi temel eylemler de sayılır; görünürlük koşulu yalnız süre için geçerlidir.
Oyunlar sayfasının iki ayrı eylemi vardır ve kart eylemlerine karışmaz: "Yazma
oyununda kelime yanıtlama" ilerlemeye yazılan her kelime sonucunu (bildin, ipuçlu,
bilemedin) bir kez sayar; "Yazma oyununda harf açma" bir kelimede "Bir harf aç"
düğmesinin yalnız ilk kullanımını sayar.

Bu ilk sürüm yalnız yereldir: `yds-kullanim-v1:` önekli kayıtlar eşitleme beyaz
listesine, Firestore'a ve ilerleme yedeğine girmez. Gün/kurulum/belge oturumu
başına ayrı **fiziksel localStorage anahtarı** vardır; mutlak sayaçlar yalnız kendi
yazıcısınca güncellenir. Tek ortak JSON nesnesinin son yazımda başka sekmenin
katkısını silmesi böylece önlenir. Son kullanım özeti değişmez gün işaretlerinden
hesaplanır; her kurulum/özellik ve kurulum/sayfa için en yeni işaret korunur.

İlk görünür ziyaret erken, değişen kayıtlar dakikada bir ve görünürlük kaybında
yazılır. Aynı takvim günündeki yenileme aynı ziyarettir; ertesi gün yenileme,
başka sayfadan normal dönüş veya BFCache dönüşü yeni ziyarettir. Donma/arka plan
bekleyişi sayılmaz. İlk depo taraması ilk çizim sonrasına bırakılır; her yazımda
tüm özellikler tek envanteri paylaşır. Kullanım güncellemesi istatistik sayfasında
yalnız kullanım bölümünü yeniler; tarih alanının, grafiklerin ve seçili metnin
durumunu korur.

Ayrıntı **en çok bugün ve önceki 180 gün** tutulur. Yerel kullanımın kayıt ve
özetleri toplam 512 KiB yumuşak bütçeye tabidir; sınır yaklaşınca en eski tam günler
kaldırılarak yeni kayıtlar için yer açılır. Monoton kesim işareti açık eski sekmelerin
silinen günleri geri getirmesini önler. Seçili dönem kaldırılmış günleri de kapsıyorsa
İstatistik ve Ayarlar kalan ayrıntının başlangıcını ve toplamların eksik
olabileceğini belirtir.
İlk ölçüm ve son kullanım özetleri budamadan bağımsızdır; öğrenme verisi silinmez.
Tek bir günün kayıtları tek başına bütçeyi doldurursa veya tarayıcının gerçek
localStorage kotası dolarsa yazım bekler; sonraki yazım/gün tekrar dener.

Geçici yazma hatası İstatistik ve Ayarlar'da gösterilir. Bekleyen mutlak sayaçlar
aynı belge açıkken yeniden yazılabildiğinde uyarı kalkar; başarısız denemeler yeni
hata anahtarları üretmez. Ani kapanışta kaydedilmemiş süre/eylem kaybolabilir.
Hata durumu bellektedir: başarısız yazımdan sonra belge kapanırsa sonraki açılış
bu kaybı saptayamaz; eksiklik uyarısının bulunmaması eksiksiz ölçüm garantisi değildir.
Yazma hatası çalışmayı engellemez. Ayarlardaki ayrı silme düğmesi ve genel ilerleme
sıfırlaması kullanım kayıtlarını siler; kullanım geri alınamaz.
Sıfırlama dönemi değiştiği için açık eski sekmeler silinen sayaçları geri getiremez.
Dönem anahtarını yalnız kullanıcı sıfırlaması yazar; anahtar yoksa dönem örtük
`ilk`tir. Açılış ve toparlanma bu anahtara hiç yazmaz, bu yüzden araya giren bir
sıfırlamayı ezemez.
Açılışta depoyu okuyamayan sekme, depo düzelince o arada tuttuğu kayıtları benimser;
arada kullanım sıfırlandıysa bu kayıtları atar. Bunu anlamak için sıfırlama anının
zaman damgası dönemden önce yazılır. Bu bir yaklaşımdır, kesin garanti değildir:
karşılaştırma sistem saatine dayanır; böyle bir sekme açıkken saat geri alınırsa
sonraki bir sıfırlama kaçırılabilir.
Depo tarayıcı ayarlarından dışarıdan silinirse açık sekme bunu, kendi en son yazdığı
günlük kaydın budama sınırının üstünde olduğu hâlde kaybolmasından anlar ve silinen
sayaçları geri yazmaz. Yasal budama önce kalıcı kesim işaretini yazdığı için silme
sanılmaz. Silmeden önce hiç kayıt yazmamış sekmenin kaydedilmemiş sayaçları silmeden
sonra yazılabilir.
Güncel sürümün sıfırlama ve silme korumaları, eski kodla açık kalmış sekmelere
uygulanmaz. Güncelleme onaylanan sekme yenilenir; diğer açık sekmeler eski betikle
kalabilir. Eski sekmeler kapanana ya da yenilenene kadar kullanım toplamları eksilebilir
veya eski kayıtlar yeniden görünebilir. Tarayıcı testleri servis çalışanını kapatır;
etkin servis çalışanıyla eski ve yeni sürümün birlikte çalışması test edilmemiştir.

İleride buluta geçiş, yalnız beyaz listeye anahtar eklemek değildir: kaynak
kimliklerinin korunduğu, tekrar çalıştırılabilir bir içe alma ve kayıt bazında
birleştirme gerekir. Bu sürüm Firestore kurallarını veya gönderim davranışını
değiştirmez. Yeni eylemler `assets/js/kullanim-hesap.js` kataloğuna ve semantik
işleyicilerine birlikte eklenmelidir; mevcut kimlikler yeni anlamlarla kullanılmaz.

Kullanımın saf/lifecycle/altı saat dilimi testleri, 190 gün boyunca günde 6/12/25
ziyaretle kapasite denemeleri ve tüm HTML sayfalarının izleyici denetimi `pnpm test`
içindedir. İzole Chromium'da gerçek mouse/klavye/touch/scroll, deste/yanıt/quiz
işleyicileri, gizli deneme bitişi, yarım tarih girişi, metin seçimi, iki sekme,
yenileme, gezinme, konu sayfası, silme ve açık/koyu dar ekran denetimleri
`pnpm test:usage` ile çalışır.

## Sözlük paneli

Kelimeler, Öbekler ve Cümleler sayfalarında **📖 Sözlük** düğmesi (ya da `/` tuşu)
çalışılan kartı ve destedeki yeri bozmadan bağımsız bir arama paneli açar.
Eşleştirme kuralı arama sayfasıyla ortaktır (`assets/js/arama-ortak.js`); panel
`assets/js/sozluk.js` içindedir ve ilerlemeye yazmaz.

- **Yerleşim.** 900 px ve üstünde, ayrıca yan çevrilmiş kısa telefon ekranında panel
  sağda sabit bir sütundur (ekranın yaklaşık dörtte biri, en az 320 px); sayfa içeriği
  panel kadar daralır, kart altında kalmaz. Daralan sayfada üst menü taşmasın diye
  panel açıkken 1414 px altında dar ekran menüsü kullanılır. Daha dar ekranda panel
  alttan açılır; arama kutusu odaktayken ekran klavyesine göre yükselir (parmakla
  yakınlaştırma klavye sayılmaz) ve "Büyüt" ile artırılabilir. Sonuçlar panelin içinde kayar;
  600 px'ten kısa ekranda (küçük telefon, büyük yazı, yatay telefon) panelin tamamı tek
  parça kayar, böylece sabit başlık sonuçları erişilemez kılmaz. Panel açılıp kapanırken
  çalışılan kart ekrandaki yerini korur.
- **Veri.** Kelimeler sayfasında kelime dizini zaten yüklüdür. Öbekler ve Cümleler
  sayfalarında dizin panel ilk açıldığında, öbekler ilk aramada, örnek cümleli tam
  kayıt ise "Anlamlar ve örnekler" açıldığında indirilir.
- **Klavye.** Odak paneldeyken tuşlar sayfaya ulaşmaz; arkadaki kart 1/2/3 ile
  yanıtlanamaz. Geç gelen veriyle yapılan yeniden çizimler odağı panelin dışına
  düşürmez; dış bağlantılar kalıcı öğelerdir. `Esc` paneli kapatır ve odağı paneli
  açan öğeye döndürür.
- **Seçerek arama.** Karttaki, listedeki ya da paneldeki bir kelimeyi seçince çıkan
  "Sözlükte ara" düğmesi o kelimeyi aratır. Seçim pencereden ya da panelin sonuç
  alanından kaydırılıp çıkınca düğme gizlenir, seçim geri gelince yeniden çıkar.
- **Dürüst ipucu.** Çevrilmemiş kelime/öbek kartının kendi başlığı panelde gerçekten
  ekranda göründüğünde o kartın "Bildim" cevabı ipucuyla sayılır: anlamı görmek cevabı
  görmektir. (Karttaki 💡 "cümlede gör" düğmesi sayılmaz: kelimeyi boşluk bırakıp yalnız
  bağlam verir, anlamı yine kullanıcı hatırlar; "Bildim" olağan terfidir.) Ölçüm geometriktir: anlam satırının %60'ı ya da en az 24 px'i
  pencere, panel ve sonuç alanının ortak görünür bölgesinde olmalı; aşağıda kalan ve
  kaydırılıp bakılmamış satır sayılmaz. Uyarı sonuçların üstüne binmez (akış içinde
  durur); önceki kartın uyarısı yeni kart gelince kalkar ve açığa çıkan satır ekrana
  çizildikten sonra ölçülür. Her kart kendi işaretini taşır: bir
  karta bakıp başka karta geçmek ve ona da bakmak ilk kartın işaretini silmez; işaret
  yalnız o kart yanıtlanınca kalkar. Öbekler sayfasında öbek sonuçları önce gelir.
  Uyarı ekran okuyucuya da duyurulur. Kural cümle kartlarına uygulanmaz.
- **Karşılaştırma.** "Sabitle" ile en çok altı sonuç panelin üstünde kalır; benzer
  kelimeler yan yana görülür. Sabitler yalnız o sekmede (`sessionStorage`) tutulur.
- **Dış kaynak.** Reklamsız Google Çeviri önce, Tureng ikinci sırada; düğmeler sonuç
  alanının en üstünde durur ve yalnız tıklanınca yeni sekmede açılır. Sorguda Türkçe
  harf varsa Google Çeviri Türkçeden İngilizceye, yoksa İngilizceden Türkçeye açılır.
  Bu siteler başka bir sitenin içinde gösterilmeyi reddettiği için
  (`X-Frame-Options: SAMEORIGIN`) sonuçları panelin içine getirilemez.
- **Liste filtresi.** Sayfadaki "Listede ara" kutusu listeyi süzer. Günün destesi
  çalışılırken gizlenir, çünkü ona yazmak desteyi dağıtırdı.

Panel açılışı kullanım istatistiğinde "Sözlük panelini açma" eylemi olarak sayılır.
Tarayıcı denetimi: `pnpm test:sozluk`.

## Sayfalar

| Dosya | İçerik |
| --- | --- |
| `index.html` | Açılış sayfası: hareketli görsel karşılama, **yedi kelime katmanında ne var, ne kaldı** (halka ve çubuklarla öğrenilen/çalışılan/yeni, bugün vadesi gelen tekrar, sıradaki kelimeler), bugünün destesi ve hızlı bağlantılar. Katman kartı Kelimeler sayfasını `?katman=N` ile o katman seçili açar. Marka bağlantısı buraya gelir |
| `oyunlar.html` | **Oyunlar**: Kelimeyi yaz bölümünde Türkçe anlamdan İngilizce yazım çalışılır ve ortak Leitner ilerlemesine yazılır. Ayrı Kalıp çalışması bölümünde anlam, edat ve cümle yapıları Türkçe açıklamalı sorularla çalışılır; sonuçları yalnız bu tarayıcıda tutulur. |
| `ana-sayfa.html` | Ana sayfa (üst menüdeki **Ana sayfa** sekmesi): **YDS bölüm dağılımı tablosu** (80 sorunun hangi aralıkta hangi bölüm olduğu) ve ilerleme paneli — tekrar durumu, yanlış defteri, deneme geçmişi, kategori karnesi |
| `durum.html` | Çalışılmış her şey tek listede (kelime, öbek, aile üyesi): üstte **sistemdeki toplam kayıt**, kutu sekmelerinde sayı ve bu toplama oranı ("hepsi" dahil), arama/süzme/sıralama |
| `istatistik.html` | **Çalışma hızın ve ritmin**: 7/30/90 günlük dönem kıyası, günlük grafik ve veri tablosu, 26 haftalık takvim, haftalık tempo, kutu birikimi ve varsayımsal ilk tur planı. Ayıklama hız hesabına katılmaz |
| `kelimeler.html` | 9.379 kelime ve yapı, 7 katman + **aralıklı tekrar (Leitner)**: bugünün destesi, kart modu, ipucu, sesli okuma. Katman düğmesinin üzerine gelince o katmanın **puan aralığı** çıkar |
| `obekler.html` | 1.854 kelime öbeği (590 deyimsel fiil, 339 edat kalıbı, 864 sabit, 61 geçiş ifadesi) — ayrı Leitner destesi |
| `cumleler.html` | 8.065 sınav cümlesi ve Türkçe çevirisi (2013–2026, sınav + bölüm + soru no); liste ve kart modu, kutu (Leitner) ilerlemesi, yıl/bölüm filtresi |
| `quiz.html` | Alıştırma soruları: 12 kategori, anında çözüm, yanlış defterinden çalışma |
| `deneme.html` | **Süreli deneme sınavı**: üç sabit 80 soruluk form, geri sayım, soru ızgarası, işaretleme, yenileme sonrası oturum kurtarma, 100 üzerinden YDS puanı, kategori karnesi |
| `gramer.html` | 10 başlıkta konu anlatımı, kural tabloları ve sınav tuzakları |
| `konular.html` | Türkçe ve İngilizce eksenli **129/129 YDS ünitesi**: ayrıntılı anlatım, çözüm yolu, tuzaklar ve mini uygulamalar |
| `baglaclar.html` | Bağlaçlar ve geçiş ifadeleri: çözüm yöntemi, yapı tabloları, filtrelenebilir 155 kayıtlık banka |
| `ara.html` | Site geneli arama: kelimeler, öbekler, bağlaçlar, sorular, gramer konuları, YDS konu haritası üniteleri ve kelime aileleri — sonuç **tek tıklamayla** açılır |

## İçerik

- **9.379 kelime ve yapı** — 49 gerçek YDS sınavı temel alınarak puanlanan listeye ek olarak gerekçesi kayıtlı üç puansız kalıp içerir; yedi katmana ayrılmıştır;
  her birinde Türkçe anlam + İngilizce örnek cümle + çeviri (**3.386'sında birden çok anlam** var)
- **1.854 kelime öbeği** — deyimsel fiil (phrasal verb), edat kalıbı, sabit ve geçiş ifadeleri, kaç sınavda geçtiği bilgisiyle (anahtar = lemma; çekimli eski biçimler `b` alanında)
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
| 1 · Temel | ≥ 40 | 920 | 169 K |
| 2 · Çekirdek | 30–40 | 833 | 144 K |
| 3 · Orta | 25–30 | 739 | 128 K |
| 4 · İleri | 17–25 | 1.885 | 306 K |
| 5 · Geniş | 12–17 | 2.032 | 293 K |
| 6 · Geniş+ | 10–12 + denetimli ekler (sınav kanıtlı, puan < 10 olabilir) | 2.358 | 406 K |
| 7 · Aile üyeleri | < 10 veya denetimli kök | 612 | 88 K |

Sayılar 6 Eylül 2026 puan güncellemesine göredir: puanlar güncel korpustan (49 sınav; 6 tam
kitapçık + 2023 transkriptleri, kitapçık şablon metinleri dışlanmış) yeniden hesaplandı
(`tools/puan-guncellemesi.json`); katmanı sabit olmayan ~1.850 kelime katman değiştirdi,
çoğu bir üst katmana. Geçiş listesi: `tools/puan-guncellemesi-rapor.md`.

Katman düğmesinin üzerine gelince (ya da klavyeyle odaklanınca) o katmanın puan aralığı
baloncukta çıkar. Aralıklar `assets/js/veri.js` içindeki `KATMAN_PUAN` tablosundan gelir ve
`katman-puan-araligi-test.js` bu tabloyu üretimdeki `tools/listeyi-aktar.py → KATMANLAR`
ile karşılaştırır; eşik bir tarafta değişip diğerinde unutulursa test kırmızı olur.

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
**~305 K** veri indirir; hepsini açan dizinle birlikte ~1,37 MB. Dizin (`data/kelime-dizin.js`, yaklaşık 211 KiB gzip) her sayfada
yüklüdür ve yazılış + kısa anlam + puan + katman bilgisini taşır; örnek cümleler katman
dosyalarındadır.

1. katman sınavın her yerinde geçen çok temel kelimelerdir (*much, can, people, make*) — büyük
olasılıkla zaten biliyorsundur, atlanabilir. Gerçek YDS kelimeleri 2. katmandan itibaren başlar.

## Dosya düzeni

```
index.html  ana-sayfa.html  oyunlar.html  kelimeler.html  obekler.html  quiz.html
deneme.html  gramer.html  konular.html  baglaclar.html  ara.html
assets/
  css/style.css       tüm sayfaların ortak stili (açık/koyu tema)
  css/istatistik.css  istatistik panelinin mobil, büyük yazı ve açık/koyu tema stilleri
  css/oyunlar.css     yazma oyununun harf kutuları ve kart stili
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
  js/oyun-hesap.js    yazma oyununun saf kuralları: seviye, açık harf seçimi, sıra, tur (kelime tam yazılır)
  js/oyunlar.js       oyunlar sayfası: katman seçimi, harf kutuları, sonucu ilerlemeye yazma
  js/istatistik.js    salt okunur istatistik görünümü, son veriye açılan SVG grafikler
  js/istatistik-hesap.js yerel takvim dönüşümü, hız/seri/dönem hesabı; depoya yazmaz
  js/obekler.js       öbek sayfası
  js/quiz.js          alıştırma soruları
  js/deneme-oturum.js denemenin sessionStorage içindeki doğrulanan geçici kurtarma kaydı
  js/deneme.js        süreli sınav
  js/baglaclar.js     bağlaç bankası
  js/ara.js           site geneli arama
  img/                PWA ikonları (tools ile üretildi)
data/
  kelime-dizin.js     9.379 kelime/yapı: yazılış, kısa anlam, puan, katman, tür
  test-k1..k7.js      9.314 sözcük için günün testi cümlesi (modal ile birlikte dizinin tamamı)
  test-modal.js       65 yeni modal/özel yapı için günün testi cümlesi
  test-obek.js        öbekler için günün testi cümleleri
  kelime-k1..k7.js    katman katman tam kayıtlar (örnek cümleler)
  aileler.js          kalıcı karar manifestinden üretilen kelime aileleri
  kelime-aliaslari.js eski başlıklardaki ilerlemeyi düzeltilmiş başlıklara taşır
  kelime-provenans.json denetlenen öğelerin sınav kimliği/sayfa/soru kaynakları
  obekler.js          1.854 kelime öbeği (anahtar = lemma; b = eski çekimli biçimler; sonda OBEK_TAKMA)
  cumleler/<yıl>.js   8.065 sınav cümlesi + çevirisi, yıl dosyaları (e, t, s=sınav, b=bölüm, n=soru no, y=yıl)
  cumleler-dizin.js   cümle sayıları ve filtre seçenekleri (yıl dosyaları yeniden eskiye yüklenir)
  kelime-bilgi.js     7.820 kelimenin sınav kullanım notu (ℹ; tembel yüklenir, 3,8 MB)
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
boyunu sınırlar (`yds-gunluk-tavan`, varsayılan 30). Sıra şu (17 Ekim 2026 kararı): deste
**günlük hedef kadar yeni kelimeyle başlar** (`yds-gunluk-yeni`, varsayılan 20); kalan yeri
vadesi gelmiş tekrarlar **en çok gecikmiş olandan başlayarak** doldurur. Sığmayan tekrar sıradaki
günlere kalır ve deste kutusunda "N tekrar bugünkü sınıra sığmadı" notu çıkar; ikisini de
istiyorsan tavanı yükselt. Kart modunda deste önce yeni blok, sonra tekrar bloğu olarak gelir
(Öbekler de aynı); her blok kendi içinde karışıktır. Eski kural tekrarları öne alıp yeni kartı
sıkıştırıyordu: tekrar borcu tavanı aşan gün hiç yeni kelime açılmıyordu.

**Sona at.** Kelime kartındaki "⏭ Sona at" düğmesi (kısayol `4`) kelimeyi şimdilik öğrenmek
istemediğini söyler: Leitner kaydına `s: 1` işareti konur; hiç çalışılmamış kelimeye `k: 0`'lık
bir kayıt açılır (yeni sayılmaya devam eder, vadesi gelmez, günlük yeni sayacını artırmaz, Durum
sayfasında çalışılmış görünmez). Deste ve oyunun sırası işaretli kelimeleri kendi gruplarının
sonuna koyar: başka yeni ya da tekrar kelime kaldığı sürece gelmezler. Açık destede kart o günün
destesinden düşer. İşaret cevaplarla kalkmaz; aynı düğme ("Sona atıldı · geri al") kaldırır,
liste süzgecindeki "Sona attıklarım" seçeneği işaretlileri gösterir. Eşitlemeye ayrı alan
gerekmez: işaret `yds-leitner` kaydının içinde taşınır (yedek doğrulaması `s` alanını ve
yalnız `s: 1` ile gelen `k: 0`'ı kabul eder).

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
7 katman ve modal/özel yapı testleriyle bütün **9.379 kelime ve yapı** için cümle; ayrıca **1.854 öbek kartının 893'ü** için bağımsız test cümlesi var.
7. katmanın 563 kaydı için `test-k7.js` bulunur; yükleyici bu katmanı da diğer
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

## Oyunlar

Sayfanın üstündeki **Kelimeyi yaz / Kalıp çalışması** seçimi iki ayrı çalışmayı açar.
`oyunlar.html#kalip` doğrudan kalıp çalışmasına gider. İlk havuz, 108 kelime için
50 anlam seçme, 60 edat tamamlama ve 50 cümle yapısı karşılaştırma sorusu içerir.
Sorular özgün bağlamlarla hazırlanmıştır; cevap ekranında tam İngilizce cümle,
Türkçe karşılığı, açıklama, mevcut kelime kartındaki kalıp ve sözlük kaynakları bulunur.
Bu seçilmiş havuz, sitedeki bütün kelimelerin alıştırmaya dönüştürüldüğü anlamına gelmez.

Tür, kelime ve tekrar gereksinimine göre süzülen havuzdan 5, 10, 20 veya tüm sorularla
tur açılır. Yanlışlar ve cevabı gösterilen sorular yeniden çalışılabilir. Bir sonraki doğru
cevap soruyu tekrar listesinden çıkarır. Tur ve şık sırası aynı sekmede yenilemede korunur.
Kalıp sonuçları yalnız bu tarayıcıdadır; kelime Leitner kutularını etkilemez, bulut
eşitlemesine ve mevcut yedek dosyasına dahil edilmez. Kendi sıfırlama düğmesi yalnız kalıp
kayıtlarını siler; Ayarlar'daki genel sıfırlama kalıp kayıtlarını ve açık turu da temizler.

Kaynaklar `tools/kalip-calisma/` altında; `tools/kalip-calisma-uret.js` tek doğru boşluk,
kimlik, kaynak ve mevcut EN/TR kalıp eşleşmesini doğrulayıp `data/kalip-calisma.js` üretir.
İçerik değiştiğinde eski tur geçersizleşir; değişen soruların eski sonuçları sayılmaz.
Tarayıcı denetimi `pnpm test:kalip`; tur ve saklama kuralları genel birim test paketindedir.

### Kelimeyi yaz

`oyunlar.html` kelimenin Türkçe anlamlarını tür kısaltması ve yıldızlarıyla gösterir
(`i. bitki hastalığı, afet ★★★☆`); İngilizcesi altındaki harf kutularına yazılır. Harflerin
bir kısmı açık gelir, kalanı gizlidir; kelimenin tamamını baştan sona sen yazarsın: açık harf
kutusunda bekler, sırası gelince onu da yazarsın (el kelimenin tamamına alışsın diye). Açık
harfin üzerine başka bir harf yazarsan kutu hata rengiyle ve köşesindeki çarpıyla işaretlenir;
gizli harfte böyle bir işaret yoktur, cevabı ele verirdi. İmleç hep sondadır: önceki bir harfi
değiştirmek için oraya kadar geri silinir. Oyunun ayrı bir puanı ya da kaydı yoktur:
**seviye, kelimenin Leitner kutusudur** ve sonuç Kelimeler sayfasındaki kartla aynı
ilerlemeye (`yds-leitner`, tür `kelime`) yazılır. Kelimeler, Durumum ve İstatistik aynı kaydı
görür; eşitleme açıksa öbür cihazlara da gider.

| Kutu | Seviye | Açık gelen harf |
| --- | --- | --- |
| hiç çalışılmamış | 1 | %50 |
| 1 | 2 | %40 |
| 2 | 3 | %30 |
| 3 | 4 | %20 |
| 4 | 5 | %10 |
| 5 (öğrenildi) | 6 | harf yok |

Açık harf sayısı, harf sayısının bu yüzdesidir (buçuk yukarı yuvarlanır) ve en az bir harf
hep gizli kalır: altı harfli kelimede sırasıyla 3, 2, 2, 1, 1, 0. Tire ve boşluk her zaman
görünür; yazılmaz, sayılmaz. Hangi harflerin açılacağı kelime, kutu ve gün numarasından
türetilir: aynı gün sayfayı yenilemek başka harfleri açmaz. Kısa kelimede yüzde yarım harfe
ulaşmıyorsa harf açılmaz (dört harfli kelime 5. seviyede harfsiz gelir); sayfa bunu "kısa
kelime: harf yok" diye yazar.

**Üç sonuç, üç deneme hakkı.**

- **Bildin** — ilk denemede ve harf açtırmadan doğru yazarsan kelime bir üst kutuya çıkar
  (karttaki "Bildim" ile aynı).
- **İpuçlu** — "Bir harf aç" kullandıysan ya da ikinci/üçüncü denemede bildiysen kutu
  değişmez (kartta anlamı sözlükte görülmüş yanıtla aynı; hiç çalışılmamış kelime 1.
  kutuya girer).
- **Bilemedin** — üçüncü deneme de yanlışsa ya da "Bilemedim, göster" dersen kelime bir
  kutu düşer (1. kutunun altına inmez) ve yarın tekrar gelir.

Yanlış deneme, en az bir gizli harfin yanlış yazıldığı denemedir: doğru yazdığın gizli harfler
açılır ve açık kalır; yazdıkların silinir, kelimeyi yeniden baştan yazarsın (yalnız kalan harfi
yazmak yetmez). Gizli harflerin hepsi doğruysa ve fark yalnız açık bir harfin üzerine yazdığın
harfteyse deneme harcanmaz: harf zaten ekrandaydı. Kaçıncı harfin ne olması gerektiği söylenir
("4. harf yanlış, i olmalı. O harften devam et."), yazdıkların o harfin önünde kesilir ve
oradan devam edersin; düzeltilen kelime ilk denemede bilinmiş sayılır. Kural öteki yazımla
birlikte de geçerlidir: açık harf düzeltilince kabul edilen öteki yazım çıkıyorsa (*centre*
kartında t açıkken *cenqer*) deneme yine harcanmaz. Kelimenin tamamı yazılmadan "Kontrol et"
de deneme harcamaz (yalnız gizli harfleri yazmak da eksik sayılır); "Bir harf aç" da harcamaz
ama sonucu ipuçluya çevirir. "Bir harf aç", henüz yazmadığın ya da yanlış yazdığın ilk gizli harfi açar ve
yazdıklarını o harfin önünde keser: açılan harften devam edersin, onu da yazarsın. Gizli
harflerin hepsini doğru yazmışsan ilk gizli harf açılır, yazdıkların olduğu gibi kalır. İkiden
az gizli harf kaldıysa düğme kullanılamaz. Aynı kısa anlamı ve türü taşıyan başka
bir kelime yazarsan (*almost* yerine *nearly*) deneme harcanmaz, başka kelime istenir.

**Öteki yazım doğru sayılır.** Kelimenin dizinde bulunan öteki yazımını yazarsan cevap
kabul edilir ve kartın kendi yazımı gösterilir: `-ise/-ize` (*analyse* / *analyze*,
*recognise* / *recognize*), `-re/-er` (*centre* / *center*, *metre* / *meter*) ve elle sayılan
çiftler (*grey* / *gray*, *defence* / *defense*; liste `oyun-hesap.js` içinde
`YAZIM_CIFTLERI`). Kural iki kısa anlamın aynı yazılmasına bağlı değildir; dizinde olmayan
yazım (*surprize*) kabul edilmez. İki yazımı ayıran harf açık gelmişse öteki yazım o harfin
üzerine yazılır: kutu işaretlenir ama "Kontrol et" cevabı kabul eder.

Girdinin `maxlength` değeri başlığın uzunluğudur (tire ve boşluk dahil): tarayıcı bu sınırı
sayfanın temizliğinden önce uygular; yalnız harfler sayılsaydı yapıştırılan ya da klavyenin tek
parça gönderdiği *well-being* son harfini yitirirdi. Harf sayısına sayfa kendisi kırpar.

**Hangi kelimeler.** Kelimeler sayfasında seçili katmanlar (`yds-katmanlar`); seçim oyun
sayfasından da değiştirilebilir ve iki sayfada ortaktır. Yalnız harf, tire ve boşluktan
oluşan başlıklar sorulur: eğik çizgili, `+ V3`'lü, kesme işaretli kalıplar ve modal yapılar
oyuna girmez. Türkçesi aynı yazılan kelimeler de (*protein*, *robot*, *internet*) girmez:
anlam maskelenince ipucu kalmaz, kart bilgiyle çözülemezdi (9.379 kaydın 9.286'sı oynanır;
katman kartındaki "oyunda N" sayısı bunu gösterir). Üç tur vardır; seçim saklanmaz, sayfa
her açılışta "Sıradakiler" ile başlar:

- **Sıradakiler** — önce vadesi gelmiş tekrarlar (1–4. kutu, en çok gecikmiş olan önce),
  sonra hiç çalışılmamış kelimeler dizin sırasıyla.
- **Yalnız yeni kelimeler** — hiç çalışılmamışlar, dizin sırasıyla.
- **Öğrenilenler · harfsiz** — 5. kutudaki kelimeler, en uzun süredir çalışılmayan önce.
  5. kutu desteye bir daha girmediği için harfsiz seviyenin kendi turu vardır; burada
  bilemediğin kelime 4. kutuya düşer.

Vadesi gelmemiş 1–4. kutu kelimeleri sorulmaz, yoksa erken terfi ederdi. Yanıtladığın kelime
o gün hiçbir turda yeniden gelmez. Sıra her kelimede depodaki güncel kayıtlardan yeniden
kurulur: başka sekmede ya da cihazda az önce yanıtlanan kelime burada sorulmaz. Aynı kural
Kelimeler sayfasında da geçerlidir: açık duran deste, oyunda ya da başka sekmede yanıtlanan
kartı desteden düşürür; deste kapalıyken deste özeti (kutular, "Bugünü çalış (N kart)") ve
liste sayacının "öğrenilen … · bugün … tekrar + … yeni" kısmı yenilenir ("Bugünü çalış" da
özeti, desteyi kurduğu güncel kayıtlarla çizer). Deste açıkken birikmiş tekrarlar günlere dağıtılırsa deste bugünün yeni vadesine
göre yeniden kurulur; katman değişimi, sıfırlama ve geri alma desteyi kapatır (liste yeni
havuzdan süzülür, "Bugünü çalış" ile deste yeniden açılır).

**Eşitleme açıksa** kelime hemen gösterilir ve yazılabilir, ama açılıştaki bulut birleşimi
bitene kadar cevap işlenmez: "Kontrol et" ve "Bilemedim, göster" o sırada "Eşitleniyor;
bitince …" yazar ve birleşim bitince (bağlantı yavaşsa sayfa açılışından en çok 8 saniye
sonra; bağlantı yoksa hemen) kendiliğinden sürer. "Kontrol et" yalnız kelimenin tamamı
yazılmışken bekletilir; eksik kelimede hemen "Önce kelimenin tamamını yaz…" denir. Beklerken
yazılan eksilirse (harf silindi ya da "Bir harf aç" yazılanı kesti) bekleyen kontrol düşer:
deneme harcanmaz, bekleme iletisi silinir, kendiliğinden "eksik" uyarısı çıkmaz, sayfa o
sırada yenilense "cevabın işlenmedi" de denmez. Böylece başka cihazda ilerlemiş bir kelime burada eski kutusuyla
yanıtlanıp buluttaki kaydın üzerine yazılmaz. Okuyup yazmak birleşimden uzun sürdüğü için
bu bekleme çoğu zaman hiç görülmez. Birleşim başka cihazdan kayıt getirirse sayfa yeniden
yüklenir (site geneli davranış); bekletilen cevap o ana kadar işlenmediyse düşer ve yeni
açılışta "Eşitleme sırasında sayfa yenilendi; az önce verdiğin cevap işlenmedi" notu çıkar.
Birleşim tam bekleyen kelimenin kaydını değiştirdiyse (kelime başka cihazda yanıtlanmış)
cevap eski seviyeyle verilmiştir: bekleme bitince de işlenmez, sayfa bunu söyler.
Sayfa, eşitleme motorunun durum adlarına bağlıdır (`kapali`, `yukleniyor`, `yuklendi`,
`baglaniyor`, `hazir`, `hata`, `silindi`); sonuç bildiren dördü dışındaki her durum "sürüyor"
sayılır ve `tools/test-uretim/oyun-esitleme-sozlesme-test.js` adların değişmediğini denetler.

**Günlük yeni kelime sayacı ortaktır.** Hiç çalışılmamış bir kelimeyi oyunda yanıtlamak,
sonucu ne olursa olsun, Kelimeler destesinin günlük yeni kelime sayacını (`yds-yeni-sayac`)
bir artırır; o günkü destede açılacak yeni kart payı o kadar azalır. Sayfa sayacı ve günlük
hedefi gösterir.

**Anlam cevabı ele veriyorsa** o yer `•••` ile maskelenir; kelime bitince anlam maskesiz
gösterilir. Gizlenenler:

- başlığın kendisi (`problem → i. sorun, •••`; `absorb → f. emmek, soğurmak, •••e etmek`),
- çok parçalı başlığın dört ve daha çok harfli parçası (`risk-free → s. •••siz, tehlikesiz`),
- parantez içindeki kök ya da çekim (`tie → (be ••• to)`, `hostility → (çoğul: •••)`),
- dil bilgisi notunun öznesi (`means → (••• fiilinin üçüncü tekil biçimi)`,
  `came → (•••'un geçmiş biçimi)`),
- başlığın öteki yazımı (`organise → ••• etmek`).

Türkçe karşılıklar (*stres*, *proje*, *sistem*) ipucunun kendisidir, açık kalır. Sözlük
paneli bu sayfada yüklenmez.

**Yerleşim ve erişilebilirlik.** Katman seçici oyunun altındadır ki kelime ve kutuları ilk
ekranda görünsün; sıra satırındaki "Katmanları değiştir" bağlantısı oraya iner. Telefonda
(480 px ve altı) sayfanın üst boşluğu daralır, ara başlık görünmez, üç tur düğmesi tek satıra
dizilir ve kart sıkışır: Çekirdek katmanında anlam ve harf kutuları 375×667 ekranda kaydırmadan
görünür; sayfanın kendi yazı tipiyle 360×640 ekranda da (katmanın 823 kelimesinin hepsinde
ölçüldü, en uzun kartta pay 6 px; daha geniş bir yazı tipinde en uzun kartlar, öteki
katmanlarda *first-come-first-served* gibi en uzun başlıklar taşabilir). Tireli ya da çok
sözcüklü başlıkta satır yalnız ayraçtan kırılır: parça ayracıyla birlikte tek satırda durur
(kutu eni buna göre seçilir), imleç satırlar arasında gidip gelmez. Harfler,
kutu satırını örten tek bir görünmez girdiye yazılır; odak hiçbir öğede değilken yazılan harf
de oraya gider (sayfa açılınca kutulara tıklamadan yazmaya başlanır, biten kelimede Enter
sonrakine geçer). Girdinin açıklaması maskeli anlamı ve
harf düzenini kapsar; yeni kelimeye geçildiğinde aynı bilgi görünmeyen bir duyuru
bölgesinden okunur, tur ya da katman değişince sıra bilgisi de (cevap hiçbir zaman bu
metinlerde geçmez; *enter* ve *re-enter* kartlarında tuşun adı bile "onay tuşu" diye yazılır).

Bir katman dosyası yüklenemezse (çevrimdışı) oyun dizindeki kısa anlamla sürer ve "Yeniden
dene" düğmesi çıkar. Kelime o sırada başka bir sekmede ya da cihazda yanıtlandıysa sonuç
yazılmaz. Kurallar `assets/js/oyun-hesap.js` içindedir (saf modül: sayfaya, depoya, saate ve
rastgele sayıya dokunmaz); birim testi `tools/test-uretim/oyun-hesap-test.js`, tarayıcı
denetimi `pnpm test:oyunlar` (`tools/oyunlar-browser-qa.js`).

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
Hata bildir* bağlantı üçlüsünün yerini aldı. Üçlü daha sonra `footer-links` olarak geri
geldi: `yontem.html` ve `ayarlar.html` her sayfanın alt bilgisinden açılır.

## Cihazlar arası eşitleme (Firebase)

İlerleme localStorage'da yaşar; eşitleme açıksa bunun bir bulut kopyası da tutulur.
Başlıktaki **⇅** düğmesiyle Google hesabına bir kez giriş yapılır; sonrası görünmezdir.
Girişliyken düğme hesabın baş harfini gösterir; tıklamak hemen tam eşitleme yapar
("Eşitlendi SS:DD" onayı). Bağlantıyı kesmek Ayarlar sayfasındadır.

- Eski `yds-*` anahtarları uygulamanın okuma biçimi olarak korunur. Eşitlenen asıl
  `yds-esitleme-v2` zarfında her kayıt ayrı mantıksal sürüm taşır; silmeler de mezar taşı
  olarak saklanır. Böylece çevrimdışı kalan cihaz eski bir kaydı geri diriltemez ve iki
  cihazın farklı kelimelerde yaptığı çalışmalar birbirini ezmez.
- **Aynı tarayıcıda birden çok sekme.** Zarf (localStorage anahtarı `yds-esitleme-yerel-v3`;
  `yds-esitleme-v2` yalnız geçişte okunan eski yerel anahtardır) tek doğruluk kaynağıdır;
  klasik `yds-*` anahtarları ondan üretilen aynadır ve zarfı olan profilde sürüm basmaz (tek
  istisna: son-ayna kaydı olmayan v2 zarfından ilk geçiş açılışı). Bir klasik anahtar olayı
  ya da sayfa açılışındaki uzlaştırma, zarfta sürümü ya da mezar taşı olan kaydı ve
  sıfırlanmış alanı değiştirmez; yalnız zarfın hiç görmediği ya da geçişten beri sürümsüz
  duran kayıtlar alınır, onlar da sürümsüz birleşir. Başka sekmenin yazımını yalnızca
  öğrenen sekme kendisi yazmaz: durumu bellekte benimser, sayfaya `yds-depo-degisti` ile
  bildirir; işlemi başlatan sekme bitirir, o kapandıysa bir sonraki yazım ya da sayfa
  açılışı. Bir okumanın sessizce birleştirdiği alanlar da yerel olmayan ilk bildirimle
  sayfaya duyurulur.
  Neden: her sekme localStorage'ı kendi kopyasından okur ve öbür sekmenin işlemini yarım
  görebilir. 11 Ekim 2026'ya kadar böyle bir sekme işlemi kendi eski durumundan
  "tamamlıyor", yazan sekme de geri gelen klasik anahtarı "güncelleme öncesi sekmenin
  düzenlemesi" sanıp taze sürümle içe alıyordu: iki sekme açıkken art arda verilen cevabın
  terfisi geri alınabiliyor, taze sürüm aldığı için bulutta da kazanıyordu (9.000 kayıtlı
  profilde 400–600 ms'de bir "Bildim" ile ölçüldü).
  Sınırlar: (1) İki sekme aynı anda yazarken, yeni kaydı belleğinde tutan bütün sayfalar
  öbür sekmenin olayını işlemeden kapanır ya da başka sayfaya geçerse o kayıt kaybolabilir
  (localStorage'da "karşılaştır ve yaz" yoktur). (2) Aynı cihazın iki sekmesi birbirinin
  yazımını görmeden cevap sayarsa günlük sayaç bir eksik kalır. (3) Zarf öncesi koddan
  (28 Ağustos 2026 öncesi) açık kalmış bir sekme sürümlü kaydı ve sıfırlanmış alanı artık
  değiştiremez; sürümsüz kayıtta eski birleşim kuralı geçerlidir. Aynı kural elle yazılan
  klasik anahtar için de geçerlidir (geliştirici araçları; `tools/test-uretim/tavan-sayfa.html`
  depoyu temizlemeden klasik anahtar yazar): zarfı olan profilde sürümlü kayıt değişmez,
  anahtar bir sonraki olayda ya da sayfa açılışında zarftan yeniden yazılır; durum `Depo` ya
  da `EsitlemeDepo.paketYaz` ile, ya da zarfsız profilde kurulmalıdır. (4) Yayından sonra eski
  betikle açık kalan sekme yenilenene kadar eski davranışı sürdürür: yeni sürüm
  bildirimindeki "Şimdi güncelle" yalnız basılan sekmeyi yeniler, öbür sekmeler de
  yenilenmelidir.
  Testler: `tools/test-uretim/yerel-zarf-regresyon-test.js` ve
  `tools/test-uretim/iki-sekme-yarisi-test.js` (tarayıcı modeli `iki-sekme-modeli.js`:
  işleyici süreci başına depo kopyası, tek yazım sırası, olayların ayrı görevlerde teslimi);
  "Şimdi güncelle" düğmesi için `tools/test-uretim/surum-bildirimi-test.js`.
- Günlük çalışma sayaçları (`yds-gunluk-kayit`) ve bugün açılan yeni kart sayacı
  (`yds-yeni-sayac`) cihaz payları taşır: gün kaydında `p = { cihaz: {...} }`, toplam
  alanlar payların toplamıdır ve okuyucular yalnız toplamı görür. Her cihaz yalnız kendi
  payını artırır; eşitleme payları cihaz başına "büyük olan" ile birleştirir. Aynı gün iki
  cihazda yapılan çalışma böylece ne kaybolur ne yeniden sayılır; "son yazan kazanır" bu
  iki alanda uygulanmaz. Cihaz kimliği `yds-cihaz-kimligi` altında yerel kalır. Pay bilgisi
  olmayan eski kayıt `*` payı sayılır; iki eski kayıt alan alan en büyükle birleşir. Sınır:
  eski sürümle açık kalmış bir sekme paysız toplam yazarsa o gün bir kez fazla sayılabilir.
- Açılıştaki birleşim Firestore işlemi içinde eski kök belgeyi ve güncel alan belgelerini
  yeniden okuyarak yapılır. İlk birleşimden sonra belgeler canlı dinlenir; başka cihazın
  değişikliği açık sayfaya gelir.
  Bulut yerelde olmayan bir şey getirdiyse sayfa, servis çalışanıyla ortak tek
  koordinatörden bir kez yenilenir; kullanıcının bu sırada yaptığı değişiklik yenileme sebebi sayılmaz.
- Sonraki her değişiklik 2,5 sn gecikmeyle buluta yazılır; değişiklikler kesintisiz sürse de
  ilk bekleyen değişiklikten en geç 15 sn sonra. Sekme kapanırken de denenir ama bu son
  istek çoğu zaman tamamlanamaz; kalan kuyruk o cihazda sitenin bir sonraki açılışındaki
  tam birleşimle gider.
  Yerel geçiş öncesi görüntü `yds-esitleme-gecis-yedegi`, eski bulut belgesi de
  `yds-esitleme-bulut-gecis-yedegi` altında bir kez korunur.
- Açık kalan sayfa kendini toparlar (`esitleme-dayaniklilik-test.js`):
  - Sekmeye dönüşte (2 dk temas yoksa), pencere odağında (5 dk), geri/ileri önbellekten
    dönüşte, ağ geri gelince, donmuş sekme çözülünce ve uykudan uyanınca (30 sn nabız, 2 dk
    sıçrama) bütün alanlarla bir birleşim yapılır. Sonuç yeniden yükleme olmadan
    `yds-depo-degisti` ile yerel depoya yazılır; açılış, Ana sayfa paneli, Durumum,
    İstatistik ve Ayarlar bunu yerinde gösterir. Çalışma sayfaları (Kelimeler, Öbekler,
    Cümleler, Aileler, Konular, Test, Deneme) açık desteyi yeniden yüklenene ya da sayfa
    değişene kadar korur. Başarılı bir tam birleşimden sonraki 60 sn içinde yeni otomatik
    tam birleşim başlamaz; çevrimdışıyken hiç denenmez.
  - Firestore'un hata verip kapattığı dinleyiciler artan aralıklarla (15 sn → 5 dk, en
    çok 6 kez) yeniden kurulur. Kopukluk sürerken başarılı gönderimler "alınamıyor"
    uyarısını kapatmaz.
  - Kimlik belirteci işlemden önce yenilenir (süresine 5 dk'dan az kaldıysa zorla).
    Firestore 10.14.1, işlem içinde gelen `auth/...` hatasını tanımaz ve işlemi hiç
    bitirmez (uykudan ya da belirtecin süresini aşan çevrimdışı bir aradan sonra); önceden
    yenilemek ve işlem içindeki okumada gelen bu hatayı düz hataya çevirmek onu sıradan,
    yeniden denenen bir hataya dönüştürür.
  - 2 dakikadan uzun süren işlem takılmış sayılır, terk edilir ve bütün alanlarla yeniden
    denenir (düğmeye basılırsa 10 sn sonra). Terk edilen işlemin geç sonucu yerel depoya
    yine kayıpsız birleşir; eşitleme durumu ve arayüz onu yok sayar.
  - Hata sonrası yeniden deneme 15 sn'den 5 dk'ya kadar katlanarak bekler.
- Veri, Firestore'un 1 MiB belge sınırına takılmaması için alan başına ayrılır:
  `kullanicilar/{uid}/alanlar/{anahtar}` içinde
  büyük `yds-leitner` ve `yds-test-yanlis` alanları dış `surum: 3` ve iç `k: 2` kısa
  JSON taşır; diğer on bir alan dış `surum: 2` ve nesne JSON biçiminde kalır. Yerel
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
eski kök zarfı ile 13 izinli alan belgesinin kimliğini, şemasını ve boyut üst sınırını
doğrular. `apiKey` gizli değildir (tarayıcıya zaten iner); veriyi koruyan bu kurallardır.
Statik regresyon:

```bash
node tools/test-uretim/firestore-kurallar-test.js
```

**Günlük kayıt izni:** `yds-gunluk-kayit` 7 Eylül 2026'da eklenmiştir. Bu alan
canlı kuralların `gecerliAlanAdi` listesinde yoksa ilk günlük kaydın yazılması,
aynı işlemdeki kelime ilerlemesini de engeller. GitHub Pages bu kuralları
dağıtmaz. Yayından önce canlı kuralı yedekleyip yalnız gereken farkı doğrulayın;
kuralları herkese açmayın, veriyi sıfırlamayın.

Gerçek kuralların izole emülatör testi (Java 21, sabit sürümlü geliştirme bağımlılıkları):

```bash
pnpm test:rules
```

Bu komut yalnız `demo-yds-rules` projesini ve `127.0.0.1:8185` adresini kullanır;
gerçek hesap ya da çalışma verisi gerekmez. Quality iş akışında zorunlu çalışır.
Sahiplik, günlük alan create/update, ortak transaction, şema/boyut sınırları,
sürüm düşürme, silme işaretçisi ve eski izin listesiyle atomik ret sınanır.

### İstatistik günleri ve grafikler

`Ilerleme.bugun()` anahtarı tarihsel olarak yerel gece yarısının UTC milisaniyesinden
üretilir; doğrudan bir UTC takvim günü değildir. Kalıcı anahtarlar ve tekrar vadeleri
değiştirilmez. `tarihGunu(date)` aynı eski kodlamayı korur; `gunTarihi(g)` yalnız
benzersiz geri dönüşte yerel tarih verir. Model girişinde bu tarih takvim sıra
numarasına çevrilir; tarih seçici, hafta başlangıcı ve ortalamalar aynı alanı kullanır.
Eski DST geçişinde iki güne birden ait olan bir kayıt tahminle ayrıştırılmaz;
belirsiz tarihler ölçülmüş sıfır gün sayılmaz. Bu cihazın saat dilimi esas alınır.

`istatistik-saat-dilimi-test.js` gerçek ilerleme kodunu Türkiye, UTC, New York,
Berlin, Kiritimati ve Londra saat dilimlerinde çalıştırır. Tarayıcı testi Türkiye'de
8 Eylül 2026 Salı örneğini sabitler; 320–1920 px genişliklerde bugünün ve bu haftanın
grafikte görünür kaldığını, geçmişe bilinçli kaydırmanın yenilemede korunmasını sınar.

## Sınav kaynağı ve provenans

Kelime yazımı, sınavda geçişi ve bağlam anlamı için ana doğruluk kaynağı
`C:\Users\Trk\Desktop\YDS\01_sinav_arsivi\08_unique_exam_pdfs` klasöründeki 49
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

> **Silme koruması — 5 Eylül 2026 denetimi (A2).** Bu betik dizin, katman ve öbek dosyalarını
> sıfırdan yazar; ama artık hiçbir dosyayı yazmadan önce üretilecek kümeyi yayımlanmış
> `data/kelime-dizin.js` ve `data/obekler.js` ile karşılaştırır: mevcut olup üretilmeyecek
> kelime/öbek varsa listeyi basıp **çıkış kodu 1 ile durur**, yalnız `--silmeye-izin-ver`
> bayrağıyla devam eder. 4–5 Eylül'de yalnız `data/kelime-*.js` içinde yaşayan 939 sınav
> kelimesi ve 246 öbek (6 tam kitapçık: 690 + 184; 2023: 181 + 62; aile türevi: 68) bu
> denetimle `tools/ek-kelime-partileri/2026-09-05_denetim-A2_korunan.json` partisine taşındı;
> betik onları oradan üretir ve çıktı yayımlanan veriyle birebir aynıdır. Ham kart verisi
> `03_calisma_listesi/06_sandbox_2026-09/kartlar*/cikti` altında duruyor.

`data/kelime-*.js` ve `data/obekler.js` **elle düzenlenmez** — kaynak XLSX dosyalarından üretilir:

```bash
"C:/Users/Trk/Desktop/YDS/03_calisma_listesi/.venv/Scripts/python.exe" tools/listeyi-aktar.py
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
| `tools/ek-kelime-partileri/*.json` | XLSX'te **olmayan** denetimli kelime ve öbek partileri (kendini açıklayan JSON: şema sürümü, açıklama, kaynak, gerekçe, gruplar, tam kart verisi). Dosya adına göre kararlı sırada okunur; XLSX ya da başka bir kaynaktaki kelimeyi ezemez (çakışma = hata) ve `k` katmanı partiden aynen alınır, puan bandına göre yeniden hesaplanmaz. `tools/ek-kelime-partileri-cikar.py` yayımlanmış veride olup ana kaynaklardan üretilmeyen kayıtları böyle bir partiye çıkarır; `tools/test-uretim/ek-kelime-partileri-test.js` şemayı, kaynak çakışmasını ve yayımlanan veriyle birebirliği denetler |

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

### Üretime katılan düzeltme katmanları (6 Eylül 2026)

`listeyi-aktar.py` xlsx + ek kaynakları birleştirdikten sonra şu dosyaları sırayla uygular;
hepsi elle düzenlenir, üretim çıktısı değildir:

| Dosya | Ne yapar |
|---|---|
| `tools/puan-guncellemesi.json` | Güncel korpus (duz5, 49 sınav) puanları; katmanı sabit olmayan kartların katmanı yeni puandan bantlanır. `tools/puan-guncellemesi-uret.py --yaz` üretir, `tools/puan-guncellemesi-rapor.md` geçişleri listeler. Modal kartlar ve puansız kalıplar dışarıda (lemmatizer `should→shall` kaydırması). |
| `tools/kart-duzeltmeleri/*.json` | Anlam düzeltmeleri: `bul` ile anlam seçilir, `yaz` alanı değiştirir, `degistir` alt dize değiştirir, `sil` anlamı kaldırır. Yıldızlardan sonra uygulanır; eşleşmeyen kayıt üretimde `ESLESMEDI` diye yazılır. `tools/test-uretim/anlam-dogrula.py --rapor` bulguların kaç tanesinin hâlâ kartta olduğunu sayar. |
| `tools/obek-lemma.json` | Çekimli öbek anahtarı → lemma. Hedef varsa anlamlar birleşir, yoksa ad değişir; eski biçim `b` alanında, tablo `obekler.js` sonunda `OBEK_TAKMA`. `esitleme-veri.js` ilerleme kimliğini lemmaya çözer, `ilerleme.js` eski kayıtları taşır (`obek-lemma-test.js`). |
| `tools/kaliplar.js` | `tools/test-uretim/kalip-dogrula.py` (bayraksız) girdi/çıktı paketlerinden üretir; eksik paket için `kalip-paketle.py --eksik` (bayraksız koşulursa ilk tur girdilerini yeniden yazar!). |

Puan ya da katman değişen her üretimden sonra `python tools/aile-cikar.py` de koşulmalı: `data/aileler.js`
kök katmanlarını taşır ve CI'daki `aile-cikar.py --check` uyuşmazlıkta kırmızı olur (6 Eylül 2026).

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

**Üst menü** on bir öğe taşır: ilk sekme *Oyunlar*, ardından Ana sayfa, Durumum,
İstatistik, *Gramer* grubu, Kelimeler, Aileler, Öbekler, Cümleler, *Sorular* grubu ve Ara.
İki açılır grup vardır: *Gramer* (Konular, Hızlı Gramer, Bağlaçlar) ve
*Sorular* (Alıştırma, Deneme). Her ikisi de `<details class="nav-grup">` ile kurulur, bu
yüzden JS kapalıyken de tıklanınca açılır; `assets/js/main.js` yalnızca “aynı anda tek
panel açık kalsın” ve “dışarı tıklayınca / Esc ile kapan” davranışını ekler. Açık sayfa
bir grubun içindeyse grup başlığı `.nav-grup.etkin` ile vurgulanır. Menü blokları, menüsü
olan 17 kök sayfada birebir aynıdır (`404.html` menüsüzdür); birini değiştirirken hepsini
değiştir. Konu sayfalarının (`konu/*.html`) dört bağlantılı kısa menüsü
`tools/seo-uret.js` şablonundan üretilir.

On bir öğe üst bara ancak sıkı ölçülerle (2 px aralık, `.86rem` yazı) tek satırda sığar;
bu ölçüler her genişlikte geçerlidir. 1060 px'ten dar ekranda menü düğmesine geçilir;
sözlük paneli yanda açıkken sayfa daraldığı için bu sınır 1414 px'tir. İki kırılma noktası
da `assets/css/style.css` içindedir (`max-width: 1059px` ve `html.sozluk-yan` için
`max-width: 1413px`); menüye öğe ekler ya da etiket uzatırsan ikisini birlikte yeniden ölç.

**Yeni sayfa** eklersen elle yapılacaklar şunlardır; gerisini üretim zinciri tamamlar:

- Sayfayı düz `assets/...` ve `data/...` yollarıyla, özniteliksiz `<head>` etiketiyle yaz.
  Kullanım betiklerini, alt bilgi bağlantılarını, `referrer`/CSP meta etiketlerini ve
  sürümlü (`/releases/<özet>/`) yolları elle ekleme.
- Menü satırını menüsü olan bütün kök sayfalara ekle.
- `assets/js/kullanim-hesap.js` içindeki sayfa kataloğuna kimliğini yaz; yoksa ziyaretler
  "Bulunamayan sayfa" sayılır ve `tools/test-uretim/kullanim-yol-test.js` kırılır. Sayfanın
  kendi eylemi varsa aynı dosyadaki eylem kataloğuna da ekle.
- `sw.js` içindeki `TEMEL_DOSYALAR` listesine sayfayı ve kendi betik/stil dosyalarını ekle
  (`'./assets/js/x.js'` biçiminde; sürümlü yola zincir çevirir). Kök sayfanın listede
  olmasını `tools/test-uretim/sw-surum-test.js` denetler.
- Arama motorlarına açık bir sayfaysa `tools/seo-uret.js` içindeki `STATIC_URLS` listesine
  ekle: `sitemap.xml` bu listeden üretilir, elle düzenlenmez. Kişisel ya da araç
  sayfasıysa bunun yerine `tools/site-sablon-uret.js` içindeki `noindex` listesine yaz.
- Elle tutulan test listelerine ekle: `tools/browser-qa.js` (erişilebilirlik/taşma rota
  listesi ve menü sırası), `tools/test-uretim/statik-yayin-test.js`,
  `tools/test-uretim/esitleme-entegrasyon-test.js`, `tools/qa/qa.js`,
  `tools/test-uretim/sayfa-denetim.html`.

Sonra `pnpm generate` çalıştır. `sw.js` içindeki `SURUM` ve `ICERIK_OZETI` elle
değiştirilmez: `tools/sw-surum.py` içerik özeti değiştiyse sürümü kendisi artırır.

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
yayımlanır. `sw.js` JS/veri dosyalarını önbellek-öncelikli sunar; `SURUM` artmazsa
kullanıcı ilk ziyarette yeni HTML + eski JS/veri görür. Bu yüzden **her yayından önce**:

```bash
python tools/sw-surum.py     # yayımlanan dosyaların özetini hesaplar, değiştiyse SURUM'u artırır
```

CI'daki `tools/test-uretim/sw-surum-test.js` aynı özeti hesaplayıp `sw.js` ile karşılaştırır:
dosya değişip betik çalıştırılmamışsa test kırmızıya döner. Node kurulu olmayan makinede
testler `tools/test-uretim/node-testleri-tarayicida.html` ile başsız Edge'de koşulur.

Çalışma zamanı dosyaları `releases/<özet>/` altında değişmez kopyalardır
(`tools/release-uret.py`, `tools/release-bagla.js`). `release-manifest.json` güncel sürümü
(`surum`) ve bir öncekini (`onceki`) tutar; `tools/release-buda.py` geri kalan sürüm
klasörlerini siler, CI `--kontrol` ile yetim klasör kalmadığını doğrular (her sürüm ~20 MB
ve GitHub Pages sınırı 1 GB). Bir önceki sürüm bir yayın daha diskte kalır: yayından hemen
önce açılmış bir sayfa tembel verisini bulur; `sw.js` de bir önceki önbelleği tutar ve bu
sürümün önbelleğinde olmayan dosyayı oradan verir (`tools/test-uretim/sw-onbellek-test.js`).
Daha eski bir sürümle açık kalmış sayfa veri yükleyemezse `release-manifest.json`'u okuyup
"Sayfayı yenile" uyarısı gösterir.
