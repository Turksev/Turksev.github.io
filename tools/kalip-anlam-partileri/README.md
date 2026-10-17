# Anlam ve yapı odaklı kalıplar

Bu koleksiyon 9.379 kelimenin tamamını kapsar. 2026-10-18 incelemesinde 4.638 kartın kalıpları değişti; yeterli mevcut kullanımlar korundu. Toplam 19.832 kullanım 25.005 kullanıma çıktı. Sayı sözcüğe göre belirlenir; güncel dağılım 1–9'dur ve bu aralık bir sınır değildir.

`manifest.json` yüklenecek 94 paketi, kelime sayısını ve kalıp dışındaki kart verisinin SHA-256 özetini bildirir. `inceleme-ozeti.json` sayımı ve ayrıca kontrol edilen sözlük maddelerini kaydeder. Kaynak bağlantıları özellikle şüpheli, teknik veya seyrek kullanımlar içindir; her örneğin bir sözlükten alındığı ya da bütün koleksiyonun derlem sıklığıyla doğrulandığı anlamına gelmez.

Her satır:

- `word`: mevcut kelime başlığı.
- `expected_senses`: kalıbın bağlandığı mevcut anlam metinleri, özgün sıralarıyla.
- `expected`: önceki kaynak üretiminin kalıpları. Geçmiş editoryal gardları korumak için sabittir.
- `replacement`: kullanıcıya gösterilecek tüm EN/TR çiftleri.
- `sense_coverage`: her çiftin kapsadığı sıfırdan başlayan anlam indeksleri. `[]` kayıtlı anlam satırlarının dışında kalan yararlı ve geçerli bir kullanımdır.
- `previous_replacement`: varsa, yalnız mevcut yayımlanmış veriden yeni bir düzeltmeye geçişte kabul edilen önceki tam kalıp listesi. `expected` yerine geçmez.
- `sources`: varsa, anlam veya yapı kontrolünde kullanılan sözlük bağlantıları.

İçerik ilkeleri [kalip-brief.md](../test-uretim/kalip-brief.md) dosyasındadır. Anlam indekslerinin tam olması otomatik olarak dilsel doğruluk kanıtı sayılmaz; ifadeler ve çeviriler ayrıca okunmalıdır.

## Üretim ve bakım

Ana aktarımcı `listeyi-aktar.py`, bu koleksiyonu eski kaynaklar ve `kart_icerik` düzeltmelerinden sonra uygular. Kaynak kitapları yeniden okumadan kalıp üretmek için:

```
node tools/kalip-anlam-uygula.js --write
node tools/kalip-anlam-uygula.js --check
python tools/test-uretim/kalip-anlam-test.py
node tools/test-uretim/kalip-gecis-test.js
node tools/test-uretim/kalip-anlam-test.js
```

Sonraki bir kalıp düzeltmesinde eski `replacement` listesini `previous_replacement` olarak saklayıp yeni listeyi ve kapsam indekslerini yaz. Kaynak anlamları değişirse gardı ve kalıp eşleştirmesini birlikte yeniden incele. Kalıp dışı özet, yalnız doğrulanmış kaynak değişikliklerinden sonra yenilenmelidir.

Bu inceleme sırasında sekiz eski anlam/biçim hatası ayrıca `kart-icerik-partileri/2026-10-18-kalip-kaynak-duzeltmeleri.json` içinde açık gardlarla düzeltildi. Diğer anlamlar, örnekler, alternatif örnekler ve ilerleme anahtarları korundu. `first-come-first-serve` başlığına ilişkin olası birleştirme bu çalışmada yapılmadı; kalıpta standart `first-come, first-served` yazımı gösterilir.
