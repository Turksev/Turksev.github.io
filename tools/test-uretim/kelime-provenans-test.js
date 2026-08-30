#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const KOK = path.resolve(__dirname, "..", "..");
const DOSYALAR = {
  duzeltmeler: path.join(KOK, "tools", "kelime-duzeltmeleri.json"),
  aliaslar: path.join(KOK, "data", "kelime-aliaslari.js"),
  provenans: path.join(KOK, "data", "kelime-provenans.json"),
  manifest: path.join(KOK, "data", "kaynak-manifest.json"),
  dizin: path.join(KOK, "data", "kelime-dizin.js"),
};

// row /raʊ/ -> row birleşmesiyle 10'a çıktı (30.08.2026).
const BEKLENEN_ALIAS_SAYISI = 10;
const KORUNAN_BASLIKLAR = ["low-lying", "adolescent"];
const sorunlar = [];

function goreli(dosya) {
  return path.relative(KOK, dosya).split(path.sep).join("/");
}

function sorun(tur, ileti) {
  sorunlar.push({ tur, ileti });
}

function nesneMi(deger) {
  return deger !== null && typeof deger === "object" && !Array.isArray(deger);
}

function hataOzeti(error) {
  return String(error && error.message ? error.message : error)
    .split(/\r?\n/, 1)[0]
    .trim();
}

function jsonOku(dosya) {
  if (!fs.existsSync(dosya)) {
    sorun("YÜKLEME", `${goreli(dosya)} bulunamadı.`);
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(dosya, "utf8"));
  } catch (error) {
    sorun("YÜKLEME", `${goreli(dosya)} geçerli JSON değil: ${hataOzeti(error)}.`);
    return null;
  }
}

function jsDegeriOku(dosya, pencereAlani) {
  if (!fs.existsSync(dosya)) {
    sorun("YÜKLEME", `${goreli(dosya)} bulunamadı.`);
    return null;
  }
  try {
    const kaynak = fs.readFileSync(dosya, "utf8");
    const baglam = vm.createContext({ window: Object.create(null) });
    new vm.Script(kaynak, { filename: goreli(dosya) }).runInContext(baglam, {
      timeout: 5000,
    });
    if (!(pencereAlani in baglam.window)) {
      sorun(
        "YÜKLEME",
        `${goreli(dosya)} window.${pencereAlani} değerini üretmedi.`
      );
      return null;
    }
    return baglam.window[pencereAlani];
  } catch (error) {
    sorun(
      "YÜKLEME",
      `${goreli(dosya)} VM içinde yüklenemedi: ${hataOzeti(error)}.`
    );
    return null;
  }
}

function diziAl(belge, alan, dosya) {
  if (!nesneMi(belge) || !Array.isArray(belge[alan])) {
    sorun("ŞEMA", `${goreli(dosya)} içindeki '${alan}' bir dizi olmalı.`);
    return [];
  }
  return belge[alan];
}

function kararlıMetin(deger) {
  if (Array.isArray(deger)) {
    return `[${deger.map(kararlıMetin).join(",")}]`;
  }
  if (nesneMi(deger)) {
    return `{${Object.keys(deger)
      .sort()
      .map((anahtar) => `${JSON.stringify(anahtar)}:${kararlıMetin(deger[anahtar])}`)
      .join(",")}}`;
  }
  return JSON.stringify(deger);
}

function duzeltmeAnahtari(kayit) {
  if (!nesneMi(kayit) || !Array.isArray(kayit.eskiler) || typeof kayit.yeni !== "string") {
    return null;
  }
  return `${[...kayit.eskiler].sort().join("\u0001")}\u0002${kayit.yeni}`;
}

function kayitHaritasi(kayitlar, etiket) {
  const harita = new Map();
  kayitlar.forEach((kayit, sira) => {
    const anahtar = duzeltmeAnahtari(kayit);
    if (!anahtar) {
      sorun("ŞEMA", `${etiket}[${sira}] 'eskiler' dizisi ve 'yeni' metni taşımalı.`);
      return;
    }
    if (harita.has(anahtar)) {
      sorun(
        "ÇİFT",
        `${etiket} içinde aynı düzeltme birden fazla kez var: ${kayit.yeni}.`
      );
      return;
    }
    harita.set(anahtar, kayit);
  });
  return harita;
}

