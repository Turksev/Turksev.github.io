#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");
const SOURCE = path.join(ROOT, "data", "konular.js");
const OUTPUT_DIR = path.join(ROOT, "konu");
const SITEMAP = path.join(ROOT, "sitemap.xml");
const ORIGIN = "https://turksev.github.io";

function readTopics() {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(SOURCE, "utf8"), context, {
    filename: SOURCE,
    timeout: 1_000,
  });

  const axes = context.window.KONULAR;
  if (!Array.isArray(axes)) {
    throw new Error("data/konular.js içinde window.KONULAR dizisi bulunamadı.");
  }

  const topics = [];
  for (const axis of axes) {
    if (!axis || !Array.isArray(axis.u)) {
      throw new Error("Konu eksenlerinden biri geçerli bir u dizisi taşımıyor.");
    }
    for (const topic of axis.u) {
      const required = ["k", "ad", "kapsam", "kat", "katman", "etki", "soru", "risk", "zor", "on"];
      for (const field of required) {
        if (typeof topic[field] !== "string" || !topic[field].trim()) {
          throw new Error(`${topic.k || "Bilinmeyen konu"}: ${field} alanı eksik.`);
        }
      }
      if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(topic.k)) {
        throw new Error(`Dosya adına uygun olmayan konu kodu: ${topic.k}`);
      }
      topics.push({
        ...topic,
        eksen: String(axis.ad || axis.e || ""),
        eksenAciklama: String(axis.aciklama || ""),
      });
    }
  }

  const codes = topics.map((topic) => topic.k);
  if (new Set(codes).size !== codes.length) {
    throw new Error("data/konular.js içinde yinelenen konu kodu var.");
  }
  return topics;
}

function html(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function xml(value) {
  return html(value);
}

function truncate(value, limit) {
  const clean = String(value).replace(/\s+/g, " ").trim();
  if (clean.length <= limit) return clean;
  const shortened = clean.slice(0, limit - 1);
  const lastSpace = shortened.lastIndexOf(" ");
  return `${shortened.slice(0, lastSpace > limit * 0.65 ? lastSpace : shortened.length)}…`;
}

function pageFor(topic, index, topics) {
  const canonical = `${ORIGIN}/konu/${encodeURIComponent(topic.k)}.html`;
  const title = `${topic.k}: ${topic.ad} — YDS Hazırlık`;
  const description = truncate(`YDS ${topic.k} konusu — ${topic.ad}: ${topic.kapsam}`, 158);
  const lessonUrl = `../konular.html?konu=${encodeURIComponent(topic.k)}`;
  const previous = topics[(index - 1 + topics.length) % topics.length];
  const next = topics[(index + 1) % topics.length];
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: `${topic.k}: ${topic.ad}`,
    description: topic.kapsam,
    url: canonical,
    inLanguage: "tr",
    educationalLevel: topic.zor,
    learningResourceType: topic.soru,
  }).replaceAll("<", "\\u003c");

  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${html(title)}</title>
<meta name="description" content="${html(description)}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${html(canonical)}">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%233b5bdb'/><text y='68' x='50' text-anchor='middle' font-size='46' font-family='sans-serif' font-weight='bold' fill='white'>Y</text></svg>">
<meta name="theme-color" content="#3b5bdb">
<meta property="og:type" content="article">
<meta property="og:site_name" content="YDS Hazırlık">
<meta property="og:locale" content="tr_TR">
<meta property="og:title" content="${html(title)}">
<meta property="og:description" content="${html(description)}">
<meta property="og:url" content="${html(canonical)}">
<meta property="og:image" content="${ORIGIN}/assets/img/icon-512.png">
<meta name="twitter:card" content="summary">
<link rel="stylesheet" href="../assets/css/style.css">
<script type="application/ld+json">${jsonLd}</script>
</head>
<body>
<a class="skip-link" href="#anaIcerik">Ana içeriğe geç</a>
<header class="site-header">
  <div class="wrap">
    <a class="brand" href="../index.html"><span class="dot">YDS</span> Hazırlık</a>
    <nav class="site-nav" aria-label="Ana menü">
      <a href="../konular.html">Konular</a>
      <a href="../kelimeler.html">Kelimeler</a>
      <a href="../quiz.html">Alıştırma</a>
      <a href="../deneme.html">Deneme</a>
    </nav>
  </div>
