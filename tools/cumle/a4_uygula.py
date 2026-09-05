# -*- coding: utf-8 -*-
"""A4 — cumleler.js artik temizligi. Kuru kosum dokum yazar; --yaz ile uygular.

Islem siniflari (hepsi OZGUN dizinle calisir, silmeler en sonda uygulanir):
  BASLIK   kitapcik basligi / sinav adi onekini kirp (e ve t)
  SORUNO   "9) " soru numarasi onekini kirp (e ve t)
  TIRNAK   basa yapismis kapanis tirnagini kirp; 2 devam parcasini onceki kayda ekle
  SIK      onceki sorunun sik listesini kirp, gercek soru kokunu birak (t: kural ya da elle)
  ONARIM   ondalik/kisaltma/bas harf bolunmelerini korpustaki tam cumleyle onar,
           yutulan komsu kayitlari sil (t elle)
  KUYRUK   sona yapismis soru/sayfa numarasini kirp
  SIL      yonerge satirlari ve salt sik listeleri
"""
import io
import json
import re
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
YOL = r"C:\Users\Trk\Desktop\YDS\04_Github\data\cumleler.js"
DOKUM = r"C:\Users\Trk\Desktop\YDS\A4_DOKUM_2026-09-05.md"
YAZ = '--yaz' in sys.argv


def js_str(s, i):
    out = []
    i += 1
    while i < len(s):
        c = s[i]
        if c == '\\':
            out.append(s[i + 1]); i += 2; continue
        if c == '"':
            return ''.join(out), i + 1
        out.append(c); i += 1
    raise ValueError('kapanmayan tirnak')


def kayit_ayir(satir):
    d, i = {}, 1
    sira = []
    while i < len(satir) and satir[i] != '}':
        m = re.match(r'\s*,?\s*([A-Za-z_]+):', satir[i:])
        if not m:
            break
        k = m.group(1); i += m.end()
        if satir[i] == '"':
            v, i = js_str(satir, i)
        else:
            m2 = re.match(r'[^,}]+', satir[i:]); v = m2.group(0); i += m2.end()
        d[k] = v; sira.append(k)
    d['_sira'] = sira
    return d


def js_kacir(s):
    return s.replace('\\', '\\\\').replace('"', '\\"')


def satira_don(d):
    p = []
    for k in d['_sira']:
        if k not in d:
            continue
        v = d[k]
        p.append('%s:%s' % (k, ('"%s"' % js_kacir(v)) if k in ('e', 's', 'b', 't') else v))
    return '{' + ','.join(p) + '}'


metin = io.open(YOL, encoding='utf-8').read()
satirlar = metin.split('\n')
K = []
konum = []
for idx, l in enumerate(satirlar):
    if l.startswith('{e:"'):
        d = kayit_ayir(l.rstrip(','))
        d['_i'] = len(K)
        K.append(d)
        konum.append(idx)
print('kayit: %d' % len(K))

degisiklik = []   # (sinif, i, alan, eski, yeni)
silinecek = {}    # i -> sebep


def degistir(sinif, i, e_yeni=None, t_yeni=None):
    d = K[i]
    if e_yeni is not None and e_yeni != d['e']:
        degisiklik.append((sinif, i, 'e', d['e'], e_yeni)); d['e'] = e_yeni
    if t_yeni is not None and t_yeni != d.get('t', ''):
        degisiklik.append((sinif, i, 't', d.get('t', ''), t_yeni)); d['t'] = t_yeni


def sil(i, sebep):
    silinecek[i] = sebep


# ------------------------------------------------------------------ BASLIK
BASLIK_E = re.compile(r'^(?:\d{4}-YDS \S+/\S+ |\d{4} (?:İlkbahar|Sonbahar|Yaz|Aralık|Temmuz|İLKBAHAR|SONBAHAR) YDS |\d{1,2} Mart \d{4} YDS |(?:İlkbahar|Sonbahar|Yaz) YDS |Mart \d{4} YDS )')
BASLIK_T = re.compile(r'^(?:\d{4}-YDS \S+/\S+\s*[—–:-]?\s*|\d{1,2} Mart \d{4} YDS\.?\s*|\d{4} (?:İlkbahar|Sonbahar|Yaz|Aralık|Temmuz) YDS\s*[—–:.-]?\s*)')


