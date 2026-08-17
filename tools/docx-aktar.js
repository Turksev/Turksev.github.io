#!/usr/bin/env node
/* ============================================================
   docx → site içeriği

   Word belgelerini düz metne çevirir; paragraf, başlık düzeyi ve
   tablo yapısını korur. Bağlaçlar sayfası bu araçla üretildi.

   Kullanım:
     node tools/docx-aktar.js "yol/belge.docx"                 → ekrana yazar
     node tools/docx-aktar.js "yol/belge.docx" cikti.txt       → dosyaya yazar
     node tools/docx-aktar.js --klasor "yol/klasör"            → hepsini listeler

   Gereksinim: sistemde `unzip` bulunmalı (Git Bash ile birlikte gelir).
   .docx aslında bir zip; içindeki word/document.xml okunur.
   ============================================================ */

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

/* ---------- docx okuma ---------- */

function belgeXml(dosya) {
  let ham;
  try {
    ham = execFileSync('unzip', ['-p', dosya, 'word/document.xml'], {
      maxBuffer: 128 * 1024 * 1024,
      encoding: 'latin1'
    });
  } catch (e) {
    throw new Error(
      `"${path.basename(dosya)}" açılamadı. Dosya bir .docx mi ve sistemde unzip var mı?`
    );
  }
  // unzip'ten binary olarak aldık; UTF-8'e çevir.
  return Buffer.from(ham, 'latin1').toString('utf8');
}

function xmlCoz(s) {
  return s
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

function parcaMetni(parca) {
  const t = [...parca.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)].map(m => m[1]).join('');
  return xmlCoz(t).trim();
}

function metneCevir(xml) {
  const govde = xml.slice(xml.indexOf('<w:body>'));
  const parcalar = govde.match(/<w:tbl>[\s\S]*?<\/w:tbl>|<w:p\b[\s\S]*?<\/w:p>/g) || [];
  const cikti = [];

  for (const p of parcalar) {
    if (p.startsWith('<w:tbl>')) {
      cikti.push('[TABLO]');
      for (const tr of p.match(/<w:tr\b[\s\S]*?<\/w:tr>/g) || []) {
        const hucreler = (tr.match(/<w:tc>[\s\S]*?<\/w:tc>/g) || []).map(parcaMetni);
        cikti.push('  | ' + hucreler.join(' | ') + ' |');
      }
      cikti.push('[/TABLO]');
      continue;
    }

    const metin = parcaMetni(p);
    if (!metin) continue;

    const stil = (p.match(/<w:pStyle w:val="([^"]+)"/) || [])[1] || '';
    const listeMi = /<w:numPr>/.test(p);

    if (/Heading1|Baslik1|Title/i.test(stil)) cikti.push('\n# ' + metin);
    else if (/Heading2|Baslik2/i.test(stil)) cikti.push('\n## ' + metin);
    else if (/Heading3|Baslik3/i.test(stil)) cikti.push('\n### ' + metin);
    else if (listeMi) cikti.push('- ' + metin);
    else cikti.push(metin);
  }
  return cikti.join('\n');
}

/* ---------- özet ---------- */

function ozet(metin) {
  const satirlar = metin.split('\n');
  return {
    satir: satirlar.length,
    kelime: metin.split(/\s+/).filter(Boolean).length,
    baslik: satirlar.filter(s => /^#{1,3} /.test(s)).length,
    tablo: satirlar.filter(s => s === '[TABLO]').length
  };
}

/* ---------- komut satırı ---------- */

function kullanim() {
  console.log(`Kullanım:
  node tools/docx-aktar.js <belge.docx> [cikti.txt]
  node tools/docx-aktar.js --klasor <klasör>

Çıktı biçimi:
  # / ## / ###   başlık düzeyleri
  -              madde imi
  [TABLO] ... [/TABLO]   satırları "| hücre | hücre |" biçiminde tablo`);
}

function main() {
  const arg = process.argv.slice(2);
  if (!arg.length || arg[0] === '--yardim' || arg[0] === '-h') { kullanim(); process.exit(0); }

  if (arg[0] === '--klasor') {
    const klasor = arg[1];
    if (!klasor || !fs.existsSync(klasor)) {
      console.error('Klasör bulunamadı: ' + klasor); process.exit(1);
    }
    const belgeler = fs.readdirSync(klasor)
      .filter(f => f.toLowerCase().endsWith('.docx') && !f.startsWith('~$'));
    if (!belgeler.length) { console.error('Klasörde .docx yok.'); process.exit(1); }

    console.log(`${belgeler.length} belge bulundu:\n`);
    for (const b of belgeler) {
      try {
        const o = ozet(metneCevir(belgeXml(path.join(klasor, b))));
        console.log(`  ${b}`);
        console.log(`    ${o.kelime} kelime · ${o.baslik} başlık · ${o.tablo} tablo\n`);
      } catch (e) {
        console.log(`  ${b}\n    okunamadı: ${e.message}\n`);
      }
    }
    console.log('Birini çevirmek için: node tools/docx-aktar.js "<klasör>/<dosya>.docx" cikti.txt');
    return;
  }

  const kaynak = arg[0];
  if (!fs.existsSync(kaynak)) { console.error('Dosya bulunamadı: ' + kaynak); process.exit(1); }

  const metin = metneCevir(belgeXml(kaynak));
  const hedef = arg[1];

  if (hedef) {
    fs.writeFileSync(hedef, metin, 'utf8');
    const o = ozet(metin);
    console.error(`${hedef} yazıldı — ${o.kelime} kelime, ${o.baslik} başlık, ${o.tablo} tablo.`);
  } else {
    process.stdout.write(metin + '\n');
  }
}

main();
