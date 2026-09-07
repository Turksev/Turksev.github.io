# Kart içeriği — 7 Eylül 2026, ilk editoryal parti

Bu paket **bütün kelimelerin dilsel denetiminin tamamlandığı anlamına gelmez**.
Yapay zekâ destekli editoryal incelemedir; insan dil uzmanı onayı değildir.

## Tamamlanan içerik

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

## Açık kalan kapsam

- 1.546 başlıkta kalıp alanı hâlâ boş; yararlı akademik başlıklar da bu gruptadır.
- `looking` bilerek boş: `look at` ve `look for` zaten ayrı öbek kartlarıdır;
  önceki ayrımı bozacak öneri entegrasyon testinde çıkarıldı.
- `yeah` günlük konuşma kaydıdır; sırf alanı doldurmak için akademik kalıp yazılmadı.
- 9.279 kelimeye henüz ek örnek yazılmadı. Bu kelimelerin mevcut örnekleri korunur.
- Yapısal tarama; doğruluk, doğallık, anlam/POS ve çeviri için tam editoryal
  incelemenin yerine geçmez. Kalan anlamların tamamı tek tek incelenmiş değildir.

## Kalıcı üretim

`tools/listeyi-aktar.py` bütün eski kaynakları birleştirdikten sonra
`tools/kart_icerik.py` ile bu JSON partilerini uygular. Kaynak çalışma tablolarına
yazılmaz. Kelime kimlikleri, puanlar, katmanlar ve öğrenme kayıtları değişmez.

Her düzeltme/esdizim tam eski değer koruması taşır. Anlam indeksiyle birlikte
eski Türkçe anlam ve EN–TR çifti denetlenir; kaynak değişmişse üretim hata verir.
Kalıp yamaları tam eski/yeni dizileri taşır. Alternatifler anlamın `exs` alanında
EN–TR çiftleri olarak saklanır. Üretim atomiktir: koruma başarısızsa yarım yama
uygulanmaz. Cümleler ve çevirileri birbirinden bağımsız seçilmez.

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
