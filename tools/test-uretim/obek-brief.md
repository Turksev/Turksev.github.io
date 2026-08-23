# Görev: kelime öbeklerini türüne göre sınıflandır

YDS hazırlık sitesindeki öbek listesinin tür etiketleri kaynaktan olduğu gibi geldi ve
karışık: gerçek phrasal verb'lerle düz fiil+edat birleşmeleri aynı torbada.
Senin işin her öbeğe **doğru türü** vermek.

## Girdi
JSON dizisi: `{f: öbek, y: mevcut (güvenilmez) etiket, s: kaç sınavda geçti, kn: kaynak, tr: [anlamlar], ornek: örnek cümle}`

## Çıktı — yalnız JSON dizisi
```
[{"f":"give up","t":"deyimsel fiil"}, {"f":"lead to","t":"edat kalıbı"}, ...]
```
`f` girdideki öbek (aynen), `t` şu beş değerden biri:

**`deyimsel fiil`** — Gerçek phrasal verb: fiil + edat/zarf, anlamı parçalarının
toplamından **farklı** ya da öngörülemez.
*give up (vazgeçmek), carry out (yürütmek), put off (ertelemek), bring about (yol açmak),
turn out (ortaya çıkmak), look after (bakmak), take over (devralmak), rule out (elemek)*

**`edat kalıbı`** — Anlamı şeffaf ama **edatı ezberlenmesi gereken** kalıplar: fiil/sıfat/isim
sonrası sabit edat. YDS bunları boşluk doldurmada bolca sorar.
*lead to, contribute to, depend on, focus on, result in, consist of, based on, capable of,
prone to, according to, due to, aware of, responsible for*

**`sabit ifade`** — Fiil+edat olmayan kalıp ifadeler, deyimler, isim öbekleri.
*as well, a lot, in order, at least, on the other hand, in terms of, a great deal*

**`geçiş ifadesi`** — Cümle bağlayıcıları.
*even though, rather than, as a result, in addition, on the contrary, nevertheless*

**`sıradan`** — Öbek sayılmayacak kadar düz birleşme: anlamı tamamen parçalarından çıkan,
öğrenilecek bir yanı olmayan sıradan kelime yan yanalıkları.
*live in, work in, go to, come with, be on (yayında olmak anlamı dışında düz kullanımsa),
know as, have on, make it*

## Karar ölçütü
Kendine şunu sor: **"Bu öbeği bilmeyen bir öğrenci cümleyi yanlış anlar mı, ya da boşluğa
hangi edatın geleceğini bilemez mi?"**
- Anlamı sürpriz → `deyimsel fiil`
- Anlamı açık ama edat ezber → `edat kalıbı`
- İkisi de değil, ama kalıp → `sabit ifade` / `geçiş ifadesi`
- Öğrenilecek bir şey yok → `sıradan`

Girdideki `tr` anlamları ve `ornek` cümle en güçlü ipucundur: Türkçe karşılık öbeğin
parçalarından tahmin edilemiyorsa büyük olasılıkla `deyimsel fiil`.

## Yapma
- Hiçbir öbeği atlama; çıktı dizisinin uzunluğu girdiyle aynı olmalı.
- Mevcut `y` etiketine güvenme, sıfırdan karar ver.
- JSON dışında hiçbir şey yazma (açıklama, markdown, kod bloğu işareti yok).
