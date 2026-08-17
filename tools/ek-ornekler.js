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
]

};