def baslik_kirp(e, t):
    e2, t2 = e, t
    while BASLIK_E.match(e2):
        e2 = BASLIK_E.sub('', e2, count=1)
    while BASLIK_T.match(t2):
        t2 = BASLIK_T.sub('', t2, count=1)
    return e2, t2


for d in K:
    if BASLIK_E.match(d['e']):
        e2, t2 = baslik_kirp(d['e'], d.get('t', ''))
        degistir('BASLIK', d['_i'], e2, t2)

# ------------------------------------------------------------------ SORUNO
for d in K:
    m = re.match(r'^\d{1,2}\)\s+', d['e'])
    if m and not d['e'].startswith('('):
        t = d.get('t', '')
        degistir('SORUNO', d['_i'], d['e'][m.end():], re.sub(r'^\(?\d{1,2}\)\s*', '', t))
degistir('SORUNO', 3216, re.sub(r'^21\s+', '', K[3216]['e']))

# ------------------------------------------------------------------ TIRNAK
TIRNAK_T_ELLE = {
    54: '"Marshall Planı, zor durumdaki ülkelere büyük miktarda para aktarmaya yönelik basit bir program değil, Avrupa\'yı yeniden sanayileştirmeye dönük açık ve nihayetinde başarılı olmuş bir girişimdi." diyor Erik Reinert ve Ha-Joon Chang.',
    1038: 'Cemil: Yani bunun, "Pencereyi açacağım." demek yerine "Pencereyi açsam sizin için bir sakıncası olur mu?" diye sormak gibi olduğunu mu söylüyorsun?',
    1226: 'Örneğin, masanın üzerindeki anahtarları işaret ederek "Anahtarlar orada." demek, "Anahtarların tam arkanda, masanın üzerinde, kitabın yanında." demekten çok daha hızlı ve basittir.',
    2044: 'Ancak onları suçlamadan ya da kınamadan önce kendinize "Daha önce beni hayal kırıklığına uğrattılar mı?", "Ben onlara karşı her zaman kusursuz davrandım mı?" gibi sorular sormak isteyebilirsiniz.',
    2158: '"Bu su içmek için güvenli mi?" gibi sorular sorarak, yazar aslında ne söylemeye çalışmaktadır?',
    2723: 'Spelitzian gibi nadiren konuşulan bir dilde "Bana biraz su ver." anlamına gelen cümleyi duyarsanız, aynı kalıbı "Bana biraz yiyecek ver." için de kullanabileceğinizden büyük ölçüde emin olabilirsiniz, (20)---- başka olası kalıplar da vardır.',
    4773: '"İnsanların sağlıklı besinlere (25)---- duyduğu isteği gerçekten artırabildiğimizi bulduk." diyor çalışmaya öncülük eden Dr. Hedy Kober.',
    4972: 'Uyarlanabilir İş Zekâsı (Adaptive Business Intelligence - ABI); tahmini, optimizasyonu ve uyarlanabilirliği şu iki temel soruyu yanıtlayabilen bir sistemde birleştirme disiplinidir: "Gelecekte ne olması muhtemeldir?" ve "Şu anda alınabilecek en iyi karar nedir?"',
}
TIRNAK_E_ELLE = {
    1038: 'Cemil:  Do you mean it\'s like asking "Would you mind if I opened the window?" instead of saying "I\'ll open the window."?',
}


def devam_mi(govde):
    return bool(re.match(r'^(?:[a-z]|,)', govde))


