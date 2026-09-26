'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const context = {window: {}};
vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/js/kullanim-hesap.js'), 'utf8'), context);
const H = context.window.YDS.KullanimHesap;

assert.equal(H.sayfa('/'), 'index');
assert.equal(H.sayfa('/index.html'), 'index');
// Her gerçek kök HTML sayfasının katalogda karşılığı olmalı. Yeni sayfa eklenip
// yol eşlemesi unutulursa bu test salt 404 sonucunu kabul etmez.
for (const file of fs.readdirSync(root).filter(file => file.endsWith('.html'))) {
  const expected = file.slice(0, -5);
  assert.ok(H.sayfaMi(expected), file + ': root page is in the catalog');
  assert.equal(H.sayfa('/' + file), expected, file + ': exact root route');
  assert.equal(H.sayfa('/unknown/' + file), '404', file + ': nested lookalike is not the root page');
}

const topics = fs.readdirSync(path.join(root, 'konu')).filter(file => file.endsWith('.html'));
assert.equal(topics.length, 129, 'Update topic route bounds when the published curriculum changes');
for (const file of topics) {
  assert.equal(H.sayfa('/konu/' + file), 'konu', file + ': published topic');
  assert.equal(H.sayfa('/unknown/konu/' + file), '404', file + ': nested topic lookalike');
}
for (const unknown of [
  '/foo/', '/konu/', '/foo/index.html', '/foo/kelimeler.html', '/foo/konu/E01.html',
  '/index/', '/kelimeler/', '/konu.html', '/konu/index.html', '/konu', '/index', '/kelimeler',
  '/unknown.html', '/INDEX.html', '/kelimeler.HTML', '//index.html', '//', '', 'index.html',
  '/konu/E00.html', '/konu/E69.html', '/konu/T00.html', '/konu/T62.html',
  '/konu/E1.html', '/konu/T1.html', '/konu/E068.html', '/konu/T061.html',
  '/konu/E999.html', '/konu/T999.html', '/konu/e01.html', '/konu/t01.html', '/konu/A01.html',
  '/konu/E01.html/', '/konu/E01.HTML', '/konu//E01.html', '/konu/E01', null, undefined
]) assert.equal(H.sayfa(unknown), '404', String(unknown) + ': unserved route');

assert.equal(H.ozellikler.find(item => item[0] === 'kart-cevap')[1], 'Çalışma kartını yanıtlama',
  'Card response label refers to the study cards, not all progress controls');
console.log('Kullanım yolları: gerçek kök sayfalar, 129 konu ve bilinmeyen yollar geçti.');
