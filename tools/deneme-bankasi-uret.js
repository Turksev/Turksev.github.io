/* Özgün soru girdilerinden yayımlanan ek bankayı ve üç sabit formu üretir.
   Çalıştırma: node tools/deneme-bankasi-uret.js */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const KAYNAK = path.join(__dirname, 'deneme-kaynak');

function oku(ad) {
  return JSON.parse(fs.readFileSync(path.join(KAYNAK, ad), 'utf8'));
}

function jsYaz(ad, aciklama, ifade) {
  const govde = '/* ' + aciklama + ' — bu dosya tools/deneme-bankasi-uret.js ile üretilir. */\n' +
    ifade + '\n';
  fs.writeFileSync(path.join(ROOT, ad), govde, 'utf8');
}

function kimlik(s) {
  const ham = [s.kat || '', s.pid || s.metin || '', s.s || ''].join('|')
    .normalize('NFKC').replace(/\s+/g, ' ').trim();
  let h = 0x811c9dc5;
  for (let i = 0; i < ham.length; i++) {
    h ^= ham.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return 'q-' + h.toString(16).padStart(8, '0');
}

const reading = oku('reading-new.json');
const cloze = oku('cloze-new.json');
const other = oku('other-new.json');

if (Object.keys(reading.passages || {}).length !== 15 || reading.questions.length !== 60) {
  throw new Error('Okuma girdisi 15 pasaj / 60 soru olmalı.');
}
if (!Array.isArray(cloze.groups) || cloze.groups.length !== 6) {
  throw new Error('Cloze girdisi 6 grup olmalı.');
}
if (!Array.isArray(other.questions) || other.questions.length !== 71) {
  throw new Error('Diğer soru girdisi 71 soru olmalı.');
}

const passages = Object.assign({}, reading.passages);
const ekSorular = other.questions.map(s => Object.assign({ kaynak: 'uzman-ozgun' }, s));

cloze.groups.forEach(grup => {
  passages[grup.id] = grup.text;
  grup.questions.forEach(s => {
    const q = Object.assign({ kaynak: 'uzman-ozgun' }, s, { pid: grup.id });
    delete q.metin;
    ekSorular.push(q);
  });
});
reading.questions.forEach(s => ekSorular.push(Object.assign({ kaynak: 'uzman-ozgun' }, s)));

ekSorular.forEach(s => {
  if (!s.kat || !s.s || !Array.isArray(s.se) || s.se.length !== 5 ||
      !Number.isInteger(s.d) || s.d < 0 || s.d > 4 || !s.ac) {
    throw new Error('Geçersiz soru: ' + JSON.stringify(s).slice(0, 180));
  }
});

jsYaz(
  'data/sorular-ek.js',
  'Özgün ek soru bankası; gerçek ÖSYM sorusu içermez',
  '(function(){\n' +
  '  window.PARCALAR = Object.assign(window.PARCALAR || {}, ' + JSON.stringify(passages, null, 2) + ');\n' +
  '  window.SORULAR = (window.SORULAR || []).concat(' + JSON.stringify(ekSorular, null, 2) + ');\n' +
  '})();'
);

const ortam = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'data/sorular.js'), 'utf8'), ortam);
const tum = (ortam.window.SORULAR || []).concat(ekSorular);

const idler = new Map();
tum.forEach(s => {
  const id = kimlik(s);
  if (idler.has(id)) throw new Error('Soru kimliği çakıştı: ' + id);
  idler.set(id, s);
  s.__id = id;
});

function havuz(kat, kosul) {
  return tum.filter(s => s.kat === kat && (!kosul || kosul(s)));
}
function al(kat, adet, form, kosul) {
  const h = havuz(kat, kosul);
  const secim = h.slice(form * adet, form * adet + adet);
  if (secim.length !== adet) {
    throw new Error(kat + ' için form ' + (form + 1) + ': ' + adet + ' soru bulunamadı; havuz ' + h.length);
  }
  return secim;
}

