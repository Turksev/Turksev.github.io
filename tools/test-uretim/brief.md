# Görev: YDS düzeyinde boşluk doldurma test cümleleri yazmak

Bir YDS (İngilizce yeterlik sınavı) hazırlık sitesi için kelime testi cümleleri yazıyorsun.
Girdi dosyasındaki HER kelime için TAM OLARAK BİR cümle üret.

## Girdi
JSON dizisi: `{e: kelime, y: tür(ler), t: kısa Türkçe anlam, ornek: [kartta zaten kullanılan örnek cümleler], anlamlar: [...]}`

## Çıktı — yalnız JSON dizisi, başka hiçbir şey yazma
```
[{"e":"prompt","c":"Rising sea levels have ---- several coastal authorities to redesign flood defences that had seemed adequate for decades.","b":"prompted","f":"past","tr":"Yükselen deniz seviyeleri, onlarca yıl yeterli görünen sel savunmalarını yeniden tasarlamaları için birçok kıyı yönetimini harekete geçirdi."}, ...]
```
Alanlar:
- `e`: girdideki kelime, aynen.
- `c`: İngilizce cümle; kelimenin yeri **tam olarak bir kez** `----` ile boş bırakılmış.
- `b`: boşluğa gelen biçim (çekimli olabilir: prompted, cities, analyses, undergoing…). Küçük harf.
- `f`: `b`'nin çekim türü. Yalnız şunlardan biri:
  - `""` kelimenin sözlük biçimi (b = e)
  - `"s"` fiilin 3. tekil şahıs hali (adopts, carries)
  - `"past"` fiilin geçmiş zamanı (adopted, took, went)
  - `"pp"` fiilin 3. hali / past participle (adopted, taken, gone) — has/had/been/was-were + V3 ve edilgen yapılar
  - `"ing"` fiilin -ing hali
  - `"pl"` ismin çoğulu (cities, criteria, analyses)
  Sıfat/zarf için yalnız `""` kullan; comparative/superlative (-er/-est, more/most) KULLANMA. Fiili isim olarak (gerund özne) kullanacaksan `"ing"` işaretle.
- `tr`: cümlenin tamamının (boşluk doldurulmuş hâliyle) doğal, akıcı Türkçe çevirisi.

## Cümle kalitesi — asıl iş burada
1. **YDS okuma parçası kayıtında** yaz: akademik/ciddi ton; bilim, toplum, ekonomi, çevre, tarih, sağlık, teknoloji, eğitim, psikoloji gibi alanlardan. Günlük konuşma, çocuk cümlesi, "I like…" türü basit cümleler YASAK.
2. **18–32 kelime** uzunluğunda, çoğunlukla bileşik cümle: although / whereas / despite / given that / as a result / provided that / rather than / not only … but also gibi bağlaç ve yapıları çeşitle. Her cümleyi aynı kalıpla başlatma.
3. **Bağlam boşluğu tek bir cevaba kilitlemeli.** Cümleyi okuyan iyi bir öğrenci, yalnız anlamdan yola çıkarak o kelimeyi bulabilmeli; eş anlamlı başka bir kelimenin de rahatça oturabileceği belirsiz cümleler yazma. İpucu veren bir cümle parçası, zıtlık ya da sonuç ilişkisi kur.
4. **Kelimenin kendisi ya da başka bir çekimi cümlede bir daha GEÇMESİN** (boşluk dışında). Aynı kökten türev de geçmesin (ör. boşluk "prompted" ise cümlede "prompt", "prompts", "promptly" olmasın).
5. **Girdideki `ornek` cümlelerini KULLANMA, yakın benzerini de yazma** — onlar kartta var; test kartta görüleni ezberden tanımayı değil, yeni bağlamda anlamayı ölçmeli. Farklı bir konu ve yapı seç.
6. Çok anlamlı kelimede `t`/`anlamlar` içindeki **ilk, YDS'de en sık sorulan anlamı** hedefle. Bağlamın o anlamı çağırdığından emin ol.
7. Kelime bir isimse özne/nesne olarak, fiilse yüklem ya da yan cümle olarak kullan; collocation'ı doğal olsun (ör. *pose a threat*, *conduct research*, *undergo surgery*).
8. Gerçek ÖSYM/YDS sorularını, kitaplardaki örnekleri kopyalama; hepsi özgün olsun.
9. Cümlenin doğru, doğal ve dil bilgisi açısından kusursuz İngilizce olduğundan emin ol. Tipografi: düz ASCII tırnak ve kesme işareti (') kullan; em-dash yerine virgül.
10. Çeviri: kelime kelime değil, anlamı tam karşılayan doğal Türkçe.

## Yapma
- Yorum, açıklama, Markdown, kod bloğu işaretleri yazma; dosya yalnız JSON dizisi olsun.
- Hiçbir kelimeyi atlama; dizideki kelime sayısı girdiyle aynı olmalı.
- `----` dışında tire grubu kullanma.