function urlDogrula(url, etiket) {
  if (typeof url !== "string" || !url.trim()) {
    sorun("SÖZLÜK", `${etiket}: sözlük URL'si dolu bir metin olmalı.`);
    return;
  }
  try {
    const ayrik = new URL(url);
    if (ayrik.protocol !== "https:") {
      sorun("SÖZLÜK", `${etiket}: sözlük URL'si HTTPS olmalı: ${url}.`);
    }
    if (!ayrik.hostname || ayrik.username || ayrik.password) {
      sorun("SÖZLÜK", `${etiket}: sözlük URL'si geçerli bir genel HTTPS adresi olmalı.`);
    }
  } catch {
    sorun("SÖZLÜK", `${etiket}: geçersiz sözlük URL'si: ${url}.`);
  }
}

function pdfReferansiDogrula(ref, etiket, manifestKimlikleri) {
  if (!nesneMi(ref)) {
    sorun("PDF", `${etiket}: PDF referansı nesne olmalı.`);
    return;
  }
  if (typeof ref.sinav_id !== "string" || !ref.sinav_id.trim()) {
    sorun("PDF", `${etiket}: 'sinav_id' eksik.`);
  } else if (!manifestKimlikleri.has(ref.sinav_id)) {
    sorun("KAYNAK", `${etiket}: '${ref.sinav_id}' kaynak manifestinde yok.`);
  }
  if (!Number.isInteger(ref.pdf_sayfa) || ref.pdf_sayfa < 1 || ref.pdf_sayfa > 500) {
    sorun("PDF", `${etiket}: pdf_sayfa 1–500 arasında bir tam sayı olmalı.`);
  }
  if (
    Object.prototype.hasOwnProperty.call(ref, "soru") &&
    (!Number.isInteger(ref.soru) || ref.soru < 1 || ref.soru > 100)
  ) {
    sorun("PDF", `${etiket}: soru, verildiğinde 1–100 arasında bir tam sayı olmalı.`);
  }
  if (
    typeof ref.yuzey !== "string" ||
    !ref.yuzey.trim() ||
    ref.yuzey.length > 200 ||
    /[\u0000-\u001f\u007f]/.test(ref.yuzey)
  ) {
    sorun("PDF", `${etiket}: yuzey, 1–200 karakterlik temiz bir metin olmalı.`);
  }
  if (
    Object.prototype.hasOwnProperty.call(ref, "secenek") &&
    !/^[A-E]$/.test(ref.secenek)
  ) {
    sorun("PDF", `${etiket}: secenek, verildiğinde A–E arasında olmalı.`);
  }
}

function kaynakKaydiniDogrula(kayit, etiket, manifestKimlikleri) {
  if (!nesneMi(kayit)) {
    sorun("ŞEMA", `${etiket}: kayıt nesne olmalı.`);
    return;
  }
  const kaynaklar = Array.isArray(kayit.kaynaklar) ? kayit.kaynaklar : [];
  if (!Array.isArray(kayit.kaynaklar)) {
    sorun("ŞEMA", `${etiket}: kaynaklar bir dizi olmalı.`);
  }
  kaynaklar.forEach((ref, sira) =>
    pdfReferansiDogrula(ref, `${etiket}.kaynaklar[${sira}]`, manifestKimlikleri)
  );
  if (Object.prototype.hasOwnProperty.call(kayit, "sozluk")) {
    urlDogrula(kayit.sozluk, etiket);
  }
  if (kaynaklar.length === 0 && !kayit.sozluk) {
    sorun("KAYNAK", `${etiket}: ne PDF referansı ne de sözlük URL'si var.`);
  }
}

