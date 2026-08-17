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
  {"tr":"s. kolay; rahat","ex":"Thanks to online platforms, accessing academic journals has become remarkably easy for students worldwide.","exTr":"Çevrimiçi platformlar sayesinde akademik dergilere erişmek, dünya genelindeki öğrenciler için son derece kolay hâle geldi."},
  {"tr":"z. kolayca, ağırdan","ex":"The doctor told him to take it easy for a week until the swelling went down.","exTr":"Doktor ona, şişlik inene kadar bir hafta ağırdan almasını söyledi."}
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
  {"tr":"i. boyut, büyüklük, beden","ex":"Researchers found that the size of a galaxy's central black hole correlates with its total mass.","exTr":"Araştırmacılar, bir galaksinin merkezi kara deliğinin boyutunun galaksinin toplam kütlesiyle ilişkili olduğunu tespit etti."},
  {"tr":"f. boyutlandırmak, ölçüsünü belirlemek","ex":"Engineers must size the beams correctly to support the full weight of the roof.","exTr":"Mühendisler, çatının tüm ağırlığını taşıyabilmek için kirişleri doğru boyutlandırmalıdır."}
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

"real": [
  {"tr":"s. gerçek, hakiki","ex":"Virtual experiments can never fully replace real laboratory work in science education.","exTr":"Sanal deneyler, fen eğitiminde gerçek laboratuvar çalışmasının yerini asla tam anlamıyla tutamaz."},
  {"tr":"z. gerçekten (gayriresmî)","ex":"In casual American speech you often hear \"real good\", though \"really good\" is the standard form.","exTr":"Gündelik Amerikan konuşmasında sık sık \"real good\" duyulur; ancak standart biçim \"really good\"tur."}
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
  {"tr":"s. beyaz","ex":"Coral reefs often turn white when ocean temperatures rise above a critical threshold.","exTr":"Mercan resifleri, okyanus sıcaklıkları kritik bir eşiği aştığında genellikle beyaza döner."},
  {"tr":"i. beyaz renk","ex":"The artist used almost no white in the entire painting, relying instead on pale greys.","exTr":"Sanatçı, resmin tamamında neredeyse hiç beyaz kullanmadı; bunun yerine soluk grilere başvurdu."},
  {"tr":"f. beyazlatmak, örtmek","ex":"Heavy snow whited out the runway and all departures were suspended until morning.","exTr":"Yoğun kar pisti bembeyaz kaplayınca bütün kalkışlar sabaha kadar durduruldu."}
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
  {"tr":"s. bağışık, muaf","ex":"Vaccinated individuals are largely immune to the virus that caused last winter's outbreak.","exTr":"Aşılanmış bireyler, geçen kışki salgına yol açan virüse karşı büyük ölçüde bağışıktır."},
  {"tr":"i. bağışıklık kazanmış kimse","ex":"Statisticians count the immunes separately from those who have never been exposed.","exTr":"İstatistikçiler, bağışıklık kazanmış olanları hiç maruz kalmamış olanlardan ayrı sayar."}
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
  {"tr":"s. bağımlı, bağlı","ex":"Economic growth in the small nation remains heavily dependent on tourism and agricultural exports.","exTr":"Küçük ulustaki ekonomik büyüme, büyük ölçüde turizme ve tarımsal ihracata bağımlı olmaya devam ediyor."},
  {"tr":"i. bakmakla yükümlü olunan kişi","ex":"Employees may add a spouse and up to three dependents to the health plan.","exTr":"Çalışanlar sağlık planına bir eş ve en fazla üç bakmakla yükümlü kişi ekleyebilir."}
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

"mediate": [
  {"tr":"f. arabuluculuk yapmak, aracılık etmek","ex":"The United Nations agreed to mediate peace talks between the two warring nations.","exTr":"Birleşmiş Milletler, savaşan iki ulus arasındaki barış görüşmelerine arabuluculuk yapmayı kabul etti."},
  {"tr":"s. dolaylı","ex":"Philosophers distinguish immediate knowledge from mediate knowledge obtained through inference.","exTr":"Filozoflar, dolaysız bilgiyi çıkarım yoluyla elde edilen dolaylı bilgiden ayırır."}
],

"stream": [
  {"tr":"i. dere, akış","ex":"A small mountain stream supplies the entire village with drinking water.","exTr":"Küçük bir dağ deresi, tüm köyün içme suyunu sağlıyor."},
  {"tr":"f. akmak; (çevrimiçi) yayın yapmak","ex":"Melting glaciers now stream directly into the valley, raising water levels in the river below.","exTr":"Eriyen buzullar artık doğrudan vadiye akıyor ve aşağıdaki nehrin su seviyesini yükseltiyor."}
],

"thin": [
  {"tr":"s. ince, zayıf; seyrek","ex":"At high altitudes, the thin air makes it significantly harder for the body to absorb oxygen.","exTr":"Yüksek rakımlarda ince hava, vücudun oksijeni emmesini önemli ölçüde zorlaştırır."},
  {"tr":"f. inceltmek, seyreltmek","ex":"Gardeners thin the seedlings so the strongest plants have room to grow.","exTr":"Bahçıvanlar, en güçlü bitkilere yer kalsın diye fideleri seyreltir."}
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

"driving": [
  {"tr":"i. araç kullanma, sürüş","ex":"Driving while fatigued is nearly as dangerous as driving under the influence of alcohol.","exTr":"Yorgunken araç kullanmak, neredeyse alkollü araç kullanmak kadar tehlikelidir."},
  {"tr":"s. itici, sürükleyici","ex":"Rising fuel costs have become the driving force behind the shift toward electric vehicles.","exTr":"Artan yakıt maliyetleri, elektrikli araçlara geçişin ardındaki itici güç hâline geldi."}
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
  {"tr":"s. sarı","ex":"The warning signs are printed in black on a bright yellow background.","exTr":"Uyarı işaretleri, parlak sarı zemin üzerine siyahla basılmıştır."},
  {"tr":"f. sararmak","ex":"Old newspapers stored in the archive had turned yellow after decades of exposure to light.","exTr":"Arşivde saklanan eski gazeteler, onlarca yıl ışığa maruz kaldıktan sonra sararmıştı."}
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
]

};
