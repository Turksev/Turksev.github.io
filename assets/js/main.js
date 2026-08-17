/* ============================================================
   Ortak yardımcılar: tema, menü, localStorage
   Her sayfada <head> içinde yüklenir (defer'siz kısmı tema için).
   ============================================================ */

(function () {
  'use strict';

  /* ---------- tema ---------- */

  var THEME_KEY = 'yds-tema';

  function kayitliTema() {
    try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; }
  }

  function temaUygula(t) {
    if (t === 'dark' || t === 'light') {
      document.documentElement.setAttribute('data-theme', t);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }

  // Sayfa boyanmadan önce çalışsın diye script <head>'de, senkron duruyor.
  temaUygula(kayitliTema());

  function temaDegistir() {
    var suan = document.documentElement.getAttribute('data-theme');
    if (!suan) {
      // Sistem tercihinin tersine geç.
      var karanlikMi = window.matchMedia('(prefers-color-scheme: dark)').matches;
      suan = karanlikMi ? 'dark' : 'light';
    }
    var yeni = suan === 'dark' ? 'light' : 'dark';
    temaUygula(yeni);
    try { localStorage.setItem(THEME_KEY, yeni); } catch (e) {}
    butonuGuncelle();
  }

  function butonuGuncelle() {
    var btn = document.querySelector('.theme-toggle');
    if (!btn) return;
    var karanlik = document.documentElement.getAttribute('data-theme') === 'dark' ||
      (!document.documentElement.getAttribute('data-theme') &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);
    btn.textContent = karanlik ? '☀' : '☾';
    btn.setAttribute('title', karanlik ? 'Aydınlık temaya geç' : 'Karanlık temaya geç');
    btn.setAttribute('aria-label', btn.getAttribute('title'));
  }

  /* ---------- depolama yardımcıları ---------- */

  var Depo = {
    oku: function (anahtar, varsayilan) {
      try {
        var ham = localStorage.getItem(anahtar);
        return ham === null ? varsayilan : JSON.parse(ham);
      } catch (e) {
        return varsayilan;
      }
    },
    yaz: function (anahtar, deger) {
      try { localStorage.setItem(anahtar, JSON.stringify(deger)); return true; }
      catch (e) { return false; }
    },
    sil: function (anahtar) {
      try { localStorage.removeItem(anahtar); } catch (e) {}
    }
  };

  /* ---------- küçük araçlar ---------- */

  // Türkçe'ye duyarlı, aksansız karşılaştırma için sadeleştirme.
  function sadelestir(s) {
    return (s || '')
      .toLocaleLowerCase('tr')
      .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g')
      .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/â/g, 'a').replace(/î/g, 'i').replace(/û/g, 'u');
  }

  function karistir(dizi) {
    var d = dizi.slice();
    for (var i = d.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = d[i]; d[i] = d[j]; d[j] = t;
    }
    return d;
  }

  function kacar(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* ---------- gezinme: aktif bağlantı ---------- */

  function aktifBaglanti() {
    var yol = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.site-nav a').forEach(function (a) {
      var hedef = a.getAttribute('href');
      if (hedef === yol || (yol === 'index.html' && hedef === './')) {
        a.setAttribute('aria-current', 'page');
      }
    });
  }

  /* ---------- çevrimdışı çalışma ---------- */

  function servisCalisaniniKaydet() {
    // file:// üzerinde ve HTTPS olmayan sunucularda çalışmaz; sessizce geç.
    if (!('serviceWorker' in navigator)) return;
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') return;

    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () { /* önemli değil */ });
    });
  }

  /* ---------- başlat ---------- */

  function baslat() {
    servisCalisaniniKaydet();
    var btn = document.querySelector('.theme-toggle');
    if (btn) btn.addEventListener('click', temaDegistir);
    butonuGuncelle();
    aktifBaglanti();

    var yil = document.querySelector('[data-yil]');
    if (yil) yil.textContent = new Date().getFullYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', baslat);
  } else {
    baslat();
  }

  window.YDS = { Depo: Depo, sadelestir: sadelestir, karistir: karistir, kacar: kacar };
})();
