#!/usr/bin/env node
/* ============================================================
   Bağlaçlara yakın anlamlı listesi ekler → data/baglaclar.js (es alanı)

   Aynı anlam ilişkisindeki her bağlaç birbirinin yerine geçmez
   (on the contrary ≠ on the other hand), o yüzden liste otomatik
   türetilmiyor; her bağlaç için elle yazıldı. Yapı farkı olanlar da
   bilerek listeye alındı — because / because of gibi çiftleri görmek
   YDS'de tam olarak sınanan şeyi öğretir.

   Çalıştırma:  node tools/baglac-esanlam.js
   Tekrar çalıştırılabilir: mevcut es alanları yenisiyle değiştirilir.
   ============================================================ */

'use strict';

const fs = require('fs');
const path = require('path');

const ES = {
  /* --- Neden --- */
  'because': ['since', 'as', 'given that', 'now that'],
  'because of': ['owing to', 'due to', 'on account of', 'as a result of'],
  'since': ['because', 'as', 'given that', 'now that'],
  'as': ['because', 'since', 'given that'],
  'given that': ['since', 'because', 'considering that', 'seeing that'],
  'given': ['considering', 'in view of', 'in light of'],
  'seeing that': ['since', 'given that', 'now that', 'as'],
  'now that': ['since', 'given that', 'seeing that'],
  'for': ['because', 'since', 'as'],

  /* --- Sonuç --- */
  'so': ['therefore', 'thus', 'hence', 'consequently'],
  'therefore': ['thus', 'hence', 'consequently', 'accordingly'],
  'thus': ['therefore', 'hence', 'consequently', 'thereby'],
  'consequently': ['therefore', 'thus', 'hence', 'as a result'],
  'as a result': ['consequently', 'therefore', 'thus', 'hence'],
  'as a result of': ['because of', 'owing to', 'due to'],
  'hence': ['therefore', 'thus', 'consequently', 'accordingly'],
  'thereby': ['thus', 'in this way', 'in doing so'],
  'in this way': ['thereby', 'thus', 'by doing so'],
  'accordingly': ['therefore', 'consequently', 'hence', 'so'],
  'in turn': ['consequently', 'as a result', 'subsequently'],

  /* --- Karşıtlık --- */
  'but': ['yet', 'however', 'whereas'],
  'however': ['nevertheless', 'nonetheless', 'yet', 'still', 'even so'],
  'whereas': ['while', 'in contrast', 'on the other hand'],
  'while': ['whereas', 'although', 'in contrast'],
  'in contrast': ['by contrast', 'conversely', 'on the other hand'],
  'by contrast': ['in contrast', 'conversely', 'on the other hand'],
  'by comparison': ['in comparison', 'in contrast', 'relatively'],
  'instead': ['rather', 'alternatively'],
  'rather': ['instead', 'on the contrary'],
  'rather than': ['instead of', 'in place of', 'as opposed to'],
  'conversely': ['in contrast', 'by contrast', 'on the other hand'],
  'on the contrary': ['quite the contrary', 'far from it', 'rather'],
  'on the other hand': ['in contrast', 'by contrast', 'conversely', 'whereas'],
  'instead of': ['rather than', 'in place of', 'as opposed to'],
  'quite the contrary': ['on the contrary', 'far from it'],
  'yet': ['but', 'however', 'nevertheless', 'still'],

  /* --- Ödünleme --- */
  'although': ['though', 'even though', 'while', 'whereas'],
  'though': ['although', 'even though', 'while'],
  'even though': ['although', 'though', 'despite the fact that'],
  'despite': ['in spite of', 'notwithstanding', 'regardless of'],
  'in spite of': ['despite', 'notwithstanding', 'regardless of'],
  'nevertheless': ['nonetheless', 'however', 'still', 'even so', 'yet'],
  'nonetheless': ['nevertheless', 'however', 'still', 'even so'],
  'still': ['nevertheless', 'nonetheless', 'even so', 'however'],
  'even so': ['nevertheless', 'nonetheless', 'still', 'all the same'],
  'regardless of': ['irrespective of', 'in spite of', 'despite', 'no matter'],
  'irrespective of': ['regardless of', 'despite', 'in spite of'],
  'even if': ['even though', 'whether or not', 'regardless of whether'],
  'much as': ['although', 'though', 'however much'],
  'albeit': ['although', 'though', 'even if'],

  /* --- Koşul --- */
  'if': ['provided that', 'as long as', 'on condition that'],
  'unless': ['if not', 'except if'],
  'as long as': ['provided that', 'so long as', 'on condition that', 'if'],
  'in case': ['in the event that', 'lest', 'if'],
  'whatever': ['no matter what', 'regardless of what'],
  'when and if': ['if and when'],
  'if and when': ['when and if'],
  'if … then': ['if', 'in the event that'],
  'provided that': ['as long as', 'on condition that', 'providing', 'if'],
  'lest': ['in case', 'for fear that', 'so that … not'],
  'insofar as': ['to the extent that', 'inasmuch as', 'as far as'],

  /* --- Zaman --- */
  'when': ['as', 'while', 'once', 'at the time that'],
  'before': ['prior to', 'ahead of'],
  'after': ['following', 'subsequent to', 'once'],
  'until': ['till', 'up to the time that'],
  'as soon as': ['the moment', 'once', 'immediately', 'no sooner … than'],
  'once': ['as soon as', 'when', 'after'],
  'whenever': ['every time', 'each time', 'any time'],
  'every time': ['whenever', 'each time'],
  'meanwhile': ['in the meantime', 'at the same time', 'meantime'],
  'in the meantime': ['meanwhile', 'in the interim'],
  'then': ['next', 'after that', 'subsequently'],
  'thereafter': ['subsequently', 'after that', 'from then on'],
  'eventually': ['finally', 'ultimately', 'in the end'],
  'finally': ['eventually', 'ultimately', 'in the end', 'at last'],
  'ultimately': ['eventually', 'finally', 'in the end'],
  'in the end': ['eventually', 'finally', 'ultimately'],
  'after that': ['then', 'subsequently', 'thereafter'],
  'afterward': ['later', 'subsequently', 'after that'],
  'at that point': ['then', 'at that moment', 'at the time'],
  'at the same time': ['simultaneously', 'meanwhile', 'concurrently'],
  'at the time': ['then', 'at that point', 'back then'],
  'before and after': ['prior to and following'],
  'by then': ['by that time', 'by that point'],
  'earlier': ['previously', 'before', 'formerly'],
  'later': ['afterward', 'subsequently', 'then'],
  'next': ['then', 'after that', 'subsequently'],
  'previously': ['earlier', 'before', 'formerly'],
  'simultaneously': ['at the same time', 'concurrently', 'meanwhile'],
  'till': ['until', 'up to'],
  'upon': ['on', 'immediately after'],

  /* --- Ekleme --- */
  'also': ['too', 'as well', 'in addition', 'additionally'],
  'moreover': ['furthermore', 'in addition', 'besides', 'additionally'],
  'furthermore': ['moreover', 'in addition', 'additionally', 'besides'],
  'in addition': ['moreover', 'furthermore', 'additionally', 'besides'],
  'in addition to': ['besides', 'as well as', 'along with', 'apart from'],
  'besides': ['moreover', 'furthermore', 'in addition'],
  'additionally': ['in addition', 'moreover', 'furthermore'],
  'as well': ['also', 'too', 'in addition'],
  'further': ['furthermore', 'moreover', 'in addition'],
  'plus': ['also', 'in addition', 'besides'],
  'both … and': ['not only … but also', 'as well as'],

  /* --- Seçenek --- */
  'or': ['either … or', 'alternatively'],
  'either': ['one or the other'],
  'either … or': ['or', 'one of the two'],
  'neither': ['neither … nor'],
  'neither … nor': ['not … either', 'nor'],
  'nor': ['neither … nor', 'and not'],
  'not only … but also': ['both … and', 'as well as'],
  'whether': ['if', 'whether or not'],
  'else': ['otherwise', 'or else'],
  'otherwise': ['or else', 'else', 'if not'],
  'except': ['apart from', 'but for', 'other than', 'save'],
  'except that': ['apart from the fact that', 'only'],
  'alternatively': ['as an alternative', 'instead', 'or'],
  'as an alternative': ['alternatively', 'instead', 'or'],
  'save': ['except', 'apart from', 'but for'],

  /* --- Örnekleme --- */
  'indeed': ['in fact', 'actually', 'truly'],
  'for example': ['for instance', 'e.g.', 'such as'],
  'for instance': ['for example', 'e.g.', 'such as'],
  'in fact': ['indeed', 'actually', 'as a matter of fact'],
  'in other words': ['that is', 'namely', 'i.e.', 'put differently'],
  'in particular': ['particularly', 'especially', 'specifically'],
  'specifically': ['in particular', 'particularly', 'namely'],
  'in essence': ['essentially', 'basically', 'fundamentally'],
  'essentially': ['in essence', 'basically', 'fundamentally'],
  'for one': ['for one thing', 'firstly'],
  'for one thing': ['for one', 'firstly', 'to begin with'],
  'particularly': ['in particular', 'especially', 'specifically'],

  /* --- Özet --- */
  'in short': ['in sum', 'in brief', 'briefly', 'to sum up'],
  'in sum': ['in short', 'in summary', 'to sum up', 'overall'],
  'overall': ['on the whole', 'in general', 'all in all'],

  /* --- Diğer --- */
  'and': ['as well as', 'plus', 'along with'],
  'after all': ['in the end', 'ultimately', 'anyway'],
  'anyway': ['in any case', 'in any event', 'anyhow'],
  'as if': ['as though', 'like'],
  'as though': ['as if', 'like'],
  'aside from': ['apart from', 'besides', 'except for'],
  'by the way': ['incidentally', 'in passing'],
  "'cause": ['because', 'since', 'as'],
  'in any case': ['in any event', 'anyway', 'at any rate'],
  'in any event': ['in any case', 'anyway', 'at any rate'],
  'in response to': ['in reply to', 'in reaction to'],
  'likewise': ['similarly', 'in the same way', 'equally'],
  'on the one hand … on the other hand': ['whereas', 'in contrast'],
  'only if': ['provided that', 'on condition that'],
  'separately': ['individually', 'apart', 'independently'],
  'similarly': ['likewise', 'in the same way', 'equally'],
  'so that': ['in order that', 'in order to', 'with the aim of'],
  'than': ['compared with', 'in comparison with'],
  'when … then': ['if … then'],
  'where': ['wherever', 'in the place that'],
  'with': ['as', 'given', 'along with'],
  'without': ['lacking', 'in the absence of', 'minus'],
  'ergo': ['therefore', 'thus', 'hence', 'consequently']
};

