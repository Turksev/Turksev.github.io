/* ============================================================
   Tür düzeltmeleri — dönüştürücü girdisi (site bu dosyayı YÜKLEMEZ)

   Kaynak listenin Tür sütunu işlev kelimelerinde yanlış ya da eksik:
   "do" isim, "may" isim, "except" fiil diye gelmişti. Tür alanı günün
   testinde çeldirici seçimini yönetir (şıklar aynı türden kurulur) ve
   satırdaki rozette görünür; yanlış tür = yanlış havuzdan çeldirici.

   İlk tür baş türdür: test önce baş türü aynı olan adayları dener.
   Buradaki değer dizindeki y alanının ÜZERİNE yazılır.
   25.08.2026 denetiminde bulundu; listeyi-aktar.py uygular.
   ============================================================ */

window.TUR_DUZELTME = {
  "red-eye": "isim", // gece uçuşu; doğrulanmamış fiil öğretimi kaldırılır
  "split-up": "isim", // karttaki anlam ayrılık/bölünmedir
  "step-in": "isim, sıfat", // giyilecek nesne ve step-in shoes sıfat kullanımı
  "through": "edat, sıfat, zarf", // through the forest anlamındaki edat atlanmıştı
  "well-done": "sıfat, ünlem", // iyi pişmiş ve Well done! takdir ifadesi
  "canvas": "isim", // canvas (tuval/tablo) ile canvass (oy/destek aramak) ayrımı
  "face-lift": "isim, fiil", // ameliyat ismi ve mecazi yenilemek fiili
  "used-car": "sıfat", // used-car dealer gibi ad öncesi bileşik niteleyici
  "upside-down": "sıfat, zarf",
  "vivid": "sıfat",
  "x-ray": "isim, fiil",
  "knowledgeable": "sıfat", // knowledgeably ayrı bir zarftır; yanlış son anlam kaldırılır
  "crazy": "sıfat", // ikinci anlam kişi etiketi yerine crazy about örüntüsüdür
  "trip-up": "fiil", // doğrulanmış trip up deyimsel fiili
  "turn-off": "fiil, isim", // kapatmak fiili ve caydırıcı unsur ismi
  "tusk": "isim", // karttaki anlam hayvanın uzun dişidir
  "cross-section": "isim", // enine kesit; ad öbeği içinde niteleyici kullanılması sıfat yapmaz
  "do": "fiil",
  "may": "fiil",
  "might": "fiil",
  "came": "fiil",
  "governed": "fiil",
  "why": "zarf",
  "else": "zarf",
  "while": "bağlaç, isim",
  "when": "bağlaç, zarf",
  "if": "bağlaç",
  "once": "zarf, bağlaç",
  "yet": "zarf, bağlaç",
  "since": "edat, bağlaç",
  "except": "edat, bağlaç",
  "about": "edat, zarf",
  "after": "edat, bağlaç, zarf",
  "over": "edat, zarf, sıfat",
  "like": "edat, fiil, sıfat",
  "off": "edat, zarf, sıfat",
  "around": "edat, zarf",
  "under": "edat, zarf",
  "near": "edat, sıfat, zarf",
  "behind": "edat, zarf",
  "above": "edat, zarf, sıfat",
  "past": "edat, sıfat, isim",
  "beneath": "edat, zarf",
  "besides": "edat, zarf",
  "unlike": "edat",
  "upon": "edat",
  "given": "edat, sıfat",
  "longer": "sıfat, zarf",
  "roman": "sıfat, isim",
  "lying": "sıfat, isim",
  "sister": "isim, sıfat",
  "chocolate": "isim, sıfat",
  "neanderthal": "isim, sıfat",
  "throughout": "zarf, edat",
  "alongside": "edat, zarf",
  "licence": "isim",
  "identity": "isim",
  "injury": "isim",
  "despite": "edat",
  "albeit": "bağlaç",
  "within": "edat, zarf",
  "underneath": "edat, zarf",
  "though": "bağlaç, zarf",
  "without": "edat",
  "until": "edat, bağlaç",
  "causing": "fiil"
};
