#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const KOK = path.resolve(__dirname, "..", "..");
const VERI_DIZINI = path.join(KOK, "data");
const KONULAR_DOSYASI = path.join(VERI_DIZINI, "konular.js");
const TEMEL_METIN_DOSYASI = path.join(VERI_DIZINI, "konu-metinleri.js");
const EK_DOSYA_DESENI = /^konu-metinleri-.+-ek\.js$/;
const BEKLENEN_UNITE_SAYISI = 129;
const KELIME_TOLERANS_ORANI = 0.10;
const ASGARI_KELIME_TOLERANSI = 5;

const sorunlar = [];

function goreli(dosya) {
  return path.relative(KOK, dosya).split(path.sep).join("/");
}

function sorun(tur, ileti) {
  sorunlar.push({ tur, ileti });
}

const ARA_KODU = fs.readFileSync(path.join(KOK, "assets", "js", "ara.js"), "utf8");
if (!ARA_KODU.includes("u.k + ' ' + u.ad")) {
  sorun("arama", "Konu kodları genel arama havuzuna eklenmemiş.");
}

function hataOzeti(error) {
  const ilkSatir = String(error && error.message ? error.message : error)
    .split(/\r?\n/, 1)[0]
    .trim();
  return ilkSatir || "bilinmeyen hata";
}

function dosyayiDerle(dosya) {
  if (!fs.existsSync(dosya)) {
    sorun("YÜKLEME", `${goreli(dosya)} bulunamadı.`);
    return null;
  }

  const kaynak = fs.readFileSync(dosya, "utf8");
  try {
    return {
      dosya,
      kaynak,
      betik: new vm.Script(kaynak, { filename: goreli(dosya) }),
    };
  } catch (error) {
    sorun(
      "YÜKLEME",
      `${goreli(dosya)} ayrıştırılamadı: ${hataOzeti(error)}. ` +
        "Dosya başka bir çalışma tarafından henüz tamamlanmamış olabilir."
    );
    return null;
  }
}

function yeniBaglam() {
  return vm.createContext({ window: Object.create(null) });
}

function betigiCalistir(derlenmis, baglam, amac) {
  if (!derlenmis) return false;
  try {
    derlenmis.betik.runInContext(baglam, { timeout: 5000 });
    return true;
  } catch (error) {
    sorun(
      "YÜKLEME",
      `${goreli(derlenmis.dosya)} ${amac} sırasında çalıştırılamadı: ${hataOzeti(error)}.`
    );
    return false;
  }
}

function nesneMi(deger) {
  return deger !== null && typeof deger === "object" && !Array.isArray(deger);
}

function kodlariKisalt(kodlar, sinir = 24) {
  const sirali = [...kodlar].sort();
  if (sirali.length <= sinir) return sirali.join(", ");
  return `${sirali.slice(0, sinir).join(", ")} (+${sirali.length - sinir} kod daha)`;
}

function tekrarliKodlariBul(kodlar) {
  const adetler = new Map();
  for (const kod of kodlar) adetler.set(kod, (adetler.get(kod) || 0) + 1);
  return [...adetler.entries()].filter(([, adet]) => adet > 1);
}

