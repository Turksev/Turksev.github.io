#!/usr/bin/env node
'use strict';
// Kök sayfalardaki ortak erişim bağlantıları, metadata ve statik sayaçlar.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const c = {window:{}}; vm.createContext(c);
vm.runInContext(fs.readFileSync(path.join(root, 'data/sayilar.js'), 'utf8'), c);
const n = c.window.SAYILAR, tr = x => Number(x).toLocaleString('tr-TR');
const links = '<nav class="footer-links" aria-label="Site ve veri bilgileri"><a href="yontem.html">Yöntem ve kaynaklar</a><a href="ayarlar.html">Gizlilik ve veri ayarları</a><a href="https://github.com/Turksev/Turksev.github.io/issues/new">Hata bildir</a></nav>';
for (const file of fs.readdirSync(root).filter(x=>x.endsWith('.html'))) {
  const p = path.join(root,file); let s = fs.readFileSync(p,'utf8');
  s = s.replace(/<script[^>]*src="[^"]*data\/depo\.js"[^>]*><\/script>\s*/g, '');
  s = s.replace('Önce yedi gün geri alınabilen yerel bir yedek oluşturulur;', 'Önce geri alınana veya yenisiyle değiştirilene kadar saklanan yerel bir yedek oluşturulur;');
  s = s.replace(/class="atla"/g,'class="skip-link"');
  s = s.replace(/<span class="ico">/g,'<span class="ico" aria-hidden="true">');
  s = s.replace(/\s*<nav class="footer-links"[\s\S]*?<\/nav>/g,'');
  if (s.includes('<footer')) s = s.replace(/(<footer\b[\s\S]*?)(\s*<\/div>\s*<\/footer>)/, '$1\n    '+links+'$2');
  if (!s.includes('name="referrer"')) s = s.replace('</head>','<meta name="referrer" content="strict-origin-when-cross-origin">\n</head>');
  if (!s.includes('http-equiv="Content-Security-Policy"')) s = s.replace('</head>', '<meta http-equiv="Content-Security-Policy" content="base-uri \'self\'; object-src \'none\'">\n</head>');
  if (['durum.html','istatistik.html','ara.html','ayarlar.html'].includes(file)) {
    s = s.replace(/<meta name="robots"[^>]*>\s*/g,'');
    s = s.replace('</head>','<meta name="robots" content="noindex, follow">\n</head>');
  }
  if (file === '404.html') {
    s = s.replace(/(href|src)="(?!https?:|data:|#|\/)([^\"]+)"/g,'$1="/$2"');
    s = s.replace(/<meta property="og:(title|description|url)"[^>]*>\s*/g,'');
    s = s.replace('</head>','<meta property="og:title" content="Sayfa bulunamadı — YDS Hazırlık">\n<meta property="og:description" content="Aradığınız sayfa bu adreste yok.">\n</head>');
  }
  if (file === 'index.html') {
    const map = {'st-kelime':n.kelime,'st-obek':n.obek,'st-soru':n.soru,'st-baglac':n.baglac,'k-kelime':n.kelime,'k-obek':n.obek,'k-aile':n.aile};
    for (const [id,val] of Object.entries(map)) s = s.replace(new RegExp('(id="'+id+'"[^>]*>)[^<]+'), '$1'+tr(val));
  }
  if (file === 'obekler.html') {
    const pv=n.obekTur['deyimsel fiil'], prep=n.obekTur['edat kalıbı'];
    s=s.replace(/YDS'de geçmiş [\d.]+ kelime öbeği: \d+ deyimsel fiil \(phrasal verb\), \d+ edat kalıbı/g, `YDS'de geçmiş ${tr(n.obek)} kelime öbeği: ${pv} deyimsel fiil (phrasal verb), ${prep} edat kalıbı`);
    s=s.replace(/(id="toplamObek">)[\d.]+/,'$1'+tr(n.obek));
    s=s.replace(/<b>\d+ deyimsel fiil<\/b>/,`<b>${pv} deyimsel fiil</b>`).replace(/<b>\d+ edat kalıbı<\/b>/,`<b>${prep} edat kalıbı</b>`);
  }
  if (file === 'aileler.html') {
    const description = `${tr(n.aile)} kelime ailesi: kökler, türevler, anlamlar ve örnekler. Kelime sorularında doğru sözcük türünü seçmene yardımcı olur.`;
    s=s.replace(/(<meta (?:name="description"|property="og:description") content=")[^"]*/, '$1'+description);
    s=s.replace(/(<meta property="og:description" content=")[^"]*/, '$1'+description);
    s=s.replace(/(id="toplamAile">)[\d.]+/,'$1'+tr(n.aile));
    s=s.replace(/(id="toplamUye">)[\d.]+/,'$1'+tr(n.aileUye));
    s=s.replace(/öğrenmek hem daha hızlıdır hem de <b>YDS'nin kelime türetme sorusunu<\/b> doğrudan hedefler:/,
      'öğrenmek, <b>kelime sorularında doğru sözcük türünü seçmene</b> yardımcı olur:');
  }
  if (s !== fs.readFileSync(p,'utf8')) fs.writeFileSync(p,s);
}
const cssFile=path.join(root,'assets/css/style.css');
let css=fs.readFileSync(cssFile,'utf8').replace(/var\(--line\)/g,'var(--border)');
// Eski .atla stili kaldırılır; bütün sayfalar tek skip-link kullanır.
css=css.replace(/\/\* Atlama bağlantısı:[\s\S]*?\.atla:focus\s*\{[^}]*\}\s*/,'');
fs.writeFileSync(cssFile,css);
console.log('Kök sayfa şablonları güncel.');
