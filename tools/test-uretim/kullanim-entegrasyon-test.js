'use strict';
// Gerçek eylem işleyicilerini küçük DOM/ilerleme taklitleriyle çalıştırır.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const noop = () => {};

function functionSource(file, name) {
  const source = read('assets/js/' + file);
  const start = source.indexOf('  function ' + name + '(');
  assert.ok(start >= 0, file + ': ' + name);
  const end = source.indexOf('\n  }', start);
  assert.ok(end > start, name + ': function end');
  return source.slice(start, end + 4);
}
function listenerSource(file, id) {
  const source = read('assets/js/' + file);
  const marker = "$('" + id + "').addEventListener('click', function () {";
  const start = source.indexOf(marker);
  assert.ok(start >= 0, file + ': ' + id);
  return '(function () {' + source.slice(start + marker.length, source.indexOf('\n  });', start)) + '\n})()';
}
function fixture(file, extra = {}) {
  const nodes = new Map(), events = [], grades = [], warnings = [];
  const $ = id => {
    if (!nodes.has(id)) nodes.set(id, {hidden: false, value: '', textContent: '', innerHTML: '', focus: noop, scrollIntoView: noop});
    return nodes.get(id);
  };
  const context = {
    $, window: {YDS: {Kullanim: {olay: id => events.push(id)}, hareket: () => 'auto', depolamaUyarisi: () => warnings.push(true)}, scrollTo: noop},
    Il: {dogru: id => {grades.push(id); return true;}, yanlis: () => true, zatenBiliyorum: () => true, ipucuyla: () => true,
      sonucEkle: noop, kategoriKaydet: noop, yanlisCoz: noop, yanlisEkle: noop},
    Depo: {oku: () => null, yaz: () => true}, REKOR_ANAHTAR: 'fixture',
    ILERLEME_TURU: 'fixture', sozlukBakilan: {}, suzulmus: [{e: 'word', f: 'phrase'}], kartIndex: 0, ipucuAcik: false, desteModu: false,
    desteyiCiz: noop, kartGit: noop, kartCiz: noop, kimlik: () => 'sentence', ciz: noop,
    karistir: x => x, SAYFA_BOYU: 20, elAra: {}, elTip: {}, elDurum: {}, elTur: {}, elSinav: {}, elKartAlan: {scrollIntoView: noop},
    kategoriKarnesiCiz: noop, yanlisSecenegiGuncelle: noop, rekoruGoster: noop, soruyuGoster: noop,
    dogru: 1, yanlislar: [], kullanimTamamlandi: false, kacar: String, bosluklu: String,
    ...extra
  };
  vm.createContext(context);
  vm.runInContext(functionSource(file, 'kullanimOlay'), context);
  return {context, events, grades, warnings, $, load: name => vm.runInContext(functionSource(file, name), context),
    call: code => vm.runInContext(code, context)};
}

