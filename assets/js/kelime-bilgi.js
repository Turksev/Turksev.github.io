/* Kelime bilgi notu — kelimenin YDS sınavlarındaki kullanım analizi.
   Kart üzerindeki ℹ düğmesiyle açılır.

   Veri (data/kelime-bilgi.js, ~3,7 MB) SAYFA AÇILIŞINDA YÜKLENMEZ; ilk ℹ
   tıklamasında bir kez indirilir. Böylece listeyi açan kullanıcı bedelini ödemez.

   window.KelimeBilgi.ac(kelime, kutuElemani)  -> notu açar/kapatır
*/
(function () {
  'use strict';

  var VERI_YOLU = 'data/kelime-bilgi.js';
  var dizin = null;          // kelime -> kayıt
  var yukleniyor = null;     // Promise

  function kacar(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function yukle() {
    if (dizin) return Promise.resolve(dizin);
    if (yukleniyor) return yukleniyor;
    yukleniyor = new Promise(function (coz, hata) {
      if (window.KELIME_BILGI) return coz();
      var s = document.createElement('script');
      s.src = VERI_YOLU;
      s.onload = coz;
      s.onerror = function () { hata(new Error('kelime-bilgi.js yüklenemedi')); };
      document.head.appendChild(s);
    }).then(function () {
      dizin = Object.create(null);
      (window.KELIME_BILGI || []).forEach(function (r) { dizin[r.e] = r; });
      return dizin;
    });
    return yukleniyor;
  }

  /* Kelimenin sınavda nasıl kullanıldığını tek cümleyle özetler. */
  function ozet(r) {
    var p = [];
    if (r.dc) {
      p.push('<b>' + r.dc + ' kez doğru cevap</b> olmuş');
    }
    if (r.cd) {
      p.push(r.cd + ' kez çeldirici olarak kullanılmış');
    }
    if (!p.length) {
      return 'Sınav metinlerinde geçiyor, ancak şık olarak sorulmamış.';
    }
    return p.join(', ') + '.';
  }

  function turSatiri(r) {
    if (!r.tr) return '';
    var k = Object.keys(r.tr);
    if (!k.length) return '';
    k.sort(function (a, b) { return r.tr[b] - r.tr[a]; });
    return '<div class="kb-blok"><h4>Hangi soru türlerinde çıktı</h4><div class="kb-rozetler">' +
      k.map(function (t) {
        return '<span class="badge">' + kacar(t) + ' <b>' + r.tr[t] + '</b></span>';
      }).join('') + '</div></div>';
  }

  function gecisSatiri(r) {
    if (!r.g || !r.g.length) return '';
    return '<div class="kb-blok"><h4>Sınavda geçtiği yerler</h4>' +
      r.g.map(function (g) {
        var etiket = kacar(g.s) + (g.b ? ' · ' + kacar(g.b) : '') +
                     (g.n ? ' · ' + g.n + '. soru' : '');
        var rozet = g.d
          ? '<span class="kb-dogru">doğru cevap' + (g.h ? ' (' + kacar(g.h) + ')' : '') + '</span>'
          : '<span class="kb-celdirici">çeldirici' + (g.h ? ' (' + kacar(g.h) + ')' : '') + '</span>';
        return '<div class="kb-gecis">' +
                 '<div class="kb-yer">' + etiket + ' ' + rozet + '</div>' +
                 (g.sk ? '<div class="kb-sik" lang="en">' + kacar(g.sk) + '</div>' : '') +
                 (g.k ? '<div class="kb-kok" lang="en">' + kacar(g.k) + '</div>' : '') +
               '</div>';
      }).join('') + '</div>';
  }

  function icerik(kelime, r) {
    if (!r) {
      return '<div class="kb-bos">Bu kelime için sınav kullanım kaydı yok.</div>';
    }
    var ust = '<div class="kb-rozetler">' +
      '<span class="badge accent" title="YDS öncelik puanı">' + r.p + ' puan</span>' +
      (r.sv ? '<span class="badge">' + r.sv + ' sınavda</span>' : '') +
      (r.fr ? '<span class="badge">' + r.fr + ' kez geçmiş</span>' : '') +
      (r.dc ? '<span class="badge ok">✓ ' + r.dc + ' kez doğru cevap</span>' : '') +
      (r.cd ? '<span class="badge">' + r.cd + ' kez çeldirici</span>' : '') +
      '</div>';
    var yil = r.yl
      ? '<div class="kb-blok"><h4>Yıllar</h4><div class="kb-yillar">' + kacar(r.yl) + '</div></div>'
      : '';
    return ust +
           '<p class="kb-ozet">' + ozet(r) + '</p>' +
           turSatiri(r) + yil + gecisSatiri(r);
  }

  function ac(kelime, kutu) {
    var mevcut = kutu.querySelector('.kb-panel');
    if (mevcut) { mevcut.remove(); return; }
    var p = document.createElement('div');
    p.className = 'kb-panel';
    p.innerHTML = '<div class="kb-yukleniyor">Bilgi notu yükleniyor…</div>';
    kutu.appendChild(p);

    /* Veri 3,7 MB; yükleme sürerken sayfa kendini yeniden çizip paneli
       kutudan söküyor olabilir. Yazmadan önce hâlâ bağlı mı diye bakıp
       gerekirse geri takıyoruz — yoksa kullanıcı hiçbir şey görmüyor. */
    function yaz(html) {
      p.innerHTML = html;
      if (p.parentNode !== kutu) {
        var eski = kutu.querySelector('.kb-panel');
        if (eski) eski.remove();
        kutu.appendChild(p);
      }
    }

    yukle().then(function (d) {
      yaz('<div class="kb-baslik">' + kacar(kelime) +
          ' <span class="muted small">— sınavdaki kullanımı</span></div>' +
          icerik(kelime, d[String(kelime).toLowerCase()]));
    }).catch(function (e) {
      yaz('<div class="kb-bos">Bilgi notu yüklenemedi' +
          (e && e.message ? ' (' + kacar(e.message) + ')' : '') + '.</div>');
    });
  }

  window.KelimeBilgi = { ac: ac, yukle: yukle };
})();