function aliasDonguleriniDogrula(aliaslar) {
  const durum = new Map();
  const yol = [];

  function ziyaret(etkin) {
    const mevcutDurum = durum.get(etkin) || 0;
    if (mevcutDurum === 2) return;
    if (mevcutDurum === 1) {
      const baslangic = yol.indexOf(etkin);
      const dongu = [...yol.slice(Math.max(0, baslangic)), etkin];
      sorun("ALIAS", `Alias döngüsü bulundu: ${dongu.join(" -> ")}.`);
      return;
    }

    durum.set(etkin, 1);
    yol.push(etkin);
    const hedef = aliaslar[etkin];
    if (Object.prototype.hasOwnProperty.call(aliaslar, hedef)) ziyaret(hedef);
    yol.pop();
    durum.set(etkin, 2);
  }

  for (const eski of Object.keys(aliaslar)) ziyaret(eski);
}

function ana() {
  const duzeltmeBelgesi = jsonOku(DOSYALAR.duzeltmeler);
  const provenansBelgesi = jsonOku(DOSYALAR.provenans);
  const manifestBelgesi = jsonOku(DOSYALAR.manifest);
  const aliaslar = jsDegeriOku(DOSYALAR.aliaslar, "YDS_KELIME_ALIASES");
  const dizin = jsDegeriOku(DOSYALAR.dizin, "KELIME_DIZIN");

  const duzeltmeler = diziAl(duzeltmeBelgesi, "duzeltmeler", DOSYALAR.duzeltmeler);
  const publicDuzeltmeler = diziAl(
    provenansBelgesi,
    "duzeltmeler",
    DOSYALAR.provenans
  );
  const korunanlar = diziAl(
    duzeltmeBelgesi,
    "korunan_kaynak_kayitlari",
    DOSYALAR.duzeltmeler
  );
  const publicKorunanlar = diziAl(
    provenansBelgesi,
    "korunan_kaynak_kayitlari",
    DOSYALAR.provenans
  );
  const sinavlar = diziAl(manifestBelgesi, "sinavlar", DOSYALAR.manifest);

  if (!nesneMi(aliaslar)) {
    sorun("ŞEMA", "data/kelime-aliaslari.js bir alias nesnesi üretmeli.");
  }
  if (!Array.isArray(dizin)) {
    sorun("ŞEMA", "data/kelime-dizin.js bir kelime dizisi üretmeli.");
  }

  const manifestKimlikleri = new Set();
  sinavlar.forEach((sinav, sira) => {
    const id = sinav && sinav.id;
    if (typeof id !== "string" || !id.trim()) {
      sorun("MANİFEST", `sinavlar[${sira}].id dolu bir metin olmalı.`);
    } else if (manifestKimlikleri.has(id)) {
      sorun("ÇİFT", `Kaynak manifestinde yinelenen sınav kimliği var: ${id}.`);
    } else {
      manifestKimlikleri.add(id);
    }
  });
  if (
    nesneMi(manifestBelgesi) &&
    manifestBelgesi.sinav_sayisi !== sinavlar.length
  ) {
    sorun(
      "MANİFEST",
      `sinav_sayisi=${manifestBelgesi.sinav_sayisi}, gerçek kayıt sayısı=${sinavlar.length}.`
    );
  }

  const dizinAdetleri = new Map();
  if (Array.isArray(dizin)) {
    dizin.forEach((kayit, sira) => {
      const ad = kayit && kayit.e;
      if (typeof ad !== "string" || !ad.trim()) {
        sorun("DİZİN", `KELIME_DIZIN[${sira}].e dolu bir metin olmalı.`);
      } else {
        dizinAdetleri.set(ad, (dizinAdetleri.get(ad) || 0) + 1);
      }
    });
  }

  const guvenliAliaslar = nesneMi(aliaslar) ? aliaslar : Object.create(null);
  const aliasAnahtarlari = Object.keys(guvenliAliaslar);
  if (aliasAnahtarlari.length !== BEKLENEN_ALIAS_SAYISI) {
    sorun(
      "ALIAS",
      `Alias sayısı ${aliasAnahtarlari.length}; beklenen ${BEKLENEN_ALIAS_SAYISI}.`
    );
  }

  const beklenenAliaslar = new Map();
  duzeltmeler.forEach((kayit, sira) => {
    if (!nesneMi(kayit) || !Array.isArray(kayit.eskiler) || typeof kayit.yeni !== "string") {
      sorun("ŞEMA", `duzeltmeler[${sira}] geçerli eskiler/yeni alanları taşımıyor.`);
      return;
    }
    if (!kayit.eskiler.length) {
      sorun("ŞEMA", `duzeltmeler[${sira}].eskiler boş olamaz.`);
    }
    for (const eski of kayit.eskiler) {
      if (typeof eski !== "string" || !eski.trim()) {
        sorun("ŞEMA", `duzeltmeler[${sira}].eskiler geçersiz bir ad içeriyor.`);
        continue;
      }
      if (eski === kayit.yeni) continue;
      if (beklenenAliaslar.has(eski) && beklenenAliaslar.get(eski) !== kayit.yeni) {
        sorun(
          "ALIAS",
          `'${eski}' birden fazla hedefe bağlanmış: '${beklenenAliaslar.get(eski)}' ve '${kayit.yeni}'.`
        );
      }
      beklenenAliaslar.set(eski, kayit.yeni);
    }
    if ((dizinAdetleri.get(kayit.yeni) || 0) !== 1) {
      sorun(
        "DİZİN",
        `Düzeltilmiş başlık '${kayit.yeni}' dizinde tam bir kez bulunmalı ` +
          `(bulunan: ${dizinAdetleri.get(kayit.yeni) || 0}).`
      );
    }
    kaynakKaydiniDogrula(kayit, `duzeltmeler[${sira}] (${kayit.yeni})`, manifestKimlikleri);
  });

  if (beklenenAliaslar.size !== BEKLENEN_ALIAS_SAYISI) {
    sorun(
      "ALIAS",
      `Düzeltme kaynağından ${beklenenAliaslar.size} gerçek yeniden adlandırma çıktı; ` +
        `beklenen ${BEKLENEN_ALIAS_SAYISI}.`
    );
  }

  for (const eski of aliasAnahtarlari) {
    const hedef = guvenliAliaslar[eski];
    if (typeof hedef !== "string" || !hedef.trim()) {
      sorun("ALIAS", `'${eski}' aliasının hedefi dolu bir metin olmalı.`);
      continue;
    }
    if (eski === hedef) {
      sorun("ALIAS", `'${eski}' kendisine alias olamaz.`);
    }
    if ((dizinAdetleri.get(hedef) || 0) !== 1) {
      sorun(
        "DİZİN",
        `Alias hedefi '${hedef}' dizinde tam bir kez bulunmalı ` +
          `(bulunan: ${dizinAdetleri.get(hedef) || 0}).`
      );
    }
    if ((dizinAdetleri.get(eski) || 0) !== 0) {
      sorun("DİZİN", `Eski alias adı '${eski}' kelime dizininde kalmış.`);
    }
    if (Object.prototype.hasOwnProperty.call(guvenliAliaslar, hedef)) {
      sorun("ALIAS", `Alias zinciri bulundu: '${eski}' -> '${hedef}' -> başka hedef.`);
    }
    if (!beklenenAliaslar.has(eski)) {
      sorun("ALIAS", `'${eski}' aliasının tools/kelime-duzeltmeleri.json karşılığı yok.`);
    } else if (beklenenAliaslar.get(eski) !== hedef) {
      sorun(
        "ALIAS",
        `'${eski}' hedefi '${hedef}', düzeltme kaynağındaki hedef '${beklenenAliaslar.get(eski)}'.`
      );
    }
  }
  for (const [eski, hedef] of beklenenAliaslar) {
    if (!Object.prototype.hasOwnProperty.call(guvenliAliaslar, eski)) {
      sorun("ALIAS", `Beklenen alias eksik: '${eski}' -> '${hedef}'.`);
    }
  }
  aliasDonguleriniDogrula(guvenliAliaslar);

  const kaynakHaritasi = kayitHaritasi(duzeltmeler, "tools düzeltmeleri");
  const publicHarita = kayitHaritasi(publicDuzeltmeler, "public provenans düzeltmeleri");
  for (const [anahtar, kaynakKayit] of kaynakHaritasi) {
    const publicKayit = publicHarita.get(anahtar);
    if (!publicKayit) {
      sorun(
        "PROVENANS",
        `'${kaynakKayit.yeni}' düzeltmesinin public provenans kaydı yok.`
      );
    } else if (kararlıMetin(kaynakKayit) !== kararlıMetin(publicKayit)) {
      sorun(
        "PROVENANS",
        `'${kaynakKayit.yeni}' public provenans kaydı düzeltme kaynağıyla aynı değil.`
      );
    }
  }
  for (const [anahtar, publicKayit] of publicHarita) {
    if (!kaynakHaritasi.has(anahtar)) {
      sorun(
        "PROVENANS",
        `Public provenansta kaynak düzeltmesi olmayan fazladan kayıt var: '${publicKayit.yeni}'.`
      );
    }
  }

  const korunanHaritasi = new Map();
  korunanlar.forEach((kayit, sira) => {
    const baslik = kayit && kayit.baslik;
    if (typeof baslik !== "string" || !baslik.trim()) {
      sorun("ŞEMA", `korunan_kaynak_kayitlari[${sira}].baslik geçersiz.`);
      return;
    }
    if (korunanHaritasi.has(baslik)) {
      sorun("ÇİFT", `Korunan kaynak kaydı yineleniyor: '${baslik}'.`);
    }
    korunanHaritasi.set(baslik, kayit);
    kaynakKaydiniDogrula(kayit, `korunan kaynak '${baslik}'`, manifestKimlikleri);
  });
  const publicKorunanHaritasi = new Map();
  publicKorunanlar.forEach((kayit, sira) => {
    const baslik = kayit && kayit.baslik;
    if (typeof baslik !== "string" || !baslik.trim()) {
      sorun("ŞEMA", `public korunan_kaynak_kayitlari[${sira}].baslik geçersiz.`);
      return;
    }
    if (publicKorunanHaritasi.has(baslik)) {
      sorun("ÇİFT", `Public korunan kaynak kaydı yineleniyor: '${baslik}'.`);
    }
    publicKorunanHaritasi.set(baslik, kayit);
  });

  for (const baslik of KORUNAN_BASLIKLAR) {
    if ((dizinAdetleri.get(baslik) || 0) !== 1) {
      sorun(
        "KORUNAN",
        `'${baslik}' kelime dizininde tam bir kez bulunmalı ` +
          `(bulunan: ${dizinAdetleri.get(baslik) || 0}).`
      );
    }
    const kaynakKayit = korunanHaritasi.get(baslik);
    const publicKayit = publicKorunanHaritasi.get(baslik);
    if (!kaynakKayit) {
      sorun("KORUNAN", `'${baslik}' tools kaynağında korunan kayıt olarak yok.`);
    }
    if (!publicKayit) {
      sorun("KORUNAN", `'${baslik}' public provenansta korunan kayıt olarak yok.`);
    }
    if (
      kaynakKayit &&
      publicKayit &&
      kararlıMetin(kaynakKayit) !== kararlıMetin(publicKayit)
    ) {
      sorun("PROVENANS", `'${baslik}' korunan public kaydı kaynakla aynı değil.`);
    }
  }

  if (sorunlar.length) {
    console.error("KELİME PROVENANS TESTİ: BAŞARISIZ");
    console.error(`Toplam ${sorunlar.length} sorun bulundu:`);
    for (const { tur, ileti } of sorunlar) console.error(`- [${tur}] ${ileti}`);
    process.exitCode = 1;
    return;
  }

  const pdfReferansSayisi = duzeltmeler.reduce(
    (toplam, kayit) => toplam + (Array.isArray(kayit.kaynaklar) ? kayit.kaynaklar.length : 0),
    0
  ) + korunanlar.reduce(
    (toplam, kayit) => toplam + (Array.isArray(kayit.kaynaklar) ? kayit.kaynaklar.length : 0),
    0
  );
  const sozlukSayisi = duzeltmeler.filter((kayit) => kayit && kayit.sozluk).length;
  console.log("KELİME PROVENANS TESTİ: BAŞARILI");
  console.log(
    `${aliasAnahtarlari.length} alias, ${duzeltmeler.length} düzeltme, ` +
      `${pdfReferansSayisi} PDF referansı, ${sozlukSayisi} HTTPS sözlük URL'si, ` +
      `${manifestKimlikleri.size} manifest kaynağı ve ${dizinAdetleri.size} dizin başlığı doğrulandı.`
  );
}

ana();
