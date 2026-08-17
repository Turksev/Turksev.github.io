/* ============================================================
   Aile üyeleri — dönüştürücü girdisi (site bu dosyayı YÜKLEMEZ)

   Kelime ailelerini tamamlayan türevler. Bunlar Calisma_Listesi'nde yok,
   çünkü YDS öncelik puanları 15'in altında kalmış — çoğu 49 sınavın
   hiçbirinde geçmemiş. Ama aileyi eksik bırakıyorlar:

     sufficient ✓  sufficiently ✓  insufficient ✓
     suffice ✗     sufficiency ✗

   Buraya yalnız Zipf ≥ 2,5 eşiğini geçenler alınır, yani gerçekten
   kullanılan kelimeler. Eşiğin altındakiler (acceptableness, apparentness,
   childly gibi) sözlük artığıdır ve listeye girmez.

   Bu kelimeler 6. katmana (“Aile üyeleri”) düşer: kelime sayfasında
   isteğe bağlı, aile sayfasında her zaman görünür.

   Alanlar: tip, p (YDS öncelik puanı), tr, ex, exTr
   Eklemeden sonra: tools/listeyi-aktar.py ve tools/aile-cikar.py çalıştır.
   ============================================================ */

window.EK_AILE_UYELERI = {

"collector": {"tip":"isim","p":15.0,"tr":"i. koleksiyoncu; tahsildar","ex":"A private collector donated the entire manuscript archive to the national library.","exTr":"Özel bir koleksiyoncu, el yazması arşivinin tamamını ulusal kütüphaneye bağışladı."},

"specialize": {"tip":"fiil","p":14.9,"tr":"f. uzmanlaşmak, ihtisaslaşmak","ex":"The clinic decided to specialize in the treatment of rare genetic disorders.","exTr":"Klinik, nadir genetik bozuklukların tedavisinde uzmanlaşmaya karar verdi."},

"connector": {"tip":"isim","p":14.9,"tr":"i. bağlayıcı, konektör","ex":"A faulty connector was blamed for the sudden loss of power in the laboratory.","exTr":"Laboratuvardaki ani elektrik kesintisinin sorumlusu olarak arızalı bir konektör gösterildi."},

"notation": {"tip":"isim","p":14.9,"tr":"i. gösterim, notasyon; kayıt","ex":"Musicians across the world read the same notation despite speaking different languages.","exTr":"Dünyanın dört bir yanındaki müzisyenler, farklı diller konuşsalar da aynı notasyonu okur."},

"executive": {"tip":"isim, sıfat","p":14.9,"tr":"i. yönetici; s. yürütmeye ilişkin, icracı","ex":"The chief executive resigned after the company reported a third consecutive loss.","exTr":"Şirket üst üste üçüncü zararını açıkladıktan sonra genel müdür istifa etti."},

"unnecessarily": {"tip":"zarf","p":14.9,"tr":"z. gereksiz yere","ex":"The instructions were unnecessarily complicated for such a simple procedure.","exTr":"Talimatlar, bu kadar basit bir işlem için gereksiz yere karmaşıktı."},

"variance": {"tip":"isim","p":14.9,"tr":"i. farklılık, sapma; (istatistik) varyans","ex":"The variance between the two measurements was too large to ignore.","exTr":"İki ölçüm arasındaki fark, göz ardı edilemeyecek kadar büyüktü."},

"psychologically": {"tip":"zarf","p":14.8,"tr":"z. psikolojik olarak","ex":"Long periods of isolation can be psychologically damaging even for healthy adults.","exTr":"Uzun süreli yalıtım, sağlıklı yetişkinler için bile psikolojik olarak yıpratıcı olabilir."},

"supportive": {"tip":"sıfat","p":14.8,"tr":"s. destekleyici","ex":"Students perform better in a supportive environment where mistakes are treated as learning.","exTr":"Öğrenciler, hataların öğrenme sayıldığı destekleyici bir ortamda daha başarılı oluyor."},

"diversify": {"tip":"fiil","p":14.8,"tr":"f. çeşitlendirmek","ex":"The country is trying to diversify its economy to reduce dependence on oil exports.","exTr":"Ülke, petrol ihracatına bağımlılığını azaltmak için ekonomisini çeşitlendirmeye çalışıyor."},

"variability": {"tip":"isim","p":14.7,"tr":"i. değişkenlik","ex":"Genetic variability within a population increases its chances of surviving disease.","exTr":"Bir popülasyondaki genetik değişkenlik, hastalıktan sağ çıkma şansını artırır."},

"lovely": {"tip":"sıfat","p":14.7,"tr":"s. hoş, güzel, sevimli","ex":"They spent a lovely afternoon walking along the old harbour wall.","exTr":"Eski liman duvarı boyunca yürüyerek hoş bir öğleden sonra geçirdiler."},

"approximation": {"tip":"isim","p":14.6,"tr":"i. yaklaşık değer, yaklaşım","ex":"The figure is only a rough approximation, since exact records were never kept.","exTr":"Rakam yalnızca kaba bir yaklaşımdır, çünkü kesin kayıt hiçbir zaman tutulmamış."},

"continuously": {"tip":"zarf","p":14.6,"tr":"z. aralıksız, sürekli olarak","ex":"The station has been recording temperature continuously since 1887.","exTr":"İstasyon, 1887'den beri aralıksız olarak sıcaklık kaydı tutuyor."},

"governor": {"tip":"isim","p":14.6,"tr":"i. vali; yönetici","ex":"The governor declared a state of emergency hours before the storm made landfall.","exTr":"Vali, fırtına karaya ulaşmadan saatler önce olağanüstü hâl ilan etti."},

"appropriately": {"tip":"zarf","p":14.6,"tr":"z. uygun biçimde, yerinde","ex":"Visitors are expected to dress appropriately when entering places of worship.","exTr":"Ziyaretçilerin ibadet yerlerine girerken uygun biçimde giyinmesi beklenir."},

"beautifully": {"tip":"zarf","p":14.5,"tr":"z. güzelce, güzel biçimde","ex":"The manuscript is beautifully illustrated with gold leaf and coloured inks.","exTr":"El yazması, altın varak ve renkli mürekkeplerle güzel biçimde resmedilmiş."},

"coverage": {"tip":"isim","p":14.4,"tr":"i. kapsam; (medya) haber yapımı","ex":"Insurance coverage for flood damage remains unavailable in several coastal districts.","exTr":"Birkaç kıyı ilçesinde sel hasarına karşı sigorta kapsamı hâlâ bulunmuyor."},

"generalization": {"tip":"isim","p":14.4,"tr":"i. genelleme","ex":"Drawing a generalization from a single case is one of the commonest research errors.","exTr":"Tek bir vakadan genelleme yapmak, en yaygın araştırma hatalarından biridir."},

"predictable": {"tip":"sıfat","p":14.3,"tr":"s. öngörülebilir, tahmin edilebilir","ex":"Tides are predictable centuries in advance, unlike earthquakes or volcanic eruptions.","exTr":"Gelgitler, deprem ya da volkanik patlamaların aksine yüzyıllar öncesinden öngörülebilir."},

"constitutional": {"tip":"sıfat, isim","p":14.3,"tr":"s. anayasal; bünyesel","ex":"The court found the new surveillance law to be constitutional by a narrow majority.","exTr":"Mahkeme, yeni gözetim yasasını dar bir çoğunlukla anayasaya uygun buldu."},

"governmental": {"tip":"sıfat","p":14.3,"tr":"s. hükümete ait, devlete ilişkin","ex":"Several non-governmental organisations criticised the plan for ignoring local communities.","exTr":"Birkaç sivil toplum kuruluşu, planı yerel toplulukları göz ardı ettiği için eleştirdi."},

"corporation": {"tip":"isim","p":14.3,"tr":"i. şirket, kuruluş","ex":"A multinational corporation now owns nearly half of the country's fertile farmland.","exTr":"Çokuluslu bir şirket, artık ülkenin verimli tarım arazisinin neredeyse yarısına sahip."},

"personally": {"tip":"zarf","p":14.3,"tr":"z. şahsen, kişisel olarak","ex":"The minister personally inspected the damaged section of the railway line.","exTr":"Bakan, demiryolu hattının hasarlı bölümünü şahsen denetledi."},

"globally": {"tip":"zarf","p":14.3,"tr":"z. küresel olarak, dünya çapında","ex":"Plastic production has risen globally despite dozens of national restrictions.","exTr":"Onlarca ulusal kısıtlamaya rağmen plastik üretimi dünya çapında arttı."},

"enjoyment": {"tip":"isim","p":14.3,"tr":"i. keyif, zevk alma","ex":"Reading for enjoyment declines sharply among teenagers in most industrialised countries.","exTr":"Sanayileşmiş ülkelerin çoğunda gençler arasında keyif için okuma keskin biçimde azalıyor."},

"definitive": {"tip":"sıfat","p":14.2,"tr":"s. kesin, nihai; en yetkin","ex":"No definitive explanation for the mass extinction has yet been agreed upon.","exTr":"Kitlesel yok oluşa dair kesin bir açıklama üzerinde henüz uzlaşılmadı."},

"donate": {"tip":"fiil","p":14.2,"tr":"f. bağışlamak","ex":"Thousands of people donate blood during the winter months when supplies run low.","exTr":"Stoklar azaldığında kış aylarında binlerce insan kan bağışlar."},

"dependency": {"tip":"isim","p":14.1,"tr":"i. bağımlılık","ex":"Reducing the country's dependency on imported grain has become a strategic priority.","exTr":"Ülkenin ithal tahıla bağımlılığını azaltmak stratejik bir öncelik hâline geldi."},

"generator": {"tip":"isim","p":14.0,"tr":"i. jeneratör; üretici","ex":"A backup generator kept the intensive care unit running throughout the blackout.","exTr":"Yedek bir jeneratör, elektrik kesintisi boyunca yoğun bakım ünitesini çalışır tuttu."}

};