tirnak_birlesme = []
for d in K:
    i = d['_i']
    e = d['e']
    if not e.startswith('"'):
        continue
    govde = e[1:].lstrip()
    t_govde = re.sub(r'^[”"“]\s*', '', d.get('t', ''))
    if devam_mi(govde):
        # Alintinin kapanis tirnagi + cumlenin devami: en yakin silinmemis onceki kayda eklenir.
        j = i - 1
        while j in silinecek:
            j -= 1
        o = K[j]
        e_yeni = o['e'].rstrip() + '"' + (govde if govde.startswith(',') else ' ' + govde)
        t_govde2 = re.sub(r'^,\s*', '', t_govde)
        t_yeni = o.get('t', '').rstrip() + ' ' + t_govde2
        degistir('TIRNAK', j, e_yeni, t_yeni)
        sil(i, 'alıntı devam parçası [%d] kaydına eklendi' % j)
        tirnak_birlesme.append(j)
    elif e.count('"') == 1:
        sonraki = K[i + 1]['e'] if i + 1 < len(K) else ''
        if sonraki.startswith('"') and devam_mi(sonraki[1:].lstrip()):
            continue   # acilis tirnagi; kapanisi sonraki parcada, birlesince tamamlanacak
        degistir('TIRNAK', i, govde, t_govde)
for j in sorted(set(tirnak_birlesme)):
    e_b = TIRNAK_E_ELLE.get(j, K[j]['e'])
    if e_b.count('"') % 2 == 1:
        e_b += '"'   # acilis tirnaginin kapanisi kayip parcadaydi; dengele
    degistir('TIRNAK', j, e_b, TIRNAK_T_ELLE.get(j))
    print('TIRNAK-BIRLESME [%d]\n   e: %s\n   t: %s' % (j, K[j]['e'], K[j].get('t', '')))
degistir('TIRNAK', 6442, '"Every flower is beautiful in its own garden."')

# ------------------------------------------------------------------ SIK
SIK_KIRP = [461, 462, 692, 693, 919, 920, 921, 1219, 1352, 1403, 1676, 2822, 3022, 3072, 3106, 3699,
            3735, 4031, 4329, 4491, 4560, 4577, 4589, 4810, 4820, 4847, 5200, 5486, 5774, 5782, 6147]
SIK_T_ELLE = {
    3699: 'Parçada açıkça belirtildiğine göre, antibiyotik krizi ----.',
    3735: 'Parça esas olarak ne hakkındadır?',
    1219: "Parçadan Mısır'ın Eski Krallığı hakkında ne çıkarılabilir?",
}
sik_uyari = []
for i in SIK_KIRP:
    d = K[i]
    e = d['e']
    m = re.search(r' ([A-Z][a-z]+ |\(\d{1,2}\) ----|---- |"[A-Z])', e)
    if not m:
        sik_uyari.append((i, 'kesme noktası yok')); continue
    e2 = e[m.start() + 1:]
    e2, _ = baslik_kirp(e2, '')
    e2 = e2.replace('De sign ethics', 'Design ethics')
    t = d.get('t', '')
    if i in SIK_T_ELLE:
        t2 = SIK_T_ELLE[i]
    elif ' — ' in t:
        t2 = t.rsplit(' — ', 1)[1]
    elif ' / ' in t:
        son = t.rfind(' / ')
        k = t.find('. ', son)
        t2 = t[k + 2:] if k >= 0 else t
    else:
        t2 = t
    if ' / ' in t2 or re.match(r'^[a-zçğıöşü]', t2):
        sik_uyari.append((i, 't hâlâ şık içeriyor: ' + t2[:80]))
    degistir('SIK', i, e2, t2)
degistir('SIK', 6737, 'Pazırık carpet, named after the castle it was found in, is the oldest Turkish knotted carpet ever known.')
degistir('SIK', 4238, K[4238]['e'][0].upper() + K[4238]['e'][1:], K[4238]['t'][0].upper() + K[4238]['t'][1:])