function kaynakKayitKodlari(kaynak) {
  const kodlar = [];
  const desen = /^\s*["']?([TE]\d{2})["']?\s*:/gm;
  let eslesme;
  while ((eslesme = desen.exec(kaynak)) !== null) kodlar.push(eslesme[1]);
  return kodlar;
}

function metneCevir(html) {
  return String(html || "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&(?:#\d+|#x[\da-f]+|[a-z][\w-]*);/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function kelimeSay(metin) {
  const eslesmeler = String(metin || "").match(
    /[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu
  );
  return eslesmeler ? eslesmeler.length : 0;
}

function imza(metin) {
  return metneCevir(metin)
    .normalize("NFC")
    .toLocaleLowerCase("tr-TR")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function baslikAnahtari(metin) {
  return metneCevir(metin)
    .normalize("NFC")
    .replace(/[’‘`´]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("tr-TR");
}

function h2BolumleriniAyir(html) {
  const bolumler = [];
  const desen = /<h2\b[^>]*>([\s\S]*?)<\/h2>/gi;
  let eslesme;
  while ((eslesme = desen.exec(html)) !== null) {
    bolumler.push({
      baslik: metneCevir(eslesme[1]),
      anahtar: baslikAnahtari(eslesme[1]),
      baslangic: eslesme.index,
      icerikBaslangici: desen.lastIndex,
    });
  }
  for (let i = 0; i < bolumler.length; i += 1) {
    bolumler[i].icerik = html.slice(
      bolumler[i].icerikBaslangici,
      i + 1 < bolumler.length ? bolumler[i + 1].baslangic : html.length
    );
  }
  return bolumler;
}

function listeMaddesiSay(html) {
  const eslesmeler = String(html || "").match(/<li\b[^>]*>/gi);
  return eslesmeler ? eslesmeler.length : 0;
}

function alanlariDogrula(kod, kayit, dosya, ekMi) {
  const etiket = `${kod} (${goreli(dosya)})`;
  if (!nesneMi(kayit)) {
    sorun("BİÇİM", `${etiket}: anlatım kaydı nesne değil.`);
    return;
  }

  for (const alan of ["baslik", "ozet", "html", "kelime"]) {
    if (!(alan in kayit)) sorun("BİÇİM", `${etiket}: '${alan}' alanı eksik.`);
  }

  if (typeof kayit.baslik !== "string" || !kayit.baslik.trim()) {
    sorun("BİÇİM", `${etiket}: 'baslik' dolu bir metin olmalı.`);
  }
  if (typeof kayit.ozet !== "string" || !kayit.ozet.trim()) {
    sorun("BİÇİM", `${etiket}: 'ozet' dolu bir metin olmalı.`);
  }
  if (typeof kayit.html !== "string" || !kayit.html.trim()) {
    sorun("BİÇİM", `${etiket}: 'html' dolu bir metin olmalı.`);
  }
  if (!Number.isInteger(kayit.kelime) || kayit.kelime <= 0) {
    sorun("BİÇİM", `${etiket}: 'kelime' pozitif bir tam sayı olmalı.`);
  }

  if (ekMi && typeof kayit.html === "string" && kayit.html.trim()) {
    ekAnlatimiDogrula(kod, kayit, dosya);
  }
}

const GEREKLI_BOLUMLER = [
  { ad: "Temel ayrım/kural", asgari: 20, ozgun: true },
  { ad: "YDS'de çözüm yolu", asgari: 18, ozgun: true },
  { ad: "Sık tuzaklar", asgari: 15, ozgun: true },
  { ad: "Mini tanı", asgari: 3, ozgun: false },
  { ad: "Cevap ve gerekçe", asgari: 3, ozgun: false },
  { ad: "Son kontrol", asgari: 10, ozgun: false },
];

const bolumImzalari = new Map();
const htmlImzalari = new Map();

function ozgunluguKaydet(kod, bolumAdi, icerik, dosya) {
  const anahtar = `${baslikAnahtari(bolumAdi)}\u0000${imza(icerik)}`;
  const onceki = bolumImzalari.get(anahtar);
  if (onceki) {
    sorun(
      "ÖZGÜNLÜK",
      `${kod} ile ${onceki.kod} aynı '${bolumAdi}' metnini kullanıyor ` +
        `(${goreli(dosya)} / ${goreli(onceki.dosya)}).`
    );
  } else {
    bolumImzalari.set(anahtar, { kod, dosya });
  }
}

function ekAnlatimiDogrula(kod, kayit, dosya) {
  const etiket = `${kod} (${goreli(dosya)})`;
  const bolumler = h2BolumleriniAyir(kayit.html);
  const istenenAnahtarlar = GEREKLI_BOLUMLER.map((bolum) => baslikAnahtari(bolum.ad));
  let oncekiSira = -1;

  for (const gerekli of GEREKLI_BOLUMLER) {
    const anahtar = baslikAnahtari(gerekli.ad);
    const bulunanlar = bolumler.filter((bolum) => bolum.anahtar === anahtar);
    if (bulunanlar.length === 0) {
      sorun("BÖLÜM", `${etiket}: <h2>${gerekli.ad}</h2> bölümü eksik.`);
      continue;
    }
    if (bulunanlar.length > 1) {
      sorun("BÖLÜM", `${etiket}: '${gerekli.ad}' bölümü ${bulunanlar.length} kez yazılmış.`);
    }

    const bulunan = bulunanlar[0];
    const sira = bolumler.indexOf(bulunan);
    if (sira <= oncekiSira) {
      sorun("BÖLÜM", `${etiket}: '${gerekli.ad}' bölümü beklenen sırada değil.`);
    }
    oncekiSira = sira;

    const adet = kelimeSay(metneCevir(bulunan.icerik));
    if (adet < gerekli.asgari) {
      sorun(
        "BÖLÜM",
        `${etiket}: '${gerekli.ad}' bölümü konuya özel açıklama için çok kısa ` +
          `(${adet} kelime; en az ${gerekli.asgari}).`
      );
    }
    if (gerekli.ozgun && adet >= gerekli.asgari) {
      ozgunluguKaydet(kod, gerekli.ad, bulunan.icerik, dosya);
    }
  }

  const mini = bolumler.find((bolum) => bolum.anahtar === istenenAnahtarlar[3]);
  const cevap = bolumler.find((bolum) => bolum.anahtar === istenenAnahtarlar[4]);
  if (mini && listeMaddesiSay(mini.icerik) < 3) {
    sorun(
      "UYGULAMA",
      `${etiket}: 'Mini tanı' bölümünde en az 3 soru/uygulama olmalı ` +
        `(bulunan: ${listeMaddesiSay(mini.icerik)}).`
    );
  }
  if (cevap && listeMaddesiSay(cevap.icerik) < 3) {
    sorun(
      "UYGULAMA",
      `${etiket}: 'Cevap ve gerekçe' bölümünde en az 3 yanıt olmalı ` +
        `(bulunan: ${listeMaddesiSay(cevap.icerik)}).`
    );
  }

  if (/\b(?:TODO|TBD|LOREM\s+IPSUM|PLACEHOLDER)\b/i.test(metneCevir(kayit.html))) {
    sorun("İÇERİK", `${etiket}: tamamlanmamış yer tutucu metin içeriyor.`);
  }

  const tamImza = imza(kayit.html);
  const ayniHtml = htmlImzalari.get(tamImza);
  if (ayniHtml) {
    sorun(
      "ÖZGÜNLÜK",
      `${kod} ile ${ayniHtml.kod} aynı anlatım HTML'sini kullanıyor ` +
        `(${goreli(dosya)} / ${goreli(ayniHtml.dosya)}).`
    );
  } else {
    htmlImzalari.set(tamImza, { kod, dosya });
  }

  const gercekKelime = kelimeSay(metneCevir(kayit.html));
  if (Number.isInteger(kayit.kelime) && kayit.kelime > 0) {
    const tolerans = Math.max(
      ASGARI_KELIME_TOLERANSI,
      Math.ceil(gercekKelime * KELIME_TOLERANS_ORANI)
    );
    const fark = Math.abs(kayit.kelime - gercekKelime);
    if (fark > tolerans) {
      sorun(
        "KELİME",
        `${etiket}: kelime=${kayit.kelime}, metin sayımı=${gercekKelime}, ` +
          `izin verilen fark=±${tolerans}.`
      );
    }
  }
}

function kayitDosyasiniYukle(derlenmis, ekMi, sahipler) {
  if (!derlenmis) return null;
  const baglam = yeniBaglam();
  if (!betigiCalistir(derlenmis, baglam, "yalıtılmış VM yüklemesi")) return null;

  const kayitlar = baglam.window.KONU_METINLERI;
  if (!nesneMi(kayitlar)) {
    sorun(
      "BİÇİM",
      `${goreli(derlenmis.dosya)} window.KONU_METINLERI nesnesi üretmedi.`
    );
    return null;
  }

  const kaynakKodlari = kaynakKayitKodlari(derlenmis.kaynak);
  for (const [kod, adet] of tekrarliKodlariBul(kaynakKodlari)) {
    sorun(
      "ÇİFT",
      `${kod}, ${goreli(derlenmis.dosya)} içinde ${adet} kez tanımlanmış.`
    );
  }

  for (const [kod, kayit] of Object.entries(kayitlar)) {
    if (!/^[TE]\d{2}$/.test(kod)) {
      sorun("BİÇİM", `${goreli(derlenmis.dosya)} geçersiz anlatım kodu içeriyor: '${kod}'.`);
    }
    alanlariDogrula(kod, kayit, derlenmis.dosya, ekMi);
    if (!sahipler.has(kod)) sahipler.set(kod, []);
    sahipler.get(kod).push(goreli(derlenmis.dosya));
  }

  return kayitlar;
}

function konuKodlariniYukle(derlenmis) {
  if (!derlenmis) return [];
  const baglam = yeniBaglam();
  if (!betigiCalistir(derlenmis, baglam, "konu haritası yüklemesi")) return [];

  const gruplar = baglam.window.KONULAR;
  if (!Array.isArray(gruplar)) {
    sorun("BİÇİM", `${goreli(derlenmis.dosya)} window.KONULAR dizisi üretmedi.`);
    return [];
  }

  const kodlar = [];
  gruplar.forEach((grup, grupNo) => {
    if (!grup || !Array.isArray(grup.u)) {
      sorun("BİÇİM", `KONULAR[${grupNo}].u bir dizi değil.`);
      return;
    }
    grup.u.forEach((unite, uniteNo) => {
      const kod = unite && unite.k;
      if (typeof kod !== "string" || !/^[TE]\d{2}$/.test(kod)) {
        sorun("BİÇİM", `KONULAR[${grupNo}].u[${uniteNo}] geçerli bir ünite kodu taşımıyor.`);
      } else {
        kodlar.push(kod);
      }
    });
  });
  return kodlar;
}

function raporla(ozet) {
  if (sorunlar.length === 0) {
    console.log("KONU KAPSAM TESTİ: BAŞARILI");
    console.log(
      `${ozet.unite} ünite kodu = ${ozet.anlatim} anlatım; ` +
        `${ozet.ekAnlatim} ek anlatım, ${ozet.ekDosya} ek dosyada doğrulandı.`
    );
    return;
  }

  console.error("KONU KAPSAM TESTİ: BAŞARISIZ");
  console.error(
    `Ünite: ${ozet.unite}/${BEKLENEN_UNITE_SAYISI}; ` +
      `anlatım: ${ozet.anlatim}/${BEKLENEN_UNITE_SAYISI}; ` +
      `ek dosya: ${ozet.ekDosya}; sorun: ${sorunlar.length}.`
  );
  for (const { tur, ileti } of sorunlar) console.error(`- [${tur}] ${ileti}`);
  process.exitCode = 1;
}

function ana() {
  const konuBetigi = dosyayiDerle(KONULAR_DOSYASI);
  const temelBetik = dosyayiDerle(TEMEL_METIN_DOSYASI);
  const ekDosyalar = fs.existsSync(VERI_DIZINI)
    ? fs
        .readdirSync(VERI_DIZINI)
        .filter((ad) => EK_DOSYA_DESENI.test(ad))
        .sort()
        .map((ad) => path.join(VERI_DIZINI, ad))
    : [];

  if (ekDosyalar.length === 0) {
    sorun("YÜKLEME", "data/konu-metinleri-*-ek.js biçiminde hiçbir ek anlatım dosyası bulunamadı.");
  }
  const ekBetikleri = ekDosyalar.map(dosyayiDerle);

  const konuKodlari = konuKodlariniYukle(konuBetigi);
  const tekrarliKonular = tekrarliKodlariBul(konuKodlari);
  for (const [kod, adet] of tekrarliKonular) {
    sorun("ÇİFT", `${kod}, data/konular.js içinde ${adet} kez tanımlanmış.`);
  }
  const benzersizKonuKodlari = new Set(konuKodlari);
  if (konuKodlari.length !== BEKLENEN_UNITE_SAYISI) {
    sorun(
      "KAPSAM",
      `data/konular.js ${konuKodlari.length} ünite içeriyor; beklenen ${BEKLENEN_UNITE_SAYISI}.`
    );
  }
  if (benzersizKonuKodlari.size !== BEKLENEN_UNITE_SAYISI) {
    sorun(
      "KAPSAM",
      `data/konular.js içindeki benzersiz kod sayısı ${benzersizKonuKodlari.size}; ` +
        `beklenen ${BEKLENEN_UNITE_SAYISI}.`
    );
  }

  const sahipler = new Map();
  const temelKayitlar = kayitDosyasiniYukle(temelBetik, false, sahipler);
  let ekAnlatimSayisi = 0;
  for (const ekBetigi of ekBetikleri) {
    const kayitlar = kayitDosyasiniYukle(ekBetigi, true, sahipler);
    if (kayitlar) ekAnlatimSayisi += Object.keys(kayitlar).length;
  }

  for (const [kod, dosyalar] of sahipler) {
    if (dosyalar.length > 1) {
      sorun("ÇİFT", `${kod} birden fazla anlatım dosyasında tanımlı: ${dosyalar.join(", ")}.`);
    }
  }

  const ortakBaglam = yeniBaglam();
  let ortakYuklemeBasarili = true;
  if (!betigiCalistir(temelBetik, ortakBaglam, "ortak VM yüklemesi")) {
    ortakYuklemeBasarili = false;
  }
  for (const ekBetigi of ekBetikleri) {
    if (!ekBetigi || !betigiCalistir(ekBetigi, ortakBaglam, "ortak VM yüklemesi")) {
      ortakYuklemeBasarili = false;
    }
  }

  const tumKayitlar = nesneMi(ortakBaglam.window.KONU_METINLERI)
    ? ortakBaglam.window.KONU_METINLERI
    : Object.create(null);
  if (!nesneMi(ortakBaglam.window.KONU_METINLERI)) {
    sorun("BİÇİM", "Ortak VM yüklemesi window.KONU_METINLERI nesnesi üretmedi.");
  }
  const anlatimKodlari = Object.keys(tumKayitlar);
  const anlatimKumesi = new Set(anlatimKodlari);

  if (anlatimKodlari.length !== BEKLENEN_UNITE_SAYISI) {
    sorun(
      "KAPSAM",
      `Yüklenen benzersiz anlatım sayısı ${anlatimKodlari.length}; ` +
        `beklenen ${BEKLENEN_UNITE_SAYISI}.` +
        (ortakYuklemeBasarili ? "" : " En az bir dosya yüklenemediği için sayı eksik olabilir.")
    );
  }

  if (benzersizKonuKodlari.size > 0) {
    const eksikler = [...benzersizKonuKodlari].filter((kod) => !anlatimKumesi.has(kod));
    const fazlalar = anlatimKodlari.filter((kod) => !benzersizKonuKodlari.has(kod));
    if (eksikler.length) {
      sorun("EKSİK", `${eksikler.length} ünitenin anlatımı yok: ${kodlariKisalt(eksikler)}.`);
    }
    if (fazlalar.length) {
      sorun("FAZLA", `${fazlalar.length} anlatımın ünite karşılığı yok: ${kodlariKisalt(fazlalar)}.`);
    }
  }

  if (temelKayitlar && sahipler.size !== anlatimKodlari.length && ortakYuklemeBasarili) {
    sorun(
      "KAPSAM",
      `Dosya bazında ${sahipler.size}, ortak yüklemede ${anlatimKodlari.length} benzersiz kod bulundu; ` +
        "bir ek dosya önceki anlatımları sıfırlıyor veya beklenmedik biçimde değiştiriyor olabilir."
    );
  }

  raporla({
    unite: konuKodlari.length,
    anlatim: anlatimKodlari.length,
    ekAnlatim: ekAnlatimSayisi,
    ekDosya: ekDosyalar.length,
  });
}

ana();
