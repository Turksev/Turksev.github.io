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
  {"tr": "i. hayal, fantezi", "ex": "Psychologists argue that occasional fantasy about an ideal future helps adults endure the monotony of demanding office routines.", "exTr": "Psikologlar, ideal bir gelecek üzerine ara sıra kurulan hayalin, yetişkinlerin zorlu ofis rutinlerinin tekdüzeliğine katlanmasına yardımcı olduğunu savunuyor."}
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
  {"tr": "i. çakmak", "ex": "Airport security officers routinely confiscate any lighter found in checked baggage, since the fuel it contains may ignite inside a sealed cargo hold.", "exTr": "Havaalanı güvenlik görevlileri, içindeki yakıt kapalı bir kargo bölmesinde tutuşabileceği için kayıtlı bagajda bulunan her çakmağa rutin olarak el koyar."}
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
  {"tr": "i. gülüş, kahkaha", "ex": "Her warm laugh could be heard from across the room, instantly putting nervous new employees at ease.", "exTr": "Onun sıcak kahkahası odanın öbür ucundan bile duyulabiliyordu ve gergin yeni çalışanları anında rahatlatıyordu."}
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
],

/* --- 26.08.2026 tam anlam taramasi, parti 3 (k5): 108 bulgudan
   suzulen duzeltmeler. Silinen zayif/uydurma anlamlar: herbal i.,
   inflammation "ofkelenme", opponent s., recession "girinti",
   stupid i., witch f. Gerisi ceviri/ornek/etiket duzeltmesi. --- */
"abortion": [
  {"tr": "i. kürtaj; başarısız/yarıda kalmış girişim", "ex": "The clinic offers counseling services to women considering an abortion for medical reasons.", "exTr": "Klinik, tıbbi nedenlerle kürtaj düşünen kadınlara danışmanlık hizmeti sunuyor."}
],
"absorption": [
  {"tr": "i. emilim, soğurma", "ex": "The study measured how quickly the body's absorption of the vitamin changed with age.", "exTr": "Çalışma, vücudun vitamin emiliminin yaşla birlikte ne kadar hızlı değiştiğini ölçtü."},
  {"tr": "i. kendini verme, dalma (bir işe)", "ex": "Her complete absorption in the research project meant she often forgot to eat lunch.", "exTr": "Araştırma projesine tam anlamıyla kendini vermesi, çoğu zaman öğle yemeğini unutmasına neden oluyordu."}
],
"addict": [
  {"tr": "i. bağımlı", "ex": "Support groups help people who have become addicts recover through structured counseling programs.", "exTr": "Destek grupları, bağımlı hâline gelen kişilerin yapılandırılmış danışmanlık programları aracılığıyla iyileşmesine yardımcı olur."},
  {"tr": "f. bağımlı yapmak/olmak", "ex": "Doctors warned that patients could become addicted to the medication if it was taken for too long.", "exTr": "Doktorlar, ilacın çok uzun süre kullanılması hâlinde hastaların ona bağımlı hâle gelebileceği konusunda uyardı."}
],
"alexander": [
  {"tr": "i. bir tür kereviz benzeri bitki", "ex": "Foragers sometimes gather wild alexanders along the coastline and cook its stems like celery.", "exTr": "Yiyecek toplayıcıları, bazen kıyı boyunca yabani alexanders otu toplar ve sapını kereviz gibi pişirir."}
],
"ambiguous": [
  {"tr": "s. belirsiz, muğlak, çift anlamlı", "ex": "The committee revised the contract's wording after lawyers flagged several ambiguous clauses within it.", "exTr": "Komite, avukatlar sözleşmedeki birkaç belirsiz maddeyi işaretledikten sonra sözleşmenin ifadesini yeniden düzenledi."}
],
"anticipated": [
  {"tr": "s. beklenen, umulan", "ex": "The anticipated rise in fuel prices worried commuters across the capital.", "exTr": "Beklenen yakıt zammı, başkentteki yolcuları endişelendirdi."}
],
"appoint": [
  {"tr": "f. atamak; görevlendirmek", "ex": "The board decided to appoint a new director to oversee the hospital's research programs.", "exTr": "Yönetim kurulu, hastanenin araştırma programlarını denetlemesi için yeni bir direktör atamaya karar verdi."},
  {"tr": "f. donatmak (bir mekanı)", "ex": "The lobby was elegantly appointed with antique furniture and soft, ambient lighting.", "exTr": "Lobi, antika mobilyalar ve yumuşak bir ortam aydınlatmasıyla zarif biçimde donatılmıştı."}
],
"arguably": [
  {"tr": "z. denilebilir ki, belki de, savunulabilir biçimde", "ex": "This discovery is arguably the most significant breakthrough in cancer research this decade.", "exTr": "Bu keşif, bu on yılın kanser araştırmalarındaki belki de en önemli atılımdır."}
],
"arrest": [
  {"tr": "i. tutuklama; f. tutuklamak", "ex": "Police carried out a dramatic arrest of the suspect after weeks of surveillance.", "exTr": "Polis, haftalarca süren gözetimin ardından şüpheliyi çarpıcı bir operasyonla tutukladı."},
  {"tr": "f. durdurmak, yavaşlatmak (bir süreci)", "ex": "New regulations were introduced to arrest the rapid decline of the region's fish population.", "exTr": "Bölgedeki balık popülasyonunun hızlı düşüşünü durdurmak için yeni düzenlemeler getirildi."}
],
"assimilation": [
  {"tr": "i. asimilasyon; (kültürel) benzeşme, uyum sağlama", "ex": "Government policies encouraged the rapid assimilation of immigrant communities into mainstream cultural life.", "exTr": "Hükümet politikaları, göçmen toplulukların ana kültürel yaşama hızla asimile olmasını teşvik etti."},
  {"tr": "i. (biyoloji) özümseme, özümleme", "ex": "After digestion, assimilation allows nutrients to pass from the intestines into the bloodstream.", "exTr": "Sindirimden sonra özümleme, besinlerin bağırsaklardan kan dolaşımına geçmesini sağlar."}
],
"bankrupt": [
  {"tr": "s. iflas etmiş", "ex": "The airline was declared bankrupt after failing to recover from years of financial losses.", "exTr": "Havayolu şirketinin, yıllarca süren mali kayıplardan kurtulamayınca iflası ilan edildi."},
  {"tr": "f. iflas ettirmek", "ex": "Analysts warned that the lawsuit alone could bankrupt the small manufacturing company within months.", "exTr": "Analistler, tek başına bu davanın küçük üretim şirketini birkaç ay içinde iflas ettirebileceği konusunda uyardı."}
],
"barbecue": [
  {"tr": "i. mangal", "ex": "The family organized a barbecue in the garden to celebrate the end of the harvest.", "exTr": "Aile, hasadın sonunu kutlamak için bahçede bir mangal düzenledi."},
  {"tr": "f. mangalda pişirmek", "ex": "Every summer, the neighbors gather in the backyard to barbecue fresh vegetables and chicken.", "exTr": "Her yaz, komşular arka bahçede taze sebzeleri ve tavuğu mangalda pişirmek için bir araya gelir."}
],
"barrel": [
  {"tr": "i. varil, fıçı", "ex": "Global oil prices fluctuate whenever the price per barrel changes significantly across major exporting nations.", "exTr": "Küresel petrol fiyatları, büyük ihracatçı ülkelerde varil başına fiyat önemli ölçüde değiştiğinde dalgalanır."},
  {"tr": "f. varile koymak", "ex": "Workers at the winery barrel the fresh grape juice before storing it in the cool underground cellar.", "exTr": "Şarap fabrikasındaki işçiler, serin yeraltı mahzeninde depolamadan önce taze üzüm suyunu varile koyar."}
],
"binary": [
  {"tr": "s. ikili, ikilik", "ex": "Computers process information using a binary system composed entirely of zeros and ones.", "exTr": "Bilgisayarlar, tamamen sıfır ve birlerden oluşan ikili bir sistemle bilgi işler."},
  {"tr": "i. ikili sistem", "ex": "Programmers must understand how binary works before writing efficient low-level code.", "exTr": "Programcılar, verimli düşük seviyeli kod yazmadan önce ikili sistemin nasıl çalıştığını anlamalıdır."}
],
"bloom": [
  {"tr": "f. çiçek açmak, çiçeklenmek", "ex": "Cherry trees bloom several weeks earlier now than they did in the middle of the last century.", "exTr": "Kiraz ağaçları artık geçen yüzyılın ortalarına kıyasla birkaç hafta erken çiçek açıyor."},
  {"tr": "i. en parlak dönem, doruk nokta", "ex": "Critics agree that the composer's talent reached full bloom during his final decade.", "exTr": "Eleştirmenler, bestecinin yeteneğinin son on yılında tam olgunluğuna eriştiği konusunda hemfikir."}
],
"butter": [
  {"tr": "i. tereyağı; f. tereyağı sürmek", "ex": "Nutritionists recommend replacing butter with olive oil to reduce saturated fat in the diet.", "exTr": "Beslenme uzmanları, diyetteki doymuş yağı azaltmak için tereyağının yerine zeytinyağı kullanılmasını önerir."},
  {"tr": "f. (butter up) yağ çekmek, pohpohlamak", "ex": "Employees often butter up their supervisor before requesting time off during the busy season.", "exTr": "Çalışanlar, yoğun sezonda izin istemeden önce genellikle amirlerine yağ çeker."}
],
"by-product": [
  {"tr": "i. yan ürün", "ex": "Improved public trust turned out to be an unexpected by-product of the transparency reforms.", "exTr": "Artan kamu güveninin, şeffaflık reformlarının beklenmedik bir yan ürünü olduğu ortaya çıktı."}
],
"chemist": [
  {"tr": "i. kimyager", "ex": "The chemist analyzed the water samples to determine whether they contained harmful industrial pollutants.", "exTr": "Kimyager, zararlı endüstriyel kirleticiler içerip içermediğini belirlemek için su örneklerini analiz etti."},
  {"tr": "i. eczane, eczacı (İngiliz İng.)", "ex": "She stopped at the local chemist to pick up a prescription before it closed for the evening.", "exTr": "Akşam eczane kapanmadan önce reçetesini almak için semtteki eczacıya uğradı."}
],
"chip": [
  {"tr": "i. yonga, parça, çip", "ex": "Engineers embedded a tiny silicon chip capable of processing enormous amounts of data instantly.", "exTr": "Mühendisler, muazzam miktarda veriyi anında işleyebilen minik bir silikon çip yerleştirdi."},
  {"tr": "f. yontmak, kırmak", "ex": "Movers accidentally let the heavy cabinet chip the antique wooden table as they carried it downstairs.", "exTr": "Nakliyeciler, ağır dolabı taşırken yanlışlıkla dolabın antika ahşap masayı çentmesine yol açtı."}
],
"city-state": [
  {"tr": "i. şehir devleti", "ex": "Ancient Athens functioned as an independent city-state long before modern nations emerged.", "exTr": "Antik Atina, modern uluslar ortaya çıkmadan çok önce bağımsız bir şehir devleti olarak işlev gördü."}
],
"congruent": [
  {"tr": "s. uyumlu, örtüşen; (geometri) eş", "ex": "The two triangles were proven congruent because their corresponding sides had equal lengths.", "exTr": "İki üçgenin karşılık gelen kenarları eşit uzunlukta olduğundan, eş oldukları kanıtlandı."}
],
"contributor": [
  {"tr": "i. katkıda bulunan kişi/etken; bağışçı", "ex": "Air pollution remains a major contributor to respiratory illness in densely populated cities.", "exTr": "Hava kirliliği, yoğun nüfuslu şehirlerde solunum yolu hastalıklarına önemli bir katkıda bulunan etken olmaya devam ediyor."}
],
"cord": [
  {"tr": "i. kordon, ip, kablo", "ex": "Technicians checked every cord in the laboratory to ensure the equipment was properly grounded.", "exTr": "Teknisyenler, ekipmanın düzgün topraklandığından emin olmak için laboratuvardaki her kabloyu kontrol etti."},
  {"tr": "f. (odunu) istiflemek", "ex": "Local farmers would cord the firewood neatly before storing it for the long winter months.", "exTr": "Yerel çiftçiler, uzun kış aylarına saklamadan önce odunu düzenli biçimde istifleyip bağlardı."}
],
"credited": [
  {"tr": "s. itibar edilen, adına yazılan, kredilendirilmiş", "ex": "The scientist was widely credited with discovering a new method for treating antibiotic-resistant infections.", "exTr": "Bilim insanı, antibiyotiğe dirençli enfeksiyonları tedavi eden yeni bir yöntemin kâşifi olarak geniş çapta kabul edildi."}
],
"dare": [
  {"tr": "f. cesaret etmek, göze almak", "ex": "Few employees dared to question the manager's controversial decision during the meeting.", "exTr": "Toplantı sırasında çok az çalışan, yöneticinin tartışmalı kararını sorgulamaya cesaret etti."},
  {"tr": "i. meydan okuma, cüret isteyen iş", "ex": "Climbing the icy cliff without ropes was seen as the ultimate dare among the young adventurers.", "exTr": "Halatsız buzlu kayalığa tırmanmak, genç maceraperestler arasında en büyük meydan okuma olarak görülüyordu."}
],
"daydream": [
  {"tr": "f. hayal kurmak, dalıp gitmek", "ex": "During long lectures, many students tend to daydream instead of focusing on the material.", "exTr": "Uzun derslerde birçok öğrenci, konuya odaklanmak yerine hayal kurma eğilimindedir."},
  {"tr": "i. hayal, hayal kurma", "ex": "Lost in a daydream, she barely noticed the teacher calling her name during class.", "exTr": "Bir hayale dalmış hâlde, öğretmenin kendisine adıyla seslendiğini neredeyse fark etmedi."}
],
"descendent": [
  {"tr": "i. torun; soyundan gelen kimse", "ex": "Researchers interviewed a direct descendent of the ship's original captain to learn about the wreck.", "exTr": "Araştırmacılar, batık hakkında bilgi edinmek için geminin ilk kaptanının doğrudan soyundan gelen biriyle görüştü."},
  {"tr": "s. aşağı inen, inişte olan", "ex": "In the old anatomical text, the descendent branch of the artery was illustrated with careful shading.", "exTr": "Eski anatomi metninde, atardamarın aşağı inen dalı özenli gölgelendirmeyle gösterilmişti."}
],
"dive": [
  {"tr": "i. dalış; f. dalmak", "ex": "The professional swimmer practiced a difficult dive from the ten-meter platform every morning.", "exTr": "Profesyonel yüzücü, her sabah on metrelik platformdan zor bir dalış çalıştı."},
  {"tr": "i. (argo) adi bar, bakımsız eğlence mekânı", "ex": "They ended up in a shabby dive near the harbor, drinking cheap beer until midnight.", "exTr": "Gece yarısına kadar ucuz bira içerek kendilerini limana yakın köhne bir barda buldular."}
],
"dump": [
  {"tr": "f. boşaltmak, dökmek", "ex": "Local authorities fined the company for dumping waste directly into the river at night.", "exTr": "Yerel yetkililer, geceleri atığı doğrudan nehre boşalttığı için şirkete para cezası kesti."},
  {"tr": "i. çöplük", "ex": "Local residents complained about the smell coming from the illegal dump near the riverbank.", "exTr": "Yerel sakinler, nehir kıyısı yakınındaki yasa dışı çöplükten gelen kokudan şikayet etti."}
],
"entering": [
  {"tr": "i. girme, giriş yapma", "ex": "Entering the country without a valid visa is illegal in most parts of the world.", "exTr": "Bir ülkeye geçerli vize olmadan girmek, dünyanın çoğu yerinde yasa dışıdır."}
],
"face-lift": [
  {"tr": "f. (mecazi) yenilemek, cephesini değiştirmek", "ex": "The city council decided to face-lift the old shopping district by repainting buildings and adding new lighting.", "exTr": "Belediye meclisi, binaları yeniden boyayıp yeni aydınlatmalar ekleyerek eski alışveriş bölgesini yenilemeye karar verdi."},
  {"tr": "f. yüz germe ameliyatı yapmak", "ex": "Cosmetic surgeons often perform face-lifts on patients who hope to reduce visible signs of aging.", "exTr": "Estetik cerrahlar, görünür yaşlanma belirtilerini azaltmak isteyen hastalara sık sık yüz germe uygular."}
],
"formulate": [
  {"tr": "f. formüle etmek, oluşturmak, dile getirmek", "ex": "Scientists need reliable data before they can formulate an accurate hypothesis about the outbreak.", "exTr": "Bilim insanları, salgınla ilgili doğru bir hipotez oluşturabilmek için güvenilir verilere ihtiyaç duyar."}
],
"graphic": [
  {"tr": "s. çarpıcı, canlı (anlatım)", "ex": "The report gave a graphic account of the conditions inside the overcrowded refugee camps.", "exTr": "Rapor, aşırı kalabalık mülteci kamplarındaki koşulların çarpıcı bir anlatımını sundu."},
  {"tr": "i. grafik (çizelge, şekil)", "ex": "The report included a graphic showing how carbon emissions have changed over the past fifty years.", "exTr": "Rapor, son elli yılda karbon emisyonlarının nasıl değiştiğini gösteren bir grafik içeriyordu."}
],
"handed-down": [
  {"tr": "s. nesilden nesile aktarılan, miras kalan", "ex": "The recipe was a handed-down tradition, passed carefully from grandmother to granddaughter for generations.", "exTr": "Tarif, nesilden nesile aktarılan bir gelenekti; büyükanneden toruna özenle iletilmişti."}
],
"herbal": [
  {"tr": "s. bitkisel", "ex": "Many traditional cultures relied on herbal remedies long before modern pharmaceuticals were developed.", "exTr": "Birçok geleneksel kültür, modern ilaçlar geliştirilmeden çok önce bitkisel tedavilere güveniyordu."}
],
"humanities": [
  {"tr": "i. beşeri bilimler, insani bilimler", "ex": "The university reduced funding for the humanities while expanding its engineering departments significantly.", "exTr": "Üniversite, mühendislik bölümlerini önemli ölçüde genişletirken beşeri bilimlere ayrılan fonu azalttı."}
],
"imperial": [
  {"tr": "s. imparatorluğa ait, emperyal", "ex": "The Roman Empire left behind an imperial legacy that still influences modern law and architecture.", "exTr": "Roma İmparatorluğu, modern hukuku ve mimariyi hâlâ etkileyen emperyal bir miras bıraktı."},
  {"tr": "s. İngiliz ölçü sistemine ait (imperial units)", "ex": "Older British recipes often list ingredients in imperial units such as pints and ounces.", "exTr": "Eski İngiliz tarifleri genellikle malzemeleri pint ve ons gibi imparatorluk ölçü birimleriyle listeler."}
],
"in-box": [
  {"tr": "i. gelen kutusu", "ex": "She found dozens of unread messages waiting in her in-box after the vacation.", "exTr": "Tatilden sonra gelen kutusunda kendisini bekleyen onlarca okunmamış mesaj buldu."}
],
"inflammation": [
  {"tr": "i. iltihap, yangı", "ex": "Chronic inflammation has been linked by researchers to several long-term cardiovascular diseases.", "exTr": "Araştırmacılar, kronik iltihabı çeşitli uzun vadeli kalp-damar hastalıklarıyla ilişkilendirdi."}
],
"ivory": [
  {"tr": "i. fildişi; fildişi rengi", "ex": "The carving was made from ivory that traders had brought from distant regions.", "exTr": "Oyma eser, tüccarların uzak bölgelerden getirdiği fildişinden yapılmıştı."}
],
"keeper": [
  {"tr": "i. bakıcı, koruyucu, gözetici", "ex": "The zoo hired an experienced keeper to look after the newly arrived elephants.", "exTr": "Hayvanat bahçesi, yeni gelen fillere bakmak için deneyimli bir bakıcı işe aldı."}
],
"ladder": [
  {"tr": "i. merdiven", "ex": "Workers used a tall ladder to reach the damaged section of the building's roof.", "exTr": "İşçiler, binanın çatısının hasarlı bölümüne ulaşmak için uzun bir merdiven kullandı."},
  {"tr": "f. (çorapta) kaçmak", "ex": "Her tights began to ladder the moment they snagged on the edge of the chair.", "exTr": "Sandalyenin kenarına takıldığı anda külotlu çorabı kaçmaya başladı."}
],
"lure": [
  {"tr": "i. çekicilik, cazibe; f. cezbetmek, ayartmak", "ex": "Advertisers often use bright colors and catchy slogans to lure customers into buying new products.", "exTr": "Reklamcılar, müşterileri yeni ürünler satın almaya cezbetmek için sık sık parlak renkler ve akılda kalıcı sloganlar kullanır."},
  {"tr": "i. yapay yem (balıkçılıkta)", "ex": "Fishermen switched to a brightly colored lure after noticing that fish ignored the plain hook.", "exTr": "Balıkçılar, balıkların sade oltaya ilgi göstermediğini fark edince parlak renkli bir yapay yeme geçti."}
],
"machinery": [
  {"tr": "i. makineler, makine donanımı", "ex": "Heavy machinery is often used to extract minerals from deep underground mines.", "exTr": "Ağır makineler, yer altındaki derin madenlerden mineral çıkarmak için sıklıkla kullanılır."},
  {"tr": "i. (mecazi) düzenek", "ex": "The government created new machinery to coordinate disaster relief efforts among various agencies.", "exTr": "Hükûmet, çeşitli kurumlar arasında afet yardım çalışmalarını koordine etmek için yeni bir düzenek oluşturdu."}
],
"mad": [
  {"tr": "s. deli, çılgın", "ex": "Some scientists once dismissed the ambitious theory as the idea of a mad genius.", "exTr": "Bazı bilim insanları bir zamanlar bu iddialı teoriyi çılgın bir dâhinin fikri diye reddetti."},
  {"tr": "s. kızgın, çok sinirli", "ex": "He was mad at his colleague for missing the deadline without any explanation.", "exTr": "Hiçbir açıklama yapmadan son teslim tarihini kaçırdığı için meslektaşına çok kızgındı."}
],
"matched": [
  {"tr": "s. eşleşen, eşit, denk", "ex": "The study compared carefully matched groups of patients across five hospitals.", "exTr": "Çalışma, beş hastanedeki özenle eşleştirilmiş hasta gruplarını karşılaştırdı."}
],
"matter-of-fact": [
  {"tr": "s. duygusuz-nesnel, kuru, olduğu gibi anlatan (üslup)", "ex": "The doctor explained the diagnosis in a calm, matter-of-fact tone that reassured the anxious family.", "exTr": "Doktor, teşhisi endişeli aileyi rahatlatan sakin ve olgusal bir üslupla açıkladı."}
],
"misinformation": [
  {"tr": "i. yanlış bilgi, asılsız bilgi", "ex": "Public health officials worked hard to counter misinformation circulating about the new vaccine.", "exTr": "Halk sağlığı yetkilileri, yeni aşı hakkında yayılan yanlış bilgilerle mücadele etmek için yoğun çaba gösterdi."}
],
"monthly": [
  {"tr": "s./z. aylık", "ex": "The observatory releases a monthly report detailing changes in solar activity.", "exTr": "Gözlemevi, güneş etkinliğindeki değişiklikleri ayrıntılı biçimde ele alan aylık bir rapor yayımlıyor."},
  {"tr": "i. aylık dergi, yayın", "ex": "The science monthly featured a cover story about breakthroughs in renewable battery technology.", "exTr": "Aylık bilim dergisi, yenilenebilir pil teknolojisindeki atılımlar hakkında bir kapak yazısına yer verdi."}
],
"opponent": [
  {"tr": "i. rakip, karşıt görüşlü kişi", "ex": "The senator's political opponent criticized the new healthcare proposal during the televised debate.", "exTr": "Senatörün siyasi rakibi, televizyonda yayımlanan tartışmada yeni sağlık teklifini eleştirdi."}
],
"orange": [
  {"tr": "s. turuncu", "ex": "Researchers observed that the sunset sky turned a deep orange due to volcanic ash particles.", "exTr": "Araştırmacılar, gün batımı gökyüzünün volkanik kül parçacıkları nedeniyle koyu turuncuya döndüğünü gözlemledi."},
  {"tr": "i. portakal", "ex": "Farmers in the southern region export fresh oranges to markets across the continent.", "exTr": "Güney bölgesindeki çiftçiler, taze portakalları kıtadaki pazarlara ihraç ediyor."}
],
"pipe": [
  {"tr": "i. boru", "ex": "Engineers replaced the corroded pipe that had been leaking water into the basement for months.", "exTr": "Mühendisler, aylardır bodruma su sızdıran paslanmış boruyu değiştirdi."},
  {"tr": "f. (pipe down) sesini kesmek, susmak", "ex": "The teacher asked the noisy students to pipe down before the exam instructions began.", "exTr": "Öğretmen, sınav talimatları başlamadan önce gürültücü öğrencilerden seslerini kesmelerini istedi."}
],
"pitch": [
  {"tr": "f. (fikir, ürün) sunmak; i. satış sunumu", "ex": "The startup founder had only three minutes to pitch her idea to investors.", "exTr": "Girişimin kurucusu, fikrini yatırımcılara sunmak için yalnızca üç dakikaya sahipti."},
  {"tr": "i. saha (futbol vb.)", "ex": "Groundskeepers carefully prepared the pitch before the championship match kicked off.", "exTr": "Saha bakıcıları, şampiyonluk maçı başlamadan önce sahayı özenle hazırladı."}
],
"poll": [
  {"tr": "i. anket, kamuoyu yoklaması, oylama", "ex": "A recent poll indicated that most citizens support stricter regulations on industrial carbon emissions.", "exTr": "Yakın tarihli bir anket, çoğu vatandaşın endüstriyel karbon emisyonlarına yönelik daha sıkı düzenlemeleri desteklediğini gösterdi."},
  {"tr": "f. anket yapmak, görüş yoklamak; (oy) toplamak", "ex": "Election officials worked overnight to poll voters across every district before the final results were announced.", "exTr": "Seçim yetkilileri, nihai sonuçlar açıklanmadan önce her bölgedeki seçmenlerin oylarını toplamak için gece boyunca çalıştı."}
],
"pound": [
  {"tr": "f. vurmak, dövmek", "ex": "Heavy waves continued to pound the eroding cliffs along the northern coastline throughout the storm.", "exTr": "Fırtına boyunca kuzey kıyı şeridindeki aşınan kayalıkları güçlü dalgalar dövmeye devam etti."},
  {"tr": "i. sterlin (para birimi); libre (ağırlık birimi)", "ex": "The exchange rate meant that each pound was worth significantly more than it had been the previous year.", "exTr": "Döviz kuru, her sterlinin bir önceki yıla göre önemli ölçüde daha değerli olduğu anlamına geliyordu."}
],
"precursor": [
  {"tr": "i. öncü; haberci", "ex": "Many historians view the pamphlet as a precursor to the revolutionary movements that followed decades later.", "exTr": "Birçok tarihçi, bu broşürü onlarca yıl sonra ortaya çıkan devrimci hareketlerin habercisi olarak görür."}
],
"premise": [
  {"tr": "i. önerme, öncül", "ex": "The entire argument rests on the premise that economic growth always improves public welfare.", "exTr": "Tüm tez, ekonomik büyümenin her zaman kamu refahını artırdığı öncülüne dayanmaktadır."},
  {"tr": "f. (bir savı) -e dayandırmak; öncül olarak öne sürmek", "ex": "The lawyer premised her argument on the assumption that the contract had never been legally valid.", "exTr": "Avukat, savını sözleşmenin hiçbir zaman yasal olarak geçerli olmadığı varsayımına dayandırdı."}
],
"promptly": [
  {"tr": "z. hemen, dakikasında", "ex": "Emergency responders arrived promptly at the scene of the industrial accident downtown.", "exTr": "Acil durum ekipleri, şehir merkezindeki sanayi kazası mahalline hemen ulaştı."}
],
"provision": [
  {"tr": "i. hüküm, şart (yasal madde)", "ex": "The new law includes a provision requiring factories to report their carbon emissions annually.", "exTr": "Yeni yasa, fabrikaların karbon emisyonlarını yıllık olarak bildirmesini gerektiren bir hüküm içeriyor."},
  {"tr": "i. erzak, tedarik; f. tedarik etmek", "ex": "Relief workers managed to provision the flooded village with clean water and basic medical supplies.", "exTr": "Yardım görevlileri, sular altında kalan köye temiz su ve temel tıbbi malzeme sağlamayı başardı."}
],
"rape": [
  {"tr": "i. tecavüz; f. tecavüz etmek", "ex": "The new legislation introduced significantly harsher penalties for those convicted of rape.", "exTr": "Yeni yasa, tecavüz suçundan hüküm giyenler için önemli ölçüde daha ağır cezalar getirdi."},
  {"tr": "i. (mecazi) yağmalama, tahribat", "ex": "Environmentalists described decades of illegal logging as a slow rape of the rainforest.", "exTr": "Çevreciler, on yıllarca süren yasa dışı kesimi yağmur ormanının yavaş yavaş yağmalanması olarak tanımladı."}
],
"realized": [
  {"tr": "s. fark edilmiş, anlaşılmış", "ex": "It was only later realized that the data had been mislabeled during collection.", "exTr": "Verilerin toplama sırasında yanlış etiketlendiği ancak daha sonra anlaşıldı."},
  {"tr": "s. gerçekleştirilmiş", "ex": "The company's ambitious expansion plans were finally realized after years of careful strategic planning.", "exTr": "Şirketin iddialı büyüme planları, yıllar süren dikkatli stratejik planlamanın ardından sonunda gerçekleştirildi."}
],
"receiver": [
  {"tr": "i. alıcı (kişi veya cihaz)", "ex": "The satellite receiver picks up faint signals that ordinary antennas cannot detect.", "exTr": "Uydu alıcısı, sıradan antenlerin algılayamadığı zayıf sinyalleri yakalar."},
  {"tr": "i. (hukuk) kayyum, tasfiye memuru", "ex": "After the company declared bankruptcy, a court-appointed receiver took control of its remaining assets.", "exTr": "Şirket iflasını açıkladıktan sonra, mahkemenin atadığı bir kayyum kalan varlıkların kontrolünü ele aldı."}
],
"recession": [
  {"tr": "i. (ekonomik) durgunluk, gerileme", "ex": "The global recession forced many small businesses to reduce their workforce significantly.", "exTr": "Küresel durgunluk, birçok küçük işletmeyi işgücünü önemli ölçüde azaltmaya zorladı."}
],
"respectable": [
  {"tr": "s. saygın; hatırı sayılır (miktar)", "ex": "The charity raised a respectable amount of money despite having only a small number of volunteers.", "exTr": "Hayır kurumu, yalnızca az sayıda gönüllüsü olmasına rağmen hatırı sayılır bir miktar para topladı."}
],
"restrain": [
  {"tr": "f. kısıtlamak, engellemek, zapt etmek", "ex": "Security officers had to restrain the crowd as it pushed toward the stadium entrance.", "exTr": "Güvenlik görevlileri, stadyum girişine doğru yüklenen kalabalığı zapt etmek zorunda kaldı."}
],
"riches": [
  {"tr": "i. zenginlik, servet", "ex": "The explorers hoped the newly discovered island would offer untold natural riches.", "exTr": "Kâşifler, yeni keşfedilen adanın hesapsız doğal zenginlikler sunmasını umuyordu."}
],
"scarcely": [
  {"tr": "z. hemen hemen hiç, güçlükle", "ex": "The remote village had scarcely enough resources to support its population through the harsh winter.", "exTr": "Uzak köyde, halkı zorlu kış boyunca geçindirmeye zar zor yetecek kadar kaynak vardı."}
],
"sexual": [
  {"tr": "s. cinsel", "ex": "The biology course covered sexual reproduction in both plants and animals in detail.", "exTr": "Biyoloji dersi, hem bitkilerde hem de hayvanlarda eşeyli üremeyi ayrıntılı biçimde ele aldı."}
],
"shook": [
  {"tr": "f. (shake'in geçmişi) salladı, sarstı", "ex": "The explosion shook buildings several blocks away from the blast site.", "exTr": "Patlama, patlama noktasından birkaç blok ötedeki binaları sarstı."}
],
"shore": [
  {"tr": "i. kıyı, sahil", "ex": "Rising sea levels have gradually eroded the shore along several low-lying coastal villages this decade.", "exTr": "Yükselen deniz seviyeleri, bu on yılda alçak kıyı köylerinin birçoğu boyunca kıyıyı yavaş yavaş aşındırdı."},
  {"tr": "f. desteklemek (shore up)", "ex": "Engineers rushed to shore up the weakened dam wall before the approaching storm could cause it to collapse.", "exTr": "Mühendisler, yaklaşan fırtına duvarın çökmesine yol açmadan önce zayıflamış baraj duvarını desteklemeye koştu."}
],
"short-lived": [
  {"tr": "s. kısa ömürlü, geçici", "ex": "The company's early success proved short-lived once competitors entered the market.", "exTr": "Şirketin erken başarısının, rakipler pazara girince kısa ömürlü olduğu ortaya çıktı."}
],
"show-off": [
  {"tr": "i. hava atan kişi, gösteriş budalası", "ex": "Classmates often dismissed him as a show-off despite his genuinely impressive scientific knowledge.", "exTr": "Sınıf arkadaşları, gerçekten etkileyici bilimsel bilgisine rağmen onu çoğu zaman gösteriş budalası sayıp ciddiye almadı."}
],
"singing": [
  {"tr": "i. şarkı söyleme", "ex": "Researchers discovered that regular singing can improve lung function in patients with chronic respiratory conditions.", "exTr": "Araştırmacılar, düzenli şarkı söylemenin kronik solunum rahatsızlığı olan hastalarda akciğer fonksiyonunu iyileştirebileceğini keşfetti."},
  {"tr": "s. ahenkli, tatlı (ses)", "ex": "She recited the old ballad in a soft, singing tone that captivated the audience.", "exTr": "Eski baladı, dinleyicileri büyüleyen yumuşak, ahenkli bir tonla okudu."}
],
"singular": [
  {"tr": "s. eşsiz, olağanüstü", "ex": "The professor pointed out a singular achievement rarely matched by any other researcher in the field.", "exTr": "Profesör, alandaki diğer araştırmacıların nadiren erişebildiği eşsiz bir başarıya dikkat çekti."},
  {"tr": "s. tekil; i. (dilbilgisi) tekil hâl", "ex": "In English grammar, the verb must agree with a singular subject in the present tense.", "exTr": "İngilizce dilbilgisinde, fiil şimdiki zamanda tekil bir özneyle uyumlu olmalıdır."}
],
"sink": [
  {"tr": "f. batmak, çökmek", "ex": "Engineers feared that the flooded district might slowly sink as groundwater extraction continued.", "exTr": "Mühendisler, yeraltı suyu çekimi sürdükçe sular altında kalan bölgenin yavaşça çökebileceğinden endişe etti."},
  {"tr": "i. (çevre bilimi) yutak (carbon sink)", "ex": "Tropical rainforests function as a major carbon sink, absorbing vast amounts of atmospheric carbon dioxide.", "exTr": "Tropikal yağmur ormanları, atmosferdeki karbondioksiti büyük miktarlarda emerek önemli bir karbon yutağı işlevi görür."}
],
"skeleton": [
  {"tr": "i. iskelet", "ex": "Paleontologists reconstructed the dinosaur's entire skeleton from fragments found scattered across the desert.", "exTr": "Paleontologlar, çölde dağınık halde bulunan parçalardan dinozorun tüm iskeletini yeniden oluşturdu."},
  {"tr": "i. taslak, ana çatı, iskelet (plan)", "ex": "The committee approved a skeleton plan for the reform, leaving the details to be finalized later.", "exTr": "Komite, reform için bir taslak planı onayladı ve ayrıntıların daha sonra kesinleştirilmesine karar verdi."}
],
"sketch": [
  {"tr": "i. taslak, kroki", "ex": "The architect drew a rough sketch of the community center on a napkin during lunch.", "exTr": "Mimar, öğle yemeği sırasında toplum merkezinin kaba bir taslağını peçeteye çizdi."},
  {"tr": "f. taslağını çizmek", "ex": "The detective asked the witness to sketch the suspect's face while the memory was still fresh.", "exTr": "Dedektif, hafıza hâlâ tazeyken tanıktan şüphelinin yüzünün taslağını çizmesini istedi."}
],
"sore": [
  {"tr": "s. ağrılı, acıyan", "ex": "After the long hike, her muscles felt sore and she needed several days to recover.", "exTr": "Uzun yürüyüşten sonra kasları ağrıyordu ve toparlanmak için birkaç güne ihtiyaç duydu."},
  {"tr": "i. yara, ağrılı yer (deride)", "ex": "The nurse applied ointment to the sore on the patient's heel to prevent infection.", "exTr": "Hemşire, enfeksiyonu önlemek için hastanın topuğundaki yaraya merhem sürdü."}
],
"split-up": [
  {"tr": "i. ayrılma, dağılma", "ex": "After years of disagreements, the founding partners finally announced their split-up.", "exTr": "Yıllar süren anlaşmazlıkların ardından kurucu ortaklar sonunda ayrılıklarını duyurdu."}
],
"stand-up": [
  {"tr": "s. stand-up (tek kişilik sahne komedisi)", "ex": "The comedian performed a stand-up routine that addressed everyday struggles with technology and social media.", "exTr": "Komedyen, teknoloji ve sosyal medyayla ilgili günlük zorlukları ele alan bir stand-up gösterisi sundu."},
  {"tr": "s. dürüst, güvenilir", "ex": "Colleagues described him as a stand-up person who always kept his promises, even under pressure.", "exTr": "İş arkadaşları, onu baskı altında bile her zaman sözünü tutan dürüst bir kişi olarak tanımladı."}
],
"straight": [
  {"tr": "s. düz", "ex": "Surveyors marked a straight line across the field to guide the construction of the road.", "exTr": "Arazi ölçüm ekibi, yol yapımına rehberlik etmesi için tarlayı boydan boya kesen düz bir çizgi işaretledi."},
  {"tr": "z. doğrudan", "ex": "After the long flight, she went straight to the hotel without stopping for dinner.", "exTr": "Uzun uçuştan sonra, akşam yemeği için durmadan doğrudan otele gitti."}
],
"stupid": [
  {"tr": "s. aptal, akılsız", "ex": "Ignoring the storm warnings turned out to be a stupid decision that endangered the entire crew.", "exTr": "Fırtına uyarılarını görmezden gelmek, tüm mürettebatı tehlikeye atan aptalca bir karar olduğu ortaya çıktı."}
],
"sway": [
  {"tr": "f. sallanmak, salınmak", "ex": "Tall buildings are engineered to sway slightly during strong winds without suffering structural damage.", "exTr": "Yüksek binalar, güçlü rüzgarlar sırasında yapısal hasar görmeden hafifçe sallanacak şekilde tasarlanır."},
  {"tr": "i. etki, nüfuz, hâkimiyet", "ex": "For decades, the political party held considerable sway over decisions made in the regional parliament.", "exTr": "Onlarca yıl boyunca siyasi parti, bölgesel parlamentoda alınan kararlar üzerinde büyük bir etkiye sahipti."}
],
"swift": [
  {"tr": "s. hızlı, çevik", "ex": "The committee praised the government's swift response to the earthquake disaster.", "exTr": "Komite, hükümetin deprem felaketine gösterdiği hızlı tepkiyi övdü."},
  {"tr": "i. ebabil (bir kuş türü)", "ex": "A swift darted across the evening sky, catching insects in mid-flight.", "exTr": "Bir ebabil, böcekleri havada yakalayarak akşam gökyüzünde ok gibi hızla geçti."}
],
"swing": [
  {"tr": "i. salıncak; ani değişim, dalgalanma", "ex": "Economists observed a noticeable swing in consumer confidence after the government announced new tax policies.", "exTr": "Ekonomistler, hükümet yeni vergi politikalarını duyurduktan sonra tüketici güveninde belirgin bir dalgalanma gözlemledi."},
  {"tr": "f. sallanmak, salınmak", "ex": "Children love to swing back and forth on the old wooden seat hanging from the oak tree's branch.", "exTr": "Çocuklar, meşe ağacının dalından sarkan eski tahta koltukta ileri geri sallanmayı severler."}
],
"syllable": [
  {"tr": "i. hece", "ex": "Students practiced clapping out each syllable to understand the rhythm of the poem.", "exTr": "Öğrenciler, şiirin ritmini anlamak için her heceyi el çırparak çalıştı."}
],
"teens": [
  {"tr": "i. gençler, ergenler; gençlik yılları (13-19)", "ex": "Sleep researchers found that most teens require at least eight hours of rest nightly.", "exTr": "Uyku araştırmacıları, çoğu gencin her gece en az sekiz saat dinlenmeye ihtiyaç duyduğunu buldu."}
],
"tempt": [
  {"tr": "f. ayartmak, cezbetmek, baştan çıkarmak", "ex": "Rising salaries abroad continue to tempt young engineers away from local research institutions.", "exTr": "Yurt dışındaki yükselen maaşlar, genç mühendisleri yerel araştırma kurumlarından ayartmaya devam ediyor."}
],
"torpedo": [
  {"tr": "i. torpido", "ex": "The museum displays a restored torpedo recovered from a sunken warship in the Baltic Sea.", "exTr": "Müze, Baltık Denizi'nde batık bir savaş gemisinden çıkarılan restore edilmiş bir torpidoyu sergiliyor."},
  {"tr": "f. torpille vurmak", "ex": "During the naval exercise, the submarine crew practiced how to torpedo a moving target accurately.", "exTr": "Deniz tatbikatı sırasında denizaltı mürettebatı, hareket eden bir hedefi torpille vurma talimi yaptı."}
],
"traveller": [
  {"tr": "i. gezgin, yolcu", "ex": "Every experienced traveller recommends packing light before a long international flight.", "exTr": "Her deneyimli gezgin, uzun bir uluslararası uçuştan önce bavulu hafif toplamayı önerir."}
],
"turn-up": [
  {"tr": "f. ortaya çıkmak, gelmek, belirmek", "ex": "Despite the heavy rain, hundreds of supporters still turned up for the charity marathon.", "exTr": "Şiddetli yağmura rağmen, yüzlerce destekçi yine de hayır maratonuna geldi."},
  {"tr": "f. (sesini/ısısını) açmak, yükseltmek", "ex": "Please turn up the heating a little; the children are complaining that the room feels cold.", "exTr": "Lütfen kaloriferi biraz aç; çocuklar odanın soğuk hissettirdiğinden şikâyet ediyor."}
],
"turtle": [
  {"tr": "i. kaplumbağa", "ex": "Marine biologists tagged the sea turtle before releasing it back into the ocean.", "exTr": "Deniz biyologları, denize geri bırakmadan önce deniz kaplumbağasına takip cihazı taktı."},
  {"tr": "f. (turn turtle) alabora olmak, ters dönmek", "ex": "The small sailing boat turned turtle after being hit by a sudden powerful gust.", "exTr": "Küçük yelkenli, ani ve güçlü bir rüzgârın çarpmasıyla alabora oldu."}
],
"uncomfortable": [
  {"tr": "s. rahatsız, huzursuz (hisseden); rahatsız edici", "ex": "Many patients reported feeling uncomfortable during the early stages of the clinical trial.", "exTr": "Birçok hasta, klinik denemenin ilk aşamalarında rahatsız hissettiğini bildirdi."}
],
"vertical": [
  {"tr": "s. dikey", "ex": "Engineers reinforced the bridge's vertical supports to withstand stronger earthquakes in the coming decades.", "exTr": "Mühendisler, önümüzdeki on yıllarda daha güçlü depremlere dayanabilmesi için köprünün dikey destek kolonlarını güçlendirdi."},
  {"tr": "i. dikey çizgi/düzlem", "ex": "The flagpole tilted a few degrees from the vertical after the storm loosened its base.", "exTr": "Fırtına tabanını gevşetince bayrak direği düşeyden birkaç derece yana yattı."}
],
"volcano": [
  {"tr": "i. yanardağ, volkan", "ex": "The volcano had remained dormant for centuries before suddenly erupting last spring.", "exTr": "Yanardağ, geçen bahar aniden patlamadan önce yüzyıllardır uykudaydı."}
],
"witch": [
  {"tr": "i. cadı", "ex": "In many old folk tales, a wicked witch casts spells on innocent villagers.", "exTr": "Birçok eski halk masalında, kötü bir cadı masum köylülere büyü yapar."}
],
"x-ray": [
  {"tr": "f. röntgen çekmek", "ex": "The dentist decided to x-ray the patient's jaw to check for hidden fractures.", "exTr": "Diş hekimi, gizli kırıkları kontrol etmek için hastanın çenesinin röntgenini çekmeye karar verdi."},
  {"tr": "i. röntgen", "ex": "The x-ray revealed a small fracture in the athlete's wrist that earlier examinations had missed.", "exTr": "Röntgen, sporcunun bileğinde önceki muayenelerin gözden kaçırdığı küçük bir kırığı ortaya çıkardı."}
],