# ------------------------------------------------------------------ ONARIM (korpustan tam cumle + elle ceviri)
ONARIM = {
    1347: ("The total amount of military ---- by all the countries of the world in 2010 was $1.63 trillion, which is equivalent to $236 for every person on the planet.",
           "2010 yılında dünyadaki tüm ülkelerin toplam askerî ---- 1,63 trilyon dolardı; bu da gezegendeki her bir kişi için 236 dolara denk gelmektedir.", [1348]),
    1826: ("(20)----, this hardiness comes at a price: the plants are thought to grow just 1.5 cm a year.",
           "(20)----, bu dayanıklılığın bir bedeli vardır: bitkilerin yılda yalnızca 1,5 cm büyüdüğü düşünülmektedir.", []),
    2184: ("The cost of bringing a new compound to the market is now around $2.5 billion, twice as much in real terms as it was a decade ago.",
           "Yeni bir bileşiği piyasaya sürmenin maliyeti günümüzde yaklaşık 2,5 milyar dolardır; bu da reel olarak on yıl öncesinin iki katıdır.", [2185]),
    2683: ("(II) A 2003 study at the University of Regensburg in Germany found that 99.5 percent of dandelion seeds land within 10 metres of their plant.",
           "(II) Almanya'daki Regensburg Üniversitesi'nde 2003 yılında yapılan bir çalışma, karahindiba tohumlarının yüzde 99,5'inin kendi bitkilerinin 10 metre yakınına düştüğünü ortaya koymuştur.", [2684]),
    2706: ("By 2.5 million years ago, when they began ---- stone tools, early humans had understood that they ---- the natural world to their own advantage.",
           "2,5 milyon yıl önce, taş aletler ---- başladıklarında, ilk insanlar doğal dünyayı kendi çıkarları doğrultusunda ---- anlamışlardı.", []),
    3064: ("The oldest known herbal text, Shen Nung's Pen Ts'ao (c. 2700-3000 BC) catalogues over 200 botanicals.",
           "Bilinen en eski bitkisel metin olan Shen Nung'un Pen Ts'ao adlı eseri (yaklaşık MÖ 2700-3000), 200'den fazla bitkiyi listeler.", []),
    3232: ("Some of his music is melancholy, especially the last movement of his Symphony No. 6.",
           "Müziğinin bir kısmı hüzünlüdür; özellikle de 6. Senfoni'sinin son bölümü.", []),
    3444: ("Cycling 26.93 kilometres in 1 hour, Marchand was only 50.6 percent slower than Bradley Wiggins's 54.53 km record.",
           "1 saatte 26,93 kilometre pedal çeviren Marchand, Bradley Wiggins'in 54,53 km'lik rekorundan yalnızca yüzde 50,6 daha yavaştı.", []),
    4447: ("This trend continues until 19.5 years in women and nearly 21 in men, then gradually reverses.",
           "Bu eğilim kadınlarda 19,5, erkeklerde ise yaklaşık 21 yaşına kadar sürer; ardından kademeli olarak tersine döner.", []),
    4555: ("Business owners must carefully weigh the operational risk of a start-up, or the risks of a new product or project, against potential profits or losses - in other words, the strategic consequences of action vs. inaction.",
           "İşletme sahipleri, yeni bir girişimin operasyonel riskini ya da yeni bir ürün veya projenin risklerini olası kâr ve zararlara karşı dikkatle tartmalıdır; başka bir deyişle, harekete geçmenin ve geçmemenin stratejik sonuçlarını.", []),
    4578: ("US statistics taken from between 2000 and 2009 show that car drivers or passengers suffer 7.3 deaths per billion miles.",
           "2000 ile 2009 yılları arasına ait ABD istatistikleri, otomobil sürücü ya da yolcularının milyar mil başına 7,3 ölümle karşılaştığını göstermektedir.", []),
    4579: ("In contrast, air travel comes in at just 0.07 deaths per billion passenger miles.",
           "Buna karşılık hava yolculuğunda bu sayı, milyar yolcu mili başına yalnızca 0,07 ölümdür.", []),
    4834: ("If the concentration of CO2 in the atmosphere doubles, which is likely to happen later this century, temperatures are expected to rise between 2 and 4.5°C.",
           "Atmosferdeki CO2 yoğunluğu iki katına çıkarsa -ki bunun bu yüzyılın ilerleyen dönemlerinde gerçekleşmesi olasıdır- sıcaklıkların 2 ile 4,5°C arasında yükselmesi beklenmektedir.", []),
    5005: ("(V) Yet, on 11 February 2016, it was announced that physicists at the Laser Interferometer Gravitational-Wave Observatory had sensed, for the very first time, a wave emanating from a fraction-of-a-second collision of two black holes located 1.3 billion light years away.",
           "(V) Yine de 11 Şubat 2016'da, Laser Interferometer Gravitational-Wave Observatory'deki fizikçilerin, 1,3 milyar ışık yılı uzaklıktaki iki kara deliğin saniyenin bir kesri süren çarpışmasından yayılan bir dalgayı ilk kez algıladıkları duyuruldu.", []),
    5242: ("Roughly 5.7 million Americans live with Alzheimer's, the neurodegenerative disease that slowly deteriorates memory and other cognitive abilities.",
           "Yaklaşık 5,7 milyon Amerikalı, belleği ve diğer bilişsel yetileri yavaş yavaş bozan nörodejeneratif bir hastalık olan Alzheimer ile yaşamaktadır.", []),
    5478: ("The Sun burst into being 4.6 billion years ago, which makes studying its early days difficult as physical material ---- from this period is scarce, but scientists have found crystals more than 4.5 billion years old ---- deep within meteorites that indicate the Sun had a tumultuous early life.",
           "Güneş 4,6 milyar yıl önce var oldu; bu döneme ---- fiziksel malzeme az bulunduğundan onun ilk dönemlerini incelemek güçtür, ancak bilim insanları göktaşlarının derinliklerinde ---- 4,5 milyar yıldan daha yaşlı kristaller bulmuştur ve bunlar Güneş'in çalkantılı bir ilk dönem geçirdiğine işaret etmektedir.", [5479]),
    5561: ("Nele Gheldof, at the Nestlé Institute of Health Sciences in Switzerland, studied 30 men and women with body mass indexes (BMIs) of 18.5 or under - classified as underweight - despite eating and exercising the same amount as the average person.",
           "İsviçre'deki Nestlé Sağlık Bilimleri Enstitüsü'nden Nele Gheldof, ortalama bir insanla aynı miktarda yiyip egzersiz yapmasına rağmen beden kitle indeksi (BKİ) 18,5 ve altında olan -yani zayıf olarak sınıflandırılan- 30 kadın ve erkeği inceledi.", [5562]),
    5584: ("In people having BMIs of 18.5 or under, fat cells are minute although their futile lipid cycle does not function well due to extremely active genes.",
           "BKİ'si 18,5 ya da altında olan kişilerde, aşırı etkin genler nedeniyle boş lipit döngüsü iyi işlemese de yağ hücreleri son derece küçüktür.", []),
    5628: ("I've read that a standard jar of honey requires honeybees to forage 80.000 km.",
           "Standart bir kavanoz bal için bal arılarının 80.000 km yol kat etmesi gerektiğini okumuştum.", []),
    5736: ("(I) Until about a century ago, it was thought that not much lived in the deep sea - with its average depth of around 3.5 km, crushing pressures, and permanent darkness, few people bothered looking there.",
           "(I) Yaklaşık bir yüzyıl öncesine kadar derin denizde pek bir şey yaşamadığı düşünülüyordu; ortalama 3,5 km'lik derinliği, ezici basınçları ve hiç bitmeyen karanlığıyla orada araştırma yapma zahmetine çok az kişi giriyordu.", [5737]),
    6221: ("Their analysis showed that in non-industrialised societies, the average was 6.4 hours, compared with 7.1 hours in industrialised societies.",
           "Analizleri, sanayileşmemiş toplumlarda ortalamanın 6,4 saat olduğunu, sanayileşmiş toplumlarda ise bunun 7,1 saat olduğunu gösterdi.", []),
    6848: ("Researchers studied the dietary habits via questionnaires of over 50.000 registered nurses aged 45 years and over for a period of eight years and found that those who reported consuming the most vitamin A and carotenoids were found to have a lower risk of developing cataracts, while the impact of other nutrients included were mild.",
           "Araştırmacılar, 45 yaş ve üzerindeki 50.000'den fazla kayıtlı hemşirenin beslenme alışkanlıklarını sekiz yıl boyunca anketlerle inceledi ve en fazla A vitamini ile karotenoid tükettiğini bildirenlerin katarakt geliştirme riskinin daha düşük olduğunu, diğer besin öğelerinin etkisinin ise hafif kaldığını buldu.", [6849]),
    7009: ("(III) More recently, during the Pliocene and periods - which ended some 1.5-2 million years ago - horses and their relatives as we know them today were probably the most abundant medium-sized grazing animals in the world.",
           "(III) Daha yakın dönemde, Pliyosen ve … dönemleri boyunca -ki bu dönemler yaklaşık 1,5-2 milyon yıl önce sona ermiştir- bugün bildiğimiz biçimiyle atlar ve akrabaları muhtemelen dünyadaki en yaygın orta boy otlayan hayvanlardı.", [7010]),
    1421: ("Telegraph messages were being sent between St. Petersburg, Berlin, Belgrade, Vienna, Paris and other countries involved in the conflict.",
           "Telgraf mesajları St. Petersburg, Berlin, Belgrad, Viyana, Paris ve çatışmaya taraf olan diğer ülkeler arasında gönderiliyordu.", [1422]),
    2349: ("St. Valentine's Day is set aside for lovers and for declarations of love, with these declarations traditionally sent anonymously.",
           "Aziz Valentine Günü, âşıklara ve aşk ilanlarına ayrılmıştır; bu ilanlar geleneksel olarak isimsiz biçimde gönderilir.", []),
    2350: ("---- Theories put forward generally refer the custom back to Roman times, telling the story of St. Valentine, a Roman priest who assisted the Christian martyrs during the persecutions in the time of Claudius II.",
           "---- Ortaya atılan kuramlar bu geleneği genellikle Roma dönemine dayandırır ve II. Claudius döneminde uygulanan zulümler sırasında Hristiyan şehitlere yardım eden Romalı bir rahip olan Aziz Valentine'ın öyküsünü anlatır.", [2351]),
    3238: ("From 1862 to 1866, he studied music at the St. Petersburg Conservatory under Anton Rubinstein, a pianist and composer.",
           "1862'den 1866'ya kadar St. Petersburg Konservatuvarı'nda, piyanist ve besteci Anton Rubinstein'ın gözetiminde müzik eğitimi aldı.", [3239]),
    1862: ("One day in 1952, John W. Hetrick was driving with his wife and daughter in the front seat when he had to change his direction suddenly and brake quickly to avoid an obstacle.",
           "1952 yılında bir gün, John W. Hetrick eşi ve kızı ön koltukta otururken araba kullanıyordu; bir engelden kaçınmak için aniden yön değiştirmek ve hızla fren yapmak zorunda kaldı.", [1863]),
    3415: ("So far, 359 plant species in Europe have been identified as being vulnerable to X. fastidiosa, including peaches, lavender and rosemary.",
           "Şimdiye kadar Avrupa'da, aralarında şeftali, lavanta ve biberiyenin de bulunduğu 359 bitki türünün X. fastidiosa'ya karşı duyarlı olduğu belirlenmiştir.", [3416]),
    3424: ("California has been unable to cope with the insects that transmit X. fastidiosa, which has destroyed the wine industry.",
           "California, şarap endüstrisini yok eden X. fastidiosa'yı taşıyan böceklerle baş edememiştir.", [3425]),
    3426: ("X. fastidiosa is far-reaching when the variety of infected plant species is considered.",
           "Enfekte olan bitki türlerinin çeşitliliği göz önüne alındığında X. fastidiosa'nın etkisi oldukça geniş kapsamlıdır.", []),
    3413: ("Now X. fastidiosa has reached Europe, where it has earned another name - the 'Ebola of olive trees'.",
           "Şimdi X. fastidiosa Avrupa'ya ulaşmış ve burada başka bir ad daha kazanmıştır: 'zeytin ağaçlarının Ebolası'.", []),
    3431: ("Most plant species infected with X. fastidiosa show typical symptoms of Pierce's disease.",
           "X. fastidiosa ile enfekte olan bitki türlerinin çoğu Pierce hastalığının tipik belirtilerini gösterir.", []),
    6994: ("(IV) Cultures also vary widely with regard to the emphasis on dependence vs. independence, individuality vs. group orientation, and respect for authority vs. individual freedoms.",
           "(IV) Kültürler ayrıca bağımlılığa karşı bağımsızlığa, bireyselliğe karşı grup yönelimine ve otoriteye saygıya karşı bireysel özgürlüklere yapılan vurgu bakımından da birbirinden büyük ölçüde farklılık gösterir.", [6995]),
    7170: ('---- For example, "Designing for Disaster" at the National Building Museum in Washington, D.C. showcases how scientists, engineers and government officials work together to guard the country\'s infrastructures against disasters.',
           '---- Örneğin, Washington D.C.\'deki National Building Museum\'da yer alan "Designing for Disaster" (Afete Karşı Tasarım) sergisi, bilim insanlarının, mühendislerin ve devlet yetkililerinin ülkenin altyapılarını afetlere karşı korumak için nasıl birlikte çalıştığını gözler önüne sermektedir.', [7171]),
    1333: ("(II) Yet, only about 30 percent of Ph.D.s in mathematics - and fewer in computer science, physics and engineering - are awarded to women every year.",
           "(II) Yine de matematik alanındaki doktora derecelerinin yalnızca yaklaşık yüzde 30'u -bilgisayar bilimi, fizik ve mühendislikte ise daha da azı- her yıl kadınlara verilmektedir.", [1334]),
    2403: ("Without artificial fertilisers and pesticides, there would not be enough food grown on Earth to satisfy our needs, even with equal ---- of agricultural output.",
           "Yapay gübreler ve tarım ilaçları olmasaydı, tarımsal üretimin eşit ---- olsa bile Dünya'da ihtiyaçlarımızı karşılamaya yetecek kadar gıda yetiştirilemezdi.", [2404]),
    3001: ("(I) Martin Luther King Jr. was born in 1929 and grew up in the Deep South, a region of America with a history scarred by slavery and racial segregation.",
           "(I) Martin Luther King Jr. 1929'da doğmuş ve Amerika'nın, köleliğin ve ırk ayrımcılığının izlerini taşıyan bir bölgesi olan Derin Güney'de büyümüştür.", []),
}
for i, (e_yeni, t_yeni, yutulan) in ONARIM.items():
    degistir('ONARIM', i, e_yeni, t_yeni)
    for j in yutulan:
        sil(j, 'onarılan cümlenin parçası ([%d] içine alındı)' % i)

