/* Lossless, local-only encoding. In-memory and Firestore envelopes stay v2. */
(function () {
  'use strict';
  var M = window.YDS.EsitlemeMotoru;
  var own = Object.prototype.hasOwnProperty;
  var kodluAlanlar = new WeakMap();
  function copy(v) { return v === undefined ? undefined : JSON.parse(JSON.stringify(v)); }
  function plain(v) { return v && typeof v === 'object' && !Array.isArray(v); }
  function fail() { throw new Error('yerel-zarf-kodlamasi-gecersiz'); }

  // Group records by object shape. A column's repeated value is stored once;
  // a bit mask identifies the values differing from that default in each row.
  // All JSON values and property names are retained exactly. No hash is used.
  function rowsEncode(records, metaEncode) {
    var groups = Object.create(null);
    Object.keys(records || {}).sort().forEach(function (id) {
      var r = records[id], shape = r.d ? false : plain(r.v) ? Object.keys(r.v).sort() : null;
      // Large/arbitrary objects use the generic value form; bit masks stay exact.
      if (Array.isArray(shape) && shape.length > 24) shape = null;
      var key = JSON.stringify(shape);
      var g = groups[key] || (groups[key] = { shape: shape, rows: [] });
      var values = [metaEncode(r.m === undefined ? 0 : r.m)];
      if (shape === false) values.push(r.d);
      else if (shape === null) values.push(copy(r.v));
      else shape.forEach(function (k) { values.push(copy(r.v[k])); });
      g.rows.push([id, values]);
    });
    return Object.keys(groups).sort().map(function (key) {
      var g = groups[key], n = g.rows[0][1].length, defaults = [];
      for (var col = 0; col < n; col++) {
        var counts = Object.create(null), best = null, bestCount = 0;
        g.rows.forEach(function (r) {
          var s = M.kararliJson(r[1][col]);
          var count = (counts[s] || 0) + 1; counts[s] = count;
          if (count > bestCount) { bestCount = count; best = copy(r[1][col]); }
        });
        defaults.push(best);
      }
      var defaultStrings = defaults.map(M.kararliJson);
      var rows = g.rows.map(function (r) {
        var mask = 0, changed = [];
        r[1].forEach(function (value, i) {
          if (M.kararliJson(value) === defaultStrings[i]) return;
          mask |= (1 << i); changed.push(value);
        });
        return mask ? [r[0], mask].concat(changed) : r[0];
      });
      return [g.shape, defaults, rows];
    });
  }

  function rowsDecode(groups, metaDecode) {
    if (!Array.isArray(groups)) fail();
    var records = Object.create(null);
    groups.forEach(function (g) {
      if (!Array.isArray(g) || g.length !== 3 || !Array.isArray(g[1]) || !Array.isArray(g[2])) fail();
      var shape = g[0], defaults = g[1];
      if (shape !== null && shape !== false && (!Array.isArray(shape) || shape.length > 24 ||
          shape.some(function (k) { return typeof k !== 'string'; }))) fail();
      var n = Array.isArray(shape) ? shape.length + 1 : 2;
      if (defaults.length !== n) fail();
      g[2].forEach(function (row) {
        var id, values = copy(defaults);
        if (typeof row === 'string') id = row;
        else {
          if (!Array.isArray(row) || row.length < 3 || typeof row[0] !== 'string' ||
              !Number.isInteger(row[1]) || row[1] < 1 || row[1] >= Math.pow(2, n)) fail();
          id = row[0]; var pos = 2;
          for (var i = 0; i < n; i++) if (row[1] & (1 << i)) values[i] = copy(row[pos++]);
          if (pos !== row.length) fail();
        }
        if (own.call(records, id)) fail();
        var r = { m: metaDecode(values[0]) };
        if (shape === false) { if (!values[1]) fail(); r.d = values[1]; }
        else if (shape === null) r.v = values[1];
        else {
          r.v = Object.create(null);
          shape.forEach(function (k, i) { r.v[k] = values[i + 1]; });
        }
        records[id] = r;
      });
    });
    return records;
  }

  function encode(zarf, degismezAlanlar) {
    if (!zarf || zarf.surum !== 2 || !plain(zarf.alanlar)) fail();
    var actors = [], base = null, alanAktorleri = Object.create(null);
    function split(m) {
      if (typeof m !== 'string') return null;
      var p = m.indexOf(':'), text = m.slice(0, p), time = Number(text);
      if (p < 1 || !Number.isSafeInteger(time) || String(time) !== text) return null;
      return { t: time, a: m.slice(p + 1) };
    }
    Object.keys(zarf.alanlar).forEach(function (key) {
      var f = zarf.alanlar[key], kullanilan = Object.create(null);
      Object.keys(f.i || {}).forEach(function (id) {
        var s = split(f.i[id].m);
        if (!s) return;
        kullanilan[s.a] = true;
        if (base === null || s.t < base) base = s.t;
        if (actors.indexOf(s.a) === -1) actors.push(s.a);
      });
      alanAktorleri[key] = Object.keys(kullanilan).sort();
    });
    function meta(m) {
      var s = split(m);
      if (s) {
        var index = actors.indexOf(s.a), delta = s.t - base;
        if (Number.isSafeInteger(delta)) return index === 0 ? delta : [delta, index];
      }
      return ['raw', copy(m)];
    }
    return { k: 1, a: actors, t: base, f: Object.keys(zarf.alanlar).sort().map(function (key) {
      var field = zarf.alanlar[key], kullanilan = alanAktorleri[key];
      var signature = JSON.stringify([kullanilan.length ? base : null, kullanilan.map(function (a) {
        return [a, actors.indexOf(a)];
      })]);
      var cached = degismezAlanlar ? kodluAlanlar.get(field) : null;
      if (!cached || cached.signature !== signature) {
        cached = { signature: signature, rows: rowsEncode(field.i || {}, meta) };
        if (degismezAlanlar) kodluAlanlar.set(field, cached);
      }
      var row = [key, cached.rows];
      if (own.call(field, 'r')) row.push(copy(field.r));
      return row;
    }) };
  }

  function decode(encoded) {
    if (!encoded || encoded.k !== 1 || !Array.isArray(encoded.a) || !Array.isArray(encoded.f) ||
        encoded.a.some(function (a) { return typeof a !== 'string'; }) ||
        (encoded.t !== null && !Number.isSafeInteger(encoded.t))) fail();
    function meta(v) {
      if (Array.isArray(v) && v.length === 2 && v[0] === 'raw') return copy(v[1]);
      var delta = Array.isArray(v) ? v[0] : v, index = Array.isArray(v) ? v[1] : 0;
      if ((Array.isArray(v) && v.length !== 2) || !Number.isSafeInteger(delta) ||
          !Number.isInteger(index) || index < 0 || index >= encoded.a.length ||
          encoded.t === null || !Number.isSafeInteger(encoded.t + delta)) fail();
      return String(encoded.t + delta) + ':' + encoded.a[index];
    }
    var zarf = { surum: 2, alanlar: Object.create(null) };
    encoded.f.forEach(function (f) {
      if (!Array.isArray(f) || (f.length !== 2 && f.length !== 3) || typeof f[0] !== 'string' ||
          own.call(zarf.alanlar, f[0])) fail();
      var field = { i: rowsDecode(f[1], meta) };
      if (f.length === 3) field.r = copy(f[2]);
      zarf.alanlar[f[0]] = field;
    });
    return zarf;
  }

  // Plain packets use the same lossless shape codec without normalization:
  // migration snapshots must retain old aliases and arbitrary object keys.
  function packetEncode(packet) {
    var plainValues = Object.create(null), maps = Object.create(null);
    Object.keys(packet || {}).forEach(function (key) {
      var value = packet[key];
      if (M.TIPLER[key] === 'nesne' && plain(value)) {
        var records = Object.create(null);
        Object.keys(value).forEach(function (id) { records[id] = { m: 0, v: value[id] }; });
        maps[key] = rowsEncode(records, function (m) { return m; });
      } else plainValues[key] = copy(value);
    });
    return { k: 1, d: plainValues, o: maps };
  }
  function packetDecode(encoded) {
    if (!encoded || encoded.k !== 1 || !plain(encoded.d) || !plain(encoded.o)) fail();
    var packet = Object.create(null);
    Object.keys(encoded.d).forEach(function (key) { packet[key] = copy(encoded.d[key]); });
    Object.keys(encoded.o).forEach(function (key) {
      if (own.call(packet, key)) fail();
      var records = rowsDecode(encoded.o[key], function (m) { return m; }), values = Object.create(null);
      Object.keys(records).forEach(function (id) { values[id] = records[id].v; });
      packet[key] = values;
    });
    return packet;
  }
  // Fixed-width LZW over UTF-8 bytes; 16-bit codes are packed into safe 15-bit
  // UTF-16 characters. This is synchronous and lossless, unlike fingerprints.
  // Dictionary reset bounds memory; an explicit end code detects truncation.
  function pack(text) {
    var bytes = new TextEncoder().encode(text), dictionary = new Map(), next = 258;
    var out = [], bits = 0, count = 0;
    function put(code) {
      bits = (bits << 16) | code; count += 16;
      while (count >= 15) {
        count -= 15; out.push(String.fromCharCode(((bits >>> count) & 32767) + 32));
      }
      bits &= (1 << count) - 1;
    }
    function code(w) { return w.length === 1 ? w.charCodeAt(0) : dictionary.get(w); }
    var w = '';
    for (var i = 0; i < bytes.length; i++) {
      var c = String.fromCharCode(bytes[i]), both = w + c;
      if (!w || dictionary.has(both)) { w = both; continue; }
      put(code(w));
      if (next < 65536) dictionary.set(both, next++);
      else { put(256); dictionary.clear(); next = 258; }
      w = c;
    }
    if (w) put(code(w));
    put(257);
    if (count) out.push(String.fromCharCode((bits << (15 - count)) + 32));
    return out.join('');
  }
  function unpack(text) {
    if (typeof text !== 'string') fail();
    var dictionary = [], next = 258, pos = 0, bits = 0, count = 0, chunks = [], size = 0, w = '';
    function take() {
      while (count < 16) {
        if (pos >= text.length) fail();
        var value = text.charCodeAt(pos++) - 32;
        if (value < 0 || value > 32767) fail();
        bits = (bits << 15) | value; count += 15;
      }
      count -= 16;
      var code = (bits >>> count) & 65535;
      bits &= (1 << count) - 1;
      return code;
    }
    for (;;) {
      var c = take();
      if (c === 257) {
        if (pos !== text.length || bits !== 0) fail();
        break;
      }
      if (c === 256) { dictionary = []; next = 258; w = ''; continue; }
      var entry = c < 256 ? String.fromCharCode(c) : dictionary[c];
      if (entry === undefined && c === next && w) entry = w + w[0];
      if (entry === undefined) fail();
      chunks.push(entry); size += entry.length;
      if (size > 32 * 1024 * 1024) fail();
      if (w && next < 65536) dictionary[next++] = w + entry[0];
      w = entry;
    }
    var bytes = new Uint8Array(size), offset = 0;
    chunks.forEach(function (chunk) {
      for (var i = 0; i < chunk.length; i++) bytes[offset++] = chunk.charCodeAt(i);
    });
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  }
  function compressed(value) { return { k: 2, b: pack(JSON.stringify(value)) }; }
  function expanded(value) { return value && value.k === 2 ? JSON.parse(unpack(value.b)) : value; }
  window.YDS.YerelZarfKodlama = {
    kodla: function (v, degismezAlanlar) { return compressed(encode(v, degismezAlanlar)); },
    coz: function (v) { return decode(expanded(v)); },
    paketKodla: function (v) { return compressed(packetEncode(v)); },
    paketCoz: function (v) { return packetDecode(expanded(v)); }
  };
})();


