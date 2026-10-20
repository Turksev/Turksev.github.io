# Kalıpların görünüm önceliği

9.379 karttaki 45.833 İngilizce–Türkçe kullanım çifti aynen korunur. Temel anlamlar ve önemli edat/tamlayıcı karşıtlıkları doğrudan gösterilir; dar bağlama ait veya aynı anlamı yineleyen ikincil örnekler **Diğer kullanımlar** bölümünden açılır. Açık kalıp sayısına alt/üst sınır ya da yüzde hedefi uygulanmaz. Bir kartın bütün kalıpları açık kalabilir.

Bu ayrım YDS çalışmasına yönelik editoryal bir önceliktir; derlem sıklığı ölçümü değildir. Uzun kartlar ve alan/kullanım etiketi içeren kartlar ayrı ayrı okunmuştur. İncelemeye aday seçmek için kullanılan uzunluk, gösterilecek kalıp sayısını belirlemez. Ayrı bir ikincil kullanım kararı bulunmayan kartlarda bütün örnekler görünür kalır.

`decisions.json` bütün kartları özgün sırayla içerir. `secondary`, mevcut çift listesindeki sıfır tabanlı indekslerdir; `note` karar gerekçesidir. `review: individual` ayrı içerik değerlendirmesini, `all_visible` bütün çiftlerin açık tutulduğunu belirtir. `manifest.json` toplamları ve incelenen içerik özetlerini kaydeder.

Metinler `tools/kalip-anlam-partileri` ve `data/kelime-k*.js` içinde kalır; sunum verisinde kopyalanmaz. Kart başlıkları, anlam satırları, örnek cümleler ve öğrenme anahtarları değişmez. Her iki görünürlük grubunda özgün sıra korunur.

## Üretim ve kontrol

```
node tools/kalip-sunum-uret.js --write
node tools/kalip-sunum-uret.js --check
node tools/test-uretim/kalip-sunum-test.js
node tools/kalip-browser-qa.js
```

Üretici, kelime envanterini ve her kartın tam kalıp içeriğini SHA-256 ile denetler. Kalıp içeriği değişirse sunum kararları yeniden gözden geçirilmeden üretim geçmez. Tarayıcıda eksik veya eski sunum verisi gelirse tüm çiftler açık gösterilir; hiçbir metin atılmaz.

Ortak `assets/js/kalip-sunum.js` bileşeni kelime listesi, çalışma kartı, arama penceresi, sözlük paneli ve oyun sonucu tarafından kullanılır. Bölüm yerel `<details>` öğesidir; çalışma kartında cevap açma düğmesinin dışında yer alır. Açmak veya kapatmak öğrenme kaydı yazmaz. Çevrimdışı önbellek ve değişmez yayın paketi sunum verisini de içerir.
