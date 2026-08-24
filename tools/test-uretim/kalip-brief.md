# Görev: kelimeler için kullanım kalıpları yazmak

YDS hazırlık sitesinde her kelime kartının altında, o kelimenin **tipik kullanım
kalıpları** gösterilecek. Amaç: öğrenci kelimenin anlamını değil, **nasıl kullanıldığını**
öğrensin — hangi edatı alır, hangi sözcüklerle birlikte gelir.

Örnek:

```
comply  →  comply with the rules — kurallara uymak
           comply with regulations — düzenlemelere uymak
           fail to comply — uymamak, uyum sağlamamak
```

Türk öğrencinin en sık hatası, Türkçe fiilin istediği eki İngilizceye taşımaktır:
"kurallara uymak" dendiği için *comply to* denir; doğrusu **comply with**'tir. Bu yüzden
edat gerektiren kalıplar en değerlisidir.

## Girdi
JSON dizisi: `{e: kelime, y: tür(ler), t: kısa anlam, anlamlar: [tam anlamlar]}`

## Çıktı — yalnız JSON dizisi, başka hiçbir şey yazma
```
[{"e":"comply","k":[
   {"en":"comply with the rules","tr":"kurallara uymak"},
   {"en":"comply with regulations","tr":"düzenlemelere uymak"},
   {"en":"fail to comply","tr":"uymamak"}]},
 {"e":"tiger","k":[]}, ...]
```

## Hangi kelimeye kalıp yazılır
**Yaz** — kullanımı öğrenilmesi gereken kelimeler:
- Edat isteyen fiil / sıfat / isim: *comply with, depend on, capable of, aware of,
  responsible for, an increase in, access to, insist on*
- Güçlü eşdizim (birlikte kullanılan sözcükler): *conduct research, pose a threat,
  meet a deadline, draw a conclusion, take measures, raise awareness*
- Kalıplaşmış yapı: *be likely to, on the grounds that, in terms of, no sooner … than*

**Yazma** (boş dizi `[]` döndür) — kalıbı olmayan somut kelimeler:
*tiger, table, yellow, kitchen, seven, Monday* gibi. Zorlama; uydurma kalıp yazma.
Bir kelime için tek gerçek kalıp varsa yalnız onu yaz; ikiyi doldurmak için şişirme.

## Kurallar
1. Kelime başına **en çok 3**, tercihen 2 kalıp. Gerçekten kullanılan, doğal kalıplar.
2. Kalıp **kısa** olsun: 2–5 kelime. Cümle değil, kalıbın kendisi.
   İyi: `pose a serious threat` · Kötü: `The new policy poses a serious threat to…`
3. Hedef kelime kalıpta **mutlaka geçsin**, sözlük biçiminde ya da doğal çekimiyle.
4. Nesne yerine `sth` (something) / `sb` (somebody) kullan: `provide sb with sth`,
   `deprive sb of sth`. Türkçesinde "bir şey / birine" de.
5. `tr` alanı kısa ve doğal Türkçe olsun: `comply with the rules — kurallara uymak`.
6. Çok anlamlı kelimede en çok sorulan anlamın kalıplarını ver; iki anlam da güçlüyse
   ikisinden birer kalıp yaz.
7. Edat kalıplarını öne al: bir kelimenin hem edat kalıbı hem eşdizimi varsa önce edat.
8. Büyük harfle başlatma (özel ad değilse).
9. **Tırnak ve kesme işareti** düz ASCII olsun (' ve "), tire yerine normal tire.
   Bu kural YALNIZ noktalama içindir.
10. **Türkçe metinler tam Türkçe yazılacak: ç ğ ı İ ö ş ü harfleri kullanılacak.**
   Doğru: `bir şeye uymak`, `düzenlemelere uymak`, `anlayışımızı ilerletmek`
   Yanlış: `bir seye uymak`, `duzenlemelere uymak`, `anlayisimizi ilerletmek`
   Diakritiksiz Türkçe kabul edilmez; dosya UTF-8 yazılır.

## Yapma
- Hiçbir kelimeyi atlama: kalıbı yoksa bile `{"e":"…","k":[]}` yaz. Çıktı dizisinin
  uzunluğu girdiyle aynı olmalı.
- Uydurma ya da nadir kalıp yazma; emin değilsen boş bırak.
- JSON dışında açıklama, markdown, kod bloğu işareti yazma.