</header>

<main class="section" id="anaIcerik" tabindex="-1">
  <article class="wrap prose-wrap" style="max-width:860px">
    <nav aria-label="İçerik yolu" class="small muted">
      <a href="../index.html">Ana sayfa</a> › <a href="../konular.html">Konu Haritası</a> › ${html(topic.k)}
    </nav>
    <p class="small muted" style="margin-top:24px">${html(topic.eksen)} · ${html(topic.kat)}</p>
    <h1>${html(topic.k)} · ${html(topic.ad)}</h1>
    <p class="lead">${html(topic.kapsam)}</p>

    <section aria-labelledby="konu-bilgileri" style="margin-top:28px">
      <h2 id="konu-bilgileri">Konu bilgileri</h2>
      <dl>
        <dt><strong>Eksen</strong></dt><dd>${html(topic.eksen)}</dd>
        <dt><strong>Kategori</strong></dt><dd>${html(topic.kat)}</dd>
        <dt><strong>Katman</strong></dt><dd>${html(topic.katman)}</dd>
        <dt><strong>YDS etkisi</strong></dt><dd>${html(topic.etki)}</dd>
        <dt><strong>Başlıca soru türleri</strong></dt><dd>${html(topic.soru)}</dd>
        <dt><strong>Türkçe hata riski</strong></dt><dd>${html(topic.risk)}</dd>
        <dt><strong>Zorluk</strong></dt><dd>${html(topic.zor)}</dd>
        <dt><strong>Ön koşullar</strong></dt><dd>${html(topic.on)}</dd>
      </dl>
    </section>

    <section aria-labelledby="eksen-hakkinda" style="margin-top:28px">
      <h2 id="eksen-hakkinda">${html(topic.eksen)}</h2>
      <p>${html(topic.eksenAciklama)}</p>
    </section>

    <section aria-labelledby="calisma-odagi" style="margin-top:28px">
      <h2 id="calisma-odagi">Bu ünitede çalışma odağı</h2>
      <p><strong>${html(topic.ad)}</strong> ünitesinde temel kapsam şudur: ${html(topic.kapsam)}.</p>
      <ul>
        <li>Bu yapıyı önce bağlam içindeki anlam göreviyle tanı; yalnız biçim veya anahtar sözcük ezberine dayanma.</li>
        <li>Özellikle <strong>${html(topic.soru)}</strong> sorularında yapının cümle ve paragraf ilişkisini nasıl değiştirdiğini kontrol et.</li>
        <li>Türkçe aktarım riski <strong>${html(topic.risk)}</strong>; karşılaştırmalı iki örnek üretip farkı kendi cümlenle açıkla.</li>
        <li>Ön koşul: ${html(topic.on)}. Konu anlatımındaki mini tanıyı cevap anahtarını açmadan tamamla.</li>
      </ul>
    </section>

    <p style="margin-top:32px">
      <a class="btn primary" href="${html(lessonUrl)}">${html(topic.k)} konu anlatımını aç</a>
    </p>
    <p><a href="../konular.html">← Tüm konulara dön</a></p>
    <nav class="topic-neighbours" aria-label="Önceki ve sonraki konu">
      <a href="${html(previous.k)}.html">← ${html(previous.k)} · ${html(previous.ad)}</a>
      <a href="${html(next.k)}.html">${html(next.k)} · ${html(next.ad)} →</a>
    </nav>
  </article>
</main>

<footer class="site-footer">
  <div class="wrap">
    <span>© 2026 YDS Hazırlık</span>
    <span>YDS konu haritası</span>
  </div>