async function main() {
  for (const file of ['kelimeler.js', 'obekler.js', 'cumleler.js']) {
    const h = fixture(file);
    h.load('kartCevap');
    h.call("kartCevap('dogru')");
    assert.deepEqual(h.events, ['kart-cevap'], file + ': accepted answer');
    h.context.Il.dogru = () => false;
    h.call("kartCevap('dogru')");
    assert.equal(h.events.length, 1, file + ': failed progress write is not an answer');
    h.context.suzulmus = [];
    h.call("kartCevap('dogru')");
    assert.equal(h.events.length, 1, file + ': missing card is not an answer');
    h.context.suzulmus = [{e: 'word', f: 'phrase'}];
    h.context.Il.dogru = () => true;
    h.context.window.YDS.Kullanim.olay = () => {throw Error('tracker unavailable');};
    assert.doesNotThrow(() => h.call("kartCevap('dogru')"), file + ': broken tracker is isolated');
    delete h.context.window.YDS.Kullanim;
    assert.doesNotThrow(() => h.call("kartCevap('dogru')"), file + ': missing tracker is isolated');
  }
  for (const file of ['kelimeler.js', 'obekler.js']) {
    const h = fixture(file);
    h.load('ipucuAc');
    h.call('ipucuAc(); ipucuAc();');
    assert.deepEqual(h.events, ['ipucu'], file + ': one reveal per card');
    h.context.ipucuAcik = false;
    h.$('ipucuBtn').hidden = true;
    h.call('ipucuAc()');
    assert.equal(h.events.length, 1, file + ': unavailable hint');
    h.$('ipucuBtn').hidden = false;
    h.call('ipucuAc()');
    assert.equal(h.events.length, 2, file + ': next card can reveal hint');
    const source = read('assets/js/' + file);
    assert.match(source, /ipucuBtn'\)\.addEventListener\('click',[\s\S]*?ipucuAc\(\)/, 'mouse invokes the shared hint handler');
    assert.match(source, /e\.key\.toLowerCase\(\) === 'h'[\s\S]*?ipucuAc\(\)/, 'keyboard invokes the shared hint handler');
    const start = fixture(file, {havuz: [{e: 'word'}], TUM: [{f: 'phrase'}], leitnerListesi: () => [{en: 'phrase'}]});
    start.context.Il.destelik = () => [];
    start.call(listenerSource(file, 'desteBasla'));
    assert.deepEqual(start.events, [], file + ': empty deck does not start');
    start.context.Il.destelik = () => [{en: file === 'kelimeler.js' ? 'word' : 'phrase'}];
    start.call(listenerSource(file, 'desteBasla'));
    assert.deepEqual(start.events, ['deste-baslat'], file + ': valid deck starts');
  }
  const quiz = fixture('quiz.js', {test: [], testHazirla: noop, alert: noop});
  quiz.call(listenerSource('quiz.js', 'basla'));
  assert.deepEqual(quiz.events, [], 'empty quiz does not start');
  quiz.context.test = [{}];
  quiz.call(listenerSource('quiz.js', 'basla'));
  quiz.load('sonucuGoster');
  quiz.call('sonucuGoster(); sonucuGoster();');
  assert.deepEqual(quiz.events, ['quiz-baslat', 'quiz-bitir'], 'repeated quiz result is counted once');
  quiz.context.havuzSec = () => [];
  quiz.context.soruMetni = () => '';
  quiz.load('testHazirla');
  quiz.call('testHazirla()');
  assert.equal(quiz.context.kullanimTamamlandi, false, 'new quiz resets completion marker');
  quiz.call('sonucuGoster()');
  assert.equal(quiz.events.length, 2, 'unanswered quiz is not completed');

  const exam = fixture('deneme.js', {bitti: false, sayacDurdur: noop, Oturum: {temizle: noop}, test: [],
    ydsPuani: () => 0, aktifForm: '', aktifTur: 'karma', kalanSaniye: 0, gecmisiCiz: noop});
  exam.load('sonucuGoster');
  exam.call('sonucuGoster(false); sonucuGoster(true);');
  assert.deepEqual(exam.events, ['deneme-bitir'], 'manual finish and timer expiry cannot double count');

  let prepared = [];
  const daily = fixture('gunun-testi.js', {EN_AZ: 3, KAYNAKLAR: {kelime: {yukle: () => Promise.resolve()}},
    hazirla: () => ({sorular: prepared, calisilan: prepared.length}), soruCiz: noop, sorular: []});
  daily.load('baslat'); daily.load('sonucCiz');
  assert.equal((await daily.call('baslat([], [], null)')).acildi, false);
  assert.deepEqual(daily.events, [], 'insufficient daily questions do not start a test');
  prepared = [{}, {}, {}];
  await daily.call('baslat([], [], null)');
  daily.call('sonucCiz(); sonucCiz();');
  assert.deepEqual(daily.events, ['gunun-testi-baslat', 'gunun-testi-bitir'], 'daily result is counted once');
  await daily.call('baslat([], [], null)');
  daily.call('sonucCiz()');
  assert.equal(daily.events.length, 4, 'a second daily test has its own completion');

  // Şablon üretimini sanal dosyalar üzerinde iki kez çalıştır: eski yayın
  // URL'leri yinelenen izleyici üretmemeli; sıralama main → hesap → izleyici.
  const virtualRoot = path.join(root, 'virtual-kullanim-fixture');
  const files = new Map([
    ['data/sayilar.js', 'window.SAYILAR = {};'], ['assets/css/style.css', ''],
    ['fixture.html', '<html><head><script src="/releases/abcdef123456/assets/js/main.js"></script>\n' +
      '<script src="/releases/abcdef123456/assets/js/kullanim-hesap.js"></script>\n' +
      '<script src="/releases/abcdef123456/assets/js/kullanim.js"></script>\n</head><body></body></html>']
  ]);
  const key = file => path.relative(virtualRoot, file).split(path.sep).join('/');
  const fakeFs = {readdirSync: () => Array.from(files.keys()).filter(file => !file.includes('/') && file.endsWith('.html')), readFileSync: file => {
    assert.ok(files.has(key(file)), key(file)); return files.get(key(file));
  }, writeFileSync: (file, data) => files.set(key(file), data)};
  const generate = () => vm.runInNewContext(read('tools/site-sablon-uret.js'), {
    __dirname: path.join(virtualRoot, 'tools'), console: {log: noop},
    require: name => name === 'node:fs' ? fakeFs : require(name)
  });
  generate(); const once = files.get('fixture.html'); generate();
  assert.equal(files.get('fixture.html'), once, 'root template generation is idempotent');
  assert.equal((once.match(/kullanim-hesap\.js/g) || []).length, 1);
  assert.equal((once.match(/kullanim\.js/g) || []).length, 1);
  assert.ok(once.indexOf('main.js') < once.indexOf('kullanim-hesap.js'));
  assert.ok(once.indexOf('kullanim-hesap.js') < once.indexOf('kullanim.js'));
  // A new root page must acquire the pair without joining a maintained allowlist.
  // This runs only against the in-memory filesystem; no generated site is edited.
  files.set('sonradan-eklenen.html', '<html><head><script src="assets/js/main.js"></script>\n' +
    '<script src="assets/js/esitleme-depo.js"></script>\n</head><body></body></html>');
  generate();
  const added=files.get('sonradan-eklenen.html');
  generate();
  assert.equal(files.get('sonradan-eklenen.html'),added,'new root page generation is idempotent');
  assert.equal((added.match(/kullanim-hesap\.js/g)||[]).length,1,'new root page gets one calculator');
  assert.equal((added.match(/kullanim\.js/g)||[]).length,1,'new root page gets one collector');
  assert.ok(added.indexOf('esitleme-depo.js')<added.indexOf('kullanim-hesap.js'),'new root page preserves sync initialization order');
  assert.ok(added.indexOf('kullanim-hesap.js')<added.indexOf('kullanim.js'),'new root page initializes the calculator first');

  // Inspect every shipped HTML document dynamically, including future additions.
  // Release copies are assets, not extra entry pages; root + konu are the routes.
  const entryPages=fs.readdirSync(root).filter(file=>file.endsWith('.html')).concat(
    fs.readdirSync(path.join(root,'konu')).filter(file=>file.endsWith('.html')).map(file=>'konu/'+file));
  assert.ok(entryPages.length>=145,'the complete existing route inventory is covered');
  const release=JSON.parse(read('release-manifest.json'));
  for(const file of entryPages) {
    const scripts=Array.from(read(file).matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/g),match=>match[1]);
    const calculator=scripts.filter(src=>/(?:^|\/)assets\/js\/kullanim-hesap\.js$/.test(src));
    const collector=scripts.filter(src=>/(?:^|\/)assets\/js\/kullanim\.js$/.test(src));
    assert.equal(calculator.length,1,file+': exactly one usage calculator');
    assert.equal(collector.length,1,file+': exactly one usage collector');
    assert.equal(calculator[0],release.kok+'assets/js/kullanim-hesap.js',file+': current calculator release');
    assert.equal(collector[0],release.kok+'assets/js/kullanim.js',file+': current collector release');
    const h=scripts.indexOf(calculator[0]),k=scripts.indexOf(collector[0]);
    assert.ok(h<k,file+': calculator precedes collector');
    for(const dependency of ['main','esitleme-depo']) {
      const dependencyIndex=scripts.findIndex(src=>src.endsWith('/assets/js/'+dependency+'.js'));
      if(dependencyIndex>=0)assert.ok(dependencyIndex<h,file+': '+dependency+' precedes usage initialization');
    }
  }
  assert.match(read('tools/seo-uret.js'), /<script src="\.\.\/assets\/js\/kullanim-hesap\.js"><\/script>\s*<script src="\.\.\/assets\/js\/kullanim\.js"><\/script>/);
  assert.match(read('sw.js'), /assets\/js\/kullanim-hesap\.js/);
  assert.match(read('sw.js'), /assets\/js\/kullanim\.js/);
  console.log('Kullanım eylemleri, hata yalıtımı, '+entryPages.length+' HTML, yeni sayfa ve üretim zinciri geçti.');
}
main().catch(error => {console.error(error); process.exitCode = 1;});
