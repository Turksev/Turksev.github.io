/* ============================================================
   Ek örnek cümleler — dönüştürücü girdisi (site bu dosyayı YÜKLEMEZ)

   Kaynak listede bazı kelimelerin iki türü tek anlam satırında birleşmiş
   ve tek örnek cümle verilmiş:

     photograph → "i. fotoğraf; f. fotoğrafını çekmek"
                  tek örnek, o da isim hâli

   Burada o kayıtlar anlamlarına ayrılır ve her türe kendi örnek cümlesi
   yazılır. Mevcut cümle, gerçekte hangi türü gösteriyorsa o anlama
   bağlanır — her zaman ilk anlam olmuyor (answer, influence, support ve
   world'de mevcut örnek ikinci anlamı gösteriyordu).

   Bir kelime buradaysa, listeden gelen anlamların YERİNE bunlar geçer.
   Değişiklikten sonra dönüştürücüyü yeniden çalıştır:
     "…/english claude/.venv/Scripts/python.exe" tools/listeyi-aktar.py

   Toplam 742 kelime bu durumda; parti parti yazılıyor.
   ============================================================ */

window.EK_ORNEKLER = {

"when": [
  {"tr":"e. -dığı zaman, -ince","ex":"Coral reefs begin to bleach when ocean temperatures remain elevated for several weeks.","exTr":"Mercan resifleri, okyanus sıcaklıkları birkaç hafta boyunca yüksek kaldığında ağarmaya başlar."},
  {"tr":"z. ne zaman","ex":"Researchers still cannot say exactly when the first humans reached the Americas.","exTr":"Araştırmacılar, ilk insanların Amerika kıtasına tam olarak ne zaman ulaştığını hâlâ söyleyemiyor."}
],

"world": [
  {"tr":"i. dünya","ex":"The invention of the printing press changed the world in ways its inventor never imagined.","exTr":"Matbaanın icadı, mucidinin hiç hayal etmediği biçimlerde dünyayı değiştirdi."},
  {"tr":"s. küresel","ex":"Renewable energy now accounts for a growing share of world electricity production each year.","exTr":"Yenilenebilir enerji, her yıl dünya elektrik üretiminde giderek artan bir paya sahip oluyor."}
],

"early": [
  {"tr":"s. erken","ex":"Doctors emphasize that early diagnosis significantly improves treatment outcomes for many cancers.","exTr":"Doktorlar, erken teşhisin birçok kanser türünde tedavi sonuçlarını önemli ölçüde iyileştirdiğini vurguluyor."},
  {"tr":"z. erkenden","ex":"The team set out early to reach the summit before the afternoon storms arrived.","exTr":"Ekip, öğleden sonraki fırtınalar gelmeden zirveye ulaşmak için erkenden yola çıktı."}
],

"adult": [
  {"tr":"i. yetişkin","ex":"Unlike children, most adults find it considerably harder to acquire a second language fluently.","exTr":"Çocukların aksine çoğu yetişkin, ikinci bir dili akıcı biçimde edinmeyi çok daha zor bulur."},
  {"tr":"s. yetişkin, ergin","ex":"An adult elephant consumes as much as one hundred and fifty kilograms of vegetation daily.","exTr":"Yetişkin bir fil, günde yüz elli kilograma varan bitki tüketir."}
],

"group": [
  {"tr":"i. grup, topluluk","ex":"Biologists divided the animals into two groups to compare the effects of the new diet.","exTr":"Biyologlar, yeni beslenme düzeninin etkilerini karşılaştırmak için hayvanları iki gruba ayırdı."},
  {"tr":"f. gruplandırmak","ex":"The librarian grouped the manuscripts by century to make the collection easier to search.","exTr":"Kütüphaneci, koleksiyonda arama yapmayı kolaylaştırmak için el yazmalarını yüzyıllara göre grupladı."}
],

"today": [
  {"tr":"z. bugün; günümüzde","ex":"Many devices we rely on today were originally developed for military or space research.","exTr":"Bugün güvenip kullandığımız birçok cihaz, aslında askerî ya da uzay araştırmaları için geliştirilmişti."},
  {"tr":"i. bugün","ex":"Today marks the fiftieth anniversary of the first successful heart transplant in the country.","exTr":"Bugün, ülkedeki ilk başarılı kalp naklinin ellinci yıl dönümü."}
],

"future": [
  {"tr":"i. gelecek","ex":"Decisions made about energy policy now will shape the future of the entire planet.","exTr":"Enerji politikasına ilişkin bugün alınan kararlar, tüm gezegenin geleceğini şekillendirecek."},
  {"tr":"s. gelecekteki","ex":"Future generations will judge us by how seriously we treated the climate crisis.","exTr":"Gelecek kuşaklar bizi, iklim krizini ne kadar ciddiye aldığımıza bakarak yargılayacak."}
],

"answer": [
  {"tr":"i. cevap, yanıt","ex":"Despite decades of research, the answer to this question remains frustratingly elusive.","exTr":"Onlarca yıllık araştırmaya rağmen bu sorunun cevabı can sıkıcı biçimde belirsizliğini koruyor."},
  {"tr":"f. cevaplamak, yanıtlamak","ex":"Scientists hope the new telescope will answer fundamental questions about the origin of the universe.","exTr":"Bilim insanları, yeni teleskobun evrenin kökenine dair temel soruları yanıtlayacağını umuyor."}
],

"easy": [
  {"tr": "s. kolay; rahat", "ex": "Thanks to online platforms, accessing academic journals has become remarkably easy for students worldwide.", "exTr": "Çevrimiçi platformlar sayesinde akademik dergilere erişmek, dünya genelindeki öğrenciler için son derece kolay hâle geldi."},
  {"tr": "z. (take it easy) ağırdan almak; kolayca", "ex": "The doctor told him to take it easy for a week until the swelling went down.", "exTr": "Doktor ona, şişlik inene kadar bir hafta ağırdan almasını söyledi."}
],

"influence": [
  {"tr":"i. etki, nüfuz","ex":"The influence of Arabic on medieval Spanish can still be heard in hundreds of everyday words.","exTr":"Arapçanın ortaçağ İspanyolcası üzerindeki etkisi, yüzlerce gündelik kelimede hâlâ duyulabilir."},
  {"tr":"f. etkilemek","ex":"Parental attitudes strongly influence children's eating habits and their relationship with food.","exTr":"Ebeveyn tutumları, çocukların yeme alışkanlıklarını ve yiyecekle ilişkilerini güçlü biçimde etkiler."}
],

"try": [
  {"tr":"f. denemek; çabalamak","ex":"Engineers will try several different materials before selecting the most durable one for the bridge.","exTr":"Mühendisler, köprü için en dayanıklı olanı seçmeden önce birkaç farklı malzemeyi deneyecek."},
  {"tr":"i. deneme","ex":"She solved the puzzle on her third try after two unsuccessful attempts.","exTr":"Bulmacayı, iki başarısız girişimin ardından üçüncü denemesinde çözdü."}
],

"each": [
  {"tr":"s. her (bir)","ex":"During the experiment, each participant received a different dose of the trial medication.","exTr":"Deney sırasında her katılımcıya, deneme ilacından farklı bir doz verildi."},
  {"tr":"z. her biri, tanesi","ex":"The tickets cost forty liras each, regardless of where you choose to sit.","exTr":"Biletler, nerede oturmayı seçtiğinize bakılmaksızın tanesi kırk lira."}
],

"support": [
  {"tr":"i. destek","ex":"The project went ahead only after it received financial support from three universities.","exTr":"Proje, ancak üç üniversiteden mali destek aldıktan sonra hayata geçti."},
  {"tr":"f. desteklemek","ex":"The latest findings strongly support the hypothesis that the climate is warming faster than expected.","exTr":"En son bulgular, iklimin beklenenden daha hızlı ısındığı hipotezini güçlü biçimde destekliyor."}
],

"offer": [
  {"tr":"f. sunmak, teklif etmek","ex":"Coastal wetlands offer natural protection against storms while supporting rich biological diversity.","exTr":"Kıyı sulak alanları, zengin biyolojik çeşitliliği desteklerken fırtınalara karşı doğal koruma da sunar."},
  {"tr":"i. teklif","ex":"After long negotiations, the company finally accepted the offer from its main competitor.","exTr":"Uzun müzakerelerin ardından şirket, ana rakibinden gelen teklifi sonunda kabul etti."}
],

"evidence": [
  {"tr":"i. kanıt, delil","ex":"Fossil evidence suggests that whales evolved from land-dwelling mammals millions of years ago.","exTr":"Fosil kanıtlar, balinaların milyonlarca yıl önce karada yaşayan memelilerden evrildiğini gösteriyor."},
  {"tr":"f. kanıtlamak, belli etmek","ex":"Her growing confidence was evidenced by the ease with which she addressed the audience.","exTr":"Artan özgüveni, dinleyicilere hitap ederkenki rahatlığından belli oluyordu."}
],

"risk": [
  {"tr":"i. risk, tehlike","ex":"Smoking significantly increases the risk of developing lung cancer and cardiovascular disease.","exTr":"Sigara içmek, akciğer kanserine ve kalp-damar hastalığına yakalanma riskini önemli ölçüde artırır."},
  {"tr":"f. riske atmak","ex":"Firefighters risk their lives every time they enter a burning building.","exTr":"İtfaiyeciler, yanan bir binaya her girdiklerinde hayatlarını tehlikeye atar."}
],

"team": [
  {"tr":"i. ekip, takım","ex":"An international team of archaeologists spent five years excavating the ancient harbor city.","exTr":"Uluslararası bir arkeolog ekibi, antik liman kentinin kazısına beş yıl harcadı."},
  {"tr":"f. ekip kurmak, güç birliği yapmak","ex":"Two rival laboratories teamed up to sequence the virus far more quickly.","exTr":"İki rakip laboratuvar, virüsün dizilimini çok daha hızlı çıkarmak için güç birliği yaptı."}
],

"access": [
  {"tr":"i. erişim","ex":"Millions of rural households still lack reliable access to high-speed internet services.","exTr":"Milyonlarca kırsal hane, yüksek hızlı internet hizmetlerine güvenilir erişimden hâlâ yoksun."},
  {"tr":"f. erişmek, ulaşmak","ex":"Students can access the entire archive from any computer connected to the university network.","exTr":"Öğrenciler, üniversite ağına bağlı herhangi bir bilgisayardan arşivin tamamına erişebilir."}
],

"likely": [
  {"tr":"s. olası, muhtemel","ex":"Extreme weather events are likely to become more frequent as global temperatures rise.","exTr":"Küresel sıcaklıklar yükseldikçe aşırı hava olaylarının daha sık görülmesi muhtemel."},
  {"tr":"z. muhtemelen","ex":"The delay was most likely caused by a fault in the signalling system.","exTr":"Gecikmeye büyük olasılıkla sinyalizasyon sistemindeki bir arıza yol açtı."}
],

"structure": [
  {"tr":"i. yapı","ex":"Engineers examined the internal structure of the bridge after the earthquake damaged its supports.","exTr":"Deprem köprünün ayaklarına zarar verdikten sonra mühendisler köprünün iç yapısını inceledi."},
  {"tr":"f. yapılandırmak","ex":"The professor structured the course around four case studies rather than a single textbook.","exTr":"Profesör dersi, tek bir ders kitabı yerine dört vaka incelemesi etrafında yapılandırdı."}
],

"function": [
  {"tr":"i. işlev, fonksiyon","ex":"The primary function of red blood cells is to carry oxygen throughout the body.","exTr":"Kırmızı kan hücrelerinin temel işlevi, vücudun her yanına oksijen taşımaktır."},
  {"tr":"f. işlev görmek, çalışmak","ex":"The device continues to function normally even at temperatures well below freezing.","exTr":"Cihaz, donma noktasının çok altındaki sıcaklıklarda bile normal çalışmayı sürdürüyor."}
],

"source": [
  {"tr":"i. kaynak","ex":"Volcanic rock is an important source of information about the Earth's early history.","exTr":"Volkanik kayaçlar, Dünya'nın erken dönem tarihi hakkında önemli bir bilgi kaynağıdır."},
  {"tr":"f. temin etmek, tedarik etmek","ex":"The restaurant sources most of its vegetables from farms within fifty kilometers.","exTr":"Restoran, sebzelerinin çoğunu elli kilometre içindeki çiftliklerden temin ediyor."}
],

"thank": [
  {"tr":"f. teşekkür etmek","ex":"The mayor publicly thanked the volunteers who helped rebuild homes after the flood.","exTr":"Belediye başkanı, selden sonra evlerin yeniden inşasına yardım eden gönüllülere kamuoyu önünde teşekkür etti."},
  {"tr":"i. (thanks) teşekkür","ex":"The letter ended with warm thanks to everyone who had supported the campaign.","exTr":"Mektup, kampanyayı destekleyen herkese içten teşekkürlerle son buldu."}
],

"enough": [
  {"tr":"s. yeterli","ex":"Many developing regions still cannot produce enough food to feed their growing populations.","exTr":"Gelişmekte olan birçok bölge, büyüyen nüfusunu besleyecek kadar gıdayı hâlâ üretemiyor."},
  {"tr":"z. yeterince","ex":"The rope was not strong enough to hold the weight of two climbers.","exTr":"Halat, iki tırmanıcının ağırlığını taşıyacak kadar sağlam değildi."}
],

"under": [
  {"tr":"e. altında; -den az","ex":"Nearly a quarter of the world's population lives under conditions of severe water stress.","exTr":"Dünya nüfusunun neredeyse dörtte biri, ciddi su sıkıntısı koşulları altında yaşıyor."},
  {"tr":"z. aşağıda, su altında","ex":"The diver stayed under for almost three minutes before surfacing again.","exTr":"Dalgıç, yeniden yüzeye çıkmadan önce neredeyse üç dakika su altında kaldı."}
],

"away": [
  {"tr":"z. uzağa, uzakta","ex":"The nearest hospital is over a hundred kilometers away from the remote village.","exTr":"En yakın hastane, ücra köyden yüz kilometreden fazla uzaktadır."},
  {"tr":"s. uzaktaki; deplasmandaki","ex":"The away team was greeted by a hostile crowd of nearly forty thousand supporters.","exTr":"Deplasman takımı, kırk bine yakın düşmanca bir taraftar kalabalığıyla karşılandı."}
],

"read": [
  {"tr":"f. okumak","ex":"Millions of people read news on their phones rather than in printed newspapers today.","exTr":"Günümüzde milyonlarca insan haberleri basılı gazetelerden değil telefonlarından okuyor."},
  {"tr":"i. okuma, okunacak metin","ex":"The report is a difficult read, but anyone concerned about the issue should attempt it.","exTr":"Rapor okunması zor bir metin ama konuya kafa yoran herkes denemeli."}
],

"south": [
  {"tr":"i. güney","ex":"Rainfall in the south of the country has declined steadily over the past two decades.","exTr":"Ülkenin güneyinde yağış, son yirmi yılda istikrarlı biçimde azaldı."},
  {"tr":"s. güneydeki","ex":"The south wall of the cathedral collapsed during the great earthquake of 1755.","exTr":"Katedralin güney duvarı, 1755'teki büyük depremde çöktü."},
  {"tr":"z. güneye doğru","ex":"Migratory birds travel thousands of kilometers south each autumn to escape the harsh winter.","exTr":"Göçmen kuşlar, sert kışlardan kaçınmak için her sonbaharda binlerce kilometre güneye uçar."}
],

"advantage": [
  {"tr":"i. avantaj, üstünlük","ex":"Early diagnosis gives doctors a significant advantage in treating aggressive forms of cancer.","exTr":"Erken teşhis, doktorlara agresif kanser türlerini tedavi etmede önemli bir avantaj sağlar."},
  {"tr":"f. yararına olmak","ex":"The new tax rules advantage large corporations at the expense of small businesses.","exTr":"Yeni vergi kuralları, küçük işletmeler pahasına büyük şirketlerin yararına işliyor."}
],

"necessary": [
  {"tr":"s. gerekli, zorunlu","ex":"Regulators determined that additional safety inspections were necessary before the bridge could reopen.","exTr":"Düzenleyici kurumlar, köprünün yeniden açılabilmesi için ek güvenlik denetimlerinin gerekli olduğuna karar verdi."},
  {"tr":"i. (the necessary) gereken şey","ex":"Give me a day and I will do the necessary to get the permit approved.","exTr":"Bana bir gün ver, iznin onaylanması için gerekeni yapayım."}
],

/* ---- 2. parti ---- */

"short": [
  {"tr":"s. kısa; yetersiz","ex":"The report was short but covered every essential point with remarkable clarity.","exTr":"Rapor kısaydı ama her temel noktayı dikkat çekici bir açıklıkla kapsıyordu."},
  {"tr":"z. aniden, birden","ex":"The driver stopped short when a deer suddenly crossed the mountain road.","exTr":"Bir geyik aniden dağ yoluna çıkınca sürücü birden durdu."},
  {"tr":"f. kısa devre yapmak","ex":"The wiring shorted during the storm and plunged the whole building into darkness.","exTr":"Kablolar fırtına sırasında kısa devre yaptı ve tüm binayı karanlığa gömdü."}
],

"half": [
  {"tr":"i. yarı, yarım","ex":"Nearly half of the coral reefs studied showed clear signs of bleaching caused by warmer waters.","exTr":"İncelenen mercan resiflerinin neredeyse yarısı, daha sıcak sulardan kaynaklanan ağarma belirtileri gösterdi."},
  {"tr":"s. yarım","ex":"A half portion is available for children under twelve at no extra charge.","exTr":"On iki yaşın altındaki çocuklar için ek ücret olmadan yarım porsiyon sunulmaktadır."},
  {"tr":"z. yarı yarıya, yarım","ex":"The fuel tank was still half full when the engine unexpectedly stopped.","exTr":"Motor beklenmedik biçimde durduğunda yakıt deposu hâlâ yarı yarıya doluydu."}
],

"size": [
  {"tr": "i. boyut, büyüklük, beden", "ex": "Researchers found that the size of a galaxy's central black hole correlates with its total mass.", "exTr": "Araştırmacılar, bir galaksinin merkezi kara deliğinin boyutunun galaksinin toplam kütlesiyle ilişkili olduğunu tespit etti."},
  {"tr": "f. boyutlandırmak, ölçüsünü belirlemek", "ex": "Engineers must size the beams correctly to support the full weight of the roof.", "exTr": "Kirişlerin çatının tüm ağırlığını taşıyabilmesi için mühendisler onları doğru boyutlandırmalıdır."}
],

"nothing": [
  {"tr":"i. hiçbir şey","ex":"Despite years of research, nothing has proven more effective than early diagnosis in treating cancer.","exTr":"Yıllarca süren araştırmalara rağmen, kanser tedavisinde erken teşhisten daha etkili hiçbir şey kanıtlanmadı."},
  {"tr":"z. hiç, hiçbir şekilde","ex":"The final version of the building looks nothing like the architect's original design.","exTr":"Binanın son hâli, mimarın özgün tasarımına hiç benzemiyor."}
],

"unlike": [
  {"tr":"e. -in aksine","ex":"Reptiles, unlike mammals, depend on external heat sources to regulate their body temperature.","exTr":"Sürüngenler, memelilerin aksine, vücut sıcaklıklarını düzenlemek için dış ısı kaynaklarına bağımlıdır."},
  {"tr":"s. farklı, benzemeyen","ex":"The two theories are not so unlike as their supporters usually claim.","exTr":"İki kuram, savunucularının genellikle iddia ettiği kadar birbirinden farklı değil."}
],

"daily": [
  {"tr":"s. günlük","ex":"Experts recommend thirty minutes of daily exercise to maintain cardiovascular health.","exTr":"Uzmanlar, kalp-damar sağlığını korumak için günlük otuz dakika egzersiz öneriyor."},
  {"tr":"z. her gün","ex":"The medication must be taken daily for at least six consecutive weeks.","exTr":"İlaç, en az altı hafta boyunca her gün alınmalıdır."},
  {"tr":"i. günlük gazete","ex":"The story appeared on the front page of every national daily the following morning.","exTr":"Haber, ertesi sabah bütün ulusal günlük gazetelerin birinci sayfasında yer aldı."}
],

"free": [
  {"tr":"s. özgür; ücretsiz; serbest","ex":"The city offers free public transport to reduce traffic congestion and air pollution.","exTr":"Şehir, trafik sıkışıklığını ve hava kirliliğini azaltmak için ücretsiz toplu taşıma sunuyor."},
  {"tr":"f. serbest bırakmak, kurtarmak","ex":"Rescuers worked for hours to free the driver trapped inside the wreckage.","exTr":"Kurtarma ekipleri, enkazın içinde sıkışan sürücüyü kurtarmak için saatlerce çalıştı."}
],


"wide": [
  {"tr":"s. geniş; yaygın","ex":"The new policy has attracted support from a wide range of political groups.","exTr":"Yeni politika, çok çeşitli siyasi gruplardan destek topladı."},
  {"tr":"z. ardına kadar, tamamen","ex":"She left the window wide open despite the freezing night air.","exTr":"Dondurucu gece havasına rağmen pencereyi ardına kadar açık bıraktı."}
],

"behind": [
  {"tr":"e. arkasında, gerisinde","ex":"Rural schools often fall behind urban ones in access to modern technology.","exTr":"Kırsal okullar, modern teknolojiye erişim konusunda çoğu zaman kentteki okulların gerisinde kalır."},
  {"tr":"z. geride","ex":"The rest of the group had fallen far behind by the time we reached the ridge.","exTr":"Sırta ulaştığımızda grubun geri kalanı epeyce geride kalmıştı."}
],

"fossil": [
  {"tr":"i. fosil","ex":"The museum acquired a rare fossil of a winged reptile discovered in the desert.","exTr":"Müze, çölde keşfedilen kanatlı bir sürüngene ait nadir bir fosil edindi."},
  {"tr":"s. fosil (yakıt)","ex":"Burning fossil fuels releases carbon dioxide, the main driver of global warming.","exTr":"Fosil yakıtların yakılması, küresel ısınmanın başlıca etkeni olan karbondioksiti açığa çıkarır."}
],

"standard": [
  {"tr":"i. standart, ölçüt","ex":"Living standards have risen sharply in many Asian countries since the 1980s.","exTr":"1980'lerden bu yana birçok Asya ülkesinde yaşam standartları keskin biçimde yükseldi."},
  {"tr":"s. standart, alışılmış","ex":"The laboratory follows the standard procedure for handling contaminated samples.","exTr":"Laboratuvar, kirlenmiş numunelerin işlenmesinde standart prosedürü izler."}
],

"white": [
  {"tr": "s. beyaz", "ex": "Coral reefs often turn white when ocean temperatures rise above a critical threshold.", "exTr": "Mercan resifleri, okyanus sıcaklıkları kritik bir eşiği aştığında genellikle beyaza döner."},
  {"tr": "i. beyaz renk", "ex": "The artist used almost no white in the entire painting, relying instead on pale greys.", "exTr": "Sanatçı, resmin tamamında neredeyse hiç beyaz kullanmadı; bunun yerine soluk grilere başvurdu."},
  {"tr": "f. (white out) beyazla kaplamak", "ex": "Heavy snow whited out the runway and all departures were suspended until morning.", "exTr": "Yoğun kar pisti bembeyaz kaplayınca bütün kalkışlar sabaha kadar durduruldu."}
],

"online": [
  {"tr":"s. çevrimiçi","ex":"The university launched an online library accessible to students in forty countries.","exTr":"Üniversite, kırk ülkedeki öğrencilerin erişebildiği çevrimiçi bir kütüphane açtı."},
  {"tr":"z. çevrimiçi olarak","ex":"More universities are now offering degree programs entirely online to reach international students.","exTr":"Daha fazla üniversite, uluslararası öğrencilere ulaşmak için artık tamamen çevrimiçi lisans programları sunuyor."}
],

"here": [
  {"tr":"z. burada, buraya","ex":"The fossils found here suggest that this region was once covered by a shallow sea.","exTr":"Burada bulunan fosiller, bu bölgenin bir zamanlar sığ bir denizle kaplı olduğunu gösteriyor."},
  {"tr":"i. burası","ex":"From here to the summit is another four hours of steep and exposed climbing.","exTr":"Burasıyla zirve arası, dört saatlik dik ve korunaksız bir tırmanış daha."}
],

"quick": [
  {"tr":"s. hızlı, çabuk","ex":"A quick response by emergency teams saved hundreds of lives after the powerful earthquake.","exTr":"Acil durum ekiplerinin hızlı müdahalesi, şiddetli depremin ardından yüzlerce hayat kurtardı."},
  {"tr":"z. çabuk (gayriresmî)","ex":"Come quick — the committee is finally announcing the results.","exTr":"Çabuk gel, komite nihayet sonuçları açıklıyor."}
],

"equivalent": [
  {"tr":"s. eşdeğer, denk","ex":"Walking briskly for an hour burns an amount of energy roughly equivalent to a light jog.","exTr":"Bir saat tempolu yürüyüş, hafif bir koşuya kabaca eşdeğer miktarda enerji yakar."},
  {"tr":"i. karşılık, eşdeğer","ex":"There is no exact Turkish equivalent for this English legal term.","exTr":"Bu İngilizce hukuk teriminin tam bir Türkçe karşılığı yok."}
],

"dark": [
  {"tr":"s. karanlık","ex":"Deep-sea creatures inhabit permanently dark waters where sunlight has never penetrated.","exTr":"Derin deniz canlıları, güneş ışığının hiçbir zaman ulaşmadığı sürekli karanlık sularda yaşar."},
  {"tr":"i. (the dark) karanlık","ex":"Many children are afraid of the dark until they are six or seven years old.","exTr":"Birçok çocuk, altı yedi yaşına gelene kadar karanlıktan korkar."}
],

"black": [
  {"tr":"s. siyah, kara","ex":"Astronomers detected radiation escaping from the edge of a distant black hole for the first time.","exTr":"Gökbilimciler, ilk kez uzak bir kara deliğin kenarından kaçan radyasyonu tespit etti."},
  {"tr":"i. siyah renk","ex":"She always wears black to formal academic ceremonies.","exTr":"Resmî akademik törenlere hep siyah giyer."}
],

"male": [
  {"tr":"s. erkek","ex":"Male lions are easily distinguished by the thick mane surrounding the head.","exTr":"Erkek aslanlar, başlarını çevreleyen kalın yeleyle kolayca ayırt edilir."},
  {"tr":"i. erkek (birey)","ex":"In many bird species, only the male develops brightly colored feathers during mating season.","exTr":"Birçok kuş türünde, çiftleşme mevsiminde yalnızca erkek birey parlak renkli tüyler geliştirir."}
],

"immune": [
  {"tr": "s. bağışık, muaf", "ex": "Vaccinated individuals are largely immune to the virus that caused last winter's outbreak.", "exTr": "Aşılanmış bireyler, geçen kışki salgına yol açan virüse karşı büyük ölçüde bağışıktır."}
],

"extreme": [
  {"tr":"s. aşırı, uç","ex":"Global warming has increased the frequency of extreme weather events around the world.","exTr":"Küresel ısınma, dünya genelinde aşırı hava olaylarının sıklığını artırdı."},
  {"tr":"i. uç nokta, aşırılık","ex":"Her opinions swing between the two extremes with no middle ground whatsoever.","exTr":"Görüşleri, hiçbir orta yol bırakmadan iki uç arasında gidip geliyor."}
],

"five": [
  {"tr":"s. beş","ex":"The human hand contains five fingers, each controlled by a complex network of tendons.","exTr":"İnsan eli, her biri karmaşık bir tendon ağıyla kontrol edilen beş parmaktan oluşur."},
  {"tr":"i. beş (sayısı)","ex":"The children were asked to write the number five clearly on the board.","exTr":"Çocuklardan tahtaya beş sayısını okunaklı biçimde yazmaları istendi."}
],

"liquid": [
  {"tr":"i. sıvı","ex":"Water is the only substance on Earth that naturally exists as a solid, liquid, and gas.","exTr":"Su, Dünya'da doğal olarak katı, sıvı ve gaz hâllerinde bulunan tek maddedir."},
  {"tr":"s. sıvı, akışkan","ex":"Liquid nitrogen is used to preserve biological samples at extremely low temperatures.","exTr":"Sıvı azot, biyolojik numuneleri çok düşük sıcaklıklarda saklamak için kullanılır."}
],

"electric": [
  {"tr":"s. elektrikli, elektrik","ex":"Sales of electric cars have risen sharply as battery prices continue to fall.","exTr":"Batarya fiyatları düşmeye devam ederken elektrikli otomobil satışları keskin biçimde arttı."},
  {"tr":"i. elektrikli taşıt","ex":"Half the city's bus fleet has already been replaced with electrics.","exTr":"Kentin otobüs filosunun yarısı çoktan elektriklilerle değiştirildi."}
],

"permanent": [
  {"tr":"s. kalıcı, daimi","ex":"Severe sunburn during childhood can cause permanent damage to the skin.","exTr":"Çocuklukta geçirilen şiddetli güneş yanığı, ciltte kalıcı hasara neden olabilir."},
  {"tr":"i. perma","ex":"She had a permanent done before the wedding and regretted it immediately.","exTr":"Düğünden önce perma yaptırdı ve hemen pişman oldu."}
],

"female": [
  {"tr":"s. dişi, kadınlara özgü","ex":"Female elephants remain with their birth herd for their entire lives.","exTr":"Dişi filler, yaşamları boyunca doğdukları sürüde kalır."},
  {"tr":"i. dişi","ex":"In many bird species, the female builds the nest while the male gathers food.","exTr":"Birçok kuş türünde, erkek yiyecek toplarken yuvayı dişi kurar."}
],

"incorporate": [
  {"tr":"f. dahil etmek, birleştirmek","ex":"Architects now incorporate energy-saving features into the design of most new buildings.","exTr":"Mimarlar artık çoğu yeni binanın tasarımına enerji tasarrufu sağlayan özellikler dahil ediyor."},
  {"tr":"s. birleşmiş, tüzel","ex":"The charter refers to the university as an incorporate body founded in 1451.","exTr":"Berat, üniversiteden 1451'de kurulmuş tüzel bir birlik olarak söz eder."}
],

"manufacture": [
  {"tr":"f. üretmek, imal etmek","ex":"Several companies now manufacture solar panels using cheaper and more efficient materials.","exTr":"Artık birçok şirket, daha ucuz ve daha verimli malzemeler kullanarak güneş paneli üretiyor."},
  {"tr":"i. üretim, imalat","ex":"The manufacture of semiconductors requires facilities of extraordinary cleanliness.","exTr":"Yarı iletken üretimi, olağanüstü temizlikte tesisler gerektirir."}
],

"sugar": [
  {"tr":"i. şeker","ex":"Excessive sugar consumption has been linked to obesity and type 2 diabetes worldwide.","exTr":"Aşırı şeker tüketimi, dünya genelinde obezite ve tip 2 diyabetle ilişkilendirilmiştir."},
  {"tr":"f. şeker katmak","ex":"He sugared his tea heavily despite his doctor's repeated warnings.","exTr":"Doktorunun tekrarlanan uyarılarına rağmen çayını bolca şekerledi."}
],

"temporary": [
  {"tr":"s. geçici","ex":"The government built temporary shelters for families displaced by the devastating floods.","exTr":"Hükümet, yıkıcı seller nedeniyle evlerinden olan aileler için geçici barınaklar inşa etti."},
  {"tr":"i. geçici işçi","ex":"The company hired forty temporaries to handle the seasonal rush.","exTr":"Şirket, mevsimlik yoğunluğu karşılamak için kırk geçici işçi aldı."}
],

"phase": [
  {"tr":"i. evre, aşama, safha","ex":"The clinical trial has now entered its final phase, involving over ten thousand volunteers.","exTr":"Klinik deney, on binden fazla gönüllüyü kapsayan son evresine girmiş bulunuyor."},
  {"tr":"f. aşamalı olarak uygulamak","ex":"The government will phase the new tax in over a period of three years.","exTr":"Hükümet yeni vergiyi üç yıllık bir süreye yayarak aşamalı olarak uygulayacak."}
],

"disadvantage": [
  {"tr":"i. dezavantaj, sakınca","ex":"The main disadvantage of solar power is its dependence on weather conditions.","exTr":"Güneş enerjisinin başlıca dezavantajı, hava koşullarına bağımlı olmasıdır."},
  {"tr":"f. zarara uğratmak","ex":"The rule change disadvantages smaller teams with limited budgets.","exTr":"Kural değişikliği, bütçesi kısıtlı küçük takımları zarara uğratıyor."}
],

"escape": [
  {"tr":"f. kaçmak, kurtulmak","ex":"Thousands of refugees managed to escape the conflict zone before the borders closed.","exTr":"Binlerce mülteci, sınırlar kapanmadan önce çatışma bölgesinden kaçmayı başardı."},
  {"tr":"i. kaçış, firar","ex":"Their escape from the besieged city took three nights of walking through the hills.","exTr":"Kuşatılmış kentten kaçışları, tepelerde yürüyerek geçen üç gece sürdü."}
],

"motor": [
  {"tr":"i. motor","ex":"The new electric motor converts almost all of its energy directly into motion.","exTr":"Yeni elektrik motoru, enerjisinin neredeyse tamamını doğrudan harekete dönüştürüyor."},
  {"tr":"s. motorlu; hareket ettiren","ex":"Motor vehicles account for a large share of urban air pollution.","exTr":"Motorlu taşıtlar, kentsel hava kirliliğinin büyük bir bölümünü oluşturuyor."},
  {"tr":"f. arabayla gitmek","ex":"They motored down the coast road, stopping at every village along the way.","exTr":"Sahil yolundan arabayla ilerlediler, yol boyunca her köyde durdular."}
],

"mouse": [
  {"tr":"i. fare","ex":"Laboratory studies on the house mouse have contributed enormously to modern genetics.","exTr":"Ev faresi üzerinde yapılan laboratuvar çalışmaları, modern genetiğe büyük katkılar sağlamıştır."},
  {"tr":"f. fare avlamak","ex":"The barn cat mouses all night and then sleeps through most of the day.","exTr":"Ahırdaki kedi bütün gece fare avlar, sonra günün çoğunu uyuyarak geçirir."}
],

"noise": [
  {"tr":"i. gürültü, ses","ex":"Constant traffic noise in large cities can lead to stress and sleep disorders.","exTr":"Büyük şehirlerdeki sürekli trafik gürültüsü, strese ve uyku bozukluklarına yol açabilir."},
  {"tr":"f. (noise about/abroad) yaymak, ortalığa duyurmak","ex":"Rumours of the merger were noised abroad long before any official statement appeared.","exTr":"Birleşme söylentileri, resmî bir açıklama çıkmadan çok önce ortalığa yayılmıştı."}
],

"mature": [
  {"tr":"s. olgun, yetişkin","ex":"Mature students often bring valuable work experience into the university classroom.","exTr":"Yetişkin öğrenciler, üniversite sınıfına çoğu zaman değerli iş deneyimi getirir."},
  {"tr":"f. olgunlaşmak","ex":"Some tree species take more than fifty years to fully mature in the wild.","exTr":"Bazı ağaç türlerinin doğal ortamda tamamen olgunlaşması elli yıldan fazla sürer."}
],

"lots": [
  {"tr":"i. çok miktar","ex":"Growing children need lots of sleep, balanced meals, and regular physical activity.","exTr":"Büyüme çağındaki çocukların bol uykuya, dengeli öğünlere ve düzenli fiziksel aktiviteye ihtiyacı vardır."},
  {"tr":"z. çok, epeyce (gayriresmî)","ex":"She feels lots better since she started sleeping eight hours a night.","exTr":"Gecede sekiz saat uyumaya başladığından beri kendini epeyce daha iyi hissediyor."}
],

"park": [
  {"tr":"i. park","ex":"The city converted an abandoned railway line into a long, narrow public park.","exTr":"Kent, terk edilmiş bir demiryolu hattını uzun ve dar bir kamu parkına dönüştürdü."},
  {"tr":"f. park etmek","ex":"Visitors are asked not to park their vehicles near the main entrance.","exTr":"Ziyaretçilerden araçlarını ana girişin yakınına park etmemeleri isteniyor."}
],

"peak": [
  {"tr":"i. zirve, doruk","ex":"The climbers reached the peak shortly after sunrise on the fourth day.","exTr":"Tırmanıcılar, dördüncü gün gün doğumundan kısa süre sonra zirveye ulaştı."},
  {"tr":"f. zirveye ulaşmak, doruğa çıkmak","ex":"Energy consumption tends to peak during the hottest hours of summer afternoons.","exTr":"Enerji tüketimi, yaz öğleden sonralarının en sıcak saatlerinde zirveye ulaşma eğilimindedir."}
],

"shop": [
  {"tr":"i. dükkân, mağaza","ex":"The corner shop has served the neighbourhood for more than sixty years.","exTr":"Köşedeki dükkân, mahalleye altmış yılı aşkın süredir hizmet veriyor."},
  {"tr":"f. alışveriş yapmak","ex":"More consumers now shop online rather than visiting a store in person.","exTr":"Artık daha fazla tüketici, bizzat bir mağazaya gitmek yerine internetten alışveriş yapıyor."}
],

"firm": [
  {"tr":"s. sağlam, kararlı","ex":"The government took a firm stance against any further delay in the negotiations.","exTr":"Hükümet, müzakerelerde daha fazla gecikmeye karşı kararlı bir tutum aldı."},
  {"tr":"i. firma, şirket","ex":"The pharmaceutical firm announced that it would lower the price of its medication.","exTr":"İlaç firması, ilacının fiyatını düşüreceğini açıkladı."}
],

"beneath": [
  {"tr":"e. altında, altına","ex":"Archaeologists discovered an ancient Roman settlement buried beneath the modern city center.","exTr":"Arkeologlar, modern şehir merkezinin altında gömülü antik bir Roma yerleşimi keşfetti."},
  {"tr":"z. altta, aşağıda","ex":"From the ridge we could see the whole valley spread out beneath.","exTr":"Sırttan, bütün vadinin aşağıda serildiğini görebiliyorduk."}
],

"court": [
  {"tr":"i. mahkeme; saray; (spor) kort","ex":"The court ruled that the company had violated environmental regulations for nearly a decade.","exTr":"Mahkeme, şirketin neredeyse on yıldır çevre düzenlemelerini ihlal ettiğine hükmetti."},
  {"tr":"f. gönlünü kazanmaya çalışmak, kur yapmak","ex":"The candidate spent months courting voters in the rural districts.","exTr":"Aday, kırsal ilçelerdeki seçmenlerin gönlünü kazanmak için aylarını harcadı."}
],

"gross": [
  {"tr":"s. brüt; kaba, iğrenç","ex":"The company reported a gross profit of nearly ten million dollars before taxes were deducted.","exTr":"Şirket, vergiler düşülmeden önce yaklaşık on milyon dolarlık brüt kâr bildirdi."},
  {"tr":"f. brüt hasılat elde etmek","ex":"The film grossed more than two hundred million dollars in its first month.","exTr":"Film, ilk ayında iki yüz milyon doların üzerinde hasılat elde etti."}
],

"innocent": [
  {"tr":"s. masum, suçsuz; saf","ex":"After a lengthy trial, the jury concluded that the defendant was completely innocent.","exTr":"Uzun süren bir yargılamanın ardından jüri, sanığın tamamen masum olduğu sonucuna vardı."},
  {"tr":"i. masum kişi","ex":"The bombing killed dozens of innocents who had no part in the conflict.","exTr":"Bombalama, çatışmayla hiçbir ilgisi olmayan onlarca masumun ölümüne yol açtı."}
],

"minimum": [
  {"tr":"s. asgari, en az","ex":"Factory workers are legally entitled to a minimum wage that reflects the cost of living.","exTr":"Fabrika işçileri, yaşam maliyetini yansıtan asgari bir ücrete yasal olarak hak kazanır."},
  {"tr":"i. asgari düzey, en az miktar","ex":"Costs must be kept to a minimum if the project is to remain viable.","exTr":"Projenin sürdürülebilir kalması için maliyetler asgaride tutulmalıdır."}
],

"parallel": [
  {"tr":"s. paralel, koşut","ex":"The two roads run parallel to each other for almost thirty kilometres.","exTr":"İki yol, neredeyse otuz kilometre boyunca birbirine paralel uzanır."},
  {"tr":"i. benzerlik, koşutluk","ex":"Historians often draw a parallel between the fall of ancient empires and modern political instability.","exTr":"Tarihçiler, antik imparatorlukların çöküşü ile modern siyasi istikrarsızlık arasında sık sık bir paralellik kurar."},
  {"tr":"f. benzemek, koşut olmak","ex":"Her academic career closely parallels that of her older sister.","exTr":"Akademik kariyeri, ablasınınkine yakından benzer."}
],

"bed": [
  {"tr":"i. yatak; (nehir/deniz) taban","ex":"Geologists examined the dry river bed to understand how the waterway had shifted over centuries.","exTr":"Jeologlar, su yolunun yüzyıllar içinde nasıl değiştiğini anlamak için kuru nehir yatağını inceledi."},
  {"tr":"f. yerleştirmek, oturtmak","ex":"The stones were bedded in mortar to keep the retaining wall stable.","exTr":"İstinat duvarının sağlam kalması için taşlar harca oturtuldu."}
],

"cease": [
  {"tr":"f. durmak, sona ermek, bırakmak","ex":"The factory was ordered to cease all operations until the safety violations were corrected.","exTr":"Fabrikaya, güvenlik ihlalleri giderilene kadar tüm faaliyetlerini durdurması emredildi."},
  {"tr":"i. (without cease) durma, ara verme","ex":"The shelling continued without cease for three days and nights.","exTr":"Bombardıman üç gün üç gece boyunca hiç durmadan sürdü."}
],

"custom": [
  {"tr":"i. gelenek, âdet","ex":"According to local custom, guests remove their shoes before entering someone's home.","exTr":"Yerel geleneğe göre konuklar, birinin evine girmeden önce ayakkabılarını çıkarır."},
  {"tr":"s. ısmarlama, özel yapım","ex":"The workshop builds custom furniture designed to fit unusually shaped rooms.","exTr":"Atölye, alışılmadık biçimli odalara uyacak şekilde tasarlanmış ısmarlama mobilya üretiyor."}
],

"dependent": [
  {"tr": "s. bağımlı, bağlı", "ex": "Economic growth in the small nation remains heavily dependent on tourism and agricultural exports.", "exTr": "Küçük ulustaki ekonomik büyüme, büyük ölçüde turizme ve tarımsal ihracata bağımlı olmaya devam ediyor."},
  {"tr": "i. bakmakla yükümlü olunan kişi", "ex": "Employees may add a spouse and up to three dependents to the health plan.", "exTr": "Çalışanlar, sağlık planına bir eşi ve bakmakla yükümlü oldukları en fazla üç kişiyi ekleyebilir."}
],

"fan": [
  {"tr":"i. hayran; yelpaze, vantilatör","ex":"The ceiling fan did little to relieve the heat in the crowded lecture hall.","exTr":"Tavan vantilatörü, kalabalık amfideki sıcaklığı gidermeye pek yaramadı."},
  {"tr":"f. yelpazelemek, körüklemek","ex":"Strong winds began to fan the wildfire, causing it to spread rapidly across the dry hillside.","exTr":"Güçlü rüzgârlar orman yangınını körüklemeye başlayarak kuru yamaç boyunca hızla yayılmasına neden oldu."}
],

"resident": [
  {"tr":"i. sakin, oturan kişi","ex":"Long-term residents of the valley have noticed a gradual shift in seasonal rainfall patterns.","exTr":"Vadinin uzun süredir sakinleri, mevsimsel yağış düzenlerinde kademeli bir değişim fark etti."},
  {"tr":"s. yerleşik, ikamet eden","ex":"The hospital employs a resident physician who lives on the premises.","exTr":"Hastane, tesiste ikamet eden yerleşik bir hekim çalıştırıyor."}
],

"segment": [
  {"tr":"i. kesim, bölüm, dilim","ex":"This segment of the population has been largely ignored by policymakers.","exTr":"Nüfusun bu kesimi, politika yapıcılar tarafından büyük ölçüde göz ardı edildi."},
  {"tr":"f. bölmek, ayırmak","ex":"Marketing teams often segment consumers into groups based on age, income, and purchasing habits.","exTr":"Pazarlama ekipleri, tüketicileri genellikle yaş, gelir ve satın alma alışkanlıklarına göre gruplara ayırır."}
],

"spray": [
  {"tr":"i. sprey, püskürtü; deniz serpintisi","ex":"A fine spray of seawater covered the windows of the coastal houses.","exTr":"İnce bir deniz suyu serpintisi, kıyı evlerinin pencerelerini kaplıyordu."},
  {"tr":"f. püskürtmek","ex":"Farmers began to spray a natural pesticide on the crops instead of chemical alternatives.","exTr":"Çiftçiler, kimyasal alternatifler yerine ürünlere doğal bir haşere ilacı püskürtmeye başladı."}
],

"ban": [
  {"tr":"i. yasak","ex":"Several countries have introduced a ban on single-use plastic bags to reduce ocean pollution.","exTr":"Birçok ülke, okyanus kirliliğini azaltmak amacıyla tek kullanımlık plastik torbalara yasak getirdi."},
  {"tr":"f. yasaklamak","ex":"Several cities have banned older diesel vehicles from the historic centre.","exTr":"Birkaç kent, eski dizel araçların tarihî merkeze girmesini yasakladı."}
],

"box": [
  {"tr":"i. kutu","ex":"Laboratory technicians carefully sealed each box containing samples before shipping them abroad.","exTr":"Laboratuvar teknisyenleri, örnekleri içeren her kutuyu yurt dışına göndermeden önce dikkatle mühürledi."},
  {"tr":"f. kutulamak; boks yapmak","ex":"He boxed as an amateur for six years before turning professional.","exTr":"Profesyonelliğe geçmeden önce altı yıl amatör olarak boks yaptı."}
],

"branch": [
  {"tr":"i. dal, kol; şube","ex":"Genetics is considered a branch of biology that examines how traits pass between generations.","exTr":"Genetik, özelliklerin nesiller arasında nasıl aktarıldığını inceleyen bir biyoloji dalı olarak kabul edilir."},
  {"tr":"f. dallanmak, kollara ayrılmak","ex":"The path branches just beyond the bridge; take the left fork for the waterfall.","exTr":"Patika köprünün hemen ötesinde ikiye ayrılıyor; şelale için soldaki kolu tut."}
],

"foster": [
  {"tr":"f. teşvik etmek, geliştirmek","ex":"Schools are increasingly designing group projects to foster teamwork among students.","exTr":"Okullar, öğrenciler arasında takım çalışmasını geliştirmek için giderek daha fazla grup projesi tasarlıyor."},
  {"tr":"s. koruyucu (aile)","ex":"The children were placed with a foster family while the case was being resolved.","exTr":"Dava çözüme kavuşturulurken çocuklar bir koruyucu aileye yerleştirildi."}
],

"stock": [
  {"tr":"i. stok, envanter; hisse senedi","ex":"The company increased its stock of raw materials in anticipation of rising global demand.","exTr":"Şirket, küresel talepteki artışı öngörerek hammadde stokunu artırdı."},
  {"tr":"s. basmakalıp, klişe","ex":"The politician gave a stock answer that satisfied nobody in the room.","exTr":"Politikacı, odadaki hiç kimseyi tatmin etmeyen basmakalıp bir cevap verdi."},
  {"tr":"f. stoklamak, bulundurmak","ex":"Pharmacies were told to stock extra vaccine ahead of the winter season.","exTr":"Eczanelere, kış mevsimi öncesinde fazladan aşı bulundurmaları söylendi."}
],

"breed": [
  {"tr":"i. tür, cins, ırk (hayvan)","ex":"This breed of sheep is unusually well suited to cold mountain pastures.","exTr":"Bu koyun cinsi, soğuk dağ meralarına alışılmadık ölçüde uygundur."},
  {"tr":"f. üretmek, yol açmak; üremek","ex":"Overcrowded living conditions can breed the rapid spread of infectious diseases.","exTr":"Aşırı kalabalık yaşam koşulları, bulaşıcı hastalıkların hızla yayılmasına yol açabilir."}
],

"compact": [
  {"tr":"s. kompakt, küçük ve pratik","ex":"Engineers designed a compact device capable of purifying water without an external power source.","exTr":"Mühendisler, harici bir güç kaynağı olmadan suyu arıtabilen kompakt bir cihaz tasarladı."},
  {"tr":"i. anlaşma, sözleşme","ex":"The two nations signed a compact limiting military activity in the disputed region.","exTr":"İki ulus, tartışmalı bölgedeki askerî faaliyeti sınırlayan bir anlaşma imzaladı."},
  {"tr":"f. sıkıştırmak","ex":"Heavy machinery had compacted the soil so severely that nothing would grow there.","exTr":"Ağır makineler toprağı öyle sıkıştırmıştı ki orada hiçbir şey yetişmiyordu."}
],

"cross": [
  {"tr":"f. karşıdan karşıya geçmek, kesişmek","ex":"Migrating birds cross vast oceans twice a year, guided partly by the Earth's magnetic field.","exTr":"Göçmen kuşlar, kısmen Dünya'nın manyetik alanıyla yönlenerek yılda iki kez geniş okyanusları geçer."},
  {"tr":"i. haç; çarpı","ex":"A stone cross marks the spot where the first pilgrims came ashore.","exTr":"Taştan bir haç, ilk hacıların karaya çıktığı yeri işaretliyor."},
  {"tr":"s. kızgın, ters","ex":"She was cross with me for forgetting the appointment a second time.","exTr":"Randevuyu ikinci kez unuttuğum için bana kızgındı."}
],

"organic": [
  {"tr":"s. organik","ex":"Sales of organic produce have risen steadily as consumers worry about pesticide exposure.","exTr":"Tüketiciler pestisit maruziyetinden endişe duydukça organik ürün satışları istikrarlı biçimde arttı."},
  {"tr":"i. organik ürün","ex":"Supermarkets now stock organics alongside conventionally grown vegetables.","exTr":"Süpermarketler artık organikleri geleneksel yöntemle yetiştirilen sebzelerin yanında bulunduruyor."}
],

"ruin": [
  {"tr":"i. yıkıntı, harabe; mahvolma","ex":"The ruins of the ancient theatre still stand on the hillside above the town.","exTr":"Antik tiyatronun kalıntıları hâlâ kasabanın üzerindeki yamaçta duruyor."},
  {"tr":"f. mahvetmek, harap etmek","ex":"A prolonged drought threatened to ruin the region's wheat harvest for the third year.","exTr":"Uzun süren bir kuraklık, bölgenin buğday hasadını üçüncü yıl da mahvetmekle tehdit etti."}
],

"dog": [
  {"tr":"i. köpek","ex":"Guide dogs undergo two years of training before being placed with an owner.","exTr":"Rehber köpekler, bir sahibe verilmeden önce iki yıllık eğitimden geçer."},
  {"tr":"f. peşini bırakmamak, musallat olmak","ex":"Persistent rumors continued to dog the senator throughout his final campaign.","exTr":"Israrlı söylentiler, senatörün son kampanyası boyunca peşini bırakmadı."}
],

"dominant": [
  {"tr":"s. baskın, egemen, hâkim","ex":"In many ecosystems, a single species can quickly become dominant if its predators disappear.","exTr":"Birçok ekosistemde, yırtıcıları ortadan kalkarsa tek bir tür hızla baskın hâle gelebilir."},
  {"tr":"i. (genetik) baskın gen","ex":"In this cross, brown eye colour behaves as the dominant.","exTr":"Bu çaprazlamada kahverengi göz rengi baskın olan olarak davranır."}
],

"edge": [
  {"tr":"i. kenar, kıyı; üstünlük","ex":"New battery technology could give electric car makers a significant edge over competitors.","exTr":"Yeni pil teknolojisi, elektrikli araç üreticilerine rakiplerine karşı önemli bir üstünlük sağlayabilir."},
  {"tr":"f. yavaşça ilerlemek","ex":"The climbers edged along the narrow ledge with their backs pressed to the rock.","exTr":"Tırmanıcılar, sırtları kayaya yaslı hâlde dar çıkıntı boyunca yavaşça ilerledi."}
],


"stream": [
  {"tr":"i. dere, akış","ex":"A small mountain stream supplies the entire village with drinking water.","exTr":"Küçük bir dağ deresi, tüm köyün içme suyunu sağlıyor."},
  {"tr":"f. akmak; (çevrimiçi) yayın yapmak","ex":"Melting glaciers now stream directly into the valley, raising water levels in the river below.","exTr":"Eriyen buzullar artık doğrudan vadiye akıyor ve aşağıdaki nehrin su seviyesini yükseltiyor."}
],

"thin": [
  {"tr": "s. ince, zayıf; seyrek", "ex": "At high altitudes, the thin air makes it significantly harder for the body to absorb oxygen.", "exTr": "Yüksek rakımlarda seyrek hava, vücudun oksijeni emmesini önemli ölçüde zorlaştırır."},
  {"tr": "f. inceltmek, seyreltmek", "ex": "Gardeners thin the seedlings so the strongest plants have room to grow.", "exTr": "Bahçıvanlar, en güçlü bitkilere yer kalsın diye fideleri seyreltir."}
],

"climb": [
  {"tr":"i. tırmanış, yokuş","ex":"The final climb to the monastery takes about ninety minutes on foot.","exTr":"Manastıra son tırmanış, yürüyerek yaklaşık doksan dakika sürüyor."},
  {"tr":"f. tırmanmak, çıkmak","ex":"Mountaineers must acclimatize gradually before attempting to climb peaks above five thousand meters.","exTr":"Dağcılar, beş bin metrenin üzerindeki zirvelere tırmanmayı denemeden önce kademeli olarak yüksekliğe alışmalıdır."}
],

"farming": [
  {"tr":"i. tarım, çiftçilik","ex":"Farming employs less than three per cent of the workforce in most rich countries.","exTr":"Zengin ülkelerin çoğunda tarım, işgücünün yüzde üçünden azını istihdam ediyor."},
  {"tr":"s. tarıma ait","ex":"Modern farming techniques have increased crop yields while reducing water consumption.","exTr":"Modern tarım teknikleri, su tüketimini azaltırken ürün verimini artırdı."}
],

"flavour": [
  {"tr":"i. tat, lezzet","ex":"Chefs often add local spices to enhance the natural flavour of the dish.","exTr":"Şefler, yemeğin doğal tadını artırmak için genellikle yerel baharatlar ekler."},
  {"tr":"f. tat katmak, lezzetlendirmek","ex":"The soup is flavoured with wild herbs gathered from the surrounding hills.","exTr":"Çorba, çevredeki tepelerden toplanan yabani otlarla lezzetlendiriliyor."}
],

"grasp": [
  {"tr":"i. kavrayış, hâkimiyet","ex":"A firm grasp of statistics is essential for anyone reading medical research.","exTr":"Tıbbi araştırma okuyan herkes için istatistiğe sağlam bir hâkimiyet şarttır."},
  {"tr":"f. kavramak, anlamak; sıkıca tutmak","ex":"Young children gradually grasp the concept of gravity through everyday physical experience.","exTr":"Küçük çocuklar, yer çekimi kavramını günlük fiziksel deneyimler yoluyla zamanla kavrar."}
],

"probe": [
  {"tr":"i. soruşturma; (uzay) sonda","ex":"NASA launched a new probe to examine the icy moons orbiting the outer planets.","exTr":"NASA, dış gezegenlerin etrafında dönen buzlu ayları incelemek için yeni bir uzay sondası fırlattı."},
  {"tr":"f. araştırmak, didiklemek","ex":"Journalists continued to probe the company's accounts long after the trial had ended.","exTr":"Gazeteciler, dava bittikten çok sonra bile şirketin hesaplarını araştırmayı sürdürdü."}
],

"proof": [
  {"tr":"i. kanıt, delil","ex":"Scientists finally found proof that the new particle behaves exactly as the theory predicted.","exTr":"Bilim insanları sonunda, yeni parçacığın kuramın öngördüğü gibi davrandığına dair kanıt buldu."},
  {"tr":"s. dayanıklı, geçirmez","ex":"The new coating makes the fabric completely proof against water and wind.","exTr":"Yeni kaplama, kumaşı suya ve rüzgâra tamamen dayanıklı kılıyor."},
  {"tr":"f. (metin) düzeltisini yapmak","ex":"The editor proofed the manuscript twice before sending it to the printer.","exTr":"Editör, el yazmasını matbaaya göndermeden önce iki kez düzeltisini yaptı."}
],

"third": [
  {"tr":"s. üçüncü","ex":"This is the third consecutive year of below-average rainfall in the region.","exTr":"Bu, bölgede ortalamanın altında yağışın görüldüğü art arda üçüncü yıl."},
  {"tr":"i. üçte bir","ex":"Nearly a third of the population in that region lacks reliable access to clean water.","exTr":"O bölgedeki nüfusun neredeyse üçte biri, güvenilir temiz suya erişimden yoksun."},
  {"tr":"z. üçüncü olarak","ex":"Third, the committee recommended a complete review of all safety procedures.","exTr":"Üçüncü olarak komite, bütün güvenlik prosedürlerinin baştan gözden geçirilmesini önerdi."}
],

"abuse": [
  {"tr":"i. istismar, kötüye kullanma","ex":"The new regulations aim to prevent the abuse of antibiotics in large-scale livestock farming.","exTr":"Yeni düzenlemeler, büyük ölçekli hayvancılıkta antibiyotiklerin kötüye kullanılmasını önlemeyi amaçlıyor."},
  {"tr":"f. kötüye kullanmak; kötü davranmak","ex":"Officials were accused of abusing their authority to award contracts to relatives.","exTr":"Yetkililer, akrabalarına ihale vermek için yetkilerini kötüye kullanmakla suçlandı."}
],

"boat": [
  {"tr":"i. tekne, kayık","ex":"Fishermen used a small wooden boat to reach the reef before modern engines existed.","exTr":"Balıkçılar, modern motorlar yokken resife ulaşmak için küçük ahşap bir tekne kullanırdı."},
  {"tr":"f. tekneyle gitmek","ex":"They boated down the river for three days, camping on the banks each night.","exTr":"Üç gün boyunca nehirde tekneyle ilerlediler, her gece kıyıda kamp kurdular."}
],

"bulk": [
  {"tr":"i. büyük kısım, çoğunluk; hacim","ex":"The bulk of the country's electricity still comes from coal-fired power plants.","exTr":"Ülkenin elektriğinin büyük kısmı hâlâ kömürle çalışan santrallerden geliyor."},
  {"tr":"f. iri görünmek, kabarmak","ex":"The mountain bulked large on the horizon as we approached the coast.","exTr":"Kıyıya yaklaştıkça dağ ufukta iri iri belirdi."}
],

"chicken": [
  {"tr":"i. tavuk","ex":"Rising grain prices have made chicken feed considerably more expensive for small farms.","exTr":"Yükselen tahıl fiyatları, küçük çiftlikler için tavuk yemini önemli ölçüde pahalılaştırdı."},
  {"tr":"s. (günlük dil) korkak","ex":"He called me chicken for refusing to jump from the rock into the sea.","exTr":"Kayadan denize atlamayı reddettiğim için bana korkak dedi."}
],

"dish": [
  {"tr":"i. tabak; yemek","ex":"Local chefs turned a simple regional dish into a popular item on menus worldwide.","exTr":"Yerel şefler, basit bir yöresel yemeği dünya çapındaki menülerde popüler bir ürüne dönüştürdü."},
  {"tr":"f. dağıtmak, servis yapmak","ex":"Volunteers dished out hot meals to families queuing outside the shelter.","exTr":"Gönüllüler, barınağın önünde sıra bekleyen ailelere sıcak yemek dağıttı."}
],

"ride": [
  {"tr":"i. yolculuk, biniş","ex":"The ride from the airport to the city centre takes about forty minutes.","exTr":"Havalimanından şehir merkezine yolculuk yaklaşık kırk dakika sürüyor."},
  {"tr":"f. binmek (ata, bisiklete vb.)","ex":"Commuters increasingly ride bicycles to work as cities expand their bike lane networks.","exTr":"Şehirler bisiklet yolu ağlarını genişlettikçe, işe gidip gelenler giderek daha fazla bisiklete biniyor."}
],

"tape": [
  {"tr":"i. bant, şerit; kaset","ex":"Investigators reviewed hours of security tape to identify the vehicle involved in the accident.","exTr":"Soruşturmacılar, kazaya karışan aracı tespit etmek için saatlerce güvenlik kaydını inceledi."},
  {"tr":"f. bantla yapıştırmak; kayda almak","ex":"The interview was taped and later transcribed for the official record.","exTr":"Görüşme kayda alındı ve sonra resmî tutanak için deşifre edildi."}
],

/* 6. katmandan gelen çok türlü üye */
"tender": [
  {"tr":"s. yumuşak; hassas, şefkatli","ex":"The meat becomes tender only after several hours of slow cooking.","exTr":"Et, ancak birkaç saat ağır ateşte piştikten sonra yumuşuyor."},
  {"tr":"i. ihale, teklif","ex":"Three firms submitted a tender for the construction of the new bridge.","exTr":"Üç firma, yeni köprünün inşası için ihaleye teklif verdi."},
  {"tr":"f. (resmî olarak) sunmak, teklif vermek","ex":"She tendered her resignation the morning after the vote.","exTr":"Oylamanın ertesi sabahı istifasını sundu."}
],

/* ---------------------------------------------------------------- 5. parti */

"amino": [
  {"tr":"s. amino (–NH2 grubuna ait)","ex":"Every living cell depends on amino acids, which link together to form long, complex protein chains.","exTr":"Her canlı hücre, birbirine bağlanarak uzun ve karmaşık protein zincirleri oluşturan amino asitlere bağımlıdır."},
  {"tr":"i. (günl.) amino asit","ex":"Some athletes take aminos before training, though the evidence for their benefit remains thin.","exTr":"Bazı sporcular antrenman öncesinde amino asit alıyor, ancak yararına dair kanıtlar hâlâ zayıf."}
],


"score": [
  {"tr":"i. skor, puan","ex":"Researchers use a standardized score to compare cognitive performance across different age groups.","exTr":"Araştırmacılar, farklı yaş gruplarının bilişsel performansını karşılaştırmak için standartlaştırılmış bir puan kullanır."},
  {"tr":"f. puan kaydetmek, sayı yapmak","ex":"The team scored twice in the final ten minutes and salvaged a draw.","exTr":"Takım son on dakikada iki gol atarak beraberliği kurtardı."},
  {"tr":"f. (müzik) beste yazmak, müziğini yapmak","ex":"The composer was invited to score the documentary after his work on the earlier series.","exTr":"Besteci, önceki dizideki çalışmasının ardından belgeselin müziğini yapmaya davet edildi."}
],

"collective": [
  {"tr":"s. ortak, kolektif, toplu","ex":"Reducing plastic pollution requires the collective effort of governments, businesses, and individual consumers.","exTr":"Plastik kirliliğini azaltmak; hükûmetlerin, işletmelerin ve bireysel tüketicilerin ortak çabasını gerektirir."},
  {"tr":"i. kolektif, ortak girişim","ex":"The farmers formed a collective in order to negotiate better prices with distributors.","exTr":"Çiftçiler, dağıtımcılarla daha iyi fiyat pazarlığı yapabilmek için bir üretici kolektifi kurdu."}
],

"drain": [
  {"tr":"i. gider, drenaj borusu","ex":"A blocked drain caused water to accumulate in the basement for days.","exTr":"Tıkanan bir gider, bodrumda günlerce su birikmesine yol açtı."},
  {"tr":"f. boşaltmak, akıtmak; (seviyeyi) düşürmek","ex":"Prolonged drought can drain a reservoir's water level far below safe operating limits.","exTr":"Uzun süreli kuraklık, bir barajın su seviyesini güvenli işletme sınırlarının çok altına düşürebilir."},
  {"tr":"f. tüketmek, zayıflatmak (enerji, kaynak)","ex":"Constant night shifts drained the nurses of both energy and morale.","exTr":"Sürekli gece vardiyaları hemşirelerin hem enerjisini hem moralini tüketti."}
],

"hearing": [
  {"tr":"i. işitme, duyma","ex":"Prolonged exposure to loud machinery can permanently damage a worker's hearing.","exTr":"Gürültülü makinelere uzun süre maruz kalmak, bir işçinin işitme duyusuna kalıcı zarar verebilir."},
  {"tr":"i. duruşma, oturum (mahkeme, komisyon)","ex":"The committee scheduled a public hearing to gather testimony from affected residents.","exTr":"Komite, etkilenen sakinlerin ifadelerini almak için kamuya açık bir oturum düzenledi."},
  {"tr":"s. işiten, işitebilen","ex":"Deaf children educated alongside hearing peers often develop stronger social skills.","exTr":"İşiten akranlarıyla birlikte eğitim gören sağır çocuklar çoğu zaman daha güçlü sosyal beceriler geliştirir."}
],

"holiday": [
  {"tr":"i. tatil","ex":"Many families in the region travel abroad during the summer holiday season.","exTr":"Bölgedeki pek çok aile, yaz tatili döneminde yurt dışına seyahat ediyor."},
  {"tr":"i. bayram, resmî tatil günü","ex":"Banks remain closed on the national holiday, so transfers are processed the following day.","exTr":"Bankalar resmî tatilde kapalı olduğundan, havaleler ertesi gün işleme alınır."},
  {"tr":"f. tatil yapmak, tatile gitmek","ex":"Families who once holidayed abroad are now choosing destinations closer to home.","exTr":"Eskiden yurt dışında tatil yapan aileler, artık eve daha yakın yerleri tercih ediyor."}
],

"club": [
  {"tr":"i. kulüp, dernek","ex":"Students formed a science club to organize weekly experiments and lectures.","exTr":"Öğrenciler, haftalık deney ve konferanslar düzenlemek için bir bilim kulübü kurdu."},
  {"tr":"i. sopa, cop","ex":"Archaeologists unearthed a wooden club used by hunters thousands of years ago.","exTr":"Arkeologlar, binlerce yıl önce avcıların kullandığı ahşap bir sopayı gün yüzüne çıkardı."},
  {"tr":"f. sopayla vurmak, coplamak","ex":"Witnesses accused the guards of clubbing demonstrators who refused to disperse.","exTr":"Tanıklar, muhafızları dağılmayı reddeden göstericileri coplamakla suçladı."}
],

"defeat": [
  {"tr":"i. yenilgi, mağlubiyet","ex":"After weeks of relentless fighting, the general's forces suffered a crushing defeat.","exTr":"Haftalarca süren amansız çatışmaların ardından generalin kuvvetleri ağır bir yenilgiye uğradı."},
  {"tr":"f. yenmek, mağlup etmek; (tasarıyı) düşürmek","ex":"Opposition parties defeated the bill in parliament by a margin of seven votes.","exTr":"Muhalefet partileri, tasarıyı parlamentoda yedi oy farkla düşürdü."}
],

"gold": [
  {"tr":"i. altın","ex":"Prospectors discovered gold deposits in the riverbed during the nineteenth century.","exTr":"Arayıcılar, on dokuzuncu yüzyılda nehir yatağında altın yatakları keşfetti."},
  {"tr":"s. altından yapılmış; altın rengi","ex":"The museum displays a gold mask that once covered a pharaoh's face.","exTr":"Müze, bir zamanlar bir firavunun yüzünü örten altın bir maskeyi sergiliyor."}
],

"hawk": [
  {"tr":"i. şahin, atmaca","ex":"Ecologists tracked a rare hawk species across the mountains using satellite transmitters.","exTr":"Ekologlar, nadir bir şahin türünü uydu vericileri kullanarak dağlar boyunca izledi."},
  {"tr":"f. seyyar satıcılık yapmak, gezerek satmak","ex":"Vendors hawking souvenirs crowd the narrow streets around the temple every summer.","exTr":"Hediyelik eşya satan seyyar satıcılar her yaz tapınağın çevresindeki dar sokakları doldurur."}
],

"intermediate": [
  {"tr":"s. orta düzey, ara","ex":"Students must complete an intermediate course in statistics before enrolling in advanced research methods.","exTr":"Öğrenciler, ileri araştırma yöntemlerine kayıt olmadan önce orta düzey bir istatistik dersini tamamlamalıdır."},
  {"tr":"i. ara aşama, ara ürün","ex":"In this reaction, the unstable intermediate breaks down before it can be isolated.","exTr":"Bu tepkimede kararsız ara ürün, izole edilemeden parçalanır."}
],

"narrative": [
  {"tr":"i. anlatı, öykü","ex":"Historians often construct a single narrative that oversimplifies the complexity of past events.","exTr":"Tarihçiler çoğu zaman, geçmiş olayların karmaşıklığını aşırı basitleştiren tek bir anlatı kurar."},
  {"tr":"s. anlatısal, öyküleyici","ex":"The novel's narrative structure shifts between three different time periods.","exTr":"Romanın anlatı yapısı üç farklı zaman dilimi arasında gidip gelir."}
],

"shelter": [
  {"tr":"i. sığınak, barınak","ex":"Local volunteers built a temporary shelter for families displaced by the flood.","exTr":"Yerel gönüllüler, selden evsiz kalan aileler için geçici bir barınak inşa etti."},
  {"tr":"f. barındırmak, korumak; sığınmak","ex":"The cliffs shelter the harbour from the strongest winter storms.","exTr":"Kayalıklar, limanı en şiddetli kış fırtınalarından korur."}
],

"sight": [
  {"tr":"i. görme yetisi, görme duyusu","ex":"Regular screening can prevent the loss of sight in patients with diabetes.","exTr":"Düzenli tarama, diyabet hastalarında görme kaybını önleyebilir."},
  {"tr":"i. görüntü, manzara","ex":"The flooded streets were a distressing sight for residents returning home.","exTr":"Su altında kalan sokaklar, evlerine dönen sakinler için üzücü bir görüntüydü."},
  {"tr":"f. görmek, gözle görmek, fark etmek","ex":"The crew sighted land after eleven weeks at sea.","exTr":"Mürettebat, denizde geçen on bir haftanın ardından karayı gördü."}
],

"tie": [
  {"tr":"i. bağ, ilişki","ex":"Strong economic ties between the two nations helped prevent the conflict from escalating further.","exTr":"İki ülke arasındaki güçlü ekonomik bağlar, çatışmanın daha da tırmanmasını önlemeye yardımcı oldu."},
  {"tr":"i. kravat","ex":"Formal dress at the ceremony requires a dark suit and a plain tie.","exTr":"Törendeki resmî kıyafet kuralı koyu bir takım elbise ve sade bir kravat gerektiriyor."},
  {"tr":"i. beraberlik, berabere biten maç","ex":"The match ended in a tie, forcing both teams into a penalty shoot-out.","exTr":"Maç berabere bitti ve iki takımı penaltı atışlarına zorladı."},
  {"tr":"f. bağlamak; (be tied to) bağlı kılmak, kısıtlamak","ex":"Bonuses are tied to individual performance rather than to length of service.","exTr":"İkramiyeler, hizmet süresine değil bireysel performansa bağlanmıştır."}
],

"jump": [
  {"tr":"i. sıçrama, atlama; ani artış","ex":"Consumer prices saw a sudden jump after the government reduced fuel subsidies.","exTr":"Hükûmet yakıt sübvansiyonlarını azalttıktan sonra tüketici fiyatlarında ani bir sıçrama görüldü."},
  {"tr":"f. atlamak, sıçramak","ex":"Startled by the noise, the deer jumped over the fence and disappeared into the woods.","exTr":"Sesten ürken geyik, çitin üzerinden atlayıp ormanda kayboldu."}
],

"lunch": [
  {"tr":"i. öğle yemeği","ex":"Hospital staff often skip lunch entirely during particularly demanding shifts.","exTr":"Hastane personeli, özellikle yoğun vardiyalarda çoğu zaman öğle yemeğini tamamen atlıyor."},
  {"tr":"f. öğle yemeği yemek","ex":"The delegates lunched together before resuming negotiations in the afternoon.","exTr":"Delegeler, öğleden sonra müzakerelere yeniden başlamadan önce birlikte öğle yemeği yedi."}
],

"round": [
  {"tr":"s. yuvarlak","ex":"Ancient astronomers had already argued that the Earth was round.","exTr":"Antik dönem gökbilimcileri, Dünya'nın yuvarlak olduğunu çoktan öne sürmüştü."},
  {"tr":"i. tur, aşama, raunt","ex":"The negotiations entered a third round without producing any agreement.","exTr":"Müzakereler, herhangi bir anlaşma sağlanmadan üçüncü tura girdi."},
  {"tr":"z./e. (BrE) etrafında, çevresinde","ex":"The children sat round the fire and listened to the old stories.","exTr":"Çocuklar ateşin etrafında oturup eski hikâyeleri dinledi."},
  {"tr":"f. (sayıyı) yuvarlamak","ex":"Statisticians typically round large figures to the nearest thousand for easier comparison.","exTr":"İstatistikçiler, karşılaştırmayı kolaylaştırmak için büyük rakamları genellikle en yakın bine yuvarlar."}
],

"seat": [
  {"tr":"i. koltuk, oturma yeri","ex":"Passengers must remain in their seats until the aircraft comes to a complete stop.","exTr":"Yolcular, uçak tamamen durana kadar koltuklarında kalmalıdır."},
  {"tr":"i. (parlamentoda) sandalye, milletvekilliği","ex":"The governing party lost twelve seats in the general election.","exTr":"İktidar partisi, genel seçimde on iki sandalye kaybetti."},
  {"tr":"f. oturtmak; (kapasite olarak) almak","ex":"During major events, the newly built stadium can seat more than sixty thousand spectators.","exTr":"Büyük etkinliklerde, yeni yapılan stadyum altmış binden fazla seyirci alabiliyor."}
],

"superior": [
  {"tr":"s. üstün, daha iyi","ex":"In both strength and resistance to corrosion, the new alloy proved superior to steel.","exTr":"Yeni alaşım, hem dayanıklılık hem de korozyona direnç bakımından çelikten üstün çıktı."},
  {"tr":"i. üst, amir","ex":"Any complaint must first be reported to your immediate superior.","exTr":"Her şikâyet, öncelikle doğrudan bağlı olduğunuz amire bildirilmelidir."}
],

"yellow": [
  {"tr": "s. sarı", "ex": "The warning signs are printed in black on a bright yellow background.", "exTr": "Uyarı işaretleri, parlak sarı zemin üzerine siyahla basılmıştır."},
  {"tr": "f. sararmak", "ex": "Old newspapers stored in the archive had yellowed after decades of exposure to light.", "exTr": "Arşivde saklanan eski gazeteler, onlarca yıl ışığa maruz kaldıktan sonra sararmıştı."}
],

"ageing": [
  {"tr":"i. yaşlanma","ex":"Scientists still disagree about which biological processes actually drive ageing.","exTr":"Bilim insanları, yaşlanmayı asıl hangi biyolojik süreçlerin yönlendirdiği konusunda hâlâ görüş ayrılığı içinde."},
  {"tr":"s. yaşlanan, yaşlı","ex":"Public health systems in many countries are struggling to cope with a rapidly ageing population.","exTr":"Pek çok ülkedeki kamu sağlık sistemleri, hızla yaşlanan bir nüfusla baş etmekte zorlanıyor."}
],

"bubble": [
  {"tr":"i. kabarcık, baloncuk","ex":"Tiny bubbles of gas trapped in ancient ice reveal the composition of the atmosphere.","exTr":"Eski buz katmanlarında hapsolmuş minik gaz kabarcıkları, atmosferin bileşimini ortaya koyar."},
  {"tr":"i. (ekonomik) balon","ex":"Many economists warned that housing prices were forming a dangerous financial bubble before the crash.","exTr":"Pek çok iktisatçı, çöküşten önce konut fiyatlarının tehlikeli bir finansal balon oluşturduğu konusunda uyarmıştı."},
  {"tr":"f. kabarcık çıkarmak, fokurdamak","ex":"The mixture must bubble gently for twenty minutes before the heat is turned off.","exTr":"Karışım, ateş kapatılmadan önce yirmi dakika hafifçe fokurdamalıdır."}
],

"exhaust": [
  {"tr":"f. tüketmek, bitirmek","ex":"Continuous overfishing has begun to exhaust fish populations along the northern coastline.","exTr":"Sürekli aşırı avlanma, kuzey kıyısı boyunca balık popülasyonlarını tüketmeye başladı."},
  {"tr":"f. yormak, bitkin düşürmek","ex":"Three consecutive night shifts had exhausted the entire medical team.","exTr":"Üst üste üç gece vardiyası tüm sağlık ekibini bitkin düşürmüştü."},
  {"tr":"i. egzoz, egzoz gazı","ex":"Vehicle exhaust remains the main source of nitrogen dioxide in city centres.","exTr":"Araç egzozu, şehir merkezlerinde azot dioksitin başlıca kaynağı olmayı sürdürüyor."}
],

"tap": [
  {"tr":"i. musluk","ex":"Residents were advised not to drink tap water until the tests were complete.","exTr":"Sakinlere, testler tamamlanana kadar musluk suyu içmemeleri önerildi."},
  {"tr":"i. hafif vuruş, dokunuş","ex":"A gentle tap on the screen is enough to activate the sensor.","exTr":"Ekrana hafifçe bir dokunuş, sensörü etkinleştirmek için yeterlidir."},
  {"tr":"f. hafifçe vurmak, dokunmak","ex":"She tapped the microphone twice to check whether it was working.","exTr":"Mikrofonun çalışıp çalışmadığını anlamak için ona iki kez hafifçe vurdu."},
  {"tr":"f. (kaynağı) kullanmak, yararlanmak","ex":"Engineers are exploring new ways to tap geothermal energy beneath the region's volcanic plains.","exTr":"Mühendisler, bölgenin volkanik ovalarının altındaki jeotermal enerjiden yararlanmanın yeni yollarını araştırıyor."}
],

/* --- ipucu sızıntısı düzeltmeleri (tools/test-uretim/ipucu-birlestir.py) --- */

"athletic": [
  {"tr": "s. atletik, sportif", "ex": "Coaches insist that proper nutrition and consistent sleep contribute as much to athletic performance as demanding physical training does.", "exTr": "Antrenörler, uygun beslenmenin ve düzenli uykunun atletik performansa en az zorlu fiziksel antrenman kadar katkı sağladığında ısrar ediyor."}
],

"carbonate": [
  {"tr": "i. karbonat", "ex": "Calcium carbonate is one of the most common minerals found in limestone and marble.", "exTr": "Kalsiyum karbonat, kireçtaşı ve mermerde bulunan en yaygın minerallerden biridir."},
  {"tr": "f. karbonatlamak (gazlandırmak)", "ex": "Brewers deliberately carbonate their ale a second time in the bottle, which gives the finished beer its lively foam.", "exTr": "Bira üreticileri biralarını şişede bilerek ikinci kez gazlandırır; bu da bitmiş biraya canlı köpüğünü kazandırır."}
],

"computation": [
  {"tr": "i. hesaplama, hesap", "ex": "Weather forecasting requires an enormous amount of numerical computation, since each prediction depends on millions of atmospheric measurements.", "exTr": "Hava tahmini, her öngörü milyonlarca atmosferik ölçüme dayandığı için muazzam miktarda sayısal hesaplama gerektirir."}
],

"direction": [
  {"tr": "i. yön", "ex": "Migrating birds rely on the Earth's magnetic field to determine the correct direction to fly.", "exTr": "Göçmen kuşlar, uçacakları doğru yönü belirlemek için Dünya'nın manyetik alanına güvenir."},
  {"tr": "i. yönetim, idare", "ex": "The orchestra flourished under the direction of a conductor who encouraged young musicians to perform unfamiliar works.", "exTr": "Orkestra, genç müzisyenleri alışılmadık eserleri seslendirmeye teşvik eden bir şefin yönetimi altında gelişti."}
],

"driving": [
  {"tr": "i. araç kullanma, sürüş", "ex": "In many European countries, driving is prohibited for anyone under eighteen, since younger people lack sufficient experience behind the wheel.", "exTr": "Birçok Avrupa ülkesinde, gençler direksiyon başında yeterli deneyime sahip olmadığından on sekiz yaşın altındakiler için araç kullanma yasaktır."},
  {"tr": "s. itici, sürükleyici", "ex": "Rising fuel costs have become the driving force behind the shift toward electric vehicles.", "exTr": "Artan yakıt maliyetleri, elektrikli araçlara geçişin ardındaki itici güç hâline geldi."}
],

"edit": [
  {"tr": "f. düzenlemek, redakte etmek", "ex": "Journalists must carefully edit their articles to remove factual errors before publication.", "exTr": "Gazeteciler, yayımlanmadan önce olgusal hataları gidermek için yazılarını dikkatle düzenlemelidir."},
  {"tr": "f. kurgulamak", "ex": "Television crews must edit hours of raw interview material before the evening news program goes on air.", "exTr": "Televizyon ekipleri, akşam haber programı yayına girmeden önce saatlerce süren ham röportaj görüntülerini kurgulamak zorundadır."}
],

"elect": [
  {"tr": "f. seçmek", "ex": "Members of the academy gather every spring to elect a president who will represent them for three years.", "exTr": "Akademi üyeleri, kendilerini üç yıl boyunca temsil edecek bir başkan seçmek için her bahar bir araya gelir."},
  {"tr": "s. seçilmiş (henüz göreve başlamamış)", "ex": "Officials introduced the senator elect at a formal ceremony held before the inauguration.", "exTr": "Yetkililer, göreve başlama töreninden önce düzenlenen resmi bir seremonide seçilmiş senatörü tanıttı."}
],

"engine": [
  {"tr": "i. motor; makine", "ex": "The steam engine transformed nineteenth-century industry by allowing factories to operate far from rivers and waterfalls.", "exTr": "Buhar motoru, fabrikaların nehirlerden ve şelalelerden uzakta çalışmasına olanak tanıyarak on dokuzuncu yüzyıl sanayisini dönüştürdü."}
],

"equal": [
  {"tr": "s. eşit", "ex": "Ancient Greek geometers proved that the base angles of an isosceles triangle are always equal to each other.", "exTr": "Antik Yunan geometricileri, bir ikizkenar üçgenin taban açılarının her zaman birbirine eşit olduğunu kanıtladı."},
  {"tr": "f. eşit olmak, denk gelmek", "ex": "No amount of money can truly equal the joy of watching an endangered species return to the wild.", "exTr": "Hiçbir miktardaki para, nesli tükenmekte olan bir türün doğaya geri dönüşünü izlemenin sevincine gerçekten denk gelemez."}
],

"fantasy": [
  {"tr": "i. hayal, fantezi; f. hayal kurmak", "ex": "Psychologists argue that occasional fantasy about an ideal future helps adults endure the monotony of demanding office routines.", "exTr": "Psikologlar, ideal bir gelecek üzerine ara sıra kurulan hayalin, yetişkinlerin zorlu ofis rutinlerinin tekdüzeliğine katlanmasına yardımcı olduğunu savunuyor."}
],

"hack": [
  {"tr": "f. (bilgisayara) izinsiz girmek, hacklemek", "ex": "Researchers demonstrated that intruders could hack the control system of a modern car remotely and disable its brakes.", "exTr": "Araştırmacılar, saldırganların modern bir otomobilin kontrol sistemine uzaktan izinsiz girip frenlerini devre dışı bırakabileceğini gösterdi."},
  {"tr": "i. pratik çözüm, kestirme yöntem", "ex": "The blog post shared a simple hack for organizing daily tasks more efficiently.", "exTr": "Blog yazısı, günlük görevleri daha verimli düzenlemek için basit bir pratik çözüm paylaştı."}
],

"incorrect": [
  {"tr": "s. yanlış, hatalı", "ex": "Students lose points on the exam whenever an incorrect assumption leads them to a reasonable but invalid conclusion.", "exTr": "Öğrenciler, yanlış bir varsayım onları makul ama geçersiz bir sonuca götürdüğünde sınavda puan kaybeder."}
],

"infinite": [
  {"tr": "s. sonsuz", "ex": "Mathematicians have long debated whether the universe contains an infinite number of galaxies beyond observation.", "exTr": "Matematikçiler, evrenin gözlemin ötesinde sonsuz sayıda galaksi içerip içermediğini uzun süredir tartışıyor."},
  {"tr": "i. sonsuzluk", "ex": "Medieval theologians wrote about the infinite as something without limit or end, a quality they believed belonged to God alone.", "exTr": "Ortaçağ ilahiyatçıları sonsuzluğu, sınırı ya da sonu olmayan bir şey ve yalnızca Tanrı'ya ait olduğuna inandıkları bir nitelik olarak ele aldı."}
],

"interpretation": [
  {"tr": "i. yorum, yorumlama", "ex": "Different scholars offered conflicting interpretations of the ancient manuscript discovered in the cave.", "exTr": "Farklı akademisyenler, mağarada bulunan antik el yazmasına ilişkin çelişen yorumlar ortaya koydu."},
  {"tr": "i. sözlü çeviri", "ex": "Courts must provide consecutive interpretation for defendants who cannot follow the proceedings in the official language of the country.", "exTr": "Mahkemeler, ülkenin resmî dilinde yürütülen yargılamayı takip edemeyen sanıklar için ardıl sözlü çeviri sağlamak zorundadır."}
],

"invade": [
  {"tr": "f. istila etmek, işgal etmek", "ex": "Historians still debate why the Roman legions chose to invade Britain rather than consolidate their power in Gaul.", "exTr": "Tarihçiler, Roma lejyonlarının neden Galya'daki güçlerini pekiştirmek yerine Britanya'yı işgal etmeyi seçtiğini hâlâ tartışıyor."}
],

"knowing": [
  {"tr": "i. bilme, farkındalık", "ex": "Without our knowing, algorithms quietly shape the news and advertisements we encounter online.", "exTr": "Biz farkında olmadan algoritmalar, internette karşılaştığımız haberleri ve reklamları sessizce şekillendirir."},
  {"tr": "s. bilgili, bilinçli, anlamlı", "ex": "Experienced diplomats exchanged a knowing glance as the minister repeated promises that everyone in the room considered impossible.", "exTr": "Bakan, odadaki herkesin imkânsız gördüğü sözleri yinelerken deneyimli diplomatlar anlamlı bir bakış alışverişinde bulundu."}
],

"letter": [
  {"tr": "i. mektup", "ex": "Archivists discovered a handwritten letter describing the explorer's final days at sea.", "exTr": "Arşivciler, kâşifin denizdeki son günlerini anlatan el yazısıyla yazılmış bir mektup keşfetti."},
  {"tr": "i. harf", "ex": "In the Greek alphabet, the letter omega comes last, which is why the phrase alpha and omega means from beginning to end.", "exTr": "Yunan alfabesinde omega harfi en sonda gelir; bu yüzden alfa ve omega ifadesi baştan sona anlamına gelir."}
],

"lighter": [
  {"tr": "i. çakmak", "ex": "Airport security officers routinely confiscate any lighter found in hand luggage, since the fuel it contains may ignite inside a sealed cargo hold.", "exTr": "Havaalanı güvenlik görevlileri, içindeki yakıt kapalı bir kargo bölmesinde tutuşabileceği için el bagajında bulunan her çakmağa rutin olarak el koyar."}
],

"mediate": [
  {"tr": "f. arabuluculuk yapmak, aracılık etmek", "ex": "The United Nations agreed to mediate peace talks between the two warring nations.", "exTr": "Birleşmiş Milletler, savaşan iki ulus arasındaki barış görüşmelerine arabuluculuk yapmayı kabul etti."},
  {"tr": "s. dolaylı", "ex": "In classical logic, a mediate inference reaches its conclusion through an intervening premise rather than straight from a single observation.", "exTr": "Klasik mantıkta dolaylı bir çıkarım, sonucuna tek bir gözlemden doğrudan değil, araya giren bir öncül aracılığıyla ulaşır."}
],

"mine": [
  {"tr": "f. maden çıkarmak", "ex": "Several companies now hope to mine the ocean floor for metals used in electric vehicle batteries.", "exTr": "Birkaç şirket, elektrikli araç bataryalarında kullanılan metalleri okyanus tabanından çıkarmayı umuyor."},
  {"tr": "i. maden (ocağı)", "ex": "The old coal mine was closed decades ago after several safety violations were discovered.", "exTr": "Eski kömür madeni, birkaç güvenlik ihlali tespit edildikten sonra onlarca yıl önce kapatıldı."}
],

"nut": [
  {"tr": "i. kabuklu yemiş (fındık/ceviz vb.)", "ex": "Ecologists note that squirrels bury each nut they gather in autumn, and the forgotten ones eventually grow into new oak trees.", "exTr": "Ekologlar, sincapların sonbaharda topladıkları her kabuklu yemişi gömdüğünü ve unutulanların sonunda yeni meşe ağaçlarına dönüştüğünü belirtiyor."},
  {"tr": "i. somun (vida için)", "ex": "The mechanic tightened every nut and bolt on the bicycle frame before returning it to the customer.", "exTr": "Tamirci, bisikleti müşteriye geri vermeden önce çerçevedeki her somunu ve cıvatayı sıkılaştırdı."}
],

"organs": [
  {"tr": "i. organ(lar)", "ex": "Deep sea creatures possess specialized organs that produce light, allowing them to attract prey in complete darkness.", "exTr": "Derin deniz canlıları, ışık üreten özelleşmiş organlara sahiptir; bu da onların tam karanlıkta av çekmesini sağlar."},
  {"tr": "(müzik) org", "ex": "The cathedral is famous for its enormous pipe organs, which have been played for centuries.", "exTr": "Katedral, yüzyıllardır çalınan devasa borulu orgları ile ünlüdür."}
],

"part": [
  {"tr": "i. parça, bölüm, rol", "ex": "Regular exercise plays an important part in maintaining both physical and mental well-being.", "exTr": "Düzenli egzersiz, hem fiziksel hem de zihinsel iyi oluşu sürdürmede önemli bir rol oynar."},
  {"tr": "f. ayrılmak", "ex": "After thirty years of collaboration, the two composers agreed to part on friendly terms and pursue separate careers.", "exTr": "Otuz yıllık iş birliğinin ardından iki besteci, dostane biçimde ayrılmaya ve ayrı kariyerler sürdürmeye karar verdi."}
],

"pavement": [
  {"tr": "i. kaldırım", "ex": "City workers repaired the cracked pavement outside the old library over the weekend.", "exTr": "Belediye işçileri, hafta sonu eski kütüphanenin dışındaki çatlamış kaldırımı onardı."},
  {"tr": "i. yol kaplaması, asfalt (AmE)", "ex": "Heavy trucks slowly wear down the pavement of rural highways, forcing local authorities to fund expensive resurfacing every few years.", "exTr": "Ağır kamyonlar kırsal karayollarının yol kaplamasını yavaşça aşındırıyor ve yerel yönetimleri birkaç yılda bir pahalı yenileme çalışmalarına kaynak ayırmaya zorluyor."}
],

"pest": [
  {"tr": "i. haşere, zararlı böcek", "ex": "Museum conservators inspect storage rooms constantly, since a single pest such as a clothes moth can ruin centuries-old textiles.", "exTr": "Müze koruma uzmanları depoları sürekli denetler; çünkü elbise güvesi gibi tek bir haşere, yüzyıllık dokumaları mahvedebilir."},
  {"tr": "(mecazi) baş belası", "ex": "Her little brother could be quite a pest whenever she tried to study for exams.", "exTr": "Küçük kardeşi, sınavlara çalışmaya çalıştığında oldukça baş belası olabiliyordu."}
],

"photograph": [
  {"tr": "i. fotoğraf", "ex": "The first photograph of Earth taken from space changed how humanity viewed its home planet.", "exTr": "Uzaydan çekilen ilk Dünya fotoğrafı, insanlığın kendi gezegenine bakışını değiştirdi."},
  {"tr": "f. fotoğrafını çekmek", "ex": "Astronomers used a specially cooled camera to photograph the distant comet as it passed closest to the sun.", "exTr": "Gökbilimciler, uzaktaki kuyruklu yıldızın Güneş'e en çok yaklaştığı anda fotoğrafını çekmek için özel olarak soğutulmuş bir kamera kullandı."}
],

"plan": [
  {"tr": "i. plan, tasarı", "ex": "City officials unveiled a new plan to reduce traffic congestion through expanded public transportation networks.", "exTr": "Belediye yetkilileri, genişletilmiş toplu taşıma ağları yoluyla trafik sıkışıklığını azaltacak yeni bir plan açıkladı."},
  {"tr": "f. planlamak", "ex": "Expedition leaders must plan every stage of a polar journey carefully, since supplies cannot be delivered once the ice closes.", "exTr": "Sefer liderleri, buzlar kapandıktan sonra ikmal ulaştırılamayacağı için kutup yolculuğunun her aşamasını dikkatle planlamak zorundadır."}
],

"police": [
  {"tr": "f. denetlemek, kontrol altında tutmak", "ex": "International agencies find it difficult to police the open ocean, where illegal fishing vessels operate far from any coastline.", "exTr": "Uluslararası kurumlar, yasa dışı balıkçı teknelerinin herhangi bir kıyıdan uzakta faaliyet gösterdiği açık okyanusu denetlemekte zorlanıyor."},
  {"tr": "i. polis (teşkilatı)", "ex": "The police arrived within minutes after neighbors reported hearing loud noises from the apartment.", "exTr": "Komşuların daireden yüksek sesler duyduklarını bildirmesinin ardından polis dakikalar içinde geldi."}
],

"pop": [
  {"tr": "f. patlamak, pat diye ses çıkarmak", "ex": "Balloons began to pop loudly as the children's party grew more chaotic.", "exTr": "Çocukların partisi giderek daha kaotik hale gelirken balonlar yüksek sesle patlamaya başladı."},
  {"tr": "s. (pop music/culture) popüler", "ex": "Critics argue that pop music dominated the charts throughout the 1980s because synthesizers made catchy melodies cheap to produce.", "exTr": "Eleştirmenler, sentezleyiciler akılda kalıcı melodileri ucuza üretilebilir kıldığı için 1980'ler boyunca pop müziğin listelere hâkim olduğunu savunuyor."}
],

"prey": [
  {"tr": "i. av, kurban", "ex": "Owls hunt after dark, swooping silently down on unsuspecting prey that cannot hear their approaching wings.", "exTr": "Baykuşlar karanlık bastıktan sonra avlanır; yaklaşan kanatlarını duyamayan habersiz avın üzerine sessizce süzülür."},
  {"tr": "f. avlamak, yem etmek", "ex": "Certain wasps prey on caterpillars, paralyzing them with venom before carrying them back to their underground nests.", "exTr": "Bazı yaban arıları tırtılları avlar; onları zehirle felç ettikten sonra yer altındaki yuvalarına taşır."}
],

"printer": [
  {"tr": "i. yazıcı", "ex": "Every student in the dormitory shares a single wireless printer, which frequently runs out of ink before the examination period ends.", "exTr": "Yurtta kalan her öğrenci, sınav dönemi bitmeden sık sık mürekkebi tükenen tek bir kablosuz yazıcıyı paylaşıyor."},
  {"tr": "i. matbaacı", "ex": "The local printer agreed to produce a thousand copies of the historical society's new pamphlet by Friday.", "exTr": "Yerel matbaacı, tarih derneğinin yeni broşüründen Cuma gününe kadar bin kopya basmayı kabul etti."}
],

"real": [
  {"tr": "s. gerçek, hakiki", "ex": "Virtual experiments can never fully replace real laboratory work in science education.", "exTr": "Sanal deneyler, fen eğitiminde gerçek laboratuvar çalışmasının yerini asla tam anlamıyla tutamaz."},
  {"tr": "z. gerçekten (gayriresmî)", "ex": "Older farmers in the American South still describe a harvest as real impressive, using an adjective where standard grammar demands an adverb.", "exTr": "Amerikan Güneyi'ndeki yaşlı çiftçiler, standart dil bilgisinin zarf gerektirdiği yerde sıfat kullanarak bir hasadı hâlâ gerçekten etkileyici diye tanımlar."}
],

"run": [
  {"tr": "f. işletmek", "ex": "The cooperative continues to run a small dairy plant that supplies milk to schools in three neighbouring villages.", "exTr": "Kooperatif, üç komşu köydeki okullara süt sağlayan küçük bir süthaneyi işletmeyi sürdürüyor."},
  {"tr": "f. koşmak", "ex": "Antelopes can run at nearly ninety kilometers per hour, an ability that allows them to escape almost every predator on the savanna.", "exTr": "Antiloplar saatte neredeyse doksan kilometre hızla koşabilir; bu yetenek, savandaki hemen her yırtıcıdan kaçmalarını sağlar."}
],

"scholar": [
  {"tr": "i. bilim insanı, akademisyen", "ex": "Many scholars argue that the invention of printing fundamentally changed the spread of knowledge.", "exTr": "Birçok akademisyen, matbaanın icadının bilginin yayılmasını kökten değiştirdiğini savunur."},
  {"tr": "i. burslu öğrenci", "ex": "Each year the foundation selects one scholar from every participating country and covers all tuition and living costs for three years.", "exTr": "Vakıf her yıl katılımcı her ülkeden bir burslu öğrenci seçiyor ve üç yıl boyunca tüm öğrenim ve yaşam masraflarını karşılıyor."}
],

"stainless": [
  {"tr": "s. paslanmaz; lekesiz", "ex": "Surgical instruments are manufactured from stainless steel so that repeated sterilization at high temperatures never causes them to corrode.", "exTr": "Cerrahi aletler, yüksek sıcaklıkta tekrarlanan sterilizasyonun asla paslanmalarına yol açmaması için paslanmaz çelikten üretilir."}
],

"study": [
  {"tr": "i. çalışma, inceleme", "ex": "A recent study revealed that air pollution significantly affects children's cognitive development in urban areas.", "exTr": "Yakın tarihli bir çalışma, hava kirliliğinin kentsel alanlardaki çocukların bilişsel gelişimini önemli ölçüde etkilediğini ortaya koydu."},
  {"tr": "f. incelemek, öğrenim görmek", "ex": "Anyone who wishes to study medicine in Germany must first demonstrate an advanced command of the German language.", "exTr": "Almanya'da tıp öğrenimi görmek isteyen herkesin önce ileri düzeyde Almanca bildiğini kanıtlaması gerekir."}
],

"tense": [
  {"tr": "s. gergin", "ex": "Negotiations between the two nations remained tense throughout the lengthy peace conference.", "exTr": "İki ulus arasındaki müzakereler, uzun barış konferansı boyunca gergin kaldı."},
  {"tr": "i. (gramer) zaman kipi", "ex": "Latin verbs change their endings to show the future tense, whereas English relies on auxiliary words such as will.", "exTr": "Latince fiiller gelecek zaman kipini göstermek için eklerini değiştirirken, İngilizce will gibi yardımcı sözcüklere dayanır."}
],

"throw": [
  {"tr": "f. atmak, fırlatmak", "ex": "Archaeologists calculated how far ancient hunters could throw a spear using the recovered tools.", "exTr": "Arkeologlar, bulunan aletleri kullanarak antik avcıların bir mızrağı ne kadar uzağa fırlatabildiğini hesapladı."},
  {"tr": "i. atış", "ex": "Judges measured each throw twice, because a difference of a few centimeters could determine which competitor received the gold medal.", "exTr": "Hakemler her atışı iki kez ölçtü; çünkü birkaç santimetrelik fark, hangi yarışmacının altın madalya alacağını belirleyebilirdi."}
],

/* --- 25.08.2026 site denetimi: anlam/örnek/çeviri düzeltmeleri.
   meaning: örnek "meaningful" kullanıyordu (hedef kelime cümlede yoktu);
   snap: fiil anlamına isim örneği; arts: liberal arts "güzel sanatlar" değil;
   alarm/wild/growth/good/poster: çeviri düzeltmesi; tree: sözlükte olmayan
   "ağaçlandırmak" fiil anlamı atıldı; worse/ranging: örnek yenilendi;
   move/fail/bring: anlam metni netleşti. --- */
"good": [
  {"tr": "s. iyi", "ex": "Regular sleep has proven to be good for both mental clarity and long-term cardiovascular health.", "exTr": "Düzenli uykunun hem zihinsel netlik hem de uzun vadeli kalp sağlığı için iyi olduğu kanıtlanmıştır."},
  {"tr": "i. iyilik, fayda", "ex": "Volunteering for environmental cleanups can do a great deal of good for local ecosystems.", "exTr": "Çevre temizliği için gönüllü olmak, yerel ekosistemler için büyük fayda sağlayabilir."}
],
"bring": [
  {"tr": "f. getirmek", "ex": "Technological innovations often bring unexpected social changes that societies struggle to manage.", "exTr": "Teknolojik yenilikler, çoğu zaman toplumların yönetmekte zorlandığı beklenmedik toplumsal değişimler getirir."},
  {"tr": "f. (bring about) yol açmak, neden olmak", "ex": "The prolonged drought brought about severe food shortages across the entire region.", "exTr": "Uzun süren kuraklık, bütün bölgede ciddi gıda kıtlığına yol açtı."}
],
"move": [
  {"tr": "f. taşımak; (tarihi, planı) ertelemek, kaydırmak", "ex": "The committee's decision to move the funding deadline surprised several research teams.", "exTr": "Komitenin fon başvurusu son tarihini ertelemek yönündeki kararı, birçok araştırma ekibini şaşırttı."},
  {"tr": "i. hamle, adım", "ex": "Signing the new trade agreement was widely seen as a smart move by the government.", "exTr": "Yeni ticaret anlaşmasını imzalamak, hükümet tarafından atılmış akıllıca bir hamle olarak görüldü."}
],
"growth": [
  {"tr": "i. büyüme, artış", "ex": "Economists attribute the country's rapid economic growth to sustained investment in education and infrastructure.", "exTr": "Ekonomistler, ülkenin hızlı ekonomik büyümesini eğitim ve altyapıya yapılan sürekli yatırıma bağlıyor."},
  {"tr": "i. yeşillik, bitki örtüsü", "ex": "Thick growth covered the abandoned building's walls after several years of complete neglect.", "exTr": "Birkaç yıllık tam bir ihmalin ardından, terk edilmiş binanın duvarlarını yoğun bir yeşillik kapladı."}
],
"fail": [
  {"tr": "f. başarısız olmak; -ememek; (makine, organ) iflas etmek, arızalanmak", "ex": "Older water pipes frequently fail during periods of extreme temperature fluctuation.", "exTr": "Eski su boruları, aşırı sıcaklık dalgalanmaları dönemlerinde sıklıkla arızalanır."}
],
"tree": [
  {"tr": "i. ağaç", "ex": "Scientists discovered that a single mature tree can absorb around twenty kilograms of carbon dioxide each year.", "exTr": "Bilim insanları, olgun tek bir ağacın her yıl yaklaşık yirmi kilogram karbondioksit emebildiğini keşfetti."}
],
"wild": [
  {"tr": "s. vahşi, yabani", "ex": "A wild boar suddenly appeared on the road, forcing the driver to brake sharply.", "exTr": "Yolda aniden bir yaban domuzu belirdi ve sürücüyü sert fren yapmak zorunda bıraktı."},
  {"tr": "i. (the wild) doğa, yaban hayatı", "ex": "Animals raised in captivity often struggle to survive when released into the wild.", "exTr": "Esaret altında yetiştirilen hayvanlar, doğaya salındıklarında çoğu zaman hayatta kalmakta zorlanır."}
],
"meaning": [
  {"tr": "i. anlam", "ex": "Philosophers have long debated whether life has an inherent meaning independent of human belief.", "exTr": "Filozoflar, yaşamın insan inancından bağımsız içkin bir anlamı olup olmadığını uzun zamandır tartışır."},
  {"tr": "s. (a meaning look) anlamlı, imalı", "ex": "She cast the lawyer a meaning glance when the interviewer asked about the company's missing funds.", "exTr": "Görüşmeci şirketin kayıp fonlarını sorduğunda, avukata anlamlı bir bakış fırlattı."}
],
"worse": [
  {"tr": "s./z. daha kötü", "ex": "Air quality in the capital has grown considerably worse since the new factories began operating.", "exTr": "Başkentteki hava kalitesi, yeni fabrikalar faaliyete geçtiğinden beri önemli ölçüde kötüleşti."},
  {"tr": "i. daha kötü durum, kötüsü", "ex": "Critics argued that the reform was a change for the worse, leaving vulnerable families with even less protection.", "exTr": "Eleştirmenler, reformun daha kötüye gidiş olduğunu, korunmasız aileleri daha da az güvenceyle bıraktığını savundu."}
],
"ranging": [
  {"tr": "s. arasında değişen", "ex": "The survey included participants ranging in age from eighteen to sixty-five years old.", "exTr": "Anket, yaşları on sekiz ile altmış beş arasında değişen katılımcıları kapsıyordu."},
  {"tr": "s. serbestçe dolaşan, özgürce gezen", "ex": "Ecologists tracked wolves ranging across hundreds of kilometers in search of prey.", "exTr": "Ekologlar, av arayışıyla yüzlerce kilometre boyunca dolaşan kurtları izledi."}
],
"arts": [
  {"tr": "i. güzel sanatlar", "ex": "The gallery's new wing is devoted to the fine arts, with rooms for painting, sculpture, and printmaking.", "exTr": "Galerinin yeni kanadı güzel sanatlara ayrıldı; resim, heykel ve baskı odaları bulunuyor."},
  {"tr": "i. (the arts) sosyal/beşeri bilimler", "ex": "In many universities, funding for the arts has declined as more students choose degrees in science and technology.", "exTr": "Birçok üniversitede, daha fazla öğrenci fen ve teknoloji alanında diploma seçtikçe beşeri bilimlere ayrılan fonlar azaldı."}
],
"alarm": [
  {"tr": "i. alarm, tehlike işareti", "ex": "Environmentalists raised the alarm after tests revealed dangerously high pollution levels in the river.", "exTr": "Testler nehirde tehlikeli derecede yüksek kirlilik seviyeleri ortaya çıkarınca çevreciler alarm verdi."},
  {"tr": "f. korkutmak, tedirgin etmek", "ex": "The loud explosion in the factory alarmed nearby residents, who feared a gas leak.", "exTr": "Fabrikadaki yüksek patlama sesi, gaz kaçağından korkan yakın sakinleri tedirgin etti."}
],
"poster": [
  {"tr": "i. poster, afiş", "ex": "A brightly colored poster outside the museum announced a new exhibition on ancient Egyptian artifacts.", "exTr": "Müzenin dışındaki parlak renkli bir afiş, antik Mısır eserlerine dair yeni bir sergiyi duyuruyordu."},
  {"tr": "f. afiş asmak, ilan etmek", "ex": "Volunteers were asked to poster the neighborhood with flyers announcing the upcoming charity concert.", "exTr": "Gönüllülerden, yaklaşan hayır konserini duyuran afişlerle mahalleyi donatmaları istendi."}
],
"snap": [
  {"tr": "f. çıtırdamak, ansızın kırılmak", "ex": "The branch snapped loudly before falling onto the icy pavement below.", "exTr": "Dal, aşağıdaki buzlu kaldırıma düşmeden önce yüksek bir sesle ansızın kırıldı."},
  {"tr": "i. ani kırılma", "ex": "A sudden snap in the old rope caused the climbers to lose their balance momentarily.", "exTr": "Eski ipteki ani kırılma, tırmanıcıların bir anlığına dengesini kaybetmesine neden oldu."}
],

/* --- 26.08.2026 tam anlam taramasi, parti 1 (k1+k2): 71 bulgudan
   suzulen duzeltmeler. Silinen zayif/yanlis anlamlar: after "s. sonraki",
   using "kotuye kullanma", middle "f. ortalamak", sophisticate "f.",
   ethnic "i.", looking "i.". Gerisi ceviri/ornek/etiket duzeltmesi. --- */
"most": [
  {"tr": "s. çoğu, birçoğu", "ex": "Economists agree that most developing economies still depend heavily on agriculture for employment.", "exTr": "Ekonomistler, çoğu gelişmekte olan ekonominin istihdam açısından hâlâ büyük ölçüde tarıma bağımlı olduğu konusunda hemfikir."},
  {"tr": "s./z. en çok (üstünlük)", "ex": "Of all the renewable energy sources, solar power has attracted the most attention from investors in recent years.", "exTr": "Tüm yenilenebilir enerji kaynakları arasında, güneş enerjisi son yıllarda yatırımcılardan en çok ilgiyi çekmiştir."}
],
"find": [
  {"tr": "f. bulmak", "ex": "Marine biologists hope to find new evidence of coral resilience in the deeper reef systems.", "exTr": "Deniz biyologları, daha derin resif sistemlerinde mercan dayanıklılığına dair yeni kanıtlar bulmayı umuyor."},
  {"tr": "i. buluntu, keşif", "ex": "Archaeologists announced that they had made a remarkable find beneath the ruins of the ancient city.", "exTr": "Arkeologlar, antik kentin kalıntılarının altında dikkat çekici bir keşif yaptıklarını açıkladı."}
],
"human": [
  {"tr": "s. insani, insana ait", "ex": "Excessive human activity has significantly altered natural habitats across nearly every continent.", "exTr": "Aşırı insan faaliyeti, neredeyse her kıtadaki doğal habitatları önemli ölçüde değiştirmiştir."},
  {"tr": "i. insan", "ex": "Every human deserves equal access to clean water and basic sanitation, according to the United Nations.", "exTr": "Birleşmiş Milletler'e göre, her insan temiz suya ve temel sanitasyon (hijyen) koşullarına eşit erişimi hak eder."}
],
"after": [
  {"tr": "e. sonra, ardından", "ex": "Air quality improved noticeably after the city introduced stricter regulations on vehicle emissions.", "exTr": "Şehir, araç emisyonlarına yönelik daha sıkı düzenlemeler getirdikten sonra hava kalitesi belirgin şekilde iyileşti."}
],
"out": [
  {"tr": "z. dışarı", "ex": "Residents rushed out of the building as soon as the fire alarm sounded on the third floor.", "exTr": "Üçüncü katta yangın alarmı çalar çalmaz bina sakinleri dışarı koştu."},
  {"tr": "s. sönmüş, bitmiş", "ex": "By the time firefighters arrived, the small brush fire was already out.", "exTr": "İtfaiyeciler geldiğinde, küçük çalı yangını çoktan sönmüştü."}
],
"live": [
  {"tr": "f. yaşamak", "ex": "Nearly half of the world's population now lives in urban areas rather than in rural villages.", "exTr": "Dünya nüfusunun neredeyse yarısı artık kırsal köyler yerine kentsel alanlarda yaşıyor."},
  {"tr": "s./z. canlı (yayın), canlı olarak", "ex": "Millions of viewers watched the launch live as the rocket lifted off the ground.", "exTr": "Milyonlarca izleyici, roket yerden kalkarken fırlatmayı canlı olarak izledi."}
],
"result": [
  {"tr": "i. sonuç", "ex": "The final result of the experiment surprised even the lead researchers on the project.", "exTr": "Deneyin nihai sonucu, projedeki baş araştırmacıları bile şaşırttı."},
  {"tr": "f. sonuçlanmak", "ex": "Improved sanitation systems often result in a significant decline in infectious disease rates.", "exTr": "İyileştirilmiş sanitasyon sistemleri, genellikle bulaşıcı hastalık oranlarında önemli bir düşüşle sonuçlanır."}
],
"show": [
  {"tr": "f. göstermek", "ex": "Recent data show a steady decline in global poverty rates over the past thirty years.", "exTr": "Son veriler, son otuz yılda küresel yoksulluk oranlarında istikrarlı bir düşüş olduğunu gösteriyor."},
  {"tr": "i. gösteri, sergi, program", "ex": "The museum organized a new show featuring artifacts recovered from the sunken ship.", "exTr": "Müze, batık gemiden çıkarılan eserleri konu alan yeni bir sergi düzenledi."}
],
"state": [
  {"tr": "f. belirtmek, ifade etmek", "ex": "The report clearly states that emissions must fall sharply within the next decade.", "exTr": "Rapor, emisyonların önümüzdeki on yıl içinde keskin biçimde düşmesi gerektiğini açıkça belirtiyor."},
  {"tr": "i. devlet, eyalet; durum", "ex": "Each state in the country sets its own regulations regarding renewable energy incentives.", "exTr": "Ülkedeki her eyalet, yenilenebilir enerji teşvikleriyle ilgili kendi düzenlemelerini belirler."}
],
"given": [
  {"tr": "e. göz önüne alındığında", "ex": "The project seems feasible given the amount of funding allocated by the government this year.", "exTr": "Hükümetin bu yıl ayırdığı fon miktarı göz önüne alındığında proje uygulanabilir görünüyor."},
  {"tr": "s. belirli, verilen", "ex": "Researchers must record the exact temperature at a given moment during the reaction.", "exTr": "Araştırmacılar, tepkime sırasında belirli bir anda tam sıcaklığı kaydetmelidir."}
],
"due": [
  {"tr": "s. (due to) nedeniyle", "ex": "The flight was cancelled due to severe weather conditions across the entire region.", "exTr": "Uçuş, tüm bölgeyi etkileyen şiddetli hava koşulları nedeniyle iptal edildi."},
  {"tr": "s. vadesi gelmiş, beklenen", "ex": "The committee's decision is due next Friday, following weeks of internal deliberation.", "exTr": "Komitenin kararının, haftalarca süren iç görüşmelerin ardından önümüzdeki Cuma açıklanması bekleniyor."}
],
"day": [
  {"tr": "i. gün", "ex": "Researchers monitored the reactor for several days after the incident.", "exTr": "Araştırmacılar, olaydan sonra reaktörü birkaç gün boyunca izledi."},
  {"tr": "i. devir, parlak dönem", "ex": "In its day, the empire controlled trade routes stretching across half the known world.", "exTr": "Kendi devrinde imparatorluk, bilinen dünyanın yarısına uzanan ticaret yollarını denetliyordu."}
],
"fill": [
  {"tr": "f. dolmak", "ex": "Hospital wards began to fill rapidly as the number of flu cases increased across the region.", "exTr": "Bölgede grip vakalarının sayısı arttıkça hastane koğuşları hızla dolmaya başladı."},
  {"tr": "i. dolgu (malzemesi)", "ex": "The construction crew leveled the trench with gravel fill before pouring the concrete foundation.", "exTr": "İnşaat ekibi, beton temeli dökmeden önce hendeği çakıl dolguyla düzledi."}
],
"gain": [
  {"tr": "f. almak, kazanmak (kilo, ağırlık)", "ex": "Many patients gain significant weight after starting certain long-term hormone therapies.", "exTr": "Birçok hasta, belirli uzun süreli hormon tedavilerine başladıktan sonra ciddi kilo alır."},
  {"tr": "i. kazanç, artış", "ex": "The company reported a substantial gain in quarterly profits after cutting production costs.", "exTr": "Şirket, üretim maliyetlerini düşürdükten sonra üç aylık kârında önemli bir artış bildirdi."}
],
"using": [
  {"tr": "i. kullanma, kullanım", "ex": "Scientists warned that using outdated laboratory equipment could seriously compromise the accuracy of experimental results.", "exTr": "Bilim insanları, eski laboratuvar ekipmanı kullanmanın deneysel sonuçların doğruluğunu ciddi şekilde tehlikeye atabileceği konusunda uyardı."}
],
"fall": [
  {"tr": "i. sonbahar", "ex": "The research team plans to publish its findings in the fall, once the final data has been analyzed.", "exTr": "Araştırma ekibi, son verilerin analizi tamamlandıktan sonra bulgularını sonbaharda yayımlamayı planlıyor."},
  {"tr": "f. (due) vadesi gelmek", "ex": "Interest payments on the loan fall due at the beginning of every calendar quarter.", "exTr": "Kredi faiz ödemelerinin vadesi, her takvim çeyreğinin başında gelir."}
],
"sentence": [
  {"tr": "f. mahkûm etmek", "ex": "The judge sentenced the offender to community service instead of imprisonment.", "exTr": "Hâkim, suçluyu hapis yerine kamu hizmetine mahkûm etti."},
  {"tr": "i. cümle", "ex": "The professor asked students to identify the main clause in each complex sentence.", "exTr": "Profesör, öğrencilerden her birleşik cümledeki ana cümleyi bulmalarını istedi."}
],
"addition": [
  {"tr": "i. ekleme, ek; (in addition to) -in yanı sıra", "ex": "In addition to reducing costs, the new engine produces significantly fewer emissions.", "exTr": "Yeni motor, maliyetleri düşürmenin yanı sıra önemli ölçüde daha az emisyon üretiyor."},
  {"tr": "i. toplama (matematik)", "ex": "Basic addition and subtraction are typically taught before children learn multiplication.", "exTr": "Temel toplama ve çıkarma işlemleri genellikle çocuklar çarpmayı öğrenmeden önce öğretilir."}
],
"translation": [
  {"tr": "i. çeviri", "ex": "The novel's translation into twelve languages helped introduce the author to an international audience.", "exTr": "Romanın on iki dile çevrilmesi, yazarı uluslararası bir kitleyle tanıştırmaya yardımcı oldu."},
  {"tr": "i. (geometri) öteleme", "ex": "In geometry, a translation moves every point of a figure the same distance in the same direction.", "exTr": "Geometride öteleme, bir şeklin her noktasını aynı yönde aynı mesafe kadar hareket ettirir."}
],
"contrary": [
  {"tr": "e. (contrary to) -in aksine, -e aykırı", "ex": "Most volcanic eruptions occur beneath the ocean rather than on land, contrary to popular assumption.", "exTr": "Çoğu volkanik patlama, yaygın varsayımın aksine karada değil okyanusun altında meydana gelir."},
  {"tr": "s. karşıt, ters, zıt", "ex": "The evidence pointed to a contrary conclusion, undermining the original hypothesis.", "exTr": "Kanıtlar, özgün hipotezi zayıflatan zıt bir sonuca işaret ediyordu."}
],
"movement": [
  {"tr": "i. hareket", "ex": "The environmental movement gained considerable momentum after the documentary was released worldwide.", "exTr": "Çevre hareketi, belgesel dünya çapında yayınlandıktan sonra ciddi bir ivme kazandı."},
  {"tr": "i. (bowel movement) bağırsak hareketi", "ex": "The doctor asked the patient whether he had experienced any unusual bowel movement over the past week.", "exTr": "Doktor, hastaya geçen hafta boyunca olağandışı bir bağırsak hareketi yaşayıp yaşamadığını sordu."}
],
"skill": [
  {"tr": "i. beceri, yetenek", "ex": "Employers increasingly value critical thinking skills above formal academic qualifications.", "exTr": "İşverenler, resmi akademik niteliklerden daha çok eleştirel düşünme becerilerine değer veriyor."}
],
"bad": [
  {"tr": "s. kötü, fena", "ex": "Long-term exposure to pesticides can have a bad effect on soil microorganisms and crop yields.", "exTr": "Pestisitlere uzun süreli maruz kalmak, toprak mikroorganizmaları ve ürün verimi üzerinde kötü bir etkiye yol açabilir."},
  {"tr": "i. kötülük", "ex": "Ancient philosophers often debated whether it is possible to fully understand good without first understanding bad.", "exTr": "Antik filozoflar, önce kötülüğü anlamadan iyiliğin tam olarak anlaşılıp anlaşılamayacağını sıkça tartışmışlardır."}
],
"throughout": [
  {"tr": "z./e. baştan sona, boyunca, her yerinde", "ex": "Volunteers distributed clean drinking water throughout the flood-affected villages for nearly three weeks.", "exTr": "Gönüllüler, neredeyse üç hafta boyunca sel bölgesindeki köylerin her yerine temiz içme suyu dağıttı."}
],
"go-to": [
  {"tr": "s. gözde, ilk başvurulan", "ex": "For many epidemiologists, contact tracing remains the go-to method for containing infectious outbreaks.", "exTr": "Birçok epidemiyolog için temas takibi, bulaşıcı salgınları kontrol altına almanın gözde yöntemi olmayı sürdürüyor."}
],
"simply": [
  {"tr": "z. sadece, yalnızca", "ex": "Some ecosystems collapse not because of a single cause but simply because of accumulated stress over time.", "exTr": "Bazı ekosistemler tek bir nedenden dolayı değil, yalnızca zaman içinde biriken baskı yüzünden çöker."},
  {"tr": "z. basitçe, sade biçimde", "ex": "The mountain cabin is simply furnished, with a wooden table and two narrow beds.", "exTr": "Dağ kulübesi sade döşenmiştir; ahşap bir masa ve iki dar yatak vardır."}
],
"mainly": [
  {"tr": "z. başlıca, çoğunlukla", "ex": "The region's economy relies mainly on agriculture, with wheat and cotton as the dominant crops.", "exTr": "Bölgenin ekonomisi başlıca tarıma dayanır; egemen ürünler buğday ve pamuktur."}
],
"practice": [
  {"tr": "i. uygulama", "ex": "Recycling packaging materials has become standard practice across most large European manufacturing plants today.", "exTr": "Ambalaj malzemelerini geri dönüştürmek, günümüzde çoğu büyük Avrupa imalat tesisinde standart bir uygulama hâline gelmiştir."},
  {"tr": "f. uygulamak; (mesleği) icra etmek", "ex": "Doctors who practice in rural clinics often face a shortage of specialized medical equipment.", "exTr": "Kırsal kliniklerde hekimlik yapan doktorlar, çoğu zaman özel tıbbi ekipman eksikliğiyle karşılaşır."}
],
"purpose": [
  {"tr": "i. amaç", "ex": "The foundation's main purpose is to provide clean drinking water to underserved communities.", "exTr": "Vakfın temel amacı, yeterli hizmet alamayan topluluklara temiz içme suyu sağlamaktır."},
  {"tr": "f. (resmi/eski) niyet etmek, tasarlamak", "ex": "The explorer purposed to reach the summit before the winter storms made the climb impossible.", "exTr": "Kâşif, kış fırtınaları tırmanışı imkânsız hâle getirmeden önce zirveye ulaşmayı tasarlamıştı."}
],
"communicate": [
  {"tr": "f. iletişim kurmak", "ex": "Dolphins communicate with each other using a complex system of clicks and whistles.", "exTr": "Yunuslar, karmaşık bir tıklama ve ıslık sistemi kullanarak birbirleriyle iletişim kurar."},
  {"tr": "f. (hastalık) bulaştırmak", "ex": "In areas with poor sanitation, infected animals can quickly communicate diseases to humans.", "exTr": "Sanitasyonun yetersiz olduğu bölgelerde, enfekte hayvanlar hastalıkları insanlara hızla bulaştırabilir."}
],
"working": [
  {"tr": "s. çalışan, iş yapan; i. çalışma, işleyiş", "ex": "Many working parents struggle to balance office schedules with childcare responsibilities.", "exTr": "Çalışan birçok ebeveyn, ofis programını çocuk bakımı sorumluluklarıyla dengelemekte zorlanır."},
  {"tr": "s. (working definition) taslak, çalışma amaçlı", "ex": "The committee adopted a working definition of poverty based on household income and access to basic services.", "exTr": "Komite, hane geliri ve temel hizmetlere erişime dayalı olarak yoksulluğa ilişkin çalışma tanımını benimsedi."}
],
"stay": [
  {"tr": "f. kalmak, devam etmek", "ex": "Patients are advised to stay hydrated for several hours following the medical procedure.", "exTr": "Hastalara, tıbbi işlemin ardından birkaç saat boyunca yeterince sıvı tüketmeye devam etmeleri öneriliyor."},
  {"tr": "i. kalış, konaklama", "ex": "Their stay at the mountain lodge was extended by two days due to unexpected heavy snowfall.", "exTr": "Dağ otelindeki konaklamaları, beklenmedik yoğun kar yağışı nedeniyle iki gün uzatıldı."}
],
"eye": [
  {"tr": "i. göz", "ex": "The human eye can distinguish millions of different colors under normal light.", "exTr": "İnsan gözü, normal ışıkta milyonlarca farklı rengi ayırt edebilir."},
  {"tr": "f. dikkatle süzmek, gözlemek", "ex": "The suspicious shop owner eyed the customer carefully as she walked past the jewelry counter.", "exTr": "Kuşkulanan dükkân sahibi, müşteri mücevher tezgâhının önünden geçerken onu dikkatle süzdü."}
],
"looking": [
  {"tr": "s. (bileşik) ...görünümlü", "ex": "The exhausted, worried-looking scientist had spent all night analyzing the unexpected results.", "exTr": "Bitkin ve endişeli görünümlü bilim insanı, tüm geceyi beklenmedik sonuçları analiz ederek geçirmişti."}
],
"otherwise": [
  {"tr": "z. aksi takdirde, başka türlü", "ex": "Patients must take the medication regularly; otherwise, their symptoms may quickly return.", "exTr": "Hastalar ilacı düzenli almalıdır; aksi takdirde belirtileri hızla geri dönebilir."},
  {"tr": "s. farklı", "ex": "The report suggested the treatment was safe, but the clinical data proved otherwise.", "exTr": "Rapor, tedavinin güvenli olduğunu öne sürüyordu ama klinik veriler farklı olduğunu kanıtladı."}
],
"flood": [
  {"tr": "i. sel, taşkın", "ex": "Heavy monsoon rains caused a devastating flood across several low-lying villages last month.", "exTr": "Şiddetli muson yağmurları, geçen ay birkaç alçak rakımlı köyde yıkıcı bir sele yol açtı."},
  {"tr": "f. su basmak", "ex": "Melting snow caused the river to flood nearby farmland every spring for the past decade.", "exTr": "Eriyen kar, son on yılda her ilkbaharda nehrin taşarak yakındaki tarım arazilerini basmasına neden oldu."}
],
"deep": [
  {"tr": "s./z. derin", "ex": "Marine biologists discovered strange bioluminescent creatures living deep beneath the ocean surface.", "exTr": "Deniz biyologları, okyanus yüzeyinin derinlerinde yaşayan tuhaf biyolüminesan canlılar keşfetti."},
  {"tr": "i. (the deep) engin, derinlik", "ex": "Sailors of that era told stories about monsters said to rise from the deep during violent storms.", "exTr": "O dönemin denizcileri, şiddetli fırtınalarda enginlerden yükseldiği söylenen canavarlara dair hikâyeler anlatırdı."}
],
"huge": [
  {"tr": "s. devasa, çok büyük", "ex": "Satellite images revealed a huge iceberg breaking away from the Antarctic ice shelf.", "exTr": "Uydu görüntüleri, Antarktika buz sahanlığından kopan devasa bir buzdağını ortaya çıkardı."}
],
"emphasis": [
  {"tr": "i. vurgu, önem", "ex": "Modern medical training places greater emphasis on preventive care than it once did.", "exTr": "Modern tıp eğitimi, koruyucu bakıma geçmişte olduğundan daha fazla önem veriyor."}
],
"full": [
  {"tr": "s. dolu, tam", "ex": "Researchers have not yet reached full agreement on the causes of the extinction event.", "exTr": "Araştırmacılar, yok oluş olayının nedenleri konusunda henüz tam bir görüş birliğine varmadı."},
  {"tr": "z. tamamen", "ex": "She turned the volume up full so that everyone in the crowded room could hear the announcement.", "exTr": "Kalabalık odadaki herkesin duyuruyu duyabilmesi için sesi sonuna kadar açtı."}
],
"picture": [
  {"tr": "i. resim, fotoğraf", "ex": "The exhibition featured a striking picture of the glacier taken nearly fifty years ago.", "exTr": "Sergide, neredeyse elli yıl önce çekilmiş çarpıcı bir buzul resmi yer aldı."},
  {"tr": "f. tasavvur etmek, gözünde canlandırmak", "ex": "It is hard to picture how the valley looked before the dam changed the entire landscape.", "exTr": "Baraj tüm manzarayı değiştirmeden önce vadinin nasıl göründüğünü gözünde canlandırmak zor."}
],
"balance": [
  {"tr": "i. denge", "ex": "Physicians recommend a diet that maintains a healthy balance between protein and fiber.", "exTr": "Hekimler, protein ve lif arasında sağlıklı bir denge koruyan bir diyet öneriyor."},
  {"tr": "f. dengelemek; dengede durmak", "ex": "The gymnast had to balance carefully on the narrow beam during the final routine.", "exTr": "Jimnastikçi, final serisi sırasında dar denge aletinin üzerinde dikkatle dengede durmak zorunda kaldı."}
],
"middle": [
  {"tr": "i./s. orta", "ex": "Archaeologists dated the settlement to somewhere in the middle of the Bronze Age.", "exTr": "Arkeologlar, yerleşimin Tunç Çağı'nın ortalarına doğru bir döneme ait olduğunu belirledi."}
],
"current": [
  {"tr": "s. güncel, şimdiki", "ex": "The current data suggests that global temperatures rose faster than predicted last year.", "exTr": "Güncel veriler, küresel sıcaklıkların geçen yıl tahmin edilenden daha hızlı arttığını gösteriyor."},
  {"tr": "i. akıntı, akım", "ex": "Ocean currents play a crucial role in distributing heat across the planet's surface.", "exTr": "Okyanus akıntıları, gezegenin yüzeyinde ısının dağılmasında çok önemli bir rol oynar."}
],
"open": [
  {"tr": "f. açmak, açılmak", "ex": "Researchers hope the new grant will open opportunities for long-term climate monitoring.", "exTr": "Araştırmacılar, yeni fonun uzun vadeli iklim izleme için fırsatlar açacağını umuyor."},
  {"tr": "s. açık", "ex": "The clinic remains open around the clock to handle emergency cases in the rural district.", "exTr": "Klinik, kırsal bölgedeki acil vakalar için günün her saati açık kalıyor."}
],
"else": [
  {"tr": "z. başka", "ex": "The witness could not recall anything else about the vehicle that had left the scene so quickly.", "exTr": "Tanık, olay yerinden bu kadar hızla ayrılan araç hakkında başka hiçbir şey hatırlayamadı."},
  {"tr": "z. aksi halde", "ex": "Coastal cities must invest in flood defences now, or else entire districts may become uninhabitable.", "exTr": "Kıyı şehirleri şimdi sel savunmalarına yatırım yapmalı, aksi halde tüm bölgeler yaşanmaz hale gelebilir."}
],
"assume": [
  {"tr": "f. varsaymak", "ex": "Early astronomers wrongly assumed that the sun revolved around the Earth.", "exTr": "Erken dönem gökbilimciler, güneşin Dünya'nın etrafında döndüğünü yanlış bir biçimde varsayıyordu."},
  {"tr": "f. üstlenmek", "ex": "The vice president had to assume full responsibility for the project after the director suddenly resigned.", "exTr": "Direktör aniden istifa ettikten sonra başkan yardımcısı, projenin tüm sorumluluğunu üstlenmek zorunda kaldı."}
],
"taken": [
  {"tr": "s. dolu, meşgul", "ex": "By the time volunteers arrived, most of the shelter's available beds were already taken.", "exTr": "Gönüllüler geldiğinde, sığınma evindeki mevcut yatakların çoğu zaten doluydu."},
  {"tr": "s. ele geçirilmiş", "ex": "The fortress was taken by enemy forces after a siege that lasted nearly a decade.", "exTr": "Kale, neredeyse on yıl süren bir kuşatmanın ardından düşman güçlerince ele geçirildi."}
],
"surface": [
  {"tr": "i. yüzey", "ex": "The rough surface of the rock made it difficult for climbers to find a secure grip.", "exTr": "Kayanın pürüzlü yüzeyi, tırmanıcıların sağlam bir tutamak bulmasını zorlaştırdı."},
  {"tr": "f. yüzeye çıkmak, ortaya çıkmak", "ex": "New evidence about the ancient civilization began to surface after the excavation team analyzed the site.", "exTr": "Kazı ekibi alanı inceledikten sonra, antik uygarlıkla ilgili yeni kanıtlar ortaya çıkmaya başladı."}
],
"total": [
  {"tr": "s. toplam, tüm", "ex": "By the end of the century, the total number of species at risk could double.", "exTr": "Yüzyılın sonuna kadar, risk altındaki tür sayısının toplamı iki katına çıkabilir."},
  {"tr": "f. toplamak", "ex": "The clerk had to total the day's sales figures before closing the store for the night.", "exTr": "Memurun, dükkânı gece için kapatmadan önce günün satış rakamlarını toplaması gerekiyordu."}
],
"step": [
  {"tr": "i. adım", "ex": "Each step of the experiment was carefully recorded to ensure the results could be reproduced.", "exTr": "Deneyin her adımı, sonuçların yeniden üretilebilmesini sağlamak için dikkatle kaydedildi."},
  {"tr": "f. adım atmak", "ex": "She stepped carefully onto the icy pavement, testing each stone before shifting her weight.", "exTr": "Buzlu kaldırıma dikkatle adım attı; ağırlığını vermeden önce her taşı yokladı."}
],
"normal": [
  {"tr": "s. normal, olağan", "ex": "Body temperature slightly above normal can indicate the early stages of an infection.", "exTr": "Vücut sıcaklığının normalin biraz üzerinde olması, bir enfeksiyonun erken evrelerine işaret edebilir."},
  {"tr": "i. norm, ortalama", "ex": "After the surgery, doctors expect his health to return to normal within a few weeks.", "exTr": "Ameliyattan sonra doktorlar, sağlığının birkaç hafta içinde normale dönmesini bekliyor."}
],
"television": [
  {"tr": "i. televizyon", "ex": "Excessive television viewing during childhood has been linked to shorter attention spans later in life.", "exTr": "Çocuklukta aşırı televizyon izleme, ileride daha kısa dikkat süreleriyle ilişkilendirilmiştir."}
],
"strike": [
  {"tr": "i. grev", "ex": "Transport workers announced a nationwide strike to demand better safety conditions.", "exTr": "Ulaşım işçileri, daha iyi güvenlik koşulları talep etmek için ülke genelinde bir grev ilan etti."},
  {"tr": "f. vurmak, çarpmak", "ex": "Lightning struck the old oak tree in the park during last night's violent thunderstorm.", "exTr": "Yıldırım, dün geceki şiddetli fırtına sırasında parktaki eski meşe ağacına düştü."}
],
"engage": [
  {"tr": "f. ilgisini çekmek, (derse) katmak; (engage in) katılmak", "ex": "Teachers are finding new ways to engage students who struggle with traditional lectures.", "exTr": "Öğretmenler, geleneksel derslerde zorlanan öğrencileri derse katmanın yeni yollarını arıyor."},
  {"tr": "f. birbirine geçmek (mekanik)", "ex": "The mechanic explained that the gears failed to engage properly because of a worn clutch plate.", "exTr": "Tamirci, aşınmış bir debriyaj diski nedeniyle dişlilerin düzgün biçimde birbirine geçmediğini açıkladı."}
],
"depression": [
  {"tr": "i. depresyon, bunalım", "ex": "Untreated depression can significantly affect a person's ability to function at work.", "exTr": "Tedavi edilmeyen depresyon, bir kişinin iş yerinde işlev görme becerisini önemli ölçüde etkileyebilir."},
  {"tr": "i. çöküntü; (meteoroloji) alçak basınç, depresyon", "ex": "Meteorologists tracked a tropical depression forming over the ocean that could soon strengthen into a storm.", "exTr": "Meteorologlar, yakında bir fırtınaya dönüşebilecek, okyanus üzerinde oluşan bir tropikal depresyonu izledi."}
],
"cognitive": [
  {"tr": "s. bilişsel", "ex": "Regular reading has been linked to slower cognitive decline in older adults.", "exTr": "Düzenli okuma, yaşlı yetişkinlerde daha yavaş bilişsel gerilemeyle ilişkilendirilmiştir."}
],
"sophisticate": [
  {"tr": "i. görmüş geçirmiş kimse", "ex": "The novelist portrayed the city dweller as a sophisticate who secretly longed for rural simplicity.", "exTr": "Romancı, şehirliyi gizliden gizliye kırsal sadeliğe özlem duyan görmüş geçirmiş biri olarak resmetti."}
],
"yeah": [
  {"tr": "z. evet, ya (günlük dil)", "ex": "\"Yeah, I think the data supports our hypothesis,\" the research assistant replied during the meeting.", "exTr": "Araştırma asistanı toplantıda, \"Evet, bence veriler hipotezimizi destekliyor,\" diye yanıtladı."}
],
"final": [
  {"tr": "s. son, nihai", "ex": "Committee members debated for hours before reaching a final decision on the new environmental policy.", "exTr": "Komite üyeleri, yeni çevre politikası konusunda nihai bir karara varmadan önce saatlerce tartıştı."},
  {"tr": "i. final (sınav/maç)", "ex": "Thousands of students across the country will sit their finals next week after months of preparation.", "exTr": "Ülke genelinde binlerce öğrenci, aylarca süren hazırlığın ardından gelecek hafta finallerine girecek."}
],
"ethnic": [
  {"tr": "s. etnik", "ex": "Large cities often bring together people from many different ethnic and cultural backgrounds.", "exTr": "Büyük şehirler, çoğu zaman birçok farklı etnik ve kültürel geçmişten insanları bir araya getirir."}
],
"mark": [
  {"tr": "f. işaretlemek", "ex": "Researchers mark each fossil sample with a unique code before placing it in storage.", "exTr": "Araştırmacılar, her fosil örneğini depoya koymadan önce benzersiz bir kodla işaretler."},
  {"tr": "i. not, puan", "ex": "She received top marks in the final examination for her outstanding thesis on renewable energy.", "exTr": "Yenilenebilir enerji üzerine yazdığı seçkin tezi için final sınavında en yüksek notları aldı."}
],
"apart": [
  {"tr": "z. ayrı, birbirinden ayrı", "ex": "Researchers kept the two groups of participants apart to prevent them from influencing each other's answers.", "exTr": "Araştırmacılar, katılımcı iki grubun birbirinin yanıtlarını etkilemesini önlemek için onları ayrı tuttu."},
  {"tr": "s. (come apart) parçalarına ayrılmış", "ex": "By the time mechanics reached the scene, the damaged engine had completely come apart.", "exTr": "Tamirciler olay yerine ulaştığında, hasarlı motor tamamen parçalarına ayrılmıştı."}
],
"held": [
  {"tr": "s. yaygın olarak kabul edilen (widely held)", "ex": "Economists challenged the widely held assumption that markets always correct themselves efficiently.", "exTr": "İktisatçılar, piyasaların her zaman kendi kendini verimli biçimde düzelttiği yönündeki yaygın kabul gören varsayıma itiraz etti."},
  {"tr": "s. tutulan, sahip olunan", "ex": "The prisoner was held in a small cell for several months before his trial finally began.", "exTr": "Mahkum, duruşması nihayet başlamadan önce birkaç ay küçük bir hücrede tutuldu."}
],
"reverse": [
  {"tr": "f. tersine çevirmek, iptal etmek", "ex": "Researchers hope the new therapy can reverse some of the damage caused by the disease.", "exTr": "Araştırmacılar, yeni tedavinin hastalığın neden olduğu hasarın bir kısmını tersine çevirebilmesini umuyor."},
  {"tr": "s. ters, zıt", "ex": "On the return journey, the expedition followed the same route in the reverse direction.", "exTr": "Dönüş yolculuğunda sefer ekibi, aynı güzergâhı ters yönde izledi."}
],
"confine": [
  {"tr": "f. sınırlamak, kısıtlamak", "ex": "The chairman asked speakers to confine their remarks to the items already on the agenda.", "exTr": "Başkan, konuşmacılardan görüşlerini yalnızca gündemdeki maddelerle sınırlamalarını istedi."},
  {"tr": "f. kapatmak, hapsetmek", "ex": "The prisoner was confined to a small cell for nearly a year without any contact with the outside world.", "exTr": "Mahkum, dış dünyayla hiçbir teması olmadan neredeyse bir yıl boyunca küçük bir hücreye kapatıldı."}
],
"relative": [
  {"tr": "s. göreli, nispi", "ex": "Humidity levels are often expressed in relative terms rather than as an absolute measurement.", "exTr": "Nem düzeyleri genellikle mutlak bir ölçüm yerine göreli terimlerle ifade edilir."},
  {"tr": "i. akraba", "ex": "She moved abroad to live closer to her relatives after retiring.", "exTr": "Emekli olduktan sonra akrabalarına daha yakın yaşamak için yurt dışına taşındı."}
],
"root": [
  {"tr": "i. kök, köken", "ex": "Linguists traced many modern English words back to roots shared with ancient Greek and Sanskrit.", "exTr": "Dilbilimciler, birçok modern İngilizce kelimenin kökenini eski Yunanca ve Sanskritçeyle paylaşılan köklere dayandırdı."},
  {"tr": "f. kök salmak, dayanmak", "ex": "The tradition rooted itself deeply in the region's culture over many generations.", "exTr": "Bu gelenek, nesiller boyunca bölgenin kültürüne derinden kök saldı."}
],

/* --- 26.08.2026 tam anlam taramasi, parti 2 (k3+k4): 113 bulgudan
   suzulen duzeltmeler. Silinen zayif/uydurma anlamlar: background f.,
   blue f., gap f., horse f., immune i., mechanic s., soldier f.,
   take-up "emilim". Gerisi ceviri/ornek/etiket duzeltmesi. --- */
"academy": [
  {"tr": "i. akademi, özel eğitim kurumu", "ex": "Promising young athletes are often recruited by a national sports academy before the age of fifteen.", "exTr": "Umut vadeden genç sporcular, genellikle on beş yaşından önce ulusal bir spor akademisine alınır."}
],
"accent": [
  {"tr": "i. aksan, şive", "ex": "Linguists study how regional accent can reveal information about a speaker's background.", "exTr": "Dilbilimciler, bölgesel aksanın bir konuşmacının geçmişi hakkında nasıl bilgi verebileceğini inceler."},
  {"tr": "i. vurgu", "ex": "In this word, the accent falls on the second syllable rather than the first.", "exTr": "Bu kelimede vurgu, ilk heceye değil ikinci heceye düşer."}
],
"adapted": [
  {"tr": "s. uyum sağlamış, uyarlanmış", "ex": "Desert plants have evolved a remarkably adapted root system that stores water for months.", "exTr": "Çöl bitkileri, aylarca su depolayabilen dikkat çekici derecede uyum sağlamış bir kök sistemi geliştirmiştir."}
],
"ahead": [
  {"tr": "z. ileride, önde; (ahead of) -den önce", "ex": "Engineers finished the bridge inspection well ahead of the scheduled deadline this month.", "exTr": "Mühendisler, köprü denetimini bu ayki planlanan son tarihten çok önce tamamladı."}
],
"alongside": [
  {"tr": "e./z. yanında, yanı sıra, boyunca", "ex": "The new bike lane runs alongside the river for nearly ten kilometers.", "exTr": "Yeni bisiklet yolu, nehir boyunca neredeyse on kilometre uzanıyor."}
],
"am": [
  {"tr": "z. öğleden önce (saat için: ÖÖ)", "ex": "The clinical trial's first session begins at eight am, before the hospital's morning rounds start.", "exTr": "Klinik deneyin ilk oturumu, hastanenin sabah vizitleri başlamadan önce sabah saat sekizde başlıyor."}
],
"arrangement": [
  {"tr": "i. düzenleme, tertip", "ex": "The florist changed the arrangement of the flowers in the window display every morning.", "exTr": "Çiçekçi, vitrindeki çiçeklerin düzenini her sabah değiştirirdi."},
  {"tr": "i. anlaşma", "ex": "The two companies signed a licensing arrangement that allowed them to share patented technology.", "exTr": "İki şirket, patentli teknolojiyi paylaşmalarına imkân tanıyan bir lisans anlaşması imzaladı."}
],
"articulate": [
  {"tr": "f. açıkça ifade etmek", "ex": "Successful leaders can articulate complex ideas in ways that ordinary citizens easily understand.", "exTr": "Başarılı liderler, karmaşık fikirleri sıradan vatandaşların kolayca anlayabileceği biçimde ifade edebilir."},
  {"tr": "s. ifadesi düzgün, düşüncelerini iyi anlatabilen", "ex": "The young candidate impressed voters with how articulate and confident she appeared during the debate.", "exTr": "Genç aday, tartışma sırasında ne kadar ifadesi düzgün ve özgüvenli göründüğüyle seçmenleri etkiledi."}
],
"artist": [
  {"tr": "i. sanatçı", "ex": "The exhibition features paintings created by a local artist inspired by the region's coastline.", "exTr": "Sergide, bölgenin sahil şeridinden ilham alan yerel bir sanatçının yaptığı tablolar yer alıyor."}
],
"attraction": [
  {"tr": "i. çekim, cazibe", "ex": "For many students, the professor's lectures held a natural attraction that formal textbooks lacked.", "exTr": "Birçok öğrenci için profesörün dersleri, ders kitaplarında bulunmayan doğal bir cazibe taşıyordu."},
  {"tr": "i. (tourist attraction) turistik cazibe merkezi", "ex": "Every summer, the waterfall remains the region's biggest tourist attraction for visiting families.", "exTr": "Her yaz, şelale bölgeyi ziyaret eden aileler için en büyük turistik cazibe merkezi olmayı sürdürüyor."}
],
"axis": [
  {"tr": "i. eksen", "ex": "The Earth rotates around its own axis once approximately every twenty-four hours.", "exTr": "Dünya, kendi ekseni etrafında yaklaşık her yirmi dört saatte bir tam tur döner."},
  {"tr": "i. (siyasi) mihver, ittifak", "ex": "The two countries formed a powerful axis that reshaped the region's politics for a generation.", "exTr": "İki ülke, bölge siyasetini bir kuşak boyunca yeniden şekillendiren güçlü bir mihver oluşturdu."}
],
"background": [
  {"tr": "i. arka plan, geçmiş, altyapı", "ex": "Employers often check a candidate's background before offering a position of financial responsibility.", "exTr": "İşverenler, mali sorumluluk gerektiren bir pozisyon teklif etmeden önce genellikle adayın geçmişini kontrol eder."}
],
"bats": [
  {"tr": "s. (argo) çılgın, kaçık, deli (go bats)", "ex": "His neighbours thought he had gone completely bats when he started talking to his plants every morning.", "exTr": "Her sabah bitkileriyle konuşmaya başlayınca komşuları onun iyice kaçırdığını düşündü."}
],
"biologist": [
  {"tr": "i. biyolog", "ex": "A marine biologist spent ten years studying how coral reefs recover from bleaching.", "exTr": "Bir deniz biyoloğu, mercan resiflerinin ağarmanın ardından nasıl toparlandığını incelemeye on yıl harcadı."}
],
"blue": [
  {"tr": "s./i. mavi", "ex": "Marine biologists were amazed by the deep blue color of the newly discovered coral species.", "exTr": "Deniz biyologları, yeni keşfedilen mercan türünün koyu mavi renginden büyülendi."}
],
"bodily": [
  {"tr": "s. bedensel", "ex": "Regular physical activity improves bodily functions such as circulation, digestion, and muscle strength.", "exTr": "Düzenli fiziksel aktivite; dolaşım, sindirim ve kas gücü gibi bedensel işlevleri geliştirir."},
  {"tr": "z. bedenen, bütünüyle", "ex": "Firefighters carried the unconscious man bodily out of the burning building before the roof collapsed.", "exTr": "İtfaiyeciler, çatı çökmeden önce baygın adamı olduğu gibi kucaklayıp yanan binadan çıkardı."}
],
"bound": [
  {"tr": "s. bağlı, mecbur, yükümlü", "ex": "The research team felt morally bound to publish their findings despite pressure from the sponsor.", "exTr": "Araştırma ekibi, sponsorun baskısına rağmen bulgularını yayımlamakla ahlaki olarak yükümlü hissetti."},
  {"tr": "s. -e giden, yönelik", "ex": "The cargo ship, bound for Rotterdam, was delayed for several days by unusually rough seas.", "exTr": "Rotterdam'a giden kargo gemisi, alışılmadık derecede sert denizler yüzünden birkaç gün gecikti."}
],
"brazil": [
  {"tr": "i. Brezilya cevizi (ağacı/meyvesi)", "ex": "She cracked open a few brazils to add to the fruitcake before baking it.", "exTr": "Fırınlamadan önce keke eklemek için birkaç Brezilya cevizi kırdı."}
],
"bridge": [
  {"tr": "i. köprü", "ex": "Engineers inspected the old stone bridge to determine whether it could still support heavy traffic.", "exTr": "Mühendisler, eski taş köprünün hâlâ ağır trafiği taşıyıp taşıyamayacağını belirlemek için inceleme yaptı."},
  {"tr": "f. köprü kurmak, bağlamak", "ex": "International conferences often bridge cultural differences by encouraging open dialogue between scientists.", "exTr": "Uluslararası konferanslar, bilim insanları arasında açık diyaloğu teşvik ederek kültürel farklılıklar arasında sıklıkla köprü kurar."}
],
"broken": [
  {"tr": "s. kırık", "ex": "The moving company refused to compensate for the broken vase found inside the shipping box.", "exTr": "Nakliye şirketi, gönderi kutusunun içinde bulunan kırık vazo için tazminat ödemeyi reddetti."},
  {"tr": "s. (dil için) bozuk, yarım yamalak", "ex": "The elderly tourist managed to communicate with locals using only broken Spanish and hand gestures.", "exTr": "Yaşlı turist, yerel halkla yalnızca bozuk bir İspanyolca ve el işaretleri kullanarak iletişim kurmayı başardı."}
],
"bug": [
  {"tr": "i. (yazılımda) hata", "ex": "Developers spent the entire weekend trying to fix a critical bug in the flight-booking software.", "exTr": "Geliştiriciler, uçuş rezervasyon yazılımındaki kritik bir hatayı düzeltmeye çalışarak tüm hafta sonunu geçirdi."},
  {"tr": "i. böcek", "ex": "A tiny bug crawled across the researcher's notebook while she recorded her observations in the field.", "exTr": "Araştırmacı arazide gözlemlerini kaydederken küçük bir böcek, defterinin üzerinde ilerledi."}
],
"burning": [
  {"tr": "i. yanma, yakma", "ex": "Farmers were banned from burning crop residue after studies linked the practice to worsening air pollution.", "exTr": "Çalışmalar bu uygulamayı kötüleşen hava kirliliğiyle ilişkilendirdikten sonra çiftçilerin ekin artıklarını yakması yasaklandı."},
  {"tr": "s. acil, can alıcı", "ex": "Reducing carbon emissions has become a burning issue among world leaders attending the summit.", "exTr": "Karbon emisyonlarını azaltmak, zirveye katılan dünya liderleri arasında can alıcı bir mesele hâline geldi."}
],
"causing": [
  {"tr": "s. neden olan, yol açan", "ex": "Heavy rainfall was identified as the main factor causing severe flooding in coastal towns.", "exTr": "Şiddetli yağış, kıyı kasabalarındaki ciddi sellere yol açan başlıca etken olarak belirlendi."}
],
"chain": [
  {"tr": "i. zincir", "ex": "A single broken link in the supply chain can delay production for several weeks.", "exTr": "Tedarik zincirindeki tek bir kırık halka, üretimi birkaç hafta geciktirebilir."},
  {"tr": "f. zincirlemek", "ex": "The workers chained the fallen tree trunk to the tractor before pulling it off the road.", "exTr": "İşçiler, devrilen ağaç gövdesini yoldan çekmeden önce traktöre zincirledi."}
],
"chromosome": [
  {"tr": "i. kromozom", "ex": "Each human cell normally contains an identical set of forty-six chromosomes arranged in pairs.", "exTr": "Her insan hücresi normalde, çiftler hâlinde düzenlenmiş kırk altı kromozomdan oluşan özdeş bir takım içerir."}
],
"clinical": [
  {"tr": "s. klinik", "ex": "The new drug is currently undergoing clinical trials to test its safety and effectiveness.", "exTr": "Yeni ilaç, güvenliğini ve etkinliğini test etmek için şu anda klinik denemelerden geçiyor."},
  {"tr": "s. tarafsız, duygusuz", "ex": "The doctor's clinical tone made the grieving family feel that he lacked any real empathy.", "exTr": "Doktorun duygusuz tonu, yas tutan ailede onun gerçek bir empatiden yoksun olduğu hissini uyandırdı."}
],
"complement": [
  {"tr": "f. tamamlamak", "ex": "Renewable energy sources complement traditional power plants by reducing dependence on fossil fuels.", "exTr": "Yenilenebilir enerji kaynakları, fosil yakıtlara bağımlılığı azaltarak geleneksel elektrik santrallerini tamamlar."},
  {"tr": "i. tamamlayıcı", "ex": "A good soundtrack should act as a subtle complement to the film's visual storytelling.", "exTr": "İyi bir film müziği, filmin görsel anlatımına incelikli, göze batmayan bir tamamlayıcı olmalıdır."}
],
"conception": [
  {"tr": "i. anlayış, kavrayış", "ex": "The modern conception of childhood differs greatly from views held in medieval Europe.", "exTr": "Modern çocukluk anlayışı, Orta Çağ Avrupa'sındaki görüşlerden büyük ölçüde farklıdır."},
  {"tr": "i. gebe kalma, döllenme", "ex": "Doctors explained that the conception of the twins occurred naturally without any fertility treatment.", "exTr": "Doktorlar, ikizlere gebeliğin herhangi bir kısırlık tedavisi olmadan doğal yolla gerçekleştiğini açıkladı."}
],
"cow": [
  {"tr": "i. inek", "ex": "Local farmers keep dozens of dairy cows to supply milk to nearby towns.", "exTr": "Yerel çiftçiler, yakındaki kasabalara süt sağlamak için onlarca süt ineği besliyor."},
  {"tr": "f. korkutmak, yıldırmak, sindirmek", "ex": "The dictator used fear and violence to cow the population into complete silence.", "exTr": "Diktatör, halkı sindirip tamamen susturmak için korku ve şiddet kullandı."}
],
"creative": [
  {"tr": "s. yaratıcı", "ex": "Teachers encouraged creative problem-solving rather than simple memorization during the science unit.", "exTr": "Öğretmenler, fen ünitesi boyunca yalnızca ezber yerine yaratıcı problem çözmeyi teşvik etti."}
],
"degrade": [
  {"tr": "f. ayrışmak, bozulmak, aşınmak", "ex": "Plastic waste can take centuries to degrade completely in marine environments.", "exTr": "Plastik atıkların deniz ortamlarında tamamen ayrışması yüzyıllar alabilir."},
  {"tr": "f. küçük düşürmek, itibarını düşürmek", "ex": "The manager's harsh public comments seemed intended to degrade the employee in front of his colleagues.", "exTr": "Müdürün herkesin önünde yaptığı sert yorumlar, çalışanı meslektaşlarının önünde küçük düşürmeyi amaçlıyor gibiydi."}
],
"discharge": [
  {"tr": "f. boşaltmak, salıvermek", "ex": "The factory was fined for illegally discharging chemical waste into the nearby river.", "exTr": "Fabrika, yakındaki nehre yasa dışı biçimde kimyasal atık boşalttığı için para cezasına çarptırıldı."},
  {"tr": "f. taburcu etmek", "ex": "Hospitals began to discharge recovering patients earlier to free up beds during the crowded flu season.", "exTr": "Hastaneler, yoğun grip mevsiminde yatakları boşaltmak için iyileşmekte olan hastaları daha erken taburcu etmeye başladı."}
],
"dissolve": [
  {"tr": "f. erimek, çözünmek", "ex": "Sugar molecules dissolve more quickly in hot water than in cold water.", "exTr": "Şeker molekülleri, sıcak suda soğuk suya kıyasla çok daha hızlı çözünür."},
  {"tr": "f. feshetmek, dağıtmak", "ex": "Facing a prolonged political deadlock, the president decided to dissolve parliament and call new elections.", "exTr": "Uzun süreli bir siyasi çıkmazla karşı karşıya kalan cumhurbaşkanı, meclisi feshedip erken seçim ilan etmeye karar verdi."}
],
"distributed": [
  {"tr": "s. dağıtılmış, dağınık", "ex": "The research team analyzed a widely distributed sample of soil collected from various farms across the country.", "exTr": "Araştırma ekibi, ülke genelindeki çeşitli çiftliklerden toplanan, geniş bir alana yayılmış toprak örneklerini analiz etti."}
],
"division": [
  {"tr": "i. bölme, bölüşüm; iş bölümü", "ex": "The division of labor allowed early societies to develop specialized skills and complex economies.", "exTr": "İş bölümü, erken toplumların uzmanlaşmış beceriler ve karmaşık ekonomiler geliştirmesine olanak sağladı."},
  {"tr": "i. ayrılık, anlaşmazlık", "ex": "The proposed tax reform caused deep division among members of the ruling political party.", "exTr": "Önerilen vergi reformu, iktidardaki siyasi parti üyeleri arasında derin bir ayrılığa yol açtı."}
],
"drama": [
  {"tr": "i. dram, tiyatro oyunu", "ex": "Shakespeare's dramas are still performed in theatres around the world four centuries after they were written.", "exTr": "Shakespeare'in dramları, yazılmalarından dört yüzyıl sonra bile dünyanın dört bir yanındaki tiyatrolarda sahneleniyor."},
  {"tr": "i. (mecazi) heyecanlı/gergin olay", "ex": "The negotiations between the two companies turned into unexpected drama when the CEO abruptly left the meeting midway through.", "exTr": "İki şirket arasındaki müzakereler, CEO toplantıyı yarıda aniden terk edince beklenmedik, gergin bir olaya dönüştü."}
],
"drop": [
  {"tr": "i. düşüş", "ex": "A sudden drop in temperature overnight damaged much of the region's early spring harvest.", "exTr": "Gece yaşanan ani sıcaklık düşüşü, bölgenin erken ilkbahar hasadının büyük bölümüne zarar verdi."},
  {"tr": "f. düşmek, bırakmak", "ex": "The bird suddenly dropped from the sky after being struck by a gust of wind.", "exTr": "Kuş, ani bir rüzgârın çarpmasıyla gökten aniden düştü."}
],
"dropped": [
  {"tr": "s. düşürülmüş; bırakılmış, vazgeçilmiş; iptal edilmiş", "ex": "The dropped charges against the defendant made headlines after new evidence proved his innocence.", "exTr": "Yeni kanıtlar masumiyetini kanıtlayınca, sanık hakkındaki düşürülen suçlamalar manşetlere taşındı."}
],
"dust": [
  {"tr": "i. toz", "ex": "Fine dust carried by desert winds can travel thousands of kilometers across continents.", "exTr": "Çöl rüzgârlarının taşıdığı ince toz, kıtalar boyunca binlerce kilometre yol alabilir."},
  {"tr": "f. serpmek, ince tabaka hâlinde kaplamak", "ex": "The baker decided to dust the finished cake with a thin layer of powdered sugar before serving it.", "exTr": "Fırıncı, bitmiş pastayı servis etmeden önce üzerine ince bir tabaka pudra şekeri serpmeye karar verdi."}
],
"earned": [
  {"tr": "s. kazanılmış, hak edilmiş", "ex": "Her earned income from part-time consulting far exceeded her university salary last year.", "exTr": "Yarı zamanlı danışmanlıktan elde ettiği kazanç, geçen yıl üniversite maaşını fazlasıyla aştı."}
],
"ended": [
  {"tr": "s. (bileşiklerde) -uçlu", "ex": "The survey used open ended questions to gather more detailed opinions from the participants.", "exTr": "Anket, katılımcılardan daha ayrıntılı görüşler toplamak için açık uçlu sorular kullandı."},
  {"tr": "s. sona ermiş, bitmiş", "ex": "The war, though long ended, still shapes the region's politics today.", "exTr": "Savaş, çoktan sona ermiş olsa da bölgenin siyasetini bugün hâlâ şekillendiriyor."}
],
"file": [
  {"tr": "i. dosya", "ex": "She kept every important document in a labeled file inside the office cabinet.", "exTr": "Ofis dolabındaki etiketli bir dosyada tüm önemli belgeleri sakladı."},
  {"tr": "f. (resmî olarak) sunmak, vermek; dosyalamak", "ex": "Employees are required to file their expense reports electronically by the end of each month.", "exTr": "Çalışanların, harcama raporlarını her ayın sonuna kadar elektronik olarak dosyalaması gerekmektedir."}
],
"flesh": [
  {"tr": "i. et, doku, beden", "ex": "Surgeons carefully removed damaged flesh to prevent the infection from spreading further.", "exTr": "Cerrahlar, enfeksiyonun daha fazla yayılmasını önlemek için hasarlı dokuyu dikkatle çıkardı."},
  {"tr": "i. (meyve) etli kısım", "ex": "The flesh of a perfectly ripe mango is soft, juicy, and deep orange in color.", "exTr": "Tam olgunlaşmış bir mangonun etli kısmı yumuşak, sulu ve koyu turuncudur."}
],
"flip": [
  {"tr": "f. çevirmek, ters çevirmek; takla atmak", "ex": "The gymnast managed to flip backward twice before landing perfectly on the mat.", "exTr": "Cimnastikçi, minderin üzerine kusursuzca inmeden önce arkaya doğru iki kez takla atmayı başardı."},
  {"tr": "f. (flip out) çıldırmak, öfkeden kontrolünü kaybetmek", "ex": "He completely flipped out when he discovered that someone had scratched his brand-new car.", "exTr": "Birinin yepyeni arabasını çizdiğini keşfettiğinde tamamen çıldırdı."}
],
"flooding": [
  {"tr": "i. sel baskını, su basması", "ex": "Heavy monsoon rains caused severe flooding that displaced thousands of families across the region.", "exTr": "Şiddetli muson yağmurları, bölge genelinde binlerce aileyi yerinden eden ciddi bir sel baskınına yol açtı."},
  {"tr": "i. (psikoloji) taşırma, yoğun maruz bırakma tekniği", "ex": "The therapist used a technique called flooding to help the patient confront his fear of flying directly.", "exTr": "Terapist, hastanın uçma korkusuyla doğrudan yüzleşmesine yardımcı olmak için taşırma (flooding) adı verilen bir teknik kullandı."}
],
"fruit": [
  {"tr": "i. meyve", "ex": "Nutritionists recommend eating a variety of fruit every day for essential vitamins.", "exTr": "Beslenme uzmanları, gerekli vitaminler için her gün çeşitli meyveler yemeyi önerir."},
  {"tr": "f. meyve vermek", "ex": "In unusually warm years, these apple trees fruit several weeks earlier than expected.", "exTr": "Alışılmadık derecede sıcak yıllarda bu elma ağaçları beklenenden birkaç hafta erken meyve verir."}
],
"gap": [
  {"tr": "i. boşluk, açık, fark", "ex": "Economists warn that the widening income gap could destabilize social cohesion in the coming decade.", "exTr": "Ekonomistler, giderek genişleyen gelir farkının önümüzdeki on yılda toplumsal uyumu sarsabileceği konusunda uyarıyor."}
],
"ghost": [
  {"tr": "i. hayalet", "ex": "Local legend claims that the abandoned lighthouse is haunted by the ghost of a former keeper.", "exTr": "Yerel efsaneye göre, terk edilmiş deniz fenerine eski bir bekçinin hayaleti musallat olmuştur."},
  {"tr": "f. (argo) iletişimi aniden kesmek", "ex": "After their third date, he suddenly decided to ghost her without any explanation or warning.", "exTr": "Üçüncü buluşmalarının ardından, hiçbir açıklama veya uyarı yapmadan aniden onunla iletişimi kesmeye karar verdi."}
],
"globalization": [
  {"tr": "i. küreselleşme", "ex": "Economists continue to debate whether globalization has widened or narrowed the gap between rich and poor nations.", "exTr": "Ekonomistler, küreselleşmenin zengin ve yoksul uluslar arasındaki uçurumu genişlettiğini mi yoksa daralttığını mı tartışmaya devam ediyor."}
],
"honest": [
  {"tr": "s. dürüst", "ex": "Historians rely on honest accounts from eyewitnesses to reconstruct historical events accurately.", "exTr": "Tarihçiler, tarihi olayları doğru bir şekilde yeniden kurmak için görgü tanıklarının dürüst anlatımlarına güvenir."},
  {"tr": "s. hakiki, gerçek", "ex": "The inn serves simple meals made with honest ingredients from nearby farms.", "exTr": "Han, yakın çiftliklerden gelen hakiki malzemelerle hazırlanmış sade yemekler sunar."}
],
"horse": [
  {"tr": "i. at", "ex": "Archaeological evidence suggests that ancient nomadic tribes relied heavily on the horse for transportation.", "exTr": "Arkeolojik kanıtlar, eski göçebe kabilelerin ulaşım için büyük ölçüde ata güvendiğini göstermektedir."}
],
"ignored": [
  {"tr": "s. göz ardı edilen, dikkate alınmayan", "ex": "The ignored warnings about the dam's weakness later proved tragically accurate.", "exTr": "Barajın zayıflığına ilişkin göz ardı edilen uyarıların sonradan trajik biçimde doğru olduğu anlaşıldı."}
],
"improving": [
  {"tr": "s. iyileşen, gelişen", "ex": "Hospital records showed an improving recovery rate among patients treated with the new therapy.", "exTr": "Hastane kayıtları, yeni tedavi uygulanan hastalar arasında giderek yükselen bir iyileşme oranı gösterdi."}
],
"incline": [
  {"tr": "f. (incline to/toward) -e eğilimli olmak, meyletmek", "ex": "Older voters incline toward candidates who promise economic stability.", "exTr": "Yaşlı seçmenler, ekonomik istikrar vadeden adaylara yönelme eğilimindedir."},
  {"tr": "f. (yol vb.) eğim kazanmak, yükselmeye başlamak", "ex": "Cyclists often struggle to maintain speed when the road begins to incline sharply.", "exTr": "Bisikletçiler, yol dik biçimde yükselmeye başladığında genellikle hızlarını korumakta zorlanır."}
],
"injure": [
  {"tr": "f. yaralamak", "ex": "The bridge collapse injured several commuters before emergency crews could reach the scene.", "exTr": "Köprünün çökmesi, acil durum ekipleri olay yerine ulaşamadan birkaç yolcuyu yaraladı."},
  {"tr": "f. (gururunu/duygularını) incitmek, gücendirmek", "ex": "The manager's harsh remarks during the meeting seemed to injure the young employee's pride deeply.", "exTr": "Yöneticinin toplantı sırasındaki sert sözleri, genç çalışanın gururunu derinden incitmiş gibi görünüyordu."}
],
"instruction": [
  {"tr": "i. öğretim, eğitim", "ex": "The new curriculum places greater emphasis on direct instruction in reading and mathematics for young children.", "exTr": "Yeni müfredat, küçük çocuklar için okuma ve matematikte doğrudan öğretime daha fazla önem veriyor."},
  {"tr": "i. talimat, yönerge", "ex": "Before operating the machine, technicians must follow the manual's step-by-step instructions carefully.", "exTr": "Teknisyenler, makineyi çalıştırmadan önce kılavuzun adım adım talimatlarını dikkatle izlemelidir."}
],
"kept": [
  {"tr": "s. tutulmuş, yerine getirilmiş", "ex": "A faithfully kept promise between nations can strengthen diplomatic trust for generations.", "exTr": "Uluslar arasında sadakatle tutulan bir söz, diplomatik güveni nesiller boyu güçlendirebilir."},
  {"tr": "s. korunmuş, muhafaza edilmiş", "ex": "The well kept garden behind the old manor attracted visitors from across the region every spring.", "exTr": "Eski malikanenin arkasındaki iyi korunmuş bahçe, her bahar bölgenin dört bir yanından ziyaretçi çekiyordu."}
],
"laugh": [
  {"tr": "f. gülmek", "ex": "Researchers found that people who laugh regularly tend to experience lower levels of chronic stress.", "exTr": "Araştırmacılar, düzenli olarak gülen insanların daha düşük düzeyde kronik stres yaşama eğiliminde olduğunu buldu."},
  {"tr": "i. gülüş, kahkaha", "ex": "Her warm laugh could be heard from across the room, instantly putting nervous new employees at ease.", "exTr": "Onun sıcak kahkahası odanın öbür ucundan bile duyulabiliyordu ve gergin öğrencileri anında rahatlatıyordu."}
],
"lecture": [
  {"tr": "i. ders, konferans", "ex": "During the symposium, the visiting professor delivered a fascinating lecture on the origins of the universe.", "exTr": "Sempozyum sırasında, konuk profesör evrenin kökenleri üzerine büyüleyici bir konferans verdi."},
  {"tr": "f. azarlamak, azar vermek", "ex": "Her father began to lecture her about the dangers of driving too fast at night.", "exTr": "Babası, gece çok hızlı araç kullanmanın tehlikeleri konusunda onu azarlamaya başladı."}
],
"lens": [
  {"tr": "i. mercek, lens", "ex": "The telescope's curved lens focuses light from distant stars onto a single point.", "exTr": "Teleskobun kavisli merceği, uzak yıldızlardan gelen ışığı tek bir noktaya odaklar."},
  {"tr": "i. (mecaz) bakış açısı, pencere", "ex": "Once she moved abroad, she began to view her own culture through an entirely different lens.", "exTr": "Yurt dışına taşındıktan sonra, kendi kültürüne tamamen farklı bir bakış açısıyla bakmaya başladı."}
],
"martin": [
  {"tr": "i. kırlangıçgillerden bir kuş (ev/kum kırlangıcı)", "ex": "Ornithologists tagged a migrating martin to track its route across two continents.", "exTr": "Kuşbilimciler, iki kıta boyunca rotasını izlemek için göç eden bir kır kırlangıcını etiketledi."}
],
"mechanic": [
  {"tr": "i. tamirci, makinist", "ex": "A skilled mechanic can diagnose engine problems simply by listening to unusual sounds.", "exTr": "Usta bir tamirci, motor sorunlarını yalnızca olağandışı sesleri dinleyerek teşhis edebilir."}
],
"monkey": [
  {"tr": "i. maymun", "ex": "Researchers observed how each monkey used simple tools to crack open hard nuts.", "exTr": "Araştırmacılar, her maymunun sert kabuklu yemişleri kırmak için basit aletleri nasıl kullandığını gözlemledi."},
  {"tr": "f. kurcalamak", "ex": "The mechanic warned the young apprentice not to monkey with the engine unless he fully understood how it worked.", "exTr": "Tamirci, genç çırağı motorun nasıl çalıştığını tam olarak anlamadan onu kurcalamaması konusunda uyardı."}
],
"nice": [
  {"tr": "s. (ayrım için) ince, hassas", "ex": "The researcher drew a nice distinction between correlation and causation in her published article.", "exTr": "Araştırmacı, yayımlanan makalesinde korelasyon ile nedensellik arasında ince bir ayrım yaptı."},
  {"tr": "s. hoş, güzel, nazik", "ex": "Our neighbors have always been nice to us, often helping with groceries when we are away.", "exTr": "Komşularımız bize her zaman iyi davrandı; biz yokken sık sık alışverişimizi bile yaptılar."}
],
"noticed": [
  {"tr": "s. fark edilen, dikkat çeken", "ex": "The decline in bee populations was first noticed by local beekeepers in the early 1990s.", "exTr": "Arı popülasyonlarındaki düşüş, ilk olarak 1990'ların başında yerel arıcılar tarafından fark edildi."}
],
"offering": [
  {"tr": "i. sunulan şey, ürün", "ex": "The university expanded its course offering to include artificial intelligence and data science programs.", "exTr": "Üniversite, sunduğu ders yelpazesini yapay zekâ ve veri bilimi programlarını da içerecek şekilde genişletti."},
  {"tr": "i. adak, kurban", "ex": "Villagers placed a small offering of fruit and flowers at the temple altar each morning.", "exTr": "Köylüler her sabah tapınağın sunağına küçük bir meyve ve çiçek adağı bırakırdı."}
],
"officer": [
  {"tr": "i. memur, görevli", "ex": "A customs officer inspected every container before it was allowed to leave the port.", "exTr": "Bir gümrük memuru, limandan ayrılmasına izin verilmeden önce her konteyneri denetledi."},
  {"tr": "i. subay", "ex": "After years of distinguished service, the officer was promoted to a senior position within the army.", "exTr": "Yıllarca süren seçkin hizmetin ardından subay, ordu içinde üst düzey bir göreve terfi etti."}
],
"panel": [
  {"tr": "i. panel, kurul", "ex": "A panel of leading scientists was invited to discuss the latest findings on climate change.", "exTr": "Önde gelen bilim insanlarından oluşan bir kurul, iklim değişikliğiyle ilgili en son bulguları tartışmaya davet edildi."},
  {"tr": "f. (ahşapla) kaplamak, lambri döşemek", "ex": "The carpenters paneled the study in dark oak to match the antique furniture.", "exTr": "Marangozlar, antika mobilyalarla uyum sağlaması için çalışma odasını koyu meşeyle kapladı."}
],
"plastic": [
  {"tr": "i. plastik", "ex": "Marine biologists warn that plastic waste poses a growing threat to ocean ecosystems.", "exTr": "Deniz biyologları, plastik atığın okyanus ekosistemleri için giderek büyüyen bir tehdit oluşturduğu konusunda uyarıyor."},
  {"tr": "s. biçimlendirilebilir, esnek", "ex": "Clay remains plastic and easy to shape as long as it is kept moist.", "exTr": "Kil, nemli tutulduğu sürece biçimlendirilebilir ve kolayca şekil verilebilir hâlde kalır."}
],
"pointed": [
  {"tr": "s. iğneleyici, sivri (söz için)", "ex": "The professor made a pointed remark about the flaws in the research methodology.", "exTr": "Profesör, araştırma yönteminin kusurlarına yönelik iğneleyici bir söz söyledi."},
  {"tr": "s. sivri", "ex": "The mountain's pointed peak was visible from nearly every location in the valley below.", "exTr": "Dağın sivri zirvesi, aşağıdaki vadinin neredeyse her yerinden görülebiliyordu."}
],
"pole": [
  {"tr": "i. kutup", "ex": "Climate scientists have recorded a sharp rise in temperatures near the North Pole in recent decades.", "exTr": "İklim bilimciler, son yıllarda Kuzey Kutbu yakınında sıcaklıklarda keskin bir artış kaydetti."},
  {"tr": "i. direk, sırık", "ex": "Workers used a long wooden pole to knock the ripe fruit down from the tallest branches.", "exTr": "İşçiler, en yüksek dallardan olgun meyveleri düşürmek için uzun bir tahta direk kullandı."}
],
"possibly": [
  {"tr": "z. belki (de), olasılıkla", "ex": "Researchers suggested that the sudden climate shift was possibly caused by increased volcanic activity.", "exTr": "Araştırmacılar, ani iklim değişikliğinin belki de artan volkanik faaliyetlerden kaynaklandığını öne sürdü."}
],
"powder": [
  {"tr": "i. toz, pudra", "ex": "The dried leaves are ground into a fine powder before being used in traditional medicine.", "exTr": "Kurutulmuş yapraklar, geleneksel tıpta kullanılmadan önce ince bir toz haline getirilir."},
  {"tr": "f. toz haline getirmek", "ex": "The mill powders the dried roots before they are packaged and sold as spice.", "exTr": "Değirmen, kurutulmuş kökleri baharat olarak paketlenip satılmadan önce toz hâline getirir."}
],
"practise": [
  {"tr": "f. uygulamak, alıştırma yapmak", "ex": "Medical students must practise basic procedures repeatedly before working with real patients.", "exTr": "Tıp öğrencileri, gerçek hastalarla çalışmadan önce temel işlemleri defalarca uygulamalıdır."},
  {"tr": "f. icra etmek", "ex": "She has practised medicine in this small rural town for nearly thirty years without ever moving away.", "exTr": "Bu küçük kırsal kasabada neredeyse otuz yıldır hiç taşınmadan hekimlik icra ediyor."}
],
"preserved": [
  {"tr": "s. korunmuş, muhafaza edilmiş", "ex": "The mummy's skin remained remarkably well preserved thanks to the dry desert climate.", "exTr": "Mumyanın derisi, kuru çöl iklimi sayesinde dikkat çekici derecede iyi korunmuş halde kalmıştı."}
],
"prime": [
  {"tr": "s. baş, birincil, asıl", "ex": "The president's prime concern during the crisis was ensuring the safety of civilians in the affected region.", "exTr": "Başkanın kriz sırasındaki başlıca kaygısı, etkilenen bölgedeki sivillerin güvenliğini sağlamaktı."},
  {"tr": "s. asal (sayı için)", "ex": "Mathematicians have long searched for patterns that might predict the distribution of prime numbers.", "exTr": "Matematikçiler, asal sayıların dağılımını tahmin edebilecek örüntüleri uzun süredir araştırıyor."}
],
"primitive": [
  {"tr": "s. ilkel", "ex": "Early humans used primitive stone tools to hunt animals and prepare their food.", "exTr": "İlk insanlar, hayvan avlamak ve yiyeceklerini hazırlamak için ilkel taş aletler kullandı."},
  {"tr": "i. ilkel insan", "ex": "The anthropologist argued that calling early humans primitives underestimates the sophistication of their tools.", "exTr": "Antropolog, ilk insanlara ilkeller demenin aletlerinin gelişmişliğini hafife almak olduğunu savundu."}
],
"proportion": [
  {"tr": "i. oran, orantı; pay, kısım", "ex": "A large proportion of the world's fresh water is stored in polar ice sheets.", "exTr": "Dünyadaki tatlı suyun büyük bir bölümü kutup buz tabakalarında depolanmıştır."},
  {"tr": "f. orantılamak", "ex": "The engineer proportioned the bridge's support beams carefully to distribute weight evenly across the structure.", "exTr": "Mühendis, ağırlığı yapı boyunca eşit dağıtmak için köprünün taşıyıcı kirişlerini dikkatle orantılamıştı."}
],
"protecting": [
  {"tr": "s. koruyan, koruyucu", "ex": "New laws protecting endangered species came into force across the region last year.", "exTr": "Nesli tükenmekte olan türleri koruyan yeni yasalar, geçen yıl bölge genelinde yürürlüğe girdi."}
],
"quantum": [
  {"tr": "i. kuantum", "ex": "Physicists use quantum theory to explain the strange behavior of particles at subatomic scales.", "exTr": "Fizikçiler, parçacıkların atom altı ölçeklerdeki tuhaf davranışlarını açıklamak için kuantum kuramını kullanır."},
  {"tr": "i. miktar, nicelik, ölçü", "ex": "The reforms represented a significant quantum of change in how the agency handled public complaints.", "exTr": "Reformlar, kurumun kamu şikâyetlerini ele alış biçiminde kayda değer miktarda bir değişimi temsil ediyordu."}
],
"rational": [
  {"tr": "s. akılcı, mantıklı", "ex": "Economists assume that consumers make rational decisions based on price and quality.", "exTr": "Ekonomistler, tüketicilerin fiyat ve kaliteye dayalı akılcı kararlar verdiğini varsayar."},
  {"tr": "s./i. rasyonel; rasyonel sayı", "ex": "Every rational number can be expressed as a fraction of two integers.", "exTr": "Her rasyonel sayı, iki tam sayının kesri olarak ifade edilebilir."}
],
"reducing": [
  {"tr": "i. azaltma", "ex": "Reducing plastic waste has become a major priority for environmental organizations worldwide.", "exTr": "Plastik atığın azaltılması, dünya çapındaki çevre örgütleri için önemli bir öncelik haline geldi."},
  {"tr": "i. zayıflama, kilo verme (diyetle)", "ex": "After the holidays, she followed a strict reducing diet recommended by her physician.", "exTr": "Tatilden sonra, doktorunun önerdiği sıkı bir zayıflama diyeti uyguladı."}
],
"representative": [
  {"tr": "i. temsilci, vekil", "ex": "A company representative explained the new safety procedures to all factory employees yesterday.", "exTr": "Bir şirket temsilcisi, dün tüm fabrika çalışanlarına yeni güvenlik prosedürlerini açıkladı."},
  {"tr": "s. temsili, tipik (bir grubu yansıtan)", "ex": "The survey results were considered representative of public opinion across the entire country.", "exTr": "Anket sonuçlarının, ülke genelindeki kamuoyunu temsil edici biçimde yansıttığı kabul edildi."}
],
"reserve": [
  {"tr": "i. rezerv, yedek", "ex": "Conservationists established a nature reserve to protect the region's declining bird population.", "exTr": "Doğa koruyucuları, bölgenin azalan kuş popülasyonunu korumak için bir doğa rezervi kurdu."},
  {"tr": "f. ayırmak, saklamak", "ex": "Concert-goers are advised to reserve their seats online at least a week in advance.", "exTr": "Konsere gideceklere, yerlerini en az bir hafta önceden çevrim içi ayırtmaları öneriliyor."}
],
"residual": [
  {"tr": "s. artakalan, kalıntı halinde", "ex": "After the treatment, residual chemicals in the soil continued to affect plant growth for years.", "exTr": "Tedaviden sonra topraktaki artakalan kimyasallar yıllarca bitki büyümesini etkilemeye devam etti."},
  {"tr": "i. (istatistik) artık değer; kalıntı", "ex": "Statisticians examine each residual to check how well the model fits the observed data.", "exTr": "İstatistikçiler, modelin gözlenen veriye ne kadar iyi oturduğunu görmek için her artık değeri inceler."}
],
"rid": [
  {"tr": "f. (-den) kurtarmak, arındırmak", "ex": "The hospital introduced new cleaning protocols to rid the ward of persistent bacteria.", "exTr": "Hastane, koğuşu inatçı bakterilerden kurtarmak için yeni temizlik protokolleri getirdi."}
],
"roman": [
  {"tr": "s. Roma'ya ait", "ex": "Archaeologists uncovered several Roman coins buried beneath the ancient city ruins.", "exTr": "Arkeologlar, antik şehir kalıntılarının altında gömülü birkaç Roma'ya ait sikke buldu."},
  {"tr": "i. dik yazı karakteri (italik olmayan)", "ex": "Most academic journals require manuscripts to be typed in roman rather than italic script.", "exTr": "Çoğu akademik dergi, makalelerin italik yerine dik yazı karakteriyle yazılmasını şart koşar."}
],
"satisfaction": [
  {"tr": "i. memnuniyet, tatmin", "ex": "Employee satisfaction tends to improve significantly when workers are given greater flexibility over their schedules.", "exTr": "Çalışanlara programları üzerinde daha fazla esneklik tanındığında, çalışan memnuniyeti genellikle belirgin biçimde artar."},
  {"tr": "i. (hukuk) tazmin, giderim", "ex": "The court ordered the company to pay damages in full satisfaction of the claim.", "exTr": "Mahkeme, şirketin talebi tamamen karşılayacak biçimde tazminat ödemesine karar verdi."}
],
"seeing": [
  {"tr": "i. görme", "ex": "Seeing is often considered the most dominant of the five human senses.", "exTr": "Görme, genellikle beş insan duyusunun en baskını olarak kabul edilir."},
  {"tr": "s. görebilen, gören (kör olmayan)", "ex": "Guide dogs allow blind people to move through busy streets as confidently as seeing pedestrians.", "exTr": "Rehber köpekler, görme engellilerin kalabalık sokaklarda gören yayalar kadar özgüvenle ilerlemesini sağlar."}
],
"seeking": [
  {"tr": "i. arayış, arama", "ex": "The relentless seeking of short-term profit can blind companies to long-term risks.", "exTr": "Amansız kısa vadeli kâr arayışı, şirketleri uzun vadeli risklere karşı körleştirebilir."}
],
"similarly": [
  {"tr": "z. benzer şekilde", "ex": "Coral reefs and rainforests are similarly vulnerable to the effects of rising global temperatures.", "exTr": "Mercan resifleri ve yağmur ormanları, yükselen küresel sıcaklıkların etkilerine karşı benzer şekilde savunmasızdır."}
],
"sold": [
  {"tr": "s. satılmış", "ex": "All the sold items were shipped to customers the following morning.", "exTr": "Satılmış ürünlerin tümü ertesi sabah müşterilere gönderildi."},
  {"tr": "s. (sold on) ikna olmuş, hayran", "ex": "After the presentation, the entire board was completely sold on the new marketing strategy.", "exTr": "Sunumdan sonra, yönetim kurulunun tamamı yeni pazarlama stratejisine tamamen ikna olmuştu."}
],
"soldier": [
  {"tr": "i. asker", "ex": "During the harsh winter campaign, many soldiers suffered from frostbite and exhaustion.", "exTr": "Zorlu kış seferi sırasında, birçok asker donma ve bitkinlikten muzdarip oldu."}
],
"speaking": [
  {"tr": "i. konuşma", "ex": "Public speaking courses help students build confidence and express their ideas clearly in academic settings.", "exTr": "Topluluk önünde konuşma dersleri, öğrencilerin özgüven kazanmasına ve akademik ortamlarda fikirlerini açıkça ifade etmesine yardımcı olur."},
  {"tr": "s. konuşan", "ex": "English-speaking employees were asked to help translate documents for the newly arrived refugees.", "exTr": "İngilizce konuşan çalışanlardan, yeni gelen mültecilerin belgelerini çevirmelerine yardımcı olmaları istendi."}
],
"starting": [
  {"tr": "s. başlangıçtaki, ilk", "ex": "Researchers emphasized that the starting point of the experiment determined the reliability of subsequent measurements.", "exTr": "Araştırmacılar, deneyin başlangıç noktasının sonraki ölçümlerin güvenilirliğini belirlediğini vurguladı."},
  {"tr": "i. başlama, başlangıç", "ex": "The starting of heavy machinery without proper safety checks violates the plant's regulations.", "exTr": "Ağır makinelerin gerekli güvenlik kontrolleri yapılmadan çalıştırılması, tesisin yönetmeliklerini ihlal eder."}
],
"station": [
  {"tr": "i. istasyon", "ex": "Passengers waited patiently at the train station for the delayed express service to arrive.", "exTr": "Yolcular, gecikmeli ekspres seferin gelmesini tren istasyonunda sabırla bekledi."},
  {"tr": "f. konuşlandırmak, yerleştirmek", "ex": "Soldiers were stationed near the border to monitor movement across the frontier.", "exTr": "Sınırdan geçişleri izlemek için askerler sınıra yakın bir yere konuşlandırıldı."}
],
"stopped": [
  {"tr": "s. durmuş, durdurulmuş", "ex": "Investigators examined the stopped clock in the victim's apartment, hoping it might reveal the exact time of the incident.", "exTr": "Dedektifler, olayın tam saatini ortaya çıkarabileceğini umarak kurbanın dairesindeki durmuş saati inceledi."},
  {"tr": "s. (burun için) tıkalı", "ex": "Doctors advised the patient to use a saline spray for his stopped-up nose caused by seasonal allergies.", "exTr": "Doktorlar, mevsimsel alerjilerden kaynaklanan tıkalı burnu için hastaya salin sprey kullanmasını önerdi."}
],
"stressful": [
  {"tr": "s. stresli, gerginlik yaratan", "ex": "Working long hours without adequate rest can make daily life increasingly stressful for employees.", "exTr": "Yeterli dinlenme olmadan uzun saatler çalışmak, çalışanlar için günlük hayatı giderek daha stresli hâle getirebilir."}
],
"suddenly": [
  {"tr": "z. aniden, birden", "ex": "The volcano, dormant for centuries, suddenly erupted and forced thousands of residents to evacuate.", "exTr": "Yüzyıllardır uykuda olan yanardağ aniden patladı ve binlerce sakini tahliyeye zorladı."}
],
"supervision": [
  {"tr": "i. denetim, gözetim, nezaret", "ex": "Junior surgeons are required to perform their first operations under close supervision from senior staff.", "exTr": "Genç cerrahların ilk ameliyatlarını kıdemli personelin sıkı gözetimi altında gerçekleştirmesi zorunludur."}
],
"sustained": [
  {"tr": "s. sürekli, sürdürülen, uzun süreli", "ex": "Economists agree that sustained economic growth requires consistent investment in education and infrastructure.", "exTr": "Ekonomistler, sürekli ekonomik büyümenin eğitim ve altyapıya istikrarlı yatırım gerektirdiği konusunda hemfikir."}
],
"take-up": [
  {"tr": "i. talep, katılım oranı", "ex": "Public health officials were disappointed by the low take-up of the free vaccination program.", "exTr": "Halk sağlığı yetkilileri, ücretsiz aşı programına yönelik düşük katılım oranından hayal kırıklığına uğradı."}
],
"technically": [
  {"tr": "z. teknik olarak", "ex": "The chemical is technically classified as safe, although prolonged exposure may still cause mild skin irritation.", "exTr": "Kimyasal madde teknik olarak güvenli sınıfına girse de uzun süre maruz kalmak yine de hafif cilt tahrişine yol açabilir."},
  {"tr": "z. resmen, kâğıt üzerinde, kural olarak", "ex": "Technically, the museum is open on public holidays, but most departments remain closed for maintenance.", "exTr": "Kâğıt üzerinde müze resmi tatillerde açık olsa da çoğu bölüm bakım nedeniyle kapalı kalıyor."}
],
"tested": [
  {"tr": "s. denenmiş, test edilmiş; güvenilir", "ex": "Doctors prefer tested and reliable treatments over experimental ones for most patients.", "exTr": "Doktorlar çoğu hasta için deneysel tedaviler yerine denenmiş ve güvenilir tedavileri tercih eder."}
],
"till": [
  {"tr": "f. (toprağı) sürmek, işlemek", "ex": "Farmers still till the soil by hand in several remote mountain villages during early spring.", "exTr": "Birçok uzak dağ köyünde çiftçiler, ilkbaharın başlarında toprağı hâlâ elle sürüyor."},
  {"tr": "i. yazar kasa, kasa çekmecesi", "ex": "The cashier quickly checked the till before closing the shop for the night.", "exTr": "Kasiyer, dükkânı gece için kapatmadan önce yazar kasayı hızlıca kontrol etti."}
],
"turned": [
  {"tr": "s. dönmüş, dönük", "ex": "The old photograph showed a man standing with his back turned toward the camera.", "exTr": "Eski fotoğraf, sırtı kameraya dönük duran bir adamı gösteriyordu."},
  {"tr": "s. (besin için) bozulmuş, ekşimiş", "ex": "The chef discarded the turned cream before it could spoil the rest of the dessert.", "exTr": "Şef, ekşimiş kremayı tatlının geri kalanını bozmasına fırsat vermeden çöpe attı."}
],
"turning": [
  {"tr": "i. (turning point) dönüm noktası", "ex": "Historians often describe the invention of the printing press as a major turning point in human history.", "exTr": "Tarihçiler, matbaanın icadını genellikle insanlık tarihinde önemli bir dönüm noktası olarak tanımlar."},
  {"tr": "i. sapak, dönülecek yol", "ex": "Take the second turning on the left after the old stone bridge.", "exTr": "Eski taş köprüden sonra soldan ikinci sapağa girin."}
],
"upper": [
  {"tr": "s. üst, yukarı(daki)", "ex": "Doctors recommended physical therapy to strengthen the muscles in her upper back and shoulders.", "exTr": "Doktorlar, sırtının üst kısmındaki ve omuzlarındaki kasları güçlendirmek için fizik tedavi önerdi."},
  {"tr": "i. üst kuşet/ranza", "ex": "He booked an upper on the night train to save the cost of a hotel room.", "exTr": "Otel masrafından kurtulmak için gece treninde üst kuşet ayırttı."}
],
"upset": [
  {"tr": "s. üzgün, canı sıkkın", "ex": "She felt deeply upset after learning that her research grant had been unexpectedly cancelled.", "exTr": "Araştırma bursunun beklenmedik biçimde iptal edildiğini öğrenince derinden üzüldü."},
  {"tr": "i. sürpriz sonuç/yenilgi; rahatsızlık", "ex": "The underdog's victory over the defending champions was one of the biggest upsets in tournament history.", "exTr": "Zayıf görülen takımın son şampiyonu yenmesi, turnuva tarihinin en büyük sürpriz sonuçlarından biriydi."}
],
"walking": [
  {"tr": "s. (within walking distance) yürüme mesafesinde", "ex": "The new hospital is within walking distance of both the train station and the university.", "exTr": "Yeni hastane, hem tren istasyonuna hem üniversiteye yürüme mesafesinde bulunuyor."},
  {"tr": "i. yürüyüş, yaya gitme", "ex": "Doctors recommend thirty minutes of brisk walking every day to improve cardiovascular health.", "exTr": "Doktorlar, kalp sağlığını iyileştirmek için her gün otuz dakika tempolu yürüyüş yapılmasını öneriyor."}
],
"waters": [
  {"tr": "i. (bir bölgeye ait) sular, deniz; karasuları", "ex": "Overfishing in international waters has pushed several tuna species close to extinction.", "exTr": "Uluslararası sularda aşırı avlanma, birkaç ton balığı türünü yok olmanın eşiğine getirdi."},
  {"tr": "i. sular", "ex": "The calm waters of the lake reflected the mountains so perfectly that photographers rushed to capture the scene.", "exTr": "Gölün durgun suları, dağları o kadar mükemmel yansıtıyordu ki fotoğrafçılar sahneyi yakalamak için koştu."}
],
"witness": [
  {"tr": "f. tanık olmak, şahit olmak", "ex": "Several residents claimed to have witnessed unusual seismic activity in the days before the eruption.", "exTr": "Birkaç bölge sakini, patlamadan önceki günlerde olağandışı sismik hareketlilik gördüklerini iddia etti."},
  {"tr": "i. tanık, şahit", "ex": "The prosecutor asked the witness to describe exactly what she had seen on the night of the crime.", "exTr": "Savcı, tanıktan suç gecesi tam olarak ne gördüğünü anlatmasını istedi."}
],
"year-old": [
  {"tr": "s. (bileşik) ...yaşındaki, ...yaşında", "ex": "Archaeologists carefully excavated a two-thousand-year-old pottery vessel from beneath the ancient marketplace.", "exTr": "Arkeologlar, antik pazar yerinin altından iki bin yıllık bir çömlek kabını özenle çıkardı."}
],
"yesterday": [
  {"tr": "z. dün", "ex": "Scientists announced yesterday that a new species of frog had been discovered in the rainforest.", "exTr": "Bilim insanları dün, yağmur ormanında yeni bir kurbağa türünün keşfedildiğini duyurdu."},
  {"tr": "i. geçmiş, dün (mecazi)", "ex": "Memories of all our yesterdays quietly shape the way we imagine the future.", "exTr": "Bütün dünlerimizin anıları, geleceği hayal etme biçimimizi sessizce şekillendirir."}
]
};
