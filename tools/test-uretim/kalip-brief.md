# Kelime kartlarında kullanım kalıpları

Her kelimenin altında doğal İngilizce kullanımlar ve bunların tam Türkçe karşılıkları bulunur. Amaç, öğrencinin bildiği tek anlamı her bağlama zorlamasını önlemek ve sözcüğü kullanıldığı yapıyla birlikte öğretmektir.

## İçerik ilkeleri

- Kelime başına sabit sayı, asgari doldurma hedefi veya üst sınır yoktur. Basit bir sözcüğe bir örnek yeterken çok anlamlı bir fiil daha fazla örnek gerektirebilir.
- Karttaki her ayrı anlamı uygun bir kullanımla göster. Aynı anlam satırı birden fazla yaygın kullanım içeriyorsa gerekli ayrımı da yap. Yeni bir kullanım geçerliyse kartta ayrı anlam satırı bulunmaması onu dışlamaz.
- Gerçekten varsa karakteristik edatları ve anlam farklarını göster: `depend on`, `provide someone with something`, `provide something for someone`. Her sözcüğe yapay bir edat ekleme.
- Önemli dilbilgisel tamamlayıcıları örnekle: `decide to leave`, `avoid making mistakes`, `establish that the claim is true`, `establish whether the plan works`.
- Anlamı değiştiren yapıları ayrı ver: `remember to call` ile `remember calling` gibi.
- Kısa, somut ve anlaşılır ifadeler kullan. Kalıbın anlaşılması gerekiyorsa kısa bir cümle kullanılabilir; iki-beş sözcük sınırı yoktur. Çevrilmemiş boşluklardan kaçın.
- Genel şema gerçekten öğreticiyse `someone/something` kullanılabilir. Somut örneğin daha açık olduğu yerde onu tercih et. Türkçede yüklemi, nesneyi, olumsuzluğu ve zamanı eksiksiz karşıla.
- Somut isimleri atlama: `a herd of deer`, `a kilo of rice` gibi doğal kullanımlar ver. Aynı anlamı gereksiz benzer örneklerle çoğaltma.
- İsim, fiil, sıfat ve çekimli biçimleri doğru ayır. Seyrek, teknik, eski veya argo bir kullanım gerekiyorsa Türkçe karşılıkta kısa bir kayıt belirt.
- Emin olunmayan anlamı örnekle örtmeye çalışma. Birincil sözlükten kontrol et; eski kaynakta hata varsa ayrı ve açık bir düzeltme kaydıyla çöz.
- Türkçe karakterleri koru; UTF-8 ve düz metin kullan. Yinelenen İngilizce ifadeleri kaldır.

## Örnek

| İngilizce | Türkçe |
| --- | --- |
| establish a company | şirket kurmak |
| establish a system | sistem oluşturmak |
| establish the cause | nedeni saptamak |
| establish the facts | gerçekleri ortaya koymak |
| establish that the claim is true | iddianın doğru olduğunu ortaya koymak |
| establish whether the plan works | planın işe yarayıp yaramadığını belirlemek |

## Kalıcı kaynak ve doğrulama

Güncel tüm-kelime koleksiyonu `tools/kalip-anlam-partileri/manifest.json` dosyasındaki paketlerdir. Her satır hedef kelimeyi, önceki kalıpları, beklenen anlamları, yeni EN/TR çiftlerini ve her çiftin kapsadığı anlam indekslerini taşır. İndeksler sıfırdan başlar; `[]`, kartın anlam satırlarında ayrıca bulunmayan yararlı bir kullanımı gösterir.

`tools/kalip_anlamlari.py`, koleksiyonu eski kaynakların ve `kart_icerik` düzeltmelerinin ardından uygular. `node tools/kalip-anlam-uygula.js --write`, mevcut üretilmiş kartlardaki kalıpları bu kaynaktan yeniler; `--check` yalnız doğrular. Gardlardan biri değiştiyse işlem durur; başka anlama sessizce kalıp bağlanmaz. Güncel koleksiyon tüm kelimeleri kapsamalıdır.

`kalip-paketle.py`, `kalip-dogrula.py` ve `tools/kaliplar.js` eski kaynak aktarımının parçalarıdır. Eski gardları korumak için geçmiş kaynak olarak tutulurlar; nihai kullanıcı içeriğini son koleksiyon belirler. Eski dosyada değişiklik tek başına yayına yansımaz. Kalıp sayısı hiçbir aşamada üçle sınırlandırılmamalıdır.
