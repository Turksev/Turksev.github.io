'use strict';

// Read-only regression runner. No npm packages, browser, source writes or network.
// Usage: node card-behavior-test.js C:\path\to\site
// Production functions/listeners run in a minimal DOM; only initial data loading
// is skipped. This checks behavior, not layout or real browser native defaults.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const site = path.resolve(process.argv[2] || path.join(__dirname, '../..'));
const source = name => fs.readFileSync(path.join(site, 'assets/js', name), 'utf8');
const KEY = 'yds-ornek-sirasi-v1';
const clone = x => JSON.parse(JSON.stringify(x));
const meanings = [
  {tr: 'ayarlamak', ex: 'They adjust the valve.', exTr: 'Vanayı ayarlarlar.', exs: [
    {ex: 'Engineers adjust the pressure.', exTr: 'Mühendisler basıncı ayarlar.'},
    {ex: 'Please adjust the seat.', exTr: 'Lütfen koltuğu ayarla.'}
  ]},
  {tr: 'uyum sağlamak', ex: 'People adjust to changes.', exTr: 'İnsanlar değişimlere uyum sağlar.', exs: [
    {ex: 'Children adjust to school.', exTr: 'Çocuklar okula uyum sağlar.'}
  ]}
];
const word = {e: 'adjust', t: 'ayarlamak; uyum sağlamak', y: 'verb', k: 2};
const second = {e: 'adapt', t: 'uyarlamak', y: 'verb', k: 2};
const sentence = {e: 'They adjust the valve.', t: 'Vanayı ayarlarlar.', b: 'Çeviri', y: 2025, s: 'Test', n: 1, sid: 'c:fixture-1'};
const sentence2 = {e: 'They adapt the plan.', t: 'Planı uyarlarlar.', b: 'Çeviri', y: 2025, s: 'Test', n: 2, sid: 'c:fixture-2'};

function storage(initial, fail) {
  const data = new Map(Object.entries(initial || {}));
  return {
    data, writes: 0, fail: !!fail,
    get length() {return data.size;}, key(i) {return [...data.keys()][i] || null;},
    getItem(k) {if (this.fail) throw Error('SecurityError'); return data.has(k) ? data.get(k) : null;},
    setItem(k, v) {if (this.fail) throw Error('QuotaExceededError'); this.writes++; data.set(k, String(v));},
    removeItem(k) {data.delete(k);}
  };
}

