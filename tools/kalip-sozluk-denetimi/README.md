# Kalan 4.741 kelimenin sözlük karşılaştırması

Bu belge bu turun tarihsel sonuçlarını korur. İlk güncellenen 4.638 kelimenin sonraki karşılaştırması da [ayrı denetim paketinde](../kalip-sozluk-ilk-tur-denetimi/README.md) tamamlanmıştır. Güncel site toplamı 45.833 kullanım çiftidir; bu paketteki 4.741 kayıt sonraki turda değiştirilmemiştir.

Bu incelemenin hedefi, ilk kalıp güncellemesinde değişmeden kalan **4.741 kelime**dir. Hedef listesi yayımlanmış `758487f5dec692e6676984d8cf0900eeeca21e64` sürümünden, yeni incelemeye başlamadan önce sabitlendi. İlk turda değişen 4.638 kelime bu turun hedefi değildir.

Sonuç: **2.662 kelime değişti; 2.079 kelimenin kalıpları inceleme sonrasında korundu. 4.503 yeni EN/TR çifti eklendi ve 303 mevcut çift düzeltildi.** Hedef gruptaki kullanım sayısı 9.849'dan 14.352'ye, bütün sitedeki kullanım sayısı 25.005'ten **29.508**'e çıktı. 677 kelimede yerel sözlük karşılaştırmasına ek web doğrulaması yapıldı.

`manifest.json` hedef sözcüklerin sıralı listesini, kaynak girdilerin SHA-256 özetlerini, hedef dışı 4.638 kaydın korunma özetini ve nihai sayımları içerir. `review-001.json`–`review-048.json` dosyalarında her sözcük için:

- Önceki ve sonraki İngilizce/Türkçe kullanım çiftleri;
- Eklenen kullanımlar ve indeksleriyle mevcut kalıp düzeltmeleri;
- Sözcüğe özel editoryal karar ve değişip değişmediği;
- İncelenen sözlük maddeleri, fiil sınıfları ve gerektiğinde güncel sözlük bağlantıları bulunur.

`candidate_refs`, çekim veya farklı yazım üzerinden incelenen aday maddelerin kimliklerini ve eşleşme türünü korur. Bu liste, her aday anlamının siteye alındığını göstermez; seçim gerekçesi sözcüğün notunda ve eklenen kullanımlarda izlenir.

Değişmeden bırakılan kelimelerin de karar kaydı vardır. Kaynakta eşleşme bulunması, tek başına bir kelimenin incelendiği veya içeriğinin eksiksiz olduğu şeklinde sayılmadı.

## İçerik yöntemi

Karşılaştırma mevcut Türkçe anlam satırlarıyla sınırlanmadı. Kaynaklardaki farklı sözcük türleri, anlamlar, örnekler, edatlı kullanımlar, ilgili öbek fiiller ve fiil tamlayıcıları okundu. Yeni kullanımlar için özgün kısa İngilizce örnekler ve Türkçe karşılıklar yazıldı. Yararlı mevcut örnekler korundu; kalıp sayısına alt veya üst sınır konmadı.

Open English WordNet 2025 anlam ve örnekleri, GCIDE 0.54 sözlük maddeleri ve uygun kelimelerde VerbNet 3.4 fiil çerçeveleri karşılaştırmada kullanıldı. Yerel kaynakta bulunmayan başlıklar, güncel anlamlar ve şüpheli yapı eşleşmeleri Cambridge, Oxford, Collins ve diğer doğrudan kaynaklarla ayrıca kontrol edildi. Web kaynaklarının her biri ilgili sözcük kaydında hangi amaçla kullanıldığıyla birlikte yer alır.

Ortak eşanlamlı kümelerdeki bir örnek ya da genel fiil çerçevesi, hedef sözcüğe otomatik olarak aktarılmadı. Teknik, bölgesel ve eski kullanımlar öğretici değerine göre seçildi; gerektiğinde Türkçe karşılıkta etiketlendi. Bu çalışma, her tarihî sözlük anlamını veya bütün deyimleri içerme iddiası taşımaz.

Yeni anlamlar **kelimenin altındaki kalıplarda** gösterilir. Kartların mevcut anlam metinleri, örnek cümleleri, kimlikleri ve ilerleme verileri bu turda değişmez. Kayıtlı anlamların dışındaki yeni kalıplar, ana koleksiyonda boş `sense_coverage` listesiyle gösterilebilir; bu, incelemenin eksik olduğu anlamına gelmez.

## Kaynak bilgisi

Sürüm, dosya özetleri, yayıncı, lisans ve kaynak adresleri `sources.json` içindedir. Open English WordNet Community ve Princeton University WordNet; VerbNet, University of Colorado Boulder; GNU Collaborative International Dictionary of English (GCIDE) ve katkıcılarına atıf yapılır. Sözlüklerin tam tanım ve örnek metinleri bu denetim paketinde yeniden yayımlanmaz. Paket, madde kimlikleri, bağlantılar, inceleme kararları ve site için hazırlanmış iki dilli kullanımları saklar.

## Doğrulama

`node tools/test-uretim/kalip-sozluk-test.js`, sabit 4.741 kelimenin tam sırasını, karar ve kaynak kayıtlarını, değişiklik dökümünü, sayımları ve ana kalıp koleksiyonuyla bire bir eşleşmeyi doğrular. `kalip-anlam-test.js` ayrıca bütün 9.379 kartta görüntülenen kalıpları ve kalıp dışındaki içeriğin korunmasını denetler.

Bu kontroller içerik incelemesinin yerine geçmez; onaylanan içeriğin kaybolmadan aktarılmasını sağlar. Daha sonraki bir editoryal düzeltmede ilgili denetim kaydı ve ana koleksiyon birlikte güncellenmelidir.