# ------------------------------------------------------------------ KUYRUK
for i in (5789, 5791, 5794, 5796, 5799, 5801, 5804, 6789, 6805):
    e = K[i]['e']
    e2 = re.sub(r'\s\d{1,2}(\s\d{1,2})?\.$', '.', e)
    if not e2.endswith('.'):
        e2 += '.'
    degistir('KUYRUK', i, e2)
for d in K:
    if d['e'].endswith(' .'):
        degistir('KUYRUK', d['_i'], d['e'][:-2] + '.')

# ------------------------------------------------------------------ SIL
for i in (1838, 1844, 2014, 2042, 5123):
    sil(i, 'yönerge satırı parçası')
for i in (766, 1439, 2860, 3435, 3436, 4509, 741, 984, 1208, 1374, 1440, 1449, 3145, 3146, 4507):
    sil(i, 'salt şık listesi (cümle değil)')

# ------------------------------------------------------------------ genel temizlik
for d in K:
    for k in ('e', 't'):
        v = d.get(k)
        if v and '  ' in v:
            degistir('BOSLUK', d['_i'], **{('e_yeni' if k == 'e' else 't_yeni'): re.sub(r' {2,}', ' ', v)})

# ------------------------------------------------------------------ dokum
from collections import Counter, defaultdict
sinif_say = Counter(s for s, _, _, _, _ in degisiklik)
kayit_say = Counter()
for s, i, _, _, _ in degisiklik:
    kayit_say[(s, i)] = 1
