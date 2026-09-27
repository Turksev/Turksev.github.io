'use strict';
// Sözlük paneli: sayfa bağlantıları, dürüst ipucu kuralı ve yayın listeleri.
// Panelin tarayıcı davranışı tools/sozluk-browser-qa.js ile ayrıca sınanır.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const kok = path.resolve(__dirname, '../..');
const oku = dosya => fs.readFileSync(path.join(kok, dosya), 'utf8');
const noop = () => {};

function betikler(html) {
  const liste = [];
  html.replace(/<script\s+src="([^"]+)"/g, (_, src) => { liste.push(src.replace(/^\/?releases\/[0-9a-f]{12}\//, '')); return _; });
  return liste;
}

// 1) Üç çalışma sayfası paneli yükler; sıra: ilerleme → ortak → panel → sayfa betiği.
for (const [sayfa, betik] of [['kelimeler.html', 'kelimeler.js'], ['obekler.html', 'obekler.js'], ['cumleler.html', 'cumleler.js']]) {
  const html = oku(sayfa);
  const b = betikler(html);
  const ilerleme = b.indexOf('assets/js/ilerleme.js');
  const ortak = b.indexOf('assets/js/arama-ortak.js');
  const panel = b.indexOf('assets/js/sozluk.js');
  const sayfaBetigi = b.indexOf('assets/js/' + betik);
  assert.ok(ilerleme >= 0 && ortak > ilerleme, sayfa + ': ortak arama ilerlemeden sonra');
  assert.equal(panel, ortak + 1, sayfa + ': panel ortak aramanın hemen ardından');
  assert.equal(sayfaBetigi, panel + 1, sayfa + ': sayfa betiği panelin hemen ardından (kaynakBagla için)');
  const acanlar = html.match(/<button[^>]*data-sozluk-ac[^>]*>/g) || [];
  assert.equal(acanlar.length, 2, sayfa + ': araç çubuğunda ve kartta birer Sözlük düğmesi');
  acanlar.forEach(d => assert.match(d, /\shidden[\s>]/, sayfa + ': düğme betik yüklenene kadar gizli'));
  acanlar.forEach(d => assert.match(d, /aria-label="Sözlük"/, sayfa + ': erişilebilir ad görünen "Sözlük" etiketini içerir'));
  assert.match(html, /<code>\/<\/code> sözlük/, sayfa + ': klavye notu / kısayolunu anlatır');
}

// 2) Yayın: ön bellek listesi ve kullanım kataloğu.
const sw = oku('sw.js');
for (const f of ['assets/js/arama-ortak.js', 'assets/js/sozluk.js']) {
  assert.match(sw, new RegExp("'\\./releases/[0-9a-f]{12}/" + f.replace(/[.]/g, '\\.') + "'"), 'sw.js ön belleği ' + f);
}
const hesap = oku('assets/js/kullanim-hesap.js');
assert.match(hesap, /\['sozluk-ac','Sözlük panelini açma'\]/, 'Kullanım kataloğunda sözlük açılışı');
assert.match(oku('assets/js/sozluk.js'), /Y\.Kullanim\.olay\('sozluk-ac'\)/, 'Panel açılışı kullanım eylemi yazar');

// 3) Katman adları veri.js ile aynı (Cümleler sayfasında veri.js yok).
const katmanlar = kaynak => {
  const m = kaynak.match(/\{\s*1: 'Temel',[^}]*\}/);
  assert.ok(m, 'katman tablosu bulunamadı');
  // Başka bağlamda kurulan nesnenin prototipi farklıdır; düz veriye çevirerek karşılaştır.
  return JSON.parse(JSON.stringify(vm.runInNewContext('(' + m[0] + ')')));
};
assert.deepEqual(katmanlar(oku('assets/js/sozluk.js')), katmanlar(oku('assets/js/veri.js')), 'Yedek katman adları veri.js ile aynı');

