'use strict';
// "Yeni sürüm hazır" bildirimi (assets/js/main.js, servisCalisaniniKaydet). Yeni servis çalışanı bir sekmeden
// etkinleştirilince yalnız o sekme kendini yeniler; öbür sekmelerde bildirim kalır ama bekleyen çalışan
// (kayit.waiting) artık yoktur. O sekmelerde "Şimdi güncelle" yalnız sayfayı yenilemelidir: eski betiklerle
// açık kalan sekme, yeni betikli sekmeyle aynı depoyu paylaşır (bkz. README, "Aynı tarayıcıda birden çok sekme").

var fs = require('fs');
var path = require('path');
var vm = require('vm');
var assert = require('assert');

var kok = process.argv[2] || path.resolve(__dirname, '..', '..');
var kaynak = fs.readFileSync(path.join(kok, 'assets', 'js', 'main.js'), 'utf8');

// bekleyen: kayıt açılışta bekleyen bir çalışan taşıyor mu? Dönen nesne: tıklama işleyicileri ve sayaçlar.
function sekme(bekleyen) {
  var pencereOlaylari = {}, swOlaylari = {}, oturum = new Map();
  var durum = { yenileme: 0, ileti: [], kutu: null, dugmeler: [] };
  function dugme() {
    var d = { isleyici: null };
    d.addEventListener = function (tur, fn) { if (tur === 'click') d.isleyici = fn; };
    return d;
  }
  var document = {
    readyState: 'complete',
    documentElement: {
      classList: { add: function () {} }, setAttribute: function () {}, removeAttribute: function () {},
      getAttribute: function () { return null; }
    },
    body: { appendChild: function (el) { durum.kutu = el; } },
    querySelector: function () { return null; },
    querySelectorAll: function () { return []; },
    addEventListener: function () {},
    getElementById: function (id) { return id === 'surumBildirimi' ? durum.kutu : null; },
    createElement: function () {
      var el = { id: '', className: '', innerHTML: '' };
      el.setAttribute = function () {};
      el.remove = function () { durum.kutu = null; };
      el.querySelectorAll = function () { durum.dugmeler = [dugme(), dugme()]; return durum.dugmeler; };
      return el;
    }
  };
  var kayit = {
    waiting: bekleyen ? { postMessage: function (m) { durum.ileti.push(m); } } : null,
    addEventListener: function () {},
    update: function () {}
  };
  var pencere = {
    matchMedia: function () { return { matches: false }; },
    addEventListener: function (tur, fn) { pencereOlaylari[tur] = fn; }
  };
  var baglam = {
    window: pencere, document: document,
    navigator: {
      serviceWorker: {
        controller: {},
        addEventListener: function (tur, fn) { swOlaylari[tur] = fn; },
        register: function () { return Promise.resolve(kayit); }
      }
    },
    location: { protocol: 'https:', hostname: 'test', pathname: '/kelimeler.html', reload: function () { durum.yenileme++; } },
    localStorage: { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} },
    sessionStorage: {
      getItem: function (a) { return oturum.has(a) ? oturum.get(a) : null; },
      setItem: function (a, v) { oturum.set(a, String(v)); },
      removeItem: function (a) { oturum.delete(a); }
    },
    JSON: JSON, Object: Object, String: String, Date: Date, Math: Math,
    setTimeout: setTimeout, clearTimeout: clearTimeout, setInterval: function () {}
  };
  pencere.window = pencere;
  vm.createContext(baglam);
  vm.runInContext(kaynak, baglam);
  durum.kayit = kayit; durum.oturum = oturum; durum.swOlaylari = swOlaylari; durum.yukle = pencereOlaylari.load;
  return durum;
}

var bekle = function (ms) { return new Promise(function (coz) { setTimeout(coz, ms); }); };

(async function () {
  // 1) Bekleyen çalışan varken: düğme onu etkinleştirir, bu sekmeyi işaretler; sayfa denetleyici değişince yenilenir.
  var a = sekme(true);
  assert.strictEqual(typeof a.yukle, 'function', 'main.js "load" olayına kaydolmadı');
  a.yukle(); await bekle(0);
  assert.ok(a.kutu && a.dugmeler.length === 2 && typeof a.dugmeler[0].isleyici === 'function', 'bekleyen çalışan varken bildirim gösterilir');
  a.dugmeler[0].isleyici();
  // İleti sayfanın bağlamında üretilir: içerik karşılaştırılır.
  assert.strictEqual(JSON.stringify(a.ileti), JSON.stringify([{ type: 'YENI_SURUMU_ETKINLESTIR' }]), 'düğme bekleyen çalışanı etkinleştirir');
  assert.strictEqual(a.oturum.get('yds-sw-yenile'), '1', 'yenilenecek sekme işaretlenir');
  await bekle(160);
  assert.strictEqual(a.yenileme, 0, 'denetleyici değişmeden sayfa yenilenmez');
  a.swOlaylari.controllerchange(); await bekle(160);
  assert.strictEqual(a.yenileme, 1, 'düğmeye basılan sekme denetleyici değişince bir kez yenilenir');

  // 2) Yeni sürüm başka sekmeden etkinleştirildi: bu sekmede denetleyici değişir ama işaret yoktur (yenilenmez),
  //    bekleyen çalışan da kalmaz. Bildirimdeki düğme hata vermeden sayfayı yeniler.
  var b = sekme(true);
  b.yukle(); await bekle(0);
  b.swOlaylari.controllerchange(); await bekle(160);
  assert.strictEqual(b.yenileme, 0, 'düğmeye basılmayan sekme kendiliğinden yenilenmez (açık deneme, yarım iş kaybolmasın)');
  b.kayit.waiting = null;
  assert.doesNotThrow(function () { b.dugmeler[0].isleyici(); }, 'bekleyen çalışan kalmadığında düğme hata vermemeli');
  await bekle(160);
  assert.strictEqual(b.yenileme, 1, 'yeni sürüm başka sekmeden etkinleştirildiyse düğme bu sekmeyi yeniler');
  assert.deepStrictEqual(b.ileti, [], 'olmayan çalışana ileti gönderilmez');

  // 3) "Sonra": bildirim kalkar, hiçbir şey olmaz.
  var c = sekme(true);
  c.yukle(); await bekle(0);
  c.dugmeler[1].isleyici(); await bekle(160);
  assert.deepStrictEqual([c.kutu, c.yenileme, c.ileti.length], [null, 0, 0]);

  console.log('surum-bildirimi: bekleyen çalışanla etkinleştirme, başka sekmeden etkinleşince yenileme ve "Sonra" başarılı');
})().catch(function (h) { console.error(h); process.exitCode = 1; });