sinif_kayit = Counter(s for (s, i) in kayit_say)
print('değişen kayıt (sınıf): %s' % dict(sinif_kayit))
print('silinecek kayıt: %d' % len(silinecek))
if sik_uyari:
    print('SIK uyarıları:')
    for u in sik_uyari:
        print('  ', u)

kalan = [d for d in K if d['_i'] not in silinecek]
kucuk = [d for d in kalan if re.match(r'^[a-z]', d['e']) and not d['e'].startswith('e-')]
print('sonuç: %d kayıt; küçük harfle başlayan (şık parçası, karar bekliyor): %d' % (len(kalan), len(kucuk)))

# Markdown dokum
ad = {'BASLIK': 'Kitapçık başlığı önekleri', 'SORUNO': 'Soru numarası önekleri', 'TIRNAK': 'Başa yapışan kapanış tırnağı',
      'SIK': 'Şık listesi + soru kökü', 'ONARIM': 'Noktada bölünmüş cümleler (ondalık / kısaltma / baş harf) — korpustan onarıldı',
      'KUYRUK': 'Sona yapışan soru/sayfa numarası', 'BOSLUK': 'Çift boşluk'}
grup = defaultdict(lambda: defaultdict(dict))
for s, i, alan, eski, yeni in degisiklik:
    grup[s][i][alan] = (eski, yeni)
