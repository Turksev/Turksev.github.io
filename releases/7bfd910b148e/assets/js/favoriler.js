/* Favorilerden isteğe bağlı ek tekrar. Leitner ve günlük sayaçlara yazmaz. */
(function () {
  'use strict';
  var Y = window.YDS, F = Y.Favoriler, V = Y.Veri, esc = Y.kacar;
  var $ = function (id) { return document.getElementById(id); };
  var filtered = [], limit = 20, queue = [], index = 0, answers = Object.create(null);
  var active = false, finished = false, opened = false, loadId = 0;
  var record = null, examples = [];
  var canSpeak = 'speechSynthesis' in window;

  function say(word) {
    if (!canSpeak) return;
    try {
      window.speechSynthesis.cancel();
      var utterance = new SpeechSynthesisUtterance(word); utterance.lang = 'en-GB';
      window.speechSynthesis.speak(utterance);
    } catch (e) { $('favoriDurum').textContent = 'Sesli okuma bu cihazda başlatılamadı.'; }
  }
  function screens() {
    $('favoriListeBolum').hidden = active || finished;
    $('favoriCalisma').hidden = !active;
    $('favoriSonuc').hidden = !finished;
  }
  function listDraw() {
    var all = F.liste(), query = Y.sadelestir($('favoriAra').value.trim());
    filtered = all.filter(function (word) {
      var row = V.dizinKaydi(word);
      return !query || Y.sadelestir(word + ' ' + row.t).indexOf(query) !== -1;
    });
    if ($('favoriSirala').value === 'az') filtered.sort(function (a, b) { return a.localeCompare(b, 'en'); });
    $('favoriSayac').textContent = all.length.toLocaleString('tr-TR') + ' favori kelime' + (query ? ' · ' + filtered.length + ' eşleşme' : '');
    $('favoriCalis').disabled = !filtered.length;
    $('favoriCalis').textContent = query ? 'Eşleşenleri çalış (' + filtered.length + ')' : 'Karışık çalış';
    $('favoriBos').hidden = !!filtered.length;
    $('favoriBosMetin').textContent = all.length ? 'Bu aramayla eşleşen favori kelime yok.' : 'Henüz favori kelimen yok. Kelime kartındaki boş yıldıza dokunarak başlayabilirsin.';
    var focused = document.activeElement, focusWord = focused && focused.getAttribute('data-favori-kelime');
    var priorButtons = Array.from($('favoriListe').querySelectorAll('[data-favori-kelime]'));
    var focusIndex = priorButtons.indexOf(focused);
    $('favoriListe').innerHTML = filtered.slice(0, limit).map(function (word) {
      var d = V.dizinKaydi(word);
      return '<article class="card favori-satir">' + F.dugmeHtml(word) +
        '<div class="favori-sozcuk"><strong lang="en">' + esc(word) + '</strong><p>' + esc(d.t) + '</p></div>' +
        '<button type="button" class="btn ghost sm" data-favori-calis="' + esc(word) + '" aria-label="' + esc(word) + ' kelimesini favorilerde çalış">Çalış</button></article>';
    }).join('');
    $('favoriDaha').hidden = filtered.length <= limit;
    if (focusWord && focusIndex >= 0) {
      var buttons = Array.from($('favoriListe').querySelectorAll('[data-favori-kelime]'));
      var next = buttons.find(function (b) { return b.getAttribute('data-favori-kelime') === focusWord; }) || buttons[Math.min(focusIndex, buttons.length - 1)];
      (next || $('favoriAra')).focus();
    }
  }
  function listReturn() {
    active = false; finished = false; loadId++; screens(); listDraw(); $('favoriAra').focus();
  }
  function counter() {
    $('favoriKartSayac').textContent = (index + 1) + ' / ' + queue.length + ' · ek tekrar';
    $('favoriOnceki').disabled = index === 0;
    $('favoriSonraki').disabled = index === queue.length - 1;
  }
  function revealState() {
    $('favoriCevap').hidden = !opened;
    $('favoriDiger').hidden = !opened || !$('favoriDiger').innerHTML;
    $('favoriTemel').hidden = !opened || !$('favoriTemel').innerHTML;
    $('favoriKart').setAttribute('aria-expanded', String(opened));
    $('favoriKart').setAttribute('aria-label', queue[index] + (opened ? ' kelimesinin cevabı açık' : ' kelimesinin cevabını göster'));
    $('favoriKartIpucu').textContent = opened ? 'Hatırladın mı? Aşağıdan kendini değerlendir.' : 'Cevabı açmak için karta tıkla veya boşluk tuşuna bas.';
    $('favoriZor').disabled = !opened; $('favoriBildim').disabled = !opened;
  }
  function answerDraw() {
    var word = queue[index], d = V.dizinKaydi(word);
    if (!word || !d) return;
    var primary = record && Y.KalipSunum ? Y.KalipSunum.html(word, record.kl || [], { centered: true, part: 'primary' }) : '';
    $('favoriCevap').innerHTML = primary + (record ? record.a : [{tr:d.t}]).map(function (a, i) {
      var example = examples[i] || a;
      return '<div class="favori-anlam"><strong>' + esc(a.tr) + '</strong>' +
        (example.ex ? '<p lang="en">' + esc(example.ex) + '</p><p class="muted">' + esc(example.exTr) + '</p>' : '') + '</div>';
    }).join('');
    $('favoriDiger').innerHTML = record && Y.KalipSunum ? Y.KalipSunum.html(word, record.kl || [], { part: 'secondary' }) : '';
    var roots = Y.KelimeBicimleri ? Y.KelimeBicimleri.entries(word) : [];
    function rootRow(r) {
      return '<div class="card-base-row"><div class="card-base-heading"><strong lang="en">' + esc(r.base) + '</strong>' +
        (canSpeak ? '<button type="button" class="btn ghost sm" data-favori-ses="' + esc(r.base) + '">🔊 Dinle</button>' : '') +
        '</div><p>' + esc(r.meaning) + '</p><p class="card-base-pattern" lang="en">' + esc(r.pattern) + '</p><p class="small">' + esc(r.description) + '</p>' +
        (r.note ? '<p class="small muted">' + esc(r.note) + '</p>' : '') + '</div>';
    }
    $('favoriTemel').innerHTML = roots.length ? '<h3>Temel biçimiyle öğren</h3>' + roots.map(function (r) { return rootRow(r) + (r.chain || []).map(rootRow).join(''); }).join('') : '';
    revealState();
  }
  function loadCard() {
    var word = queue[index], d = V.dizinKaydi(word), request = ++loadId;
    $('favoriYukleme').textContent = 'Anlamlar ve örnekler yükleniyor…';
    $('favoriYenidenYukle').hidden = true;
    return V.katmanYukle(d.k).then(function () {
      if (!active || request !== loadId || word !== queue[index]) return;
      record = V.kayit(word);
      if (!record || !Array.isArray(record.a)) throw new Error('missing-word-record');
      examples = V.ornekleriSec(word, record.a);
      $('favoriYukleme').textContent = ''; answerDraw();
    }).catch(function () {
      if (!active || request !== loadId || word !== queue[index]) return;
      $('favoriYukleme').textContent = 'Tam içerik yüklenemedi. Kısa anlamı görebilirsin; örnek ve kalıplar için yeniden dene.';
      $('favoriYenidenYukle').hidden = false;
    });
  }
  function cardDraw(focus) {
    if (!queue.length) { listReturn(); return; }
    opened = false; record = null; examples = [];
    $('favoriKelime').textContent = queue[index];
    F.dugmeCiz($('favoriKartYildiz'), queue[index]);
    counter(); answerDraw(); loadCard();
    if (focus) $('favoriKart').focus();
  }
  function start(words, first) {
    var seen = Object.create(null);
    queue = Y.karistir(words.filter(function (word) {
      if (seen[word] || !F.varMi(word) || !V.dizinKaydi(word)) return false;
      seen[word] = true; return true;
    }));
    if (!queue.length) { listReturn(); return; }
    if (first && queue.indexOf(first) !== -1) queue = [first].concat(queue.filter(function (word) { return word !== first; }));
    index = 0; answers = Object.create(null); active = true; finished = false;
    screens(); cardDraw(true);
    $('favoriCalisma').scrollIntoView({ behavior: Y.hareket(), block: 'start' });
  }
  function resultsDraw() {
    var yes = queue.filter(function (w) { return answers[w] === true; }).length;
    var no = queue.filter(function (w) { return answers[w] === false; }).length;
    $('favoriSonucMetin').textContent = (yes + no) + ' kelime çalıştın: ' + yes + ' kelimeyi hatırladın, ' + no + ' kelimeyi yeniden çalışmak istedin. Kutuların ve günlük kotan değişmedi.';
    $('favoriZorlari').hidden = !no;
    $('favoriTumunu').disabled = !F.liste().length;
  }
  function grade(remembered) {
    if (!active || !opened || !queue[index]) return;
    answers[queue[index]] = remembered;
    var next = -1;
    for (var offset = 1; offset <= queue.length; offset++) {
      var candidate = (index + offset) % queue.length;
      if (!Object.prototype.hasOwnProperty.call(answers, queue[candidate])) { next = candidate; break; }
    }
    if (next >= 0) { index = next; cardDraw(true); return; }
    active = false; finished = true; loadId++; screens(); resultsDraw(); $('favoriSonucBaslik').focus();
  }
  function move(step) {
    if (!active || index + step < 0 || index + step >= queue.length) return;
    index += step; cardDraw(false);
  }
  function refresh() {
    F.tazele();
    listDraw();
    if (active || finished) {
      var current = queue[index];
      queue = queue.filter(function (word) { return F.varMi(word); });
      if (!queue.length) { listReturn(); return; }
      if (active) {
        var found = queue.indexOf(current);
        index = found >= 0 ? found : Math.min(index, queue.length - 1);
        if (found < 0) cardDraw(false); else counter();
      } else resultsDraw();
    }
  }
  function reveal() { if (!active || opened) return; opened = true; revealState(); }
  $('favoriAra').addEventListener('input', function () { limit = 20; listDraw(); });
  $('favoriSirala').addEventListener('change', function () { limit = 20; listDraw(); });
  $('favoriDaha').addEventListener('click', function () { limit += 20; listDraw(); });
  $('favoriCalis').addEventListener('click', function () { start(filtered); });
  $('favoriListe').addEventListener('click', function (e) { var b = e.target.closest('[data-favori-calis]'); if (b) start(filtered, b.getAttribute('data-favori-calis')); });
  $('favoriKart').addEventListener('click', function () { if (!Y.metinSecildi($('favoriKart'))) reveal(); });
  $('favoriKart').addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target === this) { e.preventDefault(); reveal(); } });
  $('favoriBildim').addEventListener('click', function () { grade(true); });
  $('favoriZor').addEventListener('click', function () { grade(false); });
  $('favoriOnceki').addEventListener('click', function () { move(-1); });
  $('favoriSonraki').addEventListener('click', function () { move(1); });
  $('favoriSes').hidden = !canSpeak;
  $('favoriSes').addEventListener('click', function () { if (queue[index]) say(queue[index]); });
  $('favoriTemel').addEventListener('click', function (e) { var b = e.target.closest('[data-favori-ses]'); if (b) say(b.getAttribute('data-favori-ses')); });
  $('favoriYenidenYukle').addEventListener('click', loadCard);
  $('favoriListeye').addEventListener('click', listReturn);
  $('favoriBitir').addEventListener('click', listReturn);
  $('favoriZorlari').addEventListener('click', function () { start(queue.filter(function (word) { return answers[word] === false; })); });
  $('favoriTumunu').addEventListener('click', function () { start(F.liste()); });
  document.addEventListener('keydown', function (e) {
    if (!active || e.defaultPrevented || e.repeat || e.isComposing || e.ctrlKey || e.altKey || e.metaKey) return;
    var el = document.activeElement;
    if (el && (el.isContentEditable || /INPUT|SELECT|TEXTAREA/.test(el.tagName) || el.closest('details'))) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); move(-1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); move(1); }
    else if (e.key === ' ' && !(el && /^(BUTTON|A)$/.test(el.tagName))) { e.preventDefault(); reveal(); }
    else if (e.key === '1') { e.preventDefault(); grade(false); }
    else if (e.key === '2') { e.preventDefault(); grade(true); }
    else if (e.key.toLowerCase() === 's' && queue[index]) { e.preventDefault(); say(queue[index]); }
  });
  window.addEventListener('yds-favoriler-degisti', refresh);
  window.addEventListener('pageshow', refresh);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) refresh(); });
  screens(); listDraw();
})();
