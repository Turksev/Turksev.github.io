/* ============================================================
   Elenen kelimeler — dönüştürücü girdisi (site bu dosyayı YÜKLEMEZ)

   Kaynak listeler korpus frekansından üretildiği için YDS'de hiç sorulmayacak
   kaba/argo sözcükler ve özel adlar da içeri sızmıştı. Buradaki kelimeler
   data/kelime-dizin.js ve katman dosyalarına HİÇ girmez; test cümleleri de
   üretilmez (tools/test-uretim/dogrula.py bunları atar).

   Yalnız gerçekten atılması gerekenleri yaz: "jack (kriko)", "frank (içten)",
   "hunter (avcı)" gibi aynı zamanda özel ad olan ama meşru anlamı bulunan
   kelimeler listede DEĞİLDİR, kalmalıdır.

   Eklemeden sonra: tools/listeyi-aktar.py ve tools/aile-cikar.py çalıştır.
   ============================================================ */

window.KELIME_ELEME = [
  // kaba / argo
  "fuck",
  "fucking",
  "shit",
  "bitch",
  "dick",
  "bloody",
  "damn",

  // özel ad ya da anlamı yalnız argo olan
  "john",       // (argo) fahişe müşterisi / tuvalet
  "christ",     // Mesih — özel ad
  "benjamin"    // benzoin reçinesi — marjinal, özel adla karışıyor
];