function context(store) {
  let ctx;
  const nodes = new Map(), documentListeners = {}, windowListeners = {};
  function node(id, tag = 'DIV') {
    if (nodes.has(id)) return nodes.get(id);
    const attrs = {}, classes = new Set(), listeners = {};
    const n = {
      id, tagName: tag, value: '', hidden: false, disabled: false, innerHTML: '', textContent: '',
      style: {}, dataset: {}, children: [], parentElement: null, isContentEditable: false,
      classList: {add: x => classes.add(x), remove: x => classes.delete(x), contains: x => classes.has(x),
        toggle(x, yes) {if (yes === undefined) yes = !classes.has(x); yes ? classes.add(x) : classes.delete(x); return yes;}},
      setAttribute(k, v) {attrs[k] = String(v);}, getAttribute(k) {return attrs[k] ?? null;},
      removeAttribute(k) {delete attrs[k];}, addEventListener(k, fn) {(listeners[k] ||= []).push(fn);},
      querySelectorAll() {return [];}, querySelector() {return null;}, scrollIntoView() {}, remove() {},
      focus() {ctx.document.activeElement = this;},
      appendChild(child) {child.parentElement = this; this.children.push(child); return child;},
      contains(other) {for (let p = other; p; p = p.parentElement) if (p === this) return true; return false;},
      matches(selector) {return selector.split(',').some(s => {
        s = s.trim();
        if (s === '#' + id || s.toUpperCase() === tag) return true;
        if (s.startsWith('.')) return classes.has(s.slice(1));
        if (s.includes('contenteditable')) return this.isContentEditable;
        const m = s.match(/^\[([^=\]]+)(?:=["']?([^"'\]]+)["']?)?\]$/);
        return m ? attrs[m[1]] !== undefined && (m[2] === undefined || attrs[m[1]] === m[2]) : false;
      });},
      closest(selector) {for (let p = this; p; p = p.parentElement) if (p.matches(selector)) return p; return null;},
      click() {return dispatch('click', this);}, listeners
    };
    nodes.set(id, n); return n;
  }
  const document = {
    getElementById: id => node(id), createElement: tag => node('created-' + nodes.size, tag.toUpperCase()),
    querySelectorAll: () => [], querySelector: () => null,
    addEventListener(k, fn) {(documentListeners[k] ||= []).push(fn);},
    head: node('head', 'HEAD'), body: node('body', 'BODY'), activeElement: null
  };
  function dispatch(type, target, opts = {}) {
    const event = Object.assign({type, target, key: '', defaultPrevented: false, stopped: false,
      preventDefault() {this.defaultPrevented = true;}, stopPropagation() {this.stopped = true;}}, opts);
    for (let p = target; p && !event.stopped; p = p.parentElement) {
      event.currentTarget = p; for (const fn of p.listeners[type] || []) fn.call(p, event);
    }
    if (!event.stopped) {
      event.currentTarget = document; for (const fn of documentListeners[type] || []) fn.call(document, event);
    }
    return event;
  }
  let failProgress = false, selected = false, warnings = 0, grades = [];
  const Il = new Proxy({
    gunlukHedef: () => 20, gunlukTavan: () => 100,
    leitnerOzet: () => ({calisilan: 0, ogrenilen: 0, bekleyen: 0, bugun: 2, yeni: 2, hedef: 20}),
    dogru: id => grade('dogru', id), yanlis: id => grade('yanlis', id),
    zatenBiliyorum: id => grade('zaten', id), ipucuyla: id => grade('ipucuyla', id)
  }, {get: (o, k) => k in o ? o[k] : () => 0});
  function grade(kind, id) {grades.push({kind, id}); return !failProgress;}
  ctx = {
    console, document, localStorage: store || storage(), URLSearchParams, location: {search: ''},
    setTimeout, clearTimeout, Promise, Map, Set, WeakMap, TextEncoder, TextDecoder,
    KELIME_DIZIN: clone([word, second]), KELIME_K2: {adjust: {a: clone(meanings)}, adapt: {a: [{tr: 'uyarlamak', ex: 'They adapt the plan.', exTr: 'Planı uyarlarlar.'}]}},
    CUMLELER_DIZIN: {yillar: [{y: 2025, n: 2}], bolumler: [], toplam: 2},
    YDS: {
      Depo: {oku: (k, fallback) => fallback, yaz: () => true}, Ilerleme: Il,
      sadelestir: s => s.toLowerCase(), kacar: s => String(s ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;'),
      yildiz: () => '', karistir: list => list, varlikYolu: x => x,
      metinSecildi: () => selected, hareket: () => 'auto', depolamaUyarisi: () => warnings++, geriAlKutusu: () => null,
      ikiKereSor: () => false
    },
    addEventListener(k, fn) {(windowListeners[k] ||= []).push(fn);},
    dispatchEvent(event) {for (const fn of windowListeners[event.type] || []) fn(event);}
  };
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext(source('veri.js'), ctx, {filename: 'veri.js'});
  for (const id of ['mod', 'ipucuBtn', 'bilgiBtn', 'seslendir', 'onceki', 'sonraki', 'bildim', 'bilmedim', 'zatenBiliyorum']) node(id, 'BUTTON');
  for (const id of ['ara']) node(id, 'INPUT');
  for (const id of ['tip', 'durum', 'bolum', 'yil']) node(id, 'SELECT');
  node('kart').setAttribute('role', 'button');
  node('ipucuAlan').parentElement = node('kart');
  return {ctx, node, dispatch, documentListeners,
    selected(v) {selected = v;}, failProgress(v) {failProgress = v;},
    warnings: () => warnings, grades,
    key(key, target = node('kart'), opts = {}) {target.focus(); return dispatch('keydown', target, {key, ...opts});}
  };
}

function page(kind, entries) {
  const h = context();
  let js = source(kind + '.js');
  // Skip network/bootstrap, never rewrite production files.
  if (kind === 'kelimeler') {
    const marker = '  /* ---------- başlat ---------- */';
    assert.ok(js.includes(marker), 'bootstrap marker changed: review harness');
    js = js.slice(0, js.indexOf(marker)) + '\n})();';
  } else js = js.replace(/    hepsiniYukle\(\);/g, '    /* skipped initial network in test */');
  const hook = kind === 'kelimeler'
    ? 'window.__test={seed:function(xs){havuz=xs;suzulmus=xs;kartModu=true;desteModu=false;kartIndex=0;kartAcik=false;ipucuAcik=false;kartOrnekKelime=null;kartCiz();},redraw:kartCiz,refresh:filtrele,grade:kartCevap,state:function(){return {open:kartAcik,hint:ipucuAcik,index:kartIndex,examples:kartOrnekleri};}};'
    : 'window.__test={seed:function(xs){HEPSI=xs;suzulmus=xs;kartModu=true;kartIndex=0;kartAcik=false;kartCiz();},redraw:kartCiz,refresh:function(){suz(true);},grade:kartCevap,state:function(){return {open:kartAcik,index:kartIndex};}};';
  js = js.replace(/\}\)\(\);\s*$/, hook + '\n})();');
  vm.runInContext(js, h.ctx, {filename: kind + '.js'});
  if (kind === 'cumleler') for (const fn of h.documentListeners.DOMContentLoaded || []) fn();
  h.api = h.ctx.__test;
  h.api.seed(clone(entries || (kind === 'kelimeler' ? [word, second] : [sentence, sentence2])));
  h.node('kartAlan').hidden = false;
  h.state = () => clone(h.api.state());
  h.snapshot = () => ({state: h.state(), back: h.node('kartArka').hidden, en: h.node('kartOn').textContent,
    tr: h.node('kartTr').textContent || h.node('kartTr').innerHTML, example: h.node('kartOrnek').innerHTML, hint: h.node('ipucuAlan').innerHTML});
  return h;
}