L = ['# A4 — Cümle listesi temizliği dökümü (5 Eylül 2026)', '',
     'Kaynak: `04_Github/data/cumleler.js`. Dizinler temizlik ÖNCESİ sıra numarasıdır.',
     '', '| Sınıf | Değişen kayıt |', '|---|---|']
for s in ad:
    L.append('| %s | %d |' % (ad[s], sinif_kayit.get(s, 0)))
L += ['| Silinen kayıt | %d |' % len(silinecek), '| **Kayıt sayısı** | **%d → %d** |' % (len(K), len(kalan)), '']
for s in ad:
    if not grup[s]:
        continue
    L += ['## %s (%d)' % (ad[s], len(grup[s])), '']
    for i in sorted(grup[s]):
        d = K[i]
        L.append('**[%d]** %s · %s' % (i, d.get('s', ''), d.get('b', '—')))
        for alan in ('e', 't'):
            if alan in grup[s][i]:
                eski, yeni = grup[s][i][alan]
                L.append('- %s− `%s`' % ('' if alan == 'e' else 'tr ', eski))
                L.append('- %s+ `%s`' % ('' if alan == 'e' else 'tr ', yeni))
        L.append('')
L += ['## Silinen kayıtlar (%d)' % len(silinecek), '']
for i in sorted(silinecek):
    d = K[i]
    L.append('- **[%d]** %s · %s — *%s*' % (i, d.get('s', ''), d.get('b', '—'), silinecek[i]))
    L.append('  - `%s`' % d['e'][:220])
