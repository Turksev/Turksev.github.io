/* ============================================================
   Aile üyeleri — dönüştürücü girdisi (site bu dosyayı YÜKLEMEZ)

   Kelime ailelerini tamamlayan türevler ve ayrı izlenmesi gereken eş yazımlı
   telaffuz kartları. Bunlar Calisma_Listesi'nde ayrı kayıt olarak bulunmaz.

     sufficient ✓  sufficiently ✓  insufficient ✓
     suffice ✗     sufficiency ✗

   Buraya yalnız Zipf ≥ 2,5 eşiğini geçenler alınır, yani gerçekten
   kullanılan kelimeler. Eşiğin altındakiler (acceptableness, apparentness,
   childly gibi) sözlük artığıdır ve listeye girmez.

   Bu kelimeler 6. katmana (“Aile üyeleri”) düşer: kelime sayfasında
   isteğe bağlı, aile sayfasında her zaman görünür.

   Alanlar: tip, p (YDS öncelik puanı), tr, ex, exTr
   Çok anlamlı ayrı kartlarda tr/ex/exTr yerine anlamlar dizisi kullanılabilir.
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

"generator": {"tip":"isim","p":14.0,"tr":"i. jeneratör; üretici","ex":"A backup generator kept the intensive care unit running throughout the blackout.","exTr":"Yedek bir jeneratör, elektrik kesintisi boyunca yoğun bakım ünitesini çalışır tuttu."},

"universally": {"tip":"zarf","p":13.9,"tr":"z. evrensel olarak, herkesçe","ex":"The theory is now universally accepted among researchers in the field.","exTr":"Kuram artık alandaki araştırmacılar arasında evrensel olarak kabul görüyor."},

"generalize": {"tip":"fiil","p":13.7,"tr":"f. genelleme yapmak","ex":"It is risky to generalize from a study that examined only forty participants.","exTr":"Yalnızca kırk katılımcıyı inceleyen bir çalışmadan genelleme yapmak risklidir."},

"reliance": {"tip":"isim","p":13.7,"tr":"i. güvenme, bağımlılık","ex":"The country's heavy reliance on imported energy leaves it exposed to price shocks.","exTr":"Ülkenin ithal enerjiye ağır bağımlılığı, onu fiyat şoklarına açık bırakıyor."},

"demonstrator": {"tip":"isim","p":13.7,"tr":"i. gösterici; tanıtımcı","ex":"Thousands of demonstrators gathered outside parliament to protest the new law.","exTr":"Binlerce gösterici, yeni yasayı protesto etmek için parlamentonun önünde toplandı."},

"educator": {"tip":"isim","p":13.7,"tr":"i. eğitimci","ex":"Educators warn that reducing classroom hours will widen the gap between students.","exTr":"Eğitimciler, ders saatlerinin azaltılmasının öğrenciler arasındaki farkı büyüteceği konusunda uyarıyor."},

"restrictive": {"tip":"sıfat","p":13.7,"tr":"s. kısıtlayıcı, sınırlayıcı","ex":"The contract contained unusually restrictive clauses about working for competitors.","exTr":"Sözleşme, rakipler için çalışmaya dair alışılmadık ölçüde kısıtlayıcı maddeler içeriyordu."},

"presenter": {"tip":"isim","p":13.6,"tr":"i. sunucu","ex":"The presenter interrupted the broadcast to announce the election result.","exTr":"Sunucu, seçim sonucunu duyurmak için yayını kesti."},

"publicly": {"tip":"zarf","p":13.6,"tr":"z. açıkça, kamuoyu önünde","ex":"The minister publicly apologised for the delay in releasing the report.","exTr":"Bakan, raporun açıklanmasındaki gecikme için kamuoyu önünde özür diledi."},

"inventive": {"tip":"sıfat","p":13.6,"tr":"s. yaratıcı, buluşçu","ex":"Engineers found an inventive way to cool the building without air conditioning.","exTr":"Mühendisler, binayı klima olmadan serinletmenin yaratıcı bir yolunu buldu."},

"tension": {"tip":"isim","p":13.5,"tr":"i. gerginlik, gerilim","ex":"Tension between the two countries rose sharply after the border incident.","exTr":"Sınır olayının ardından iki ülke arasındaki gerginlik keskin biçimde arttı."},

"detector": {"tip":"isim","p":13.5,"tr":"i. dedektör, algılayıcı","ex":"A smoke detector on every floor is now required by the building regulations.","exTr":"Yapı yönetmeliği artık her katta bir duman dedektörü zorunlu kılıyor."},

"creator": {"tip":"isim","p":13.5,"tr":"i. yaratıcı, yapımcı","ex":"The creator of the series spent four years researching the historical period.","exTr":"Dizinin yaratıcısı, tarihsel dönemi araştırmak için dört yıl harcadı."},

"nationalist": {"tip":"isim, sıfat","p":13.4,"tr":"i./s. milliyetçi","ex":"Nationalist parties gained ground in several European elections that year.","exTr":"O yıl birçok Avrupa seçiminde milliyetçi partiler oy kazandı."},

"postal": {"tip":"sıfat","p":13.4,"tr":"s. posta ile ilgili","ex":"Rural areas still depend on the postal service for official documents.","exTr":"Kırsal bölgeler resmî belgeler için hâlâ posta hizmetine bağımlı."},

"organizational": {"tip":"sıfat","p":13.3,"tr":"s. örgütsel, kurumsal","ex":"The failure was organizational rather than technical: nobody knew who was responsible.","exTr":"Başarısızlık teknik değil kurumsaldı: kimin sorumlu olduğunu kimse bilmiyordu."},

"excessively": {"tip":"zarf","p":13.3,"tr":"z. aşırı derecede","ex":"The report was criticised for being excessively cautious in its conclusions.","exTr":"Rapor, sonuçlarında aşırı derecede temkinli olmakla eleştirildi."},

"tender": {"tip":"sıfat, isim, fiil","p":13.3,"tr":"s. yumuşak, hassas; i. ihale; f. teklif vermek","ex":"Three firms submitted a tender for the construction of the new bridge.","exTr":"Üç firma, yeni köprünün inşası için ihaleye teklif verdi."},

"governance": {"tip":"isim","p":13.2,"tr":"i. yönetişim, yönetim biçimi","ex":"Weak corporate governance allowed the losses to go unreported for two years.","exTr":"Zayıf kurumsal yönetişim, zararların iki yıl boyunca bildirilmemesine olanak tanıdı."},

"reasonably": {"tip":"zarf","p":13.1,"tr":"z. makul biçimde; oldukça","ex":"The forecast is reasonably accurate for the first three days but not beyond.","exTr":"Tahmin ilk üç gün için oldukça isabetli ama ötesinde değil."},

"ignorant": {"tip":"sıfat","p":13.1,"tr":"s. cahil; habersiz","ex":"Most passengers were entirely ignorant of the danger until the announcement came.","exTr":"Yolcuların çoğu, anons gelene kadar tehlikeden tamamen habersizdi."},

"equation": {"tip":"isim","p":13.1,"tr":"i. denklem; eşitleme","ex":"The equation predicts how quickly a population will grow under ideal conditions.","exTr":"Denklem, ideal koşullarda bir popülasyonun ne kadar hızlı büyüyeceğini öngörür."},

"emotionally": {"tip":"zarf","p":13.1,"tr":"z. duygusal olarak","ex":"Working in emergency medicine is emotionally demanding even for experienced staff.","exTr":"Acil tıpta çalışmak, deneyimli personel için bile duygusal olarak yıpratıcıdır."},

"nationality": {"tip":"isim","p":13.0,"tr":"i. uyruk, vatandaşlık","ex":"Applicants must state their nationality and the country where they were born.","exTr":"Başvuranlar uyruklarını ve doğdukları ülkeyi belirtmek zorundadır."},

"secretly": {"tip":"zarf","p":13.0,"tr":"z. gizlice","ex":"The documents had been secretly copied months before the investigation began.","exTr":"Belgeler, soruşturma başlamadan aylar önce gizlice kopyalanmıştı."},

"innovator": {"tip":"isim","p":13.0,"tr":"i. yenilikçi","ex":"She is remembered as an innovator who transformed how surgeons train.","exTr":"Cerrahların nasıl yetiştiğini dönüştüren bir yenilikçi olarak anılıyor."},

"continuation": {"tip":"isim","p":13.0,"tr":"i. devam, sürdürülme","ex":"The committee approved the continuation of the project for another three years.","exTr":"Komite, projenin üç yıl daha sürdürülmesini onayladı."},

"responsive": {"tip":"sıfat","p":13.0,"tr":"s. duyarlı, karşılık veren","ex":"The tumour proved responsive to the new drug within the first month.","exTr":"Tümörün ilk ay içinde yeni ilaca duyarlı olduğu görüldü."},

"perfection": {"tip":"isim","p":13.0,"tr":"i. mükemmellik, kusursuzluk","ex":"Waiting for perfection is the most common reason research never gets published.","exTr":"Mükemmelliği beklemek, araştırmaların hiç yayımlanmamasının en yaygın nedenidir."},

"financially": {"tip":"zarf","p":13.0,"tr":"z. mali açıdan","ex":"The scheme is financially viable only if enough households take part.","exTr":"Program, ancak yeterli sayıda hane katılırsa mali açıdan sürdürülebilir."},

"succession": {"tip":"isim","p":12.9,"tr":"i. ardıllık, art arda gelme; veraset","ex":"A succession of mild winters allowed the insect population to expand rapidly.","exTr":"Art arda gelen ılıman kışlar, böcek nüfusunun hızla artmasına olanak tanıdı."},


"motivation": {"tip":"isim","p":23.9,"tr":"i. motivasyon, güdülenme; harekete geçiren neden","ex":"A clear sense of progress can sustain students' motivation during a demanding language course.","exTr":"Açık bir ilerleme duygusu, zorlu bir dil kursu boyunca öğrencilerin motivasyonunu sürdürebilir."},

"mislead": {"tip":"fiil","p":14.9,"tr":"f. yanıltmak, yanlış yönlendirmek","ex":"A graph can mislead readers if its scale exaggerates a relatively small change.","exTr":"Bir grafik, ölçeği görece küçük bir değişimi abartırsa okuyucuları yanıltabilir."},

"inherit": {"tip":"fiil","p":14.5,"tr":"f. miras almak; kalıtsal olarak edinmek, devralmak","ex":"Children may inherit a genetic mutation without ever developing the disease associated with it.","exTr":"Çocuklar, ilişkili hastalığa hiç yakalanmadan genetik bir mutasyonu kalıtsal olarak edinebilir."},

"misunderstand": {"tip":"fiil","p":14.3,"tr":"f. yanlış anlamak, yanlış yorumlamak","ex":"Readers may misunderstand the conclusion if the distinction between correlation and causation is not made clear.","exTr":"Korelasyon ile nedensellik arasındaki ayrım açıklanmazsa okuyucular sonucu yanlış anlayabilir."},

"terrify": {"tip":"fiil","p":14.3,"tr":"f. dehşete düşürmek, çok korkutmak","ex":"Reports of rare side effects can terrify patients even when the actual risk is extremely low.","exTr":"Nadir yan etkilere ilişkin haberler, gerçek risk son derece düşük olsa bile hastaları dehşete düşürebilir."},

"obsess": {"tip":"fiil","p":14.2,"tr":"f. zihnini sürekli meşgul etmek, aklına takılmak","ex":"The possibility of finding life beneath the ice continued to obsess planetary scientists.","exTr":"Buzun altında yaşam bulma olasılığı, gezegen bilimcilerin zihnini sürekli meşgul etmeyi sürdürdü."},

"bathe": {"tip":"fiil, isim","p":14.0,"anlamlar":[
  {"tr":"f. yıkanmak, yüzmek; yıkamak","ex":"Villagers were advised not to bathe in the river until the source of the contamination was identified.","exTr":"Kirliliğin kaynağı belirlenene kadar köylülere nehirde yüzmemeleri tavsiye edildi."},
  {"tr":"i. yüzme, yıkanma","ex":"A brief bathe in cold water may feel refreshing, but it does not replace proper heat precautions.","exTr":"Soğuk suda kısa bir yüzme ferahlatıcı gelebilir, ancak sıcağa karşı uygun önlemlerin yerini tutmaz."}
]},

"contaminate": {"tip":"fiil","p":13.7,"tr":"f. kirletmek; zararlı madde veya mikropla bulaştırmak","ex":"Untreated industrial waste can contaminate groundwater used by communities many kilometres downstream.","exTr":"Arıtılmamış sanayi atıkları, kilometrelerce aşağıdaki toplulukların kullandığı yer altı suyunu kirletebilir."},

"disable": {"tip":"fiil","p":13.6,"tr":"f. devre dışı bırakmak; işlevsiz hâle getirmek","ex":"A single software error can disable the monitoring system without damaging any physical equipment.","exTr":"Tek bir yazılım hatası, hiçbir fiziksel donanıma zarar vermeden izleme sistemini devre dışı bırakabilir."},

"intrigue": {"tip":"fiil, isim","p":13.3,"anlamlar":[
  {"tr":"f. merakını uyandırmak, ilgisini çekmek","ex":"The ability of certain birds to navigate at night continues to intrigue researchers.","exTr":"Bazı kuşların gece yön bulma yeteneği araştırmacıların ilgisini çekmeye devam ediyor."},
  {"tr":"i. entrika, gizli plan","ex":"The historian found evidence of political intrigue behind the sudden removal of the minister.","exTr":"Tarihçi, bakanın aniden görevden alınmasının ardında siyasi entrikaya ilişkin kanıt buldu."}
]},

"populate": {"tip":"fiil","p":12.7,"tr":"f. yerleşmek, nüfuslandırmak; doldurmak","ex":"Archaeological evidence suggests that humans began to populate the island much earlier than previously believed.","exTr":"Arkeolojik kanıtlar, insanların adaya daha önce sanılandan çok daha erken yerleşmeye başladığını gösteriyor."},

"irritate": {"tip":"fiil","p":12.7,"tr":"f. tahriş etmek; rahatsız etmek, sinirlendirmek","ex":"Fine particles in polluted air can irritate the lungs and worsen existing respiratory conditions.","exTr":"Kirli havadaki ince parçacıklar akciğerleri tahriş edebilir ve mevcut solunum rahatsızlıklarını kötüleştirebilir."},

"tactic": {"tip":"isim","p":12.4,"tr":"i. taktik, belirli bir amaca yönelik yöntem","ex":"Presenting a temporary discount as a final offer is a common marketing tactic.","exTr":"Geçici bir indirimi son teklifmiş gibi sunmak yaygın bir pazarlama taktiğidir."},

"situate": {"tip":"fiil","p":12.2,"tr":"f. yerleştirmek, konumlandırmak","ex":"Urban planners often situate public facilities near transport hubs to make them easier to reach.","exTr":"Şehir plancıları, ulaşımı kolaylaştırmak için kamu tesislerini çoğu zaman ulaşım merkezlerinin yakınına konumlandırır."},

"nominate": {"tip":"fiil","p":12.2,"tr":"f. aday göstermek; bir göreve atamak","ex":"Each university may nominate two candidates for the international research fellowship.","exTr":"Her üniversite uluslararası araştırma bursu için iki aday gösterebilir."},

"endow": {"tip":"fiil","p":12.2,"tr":"f. bağışta bulunmak; donatmak, bahşetmek","ex":"The donation will endow the institute with a permanent fund for climate research.","exTr":"Bağış, enstitüye iklim araştırmaları için kalıcı bir fon sağlayacak."},

"centralize": {"tip":"fiil","p":12.2,"tr":"f. merkezileştirmek, tek merkezde toplamak","ex":"The reform sought to centralize medical records while allowing local clinics to retain clinical autonomy.","exTr":"Reform, yerel kliniklerin tıbbi özerkliğini korurken sağlık kayıtlarını tek merkezde toplamayı amaçladı."},

"dine": {"tip":"fiil","p":11.9,"tr":"f. yemek yemek, akşam yemeği yemek","ex":"People who regularly dine late at night may experience poorer sleep and impaired glucose control.","exTr":"Gece geç saatlerde düzenli olarak yemek yiyen kişiler daha kötü uyku ve bozulmuş glikoz kontrolü yaşayabilir."},

"carve": {"tip":"fiil","p":11.8,"tr":"f. oymak, yontmak; keserek biçim vermek","ex":"Over thousands of years, moving glaciers can carve deep valleys through solid rock.","exTr":"Hareket eden buzullar binlerce yıl içinde sert kayaları oyarak derin vadiler oluşturabilir."},

"deprive": {"tip":"fiil","p":11.3,"tr":"f. yoksun bırakmak, mahrum etmek","ex":"Prolonged sleep loss can deprive the brain of the time required to consolidate new memories.","exTr":"Uzun süreli uyku kaybı, beyni yeni anıları pekiştirmek için gereken zamandan yoksun bırakabilir."},

"saturate": {"tip":"fiil","p":11.1,"tr":"f. doyurmak; tamamen doldurmak, sırılsıklam etmek","ex":"Several days of heavy rainfall can saturate the soil and increase the likelihood of landslides.","exTr":"Günlerce süren şiddetli yağış toprağı suya doyurabilir ve heyelan olasılığını artırabilir."},

"categorise": {"tip":"fiil","p":11.0,"tr":"f. sınıflandırmak, kategorilere ayırmak","ex":"Researchers categorise the responses according to age, education and previous experience.","exTr":"Araştırmacılar yanıtları yaş, eğitim ve önceki deneyime göre sınıflandırır."},

"impoverish": {"tip":"fiil","p":10.7,"tr":"f. yoksullaştırmak; verimsizleştirmek, zayıflatmak","ex":"Repeated droughts can impoverish rural communities and exhaust soils already damaged by intensive farming.","exTr":"Tekrarlanan kuraklıklar kırsal toplulukları yoksullaştırabilir ve yoğun tarımın zaten zarar verdiği toprakları tüketebilir."},

"ensue": {"tip":"fiil","p":10.7,"tr":"f. ardından gelmek, sonuç olarak ortaya çıkmak","ex":"If vaccination rates fall sharply, new outbreaks may ensue even in regions where the disease was controlled.","exTr":"Aşılama oranları keskin biçimde düşerse hastalığın kontrol altına alındığı bölgelerde bile yeni salgınlar ortaya çıkabilir."},

"decorate": {"tip":"fiil","p":10.6,"tr":"f. süslemek, bezemek","ex":"Ancient communities used mineral pigments to decorate cave walls with images of animals and hunting scenes.","exTr":"Eski topluluklar mağara duvarlarını hayvan ve av sahneleriyle süslemek için mineral boyalar kullandı."},

"pollute": {"tip":"fiil","p":10.6,"tr":"f. kirletmek, çevreye zararlı madde yaymak","ex":"Agricultural runoff can pollute rivers with fertilisers that encourage excessive algae growth.","exTr":"Tarımsal yüzey akışı, aşırı yosun büyümesini teşvik eden gübrelerle nehirleri kirletebilir."},

"inflate": {"tip":"fiil","p":10.5,"tr":"f. şişirmek, şişmek; yapay biçimde artırmak","ex":"Selective reporting can inflate estimates of a treatment's effectiveness by excluding unsuccessful trials.","exTr":"Seçici raporlama, başarısız deneyleri dışarıda bırakarak bir tedavinin etkililiğine ilişkin tahminleri yapay biçimde artırabilir."},

"interconnect": {"tip":"fiil","p":10.2,"tr":"f. birbirine bağlamak, bağlantılı hâle getirmek","ex":"High-speed rail lines interconnect regional centres that once depended entirely on air travel.","exTr":"Yüksek hızlı demiryolu hatları, bir zamanlar bütünüyle hava ulaşımına bağımlı olan bölgesel merkezleri birbirine bağlar."},

"rowing": {"tip":"isim","p":9.8,"tr":"i. kürek çekme; kürek sporu","ex":"The Greeks brought the art of rowing to a level of perfection that has never been surpassed.","exTr":"Yunanlar kürek çekme sanatını daha önce hiç aşılmamış bir mükemmellik düzeyine taşıdı."}

};