/* --- 26.08.2026 tam anlam taramasi, parti 4 (k6): 108 bulgudan
   suzulen duzeltmeler; agirlikla ceviri/dilbilgisi (besli cakma,
   kusum otu, sanzatu, on parmak yazmak, kilise-devlet...). --- */
"advert": [
  {"tr": "i. reklam, ilan (İngiliz İngilizcesi)", "ex": "Marketing researchers studied how a single television advert can influence consumer behavior for months.", "exTr": "Pazarlama araştırmacıları, tek bir televizyon reklamının tüketici davranışını aylarca nasıl etkileyebileceğini inceledi."},
  {"tr": "f. değinmek, atıfta bulunmak (to ile, resmi/yazılı dil)", "ex": "In her closing remarks, the professor briefly adverted to the ethical questions raised earlier in the lecture.", "exTr": "Profesör, kapanış konuşmasında dersin daha önceki bölümünde gündeme gelen etik sorulara kısaca değindi."}
],
"canvas": [
  {"tr": "i. tuval, kanvas kumaş", "ex": "The artist stretched a large canvas across the wooden frame before beginning to paint.", "exTr": "Sanatçı, resim yapmaya başlamadan önce büyük bir tuvali ahşap çerçeveye gerdi."},
  {"tr": "f. (oy toplamak için) kapı kapı dolaşmak", "ex": "Volunteers canvassed the neighborhood to gather signatures supporting the proposed community park.", "exTr": "Gönüllüler, önerilen semt parkını desteklemek için imza toplamak amacıyla mahalleyi dolaştı."}
],
"cooler": [
  {"tr": "i. soğutucu kutu, taşınabilir buzluk", "ex": "Families packed a large cooler with drinks and snacks before heading to the beach for the day.", "exTr": "Aileler, günü plajda geçirmek üzere yola çıkmadan önce büyük bir soğutucu kutuyu içecek ve atıştırmalıklarla doldurdu."},
  {"tr": "i. hücre, tecrit hücresi (argo, hapishane)", "ex": "The guards threatened to send the troublemaking inmate to the cooler for a week.", "exTr": "Gardiyanlar, sorun çıkaran mahkûmu bir haftalığına tecrit hücresine göndermekle tehdit etti."}
],
"crave": [
  {"tr": "f. şiddetle arzulamak, canı çekmek", "ex": "Pregnant women sometimes crave unusual food combinations during the early months of pregnancy.", "exTr": "Hamile kadınların gebeliğin ilk aylarında bazen canı alışılmadık yiyecek kombinasyonları çeker."}
],
"virgin": [
  {"tr": "s. bakir, el değmemiş, işlenmemiş (doğa/toprak için)", "ex": "Conservationists are working to protect one of the last areas of virgin rainforest in the region.", "exTr": "Doğa koruma uzmanları, bölgedeki son bakir yağmur ormanı alanlarından birini korumak için çalışıyor."},
  {"tr": "i. bakire, cinsel deneyimi olmayan kişi", "ex": "In the ancient myth, the goddess was worshipped as an eternal virgin who never married.", "exTr": "Antik mitte tanrıçaya, hiç evlenmemiş ebedi bir bakire olarak tapılırdı."}
],
"anthropologist": [
  {"tr": "i. antropolog", "ex": "The anthropologist spent two years living among the tribe to study their traditional customs.", "exTr": "Antropolog, geleneksel âdetlerini incelemek için iki yılını kabilenin arasında yaşayarak geçirdi."}
],
"horse-drawn": [
  {"tr": "s. atla çekilen, at koşulu", "ex": "Visitors can tour the historic district in a horse-drawn carriage during the summer festival.", "exTr": "Ziyaretçiler, yaz festivali sırasında tarihi bölgeyi atlı bir araba ile gezebilir."}
],
"metric": [
  {"tr": "s. metrik; i. ölçüt, ölçüm birimi", "ex": "Managers use several performance metrics to evaluate how efficiently each department completes its projects.", "exTr": "Yöneticiler, her departmanın projelerini ne kadar verimli tamamladığını değerlendirmek için çeşitli performans ölçütleri kullanır."},
  {"tr": "s. vezinle ilgili (şiirde)", "ex": "The poem's unusual metric pattern made it difficult for students to read aloud smoothly.", "exTr": "Şiirin alışılmadık vezin düzeni, öğrencilerin onu akıcı biçimde sesli okumasını zorlaştırdı."}
],
"over-the-top": [
  {"tr": "s. aşırıya kaçan, abartılı", "ex": "Critics called the film's special effects over-the-top, overshadowing an otherwise compelling storyline.", "exTr": "Eleştirmenler, filmin özel efektlerinin abartılı olduğunu ve aslında etkileyici olan hikâyeyi gölgede bıraktığını söyledi."}
],
"rip": [
  {"tr": "f. yırtmak, yırtılmak", "ex": "A sharp nail managed to rip her jacket as she climbed over the wooden fence.", "exTr": "O, tahta çitin üzerinden atlarken keskin bir çivi ceketini yırttı."},
  {"tr": "i. yırtık (kumaşta)", "ex": "She noticed a small rip near the pocket before purchasing the secondhand leather bag.", "exTr": "İkinci el deri çantayı satın almadan önce cebin yakınında küçük bir yırtık fark etti."}
],
"about-face": [
  {"tr": "i. geriye dönüş (180 derece), ani fikir değişikliği", "ex": "The minister performed a surprising about-face on the controversial tax proposal within days.", "exTr": "Bakan, tartışmalı vergi teklifi konusunda günler içinde şaşırtıcı bir ani fikir değişikliğine gitti."}
],
"detective": [
  {"tr": "i. dedektif, hafiye, sivil polis", "ex": "The detective examined every piece of evidence carefully before questioning the main suspect.", "exTr": "Dedektif, ana şüpheliyi sorgulamadan önce her bir delili dikkatle inceledi."}
],
"deterrent": [
  {"tr": "i. caydırıcı unsur/güç", "ex": "Harsh penalties are meant to serve as a deterrent against repeat offenders.", "exTr": "Ağır cezaların, tekrar suç işleyenlere karşı caydırıcı bir unsur olarak hizmet etmesi amaçlanır."},
  {"tr": "s. caydırıcı", "ex": "Researchers question whether longer prison sentences have any real deterrent effect on violent crime.", "exTr": "Araştırmacılar, daha uzun hapis cezalarının şiddet suçları üzerinde gerçek bir caydırıcı etkisi olup olmadığını sorguluyor."}
],
"duck": [
  {"tr": "i. ördek", "ex": "Several wild ducks swam calmly across the pond near the old wooden bridge.", "exTr": "Birkaç yaban ördeği, eski ahşap köprünün yakınındaki gölette sakince yüzdü."},
  {"tr": "f. eğilmek, başını eğmek (bir şeyden kaçınmak için)", "ex": "He had to duck quickly to avoid hitting his head on the low doorway.", "exTr": "Alçak kapıdan geçerken başını çarpmamak için hızlıca eğilmek zorunda kaldı."}
],
"distasteful": [
  {"tr": "s. tatsız, nahoş, iğrenç (görülen)", "ex": "Many viewers found the graphic advertisement distasteful and demanded that the network remove it immediately.", "exTr": "Birçok izleyici, rahatsız edici ölçüde açık görüntüler içeren reklamı nahoş buldu ve kanaldan onu derhal kaldırmasını talep etti."}
],
"storyteller": [
  {"tr": "i. hikâye anlatıcısı, masalcı", "ex": "The old storyteller gathered children around the fire every evening to share ancient legends.", "exTr": "Yaşlı hikâye anlatıcısı, her akşam eski efsaneleri paylaşmak için çocukları ateşin etrafında toplardı."},
  {"tr": "i. yalancı (özellikle çocuk dilinde, kibarca)", "ex": "The teacher gently told the boy he was being a storyteller about his missing homework.", "exTr": "Öğretmen, çocuğa kayıp ödevi konusunda masal anlattığını nazikçe söyledi."}
],
"no-hit": [
  {"tr": "s. (beyzbol) rakibine hiç vuruş yaptırmayan", "ex": "The rookie pitcher earned national attention by throwing a rare no-hit game in his first season.", "exTr": "Genç atıcı, rakibine hiç vuruş yaptırmadığı ender görülen bir maç çıkararak taraftarları ayağa kaldırdı."}
],
"high-five": [
  {"tr": "i. beşlik çakma (elle kutlama hareketi)", "ex": "The players gave each other an enthusiastic high-five after scoring the winning goal in the final minute.", "exTr": "Deney başarıyla sonuçlanınca iki araştırmacı birbiriyle coşkuyla beşlik çaktı."}
],
"sure-enough": [
  {"tr": "s. gerçek, hakiki, sahiden öyle olan (vurgulu, informal)", "ex": "To everyone's surprise, the faded parchment turned out to be a sure-enough treasure map after all.", "exTr": "Herkesi şaşırtacak şekilde, solmuş parşömenin sonunda gerçek bir hazine haritası olduğu ortaya çıktı."}
],
"right-hand": [
  {"tr": "s. sağ el gibi güvenilir, en yakın/vazgeçilmez (yardımcı)", "ex": "The assistant became the manager's right-hand man within just a few months of joining the firm.", "exTr": "Asistan, firmaya katıldıktan sadece birkaç ay sonra müdürün en güvenilir yardımcısı haline geldi."}
],
"right-side-out": [
  {"tr": "s. (giysi için) doğru tarafı dışarıda, ters çevrilmemiş", "ex": "She turned the sweater right-side-out before folding it neatly and placing it in the drawer.", "exTr": "Kazağı düzgünce katlayıp çekmeceye yerleştirmeden önce doğru tarafı dışarıda olacak biçimde çevirdi."}
],
"buy-out": [
  {"tr": "f. satın alarak devralmak", "ex": "A larger competitor decided to buy out the struggling startup rather than compete against it directly.", "exTr": "Daha büyük bir rakip, doğrudan rekabet etmek yerine zorlanan girişimi satın alarak devralmaya karar verdi."}
],
"provincial": [
  {"tr": "s. taşraya ait; (aşağılayıcı) dar görüşlü", "ex": "Some critics dismissed her early novels as provincial, arguing they lacked broader international appeal.", "exTr": "Eleştirmenler, ilk romanlarını daha geniş bir uluslararası çekicilikten yoksun oldukları gerekçesiyle taşra işi olarak nitelendirdi."},
  {"tr": "i. taşralı", "ex": "Thousands of provincials moved to the capital during the industrial boom, hoping to find steady factory work.", "exTr": "Sanayi patlaması sırasında binlerce taşralı, düzenli fabrika işi bulma umuduyla başkente taşındı."}
],
"used-car": [
  {"tr": "s. ikinci el araba (satışıyla ilgili)", "ex": "Many first-time buyers choose a used-car dealership because the prices are considerably lower than new models.", "exTr": "Birçok ilk kez alıcı, fiyatların yeni modellerden oldukça düşük olması nedeniyle bir ikinci el araba galerisini tercih eder."}
],
"come-at-able": [
  {"tr": "s. ulaşılabilir, erişilebilir", "ex": "The old cabin remained barely come-at-able after the storm buried the mountain trail under deep snow.", "exTr": "Fırtına dağ patikasını derin karın altına gömdükten sonra, eski kulübe zar zor ulaşılabilir kaldı."}
],
"turn-off": [
  {"tr": "f. kapatmak, söndürmek", "ex": "Please remember to turn off all the lights before leaving the laboratory at the end of the day.", "exTr": "Günün sonunda laboratuvardan ayrılmadan önce lütfen tüm ışıkları kapatmayı unutmayın."},
  {"tr": "i. (gündelik) itici/caydırıcı şey", "ex": "Many job seekers say that a disorganized interview process can be a major turn-off for top candidates.", "exTr": "Birçok iş arayan, düzensiz bir mülakat sürecinin nitelikli adaylar için büyük bir caydırıcı unsur olabileceğini söylüyor."}
],
"honesty": [
  {"tr": "i. dürüstlük", "ex": "The company's reputation was built on decades of honesty and transparent dealings with its customers.", "exTr": "Şirketin itibarı, müşterileriyle onlarca yıl süren dürüst ve şeffaf ilişkilere dayanıyordu."}
],
"automotive": [
  {"tr": "s. otomotivle ilgili, motorlu taşıtlarla ilgili", "ex": "The automotive industry has invested heavily in developing safer and more efficient electric engines.", "exTr": "Otomotiv sektörü, daha güvenli ve daha verimli elektrikli motorlar geliştirmeye büyük yatırımlar yaptı."}
],
"captivity": [
  {"tr": "i. esaret, tutsaklık", "ex": "Conservationists released the rehabilitated eagle back into the wild after months spent in captivity.", "exTr": "Doğa koruma uzmanları, rehabilite edilen kartalı esarette geçen ayların ardından tekrar doğaya saldı."}
],
"arch": [
  {"tr": "i. kemer, kavisli yapı", "ex": "The ancient Roman arch has survived nearly two thousand years despite numerous earthquakes in the region.", "exTr": "Antik Roma kemeri, bölgedeki sayısız depreme rağmen neredeyse iki bin yıldır ayakta kalmayı başardı."},
  {"tr": "s. muzip, kurnazca şakacı (bir bakış/gülümseme için)", "ex": "She gave an arch smile before revealing that she had already guessed the surprise party's location.", "exTr": "Sürpriz partinin yerini zaten tahmin ettiğini açıklamadan önce muzipçe gülümsedi."}
],
"someday": [
  {"tr": "z. gün gelir, ileride bir gün", "ex": "Many young scientists hope that someday their research will lead to a cure for the disease.", "exTr": "Araştırmalarının bir gün hastalığa tedavi bulunmasını sağlayacağını umuyor."}
],
"polyglot": [
  {"tr": "i. çok dil bilen kişi", "ex": "As a polyglot, she can conduct business meetings fluently in five different languages.", "exTr": "Çok dil bilen biri olarak beş farklı dilde akıcı biçimde iş toplantıları yürütebiliyor."},
  {"tr": "s. çok dilli", "ex": "Ancient trade centers were often polyglot cities where merchants bargained in several languages every day.", "exTr": "Kadim ticaret merkezleri çoğu zaman, tüccarların her gün birkaç dilde pazarlık ettiği çok dilli şehirlerdi."}
],
"gangster": [
  {"tr": "i. gangster, çete üyesi", "ex": "During the 1920s, several notorious gangsters controlled the illegal alcohol trade in major cities.", "exTr": "1920'lerde, birkaç kötü şöhretli gangster büyük şehirlerdeki yasa dışı alkol ticaretini kontrol ediyordu."}
],
"no-account": [
  {"tr": "s./i. değersiz, işe yaramaz (kimse)", "ex": "Neighbors dismissed him as a no-account drifter long before he became a respected community leader.", "exTr": "Kasabalılar onu değersiz bir serseri sayıp ciddiye almadı."}
],
"toast": [
  {"tr": "i. kızarmış ekmek; f. ekmek kızartmak", "ex": "For breakfast, he usually eats a slice of toast topped with butter and honey.", "exTr": "Kahvaltıda genellikle üzerine tereyağı ve bal sürülmüş bir dilim kızarmış ekmek yer."},
  {"tr": "i. kadeh kaldırma, şerefe; f. şerefine kadeh kaldırmak", "ex": "At the wedding reception, the best man raised his glass and offered a heartfelt toast to the couple.", "exTr": "Düğünde gelinin babası, çiftin şerefine içten bir kadeh kaldırdı."}
],
"turn-away": [
  {"tr": "f. geri çevirmek, reddetmek", "ex": "Because the concert hall was already full, staff had to turn away dozens of eager fans at the door.", "exTr": "Konser salonu zaten dolu olduğu için görevliler, kapıda onlarca hevesli hayranı geri çevirmek zorunda kaldı."}
],
"church-state": [
  {"tr": "s. kilise-devlet (ilişkileriyle ilgili)", "ex": "Historians often compare medieval church-state structures with the strict separation practiced in modern secular democracies.", "exTr": "Tarihçiler, ortaçağ din devleti yapılarını modern laik demokrasilerde uygulanan kesin ayrımla sık sık karşılaştırır."}
],
"ditch": [
  {"tr": "f. bırakmak, vazgeçmek, (bir şeyi/kimseyi) terk etmek", "ex": "Many companies are choosing to ditch plastic packaging in favor of more sustainable, biodegradable alternatives.", "exTr": "Birçok şirket, daha sürdürülebilir ve biyolojik olarak parçalanabilen alternatifler lehine plastik ambalajı bırakmayı tercih ediyor."},
  {"tr": "i. hendek, ark", "ex": "Heavy rain flooded the narrow ditch running alongside the country road overnight.", "exTr": "Şiddetli yağmur yüzünden kır yolunun kenarındaki dar hendeği gece boyunca su bastı."}
],
"nickname": [
  {"tr": "i. takma ad, lakap", "ex": "Classmates gave him the nickname 'Professor' because he always had detailed answers ready in class.", "exTr": "Sınıf arkadaşları, derste her zaman ayrıntılı cevapları hazır olduğu için ona 'Profesör' lakabını taktı."},
  {"tr": "f. lakap takmak", "ex": "Journalists nicknamed the new stadium the Cauldron because of the deafening noise inside it.", "exTr": "Gazeteciler, içindeki sağır edici gürültü nedeniyle yeni stadyuma Kazan lakabını taktı."}
],
"reconcile": [
  {"tr": "f. barışmak, barıştırmak; uzlaşmak, uzlaştırmak", "ex": "It took several years for the two brothers to reconcile after their bitter argument over the family business.", "exTr": "Aile işletmesi üzerindeki acı tartışmalarının ardından iki kardeşin barışması birkaç yıl aldı."}
],
"fall-off": [
  {"tr": "f. azalmak, düşmek, gerilemek (miktar/talep için)", "ex": "Sales began to fall off significantly once the seasonal promotion ended in early autumn.", "exTr": "Mevsimlik promosyon sonbahar başında sona erdikten sonra satışlar belirgin biçimde azalmaya başladı."}
],
"step-down": [
  {"tr": "i. azaltma, kademeli düşürme", "ex": "Economists recommended a gradual step-down in interest rates rather than one abrupt, drastic cut.", "exTr": "Ekonomistler, ani ve sert bir indirim yerine faiz oranlarında kademeli bir azaltma önerdi."}
],
"bouquet": [
  {"tr": "i. buket, çiçek demeti", "ex": "The bride carried a bouquet of white roses as she walked down the aisle.", "exTr": "Gelin, koridorda yürürken beyaz güllerden oluşan bir buket taşıyordu."},
  {"tr": "i. (şarapta) koku, aroma", "ex": "Wine experts praised the bouquet of the aged red, noting hints of cherry and oak.", "exTr": "Şarap uzmanları, kiraz ve meşe notaları sezerek yıllanmış kırmızı şarabın aromasını övdü."}
],
"city-born": [
  {"tr": "s. şehir doğumlu, şehirde doğmuş", "ex": "Several city-born students struggled at first to adapt to the slower pace of rural life.", "exTr": "Şehirde doğmuş birkaç öğrenci, kırsal yaşamın daha yavaş temposuna uyum sağlamakta başlangıçta zorlandı."}
],
"green-white": [
  {"tr": "s. yeşilimsi beyaz", "ex": "Botanists noted the plant's unusual green-white blossoms, rarely seen at this altitude.", "exTr": "Botanikçi, bitkinin bu rakımda nadiren görülen sıra dışı yeşilimsi beyaz çiçeklerini not etti."}
],
"half-term": [
  {"tr": "i. dönem ortası ara tatili (İngiltere'de)", "ex": "Many British families travel abroad during the half-term break in late October.", "exTr": "Birçok İngiliz ailesi, ekim ayı sonundaki yarıyıl tatili sırasında yurt dışına seyahat eder."}
],
"imagery": [
  {"tr": "i. imgeler, betimleme; görüntüler", "ex": "The poet's vivid imagery allowed readers to picture the storm long after they had finished reading.", "exTr": "Şairin canlı imgeleri, okuyucuların okumayı bitirdikten çok sonra bile fırtınayı gözünde canlandırmasını sağladı."}
],
"investigator": [
  {"tr": "i. araştırmacı, soruşturmacı, müfettiş", "ex": "The lead investigator spent months collecting evidence before presenting the case to prosecutors.", "exTr": "Davayı savcılara sunmadan önce, başsoruşturmacı aylarını kanıt toplamakla geçirdi."}
],
"newcomer": [
  {"tr": "i. yeni gelen, yeni katılan", "ex": "The small startup was considered a newcomer in an industry long dominated by established giants.", "exTr": "Küçük girişim, uzun süredir yerleşik devlerin egemen olduğu bir sektörde yeni gelen bir oyuncu olarak görülüyordu."}
],
"vicious": [
  {"tr": "s. azılı, gaddar, kötü niyetli", "ex": "The documentary exposed a vicious cycle of poverty that trapped entire families for generations.", "exTr": "Belgesel, nesiller boyunca tüm aileleri kıskacına alan bir yoksulluk kısır döngüsünü gözler önüne serdi."}
],
"air-cool": [
  {"tr": "f. havayla soğutmak", "ex": "Engineers designed the engine to be air-cooled efficiently even during long periods of heavy use.", "exTr": "Mühendisler, motoru uzun süreli ağır kullanımda bile verimli biçimde hava ile soğuyacak şekilde tasarladı."}
],
"amusing": [
  {"tr": "s. eğlenceli, gülünç", "ex": "The professor often shared amusing anecdotes from his fieldwork to keep students engaged during long lectures.", "exTr": "Profesör, uzun dersler boyunca öğrencilerin ilgisini canlı tutmak için saha çalışmasından eğlenceli anekdotları sık sık paylaşırdı."}
],
"cut-price": [
  {"tr": "s. indirimli, düşük fiyatlı", "ex": "The airline's cut-price tickets attracted thousands of budget travelers during the summer holidays.", "exTr": "Havayolunun indirimli biletleri, yaz tatilinde binlerce düşük bütçeli gezgini kendine çekti."}
],
"die-hard": [
  {"tr": "s. asla vazgeçmeyen, köklü, sabit fikirli", "ex": "Thousands of die-hard supporters traveled across the country to watch the final match live.", "exTr": "Binlerce fanatik taraftar, final maçını canlı izlemek için ülke boyunca seyahat etti."}
],
"embarrassment": [
  {"tr": "i. utanç, mahcubiyet, sıkıntı verici durum", "ex": "A wave of embarrassment swept over the intern after he addressed the client by the wrong name.", "exTr": "Müşteriye yanlış isimle hitap eden stajyerin üzerine bir utanç dalgası çöktü."}
],
"live-and-die": [
  {"tr": "i. küstüm otu (Mimosa pudica)", "ex": "Botanists classified the live-and-die as a thorny subshrub whose delicate leaflets fold shut at the slightest touch.", "exTr": "Botanikçiler, hassas ot türünü, en ufak dokunuşta yapraklarını kapatan dikenli bir çalı olarak sınıflandırdı."}
],
"nineteenth": [
  {"tr": "s. on dokuzuncu", "ex": "Historians mark the nineteenth century as the period when industrial cities expanded most rapidly.", "exTr": "Tarihçiler, on dokuzuncu yüzyılı sanayi kentlerinin en hızlı genişlediği dönem olarak kabul ediyor."},
  {"tr": "i. (ayın) on dokuzu", "ex": "The conference opens on the nineteenth of September and runs for three full days.", "exTr": "Konferans eylülün on dokuzunda açılıyor ve tam üç gün sürüyor."}
],
"sold-out": [
  {"tr": "s. tükenmiş, biletleri satılmış", "ex": "Organizers added a second date after the sold-out concert left thousands of fans without tickets.", "exTr": "Biletleri tükenen konser binlerce hayranı biletsiz bırakınca organizatörler ikinci bir tarih ekledi."}
],
"spend-all": [
  {"tr": "i. savurgan kimse, müsrif", "ex": "Relatives often described the young heir as a hopeless spend-all who never saved a single coin.", "exTr": "Arkadaşları onu iflah olmaz bir savurgan olarak sık sık tanımlardı."}
],
"trump": [
  {"tr": "f. üstün gelmek, alt etmek, geçmek", "ex": "The scientists' latest discovery trumps every previous theory about the origins of the universe.", "exTr": "Bilim insanlarının en son keşfi, evrenin kökenine dair önceki her teoriyi geride bırakıyor."},
  {"tr": "i. koz (iskambil)", "ex": "In bridge, a single trump can outrank every card from the other three suits.", "exTr": "Briçte, tek bir koz, diğer üç renkteki her kartı geride bırakabilir."}
],
"no-trump": [
  {"tr": "i. (briç) koz belirlenmeyen oyun", "ex": "Experienced bridge players often choose a no-trump contract when their hand is evenly balanced.", "exTr": "Deneyimli briç oyuncuları, elleri dengeli dağıldığında genellikle kozsuz (sanzatu) bir kontratı tercih eder."}
],
"non-issue": [
  {"tr": "i. önemsiz/tartışmaya değmeyen konu", "ex": "For most residents surveyed, parking fees turned out to be a complete non-issue compared with housing costs.", "exTr": "Ankete katılan çoğu sakin için otopark ücretlerinin konut maliyetlerine kıyasla tamamen önemsiz bir konu olduğu ortaya çıktı."}
],
"force-land": [
  {"tr": "f. mecburi iniş yapmak", "ex": "The pilot was forced to force-land the small aircraft in an open field after engine failure.", "exTr": "Pilot, motor arızasından sonra küçük uçakla açık bir tarlaya mecburi iniş yapmak zorunda kaldı."}
],
"house-train": [
  {"tr": "f. (evcil hayvana) ev eğitimi vermek", "ex": "New owners are advised to house-train a puppy consistently during its first few months.", "exTr": "Yeni sahiplere, bir yavru köpeğe ilk birkaç ayında tutarlı bir şekilde ev eğitimi vermeleri öneriliyor."}
],
"litter": [
  {"tr": "i. çöp, etrafa saçılan pislik; f. çöp atmak, kirletmek", "ex": "Local volunteers gathered on Saturday to clear the litter scattered along the riverbank.", "exTr": "Yerel gönüllüler, cumartesi günü nehir kıyısı boyunca saçılmış çöpü temizlemek için toplandı."},
  {"tr": "i. bir batında doğan yavrular (örn. köpek/kedi yavruları)", "ex": "The dog gave birth to a litter of six puppies behind the old barn last week.", "exTr": "Çiftlik kedisi, geçen hafta eski ahırın arkasında bir batında altı yavru doğurdu."}
],
"redundancy": [
  {"tr": "i. (iş yerinde) kadro fazlalığı, işten çıkarma", "ex": "Hundreds of factory workers faced redundancy when the company relocated its production overseas.", "exTr": "Şirket üretimini denizaşırı ülkeye taşıdığında yüzlerce fabrika işçisi işten çıkarmayla karşı karşıya kaldı."},
  {"tr": "i. gereksiz tekrar, fazlalık (dilde/sistemde)", "ex": "Editors removed several sentences to eliminate redundancy from the overly repetitive report.", "exTr": "Editörler, aşırı tekrarlarla dolu rapordan gereksiz tekrarı ortadan kaldırmak için birkaç cümleyi çıkardı."}
],
"unveiled": [
  {"tr": "s. açığa çıkarılmış, tanıtılmış", "ex": "The unveiled statue drew huge crowds who had waited months to see the sculptor's finished work.", "exTr": "Örtüsü kaldırılan heykel, heykeltıraşın tamamlanmış eserini görmek için aylarca bekleyen büyük kalabalıkları çekti."}
],
"thirsty": [
  {"tr": "s. susamış", "ex": "After hours of hiking under the desert sun, the travelers were desperately thirsty.", "exTr": "Çölün güneşi altında saatlerce yürüdükten sonra, gezginler fena hâlde susamıştı."}
],
"well-meant": [
  {"tr": "s. iyi niyetli", "ex": "Even though it confused the patient further, the advice from her friend was clearly well-meant.", "exTr": "Hastanın kafasını daha da karıştırsa da doktorun iyi niyetli tavsiyesi içtenlikle verilmişti."}
],
"trench": [
  {"tr": "i. hendek, siper; f. tecavüz etmek, ihlal etmek (trench on)", "ex": "Archaeologists dug a narrow trench across the field to search for remains of the ancient settlement.", "exTr": "Arkeologlar, antik yerleşimin kalıntılarını aramak için tarlayı boydan boya geçen dar bir hendek kazdı."},
  {"tr": "f. tecavüz etmek, ihlal etmek (trench on/upon)", "ex": "Critics argued that the new surveillance law would trench upon citizens' basic right to privacy.", "exTr": "Eleştirmenler, yeni gözetim yasasının vatandaşların temel mahremiyet hakkını ihlal edeceğini savundu."}
],
"betrayal": [
  {"tr": "i. ihanet", "ex": "The memoir describes the profound sense of betrayal she felt after discovering her partner's secret.", "exTr": "Anı kitabı, partnerinin sırrını keşfettikten sonra hissettiği derin ihanet duygusunu anlatıyor."}
],
"evenly": [
  {"tr": "z. eşit biçimde, düzenli olarak", "ex": "The instructor asked students to spread the paint evenly across the canvas before it dried.", "exTr": "Eğitmen, öğrencilerden boyayı kurumadan önce tuvale eşit biçimde yaymalarını istedi."}
],
"hem": [
  {"tr": "i. (giysi) kıvrım payı, etek ucu", "ex": "The tailor carefully measured the hem before shortening the wedding dress by two centimeters.", "exTr": "Terzi, gelinliği iki santimetre kısaltmadan önce etek ucunu dikkatle ölçtü."},
  {"tr": "f. kararsızlıkla 'hıı' diye ses çıkarmak, öhömlemek", "ex": "Whenever reporters pressed him for specifics, the spokesman would only hem and give vague, noncommittal answers.", "exTr": "Gazeteciler ondan ayrıntı istediğinde, sözcü yalnızca öhömler ve belirsiz, kaçamak cevaplar verirdi."}
],
"moist": [
  {"tr": "s. nemli", "ex": "Gardeners recommend keeping the soil moist but never waterlogged during the seedling's first few weeks.", "exTr": "Bahçıvan, toprağı nemli tutmayı ama asla suya doymuş hâlde bırakmamayı öğütledi."}
],
"red-brown": [
  {"tr": "s. kırmızıya çalan kahverengi", "ex": "A thick layer of red-brown leaves covered the trail, crunching underfoot.", "exTr": "Patikayı, ayak altında çıtırdayan kalın bir kızıl kahverengi yaprak tabakası kaplamıştı."}
],
"top-heavy": [
  {"tr": "s. üstü ağır, dengesiz (fiziksel); üst kademesi şişkin, hiyerarşisi ağır (kurumsal, mecazi)", "ex": "Analysts criticised the company for becoming top-heavy, with far more managers than the departments actually needed.", "exTr": "Analistler, şirketi departmanların gerçekte ihtiyaç duyduğundan çok daha fazla yöneticiye sahip olarak üst kademesi şişkin hale gelmekle eleştirdi."},
  {"tr": "s. üstü ağır, devrilmeye yatkın (fiziksel olarak)", "ex": "The overloaded truck looked dangerously top-heavy as it approached the sharp bend in the mountain road.", "exTr": "Aşırı yüklü kamyon, dağ yolundaki keskin viraja yaklaşırken tehlikeli derecede üstü ağır görünüyordu."}
],
"blood-related": [
  {"tr": "s. kan bağı olan, akraba", "ex": "Only blood-related family members were permitted to visit the patient during the strict quarantine period.", "exTr": "Hastayı yalnızca kan bağı olan aile üyelerinin ziyaret etmesine izin verildi."}
],
"clean-living": [
  {"tr": "s. temiz yaşayan, ahlaklı", "ex": "The athlete built her public image around a clean-living lifestyle free of alcohol and late nights.", "exTr": "Sporcu, alkolden ve gece hayatından uzak, temiz yaşayan bir yaşam tarzı üzerine kamusal imajını inşa etti."}
],
"dread": [
  {"tr": "f. -den korkmak, çekinmek", "ex": "Many students dread the final exam period more than any other time of the academic year.", "exTr": "Birçok öğrenci, akademik yılın diğer herhangi bir döneminden çok final sınavı döneminden korkar."},
  {"tr": "i. dehşet, büyük korku", "ex": "A sense of quiet dread spread through the village as the storm clouds gathered overhead.", "exTr": "Fırtına bulutları tepede toplanırken, köy boyunca sessiz bir dehşet duygusu yayıldı."}
],
"flare": [
  {"tr": "f. alevlenmek, parlamak", "ex": "Tensions began to flare between the two neighboring countries after the disputed border incident.", "exTr": "Tartışmalı sınır olayının ardından, iki komşu ülke arasında gerginlikler alevlenmeye başladı."},
  {"tr": "i. işaret fişeği", "ex": "The stranded sailors fired a flare into the night sky, hoping a passing ship would notice.", "exTr": "Mahsur kalan denizciler, geçen bir geminin fark etmesini umarak gece gökyüzüne bir işaret fişeği ateşledi."}
],
"mid-off": [
  {"tr": "i. (kriket) atıcının yanındaki off tarafı mevkii", "ex": "In cricket, the fielder standing at mid-off must react quickly to balls driven straight down the pitch.", "exTr": "Kriket sporunda, mid-off mevkiinde duran oyuncu, sahaya düz vurulan toplara hızla tepki vermelidir."}
],
"sex-limited": [
  {"tr": "s. cinsiyetle sınırlı (yalnız bir cinsiyette görülen)", "ex": "Certain hereditary traits are sex-limited, appearing almost exclusively in offspring of one particular gender.", "exTr": "Bazı kalıtsal özellikler cinsiyetle sınırlıdır ve neredeyse yalnızca belirli bir cinsiyetteki yavrularda ortaya çıkar."}
],
"unworthy": [
  {"tr": "s. layık olmayan, değersiz", "ex": "The committee judged the proposal unworthy of funding due to its weak scientific basis.", "exTr": "Komite, zayıf bilimsel temeli nedeniyle öneriyi finanse edilmeye değer bulmadı."}
],
"drop-dead": [
  {"tr": "s./z. nefes kesici, çarpıcı", "ex": "The renovated penthouse offered drop-dead views of the entire city skyline at sunset.", "exTr": "Yenilenen çatı katı dairesi, gün batımında tüm şehir silüetinin nefes kesici manzarasını sunuyordu."}
],
"wide-body": [
  {"tr": "s./i. geniş gövdeli (uçak)", "ex": "Airlines increasingly rely on wide-body aircraft for long-haul routes connecting distant continents.", "exTr": "Havayolları, uzak kıtaları birbirine bağlayan uzun mesafeli rotalar için giderek daha fazla geniş gövdeli uçaklara güveniyor."}
],
"devotional": [
  {"tr": "s. ibadete ilişkin, dini", "ex": "Every morning, she reads a short devotional passage before starting her daily responsibilities.", "exTr": "Her sabah, günlük sorumluluklarına başlamadan önce ibadete ilişkin kısa bir metin okur."},
  {"tr": "i. dua kitabı", "ex": "The historian examined a sixteenth-century devotional printed for wealthy merchants in northern Europe.", "exTr": "Tarihçi, Kuzey Avrupa'daki varlıklı tüccarlar için basılmış on altıncı yüzyıldan kalma bir dua kitabını inceledi."}
],
"irritant": [
  {"tr": "i. tahriş edici madde, rahatsız edici etken", "ex": "Chemists identified the cleaning solvent as a common skin irritant found in many households.", "exTr": "Kimyagerler, temizlik solventini birçok evde bulunan yaygın bir cilt tahriş edici madde olarak tanımladı."}
],
"rib": [
  {"tr": "i. kaburga (kemiği)", "ex": "The X-ray revealed a small fracture in the patient's lower rib after the fall.", "exTr": "Röntgen, düşmenin ardından hastanın alt kaburgasında küçük bir kırık olduğunu ortaya çıkardı."},
  {"tr": "f. takılmak, şakayla iğnelemek", "ex": "His coworkers gently rib him whenever he arrives late for the Monday morning meeting.", "exTr": "İş arkadaşları, pazartesi sabahı toplantısına her geç kaldığında ona nazikçe takılır."}
],
"roll-on": [
  {"tr": "i. rulo uygulama (deodorant vb. için yuvarlanarak sürülen ambalaj)", "ex": "She quickly applied her roll-on before leaving for the morning meeting at work.", "exTr": "İşteki sabah toplantısına gitmeden önce hızlıca roll-on deodorantını sürdü."}
],
"six-spot": [
  {"tr": "i. altı benekli taş, kart ya da zar yüzü (domino/iskambilde)", "ex": "During the game, rolling a six-spot twice in a row gave him an unexpected advantage.", "exTr": "Oyun sırasında art arda iki kez zarda altı atması ona beklenmedik bir avantaj sağladı."}
],
"startle": [
  {"tr": "i. irkilme, ürkme", "ex": "The baby gave a sudden startle when the heavy door slammed shut behind the visitors.", "exTr": "Ağır kapı ziyaretçilerin arkasından çarparak kapandığında bebek ani bir irkilme yaşadı."},
  {"tr": "f. ürkütmek, irkiltmek", "ex": "A sudden loud noise from the kitchen startled everyone in the living room.", "exTr": "Mutfaktan gelen ani ve yüksek bir ses, oturma odasındaki herkesi irkiltti."}
],
"touch-type": [
  {"tr": "f. on parmak yazmak (klavyeye bakmadan)", "ex": "Modern typing courses teach students to touch-type so they can write quickly without looking at the keyboard.", "exTr": "Modern daktilo kursları, öğrencilere klavyeye bakmadan hızlıca yazabilmeleri için dokunarak yazmayı öğretir."}
],
"water-target": [
  {"tr": "i. su kalkanı (Brasenia; yüzen oval yapraklı, mor çiçekli bir su bitkisi)", "ex": "The pond was covered with water-target plants whose purple flowers attracted many small insects.", "exTr": "Gölet, mor çiçekleri birçok küçük böceği kendine çeken su kalkanı bitkileriyle kaplıydı."}
],
"cross-section": [
  {"tr": "i. enine kesit", "ex": "The textbook included a cross-section diagram showing the internal structure of a leaf.", "exTr": "Ders kitabı, bir yaprağın iç yapısını gösteren enine kesit bir şema içeriyordu."}
],
"demolished": [
  {"tr": "s. yıkılmış", "ex": "The demolished building was cleared away within a week to make room for the new library.", "exTr": "Yıkılan bina, yeni kütüphaneye yer açmak için bir hafta içinde kaldırıldı."}
],
"inflated": [
  {"tr": "s. şişirilmiş, abartılı", "ex": "Consumers complained that the online store displayed inflated prices right before the holiday sale.", "exTr": "Tüketiciler, çevrimiçi mağazanın tatil indiriminden hemen önce şişirilmiş fiyatlar gösterdiğinden şikâyet etti."}
],
"multiple-choice": [
  {"tr": "s. çoktan seçmeli", "ex": "Most sections of the exam consist of multiple-choice questions rather than open-ended essays.", "exTr": "Sınavın çoğu bölümü, açık uçlu kompozisyon sorularından ziyade çoktan seçmeli sorulardan oluşur."}
],
"tectonic": [
  {"tr": "s. tektonik, yer kabuğu hareketleriyle ilgili", "ex": "Frequent earthquakes in the region are caused by tectonic plates shifting slowly beneath the earth's surface.", "exTr": "Bölgedeki sık depremler, yeryüzünün altında yavaşça hareket eden tektonik levhalardan kaynaklanıyor."}
],
"top-grade": [
  {"tr": "s. en kaliteli, üst düzey", "ex": "The restaurant only serves top-grade beef sourced directly from certified organic farms nearby.", "exTr": "Restoran, yalnızca yakındaki sertifikalı organik çiftliklerden doğrudan tedarik edilen en kaliteli sığır etini servis ediyor."}
],
"low-lying": [
  {"tr": "s. alçak kesimde bulunan", "ex": "Many low-lying fields in the river delta are protected by a network of dikes and pumping stations.", "exTr": "Nehir deltasındaki alçak arazilerin çoğu bir set ve pompa istasyonu ağıyla korunuyor."}
],