/* ---------------------------------------------------------------- */

const VERI = path.join(path.dirname(__dirname), 'data', 'baglaclar.js');
let metin = fs.readFileSync(VERI, 'utf8');

let eklenen = 0;
const eksik = [];

/* Her kaydın sonuna es alanını yaz; varsa üzerine yaz.
   Kayıt biçimi: {"f":"because","tr":…,…}, — anahtarlar tırnaklı. */
const KAYIT = /^\{"f":("(?:[^"\\]|\\.)*").*$/gm;

metin = metin.replace(KAYIT, (satir) => {
  const f = JSON.parse(satir.match(/^\{"f":("(?:[^"\\]|\\.)*")/)[1]);
  const temiz = satir.replace(/,"es":\[[^\]]*\]/, '');
  const es = ES[f];
  if (!es) { eksik.push(f); return temiz; }
  eklenen++;
  const alan = ',"es":[' + es.map((x) => JSON.stringify(x)).join(',') + ']';
  return temiz.replace(/\}(,?)$/, alan + '}$1');
});

/* Başlıktaki alan listesini güncelle */
metin = metin.replace(/ {5}nt → \(opsiyonel\) kullanım notu\n/,
  '     nt → (opsiyonel) kullanım notu\n     es → yakın anlamlılar (tools/baglac-esanlam.js ile eklenir)\n');

fs.writeFileSync(VERI, metin, 'utf8');

console.log('es alanı yazılan  :', eklenen);
console.log('haritada olmayan  :', eksik.length, eksik.length ? '→ ' + eksik.join(', ') : '');
console.log('haritada fazladan :',
  Object.keys(ES).filter((k) => !metin.includes(String.raw`{"f":` + JSON.stringify(k) + ",")).join(', ') || 'yok');
