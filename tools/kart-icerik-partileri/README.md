# Kart içeriği — 7–8 Eylül 2026, iki editoryal paket

Bu paket **bütün kelimelerin dilsel denetiminin tamamlandığı anlamına gelmez**.
Yapay zekâ destekli editoryal incelemedir; insan dil uzmanı onayı değildir.

## İkinci paket: tüm kelime kartlarında dönüşümlü örnek

- Kalan 9.279 kelimeye birer özgün EN–TR alternatif eklendi. İlk 194 alternatifle toplam 9.473 alternatif vardır; 9.379 kelime kartının tamamı en az bir ek örneğe sahiptir.
- 1.546 boş kart-altı kullanım alanına 3.059 EN–TR eşdizim veya doğal kullanım örüntüsü eklendi. Boş kullanım alanı kalmadı.
- Kayıtlar donmuş eski anlamlara bağlandı; İngilizce/Türkçe birebir tekrar, yarım cümle, eksik çeviri ve hedef anlam indeksi denetlendi. Yeni 9.279 örnek 12–40 İngilizce sözcük aralığındadır.
- Ajanların yazdığı 8.040 alternatif parti başına ikinci okundu; kökün son yedi partisindeki 420 alternatif ayrıca bağımsız ikinci okundu. Kökün kalan 819 örneği için bağımsız ikinci okuma iddiası yoktur.
- Yanlış veya belirsiz ana anlamlar, çeviriler, sözcük türleri ve olgusal genellemeler ayrı eski-metin korumalı işlemlerle düzeltildi. Gerekçeler ve başvurulan kaynaklar JSON işlemlerinde kayıtlıdır.
- `knowledgeable` altındaki ayrı türemiş `knowledgeably` zarfı yanlış son anlam olarak kaldırıldı; sıfat anlamı ve kartın yeni alternatifi korunur.

## İlk paketin tarihsel kapsamı

- 9.379 başlık, 12.894 ana EN–TR örnek çifti ve 15.968 eski kalıp yapısal olarak tarandı.
- Mevcut eşdizimlerde en az 922 başlık / 2.539 kalıp anlam ve kullanım açısından okundu.
- 413 boş başlığa 803 yeni eşdizim veya kullanım örüntüsü eklendi; 15 mevcut başlık düzeltildi.
- Örneklerde 272 kelimenin 296 anlamı ayrı ayrı okundu. 17 anlamdaki örnek/çeviri düzeltildi (12 İngilizce cümle, 17 çeviri, 2 anlam açıklaması).
- 100 kelimenin 104 anlamına 194 özgün İngilizce–Türkçe alternatif eklendi.
- Ek 30 başlığın 60 alternatifi ve 17 düzeltme bağımsız ikinci ajan tarafından tekrar okundu. Entegrasyonda stainless, sustain, demonstrate ve emerge cümleleri bu okumaya göre iyileştirildi.

Yeni cümleler çıkmış YDS sorusu, sözlük alıntısı veya doğrulanmış araştırma
bulgusu olarak sunulmaz. Akademik/analitik çalışma bağlamları için özgün
örneklerdir. Kaynak bağlantıları anlam/gramer ayrımını destekler; her yeni
ifadenin korpustaki sıklığının doğrulandığı iddiasını taşımaz.

## Sınırlar ve seyrek kullanımlar

- Her kartta alternatif vardır; her ayrı anlamda alternatif bulunduğu iddia edilmez. Ayrı 1.854 Öbekler kartı için yeni bir alternatif cümle havuzu bu paketin kapsamı değildir.
- `looking` artık yalnız `looking closely/carefully` çekimli fiil örüntülerini içerir. `look at`, `look for` ve diğer bağımsız öbeklerin ayrımı korunur.
- `yeah` gibi günlük sözcükler görüşme veya alıntı bağlamında kullanılır; günlük dil uyarısı korunur. Bunlar resmî akademik yazı üslubu veya yüksek sıklıklı YDS kalıbı diye sunulmaz.
- Seyrek tarihî/teknik başlıklardaki bazı ekler güçlü istatistiksel eşdizim değil, anlamı gösteren doğal kullanım örüntüsüdür. `homo` gibi incitici sözcükler yalnız uyarılı metadil bağlamıyla ele alınmıştır.
- Bütün eski ana örneklerin kesin hatasız olduğu, her ifadenin korpus sıklığının dış kaynakla doğrulandığı veya insan dil uzmanından onay aldığı iddia edilmez.
- Yapısal testler doğruluk, doğallık, anlam/POS ve çeviri denetiminin yerine geçmez.

## Kalıcı üretim

`tools/listeyi-aktar.py` bütün eski kaynakları birleştirdikten sonra
`tools/kart_icerik.py` ile bu JSON partilerini uygular. Kaynak çalışma tablolarına
yazılmaz. Kart sayısı, öncelik puanları ve katmanlar korunur. `alexander →
alexanders` ve `stone-face → stone face` başlık düzeltmeleri eski öğrenme
anahtarlarını alias olarak korur; başlık değişimi ilerleme kaybına yol açmaz.

Her düzeltme/esdizim tam eski değer koruması taşır. Anlam indeksiyle birlikte
eski Türkçe anlam ve EN–TR çifti denetlenir; kaynak değişmişse üretim hata verir.
Kalıp yamaları tam eski/yeni dizileri taşır. Alternatifler anlamın `exs` alanında
EN–TR çiftleri olarak saklanır. Üretim atomiktir: koruma başarısızsa yarım yama
uygulanmaz. Cümleler ve çevirileri birbirinden bağımsız seçilmez.

Yanlış türev anlam kaldırılması yalnız son indekste, tam eski anlam/örnek
ve anlam sayısı korumasıyla mümkündür. İlk veya tek anlam, alternatifli anlam,
çakışan düzeltme ya da değişmiş kaynak reddedilir; kalan indeksler kaymaz.

`causing` için `tools/tur-duzeltme.js` türü fiil olarak netleştirir. `rowing`
çalışma örneği değiştirilmiştir; önceki metin JSON'daki `expected` içinde
izlenebilir kalır. Sınav puanı/katmanı ve bağımsız test kaydı korunur.

## Davranış ve test

Kartlar tıklama, Enter veya boşlukla bir kez açılır; aynı gösterimde kapanmaz.
Yeni karta geçiş yeni gösterimdir. İpucu, cevap, yeniden çizim ve başarısız
kayıt aynı örnek çiftini korur. Tercih `yds-ornek-sirasi-v1` anahtarında yalnız
cihazda saklanır; ilerleme/bulut eşitlemesine girmez. Depolama engelliyse
bellekte çalışır. İki eşzamanlı sekme için küresel tekrar-etmeme garantisi yoktur.

Testler: `kart-acik-kalir-test.js`, `ornek-donusumu-test.js`,
`kart-icerik-test.py`, `kart-icerik-yayin-test.js` ve mevcut kaynak/bütünlük
testleri. VM davranış testleri gerçek tarayıcı görsel/erişilebilirlik denetimi
olarak raporlanmaz.

`kart-tam-kapsam-test.js` tüm 9.379 kartta ek örnek ve kullanım alanını,
9.473 benzersiz alternatifin tam EN–TR eşleşmesini zorunlu kılar. Eksik ikinci
paket CI'dan geçemez. `kart-tamamlama-baslik-test.js` anlam/başlık/POS
düzeltmelerini ve `kart-baslik-yenileme-test.py` ilerleme alias/puan korumasını
denetler. Gerçek Chromium, klavye ve axe erişilebilirlik kontrolleri ayrıca
`tools/browser-qa.js` ile çalıştırılır.
