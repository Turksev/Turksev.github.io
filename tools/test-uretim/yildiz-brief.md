# Görev: çok anlamlı kelimelerin anlamlarına YDS önemi yıldızı vermek

Sitede bir kelimenin birden çok anlamı varsa hepsi eşit ağırlıkta görünüyor ve sıraları
kaynak dosyadan geldiği gibi, yani rastgele. Öğrenci hangisini önce ezberleyeceğini
bilemiyor. Senin işin her anlama **1–4 yıldız** vermek: sınavda hangi anlamın karşısına
çıkacağını söylemek.

Örnek:

```
grind   f. öğütmek   ★★★★      (YDS'de asıl bu anlam çıkar)
        i. angarya   ★         (nadir, deyimsel: the daily grind)

fine    s. ince, güzel, iyi        ★★★
        f. para cezası kesmek      ★
```

## Yıldız ölçeği

| Yıldız | Anlamı |
| --- | --- |
| 4 | Sınavda **asıl sorulan** anlam. Kelime sorusunda, okuma parçasında baskın olarak bu geçer. |
| 3 | **Sık** geçer, mutlaka bilinmeli. Baskın anlam bu olabilir ama tek başına havayı belirlemiyor. |
| 2 | **Ara sıra**; okuma parçasında çıkabilir, kelime sorusunda pek sorulmaz. |
| 1 | **Nadir / ikincil**; deyimsel, teknik ya da günlük konuşmaya ait yan anlam. |

**Zorunlu kural:** Her kelimenin en yüksek yıldızı **en az 3** olmalı. Bir kelimenin
bütün anlamları birden önemsiz olamaz — mutlaka biri baskındır. `[2,1]` geçersizdir,
`[3,1]` ya da `[4,2]` yaz.

**Eşitlik serbesttir.** İki anlam da gerçekten güçlüyse `[4,4]` ya da `[3,3]` yaz;
*issue* (konu/mesele — yayımlamak) ya da *address* (adres — ele almak) gibi kelimelerde
zorlama fark yaratma.

## Neye göre karar veriyorsun

1. **YDS'nin kendi dili.** Sınav akademik/gazete İngilizcesidir: bilim, ekonomi, sağlık,
   çevre, tarih, teknoloji. Bir anlam ancak bu metinlerde geçiyorsa yüksek yıldız alır.
2. **Günlük konuşma anlamları düşüktür.** *pretty* → "oldukça" ★★★, "sevimli" ★.
3. **Deyimsel/kalıplaşmış yan anlamlar düşüktür.** *grind* → "angarya" yalnız
   *the daily grind* kalıbında yaşar: ★.
4. **Teknik/dar alan anlamları düşüktür** — kelime o alanın dışında da geçmiyorsa.
5. **Türü de hesaba kat.** Kelime sınavda ağırlıkla fiil olarak çıkıyorsa fiil anlamı
   yüksek, isim anlamı düşük olur (*fine*: sıfat baskın, fiil ikincil).
6. Emin olamadığın yerde **abartma**: yüksek yıldızı asıl anlama sakla, ikincil olana 2 ver.

## Girdi

JSON dizisi:
`{e: kelime, k: katman(0=öbek), y: tür, p: YDS puanı, a: [{tr: anlam, ex: örnek cümle}]}`

`ex` alanı anlamın hangi kullanımı kastettiğini gösterir — kararını verirken oku.

## Çıktı — yalnız JSON dizisi, başka hiçbir şey yazma

Her kayıt için **yalnız yıldız dizisi**; anlam metinlerini yeniden yazma.
Dizi, girdideki `a` dizisiyle **aynı sırada ve aynı uzunlukta** olmalı.

```
[{"e":"grind","yz":[4,1]},
 {"e":"fine","yz":[1,3]},
 {"e":"issue","yz":[4,4]}, ...]
```

(`fine` örneğinde girdide önce "para cezası kesmek", sonra "ince, güzel, iyi" geliyorsa
çıktı `[1,3]` olur — sıra girdinin sırasıdır, önem sırası değil. Sıralamayı site yapar.)

## Yapma

- Hiçbir kaydı atlama; çıktı dizisinin uzunluğu girdiyle aynı olmalı.
- Anlam metnini, örnek cümleyi ya da sırayı değiştirme; yalnız yıldız ver.
- 1–4 dışında değer, ondalık ya da metin yazma.
- Bütün anlamlara aynı yüksek yıldızı dağıtma; ayırt etmek bu işin bütün amacı.
- JSON dışında açıklama, markdown, kod bloğu işareti yazma.