// 4) Dürüst ipucu: çevrilmeden önce sözlükte görülen kartın "Bildim"i ipucuyla sayılır.
function fonksiyon(dosya, ad) {
  const kaynak = oku('assets/js/' + dosya);
  const bas = kaynak.indexOf('  function ' + ad + '(');
  assert.ok(bas >= 0, dosya + ': ' + ad);
  const son = kaynak.indexOf('\n  }\n', bas);
  return kaynak.slice(bas, son + 4);
}
for (const [dosya, alan] of [['kelimeler.js', 'e'], ['obekler.js', 'f']]) {
  const cagrilar = [];
  const baglam = vm.createContext({
    window: { YDS: { depolamaUyarisi: noop } },
    Il: {
      dogru: id => { cagrilar.push(['dogru', id]); return 2; },
      ipucuyla: id => { cagrilar.push(['ipucuyla', id]); return 1; },
      yanlis: id => { cagrilar.push(['yanlis', id]); return 1; },
      zatenBiliyorum: id => { cagrilar.push(['zaten', id]); return 5; }
    },
    ILERLEME_TURU: 'test', ipucuAcik: false, desteModu: false, kartIndex: 0,
    suzulmus: [{ [alan]: 'alpha' }, { [alan]: 'beta' }],
    kullanimOlay: noop, desteyiCiz: noop, kartGit: noop, kartCiz: noop, desteBitti: noop, guncelleSayac: noop,
    sozlukBakilan: {}
  });
  const isaretler = () => JSON.stringify(Object.keys(baglam.sozlukBakilan).sort());
  vm.runInContext(fonksiyon(dosya, 'kartCevap'), baglam);
  vm.runInContext("kartCevap('dogru')", baglam);
  assert.deepEqual(cagrilar.pop(), ['dogru', 'alpha'], dosya + ': sözlüğe bakılmadıysa normal doğru');
  baglam.sozlukBakilan = { alpha: true, beta: true };
  vm.runInContext("kartCevap('dogru')", baglam);
  assert.deepEqual(cagrilar.pop(), ['ipucuyla', 'alpha'], dosya + ': sözlükte görülen kart ipucuyla');
  assert.equal(isaretler(), '["beta"]', dosya + ': yalnız yanıtlanan kartın işareti kalkar, ikinci kartınki korunur');
  vm.runInContext("kartCevap('dogru')", baglam);
  assert.deepEqual(cagrilar.pop(), ['dogru', 'alpha'], dosya + ': başka kartın işareti bu kartı etkilemez');
  assert.equal(isaretler(), '["beta"]', dosya + ': başka bir kartı yanıtlamak sözlükte bakılan kartın işaretini silmez');
  baglam.sozlukBakilan = { alpha: true };
  vm.runInContext("kartCevap('yanlis')", baglam);
  assert.deepEqual(cagrilar.pop(), ['yanlis', 'alpha'], dosya + ': Bilemedim değişmez');

  const kaynak = oku('assets/js/' + dosya);
  assert.match(kaynak, /window\.YDS\.Sozluk\.kaynakBagla\(\{/, dosya + ': panel bağlantısı');
  assert.match(kaynak, /isaretli: function \(anahtar\) \{ return !!sozlukBakilan\[anahtar\]; \}/,
    dosya + ': panel sayfanın işaretini okuyabilir');
  assert.match(fonksiyon(dosya, 'ciz'), /window\.YDS\.Sozluk\.denetle\(\)/, dosya + ': kart modundan çıkınca panel denetlenir');
  assert.match(kaynak, /if \(!kartModu \|\| elKartAlan\.hidden \|\| kartAcik \|\| ![od]\) return null;/,
    dosya + ': yalnız çevrilmemiş görünür kart denetlenir');
  assert.match(fonksiyon(dosya, 'kartCiz'), /window\.YDS\.Sozluk\.denetle\(\)/, dosya + ': kart değişince panel denetlenir');
  assert.match(fonksiyon(dosya, 'ciz'), /filtreEtiketleri\.forEach\(function \(etiket\) \{ etiket\.hidden = desteModu; \}\);/,
    dosya + ': deste çalışırken liste filtresi gizlenir');
}

// 5) Panel klavye olaylarını sayfaya geçirmez ve dış bağlantılar güvenli açılır.
const panel = oku('assets/js/sozluk.js');
assert.match(panel, /panel\.addEventListener\('keydown', function \(e\) \{[\s\S]*?e\.stopPropagation\(\);\s*\}\);/,
  'Odak paneldeyken tuşlar sayfaya ulaşmaz');
assert.equal((panel.match(/target="_blank" rel="noopener noreferrer"/g) || []).length, 2, 'Dış bağlantılar noopener');
assert.doesNotMatch(panel, /localStorage/, 'Panel kalıcı depolamaya yazmaz');

console.log('Sözlük paneli: betik sırası, düğmeler, ön bellek, katalog, dürüst ipucu ve klavye yalıtımı geçti.');
