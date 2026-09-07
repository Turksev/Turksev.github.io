'use strict';
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
const source = fs.readFileSync(path.resolve(__dirname, '../../assets/js/veri.js'), 'utf8');
function load(storage) {
  const context = {window: {YDS: {}, localStorage: storage, KELIME_DIZIN: []}};
  vm.runInNewContext(source, context);
  return context.window.YDS.Veri;
}
const records = {};
const storage = {getItem: k => records[k] || null, setItem: (k, v) => { records[k] = v; }};
const senses = [
  {tr: 'f. değerlendirmek', ex: 'Assess the evidence.', exTr: 'Kanıtları değerlendir.', exs: [
    {ex: 'Assess the long-term effects.', exTr: 'Uzun vadeli etkileri değerlendir.'},
    {ex: 'Assess the available options.', exTr: 'Mevcut seçenekleri değerlendir.'}]},
  {tr: 'f. değer biçmek', ex: 'Assess the property.', exTr: 'Mülke değer biç.', exs: [
    {ex: 'Assess the market value.', exTr: 'Piyasa değerini belirle.'}]}
];
const original = JSON.stringify(senses);
const api = load(storage);
for (let visit = 0; visit < 7; visit++) {
  const result = api.ornekleriSec('assess', senses);
  senses.forEach((sense, i) => {
    const pool = [sense, ...sense.exs], expected = pool[visit % pool.length];
    assert.equal(result[i].ex, expected.ex, 'Each sense rotates independently');
    assert.equal(result[i].exTr, expected.exTr, 'Translation must stay paired');
    assert.equal(result[i].toplam, pool.length);
  });
}
assert.equal(JSON.stringify(senses), original, 'No mutation of source examples');
assert.equal(load(storage).ornekleriSec('assess', senses)[0].ex, senses[0].exs[0].ex, 'Reload continues saved rotation');
assert.equal(api.ornekleriSec('separate word', senses)[0].ex, senses[0].ex, 'Different headwords have separate counters');
const legacy = api.ornekleriSec('old', [{ex: 'An old example.', exTr: 'Eski bir örnek.'}]);
assert.equal(legacy[0].ex, 'An old example.');
assert.equal(legacy[0].toplam, 1);
const pool = api.ornekHavuzu({ex: 'Same.', exTr: 'Aynı.', exs: [
  {ex: ' SAME. ', exTr: 'Başka çeviri.'}, {ex: 'Incomplete.'}, null, {ex: '', exTr: 'Boş.'},
  {ex: 'Valid.', exTr: 'Geçerli.'}]});
assert.equal(pool.length, 2, 'Duplicate/incomplete alternatives are excluded');
for (const broken of [null, {getItem() {throw Error('blocked');}, setItem() {throw Error('quota');}},
  {getItem() {return '{broken';}, setItem() {throw Error('quota');}},
  {getItem() {return '{"assess":-10,"__proto__":99}';}, setItem() {throw Error('quota');}}]) {
  const fallback = load(broken);
  assert.equal(fallback.ornekleriSec('assess', senses)[0].ex, senses[0].ex);
  assert.equal(fallback.ornekleriSec('assess', senses)[0].ex, senses[0].exs[0].ex);
}
assert.deepEqual(Object.keys(records), ['yds-ornek-sirasi-v1'], 'Only isolated preference is written, never progress');
console.log('Examples: sense/translation pairing, round-robin, reload, legacy, malformed data and quota fallback passed.');
