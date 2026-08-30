# Görev: çok türlü kelimelerin her türüne kendi örnek cümlesini yazmak

Kaynak listede bazı kelimelerin iki (bazen üç) türü tek anlam satırında birleşmiş
ve tek örnek cümle verilmiş:

```
photograph → "i. fotoğraf; f. fotoğrafını çekmek"   (tek örnek, o da isim hâli)
```

Senin işin bu kayıtları anlamlarına ayırmak ve HER türe kendi örneğini vermek.

## Girdi
JSON dizisi: `{e: kelime, k: katman, y: tür, p: puan, parcalar: [bölünmüş anlamlar],
ex: mevcut örnek, exTr: çevirisi}`

## Çıktı — yalnız JSON dizisi

Her kayıt için `parcalar` ile AYNI SIRADA ve AYNI SAYIDA anlam nesnesi:

```
[{"e":"photograph","a":[
   {"tr":"i. fotoğraf","ex":"...","exTr":"..."},
   {"tr":"f. fotoğrafını çekmek","ex":"...","exTr":"..."}]}, ...]
```

## Kurallar

1. `tr` alanları `parcalar`daki metinlerin AYNISI olacak — anlamı yeniden yazma.
2. **Mevcut örneği koru:** `ex` hangi parçanın kullanımını gösteriyorsa o parçaya
   mevcut `ex`/`exTr` ikilisini aynen ver; yalnız diğer parçalara YENİ örnek yaz.
   (Mevcut örnek her zaman ilk parçayı göstermez — hangi türü gösterdiğine bak.)
3. Yeni örnekler YDS ayarında olsun: akademik/gazete İngilizcesi (bilim, ekonomi,
   sağlık, çevre, tarih, teknoloji), 10-20 kelime, doğal ve öğretici.
4. Hedef kelime örnekte mutlaka geçsin (çekimli olabilir: -s, -ed, -ing, çoğul).
   Bileşik içinde geçmesi sayılmaz (meaningful ≠ meaning).
5. Örnek, anlam satırındaki TÜRÜ göstersin: "f." etiketli parçanın örneğinde kelime
   fiil olarak kullanılmalı.
6. Aynı kökten başka bir kelime cümlede geçmesin (ipucu sızıntısı: kart örneği
   boşluklanarak ipucu yapılır, kök tekrar ederse cevabı ele verir).
7. `exTr` sadık ve doğal Türkçe çeviri; ç ğ ı İ ö ş ü kullanılacak, diakritiksiz
   Türkçe reddedilir.
8. Tırnak ve kesme işareti düz ASCII (' ve "). Tipografik işaret yok.

## Yapma
- Hiçbir kaydı atlama; çıktı uzunluğu girdiyle aynı olmalı.
- JSON dışında açıklama, markdown, kod bloğu işareti yazma.
