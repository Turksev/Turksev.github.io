# İlk güncellenen 4.638 kelimenin sözlük karşılaştırması

İlk kalıp düzenlemesinde değişen **4.638 kelimenin tamamı**, mevcut Türkçe anlamlarla sınırlanmadan bağımsız sözlüklerle yeniden karşılaştırıldı. İnceleme, yayımlanmış `c985c4264f8ef6d67f2e4e8e201ee83a87670ec0` sürümünden sabitlenen hedef listesine dayanır. [Önceki 4.741 kelimelik incelemeyle](../kalip-sozluk-denetimi/README.md) birlikte sitenin **9.379 kelimesinin tamamı** için sözlük karşılaştırması ve sözcüğe özel karar kaydı vardır.

Sonuç: **4.004 kart güncellendi; 634 kartın kalıpları inceleme sonrasında korundu. 16.325 yeni EN/TR kullanım çifti eklendi, 265 mevcut çift düzeltildi.** Hedef gruptaki kullanım sayısı 15.156'dan 31.481'e; sitedeki toplam kullanım sayısı 29.508'den **45.833**'e çıktı. 1.211 kelimede ek web doğrulaması yapıldı. Önceden incelenmiş 4.741 kaydın tamamı korunmuştur.

## Kapsam ve yöntem

Open English WordNet 2025 anlamları ve örnekleri, GCIDE 0.54 maddeleri ve ilgili kelimelerde VerbNet 3.4 fiil çerçeveleri okundu. Gerektiğinde Cambridge, Oxford, Collins ve diğer doğrudan kaynaklarla güncel anlamlar ve yapılar kontrol edildi. Çekimli biçimlerde ilgili fiilin, çoğul biçimlerde ilgili ismin, karşılaştırma biçimlerinde ilgili sıfatın anlamları da değerlendirildi. Aday kök eşleşmeleri otomatik olarak kabul edilmedi; farklı sözcüklere ait veya ilgili biçimde kullanılamayan anlamlar elendi.

Farklı anlamlar, edatlı kullanımlar, önemli cümle yapıları ve öbek fiiller için kısa İngilizce örnekler ve Türkçe karşılıklar hazırlandı. Kalıp sayısına sabit alt veya üst sınır konmadı. Teknik, bölgesel ve eski kullanımlar öğretici değerine göre seçilip gerektiğinde etiketlendi. Her tarihî sözlük anlamının veya bütün deyimlerin yer aldığı iddia edilmez.

Yeni anlamlar **kelimenin altındaki kalıplarda** gösterilir. Kart başlıkları, mevcut anlam satırları, örnek cümleler, kimlikler ve ilerleme anahtarları bu turda değişmez. Kayıtlı anlamların dışındaki eklemeler boş `sense_coverage` listeleriyle gösterilir. İçerik kararları ve iki dilli örnekler ayrıca okunmuştur; yalnız otomatik eşleşme sonuçları inceleme sayılmamıştır.

## Denetim kaydı

`manifest.json` hedeflerin tam sırasını, 47 paketin kaynak ve karar özetlerini, önceki 4.741 kaydın korunma özetini ve nihai sayımları saklar. `review-001.json`–`review-047.json` her kelime için şunları içerir:

- Önceki kanonik kaydın tamamı (`before_canonical`) ve önceki/sonraki EN/TR çiftleri;
- Eklemeler, indeksleriyle düzeltmeler ve sözcüğe özel karar;
- Sözlük maddelerinin ve fiil çerçevelerinin kimlikleri;
- Değerlendirilen çekim, çoğul ve karşılaştırma adayları ile kullanılan web kaynakları.

Aday listeleri bütün adayların kabul edildiğini göstermez. Kabul edilen kullanımlar `after` alanında ve ana koleksiyonun `replacement` alanında bulunur. Değişmeden bırakılan 634 kaydın da gerekçesi vardır.

`sources.json`, yerel kaynak sürümlerini, dosya özetlerini, lisansları ve yayıncı bağlantılarını içerir. Open English WordNet Community ve Princeton University WordNet; VerbNet, University of Colorado Boulder; GNU Collaborative International Dictionary of English (GCIDE) ve katkıcılarına atıf yapılır. Kaynakların tam tanım ve örnek metinleri yeniden yayımlanmaz.

## Doğrulama

`node tools/test-uretim/kalip-sozluk-ilk-tur-test.js`, 4.638 kararın tamlığını, iki incelemenin birlikte 9.379 kelimeyi kapsamasını, önceki 4.741 kaydın korunmasını, sayımları ve yalnız denetlenmiş kalıpların aktarılmasını denetler. Önceki turun testi tarihsel durumu `before_canonical` üzerinden doğrulamayı sürdürür. `kalip-anlam-test.js` bütün kartların EN/TR çiftlerini ve kalıp dışı alanların korunmasını kontrol eder.

Ana aktarımcı ve yeniden üretim yolu aynı kanonik koleksiyonu kullanır. Tarayıcı testi en çok kalıbı olan kartı ve en uzun çeviriyi de içeren örneklerde liste/çalışma görünümünü, 320/390/1280 piksel genişlikleri ve büyütülmüş yazıyı kontrol eder. Bu teknik kontroller editoryal okumanın yerine geçmez; onaylanan içeriğin kaybolmadan yayımlanmasını sağlar.
