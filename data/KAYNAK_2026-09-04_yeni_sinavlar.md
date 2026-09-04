# 2024–2026 Tam Kitapçık Eklemesi — 4 Eylül 2026

Bu belge, `data/` altındaki kelime ve öbek dosyalarına 4 Eylül 2026'da yapılan
eklemenin kaynağını ve yöntemini kayıt altına alır. Commit: `ac72df1`.

## Nereden geldi

ÖSYM 2022'den itibaren YDS sorularının yalnız **%10'unu** (80 soruda 8) yayımlıyor.
3 Eylül 2026'da altı oturumun tam kitapçıkları arşive alındı ve resmî %10 yayınıyla
çapraz doğrulandı (8/8 cevap eşleşmesi, sıfır çelişki):

YDS 2024/1 · 2024/2 · 2025/1 · 2025/2 · 2025/İNGİLİZCE · 2026/1

Bu kitapçıklar ÖSYM kaynaklı değildir; üçüncü taraf transkripsiyonlardır.
Ayrıntı ve doğrulama kanıtı:
`../../01_sinav_arsivi/06_qa_reports/reconstructed_full_booklets_2026-09-03.md`

Korpus etkisi: **166.645 → 211.534** İngilizce token (+%27).

## Ne eklendi

| Dosya | Önce | Sonra | Eklenen |
|---|---|---|---|
| `kelime-dizin.js` | 8.440 | 9.130 | **+690** |
| `kelime-k5.js` | 2.069 | 2.130 | +61 |
| `kelime-k6.js` | 1.917 | 2.546 | +629 |
| `obekler.js` | 1.631 | 1.815 | **+184** |

Toplam **874** yeni madde. Mevcut hiçbir kayıt değiştirilmedi; birleştirme satır
düzeyinde yapıldı, var olan satırlar yeniden serileştirilmedi.

## Kartların içeriği

Her kelime kartında:
- Anlam(lar), tür önekiyle (`f. zarar vermek, bozmak`) — 176 kelime çok anlamlı
- YDS üslubunda örnek cümle + akıcı Türkçe çevirisi
- YDS önem derecesi `yz` 1–4
- Kolokasyonlar (`kl`): 690 kelimenin 689'unda, ortalama **3,1 adet**

Öbeklerde tür etiketi: `deyimsel fiil` (32) · `sabit ifade` (121) · `edat kalıbı` (7)
· `geçiş ifadesi` (1). Kaynak alanı `kn:"sınav"`.

Kartlar üretilirken her maddenin **sınavda geçtiği gerçek cümle** girdi olarak
verildi; anlam o bağlama göre belirlendi.

## Elenen 80 madde

- **Özel ad:** Anatolian, Arabian, Andean, Chicago, Catholic, Viking, Seljuk,
  Maori, Massachusetts, Jupiter, Ephesus, Inca, Cicero, Baroque, Rococo, Holocene,
  Pliocene, Hyracotherium, Polynesian, Siberian, Eurasian, Greco-Roman, Icelandic,
  Norwegian, Nebuchadnezzar
- **Diyalog sorularındaki kişi adları:** Anna, Lena, Rue, Bailey, Burke
- **Kısaltma:** ATP, BMI
- **PDF çıkarımından gelen bölünmüş kelime artıkları:** `Hum` (Hum ans → humans),
  `Cond` (Se cond → second), `lea` (lea rning), `ply` (sim ply), `tic` (Gene tic),
  `Ming` (global war ming), `modem` (modem science → modern), `diploma` (diploma cy),
  `sightedness` (short sightedness), `Pre-`, `By-past`
- **Mükerrer yazım varyantı:** lifesaving/life-saving, lockdown/lock-down,
  outpatient/out-patient, psychomotor/psycho-motor

Bu artıkların hiçbiri otomatik filtreyle yakalanamazdı (`diploma`, `modem` gerçek
sözlük kelimesidir); bağlam cümlesine bakılarak ayıklandılar.

## Katman kararı — bilinmesi gereken

`a45_puanla.py` formülü: **Puan = 100 × (0,50·S + 0,20·F + 0,30·P)**,
burada `S = geçtiği sınav / 49`.

Yani puanın **yarısı sınav yaygınlığından** geliyor. Eklenen 690 kelimenin **641'i
tek sınavda geçiyor** — çünkü yalnız 6 sınav açıldı. Bu, kelimelerin değersiz
olduğunu değil, henüz az sınavda görünür olduklarını gösterir. Medyan puanları
9,6; sitenin medyanı 16,2.

Bu yüzden **katman tabanı 6'da tutuldu, 7 verilmedi.** Gerekçe: 7. katman
`listeyi-aktar.py` içinde `AILE_KATMANI` olarak tanımlı ve kelime ailelerini
tamamlamak için eklenen dolgu türevler içindir. Bu kelimeler sınav metninde
bizzat geçmektedir; dolgu değildir.

Puan alanı (`p`) ham formül değeriyle bırakıldı — mevcut kayıtlarla aynı ölçekte
ve dürüst. Yeni sınavlar açıldıkça bu kelimelerin `gectigi_sinav` değeri artacak
ve puanları kendiliğinden yükselecektir.

**Öneri:** formül gözden geçirilecekse, `S`'nin paydası kelimenin *görülebileceği*
sınav sayısına normalize edilmelidir — tam kitapçığı açılmış 25 sınav ile yalnız
%10'u yayımlanmış 24 sınav aynı paydayı paylaşamaz.

## Yeniden üretim

Kartlar `03_calisma_listesi` boru hattının sandbox kopyasında üretildi; gerçek
`korpus.jsonl` ve `puanlama.sqlite` dosyalarına dokunulmadı. `Cikmis_Sorular_Kopya`
hâlâ 15 Ağustos'ta donmuş 49 PDF'i taşıyor — boru hattı yeniden koşulacaksa önce
o kopya tazelenmelidir.