/* --- ornek-dogrula.py: çok türlü kelimelere tür başına örnek --- */
"abdominal": [
  {"tr": "s. karınla ilgili, karın-", "ex": "The surgeon detected mild abdominal swelling during the patient's routine post-operative examination.", "exTr": "Cerrah, hastanın rutin ameliyat sonrası muayenesinde hafif karın şişliği tespit etti."},
  {"tr": "i. (çoğ.) karın kasları", "ex": "Athletes strengthen their abdominals with daily core exercises to improve balance and posture.", "exTr": "Sporcular, denge ve duruşu geliştirmek için günlük merkez bölge egzersizleriyle karın kaslarını güçlendirir."}
],
"abroad": [
  {"tr": "z. yurt dışında/dışına", "ex": "Universities encourage students to study abroad for at least one semester to gain international experience.", "exTr": "Üniversiteler, öğrencileri uluslararası deneyim kazanmaları için en az bir dönem yurt dışında okumaya teşvik ediyor."},
  {"tr": "s. yurt dışındaki", "ex": "The government launched a program to support citizens abroad who wish to invest in domestic industries.", "exTr": "Hükümet, yerli sanayilere yatırım yapmak isteyen yurt dışındaki vatandaşları desteklemek için bir program başlattı."}
],
"additive": [
  {"tr": "i. katkı maddesi", "ex": "Manufacturers must list every food additive clearly on the product packaging label.", "exTr": "Üreticiler, ürün ambalajı etiketinde her gıda katkı maddesini açıkça belirtmelidir."},
  {"tr": "s. katkılı, eklemeli", "ex": "Aerospace companies increasingly rely on additive manufacturing to produce lightweight engine components.", "exTr": "Havacılık şirketleri, hafif motor parçaları üretmek için giderek daha fazla eklemeli imalata başvuruyor."}
],
"adhesive": [
  {"tr": "s. yapışkan", "ex": "Engineers tested the adhesive properties of the new material under extreme temperature conditions.", "exTr": "Mühendisler, yeni malzemenin yapışkan özelliklerini aşırı sıcaklık koşulları altında test etti."},
  {"tr": "i. yapıştırıcı", "ex": "Manufacturers use a strong adhesive to bond the layers of the smartphone screen together permanently.", "exTr": "Üreticiler, akıllı telefon ekranının katmanlarını kalıcı olarak birbirine bağlamak için güçlü bir yapıştırıcı kullanır."}
],
"alert": [
  {"tr": "s. tetikte, uyanık, dikkatli", "ex": "Doctors advise elderly patients to stay mentally alert by reading and solving puzzles regularly.", "exTr": "Doktorlar, yaşlı hastalara düzenli olarak okuyup bulmaca çözerek zihinsel olarak tetikte kalmalarını tavsiye eder."},
  {"tr": "f. uyarmak", "ex": "Sensors automatically alert emergency services when they detect unusual seismic activity.", "exTr": "Sensörler, olağan dışı sismik hareketlilik tespit ettiklerinde acil durum servislerini otomatik olarak uyarır."}
],
"alignment": [
  {"tr": "i. hizalama, uyum", "ex": "Mechanics checked the wheel alignment carefully before allowing the vehicle back onto the highway.", "exTr": "Tamirciler, aracı otoyola tekrar çıkarmadan önce tekerlek hizalamasını dikkatle kontrol etti."},
  {"tr": "i. ittifak, birleşme", "ex": "The two parties formed a political alignment to challenge the ruling coalition in the elections.", "exTr": "İki parti, seçimlerde iktidardaki koalisyona meydan okumak için siyasi bir ittifak kurdu."}
],
"alloy": [
  {"tr": "i. alaşım", "ex": "Engineers developed a lightweight alloy that combines the strength of steel with the low weight of aluminum.", "exTr": "Mühendisler, çeliğin dayanıklılığını alüminyumun düşük ağırlığıyla birleştiren hafif bir alaşım geliştirdi."},
  {"tr": "f. alaşım yapmak, katmak", "ex": "Metalworkers alloy copper with tin to produce bronze, a far more durable material.", "exTr": "Metal işçileri, çok daha dayanıklı bir malzeme olan bronz üretmek için bakırı kalayla alaşım yapar."}
],
"altogether": [
  {"tr": "z. tamamen, büsbütün, sözün kısası", "ex": "Critics argued that the proposal was altogether too vague to guide meaningful environmental reform.", "exTr": "Eleştirmenler, önerinin anlamlı bir çevresel reforma rehberlik edemeyecek kadar tamamen belirsiz olduğunu savundu."},
  {"tr": "i. (the altogether) çıplaklık", "ex": "The Victorian painting caused a public scandal because it showed the goddess in the altogether.", "exTr": "Viktorya dönemi tablosu, tanrıçayı çıplak halde gösterdiği için halk arasında skandala yol açtı."}
],
"ambush": [
  {"tr": "i. pusu", "ex": "The patrol walked straight into an ambush that had been prepared near the border crossing.", "exTr": "Devriye, sınır geçidi yakınında hazırlanmış bir pusunun tam ortasına düştü."},
  {"tr": "f. pusu kurmak, pusuya düşürmek", "ex": "The soldiers were warned that rebels might ambush the convoy along the narrow mountain road.", "exTr": "Askerler, isyancıların dar dağ yolunda konvoya pusu kurabileceği konusunda uyarıldı."}
],
"amphibian": [
  {"tr": "i. iki yaşamlı (hayvan)", "ex": "Biologists classify frogs and salamanders as amphibians because they live both in water and on land.", "exTr": "Biyologlar, kurbağaları ve semenderleri hem suda hem karada yaşadıkları için iki yaşamlı hayvanlar olarak sınıflandırır."},
  {"tr": "s. karada ve suda yaşayan", "ex": "The army tested a new amphibian vehicle capable of crossing rivers without any bridge support.", "exTr": "Ordu, hiçbir köprü desteği olmadan nehirleri geçebilen, karada ve suda gidebilen yeni bir araç test etti."}
],
"aquatic": [
  {"tr": "s. sucul, suda yaşayan", "ex": "Pollution in the river has drastically reduced the diversity of aquatic life over the past decade.", "exTr": "Nehirdeki kirlilik, son on yılda sucul yaşamın çeşitliliğini büyük ölçüde azalttı."},
  {"tr": "i. sucul bitki/hayvan", "ex": "The garden center sells various aquatics suitable for small backyard ponds.", "exTr": "Bahçe merkezi, küçük arka bahçe havuzlarına uygun çeşitli sucul bitkiler satıyor."}
],
"archive": [
  {"tr": "i. arşiv", "ex": "Historians spent months searching the national archive for letters written during the revolution.", "exTr": "Tarihçiler, devrim sırasında yazılmış mektupları bulmak için ulusal arşivde aylarca araştırma yaptı."},
  {"tr": "f. arşivlemek", "ex": "Libraries now archive millions of digital newspapers so future researchers can access them easily.", "exTr": "Kütüphaneler artık milyonlarca dijital gazeteyi arşivliyor; böylece gelecekteki araştırmacılar onlara kolayca erişebiliyor."}
],
"armour": [
  {"tr": "i. zırh", "ex": "Medieval knights wore heavy armour that could weigh more than twenty kilograms in total.", "exTr": "Ortaçağ şövalyeleri, toplamda yirmi kilogramdan fazla ağırlığa sahip olabilen ağır zırhlar giyerdi."},
  {"tr": "f. zırhlamak", "ex": "The military armoured its transport vehicles to protect soldiers from roadside explosions.", "exTr": "Ordu, askerleri yol kenarı patlamalarından korumak için nakliye araçlarını zırhladı."}
],
"asphalt": [
  {"tr": "i. asfalt", "ex": "Workers spread fresh asphalt across the damaged highway to smooth out the surface before winter.", "exTr": "İşçiler, kışa girmeden yüzeyi düzleştirmek için hasarlı otoyola taze asfalt serdi."},
  {"tr": "f. asfaltlamak", "ex": "The municipality promised to asphalt the remaining village roads before the rainy season begins.", "exTr": "Belediye, yağışlı mevsim başlamadan önce geriye kalan köy yollarını asfaltlama sözü verdi."}
],
"awe": [
  {"tr": "i. huşu, büyük hayranlık", "ex": "Visitors often stand in awe before the sheer scale of the ancient temple's stone columns.", "exTr": "Ziyaretçiler, antik tapınağın taş sütunlarının muazzam ölçeği karşısında genellikle huşu içinde durur."},
  {"tr": "f. hayranlık uyandırmak", "ex": "The gymnast's flawless routine awed the judges and secured her a place in the final.", "exTr": "Jimnastikçinin kusursuz serisi jüri üyelerinde hayranlık uyandırdı ve ona finalde bir yer kazandırdı."}
],
"backpack": [
  {"tr": "i. sırt çantası", "ex": "The hiker carried a waterproof backpack containing food supplies for the three-day mountain trek.", "exTr": "Dağcı, üç günlük dağ yürüyüşü için yiyecek malzemeleri içeren su geçirmez bir sırt çantası taşıyordu."},
  {"tr": "f. sırt çantasıyla gezmek", "ex": "Every summer, thousands of students backpack across Europe on a modest budget.", "exTr": "Her yaz, binlerce öğrenci mütevazı bir bütçeyle Avrupa'yı sırt çantasıyla gezer."}
],
"bag": [
  {"tr": "i. çanta, torba", "ex": "Airport security asked passengers to place every liquid container in a transparent plastic bag.", "exTr": "Havalimanı güvenliği, yolculardan her sıvı kabını şeffaf bir plastik torbaya koymalarını istedi."},
  {"tr": "f. torbaya koymak", "ex": "The cashier began to bag the groceries quickly as the line grew longer.", "exTr": "Kasiyer, sıra uzadıkça marketten alınanları hızlıca torbaya koymaya başladı."}
],
"balloon": [
  {"tr": "i. balon", "ex": "Scientists launched a weather balloon to collect atmospheric data at high altitudes.", "exTr": "Bilim insanları, yüksek irtifalarda atmosfer verileri toplamak için bir meteoroloji balonu fırlattı."},
  {"tr": "f. şişmek, balon gibi şişmek", "ex": "Household debt began to balloon rapidly after interest rates dropped and borrowing became easier.", "exTr": "Faiz oranları düşüp borçlanma kolaylaştıktan sonra hane halkı borcu hızla şişmeye başladı."}
],
"bare": [
  {"tr": "s. çıplak", "ex": "Walking on the bare rock without proper shoes, the climbers risked cutting their feet badly.", "exTr": "Uygun ayakkabı olmadan çıplak kayanın üzerinde yürüyen dağcılar, ayaklarını ciddi şekilde kesme riski taşıyordu."},
  {"tr": "f. açığa çıkarmak", "ex": "The investigation bared serious flaws in the bank's system for approving large loans.", "exTr": "Soruşturma, bankanın büyük kredileri onaylama sistemindeki ciddi kusurları açığa çıkardı."}
],
"beach": [
  {"tr": "i. plaj, kumsal", "ex": "Volunteers cleaned tons of plastic waste from the beach before the start of tourist season.", "exTr": "Gönüllüler, turizm sezonu başlamadan önce plajdan tonlarca plastik atığı temizledi."},
  {"tr": "f. karaya çekmek/oturtmak", "ex": "The sailors beached their small boat carefully before the storm reached the harbor.", "exTr": "Denizciler, fırtına limana ulaşmadan önce küçük teknelerini dikkatlice karaya çekti."}
],
"bicycle": [
  {"tr": "i. bisiklet", "ex": "The museum displays a nineteenth-century bicycle made almost entirely of wood.", "exTr": "Müze, neredeyse tamamen ahşaptan yapılmış on dokuzuncu yüzyıldan kalma bir bisiklet sergiliyor."},
  {"tr": "f. bisiklete binmek", "ex": "Many commuters now bicycle to work instead of driving through the congested downtown traffic.", "exTr": "Birçok işe gidip gelen kişi artık şehir merkezindeki tıkanık trafikte araç kullanmak yerine bisikletle işe gidiyor."}
],
"bike": [
  {"tr": "i. bisiklet", "ex": "Sales of electric bikes have risen sharply as fuel prices continue to climb across Europe.", "exTr": "Avrupa genelinde yakıt fiyatları yükselmeye devam ederken elektrikli bisiklet satışları keskin biçimde arttı."},
  {"tr": "f. bisiklete binmek", "ex": "City planners encouraged residents to bike to work to reduce traffic congestion.", "exTr": "Şehir plancıları, trafik sıkışıklığını azaltmak için sakinleri işe bisikletle gitmeye teşvik etti."}
],
"bilingual": [
  {"tr": "s. iki dilli", "ex": "Studies suggest that bilingual children often develop stronger problem-solving skills than their monolingual peers.", "exTr": "Araştırmalar, iki dilli çocukların tek dilli akranlarına göre çoğu zaman daha güçlü problem çözme becerileri geliştirdiğini öne sürüyor."},
  {"tr": "i. iki dil konuşan kişi", "ex": "Researchers found that bilinguals frequently switch between languages depending on the social context.", "exTr": "Araştırmacılar, iki dil konuşan kişilerin sosyal bağlama bağlı olarak diller arasında sıkça geçiş yaptığını buldu."}
],
"bin": [
  {"tr": "i. kutu, çöp kutusu", "ex": "Please place all recyclable materials in the correct bin before leaving the office.", "exTr": "Lütfen ofisten ayrılmadan önce tüm geri dönüştürülebilir malzemeleri doğru çöp kutusuna koyun."},
  {"tr": "f. (kutuya) koymak, atmak", "ex": "Editors binned hundreds of submissions that failed to follow the journal's basic guidelines.", "exTr": "Editörler, derginin temel kurallarına uymayan yüzlerce başvuruyu çöpe attı."}
],
"binge": [
  {"tr": "i. aşırı düşkünlük dönemi", "ex": "After the stressful exam period, several students went on a binge of ordering fast food every night.", "exTr": "Stresli sınav döneminin ardından birkaç öğrenci, her gece fast food sipariş ederek aşırı bir tüketim dönemine girdi."},
  {"tr": "f. aşırı derecede tüketmek", "ex": "Health experts warn that people who binge on salty snacks late at night risk high blood pressure.", "exTr": "Sağlık uzmanları, gece geç saatlerde tuzlu atıştırmalıkları aşırı derecede tüketen kişilerin yüksek tansiyon riskiyle karşı karşıya olduğu konusunda uyarıyor."}
],
"bleach": [
  {"tr": "i. çamaşır suyu", "ex": "She used bleach to remove the stubborn stains from the white cotton tablecloth.", "exTr": "Beyaz pamuklu masa örtüsündeki inatçı lekeleri çıkarmak için çamaşır suyu kullandı."},
  {"tr": "f. ağartmak", "ex": "Rising sea temperatures bleach coral reefs, leaving vast underwater areas pale and lifeless.", "exTr": "Yükselen deniz sıcaklıkları mercan resiflerini ağartarak geniş su altı alanlarını soluk ve cansız bırakıyor."}
],
"blink": [
  {"tr": "f. göz kırpmak", "ex": "The sudden camera flash made almost everyone in the room blink at the same moment.", "exTr": "Ani kamera flaşı, odadaki neredeyse herkesin aynı anda göz kırpmasına neden oldu."},
  {"tr": "i. göz kırpma", "ex": "The entire accident happened in the blink of an eye, leaving witnesses unable to describe it.", "exTr": "Kazanın tamamı bir göz kırpma anında gerçekleşti ve tanıklar olayı tarif edemedi."}
],
"blush": [
  {"tr": "f. (yüzü) kızarmak", "ex": "She began to blush when the teacher praised her project in front of the entire class.", "exTr": "Öğretmen projesini tüm sınıfın önünde övdüğünde yüzü kızarmaya başladı."},
  {"tr": "i. kızarma, allık", "ex": "A sudden blush spread across her cheeks when her name was announced as the winner.", "exTr": "Adı kazanan olarak açıklandığında yanaklarına ani bir kızarma yayıldı."}
],
"boast": [
  {"tr": "f. övünmek, böbürlenmek", "ex": "He liked to boast about his university achievements whenever new colleagues joined the team.", "exTr": "Ekibe her yeni meslektaş katıldığında üniversite başarılarıyla övünmeyi severdi."},
  {"tr": "i. övünme", "ex": "His boast that he could finish the marathon in under three hours proved completely empty.", "exTr": "Maratonu üç saatin altında bitirebileceğine dair övünmesinin tamamen boş olduğu ortaya çıktı."}
],
"bohemian": [
  {"tr": "s. bohem, sıra dışı", "ex": "The artist embraced a bohemian lifestyle, moving between cities and rejecting conventional career paths.", "exTr": "Sanatçı, şehirler arasında dolaşıp geleneksel kariyer yollarını reddederek bohem bir yaşam tarzını benimsedi."},
  {"tr": "i. bohem kişi", "ex": "In the 1920s, Paris attracted bohemians from around the world who filled its cafes with radical ideas.", "exTr": "1920'lerde Paris, kafelerini radikal fikirlerle dolduran dünyanın dört bir yanından gelen bohemleri kendine çekti."}
],
"bombard": [
  {"tr": "f. bombalamak", "ex": "Enemy aircraft bombarded the coastal city for three consecutive nights during the siege.", "exTr": "Düşman uçakları, kuşatma sırasında kıyı kentini art arda üç gece bombaladı."},
  {"tr": "f. (sorularla/bilgiyle) yoğun biçimde boğmak", "ex": "Reporters began to bombard the minister with questions about the sudden policy reversal.", "exTr": "Gazeteciler, bakanı ani politika değişikliğiyle ilgili sorularla boğmaya başladı."}
],
"brake": [
  {"tr": "i. fren", "ex": "Mechanics discovered that the vehicle's rear brake had worn down dangerously after months of heavy use.", "exTr": "Tamirciler, aracın arka freninin aylarca süren ağır kullanımın ardından tehlikeli biçimde aşındığını fark etti."},
  {"tr": "f. fren yapmak", "ex": "The driver had to brake suddenly when a deer ran across the highway at dusk.", "exTr": "Sürücü, alacakaranlıkta bir geyik otoyoldan koşarak geçtiğinde aniden fren yapmak zorunda kaldı."}
],
"buffer": [
  {"tr": "i. tampon", "ex": "Wetlands act as a natural buffer that absorbs floodwater before it reaches nearby towns.", "exTr": "Sulak alanlar, sel suyu yakın kasabalara ulaşmadan önce onu emen doğal bir tampon görevi görür."},
  {"tr": "f. tamponlamak, korumak", "ex": "Government subsidies helped buffer small farmers against the sharp decline in global grain prices.", "exTr": "Devlet sübvansiyonları, küçük çiftçileri küresel tahıl fiyatlarındaki sert düşüşe karşı korumaya yardımcı oldu."}
],
"build-up": [
  {"tr": "i. birikme, yığılma, artış", "ex": "Scientists warned that the gradual build-up of greenhouse gases was accelerating global warming.", "exTr": "Bilim insanları, sera gazlarının kademeli birikiminin küresel ısınmayı hızlandırdığı konusunda uyardı."},
  {"tr": "f. biriktirmek", "ex": "Regular exercise helps the body build up resistance to common infections over time.", "exTr": "Düzenli egzersiz, vücudun zamanla yaygın enfeksiyonlara karşı direnç biriktirmesine yardımcı olur."}
],
"bully": [
  {"tr": "i. zorba, kabadayı", "ex": "The novel's main character finally stands up to the neighborhood bully who torments younger children.", "exTr": "Romanın ana karakteri, sonunda küçük çocuklara eziyet eden mahalle zorbasına karşı koyar."},
  {"tr": "f. zorbalık etmek", "ex": "The school introduced a new policy to prevent older students from bullying younger ones.", "exTr": "Okul, büyük öğrencilerin küçüklere zorbalık yapmasını önlemek için yeni bir politika getirdi."}
],
"bunch": [
  {"tr": "i. demet, salkım, grup", "ex": "She placed a fresh bunch of grapes on the kitchen table before the guests arrived.", "exTr": "Konuklar gelmeden önce mutfak masasına taze bir salkım üzüm koydu."},
  {"tr": "f. bir araya toplanmak", "ex": "Runners bunched together at the narrow bridge, slowing the entire marathon field.", "exTr": "Koşucular dar köprüde bir araya toplanarak tüm maraton grubunu yavaşlattı."}
],
"bus": [
  {"tr": "i. otobüs", "ex": "The electric bus can carry eighty passengers and produces no exhaust emissions in the city.", "exTr": "Elektrikli otobüs seksen yolcu taşıyabiliyor ve şehirde hiç egzoz emisyonu üretmiyor."},
  {"tr": "f. otobüsle taşımak", "ex": "The district decided to bus students from remote villages to the new regional school.", "exTr": "İlçe, uzak köylerdeki öğrencileri yeni bölge okuluna otobüsle taşımaya karar verdi."}
],
"butterfly": [
  {"tr": "i. kelebek", "ex": "Every spring, thousands of monarch butterflies migrate across North America to reach warmer regions.", "exTr": "Her ilkbaharda, binlerce monark kelebeği daha ılık bölgelere ulaşmak için Kuzey Amerika boyunca göç eder."},
  {"tr": "f. kelebek gibi uçuşmak", "ex": "The excited hostess butterflied from table to table, greeting every guest at the evening reception.", "exTr": "Heyecanlı ev sahibesi, akşam davetinde her konuğu selamlayarak masadan masaya kelebek gibi uçuştu."}
],
"cage": [
  {"tr": "i. kafes", "ex": "Zookeepers moved the injured eagle into a spacious cage for careful observation.", "exTr": "Hayvanat bahçesi görevlileri, yaralı kartalı dikkatli gözlem için geniş bir kafese taşıdı."},
  {"tr": "f. kafese kapatmak", "ex": "Animal rights groups protested against farms that cage hens in extremely confined spaces.", "exTr": "Hayvan hakları grupları, tavukları son derece dar alanlarda kafese kapatan çiftlikleri protesto etti."}
],
"calendar": [
  {"tr": "i. takvim", "ex": "The ancient civilization developed a remarkably accurate calendar based on lunar and solar cycles.", "exTr": "Antik uygarlık, ay ve güneş döngülerine dayanan oldukça doğru bir takvim geliştirdi."},
  {"tr": "f. takvime kaydetmek", "ex": "The secretary calendared the committee's quarterly meetings for the entire upcoming year.", "exTr": "Sekreter, komitenin üç aylık toplantılarını önümüzdeki yılın tamamı için takvime kaydetti."}
],
"camouflage": [
  {"tr": "i. kamuflaj", "ex": "Certain insects use camouflage to blend perfectly with the leaves and bark surrounding them.", "exTr": "Bazı böcekler, çevrelerindeki yapraklar ve kabuklarla mükemmel bir şekilde kaynaşmak için kamuflaj kullanır."},
  {"tr": "f. kamufle etmek", "ex": "Soldiers camouflaged their vehicles with branches and mud before the night operation began.", "exTr": "Askerler, gece operasyonu başlamadan önce araçlarını dal ve çamurla kamufle etti."}
],
"capitalist": [
  {"tr": "s. kapitalist", "ex": "Historians debate how rapidly capitalist economies expanded following the end of the war.", "exTr": "Tarihçiler, savaşın bitiminin ardından kapitalist ekonomilerin ne kadar hızlı büyüdüğünü tartışıyor."},
  {"tr": "i. kapitalist, sermayedar", "ex": "The railway boom of the 1860s made several capitalists extraordinarily wealthy within a decade.", "exTr": "1860'lardaki demiryolu patlaması, birkaç sermayedarı on yıl içinde olağanüstü zengin yaptı."}
],
"captain": [
  {"tr": "i. kaptan", "ex": "Before the storm hit, the captain ordered every passenger to return immediately to their cabins.", "exTr": "Fırtına başlamadan önce, kaptan tüm yolculardan derhal kamaralarına dönmelerini emretti."},
  {"tr": "f. kaptanlık yapmak", "ex": "She captained the national volleyball team for six years before retiring from professional sport.", "exTr": "Profesyonel spordan çekilmeden önce altı yıl boyunca milli voleybol takımının kaptanlığını yaptı."}
],
"captive": [
  {"tr": "s. esir, tutsak", "ex": "After weeks in the jungle, the captive soldier finally managed to escape his captors.", "exTr": "Ormanda haftalarca kaldıktan sonra esir asker sonunda kendisini tutsak edenlerden kaçmayı başardı."},
  {"tr": "i. esir", "ex": "The rebels released the captives after months of negotiations mediated by international observers.", "exTr": "İsyancılar, uluslararası gözlemcilerin arabuluculuk ettiği aylarca süren müzakerelerin ardından esirleri serbest bıraktı."}
],
"caring": [
  {"tr": "s. şefkatli, ilgili", "ex": "Nurses in the pediatric ward are known for their patient and caring approach to children.", "exTr": "Çocuk servisindeki hemşireler, çocuklara karşı sabırlı ve şefkatli yaklaşımlarıyla tanınır."},
  {"tr": "i. şefkat, bakım", "ex": "Experts argue that caring remains the most essential element of good medical treatment.", "exTr": "Uzmanlar, şefkatin iyi bir tıbbi tedavinin en temel unsuru olmaya devam ettiğini savunuyor."}
],
"carpet": [
  {"tr": "i. halı", "ex": "The museum restored a sixteenth-century carpet woven by master craftsmen in Anatolia.", "exTr": "Müze, Anadolu'da usta zanaatkarlar tarafından dokunmuş on altıncı yüzyıldan kalma bir halıyı restore etti."},
  {"tr": "f. halı ile kaplamak", "ex": "Workers began to carpet the entire conference room before the new office officially opened.", "exTr": "İşçiler, yeni ofis resmen açılmadan önce tüm konferans salonunu halı ile kaplamaya başladı."}
],
"catalogue": [
  {"tr": "i. katalog", "ex": "The library published a detailed catalogue listing every manuscript in its medieval collection.", "exTr": "Kütüphane, ortaçağ koleksiyonundaki her el yazmasını listeleyen ayrıntılı bir katalog yayımladı."},
  {"tr": "f. kataloglamak", "ex": "Archivists spent months trying to catalogue thousands of handwritten letters found in the attic.", "exTr": "Arşivciler, tavan arasında bulunan binlerce el yazısı mektubu kataloglamaya çalışarak aylarını harcadı."}
],
"ceramic": [
  {"tr": "s. seramik", "ex": "Archaeologists uncovered several ceramic bowls buried alongside ancient tools near the riverbank.", "exTr": "Arkeologlar, nehir kıyısında antik aletlerin yanına gömülü birkaç seramik kâse buldu."},
  {"tr": "i. seramik", "ex": "The museum's collection includes delicate ceramics produced in China more than a thousand years ago.", "exTr": "Müzenin koleksiyonu, Çin'de bin yıldan uzun süre önce üretilmiş zarif seramikleri içeriyor."}
],
"cherry": [
  {"tr": "i. kiraz", "ex": "Farmers in the valley harvest cherry crops each summer before exporting them across the region.", "exTr": "Vadideki çiftçiler, bölgeye ihraç etmeden önce her yaz kiraz mahsulünü hasat eder."},
  {"tr": "s. kiraz kırmızısı", "ex": "She painted the kitchen walls a warm cherry shade that brightened the whole room.", "exTr": "Mutfak duvarlarını, tüm odayı aydınlatan sıcak bir kiraz kırmızısı tona boyadı."}
],
"chunk": [
  {"tr": "i. iri parça, kütle", "ex": "A large chunk of the glacier broke away and fell into the sea last week.", "exTr": "Geçen hafta buzulun büyük bir parçası koparak denize düştü."},
  {"tr": "f. parçalara ayırmak", "ex": "Teachers often chunk complex information into smaller units to help students remember it.", "exTr": "Öğretmenler, öğrencilerin hatırlamasına yardımcı olmak için karmaşık bilgiyi genellikle daha küçük birimlere ayırır."}
],
"clap": [
  {"tr": "f. alkışlamak", "ex": "The audience began to clap enthusiastically the moment the young violinist finished her performance.", "exTr": "Genç kemancı performansını bitirir bitirmez seyirci coşkuyla alkışlamaya başladı."},
  {"tr": "i. alkış, gürleme (gök gürültüsü)", "ex": "A sudden clap of thunder startled the campers just as they finished setting up their tents.", "exTr": "Ani bir gök gürlemesi, çadırlarını kurmayı henüz bitirmiş olan kampçıları irkiltti."}
],
"clash": [
  {"tr": "i. çatışma", "ex": "The violent clash at the border crossing left several soldiers injured on both sides.", "exTr": "Sınır kapısındaki şiddetli çatışma, her iki tarafta da birkaç askerin yaralanmasına yol açtı."},
  {"tr": "f. çatışmak, uyuşmamak", "ex": "Protesters and police officers clashed violently near the government building late Friday evening.", "exTr": "Göstericiler ve polis memurları, cuma akşamı geç saatlerde hükümet binası yakınında şiddetli biçimde çatıştı."}
],
"claw": [
  {"tr": "i. pençe, tırnak", "ex": "The frightened cat raised its claw defensively as the stranger approached the porch.", "exTr": "Korkmuş kedi, yabancı verandaya yaklaşırken savunma amacıyla pençesini kaldırdı."},
  {"tr": "f. tırmalamak", "ex": "The trapped animal desperately clawed at the wooden fence trying to free itself.", "exTr": "Kapana kısılan hayvan, kendini kurtarmaya çalışarak ahşap çiti umutsuzca tırmaladı."}
],
"clay": [
  {"tr": "i. kil, balçık, çamur", "ex": "Archaeologists uncovered ancient pottery shaped from local clay near the riverbank.", "exTr": "Arkeologlar, nehir kıyısı yakınında yerel kilden şekillendirilmiş antik çömlekler buldu."},
  {"tr": "f. (nadir) kille kaplamak", "ex": "Farmers in the region clayed the sandy fields to improve their capacity to hold water.", "exTr": "Bölgedeki çiftçiler, su tutma kapasitelerini artırmak için kumlu tarlaları kille kapladı."}
],
"click": [
  {"tr": "i. tıklama", "ex": "The website records every click to analyze how visitors navigate through its pages.", "exTr": "Web sitesi, ziyaretçilerin sayfalar arasında nasıl gezindiğini analiz etmek için her tıklamayı kaydeder."},
  {"tr": "f. tıklamak", "ex": "Visitors only need to click the highlighted button to download the full report.", "exTr": "Ziyaretçilerin, tam raporu indirmek için yalnızca vurgulanan düğmeye tıklaması yeterlidir."}
],
"climax": [
  {"tr": "i. doruk nokta, zirve", "ex": "The novel reaches its dramatic climax when the detective finally confronts the true murderer.", "exTr": "Roman, dedektifin sonunda gerçek katille yüzleşmesiyle dramatik doruk noktasına ulaşır."},
  {"tr": "f. doruğa ulaşmak", "ex": "The festival will climax with a spectacular fireworks display over the river on the final evening.", "exTr": "Festival, son akşam nehir üzerinde gösterişli bir havai fişek gösterisiyle doruk noktasına ulaşacak."}
],
"cluster": [
  {"tr": "i. küme, öbek", "ex": "Astronomers identified a dense cluster of young stars forming within a distant nebula.", "exTr": "Gökbilimciler, uzak bir bulutsu içinde oluşan yoğun bir genç yıldız kümesi tespit etti."},
  {"tr": "f. kümelenmek, toplanmak", "ex": "Journalists clustered around the spokesman to hear the government's official statement.", "exTr": "Gazeteciler, hükümetin resmi açıklamasını duymak için sözcünün etrafında toplandı."}
],
"communist": [
  {"tr": "s. komünist", "ex": "Historians examined how communist ideology shaped education policy across Eastern Europe.", "exTr": "Tarihçiler, komünist ideolojinin Doğu Avrupa'da eğitim politikasını nasıl şekillendirdiğini inceledi."},
  {"tr": "i. komünist kişi", "ex": "During the 1950s, suspected communists were often dismissed from government positions in several countries.", "exTr": "1950'lerde, komünist olduğundan şüphelenilen kişiler birçok ülkede çoğu zaman devlet görevlerinden çıkarıldı."}
],
"compost": [
  {"tr": "i. kompost, gübre", "ex": "Gardeners mix rich compost into the soil each spring to improve its fertility naturally.", "exTr": "Bahçıvanlar, verimliliğini doğal yoldan artırmak için her ilkbahar toprağa zengin kompost karıştırır."},
  {"tr": "f. komposta dönüştürmek", "ex": "Many households now compost vegetable scraps instead of sending them to the local landfill.", "exTr": "Birçok hane, sebze atıklarını yerel çöp sahasına göndermek yerine artık komposta dönüştürüyor."}
],
"contest": [
  {"tr": "i. yarışma, mücadele", "ex": "Thousands of students entered the science contest hoping to win a university scholarship.", "exTr": "Binlerce öğrenci, üniversite bursu kazanmayı umarak bilim yarışmasına katıldı."},
  {"tr": "f. itiraz etmek, mücadele etmek", "ex": "The defeated candidate decided to contest the election results in court.", "exTr": "Yenilen aday, seçim sonuçlarına mahkemede itiraz etmeye karar verdi."}
],
"coral": [
  {"tr": "i. mercan", "ex": "Rising sea temperatures have caused significant damage to coral reefs worldwide.", "exTr": "Yükselen deniz sıcaklıkları, dünya genelinde mercan resiflerine ciddi zarar verdi."},
  {"tr": "s. mercan rengi", "ex": "She wore a coral dress that stood out against the gray winter sky.", "exTr": "Gri kış göğüne karşı göze çarpan mercan rengi bir elbise giydi."}
],
"corrupt": [
  {"tr": "s. yozlaşmış, rüşvetçi, ahlaken bozuk", "ex": "Investigative journalists exposed several corrupt officials who had been accepting bribes for years.", "exTr": "Araştırmacı gazeteciler, yıllardır rüşvet alan birkaç yozlaşmış yetkiliyi ifşa etti."},
  {"tr": "f. yozlaştırmak", "ex": "Critics argue that unlimited campaign donations corrupt the democratic process over time.", "exTr": "Eleştirmenler, sınırsız kampanya bağışlarının demokratik süreci zamanla yozlaştırdığını savunuyor."}
],
"cosmetic": [
  {"tr": "s. kozmetik, estetik", "ex": "The company launched a new line of cosmetic products made entirely from natural ingredients.", "exTr": "Şirket, tamamen doğal içeriklerden üretilen yeni bir kozmetik ürün serisi piyasaya sürdü."},
  {"tr": "i. kozmetik ürün", "ex": "Imported cosmetics must pass strict safety inspections before reaching store shelves.", "exTr": "İthal kozmetik ürünler, mağaza raflarına ulaşmadan önce sıkı güvenlik denetimlerinden geçmek zorundadır."}
],
"costume": [
  {"tr": "i. kostüm", "ex": "Each actor wore a detailed historical costume designed to match the play's nineteenth-century setting.", "exTr": "Her oyuncu, oyunun on dokuzuncu yüzyıl ortamına uygun olarak tasarlanmış ayrıntılı bir tarihi kostüm giydi."},
  {"tr": "f. kostüm giydirmek", "ex": "The designer costumed the entire cast in garments inspired by medieval paintings.", "exTr": "Tasarımcı, tüm oyuncu kadrosuna orta çağ tablolarından esinlenen giysiler giydirdi."}
],
"cotton": [
  {"tr": "i. pamuk", "ex": "Farmers in the region have cultivated cotton for textile production for centuries.", "exTr": "Bölgedeki çiftçiler, yüzyıllardır tekstil üretimi için pamuk yetiştiriyor."},
  {"tr": "f. (cotton to/on) hoşlanmaya başlamak, anlamaya başlamak", "ex": "Investors soon cottoned on to the fact that the company's profits were exaggerated.", "exTr": "Yatırımcılar, şirketin kârlarının abartıldığını kısa sürede anlamaya başladı."}
],
"cough": [
  {"tr": "i. öksürük", "ex": "Doctors advised patients with a persistent cough to seek testing for possible respiratory infections.", "exTr": "Doktorlar, sürekli öksürüğü olan hastalara olası solunum yolu enfeksiyonları için test yaptırmalarını önerdi."},
  {"tr": "f. öksürmek", "ex": "Patients who cough for more than three weeks should consult a doctor promptly.", "exTr": "Üç haftadan uzun süre öksüren hastalar vakit kaybetmeden bir doktora başvurmalıdır."}
],
"counsel": [
  {"tr": "i. öğüt, tavsiye", "ex": "The lawyer's counsel helped the young entrepreneur avoid several costly legal mistakes.", "exTr": "Avukatın verdiği öğüt, genç girişimcinin birkaç maliyetli hukuki hatadan kaçınmasına yardımcı oldu."},
  {"tr": "f. öğüt vermek, tavsiye etmek", "ex": "Doctors counsel patients to reduce salt intake in order to control high blood pressure.", "exTr": "Doktorlar, yüksek tansiyonu kontrol altına almak için hastalara tuz alımını azaltmalarını tavsiye eder."}
],
"counterfeit": [
  {"tr": "s. sahte, taklit", "ex": "Customs officials seized thousands of counterfeit banknotes attempting to enter the country last month.", "exTr": "Gümrük yetkilileri, geçen ay ülkeye girmeye çalışan binlerce sahte banknotu ele geçirdi."},
  {"tr": "f. taklidini yapmak", "ex": "The gang used advanced printers to counterfeit passports and sell them on the black market.", "exTr": "Çete, pasaportların taklidini yapıp karaborsada satmak için gelişmiş yazıcılar kullandı."}
],
"country-dance": [
  {"tr": "i. kır dansı", "ex": "The lively country-dance remained the most popular tradition at rural weddings for generations.", "exTr": "Hareketli kır dansı, nesiller boyunca kırsal düğünlerin en sevilen geleneği olarak kaldı."},
  {"tr": "f. kır dansı yapmak", "ex": "Local villagers gathered every autumn to country-dance around the square after the harvest festival.", "exTr": "Yerel köylüler, hasat festivalinden sonra her sonbahar meydanın etrafında kır dansı yapmak için toplanırdı."}
],
"cradle": [
  {"tr": "i. beşik", "ex": "The mother gently rocked the cradle to soothe her crying newborn baby.", "exTr": "Anne, ağlayan yeni doğan bebeğini sakinleştirmek için beşiği yavaşça salladı."},
  {"tr": "f. nazikçe kucaklamak", "ex": "The rescuer gently cradled the injured bird in his hands until the vet arrived.", "exTr": "Kurtarma görevlisi, veteriner gelene kadar yaralı kuşu ellerinde nazikçe kucakladı."}
],
"crescent": [
  {"tr": "i. hilal", "ex": "The bakery displayed golden pastries shaped like a crescent, fresh from the oven every morning.", "exTr": "Fırın, her sabah fırından yeni çıkan hilal biçimindeki altın rengi hamur işlerini sergiliyordu."},
  {"tr": "s. hilal biçiminde", "ex": "The resort was built along a crescent bay that shelters boats from strong ocean winds.", "exTr": "Tatil köyü, tekneleri güçlü okyanus rüzgârlarından koruyan hilal biçiminde bir koy boyunca inşa edildi."}
],
"crew": [
  {"tr": "i. mürettebat, ekip", "ex": "The ship's crew worked through the night to repair the damaged engine before the storm.", "exTr": "Geminin mürettebatı, fırtınadan önce hasarlı motoru onarmak için gece boyunca çalıştı."},
  {"tr": "f. mürettebatında görev almak", "ex": "Several experienced sailors volunteered to crew the research vessel during its Arctic expedition.", "exTr": "Birkaç deneyimli denizci, Kuzey Kutbu seferi sırasında araştırma gemisinin mürettebatında görev almak için gönüllü oldu."}
],
"critique": [
  {"tr": "i. eleştiri, tenkit", "ex": "The editor wrote a detailed critique of the study's flawed statistical methodology.", "exTr": "Editör, çalışmanın hatalı istatistiksel yöntemine dair ayrıntılı bir eleştiri kaleme aldı."},
  {"tr": "f. eleştirmek, değerlendirmek", "ex": "Graduate students met weekly to critique each other's research proposals before submission.", "exTr": "Lisansüstü öğrenciler, teslimden önce birbirlerinin araştırma önerilerini değerlendirmek için her hafta bir araya geldi."}
],
"crowd": [
  {"tr": "i. kalabalık", "ex": "A large crowd gathered outside the courthouse to await the verdict in the corruption trial.", "exTr": "Yolsuzluk davasındaki kararı beklemek için adliyenin dışında kalabalık bir grup toplandı."},
  {"tr": "f. doldurmak, üşüşmek", "ex": "Tourists crowd the narrow streets of the historic district every summer weekend.", "exTr": "Turistler, her yaz hafta sonu tarihi bölgenin dar sokaklarını doldurur."}
],
"cruise": [
  {"tr": "f. tur atmak, seyretmek", "ex": "Retired couples often choose to cruise along the coast, stopping at small island towns each day.", "exTr": "Emekli çiftler genellikle kıyı boyunca gezinmeyi ve her gün küçük ada kasabalarında durmayı tercih eder."},
  {"tr": "i. deniz gezisi", "ex": "The travel agency offered a two-week cruise around the Mediterranean at a discounted price.", "exTr": "Seyahat acentesi, Akdeniz çevresinde iki haftalık bir deniz gezisini indirimli fiyata sundu."}
],
"curve": [
  {"tr": "i. eğri, viraj", "ex": "Drivers were warned to slow down before the sharp curve at the bottom of the hill.", "exTr": "Sürücüler, tepenin dibindeki keskin virajdan önce yavaşlamaları konusunda uyarıldı."},
  {"tr": "f. eğri çizmek, kıvrılmak", "ex": "Engineers designed the bridge to curve gently around the base of the mountain.", "exTr": "Mühendisler köprüyü, dağın eteğinin çevresinde yumuşakça kıvrılacak şekilde tasarladı."}
],
"dam": [
  {"tr": "i. baraj, set", "ex": "Engineers built a massive dam to generate hydroelectric power for the entire valley.", "exTr": "Mühendisler, tüm vadiye hidroelektrik enerji sağlamak için devasa bir baraj inşa etti."},
  {"tr": "f. barajla durdurmak", "ex": "Authorities decided to dam the river to supply irrigation water to nearby farms.", "exTr": "Yetkililer, yakındaki çiftliklere sulama suyu sağlamak için nehri bir barajla durdurmaya karar verdi."}
],
"dear": [
  {"tr": "s. sevgili, değerli", "ex": "Losing his childhood home was, in many ways, losing something truly dear to him.", "exTr": "Çocukluk evini kaybetmek, birçok açıdan onun için gerçekten değerli bir şeyi kaybetmek anlamına geliyordu."},
  {"tr": "z. pahalıya", "ex": "The government's delay in responding to the flood cost the region dear.", "exTr": "Hükümetin sele müdahaledeki gecikmesi bölgeye pahalıya mal oldu."}
],
"diabetic": [
  {"tr": "s. şeker hastası", "ex": "Nutritionists recommend that diabetic patients monitor their carbohydrate intake carefully throughout the day.", "exTr": "Beslenme uzmanları, diyabetli hastaların gün boyunca karbonhidrat alımlarını dikkatle izlemesini önerir."},
  {"tr": "i. diyabetli (kişi)", "ex": "Diabetics are advised to carry a small source of sugar in case their blood glucose drops suddenly.", "exTr": "Diyabetlilere, kan şekerleri aniden düşerse diye yanlarında küçük bir şeker kaynağı taşımaları önerilir."}
],
"diagram": [
  {"tr": "i. şema, diyagram", "ex": "The textbook includes a labeled diagram that explains how the human circulatory system functions.", "exTr": "Ders kitabı, insan dolaşım sisteminin nasıl işlediğini açıklayan etiketlenmiş bir şema içerir."},
  {"tr": "f. şema hâlinde göstermek", "ex": "The consultant diagrammed the company's entire workflow to reveal where delays occurred.", "exTr": "Danışman, gecikmelerin nerede yaşandığını ortaya koymak için şirketin tüm iş akışını şema hâlinde gösterdi."}
],
"differential": [
  {"tr": "s. farksal, diferansiyel; ayırt edici", "ex": "Researchers observed the differential effects of the drug on younger and older patients.", "exTr": "Araştırmacılar, ilacın genç ve yaşlı hastalar üzerinde farklılık gösteren etkilerini gözlemledi."},
  {"tr": "i. fark, farklılık", "ex": "Economists highlighted a growing differential in wages between urban and rural workers.", "exTr": "Ekonomistler, kentsel ve kırsal çalışanlar arasındaki ücret farkının giderek büyüdüğüne dikkat çekti."}
],
"dilute": [
  {"tr": "f. sulandırmak, seyreltmek", "ex": "Chemists often dilute concentrated acids with water before conducting classroom experiments safely.", "exTr": "Kimyagerler, sınıf deneylerini güvenli biçimde yürütmeden önce derişik asitleri genellikle suyla sulandırır."},
  {"tr": "s. seyreltilmiş", "ex": "Students cleaned the equipment with a dilute solution of acid to avoid damaging the metal surfaces.", "exTr": "Öğrenciler, metal yüzeylere zarar vermemek için ekipmanı seyreltilmiş bir asit çözeltisiyle temizledi."}
],
"disabled": [
  {"tr": "s. engelli, özürlü", "ex": "The new subway station was redesigned to provide easier access for disabled passengers.", "exTr": "Yeni metro istasyonu, engelli yolcular için daha kolay erişim sağlayacak şekilde yeniden tasarlandı."},
  {"tr": "i. (the disabled) engelliler", "ex": "The charity provides free transportation and job training services for the disabled in rural communities.", "exTr": "Yardım kuruluşu, kırsal topluluklardaki engelliler için ücretsiz ulaşım ve iş eğitimi hizmetleri sağlıyor."}
],
"disguise": [
  {"tr": "i. kılık değiştirme, maske", "ex": "The spy wore an elaborate disguise to cross the border without being recognized.", "exTr": "Casus, sınırı fark edilmeden geçebilmek için özenle hazırlanmış bir kılık değiştirme kullandı."},
  {"tr": "f. kılık değiştirmek, gizlemek", "ex": "The company tried to disguise its financial losses by delaying the publication of its annual report.", "exTr": "Şirket, yıllık raporunun yayımlanmasını geciktirerek mali kayıplarını gizlemeye çalıştı."}
],
"distress": [
  {"tr": "i. sıkıntı, ıstırap", "ex": "Watching the injured bird struggle on the ground caused the children visible distress.", "exTr": "Yaralı kuşun yerde çırpınmasını izlemek, çocuklara gözle görülür bir sıkıntı verdi."},
  {"tr": "f. sıkıntı vermek, üzmek", "ex": "News of the factory closure deeply distressed workers who had spent decades there.", "exTr": "Fabrikanın kapanacağı haberi, orada onlarca yılını geçirmiş işçileri derinden üzdü."}
],
"eight": [
  {"tr": "s. sekiz", "ex": "The research vessel remained at sea for eight consecutive weeks while collecting ocean samples.", "exTr": "Araştırma gemisi, okyanus örnekleri toplarken sekiz hafta boyunca aralıksız denizde kaldı."},
  {"tr": "i. sekiz sayısı", "ex": "In many East Asian cultures, the number eight is considered a symbol of prosperity and luck.", "exTr": "Birçok Doğu Asya kültüründe sekiz sayısı, refah ve şansın simgesi olarak kabul edilir."}
],
"email": [
  {"tr": "i. e-posta", "ex": "She quickly sent an email to confirm the meeting time with her supervisor.", "exTr": "Yöneticisiyle toplantı saatini teyit etmek için hızlıca bir e-posta gönderdi."},
  {"tr": "f. e-posta göndermek", "ex": "Researchers emailed the survey to thousands of participants across five different countries.", "exTr": "Araştırmacılar, anketi beş farklı ülkedeki binlerce katılımcıya e-postayla gönderdi."}
],
"endeavour": [
  {"tr": "i. çaba, girişim", "ex": "Scientists from twelve countries joined the endeavour to map the entire human genome.", "exTr": "On iki ülkeden bilim insanları, tüm insan genomunu haritalama çabasına katıldı."},
  {"tr": "f. çabalamak, gayret etmek", "ex": "The organization endeavours to provide clean drinking water to remote mountain communities.", "exTr": "Kuruluş, uzak dağ topluluklarına temiz içme suyu sağlamaya gayret ediyor."}
],
"executive": [
  {"tr": "i. yönetici, üst düzey yönetici", "ex": "The company appointed a new executive to oversee its expansion into international markets.", "exTr": "Şirket, uluslararası pazarlara açılmasını denetlemek üzere yeni bir yönetici atadı."},
  {"tr": "s. yönetsel", "ex": "Board members granted the director broad executive authority over daily operations.", "exTr": "Yönetim kurulu üyeleri, müdüre günlük operasyonlar üzerinde geniş yönetsel yetki tanıdı."}
],
"fake": [
  {"tr": "s. sahte", "ex": "Border officials seized thousands of fake designer handbags at the airport last month.", "exTr": "Sınır yetkilileri, geçen ay havalimanında binlerce sahte marka el çantasına el koydu."},
  {"tr": "i. sahte şey/kişi", "ex": "Investigators discovered that the rare painting was actually a skillfully made fake.", "exTr": "Soruşturmacılar, nadir tablonun aslında ustaca yapılmış bir sahte olduğunu keşfetti."},
  {"tr": "f. taklit etmek", "ex": "The player was accused of faking an injury to waste time in the final minutes.", "exTr": "Oyuncu, son dakikalarda zaman çalmak amacıyla sakatlık taklidi yapmakla suçlandı."}
],
"favorite": [
  {"tr": "s./i. favori, en sevilen, gözde", "ex": "Surveys revealed that renewable energy remained the public's favorite solution to the climate crisis.", "exTr": "Anketler, yenilenebilir enerjinin halkın iklim krizine karşı en gözde çözüm olarak kaldığını ortaya koydu."},
  {"tr": "f. favorilere eklemek", "ex": "Millions of users favorited the astronaut's photo within hours of it appearing online.", "exTr": "Milyonlarca kullanıcı, astronotun fotoğrafı internette göründükten sonraki birkaç saat içinde onu favorilerine ekledi."}
],
"fax": [
  {"tr": "i. faks", "ex": "The office received an urgent fax containing the signed contract from the overseas partner.", "exTr": "Ofis, denizaşırı ortaktan imzalı sözleşmeyi içeren acil bir faks aldı."},
  {"tr": "f. faks çekmek, göndermek", "ex": "Despite modern technology, some government offices still require citizens to fax important documents for approval.", "exTr": "Modern teknolojiye rağmen, bazı devlet daireleri hâlâ vatandaşların onay için önemli belgeleri faks çekmesini istiyor."}
],
"filter": [
  {"tr": "i. filtre, süzgeç", "ex": "Replacing the air filter regularly improves both engine performance and fuel efficiency.", "exTr": "Hava filtresini düzenli olarak değiştirmek, hem motor performansını hem de yakıt verimliliğini artırır."},
  {"tr": "f. filtrelemek, süzmek", "ex": "Modern water treatment plants filter out harmful bacteria before releasing water back into rivers.", "exTr": "Modern su arıtma tesisleri, suyu nehirlere geri bırakmadan önce zararlı bakterileri süzer."}
],
"fin": [
  {"tr": "i. yüzgeç", "ex": "Marine biologists used the shape of the shark's fin to identify its species accurately.", "exTr": "Deniz biyologları, köpekbalığının türünü doğru biçimde belirlemek için yüzgecinin şeklini kullandı."},
  {"tr": "f. yüzgeç takmak", "ex": "The divers finned quietly along the reef so as not to frighten the fish.", "exTr": "Dalgıçlar, balıkları korkutmamak için resif boyunca paletleriyle sessizce yüzdü."}
],
"fingerprint": [
  {"tr": "i. parmak izi", "ex": "Police used a fingerprint found on the window to identify a suspect within hours.", "exTr": "Polis, pencerede bulunan bir parmak izini kullanarak birkaç saat içinde bir şüpheliyi tespit etti."},
  {"tr": "f. parmak izi almak", "ex": "Airport security officers fingerprinted every foreign visitor as part of the new entry procedure.", "exTr": "Havalimanı güvenlik görevlileri, yeni giriş prosedürünün bir parçası olarak her yabancı ziyaretçinin parmak izini aldı."}
],
"freight": [
  {"tr": "i. yük, kargo", "ex": "Railway companies transport most of their freight overnight to avoid congestion during peak hours.", "exTr": "Demiryolu şirketleri, yoğun saatlerde tıkanıklığı önlemek için yüklerinin çoğunu gece boyunca taşır."},
  {"tr": "f. yük olarak taşımak", "ex": "The company freighted the machinery across the ocean because air transport was far too expensive.", "exTr": "Şirket, hava taşımacılığı aşırı pahalı olduğu için makineleri okyanusun ötesine yük olarak taşıdı."}
],
"glimpse": [
  {"tr": "i. kısa bakış, göz ucuyla bakış", "ex": "Tourists gathered early, hoping to catch a glimpse of the rare bird before it flew away.", "exTr": "Turistler, nadir kuş uçup gitmeden önce ona göz ucuyla bakabilmeyi umarak erkenden toplandı."},
  {"tr": "f. gözüne ilişmek", "ex": "Through the crowd, she glimpsed a familiar face near the entrance of the station.", "exTr": "Kalabalığın arasından, istasyonun girişine yakın bir yerde tanıdık bir yüz gözüne ilişti."}
],
"gray": [
  {"tr": "s./i. gri", "ex": "Decades of pollution have turned the once-white monument a dull gray color.", "exTr": "Onlarca yıllık kirlilik, eskiden beyaz olan anıtı donuk bir griye dönüştürdü."},
  {"tr": "f. griye dönmek/dönüştürmek", "ex": "His hair grayed noticeably during the years he spent leading the struggling company.", "exTr": "Zor durumdaki şirketi yönettiği yıllarda saçları gözle görülür biçimde griye döndü."}
],
"grin": [
  {"tr": "f. sırıtmak", "ex": "The little boy could not help but grin widely when he saw the puppy waiting for him at the door.", "exTr": "Küçük çocuk, kapıda kendisini bekleyen yavru köpeği görünce geniş bir şekilde sırıtmaktan kendini alamadı."},
  {"tr": "i. sırıtış, geniş gülümseme", "ex": "The champion crossed the finish line with a broad grin on her exhausted face.", "exTr": "Şampiyon, bitiş çizgisini yorgun yüzünde geniş bir sırıtışla geçti."}
],
"grip": [
  {"tr": "i. kavrama, tutuş, tutamak", "ex": "Climbers rely on a firm grip and specialized shoes to ascend the steep rock face.", "exTr": "Tırmanıcılar, dik kaya yüzeyine tırmanmak için sağlam bir kavrayışa ve özel ayakkabılara güvenir."},
  {"tr": "f. kavramak, sımsıkı tutmak", "ex": "The frightened child gripped her mother's hand tightly as the plane began to descend.", "exTr": "Korkmuş çocuk, uçak alçalmaya başlarken annesinin elini sımsıkı kavradı."}
],
"guy": [
  {"tr": "i. (günl.) adam, herif, tip", "ex": "The tour guide was a friendly guy who knew every historical detail about the old fortress.", "exTr": "Tur rehberi, eski kale hakkındaki her tarihi ayrıntıyı bilen sıcakkanlı bir adamdı."},
  {"tr": "f. alaya almak", "ex": "The comedian gently guyed the politician's habit of repeating the same slogan in every speech.", "exTr": "Komedyen, politikacının her konuşmasında aynı sloganı tekrarlama alışkanlığını nazikçe alaya aldı."}
],
"hop": [
  {"tr": "f. sıçramak, hoplamak", "ex": "The rabbit continued to hop across the garden until it disappeared behind the fence.", "exTr": "Tavşan, çitin arkasında kaybolana kadar bahçede sıçramaya devam etti."},
  {"tr": "i. sıçrayış, kısa uçuş/yolculuk", "ex": "The journey included a short hop by plane from the capital to the coastal city.", "exTr": "Yolculuk, başkentten kıyı kentine uçakla yapılan kısa bir uçuşu içeriyordu."}
],
"hunger": [
  {"tr": "i. açlık", "ex": "The charity works to eliminate hunger in regions affected by prolonged drought and conflict.", "exTr": "Vakıf, uzun süreli kuraklık ve çatışmadan etkilenen bölgelerde açlığı ortadan kaldırmak için çalışıyor."},
  {"tr": "f. açlık hissetmek, özlemek", "ex": "After years of routine work, many employees hunger for creative challenges and recognition.", "exTr": "Yıllarca süren rutin çalışmanın ardından birçok çalışan, yaratıcı zorluklara ve takdir edilmeye özlem duyar."}
],
"illiterate": [
  {"tr": "s. okuma yazma bilmeyen", "ex": "A century ago, a large percentage of the rural population remained illiterate due to limited access to schools.", "exTr": "Bir yüzyıl önce, okullara sınırlı erişim nedeniyle kırsal nüfusun büyük bir kısmı okuma yazma bilmiyordu."},
  {"tr": "i. cahil kimse", "ex": "The night school was founded to teach reading skills to adult illiterates in the region.", "exTr": "Gece okulu, bölgedeki okuma yazma bilmeyen yetişkinlere okuma becerileri öğretmek için kuruldu."}
],
"incoming": [
  {"tr": "s. gelen, gelmekte olan", "ex": "The receptionist forwarded every incoming call to the appropriate department throughout the busy morning.", "exTr": "Resepsiyonist, yoğun sabah boyunca gelen her çağrıyı ilgili departmana yönlendirdi."},
  {"tr": "i. gelen (çağrı/veri)", "ex": "The monitoring software classifies all incomings by source to detect suspicious data traffic early.", "exTr": "İzleme yazılımı, şüpheli veri trafiğini erken saptamak için tüm gelenleri kaynaklarına göre sınıflandırır."}
],
"incumbent": [
  {"tr": "s. görevde olan, mevcut", "ex": "Polls suggested that the incumbent senator would face a difficult reelection campaign this year.", "exTr": "Anketler, görevdeki senatörün bu yıl zorlu bir yeniden seçim kampanyasıyla karşılaşacağını gösteriyordu."},
  {"tr": "i. görevdeki kişi, mevcut yetkili", "ex": "In local elections, the incumbent usually enjoys a clear advantage over lesser-known challengers.", "exTr": "Yerel seçimlerde görevdeki kişi, genellikle daha az tanınan rakiplerine karşı belirgin bir avantaja sahiptir."}
],
"instinct": [
  {"tr": "i. içgüdü, sezgi", "ex": "Many animals rely on instinct rather than learned behavior to survive harsh winters.", "exTr": "Birçok hayvan, sert kışlarda hayatta kalmak için öğrenilmiş davranıştan çok içgüdüye güvenir."},
  {"tr": "s. (instinct with) dolu, yüklü", "ex": "Critics praised the sculpture as a work instinct with movement and emotion.", "exTr": "Eleştirmenler heykeli, hareket ve duyguyla dolu bir eser olarak övdü."}
],
"jail": [
  {"tr": "i. hapishane, cezaevi", "ex": "The former official was sentenced to two years in jail for accepting bribes.", "exTr": "Eski yetkili, rüşvet aldığı için iki yıl hapis cezasına çarptırıldı."},
  {"tr": "f. hapsetmek", "ex": "The regime jailed dozens of journalists who criticized its economic policies last year.", "exTr": "Rejim, geçen yıl ekonomik politikalarını eleştiren onlarca gazeteciyi hapsetti."}
],
"joke": [
  {"tr": "i. şaka, fıkra", "ex": "The professor told a joke to ease the tension before the difficult exam.", "exTr": "Profesör, zor sınavdan önce gerginliği azaltmak için bir şaka yaptı."},
  {"tr": "f. şaka yapmak", "ex": "Colleagues often joke about the office coffee, but everyone still drinks it every morning.", "exTr": "İş arkadaşları ofis kahvesi hakkında sık sık şaka yapar, ama yine de herkes onu her sabah içer."}
],
"joy": [
  {"tr": "i. sevinç, neşe", "ex": "The children expressed pure joy when they saw snow falling for the first time.", "exTr": "Çocuklar, ilk kez kar yağdığını gördüklerinde saf bir sevinç ifade ettiler."},
  {"tr": "f. sevindirmek (esk.)", "ex": "It joyed the old king to see his people prosper after the long war.", "exTr": "Uzun savaşın ardından halkının refaha kavuştuğunu görmek yaşlı kralı sevindirdi."}
],
"junk": [
  {"tr": "i. hurda, ıvır zıvır, döküntü", "ex": "The garage was filled with old furniture, broken tools, and other useless junk.", "exTr": "Garaj, eski mobilyalar, kırık aletler ve diğer işe yaramaz ıvır zıvırla doluydu."},
  {"tr": "f. hurdaya çıkarmak, atmak", "ex": "The factory decided to junk the outdated machinery rather than pay for costly repairs.", "exTr": "Fabrika, pahalı onarımlara para harcamak yerine eski makineleri hurdaya çıkarmaya karar verdi."}
],
"juvenile": [
  {"tr": "s. gençlere özgü, çocukça", "ex": "The court referred the teenager's case to a specialized juvenile justice program instead of prison.", "exTr": "Mahkeme, gencin davasını hapis yerine uzmanlaşmış bir çocuk adalet programına yönlendirdi."},
  {"tr": "i. genç, ergen", "ex": "The law requires that juveniles be tried separately from adult offenders in most cases.", "exTr": "Yasa, çoğu durumda gençlerin yetişkin suçlulardan ayrı yargılanmasını gerektirir."}
],
"kit": [
  {"tr": "i. takım, set", "ex": "Every laboratory technician received a basic kit containing gloves, goggles, and safety instructions.", "exTr": "Her laboratuvar teknisyenine eldiven, koruyucu gözlük ve güvenlik talimatları içeren temel bir set verildi."},
  {"tr": "f. donatmak", "ex": "The expedition members were kitted out with thermal clothing before departing for the Antarctic station.", "exTr": "Sefer üyeleri, Antarktika istasyonuna hareket etmeden önce termal giysilerle donatıldı."}
],
"knee": [
  {"tr": "i. diz", "ex": "The athlete's knee injury required extensive physical therapy before she could return to professional competition.", "exTr": "Sporcunun diz sakatlığı, profesyonel müsabakalara dönebilmesi için kapsamlı fizik tedavi gerektirdi."},
  {"tr": "f. dizle vurmak", "ex": "During the struggle, the defender kneed his opponent and immediately received a red card.", "exTr": "Mücadele sırasında savunma oyuncusu rakibine dizle vurdu ve hemen kırmızı kart gördü."}
],
"knowledgeable": [
  {"tr": "s. bilgili, bilgi sahibi", "ex": "The museum hired knowledgeable guides who could answer detailed questions about ancient artifacts.", "exTr": "Müze, antik eserler hakkındaki ayrıntılı soruları yanıtlayabilecek bilgili rehberler işe aldı."},
  {"tr": "z. (knowledgeably) bilgili biçimde", "ex": "The curator spoke knowledgeably about the restoration techniques used on the ancient frescoes.", "exTr": "Küratör, antik freskler üzerinde kullanılan restorasyon teknikleri hakkında bilgili biçimde konuştu."}
],
"leak": [
  {"tr": "i. sızıntı", "ex": "Plumbers finally located the leak that had been damaging the ceiling for weeks.", "exTr": "Tesisatçılar, haftalardır tavana zarar veren sızıntıyı sonunda buldu."},
  {"tr": "f. sızmak, sızdırmak", "ex": "An official secretly leaked the confidential report to several national newspapers.", "exTr": "Bir yetkili, gizli raporu birkaç ulusal gazeteye el altından sızdırdı."}
],
"leap": [
  {"tr": "i. sıçrama, atlama", "ex": "The discovery represented a significant leap forward in the treatment of chronic diseases.", "exTr": "Bu keşif, kronik hastalıkların tedavisinde önemli bir sıçramayı temsil ediyordu."},
  {"tr": "f. sıçramak, atlamak", "ex": "Share prices leaped by nearly ten percent after the company announced record annual profits.", "exTr": "Şirket rekor düzeyde yıllık kâr açıkladıktan sonra hisse fiyatları yüzde ona yakın sıçradı."}
],
"lever": [
  {"tr": "i. kaldıraç", "ex": "Engineers used a simple lever to demonstrate how mechanical advantage reduces the force required.", "exTr": "Mühendisler, mekanik avantajın gereken kuvveti nasıl azalttığını göstermek için basit bir kaldıraç kullandı."},
  {"tr": "f. kaldıraçla kaldırmak", "ex": "Workers levered the heavy stone slab away from the entrance using long iron bars.", "exTr": "İşçiler, uzun demir çubuklar kullanarak ağır taş levhayı girişin önünden kaldıraçla kaldırdı."}
],
"levy": [
  {"tr": "i. vergi, harç", "ex": "The new levy on imported fuel is expected to raise millions for public transport projects.", "exTr": "İthal yakıta getirilen yeni verginin, toplu taşıma projeleri için milyonlar toplaması bekleniyor."},
  {"tr": "f. vergi koymak, toplamak", "ex": "The city council decided to levy an additional tax on plastic packaging to reduce waste.", "exTr": "Belediye meclisi, atığı azaltmak için plastik ambalaja ek bir vergi koymaya karar verdi."}
],
"magic": [
  {"tr": "i. sihir, büyü", "ex": "The children watched in wonder as the street performer appeared to create magic.", "exTr": "Çocuklar, sokak sanatçısı sihir yaratıyormuş gibi görünürken hayranlıkla izledi."},
  {"tr": "s. büyülü", "ex": "In the old legend, a magic ring protects its owner from every kind of danger.", "exTr": "Eski efsanede, büyülü bir yüzük sahibini her tür tehlikeden korur."}
],
"mess": [
  {"tr": "i. dağınıklık, karmaşa", "ex": "The kitchen was left in a terrible mess after the children finished baking cookies.", "exTr": "Çocuklar kurabiye pişirmeyi bitirdikten sonra mutfak korkunç bir dağınıklık içinde kaldı."},
  {"tr": "f. berbat etmek, karıştırmak", "ex": "Ignoring the instructions, the new technician messed up the entire filing system within a week.", "exTr": "Talimatları göz ardı eden yeni teknisyen, bir hafta içinde tüm dosyalama sistemini berbat etti."}
],
"mirror": [
  {"tr": "i. ayna", "ex": "She checked her appearance in the bathroom mirror before leaving for the interview.", "exTr": "Mülakata gitmeden önce görünümünü banyo aynasında kontrol etti."},
  {"tr": "f. yansıtmak", "ex": "The novel's dark tone mirrors the political anxieties of the postwar period.", "exTr": "Romanın karanlık tonu, savaş sonrası dönemin siyasi kaygılarını yansıtır."}
],
"mud": [
  {"tr": "i. çamur", "ex": "Heavy rainfall turned the unpaved trail into thick mud, slowing the hikers considerably.", "exTr": "Şiddetli yağmur, asfaltsız patikayı kalın bir çamura çevirerek yürüyüşçüleri hayli yavaşlattı."},
  {"tr": "f. çamurla sıvamak", "ex": "Builders in the village still mud the walls of traditional houses to insulate them against winter cold.", "exTr": "Köydeki ustalar, geleneksel evlerin duvarlarını kışın soğuğuna karşı yalıtmak için hâlâ çamurla sıvıyor."}
],
"murder": [
  {"tr": "i. cinayet", "ex": "Detectives spent months investigating the murder before finally identifying a credible suspect.", "exTr": "Dedektifler, sonunda inandırıcı bir şüpheliyi belirlemeden önce cinayeti aylarca araştırdı."},
  {"tr": "f. öldürmek", "ex": "The dictator ordered his forces to murder anyone who openly opposed the new regime.", "exTr": "Diktatör, yeni rejime açıkça karşı çıkan herkesi öldürmeleri için güçlerine emir verdi."}
],
"nationalist": [
  {"tr": "i. milliyetçi", "ex": "The veteran politician was a committed nationalist who opposed transferring any authority to foreign institutions.", "exTr": "Kıdemli politikacı, yabancı kurumlara herhangi bir yetki devrine karşı çıkan kararlı bir milliyetçiydi."},
  {"tr": "s. milliyetçi", "ex": "The rally attracted thousands of nationalist supporters demanding greater independence from foreign influence.", "exTr": "Miting, yabancı etkiden daha fazla bağımsızlık talep eden binlerce milliyetçi destekçiyi bir araya getirdi."}
],
"newborn": [
  {"tr": "s. yeni doğmuş", "ex": "Doctors closely monitor a newborn baby's weight during the first few weeks after birth.", "exTr": "Doktorlar, doğumdan sonraki ilk birkaç hafta boyunca yenidoğan bir bebeğin kilosunu yakından izler."},
  {"tr": "i. yenidoğan", "ex": "Nurses screen every newborn for hearing problems within the first days of life.", "exTr": "Hemşireler, her yenidoğanı yaşamın ilk günlerinde işitme sorunlarına karşı taramadan geçirir."}
],
"nick": [
  {"tr": "i. küçük çentik/kesik", "ex": "The carpenter noticed a small nick in the wood and quickly sanded the surface smooth.", "exTr": "Marangoz, tahtada küçük bir çentik fark etti ve yüzeyi hemen zımparalayarak düzeltti."},
  {"tr": "f. çentmek, kesik atmak", "ex": "The barber accidentally nicked the customer's chin while shaving him with a straight razor.", "exTr": "Berber, usturayla tıraş ederken müşterinin çenesine yanlışlıkla küçük bir kesik attı."}
],
"olive": [
  {"tr": "i. zeytin", "ex": "Farmers in the region have cultivated olive trees for more than a thousand years.", "exTr": "Bölgedeki çiftçiler, bin yıldan uzun bir süredir zeytin ağaçları yetiştiriyor."},
  {"tr": "s. zeytin yeşili", "ex": "The soldiers wore olive uniforms that blended easily into the dense summer vegetation.", "exTr": "Askerler, yoğun yaz bitki örtüsüne kolayca karışan zeytin yeşili üniformalar giyiyordu."}
],
"one-step": [
  {"tr": "i. tek adım (bir dans türü)", "ex": "During the 1920s, dance halls across the country regularly featured the lively one-step.", "exTr": "1920'lerde, ülke genelindeki dans salonlarında canlı tek adım dansı sıkça sergilenirdi."},
  {"tr": "f. bu dansı yapmak", "ex": "At the vintage festival, couples in period costumes one-stepped across the ballroom floor all evening.", "exTr": "Nostalji festivalinde, dönem kostümlü çiftler akşam boyunca balo salonunda tek adım dansı yaptı."}
],
"orbit": [
  {"tr": "i. yörünge", "ex": "The satellite was launched into orbit to collect data on global temperature changes.", "exTr": "Uydu, küresel sıcaklık değişimleri hakkında veri toplamak için yörüngeye fırlatıldı."},
  {"tr": "f. yörüngede dönmek", "ex": "The new telescope orbits the Earth every ninety minutes, photographing distant galaxies.", "exTr": "Yeni teleskop, uzak galaksileri fotoğraflayarak Dünya'nın çevresinde her doksan dakikada bir dönüyor."}
],
"outdoors": [
  {"tr": "z. açık havada, dışarıda", "ex": "Pediatricians increasingly recommend that children spend more time outdoors rather than in front of screens.", "exTr": "Çocuk doktorları, çocukların ekranlar karşısında değil açık havada daha fazla zaman geçirmesini giderek daha çok öneriyor."},
  {"tr": "i. açık hava, doğa", "ex": "Camping trips give urban children a rare chance to experience the outdoors firsthand.", "exTr": "Kamp gezileri, şehirli çocuklara doğayı bizzat deneyimlemek için ender bir fırsat sunar."}
],
"panic": [
  {"tr": "i. panik", "ex": "News of the bank's collapse caused widespread panic among small investors across the country.", "exTr": "Bankanın çöktüğü haberi, ülke genelindeki küçük yatırımcılar arasında yaygın bir paniğe yol açtı."},
  {"tr": "f. paniklemek", "ex": "Passengers began to panic when smoke suddenly filled the crowded subway car.", "exTr": "Kalabalık metro vagonunu aniden duman kaplayınca yolcular panik yapmaya başladı."}
],
"parachute": [
  {"tr": "i. paraşüt", "ex": "The cargo was dropped from the aircraft with a large parachute to ensure a soft landing.", "exTr": "Kargo, yumuşak bir iniş sağlamak amacıyla büyük bir paraşütle uçaktan bırakıldı."},
  {"tr": "f. paraşütle atlamak", "ex": "The pilot managed to parachute safely from the aircraft moments before it crashed into the field.", "exTr": "Pilot, uçak tarlaya çarpmadan birkaç saniye önce güvenli bir şekilde paraşütle atlamayı başardı."}
],
"pardon": [
  {"tr": "i. af, bağışlama", "ex": "The governor granted a pardon to several nonviolent offenders who had completed rehabilitation programs.", "exTr": "Vali, rehabilitasyon programlarını tamamlamış birkaç şiddet içermeyen suçluyu affetti."},
  {"tr": "f. affetmek, bağışlamak", "ex": "The king agreed to pardon the rebels on condition that they lay down their weapons.", "exTr": "Kral, silahlarını bırakmaları şartıyla isyancıları bağışlamayı kabul etti."}
],
"part-time": [
  {"tr": "s. yarı zamanlı, kısmi süreli", "ex": "Many university students take a part-time job to help cover their living expenses.", "exTr": "Birçok üniversite öğrencisi, yaşam giderlerini karşılamaya yardımcı olmak için yarı zamanlı bir iş yapıyor."},
  {"tr": "z. yarı zamanlı olarak", "ex": "After retiring, the professor continued to teach part-time at the local community college.", "exTr": "Emekli olduktan sonra profesör, yerel halk kolejinde yarı zamanlı olarak ders vermeyi sürdürdü."}
],
"patrol": [
  {"tr": "i. devriye", "ex": "A police patrol discovered the abandoned vehicle near the harbor early in the morning.", "exTr": "Bir polis devriyesi, sabahın erken saatlerinde terk edilmiş aracı limanın yakınında buldu."},
  {"tr": "f. devriye gezmek", "ex": "Armed guards patrol the border every night to prevent illegal crossings.", "exTr": "Silahlı muhafızlar, yasa dışı geçişleri önlemek için her gece sınırda devriye gezer."}
],
"pause": [
  {"tr": "i. duraklama, ara", "ex": "The negotiator called for a brief pause before presenting the final terms of the deal.", "exTr": "Müzakereci, anlaşmanın son şartlarını sunmadan önce kısa bir ara verilmesini istedi."},
  {"tr": "f. duraklamak, ara vermek", "ex": "The speaker paused for a moment to let the audience absorb the striking statistics.", "exTr": "Konuşmacı, dinleyicilerin çarpıcı istatistikleri sindirmesine fırsat vermek için bir an duraksadı."}
],
"pension": [
  {"tr": "i. emekli maaşı", "ex": "After thirty years of service, she finally began receiving her monthly pension from the government.", "exTr": "Otuz yıllık hizmetin ardından, sonunda devletten aylık emekli maaşını almaya başladı."},
  {"tr": "f. emekli maaşı bağlamak", "ex": "The firm pensioned off dozens of senior workers to reduce its long-term labor costs.", "exTr": "Şirket, uzun vadeli işçilik maliyetlerini azaltmak için onlarca kıdemli çalışana emekli maaşı bağlayarak onları emekliye ayırdı."}
],
"pink": [
  {"tr": "i./s. pembe", "ex": "Marine researchers were surprised to find a rare pink dolphin near the river delta.", "exTr": "Deniz araştırmacıları, nehir deltası yakınında nadir görülen pembe bir yunus bulunca şaşırdı."},
  {"tr": "f. (nadir) zikzak kesmek", "ex": "The tailor pinked the edges of the fabric so that the seams would not fray.", "exTr": "Terzi, dikiş yerleri saçaklanmasın diye kumaşın kenarlarını zikzak kesti."}
],
"postgraduate": [
  {"tr": "s. lisansüstü", "ex": "Many postgraduate students choose to specialize in renewable energy engineering these days.", "exTr": "Günümüzde birçok lisansüstü öğrenci, yenilenebilir enerji mühendisliğinde uzmanlaşmayı tercih ediyor."},
  {"tr": "i. lisansüstü öğrenci", "ex": "As a postgraduate, she spends most of her week collecting data in the laboratory.", "exTr": "Bir lisansüstü öğrenci olarak haftasının çoğunu laboratuvarda veri toplayarak geçiriyor."}
],
"prescription": [
  {"tr": "i. reçete", "ex": "The doctor wrote a prescription for antibiotics after confirming the bacterial infection.", "exTr": "Doktor, bakteriyel enfeksiyonu doğruladıktan sonra antibiyotik için bir reçete yazdı."},
  {"tr": "s. reçeteli", "ex": "Pharmacists cannot legally dispense certain prescription medications without a valid doctor's authorization.", "exTr": "Eczacılar, geçerli bir doktor onayı olmadan bazı reçeteli ilaçları yasal olarak satamaz."}
],
"putt": [
  {"tr": "i. (golf) hafif vuruş", "ex": "The champion golfer sank a difficult putt to win the tournament by one stroke.", "exTr": "Şampiyon golfçü, turnuvayı bir vuruş farkla kazanmak için zor bir vuruşu deliğe soktu."},
  {"tr": "f. (golf) topu hafifçe vurmak", "ex": "The young golfer putted with remarkable calm despite the pressure of the final round.", "exTr": "Genç golfçü, final turunun baskısına rağmen topu dikkat çekici bir sakinlikle hafifçe vurdu."}
],
"quiz": [
  {"tr": "i. kısa sınav, test", "ex": "At the end of each lecture, the professor gives students a short quiz on key concepts.", "exTr": "Profesör, her dersin sonunda öğrencilere temel kavramlarla ilgili kısa bir sınav yapar."},
  {"tr": "f. sınav yapmak, sınamak", "ex": "Immigration officers quizzed the travelers about the purpose and length of their visit.", "exTr": "Göçmenlik memurları, yolcuları ziyaretlerinin amacı ve süresi konusunda sorguya çekti."}
],
"reef": [
  {"tr": "i. resif, kayalık (mercan resifi)", "ex": "Marine biologists warned that rising ocean temperatures were damaging the coral reef rapidly.", "exTr": "Deniz biyologları, yükselen okyanus sıcaklıklarının mercan resifine hızla zarar verdiği konusunda uyardı."},
  {"tr": "f. (yelkeni) küçültmek", "ex": "As the storm approached, the crew hurried to reef the mainsail before the wind grew dangerous.", "exTr": "Fırtına yaklaşırken mürettebat, rüzgar tehlikeli hâle gelmeden önce ana yelkeni küçültmek için acele etti."}
],
"reflex": [
  {"tr": "i. refleks", "ex": "A sudden loud noise can trigger a reflex in newborns, causing their arms to spread out quickly.", "exTr": "Ani ve yüksek bir ses, yeni doğanlarda kollarının hızla açılmasına neden olan bir refleks tetikleyebilir."},
  {"tr": "s. istemsiz (tepki)", "ex": "Blinking is a reflex action that protects the eye from approaching objects.", "exTr": "Göz kırpma, gözü yaklaşan nesnelerden koruyan istemsiz bir tepkidir."}
],
"remark": [
  {"tr": "i. söz, yorum", "ex": "During the press conference, the scientist made a brief remark about the risks of climate change.", "exTr": "Basın toplantısı sırasında bilim insanı, iklim değişikliğinin riskleri hakkında kısa bir yorumda bulundu."},
  {"tr": "f. belirtmek, söylemek", "ex": "Several critics remarked that the new policy would mainly benefit large corporations.", "exTr": "Birkaç eleştirmen, yeni politikanın esas olarak büyük şirketlere yarar sağlayacağını belirtti."}
],
"remedy": [
  {"tr": "i. çare, çözüm, deva", "ex": "Herbal tea is often considered a natural remedy for mild digestive problems.", "exTr": "Bitki çayı, hafif sindirim sorunları için genellikle doğal bir çare olarak kabul edilir."},
  {"tr": "f. çare bulmak, gidermek", "ex": "The government introduced new regulations to remedy the shortage of affordable housing.", "exTr": "Hükümet, uygun fiyatlı konut sıkıntısını gidermek için yeni düzenlemeler getirdi."}
],
"republican": [
  {"tr": "s. cumhuriyetçi", "ex": "Many voters in that region identify as republican, favoring elected representatives over hereditary rule.", "exTr": "O bölgedeki birçok seçmen, kalıtsal yönetim yerine seçilmiş temsilcileri tercih ederek kendini cumhuriyetçi olarak tanımlıyor."},
  {"tr": "i. cumhuriyetçi (kişi)", "ex": "A committed republican, he campaigned for decades to replace the monarchy with an elected head of state.", "exTr": "Kararlı bir cumhuriyetçi olan adam, monarşinin yerini seçilmiş bir devlet başkanının alması için onlarca yıl kampanya yürüttü."}
],
"retail": [
  {"tr": "i. perakende satış", "ex": "Retail accounts for a large share of employment in most developed economies.", "exTr": "Perakende satış, çoğu gelişmiş ekonomide istihdamın büyük bir payını oluşturur."},
  {"tr": "z. perakende olarak", "ex": "Wholesale buyers pay far less for the same products than customers who purchase them retail.", "exTr": "Toptan alıcılar, aynı ürünler için onları perakende olarak satın alan müşterilerden çok daha az öder."},
  {"tr": "f. perakende satmak", "ex": "Small shops struggled to compete after large chains began to retail goods online.", "exTr": "Büyük zincirler malları çevrimiçi perakende satmaya başladıktan sonra küçük dükkânlar rekabette zorlandı."}
],
"rethink": [
  {"tr": "f. yeniden düşünmek", "ex": "Falling sales forced the marketing team to rethink their entire advertising strategy for next year.", "exTr": "Düşen satışlar, pazarlama ekibini gelecek yıl için tüm reklam stratejisini yeniden düşünmeye zorladı."},
  {"tr": "i. yeniden değerlendirme", "ex": "The accident prompted a fundamental rethink of safety procedures across the entire industry.", "exTr": "Kaza, tüm sektörde güvenlik prosedürlerinin köklü biçimde yeniden değerlendirilmesine yol açtı."}
],
"scream": [
  {"tr": "i. çığlık", "ex": "A loud scream echoed through the empty hallway just before the alarm sounded.", "exTr": "Alarm çalmadan hemen önce boş koridorda yüksek bir çığlık yankılandı."},
  {"tr": "f. çığlık atmak", "ex": "The frightened child screamed for help when the elevator suddenly stopped between floors.", "exTr": "Asansör katlar arasında aniden durunca korkmuş çocuk yardım istemek için çığlık attı."}
],
"shadow": [
  {"tr": "i. gölge", "ex": "The tall building cast a long shadow across the entire parking lot by late afternoon.", "exTr": "Yüksek bina, öğleden sonranın geç saatlerinde tüm otoparkın üzerine uzun bir gölge düşürdü."},
  {"tr": "f. gölge gibi izlemek, takip etmek", "ex": "Undercover officers shadowed the suspect for weeks before making the arrest.", "exTr": "Sivil polisler, tutuklamayı yapmadan önce şüpheliyi haftalarca gölge gibi izledi."}
],
"shame": [
  {"tr": "i. utanç, ayıp", "ex": "He felt a deep sense of shame after forgetting his sister's birthday for the second year.", "exTr": "İkinci yıl da kız kardeşinin doğum gününü unuttuktan sonra derin bir utanç duydu."},
  {"tr": "f. utandırmak", "ex": "The documentary shamed the company into improving conditions at its overseas factories.", "exTr": "Belgesel, şirketi utandırarak denizaşırı fabrikalarındaki koşulları iyileştirmeye mecbur etti."}
],
"shield": [
  {"tr": "i. kalkan, koruyucu", "ex": "Roman soldiers carried a heavy shield into battle to block arrows and sword blows.", "exTr": "Romalı askerler, okları ve kılıç darbelerini savuşturmak için savaşa ağır bir kalkan taşırdı."},
  {"tr": "f. korumak, kalkanlamak", "ex": "Sunscreen helps shield the skin from harmful ultraviolet rays during long summer afternoons.", "exTr": "Güneş kremi, uzun yaz öğleden sonralarında cildi zararlı morötesi ışınlardan korumaya yardımcı olur."}
],
"shout": [
  {"tr": "i. bağırış, haykırış", "ex": "A sudden shout from the crowd warned the cyclist of the obstacle ahead.", "exTr": "Kalabalıktan gelen ani bir bağırış, bisikletçiyi ilerideki engele karşı uyardı."},
  {"tr": "f. bağırmak, haykırmak", "ex": "Lifeguards must shout clear warnings whenever swimmers venture too close to the dangerous current.", "exTr": "Cankurtaranlar, yüzücüler tehlikeli akıntıya fazla yaklaştığında net uyarılar bağırarak vermelidir."}
],
"shut": [
  {"tr": "s. kapalı", "ex": "The museum remained shut for months while engineers repaired the earthquake damage.", "exTr": "Mühendisler deprem hasarını onarırken müze aylarca kapalı kaldı."},
  {"tr": "f. kapatmak", "ex": "Employees were told to shut the windows before leaving the office for the weekend.", "exTr": "Çalışanlara, hafta sonu için ofisten ayrılmadan önce pencereleri kapatmaları söylendi."}
],
"shuttle": [
  {"tr": "i. mekik, servis aracı", "ex": "A free shuttle service transports visitors between the parking area and the museum entrance.", "exTr": "Ücretsiz bir servis aracı, ziyaretçileri otopark alanı ile müze girişi arasında taşıyor."},
  {"tr": "f. mekik dokumak, gidip gelmek", "ex": "Diplomats shuttled between the two capitals for months trying to negotiate a lasting ceasefire.", "exTr": "Diplomatlar, kalıcı bir ateşkes müzakere etmeye çalışarak aylarca iki başkent arasında gidip geldi."}
],
"silence": [
  {"tr": "i. sessizlik", "ex": "An uncomfortable silence filled the room after the manager announced the layoffs.", "exTr": "Yönetici işten çıkarmaları duyurduktan sonra odayı rahatsız edici bir sessizlik kapladı."},
  {"tr": "f. susturmak", "ex": "The regime tried to silence critical journalists by threatening them with imprisonment.", "exTr": "Rejim, eleştirel gazetecileri hapisle tehdit ederek susturmaya çalıştı."}
],
"sixth": [
  {"tr": "s. altıncı", "ex": "The company celebrated its sixth anniversary with a small gathering for employees.", "exTr": "Şirket, altıncı yıl dönümünü çalışanlar için küçük bir buluşmayla kutladı."},
  {"tr": "i. altıda bir", "ex": "Roughly a sixth of the world's population still lacks reliable access to clean drinking water.", "exTr": "Dünya nüfusunun kabaca altıda biri, temiz içme suyuna hâlâ güvenilir erişimden yoksun."}
],
"ski": [
  {"tr": "i. kayak", "ex": "The rental shop provided each beginner with a pair of properly fitted skis and poles.", "exTr": "Kiralama dükkânı, her acemiye uygun şekilde ayarlanmış bir çift kayak ve baton verdi."},
  {"tr": "f. kayak yapmak", "ex": "Every winter, thousands of tourists travel to the Alps to ski on fresh snow.", "exTr": "Her kış, binlerce turist taze karda kayak yapmak için Alpler'e gider."}
],
"smile": [
  {"tr": "i. gülümseme", "ex": "The nurse greeted every patient with a warm smile each morning.", "exTr": "Hemşire, her sabah her hastayı sıcak bir gülümsemeyle karşıladı."},
  {"tr": "f. gülümsemek", "ex": "The shy student smiled with relief when the teacher praised her presentation.", "exTr": "Öğretmen sunumunu övünce utangaç öğrenci rahatlayarak gülümsedi."}
],
"sniff": [
  {"tr": "i. koklama", "ex": "The dog gave the stranger's bag a cautious sniff before wagging its tail.", "exTr": "Köpek, kuyruğunu sallamadan önce yabancının çantasını temkinli bir koklamayla yokladı."},
  {"tr": "f. koklamak", "ex": "The trained dog began to sniff each suitcase carefully as it passed along the belt.", "exTr": "Eğitimli köpek, bant üzerinde ilerlerken her bavulu dikkatle koklamaya başladı."}
],
"socialist": [
  {"tr": "s. sosyalist", "ex": "During the debate, the candidate described her economic program as broadly socialist in its aims.", "exTr": "Tartışma sırasında aday, ekonomik programını amaçları bakımından büyük ölçüde sosyalist olarak tanımladı."},
  {"tr": "i. sosyalist (kişi)", "ex": "As a lifelong socialist, he argued that essential services should remain under public ownership.", "exTr": "Yaşamı boyunca sosyalist olan adam, temel hizmetlerin kamu mülkiyetinde kalması gerektiğini savundu."}
],
"soft": [
  {"tr": "s. yumuşak; hafif", "ex": "Engineers lined the helmet's interior with a soft foam layer to absorb sudden impacts.", "exTr": "Mühendisler, ani darbeleri emmesi için kaskın iç kısmını yumuşak bir köpük tabakayla kapladı."},
  {"tr": "z. yumuşakça", "ex": "Snow fell soft over the silent village throughout the long winter night.", "exTr": "Uzun kış gecesi boyunca sessiz köyün üzerine kar yumuşakça yağdı."}
],
"south-east": [
  {"tr": "z. güneydoğuya doğru", "ex": "The hurricane is expected to move south-east across the ocean before losing strength.", "exTr": "Kasırganın, gücünü yitirmeden önce okyanus boyunca güneydoğuya doğru ilerlemesi bekleniyor."},
  {"tr": "s. güneydoğu", "ex": "The south-east coast of the island attracts divers with its clear, warm waters.", "exTr": "Adanın güneydoğu kıyısı, berrak ve sıcak sularıyla dalgıçları cezbeder."}
],
"southeast": [
  {"tr": "i. güneydoğu", "ex": "The southeast of the country experienced record temperatures during last summer's heat wave.", "exTr": "Ülkenin güneydoğusu, geçen yazki sıcak hava dalgası sırasında rekor sıcaklıklar yaşadı."},
  {"tr": "s./z. güneydoğuda, güneydoğuya doğru", "ex": "Heavy storms are expected to move across the southeast region of the country later this week.", "exTr": "Bu hafta içinde şiddetli fırtınaların ülkenin güneydoğu bölgesine doğru ilerlemesi bekleniyor."}
],
"southwest": [
  {"tr": "i. güneybatı", "ex": "Strong winds from the southwest brought heavy rainfall to the coastal farming communities.", "exTr": "Güneybatıdan esen kuvvetli rüzgarlar, kıyıdaki tarım topluluklarına şiddetli yağmur getirdi."},
  {"tr": "s./z. güneybatı yönünde", "ex": "The expedition traveled southwest for three days before reaching the desert oasis.", "exTr": "Keşif ekibi, çöldeki vahaya ulaşmadan önce üç gün boyunca güneybatı yönünde ilerledi."}
],
"splice": [
  {"tr": "f. eklemek, bağlamak (uçları birleştirmek)", "ex": "Technicians carefully splice the fiber-optic cables together to restore the interrupted internet connection.", "exTr": "Teknisyenler, kesintiye uğrayan internet bağlantısını yeniden sağlamak için fiber optik kabloları dikkatle birbirine ekler."},
  {"tr": "i. ek yeri", "ex": "Engineers inspected the splice in the undersea cable after signal quality suddenly dropped.", "exTr": "Sinyal kalitesi aniden düşünce mühendisler, denizaltı kablosundaki ek yerini inceledi."}
],
"sponsor": [
  {"tr": "i. sponsor, destekleyici", "ex": "The marathon's main sponsor provided free water and equipment for all the runners.", "exTr": "Maratonun ana sponsoru, tüm koşuculara ücretsiz su ve ekipman sağladı."},
  {"tr": "f. desteklemek, sponsor olmak", "ex": "A local pharmaceutical company agreed to sponsor the university's research into rare genetic disorders.", "exTr": "Yerel bir ilaç şirketi, üniversitenin nadir genetik bozukluklar üzerine araştırmasına sponsor olmayı kabul etti."}
],
"spur": [
  {"tr": "i. dürtü, teşvik", "ex": "The tax cut acted as a spur to investment in struggling rural areas.", "exTr": "Vergi indirimi, zorluk çeken kırsal bölgelerde yatırım için bir teşvik işlevi gördü."},
  {"tr": "f. teşvik etmek, hızlandırmak", "ex": "Government investment helped spur growth in the region's renewable energy sector.", "exTr": "Hükümet yatırımı, bölgenin yenilenebilir enerji sektöründeki büyümeyi teşvik etmeye yardımcı oldu."}
],
"stain": [
  {"tr": "i. leke", "ex": "She scrubbed for an hour, but the ink stain on the tablecloth would not disappear.", "exTr": "Bir saat boyunca ovaladı ama masa örtüsündeki mürekkep lekesi bir türlü çıkmadı."},
  {"tr": "f. lekelemek", "ex": "Red wine can stain a light-colored carpet almost instantly if not cleaned quickly.", "exTr": "Kırmızı şarap, hızlıca temizlenmezse açık renkli bir halıyı neredeyse anında lekeleyebilir."}
],
"surrender": [
  {"tr": "i. teslim olma", "ex": "The general announced the army's formal surrender after months of devastating losses.", "exTr": "General, aylar süren yıkıcı kayıpların ardından ordunun resmen teslim olduğunu duyurdu."},
  {"tr": "f. teslim olmak", "ex": "After a three-day siege, the remaining soldiers had no choice but to surrender.", "exTr": "Üç günlük kuşatmanın ardından, geriye kalan askerlerin teslim olmaktan başka seçeneği kalmadı."}
],
"tag": [
  {"tr": "i. etiket", "ex": "Store employees carefully checked the price tag before applying the seasonal discount to each item.", "exTr": "Mağaza çalışanları, mevsimsel indirimi her ürüne uygulamadan önce fiyat etiketini dikkatlice kontrol etti."},
  {"tr": "f. etiketlemek", "ex": "Researchers tagged hundreds of migratory birds to track their routes across continents.", "exTr": "Araştırmacılar, kıtalar arasındaki rotalarını izlemek için yüzlerce göçmen kuşu etiketledi."}
],
"tent": [
  {"tr": "i. çadır", "ex": "Relief workers set up dozens of tents to shelter families displaced by the flood.", "exTr": "Yardım görevlileri, seli nedeniyle evsiz kalan aileleri barındırmak için düzinelerce çadır kurdu."},
  {"tr": "f. çadırda kalmak", "ex": "The scouts tented beside the river for two nights during their wilderness training.", "exTr": "İzciler, doğa eğitimleri sırasında iki gece nehir kenarında çadırda kaldı."}
],
"thirst": [
  {"tr": "i. susuzluk", "ex": "After the long desert hike, an overwhelming thirst forced them to stop and rest.", "exTr": "Uzun çöl yürüyüşünün ardından, bastıran bir susuzluk onları durup dinlenmeye zorladı."},
  {"tr": "f. susamak", "ex": "Travelers crossing the desert soon thirst for water under the burning midday sun.", "exTr": "Çölü geçen yolcular, yakıcı öğle güneşinin altında kısa sürede suya susar."}
],
"thrill": [
  {"tr": "i. heyecan", "ex": "The thrill of space exploration continues to attract young scientists to astrophysics programs worldwide.", "exTr": "Uzay keşfinin heyecanı, genç bilim insanlarını dünya çapındaki astrofizik programlarına çekmeye devam ediyor."},
  {"tr": "f. heyecanlandırmak", "ex": "Nothing could thrill the young astronomer more than discovering a previously unknown comet.", "exTr": "Genç gökbilimciyi, daha önce bilinmeyen bir kuyruklu yıldız keşfetmekten daha fazla hiçbir şey heyecanlandıramazdı."}
],
"tonight": [
  {"tr": "z. bu gece", "ex": "Meteorologists predict that a severe thunderstorm will move through the region tonight.", "exTr": "Meteorologlar, bölgeden bu gece şiddetli bir gök gürültülü fırtınanın geçeceğini öngörüyor."},
  {"tr": "i. bu gecenin kendisi", "ex": "Astronomers announced that tonight offers the best chance to observe the meteor shower this year.", "exTr": "Gökbilimciler, bu gecenin meteor yağmurunu gözlemlemek için bu yılki en iyi şansı sunduğunu duyurdu."}
],
"treasure": [
  {"tr": "i. hazine", "ex": "Archaeologists discovered a sunken treasure that had remained hidden beneath the ocean for centuries.", "exTr": "Arkeologlar, yüzyıllardır okyanusun altında gizli kalmış batık bir hazine keşfetti."},
  {"tr": "f. değer vermek, kıymetini bilmek", "ex": "Many elderly people treasure the handwritten letters they received from close friends decades ago.", "exTr": "Birçok yaşlı insan, onlarca yıl önce yakın arkadaşlarından aldıkları el yazısı mektupların kıymetini bilir."}
],
"truck": [
  {"tr": "i. kamyon", "ex": "A heavy truck delivered construction materials to the site early in the morning.", "exTr": "Ağır bir kamyon, sabahın erken saatlerinde inşaat malzemelerini şantiyeye teslim etti."},
  {"tr": "f. kamyonla taşımak", "ex": "Farmers truck their fresh produce to urban markets before dawn to secure the best prices.", "exTr": "Çiftçiler, en iyi fiyatları güvence altına almak için taze ürünlerini şafaktan önce kent pazarlarına kamyonla taşır."}
],
"tunnel": [
  {"tr": "i. tünel", "ex": "Engineers built a long tunnel through the mountain to shorten the railway route.", "exTr": "Mühendisler, demiryolu güzergâhını kısaltmak için dağın içinden uzun bir tünel inşa etti."},
  {"tr": "f. tünel kazmak", "ex": "Some desert rodents tunnel deep underground to escape the extreme daytime heat.", "exTr": "Bazı çöl kemirgenleri, aşırı gündüz sıcağından kaçmak için yerin derinliklerinde tünel kazar."}
],
"twin": [
  {"tr": "i. ikiz", "ex": "Identical twins share the same genetic material, making them valuable subjects for medical research.", "exTr": "Tek yumurta ikizleri aynı genetik materyali paylaşır; bu da onları tıbbi araştırmalar için değerli denekler yapar."},
  {"tr": "s. ikiz, eş", "ex": "The city built twin towers that dominate the skyline of the financial district.", "exTr": "Şehir, finans bölgesinin siluetine hakim olan ikiz kuleler inşa etti."}
],
"underestimate": [
  {"tr": "f. hafife almak, küçümsemek", "ex": "Analysts warned investors not to underestimate the risks associated with the new market.", "exTr": "Analistler, yatırımcıları yeni pazarla ilişkili riskleri hafife almamaları konusunda uyardı."},
  {"tr": "i. düşük tahmin", "ex": "The initial budget proved to be a serious underestimate of the project's actual construction costs.", "exTr": "İlk bütçenin, projenin gerçek inşaat maliyetlerine dair ciddi bir düşük tahmin olduğu ortaya çıktı."}
],
"undesirable": [
  {"tr": "s. istenmeyen, hoş olmayan", "ex": "Chemists worked to eliminate an undesirable side effect discovered during the drug trial.", "exTr": "Kimyagerler, ilaç denemesi sırasında keşfedilen istenmeyen bir yan etkiyi ortadan kaldırmak için çalıştı."},
  {"tr": "i. istenmeyen kişi", "ex": "In the 1930s, some governments deported foreigners they had officially labeled as undesirables.", "exTr": "1930'larda bazı hükümetler, resmî olarak istenmeyen kişi ilan ettikleri yabancıları sınır dışı etti."}
],
"upgrade": [
  {"tr": "i. yükseltme, iyileştirme", "ex": "The airline offered frequent flyers a free upgrade to business class on the long flight.", "exTr": "Havayolu, sık uçan yolculara uzun uçuşta business sınıfına ücretsiz bir yükseltme sundu."},
  {"tr": "f. yükseltmek, geliştirmek", "ex": "The city plans to upgrade its aging water pipes to reduce leaks and contamination risks.", "exTr": "Şehir, sızıntıları ve kirlenme risklerini azaltmak için eskiyen su borularını geliştirmeyi planlıyor."}
],
"uplift": [
  {"tr": "i. yükselme, moral", "ex": "Economists observed a noticeable uplift in consumer confidence after the interest rate cut.", "exTr": "Ekonomistler, faiz indiriminin ardından tüketici güveninde belirgin bir yükselme gözlemledi."},
  {"tr": "f. yükseltmek, moral vermek", "ex": "Volunteers hoped the charity concert would uplift the spirits of flood survivors.", "exTr": "Gönüllüler, hayır konserinin sel mağdurlarının moralini yükseltmesini umuyordu."}
],
"vacation": [
  {"tr": "i. tatil", "ex": "Many employees postpone their vacation until the end of the fiscal year for tax reasons.", "exTr": "Birçok çalışan, vergisel nedenlerle tatilini mali yılın sonuna kadar erteler."},
  {"tr": "f. tatile çıkmak", "ex": "Wealthy families often vacation on Mediterranean islands during the hottest weeks of summer.", "exTr": "Varlıklı aileler, yazın en sıcak haftalarında genellikle Akdeniz adalarına tatile çıkar."}
],
"variable": [
  {"tr": "s. değişken, değişebilir", "ex": "Weather in the region is highly variable, making harvest planning difficult for local farmers.", "exTr": "Bölgedeki hava durumu son derece değişkendir; bu da yerel çiftçiler için hasat planlamasını zorlaştırır."},
  {"tr": "i. (mat.) değişken", "ex": "Researchers controlled every variable carefully to ensure the accuracy of their experiment.", "exTr": "Araştırmacılar, deneylerinin doğruluğunu sağlamak için her değişkeni dikkatle kontrol etti."}
],
"variant": [
  {"tr": "s. değişken, farklı", "ex": "Medieval manuscripts often contain variant spellings of the same word across different pages.", "exTr": "Ortaçağ el yazmaları, aynı kelimenin değişken yazımlarını farklı sayfalarda sıkça içerir."},
  {"tr": "i. varyant, çeşit, tür", "ex": "Scientists identified a new viral variant that spread more easily among young children.", "exTr": "Bilim insanları, küçük çocuklar arasında daha kolay yayılan yeni bir viral varyant belirledi."}
],
"veteran": [
  {"tr": "i. gazi, emektar", "ex": "The hospital opened a special wing dedicated to treating veteran soldiers with long-term injuries.", "exTr": "Hastane, uzun süreli yaralanmaları olan gazi askerleri tedavi etmeye adanmış özel bir bölüm açtı."},
  {"tr": "s. deneyimli, kıdemli", "ex": "The veteran journalist covered five presidential elections during her long career at the newspaper.", "exTr": "Kıdemli gazeteci, gazetedeki uzun kariyeri boyunca beş cumhurbaşkanlığı seçimini haberleştirdi."}
],
"vomit": [
  {"tr": "f. kusmak", "ex": "The child began to vomit shortly after eating spoiled seafood at the restaurant.", "exTr": "Çocuk, restoranda bozulmuş deniz ürünleri yedikten kısa süre sonra kusmaya başladı."},
  {"tr": "i. kusmuk", "ex": "Doctors examined the patient's vomit for traces of the toxic substance he had swallowed.", "exTr": "Doktorlar, yuttuğu zehirli maddenin izlerini bulmak için hastanın kusmuğunu inceledi."}
],
"warning": [
  {"tr": "i. uyarı, ikaz", "ex": "Meteorologists issued a warning about severe flooding expected across the coastal region this weekend.", "exTr": "Meteorologlar, bu hafta sonu kıyı bölgesinde beklenen şiddetli sel için bir uyarı yayımladı."},
  {"tr": "s. uyarıcı, ikaz eden", "ex": "Drivers ignored the warning signs placed along the icy mountain road.", "exTr": "Sürücüler, buzlu dağ yolu boyunca yerleştirilmiş uyarı levhalarını görmezden geldi."}
],
"wash": [
  {"tr": "f. yıkamak", "ex": "Heavy rains began to wash away topsoil from the recently deforested hillside.", "exTr": "Şiddetli yağmurlar, yakın zamanda ormansızlaştırılmış tepenin üst toprağını yıkayıp götürmeye başladı."},
  {"tr": "i. yıkama, çamaşır", "ex": "These wool sweaters may shrink badly in a hot wash, so use cold water instead.", "exTr": "Bu yün kazaklar sıcak yıkamada fena hâlde çekebilir, bu yüzden onun yerine soğuk su kullanın."}
],
"weed": [
  {"tr": "i. yabani ot", "ex": "A single invasive weed can spread across an entire field within one growing season.", "exTr": "Tek bir istilacı yabani ot, bir yetişme mevsimi içinde tüm tarlaya yayılabilir."},
  {"tr": "f. (yabani otlardan) ayıklamak", "ex": "Gardeners often weed the flower beds early in the morning before the soil becomes too dry.", "exTr": "Bahçıvanlar, toprak fazla kurumadan önce genellikle sabah erkenden çiçek tarhlarındaki yabani otları ayıklar."}
],
"wet": [
  {"tr": "s. ıslak, nemli", "ex": "Farmers welcomed the unusually wet spring after three consecutive years of drought.", "exTr": "Çiftçiler, art arda üç kuraklık yılının ardından alışılmadık derecede yağışlı ilkbaharı memnuniyetle karşıladı."},
  {"tr": "i. nem, yağış", "ex": "Do not leave the garden furniture out in the wet, or the wood will quickly rot.", "exTr": "Bahçe mobilyalarını yağışta dışarıda bırakmayın, yoksa ahşap hızla çürür."},
  {"tr": "f. ıslatmak", "ex": "Nurses gently wet the bandage before removing it to avoid damaging the healing skin.", "exTr": "Hemşireler, iyileşen cildi zedelememek için bandajı çıkarmadan önce nazikçe ıslatır."}
],
"whisper": [
  {"tr": "f. fısıldamak", "ex": "During the exam, a student began to whisper answers to a classmate sitting nearby.", "exTr": "Sınav sırasında bir öğrenci, yakınında oturan bir sınıf arkadaşına cevapları fısıldamaya başladı."},
  {"tr": "i. fısıltı", "ex": "The library was so quiet that even a soft whisper could be heard across the room.", "exTr": "Kütüphane o kadar sessizdi ki yumuşak bir fısıltı bile odanın öbür ucundan duyulabiliyordu."}
],
"yawn": [
  {"tr": "i. esneme", "ex": "The tired students tried to hide their yawns during the long afternoon lecture.", "exTr": "Yorgun öğrenciler, uzun öğleden sonra dersinde esnemelerini gizlemeye çalıştı."},
  {"tr": "f. esnemek", "ex": "Passengers often yawn during long overnight flights because cabin oxygen levels are slightly lower.", "exTr": "Yolcular, kabindeki oksijen seviyeleri biraz daha düşük olduğu için uzun gece uçuşlarında sık sık esner."}
],

