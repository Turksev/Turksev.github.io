# Görev: kart örnek cümlelerini düzeltmek (ipucu sızıntısı)

Sitede her kelime kartında örnek cümleler var. Kartın **"İpucu: cümlede gör"** düğmesi,
örnek cümlede hedef kelimeyi `----` ile boşluk yapıp gösterir; öğrenci bağlamdan tahmin eder.

Bazı cümleler bu işi bozuyor. Senin işin o cümleleri yeniden yazmak.

## Girdi
`ipucu-girdi.json` — her kayıt:
```
{"e": "knowing", "katman": 4,
 "anlamlar": [{"tr":"i. bilme, farkındalık","ex":"…","exTr":"…"},
              {"tr":"s. bilgili, bilinçli, anlamlı","ex":"…","exTr":"…"}],
 "sorun": [{"sira": 1, "ex": "He gave a knowing nod … he already knew the whole truth.",
            "neden": "aynı kök kalıyor: knew"}]}
```
`sira`, `anlamlar` dizisindeki kaçıncı anlamın cümlesinin bozuk olduğunu söyler (0'dan başlar).

## Üç kusur tipi
1. **aynı kök kalıyor** — hedef kelimenin başka bir çekimi cümlede duruyor
   (*knowing … knew*). Boşluk açılınca cevap ele veriliyor.
2. **akraba kelime kalıyor** — aynı aileden bir sözcük duruyor
   (*direction … director*, *athletic … athletes*). İpucu neredeyse cevabı söylüyor.
3. **ipucunda 2 boşluk** — kelimenin türevi de boşluğa dönüşüyor, cümle
   "---- … ----" gibi görünüyor (*plan … planning*).

## Çıktı — yalnız JSON, başka hiçbir şey yazma
Girdideki HER kelime için, o kelimenin **bütün anlamlarını** eksiksiz döndür
(bozuk olanı düzelt, sağlam olanlara **dokunma**, aynen kopyala):
```
[{"e":"knowing","anlamlar":[
   {"tr":"i. bilme, farkındalık","ex":"…","exTr":"…"},
   {"tr":"s. bilgili, bilinçli, anlamlı","ex":"YENİ CÜMLE","exTr":"YENİ ÇEVİRİ"}]}, …]
```
`tr` alanlarını **hiç değiştirme** — girdideki sırayla ve birebir aynı yaz.

## Yeni cümlenin kuralları
1. Hedef kelime cümlede **tam bir kez** geçsin; başka hiçbir çekimi, türevi ya da
   aynı aileden bir sözcük geçmesin. (*knowing* varsa *know, knew, known, knowledge* olmasın.)
2. Cümle o anlamı (`tr` alanındaki anlamı) net biçimde göstersin; tür kısaltmasına uy
   (i.=isim, f.=fiil, s.=sıfat, z.=zarf).
3. **Bağlam kelimeyi çağırsın**: boşluk bırakıldığında iyi bir öğrenci anlamdan bulabilmeli.
4. 14–26 kelime; YDS okuma parçası kayıtında, akademik ama anlaşılır. Günlük konuşma yok.
5. Türkçe çeviri doğal ve tam olsun.
6. Düz ASCII tırnak ve kesme işareti; em-dash yok.
7. Özgün cümle yaz; girdideki bozuk cümlenin yeniden düzenlenmiş hâli olmasın, konuyu değiştir.

## Yapma
- Kelime atlama; çıktı dizisi girdiyle aynı uzunlukta olmalı.
- Sağlam cümleleri değiştirme.
- JSON dışında açıklama, markdown, kod bloğu işareti yazma.