/* ============================================================
   Eşitleme deposu — localStorage ile saf veri motoru arasındaki köprü

   Eski yds-* anahtarları uygulamanın okuma biçimi olarak korunur. Asıl
   eşitleme zarfı tek localStorage yazımıyla güncellenir; diğer sekmeler bu
   zarfı birleştirip klasik anahtarları otomatik olarak yeniler.
   ============================================================ */

(function () {
  'use strict';

  if (!window.YDS || !window.YDS.Depo || !window.YDS.EsitlemeMotoru) return;

  var Depo = window.YDS.Depo;
  var M = window.YDS.EsitlemeMotoru;
  var TIPLER = M.TIPLER;
  var ZARF_ANAHTARI = 'yds-esitleme-yerel-v3';
  var ESKI_ZARF_ANAHTARI = 'yds-esitleme-v2';
  var L = window.YDS.YerelZarfKodlama;
  var GECIS_YEDEGI = 'yds-esitleme-gecis-yedegi';
  var ALIAS_GECIS_YEDEGI = 'yds-kelime-alias-gecis-yedegi';
  var SON_AYNA_ANAHTARI = 'yds-esitleme-son-ayna-v1';
  var hamOku = Depo.oku;
  var hamYaz = Depo.yaz;
  var hamSil = Depo.sil;
  var sonKodlananZarf = null, sonKodlama = null;
  var sonCozulenImza = null, sonCozum = null, sonDiskImza = null;
  var sonPaketZarfi = null, sonPaket = null;

  function paketOku(zarf) {
    if (sonPaketZarfi !== zarf) {
      var oncekiZarf = sonPaketZarfi, oncekiPaket = sonPaket;
      sonPaketZarfi = zarf;
      sonPaket = {};
      Object.keys(zarf.alanlar).forEach(function (key) {
        if (oncekiZarf && oncekiZarf.alanlar[key] === zarf.alanlar[key]) {
          if (Object.prototype.hasOwnProperty.call(oncekiPaket, key)) sonPaket[key] = oncekiPaket[key];
        } else {
          var tek = { surum: M.SURUM, alanlar: {} };
          tek.alanlar[key] = zarf.alanlar[key];
          var p = M.paket(tek);
          if (Object.prototype.hasOwnProperty.call(p, key)) sonPaket[key] = p[key];
        }
      });
    }
    return sonPaket;
  }

  // The merge engine operates on one independent field at a time. Preserve
  // untouched immutable field references instead of cloning every card for a
  // scalar preference change. Cloud merges still use the complete v2 engine.
  function alaniDegistir(zarf, anahtar, islem) {
    var tek = { surum: M.SURUM, alanlar: {} };
    if (zarf.alanlar[anahtar]) tek.alanlar[anahtar] = zarf.alanlar[anahtar];
    var yeni = islem(tek), sonuc = { surum: M.SURUM, alanlar: {} };
    Object.keys(zarf.alanlar).forEach(function (key) { sonuc.alanlar[key] = zarf.alanlar[key]; });
    if (yeni.alanlar[anahtar]) sonuc.alanlar[anahtar] = yeni.alanlar[anahtar];
    else delete sonuc.alanlar[anahtar];
    return sonuc;
  }

  function kopyala(v) {
    if (v === undefined) return undefined;
    return JSON.parse(JSON.stringify(v));
  }

  function esitMi(a, b) {
    if (a === undefined || b === undefined) return a === b;
    return M.kararliJson(a) === M.kararliJson(b);
  }

  function aktorKimligi() {
    try {
      var sayilar = new Uint32Array(2);
      window.crypto.getRandomValues(sayilar);
      return sayilar[0].toString(36) + sayilar[1].toString(36);
    } catch (e) {
      return Math.random().toString(36).slice(2, 12);
    }
  }

  var aktor = aktorKimligi();
  var mantikSaat = Date.now();

  function saatiGozle(zarf) {
    Object.keys((zarf && zarf.alanlar) || {}).forEach(function (anahtar) {
      var alan = zarf.alanlar[anahtar] || {};
      var metalar = alan.r ? [alan.r] : [];
      Object.keys(alan.i || {}).forEach(function (id) { metalar.push(alan.i[id].m); });
      metalar.forEach(function (m) {
        var z = parseInt(String(m || 0).split(':')[0], 10) || 0;
        if (z > mantikSaat) mantikSaat = z;
      });
    });
  }

  function yeniMeta() {
    mantikSaat = Math.max(Date.now(), mantikSaat + 1);
    return String(mantikSaat) + ':' + aktor;
  }

  function hamPaket() {
    var paket = {};
    Object.keys(TIPLER).forEach(function (anahtar) {
      var v = hamOku(anahtar, undefined);
      if (v !== undefined) paket[anahtar] = v;
    });
    return paket;
  }

  function eskiAliasKayitlari(zarf) {
    var bulunan = {};
    ['yds-leitner', 'yds-test-yanlis'].forEach(function (anahtar) {
      var alan = zarf && zarf.alanlar && zarf.alanlar[anahtar];
      Object.keys((alan && alan.i) || {}).forEach(function (id) {
        var yeniId = M.eskiIlerlemeKimligi
          ? M.eskiIlerlemeKimligi(id) : M.kelimeKimligi(id);
        if (yeniId === id) return;
        if (!bulunan[anahtar]) bulunan[anahtar] = {};
        bulunan[anahtar][id] = kopyala(alan.i[id]);
      });
    });
    return bulunan;
  }

  function kayitHaritasi(anahtar, deger) {
    var paket = {};
    paket[anahtar] = deger;
    var alan = M.zarfaCevir(paket).alanlar[anahtar];
    var sonuc = Object.create(null);
    Object.keys((alan && alan.i) || {}).forEach(function (id) { sonuc[id] = alan.i[id].v; });
    return sonuc;
  }

  function gecerliAynaYedegi(deger) {
    return deger && deger.surum === 1 && deger.veri &&
      typeof deger.veri === 'object' && !Array.isArray(deger.veri)
      ? deger.veri : null;
  }

  /* Eski sürümden açık kalmış bir sekme yalnız klasik yds-* anahtarlarını
     yazabilir. Son aynanın ham paketi, bir sonraki açılışta oldValue görevi
     görür: sadece gerçekten eklenen/değişen kayıtları yeni zarfa taşırız;
     eski sekmenin eksik tam nesnesini silme komutu saymayız. */
  function baslangictaUzlastir(zarf, klasikPaket, aynaPaket) {
    var mevcutPaket = M.paket(zarf);
    var aday = zarf;
    var kanitliFark = !!aynaPaket && !esitMi(aynaPaket, klasikPaket);
    var duzAyarlar = {
      'yds-gunluk-yeni': 1,
      'yds-gunluk-tavan': 1,
      'yds-katmanlar': 1,
      'yds-eksen': 1
    };

    // Son ayna yoksa (bu sürümün ilk açılışı) yalnız anlamsal olarak daha
    // ileri olan kayıtları birleştiririz. Böylece tombstone/reset kayıtları
    // belirsiz eski bir klasik kopya yüzünden dirilmez.
    var semantikPaket = aynaPaket ? null : M.paket(M.birlestir(
      M.zarfaCevir(mevcutPaket), M.zarfaCevir(klasikPaket)));

    Object.keys(TIPLER).forEach(function (anahtar) {
      if (!Object.prototype.hasOwnProperty.call(klasikPaket, anahtar)) return;

      if (duzAyarlar[anahtar]) {
        if (!kanitliFark || esitMi((aynaPaket || {})[anahtar], klasikPaket[anahtar]) ||
            esitMi(mevcutPaket[anahtar], klasikPaket[anahtar])) return;
        var tek = { $: klasikPaket[anahtar] };
        aday = M.kayitlariYaz(aday, anahtar, tek, yeniMeta);
        mevcutPaket[anahtar] = kopyala(klasikPaket[anahtar]);
        return;
      }

      var tabanKayitlari = kayitHaritasi(anahtar,
        aynaPaket && aynaPaket[anahtar]);
      var klasikKayitlar = kayitHaritasi(anahtar, klasikPaket[anahtar]);
      var mevcutKayitlar = kayitHaritasi(anahtar, mevcutPaket[anahtar]);
      var hedefKayitlar = aynaPaket ? klasikKayitlar
        : kayitHaritasi(anahtar, semantikPaket[anahtar]);
      var yazilacak = Object.create(null);

      Object.keys(hedefKayitlar).forEach(function (id) {
        if (aynaPaket) {
          // Ayna tabanına göre değişmeyen kayıt eski sekmenin stale tam
          // nesnesidir; yeni zarfın daha güncel sürümünü koru.
          if (tabanKayitlari[id] !== undefined &&
              esitMi(tabanKayitlari[id], klasikKayitlar[id])) return;
        } else {
          var alan = zarf.alanlar && zarf.alanlar[anahtar];
          var hamKayit = alan && alan.i && alan.i[id];
          if ((hamKayit && hamKayit.d) || (alan && alan.r && !hamKayit)) return;
        }
        if (mevcutKayitlar[id] === undefined ||
            !esitMi(mevcutKayitlar[id], hedefKayitlar[id])) {
          yazilacak[id] = hedefKayitlar[id];
        }
      });

      if (Object.keys(yazilacak).length) {
        aday = M.kayitlariYaz(aday, anahtar, yazilacak, yeniMeta);
      }
    });
    return aday;
  }

  function hataBildir(anahtar) {
    if (window.YDS.depolamaUyarisi) window.YDS.depolamaUyarisi(anahtar);
    if (typeof window.CustomEvent === 'function') {
      window.dispatchEvent(new CustomEvent('yds-depo-hata', { detail: { anahtar: anahtar } }));
    }
  }

  var YARDIMCI_YEDEKLER = [GECIS_YEDEGI, ALIAS_GECIS_YEDEGI, 'yds-son-yedek'];
  function yardimciCoz(raw) {
    return raw && raw.__ydsKisaYedek === 1 ? L.paketCoz(raw.p) : raw;
  }
  function yardimciOku(key, varsayilan) {
    var raw = hamOku(key, varsayilan);
    try { return yardimciCoz(raw); }
    catch (hata) { hataBildir(key); return varsayilan; }
  }
  function yardimciKodla(key, value) {
    if (YARDIMCI_YEDEKLER.indexOf(key) < 0 || !value || typeof value !== 'object') return value;
    var ham = JSON.stringify(value);
    if (ham.length < 1024) return value;
    var compact = { __ydsKisaYedek: 1, p: L.paketKodla(value) };
    if (!esitMi(L.paketCoz(compact.p), value)) throw new Error('yedek-kodlama-dogrulanamadi');
    return JSON.stringify(compact).length < ham.length ? compact : value;
  }

  function yerelHamOku(key) {
    var yok = {}, value = hamOku(key, yok);
    if (value !== yok) return value;
    try {
      if (window.localStorage && window.localStorage.getItem(key) !== null) return null;
    } catch (hata) { return null; }
    return undefined;
  }

  function yerelCoz(raw) {
    if (!raw || raw.surum !== 3 || !raw.z) throw new Error('yerel-zarf-gecersiz');
    var imza = JSON.stringify(raw);
    if (imza === sonCozulenImza) return sonCozum;
    var zarf = L.coz(raw.z);
    var paket = M.paket(zarf);
    var ayna = Object.prototype.hasOwnProperty.call(raw, 'b')
      ? (raw.b.k === 3 ? aynaFarkiniUygula(paket, L.paketCoz(raw.b.f)) : L.paketCoz(raw.b))
      : paket;
    sonCozulenImza = imza;
    sonCozum = { zarf: zarf, ayna: ayna };
    return sonCozum;
  }

  function yerelYaz(zarf, taban) {
    if (sonKodlananZarf !== zarf) {
      sonKodlananZarf = zarf;
      sonKodlama = L.kodla(zarf, true);
    }
    var raw = { surum: 3, z: sonKodlama };
    if (taban !== undefined) raw.b = { k: 3, f: L.paketKodla(aynaFarki(paketOku(zarf), taban)) };
    if (hamYaz(ZARF_ANAHTARI, raw) === false || !esitMi(hamOku(ZARF_ANAHTARI, null), raw)) {
      hataBildir(ZARF_ANAHTARI); return false;
    }
    sonDiskImza = JSON.stringify(raw);
    sonCozulenImza = sonDiskImza;
    sonCozum = { zarf: zarf, ayna: taban === undefined ? paketOku(zarf) : taban };
    return true;
  }

  // The previous mirror normally differs in one card or setting. Persist an
  // exact inverse patch rather than recompressing every unchanged record.
  function aynaFarki(paket, taban) {
    var fark = { s: [], d: Object.create(null), o: Object.create(null) };
    Object.keys(TIPLER).forEach(function (key) {
      var varMi = Object.prototype.hasOwnProperty.call(paket, key);
      var onceVardi = Object.prototype.hasOwnProperty.call(taban, key);
      if (!onceVardi) { if (varMi) fark.s.push(key); return; }
      var yeni = paket[key], eski = taban[key];
      if (varMi && yeni === eski) return;
      if (varMi && TIPLER[key] === 'nesne' && yeni && eski &&
          typeof yeni === 'object' && typeof eski === 'object' && !Array.isArray(yeni) && !Array.isArray(eski)) {
        var sil = [], yaz = Object.create(null);
        Object.keys(yeni).forEach(function (id) {
          if (!Object.prototype.hasOwnProperty.call(eski, id)) sil.push(id);
        });
        Object.keys(eski).forEach(function (id) {
          if (!Object.prototype.hasOwnProperty.call(yeni, id) || !esitMi(yeni[id], eski[id])) yaz[id] = eski[id];
        });
        if (sil.length || Object.keys(yaz).length) fark.o[key] = { s: sil, d: yaz };
      } else if (!varMi || !esitMi(yeni, eski)) fark.d[key] = eski;
    });
    return fark;
  }

  function aynaFarkiniUygula(paket, fark) {
    if (!fark || !Array.isArray(fark.s) || !fark.d || !fark.o) throw new Error('ayna-farki-gecersiz');
    if (fark.s.concat(Object.keys(fark.d), Object.keys(fark.o)).some(function (key) {
      return !Object.prototype.hasOwnProperty.call(TIPLER, key);
    })) throw new Error('ayna-farki-alani-gecersiz');
    var sonuc = kopyala(paket);
    fark.s.forEach(function (key) { delete sonuc[key]; });
    Object.keys(fark.d).forEach(function (key) {
      Object.defineProperty(sonuc, key, { value: kopyala(fark.d[key]), enumerable: true, writable: true, configurable: true });
    });
    Object.keys(fark.o).forEach(function (key) {
      var degisim = fark.o[key], alan = sonuc[key];
      if (!alan || !Array.isArray(degisim.s) || !degisim.d) throw new Error('ayna-farki-gecersiz');
      degisim.s.forEach(function (id) { delete alan[id]; });
      Object.keys(degisim.d).forEach(function (id) {
        Object.defineProperty(alan, id, { value: kopyala(degisim.d[id]), enumerable: true, writable: true, configurable: true });
      });
    });
    return sonuc;
  }

  // A malformed new-format record is never overwritten using a potentially
  // incomplete legacy mirror. The persisted record remains available to export.
  var yeniHam = yerelHamOku(ZARF_ANAHTARI), yeniYerel = null, bozukYerel = false;
  if (yeniHam !== undefined) {
    try { yeniYerel = yerelCoz(yeniHam); }
    catch (hata) { bozukYerel = true; hataBildir(ZARF_ANAHTARI); }
  }
  var baslangicKlasikPaket = hamPaket();
  var eskiHam = hamOku(ESKI_ZARF_ANAHTARI, null), eskiYerel = null;
  if (eskiHam && eskiHam.surum === 3) {
    try { eskiYerel = yerelCoz(eskiHam); }
    catch (hata) { bozukYerel = true; hataBildir(ESKI_ZARF_ANAHTARI); }
  }
  var eskiZarf = eskiYerel ? eskiYerel.zarf : eskiHam;
  var eskiGecerli = eskiZarf && eskiZarf.surum === M.SURUM && eskiZarf.alanlar;
  var durum = yeniYerel ? yeniYerel.zarf : eskiGecerli ? eskiZarf : M.zarfaCevir(baslangicKlasikPaket);
  var zarfKalici = !!yeniYerel || !!eskiGecerli;
  var sonAynaPaket = yeniYerel ? yeniYerel.ayna : eskiYerel ? eskiYerel.ayna :
    gecerliAynaYedegi(hamOku(SON_AYNA_ANAHTARI, null));
  var baslangicAdayi = M.birlestir(durum, eskiGecerli ? eskiZarf : { surum: M.SURUM, alanlar: {} });
  saatiGozle(baslangicAdayi);
  // With no existing envelope, classics are the migration source, not a new
  // edit. Reconciliation would normalize legacy fields (for example u=t) and
  // incorrectly give them today's clock, defeating a historical cloud reset.
  if (yeniYerel || eskiGecerli) {
    baslangicAdayi = baslangictaUzlastir(baslangicAdayi, baslangicKlasikPaket, sonAynaPaket);
  } else {
    // Preserve legacy field normalization (u=t etc.) at its original zero
    // metadata clock, so a real historical cloud reset can still supersede it.
    baslangicAdayi = M.birlestir(baslangicAdayi, baslangicAdayi);
  }

  function yedekTekrariMi(paket, mevcut) {
    // Delete only records provably still present, not unique historical/reset data.
    var a = M.paket(M.zarfaCevir(paket)), b = M.paket(M.zarfaCevir(mevcut));
    return Object.keys(a).every(function (key) {
      var old = kayitHaritasi(key, a[key]), current = kayitHaritasi(key, b[key]);
      return Object.keys(old).every(function (id) {
        return current[id] !== undefined && esitMi(old[id], current[id]);
      });
    });
  }

  function bitenGocuTemizle(paket, okunanEski) {
    if (esitMi(hamOku(ESKI_ZARF_ANAHTARI, null), okunanEski)) hamSil(ESKI_ZARF_ANAHTARI);
    hamSil(SON_AYNA_ANAHTARI);
    var y = yardimciOku(GECIS_YEDEGI, null);
    if (y && y.veri && yedekTekrariMi(y.veri, paket)) hamSil(GECIS_YEDEGI);
    var a = yardimciOku(ALIAS_GECIS_YEDEGI, null);
    if (a && a.alanlar) {
      var p = M.paket({ surum: M.SURUM, alanlar: a.alanlar });
      if (yedekTekrariMi(p, paket)) hamSil(ALIAS_GECIS_YEDEGI);
    }
  }

  function bildir(anahtarlar, kaynak) {
    if (!anahtarlar.length || typeof window.CustomEvent !== 'function') return;
    window.dispatchEvent(new CustomEvent('yds-depo-degisti', {
      detail: { anahtarlar: anahtarlar, kaynak: kaynak || 'yerel' }
    }));
  }

  function aynala(paket, oncekiPaket, hepsiniDogrula) {
    var degisen = [];
    var basarili = true;
    Object.keys(TIPLER).forEach(function (anahtar) {
      var varMi = Object.prototype.hasOwnProperty.call(paket, anahtar);
      var onceVardi = Object.prototype.hasOwnProperty.call(oncekiPaket || {}, anahtar);
      if (hepsiniDogrula === false && varMi === onceVardi &&
          (!varMi || paket[anahtar] === oncekiPaket[anahtar])) return;
      if (varMi) {
        if (!esitMi(hamOku(anahtar, undefined), paket[anahtar]) &&
            hamYaz(anahtar, paket[anahtar]) === false) basarili = false;
      } else if (hamOku(anahtar, undefined) !== undefined) {
        if (hamSil(anahtar) === false) basarili = false;
      }
      if (varMi !== onceVardi || (varMi && !esitMi(paket[anahtar], oncekiPaket[anahtar]))) degisen.push(anahtar);
    });
    return { degisen: degisen, basarili: basarili };
  }

  function kaydet(zarf, kaynak, dokunulanlar) {
    if (bozukYerel) { hataBildir(ZARF_ANAHTARI); return { basarili: false, degisti: false, anahtarlar: [] }; }
    var oncekiZarf = durum, oncekiPaket = paketOku(durum);
    // Every caller supplies an envelope returned by the pure merge engine.
    // It is already normalized; cloning all records again adds no safety.
    var aday = zarf;
    var raw = yerelHamOku(ZARF_ANAHTARI), disk = null;
    if (raw !== undefined) {
      try { disk = yerelCoz(raw); }
      catch (hata) {
        bozukYerel = true; hataBildir(ZARF_ANAHTARI);
        return { basarili: false, degisti: false, anahtarlar: [] };
      }
      // guncelZarf already merged this exact disk revision into the candidate's
      // base. Merge only a revision that appeared while the candidate was built.
      if (JSON.stringify(raw) !== sonDiskImza) aday = M.birlestir(aday, disk.zarf);
    }
    var legacy = hamOku(ESKI_ZARF_ANAHTARI, null);
    if (legacy && legacy.surum === M.SURUM && legacy.alanlar) aday = M.birlestir(aday, legacy);
    else if (legacy && legacy.surum === 3) {
      try { aday = M.birlestir(aday, yerelCoz(legacy).zarf); }
      catch (hata) { hataBildir(ESKI_ZARF_ANAHTARI); return { basarili: false, degisti: false, anahtarlar: [] }; }
    }

    // A storage event already persisted by another tab is not a new write.
    // Without this guard, each tab would emit pending+final records forever.
    var adayPaket = paketOku(aday);
    var yinelenebilir = kaynak === 'sekme' || kaynak === 'gecis' || kaynak === 'bulut' ||
      (disk && disk.zarf === aday);
    if (disk && yinelenebilir && esitMi(disk.zarf, aday) && esitMi(hamPaket(), adayPaket)) {
      durum = aday; zarfKalici = true; saatiGozle(durum);
      if (Object.prototype.hasOwnProperty.call(raw, 'b')) {
        if (!yerelYaz(durum)) return { basarili: true, aynaBasarili: false, degisti: false, anahtarlar: [] };
      }
      sonAynaPaket = adayPaket;
      bitenGocuTemizle(adayPaket, legacy);
      var degisen = Object.keys(TIPLER).filter(function (key) {
        return !esitMi(oncekiZarf.alanlar[key], aday.alanlar[key]);
      });
      bildir(degisen, kaynak);
      return { basarili: true, aynaBasarili: true, degisti: !!degisen.length, anahtarlar: degisen };
    }

    // Preserve the last fully mirrored state DURING the transaction. If the
    // tab closes midway, boot reconciliation can distinguish an unmirrored
    // field from an actual write by an old tab. Normal steady state stores no
    // redundant mirror: it is exactly the committed envelope's plain packet.
    var taban = disk ? disk.ayna : sonAynaPaket || hamPaket();
    if (!yerelYaz(aday, taban)) return { basarili: false, degisti: false, anahtarlar: [] };
    durum = aday; zarfKalici = true; saatiGozle(durum);
    var paket = adayPaket, aynaSonucu = aynala(paket, oncekiPaket, !!(raw && raw.b));
    if (aynaSonucu.basarili) {
      if (yerelYaz(durum)) {
        sonAynaPaket = paket;
        bitenGocuTemizle(paket, legacy);
      } else aynaSonucu.basarili = false;
    } else hataBildir('klasik-ayna');

    var kume = Object.create(null);
    aynaSonucu.degisen.concat(dokunulanlar || []).forEach(function (a) { if (TIPLER[a]) kume[a] = 1; });
    Object.keys(TIPLER).forEach(function (a) {
      if (!esitMi(oncekiZarf.alanlar[a], durum.alanlar[a])) kume[a] = 1;
    });
    var liste = Object.keys(kume);
    bildir(liste, kaynak);
    return { basarili: true, aynaBasarili: aynaSonucu.basarili, degisti: !!liste.length, anahtarlar: liste };
  }

  // The first new-format commit is verified before legacy records are consumed.
  // A quota failure leaves the old envelope and all classical keys untouched.
  if (!bozukYerel) {
    // Before quota-sensitive bootstrap, discard only auxiliary bytes that are
    // provably exact copies of the still-durable legacy envelope and classics.
    if (!yeniYerel && eskiGecerli &&
        esitMi(M.paket(eskiZarf), baslangicKlasikPaket)) {
      var eskiAyna = gecerliAynaYedegi(hamOku(SON_AYNA_ANAHTARI, null));
      if (eskiAyna && esitMi(eskiAyna, baslangicKlasikPaket)) hamSil(SON_AYNA_ANAHTARI);
      var eskiYedek = yardimciOku(GECIS_YEDEGI, null);
      if (eskiYedek && eskiYedek.veri && yedekTekrariMi(eskiYedek.veri, baslangicKlasikPaket)) hamSil(GECIS_YEDEGI);
    }
    // Shrink recovery snapshots in place, preserving their complete contents.
    // No user reset/import snapshot is deleted to make room for migration.
    YARDIMCI_YEDEKLER.forEach(function (key) {
      var old = hamOku(key, null);
      if (!old || old.__ydsKisaYedek === 1) return;
      var compact = yardimciKodla(key, old);
      if (!esitMi(compact, old)) hamYaz(key, compact);
    });

    if (!yeniYerel && eskiGecerli && !eskiYerel) {
      // Under a strict quota old+new full envelopes cannot coexist. Replace
      // the old key atomically with a readable compact bootstrap, verify it,
      // then create the new key. Boot understands this intermediate state.
      var bootstrap = { surum: 3, z: L.kodla(eskiZarf) };
      if (sonAynaPaket && !esitMi(sonAynaPaket, M.paket(eskiZarf))) bootstrap.b = L.paketKodla(sonAynaPaket);
      if (hamYaz(ESKI_ZARF_ANAHTARI, bootstrap) !== false &&
          esitMi(hamOku(ESKI_ZARF_ANAHTARI, null), bootstrap)) {
        hamSil(SON_AYNA_ANAHTARI);
        eskiYerel = yerelCoz(bootstrap);
      }
    }
    kaydet(baslangicAdayi, 'gecis', []);
  }

  function guncelZarf() {
    var onceki = durum;
    var raw = yerelHamOku(ZARF_ANAHTARI);
    if (raw !== undefined && !bozukYerel) {
      try {
        var imza = JSON.stringify(raw);
        if (imza !== sonDiskImza) {
          durum = M.birlestir(durum, yerelCoz(raw).zarf);
          sonDiskImza = imza;
        }
      }
      catch (hata) { bozukYerel = true; hataBildir(ZARF_ANAHTARI); }
    }
    var legacy = hamOku(ESKI_ZARF_ANAHTARI, null);
    if (legacy && legacy.surum === M.SURUM && legacy.alanlar) durum = M.birlestir(durum, legacy);
    else if (legacy && legacy.surum === 3) {
      try { durum = M.birlestir(durum, yerelCoz(legacy).zarf); }
      catch (hata) { bozukYerel = true; hataBildir(ESKI_ZARF_ANAHTARI); }
    }
    if (onceki !== durum) saatiGozle(durum);
    return durum;
  }

  function veriOku(anahtar, varsayilan) {
    if (!TIPLER[anahtar]) return yardimciOku(anahtar, varsayilan);
    var paket = paketOku(guncelZarf());
    return Object.prototype.hasOwnProperty.call(paket, anahtar)
      ? kopyala(paket[anahtar]) : varsayilan;
  }

  function degeriUygula(zarf, anahtar, deger, eskiDeger) {
    var eski = kayitHaritasi(anahtar, eskiDeger);
    var yeni = kayitHaritasi(anahtar, deger);
    var yazilacak = Object.create(null);
    var silinecek = [];
    Object.keys(yeni).forEach(function (id) {
      if (eski[id] === undefined || !esitMi(eski[id], yeni[id])) yazilacak[id] = yeni[id];
    });
    Object.keys(eski).forEach(function (id) {
      if (yeni[id] === undefined) silinecek.push(id);
    });
    if (Object.keys(yazilacak).length) {
      zarf = alaniDegistir(zarf, anahtar, function (tek) { return M.kayitlariYaz(tek, anahtar, yazilacak, yeniMeta); });
    }
    if (silinecek.length) zarf = alaniDegistir(zarf, anahtar, function (tek) { return M.kayitlariSil(tek, anahtar, silinecek, yeniMeta); });
    if (!zarf.alanlar[anahtar]) {
      zarf = M.birlestir(zarf, { surum: M.SURUM, alanlar: {} });
      zarf.alanlar[anahtar] = { i: {} };
    }
    return zarf;
  }

  function veriYaz(anahtar, deger, kaynak) {
    if (!TIPLER[anahtar]) {
      var ok = hamYaz(anahtar, yardimciKodla(anahtar, deger)) !== false;
      if (!ok) hataBildir(anahtar);
      return ok;
    }
    var zarf = guncelZarf();
    var eskiPaket = paketOku(zarf);
    zarf = degeriUygula(zarf, anahtar, deger, eskiPaket[anahtar]);
    return kaydet(zarf, kaynak || 'yerel', [anahtar]).basarili;
  }

  function kayitlariYaz(anahtar, kayitlar, kaynak) {
    if (!TIPLER[anahtar]) return false;
    return kaydet(alaniDegistir(guncelZarf(), anahtar, function (tek) {
      return M.kayitlariYaz(tek, anahtar, kayitlar || {}, yeniMeta);
    }),
      kaynak || 'yerel', [anahtar]).basarili;
  }

  function kayitlariSil(anahtar, ids, kaynak) {
    if (!TIPLER[anahtar]) return false;
    return kaydet(alaniDegistir(guncelZarf(), anahtar, function (tek) {
      return M.kayitlariSil(tek, anahtar, ids || [], yeniMeta);
    }),
      kaynak || 'yerel', [anahtar]).basarili;
  }

  function veriSil(anahtar, kaynak) {
    if (!TIPLER[anahtar]) {
      var ok = hamSil(anahtar) !== false;
      if (!ok) hataBildir(anahtar);
      return ok;
    }
    return kaydet(alaniDegistir(guncelZarf(), anahtar, function (tek) {
      return M.anahtariSil(tek, anahtar, yeniMeta);
    }),
      kaynak || 'yerel', [anahtar]).basarili;
  }

  // Birden cok ilerleme alanini tek zarf yazimiyla uygular. Geri alma gibi
  // islemlerde bir alan yazilip digeri kalmasin diye tum farklar once aday
  // zarfta toplanir, ardindan tek kalici yazim yapilir.
  function paketYaz(paket, kaynak) {
    paket = paket && typeof paket === 'object' ? paket : {};
    var zarf = guncelZarf();
    var mevcut = paketOku(zarf);
    var dokunulanlar = [];
    Object.keys(TIPLER).forEach(function (anahtar) {
      if (!Object.prototype.hasOwnProperty.call(paket, anahtar)) return;
      zarf = degeriUygula(zarf, anahtar, paket[anahtar], mevcut[anahtar]);
      dokunulanlar.push(anahtar);
    });
    return kaydet(zarf, kaynak || 'yerel', dokunulanlar).basarili;
  }

  function anahtarlariSil(anahtarlar, kaynak) {
    var zarf = guncelZarf();
    var dokunulanlar = [];
    (anahtarlar || []).forEach(function (anahtar) {
      if (!TIPLER[anahtar] || dokunulanlar.indexOf(anahtar) !== -1) return;
      zarf = alaniDegistir(zarf, anahtar, function (tek) { return M.anahtariSil(tek, anahtar, yeniMeta); });
      dokunulanlar.push(anahtar);
    });
    if (!dokunulanlar.length) return true;
    return kaydet(zarf, kaynak || 'yerel', dokunulanlar).basarili;
  }

  function uygula(gelen, kaynak) {
    return kaydet(M.birlestir(guncelZarf(), M.zarfaCevir(gelen)), kaynak || 'bulut', []);
  }

  Depo.oku = veriOku;
  Depo.yaz = veriYaz;
  Depo.sil = veriSil;
  Depo.kayitlariYaz = kayitlariYaz;
  Depo.kayitlariSil = kayitlariSil;
  Depo.paketYaz = paketYaz;
  Depo.anahtarlariSil = anahtarlariSil;

  function depolamaDegisti(e) {
    if (!e || !e.key) return;
    if ((e.key === ZARF_ANAHTARI || e.key === ESKI_ZARF_ANAHTARI) && e.newValue) {
      var gelen;
      try {
        gelen = JSON.parse(e.newValue);
        if (e.key === ZARF_ANAHTARI || gelen.surum === 3) gelen = yerelCoz(gelen).zarf;
      } catch (hata) { hataBildir(e.key); return; }
      var birlesmis = M.birlestir(durum, gelen);
      kaydet(birlesmis, 'sekme', []);
      return;
    }
    if (!TIPLER[e.key]) return;
    var beklenen = M.paket(guncelZarf());
    var yeni;
    try { yeni = e.newValue === null ? undefined : JSON.parse(e.newValue); } catch (hata2) { return; }
    if (esitMi(beklenen[e.key], yeni)) return;

    // Güncelleme öncesinden açık kalan eski bir sekmenin klasik anahtara
    // yaptığı yazımı da kaybetmeden yeni zarfa taşı.
    var eski;
    try { eski = e.oldValue === null ? undefined : JSON.parse(e.oldValue); } catch (hata3) { eski = undefined; }
    if (yeni === undefined) {
      // Klasik anahtarı kaldıran eski sekmenin hangi yeni kayıtları hiç
      // görmediği bilinemez. Tüm alanı tombstone yapmak daha yeni sekmenin
      // ilerlemesini silebilir; güvenli zarfı kaynak kabul edip aynayı geri kur.
      aynala(beklenen, beklenen);
      return;
    }

    // Klasik anahtari yazan sekme eski bir tam nesneyle calisiyor olabilir.
    // oldValue -> newValue arasinda acikca eklenen/degisen kayitlari al; yeni
    // nesnede bulunmayan kimlikleri silme sayma. Boylece bu sekmede sonradan
    // eklenen kayitlar, eski sekmenin eksik anlik goruntusu yuzunden kaybolmaz.
    var eskiKayitlar = kayitHaritasi(e.key, eski);
    var yeniKayitlar = kayitHaritasi(e.key, yeni);
    var degisiklikler = Object.create(null);
    Object.keys(yeniKayitlar).forEach(function (id) {
      if (eskiKayitlar[id] === undefined || !esitMi(eskiKayitlar[id], yeniKayitlar[id])) {
        degisiklikler[id] = yeniKayitlar[id];
      }
    });
    if (Object.keys(degisiklikler).length) {
      if (!kayitlariYaz(e.key, degisiklikler, 'sekme')) aynala(beklenen, beklenen);
    } else aynala(beklenen, beklenen);
  }
  window.addEventListener('storage', depolamaDegisti);

  window.YDS.EsitlemeDepo = {
    ANAHTAR: ZARF_ANAHTARI,
    zarf: function () { return kopyala(guncelZarf()); },
    paket: function () { return M.paket(guncelZarf()); },
    uygula: uygula,
    paketYaz: paketYaz,
    anahtarlariSil: anahtarlariSil
  };
})();