L += ['', '## Dokunulmayan: küçük harfle başlayan şık parçaları (%d)' % len(kucuk), '',
      'Bunlar okuma sorularının A–E şıkları; kökle birleştirilirse tam cümle olur ama çeldiriciler de "cümle" hâline gelir. Karar bekliyor.', '']
for d in kucuk[:60]:
    L.append('- [%d] %s · %s — `%s`' % (d['_i'], d.get('s', ''), d.get('b', '—'), d['e'][:130]))
io.open(DOKUM, 'w', encoding='utf-8', newline='\n').write('\n'.join(L) + '\n')
print('döküm yazıldı:', DOKUM)

if not YAZ:
    print('(kuru koşum — uygulamak için --yaz)')
    raise SystemExit(0)

# ------------------------------------------------------------------ yaz
yeni_satirlar = list(satirlar)
for d in K:
    yeni_satirlar[konum[d['_i']]] = None if d['_i'] in silinecek else satira_don(d) + ','
cikti = [l for l in yeni_satirlar if l is not None]
# son veri satirinin virgulunu kaldir
son = max(i for i, l in enumerate(cikti) if l.startswith('{e:"'))
cikti[son] = cikti[son].rstrip(',')
metin_yeni = '\n'.join(cikti)
metin_yeni = re.sub(r'YDS cümleleri — \d+ cümle', 'YDS cümleleri — %d cümle' % len(kalan), metin_yeni)
io.open(YOL, 'w', encoding='utf-8', newline='\n').write(metin_yeni)
# dogrulama: yeniden ayristir
tekrar = [kayit_ayir(l.rstrip(',')) for l in metin_yeni.split('\n') if l.startswith('{e:"')]
assert len(tekrar) == len(kalan), (len(tekrar), len(kalan))
assert all(x.get('t') for x in tekrar), 'çevirisiz kayıt kaldı'
print('yazıldı: %d kayıt, yeniden ayrıştırma tamam' % len(tekrar))
