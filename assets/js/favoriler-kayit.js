/* Kelime favorileri: kutu ilerlemesinden bağımsız, kayıt bazında eşitlenen liste. */
(function () {
  'use strict';
  var Y = window.YDS, D = Y.Depo, M = Y.EsitlemeMotoru;
  var ANAHTAR = 'yds-favoriler';
  var own = Object.prototype.hasOwnProperty;
  var current = oku();
  var ikon = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m12 2.8 2.8 5.7 6.3.9-4.55 4.44 1.08 6.27L12 17.15l-5.63 2.96 1.08-6.27L2.9 9.4l6.3-.9Z"/></svg>';
  function kimlik(word) { return M.kelimeKimligi(String(word || '').trim()); }
  function bilinenKelime(id) { var row = Y.Veri.dizinKaydi(id); return !!row && row.e === id; }
  function oku() {
    var map = D.oku(ANAHTAR, {});
    return map && typeof map === 'object' && !Array.isArray(map) ? map : {};
  }
  function varMi(word) {
    var map = current, id = kimlik(word);
    return own.call(map, id) && Number.isSafeInteger(map[id]) && map[id] > 0;
  }
  function liste() {
    var map = current;
    return Object.keys(map).filter(function (id) {
      return Number.isSafeInteger(map[id]) && map[id] > 0 && bilinenKelime(id);
    }).sort(function (a, b) { return map[b] - map[a] || a.localeCompare(b, 'en'); });
  }
  function ayarla(word, selected) {
    current = oku();
    var id = kimlik(word);
    if (!bilinenKelime(id)) return false;
    if (varMi(id) === !!selected) return true;
    var ok;
    if (!selected) ok = D.kayitlariSil(ANAHTAR, [id], 'favori') !== false;
    else {
      var row = Object.create(null); row[id] = Date.now();
      ok = D.kayitlariYaz(ANAHTAR, row, 'favori') !== false;
    }
    if (ok) current = oku();
    return ok;
  }
  function etiket(word, selected) { return word + (selected ? ' kelimesini favorilerden çıkar' : ' kelimesini favorilere ekle'); }
  function dugmeHtml(word) {
    var selected = varMi(word), label = Y.kacar(etiket(word, selected));
    return '<button class="favori-dugme" type="button" data-favori-kelime="' + Y.kacar(word) + '" aria-pressed="' + selected + '" aria-label="' + label + '" title="' + label + '">' + ikon + '</button>';
  }
  function dugmeCiz(button, word) {
    if (!button) return;
    var selected = varMi(word), label = etiket(word, selected);
    button.hidden = false;
    button.setAttribute('data-favori-kelime', word);
    button.setAttribute('aria-pressed', String(selected));
    button.setAttribute('aria-label', label); button.title = label;
    if (!button.querySelector('svg')) button.innerHTML = ikon;
  }
  function gorunumuTazele() {
    current = oku();
    document.querySelectorAll('[data-favori-kelime]').forEach(function (button) {
      dugmeCiz(button, button.getAttribute('data-favori-kelime'));
    });
    document.querySelectorAll('[data-favori-sayi]').forEach(function (node) { node.textContent = liste().length.toLocaleString('tr-TR'); });
  }
  document.addEventListener('click', function (e) {
    var button = e.target.closest('[data-favori-kelime]');
    if (!button) return;
    var word = button.getAttribute('data-favori-kelime'), selected = !varMi(word);
    if (!ayarla(word, selected)) { Y.depolamaUyarisi(); return; }
    gorunumuTazele();
    var status = document.getElementById('favoriDurum');
    if (status) status.textContent = word + (selected ? ' favorilerine eklendi.' : ' favorilerinden çıkarıldı.');
  });
  window.addEventListener('yds-depo-degisti', function (e) {
    var keys = e.detail && e.detail.anahtarlar;
    if (keys && keys.length && keys.indexOf(ANAHTAR) === -1) return;
    gorunumuTazele();
    window.dispatchEvent(new CustomEvent('yds-favoriler-degisti'));
  });
  window.addEventListener('pageshow', gorunumuTazele);
  Y.Favoriler = { ANAHTAR: ANAHTAR, varMi: varMi, liste: liste, ayarla: ayarla, dugmeHtml: dugmeHtml, dugmeCiz: dugmeCiz, tazele: gorunumuTazele };
  gorunumuTazele();
})();
