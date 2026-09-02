'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const kok = path.resolve(__dirname, '..', '..');
const kaynak = fs.readFileSync(path.join(kok, 'assets', 'js', 'kelimeler.js'), 'utf8');

assert.match(kaynak, /data-ne="calis"/,
  'Kartta çalış düğmesi data-ne="calis" taşımalı');
assert.match(kaynak, /data-ne="ses"/,
  'Ses düğmesi data-ne="ses" taşımalı');
assert.match(kaynak,
  /elListe\.addEventListener\('click',[\s\S]*?e\.target\.closest\('\[data-ne\]'\)/,
  'Liste olay delegasyonu iki data-ne düğmesini de yakalamalı');
assert.doesNotMatch(kaynak,
  /elListe\.addEventListener\('click',[\s\S]*?e\.target\.closest\('\.star'\)/,
  'Olay delegasyonu yalnız ses düğmesinin .star sınıfıyla sınırlanmamalı');

console.log('kartta-çalış: liste düğmesi ve ses düğmesi ortak olay delegasyonunda başarılı');