const cases = [];
function test(name, fn) {cases.push([name, fn]);}
for (const kind of ['kelimeler', 'cumleler']) {
  test(kind + ': click/Enter/Space reveal once, never close', () => {
    const h = page(kind); assert.equal(h.state().open, false);
    h.node('kart').click(); const open = h.snapshot(); assert.equal(open.state.open, true);
    h.node('kart').click(); h.key('Enter'); h.key('Enter'); h.key(' '); h.key(' ');
    assert.deepEqual(h.snapshot(), open);
    assert.equal(h.node('kart').getAttribute('aria-expanded'), 'true');
    assert.doesNotMatch(h.node('kart').getAttribute('aria-label'), /gizle|kapat/);
  });
  test(kind + ': selection does not reveal; next resets', () => {
    const h = page(kind); h.selected(true); h.node('kart').click(); h.key('Enter');
    assert.equal(h.state().open, false); h.selected(false); h.node('kart').click();
    h.node('sonraki').click(); assert.equal(h.state().open, false); assert.equal(h.state().index, 1);
  });
  test(kind + ': failed grading preserves entire current presentation', () => {
    const h = page(kind); h.node('kart').click(); const before = h.snapshot();
    h.failProgress(true); h.node('bildim').click(); assert.deepEqual(h.snapshot(), before); assert.equal(h.warnings(), 1);
  });
  test(kind + ': background redraw keeps revealed card', () => {
    const h = page(kind); h.node('kart').click(); const before = h.snapshot(); h.api.redraw(); h.api.refresh();
    assert.deepEqual(h.snapshot(), before);
  });
  test(kind + ': Space keeps focused native button action available', () => {
    const h = page(kind); const e = h.key(' ', h.node('seslendir'));
    assert.equal(e.defaultPrevented, false); assert.equal(h.state().open, false);
  });
  test(kind + ': nested button Enter does not reveal parent or cancel native action', () => {
    const h = page(kind), button = h.node('nested-native', 'BUTTON'); button.parentElement = h.node('kart');
    const e = h.key('Enter', button); assert.equal(e.defaultPrevented, false); assert.equal(h.state().open, false);
    // A native Enter activation bubbles click after keydown.
    button.click(); assert.equal(h.state().open, false);
  });
  test(kind + ': consumed, IME and editable keys do not trigger cards', () => {
    const h = page(kind); h.key(' ', h.node('kart'), {defaultPrevented: true}); assert.equal(h.state().open, false);
    h.key(' ', h.node('kart'), {isComposing: true}); assert.equal(h.state().open, false);
    const editable = h.node('note-editor'); editable.isContentEditable = true;
    h.key(' ', editable); assert.equal(h.state().open, false);
  });
  test(kind + ': holding navigation/rating key does not skip or grade multiple cards', () => {
    const h = page(kind); h.key('ArrowRight', h.node('kart'), {repeat: true});
    assert.equal(h.state().index, 0); h.key('2', h.node('kart'), {repeat: true}); assert.equal(h.grades.length, 0);
  });
}
test('word: hint/answer pair and rotation stay stable until explicit one-card navigation', () => {
  const h = page('kelimeler', [word]); const first = h.state().examples;
  h.node('ipucuBtn').click(); const hint = h.node('ipucuAlan').innerHTML;
  h.api.redraw(); assert.equal(h.node('ipucuAlan').innerHTML, hint); assert.deepEqual(h.state().examples, first);
  h.node('kart').click(); assert.ok(h.node('kartOrnek').innerHTML.includes(first[0].ex));
  assert.ok(h.node('kartOrnek').innerHTML.includes(first[0].exTr));
  h.node('sonraki').click(); assert.equal(h.state().open, false); assert.equal(h.state().index, 0);
  assert.notEqual(h.state().examples[0].ex, first[0].ex);
  const secondVisit = h.snapshot(); h.api.redraw(); assert.deepEqual(h.snapshot(), secondVisit);
});
test('word: same-card refresh retains hint-use grading penalty', () => {
  const h = page('kelimeler'); h.node('ipucuBtn').click(); const before = h.snapshot();
  h.api.refresh(); assert.deepEqual(h.snapshot(), before);
  h.node('bildim').click(); assert.equal(h.grades[0].kind, 'ipucuyla');
});
test('word: failed hinted grade does not rotate, clear hint, or reveal answer', () => {
  const h = page('kelimeler', [word]); h.node('ipucuBtn').click(); const before = h.snapshot();
  h.failProgress(true); h.node('bildim').click(); assert.deepEqual(h.snapshot(), before);
  assert.equal(h.grades[0].kind, 'ipucuyla'); assert.equal(h.warnings(), 1);
});
test('word: full meaning-specific cycles preserve EN/TR pairing and source immutability', () => {
  const h = context(); const input = clone(meanings), original = clone(input);
  for (let visit = 0; visit < 7; visit++) {
    const selected = clone(h.ctx.YDS.Veri.ornekleriSec('adjust', input));
    selected.forEach((p, i) => {
      const pool = [input[i], ...input[i].exs]; const expected = pool[visit % pool.length];
      assert.equal(p.ex, expected.ex); assert.equal(p.exTr, expected.exTr);
    });
  }
  assert.deepEqual(input, original);
  const reloaded = context(h.ctx.localStorage);
  assert.equal(reloaded.ctx.YDS.Veri.ornekleriSec('adjust', input)[0].ex, input[0].exs[0].ex);
});
test('word: quota/denied storage still rotates in memory without touching progress', () => {
  const h = context(storage({}, true)), V = h.ctx.YDS.Veri;
  const a = V.ornekleriSec('adjust', meanings), b = V.ornekleriSec('adjust', meanings);
  assert.notEqual(a[0].ex, b[0].ex); assert.equal(h.warnings(), 0); assert.equal(h.grades.length, 0);
});
test('word: write-only quota failure keeps successfully loaded next-example cursor', () => {
  const store = storage({[KEY]: JSON.stringify({adjust: 1})});
  store.setItem = () => {throw Error('QuotaExceededError');};
  const h = context(store), V = h.ctx.YDS.Veri;
  assert.equal(V.ornekleriSec('adjust', meanings)[0].ex, meanings[0].exs[0].ex);
  assert.equal(V.ornekleriSec('adjust', meanings)[0].ex, meanings[0].exs[1].ex);
  assert.equal(store.getItem(KEY), JSON.stringify({adjust: 1}));
});
test('word: rotation preference evicts oldest entries and never writes a progress key', () => {
  const initial = {};
  for (let i = 0; i < 10001; i++) initial['word-' + String(i).padStart(5, '0')] = i;
  const store = storage({[KEY]: JSON.stringify(initial)}), h = context(store);
  h.ctx.YDS.Veri.ornekleriSec('adjust', meanings);
  const saved = JSON.parse(store.getItem(KEY));
  assert.equal(Object.keys(saved).length, 10000);
  assert.equal(saved['word-00000'], undefined); assert.equal(saved['word-00001'], undefined);
  assert.equal(saved.adjust, 1); assert.deepEqual([...store.data.keys()], [KEY]);
  // Counts actual UTF-16 storage bytes, not UTF-8 or a synthetic old audit figure.
  assert.ok(2 * (KEY.length + store.getItem(KEY).length) < 1024 * 1024);
});
test('word: malformed preference and incomplete/duplicate variant pairs are safe', () => {
  const h = context(storage({[KEY]: '{bad json'}));
  const pool = clone(h.ctx.YDS.Veri.ornekHavuzu({ex:'A.', exTr:'Bir.', exs: [
    {ex: 'a.', exTr:'Yinelenen.'}, {ex:'B.'}, {ex:' ',exTr:'Boş.'}, {ex:'C.',exTr:'Üç.'}
  ]}));
  assert.deepEqual(pool, [{ex:'A.',exTr:'Bir.'}, {ex:'C.',exTr:'Üç.'}]);
  assert.equal(h.ctx.YDS.Veri.ornekleriSec('adjust', meanings)[0].ex, meanings[0].ex);
});
test('example preference is outside sync allowlist and storage listener returns for it', () => {
  const h = context(); vm.runInContext(source('esitleme-veri.js'), h.ctx);
  assert.equal(h.ctx.YDS.EsitlemeMotoru.TIPLER[KEY], undefined);
  assert.match(source('esitleme-depo.js'), /if\s*\(!TIPLER\[e\.key\]\)\s*return/);
});

let failed = 0;
for (const [name, fn] of cases) {
  try {fn(); console.log('PASS ' + name);}
  catch (e) {failed++; console.error('FAIL ' + name + '\n  ' + String(e.stack).split('\n').slice(0, 5).join('\n  '));}
}
console.log(`${cases.length - failed}/${cases.length} passed`);
process.exitCode = failed ? 1 : 0;
