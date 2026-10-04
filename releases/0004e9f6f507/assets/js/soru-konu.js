/* Soru kimliği, konu kodu ve içerik türü etiketleri. */
(function () {
  'use strict';

  var KATEGORI_KONU = {
    'Kelime': 'E56',
    'Dil Bilgisi': 'E56',
    'Bağlaç': 'E50',
    'Preposition': 'E51',
    'Cloze Test': 'E57',
    'Cümle Tamamlama': 'E58',
    'Çeviri': 'E59',
    'Okuma': 'E60',
    'Diyalog': 'E61',
    'Restatement': 'E62',
    'Paragraf Tamamlama': 'E63',
    'Anlamı Bozan Cümle': 'E64'
  };

  function kimlik(s) {
    var ham = [s.kat || '', s.pid || s.metin || '', s.s || ''].join('|')
      .normalize('NFKC').replace(/\s+/g, ' ').trim();
    var h = 0x811c9dc5;
    for (var i = 0; i < ham.length; i++) {
      h ^= ham.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return 'q-' + h.toString(16).padStart(8, '0');
  }

  function dilBilgisiKonusu(s) {
    // Çeldiriciler konu sınıflandırmasını belirleyemez: yalnız soru kökü ve
    // doğru seçenek kullanılır. Daha ayırt edici yapılar önce sınanır.
    var kok = String(s.s || '').toLowerCase();
    var cevap = String((s.se || [])[s.d] || '').toLowerCase();
    var x = kok + ' ' + cevap;
    if (/\b(recommend|suggest|insist|demand|request|require|essential|vital)\w*\b[^.]{0,80}\bthat\b/.test(kok)) return 'E20';
    if (/\bif\b|unless|provided that|providing that|as long as|\bwish\b|would rather/.test(x)) return 'E43';
    if (/\bwho\b|\bwhich\b|\bwhose\b|\bwhom\b|relative/.test(x)) return 'E39';
    if (/\b(passive|been|being)\b/.test(x)) return 'E22';
    if (/\b(must|should|ought|needn|have to)\b/.test(x)) return 'E16';
    if (/\b(could|might|may|can|able to)\b/.test(x)) return 'E15';
    if (/gerund|infinitive|\bto (?:be|have|do)\b|\b-ing\b/.test(x)) return 'E26';
    if (/\bhad\b|\bhave\b|\bhas\b|\bwas\b|\bwere\b|since|for years/.test(x)) return 'E08';
    if (/^(?:a|an|the)$/.test(cevap.trim()) || /\barticle\b/.test(kok)) return 'E30';
    return 'E56';
  }

  function baglacKonusu(s) {
    // Bağlacın anlam sınıfı doğru seçenekten gelir; çeldiricileri taramak
    // ilk seçeneklerdeki sözcüklere göre yanlış derse yönlendiriyordu.
    var x = String((s.se || [])[s.d] || '').toLowerCase();
    if (/although|though|whereas|however|despite|nevertheless|nonetheless/.test(x)) return 'E44';
    if (/because|since|therefore|thus|hence|consequently|as a result|owing to|due to/.test(x)) return 'E45';
    if (/so that|in order|provided|providing|unless|except|as long as|\bif\b/.test(x)) return 'E46';
    if (/moreover|furthermore|in addition|for example|in other words|besides|similarly/.test(x)) return 'E47';
    if (/while|when|before|after|until|once|as soon as|by the time/.test(x)) return 'E48';
    return 'E50';
  }

  function konu(s) {
    if (s.konu) return s.konu;
    if (s.kat === 'Dil Bilgisi') return dilBilgisiKonusu(s);
    if (s.kat === 'Bağlaç') return baglacKonusu(s);
    return KATEGORI_KONU[s.kat] || 'E56';
  }

  (window.SORULAR || []).forEach(function (s) {
    s.id = s.id || kimlik(s);
    s.konu = konu(s);
    s.kaynak = s.kaynak || 'calisma-bankasi';
  });

  window.YDS.SoruKonu = {
    kimlik: kimlik,
    konu: konu,
    konuBaglantisi: function (s) { return 'konular.html#' + konu(s); },
    kaynakEtiketi: function (s) {
      return s.kaynak === 'uzman-ozgun' ? 'Özgün çalışma sorusu' : 'Çalışma bankası';
    }
  };
})();
