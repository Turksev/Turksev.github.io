/* Türkçe ekseni ek konu anlatımları — T07–T61. */
(function () {
  'use strict';

  function liste(maddeler, sirali) {
    var etiket = sirali ? 'ol' : 'ul';
    return '<' + etiket + '>' + maddeler.map(function (m) {
      return '<li>' + m + '</li>';
    }).join('') + '</' + etiket + '>';
  }

  function tablo(satirlar) {
    return '<div class="tablo-kutu"><table class="rule-table">' +
      '<tr><th>Yapı / ayrım</th><th>Ne anlatır?</th><th>Örnek</th></tr>' +
      satirlar.map(function (s) {
        return '<tr><td>' + s[0] + '</td><td>' + s[1] + '</td><td>' + s[2] + '</td></tr>';
      }).join('') + '</table></div>';
  }

  function kelimeSayisi(html) {
    var duz = html.replace(/<[^>]+>/g, ' ').replace(/&[a-zA-Z0-9#]+;/g, ' ')
      .replace(/\s+/g, ' ').trim();
    return duz ? duz.split(' ').length : 0;
  }

  function kayit(t) {
    var html = '<p>TÜRKÇE EKSENLİ YDS • ' + t.kod + '</p>' +
      '<div class="tip"><b>Ana fikir:</b> ' + t.ana + '</div>' +
      '<h2>Temel ayrım/kural</h2>' + tablo(t.kural) +
      '<h2>YDS\'de çözüm yolu</h2>' + liste(t.yol, true) +
      '<h2>Sık tuzaklar</h2>' + liste(t.tuzak, false) +
      '<h2>Mini tanı</h2><p>Önce kendiniz çözün; ardından gerekçeyi okuyun.</p>' + liste(t.tani, true) +
      '<h2>Cevap ve gerekçe</h2>' + liste(t.cevap, true) +
      '<h2>Son kontrol</h2>' + liste(t.kontrol, false);
    return { baslik: t.baslik, ozet: t.ozet, html: html, kelime: kelimeSayisi(html) };
  }

  window.KONU_METINLERI = Object.assign(window.KONU_METINLERI || {}, {
    "T07": kayit({
      kod: `T07`, baslik: `Niceleyici ve bütün–parça ayrımları`,
      ozet: `Miktar, yokluk, tek tek dağıtım ve iki öğeli seçimlerde doğru niceleyiciyi seçme`,
      ana: `Türkçedeki “az”, “biraz”, “her” veya “ikisi de” ifadeleri tek bir İngilizce kalıba karşılık gelmez. Sayılabilirlik, olumlu–olumsuz kutupluluk ve bütünün belirli olup olmadığı birlikte okunmalıdır.`,
      kural: [
        [`some / any / no`, `Some çoğunlukla olumlu beklenti veya belirsiz miktar; any soru, olumsuzluk ve “herhangi bir”; no ise fiili olumlu bırakıp yokluk bildirir.`, `<em>We have some evidence, but we do not have any proof.</em>`],
        [`few / a few`, `Çoğul sayılabilir adla few “yetersiz denecek kadar az”, a few “birkaç, en azından var” demektir.`, `<em>Few patients recovered; a few showed improvement.</em>`],
        [`little / a little`, `Sayılamayan adla aynı anlam karşıtlığını kurar.`, `<em>There is little hope, but a little time remains.</em>`],
        [`all / every / each`, `All topluluğu bütün olarak; every bütün üyeleri genelleyerek; each üyeleri tek tek görür. Every ve each tekil ad alır.`, `<em>Each sample was tested; all samples were labelled.</em>`],
        [`both / either / neither`, `İki öğede sırasıyla ikisi de, ikisinden biri ve ikisi de değil anlamlarını kurar.`, `<em>Neither method is entirely reliable.</em>`],
        [`niceleyici + of`, `Belirli zamir veya belirleyiciden önce of gerekir: some of them, each of the studies.`, `<em>Most studies / most of the studies</em>`]
      ],
      yol: [
        `Boşluktan sonraki adın çoğul sayılabilir mi, sayılamayan mı olduğunu belirleyin; few/little ayrımı burada çözülür.`,
        `Cümlenin genel yönünü bulun: yetersizlik mi, sınırlı fakat olumlu bir miktar mı? Few ile a few arasındaki a küçük görünür ama anlamı tersine çevirebilir.`,
        `Bütün belirliyse the/these/my/them gibi işaretleri arayın. Bunlar varsa niceleyiciden sonra çoğu kez <em>of</em> gerekir.`,
        `İki öğe açıkça verilmişse both/either/neither; ikiden çok üyede all/every/each seçeneklerine dönün.`
      ],
      tuzak: [
        `<em>Not all</em>, “hiçbiri değil” değil “hepsi değil” demektir; en az bir istisna bırakır.`,
        `<em>Every of the students</em> yanlıştır; <em>every student</em> veya <em>every one of the students</em> gerekir.`,
        `Neither geleneksel ölçünlü kullanımda tekil fiille güvenlidir; gerçek kullanımda çoğul görülebilse de YDS'de baş yapıyı izleyin.`,
        `Any yalnız soru ve olumsuzlukta değildir: <em>Any applicant may apply</em> “herhangi bir başvuran” anlamındadır.`
      ],
      tani: [
        `Boşluğu doldurun: There is ___ evidence to justify such a strong conclusion; further trials are essential. (little / a little)`,
        `Düzeltin: Every of the participants received a separate code.`,
        `Anlamı koruyun: Not all coastal towns were affected. Cümle “No coastal towns...” diye başlayabilir mi? Neden?`
      ],
      cevap: [
        `<b>little</b>. Devamındaki “further trials are essential” mevcut kanıtın yetersiz olduğunu gösterir. <em>A little</em> sınırlı da olsa olumlu varlık bildirirdi.`,
        `<em>Every participant received a separate code</em> veya <em>Every one of the participants...</em>. Doğrudan <em>every of</em> kurulmaz.`,
        `Hayır. <em>Not all</em> yalnız bütünlük iddiasını reddeder; bazı kasabalar etkilenmiş olabilir. <em>No coastal towns</em> hiçbirinin etkilenmediğini söyler.`
      ],
      kontrol: [`Adın sayılabilirliğini kontrol ettim.`, `Olumlu miktar ile yetersiz miktarı ayırdım.`, `Belirli bütünlerde of yapısını ve iki öğeli seçimlerde özel niceleyicileri kontrol ettim.`]
    }),

    "T08": kayit({
      kod: `T08`, baslik: `other ve gönderim ailesi`,
      ozet: `another, other, others, the other ve one/ones ile metin içi gönderimi çözme`,
      ana: `Other ailesinde biçim, adın yazılı mı düşürülmüş mü olduğuna ve kalan kümenin belirli olup olmadığına göre değişir. Bu ayrım cloze ve paragraf sorularında aynı zamanda gönderim zincirini gösterir.`,
      kural: [
        [`another + tekil ad`, `Belirsiz bir tane daha veya farklı bir tekil öğe.`, `<em>We need another explanation.</em>`],
        [`other + çoğul/sayılamayan ad`, `Belirsiz başka öğeler veya başka tür miktar.`, `<em>Other researchers reached different conclusions.</em>`],
        [`others`, `Ad düşmüştür; “başkaları” anlamında tek başına zamirdir.`, `<em>Some agreed; others objected.</em>`],
        [`the other / the others`, `Sınırları bilinen kümede kalan tek öğe / kalan öğelerin tümü.`, `<em>One sample was valid; the other was contaminated.</em>`],
        [`one / ones`, `Tekrarlanan sayılabilir adın yerini tutar; one tekil, ones çoğuldur.`, `<em>The newer devices are safer than the old ones.</em>`],
        [`such / former / latter`, `Such önceki niteliğe; former iki öğeden birincisine, latter ikincisine gönderir.`, `<em>Solar and wind power were compared; the latter was cheaper.</em>`]
      ],
      yol: [
        `Boşluktan sonra açık bir ad var mı bakın. Varsa <em>other/another</em>; ad yoksa <em>others/one/ones</em> adaylarını değerlendirin.`,
        `Küme daha önce sınırlandırılmış mı? “İki yöntemden kalan” gibi belirli bir artık varsa <em>the other</em> gerekir.`,
        `Paragrafta gönderimin sayısını ve anlamını geriye doğru izleyin; former/latter yalnız iki açık adayla güvenlidir.`,
        `Yerine geçen adın sayılabilirliğini kontrol edin: <em>ones</em> sayılamayan genel bir adın yerini tutmaz.`
      ],
      tuzak: [
        `<em>another researchers</em> yanlıştır; another tekil ad veya sayı + çoğul adla kullanılır: <em>another three researchers</em>.`,
        `<em>the others studies</em> kurulmaz; ad yazılıysa <em>the other studies</em>, ad düşmüşse <em>the others</em>.`,
        `Former/latter uzak ve çok üyeli listelerde belirsizleşir; sınavda iki açık öğeyi arayın.`,
        `<em>One</em> her tekrarı silemez: özel ad, sayılamayan ad veya anlamı değişen baş ad için çoğu kez yeniden ad gerekir.`
      ],
      tani: [
        `Doldurun: Some vaccines require one dose, whereas ___ require two.`,
        `Doldurun: Of the two proposals, one reduces costs and ___ improves safety.`,
        `Gönderimi bulun: The northern route is shorter than the southern one. “one” hangi adın yerini tutar?`
      ],
      cevap: [
        `<b>others</b>; çoğul “vaccines” adı düşürülmüş ve belirsiz başka aşılar anlatılmıştır.`,
        `<b>the other</b>; küme iki öneriyle sınırlıdır ve kalan tek öneri belirtilidir.`,
        `<b>route</b>. One tekil sayılabilir baş adı tekrar etmemek için kullanılmıştır; southern yalnız onu niteler.`
      ],
      kontrol: [`Adın yazılı mı düşmüş mü olduğunu gördüm.`, `Kalan kümenin belirli olup olmadığını kontrol ettim.`, `Gönderim öğesini sayı ve anlam bakımından gerçek öncülüyle eşleştirdim.`]
    }),

    "T09": kayit({
      kod: `T09`, baslik: `-e, -de, -den ve İngilizce ilgeç alanları`,
      ozet: `Türkçe durum eklerini yön, konum, kaynak, zaman ve soyut ilişkiye göre İngilizceye aktarma`,
      ana: `Türkçedeki tek bir durum eki İngilizcede birçok ilgece dağılır. Seçim ekin biçiminden değil, ilişkinin türünden ve İngilizce baş sözcüğün kalıbından yapılır.`,
      kural: [
        [`to / into / onto`, `To hedefe yönelir; into içeri giriş, onto yüzeye hareket bildirir.`, `<em>go to the lab; pour it into the tube</em>`],
        [`in / at / on`, `In çevre veya hacim; at nokta/etkinlik; on yüzey ve bazı gün/tarih ilişkileri.`, `<em>in Ankara; at the station; on the table</em>`],
        [`from / out of / off`, `From kaynak; out of içeriden dışarı; off yüzeyden ayrılma.`, `<em>return from work; take it out of the box</em>`],
        [`of`, `Kaynak anlamından çok aitlik, parça–bütün, içerik ve ad tamlayıcısı kurar.`, `<em>the cause of the decline</em>`],
        [`zaman alanı`, `At saat/nokta, on gün/tarih, in daha geniş dönem; ancak kalıplaşmış istisnalar vardır.`, `<em>at noon; on Monday; in 2025</em>`],
        [`soyut ilişki`, `İlgeç çoğu kez fiil, sıfat veya adın sözlüksel kalıbıdır.`, `<em>access to data; interested in policy</em>`]
      ],
      yol: [
        `Önce fiziksel mi soyut mu ilişki kurulduğunu sorun. Fiziksel ilişkide hareket ve durağan konumu ayırın.`,
        `Hedefin içine/yüzeyine geçiş açıkça kodlanıyorsa into/onto; yalnız hedef varsa to kullanın.`,
        `Soyut yapıda Türkçe eke güvenmeyin; İngilizce baş sözcüğün sözlük kalıbını bir bütün olarak okuyun.`,
        `Zaman ifadesini nokta, gün/tarih veya dönem olarak sınıflandırın; ardından yerleşik kullanım kontrolü yapın.`
      ],
      tuzak: [
        `Türkçe “okulda” her zaman <em>in school</em> değildir: <em>at school</em> kurum/etkinlik, <em>in the school</em> bina içi olabilir.`,
        `<em>arrive to</em> yerine çoğunlukla <em>arrive at/in</em>; ancak <em>get to</em> kullanılır.`,
        `İçeride bulunma <em>in</em>, içeri hareket <em>into</em> ayrımı bağlama göre yapılır; her hareket fiili otomatik into almaz.`,
        `Çeviride Türkçe “-den” görünce otomatik from seçmek <em>suffer from</em>, <em>consist of</em>, <em>prevent from</em> gibi ayrı kalıpları karıştırır.`
      ],
      tani: [
        `Doldurun: The researchers arrived ___ the field station before sunrise.`,
        `Doldurun: The solution was poured ___ a glass container.`,
        `Ayrımı açıklayın: She is at the university / She is in the university building.`
      ],
      cevap: [
        `<b>at</b>; field station nokta/hedef olarak görülür ve arrive at kalıbı kullanılır.`,
        `<b>into</b>; çözelti kabın dışından içine hareket etmektedir.`,
        `İlk cümle üniversitede bulunma/çalışma gibi kurumsal konumu; ikincisi özellikle binanın fiziksel içini belirtir.`
      ],
      kontrol: [`Hareket ile konumu ayırdım.`, `İlişkinin fiziksel mi sözlüksel mi olduğunu belirledim.`, `Türkçe durum ekini tek bir İngilizce ilgece mekanik olarak eşleştirmedim.`]
    }),

    "T10": kayit({
      kod: `T10`, baslik: `Fiil, sıfat ve adın yönettiği ilgeç`,
      ozet: `Dependent preposition kalıplarını baş sözcük ve anlamıyla birlikte tanıma`,
      ana: `Birçok ilgeç uzamsal anlamıyla değil, fiil, sıfat veya adın açtığı tamlayıcı yuvasıyla seçilir. Bu yüzden sözcüğü tek başına değil, kalıbıyla öğrenmek gerekir.`,
      kural: [
        [`fiil + ilgeç`, `Fiilin nesneyle kurduğu ilişki kalıplaşmıştır.`, `<em>depend on, contribute to, result in/from</em>`],
        [`sıfat + ilgeç`, `Sıfatın tamamlayıcısı belirli bir ilgeç ister.`, `<em>aware of, capable of, relevant to</em>`],
        [`ad + ilgeç`, `Adın nedenini, hedefini veya içeriğini kuran kalıp.`, `<em>a solution to, an increase in, demand for</em>`],
        [`aynı kök, farklı kalıp`, `Sözcük türü değişince ilgeç de değişebilir veya korunabilir.`, `<em>respond to / a response to; differ from / a difference between</em>`],
        [`anlama göre kalıp`, `Aynı baş sözcük farklı anlamda farklı ilgeç alabilir.`, `<em>agree with a person; agree on a plan</em>`]
      ],
      yol: [
        `Boşluğun solundaki baş sözcüğü ve türünü bulun; sağdaki adın Türkçe ekinden başlamayın.`,
        `Seçeneklerdeki her ilgeci baş sözcükle bir kalıp olarak seslendirin: contribute to, değil contribute for.`,
        `Sonraki tamlayıcının anlam rolünü kontrol edin: artışın alanı <em>increase in prices</em>, miktarı <em>increase of ten percent</em>.`,
        `Kalıp doğru görünse bile cümlenin anlamını sınayın; result from neden, result in sonuç yönündedir.`
      ],
      tuzak: [
        `Türkçe “-e çözüm” doğru biçimde <em>solution to</em> olur; *solution for her bağlamda güvenli değildir.`,
        `<em>Despite of</em> yoktur; <em>despite</em> doğrudan ad öbeği alır, <em>in spite of</em> ise of içerir.`,
        `İlgeçten sonra fiil gelirse genel olarak -ing biçimi gerekir: <em>capable of reducing</em>.`,
        `Yakın anlamlı sözcüklerin kalıbı aynı olmayabilir: <em>discuss the issue</em> fakat <em>talk about the issue</em>.`
      ],
      tani: [
        `Doldurun: The policy contributed ___ a measurable decline in emissions.`,
        `Doldurun: Scientists remain sceptical ___ claims that cannot be replicated.`,
        `Yönü seçin: Heavy rainfall resulted (from / in) widespread flooding.`
      ],
      cevap: [
        `<b>to</b>; contribute to “katkıda bulunmak” kalıbıdır.`,
        `<b>of/about</b> bağlama göre mümkündür; verilen anlamda <em>sceptical of claims</em> en doğrudan kalıptır. Tek bir Türkçe ekten sonuç çıkarılmaz.`,
        `<b>in</b>; yağış neden, sel sonuçtur. <em>Flooding resulted from heavy rainfall</em> denirse yön ters çevrilir.`
      ],
      kontrol: [`Baş sözcüğü ve sözcük türünü buldum.`, `Kalıbın anlam yönünü kontrol ettim.`, `İlgeç sonrası ad/gerund yapısını ve yakın anlamlı sözcüklerin farklı kalıplarını gözden geçirdim.`]
    }),

    "T11": kayit({
      kod: `T11`, baslik: `ile, için, göre, gibi ve olarak`,
      ozet: `Türkçe çok işlevli ilgeçleri araç, birliktelik, amaç, ölçüt, benzetme ve rol olarak ayırma`,
      ana: `Türkçedeki aynı sözcük farklı anlamsal roller üstlenebilir. İngilizce karşılık, biçime değil “araç mı, eşlik mi, amaç mı, rol mü?” sorusuna göre seçilir.`,
      kural: [
        [`with / by`, `With araç veya eşlik; by yapan, yöntem ya da ulaşım biçimi olabilir.`, `<em>cut with a knife; written by Orwell; travel by train</em>`],
        [`for`, `Yarar gören, hedef, süre veya amaçlanan kullanım.`, `<em>medicine for children; a tool for measuring pressure</em>`],
        [`to / in order to / so that`, `Fiille amaç: to + V1; farklı özne veya kip gerektiğinde so that + cümle.`, `<em>They left early to avoid traffic.</em>`],
        [`according to / by`, `Kaynak veya görüşe göre according to; ölçüte/standarda göre by.`, `<em>according to the report; judged by modern standards</em>`],
        [`like / as`, `Like benzerlik; as gerçek rol/işlev.`, `<em>He works like a machine; she works as an engineer.</em>`],
        [`as + sıfat/zarf + as`, `“kadar” karşılaştırmasını kurar.`, `<em>The second method is as accurate as the first.</em>`]
      ],
      yol: [
        `Türkçe ilgecin cümledeki rolünü etiketleyin: araç, yapan, yarar, amaç, kaynak, ölçüt, benzetme veya gerçek rol.`,
        `Amaçta sonraki yapıya bakın: yalın fiil varsa to; öznesi ve çekimli fiili olan bölümde so that düşünün.`,
        `Like/as sorusunda kişinin gerçekten o görevde bulunup bulunmadığını test edin.`,
        `“Göre” ifadesinde bilgi kaynağı mı yoksa değerlendirme ölçütü mü olduğunu ayırın.`
      ],
      tuzak: [
        `<em>According to me</em> dilbilgisel olsa da kişisel görüş için çoğu bağlamda <em>in my opinion</em> daha doğaldır.`,
        `<em>For to reduce</em> yanlıştır; amaç için <em>to reduce</em> veya <em>in order to reduce</em>.`,
        `As ve like yer değiştirince gerçek rol ile benzetme değişebilir.`,
        `With yapan kişiyi değil çoğunlukla araç/eşlik ilişkisini verir; edilgende yapan için by kullanılır.`
      ],
      tani: [
        `Doldurun: The substance was examined ___ an electron microscope.`,
        `Doldurun: ___ the latest survey, public support has declined.`,
        `Anlamı seçin: She was employed (like / as) a consultant during the project.`
      ],
      cevap: [
        `<b>with</b>; mikroskop incelemenin aracıdır. <em>By</em> yöntemi vurgulayan başka yapılarda mümkün olsa da burada fiziksel araç öne çıkar.`,
        `<b>According to</b>; survey bilgi kaynağıdır.`,
        `<b>as</b>; kişi danışman rolünde gerçekten istihdam edilmiştir. Like yalnız benzer biçimde çalıştığını söylerdi.`
      ],
      kontrol: [`İlgecin anlam rolünü adlandırdım.`, `Amaç yapısında özne ve fiil biçimini kontrol ettim.`, `Like/as ve with/by ayrımlarında gerçek ilişkiyi sınadım.`]
    }),

    "T12": kayit({
      kod: `T12`, baslik: `Süre, sınır ve başlangıç noktası`,
      ozet: `for, since, during, by, until ve within ifadelerini zaman–görünüşle birlikte çözme`,
      ana: `Zaman ilgeci yalnız takvim bilgisini değil, olayın başlangıcını, süresini, son sınırını veya başka bir dönemin içindeki yerini kodlar. Zaman seçimi ile fiil zamanı ayrı ama bağlantılı kanıtlardır.`,
      kural: [
        [`for + süre`, `Ne kadar sürdüğünü gösterir; farklı zamanlarla kullanılabilir.`, `<em>worked for two years; has worked for two years</em>`],
        [`since + başlangıç`, `Başlangıç noktası verir; ana cümlede çoğu kez perfect vardır ama bağlam başka zamanlara da izin verebilir.`, `<em>has lived here since 2020</em>`],
        [`during + ad öbeği`, `Bir dönem/olay içinde ne zaman olduğunu gösterir; doğrudan süre miktarı vermez.`, `<em>during the experiment</em>`],
        [`by / until`, `By en geç o noktaya kadar tamamlanma; until o noktaya dek süren durum/eylem.`, `<em>finish by Friday; remain open until Friday</em>`],
        [`within + süre`, `Belirtilen sürenin dolmasından önce, o aralık içinde.`, `<em>reply within ten days</em>`],
        [`from ... to/until`, `Başlangıç ve bitiş sınırlarını birlikte verir.`, `<em>from May to September</em>`]
      ],
      yol: [
        `Zaman ifadesini “süre”, “başlangıç”, “dönemin içi”, “son teslim sınırı” veya “süreklilik sınırı” diye sınıflandırın.`,
        `By/until ayrımında fiilin tamamlanan bir sonuç mu yoksa devam eden bir durum mu anlattığını bulun.`,
        `For/since gördüğünüzde otomatik present perfect seçmeyin; olay zamanı ve konuşma anıyla bağını okuyun.`,
        `During sonrasında ad öbeği, while sonrasında genellikle cümle geldiğini yapı kanıtı olarak kullanın.`
      ],
      tuzak: [
        `<em>Since three years</em> yanlıştır; süre için <em>for three years</em>, başlangıç için <em>since 2023</em>.`,
        `<em>During I was studying</em> yerine <em>while I was studying</em> veya <em>during my studies</em>.`,
        `By Friday “cuma boyunca” değil, en geç cuma günü/öncesinde demektir.`,
        `Until tamamlanma fiilleriyle anlamı bozabilir: *finish until Friday yerine <em>finish by Friday</em>.`
      ],
      tani: [
        `Doldurun: The archive will remain closed ___ the renovation is completed.`,
        `Doldurun: All applications must be submitted ___ 5 p.m. on Friday.`,
        `Açıklayın: She lived in Rome for five years / She has lived in Rome for five years.`
      ],
      cevap: [
        `<b>until</b>; kapalı olma durumu belirtilen olaya dek sürer.`,
        `<b>by</b>; bu bir son teslim sınırıdır ve gönderim o noktadan önce tamamlanmalıdır.`,
        `Simple past, Roma'daki beş yıllık dönemi bitmiş geçmiş olarak sunar. Present perfect, bu yaşam durumunu konuşma anına bağlar ve çoğu bağlamda hâlâ sürdüğünü gösterir.`
      ],
      kontrol: [`Süre ile başlangıç noktasını ayırdım.`, `By ile tamamlanma, until ile sürme ilişkisini kontrol ettim.`, `İlgeçten bağımsız olarak bağlamın gerektirdiği zamanı doğruladım.`]
    }),

    "T13": kayit({
      kod: `T13`, baslik: `Yer–yön ve parçacık mantığı`,
      ozet: `Durağan konum, sınıra geçiş ve fiil parçacıklarının oluşturduğu yeni anlamları ayırma`,
      ana: `İngilizce, Türkçenin “içeride/içeri” ayrımını ilgeç ve parçacıklarla daha ayrıntılı kodlayabilir. Ancak up, out, off gibi öğeler her zaman fiziksel yön değildir; fiille birlikte yeni bir sözlüksel anlam kurabilir.`,
      kural: [
        [`in / into`, `In durağan iç konum; into dışarıdan içeri geçiş.`, `<em>The samples are in the box / Put them into the box.</em>`],
        [`on / onto`, `On yüzeyde bulunma; onto yüzeye doğru hareket.`, `<em>The label is on the jar / Stick it onto the jar.</em>`],
        [`out of / off`, `Kapalı alandan dışarı / yüzeyden ayrılma.`, `<em>walk out of the room; fall off the shelf</em>`],
        [`through / across`, `Bir hacim/kanalın içinden / bir yüzey ya da alanın bir yanından öbürüne.`, `<em>through the tunnel; across the field</em>`],
        [`phrasal particle`, `Parçacık fiilin yönünü, tamamlanmasını veya mecaz anlamını değiştirir.`, `<em>use up, find out, put off</em>`],
        [`ayrılabilirlik`, `Bazı phrasal verb'lerde nesne araya girebilir; zamir çoğunlukla araya girmek zorundadır.`, `<em>turn the light off / turn it off</em>`]
      ],
      yol: [
        `Önce gerçek bir yer değişimi var mı belirleyin. Yoksa parçacığın sözlüksel/mecaz anlamını araştırın.`,
        `Başlangıç ve bitiş sınırını zihinde canlandırın: alanın içine mi, yüzeye mi, içinden mi, karşısına mı?`,
        `Fiil + parçacığı tek bir sözlük birimi gibi okuyun; yalnız parçacığın temel yön anlamına dayanmayın.`,
        `Nesne zamirse ayrılabilir phrasal verb'de konumunu kontrol edin: pick it up, *pick up it değil.`
      ],
      tuzak: [
        `Her hareket fiili into/onto istemez: <em>enter the room</em> doğrudan nesne alır; *enter into the room normal fiziksel anlamda gereksizdir.`,
        `<em>Look up</em> “yukarı bakmak” veya “bilgiyi aramak” olabilir; nesne ve bağlam anlamı seçtirir.`,
        `Prepositional verb'ler genellikle ayrılamaz: <em>look after the child</em>, *look the child after değil.`,
        `Through ile throughout aynı değildir: through yol/işleyiş, throughout bir alanın veya dönemin tamamına yayılma bildirir.`
      ],
      tani: [
        `Doldurun: The river flows ___ a narrow valley before reaching the sea. (through / across)`,
        `Düzeltin: The technician turned off it immediately.`,
        `Anlamı açıklayın: The meeting was put off because two experts were unavailable.`
      ],
      cevap: [
        `<b>through</b>; nehir vadinin oluşturduğu kanal/hacim içinden geçer.`,
        `<em>The technician turned it off immediately.</em> Zamir ayrılabilir parçacıklı fiilin arasına gelir.`,
        `<em>Put off</em> burada fiziksel uzaklaştırma değil “ertelemek” demektir; toplantı ileri bir tarihe alınmıştır.`
      ],
      kontrol: [`Konum ile sınır geçişini ayırdım.`, `Parçacığı fiille birlikte anlamlandırdım.`, `Nesne konumunu fiilin ayrılabilirlik özelliğine göre kontrol ettim.`]
    }),

    "T14": kayit({
      kod: `T14`, baslik: `Özne adılının düşmesi ve zorunlu İngilizce özne`,
      ozet: `Türkçede yüklemden anlaşılan özneyi İngilizcede açık ve doğru gönderimle kurma`,
      ana: `Türkçe kişi bilgisini yüklemde taşıdığı için özneyi sıkça düşürür; standart İngilizce finite cümle ise çoğunlukla açık bir özne ister. Çeviride eksik özne eklemek kadar yanlış öncülü seçmemek de önemlidir.`,
      kural: [
        [`açık kişi öznesi`, `Türkçede gizli olan kişi İngilizcede I/you/he/she/it/we/they ile yazılır.`, `<em>Geç kaldık. → We are late.</em>`],
        [`adıl gönderimi`, `Adıl sayı, kişi ve bağlam bakımından açık bir öncüle bağlanmalıdır.`, `<em>The committee revised its decision.</em>`],
        [`cinsiyet bilinmiyorsa`, `Tekil they doğal ve kapsayıcı bir seçenektir.`, `<em>If a student needs help, they should ask.</em>`],
        [`emir`, `Emirde yüzeyde özne bulunmayabilir; anlaşılmış özne you'dur.`, `<em>Read the passage carefully.</em>`],
        [`non-finite yapı`, `Infinitive/participle öznesi ana cümleden denetlenebilir; bu, finite cümlede özne düşürme değildir.`, `<em>To reduce costs, the firm closed two offices.</em>`],
        [`dummy özne`, `Hava, zaman ve uzaklık ifadelerinde anlamsal göndergesi olmayan it gerekir.`, `<em>It is getting dark.</em>`]
      ],
      yol: [
        `Her çekimli fiilin öznesini işaretleyin. Türkçede yazılmamışsa kişi ekinden ve bağlamdan çıkarın.`,
        `İngilizce adılın öncülünü bulun; tekil/çoğul ve insan/nesne uyumunu kontrol edin.`,
        `Özne yok gibi görünen İngilizce yapının emir, non-finite kısaltma veya dummy özne yapısı olup olmadığını ayırın.`,
        `Uzun cümlede adılın en yakın ada değil, anlamca uygun açık öncüle bağlandığını doğrulayın.`
      ],
      tuzak: [
        `Türkçe “söylendi” kişisiz edilgen olabilir; İngilizcede çoğu kez <em>it was said</em> veya başka bir edilgen özne gerekir.`,
        `Cansız adlar da etkin özne olabilir: <em>The report explains the discrepancy.</em> Cansızlık edilgenlik gerekçesi değildir.`,
        `Kurum adılı İngiliz İngilizcesinde bağlama göre it/they alabilir; metin boyunca tutarlılık önemlidir.`,
        `Belirsiz tekil kişi için otomatik he kullanmak yerine bağlama uygun he or she ya da tekil they seçin.`
      ],
      tani: [
        `Çevirin: Sonuçları yarın açıklayacağız.`,
        `Düzeltin: Is widely believed that the treatment is safe.`,
        `Gönderimi düzeltin: When the device was connected to the batteries, they stopped working. (Durumda duran şey cihazdır.)`
      ],
      cevap: [
        `<em>We will announce the results tomorrow.</em> Türkçedeki -iz eki özneyi verir; İngilizcede <em>we</em> açıkça yazılır.`,
        `<em>It is widely believed that the treatment is safe.</em> Anticipatory/dummy it özne yerini doldurur.`,
        `<em>When the device was connected to the batteries, it stopped working.</em> Arızalanan device olduğundan adıl tekil it olmalıdır.`
      ],
      kontrol: [`Her finite fiile bir özne bağladım.`, `Adılın açık ve anlamca doğru öncülünü buldum.`, `Emir, non-finite ve dummy özne istisnalarını doğru sınıflandırdım.`]
    }),

    "T15": kayit({
      kod: `T15`, baslik: `Koşaç, yardımcı fiil ve varlık`,
      ozet: `be, do, there ve have yapılarını koşaç, destek, varlık, sahiplik ve yardımcı işlevlerine göre ayırma`,
      ana: `Türkçede ek veya sıfır biçimle kurulan yüklem, İngilizcede çoğu kez be ister. Buna karşılık do, have ve there aynı yüzeyde farklı dilbilgisel görevler üstlenebilir; anlam değil işlev haritası çözümü hızlandırır.`,
      kural: [
        [`be koşaç`, `Özneyi ad, sıfat veya yer tümleciyle bağlar.`, `<em>The results are significant.</em>`],
        [`be yardımcı`, `Continuous ve passive yapının parçasıdır.`, `<em>is changing; was published</em>`],
        [`do-support`, `Be/modal yoksa simple zamanlarda soru, olumsuzluk ve vurgu kurar.`, `<em>Does it matter? It does not matter.</em>`],
        [`existential there`, `Yeni bir varlığı söyleme alanına sokar; fiil sonraki adla ilişkilidir.`, `<em>There are two alternatives.</em>`],
        [`have sahiplik`, `Bir şeye sahip olma/ilişki kurma anlamında ana fiildir.`, `<em>The device has two sensors.</em>`],
        [`have yardımcı/causative`, `Perfect'te have + V3; ettirgende have + nesne + V3/V1.`, `<em>has changed; had the device repaired</em>`]
      ],
      yol: [
        `Yüklemin ad/sıfat/yer mi yoksa eylem mi olduğunu belirleyin; ad ve sıfat yükleminde gerekli be biçimini kurun.`,
        `Soru/olumsuzlukta cümlede zaten be veya modal var mı bakın; varsa ayrıca do eklemeyin.`,
        `There yapısında gerçek bilgi odağını sonraki ad öbeğinde bulun ve tekil/çoğul uyumunu kontrol edin.`,
        `Have'in ardından V3 geliyorsa perfect olasılığını; nesne + V3 geliyorsa ettirgen/başkasına yaptırma olasılığını değerlendirin.`
      ],
      tuzak: [
        `<em>She does not be ready</em> değil <em>She is not ready</em>; be kendi soru ve olumsuzluğunu kurar.`,
        `Türkçe “var” her zaman have değildir: <em>Masada bir kitap var → There is a book on the table.</em>`,
        `<em>There have</em> sahiplik kurmaz; existential yapıda çekimli fiil <em>there is/are/has been</em> biçimindedir.`,
        `Do vurgu için olumlu cümlede kullanılabilir: <em>The results do support the claim</em>; bu kullanım sıradan yardımcı ekleme değildir.`
      ],
      tani: [
        `Doldurun: There ___ several reasons for the discrepancy.`,
        `Soru yapın: The method appears reliable.`,
        `İşlevi belirleyin: The laboratory has had its ventilation system replaced.`
      ],
      cevap: [
        `<b>are</b>; ertelenmiş ad öbeği several reasons çoğuldur.`,
        `<em>Does the method appear reliable?</em> Ana fiil appears olduğundan simple present soru için do-support gerekir.`,
        `İlk <em>has</em> present perfect yardımcısı, <em>had ... replaced</em> ise başkasına yaptırılan işi anlatan causative yapıdır.`
      ],
      kontrol: [`Be'nin koşaç mı yardımcı mı olduğunu ayırdım.`, `Do-support'u yalnız gerektiğinde kullandım.`, `There ve have yapılarını varlık, sahiplik, perfect ve ettirgen işlevlerine göre çözdüm.`]
    }),

    "T16": kayit({
      kod: `T16`, baslik: `Dummy it, anticipatory it ve existential there`,
      ozet: `Göndergesiz it, ertelenmiş cümlecik ve yeni varlık sunan there yapılarını ayırma`,
      ana: `It ve there her zaman önceki bir ada göndermez. İngilizce özne konumunu doldurmak, ağır cümleciği sona ertelemek veya yeni bir varlığı tanıtmak için bu biçimleri yapısal araç olarak kullanır.`,
      kural: [
        [`dummy it`, `Hava, saat, mesafe ve çevresel durumlarda göndergesiz özne.`, `<em>It is raining. It is five kilometres to the coast.</em>`],
        [`anticipatory it`, `Gerçek içerik olan that-clause veya infinitive sona ertelenir.`, `<em>It is clear that demand is falling.</em>`],
        [`referential it`, `Önceden bilinen tekil cansız ada/olaya gönderir.`, `<em>The report arrived; it was incomplete.</em>`],
        [`existential there`, `Yeni veya belirsiz varlığı tanıtır.`, `<em>There is evidence of bias.</em>`],
        [`there + görünüş fiili`, `Seem/appear/happen/remain ile varlık iddiasının kesinlik veya sürekliliğini ayarlar.`, `<em>There appears to be no alternative.</em>`],
        [`extraposition seçeneği`, `Ağır özne başta da olabilir ama it yapısı çoğu kez daha doğal end-weight sağlar.`, `<em>That the data were altered is obvious / It is obvious that...</em>`]
      ],
      yol: [
        `It için olası bir öncül arayın. Yoksa hava/zaman/mesafe ya da ertelenmiş cümlecik olup olmadığını kontrol edin.`,
        `Cümlenin sonunda that-clause veya to-infinitive varsa it'in anticipatory işlevini sınayın.`,
        `There sonrasında yeni, çoğu kez belirsiz bir ad öbeği arayın; yapı yer bildiren there ile karıştırılmamalıdır.`,
        `Restatement sorusunda ağır özne ile anticipatory it biçimlerinin aynı önerme içeriğini koruyup korumadığına bakın.`
      ],
      tuzak: [
        `<em>It exists a problem</em> yanlıştır; <em>There is a problem</em> veya <em>A problem exists</em>.`,
        `Existential there içindeki there vurgu almaz; <em>There is the library</em> yer gösteren there olabilir ve farklı yapıdır.`,
        `<em>It is likely to...</em> yapısında it bazen belirli bir öncüle gönderir, bazen anticipatory olur; devamındaki yapı karar verir.`,
        `There is/are uyumu resmî sınav kullanımında sonraki baş adla kurulmalıdır.`
      ],
      tani: [
        `Türü belirleyin: It took the team three months to verify the results.`,
        `Doldurun: There ___ to be several gaps in the available evidence.`,
        `Yeniden yazın: That the two samples produced identical results is surprising. (anticipatory it kullanın)`
      ],
      cevap: [
        `Bu <b>anticipatory/dummy it</b> yapısıdır; gerçek içerik <em>to verify the results</em> infinitive bölümündedir.`,
        `<b>appear/seem</b>; çoğul ad bulunmasına rağmen çekim öndeki görünüş fiilindedir: <em>There appear to be several gaps.</em>`,
        `<em>It is surprising that the two samples produced identical results.</em> Önerme sona ertelenmiş, anlam korunmuştur.`
      ],
      kontrol: [`It için gerçek bir öncül olup olmadığını araştırdım.`, `Ertelenmiş cümleciği ve yeni varlık ad öbeğini buldum.`, `There yapısında sayı uyumunu ve kesinlik bildiren fiili kontrol ettim.`]
    }),

    "T17": kayit({
      kod: `T17`, baslik: `Özne–yüklem uyumu`,
      ozet: `Uzun ad öbeklerinde baş özneyi, topluluk ve niceleyici yapıların sayı değerini bulma`,
      ana: `Fiile en yakın ad her zaman özne değildir. YDS'de uyum sorusu, ad öbeğinin başını ve either/neither, number, percentage, collective noun gibi yapıların bağlamsal sayı değerini bulmayı gerektirir.`,
      kural: [
        [`baş ad`, `Of/with/together with gibi öbekler baş öznenin sayısını değiştirmez.`, `<em>The quality of the samples is improving.</em>`],
        [`a number / the number`, `A number of + çoğul fiil; the number of + tekil fiil.`, `<em>A number of studies show... / The number ... is rising.</em>`],
        [`either/neither of`, `Ölçünlü sınav dilinde çoğunlukla tekil fiil; anlamca iki üye söz konusudur.`, `<em>Neither of the options is ideal.</em>`],
        [`yüzde/kesir`, `Fiil, of sonrasındaki adın sayılamasına göre seçilir.`, `<em>Sixty percent of the water is... / of the students are...</em>`],
        [`collective noun`, `Topluluk tek birim veya üyeler olarak görülebilir; lehçe ve bağlam etkiler.`, `<em>The committee has reached its decision.</em>`],
        [`there yapısı`, `Uygunluk sonraki baş adla kurulur.`, `<em>There are two possible causes.</em>`]
      ],
      yol: [
        `Çekimli fiili bulun ve “kim/ne?” diye sorarak bütün özne öbeğini işaretleyin.`,
        `Özne öbeğinde of, along with, as well as gibi ekleri paranteze alın; geriye kalan baş adı bulun.`,
        `Niceleyici yapı varsa sayı değerini kalıp ve of sonrasındaki adla birlikte belirleyin.`,
        `Topluluk adında metnin lehçe tutarlılığına ve birim/üyeler anlamına bakın; tek mutlak biçim varsaymayın.`
      ],
      tuzak: [
        `Yakındaki çoğul ad “çekim tuzağı” olabilir: <em>The impact of new regulations is...</em>`,
        `<em>As well as</em>, and gibi iki eş özneyi zorunlu olarak birleştirmez.`,
        `News tekil, police çoğul; görünüşe dayanmak yerine sözlüksel sayı özelliğini bilmek gerekir.`,
        `Data akademik bağlama göre çoğul veya kütle adı gibi tekil kullanılabilir; metin içi tutarlılığı izleyin.`
      ],
      tani: [
        `Seçin: The effects of prolonged exposure (remains / remain) unclear.`,
        `Seçin: The number of reported cases (has / have) fallen.`,
        `Seçin ve açıklayın: Forty percent of the equipment (was / were) replaced.`
      ],
      cevap: [
        `<b>remain</b>; baş özne effects çoğuldur, of öbeği bunu değiştirmez.`,
        `<b>has</b>; baş yapı the number tekildir. <em>A number of cases have...</em> olsaydı çoğul olurdu.`,
        `<b>was</b>; equipment sayılamayan tekil/kütle addır ve yüzde onunla uyum gösterir.`
      ],
      kontrol: [`Fiile en yakın adı değil gerçek baş özneyi buldum.`, `Niceleyici kalıbın özel uyumunu kontrol ettim.`, `Topluluk ve değişken sayı adlarında bağlam ile lehçe tutarlılığını korudum.`]
    }),

    "T18": kayit({
      kod: `T18`, baslik: `Olumsuzluk ve kapsam`,
      ozet: `not, no, never ve sınırlayıcı zarfların hangi öğeyi olumsuzladığını doğru okuma`,
      ana: `Olumsuzluğun varlığı kadar kapsamı önemlidir. “Hepsi değil”, “hiçbiri”, “yalnızca” ve “neredeyse hiç” aynı doğruluk koşullarını taşımaz; restatement soruları bu küçük farkları ölçer.`,
      kural: [
        [`not + yüklem/öğe`, `Not bulunduğu yapının kapsamını reddeder.`, `<em>The change did not affect prices.</em>`],
        [`no + ad`, `Olumlu biçimli fiille yokluk kurar.`, `<em>No participant withdrew.</em>`],
        [`never`, `Zaman alanı boyunca hiçbir kez anlamı verir.`, `<em>The drug has never been approved.</em>`],
        [`not all / none`, `Not all kısmi olumsuzluk; none bütün üyeleri dışlar.`, `<em>Not all findings were replicated.</em>`],
        [`hardly/scarcely/rarely`, `Biçimce olumlu görünse de olumsuza yakın anlam taşır ve ayrıca not almaz.`, `<em>The pattern is hardly visible.</em>`],
        [`only / even`, `Only dışlayıcı sınır koyar; even beklenmedik uç öğeyi vurgular.`, `<em>Only two samples survived.</em>`]
      ],
      yol: [
        `Olumsuzluk taşıyan sözcüğü bulun ve hangi söz öbeğini kapsadığını parantezleyin.`,
        `Niceleyiciyi mantıksal olarak yeniden söyleyin: not all = en az bir istisna; none = sıfır üye.`,
        `Hardly, seldom, little gibi örtük olumsuzları belirleyin; şıklardaki çift olumsuzluğu eleyin.`,
        `Only/even yer değiştirince vurgulanan öğenin değişip değişmediğini kontrol edin.`
      ],
      tuzak: [
        `İngilizce standart cümlede *Nobody didn't come gibi çift olumsuzluk genellikle hedeflenen “kimse gelmedi” anlamını vermez; <em>Nobody came</em> denir.`,
        `<em>Not necessarily</em> “kesinlikle değil” değil, “zorunlu olarak değil” demektir.`,
        `<em>Hardly not</em> çoğu bağlamda yanlış/ters anlamlıdır; hardly zaten olumsuza yakındır.`,
        `Only'nin konumu anlamı değiştirir: <em>Only Ali reviewed the paper</em> ile <em>Ali only reviewed the paper</em> aynı değildir.`
      ],
      tani: [
        `Anlamı seçin: Not every intervention produced a lasting benefit.`,
        `Düzeltin: None of the evidence did not support the claim.`,
        `Farkı açıklayın: The treatment is not necessarily harmful / The treatment is necessarily not harmful.`
      ],
      cevap: [
        `Bazı müdahaleler kalıcı yarar üretmemiştir; cümle hiçbirinin üretmediğini söylemez.`,
        `<em>None of the evidence supported the claim</em> veya anlam amaçlanıyorsa <em>The evidence did not support...</em>. None ile ikinci not gereksiz çift olumsuzluk yaratır.`,
        `İlki zararlı olmasının zorunlu olmadığını, yani zararsız olabileceğini söyler. İkincisi zorunlu biçimde zararsız olduğunu ileri sürer; çok daha güçlüdür.`
      ],
      kontrol: [`Olumsuzluğun kapsamını açıkça belirledim.`, `Kısmi ve tam olumsuzluğu ayırdım.`, `Örtük olumsuz ve vurgu zarflarının konumunu kontrol ettim.`]
    }),

    "T19": kayit({
      kod: `T19`, baslik: `Soru ve olumsuz soruya yanıt`,
      ozet: `Do-support, inversion, özne sorusu ve İngilizce yes/no kutupluluğunu doğru kurma`,
      ana: `İngilizce soru yapısı yardımcı fiile dayanır; ancak özneyi soran who/what doğrudan özne yerini tutabilir. Olumsuz soruya yes/no yanıtı ise sorunun biçimine değil, yanıt cümlesinin olumlu veya olumsuz oluşuna bağlanır.`,
      kural: [
        [`be/modal inversion`, `Be veya modal öznenin önüne geçer.`, `<em>Is the sample stable? Can it be reused?</em>`],
        [`do-support`, `Simple present/past ana fiilinde do/does/did öne alınır, ana fiil V1 olur.`, `<em>Why did the rate fall?</em>`],
        [`subject question`, `Who/what özneyse do-support ve devriklik kullanılmaz.`, `<em>What caused the decline?</em>`],
        [`object question`, `Soru sözcüğü nesneyse normal soru dizilişi gerekir.`, `<em>What did the decline cause?</em>`],
        [`negative question`, `Beklenti, şaşkınlık veya doğrulama arayabilir.`, `<em>Didn't they receive the warning?</em>`],
        [`yes/no yanıtı`, `Yes + olumlu önerme, no + olumsuz önerme.`, `<em>Didn't she come? — Yes, she did. / No, she didn't.</em>`]
      ],
      yol: [
        `Önce cümlede be/modal olup olmadığını belirleyin; yoksa zaman ve özneye uygun do biçimini kurun.`,
        `Who/what'ın cümlede özne mi nesne mi olduğunu boşluk testiyle bulun. Özne eksikse devriklik yapmayın.`,
        `Olumsuz sorunun ima ettiği beklentiyi diyalog bağlamından çıkarın.`,
        `Yanıtta yes/no sözcüğünden sonra gelen küçük cümleyi kontrol edin; İngilizcede ikisi aynı kutupta olmalıdır.`
      ],
      tuzak: [
        `<em>Why did the rate fell?</em> yanlıştır; geçmişlik did üzerindedir, ana fiil fall olur.`,
        `<em>Who did cause the error?</em> nötr özne sorusunda gereksizdir; do yalnız özel vurgu için gelebilir.`,
        `Türkçedeki “Evet, gelmedi” cevabı İngilizceye *Yes, she didn't diye aktarılmaz; <em>No, she didn't</em>.`,
        `Dolaylı/gömülü soruda devriklik kalkar: <em>Do you know why the rate fell?</em>`
      ],
      tani: [
        `Soru yapın; özneyi sorun: A software error caused the failure.`,
        `Soru yapın; nesneyi sorun: The failure damaged two sensors.`,
        `Yanıtlayın: Didn't the committee approve the proposal? (Komite onayladı.)`
      ],
      cevap: [
        `<em>What caused the failure?</em> What özne olduğu için did kullanılmaz.`,
        `<em>What did the failure damage?</em> What nesnedir; did + özne + V1 gerekir.`,
        `<em>Yes, it did.</em> Gerçek önerme “committee approved” olumlu olduğu için yes seçilir.`
      ],
      kontrol: [`Yardımcı fiili doğru zamanda kurdum.`, `Soru sözcüğünün özne mi nesne mi olduğunu belirledim.`, `Olumsuz soruya yanıtı önerme kutbuna göre verdim.`]
    }),

    "T20": kayit({
      kod: `T20`, baslik: `Geniş ve şimdiki zamanın İngilizcede dağılması`,
      ozet: `Türkçe -r ve -iyor biçimlerini alışkanlık, geçici süreç, program, anlatı ve gelecek işlevlerine göre seçme`,
      ana: `Türkçe geniş ve şimdiki zaman biçimleri İngilizce present simple/continuous ile bire bir örtüşmez. Seçim, eylemin alışkanlık mı, geçici süreç mi, düzenlenmiş gelecek mi veya anlatı tekniği mi olduğuna bağlıdır.`,
      kural: [
        [`present simple`, `Alışkanlık, genel gerçek, kalıcı durum ve program/takvim.`, `<em>Water boils at 100°C. The train leaves at six.</em>`],
        [`present continuous`, `Konuşma çevresinde süren/geçici olay, değişim ve düzenlenmiş kişisel gelecek.`, `<em>Prices are rising. We are meeting on Friday.</em>`],
        [`-iyor → simple`, `Türkçede -iyor olsa da stative veya kalıcı anlam simple gerektirebilir.`, `<em>Seni anlıyorum. → I understand you.</em>`],
        [`-r → continuous`, `Türkçe geniş biçim geçici ve eleştirel tekrar anlamında continuous olabilir.`, `<em>Bu ara geç saatlere kadar çalışır. → She is working late these days.</em>`],
        [`narrative present`, `Özet, yorum veya canlı anlatıda simple present geçmiş olayı sunabilir.`, `<em>The article then argues that...</em>`],
        [`always + continuous`, `Sık tekrarı konuşmacı tutumuyla vurgular.`, `<em>He is always interrupting people.</em>`]
      ],
      yol: [
        `Zaman belirtecini bulun ama tek başına karar vermeyin: usually alışkanlık, at the moment süreç için güçlü kanıttır.`,
        `Eylemi durum, alışkanlık, geçici süreç, değişim, takvim veya kişisel düzenleme olarak etiketleyin.`,
        `Gelecek anlamında resmî takvim için simple; ayarlanmış kişisel plan için continuous olasılığını karşılaştırın.`,
        `Fiilin stative/dynamic anlam değiştirip değiştirmediğini kontrol edin; bu ayrım T21 ile birlikte okunmalıdır.`
      ],
      tuzak: [
        `Türkçe -iyor gördüğünüz her yerde be + V-ing seçmeyin: <em>I know, I believe, I need</em> çoğu temel anlamda simple'dır.`,
        `Present continuous yalnız tam konuşma anını değil, geçici geniş bir dönemi de kapsayabilir.`,
        `Present simple gelecek anlatamaz diye düşünmek yanlıştır; tarifeler ve programlar bunu düzenli yapar.`,
        `Always hem simple hem continuous ile gelir; continuous çoğu kez rahatsızlık/şaşkınlık gibi tutum ekler.`
      ],
      tani: [
        `Seçin: The Earth (moves / is moving) around the Sun.`,
        `Seçin: More households (install / are installing) solar panels this year.`,
        `Seçin ve açıklayın: Our flight (departs / is departing) at 07:30 tomorrow.`
      ],
      cevap: [
        `<b>moves</b>; genel ve değişmez kabul edilen bilimsel gerçek present simple ile verilir.`,
        `<b>are installing</b>; this year içindeki gelişen/geçici eğilim vurgulanır. Bağlama göre simple istatistiksel rutin sunabilir, fakat burada değişim okuması güçlüdür.`,
        `<b>departs</b>; uçuş tarifesi kurumsal programdır. Konuşmacının kişisel düzenlemesi öne çıksaydı continuous mümkün olabilirdi.`
      ],
      kontrol: [`Eylemin işlevini biçimden önce belirledim.`, `Durum ile geçici süreci ayırdım.`, `Gelecek kullanımlarında program ile kişisel düzenlemeyi kontrol ettim.`]
    }),

    "T21": kayit({
      kod: `T21`, baslik: `Durum fiilleri ve süreklilik`,
      ozet: `Fiilin durum ve eylem anlamlarını ayırarak simple veya continuous görünüşü seçme`,
      ana: `Bir fiilin “stative” olması değişmez bir etiket değildir; kullanılan anlam belirleyicidir. Think, have, see, taste gibi fiiller bir bağlamda durum, başka bir bağlamda etkin süreç anlatabilir.`,
      kural: [
        [`durum anlamı`, `Bilme, inanma, sahiplik, algı sonucu ve ilişki gibi sınırları görünmeyen durumlar çoğunlukla simple biçimdedir.`, `<em>I know the answer. The box contains samples.</em>`],
        [`dinamik anlam`, `Bilinçli etkinlik, geçici davranış veya değişen süreç continuous alabilir.`, `<em>I am thinking about the proposal.</em>`],
        [`have`, `Sahiplikte simple; deneyim/etkinlikte continuous olabilir.`, `<em>She has a car / She is having lunch.</em>`],
        [`see`, `Görme/anlama durumunda simple; buluşma veya muayene etmede continuous olabilir.`, `<em>I see your point / I am seeing the doctor.</em>`],
        [`be + davranış`, `Kalıcı özellikte simple; o ana özgü davranışta being kullanılabilir.`, `<em>He is polite / He is being unusually polite.</em>`],
        [`duyu fiilleri`, `Kendiliğinden algı simple; bilinçli deneme continuous olabilir.`, `<em>The soup tastes salty / She is tasting the soup.</em>`]
      ],
      yol: [
        `Fiilin sözlükteki genel etiketine değil, cümledeki anlamına bakın. “Sahip olmak mı, yaşamak/yapmak mı?” gibi karşılaştırma sorun.`,
        `Öznenin bilinçli ve devam eden bir etkinlik yürütüp yürütmediğini belirleyin.`,
        `Geçici davranış veya değişim belirteçlerini arayın: currently, these days, at the moment.`,
        `Continuous seçeneği yalnız biçimce mümkün mü değil, anlamca neden gerekli onu açıklayın.`
      ],
      tuzak: [
        `“Stative fiiller asla continuous olmaz” mutlak kuralı yanlıştır; anlam değişmesi biçimi değiştirir.`,
        `<em>I am knowing</em> temel “bilmek” anlamında doğal değildir; geçicilik tek başına her fiili continuous yapmaz.`,
        `<em>I'm loving it</em> gibi işaretli reklam/konuşma kullanımları vardır; YDS'nin nötr akademik bağlamında temel ayrımı izleyin.`,
        `<em>Being</em> çoğu kez geçici davranışı anlatır, öznenin kimliğini değil.`
      ],
      tani: [
        `Seçin: I (think / am thinking) the estimate is too low.`,
        `Seçin: The engineers (have / are having) difficulty locating the fault.`,
        `Farkı açıklayın: The child is quiet / The child is being quiet.`
      ],
      cevap: [
        `<b>think</b>; burada görüş/inanç bildirir. <em>Am thinking about</em> olsaydı zihinsel süreç vurgulanırdı.`,
        `<b>are having</b> doğal bir geçici deneyim/karşılaşma kalıbıdır: <em>have difficulty doing</em>. Bağlam kalıcı genel durum kurarsa simple da mümkün olabilir.`,
        `İlki çocuğun genel/şimdiki durumunu niteler; ikincisi özellikle o anda sessiz davranmayı seçtiğini vurgular.`
      ],
      kontrol: [`Fiilin bağlamdaki anlamını belirledim.`, `Durum ile bilinçli etkinliği ayırdım.`, `Continuous biçimin eklediği geçicilik, süreç veya tutum anlamını doğruladım.`]
    }),

    "T22": kayit({
      kod: `T22`, baslik: `-di geçmişi ile past/perfect ayrımı`,
      ozet: `Bitmiş geçmiş zamanı, deneyimi, güncel sonucu ve açık zaman dönemini ayırma`,
      ana: `Türkçe -di hem belirli bitmiş olayı hem bugüne bağlı sonucu çevirebilir. İngilizce simple past ile present perfect seçimi olayın “olup olmamasından” çok, zaman çerçevesinin kapalı mı açık mı olduğuna ve konuşma anıyla kurduğu bağa dayanır.`,
      kural: [
        [`simple past`, `Bitmiş ve geçmişte konumlandırılmış olay/durum.`, `<em>The team published the report in 2022.</em>`],
        [`present perfect: deneyim`, `Şimdiye kadarki açık yaşam/zaman alanında deneyim; kesin geçmiş zaman verilmez.`, `<em>She has visited Kenya twice.</em>`],
        [`present perfect: sonuç`, `Geçmiş eylemin güncel sonucu veya yeni haber değeri.`, `<em>The storm has damaged the bridge.</em>`],
        [`açık dönem`, `Today/this year gibi dönem henüz sürüyorsa perfect mümkün olabilir.`, `<em>We have received three applications today.</em>`],
        [`kapalı dönem`, `Yesterday, last year, in 2019 gibi bitmiş zaman simple past ister.`, `<em>We received three applications yesterday.</em>`],
        [`been / gone`, `Been gidip dönmüş deneyim; gone gidip hâlâ orada/henüz dönmemiş olma eğilimindedir.`, `<em>She has gone to the lab.</em>`]
      ],
      yol: [
        `Açık bir geçmiş zaman ifadesi bulun. Bitmiş dönem varsa simple past güçlü adaydır.`,
        `Zaman verilmemişse cümlenin deneyim mi, güncel sonuç mu, yoksa anlatıdaki sıradan geçmiş olay mı olduğunu belirleyin.`,
        `Paragrafın anlatı zamanı kurulmuşsa sonraki olayların simple past ile sürmesini bekleyin.`,
        `Today/this week gibi belirteçlerde dönemin konuşma anında sürüp sürmediğini bağlamdan değerlendirin.`
      ],
      tuzak: [
        `Present perfect “yakın geçmiş” demek değildir; yakınlık tek başına seçim yaptırmaz.`,
        `Present perfect ile belirli bitmiş zaman (*has happened yesterday) birleştirilmez.`,
        `Ever/never/yet/already güçlü ipuçlarıdır ama bağlam dışı mekanik şifreler değildir; farklı zaman yapılarında da görülebilirler.`,
        `Bir olayın sonucu hâlâ sürüyor diye her zaman perfect zorunlu değildir; konuşmacının zamanı nasıl çerçevelediği önemlidir.`
      ],
      tani: [
        `Seçin: The agency (issued / has issued) the warning at 9 a.m. yesterday.`,
        `Seçin: Researchers (identified / have identified) a new species, and the finding is being reported today.`,
        `Farkı açıklayın: I lost my key / I have lost my key.`
      ],
      cevap: [
        `<b>issued</b>; yesterday ile kapanmış ve belirli bir geçmiş zaman verilmiştir.`,
        `<b>have identified</b>; bulgu güncel haber ve sonuç olarak sunulmuştur. Bir anlatı içinde zaman açıkça geçmişe kurulursa identified da mümkün olurdu.`,
        `Simple past kaybetme olayını geçmişte anlatır; anahtar sonradan bulunmuş olabilir. Present perfect, mevcut durumda anahtarın bende olmamasını öne çıkarır.`
      ],
      kontrol: [`Zaman döneminin açık mı kapalı mı olduğunu gördüm.`, `Deneyim, sonuç ve anlatı işlevini ayırdım.`, `Belirli bitmiş zamanla present perfect'i mekanik biçimde birleştirmedim.`]
    }),

    "T23": kayit({
      kod: `T23`, baslik: `Süregelen geçmiş ve zaman belirteçleri`,
      ozet: `Present perfect simple ve continuous ile süren, tekrarlanan veya yeni bitmiş eylemleri anlatma`,
      ana: `For/since ile başlayan bir durum present perfect simple ya da continuous olabilir. Seçim, fiilin türüne, sonuç–süre odağına ve eylemin hâlâ sürüp sürmediğine göre yapılır; continuous “kesinlikle sürüyor” anlamına indirgenemez.`,
      kural: [
        [`perfect simple + durum`, `Stative fiil veya kalıcı durumun başlangıçtan bugüne sürmesi.`, `<em>They have known each other for years.</em>`],
        [`perfect continuous + etkinlik`, `Süren/tekrarlanan etkinliğin süresini ve sürecini öne çıkarır.`, `<em>They have been testing the device since May.</em>`],
        [`sonuç odağı`, `Tamamlanan miktar/başarı simple ile daha belirgindir.`, `<em>They have tested fifty samples.</em>`],
        [`yakın zamanda bitmiş süreç`, `Continuous, sonucu şimdi görülen fakat az önce bitmiş etkinliği anlatabilir.`, `<em>It has been raining; the roads are wet.</em>`],
        [`how long / how many`, `How long süreç-süre; how many tamamlanan sayı odağını destekler.`, `<em>How long have you been waiting?</em>`],
        [`lately/recently`, `Açık yakın dönem içinde tekrar/süreç kurabilir.`, `<em>Prices have been rising recently.</em>`]
      ],
      yol: [
        `Fiilin stative mi etkinlik mi olduğunu bağlamdaki anlamıyla belirleyin.`,
        `Cümlenin “ne kadar süredir?” mi “kaç tane tamamlandı?” mı sorusuna cevap verdiğini bulun.`,
        `Fiziksel/görünür güncel sonuç varsa yakın zamanda bitmiş continuous okumasını da düşünün.`,
        `Since yan cümlesinin başlangıç olayını, ana cümlenin süreklilik zamanıyla karıştırmayın: <em>since the project began</em>.`
      ],
      tuzak: [
        `Stative fiili sırf since var diye continuous yapmayın: <em>has belonged</em>, genellikle *has been belonging değil.`,
        `Continuous her zaman hâlâ sürüyor demek değildir; yeni bitmiş ama iz bırakan süreç olabilir.`,
        `<em>For</em> yalnız perfect ile kullanılmaz: <em>worked for two years</em> bitmiş süre olabilir.`,
        `Tamamlanan sayıyı continuous ile vermek sonucu bulanıklaştırabilir; <em>has written three reports</em> daha uygundur.`
      ],
      tani: [
        `Seçin: The laboratory (has owned / has been owning) this equipment since 2018.`,
        `Seçin: The team (has analysed / has been analysing) 200 samples so far.`,
        `Yorumlayın: She has been crying; her eyes are red. Ağlama mutlaka hâlâ sürüyor mu?`
      ],
      cevap: [
        `<b>has owned</b>; own sahiplik anlamında stative'dir.`,
        `<b>has analysed</b>; 200 samples tamamlanmış sonuç miktarını öne çıkarır. Süreç/süre vurgusunda continuous mümkün olurdu.`,
        `Hayır. Gözlerin kızarıklığı, yakın zamanda bitmiş bir ağlama sürecinin güncel izi olabilir.`
      ],
      kontrol: [`Fiilin anlam türünü belirledim.`, `Süreç ile tamamlanan sonucu ayırdım.`, `Continuous biçiminden eylemin mutlaka sürdüğü sonucunu çıkarmadım.`]
    }),

    "T24": kayit({
      kod: `T24`, baslik: `Geçmişte süreklilik, öncelik ve alışkanlık`,
      ozet: `Past continuous, past perfect, used to ve would ile geçmiş olay örgüsünü kurma`,
      ana: `Türkçe -iyordu, -mişti ve -ardı biçimleri İngilizcede görünüş ve anlatı sırasına ayrılır. Past perfect yalnız “daha eski geçmiş” etiketi değil, başka bir geçmiş referans noktasından önce tamamlanmayı açıklar.`,
      kural: [
        [`past continuous`, `Geçmiş bir anda sürmekte olan arka plan veya geçici süreç.`, `<em>They were sleeping when the alarm rang.</em>`],
        [`simple past`, `Olay zincirini ilerleten tamamlanmış olay.`, `<em>The alarm rang, and everyone left.</em>`],
        [`past perfect`, `Başka bir geçmiş olaydan önce tamamlanan ve bağlantısı önemli olay.`, `<em>The train had left before we arrived.</em>`],
        [`used to`, `Artık geçerli olmayan geçmiş durum veya alışkanlık.`, `<em>The site used to be a factory.</em>`],
        [`would + alışkanlık`, `Tekrarlanan geçmiş eylem; genellikle geçmiş çerçeve gerekir, durum fiillerinde sınırlıdır.`, `<em>Every winter, the river would freeze.</em>`],
        [`past perfect continuous`, `Geçmiş referans noktasına dek süren etkinlik.`, `<em>They had been waiting for hours when help arrived.</em>`]
      ],
      yol: [
        `Geçmişteki olayları zaman çizgisine yerleştirin; hangisi arka plan, hangisi olay zinciri, hangisi daha önce tamamlanmış?`,
        `Past perfect'i yalnız iki geçmiş olayın sırası bağlamda önemli ve başka türlü belirsizse seçin.`,
        `Geçmiş alışkanlıkta durum mu eylem mi olduğunu bulun; used to her ikisiyle, would daha çok tekrarlanan eylemle güvenlidir.`,
        `When/while bağlacını tek başına zaman şifresi saymayın; yanındaki olayın süreç veya nokta niteliğini okuyun.`
      ],
      tuzak: [
        `Her cümlede en eski olayı past perfect yapmak gerekmez; kronoloji already/before ile açıksa simple past doğal olabilir.`,
        `<em>Would be a factory</em> geçmiş durum alışkanlığını nötr biçimde vermez; <em>used to be</em> gerekir.`,
        `<em>Used to</em> ile <em>be used to + isim/-ing</em> (“alışkın olmak”) farklı yapılardır.`,
        `Past continuous tamamlanmış uzun eylem demek değildir; o referans anındaki iç görünümü sunar.`
      ],
      tani: [
        `Doldurun: By the time the inspectors arrived, the staff ___ the faulty equipment. (remove)`,
        `Seçin: While the technician (checked / was checking) the circuit, the power failed.`,
        `Düzeltin: The village would be much smaller before the dam was built. (geçmiş durum)`
      ],
      cevap: [
        `<em>had removed</em>; kaldırma, denetçilerin gelişinden önce tamamlanmıştır.`,
        `<b>was checking</b>; sürmekte olan kontrol arka plan, power failed ise onu kesen noktasal olaydır.`,
        `<em>The village used to be much smaller...</em> Used to geçmiş durumu ve artık geçerli olmadığını ifade eder.`
      ],
      kontrol: [`Geçmiş referans noktasını belirledim.`, `Arka plan, olay zinciri ve önceliği ayırdım.`, `Used to ile would kullanımını durum/eylem ayrımına göre seçtim.`]
    }),

    "T25": kayit({
      kod: `T25`, baslik: `Gelecek anlatım seçenekleri`,
      ozet: `Niyet, anlık karar, mevcut kanıt, kişisel düzenleme ve resmî programı uygun gelecek yapısıyla anlatma`,
      ana: `Türkçe -acak İngilizcede tek bir “future tense” biçimine dönüşmez. Konuşma anındaki karar, önceden var olan niyet, gözle görülür kanıt, ayarlanmış plan ve takvim farklı yapılara dağılır.`,
      kural: [
        [`will + V1`, `Anlık karar, tahmin, söz/teklif veya nötr gelecek.`, `<em>I'll answer the phone.</em>`],
        [`be going to`, `Önceden niyet veya şimdiki kanıta dayalı öngörü.`, `<em>Look at those clouds; it is going to rain.</em>`],
        [`present continuous`, `Ayarlanmış kişisel/kurumsal düzenleme; çoğu kez zaman/yer ayrıntısı vardır.`, `<em>We are meeting the supplier tomorrow.</em>`],
        [`present simple`, `Tarife, resmî program ve takvim.`, `<em>The conference starts on Monday.</em>`],
        [`be about to / due to`, `Çok yakın gelecek / programa göre beklenen olay.`, `<em>The train is about to leave; it is due to arrive at six.</em>`],
        [`future continuous/perfect`, `Gelecekte sürüyor olma / bir sınıra dek tamamlanmış olma.`, `<em>will be working; will have finished by June</em>`]
      ],
      yol: [
        `Gelecek olayının kaynağını belirleyin: karar şimdi mi alındı, niyet önceden mi var, kanıt şu anda mı görülüyor?`,
        `Kişisel düzenleme ile resmî tarife ayrımını zaman/yer ve kurum takvimi üzerinden yapın.`,
        `By + gelecek sınırı varsa tamamlanmışlık için future perfect olasılığını değerlendirin.`,
        `Yan cümlede gelecek anlatılıyorsa T26'daki zaman/koşul kuralını ayrıca kontrol edin.`
      ],
      tuzak: [
        `Will her gelecek cümlede zorunlu değildir; hatta zaman/koşul yan cümlesinde çoğunlukla kullanılmaz.`,
        `Going to yalnız “kesin gelecek” değildir; niyet ve mevcut kanıt işlevlerini taşır.`,
        `Present continuous ile gelecek kullanımında bağlam düzenlemeyi açık etmelidir; stative fiiller yine sınırlıdır.`,
        `<em>Due to</em> “-den dolayı” da olabilir; <em>be due to + V1</em> programlanan/beklenen gelecek yapısıdır.`
      ],
      tani: [
        `Telefon çalıyor; konuşmacı o anda karar veriyor. Doldurun: I ___ get it.`,
        `Takvim cümlesi: The semester ___ on 16 September. (begin)`,
        `Doldurun: By the end of this year, the team ___ all six sites. (survey)`
      ],
      cevap: [
        `<em>will</em>; konuşma anında alınan karar/sunumdur.`,
        `<em>begins</em>; resmî akademik takvim present simple ile verilir.`,
        `<em>will have surveyed</em>; gelecekteki sınırdan önce altı sahanın tamamlanması vurgulanır.`
      ],
      kontrol: [`Gelecek biçimini olayın iletişimsel kaynağına göre seçtim.`, `Program ile düzenlemeyi ayırdım.`, `Gelecekte süreç ve tamamlanma sınırlarını kontrol ettim.`]
    }),

    "T26": kayit({
      kod: `T26`, baslik: `Zaman/koşul yan cümleleri ve gelecek`,
      ozet: `When, if, until ve benzeri yan cümlelerde gelecek anlamını present biçimle kurma`,
      ana: `Gelecek zamana gönderme yapan zaman ve gerçek koşul yan cümlelerinde İngilizce çoğunlukla will yerine present biçim kullanır. Ancak aynı bağlaç isim cümleciği kurduğunda veya will istek/ısrar anlamı taşıdığında yapı değişebilir.`,
      kural: [
        [`zaman yan cümlesi`, `When, after, before, until, as soon as + present; ana cümlede gelecek olabilir.`, `<em>When the results arrive, we will compare them.</em>`],
        [`gerçek koşul`, `If/unless/provided + present, ana cümlede will/modal/emir.`, `<em>If demand rises, prices may increase.</em>`],
        [`present perfect yan cümle`, `Gelecekte bir iş tamamlandıktan sonrasını vurgular.`, `<em>Once we have collected the data, we will analyse them.</em>`],
        [`isim cümleciği`, `When/if “ne zaman/olup olmadığını” nesne olarak kuruyorsa will gelebilir.`, `<em>We do not know when the results will arrive.</em>`],
        [`will = istek/ısrar`, `Koşul yan cümlesinde geleceklikten çok gönüllülük veya ısrar anlatabilir.`, `<em>If you will wait here, I will check the file.</em>`],
        [`future in the past`, `Geçmiş bakış noktasında would ana/isim cümleciğinde kullanılabilir.`, `<em>She knew the results would arrive soon.</em>`]
      ],
      yol: [
        `Bağlacın işlevini belirleyin: zaman/koşul zarfı mı, yoksa know/ask gibi fiilin nesnesi olan isim cümleciği mi?`,
        `Zarf yan cümlesiyse gelecek anlamına rağmen present simple/perfect seçeneklerini önce değerlendirin.`,
        `Eylemlerin sırasını kontrol edin; yan cümlede tamamlanmışlık önemliyse present perfect kullanın.`,
        `Will varsa bunun basit geleceklik mi yoksa istek/ısrar anlamı mı taşıdığını sınayın.`
      ],
      tuzak: [
        `<em>When the report will arrive, we will read it</em> zaman yan cümlesinde yanlıştır; <em>when it arrives</em>.`,
        `<em>I wonder when the report will arrive</em> ise doğrudur; bölüm isim cümleciğidir.`,
        `Unless zaten “if not” içerir; *unless ... not çoğu bağlamda gereksiz çift olumsuzluk yaratır.`,
        `Present biçim geleceğin kesin olduğu anlamına gelmez; yapı yalnız yan cümlenin dilbilgisel zaman seçimini gösterir.`
      ],
      tani: [
        `Doldurun: We will publish the figures as soon as the committee ___ them. (approve)`,
        `Doldurun: No one knows whether the committee ___ the proposal. (accept, gelecek)`,
        `Doldurun: Once the samples ___, they will be stored at −20°C. (label, edilgen ve tamamlanmış)`
      ],
      cevap: [
        `<em>approves</em>; as soon as zaman yan cümlesidir ve present simple kullanılır.`,
        `<em>will accept</em>; whether bölümü knows fiilinin nesnesi olan isim cümleciğidir, koşul zarfı değildir.`,
        `<em>have been labelled</em>; gelecekte depolamadan önce etiketlemenin tamamlanması present perfect passive ile vurgulanır.`
      ],
      kontrol: [`Bağlacın clause işlevini belirledim.`, `Zaman/koşul yan cümlesinde gereksiz will kullanmadım.`, `Tamamlanma, istek ve isim cümleciği istisnalarını kontrol ettim.`]
    }),

    "T27": kayit({
      kod: `T27`, baslik: `Dolaylı anlatım ve zaman kaydırma`,
      ozet: `Aktarım zamanını, kişi–yer gönderimini ve reporting verb kalıplarını bağlama göre dönüştürme`,
      ana: `Dolaylı anlatım yalnız zamanı bir basamak geriye çekme alıştırması değildir. Aktarım fiilinin zamanı, bilginin hâlâ geçerli olup olmadığı, bakış noktası ve kullanılan reporting verb'ün tamlayıcı kalıbı birlikte belirleyicidir.`,
      kural: [
        [`tipik backshift`, `Geçmiş reporting verb ardından present→past, past→past perfect, will→would kayabilir.`, `<em>“I am tired.” → She said she was tired.</em>`],
        [`backshift zorunlu olmayabilir`, `Genel gerçek veya hâlâ geçerli bilgi present kalabilir.`, `<em>The teacher said that water boils at 100°C.</em>`],
        [`kişi/iyelik`, `Adıllar aktaranın bakış noktasına göre değişir.`, `<em>“My results...” → He said his results...</em>`],
        [`zaman/yer`, `Now/this/here gibi deiktik ifadeler bağlama göre then/that/there olur; körlemesine değişmez.`, `<em>today → that day</em>`],
        [`say / tell`, `Say doğrudan kişi nesnesi almaz; tell kişi nesnesi ister.`, `<em>said that... / told us that...</em>`],
        [`reporting patterns`, `Suggest + -ing/that; advise + object + to; deny + -ing gibi kalıplar.`, `<em>They advised us to wait.</em>`]
      ],
      yol: [
        `Özgün sözün konuşma zamanı ile aktarım zamanını belirleyin.`,
        `Bilginin hâlâ doğru/genel gerçek olup olmadığını değerlendirin; backshift'i mekanik zorunluluk saymayın.`,
        `Kişi, iyelik, zaman ve yer ifadelerini yeni konuşmacı bakışına göre güncelleyin.`,
        `Reporting verb'ün ardından that-clause, nesne + infinitive veya gerund kalıbından hangisinin gerektiğini kontrol edin.`
      ],
      tuzak: [
        `<em>She told that...</em> eksiktir; tell kişi ister: <em>She told me that...</em>`,
        `<em>He suggested me to go</em> standart yapıda yanlıştır; <em>suggested going</em> veya <em>suggested that I (should) go</em>.`,
        `Past perfect'e gereksiz yığılma metni ağırlaştırabilir; olay sırası açıksa bazı geçmiş biçimler korunabilir.`,
        `Tomorrow her zaman the next day olmaz; aktarım aynı gün yapılıyorsa gerçek takvim bağlamı korunabilir.`
      ],
      tani: [
        `Aktarın: “I will finish the review tomorrow,” Maya said on Monday.`,
        `Düzeltin: The doctor suggested the patient to rest.`,
        `Açıklayın: The lecturer said that the Earth revolves around the Sun. Neden revolved zorunlu değil?`
      ],
      cevap: [
        `<em>Maya said that she would finish the review the following day.</em> Kişi, will ve zaman gönderimi geçmiş bakışa uyarlanır.`,
        `<em>The doctor advised the patient to rest</em> veya <em>suggested that the patient (should) rest</em>. Suggest nesne + to-infinitive almaz.`,
        `Bu değişmeyen genel gerçek olduğu için present simple korunabilir; geçmiş reporting verb otomatik ve zorunlu backshift yaratmaz.`
      ],
      kontrol: [`Aktarımın zaman ve bakış noktasını belirledim.`, `Adıl ve deiktik ifadeleri bağlama göre dönüştürdüm.`, `Reporting verb'ün kendi tamlayıcı kalıbını doğruladım.`]
    }),

    "T28": kayit({
      kod: `T28`, baslik: `Yeterlik, izin ve olasılık`,
      ozet: `Can/could, may/might, be able to ve manage to yapılarını işlev ve zaman bakımından ayırma`,
      ana: `Türkçe -abil yeterlik, izin veya olasılık bildirebilir. İngilizcede aynı işlev farklı modallara dağılır; özellikle geçmişte genel yetenek ile tek bir olayda başarı arasındaki ayrım önemlidir.`,
      kural: [
        [`can`, `Şimdiki/genel yetenek, gayriresmî izin veya genel olasılık.`, `<em>She can analyse complex data.</em>`],
        [`could`, `Geçmiş genel yetenek, nazik rica veya daha uzak olasılık.`, `<em>He could swim at five.</em>`],
        [`be able to`, `Can'in bulunmadığı zaman/biçimlerde veya belirli başarı vurgusunda.`, `<em>will be able to; was able to escape</em>`],
        [`manage to`, `Zorluk aşarak tekil başarı.`, `<em>They managed to restore the files.</em>`],
        [`may / might`, `İzin veya epistemik olasılık; might çoğu bağlamda daha temkinli olabilir.`, `<em>The results may change.</em>`],
        [`could = olasılık`, `Bağlama göre mümkün senaryo, yetenekten farklıdır.`, `<em>The delay could affect recruitment.</em>`]
      ],
      yol: [
        `-abil anlamını etiketleyin: beceri mi, izin mi, olasılık mı, tek bir başarı mı?`,
        `Geçmişte genel kapasite için could; belirli olumlu olayda was/were able to veya managed to seçeneğini kontrol edin.`,
        `Modalın zamanını yalnız biçimden okumayın; could şimdiki/gelecek temkinli olasılık veya rica da olabilir.`,
        `Olumsuz belirli başarıda couldn't sıklıkla doğaldır; olumlu–olumsuz simetrisini mekanik varsaymayın.`
      ],
      tuzak: [
        `<em>Could</em> her geçmiş “başarabildi” cümlesinde güvenli değildir; tekil gerçekleşmiş başarı için <em>was able to</em> daha açıktır.`,
        `May not iki anlam taşıyabilir: “olmayabilir” veya resmî bağlamda “izinli değildir”; bağlam gerekir.`,
        `Can genel olasılıkta kullanılır (<em>Winters can be harsh</em>), belirli çıkarımda çoğu olumlu cümlede may/might/could daha uygundur.`,
        `Be able to bir infinitive aldığı için *be able can biçiminde modal yığılmaz.`
      ],
      tani: [
        `Seçin: Despite the smoke, the firefighters (could / were able to) rescue all the residents.`,
        `İşlevi belirleyin: The new rule could reduce administrative costs.`,
        `Doldurun: By next year, the centre ___ provide remote consultations. (yeterlik)`
      ],
      cevap: [
        `<b>were able to</b>; belirli bir olayda gerçekleşmiş olumlu başarı anlatılır.`,
        `Could burada geçmiş yetenek değil, geleceğe/şimdiye ilişkin mümkün sonuç bildirir.`,
        `<em>will be able to</em>; gelecek zaman işaretini will taşır, yeterlik be able to ile kurulur.`
      ],
      kontrol: [`Yeterlik, izin ve olasılığı ayırdım.`, `Genel geçmiş yetenek ile tekil başarıyı farklı kurdum.`, `Modal biçimin birden fazla zaman/işlev taşıyabileceğini bağlamla doğruladım.`]
    }),

    "T29": kayit({
      kod: `T29`, baslik: `Gereklilik ve olumsuzu`,
      ozet: `Must, have to, should, need ve olumsuz biçimlerinde yasak ile gereksizlik ayrımını kurma`,
      ana: `Gereklilik yapılarının olumsuzu aynı eksende değildir: mustn't yasak, don't have to ve needn't ise zorunluluk yokluğu bildirir. Should çoğu kez daha yumuşak öneri/beklenti taşır.`,
      kural: [
        [`must`, `Güçlü zorunluluk, konuşmacı otoritesi veya kuralsal ifade; ayrıca çıkarım işlevi vardır.`, `<em>You must wear protective gloves.</em>`],
        [`have to`, `Dış koşul/kural kaynaklı gereklilik; tüm zamanlarda çekilebilir.`, `<em>We had to postpone the trial.</em>`],
        [`should / ought to`, `Öneri, uygunluk veya güçlü olmayan beklenti.`, `<em>The treatment should reduce pain.</em>`],
        [`mustn't`, `Yasak: eylemi yapmak kabul edilmez.`, `<em>You mustn't open the chamber.</em>`],
        [`don't have to / needn't`, `Gereksizlik: yapmak serbest ama zorunlu değil.`, `<em>You needn't attend in person.</em>`],
        [`need as modal/main verb`, `Needn't + V1; do not need to + V1.`, `<em>We needn't wait / We don't need to wait.</em>`]
      ],
      yol: [
        `Cümlede “yapmak yasak” mı “yapmak zorunlu değil” mi ayrımını önce Türkçe olarak açıkça yazın.`,
        `Zamanı belirleyin; geçmiş zorunluluk için çoğunlukla had to gerekir.`,
        `Kuralın gücü ve kaynağını değerlendirin: güçlü zorunluluk mu, tavsiye mi, beklenen sonuç mu?`,
        `Need'in modal mı ana fiil mi olduğunu sonraki biçimden anlayın ve iki kalıbı karıştırmayın.`
      ],
      tuzak: [
        `<em>Mustn't</em>, “zorunda değilsin” değildir; “yapmamalısın/yasaktır” demektir.`,
        `Geçmiş zorunluluk için *musted yoktur; <em>had to</em>.`,
        `<em>Don't need wait</em> yanlıştır; <em>don't need to wait</em> veya <em>needn't wait</em>.`,
        `Should bazen öneri değil olasılıklı beklenti taşır: <em>The train should arrive soon.</em>`
      ],
      tani: [
        `Doldurun: Visitors ___ touch the exhibits, but they may take photographs. (yasak)`,
        `Doldurun: You ___ print the form; an electronic copy is acceptable. (gereksizlik)`,
        `Geçmişe aktarın: We must submit a revised plan. (dün zorunluyduk)`
      ],
      cevap: [
        `<b>mustn't / must not</b>; dokunmak yasaktır.`,
        `<b>don't have to / needn't</b>; basılı kopya zorunlu değildir fakat yasak da değildir.`,
        `<em>We had to submit a revised plan yesterday.</em> Geçmiş dışsal zorunluluk had to ile kurulur.`
      ],
      kontrol: [`Yasak ile gereksizliği ayırdım.`, `Zorunluluğun gücünü ve zamanını belirledim.`, `Need yapısında to kullanımını kontrol ettim.`]
    }),

    "T30": kayit({
      kod: `T30`, baslik: `Çıkarım kipliği ve kesinlik`,
      ozet: `Kanıta dayalı must, may/might/could ve can't çıkarımlarını kesinlik derecesiyle yorumlama`,
      ana: `Epistemik modallar eylem zorunluluğunu değil, konuşmacının önermeye verdiği olasılık derecesini gösterir. Must güçlü olumlu çıkarım, can't güçlü olumsuz çıkarım; may/might/could ise açık olasılık alanı kurar.`,
      kural: [
        [`must + V1`, `Mevcut duruma ilişkin güçlü ve kanıta dayalı çıkarım.`, `<em>The lights are on; someone must be inside.</em>`],
        [`can't + V1`, `Mevcut duruma ilişkin güçlü imkânsızlık çıkarımı.`, `<em>This can't be the final version.</em>`],
        [`may/might/could`, `Mümkün fakat kesin olmayan açıklama; dereceler bağlama göre örtüşür.`, `<em>The error may result from calibration.</em>`],
        [`be likely to`, `Olasılığın görece yüksek olduğunu sözcüksel biçimde belirtir.`, `<em>Demand is likely to increase.</em>`],
        [`be bound/certain to`, `Çok güçlü beklenti; mutlak mantıksal kesinlik olmak zorunda değildir.`, `<em>The change is bound to attract attention.</em>`],
        [`hedging`, `Appear, seem, apparently, probably gibi öğeler iddianın gücünü ayarlar.`, `<em>The policy appears to have failed.</em>`]
      ],
      yol: [
        `Modalın deontik mi epistemik mi olduğunu sorun: birine görev mi veriliyor, yoksa kanıttan sonuç mu çıkarılıyor?`,
        `Olumlu/olumsuz yönü ve kesinlik derecesini bir ölçeğe yerleştirin.`,
        `Kanıt cümlesi ile çıkarım cümlesi arasındaki mantıksal bağı kontrol edin.`,
        `Restatement'te güçlü must/can't ifadesini zayıf possible ile veya tersiyle değiştiren şıkları eleyin.`
      ],
      tuzak: [
        `Olumlu belirli çıkarımda can genellikle kullanılmaz: *He can be at home yerine <em>may/might/could be</em>.`,
        `Must çıkarımı “kesin biliyorum” değil, eldeki kanıta göre güçlü sonuçtur.`,
        `May ve might arasında her bağlamda sabit bir yüzde farkı yoktur; register ve söylem etkiler.`,
        `Likely bir sıfattır: <em>It is likely that...</em> veya <em>is likely to...</em>; *will likely to yanlıştır.`
      ],
      tani: [
        `Doldurun: The door is locked from the inside, so someone ___ be in the room.`,
        `Doldurun: This signature ___ be authentic; the person died decades before the document was written.`,
        `Gücü karşılaştırın: The treatment may work / The treatment is bound to work.`
      ],
      cevap: [
        `<b>must</b>; eldeki fiziksel kanıt güçlü olumlu çıkarım doğurur.`,
        `<b>can't</b>; tarihsel çelişki güçlü olumsuz çıkarımı destekler.`,
        `May yalnız açık olasılık bırakır; bound to çok güçlü beklenti ifade eder. İki cümle aynı kesinlik derecesinde değildir.`
      ],
      kontrol: [`Görev kipliği ile çıkarım kipliğini ayırdım.`, `Kesinlik derecesini korudum.`, `Modalın olumlu/olumsuz çıkarım yönünü ve kanıtını kontrol ettim.`]
    }),

    "T31": kayit({
      kod: `T31`, baslik: `Geçmişe yönelik kiplik`,
      ozet: `Modal + have + V3 yapısıyla geçmiş çıkarım, eleştiri, kaçırılmış imkân ve gereksiz eylemi ayırma`,
      ana: `Modal + have + V3 geçmiş olayın kendisini değil, konuşmacının o olaya şimdiki değerlendirmesini kodlar. Should have eleştiri/pişmanlık, must have güçlü çıkarım, might/could have olasılık veya gerçekleşmemiş imkân taşıyabilir.`,
      kural: [
        [`must have V3`, `Geçmişe ilişkin güçlü olumlu çıkarım.`, `<em>They must have missed the warning.</em>`],
        [`can't/couldn't have V3`, `Geçmişte olmuş olmasının güçlü biçimde reddi.`, `<em>She can't have written both reports overnight.</em>`],
        [`may/might have V3`, `Geçmişte gerçekleşmiş olabilecek olay.`, `<em>The sample might have been contaminated.</em>`],
        [`should/ought to have V3`, `Beklenen ama çoğu kez gerçekleşmeyen eylem; eleştiri veya pişmanlık.`, `<em>They should have checked the seal.</em>`],
        [`could have V3`, `Geçmiş olasılık veya kullanılmamış imkân; bağlam gerçekleşmeyi belirler.`, `<em>We could have avoided the delay.</em>`],
        [`needn't have V3`, `Eylem yapıldı fakat sonradan gereksiz olduğu anlaşıldı.`, `<em>You needn't have printed the file.</em>`]
      ],
      yol: [
        `Önce modalın temel değerlendirme türünü bulun: çıkarım, eleştiri, olasılık, kapasite veya gereksizlik.`,
        `Eylemin gerçekten gerçekleşip gerçekleşmediğini bağlamdan çıkarın; yapı her zaman tek başına söylemez.`,
        `Needn't have ile didn't need to ayrımında yapılan eylem hakkında açık kanıt arayın.`,
        `Passive gerekiyorsa modal + have + been + V3 dizilişini koruyun.`
      ],
      tuzak: [
        `<em>Must have</em> geçmiş zorunluluk değilse çıkarımdır; geçmiş zorunluluk <em>had to</em> ile anlatılır.`,
        `<em>Should have done</em> biçim olarak geçmiştir ama genellikle eylemin yapılmadığını ima eder; bu ima bağlamla doğrulanmalıdır.`,
        `<em>Didn't need to</em> mantıksal olarak eylemin yapılmadığını her zaman garanti etmez; yalnız zorunluluk yokluğunu açıkça söyler.`,
        `Modal ardından *have went değil <em>have gone</em> gerekir.`
      ],
      tani: [
        `Doldurun: The ground is wet; it ___ overnight. (rain, güçlü geçmiş çıkarım)`,
        `Anlamı açıklayın: You needn't have bought a ticket.`,
        `Doldurun: The data ___ during transmission, but we cannot yet rule that out. (bozulmuş olabilir)`
      ],
      cevap: [
        `<em>must have rained</em>; şimdiki ıslak zemin geçmiş yağmura kanıt sayılmıştır.`,
        `Bilet satın alınmıştır; konuşmacı bunun gereksiz olduğunu belirtir.`,
        `<em>may/might/could have been corrupted</em>; geçmiş olasılık ve passive yapı gerekir.`
      ],
      kontrol: [`Geçmiş olayla şimdiki değerlendirmeyi ayırdım.`, `Eylemin gerçekleşme durumunu bağlamdan kontrol ettim.`, `Modal + have + (been) + V3 dizilişini doğru kurdum.`]
    }),

    "T32": kayit({
      kod: `T32`, baslik: `-miş kanıtsallığı ve İngilizce karşılıklar`,
      ozet: `Türkçe -miş biçiminin aktarım, çıkarım, sonradan fark etme ve görünüş anlamlarını bağlama göre verme`,
      ana: `Türkçe -miş tek biçimde hem duyulan bilgiyi, hem kanıta dayalı çıkarımı, hem de sonradan fark etmeyi taşıyabilir. İngilizcede bunlar zaman, modal, reporting expression veya görünüş fiiliyle ayrı ayrı kurulur.`,
      kural: [
        [`aktarım`, `Bilginin başkasından geldiği said/reported/apparently gibi kaynak işaretleriyle verilir.`, `<em>It is reported that the species has declined.</em>`],
        [`çıkarım`, `Must/may/might have + V3 kanıt gücüne göre seçilir.`, `<em>They must have left early.</em>`],
        [`görünüş/izlenim`, `Seem/appear/look as if konuşmacının gözleminden doğan görünüşü verir.`, `<em>It seems that the device has failed.</em>`],
        [`sonradan fark etme`, `Turn out, apparently veya bağlamsal vurgu ile beklenmedik keşif anlatılır.`, `<em>It turned out that the file was incomplete.</em>`],
        [`geçmiş olay`, `Kaynak vurgusu gerekmiyorsa normal past/perfect yeterli olabilir.`, `<em>She had already left.</em>`],
        [`reportedly / allegedly`, `Reportedly nötr aktarım; allegedly özellikle doğrulanmamış iddia/hukuki mesafe taşıyabilir.`, `<em>The funds were allegedly misused.</em>`]
      ],
      yol: [
        `-miş'in cümledeki işlevini adlandırın: duydum mu, kanıttan çıkardım mı, yeni mi fark ettim, yalnız geçmiş mi anlatıyorum?`,
        `Bilgi kaynağı ve konuşmacının kesinlik derecesini belirleyin.`,
        `İngilizcede aynı anda hem doğru zamanı hem uygun kaynak/çıkarım ifadesini kurun.`,
        `Çeviride gereksiz reportedly/must ekleyerek Türkçede bulunmayan şüphe veya kesinlik yaratmayın.`
      ],
      tuzak: [
        `-miş her zaman present perfect değildir; kanıtsallık İngilizcede tense dışında araçlarla verilir.`,
        `Allegedly tarafsız “duyduğuma göre” karşılığı değildir; iddianın doğrulanmadığına güçlü mesafe koyabilir.`,
        `Must have çok güçlü çıkarımdır; belirsiz aktarımda reported/apparently daha doğru olabilir.`,
        `Apparently “görünüşe göre” ve “duyulduğuna göre” arasında bağlama göre hareket edebilir.`
      ],
      tani: [
        `Çevirin: Görünüşe göre sistem gece boyunca kapanmış. (kanıt/izlenim, kesin değil)`,
        `Çevirin: Bakanın istifa ettiği bildiriliyor.`,
        `Açıklayın: “Dosya eksikmiş” cümlesinin en az iki farklı İngilizce yorumu nasıl kurulur?`
      ],
      cevap: [
        `<em>The system appears/may have shut down overnight.</em> Appear/may, kesinliği sınırlı gözlem/olasılığı verir.`,
        `<em>It is reported that the minister has resigned</em> veya <em>The minister is reported to have resigned.</em> Kaynak aktarımı açıkça kodlanır.`,
        `Sonradan keşif: <em>It turned out that the file was incomplete.</em> Aktarım: <em>Apparently/Reportedly, the file was incomplete.</em> Bağlam olmadan tek zorunlu çeviri yoktur.`
      ],
      kontrol: [`-miş'in işlevini bağlamdan belirledim.`, `Kaynak ile kesinlik derecesini korudum.`, `Tense'i kanıtsallığın tek karşılığı sanmadım.`]
    }),

    "T33": kayit({
      kod: `T33`, baslik: `Dilek, pişmanlık ve gerçek dışılık`,
      ozet: `Wish, if only, would rather, it's time ve as if yapılarında biçimsel geçmişliği gerçek zamanla ayırma`,
      ana: `Gerçek dışı yapılarda past biçimi her zaman geçmiş zamanı göstermez; şimdiki gerçeğe uzaklık da kodlayabilir. Daha eski pişmanlık için past perfect, değişmesini istediğimiz davranış için would kullanılabilir.`,
      kural: [
        [`wish + past`, `Şimdiki durumun farklı olmasını isteme.`, `<em>I wish the process were simpler.</em>`],
        [`wish + past perfect`, `Geçmişte gerçekleşmiş/gerçekleşmemiş olaya pişmanlık.`, `<em>She wishes she had checked the figures.</em>`],
        [`wish + would`, `Başkasının/koşulun değişmesini isteme; gönüllülük veya tekrarlayan rahatsızlık.`, `<em>I wish they would stop arguing.</em>`],
        [`if only`, `Wish'e benzer ama çoğu kez daha güçlü duygu.`, `<em>If only we had more time.</em>`],
        [`would rather`, `Aynı özne: V1; farklı özne: past biçim.`, `<em>I'd rather leave / I'd rather you stayed.</em>`],
        [`it's time / as if`, `It's time + past gecikmiş uygunluk; as if past/past perfect gerçek dışı benzetme.`, `<em>It's time we acted.</em>`]
      ],
      yol: [
        `Dileğin hedef zamanını bulun: şimdi mi, geçmiş mi, gelecekteki davranış değişikliği mi?`,
        `Biçimsel past'ın gerçek zaman mı yoksa modal uzaklık mı taşıdığını belirleyin.`,
        `Would rather yapısında iki bölümün öznesinin aynı mı farklı mı olduğuna bakın.`,
        `As if/as though sonrasında konuşmacının benzetmeyi gerçek mi olası mı gördüğünü bağlamdan çıkarın.`
      ],
      tuzak: [
        `<em>I wish I would know</em> temel durum dileğinde yanlıştır; <em>I wish I knew</em>.`,
        `Wish + would genellikle kişinin kendi kontrolündeki tek seferlik isteği için kullanılmaz; davranış değişikliği/gönüllülük gerekir.`,
        `<em>It's time to act</em> ile <em>It's time we acted</em> ikisi de doğrudur; ikincide past gecikmişlik/uygunluk taşır.`,
        `Were subjunctive tüm kişilerde resmî ve güvenli olabilir; konuşmada was da duyulur.`
      ],
      tani: [
        `Doldurun: I wish I ___ the warning more carefully yesterday. (read)`,
        `Doldurun: I'd rather the results ___ independently before publication. (verify, passive)`,
        `Anlamı açıklayın: He talks as if he knew everything.`
      ],
      cevap: [
        `<em>had read</em>; yesterday'daki geçmiş eyleme pişmanlık past perfect ile kurulur.`,
        `<em>were verified</em>; would rather'ın öznesi results farklıdır ve passive past biçim gerekir.`,
        `Konuşmacı onun her şeyi bildiğini gerçek kabul etmiyor; past biçim şimdiki gerçek dışı benzetme kuruyor.`
      ],
      kontrol: [`Dileğin hedef zamanını belirledim.`, `Past biçimin modal uzaklık işlevini gördüm.`, `Wish/would rather/as if yapılarında özne ve çatı uyumunu kontrol ettim.`]
    }),

    "T34": kayit({
      kod: `T34`, baslik: `Edilgen ve kişisiz edilgen`,
      ozet: `Be + V3 yapısını doğru zamanda kurma; bilgi odağı ve reporting passive yapılarını çözme`,
      ana: `Edilgenlik öznenin cansız olup olmamasıyla değil, olay katılımcılarının nasıl sunulduğuyla ilgilidir. Etkilenen öğe özne yapılır; yapan bilinmiyor, önemsiz veya bilgi akışında geri plandaysa belirtilmeyebilir.`,
      kural: [
        [`temel passive`, `Uygun zamanda be + V3; yapan gerekirse by ile eklenir.`, `<em>The samples were stored at −20°C.</em>`],
        [`modal passive`, `Modal + be + V3.`, `<em>The device must be calibrated.</em>`],
        [`perfect passive`, `Have + been + V3.`, `<em>The results have been confirmed.</em>`],
        [`continuous passive`, `Be + being + V3.`, `<em>The bridge is being repaired.</em>`],
        [`It is said that`, `Genel aktarımda kişisiz it + reporting passive.`, `<em>It is believed that the drug is safe.</em>`],
        [`subject + be said to`, `Aktarılan cümlenin öznesini öne çıkarır; eşzamanlı to V1, önceki olay to have V3.`, `<em>The drug is believed to be safe.</em>`]
      ],
      yol: [
        `Ana fiili ve zaman/modal zincirini bulun; yalnız son fiili V3 yapmak yeterli değildir.`,
        `Olayın yapanını ve etkilenenini belirleyin; cümlenin bilgi odağında hangisinin bulunması gerektiğine bakın.`,
        `Be yardımcı fiilini gerekli zaman ve sayı biçimine çekin, lexical fiili V3 yapın.`,
        `Reporting passive dönüşümünde aktarılan olayın reporting zamanına göre eşzamanlı mı önce mi olduğunu belirleyin.`
      ],
      tuzak: [
        `Cansız özne otomatik edilgen değildir: <em>The report describes three experiments</em> etkin ve doğrudur.`,
        `Geçişsiz fiiller doğrudan passive olmaz: *was arrived, *was happened.`,
        `By yapanı, with araç/malzemeyi gösterebilir: <em>was written by Lee with a pencil</em>.`,
        `Passive zincirde been/being ayrımını atlamayın: <em>has been tested</em>, <em>is being tested</em>.`
      ],
      tani: [
        `Passive yapın: Researchers have identified two risk factors.`,
        `Doldurun: The new guidelines must ___ before the trial begins. (approve, passive)`,
        `Dönüştürün: It is thought that the settlement was founded in the tenth century. (settlement özne)`
      ],
      cevap: [
        `<em>Two risk factors have been identified (by researchers).</em> Present perfect passive have been + V3 ile kurulur.`,
        `<em>be approved</em>; modal passive must + be + V3.`,
        `<em>The settlement is thought to have been founded in the tenth century.</em> Kuruluş, şimdiki düşünme eyleminden önce ve edilgendir; to have been founded gerekir.`
      ],
      kontrol: [`Etkinlik/edilgenliği cansızlığa göre değil bilgi odağına göre seçtim.`, `Zaman–modal zincirini be/been/being ile doğru kurdum.`, `Reporting passive'de olayların zaman ilişkisini korudum.`]
    }),

    "T35": kayit({
      kod: `T35`, baslik: `Ettirgen ve yaptırma`,
      ozet: `Have/get something done ile make, let, have ve get kişi kalıplarını ayırma`,
      ana: `Türkçe ettirgen eki İngilizcede tek bir yapıya dönüşmez. Bir işi hizmet olarak yaptırmak, birini zorlamak, izin vermek, görevlendirmek veya ikna etmek farklı fiil ve tamlayıcı biçimleri ister.`,
      kural: [
        [`have + şey + V3`, `Bir işi başkasına yaptırma/hizmet alma; yapan çoğu kez söylenmez.`, `<em>We had the equipment repaired.</em>`],
        [`get + şey + V3`, `Benzer yaptırma; get bazen sonuç elde etme/çaba nüansı taşır.`, `<em>She got the report translated.</em>`],
        [`make + kişi + V1`, `Zorlama veya güçlü neden. Passive'de to geri gelir.`, `<em>They made us wait / We were made to wait.</em>`],
        [`let + kişi + V1`, `İzin verme; passive karşılıkta çoğu kez be allowed to.`, `<em>They let us leave / We were allowed to leave.</em>`],
        [`have + kişi + V1`, `Görevlendirme/düzenleme.`, `<em>The director had an assistant check the figures.</em>`],
        [`get + kişi + to V1`, `İkna ederek veya çaba ile yaptırma.`, `<em>We got the supplier to replace the unit.</em>`]
      ],
      yol: [
        `Türkçe ettirgenin anlamını belirleyin: hizmet mi, zorlama mı, izin mi, görev mi, ikna mı?`,
        `Tamlayıcının kişi mi yaptırılan şey mi olduğuna bakın; V1, to V1 veya V3 seçimi buna bağlıdır.`,
        `Cümlenin etkin mi edilgen mi olduğuna dikkat edin; make passive olunca to alır.`,
        `Have/get something done yapısının bazen istenmeyen olay (“başına gelme”) anlatabileceğini bağlamdan kontrol edin.`
      ],
      tuzak: [
        `<em>make someone to do</em> etkin yapıda yanlıştır; <em>make someone do</em>.`,
        `<em>get someone do</em> değil <em>get someone to do</em>.`,
        `Have something done öznenin işi bizzat yaptığı anlamına gelmez.`,
        `<em>He had his wallet stolen</em> çoğu kez hizmet değil, istenmeyen “cüzdanı çalındı” deneyimidir.`
      ],
      tani: [
        `Çevirin: Laboratuvar cihazlarını geçen hafta kalibre ettirdi.`,
        `Doldurun: The new rule made all applicants ___ additional evidence. (provide)`,
        `Passive yapın: They made the interns repeat the experiment.`
      ],
      cevap: [
        `<em>The laboratory had/got its devices calibrated last week.</em> Şey + V3 hizmet olarak yaptırmayı gösterir.`,
        `<em>provide</em>; etkin make + kişi + V1.`,
        `<em>The interns were made to repeat the experiment.</em> Passive make yapısında to-infinitive kullanılır.`
      ],
      kontrol: [`Ettirgenin anlam türünü belirledim.`, `Kişi/şey tamlayıcısına uygun V1, to V1 veya V3 seçtim.`, `Etkin–edilgen dönüşümde to değişimini kontrol ettim.`]
    }),

    "T36": kayit({
      kod: `T36`, baslik: `Geçişlilik ve nesne yapısı uyuşmazlığı`,
      ozet: `Türkçe ve İngilizce fiillerin farklı nesne/ilgeç kalıplarını valency üzerinden çözme`,
      ana: `Yakın anlamlı fiiller aynı katılımcıları farklı sözdiziminde kurabilir. Türkçe eki İngilizceye taşımak yerine fiilin kaç ve ne tür tamlayıcı istediğini öğrenmek gerekir.`,
      kural: [
        [`doğrudan nesne farkı`, `İngilizce ask kişi nesnesini doğrudan alır; wait ise for ister.`, `<em>ask him; wait for him</em>`],
        [`ilgeçsiz İngilizce fiil`, `Discuss, enter, approach gibi fiiller Türkçedeki ek hissine rağmen doğrudan nesne alabilir.`, `<em>discuss the issue; enter the room</em>`],
        [`rise / raise`, `Rise geçişsiz “yükselmek”; raise geçişli “yükseltmek”.`, `<em>Prices rose / They raised prices.</em>`],
        [`lie / lay`, `Lie uzanmak (geçişsiz), lay koymak (geçişli); çekimleri farklıdır.`, `<em>lay the book; the book lay there</em>`],
        [`çift nesne`, `Give/send/show gibi fiiller kişi + şey veya şey + to + kişi alabilir.`, `<em>send us the file / send the file to us</em>`],
        [`for-alternation`, `Buy/make gibi fiiller yarar göreni çift nesne veya for ile kurabilir.`, `<em>buy her a ticket / buy a ticket for her</em>`]
      ],
      yol: [
        `Ana fiili bulun ve sözlük kalıbını “fiil + tamlayıcı” olarak çağırın.`,
        `Öznenin eylemi mi yaptığı, yoksa değişimi mi yaşadığına bakarak geçişli/geçişsiz çifti seçin.`,
        `Kişi ve şey olmak üzere iki nesne varsa sıralamayı ve to/for alternasyonunu kontrol edin.`,
        `Passive dönüşüm ihtimali, fiilin gerçek nesnesini bulmanıza yardım edebilir; ancak her dolaylı yapı aynı şekilde edilgenleşmez.`
      ],
      tuzak: [
        `<em>discuss about the problem</em> yerine <em>discuss the problem</em>; noun biçimi <em>a discussion about</em> olabilir.`,
        `<em>explain me the rule</em> değil <em>explain the rule to me</em>.`,
        `Rise/raise çekimini de ayırın: rise–rose–risen; raise–raised–raised.`,
        `Türkçe “ona cevap verdi” İngilizcede <em>answered him</em> veya <em>replied to him</em>; yakın anlamlı fiiller farklı valency taşır.`
      ],
      tani: [
        `Düzeltin: The report discusses about three possible causes.`,
        `Seçin: Sea levels are expected to (rise / raise) rapidly.`,
        `Düzeltin: The instructor explained us the procedure.`
      ],
      cevap: [
        `<em>The report discusses three possible causes.</em> Discuss doğrudan nesne alır.`,
        `<b>rise</b>; özne sea levels değişimi yaşayan öğedir, nesne yoktur.`,
        `<em>The instructor explained the procedure to us.</em> Explain şey nesnesini doğrudan, kişiyi to ile alır.`
      ],
      kontrol: [`Fiilin valency kalıbını Türkçeden bağımsız kontrol ettim.`, `Geçişli/geçişsiz fiili katılımcı rollerine göre seçtim.`, `İki nesneli yapılarda to/for ve sıralamayı doğruladım.`]
    }),

    "T37": kayit({
      kod: `T37`, baslik: `Light verbs ve eşdizim`,
      ozet: `Make, do, take, give ve have gibi hafif fiilleri adla kurdukları yerleşik eşdizime göre seçme`,
      ana: `Türkçede “yapmak/vermek/almak” ile kurulan bir kalıp İngilizcede aynı temel fiili izlemek zorunda değildir. Anlam çoğu kez fiil + ad eşdiziminin bütününde saklıdır.`,
      kural: [
        [`make`, `Sonuç/üretim ve karar gibi kalıplar.`, `<em>make a decision, make progress, make an assumption</em>`],
        [`do`, `Faaliyet, görev ve genel iş.`, `<em>do research, do the work, do harm</em>`],
        [`take`, `Eyleme girişme, yüklenme veya süreç.`, `<em>take action, take responsibility, take a risk</em>`],
        [`give`, `İletim, tepki veya kısa eylem.`, `<em>give advice, give permission, give a presentation</em>`],
        [`have`, `Deneyim, etkinlik ve ilişki.`, `<em>have an effect, have difficulty, have access</em>`],
        [`akademik fiil + ad`, `Conduct research, draw a conclusion, pose a threat gibi daha resmî eşdizimler.`, `<em>The study provides evidence.</em>`]
      ],
      yol: [
        `Boşluktaki fiili tek başına çevirmeyin; sağındaki adla birlikte bir eşdizim adayı oluşturun.`,
        `Cümlenin register'ını değerlendirin; do a study mümkün olsa da conduct/carry out a study akademik bağlamda daha uygun olabilir.`,
        `Yakın anlamlı seçeneklerin adla doğal birlikteliğini sınayın.`,
        `Eşdizimin çatı ve zamanını daha sonra kurun; önce doğru lexical birimi seçin.`
      ],
      tuzak: [
        `<em>make research</em> yerine <em>do/conduct research</em>.`,
        `<em>take a decision</em> bazı İngiliz İngilizcesi bağlamlarında görülür; genel ve güvenli kullanım <em>make a decision</em>.`,
        `Eş anlamlı fiiller her adla değiştirilemez: <em>pose a threat</em>, fakat *put a threat doğal değildir.`,
        `Light verb hatası gramerce mümkün görünebilir; YDS çeldiricisi bu yüzden biçimden çok kullanım sıklığını ölçer.`
      ],
      tani: [
        `Doldurun: The committee ___ the conclusion that further testing was necessary.`,
        `Doldurun: Excessive noise can ___ serious harm to marine mammals.`,
        `Düzeltin: The team made extensive research before publishing the report.`
      ],
      cevap: [
        `<b>drew/reached</b>; <em>draw/reach a conclusion</em> yerleşik eşdizimdir.`,
        `<b>do/cause</b>; <em>do harm to</em> light-verb eşdizimi, cause harm ise daha lexical alternatiftir.`,
        `<em>The team conducted/carried out extensive research...</em> Research ile make kullanılmaz.`
      ],
      kontrol: [`Fiili adla birlikte eşdizim olarak okudum.`, `Akademik register'a uygun seçeneği belirledim.`, `Yalnız Türkçe temel fiile bakarak mekanik seçim yapmadım.`]
    }),

    "T38": kayit({
      kod: `T38`, baslik: `Phrasal/prepositional verbs ve parçacık`,
      ozet: `Çok sözcüklü fiillerde parçacığın anlam, vurgu ve nesne konumuna etkisini çözme`,
      ana: `Tek Türkçe fiil İngilizcede phrasal verb, prepositional verb veya phrasal-prepositional verb ile karşılanabilir. Yapının türü, nesnenin nereye gelebileceğini ve zamirin konumunu belirler.`,
      kural: [
        [`phrasal verb`, `Fiil + adverb particle; bazıları ayrılabilir.`, `<em>carry out the test / carry the test out</em>`],
        [`prepositional verb`, `Fiil + ilgeç; nesne ilgeçten sonra gelir ve yapı ayrılmaz.`, `<em>rely on evidence</em>`],
        [`üç öğeli fiil`, `Fiil + parçacık + ilgeç; genellikle ayrılmaz.`, `<em>put up with noise; come up with a solution</em>`],
        [`zamir nesne`, `Ayrılabilir phrasal verb'de zamir araya gelir.`, `<em>carry it out</em>`],
        [`literal / idiomatic`, `Aynı biçim fiziksel veya deyimsel anlam taşıyabilir.`, `<em>take off a coat / the plane took off</em>`],
        [`register`, `Phrasal verb'in tek sözcüklü akademik karşılığı olabilir.`, `<em>find out → discover; put off → postpone</em>`]
      ],
      yol: [
        `Fiil grubunun sınırını belirleyin; küçük sözcüğü bağımsız yer-yön ilgeci sanmayın.`,
        `Nesne varsa yapının ayrılabilirliğini ve zamir konumunu kontrol edin.`,
        `Bağlamdan literal/deyimsel anlamı seçin; bütün grubun Türkçe karşılığını kurun.`,
        `Okuma/restatement'te phrasal verb ile tek sözcüklü akademik eş anlamlıyı eşleştirin.`
      ],
      tuzak: [
        `<em>look after</em> ayrılamaz: *look the child after değil.`,
        `<em>turn off it</em> yanlış; <em>turn it off</em>.`,
        `Her verb + preposition birleşimi bütünüyle deyimsel değildir; anlam bileşenlerden şeffaf olabilir.`,
        `Aynı phrasal verb çok anlamlı olabilir: <em>take up</em> başlamak, yer kaplamak, konuyu ele almak gibi.`
      ],
      tani: [
        `Düzeltin: The researchers carried out it under controlled conditions.`,
        `Anlamı verin: The new evidence bears out the original hypothesis.`,
        `Doldurun: Many small firms cannot put ___ prolonged uncertainty.`
      ],
      cevap: [
        `<em>The researchers carried it out...</em> Ayrılabilir carry out yapısında zamir araya gelir.`,
        `<em>Bear out</em> burada “doğrulamak/desteklemek” demektir; fiziksel taşıma anlamı yoktur.`,
        `<em>up with</em>; üç öğeli <em>put up with</em> “katlanmak” anlamındadır ve ayrılmaz.`
      ],
      kontrol: [`Çok sözcüklü fiilin türünü belirledim.`, `Nesne ve zamir konumunu kontrol ettim.`, `Deyimsel anlamı ve akademik eş karşılığını bağlamdan seçtim.`]
    }),

    "T39": kayit({
      kod: `T39`, baslik: `-dığı/-acağı adlaştırması ve noun clauses`,
      ozet: `That, whether/if ve wh-cümleciklerini özne, nesne, tümleç ve ad tamamlayıcısı olarak kurma`,
      ana: `Türkçe adlaştırma ekleri kişi ve zamanı sözcük içinde taşırken İngilizce tam çekimli bir noun clause kurabilir. Bağlaç seçimi bilginin önerme, evet–hayır belirsizliği veya açık soru öğesi taşımasına göre yapılır.`,
      kural: [
        [`that-clause`, `Bir önermeyi gerçek/iddia/içerik olarak adlaştırır.`, `<em>We know that the estimate is wrong.</em>`],
        [`whether/if`, `Evet–hayır alternatifi veya belirsizlik. Whether daha geniş konumlarda ve or not ile güvenlidir.`, `<em>Whether it will work remains unclear.</em>`],
        [`wh-clause`, `Kim, ne, neden, nasıl gibi açık bilgi boşluğunu adlaştırır.`, `<em>We examined why the rate had fallen.</em>`],
        [`subject clause`, `Cümlenin öznesi olabilir; ağırsa anticipatory it kullanılabilir.`, `<em>What they found was unexpected.</em>`],
        [`complement clause`, `Fiil/sıfatın nesnesi veya tamamlayıcısı.`, `<em>She is certain that the data are valid.</em>`],
        [`noun-complement that`, `Bir adın içeriğini açıklar; relative that ile aynı işlev değildir.`, `<em>the claim that the treatment works</em>`]
      ],
      yol: [
        `Adlaştırılan içeriğin tam bir önerme mi, evet–hayır alternatifi mi, wh-bilgisi mi olduğunu belirleyin.`,
        `Cümleciğin büyük cümlede özne, nesne veya ad tamamlayıcısı görevini bulun.`,
        `İç cümlede özne + fiil düz cümle sırasını koruyun; soru devrikliği yapmayın.`,
        `Whether/if seçiminde cümlenin özne konumu, ilgeç sonrası veya to-infinitive öncesi olup olmadığını kontrol edin.`
      ],
      tuzak: [
        `<em>I don't know that he will come</em> genellikle “gelip gelmeyeceğini bilmiyorum” değil; bunun için whether/if gerekir.`,
        `Özne cümleciğinde <em>if</em> yerine whether güvenlidir: <em>Whether it works is unclear.</em>`,
        `Noun clause içinde *why did it fail değil <em>why it failed</em>.`,
        `<em>The fact which...</em> ile <em>the fact that...</em> ayrılır: that-clause fact'in içeriğini verir.`
      ],
      tani: [
        `Doldurun: ___ the treatment is effective remains uncertain. (evet–hayır)`,
        `Düzeltin: Researchers investigated why did the device fail.`,
        `İşlevi belirleyin: The assumption that demand would remain stable proved false.`
      ],
      cevap: [
        `<b>Whether</b>; bütün noun clause özne konumundadır ve iki olasılığı açık bırakır.`,
        `<em>Researchers investigated why the device failed.</em> Gömülü cümlede düz cümle sırası vardır.`,
        `<em>That demand would remain stable</em>, assumption adının içeriğini açıklayan noun-complement clause'dur; relative clause değildir.`
      ],
      kontrol: [`Adlaştırılan bilgi türünü belirledim.`, `Noun clause'un büyük cümledeki görevini buldum.`, `Bağlaç ve iç cümle dizilişini doğru kurdum.`]
    }),

    "T40": kayit({
      kod: `T40`, baslik: `Gerund–infinitive ve tamlayıcı kalıpları`,
      ozet: `Fiilin istediği -ing/to-infinitive kalıbını ve biçim değişince oluşan anlam farkını çözme`,
      ana: `Türkçe -mek/-me/-mayı tek bir İngilizce biçime çevirmek mümkün değildir. İngilizce baş fiilin valency kalıbı, nesne varlığı ve anlam ilişkisi gerund, to-infinitive veya yalın infinitive seçtirir.`,
      kural: [
        [`verb + -ing`, `Avoid, consider, suggest, admit gibi fiiller.`, `<em>They avoided using toxic solvents.</em>`],
        [`verb + to V1`, `Decide, hope, refuse, plan gibi fiiller.`, `<em>They decided to repeat the trial.</em>`],
        [`verb + object + to V1`, `Advise, allow, expect, persuade gibi kalıplar.`, `<em>We advised them to wait.</em>`],
        [`bare infinitive`, `Modal, make/let ve bazı algı yapılarından sonra.`, `<em>The change may reduce costs.</em>`],
        [`remember/forget/regret`, `-ing geçmiş olayı; to V1 yapılacak/sonraki görevi gösterebilir.`, `<em>Remember to lock the door / I remember locking it.</em>`],
        [`stop/try`, `Stop doing eylemi bırakmak; stop to do başka amaçla durmak. Try doing yöntem denemek; try to do çaba göstermek.`, `<em>Try restarting the system.</em>`]
      ],
      yol: [
        `Boşluğun solundaki baş fiili ve varsa kişi nesnesini bulun.`,
        `Fiilin sözlük kalıbını hatırlayın; Türkçe mastar ekine göre seçim yapmayın.`,
        `İki biçimi de alan fiillerde zaman ve amaç farkını açık bir Türkçe cümleyle test edin.`,
        `Passive/perfect infinitive veya gerund gerekiyorsa anlam ilişkisini koruyun: to be done, to have done, being done.`
      ],
      tuzak: [
        `<em>Suggest someone to do</em> yerine <em>suggest doing</em> veya <em>suggest that someone do</em>.`,
        `<em>Allow doing</em> genel izin, <em>allow someone to do</em> kişi nesneli izin olabilir; kalıp bağlama göre değişir.`,
        `Try + -ing “deneme yapmak” gibi belirsiz değil, bir yöntemi deneyip sonucuna bakmaktır.`,
        `Preposition sonrası genel olarak gerund gelir: <em>interested in learning</em>. Buradaki to ilgeçse -ing gerekir: <em>look forward to hearing</em>.`
      ],
      tani: [
        `Doldurun: The committee postponed ___ a final decision. (make)`,
        `Farkı açıklayın: She stopped reading / She stopped to read.`,
        `Doldurun: We expect the revised policy ___ costs. (reduce)`
      ],
      cevap: [
        `<em>making</em>; postpone + gerund kalıbıdır.`,
        `İlkinde okuma eylemini bıraktı; ikincide başka eylemi durdurup okumak amacıyla ara verdi.`,
        `<em>to reduce</em>; expect + nesne + to-infinitive yapısında nesne the revised policy'dir.`
      ],
      kontrol: [`Baş fiilin tamlayıcı kalıbını kontrol ettim.`, `Nesne varlığını ve biçimin anlam farkını belirledim.`, `İlgeç to ile infinitive to'yu ayırdım.`]
    }),

    "T41": kayit({
      kod: `T41`, baslik: `Gömülü soru ve aktarım fiilleri`,
      ozet: `Wh/whether cümleciklerinde düz söz dizimini ve say, tell, ask, suggest kalıplarını doğru kurma`,
      ana: `Gömülü soru anlamca soru içerse de bağımsız soru dizilişini kullanmaz; iç bölüm özne + fiil sırasını korur. Aktarım fiilinin seçimi de cümlenin bilgi, talep, öneri veya emir işlevine bağlıdır.`,
      kural: [
        [`embedded wh`, `Wh + özne + fiil; do-support yoktur.`, `<em>Do you know where the file is?</em>`],
        [`embedded yes/no`, `Whether/if + özne + fiil.`, `<em>We asked whether the test had ended.</em>`],
        [`ask + question`, `Bilgi sorar; ask whether/why veya ask someone a question.`, `<em>She asked why the rate had changed.</em>`],
        [`ask/tell + object + to`, `Talep/emir: ask rica/istem, tell talimat.`, `<em>They asked us to wait; told us to leave.</em>`],
        [`say/tell`, `Say + (to person) + content; tell + person + content.`, `<em>She said to us / She told us.</em>`],
        [`suggest`, `Öneri: -ing veya that-clause; doğrudan kişi + to almaz.`, `<em>He suggested postponing the launch.</em>`]
      ],
      yol: [
        `Bölümün bağımsız soru mu, daha büyük cümlenin nesnesi/öznesi mi olduğunu bulun.`,
        `Gömülü ise soru sözcüğünden sonra düz cümle sırası kurun ve do/does/did desteğini kaldırın.`,
        `Aktarım fiilinin iletişim amacını belirleyin: bilgi söyleme, kişiye bildirme, soru, rica, emir veya öneri.`,
        `Zaman kaydırması ve adıl dönüşümünü T27 ilkeleriyle ayrıca kontrol edin.`
      ],
      tuzak: [
        `<em>I wonder where is he</em> değil <em>where he is</em>.`,
        `<em>She said me</em> değil <em>she told me</em> veya <em>said to me</em>.`,
        `<em>Ask that...</em> bazı resmî “talep etmek” bağlamlarında mümkün olsa da bilgi sorusunda ask whether/wh gerekir.`,
        `Whether ve if çoğu nesne konumunda değişebilir; ilgeç sonrası, infinitive öncesi ve özne konumunda whether tercih edilir.`
      ],
      tani: [
        `Düzeltin: Can you explain why did the results differ?`,
        `Düzeltin: The supervisor suggested us to repeat the measurement.`,
        `Doldurun: They asked ___ the equipment had been calibrated. (evet–hayır)`
      ],
      cevap: [
        `<em>Can you explain why the results differed?</em> Gömülü bölüm düz cümle sırasındadır.`,
        `<em>The supervisor suggested repeating the measurement</em> veya <em>suggested that we repeat it</em>.`,
        `<em>whether/if</em>; bölüm ask fiilinin nesnesi olan gömülü evet–hayır sorusudur.`
      ],
      kontrol: [`Bağımsız ve gömülü soruyu ayırdım.`, `İç cümlede düz söz dizimini korudum.`, `Aktarım fiilini iletişim amacı ve tamlayıcı kalıbıyla seçtim.`]
    }),

    "T42": kayit({
      kod: `T42`, baslik: `İlgi cümleciklerinde özne, nesne ve belirlilik`,
      ozet: `Defining/non-defining relative clause, zamir seçimi, düşürme ve noktalama ayrımlarını kurma`,
      ana: `Relative clause bir adı niteler; zamirin cümlecik içindeki özne/nesne görevi düşürülüp düşürülemeyeceğini belirler. Virgül ise yalnız nefes işareti değil, bilginin tanımlayıcı olup olmadığını kodlar.`,
      kural: [
        [`defining relative`, `Hangi kişi/şey olduğunu seçer; virgül yoktur. Who/which/that kullanılabilir.`, `<em>The samples that arrived today were frozen.</em>`],
        [`non-defining relative`, `Zaten belirli ada ek bilgi verir; virgüllüdür, that kullanılmaz.`, `<em>The samples, which arrived today, were frozen.</em>`],
        [`özne relative`, `Zamir cümleciğin öznesiyse düşmez.`, `<em>The scientist who led the team...</em>`],
        [`nesne relative`, `Defining yapıda zamir düşebilir.`, `<em>The method (that) we used...</em>`],
        [`who / which`, `Who kişiler; which şeyler/hayvanlar ve bazen bütün önerme.`, `<em>the device which failed</em>`],
        [`whose`, `Sahiplik ilişkisi kurar; kişi dışı adlarla da kullanılabilir.`, `<em>a policy whose effects remain unclear</em>`]
      ],
      yol: [
        `Nitelenen baş adı ve relative clause sınırını bulun.`,
        `Relative zamirden sonra özne var mı bakın: varsa zamir muhtemelen nesnedir ve defining yapıda düşebilir.`,
        `Baş adın zaten tek/belirli olup olmadığını ve bilginin seçici mi ek mi olduğunu belirleyin.`,
        `Virgül ve that seçimini anlamla birlikte kontrol edin; yalnız noktalama ezberi yapmayın.`
      ],
      tuzak: [
        `Özne relative zamiri düşürülemez: *The device failed was replaced.`,
        `Non-defining yapıda that kullanılmaz ve zamir düşmez.`,
        `Türkçede virgül bulunmaması İngilizcede defining olduğu anlamına gelmez; gönderim bağlamı belirler.`,
        `What'ın önünde baş ad olmaz: <em>what we found</em> = “bulduğumuz şey”; *the thing what değil.`
      ],
      tani: [
        `Zamir düşebilir mi? The report that the committee published was controversial.`,
        `Virgül farkını açıklayın: My brother who lives in Berlin / My brother, who lives in Berlin, ...`,
        `Doldurun: The device ___ failed during testing has been withdrawn.`
      ],
      cevap: [
        `Evet: <em>The report the committee published...</em> Relative cümlecikte özne the committee olduğundan that nesnedir.`,
        `Virgülsüz biçim birden çok kardeş arasından Berlin'de yaşayanı seçebilir. Virgüllü biçimde my brother zaten belirli, Berlin bilgisi ektir.`,
        `<em>that/which</em>; zamir failed fiilinin öznesidir ve düşürülemez.`
      ],
      kontrol: [`Baş adı ve relative clause görevini buldum.`, `Zamirin özne/nesne oluşuna göre düşürmeyi değerlendirdim.`, `Defining anlam ile virgül/that kullanımını birlikte kontrol ettim.`]
    }),

    "T43": kayit({
      kod: `T43`, baslik: `İleri ilgi yapıları`,
      ozet: `Whose/of which, preposition relatives, quantifier relatives ve bütün önermeye gönderimi çözme`,
      ana: `İleri relative yapılar yalnız adı seçmez; sahiplik, ilgeç ilişkisi, bir kümenin nicelenen bölümü veya önceki bütün önermeye yorum da ekleyebilir. Noktalama ve ilgecin yeri işlevi açığa çıkarır.`,
      kural: [
        [`whose`, `Kişi veya şey baş adla sahiplik/parça ilişkisi.`, `<em>a theory whose assumptions are disputed</em>`],
        [`of which`, `Özellikle resmî, cansız sahiplik/parça alternatifi.`, `<em>a device, the cost of which is high</em>`],
        [`preposition + whom/which`, `Resmî yapıda ilgeç öne alınır; that kullanılamaz ve zamir düşmez.`, `<em>the conditions under which it operates</em>`],
        [`stranded preposition`, `Daha az resmî biçimde ilgeç sonda kalabilir.`, `<em>the person (who) we spoke to</em>`],
        [`quantifier + of whom/which`, `Kümenin bir kısmını niceler; non-defining ve virgüllüdür.`, `<em>ten samples, three of which were damaged</em>`],
        [`sentential which`, `Önceki tek bir ada değil bütün önermeye yorum yapar.`, `<em>The rate fell sharply, which surprised analysts.</em>`]
      ],
      yol: [
        `Which/whom öğesinin öncülünün tek ad mı, bir küme mi, bütün önceki önerme mi olduğunu bulun.`,
        `Fiil/sıfat/adın istediği ilgeci belirleyin; resmî biçimde onu zamirin önüne taşıyabilirsiniz.`,
        `Quantifier relative'de sayı/miktar ile öncül kümenin uyumunu kontrol edin.`,
        `Virgülün yapının non-defining olduğunu ve zamirin düşürülemeyeceğini gösterdiğini kullanın.`
      ],
      tuzak: [
        `<em>under that</em> preposition-fronted relative'de olmaz; <em>under which</em>.`,
        `<em>three of them were damaged</em> bağımsız cümledir; relative bağ için <em>three of which</em>.`,
        `Sentential which'i en yakın ada bağlamak anlamı bozabilir.`,
        `Whose yalnız insanlarla sınırlı değildir; cansız/kurumsal baş adlarla doğal ve ekonomiktir.`
      ],
      tani: [
        `Birleştirin: The survey included 400 participants. Sixty of them withdrew.`,
        `Doldurun: The conditions ___ which the bacteria survive are poorly understood.`,
        `Öncülü belirleyin: The company withdrew the product, which reassured consumers.`
      ],
      cevap: [
        `<em>The survey included 400 participants, sixty of whom withdrew.</em> Nicelenen küme insanlardan oluşur.`,
        `<b>under</b>; yerleşik ilişki <em>survive under conditions</em> biçimindedir.`,
        `Which bütün “şirketin ürünü geri çekmesi” önermesine gönderir; tüketicileri rahatlatan olay budur.`
      ],
      kontrol: [`Relative öğenin gerçek öncülünü buldum.`, `İlgeç kalıbını ve resmî/sonda kullanımını kontrol ettim.`, `Küme niceliği ile sentential which yorumunu ayırdım.`]
    }),

    "T44": kayit({
      kod: `T44`, baslik: `Reduced relatives ve participle clauses`,
      ozet: `V-ing, V3, to-infinitive ve perfect participle kısaltmalarında özne, zaman ve çatı ilişkisini koruma`,
      ana: `Kısaltılmış yapıda bağlaç ve çekimli fiil görünmez ama anlam ilişkisi kaybolmaz. V-ing çoğunlukla etkin/eşzamanlı, V3 edilgen veya tamamlanmış durum, to-infinitive ise beklenti/sıra/amaç gibi ilişkiler kurar.`,
      kural: [
        [`V-ing relative`, `Etkin anlam: who/which + be veya etkin fiil kısalabilir.`, `<em>students living abroad</em>`],
        [`V3 relative`, `Edilgen/tamamlanmış anlam.`, `<em>data collected in 2024</em>`],
        [`to-infinitive relative`, `Yapılacak, ilk/son/tek veya uygunluk anlamı.`, `<em>the first team to arrive</em>`],
        [`participle clause`, `Ana cümle öznesiyle ortak özne ve zaman/mantık ilişkisi.`, `<em>Using a new method, the team reduced errors.</em>`],
        [`having + V3`, `Ana olaydan önce tamamlanan etkin eylem.`, `<em>Having checked the seal, she opened the box.</em>`],
        [`having been + V3`, `Önce tamamlanan edilgen eylem.`, `<em>Having been warned, they left.</em>`]
      ],
      yol: [
        `Kısaltılmış yapının gizli öznesini bulun ve ana cümle öznesi/baş adla eşleştirin.`,
        `Etkin mi edilgen mi olduğunu belirleyerek V-ing veya V3 seçin.`,
        `İki olay arasındaki eşzamanlılık/öncelik ilişkisini kurun; belirgin öncelikte having V3 gerekebilir.`,
        `Açılmış tam cümleyi zihinde yeniden kurup kaybolan bağlacın muhtemel anlamını test edin.`
      ],
      tuzak: [
        `Dangling modifier: <em>Using the new method, the error rate fell</em> cümlesinde yöntemi kullanan error rate olamaz.`,
        `V-ing her zaman continuous değildir; relative kısaltmada genel etkin niteleme olabilir.`,
        `V3 yalnız geçmiş zaman göstermez; temel işlevi çoğu yapıda edilgenlik/tamamlanmış durumdur.`,
        `Farklı özne varsa salt participle kısaltması yapılamaz; özne açık kalmalı veya with/absolute yapı kullanılmalıdır.`
      ],
      tani: [
        `Kısaltın: The samples that were stored at room temperature deteriorated.`,
        `Düzeltin: Having completed the survey, the report was submitted by the team.`,
        `Açın: Researchers using this database must cite the original source.`
      ],
      cevap: [
        `<em>The samples stored at room temperature deteriorated.</em> Relative passive be + V3, V3'e indirgenir.`,
        `<em>Having completed the survey, the team submitted the report.</em> Tamamlayan özne team olmalıdır.`,
        `<em>Researchers who use this database...</em> Using etkin relative clause kısaltmasıdır; araştırmacılar veritabanını kullanır.`
      ],
      kontrol: [`Gizli özneyi doğru baş ada bağladım.`, `Etkinlik/edilgenlik ve zaman sırasını korudum.`, `Dangling modifier oluşmadığını tam cümleyi açarak kontrol ettim.`]
    }),

    "T45": kayit({
      kod: `T45`, baslik: `Cümle anatomisi ve uzun yapı çözme`,
      ozet: `Finite fiil, clause sınırı, baş ad ve iç içe niteleyicileri bularak uzun YDS cümlesini katmanlara ayırma`,
      ana: `Uzun cümle çok fikir içerdiği için değil, bir ana omurgaya eklenen cümlecik ve öbekler yüzünden zor görünür. Önce çekimli ana fiili ve baş adları bulmak, ayrıntıyı geçici olarak paranteze almak gerekir.`,
      kural: [
        [`finite verb`, `Zaman/uyum/modal taşıyan fiil; her bağımsız/yan cümle çekirdeğinde bulunur.`, `<em>has changed, was measured, may decline</em>`],
        [`non-finite`, `to V1, V-ing, V3; tek başına ana yüklem değildir.`, `<em>to reduce, using, collected</em>`],
        [`clause marker`, `That, which, because, although, if gibi sınır işaretleri.`, `<em>although the rate fell</em>`],
        [`head noun`, `Uzun ad öbeğinin sayı ve temel anlamını taşıyan baş.`, `<em>the effects [of prolonged exposure]</em>`],
        [`modifier`, `Relative, participle, preposition veya apposition ile başı niteler.`, `<em>the data collected in June</em>`],
        [`ana omurga`, `Ana özne + ana finite fiil + zorunlu tamlayıcılar.`, `<em>The findings suggest a link.</em>`]
      ],
      yol: [
        `Noktalama ve bağlaçları işaretleyin; her finite fiili numaralandırın.`,
        `Ana cümle bağlaca/relative zamire bağlı olmayan finite fiili bulun.`,
        `Ana fiilin öznesine geri gidin ve aradaki modifier'ları paranteze alın.`,
        `Önce çıplak omurgayı çevirin; sonra relative, participle ve ilgeç öbeklerini ait oldukları başa ekleyin.`
      ],
      tuzak: [
        `İlk görülen fiil ana fiil olmayabilir; relative clause içinde bulunabilir.`,
        `V-ing veya V3 biçimini finite sanmak özne–yüklem eşleşmesini bozar.`,
        `Of öbeğindeki yakın ad yerine gerçek baş adla uyum kurun.`,
        `Cümleyi soldan sağa sözcük sözcük çevirmek, İngilizce modifier'ları Türkçede yanlış başa bağlayabilir.`
      ],
      tani: [
        `Omurgayı bulun: The rapid decline in bee populations observed across several regions has raised serious concerns.`,
        `Finite fiilleri sayın: Although the device was tested twice, engineers using the new protocol found that one sensor remained unstable.`,
        `Baş adı bulun: A series of experiments involving genetically modified crops was conducted.`
      ],
      cevap: [
        `<em>The decline has raised concerns.</em> Observed V3 modifier, in bee populations/of... türü ayrıntıdır.`,
        `Dört finite yapı vardır: <em>was tested</em>, <em>found</em>, <em>remained</em>; “using” non-finite'dir. Burada was tested tek finite zincir sayıldığından toplam üç clause finite çekirdeği vardır; yardımcı + lexical fiil ayrı sayılmaz.`,
        `Baş ad <b>series</b> olduğundan ana fiil tekil <em>was conducted</em> olur; experiments of öbeğinin içindedir.`
      ],
      kontrol: [`Yardımcı + ana fiili tek finite zincir olarak gördüm.`, `Ana omurgayı modifier'lardan ayırdım.`, `Her yan yapıyı doğru baş ada veya fiile yeniden bağladım.`]
    }),

    "T46": kayit({
      kod: `T46`, baslik: `Zaman, sıra ve eşzamanlılık bağlama`,
      ozet: `When, while, after, before, by the time ve participle yapılarıyla olayların zaman ilişkisini kurma`,
      ana: `Türkçe -erek, -ip, -meden, -ince ve -ken biçimleri İngilizcede bağlaçlı cümle, ilgeç + gerund veya participle clause olarak dağılır. Doğru seçim olayların öznesi, sırası ve örtüşme derecesine bağlıdır.`,
      kural: [
        [`when / while`, `When olay noktası veya dönem; while belirgin eşzamanlı süreç.`, `<em>While she was checking, the alarm sounded.</em>`],
        [`after / before`, `Olay sırasını açıkça kurar; clause veya -ing alabilir.`, `<em>After checking the seal, she opened it.</em>`],
        [`by the time`, `Bir referans noktasına gelindiğinde diğer olayın tamamlanmışlığını vurgular.`, `<em>By the time help arrived, they had left.</em>`],
        [`without + -ing`, `-meden / yapmaksızın.`, `<em>They left without signing the form.</em>`],
        [`on/upon + -ing`, `Resmî ve yakın ardışıklık: yapınca/yapar yapmaz.`, `<em>Upon receiving the file, we checked it.</em>`],
        [`participle reduction`, `Ortak özne varsa bağlaç + cümle kısalabilir.`, `<em>When exposed to heat, the material expands.</em>`]
      ],
      yol: [
        `Olayları zaman çizgisine koyun: önce, sonra, aynı anda veya biri diğerini keserken.`,
        `İki bölümün öznesini karşılaştırın; ortak değilse özneyi düşürmeyin.`,
        `Tamamlanma önceliği açıksa perfect yapıyı, yalnız sıra açıksa simple biçimi değerlendirin.`,
        `Bağlacın yapısal tamamlayıcısını kontrol edin: during + ad, while + cümle; before/after her ikisini de alabilir.`
      ],
      tuzak: [
        `While yalnız past continuous ile kullanılmaz; eşzamanlı iki simple durum/eylem de bağlayabilir.`,
        `By the time tek başına past perfect şifresi değildir; zaman çerçevesi gelecek de olabilir: <em>will have finished</em>.`,
        `Ortak özne yokken reduced clause dangling modifier üretir.`,
        `Türkçe -ip her zaman and ile çevrilmez; zaman, neden veya araç ilişkisi bağlama göre seçilir.`
      ],
      tani: [
        `Doldurun: ___ the samples were being transported, the temperature rose unexpectedly.`,
        `Kısaltın: After the team had completed the survey, it published the findings.`,
        `Doldurun: By the time the policy takes effect, many firms ___ their procedures. (revise)`
      ],
      cevap: [
        `<b>While</b>; taşıma süreci sırasında başka bir değişim gerçekleşir.`,
        `<em>Having completed the survey, the team published the findings.</em> Ortak özne ve öncelik korunur.`,
        `<em>will have revised</em>; gelecekteki referans noktasına kadar tamamlanma future perfect ile verilir.`
      ],
      kontrol: [`Olay sırasını ve örtüşmesini belirledim.`, `Kısaltmada ortak özneyi doğruladım.`, `Bağlaç ile zaman/görünüşü birbirinden bağımsız kanıtlar olarak kontrol ettim.`]
    }),

    "T47": kayit({
      kod: `T47`, baslik: `Neden, sonuç ve amaç matrisi`,
      ozet: `Clause, phrase ve cümle bağlayıcılarıyla neden–sonuç yönünü ve amaç ilişkisini kurma`,
      ana: `Neden, sonuç ve amaç aynı olayları farklı yönlerden bağlar. Bağlayıcının anlamı kadar ardından clause mu noun phrase mi aldığı ve noktalama düzeyi de doğru seçimi belirler.`,
      kural: [
        [`because + clause`, `Doğrudan neden; ardından özne + fiil.`, `<em>The trial stopped because funding ended.</em>`],
        [`because of / due to + noun phrase`, `Ad öbeğiyle neden. Due to geleneksel olarak be sonrası sıfat yapısında da kullanılır.`, `<em>because of a shortage; was due to a shortage</em>`],
        [`therefore/consequently`, `Sonuç cümlesine geçiş yapan conjunctive adverb; uygun noktalama ister.`, `<em>Funding ended; therefore, the trial stopped.</em>`],
        [`so + clause`, `Sonuç bağlacı.`, `<em>Funding ended, so the trial stopped.</em>`],
        [`to/in order to + V1`, `Aynı öznenin amacı.`, `<em>They left early to avoid traffic.</em>`],
        [`so that + clause`, `Farklı özne, modal veya açık sonuç/amaç cümleciği.`, `<em>They spoke slowly so that everyone could follow.</em>`]
      ],
      yol: [
        `İki bölüm arasındaki oku çizin: A, B'nin nedeni mi sonucu mu, yoksa B bilinçli amaç mı?`,
        `Boşluktan sonraki yapıyı clause/phrase/independent sentence olarak sınıflandırın.`,
        `Amaç yapısında amaçlanan eylemin mantıksal öznesini kontrol edin.`,
        `Noktalama ve bağlayıcı türünü birlikte değerlendirin; however/therefore doğrudan coordinating conjunction değildir.`
      ],
      tuzak: [
        `<em>because of the funding ended</em> yanlıştır; because + clause veya because of + noun phrase.`,
        `<em>Therefore the trial stopped</em> cümle başında virgül gerektirir; iki bağımsız cümleyi yalnız virgülle bağlamayın.`,
        `<em>For reducing costs</em> çoğu amaç bağlamında doğal değildir; <em>to reduce costs</em>.`,
        `So that sonuç da anlatabilir; öznenin niyeti ve modal biçim amaç okumasını güçlendirir.`
      ],
      tani: [
        `Doldurun: The flight was cancelled ___ dense fog.`,
        `Doldurun: The team duplicated the files ___ no data would be lost.`,
        `Yönü değiştirin: Because the sample was contaminated, the result was excluded. (therefore kullanın)`
      ],
      cevap: [
        `<em>because of/due to</em>; dense fog ad öbeğidir.`,
        `<em>so that</em>; ayrı özne no data ve amaçlanan sonuç için çekimli clause gerekir.`,
        `<em>The sample was contaminated; therefore, the result was excluded.</em> Neden ilk cümle, sonuç ikinci cümledir.`
      ],
      kontrol: [`Neden–sonuç yönünü doğru kurdum.`, `Bağlayıcının clause/phrase seçimini kontrol ettim.`, `Amaç öznesi ve cümleler arası noktalamayı doğruladım.`]
    }),

    "T48": kayit({
      kod: `T48`, baslik: `Karşıtlık ve taviz matrisi`,
      ozet: `Although, despite, however ve whereas yapılarını anlam ve sözdizimi düzeyine göre seçme`,
      ana: `Basit karşıtlık iki farklı olguyu yan yana koyar; taviz ise bir olguya rağmen beklenmedik sonucun gerçekleştiğini gösterir. İngilizce bağlayıcılar clause, phrase veya bağımsız cümle düzeyinde farklılaşır.`,
      kural: [
        [`although/even though + clause`, `Beklentiye aykırı taviz; even though daha vurgulu olabilir.`, `<em>Although costs rose, demand remained high.</em>`],
        [`despite/in spite of + phrase`, `Ad öbeği veya -ing ile taviz.`, `<em>Despite rising costs, demand remained high.</em>`],
        [`however/nevertheless`, `Yeni bağımsız cümlede karşıt/taviz sonucu; noktalama ister.`, `<em>Costs rose; however, demand remained high.</em>`],
        [`but/yet`, `İki eş yapıyı/cümleyi coordinating conjunction olarak bağlar.`, `<em>Costs rose, but demand remained high.</em>`],
        [`whereas/while`, `İki olgu arasında dengeli karşılaştırmalı karşıtlık.`, `<em>Urban demand rose, whereas rural demand fell.</em>`],
        [`despite the fact that`, `Despite sonrası clause'u the fact that aracılığıyla kurar.`, `<em>Despite the fact that costs rose...</em>`]
      ],
      yol: [
        `İlişkinin taviz mi yalnız karşılaştırmalı karşıtlık mı olduğunu belirleyin.`,
        `Boşluktan sonraki bölümün clause, noun/-ing phrase veya bağımsız cümle olduğunu bulun.`,
        `Bağlayıcının noktalama davranışını kontrol edin.`,
        `Restatement'te although ↔ despite dönüşümünde clause'u noun/gerund biçimine dönüştürürken özne ve zamanı koruyun.`
      ],
      tuzak: [
        `<em>Despite costs rose</em> yanlıştır; <em>although costs rose</em> veya <em>despite rising costs</em>.`,
        `<em>Although ... but</em> aynı ilişkide iki bağlayıcıyı birlikte gereksiz kullanır.`,
        `However, although gibi yan cümle başlatmaz; bağımsız cümle bağlayıcısıdır.`,
        `While zaman anlamı da taşır; karşıtlık okumasını iki bölümün paralel içeriği desteklemelidir.`
      ],
      tani: [
        `Doldurun: ___ several methodological limitations, the study offers useful evidence.`,
        `Dönüştürün: Although the drug was effective, it caused severe side effects. (despite kullanın)`,
        `Noktalamayı düzeltin: The first method is cheap, however it is unreliable.`
      ],
      cevap: [
        `<b>Despite/In spite of</b>; ardından ad öbeği gelir.`,
        `<em>Despite being effective / Despite its effectiveness, the drug caused severe side effects.</em> Clause phrase'e dönüştürülür.`,
        `<em>The first method is cheap; however, it is unreliable.</em> Alternatif olarak nokta kullanılabilir.`
      ],
      kontrol: [`Taviz ile nötr karşıtlığı ayırdım.`, `Clause/phrase/cümle düzeyine uygun bağlayıcı seçtim.`, `Dönüşümde anlamı ve noktalamayı korudum.`]
    }),

    "T49": kayit({
      kod: `T49`, baslik: `Koşul, önlem ve istisna`,
      ozet: `Koşulun gerçeklik derecesini, önlem anlamını ve istisna sınırını doğru bağlayıcıyla kurma`,
      ana: `Koşul yapıları yalnızca if cümlelerinden ibaret değildir. Bir olayın hangi şartta gerçekleşeceğini, hangi ihtimale karşı önlem alındığını veya genel kuralın nerede sona erdiğini ayırmak gerekir. Zaman biçimi de mekanik bir formülden çok konuşanın olasılığa bakışını gösterir.`,
      kural: [
        [`if / unless`, `If koşulu kurar; unless çoğu bağlamda “if ... not” anlamındadır, fakat ek bir olumsuzlukla otomatik olarak kullanılmaz.`, `<em>If demand falls, production will slow. Unless demand recovers, production will slow.</em>`],
        [`provided/providing that; as long as`, `Gerekli şartı vurgular: “şu koşulla”. As long as süre anlamı da taşıyabilir.`, `<em>You may use the data provided that you cite the source.</em>`],
        [`in case + clause`, `Bir ihtimal gerçekleşmeden önce ona karşı alınan önlemi anlatır; doğrudan if ile eş anlamlı değildir.`, `<em>Save a copy in case the server fails.</em>`],
        [`otherwise / or else`, `Önceki şart karşılanmazsa doğacak sonucu bağımsız cümle düzeyinde verir.`, `<em>Submit the form today; otherwise, your application may be delayed.</em>`],
        [`gerçek / varsayımsal koşul`, `Present + will olası geleceği; past + would varsayımsal veya uzak görülen durumu; past perfect + would have geçmiş karşı-olguyu kurabilir.`, `<em>If the sample were larger, the estimate would be more precise.</em>`],
        [`except (for), apart from, rather than`, `Genel kümeyi sınırlayan istisna veya iki seçenek arasında tercih kurar; sözdizimleri aynı değildir.`, `<em>All sections were complete except for the appendix.</em>`]
      ],
      yol: [
        `Önce ilişkiyi adlandırın: gerçekleşme şartı mı, olası tehlikeye karşı önlem mi, yoksa genel ifadeden çıkarılan istisna mı?`,
        `Koşulun zamanını ve gerçeklik derecesini bağlamdan belirleyin; yalnız fiil biçimine bakarak “imkânsız” sonucu çıkarmayın.`,
        `Unless seçeneğinde cümlede zaten never, no veya not bulunup bulunmadığını kontrol edin; istemeden çift olumsuz anlam kurmayın.`,
        `Bağlayıcının ardından clause mu noun phrase mi geldiğini ve otherwise gibi cümle bağlayıcılarında noktalamayı denetleyin.`
      ],
      tuzak: [
        `<em>Take an umbrella if it rains</em> yağmur gerçekleşince eylemi önerir; <em>in case it rains</em> ise yağmur ihtimaline karşı şimdiden önlem aldırır.`,
        `Unless her zaman kelimesi kelimesine if not dönüşmez; yalnız istisna veya olumlu şart anlamının doğal kaldığı bağlamlarda dönüştürün.`,
        `If yan cümlesinde gelecek anlamı çoğu kez present ile verilir; ancak will istek, ısrar veya öngörülen sonuç gibi özel anlamlarla görülebilir.`,
        `Except ile besides karıştırılmamalıdır: except kümeden çıkarır, besides çoğu kullanımda ekleme yapar.`
      ],
      tani: [
        `Doldurun: Keep the receipt ___ you need to return the device later. (if / in case)`,
        `Anlamı koruyun: If the password is not changed, the account will remain vulnerable. (unless kullanın)`,
        `Doldurun: The findings would have been more reliable if the researchers ___ a control group. (include)`
      ],
      cevap: [
        `<b>in case</b>; iade ihtimaline karşı makbuz önceden saklanır. If, ihtiyaç kesinleştiğinde saklama gibi mantıksız bir zaman sırası doğurabilir.`,
        `<em>Unless the password is changed, the account will remain vulnerable.</em> Olumsuz şart olumlu biçimli unless yan cümlesine dönüşür.`,
        `<em>had included</em>; geçmişte gerçekleşmemiş bir koşulun geçmiş sonucu değerlendirildiği için past perfect uygundur.`
      ],
      kontrol: [`Koşul, önlem ve istisna anlamlarını ayırdım.`, `Gerçeklik derecesini bağlamla birlikte okudum.`, `Unless olumsuzluğunu, clause/phrase yapısını ve noktalamayı doğruladım.`]
    }),

    "T50": kayit({
      kod: `T50`, baslik: `Ekleme, örnekleme ve yeniden ifade`,
      ozet: `Bilgiyi genişleten, somutlaştıran ve başka sözlerle açıklayan bağlayıcıları işlevine göre seçme`,
      ana: `Moreover, for example ve in other words aynı boşluğa sığabilecek görünse de metinde farklı işler yapar: ilki yeni ve uyumlu bir gerekçe ekler, ikincisi genel yargıyı örnekler, üçüncüsü önceki anlamı yeniden kurar. Doğru seçenek iki cümle arasındaki bilgi hareketini korur.`,
      kural: [
        [`moreover / furthermore / in addition`, `Önceki düşünceyi aynı yönde yeni bilgiyle güçlendirir; çoğunlukla cümle bağlayıcısıdır.`, `<em>The method is inexpensive; moreover, it is easy to replicate.</em>`],
        [`also / as well as / besides`, `Ekleme yapar; cümledeki yeri ve bağladığı birimin türü farklılaşır.`, `<em>The survey measured income as well as education.</em>`],
        [`for example / for instance`, `Genel yargının bir veya birkaç örneğini sunar; örnek tüm kümeyi tüketmek zorunda değildir.`, `<em>Some metals, for example copper, conduct heat efficiently.</em>`],
        [`namely / that is`, `Önceki genel veya kapalı ifadeyi belirginleştirir; verilen öğeler çoğu kez kastedilen içeriği tanımlar.`, `<em>One variable was omitted, namely age.</em>`],
        [`in other words / that is to say`, `Aynı önermeyi daha açık, kısa veya farklı kavramlarla yeniden ifade eder.`, `<em>The treatment had no measurable effect; in other words, it did not outperform the placebo.</em>`],
        [`such as`, `Bir ad kümesinin içine örnekleri phrase düzeyinde yerleştirir.`, `<em>Renewable sources such as wind and solar power...</em>`]
      ],
      yol: [
        `İkinci bölümün yeni bir kanıt mı, öncekinin alt örneği mi, yoksa aynı önermenin açıklaması mı olduğunu sorun.`,
        `Genel–özel yönünü izleyin: kategori → üye ilişkisi örneklemeyi; kapalı ifade → tam içerik ilişkisi namely yapısını destekler.`,
        `Bağlayıcının cümle içindeki dil bilgisel yerini denetleyin; such as bağımsız iki cümleyi tek başına bağlamaz.`,
        `Noktalama işaretlerini işlevin kanıtı olarak kullanın fakat yalnız virgüle dayanmayın; anlam ilişkisi önceliklidir.`
      ],
      tuzak: [
        `For example ile namely eş anlamlı değildir: örnekleme açık bir kümeden bazı üyeleri, namely ise kastedilen belirli içeriği verir.`,
        `Besides bazı bağlamlarda “bunun dışında/üstelik”, apart from ise ekleme veya istisna anlamı taşıyabilir; çevredeki yönü okuyun.`,
        `<em>Such as</em> sonrasında tam çekimli cümle kurmak çoğunlukla uygun değildir; ad veya ad öbeği beklenir.`,
        `In other words önceki cümleyle çelişmemeli; biçim değişse bile kiplik, kapsam ve temel sonuç korunmalıdır.`
      ],
      tani: [
        `Doldurun: The region relies on two crops, ___ wheat and barley. (for example / namely)`,
        `İlişkiyi bulun: The device is portable. Moreover, it consumes very little power. İkinci cümle örnek mi, ek gerekçe mi?`,
        `Doldurun: Several factors, ___ poor nutrition and chronic stress, can impair memory. (such as / in other words)`
      ],
      cevap: [
        `<b>namely</b>; “two crops” ifadesinin hangi iki ürünü kapsadığı tam olarak belirtilir.`,
        `Bir <b>ek gerekçedir</b>. Taşınabilirlik açıklanıp yeniden söylenmiyor; cihazın yararını destekleyen ikinci bir özellik ekleniyor.`,
        `<b>such as</b>; genel factors kümesinden örnek ad öbekleri verilir.`
      ],
      kontrol: [`Ekleme, örnekleme ve yeniden ifadeyi işlev bakımından ayırdım.`, `Genel–özel bilgi yönünü izledim.`, `Bağlayıcının sözdizimini ve noktalamasını kontrol ettim.`]
    }),

    "T51": kayit({
      kod: `T51`, baslik: `Karşılaştırma, derece ve orantı`,
      ozet: `Eşitlik, üstünlük, fark derecesi ve birlikte değişim yapılarını doğru ölçekte yorumlama`,
      ana: `Karşılaştırma yalnız -er/more seçimi değildir. Hangi iki ölçünün karşılaştırıldığı, farkın ne kadar olduğu ve değişkenlerin birlikte nasıl hareket ettiği belirlenmelidir. Sayısal kat ifadelerinde de biçim kadar ölçümün anlamı önemlidir.`,
      kural: [
        [`comparative + than`, `İki öğe veya ölçü arasında fark kurar; kısa sıfatlarda -er, birçok uzun sıfatta more kullanılır.`, `<em>The revised model is more accurate than the original.</em>`],
        [`as + adjective/adverb + as`, `Eşitlik; not as/so ... as daha düşük dereceyi anlatır.`, `<em>The second test was not as reliable as the first.</em>`],
        [`much/far/a great deal; slightly/a little`, `Karşılaştırma farkının büyük ya da küçük olduğunu belirtir.`, `<em>far more effective; slightly less costly</em>`],
        [`the + comparative, the + comparative`, `İki değişkenin birlikte değişimini gösterir; doğrudan nedensellik kanıtlamak zorunda değildir.`, `<em>The longer the delay, the greater the risk.</em>`],
        [`twice/three times as ... as`, `Bir ölçünün diğerinin katı olduğunu açık biçimde verir.`, `<em>The new tank is twice as large as the old one.</em>`],
        [`superlative / one of the + superlative`, `Belirli kümede en yüksek derece; one of the sonrasında çoğul ad gelir.`, `<em>one of the most influential studies</em>`]
      ],
      yol: [
        `Karşılaştırılan iki öğeyi ve ortak ölçütü açıkça yazın; eksiltilmiş than/as bölümünü bağlamdan tamamlayın.`,
        `Boşluğun comparative, equality, superlative veya proportional change istediğini belirleyin.`,
        `Derece belirtecini hedef sıfata göre seçin: very comparative ile değil, much/far/slightly gibi öğelerle kullanılır.`,
        `Sayı içeren ifadede “kaç katı” ile “yüzde kaç daha fazla”yı karıştırmayın; twice as much, başlangıç değerinin yüzde yüz fazlasıdır.`
      ],
      tuzak: [
        `<em>more easier</em> standart yapıda çift işaretlemedir; <em>easier</em> yeterlidir.`,
        `<em>One of the most important factor</em> yanlıştır; küme çoğuldur: <em>factors</em>.`,
        `The more ..., the more ... yapısı korelasyon bildirir; bağlam ayrıca kanıtlamıyorsa kesin neden–sonuç yüklemeyin.`,
        `Than sonrasındaki zamir biçimi kayıt düzeyine göre değişebilir; ölçünlü tam yapı <em>than I am/do</em>, konuşma dilinde <em>than me</em> görülebilir.`
      ],
      tani: [
        `Doldurun: The updated sensor is ___ more sensitive than its predecessor. (very / far)`,
        `Düzeltin: This is one of the most comprehensive report on urban migration.`,
        `Yeniden yazın: When exposure increases, the likelihood of infection also increases. (the ... the yapısı)`
      ],
      cevap: [
        `<b>far</b>; comparative more sensitive büyük fark bildiren far ile derecelenir.`,
        `<em>This is one of the most comprehensive reports on urban migration.</em> One of the, çoğul bir kümeden tek üye seçer.`,
        `<em>The greater the exposure, the higher the likelihood of infection.</em> İki dereceli değişkenin birlikte artışı korunur.`
      ],
      kontrol: [`Karşılaştırılan öğeleri ve ölçütü belirledim.`, `Derece belirtecini doğru biçimle eşleştirdim.`, `Kat, yüzde ve orantılı değişim anlamlarını karıştırmadım.`]
    }),

    "T52": kayit({
      kod: `T52`, baslik: `Sözcük dizilişi, vurgu ve devriklik`,
      ozet: `İngilizce temel dizilişi korurken odak, olumsuz devriklik, koşul devrikliği ve bilgi ağırlığını çözme`,
      ana: `Türkçede ekler ve esnek diziliş birçok ilişkiyi taşırken İngilizcede özne–fiil–nesne sırası daha belirleyicidir. Devrik yapı rastgele yer değiştirme değil, belirli bir tetikleyiciyle yardımcı fiilin öznenin önüne alınmasıdır; vurgu yapıları da temel önermeyi değiştirmeden odağı taşır.`,
      kural: [
        [`temel S–V–O düzeni`, `Özne, çekimli fiil ve nesne İngilizce bildirme cümlesinin omurgasını kurar.`, `<em>The committee approved the proposal.</em>`],
        [`zarf konumu`, `Sıklık zarfları çoğunlukla ana fiilden önce, be fiilinden sonra; biçim ve odakla başka konumlar da mümkündür.`, `<em>The system rarely fails; it is usually stable.</em>`],
        [`negative-fronting inversion`, `Never, rarely, only then, not until gibi sınırlayıcı öğeler başa geldiğinde uygun yardımcı + özne + ana fiil düzeni kurulur.`, `<em>Rarely have researchers observed such rapid change.</em>`],
        [`koşul devrikliği`, `Had, were ve should belirli if yapılarında if düşürülerek başa alınabilir.`, `<em>Had the warning arrived earlier, the damage might have been prevented.</em>`],
        [`cleft yapıları`, `It is/was ... that/who veya What ... is ... ile bir öğe odaklanır.`, `<em>It was the dosage, not the drug, that caused the reaction.</em>`],
        [`end-weight / extraposition`, `Uzun ve karmaşık öğe sona taşınarak işlemleme kolaylaştırılır.`, `<em>It is clear that further evidence is needed.</em>`]
      ],
      yol: [
        `Önce cümlenin normal dizilişteki çekirdeğini bulun; vurgu ve devrikliği bu çekirdeğin üzerine çözün.`,
        `Başa alınmış olumsuz/sınırlayıcı ifade tüm cümleyi etkiliyor mu kontrol edin; etkiliyorsa zaman ve özneye uygun yardımcıyı belirleyin.`,
        `Cümlede zaten be veya modal varsa onu öznenin önüne alın; yoksa uygun do desteğini kullanın.`,
        `Cleft yapısında odaklanan parçayı çıkarıp temel önermeyi yeniden kurarak anlamın korunup korunmadığını sınayın.`
      ],
      tuzak: [
        `Devriklik her zaman “yardımcı + özne + V1” değildir: <em>Never was the effect so clear</em> yapısında be; <em>Rarely has it been tested</em> yapısında perfect passive zinciri korunur.`,
        `Only if/when yan cümlesi başa geldiğinde devriklik çoğunlukla ana cümlede olur: <em>Only if costs fall will demand recover.</em>`,
        `Not until başa geldiğinde yan cümleyi değil ana cümleyi devrik kurmak gerekir.`,
        `Türkçe vurgu sırasını kelimesi kelimesine İngilizceye taşımak özne–nesne ilişkisini değiştirebilir.`
      ],
      tani: [
        `Düzeltin: Rarely researchers encounter such a complete dataset.`,
        `If'li biçime çevirin: Had the sample been larger, the result would have been clearer.`,
        `Odağı “funding” olacak biçimde yeniden yazın: Lack of funding delayed the project. (it-cleft)`
      ],
      cevap: [
        `<em>Rarely do researchers encounter such a complete dataset.</em> Simple present ana fiili için do desteği gerekir.`,
        `<em>If the sample had been larger, the result would have been clearer.</em> Had devrikliği çözülürken past perfect korunur.`,
        `<em>It was lack of funding that delayed the project.</em> Temel önerme aynı kalırken neden öğesi odaklanır.`
      ],
      kontrol: [`Cümlenin normal S–V–O çekirdeğini kurdum.`, `Devrikliği tetikleyen öğeyi ve doğru yardımcıyı buldum.`, `Vurgu değişirken temel önermenin korunmasını denetledim.`]
    }),

    "T53": kayit({
      kod: `T53`, baslik: `Gönderim, substitution ve lexical chains`,
      ozet: `Adıl, işaret sözcüğü, yerine koyma ve anlam zincirleriyle metin içi bağlantıyı izleme`,
      ana: `Bir metindeki it, this, such, one veya do so yalnız sözcük tekrarı önlemez; okurun hangi varlığa, olaya ya da önermeye dönmesi gerektiğini işaretler. Gönderim çözülürken dil bilgisel uyum, anlam uygunluğu ve metindeki odak birlikte kontrol edilmelidir.`,
      kural: [
        [`personal/demonstrative reference`, `It/they ad öbeğine; this/that tek bir ada veya önceki bütün önermeye dönebilir.`, `<em>The road was closed. This caused long delays.</em>`],
        [`such + noun / such`, `Önce tanımlanan tür veya niteliği yeniden çağırır.`, `<em>Such measures may reduce emissions.</em>`],
        [`one/ones`, `Sayılabilir adın yerine geçer ve yeni belirleyici/sıfat alabilir.`, `<em>The rural clinics were smaller than the urban ones.</em>`],
        [`do so / do it / do that`, `Önceki eylem veya eylem öbeğini farklı odaklarla tekrarlar; do so daha biçimsel olabilir.`, `<em>Some firms reduced waste, while others failed to do so.</em>`],
        [`former/latter`, `Açıkça sunulan iki adayın sırasıyla birincisine ve ikincisine gönderir.`, `<em>Heat and humidity were measured; the latter varied more.</em>`],
        [`lexical chain`, `Aynı konu; tekrar, eş anlam, üst–alt kavram veya ilişkili terimlerle sürdürülür.`, `<em>vehicle → car → engine → transport</em>`]
      ],
      yol: [
        `Gönderim öğesinin sayı, canlılık ve dil bilgisel rol özelliklerini çıkarın.`,
        `Geriye doğru yalnız en yakın adı değil, anlamca uygun ve metinde hâlen odakta olan adayı arayın.`,
        `This/that bir bütün önermeye dönüyorsa onu kısa bir cümleyle adlandırın; örneğin “the closure caused delays”.`,
        `Paragraf sıralama ve ilgisiz cümlede ana konu zincirini çıkarın; zinciri açıklamasız koparan cümle şüphelidir.`
      ],
      tuzak: [
        `En yakın ad her zaman doğru öncül değildir; sayı uyumu tek başına anlam uyumunu garanti etmez.`,
        `One/ones çoğunlukla sayılabilir ad yerine geçer; sayılamayan information için <em>the new one</em> denmez, uygun biçimde <em>the new information</em> denir.`,
        `Former/latter ikiden uzun listelerde belirsizlik yaratır; YDS'de açık iki üyeyi arayın.`,
        `Lexical chain yalnız birebir tekrar değildir; process, procedure ve method gibi ilişkili ama tam eş anlamlı olmayan sözcüklerin bağlamdaki rollerini ayırın.`
      ],
      tani: [
        `Gönderimi bulun: The glacier has retreated rapidly. This has altered the flow of nearby rivers. “This” neye döner?`,
        `Doldurun: Some participants completed the second survey, but many did not ___.`,
        `Çözün: Solar and wind energy were compared. The latter proved more consistent at night. Hangi kaynak kastedilir?`
      ],
      cevap: [
        `<b>Buzulun hızla geri çekilmesi</b> önermesine döner; yalnız glacier adına dönmek neden–sonuç ilişkisini eksik bırakır.`,
        `<b>do so</b>; “complete the second survey” eylem öbeğinin yerini tutar.`,
        `<b>Wind energy</b>; latter açıkça sıralanan iki öğeden ikincisini gösterir.`
      ],
      kontrol: [`Gönderim öğesinin biçimsel özelliklerini çıkardım.`, `Öncülü hem dil bilgisi hem anlamla doğruladım.`, `Paragrafın lexical chain ve odak sürekliliğini izledim.`]
    }),

    "T54": kayit({
      kod: `T54`, baslik: `Koşutluk ve bağlanan öğe eşitliği`,
      ozet: `Bağlaçların iki yanında aynı dil bilgisel düzeyi ve dengeli anlam yapısını koruma`,
      ana: `And, or ve ikili bağlaçlar yalnız iki anlamı değil iki yapıyı da bağlar. Okur, ilk öğenin biçiminden sonra aynı düzeyde bir devam bekler. Koşutluk; adın adla, fiilin fiille ve clause'un clause'la bağlanmasını, ayrıca ortak öğelerin doğru paylaşılmasını gerektirir.`,
      kural: [
        [`noun + noun`, `Aynı cümle rolündeki ad veya ad öbekleri bağlanır.`, `<em>The policy improved access and service quality.</em>`],
        [`verb + verb`, `Ortak özne ve yardımcı altında eş fiil biçimleri kurulur.`, `<em>The device records and transmits data.</em>`],
        [`clause + clause`, `Her iki bölümde karşılaştırılabilir önerme yapısı bulunur.`, `<em>The first model predicts demand, whereas the second estimates cost.</em>`],
        [`both ... and; either ... or`, `Bağlaç parçaları bağlanan öğelerin hemen önünde ve dengeli konumda tutulur.`, `<em>The course develops both accuracy and fluency.</em>`],
        [`not only ... but also`, `Ekleme ve vurgu kurar; cümle başındaki not only devriklik tetikleyebilir.`, `<em>Not only did costs fall, but efficiency also improved.</em>`],
        [`uyum ve yakınlık`, `Bağlı öznelerde fiil uyumu bağlaca ve yapıya göre değişir; either...or ile yakın öğe ölçünlü seçimde etkili olabilir.`, `<em>Either the manager or the assistants are attending.</em>`]
      ],
      yol: [
        `Bağlacın solunda ve sağında tam olarak hangi öğelerin bağlandığını köşeli parantezle ayırın.`,
        `Her öğenin cümledeki rolünü ve biçimini karşılaştırın: noun phrase, infinitive, gerund veya finite clause.`,
        `Ortak yardımcı, ilgeç veya belirleyicinin iki öğeye de mantıksal olarak uygulanıp uygulanmadığını kontrol edin.`,
        `İkili bağlaçlarda both/either/not only parçalarını, bağlanacak eş öğelerin hemen önüne taşıyın.`
      ],
      tuzak: [
        `<em>The study aims to identify risks and reducing costs</em> biçimce dengesizdir; <em>to identify ... and reduce ...</em> gerekir.`,
        `Koşut görünen iki öğe aynı anlam rolünde olmayabilir; karşılaştırmanın gerçekten benzer ölçütleri eşleştirdiğini denetleyin.`,
        `Not only cümle ortasındaysa otomatik devriklik gerekmez: <em>The policy not only reduced costs but also improved access.</em>`,
        `Either...or özne uyumunda tek bir evrensel kullanım varsaymayın; YDS için yakın özneyle uyum güvenli olsa da özellikle karma sayılarda cümleyi yeniden kurmak daha doğal olabilir.`
      ],
      tani: [
        `Düzeltin: The programme seeks to reduce poverty and improving access to education.`,
        `Dengeli yerleştirin: The treatment not only reduced pain but also the recovery period was shortened.`,
        `Doldurun: Either the technicians or the supervisor ___ responsible for the final inspection. (be)`
      ],
      cevap: [
        `<em>The programme seeks to reduce poverty and improve access to education.</em> İki yalın fiil ortak to altında bağlanır.`,
        `<em>The treatment not only reduced pain but also shortened the recovery period.</em> İki eş geçişli fiil öbeği kurulur.`,
        `<em>is</em>; fiile en yakın özne supervisor tekildir. Biçem kaygısı varsa <em>The supervisor or the technicians are...</em> gibi yeniden düzenleme de düşünülebilir.`
      ],
      kontrol: [`Bağlanan öğelerin sınırlarını çizdim.`, `Dil bilgisel tür ve anlam rolü bakımından dengeyi kurdum.`, `İkili bağlaçların konumunu ve özne–yüklem uyumunu doğruladım.`]
    }),

    "T55": kayit({
      kod: `T55`, baslik: `Sözcük yapımı ve tür değişimi`,
      ozet: `Kök, ön ek ve son ek ipuçlarıyla gereken sözcük türünü ve bağlama uygun biçimi seçme`,
      ana: `Word formation sorularında önce kökün anlamını değil boşluğun cümlede üstleneceği görevi bulmak gerekir. Ekler güçlü ipuçları verir fakat mekanik değildir: aynı ek birden fazla işlev taşıyabilir, yazım değişebilir ve üretilen her olası biçim gerçek kullanımda yerleşik olmayabilir.`,
      kural: [
        [`noun suffixes`, `-tion/-sion, -ment, -ity, -ness gibi ekler sıkça ad üretir.`, `<em>regulate → regulation; stable → stability</em>`],
        [`adjective suffixes`, `-al, -ive, -ous, -able/-ible, -less gibi ekler sıfat üretmeye eğilimlidir.`, `<em>benefit → beneficial; rely → reliable</em>`],
        [`adverbial -ly`, `Birçok sıfattan zarf üretir; friendly, likely, costly gibi -ly biçimleri sıfat olabilir.`, `<em>respond rapidly; a likely outcome</em>`],
        [`verb-forming suffixes`, `-ize/-ise, -ify, -en gibi ekler eylem oluşturabilir.`, `<em>modernize; clarify; strengthen</em>`],
        [`negative/reversative prefixes`, `un-, in-/im-/il-/ir-, dis-, de- farklı olumsuzluk veya tersine çevirme anlamları kurar.`, `<em>inaccurate; disconnect; decentralize</em>`],
        [`yazım ve kök değişimi`, `Ek geldiğinde harf düşmesi/değişmesi veya farklı kök görülebilir.`, `<em>pronounce → pronunciation; strong → strength</em>`]
      ],
      yol: [
        `Boşluğun önündeki belirleyici, yardımcı fiil, derece sözcüğü ve ardından gelen adı inceleyerek gereken türü belirleyin.`,
        `Cümlenin olumlu mu olumsuz mu anlam istediğini bulun; yalnız sözcük türünü doğru yapmak yetmez.`,
        `Kökten mümkün biçimleri üretip eşdizim ve akademik kullanım açısından sınayın.`,
        `Eklenmiş sözcüğü cümleye yerleştirerek özne–yüklem uyumu, çoğulluk ve zarf/sıfat konumunu son kez kontrol edin.`
      ],
      tuzak: [
        `-ly gördüğünüz her sözcüğü zarf saymayın: <em>a costly error</em> ifadesinde costly sıfattır.`,
        `Olumsuz ön ekler serbestçe değiştirilemez; <em>inpossible</em> değil <em>impossible</em>, <em>unlegal</em> yerine çoğunlukla <em>illegal</em> kullanılır.`,
        `İki biçim de sözlükte bulunabilir fakat anlam ayrışabilir: economic “ekonomiyle ilgili/ekonomik”, economical “tutumlu”.`,
        `Türkçedeki tek bir yapım eki İngilizcede aynı türle karşılanmayabilir; bütün cümledeki sözdizimsel yuvayı esas alın.`
      ],
      tani: [
        `Doldurun: The new procedure significantly improved the ___ of the measurements. (accurate)`,
        `Doldurun: The two explanations are not mutually ___. (exclude)`,
        `Türü bulun: The intervention was surprisingly cost-effective. “surprisingly” ve “cost-effective” hangi görevlerde?`
      ],
      cevap: [
        `<b>accuracy</b>; the ve of öbeği arasında ad gerekir, anlam ölçümlerin doğruluğudur.`,
        `<b>exclusive</b>; be sonrası özneyi niteleyen sıfat gerekir. Mutually ise bu sıfatı derecelendiren zarftır.`,
        `<em>Surprisingly</em> zarf olarak cost-effective değerlendirmesini niteler; <em>cost-effective</em> ise intervention hakkında yüklem sıfatıdır.`
      ],
      kontrol: [`Boşluğun istediği sözcük türünü sözdiziminden çıkardım.`, `Olumlu–olumsuz anlamı ve doğru eki kontrol ettim.`, `Üretilen biçimin gerçek eşdizim ve yazımını doğruladım.`]
    }),

    "T56": kayit({
      kod: `T56`, baslik: `Türkçe sözcüğün İngilizcede ayrışması`,
      ozet: `Türkçede tek başlık altında toplanan anlamları İngilizcede bağlam, yapı ve eşdizime göre ayırma`,
      ana: `İki dil sözcük dağarcığını aynı sınırlarda bölmez. Türkçedeki “bilmek”, “söylemek”, “iş”, “artmak” veya “büyük” gibi tek sözcükler İngilizcede nesnenin türüne, eylemin yönüne ve kullanım alanına göre farklı karşılıklar ister. Çeviride doğru soru “Bu sözcüğün karşılığı ne?” değil “Bu bağlamda hangi anlam gerçekleşiyor?” olmalıdır.`,
      kural: [
        [`bilmek: know / know how / can`, `Olgu veya kişiyi know; yöntem bilgisini know how to; beceriyi bağlama göre can/be able to anlatabilir.`, `<em>She knows the answer; she knows how to swim; she can swim.</em>`],
        [`söylemek: say / tell`, `Say söylenen içeriğe, tell çoğunlukla kişiye yönelir; kalıpları farklıdır.`, `<em>He said that it was late; he told us that it was late.</em>`],
        [`iş: work / job / task`, `Work genellikle sayılamayan faaliyet; job görev/istihdam olarak sayılabilir; task belirli iş parçasıdır.`, `<em>She found a job and completed three tasks at work.</em>`],
        [`artmak: rise / raise / increase`, `Rise geçişsiz; raise geçişli; increase her iki yapıda da kullanılabilir.`, `<em>Prices rose; the firm raised prices; costs increased.</em>`],
        [`büyük: big / large / great / major`, `Fiziksel boyut, miktar, önem ve değerlendirme farklı eşdizimler kurar.`, `<em>a large sample; a major problem; a great achievement</em>`],
        [`yapmak: do / make / özgül fiil`, `Do faaliyet, make üretim/sonuç kalıplarında görülür; akademik dil çoğu kez conduct, carry out, cause gibi özgül fiil ister.`, `<em>conduct research; make a decision; do an experiment</em>`]
      ],
      yol: [
        `Türkçe sözcüğün cümledeki somut anlamını açın: faaliyet mi ürün mü, bilgi mi beceri mi, kendiliğinden değişim mi ettirme mi?`,
        `İngilizce adayın nesne yapısını kontrol edin; say ve tell ayrımında olduğu gibi doğru anlam yanlış valency ile kullanılamaz.`,
        `Yakındaki adlarla yerleşik eşdizimi sınayın: strong evidence, heavy rain, major concern gibi birliktelikler sözlük anlamından daha belirleyici olabilir.`,
        `Kayıt düzeyini ve soru türünü gözetin; günlük bir karşılık dil bilgisel olsa bile akademik metinde daha özgül fiil gerekebilir.`
      ],
      tuzak: [
        `<em>He told that...</em> çoğunlukla eksiktir; tell bir kişi nesnesi ister: <em>He told me that...</em>`,
        `<em>Researches</em> genel faaliyet anlamında kullanılmaz; research sayılamayandır, tek tek çalışmalar <em>studies</em> olabilir.`,
        `<em>The government rose taxes</em> yanlıştır; hükümet vergileri yükselttiği için geçişli <em>raised</em> gerekir.`,
        `Sözlükte ilk verilen karşılığı her bağlama taşımayın; <em>great amount</em> yerine çoğu nötr nicelik bağlamında <em>large amount</em> daha doğaldır.`
      ],
      tani: [
        `Doldurun: The central bank ___ interest rates in response to inflation. (rose / raised)`,
        `Doldurun: The researcher ___ the participants that their responses would remain anonymous. (said / told)`,
        `En doğal eşdizimi seçin: a big / large / great amount of evidence.`
      ],
      cevap: [
        `<b>raised</b>; banka değişimin faili ve interest rates doğrudan nesnedir.`,
        `<b>told</b>; participants kişi nesnesidir ve ardından that-clause gelir. Say kullanılsaydı <em>said to the participants</em> gerekirdi.`,
        `<b>a large amount of evidence</b>; sayılamayan miktarı akademik ve nötr biçimde large amount karşılar.`
      ],
      kontrol: [`Türkçe sözcüğün bağlamsal anlamını açtım.`, `İngilizce adayın nesne yapısı ve sayılabilirliğini kontrol ettim.`, `Eşdizim ile akademik kayıt düzeyini doğruladım.`]
    }),

    "T57": kayit({
      kod: `T57`, baslik: `Akademik kayıt ve uzun cümle anlamı`,
      ozet: `Akademik metinde bilgi yoğunluğunu, ihtiyatlı iddiayı ve uzun cümlenin önerme yapısını çözme`,
      ana: `Akademik dil yalnız “zor sözcük” demek değildir. Bilgiyi adlaştırarak paketleyebilir, iddianın kesinliğini hedge ifadeleriyle ayarlayabilir ve uzun öbekleri tek bir cümlede hiyerarşik olarak birleştirebilir. YDS'de amaç her sözcüğü çevirmekten önce ana iddia ile onu sınırlayan kanıt, koşul ve tutumları ayırmaktır.`,
      kural: [
        [`nominalization`, `Eylem veya niteliği ad öbeğine dönüştürerek bilgiyi yoğunlaştırır.`, `<em>The committee rejected the plan → the committee's rejection of the plan</em>`],
        [`hedging`, `May, might, appear, suggest, likely, to some extent gibi araçlar iddianın gücünü sınırlar.`, `<em>The findings suggest that sleep may improve recall.</em>`],
        [`stance/evaluation`, `Notably, unfortunately, importantly gibi öğeler yazarın bilgiyi nasıl değerlendirdiğini gösterir.`, `<em>Notably, the effect disappeared after adjustment.</em>`],
        [`information packaging`, `Given/new bilgi, uzun özne ve sona ağırlık ilkeleri cümle düzenini etkiler.`, `<em>It remains unclear whether the policy will reduce inequality.</em>`],
        [`embedded modification`, `Relative, participle ve prepositional phrases bir baş adı katmanlı biçimde niteler.`, `<em>the measures introduced after the crisis to protect small firms</em>`],
        [`formal lexical choice`, `Phrasal veya genel fiil yerine bağlama uygun daha özgül fiiller görülebilir.`, `<em>investigate, constitute, decline, obtain</em>`]
      ],
      yol: [
        `Önce ana cümlenin çekimli fiilini ve öznesini bulun; uzun ad öbeklerinin içindeki fiilimsi ve relative clause'ları geçici olarak paranteze alın.`,
        `Ana iddiayı tek cümleyle Türkçe ifade edin, sonra neden, koşul, taviz ve örnek gibi yan ilişkileri geri ekleyin.`,
        `May, suggest, apparently ve likely gibi kesinlik ayarlayıcılarını işaretleyin; çeviri ve restatement'te bunları düşürmeyin.`,
        `Adlaştırmayı ilgili fiil cümlesine açarak kimin ne yaptığını bulun; fakat metnin belirtmediği bir faili eklemeyin.`
      ],
      tuzak: [
        `Uzun cümlenin ilk adını otomatik özne ve ilk fiilimsi biçimini ana fiil saymayın.`,
        `Suggests that ile proves that aynı kesinlikte değildir; restatement'te hedge kaybı anlamı güçlendirir.`,
        `Her phrasal verb gündelik, her Latince kökenli fiil akademik değildir; doğal eşdizim ve bağlam belirleyicidir.`,
        `Aşırı adlaştırma metni belirsizleştirebilir; anlama çözümünde nominalization yararlı olsa da yazıda açıklıkla dengelenmelidir.`
      ],
      tani: [
        `Ana iddiayı bulun: Although based on a relatively small sample, the study suggests that regular exposure to green spaces may reduce stress.`,
        `Fiil cümlesine açın: the rapid expansion of urban transport networks`,
        `Kesinlik farkını açıklayın: The treatment may be effective / The treatment is effective.`
      ],
      cevap: [
        `Ana iddia <b>the study suggests ...</b> bölümüdür; small sample taviz/sınırlama, may ise sonucun ihtiyatlı sunulduğunu gösterir.`,
        `<em>Urban transport networks expanded rapidly.</em> Bağlam fail veya ettireni veriyorsa ayrıca eklenebilir; yalın adlaştırma bunu zorunlu kılmaz.`,
        `İlk cümle olasılık veya sınırlı kanıt bildirir; ikincisi etkinliği doğrudan gerçek olarak ileri sürer. Birbirlerinin tam restatement'i değildir.`
      ],
      kontrol: [`Ana cümlenin özne ve çekimli fiilini buldum.`, `Yan ilişkileri ve uzun niteleyicileri hiyerarşik çözdüm.`, `Hedge, değerlendirme ve kesinlik derecesini anlamda korudum.`]
    }),

    "T58": kayit({
      kod: `T58`, baslik: `Tek cümle, cloze ve cümle tamamlama aktarımı`,
      ozet: `Dil bilgisi, eşdizim, gönderim ve mantık kanıtlarını ilk soru gruplarında ortak bir çözüm düzenine aktarma`,
      ana: `Tek cümlelik boşluk, cloze ve cümle tamamlama soruları farklı görünse de aynı çekirdeği sınar: boşluğun dil bilgisel yuvasını belirlemek, çevredeki anlam ilişkisini kurmak ve seçenekleri bütün cümle ya da metin içinde sınamak. Bir ipucuna erken bağlanmak yerine kanıtları katmanlı kullanmak gerekir.`,
      kural: [
        [`sözdizimsel yuva`, `Boşluğun noun, verb, adjective, adverb, clause veya connector istediği çevredeki yapıdan çıkarılır.`, `<em>The results were statistically ___.</em> → adjective`],
        [`collocation/valency`, `Doğru türdeki adaylar fiilin tamlayıcısı ve yerleşik sözcük birlikteliğiyle ayrılır.`, `<em>account for a difference; capable of doing</em>`],
        [`local cohesion`, `Adıl, zaman, article ve bağlaç yakın cümleler arasında bağlantı kurar.`, `<em>this finding; such changes; however</em>`],
        [`global coherence`, `Cloze boşluğu yalnız bulunduğu cümleyle değil paragrafın konusu ve sav yönüyle uyumlu olmalıdır.`, `<em>problem → proposed solution → limitation</em>`],
        [`sentence completion`, `Verilen yarı cümleyle seçenek arasında anlam, özne, zaman ve bağlaç ilişkisi tamamlanır.`, `<em>Although X, Y must present a concession-compatible result.</em>`],
        [`elimination`, `Seçenek; biçim, anlam yönü, kapsam veya gönderimden biri bozuluyorsa elenir.`, `<em>grammatical but logically reversed</em>`]
      ],
      yol: [
        `Seçeneklere bakmadan boşluğun türünü ve beklenen anlam yönünü kısa bir notla tahmin edin.`,
        `Önce kesin dil bilgisel uyumsuzlukları eleyin; sonra eşdizim ve fiil tamlayıcısı kontrolü yapın.`,
        `Kalan adayları cümlenin öncesi ve sonrasıyla okuyun; cloze'da en az bir önceki ve bir sonraki cümleyi kullanın.`,
        `Seçtiğiniz cevabı yerleştirip bütün yapıyı yeniden okuyun; gönderim, kiplik ve neden–sonuç yönünün birlikte tutarlı olduğunu doğrulayın.`
      ],
      tuzak: [
        `Yalnız boşluktan önceki sözcüğe bakmak, sonraki ilgeç veya clause yapısını kaçırabilir.`,
        `Sözlük anlamı yakın iki seçenek aynı eşdizimde kullanılmayabilir; exact synonym varsaymayın.`,
        `Cümle tamamlama seçeneği dil bilgisel birleşse bile although/because/if ilişkisinin mantığını ters kurabilir.`,
        `Cloze'da her boşluğu bağımsız çözmek paragrafın zaman ve referans zincirini bozar; önce konu akışını okuyun.`
      ],
      tani: [
        `Türü bulun: The decline was largely ___ changes in consumer behaviour. Boşluk hangi yapıyı ister?`,
        `Bağlayıcıyı seçin: The drug reduced pain in the short term. ___, no evidence showed a lasting benefit.`,
        `Tamamlayın: Although the initial results appeared promising, ___ . Uyumlu devamın temel anlamı ne olmalıdır?`
      ],
      cevap: [
        `Be sonrası ve changes öncesinde neden ilişkisi kuran bir ifade gerekir: <b>due to / attributable to</b> gibi adjective/prepositional complement.`,
        `<b>However/Nevertheless</b>; kısa vadeli olumlu sonuçla kalıcı yarar kanıtının yokluğu karşıtlık kurar.`,
        `Ana cümle beklentiye aykırı bir sınırlama vermelidir; örneğin <em>later trials failed to confirm them</em>. Yalnız ikinci bir olumlu sonuç taviz mantığını tamamlamaz.`
      ],
      kontrol: [`Boşluğun dil bilgisel yuvasını seçeneklerden önce belirledim.`, `Eşdizim, gönderim ve anlam yönünü birlikte kullandım.`, `Cevabı bütün cümle/paragraf içinde yeniden sınadım.`]
    }),

    "T59": kayit({
      kod: `T59`, baslik: `Çeviri, okuma ve yeniden ifade aktarımı`,
      ozet: `Önerme iskeleti, kiplik, kapsam ve yapısal dönüşümlerle anlamı soru türleri arasında koruma`,
      ana: `Çeviri, okuma ve restatement aynı temel beceriyi paylaşır: metnin kim–ne yaptı iskeletini, olaylar arası ilişkiyi ve yazarın kesinlik derecesini korumak. İyi aktarım kelime sırasını kopyalamaz; clause'u phrase'e, active'i passive'e veya fiili ada dönüştürse bile temel önermeyi değiştirmez.`,
      kural: [
        [`proposition skeleton`, `Katılımcı, eylem, nesne ve koşullar anlamın çekirdeğini oluşturur.`, `<em>Researchers linked air pollution to cognitive decline.</em>`],
        [`voice alternation`, `Active/passive odak değiştirir; katılımcı rolleri ve olay aynı kalmalıdır.`, `<em>Air pollution was linked to cognitive decline.</em>`],
        [`clause–phrase alternation`, `Because ↔ because of; although ↔ despite; relative ↔ participle dönüşümleri yapılabilir.`, `<em>Although costs rose → despite the rise in costs</em>`],
        [`modality/evidentiality`, `May, must, appear, allegedly ve reporting verbs iddianın gücü veya kaynağını taşır.`, `<em>The evidence may indicate...</em>`],
        [`scope and quantity`, `Only, not all, few, at least, nearly gibi öğeler doğruluk koşullarını değiştirir.`, `<em>Not all patients recovered.</em>`],
        [`inference boundary`, `Okuma çıkarımı metinle desteklenmeli; olası açıklama kesin olguya dönüştürülmemelidir.`, `<em>associated with ≠ proven to cause</em>`]
      ],
      yol: [
        `Cümlenin ana önermesini özne–eylem–nesne biçiminde çıkarın; yan cümlelerin neden, taviz, amaç veya koşul rollerini ekleyin.`,
        `Kiplik, olumsuzluk, niceleyici, karşılaştırma ve zaman ifadelerini ayrı ayrı işaretleyin; bunlar çeviride kaybolmaya en açık öğelerdir.`,
        `Seçeneklerde yüzeysel sözcük tekrarına değil rol eşleşmesine bakın; active/passive veya adlaştırma doğal dönüşümlerdir.`,
        `Okuma sorusunda cevabı metindeki kanıta geri bağlayın; bilgi mümkün olsa bile paragraftan çıkmıyorsa seçmeyin.`
      ],
      tuzak: [
        `Because ile therefore yönünü ters çevirmek aynı iki olayı kullansa da neden ve sonucu değiştirir.`,
        `May have caused ifadesini caused diye çevirmek belirsizliği siler; must have caused ise farklı bir güçlü çıkarımdır.`,
        `Few ile a few, not all ile none ve more than ile at least birbirinin yerine geçmez.`,
        `Passive dönüşümde by öbeği düşebilir; ancak fail metnin temel karşıtlığı için önemliyse sessizce yok edilmemelidir.`
      ],
      tani: [
        `Restatement yapın: Because the roads were icy, several schools remained closed. (due to kullanın)`,
        `Anlam farkını bulun: The policy may reduce inequality / The policy will reduce inequality.`,
        `Çıkarımı değerlendirin: Metin “Screen time was associated with poor sleep” diyorsa “Screen time causes poor sleep” kesin sonucu verilebilir mi?`
      ],
      cevap: [
        `<em>Several schools remained closed due to the icy roads.</em> Clause ad öbeğine dönüşür; neden–sonuç yönü korunur.`,
        `May olasılık bildirir; will bağlamına göre öngörü veya daha güçlü gelecek iddiasıdır. Tam eşdeğer değildir.`,
        `Hayır. <em>Associated with</em> ilişki bildirir; tek başına nedensellik yönünü ve başka etkenlerin dışlandığını kanıtlamaz.`
      ],
      kontrol: [`Önerme iskeletini ve katılımcı rollerini korudum.`, `Kiplik, kapsam, zaman ve bağlaç yönünü denetledim.`, `Metin kanıtı ile çıkarım arasındaki sınırı aşmadım.`]
    }),

    "T60": kayit({
      kod: `T60`, baslik: `Diyalog ve paragraf bütünlüğü aktarımı`,
      ozet: `Konuşma niyeti, gönderim, konu zinciri ve bilgi akışıyla diyalog ve paragraf sorularını çözme`,
      ana: `Diyalogda doğru yanıt yalnız konuya ilişkin değil, önceki sözün iletişimsel işlevine uygun olmalıdır. Paragrafta ise her cümle ana konuya belirli bir görevle bağlanır. Niyet, zaman, gönderim ve lexical chain birlikte izlendiğinde yüzeyde benzer fakat akışı bozan seçenekler ayrılır.`,
      kural: [
        [`speech function`, `Soru; bilgi isteme, öneri, itiraz, onay, şaşırma veya açıklama talebi gibi bir işlev taşır.`, `<em>Why don't we...? → suggestion</em>`],
        [`adjacency pair`, `Teklif–kabul/ret, soru–yanıt ve değerlendirme–tepki gibi komşu söz eylemleri birbirini tamamlar.`, `<em>Could you...? — Certainly.</em>`],
        [`topic continuity`, `Paragrafın ana varlığı veya düşüncesi tekrar, adıl ve ilişkili sözcüklerle sürer.`, `<em>the species → it → the animal</em>`],
        [`given-to-new flow`, `Cümle çoğu kez bilinen öğeden başlayıp yeni bilgiyi sona taşır; sonraki cümle bu yeniyi geliştirebilir.`, `<em>a new method → the method → its main advantage</em>`],
        [`logical progression`, `Tanım, neden, örnek, sonuç, karşıtlık veya değerlendirme gibi retorik görevler sıralamayı belirler.`, `<em>problem → cause → proposed solution</em>`],
        [`irrelevant sentence`, `Konu sözcüğü paylaşsa bile paragrafın dar odağına ve gelişim görevine hizmet etmeyen cümle bütünlüğü bozar.`, `<em>same broad field, different claim</em>`]
      ],
      yol: [
        `Diyalog boşluğundan önceki sözün niyetini ve beklediği yanıt türünü adlandırın; ardından sonraki tepkinin hangi cevabı varsaydığını okuyun.`,
        `Kişi, zaman ve olumlu–olumsuz yönün tutarlı olduğunu kontrol edin; yes/no yanıtlarını Türkçe mantığıyla ters yorumlamayın.`,
        `Paragraf için bir cümlelik dar konu yazın ve her cümlenin görevini kenara not edin.`,
        `Adıl, this/such, tekrar edilen anahtar sözcük ve bağlaçları izleyerek sıralama kısıtlarını kurun; yalnız kronolojiye güvenmeyin.`
      ],
      tuzak: [
        `Diyalog seçeneği aynı konuda bilgi verse bile soru öneri istiyorsa iletişimsel olarak uygun olmayabilir.`,
        `Olumsuz soruya kısa yanıt İngilizce önermenin doğruluğuna göre verilir: <em>Didn't she come? — No, she didn't.</em> gelmediğini söyler.`,
        `Paragrafta ilk cümle her zaman en genel cümle değildir; önceki bağlama gönderim yapan this/these gibi öğeler başlangıcı engelleyebilir.`,
        `İlgisiz cümle tamamen farklı sözcükler taşımak zorunda değildir; aynı anahtar kelimeyi farklı zaman, yer veya tartışma amacıyla kullanabilir.`
      ],
      tani: [
        `Niyeti bulun: “Why don't we postpone the field trip until the weather improves?” Bu söz bilgi sorusu mu, öneri mi?`,
        `Sıralayın: (A) This advantage is particularly important in remote clinics. (B) Portable scanners can be used without a fixed laboratory. Hangisi önce gelmelidir?`,
        `Yanıtlayın: “Didn't the committee approve the proposal?” — “No, ___.” Boşluk ne olmalı?`
      ],
      cevap: [
        `Bir <b>öneridir</b>; doğal devam kabul, ret veya alternatif sunabilir. Biçimindeki why gerçek neden istemek zorunda değildir.`,
        `<b>B önce, A sonra</b>. This advantage, taşınabilir tarayıcıların sabit laboratuvar gerektirmemesi bilgisine geri döner.`,
        `<em>it didn't</em>. No, önerme olan “committee approved” bilgisini reddeder; komite onaylamamıştır.`
      ],
      kontrol: [`Konuşma niyetini ve beklenen komşu sözü belirledim.`, `Paragrafın dar konusu ile her cümlenin görevini çıkardım.`, `Gönderim, zaman ve mantıksal ilerlemeyi birlikte doğruladım.`]
    }),

    "T61": kayit({
      kod: `T61`, baslik: `Genel İngilizce: düşük YDS önceliği`,
      ozet: `YDS'de seyrek doğrudan ölçülen sesletim, yazım ve gündelik yapıların destekleyici temelini tanıma`,
      ana: `Telaffuz, vurgu, gündelik nezaket kalıpları ve ayrıntılı yazım kuralları YDS'nin merkezinde doğrudan soru alanları değildir; yine de dinleme dışı bir sınavda bile sözcük tanıma, tür ayırma ve cümle çözümünü destekler. Çalışma süresi, yüksek getirili dil bilgisi, kelime ve okuma becerilerinden sonra dengeli ayrılmalıdır.`,
      kural: [
        [`word stress / pronunciation`, `Aynı kökün türleri vurgu veya ses bakımından değişebilir; bu bilgi sözcük ailesini tanımaya yardım eder.`, `<em>PHOtograph → phoTOGraphy</em>`],
        [`spelling and morphology`, `Yazım, ek ve kök ilişkisini görünür kılar; telaffuz her zaman harflerle birebir değildir.`, `<em>pronounce → pronunciation; decide → decision</em>`],
        [`capitalization`, `Cümle başı ve özel adlar büyük harf alır; genel alan adları çoğunlukla küçük yazılır.`, `<em>Turkey; Turkish; a biology course</em>`],
        [`punctuation`, `Virgül, noktalı virgül, iki nokta ve kesme işareti cümle sınırı ile ilişkiyi açıklığa kavuşturur.`, `<em>The evidence was limited; however, the claim spread.</em>`],
        [`imperatives/exclamatives`, `Yalın fiille yönerge; what/how ile ünlem kurulabilir. Özne çoğunlukla bağlamdan anlaşılır.`, `<em>Read the instructions carefully. What a remarkable result!</em>`],
        [`politeness and register`, `Could, would, please ve dolaylı sorular isteğin tonunu değiştirir.`, `<em>Could you explain why the file was removed?</em>`]
      ],
      yol: [
        `Önce YDS'ye doğrudan katkısı yüksek alanları çalışın; bu ünitedeki bilgileri kelime ailesi ve cümle çözümüne destek olarak kullanın.`,
        `Yazım farklılığını kök–ek ilişkisiyle bağlayın; yalnız ses benzerliğine dayanarak sözcük türü çıkarmayın.`,
        `Noktalama işaretini cümleler arası ilişkinin ek kanıtı sayın; asıl bağlamsal anlamı tek başına noktalama belirlemez.`,
        `Diyalog sorularında nezaket biçiminin altında yatan niyeti bulun: rica, izin, öneri, ret veya açıklama talebi.`
      ],
      tuzak: [
        `Telaffuza geniş zaman ayırıp akademik kelime, bağlaç ve okuma çalışmalarını ertelemek YDS puanı açısından düşük getirili olabilir.`,
        `Could you tell me where is the station? gömülü soruda yanlıştır; <em>where the station is</em> düz cümle sırası gerekir.`,
        `Virgülle iki bağımsız cümleyi bağlamak comma splice oluşturabilir; bağlaç, noktalı virgül veya nokta gerekebilir.`,
        `Büyük harf kullanımını Türkçeden aynen aktarmayın; İngilizcede dil ve milliyet adları büyük, genel ders/alan adları çoğunlukla küçüktür.`
      ],
      tani: [
        `Düzeltin: Could you tell me when does the lecture begin?`,
        `Noktalamayı düzeltin: The sample was small, nevertheless the pattern was consistent.`,
        `Yazımı seçin: The committee's final ___ surprised the public. (decision / decission)`
      ],
      cevap: [
        `<em>Could you tell me when the lecture begins?</em> Dolaylı soru bölümü bildirme cümlesi sırasındadır.`,
        `<em>The sample was small; nevertheless, the pattern was consistent.</em> Nokta da kullanılabilir; nevertheless uygun virgülle ikinci bağımsız cümleye bağlanır.`,
        `<b>decision</b>; decide kökünden türemede -sion biçimi yerleşiktir. Yazım bilgisi word family tanımayı da destekler.`
      ],
      kontrol: [`Bu alanı YDS önceliğine göre orantılı çalıştım.`, `Yazım ve sözcük ailesi bağlantısını doğruladım.`, `Dolaylı soru, noktalama ve kayıt düzeyini bağlam içinde kontrol ettim.`]
    })
  });
})();
