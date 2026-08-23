# Görev: öbekler için YDS düzeyinde boşluk doldurma cümleleri

Bir YDS hazırlık sitesinde **deyimsel fiiller (phrasal verb) ve edat kalıpları** için test
cümlesi yazıyorsun. Girdideki HER öbek için TAM OLARAK BİR cümle üret.

## Girdi
JSON dizisi: `{e: öbek, y: tür (deyimsel fiil | edat kalıbı), s: kaç sınavda geçti, t: Türkçe anlam(lar)ı, ornek: [kartta zaten kullanılan örnek cümleler]}`

## Çıktı — yalnız JSON dizisi, başka hiçbir şey yazma
```
[{"e":"bring about","c":"The reforms introduced in the 1920s ---- a dramatic fall in child mortality, although their effects on adult life expectancy took much longer to appear.","b":"brought about","f":"past","tr":"1920'lerde getirilen reformlar çocuk ölümlerinde çarpıcı bir düşüşe yol açtı, ancak yetişkin yaşam süresi üzerindeki etkileri çok daha uzun sürede ortaya çıktı."}, ...]
```
Alanlar:
- `e`: girdideki öbek, **aynen** (değiştirme, kısaltma).
- `c`: İngilizce cümle; öbeğin yeri **tam olarak bir kez** `----` ile boş bırakılmış.
  Öbeğin tamamı boşluğa girer: "bring about" için hem fiil hem edat boşlukta olmalı,
  cümlede "about" ayrıca yazılmamalı.
- `b`: boşluğa gelen biçim. Çekimliyse çekimli yaz: *brought about, leads to, giving up,
  run out of*. Küçük harf.
- `f`: `b`'nin çekim türü — yalnız şunlardan biri:
  - `""` sözlük biçimi (b = e)
  - `"s"` 3. tekil şahıs (*leads to, gives up*)
  - `"past"` geçmiş zaman (*brought about, gave up*)
  - `"pp"` 3. hal / past participle; has/had/been/was-were + V3 ve edilgen yapılar
  - `"ing"` -ing hali (*giving up, bringing about*)
  Çekim **öbeğin ilk kelimesine** uygulanır, edat aynen kalır.
  Fiil olmayan edat kalıplarında (*capable of, prone to, aware of*) yalnız `""` kullan.
- `tr`: cümlenin tamamının doğal Türkçe çevirisi.

## Cümle kalitesi
1. **YDS okuma parçası kayıtında** yaz: akademik/ciddi ton; bilim, çevre, ekonomi, tarih,
   sağlık, teknoloji, eğitim, psikoloji. Günlük konuşma cümlesi YASAK.
2. **18–32 kelime**, çoğunlukla bileşik cümle; although/whereas/despite/given that/
   as a result/rather than gibi yapıları çeşitle, her cümleyi aynı kalıpla başlatma.
3. **Bağlam boşluğu tek cevaba kilitlemeli.** Cümleyi okuyan iyi bir öğrenci yalnız
   anlamdan yola çıkarak o öbeği bulabilmeli.
4. **Öbeğin kendisi ya da fiili cümlede bir daha GEÇMESİN** (boşluk dışında).
5. **Girdideki `ornek` cümleleri KULLANMA**, yakın benzerini de yazma — onlar kartta var.
6. Çok anlamlı öbekte `t` içindeki **ilk anlamı** hedefle; bağlam o anlamı çağırsın.
7. Edat kalıplarında (*result in, capable of, prone to*) cümle, edatı bilmeyen birinin
   yanılacağı bir bağlam kursun; anlam açık olmalı ama kalıp gerekli olmalı.
8. Özgün cümleler yaz; gerçek ÖSYM sorularını kopyalama.
9. Kusursuz İngilizce. Düz ASCII tırnak ve kesme işareti; em-dash yerine virgül.

## Yapma
- Yorum, açıklama, Markdown, kod bloğu işareti yazma; dosya yalnız JSON dizisi olsun.
- Hiçbir öbeği atlama; dizideki kayıt sayısı girdiyle aynı olmalı.
- `----` dışında tire grubu kullanma.