</footer>
</body>
</html>
`;
}

const INDEX_FILE = path.join(ROOT, "konular.html");
const INDEX_START = "<!-- KONU-DIZINI:START -->";
const INDEX_END = "<!-- KONU-DIZINI:END -->";

function topicIndexFor(topics) {
  const groups = [];
  for (const topic of topics) {
    let group = groups.find((item) => item.name === topic.eksen);
    if (!group) { group = { name: topic.eksen, topics: [] }; groups.push(group); }
    group.topics.push(topic);
  }
  const content = groups.map((group) =>
    `<h3>${html(group.name)}</h3><div class="konu-link-dizini">` +
    group.topics.map((topic) =>
      `<a href="konu/${html(topic.k)}.html"><b>${html(topic.k)}</b><span>${html(topic.ad)}</span></a>`
    ).join("") + `</div>`
  ).join("\n");
  return `${INDEX_START}\n` +
    `<details class="card konu-dizin" style="margin-top:22px"><summary>129 konunun paylaşılabilir bağlantı dizini</summary>` +
    `<p class="small muted">Bir konuyu doğrudan açmak veya bağlantısını paylaşmak için kodunu seç.</p>${content}</details>\n` +
    `${INDEX_END}`;
}

function updateTopicIndex(topics) {
  const current = fs.readFileSync(INDEX_FILE, "utf8");
  const start = current.indexOf(INDEX_START);
  const end = current.indexOf(INDEX_END);
  if (start < 0 || end < start) throw new Error("konular.html konu dizini işaretleri bulunamadı.");
  const next = current.slice(0, start) + topicIndexFor(topics) +
    current.slice(end + INDEX_END.length);
  return writeIfChanged(INDEX_FILE, next);
}

const STATIC_URLS = [
  ["/", "1.0"],
  ["/konular.html", "0.9"],
  ["/kelimeler.html", "0.9"],
  ["/aileler.html", "0.9"],
  ["/obekler.html", "0.9"],
  ["/quiz.html", "0.9"],
  ["/deneme.html", "0.9"],
  ["/durum.html", "0.6"],
  ["/gramer.html", "0.8"],
  ["/baglaclar.html", "0.8"],
  ["/ara.html", "0.4"],
  ["/yontem.html", "0.6"],
  ["/ayarlar.html", "0.4"],
];

function sitemapFor(topics) {
  const urls = [
    ...STATIC_URLS.map(([pathname, priority]) => ({
      loc: `${ORIGIN}${pathname}`,
      priority,
    })),
    ...topics.map((topic) => ({
      loc: `${ORIGIN}/konu/${encodeURIComponent(topic.k)}.html`,
      priority: "0.7",
    })),
  ];

  if (new Set(urls.map((entry) => entry.loc)).size !== urls.length) {
    throw new Error("Site haritasında yinelenen URL üretildi.");
  }

  const body = urls.map(({ loc, priority }) => [
    "  <url>",
    `    <loc>${xml(loc)}</loc>`,
    `    <priority>${priority}</priority>`,
    "  </url>",
  ].join("\n")).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
}

function writeIfChanged(file, content) {
  if (fs.existsSync(file) && fs.readFileSync(file, "utf8") === content) return false;
  fs.writeFileSync(file, content, "utf8");
  return true;
}

function main() {
  const topics = readTopics();
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  let changedPages = 0;
  const canonicals = [];
  for (const [index, topic] of topics.entries()) {
    const file = path.join(OUTPUT_DIR, `${topic.k}.html`);
    const content = pageFor(topic, index, topics);
    if (writeIfChanged(file, content)) changedPages += 1;
    const match = content.match(/<link rel="canonical" href="([^"]+)">/);
    if (!match) throw new Error(`${topic.k}: canonical bağlantısı üretilemedi.`);
    canonicals.push(match[1]);
  }

  if (new Set(canonicals).size !== topics.length) {
    throw new Error("Konu sayfalarının canonical adresleri benzersiz değil.");
  }

  const sitemapChanged = writeIfChanged(SITEMAP, sitemapFor(topics));
  const indexChanged = updateTopicIndex(topics);
  console.log(`Konu sayfası: ${topics.length} (${changedPages} dosya güncellendi)`);
  console.log(`Benzersiz canonical: ${new Set(canonicals).size}`);
  console.log(`Sitemap URL: ${STATIC_URLS.length + topics.length}${sitemapChanged ? " (güncellendi)" : " (değişmedi)"}`);
  console.log(`Konu bağlantı dizini: ${indexChanged ? "güncellendi" : "değişmedi"}`);
}

main();