/* --- ornek-dogrula.py: çok türlü kelimelere tür başına örnek --- */
"cross-eye": [
  {"tr": "i. şaşılık", "ex": "The ophthalmologist explained that early treatment can often correct cross-eye in young children.", "exTr": "Göz doktoru, erken tedavinin genellikle küçük çocuklarda şaşılığı düzeltebileceğini açıkladı."},
  {"tr": "s. şaşı", "ex": "Doctors noted that the cross-eyed patient regained normal vision after a simple surgical procedure.", "exTr": "Doktorlar, şaşı hastanın basit bir cerrahi işlemden sonra normal görüşünü geri kazandığını kaydetti."}
],
"cross-link": [
  {"tr": "i. çapraz bağ", "ex": "Chemists strengthened the polymer by introducing additional cross-link bonds between its molecular chains.", "exTr": "Kimyagerler, moleküler zincirleri arasına ek çapraz bağlar ekleyerek polimeri güçlendirdi."},
  {"tr": "f. çapraz bağlamak", "ex": "Manufacturers cross-link the rubber molecules with sulfur to make tyres far more durable under heat.", "exTr": "Üreticiler, lastikleri ısı altında çok daha dayanıklı kılmak için kauçuk moleküllerini kükürtle çapraz bağlar."}
],
"discard": [
  {"tr": "f. atmak, elden çıkarmak", "ex": "Hospitals must discard used needles safely to prevent the spread of infection among staff.", "exTr": "Hastaneler, personel arasında enfeksiyon yayılmasını önlemek için kullanılmış iğneleri güvenli bir şekilde atmalıdır."},
  {"tr": "i. atılan şey", "ex": "The recycling centre weighs every discard before deciding whether the material can be processed again.", "exTr": "Geri dönüşüm merkezi, malzemenin yeniden işlenip işlenemeyeceğine karar vermeden önce atılan her şeyi tartar."}
],
"dislike": [
  {"tr": "f. hoşlanmamak, sevmemek", "ex": "Most commuters dislike the new timetable because it forces them to leave home much earlier.", "exTr": "Çoğu yolcu, evden çok daha erken çıkmalarını zorunlu kıldığı için yeni tarifeden hoşlanmıyor."},
  {"tr": "i. hoşlanmama, antipati", "ex": "Many customers expressed their dislike for the redesigned app interface shortly after the latest update.", "exTr": "Birçok müşteri, en son güncellemeden kısa süre sonra yeniden tasarlanan uygulama arayüzünden hoşlanmadığını dile getirdi."}
],
"disregard": [
  {"tr": "f. göz ardı etmek, önemsememek", "ex": "Critics claim the new policy will simply disregard the concerns raised by small business owners.", "exTr": "Eleştirmenler, yeni politikanın küçük işletme sahiplerinin dile getirdiği kaygıları basitçe göz ardı edeceğini iddia ediyor."},
  {"tr": "i. kayıtsızlık, umursamazlık", "ex": "The factory owners showed complete disregard for safety rules, and inspectors finally closed the plant.", "exTr": "Fabrika sahipleri güvenlik kurallarına karşı tam bir kayıtsızlık sergiledi ve müfettişler sonunda tesisi kapattı."}
],
"double-cross": [
  {"tr": "f. ihanet etmek, aldatmak", "ex": "The informant decided to double-cross his partners and report the entire scheme to the police.", "exTr": "Muhbir, ortaklarına ihanet etmeye ve tüm planı polise bildirmeye karar verdi."},
  {"tr": "i. ihanet, aldatmaca", "ex": "The novel ends with a stunning double-cross that leaves the reader questioning every earlier chapter.", "exTr": "Roman, okuru önceki her bölümü sorgulamaya iten çarpıcı bir ihanetle sona eriyor."}
],
"drive-in": [
  {"tr": "i. arabalı sinema/lokanta", "ex": "Only a handful of drive-ins still operate in the country, and most close during winter.", "exTr": "Ülkede yalnızca birkaç arabalı sinema hâlâ faaliyet gösteriyor ve çoğu kış boyunca kapalı kalıyor."},
  {"tr": "s. arabayla girilen", "ex": "During the 1950s, families across America regularly spent Friday nights at the local drive-in theater.", "exTr": "1950'lerde Amerika genelindeki aileler, cuma akşamlarını genellikle yerel arabalı sinemada geçirirdi."}
],
"dull": [
  {"tr": "s. sıkıcı, donuk", "ex": "The lecture was so dull that several students struggled to stay awake until the end.", "exTr": "Ders o kadar sıkıcıydı ki birkaç öğrenci sona kadar uyanık kalmakta zorlandı."},
  {"tr": "f. hafifletmek, köreltmek", "ex": "Strong painkillers dull the sensation but do not treat the underlying cause of the injury.", "exTr": "Güçlü ağrı kesiciler hissi hafifletir ancak yaralanmanın altında yatan nedeni tedavi etmez."}
],
"duplicate": [
  {"tr": "f. çoğaltmak, kopyasını çıkarmak", "ex": "The lab managed to duplicate the experiment's results using a completely different set of equipment.", "exTr": "Laboratuvar, tamamen farklı bir ekipman seti kullanarak deneyin sonuçlarını çoğaltmayı başardı."},
  {"tr": "i. kopya, suret", "ex": "Applicants should keep a duplicate of every document they submit to the immigration office.", "exTr": "Başvuru sahipleri, göçmenlik bürosuna sundukları her belgenin bir kopyasını saklamalıdır."}
],
"eighth": [
  {"tr": "s. sekizinci", "ex": "Residents on the eighth floor complained about the elevator breaking down twice this month.", "exTr": "Sekizinci kattaki sakinler, asansörün bu ay iki kez arızalanmasından şikayet etti."},
  {"tr": "i. sekizde bir", "ex": "Renewable sources now supply roughly an eighth of the country's total electricity demand.", "exTr": "Yenilenebilir kaynaklar artık ülkenin toplam elektrik talebinin yaklaşık sekizde birini karşılıyor."}
],
"feast": [
  {"tr": "i. ziyafet, şölen", "ex": "The emperor held an enormous feast to celebrate the empire's victory over its northern rivals.", "exTr": "İmparator, imparatorluğun kuzeyli rakiplerine karşı kazandığı zaferi kutlamak için muazzam bir ziyafet verdi."},
  {"tr": "f. ziyafet çekmek", "ex": "Villagers gathered to feast together after the successful completion of the harvest season.", "exTr": "Köylüler, hasat mevsiminin başarıyla tamamlanmasının ardından birlikte ziyafet çekmek için bir araya geldi."}
],
"ferry": [
  {"tr": "i. feribot", "ex": "Thousands of commuters rely on the ferry to cross the strait every morning before sunrise.", "exTr": "Binlerce yolcu, her sabah gün doğmadan önce boğazı geçmek için feribota güvenir."},
  {"tr": "f. feribotla taşımak, geçirmek", "ex": "Helicopters ferried emergency supplies to the flooded villages after the bridges collapsed last week.", "exTr": "Helikopterler, geçen hafta köprüler çöktükten sonra sel basmış köylere acil yardım malzemeleri taşıdı."}
],
"fly-by-night": [
  {"tr": "s. güvenilmez, gelip geçici", "ex": "Consumers were warned to avoid the fly-by-night contractor who disappeared after taking payment.", "exTr": "Tüketiciler, ödemeyi aldıktan sonra ortadan kaybolan güvenilmez müteahhitten kaçınmaları konusunda uyarıldı."},
  {"tr": "i. güvenilmez şirket/kişi", "ex": "The agency turned out to be a fly-by-night that vanished with the clients' deposits.", "exTr": "Ajansın, müşterilerin depozitolarıyla ortadan kaybolan güvenilmez bir şirket olduğu ortaya çıktı."}
],
"fog": [
  {"tr": "i. sis", "ex": "Thick fog delayed several flights at the airport early this morning, frustrating hundreds of travelers.", "exTr": "Yoğun sis, bu sabah erken saatlerde havalimanında birçok uçuşu geciktirerek yüzlerce yolcuyu hayal kırıklığına uğrattı."},
  {"tr": "f. sisle kaplamak, bulanıklaştırmak", "ex": "Steam from the kettle fogged the kitchen window within seconds of the water boiling.", "exTr": "Su kaynadıktan saniyeler sonra çaydanlıktan çıkan buhar mutfak penceresini bulanıklaştırdı."}
],
"follow-on": [
  {"tr": "s. ek, sonradan gelen", "ex": "The company launched a follow-on funding round after its first product succeeded in the market.", "exTr": "Şirket, ilk ürünü pazarda başarılı olduktan sonra ek bir finansman turu başlattı."},
  {"tr": "i. devam niteliğindeki aşama", "ex": "Researchers presented the trial as a follow-on to the earlier study on childhood nutrition.", "exTr": "Araştırmacılar denemeyi, çocuk beslenmesi üzerine yapılan önceki çalışmanın devamı niteliğindeki bir aşama olarak sundu."}
],
"follow-up": [
  {"tr": "i. takip, ek çalışma", "ex": "Doctors scheduled a follow-up appointment to check whether the treatment had been effective.", "exTr": "Doktorlar, tedavinin etkili olup olmadığını kontrol etmek için bir takip randevusu planladı."},
  {"tr": "f. takibini yapmak", "ex": "Nurses followed up every discharged patient by telephone to make sure the medication was working.", "exTr": "Hemşireler, ilacın işe yarayıp yaramadığından emin olmak için taburcu edilen her hastayı telefonla takip etti."}
],
"forage": [
  {"tr": "f. yiyecek aramak, yem toplamak", "ex": "Wild boars often forage for roots and insects along the forest floor at night.", "exTr": "Yaban domuzları, geceleri orman zemininde genellikle kök ve böcek arayarak yiyecek toplar."},
  {"tr": "i. hayvan yemi", "ex": "Drought reduced the amount of forage available for cattle across the southern grasslands this summer.", "exTr": "Kuraklık, bu yaz güneydeki otlaklarda sığırlar için mevcut olan hayvan yemi miktarını azalttı."}
],
"foremost": [
  {"tr": "s. en önde gelen, başlıca", "ex": "She is widely regarded as the foremost expert on ancient Mediterranean trade routes.", "exTr": "Kendisi, antik Akdeniz ticaret yolları konusunda en önde gelen uzman olarak kabul edilmektedir."},
  {"tr": "z. en başta", "ex": "First and foremost, the report urges governments to reduce emissions from heavy industry.", "exTr": "En başta, rapor hükümetleri ağır sanayiden kaynaklanan emisyonları azaltmaya çağırıyor."}
],
"glow": [
  {"tr": "i. parıltı, ışıltı", "ex": "A faint glow appeared on the horizon shortly before the sun rose over the desert.", "exTr": "Güneş çölün üzerinde doğmadan kısa süre önce ufukta soluk bir parıltı belirdi."},
  {"tr": "f. parlamak, ışımak", "ex": "The embers continued to glow softly in the fireplace long after the flames had died down.", "exTr": "Alevler söndükten çok sonra bile korlar, şöminede yumuşak bir şekilde ışımaya devam etti."}
],
"good-for-nothing": [
  {"tr": "s. işe yaramaz", "ex": "The old farmer complained about his good-for-nothing tractor, which broke down every second week.", "exTr": "Yaşlı çiftçi, iki haftada bir bozulan işe yaramaz traktöründen şikayet etti."},
  {"tr": "i. hiçbir işe yaramayan kişi", "ex": "Her uncle always called the lazy neighbor a good-for-nothing who never kept a steady job.", "exTr": "Amcası, tembel komşuya hiçbir zaman düzenli bir işte kalmayan hiçbir işe yaramaz biri derdi."}
],
"half-length": [
  {"tr": "s. yarım boy", "ex": "The gallery displayed a half-length portrait of the queen painted in the eighteenth century.", "exTr": "Galeri, on sekizinci yüzyılda yapılmış kraliçenin yarım boy bir portresini sergiledi."},
  {"tr": "i. yarım boy portre", "ex": "The museum acquired a rare half-length attributed to a little-known Flemish master.", "exTr": "Müze, az bilinen bir Flaman ustaya atfedilen nadir bir yarım boy portre satın aldı."}
],
"herd": [
  {"tr": "i. sürü", "ex": "Shepherds guided the herd across the valley before the first snowfall closed the mountain paths.", "exTr": "Çobanlar, ilk kar yağışı dağ patikalarını kapatmadan önce sürüyü vadi boyunca yönlendirdi."},
  {"tr": "f. sürü hâlinde toplamak, gütmek", "ex": "The farmer herded his cattle into the barn as soon as the thunderstorm began.", "exTr": "Çiftçi, gök gürültülü fırtına başlar başlamaz sığırlarını ahıra güttü."}
],
"hopeful": [
  {"tr": "s. umutlu", "ex": "Economists remain cautiously hopeful that inflation will ease over the coming months.", "exTr": "Ekonomistler, enflasyonun önümüzdeki aylarda hafifleyeceği konusunda temkinli bir şekilde umutlu kalmaya devam ediyor."},
  {"tr": "i. umut vadeden aday", "ex": "Several young hopefuls competed for a place in the national swimming team this season.", "exTr": "Bu sezon birkaç genç umut vadeden aday, milli yüzme takımında yer almak için yarıştı."}
],
"humanitarian": [
  {"tr": "s. insani, insancıl", "ex": "International organizations delivered humanitarian aid to remote villages affected by the devastating earthquake last month.", "exTr": "Uluslararası kuruluşlar, geçen ay yaşanan yıkıcı depremden etkilenen uzak köylere insani yardım ulaştırdı."},
  {"tr": "i. insancıl kişi", "ex": "The prize honours a humanitarian who spent forty years building schools in conflict zones.", "exTr": "Ödül, çatışma bölgelerinde kırk yıl boyunca okul inşa eden bir insancıl kişiyi onurlandırıyor."}
],
"hype": [
  {"tr": "i. abartılı tanıtım, yapay heyecan", "ex": "Critics warned that the hype surrounding the new smartphone exceeded what its actual features could deliver.", "exTr": "Eleştirmenler, yeni akıllı telefonu çevreleyen abartılı tanıtımın gerçek özelliklerinin sunabileceğinden fazla olduğu konusunda uyardı."},
  {"tr": "f. abartılı biçimde tanıtmak", "ex": "Studios hyped the film for months, yet audiences found the finished story disappointingly thin.", "exTr": "Stüdyolar filmi aylarca abartılı biçimde tanıttı, ancak izleyiciler ortaya çıkan öyküyü hayal kırıklığı yaratacak kadar sığ buldu."}
],
"imitation": [
  {"tr": "i. taklit", "ex": "The museum display included a convincing imitation of the original painting to protect it from damage.", "exTr": "Müze sergisi, orijinal tabloyu hasardan korumak amacıyla ikna edici bir taklidini içeriyordu."},
  {"tr": "s. taklit (sahte, orijinal olmayan)", "ex": "Cheap imitation leather wears out quickly, so buyers should check labels before paying premium prices.", "exTr": "Ucuz taklit deri çabuk yıpranır, bu yüzden alıcılar yüksek fiyat ödemeden önce etiketleri kontrol etmelidir."}
],
"insomniac": [
  {"tr": "i. uykusuz kişi", "ex": "As a lifelong insomniac, he tried nearly every remedy to fall asleep before midnight.", "exTr": "Ömür boyu uykusuzluk çeken biri olarak, gece yarısından önce uyuyabilmek için hemen her çareyi denedi."},
  {"tr": "s. uykusuzluk çeken", "ex": "The clinic studies insomniac patients who remain fully alert long after the household lights go out.", "exTr": "Klinik, evdeki ışıklar söndükten çok sonra bile tamamen uyanık kalan uykusuzluk çeken hastaları inceliyor."}
],
"insult": [
  {"tr": "f. hakaret etmek", "ex": "The minister apologised after critics said he had insulted teachers during a televised debate.", "exTr": "Bakan, eleştirmenlerin televizyonda yayınlanan bir tartışmada öğretmenlere hakaret ettiğini söylemesinin ardından özür diledi."},
  {"tr": "i. hakaret", "ex": "The comedian's joke was widely seen as an insult to the entire profession, sparking public backlash.", "exTr": "Komedyenin şakası, tüm mesleğe yönelik bir hakaret olarak geniş çapta algılandı ve kamuoyunda tepkiye yol açtı."}
],
"leftover": [
  {"tr": "s. artan, kalan", "ex": "Instead of throwing away leftover vegetables, the chef turned them into a rich soup.", "exTr": "Şef, artan sebzeleri çöpe atmak yerine onları zengin bir çorbaya dönüştürdü."},
  {"tr": "i. artık yemek", "ex": "Many families now freeze their leftovers instead of throwing perfectly edible food into the bin.", "exTr": "Pek çok aile, tamamen yenebilir yiyecekleri çöpe atmak yerine artık yemekleri donduruyor."}
],
"make-believe": [
  {"tr": "i. hayal, uydurma dünya", "ex": "Psychologists argue that make-believe helps children rehearse social roles they will later encounter.", "exTr": "Psikologlar, uydurma dünyanın çocukların ileride karşılaşacakları toplumsal rolleri önceden prova etmelerine yardımcı olduğunu savunuyor."},
  {"tr": "s. hayali, uydurma", "ex": "Young children often create a make-believe world filled with imaginary friends and adventures.", "exTr": "Küçük çocuklar sıklıkla hayali arkadaşlar ve maceralarla dolu bir hayal dünyası yaratır."}
],
"maneuver": [
  {"tr": "i. manevra", "ex": "The pilot executed a sharp maneuver to avoid the sudden turbulence over the mountains.", "exTr": "Pilot, dağların üzerindeki ani türbülanstan kaçınmak için keskin bir manevra yaptı."},
  {"tr": "f. manevra yapmak", "ex": "The captain maneuvered the tanker slowly through the narrow channel despite the strong evening current.", "exTr": "Kaptan, güçlü akşam akıntısına rağmen tankeri dar kanaldan yavaşça geçirerek manevra yaptı."}
],
"masculine": [
  {"tr": "s. erkeksi, erkeğe özgü", "ex": "Deep voices and broad shoulders are often stereotyped as masculine physical traits.", "exTr": "Kalın sesler ve geniş omuzlar genellikle erkeksi fiziksel özellikler olarak basmakalıplaştırılır."},
  {"tr": "i. (dilbilgisi) eril cins", "ex": "In German, every noun belongs to the masculine, the feminine, or the neuter.", "exTr": "Almancada her isim eril cinse, dişil cinse ya da nötr cinse aittir."}
],
"melancholy": [
  {"tr": "i. hüzün, melankoli", "ex": "A quiet melancholy settled over the town after the old factory finally closed its doors.", "exTr": "Eski fabrika sonunda kapılarını kapattıktan sonra kasabaya sessiz bir hüzün çöktü."},
  {"tr": "s. hüzünlü, melankolik", "ex": "The composer is remembered for melancholy piano pieces written during his final years abroad.", "exTr": "Besteci, son yıllarında yurt dışında yazdığı hüzünlü piyano parçalarıyla hatırlanıyor."}
],
"menace": [
  {"tr": "i. tehdit, tehlike", "ex": "Rising sea levels pose a serious menace to coastal communities living near the shoreline.", "exTr": "Yükselen deniz seviyeleri, kıyı şeridine yakın yaşayan topluluklar için ciddi bir tehdit oluşturuyor."},
  {"tr": "f. tehdit etmek", "ex": "Wildfires menaced several mountain villages for a week before firefighters brought the flames under control.", "exTr": "Orman yangınları, itfaiyeciler alevleri kontrol altına almadan önce bir hafta boyunca birkaç dağ köyünü tehdit etti."}
],
"mistrust": [
  {"tr": "i. güvensizlik", "ex": "Decades of political scandals have created deep public mistrust toward government institutions.", "exTr": "On yıllar süren siyasi skandallar, kamuoyunda devlet kurumlarına karşı derin bir güvensizlik yarattı."},
  {"tr": "f. güvenmemek", "ex": "Many voters mistrust official statistics and prefer to rely on what they see locally.", "exTr": "Birçok seçmen resmi istatistiklere güvenmiyor ve yerel olarak gördüklerine dayanmayı tercih ediyor."}
],
"misuse": [
  {"tr": "i. kötüye kullanma, suistimal", "ex": "The report warned that misuse of antibiotics is accelerating the spread of drug-resistant bacteria.", "exTr": "Rapor, antibiyotiklerin kötüye kullanımının ilaca dirençli bakterilerin yayılmasını hızlandırdığı konusunda uyardı."},
  {"tr": "f. kötüye kullanmak", "ex": "Officials were accused of misusing public funds during the reconstruction of the coastal highway.", "exTr": "Yetkililer, kıyı otoyolunun yeniden inşası sırasında kamu fonlarını kötüye kullanmakla suçlandı."}
],
"mound": [
  {"tr": "i. tümsek, toprak yığını", "ex": "Archaeologists discovered ancient pottery buried beneath a small mound near the river bank.", "exTr": "Arkeologlar, nehir kıyısının yakınındaki küçük bir tümseğin altında gömülü antik çömlekler keşfetti."},
  {"tr": "f. yığmak", "ex": "Workers mounded the excavated soil beside the trench so that rain would not wash it away.", "exTr": "İşçiler, yağmurun toprağı sürükleyip götürmemesi için kazılan toprağı hendeğin yanına yığdı."}
],
"nonsense": [
  {"tr": "i. saçmalık, saçma söz", "ex": "The scientist dismissed the conspiracy theory as complete nonsense without any supporting evidence.", "exTr": "Bilim insanı, komplo teorisini destekleyici hiçbir kanıt olmadan tam bir saçmalık olarak nitelendirdi."},
  {"tr": "s. saçma", "ex": "Editors removed several nonsense phrases that had crept into the manual during a rushed translation.", "exTr": "Editörler, aceleyle yapılan bir çeviri sırasında kılavuza sızmış birkaç saçma ifadeyi çıkardı."}
],
"obsessive-compulsive": [
  {"tr": "s. obsesif-kompulsif", "ex": "Therapists use a specific form of behavioral therapy to treat patients with obsessive-compulsive disorder.", "exTr": "Terapistler, obsesif-kompulsif bozukluğu olan hastaları tedavi etmek için özel bir davranışsal terapi biçimi kullanır."},
  {"tr": "i. obsesif-kompulsif bozukluğu olan kişi", "ex": "The study tracked forty obsessive-compulsives for two years to measure how symptoms changed over time.", "exTr": "Çalışma, belirtilerin zaman içinde nasıl değiştiğini ölçmek için obsesif-kompulsif bozukluğu olan kırk kişiyi iki yıl boyunca izledi."}
],
"off-season": [
  {"tr": "i. ölü sezon, düşük sezon", "ex": "Hotel prices along the coast drop sharply during the off-season, attracting budget-conscious travelers.", "exTr": "Kıyı boyunca otel fiyatları ölü sezonda keskin biçimde düşerek bütçesine dikkat eden gezginleri cezbeder."},
  {"tr": "s. sezon dışı", "ex": "Off-season training helped the team recover from injuries before the new league campaign started.", "exTr": "Sezon dışı antrenmanlar, yeni lig kampanyası başlamadan önce takımın sakatlıklardan kurtulmasına yardımcı oldu."}
],
"outfit": [
  {"tr": "i. kıyafet, takım elbise", "ex": "She bought a new outfit for the job interview scheduled next Monday morning.", "exTr": "Gelecek Pazartesi sabahına planlanan iş görüşmesi için yeni bir kıyafet satın aldı."},
  {"tr": "f. donatmak", "ex": "The charity outfitted every rescue boat with radios, life jackets, and emergency medical kits.", "exTr": "Yardım kuruluşu, her kurtarma botunu telsizler, can yelekleri ve acil tıbbi malzeme çantalarıyla donattı."}
],
"outward": [
  {"tr": "s. dışa dönük, görünürdeki", "ex": "Despite her outward calm, she was extremely nervous about the upcoming medical results.", "exTr": "Görünürdeki sakinliğine rağmen, yaklaşan tıbbi sonuçlar konusunda son derece gergindi."},
  {"tr": "z. dışa doğru", "ex": "The blast forced the heavy steel doors outward and shattered windows across the entire street.", "exTr": "Patlama, ağır çelik kapıları dışa doğru itti ve tüm sokak boyunca camları paramparça etti."}
],
"overthrow": [
  {"tr": "f. devirmek (hükümeti)", "ex": "Historians still debate the exact causes that led rebels to overthrow the monarchy in 1917.", "exTr": "Tarihçiler, isyancıları 1917'de monarşiyi devirmeye yönelten kesin nedenleri hâlâ tartışıyor."},
  {"tr": "i. devrilme, darbe", "ex": "The overthrow of the elected government plunged the country into a decade of instability.", "exTr": "Seçilmiş hükümetin devrilmesi, ülkeyi on yıllık bir istikrarsızlık dönemine sürükledi."}
],
"overuse": [
  {"tr": "f. aşırı kullanmak", "ex": "Farmers who overuse chemical fertilisers gradually damage the soil and pollute nearby rivers and lakes.", "exTr": "Kimyasal gübreleri aşırı kullanan çiftçiler, toprağa yavaş yavaş zarar verir ve yakındaki nehirleri ve gölleri kirletir."},
  {"tr": "i. aşırı kullanım", "ex": "Doctors warn that overuse of antibiotics can lead to dangerous drug-resistant bacterial infections.", "exTr": "Doktorlar, antibiyotiklerin aşırı kullanımının tehlikeli ilaca dirençli bakteriyel enfeksiyonlara yol açabileceği konusunda uyarıyor."}
],
"pasture": [
  {"tr": "i. mera, otlak", "ex": "Farmers moved their cattle to a higher pasture before the summer heat dried the valley.", "exTr": "Çiftçiler, yaz sıcağı vadiyi kurutmadan önce sığırlarını daha yüksek bir meraya taşıdı."},
  {"tr": "f. otlatmak", "ex": "Nomadic families pastured their sheep on the high plateau throughout the short northern summer.", "exTr": "Göçebe aileler, kısa kuzey yazı boyunca koyunlarını yüksek platoda otlattı."}
],
"perfume": [
  {"tr": "i. parfüm", "ex": "The designer's latest perfume combines notes of jasmine, citrus, and sandalwood in equal measure.", "exTr": "Tasarımcının en yeni parfümü, yasemin, narenciye ve sandal ağacı notalarını eşit ölçüde birleştiriyor."},
  {"tr": "f. parfüm sürmek", "ex": "Actors perfumed their costumes before every performance to mask the smell of the old theatre.", "exTr": "Oyuncular, eski tiyatronun kokusunu bastırmak için her gösteriden önce kostümlerine parfüm sürdü."}
],
"pirate": [
  {"tr": "i. korsan", "ex": "Historians estimate that Caribbean pirates captured hundreds of merchant ships during the seventeenth century.", "exTr": "Tarihçiler, Karayip korsanlarının on yedinci yüzyıl boyunca yüzlerce ticaret gemisi ele geçirdiğini tahmin ediyor."},
  {"tr": "f. korsanlık yapmak", "ex": "Software companies lose billions of dollars every year because criminals pirate their programs and sell them cheaply online.", "exTr": "Yazılım şirketleri, suçlular programlarını korsan yollarla çoğaltıp ucuza çevrimiçi sattığı için her yıl milyarlarca dolar kaybediyor."}
],
"plunge": [
  {"tr": "f. aniden düşmek, dalmak", "ex": "Stock prices began to plunge sharply after the company announced disappointing quarterly earnings results.", "exTr": "Şirket, hayal kırıklığı yaratan üç aylık kazanç sonuçlarını açıkladıktan sonra hisse fiyatları keskin biçimde düşmeye başladı."},
  {"tr": "i. ani düşüş", "ex": "The sudden plunge in oil prices forced several energy companies to cancel their planned investments.", "exTr": "Petrol fiyatlarındaki ani düşüş, birkaç enerji şirketini planladıkları yatırımları iptal etmeye zorladı."}
],
"preventive": [
  {"tr": "s. önleyici", "ex": "Doctors emphasize preventive care, such as regular checkups, to reduce the risk of chronic disease.", "exTr": "Doktorlar, kronik hastalık riskini azaltmak için düzenli kontroller gibi önleyici bakımı ön plana çıkarır."},
  {"tr": "i. önlem", "ex": "Regular exercise is widely regarded as a powerful preventive against heart disease and stroke in later life.", "exTr": "Düzenli egzersiz, ileri yaşlarda kalp hastalığına ve felce karşı güçlü bir önlem olarak yaygın biçimde kabul edilir."}
],
"preview": [
  {"tr": "i. ön izleme, fragman", "ex": "Critics were invited to a private preview of the film several weeks before its official release.", "exTr": "Eleştirmenler, filmin resmi gösteriminden birkaç hafta önce özel bir ön izlemeye davet edildi."},
  {"tr": "f. önceden göstermek", "ex": "The finance minister will preview the new tax package at a press conference on Monday morning.", "exTr": "Maliye bakanı, yeni vergi paketini pazartesi sabahı düzenlenecek bir basın toplantısında önceden gösterecek."}
],
"quarantine": [
  {"tr": "i. karantina", "ex": "Health officials placed the entire cruise ship under quarantine after several passengers tested positive.", "exTr": "Sağlık yetkilileri, birkaç yolcunun testi pozitif çıktıktan sonra tüm gemiyi karantinaya aldı."},
  {"tr": "f. karantinaya almak", "ex": "Authorities decided to quarantine the imported cattle for thirty days before allowing them onto local farms.", "exTr": "Yetkililer, ithal sığırları yerel çiftliklere almadan önce otuz gün karantinaya almaya karar verdi."}
],
"ration": [
  {"tr": "i. tayın, pay", "ex": "Each soldier received a daily ration of dried meat and biscuits during the long winter campaign.", "exTr": "Her asker, uzun kış seferi boyunca günlük kurutulmuş et ve bisküvi tayını aldı."},
  {"tr": "f. paylara ayırmak, tayınla sınırlamak", "ex": "During the siege, officials had to ration bread and water carefully among the remaining residents.", "exTr": "Kuşatma sırasında yetkililer, ekmek ve suyu geriye kalan sakinler arasında dikkatle paylara ayırmak zorunda kaldı."}
],
"rebel": [
  {"tr": "i. asi, isyancı", "ex": "Government forces clashed with rebel fighters near the northern border for the third consecutive day.", "exTr": "Hükümet güçleri, kuzey sınırı yakınında üçüncü gün art arda asi savaşçılarla çatıştı."},
  {"tr": "f. isyan etmek", "ex": "Peasants began to rebel against the heavy taxes imposed by the emperor after three years of drought.", "exTr": "Köylüler, üç yıllık kuraklığın ardından imparatorun koyduğu ağır vergilere karşı isyan etmeye başladı."}
],
"rebound": [
  {"tr": "i. toparlanma", "ex": "The stock market showed a strong rebound after weeks of steady decline.", "exTr": "Borsa, haftalarca süren istikrarlı düşüşün ardından güçlü bir toparlanma gösterdi."},
  {"tr": "f. toparlanmak", "ex": "Tourism revenues are expected to rebound quickly once travel restrictions across the region are finally lifted.", "exTr": "Bölgedeki seyahat kısıtlamaları nihayet kaldırıldığında turizm gelirlerinin hızla toparlanması bekleniyor."}
],
"reign": [
  {"tr": "i. hükümdarlık, saltanat", "ex": "Historians consider the queen's reign one of the most prosperous periods in the kingdom's history.", "exTr": "Tarihçiler, kraliçenin hükümdarlığını krallığın tarihindeki en müreffeh dönemlerden biri olarak görür."},
  {"tr": "f. hükmetmek", "ex": "The emperor reigned for nearly fifty years and expanded his territory across three continents.", "exTr": "İmparator neredeyse elli yıl hüküm sürdü ve topraklarını üç kıtaya yaydı."}
],
"rental": [
  {"tr": "s. kiralık", "ex": "The couple decided to book a rental car for their two-week trip across the national parks.", "exTr": "Çift, milli parklar boyunca yapacakları iki haftalık gezi için kiralık bir araba ayırtmaya karar verdi."},
  {"tr": "i. kiralama, kira", "ex": "The monthly rental on the downtown apartment rose sharply after the new subway line opened.", "exTr": "Şehir merkezindeki dairenin aylık kirası, yeni metro hattı açıldıktan sonra keskin biçimde arttı."}
],
"revolt": [
  {"tr": "i. isyan, ayaklanma", "ex": "Widespread food shortages eventually sparked a revolt against the ruling government.", "exTr": "Yaygın gıda kıtlıkları sonunda yönetimdeki hükümete karşı bir isyanı tetikledi."},
  {"tr": "f. isyan etmek", "ex": "Colonial subjects finally revolted when the governor doubled the taxes on grain and salt.", "exTr": "Sömürge halkı, vali tahıl ve tuz vergilerini iki katına çıkardığında sonunda isyan etti."}
],
"ridicule": [
  {"tr": "f. alay etmek", "ex": "Critics did not hesitate to ridicule the politician's confusing and contradictory statements.", "exTr": "Eleştirmenler, politikacının kafa karıştırıcı ve çelişkili açıklamalarıyla alay etmekten çekinmedi."},
  {"tr": "i. alay, istihza", "ex": "The scientist endured years of ridicule before his theory was finally accepted by the academic community.", "exTr": "Bilim insanı, kuramı akademik camia tarafından nihayet kabul edilmeden önce yıllarca alaya katlandı."}
],
"sabotage": [
  {"tr": "i. sabotaj", "ex": "Investigators suspected sabotage after the factory's main generator failed under suspicious circumstances.", "exTr": "Fabrikanın ana jeneratörü şüpheli koşullar altında bozulduğunda, soruşturmacılar sabotajdan şüphelendi."},
  {"tr": "f. sabote etmek", "ex": "Rival firms tried to sabotage the merger by leaking confidential documents to several major newspapers.", "exTr": "Rakip firmalar, gizli belgeleri birkaç büyük gazeteye sızdırarak birleşmeyi sabote etmeye çalıştı."}
],
"scam": [
  {"tr": "i. dolandırıcılık", "ex": "Police warned elderly residents about a phone scam targeting people who live alone.", "exTr": "Polis, yalnız yaşayan insanları hedef alan bir telefon dolandırıcılığı konusunda yaşlı sakinleri uyardı."},
  {"tr": "f. dolandırmak", "ex": "Online criminals scammed thousands of investors by promising unrealistic returns on cryptocurrency deposits.", "exTr": "Çevrimiçi suçlular, kripto para yatırımlarında gerçekçi olmayan getiriler vaat ederek binlerce yatırımcıyı dolandırdı."}
],
"scar": [
  {"tr": "i. yara izi", "ex": "The surgery left a small scar along his collarbone that faded within a couple of years.", "exTr": "Ameliyat, birkaç yıl içinde solan, köprücük kemiği boyunca küçük bir yara izi bıraktı."},
  {"tr": "f. yara izi bırakmak", "ex": "Decades of open-pit mining have scarred the green hillsides that once surrounded the abandoned village.", "exTr": "On yıllarca süren açık ocak madenciliği, terk edilmiş köyü bir zamanlar çevreleyen yeşil yamaçlarda derin izler bıraktı."}
],
"screw": [
  {"tr": "i. vida", "ex": "The technician tightened a loose screw on the cabinet hinge before closing it.", "exTr": "Teknisyen, kapatmadan önce dolap menteşesindeki gevşek vidayı sıkılaştırdı."},
  {"tr": "f. vidalamak", "ex": "The workers screwed the metal panels onto the steel frame before the inspector arrived at the site.", "exTr": "İşçiler, denetçi sahaya varmadan önce metal panelleri çelik çerçeveye vidaladı."}
],
"script": [
  {"tr": "i. senaryo", "ex": "The director asked the writers to revise the script before filming the final scene.", "exTr": "Yönetmen, son sahneyi çekmeden önce yazarlardan senaryoyu gözden geçirmelerini istedi."},
  {"tr": "f. senaryosunu yazmak", "ex": "The young author was hired to script a documentary about melting glaciers in the Arctic.", "exTr": "Genç yazar, Kuzey Kutbu'ndaki eriyen buzulları konu alan bir belgeselin senaryosunu yazmak üzere işe alındı."}
],
"self-service": [
  {"tr": "s. self servis", "ex": "Many university cafeterias have switched to a self-service model to reduce staffing costs during peak hours.", "exTr": "Birçok üniversite kafeteryası, yoğun saatlerdeki personel maliyetini azaltmak için self servis modeline geçti."},
  {"tr": "i. self servis usulü", "ex": "Most petrol stations in the country moved to self-service in order to cut labor costs.", "exTr": "Ülkedeki akaryakıt istasyonlarının çoğu, işçilik maliyetlerini düşürmek için self servis usulüne geçti."}
],
"seventh": [
  {"tr": "s. yedinci", "ex": "The company celebrated its seventh anniversary with a small gathering at the main office.", "exTr": "Şirket, yedinci yıl dönümünü ana ofiste küçük bir toplantıyla kutladı."},
  {"tr": "i. yedide bir", "ex": "Renewable sources now provide roughly a seventh of the nation's total electricity supply.", "exTr": "Yenilenebilir kaynaklar artık ülkenin toplam elektrik arzının kabaca yedide birini sağlıyor."}
],
"shipwreck": [
  {"tr": "i. gemi enkazı", "ex": "Marine archaeologists discovered an ancient shipwreck buried beneath layers of sand and coral.", "exTr": "Deniz arkeologları, kum ve mercan katmanlarının altına gömülü kadim bir gemi enkazı keşfetti."},
  {"tr": "f. mahvetmek", "ex": "The sudden collapse of the bank shipwrecked the retirement plans of thousands of ordinary savers.", "exTr": "Bankanın ani çöküşü, binlerce sıradan tasarruf sahibinin emeklilik planlarını mahvetti."}
],
"shrimp": [
  {"tr": "i. karides", "ex": "Warming ocean temperatures have sharply reduced the shrimp populations along the southern coast in recent decades.", "exTr": "Isınan okyanus sıcaklıkları, son on yıllarda güney kıyısı boyunca karides popülasyonlarını keskin biçimde azalttı."},
  {"tr": "f. karides avlamak", "ex": "Fishermen along the coast still shrimp at dawn using nets passed down through generations.", "exTr": "Kıyı boyunca balıkçılar, nesillerdir aktarılan ağları kullanarak hâlâ şafak vakti karides avlar."}
],
"sip": [
  {"tr": "f. yudumlamak", "ex": "She sat by the window, slowly sipping her tea while watching the rain fall outside.", "exTr": "Pencerenin yanında oturarak dışarıda yağan yağmuru izlerken çayını yavaşça yudumluyordu."},
  {"tr": "i. yudum", "ex": "He took a careful sip of the hot soup before deciding whether it needed more salt.", "exTr": "Daha fazla tuz gerekip gerekmediğine karar vermeden önce sıcak çorbadan dikkatli bir yudum aldı."}
],
"snowmobile": [
  {"tr": "i. kar motosikleti", "ex": "During winter, residents of remote villages often use a snowmobile to reach the nearest town.", "exTr": "Kışın, uzak köylerde yaşayanlar en yakın kasabaya ulaşmak için genellikle bir kar motosikleti kullanır."},
  {"tr": "f. kar motosikletiyle gitmek", "ex": "The researchers snowmobiled across the frozen lake to reach the weather station on the northern shore.", "exTr": "Araştırmacılar, kuzey kıyısındaki hava istasyonuna ulaşmak için donmuş gölü kar motosikletiyle geçti."}
],
"solder": [
  {"tr": "i. lehim", "ex": "The technician used solder to join the two copper wires securely.", "exTr": "Teknisyen, iki bakır teli sağlam biçimde birleştirmek için lehim kullandı."},
  {"tr": "f. lehimlemek", "ex": "Factory workers must solder hundreds of tiny components onto each circuit board every single day.", "exTr": "Fabrika işçileri, her gün her devre kartına yüzlerce minik bileşen lehimlemek zorundadır."}
],
"sour": [
  {"tr": "s. ekşi", "ex": "The milk had gone sour after sitting outside the refrigerator during the hot summer afternoon.", "exTr": "Süt, sıcak yaz öğleden sonrasında buzdolabının dışında kaldıktan sonra ekşimişti."},
  {"tr": "f. ekşimek, bozulmak", "ex": "Relations between the two neighboring countries soured after the border dispute escalated last spring.", "exTr": "İki komşu ülke arasındaki ilişkiler, geçen ilkbaharda sınır anlaşmazlığı tırmandıktan sonra bozuldu."}
],
"sponge": [
  {"tr": "i. sünger", "ex": "The nurse gently used a sponge to clean the wound before applying a fresh bandage.", "exTr": "Hemşire, temiz bir bandaj uygulamadan önce yarayı temizlemek için nazikçe bir sünger kullandı."},
  {"tr": "f. süngerle silmek, emdirmek", "ex": "Conservators sponged the ancient fresco with distilled water to remove centuries of accumulated soot.", "exTr": "Restoratörler, yüzyıllar boyunca birikmiş kurumu gidermek için kadim freski damıtılmış suyla süngerle sildi."}
],
"sprint": [
  {"tr": "i. kısa mesafe koşusu", "ex": "The athlete's final sprint across the finish line broke the national record by two seconds.", "exTr": "Sporcunun bitiş çizgisine doğru yaptığı son sprint, ulusal rekoru iki saniye farkla kırdı."},
  {"tr": "f. hızla koşmak", "ex": "The commuter had to sprint through the crowded station to catch the last train of the evening.", "exTr": "Yolcu, akşamın son trenine yetişmek için kalabalık istasyonda hızla koşmak zorunda kaldı."}
],
"squeeze": [
  {"tr": "i. sıkma", "ex": "A gentle squeeze of the rubber bulb sends the liquid through the narrow glass tube into the dish.", "exTr": "Lastik pompaya yapılan hafif bir sıkma, sıvıyı dar cam tüpten kabın içine gönderir."},
  {"tr": "f. sıkmak", "ex": "She had to squeeze the fresh lemons by hand because the kitchen's juicer was broken.", "exTr": "Mutfaktaki meyve sıkacağı bozuk olduğu için taze limonları elle sıkmak zorunda kaldı."}
],
"squirt": [
  {"tr": "f. fışkırtmak, sıkarak püskürtmek", "ex": "The child began to squirt water from the hose at everyone walking past the garden gate.", "exTr": "Çocuk, bahçe kapısının önünden geçen herkese hortumdan su fışkırtmaya başladı."},
  {"tr": "i. fışkırma, ince su jeti", "ex": "The mechanic noticed a small squirt of oil escaping from a crack in the engine seal.", "exTr": "Tamirci, motor contasındaki bir çatlaktan kaçan küçük bir yağ fışkırması fark etti."}
],
"stay-at-home": [
  {"tr": "s. evde kalan, dışarı çıkmayan", "ex": "More fathers today choose to become stay-at-home parents while their partners pursue full-time careers.", "exTr": "Günümüzde daha fazla baba, eşleri tam zamanlı kariyer sürdürürken evde kalan ebeveyn olmayı tercih ediyor."},
  {"tr": "i. evde kalan ebeveyn", "ex": "Surveys suggest that many stay-at-homes find it difficult to re-enter the labor market after several years.", "exTr": "Anketler, evde kalan birçok ebeveynin birkaç yıl sonra iş piyasasına yeniden girmekte zorlandığını gösteriyor."}
],
"stray": [
  {"tr": "s. başıboş, sahipsiz", "ex": "Volunteers at the shelter spend most mornings feeding stray cats found around the neighborhood.", "exTr": "Barınaktaki gönüllüler, sabahlarının çoğunu mahallede bulunan sahipsiz kedileri besleyerek geçiriyor."},
  {"tr": "f. amaçsızca dolaşmak", "ex": "The hikers strayed far from the marked path and needed several hours to find their way back.", "exTr": "Yürüyüşçüler işaretli patikadan çok uzağa dolandı ve geri dönüş yolunu bulmak için birkaç saate ihtiyaç duydu."}
],
"supernatural": [
  {"tr": "s. doğaüstü", "ex": "Many ancient cultures attributed unexplained natural disasters to supernatural forces beyond human understanding or control.", "exTr": "Birçok eski kültür, açıklanamayan doğal afetleri insan anlayışının ve kontrolünün ötesindeki doğaüstü güçlere bağladı."},
  {"tr": "i. doğaüstü güçler/olaylar", "ex": "Nineteenth century novelists often turned to the supernatural to express anxieties about rapid social change.", "exTr": "On dokuzuncu yüzyıl romancıları, hızlı toplumsal değişime dair kaygıları dile getirmek için sıklıkla doğaüstüne başvurdu."}
],
"taboo": [
  {"tr": "i. tabu", "ex": "In many traditional societies, eating certain animals was a strict taboo enforced by religious leaders.", "exTr": "Birçok geleneksel toplumda, belirli hayvanları yemek din adamlarınca uygulanan katı bir tabuydu."},
  {"tr": "s. yasak sayılan", "ex": "Discussing mental health remains a taboo subject in many workplaces despite growing public awareness.", "exTr": "Artan kamuoyu farkındalığına rağmen, ruh sağlığını konuşmak birçok işyerinde hâlâ tabu bir konu olmaya devam ediyor."}
],
"tenth": [
  {"tr": "s. onuncu", "ex": "The company celebrated its tenth anniversary with a special ceremony for all employees.", "exTr": "Şirket, tüm çalışanlar için özel bir törenle onuncu yıl dönümünü kutladı."},
  {"tr": "i. onda bir", "ex": "Agriculture accounts for barely a tenth of the country's total economic output today.", "exTr": "Tarım, bugün ülkenin toplam ekonomik üretiminin ancak onda birini oluşturuyor."}
],
"terrace": [
  {"tr": "i. teras", "ex": "Guests enjoyed their morning coffee on the terrace overlooking the vineyard's rolling green hills.", "exTr": "Konuklar, bağın dalgalı yeşil tepelerine bakan terasta sabah kahvelerinin tadını çıkardı."},
  {"tr": "f. teraslandırmak", "ex": "Ancient farmers terraced the steep mountain slopes to grow rice where flat land was extremely scarce.", "exTr": "Kadim çiftçiler, düz arazinin son derece kıt olduğu yerlerde pirinç yetiştirmek için dik dağ yamaçlarını teraslandırdı."}
],
"textile": [
  {"tr": "i. tekstil, dokuma", "ex": "Archaeologists recovered a fragment of woven textile that had survived underground for nearly three thousand years.", "exTr": "Arkeologlar, neredeyse üç bin yıl boyunca yer altında sağlam kalmış dokuma bir kumaş parçası çıkardı."},
  {"tr": "s. tekstille ilgili", "ex": "The region's economy once depended heavily on the textile industry before factories began closing down.", "exTr": "Bölgenin ekonomisi, fabrikalar kapanmaya başlamadan önce büyük ölçüde tekstil sektörüne bağlıydı."}
],
"tile": [
  {"tr": "i. fayans, karo", "ex": "The plumber recommended replacing the cracked tile in the bathroom before it caused water damage.", "exTr": "Tesisatçı, su hasarına yol açmadan önce banyodaki çatlak fayansın değiştirilmesini önerdi."},
  {"tr": "f. fayans döşemek", "ex": "The workers tiled the entire kitchen floor in a single afternoon using cheap ceramic squares.", "exTr": "İşçiler, ucuz seramik kareler kullanarak tüm mutfak zeminine tek bir öğleden sonrada fayans döşedi."}
],
"tin": [
  {"tr": "i. teneke, konserve kutusu", "ex": "She stored homemade cookies in an old tin decorated with faded floral patterns from decades ago.", "exTr": "Ev yapımı kurabiyeleri, on yıllar öncesinden kalma solmuş çiçek desenleriyle süslenmiş eski bir tenekede sakladı."},
  {"tr": "f. konserve yapmak", "ex": "Coastal factories once tinned sardines by the thousand before refrigeration reached the region.", "exTr": "Kıyıdaki fabrikalar, soğutma teknolojisi bölgeye ulaşmadan önce binlerce sardalyayı konserve yapıyordu."}
],
"triumph": [
  {"tr": "i. zafer, büyük başarı", "ex": "The team's unexpected triumph in the final match delighted fans who had waited decades for a title.", "exTr": "Takımın final maçındaki beklenmedik zaferi, bir şampiyonluk için on yıllardır bekleyen taraftarları sevindirdi."},
  {"tr": "f. üstün gelmek", "ex": "Reason eventually triumphed over superstition as scientific methods spread across European universities.", "exTr": "Bilimsel yöntemler Avrupa üniversitelerine yayıldıkça akıl sonunda batıl inanca üstün geldi."}
],
"twitter": [
  {"tr": "i. cıvıltı", "ex": "The gentle twitter of birds outside the window woke her before the alarm even rang.", "exTr": "Pencerenin dışındaki kuşların hafif cıvıltısı, alarm çalmadan önce onu uyandırdı."},
  {"tr": "f. cıvıldamak", "ex": "Sparrows twittered noisily in the hedges while the gardener trimmed the overgrown branches.", "exTr": "Bahçıvan uzamış dalları budarken serçeler çitlerde gürültülü biçimde cıvıldadı."}
],
"two-step": [
  {"tr": "i. two-step (iki adımlı bir dans)", "ex": "Couples on the dance floor gracefully performed the two-step to the band's lively country music.", "exTr": "Dans pistindeki çiftler, grubun canlı country müziği eşliğinde zarifçe two-step dansı yaptı."},
  {"tr": "f. bu dansı yapmak", "ex": "The elderly couple two-stepped across the wooden floor while the fiddler played a familiar tune.", "exTr": "Kemancı tanıdık bir ezgi çalarken yaşlı çift ahşap zeminde bu dansı yaptı."}
],
"usher": [
  {"tr": "i. yer gösterici", "ex": "A polite usher guided the guests to their seats before the ceremony began.", "exTr": "Kibar bir yer gösterici, tören başlamadan önce konukları koltuklarına yönlendirdi."},
  {"tr": "f. içeri yöneltmek", "ex": "Security staff ushered the delegates into the main hall minutes before the opening speech began.", "exTr": "Güvenlik görevlileri, açılış konuşması başlamadan dakikalar önce delegeleri ana salona yöneltti."}
],
"veterinary": [
  {"tr": "s. veterinerlikle ilgili", "ex": "Farmers in remote areas often struggle to find affordable veterinary care for their livestock.", "exTr": "Uzak bölgelerdeki çiftçiler, hayvanları için uygun fiyatlı veterinerlik hizmeti bulmakta genellikle zorlanır."},
  {"tr": "i. veteriner", "ex": "The isolated village relied on a single veterinary who travelled between farms on horseback.", "exTr": "İzole köy, çiftlikler arasında at sırtında dolaşan tek bir veterinere bağımlıydı."}
],
"walk-on": [
  {"tr": "i. figüranlık, küçük rol", "ex": "The playwright offered his nephew a walk-on in the second act of the new production.", "exTr": "Oyun yazarı, yeni yapımın ikinci perdesinde yeğenine küçük bir rol önerdi."},
  {"tr": "s. figüran (rolüyle ilgili)", "ex": "The famous actress got her start with a small walk-on role in a local theater production.", "exTr": "Ünlü aktris, kariyerine yerel bir tiyatro yapımındaki küçük bir figüran rolüyle başladı."}
],
"westward": [
  {"tr": "z. batıya doğru", "ex": "The explorers pushed westward across the desert in search of a hidden water source.", "exTr": "Kaşifler, gizli bir su kaynağı arayışıyla çölü geçerek batıya doğru ilerledi."},
  {"tr": "s. batı yönündeki", "ex": "The westward expansion of the railway network turned dozens of small settlements into busy trading towns.", "exTr": "Demiryolu ağının batı yönündeki genişlemesi, onlarca küçük yerleşimi hareketli ticaret kasabalarına dönüştürdü."}
]
};
