/* YDS sınav bölüm dağılımı — 80 soru, sıraya göre.

   TEK KAYNAK: tools/deneme-bankasi-uret.js içindeki bölüm sırası. Deneme
   formları oradan üretilir; bu dosya aynı sırayı sayfada göstermek içindir.
   Bölüm sırası ya da soru sayısı orada değişirse burası da güncellenmeli.

   Alanlar: ad=bölüm, n=soru sayısı, not=kısa açıklama. Soru numaraları
   sırayla toplanarak hesaplanır, elle yazılmaz. */

window.YDS_DAGILIM = [
  { ad: 'Kelime',              n: 6,  not: 'Boşluğa uyan sözcük' },
  { ad: 'Dil Bilgisi',         n: 4,  not: 'Zaman, yapı, çatı' },
  { ad: 'Bağlaç',              n: 4,  not: 'Cümleler arası anlam ilişkisi' },
  { ad: 'Preposition',         n: 2,  not: 'Edat ve edat kalıbı' },
  { ad: 'Cloze Test',          n: 10, not: 'İki metin, beşer boşluk' },
  { ad: 'Cümle Tamamlama',     n: 10, not: 'Yarım cümlenin devamı' },
  { ad: 'Çeviri',              n: 6,  not: '3 İngilizce→Türkçe, 3 Türkçe→İngilizce' },
  { ad: 'Okuma',               n: 20, not: 'Beş parça, her birine dört soru' },
  { ad: 'Diyalog',             n: 5,  not: 'Karşılıklı konuşmada eksik replik' },
  { ad: 'Restatement',         n: 4,  not: 'Aynı anlamı veren cümle' },
  { ad: 'Paragraf Tamamlama',  n: 4,  not: 'Paragraftaki boşluğa gelen cümle' },
  { ad: 'Anlamı Bozan Cümle',  n: 5,  not: 'Akışa uymayan cümleyi bulma' }
];