function ceviriYonu(s) {
  // Soru kökü Türkçeyse seçenekler İngilizcedir. Kaynak metin korunur;
  // bu işaret yalnız sabit formdaki resmî 3+3 yön sırasını kurar.
  return /[çğıöşüİ]/i.test(s.s || '') ||
    /\b(?:bu|yeni|şirket|araştırmacılar|şehir|yetkililer|müze|kentin)\b/i.test(s.s || '')
    ? 'tr-en' : 'en-tr';
}

function ceviriAl(form) {
  const enTr = havuz('Çeviri', s => ceviriYonu(s) === 'en-tr');
  const trEn = havuz('Çeviri', s => ceviriYonu(s) === 'tr-en');
  if (enTr.length !== 9 || trEn.length !== 9) {
    throw new Error('Çeviri havuzu her yönde 9 soru olmalı: ' + enTr.length + '/' + trEn.length);
  }
  return enTr.slice(form * 3, form * 3 + 3)
    .concat(trEn.slice(form * 3, form * 3 + 3));
}

function dengeliHedefSiklar(form, adet) {
  const hedefler = Array.from({ length: adet }, (_, i) => i % 5);
  let durum = (0x9e3779b9 ^ ((form + 1) * 0x45d9f3b)) >>> 0;
  function rastgele() {
    durum ^= durum << 13;
    durum ^= durum >>> 17;
    durum ^= durum << 5;
    return (durum >>> 0) / 0x100000000;
  }
  for (let i = hedefler.length - 1; i > 0; i--) {
    const j = Math.floor(rastgele() * (i + 1));
    [hedefler[i], hedefler[j]] = [hedefler[j], hedefler[i]];
  }
  return hedefler;
}

const formlar = ['A', 'B', 'C'].map((ad, form) => {
  const liste = [];
  liste.push(...al('Kelime', 6, form));
  liste.push(...al('Dil Bilgisi', 4, form));
  liste.push(...al('Bağlaç', 4, form));
  liste.push(...al('Preposition', 2, form));
  liste.push(...al('Cloze Test', 10, form, s => /^cp\d+$/.test(s.pid || '')));
  liste.push(...al('Cümle Tamamlama', 10, form));
  // Resmî sıra: 37–39 İngilizce→Türkçe, 40–42 Türkçe→İngilizce.
  liste.push(...ceviriAl(form));
  liste.push(...al('Okuma', 20, form, s => /^rp\d+$/.test(s.pid || '')));
  liste.push(...al('Diyalog', 5, form));
  liste.push(...al('Restatement', 4, form));
  liste.push(...al('Paragraf Tamamlama', 4, form));
  liste.push(...al('Anlamı Bozan Cümle', 5, form));
  if (liste.length !== 80) throw new Error('Form ' + ad + ' 80 soru değil.');
  const hedefSiklar = dengeliHedefSiklar(form, liste.length);
  return {
    id: ad,
    ad: 'Form ' + ad,
    sorular: liste.map(s => s.__id),
    // Kaynak seçenekleri değiştirilmez. Denemede dairesel kaydırılarak her
    // formda doğru cevaplar A–E arasında tam 16'şar kez dağıtılır.
    sikKaydirma: liste.map((s, i) => (s.d - hedefSiklar[i] + 5) % 5)
  };
});

const kullanilan = formlar.flatMap(f => f.sorular);
if (new Set(kullanilan).size !== 240) throw new Error('Sabit formlarda tekrar eden soru var.');

jsYaz(
  'data/deneme-formlari.js',
  '2026 YDS bölüm sırasına göre üç sabit ve birbirinden ayrık 80 soruluk form',
  'window.DENEME_FORMLARI = ' + JSON.stringify(formlar, null, 2) + ';'
);

console.log(JSON.stringify({
  ekSoru: ekSorular.length,
  toplamSoru: tum.length,
  pasaj: Object.keys(passages).length,
  form: formlar.map(f => ({ id: f.id, soru: f.sorular.length }))
}, null, 2));
