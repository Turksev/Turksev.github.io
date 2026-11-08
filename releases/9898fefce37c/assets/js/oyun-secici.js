/* Bölüm seçimi alıştırma verisi yüklenmese de çalışır. */
(function () {
  'use strict';
  var yazma = document.getElementById('yazmaPaneli'), kalip = document.getElementById('kalipPaneli');
  var yazBtn = document.getElementById('yazmaAc'), kalBtn = document.getElementById('kalipAc');
  function ac(k, url) {
    yazma.hidden = k; kalip.hidden = !k;
    yazBtn.setAttribute('aria-pressed', String(!k)); kalBtn.setAttribute('aria-pressed', String(k));
    if (url) history.replaceState(null, '', location.pathname + location.search + (k ? '#kalip' : '#yazma'));
    window.dispatchEvent(new CustomEvent('yds-oyun-bolumu', {detail:k ? 'kalip' : 'yazma'}));
  }
  yazBtn.addEventListener('click', function () { ac(false, true); });
  kalBtn.addEventListener('click', function () { ac(true, true); });
  window.addEventListener('hashchange', function () { if (location.hash === '#kalip' || location.hash === '#yazma') ac(location.hash === '#kalip', false); });
  ac(location.hash === '#kalip', false);
})();
