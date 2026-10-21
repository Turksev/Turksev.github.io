(function () {
  'use strict';
  var Y = window.YDS || {}, H = Y.KalipCalismaHesap, K = Y.KalipCalismaKayit, bank = window.KALIP_CALISMA;
  var $ = function (id) { return document.getElementById(id); };
  $('kalipYuk').hidden = true;
  if (!H || !K || !bank || !Array.isArray(bank.sorular) || !bank.sorular.length) { $('kalipYukHata').hidden = false; return; }
  var map = Object.create(null); bank.sorular.forEach(function (s) { map[s.id] = s; });
  var tur = null, kayitHatasi = !K.geriYukle(bank), oturumHatasi = false;
  function odak(el) {
    try { el.focus({preventScroll:true}); } catch (e) { el.focus(); }
    // Gizlenen formun yüksekliği ve font ölçüleri değişse de yeni hedef ekranda kalsın.
    el.scrollIntoView({block:'center',behavior:'instant'});
  }
  function temiz(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }
  function node(tag, text, cls) { var el = document.createElement(tag); el.textContent = text; if (cls) el.className = cls; return el; }
  function uyari() {
    var text = [];
    if (kayitHatasi) text.push('Bazı sonuçlar yalnız bu oturumda tutuluyor; tarayıcıya kaydedilemedi.');
    if (oturumHatasi) text.push('Yarım tur saklanamadı; sayfayı yenilersen bu turu baştan seçmen gerekir.');
    $('kalipKayitUyari').textContent = text.join(' '); $('kalipKayitUyari').hidden = !text.length;
  }
  function sakla() {
    try {
      if (tur) { tur.kayitHatasi = kayitHatasi; sessionStorage.setItem(K.sessionKey, JSON.stringify(tur)); }
      else sessionStorage.removeItem(K.sessionKey);
      oturumHatasi = false;
    } catch (e) { oturumHatasi = true; }
    uyari();
  }
  function ayar() { return {tur:$('kalipTur').value,kapsam:$('kalipKapsam').value,ara:$('kalipAra').value}; }
  function havuz() { return H.sec(bank, ayar(), K.oku(bank)); }
  function bilgi() {
    var r = K.oku(bank), ids = Object.keys(r), wrong = ids.filter(function (id) { return r[id].sonuc === 'yanlis'; }).length;
    $('kalipIlerleme').textContent = bank.sorular.length + ' soru · ' + ids.length + ' çalışıldı · ' + wrong + ' tekrar gerekiyor';
    var n = havuz().length;
    $('kalipHavuz').textContent = n ? 'Bu seçimde ' + n + ' soru var. Sorular ve seçenekler her turda karışır.' :
      ($('kalipKapsam').value === 'tekrar' ? 'Bu seçimde tekrar gereken soru yok. Tüm soruları seçerek yeni bir çalışma açabilirsin.' : 'Bu kelime veya soru türü için soru bulunamadı. Seçimini genişletebilirsin.');
    $('kalipBaslat').disabled = !n;
  }
  function secimeDon(focus) {
    $('kalipAyar').hidden = false; $('kalipTurAlani').hidden = true; $('kalipBitis').hidden = true;
    $('kalipDevam').hidden = !tur || tur.sira === tur.ids.length;
    $('kalipBaslat').textContent = tur && tur.sira < tur.ids.length ? 'Yeni tur başlat' : 'Çalışmaya başla';
    bilgi(); if (focus) odak($('kalipDevam').hidden ? $('kalipTur') : $('kalipDevam'));
  }
  function baslat(sorular, adet) {
    if (!sorular.length) return;
    tur = H.kur(bank, sorular, adet, K.epoch());
    kayitHatasi = !K.tekrarYaz(); sakla(); ciz(true);
  }
  function bitis(focus) {
    $('kalipAyar').hidden = true; $('kalipTurAlani').hidden = true; $('kalipBitis').hidden = false; $('kalipDevam').hidden = true;
    var o = H.ozet(tur, map);
    $('kalipBitisOzet').textContent = tur.ids.length + ' soruda ' + o.dogru + ' doğru, ' + o.yanlis.length + ' tekrar edilecek soru.';
    var box = temiz($('kalipBitisTurler'));
    Object.keys(o.turler).forEach(function (t) { var r = o.turler[t]; if (r.toplam) box.appendChild(node('p', H.adlar[t] + ': ' + r.dogru + ' / ' + r.toplam)); });
    $('kalipYanlisTekrar').hidden = !o.yanlis.length;
    bilgi(); if (focus) odak($('kalipBitisBaslik'));
  }
  function cozum(s) {
    var a = tur.cevaplar[tur.sira], dogru = a === s.cevap;
    $('kalipCozum').hidden = false;
    $('kalipSonuc').textContent = dogru ? 'Doğru.' : (a === -1 ? 'Cevabı gösterdin. ' : 'Bu cevap uygun değil. ') + 'Doğru cevap: ' + s.secenekler[s.cevap];
    $('kalipSonuc').className = 'kalip-sonuc ' + (dogru ? 'dogru' : 'yanlis');
    $('kalipTamCumle').textContent = s.tamamlanmis; $('kalipCeviri').textContent = s.ceviri; $('kalipAciklama').textContent = s.aciklama;
    var pair = temiz($('kalipDogruKalip')), span = node('span', ''), b = node('b', s.kalip.en); b.lang = 'en'; span.appendChild(b); span.appendChild(node('i',s.kalip.tr)); pair.appendChild(span);
    var compare = temiz($('kalipKarsilastirma'));
    if (s.karsilastirma && s.karsilastirma.length) {
      compare.appendChild(node('h4','Yapıları karşılaştır'));
      var grid = node('div','','kalip-karsilastir');
      s.karsilastirma.forEach(function (p) { var el = node('div',''), en = node('b',p.en); en.lang = 'en'; el.appendChild(en); el.appendChild(node('span',p.tr)); grid.appendChild(el); });
      compare.appendChild(grid);
    }
    var kaynak = temiz($('kalipKaynaklar'));
    s.kaynaklar.forEach(function (url, i) { var a = node('a','Sözlük / dil bilgisi kaynağı ' + (i + 1)); a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; kaynak.appendChild(a); });
    var link = node('a','Kelimeyi sitede ara'); link.href = 'ara.html?q=' + encodeURIComponent(s.kelime); link.target = '_blank'; link.rel = 'noopener'; kaynak.appendChild(link);
    $('kalipSonraki').textContent = tur.sira + 1 === tur.ids.length ? 'Tur sonucunu gör' : 'Sonraki soru';
  }
  function ciz(focus) {
    if (!tur) { secimeDon(focus); return; }
    if (tur.sira === tur.ids.length) { bitis(focus); return; }
    $('kalipAyar').hidden = true; $('kalipTurAlani').hidden = false; $('kalipBitis').hidden = true; $('kalipDevam').hidden = true;
    var s = map[tur.ids[tur.sira]], yanitli = tur.cevaplar.length > tur.sira;
    $('kalipSayac').textContent = 'Soru ' + (tur.sira + 1) + ' / ' + tur.ids.length;
    $('kalipRozet').textContent = H.adlar[s.tur]; $('kalipSoruBaslik').textContent = s.kelime; $('kalipSoruBaslik').lang = 'en';
    $('kalipCumle').textContent = s.cumle; $('kalipSoru').textContent = s.soru;
    var box = temiz($('kalipSiklar'));
    tur.duzenler[tur.sira].forEach(function (n) {
      var label = node('label','','kalip-sik'), input = document.createElement('input'), text = node('span',s.secenekler[n]);
      input.type = 'radio'; input.name = 'kalipCevap'; input.value = String(n); input.checked = yanitli && tur.cevaplar[tur.sira] === n;
      text.lang = s.tur === 'anlam' ? 'tr' : 'en'; label.appendChild(input); label.appendChild(text);
      if (yanitli && n === s.cevap) { label.classList.add('kalip-dogru'); text.appendChild(node('small','✓ Doğru cevap')); }
      else if (yanitli && n === tur.cevaplar[tur.sira]) { label.classList.add('kalip-yanlis'); text.appendChild(node('small','✗ Seçimin')); }
      box.appendChild(label);
    });
    $('kalipSecenekler').disabled = yanitli; $('kalipCevapForm').querySelector('.kalip-eylemler').hidden = yanitli;
    $('kalipSecUyari').hidden = true; $('kalipCozum').hidden = !yanitli;
    $('kalipCozum').querySelector('details').open = false;
    if (yanitli) cozum(s);
    if (focus) odak($('kalipSoruBaslik'));
  }
  function cevapla(n) {
    if (!tur) return;
    if (tur.epoch !== K.epoch()) { sifirlandi(); return; }
    var s = map[tur.ids[tur.sira]];
    if (!s || !H.cevapla(tur, s, n)) return;
    kayitHatasi = !K.yaz(s, n === s.cevap); sakla(); ciz(false); bilgi(); odak($('kalipSonuc'));
  }
  function sifirlandi() {
    var aktif = document.activeElement;
    var odagiTasi = !$('kalipPaneli').hidden && ($('kalipTurAlani').contains(aktif) || $('kalipBitis').contains(aktif));
    tur = null; kayitHatasi = false; sakla(); secimeDon(odagiTasi);
  }
  $('kalipAyar').addEventListener('submit', function (e) { e.preventDefault(); var list = havuz(); var n = $('kalipAdet').value; baslat(list, n === 'hepsi' ? list.length : Number(n)); });
  ['kalipTur','kalipKapsam','kalipAdet'].forEach(function (id) { $(id).addEventListener('change',bilgi); });
  $('kalipAra').addEventListener('input',bilgi);
  $('kalipCevapForm').addEventListener('submit', function (e) {
    e.preventDefault(); var input = $('kalipSiklar').querySelector('input:checked');
    if (!input) { $('kalipSecUyari').hidden = false; odak($('kalipSiklar').querySelector('input')); return; }
    cevapla(Number(input.value));
  });
  $('kalipGoster').addEventListener('click',function () { cevapla(-1); });
  $('kalipSonraki').addEventListener('click', function () { if (!tur || tur.cevaplar.length !== tur.sira + 1) return; tur.sira++; sakla(); ciz(true); });
  $('kalipAraVer').addEventListener('click',function () { sakla(); secimeDon(true); });
  $('kalipDevam').addEventListener('click',function () { ciz(true); });
  $('kalipYeniTur').addEventListener('click',function () { tur = null; sakla(); secimeDon(true); });
  $('kalipYanlisTekrar').addEventListener('click',function () { var ids = H.ozet(tur,map).yanlis; baslat(ids.map(function (id) { return map[id]; }),ids.length); });
  $('kalipSifirla').addEventListener('click',function () {
    if (!window.confirm('Bu tarayıcıdaki kalıp çalışma sonuçları ve açık tur silinecek. Kelime tekrar kutuların korunacak. Devam edilsin mi?')) return;
    if (!K.sifirla()) { kayitHatasi = true; uyari(); return; }
    odak($('kalipTur'));
  });
  window.addEventListener('yds-kalip-sifirlandi',sifirlandi);
  window.addEventListener('storage',function (e) {
    if (e.key === null || e.key === K.epochKey) { sifirlandi(); return; }
    if (e.key && e.key.indexOf(K.prefix) === 0) bilgi();
  });
  window.addEventListener('yds-oyun-bolumu',function (e) { if (e.detail === 'kalip') bilgi(); });
  window.addEventListener('pageshow',function () { if (tur && tur.epoch !== K.epoch()) sifirlandi(); else bilgi(); });
  try { var saved = JSON.parse(sessionStorage.getItem(K.sessionKey)); if (H.gecerli(saved,bank,K.epoch())) tur = saved; } catch (e) { /* Yeni çalışma seçilebilir. */ }
  $('kalipHazir').hidden = false; bilgi(); ciz(false); uyari();
})();
