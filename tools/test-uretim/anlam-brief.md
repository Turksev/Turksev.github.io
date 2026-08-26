# Görev: kelime anlamlarının doğruluğunu denetlemek

YDS hazırlık sitesindeki kelime kayıtlarını denetliyorsun. Girdi dosyasındaki her kayıt:
`{e: İngilizce kelime, k: katman, y: tür, p: puan, a: [{tr: Türkçe anlam, ex: İngilizce örnek, exTr: örneğin Türkçesi}]}`

## Her kaydın HER anlamı için üç denetim

1. **tr doğru mu?** `e` kelimesinin o tür/kullanım için doğru Türkçe karşılığı mı?
   (`ex` cümlesi hangi anlamın kastedildiğini gösterir.)
2. **ex uyumlu mu?** Örnek cümle `e` kelimesini gerçekten `tr` anlamıyla mı kullanıyor?
   Hedef kelime cümlede geçiyor mu (çekimli olabilir)? Bileşik bir kelimenin içinde
   "geçiyor" sayılmaz (meaningful ≠ meaning).
3. **exTr sadık mı?** Çeviride anlam kayması, ters çeviri, yanlış özne/sayı var mı?

## Sorun sayılmayanlar — bunları RAPORLAMA

- Eş anlamlı seçimi, üslup, "daha iyi olabilirdi" düzeyindeki şeyler.
- Türkçeye yerleşmiş alıntılar (federal, market, video, radyo…).
- Serbest ama anlamı koruyan çeviri.
- Kalıp etiketli anlamlar: `e. (in spite of) rağmen` gibi kayıtlarda kalıp bilerek
  etikette; kelime örnekte kalıbın içinde geçiyorsa uyumludur.

## Sorun sayılanlar

- Yanlış ya da sözlüklerde bulunmayan anlam.
- Anlamın türü ile örneğin kullandığı tür farklı (tr fiil diyor, örnekte isim).
- Örnek cümlede hedef kelimenin hiç geçmemesi (ya da yalnız türevinin geçmesi).
- Çeviride anlam kayması ya da dilbilgisi bozukluğu.
- İngilizce örnekte bozuk/doğal olmayan kullanım.

## Çıktı — yalnız JSON dizisi

YALNIZ sorunlu bulduklarını yaz; sorun yoksa boş dizi `[]`.

```
[{"e":"kelime","alan":"tr|ex|exTr","mevcut":"sorunlu metnin kısaltması",
  "sorun":"tek cümle","oneri":"düzeltme önerisi","sev":"hata|süpheli"}]
```

`sev`: "hata" = kesin yanlış; "süpheli" = emin değilim, insan baksın.
Dosya UTF-8, BOM'suz. JSON dışında açıklama, markdown, kod bloğu işareti yazma.
