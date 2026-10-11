'use strict';
/* Browser model for the two-tab tests of the local sync store (assets/js/esitleme-depo.js).
   A helper of iki-sekme-yarisi-test.js, not a test itself (tum-testler.js runs only *-test.js).

   WHY A MODEL
   The harness of yerel-zarf-regresyon-test.js gives all tabs ONE store that every tab sees change at once.
   A browser does not work like that, and the 2026-10 regression (an answer given in one tab was reverted
   while a second tab was open) lives exactly in the difference:
     - a tab reads localStorage through a copy kept by its renderer process; another tab's write reaches
       that copy some time later;
     - the storage event of that write is a separate task that runs later still, so a handler can see
       another tab's three-step write (envelope with "b", classic keys, envelope without "b") half done,
       or see a state that is already NEWER than the event it is handling;
     - a tab's own write is visible to itself at once but reaches the browser asynchronously, and lands
       there AFTER whatever other tabs wrote in the meantime, even if the tab never saw those writes.
   Here the real data/kelime-aliaslari.js, assets/js/esitleme-veri.js, esitleme-depo.js and ilerleme.js run
   in one vm context per tab, and every way a browser may order those steps is a schedule the test controls.

   WHAT IS MODELLED (Chromium's localStorage, sources read on 2026-10-11: blink CachedStorageArea::SetItem,
   KeyChanged, MaybeApplyNonLocalMutationForKey, EnqueueStorageEvent, EnsureLoaded; StorageAreaImpl::Put)
     browser  G         the browser-side map, the single source of truth, changed in ONE global order
              kayit     the log of those changes (one entry per write the browser processed)
     process  onbellek  the renderer's copy; a write of one of its own tabs is visible in it at once
              giden     writes of its tabs that the browser has not processed yet (first in, first out)
              imlec     how far this process has observed the log
              bekleyen  per key, own writes not yet acknowledged. While it is > 0 a foreign write to that
                        key is NOT applied to the copy (it would be overwritten by the own write anyway),
                        although its storage event is still queued: the tab then handles an event whose
                        value it cannot read back. This "masking" is how a tab came to see a newer classic
                        key next to an older envelope.
     tab      olaylar   storage events its process has observed but the tab has not handled yet
   Every tab has its own process unless gecmis.surec puts several into one (same-site tabs may share a
   renderer: one copy, each sees the other's write at once and gets the event when the browser's
   acknowledgement comes back).

   SCHEDULER STEPS (each is atomic: a JS task is never interrupted)
     U      the next user action runs (a JS task in its tab); "kapat" closes the tab instead, "yenile"
            replaces its page by a freshly booted one in the same process (a navigation)
     A<i>   the late tab i loads: its process copies G if it is new, then the boot code of the store runs
     c<p>   the browser processes the oldest pending write of process p. The event's oldValue is the
            browser's previous value, not what the writer believed; a write that does not change the
            value is acknowledged without an event
     d<p>   process p observes the next log entry: an own entry is the acknowledgement (and the event for
            the other tabs of the same process), a foreign entry updates the copy (unless masked) and
            queues a storage event for each of its tabs
     e<i>   tab i handles its oldest queued storage event (a JS task)

   WHAT THE MODEL NEVER DOES (a browser does not either): reorder the writes of one process, let a process
   observe log entry n+1 before n, hand a tab its events out of order or before its process observed
   them, change a tab's view in the middle of its own JS task, deliver a tab its own write, drop an event
   for an open page.

   TIMING LEVELS (gecmis.mod), from the real rule to narrower subsets that are easier to reason about
     gevsek  setItem returns at once and the write travels to the browser asynchronously; the tab may run
             further tasks, and other tabs may act, before the browser has processed it
     siki    a process is "inside its task" until the browser has processed all writes of that task; steps
             of OTHER processes may still fall between two of those writes
     aninda  the browser processes a task's writes right after the task; only observing (d) and handling
             (e) lag behind

   ASSUMPTIONS AND GAPS
     - A navigation is slow compared with a storage round trip: the old page's writes are processed and
       acknowledged before the new page boots. (Otherwise Chromium would hand the new page the events of
       its predecessor's writes.)
     - Delays have no magnitude; any finite lag is allowed. The model finds what CAN happen, not how often.
     - A tab is closed between two tasks, never in the middle of one, and the writes it already made still
       reach the browser. A write that fails or a process that dies inside the three-step write is covered
       in yerel-zarf-regresyon-test.js, not here.
     - Not modelled: quota failures, back/forward cache, tabs running code from before 2026-08-28 (classic
       keys only; see yerel-zarf-regresyon-test.js and esitleme-yerel-guvenlik-test.js), timers and promises.
       The four product files use none today. The timer stubs below throw if that changes, because a timer
       is one more kind of task the scheduler would have to interleave; a promise is not caught (the vm
       context has its own Promise) and its reaction would run unscheduled.
     - Every initial record carries a stamp. Records that are stampless since the migration of 2026-08-28
       are exercised in yerel-zarf-regresyon-test.js only.
     - Only Chromium's implementation was read first-hand; WebKit's and Firefox's through summaries (the
       assumption the store relies on is written in kaydet, esitleme-depo.js). The schedules themselves rely on nothing beyond what the
       HTML Standard allows ("authors are encouraged to assume that there is no locking mechanism").

   THE ORACLE (denetle) knows which stamps are legitimate, without any hook in the product code: a stamp is
   "<clock>:<actor>", and every random id a tab draws is registered as that tab's. A stamp is legitimate
   when it was minted during the setup, or during a user action for a record that action writes; a cloud
   merge brings foreign stamps and mints none. Everything else a tab stamps is an echo taken for an edit.
   Hard classes (SERT; any of them fails the test):
     yanki-damga        a tab minted a stamp on a last-writer-wins field without a user action (while
                        handling a storage event, or while loading)
     yanki-damga-sayac  the same on the two counter fields that merge by device share
     yabanci-damga      a user action stamped a record it did not write
   and, once every queue has drained:
     deger              a record does not hold the newest legitimate write, and what it holds sits under a
                        stamp no user action minted (an echo overrode the user: the 2026-10 defect)
     kayip              ... and what it holds is an older legitimate record, or nothing (a lost update)
     damga-kalici       the value is right but does not sit under the stamp of the newest legitimate write
                        (an echo stamp, or an older or stampless copy of the same value)
     uyusmazlik         disk envelope, classic keys and a tab's EsitlemeDepo.paket() disagree, or the disk
                        envelope still has an open transaction
     bellek             a tab's in-memory Ilerleme copy (what the page shows) differs from disk
     yakinsama          the exchange did not settle within the bounds;      hata   an exception
   Info class (BILGI; reported, never fails):
     sayac-eksik        today's answer counter is lower than the number of answers given. Two tabs of one
                        device that both count an answer before seeing each other's write keep one
                        increment (the device share merges by maximum); known and accepted.              */
const fs = require('fs'), vm = require('vm'), path = require('path');

const ZARF = 'yds-esitleme-yerel-v3';
const T0 = Date.UTC(2026, 9, 5, 7, 0, 0);                                // the model clock at the start
const SAYAC_ALANLARI = {'yds-gunluk-kayit': 1, 'yds-yeni-sayac': 1};     // merged by device share, not last-writer-wins
const SERT = ['yanki-damga', 'yanki-damga-sayac', 'yabanci-damga', 'deger', 'kayip', 'damga-kalici', 'uyusmazlik', 'bellek', 'yakinsama', 'hata'];
const BILGI = ['sayac-eksik'];
const MODLAR = ['gevsek', 'siki', 'aninda'];
const duz = v => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));

// The product stamps with Date.now() and computes "today" with new Date(): both read the model clock.
const SAHTE_TARIH = new vm.Script('(function(){ const D = Date; class SahteTarih extends D { constructor(...a) { if (a.length) super(...a); else super(__simdi()); } static now() { return __simdi(); } } globalThis.Date = SahteTarih; })();', {filename: 'sahte-tarih.js'});
const zamanlayiciYok = ad => () => { throw new Error('iki-sekme-modeli: the product called ' + ad + '(); the model has no such task yet (see ASSUMPTIONS AND GAPS)'); };

function baglamKur(win, saat) {
  const context = {window: win, TextEncoder, TextDecoder, console, __simdi: () => saat.simdi};
  if (win.CustomEvent) context.CustomEvent = win.CustomEvent;
  ['setTimeout', 'setInterval', 'requestAnimationFrame', 'queueMicrotask'].forEach(ad => { context[ad] = win[ad] = zamanlayiciYok(ad); });
  vm.createContext(context);
  SAHTE_TARIH.runInContext(context);
  return context;
}

/* Compiles the four product scripts of the tree once; every tab runs them in a context of its own. */
function derle(kok) {
  const oku = f => new vm.Script(fs.readFileSync(path.join(kok, f), 'utf8'), {filename: path.basename(f)});
  const b = {kok, alias: oku('data/kelime-aliaslari.js'), veri: oku('assets/js/esitleme-veri.js'),
    depo: oku('assets/js/esitleme-depo.js'), ilerleme: oku('assets/js/ilerleme.js')};
  // the oracle's own context: the pure engine and the envelope codec (the store returns early without YDS.Depo)
  const gw = {YDS: {}}, gc = baglamKur(gw, {simdi: T0});
  b.alias.runInContext(gc); b.veri.runInContext(gc); b.depo.runInContext(gc);
  b.M = gw.YDS.EsitlemeMotoru; b.L = gw.YDS.YerelZarfKodlama;
  if (!b.M || !b.L) throw new Error('iki-sekme-modeli: YDS.EsitlemeMotoru / YDS.YerelZarfKodlama not found under ' + kok);
  b.cozumBellek = new Map(); b.kurulum = null;
  return b;
}

class Tarayici {
  constructor(betikler, secenek = {}) {
    this.betikler = betikler;
    this.mod = secenek.mod || 'gevsek';
    this.izAcik = !!secenek.iz;
    this.saat = {simdi: T0};
    this.G = new Map();
    this.kayit = [];
    this.surecler = [];
    this.sekmeler = [];
    this.sekmeSayaci = 0;
    this.gorevSayaci = 0;
    this.olaySayisi = 0;
    this.adim = 0;
    this.iz = [];
    this.damgalar = [];                 // every fresh stamp, in order: {sekme, gorevTuru, alan, id, m, kayit, mesru, sinif}
    this.gorulenDamga = new Set();
    this.aktorSekme = Object.create(null);   // actor id -> name of the tab that drew it
    this.mesru = Object.create(null);   // field -> id -> newest legitimate record {m, v|d}
    this.kurulumda = true;              // during the setup everything minted is legitimate
    this.M = betikler.M; this.L = betikler.L;
  }
  zarfCoz(metin) {
    if (metin === null || metin === undefined) return null;
    const bellek = this.betikler.cozumBellek;
    let c = bellek.get(metin);
    if (c === undefined) {
      try { const raw = JSON.parse(metin); c = {b: Object.prototype.hasOwnProperty.call(raw, 'b'), zarf: duz(this.L.coz(raw.z))}; }
      catch (h) { c = {hata: String(h && h.message || h)}; }
      if (bellek.size > 6000) bellek.clear();
      bellek.set(metin, c);
    }
    return c;
  }
  mesruYaz(alan, id, kayit) {
    const a = this.mesru[alan] || (this.mesru[alan] = Object.create(null));
    if (!a[id] || this.M.metaKarsilastir(kayit.m, a[id].m) > 0) a[id] = duz(kayit);
  }
  /* Called for every envelope a tab writes: finds stamps of that tab's actor that were never seen before
     and classifies them (see THE ORACLE in the header). */
  yazimGozle(sekme, y) {
    if (y.k !== ZARF || y.v === null) return;
    const c = this.zarfCoz(y.v);
    if (!c || c.hata) return;
    const alanlar = c.zarf.alanlar || {};
    for (const alan of Object.keys(alanlar)) {
      const kayitlar = alanlar[alan].i || {};
      const bak = (id, m, kayit) => {
        if (typeof m !== 'string') return;
        const yer = m.indexOf(':');
        if (yer < 0 || this.aktorSekme[m.slice(yer + 1)] !== sekme.ad) return;
        const anahtar = alan + '|' + id + '|' + m;
        if (this.gorulenDamga.has(anahtar)) return;
        this.gorulenDamga.add(anahtar);
        const g = sekme.gorev || {tur: '?', no: 0};
        let mesru = false, sinif = null;
        if (this.kurulumda) mesru = true;
        else if (g.tur === 'kullanici') { mesru = amacMi(g.islem, alan, id); if (!mesru) sinif = 'yabanci-damga'; }
        else sinif = SAYAC_ALANLARI[alan] ? 'yanki-damga-sayac' : 'yanki-damga';
        const d = {sekme: sekme.ad, gorevTuru: g.tur, gorev: g.no, alan, id, m, kayit: duz(kayit), mesru, sinif, adim: this.adim};
        this.damgalar.push(d);
        if (mesru && id !== '$r') this.mesruYaz(alan, id, kayit);
        if (this.izAcik) this.iz.push({ne: 'damga', sekme: sekme.ad, d});
      };
      if (alanlar[alan].r) bak('$r', alanlar[alan].r, {m: alanlar[alan].r});
      for (const id of Object.keys(kayitlar)) bak(id, kayitlar[id].m, kayitlar[id]);
    }
  }
  surecAc() { const s = new Surec(this, this.surecler.length); this.surecler.push(s); return s; }
  sekmeAc(ad, surec) { const s = new Sekme(this, surec, ad); this.sekmeler.push(s); return s; }
}

/* Which records may a user action stamp? Everything else a tab stamps is an echo. */
function amacMi(o, alan, id) {
  if (!o) return false;
  if (o.tur === 'terfi' || o.tur === 'dusur' || o.tur === 'yeni') return (alan === 'yds-leitner' && id === o.id) || !!SAYAC_ALANLARI[alan];
  if (o.tur === 'yay') return alan === 'yds-leitner' && HAVUZ.concat(YENILER).includes(id);
  if (o.tur === 'ayar') return alan === 'yds-gunluk-yeni' && id === '$';
  if (o.tur === 'kurulum') return true;
  return false;                                    // 'bulut' merges foreign stamps, it mints none
}

/* One renderer process: the copy its tabs read and write, and its two pipes to the browser. */
class Surec {
  constructor(t, no) {
    this.t = t; this.no = no;
    this.onbellek = new Map(t.G);        // the whole area is loaded at once, in step with the observer pipe
    this.imlec = t.kayit.length;
    this.giden = []; this.bekleyen = new Map(); this.sekmeler = [];
  }
  ad() { return this.sekmeler.filter(s => !s.kapali).map(s => s.ad).join('+') || 'process ' + this.no + ' (no open page)'; }
  acikMi() { return this.sekmeler.some(s => !s.kapali); }
  oku(k) { return this.onbellek.has(k) ? this.onbellek.get(k) : null; }
  yaz(sekme, k, v) {
    if (v === null && !this.onbellek.has(k)) return;   // removeItem of a missing key sends nothing
    const once = this.oku(k);
    if (v === null) this.onbellek.delete(k); else this.onbellek.set(k, v);   // own copy first, then the write travels
    this.bekleyen.set(k, (this.bekleyen.get(k) || 0) + 1);
    const y = {surec: this, sekme, k, v, once, gorev: sekme.gorev};
    if (this.t.izAcik) y.yigin = yiginKisalt(new Error().stack);
    this.giden.push(y);
    if (v !== null) this.t.yazimGozle(sekme, y);
    if (this.t.izAcik) this.t.iz.push({ne: 'yaz', sekme: sekme.ad, y});
  }
  mesgul() { return this.t.mod === 'siki' && this.giden.length > 0; }
  kaydetBir() {                          // step c: the browser processes one write
    const y = this.giden.shift(), G = this.t.G;
    const eski = G.has(y.k) ? G.get(y.k) : null;
    const degisti = eski !== y.v;
    if (degisti) { if (y.v === null) G.delete(y.k); else G.set(y.k, y.v); }
    const g = {surec: this, sekme: y.sekme, sira: this.t.kayit.length, k: y.k, eski, yeni: y.v, degisti, yazim: y};
    this.t.kayit.push(g);
    if (this.t.izAcik) this.t.iz.push({ne: 'kaydet', sekme: y.sekme.ad, g});
    return g;
  }
  teslimBir() {                          // step d: this process observes one log entry
    const g = this.t.kayit[this.imlec++];
    let maskeli = false;
    if (g.surec === this) this.bekleyen.set(g.k, this.bekleyen.get(g.k) - 1);          // own write acknowledged
    else if (this.bekleyen.get(g.k) > 0) maskeli = true;                                // masked by a pending own write
    else if (g.yeni === null) this.onbellek.delete(g.k);
    else this.onbellek.set(g.k, g.yeni);
    if (g.degisti) for (const s of this.sekmeler) if (s !== g.sekme && !s.kapali) s.olaylar.push(g);   // never to the writing tab
    if (this.t.izAcik && (g.surec !== this || this.sekmeler.length > 1)) this.t.iz.push({ne: 'teslim', surec: this.ad(), g, maskeli, kendi: g.surec === this});
    return g;
  }
}

class Sekme {
  constructor(t, surec, ad) {
    this.t = t; this.surec = surec; this.ad = ad; this.no = t.sekmeSayaci++;
    this.kapali = false; this.olaylar = []; this.gorev = null; this.uyarilar = [];
    surec.sekmeler.push(this);
    const dinleyiciler = {}, self = this;
    function CE(type, o) { this.type = type; this.detail = o && o.detail; }
    let cekilis = 0;
    const win = this.pencere = {
      YDS: {
        // the base YDS.Depo of assets/js/main.js: JSON over localStorage
        Depo: {
          oku: (k, d) => { const h = surec.oku(k); if (h === null) return d; try { return JSON.parse(h); } catch (e) { return d; } },
          yaz: (k, v) => { surec.yaz(self, k, JSON.stringify(v)); return true; },
          sil: k => { surec.yaz(self, k, null); return true; }
        },
        depolamaUyarisi: key => self.uyarilar.push(key)
      },
      // every id this tab draws is registered as its own (the first one becomes the actor of its stamps)
      crypto: {getRandomValues: a => { cekilis++; a[0] = 100000 + self.no * 1000 + cekilis; a[1] = 7 + cekilis; t.aktorSekme[a[0].toString(36) + a[1].toString(36)] = ad; return a; }},
      CustomEvent: CE,
      localStorage: {getItem: k => surec.oku(k)},
      addEventListener: (type, fn) => (dinleyiciler[type] || (dinleyiciler[type] = [])).push(fn),
      dispatchEvent: event => (dinleyiciler[event.type] || []).slice().forEach(fn => fn(event))
    };
    this.context = baglamKur(win, t.saat);
    this.gorevCalistir('acilis', () => {
      const b = t.betikler;
      b.alias.runInContext(this.context); b.veri.runInContext(this.context); b.depo.runInContext(this.context); b.ilerleme.runInContext(this.context);
    }, 'page load');
    this.D = win.YDS.Depo; this.E = win.YDS.EsitlemeDepo; this.I = win.YDS.Ilerleme;
    if (!this.E || !this.I) throw new Error('iki-sekme-modeli: YDS.EsitlemeDepo / YDS.Ilerleme were not set up');
  }
  gorevCalistir(tur, fn, bilgi, islem) {           // one JS task; tur: acilis | kullanici | olay
    const onceki = this.gorev;
    this.gorev = {tur, no: ++this.t.gorevSayaci, bilgi, islem};
    if (this.t.izAcik) this.t.iz.push({ne: 'gorev', sekme: this.ad, tur, no: this.gorev.no, bilgi});
    try { return fn(); } finally { this.gorev = onceki; }
  }
  olayBir() {                                      // step e: handle one storage event
    const g = this.olaylar.shift();
    this.t.olaySayisi++;
    this.gorevCalistir('olay', () => this.pencere.dispatchEvent({type: 'storage', key: g.k, oldValue: g.eski, newValue: g.yeni}), g);
    return g;
  }
}

function yiginKisalt(s) {                          // "depo:719(kaydet) < depo:978(depolamaDegisti)" for the trace
  return String(s || '').split('\n').map(x => {
    const m = /at (?:(\S+) \()?(esitleme-depo|esitleme-veri|ilerleme)\.js:(\d+):\d+/.exec(x);
    return m ? (m[2] === 'esitleme-depo' ? 'depo' : m[2] === 'esitleme-veri' ? 'veri' : 'ilerleme') + ':' + m[3] + (m[1] ? '(' + m[1].replace(/^Object\./, '') + ')' : '') : null;
  }).filter(Boolean).join(' < ');
}

/* ---------- histories ---------- */
const HAVUZ = ['alfa', 'beta', 'gama', 'delta', 'epsilon', 'zeta'];   // the Leitner records every history starts with
const KUTULAR = [1, 2, 3, 1, 2, 4];                                     // ... and their boxes
const YENILER = ['yeni-bir', 'yeni-iki', 'yeni-uc'];                    // records that do not exist at the start
const SEKME_ADLARI = ['A', 'B', 'C'];

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const zamanlamaRng = tohum => mulberry32(tohum ^ 0x5bd1e995);            // the schedule of a seed (the history itself uses gecmisUret's own stream)

/* A small random history; everything follows from the seed.
   2 or 3 tabs; 1-6 user actions: promotion (Il.dogru) or demotion (Il.yanlis) of an existing record, a new
   record, the multi-record Il.birikmisiYay, a scalar setting, a navigation inside a tab, at most one cloud
   merge; in a quarter of the histories the last tab loads late; tabs in separate renderer processes (4 in 5)
   or sharing one; one of the three timing levels; random scheduler weights and a slowness factor per tab.
   No tab is closed in a random history (see "Not covered" in iki-sekme-yarisi-test.js). */
function gecmisUret(tohum) {
  const r = mulberry32(tohum * 2654435761 >>> 0), sec = d => d[Math.floor(r() * d.length)];
  const sekmeSayisi = r() < 0.7 ? 2 : 3;
  const gec = r() < 0.25 ? sekmeSayisi - 1 : null;
  const adet = 1 + Math.floor(r() * 6);
  const islemler = [];
  let yeniSira = 0, bulutVar = false;
  for (let i = 0; i < adet; i++) {
    const sekme = Math.floor(r() * sekmeSayisi), z = r();
    if (z < 0.36) islemler.push({sekme, tur: 'terfi', id: sec(HAVUZ)});
    else if (z < 0.52) islemler.push({sekme, tur: 'dusur', id: sec(HAVUZ)});
    else if (z < 0.66 && yeniSira < YENILER.length) islemler.push({sekme, tur: 'yeni', id: YENILER[yeniSira++]});
    else if (z < 0.73) islemler.push({sekme, tur: 'yay', pay: 2});
    else if (z < 0.82) islemler.push({sekme, tur: 'ayar', deger: 10 + Math.floor(r() * 80)});
    else if (z < 0.91) islemler.push({sekme, tur: 'yenile'});
    else if (!bulutVar) { bulutVar = true; islemler.push({sekme, tur: 'bulut', id: sec(HAVUZ), kutu: 1 + Math.floor(r() * 5), yeni: r() < 0.5}); }
    else islemler.push({sekme, tur: 'terfi', id: sec(HAVUZ)});
  }
  const agirlik = {U: sec([0.3, 1, 3]), c: sec([1, 3, 10]), d: sec([0.3, 1, 3, 10]), e: sec([0.3, 1, 3, 10]), A: sec([0.2, 1])};
  const yavas = []; for (let i = 0; i < sekmeSayisi; i++) yavas.push(sec([1, 1, 0.25, 0.05]));
  r(); r(); r();                        // three draws of an explorer option this test does not use; kept so that a seed means the same history as in the 2026-10 reports
  const sz = r(), mz = r();
  const surec = sekmeSayisi === 2 ? (sz < 0.8 ? [0, 1] : [0, 0])
    : (sz < 0.64 ? [0, 1, 2] : sz < 0.76 ? [0, 0, 1] : sz < 0.88 ? [0, 1, 1] : sz < 0.94 ? [0, 1, 0] : [0, 0, 0]);
  const mod = mz < 0.4 ? 'gevsek' : mz < 0.8 ? 'siki' : 'aninda';
  return {tohum, sekmeSayisi, surec, gec, mod, islemler, agirlik, yavas};
}

function islemMetni(o) {
  const s = SEKME_ADLARI[o.sekme];
  if (o.tur === 'terfi') return s + ': Il.dogru("' + o.id + '")';
  if (o.tur === 'dusur') return s + ': Il.yanlis("' + o.id + '")';
  if (o.tur === 'yeni') return s + ': Il.dogru("' + o.id + '") [new record]';
  if (o.tur === 'yay') return s + ': Il.birikmisiYay(all, ' + o.pay + ')';
  if (o.tur === 'ayar') return s + ': Depo.yaz("yds-gunluk-yeni", ' + o.deger + ')';
  if (o.tur === 'bulut') return s + ': EsitlemeDepo.uygula({' + o.id + ': k' + o.kutu + ' @' + (o.yeni ? 'newer' : 'older') + ' cloud stamp}, "bulut")';
  if (o.tur === 'yenile') return s + ': navigates to another page of the site (its page is unloaded, queued events are dropped; a new page boots in the same renderer process)';
  if (o.tur === 'kapat') return s + ': the tab is CLOSED (its queued events are dropped; writes already made still reach the browser)';
  return s + ': ?';
}

function gecmisMetni(g) {
  const surec = g.surec || [0, 1, 2].slice(0, g.sekmeSayisi);
  const gruplar = {};
  surec.forEach((p, i) => { (gruplar[p] = gruplar[p] || []).push(SEKME_ADLARI[i] + (g.gec === i ? ' (loads late)' : '')); });
  const ortak = Object.keys(gruplar).some(p => gruplar[p].length > 1);
  return 'tabs ' + Object.keys(gruplar).map(p => (gruplar[p].length > 1 ? '[' + gruplar[p].join(' + ') + ' in one renderer process]' : gruplar[p][0])).join(', ') +
    (ortak ? '' : ' (separate renderer processes)') + '; browser timing "' + (g.mod || 'gevsek') + '"';
}

/* The initial state, built once per compiled tree: one tab writes the initial Leitner records (so they
   carry real stamps), everything settles, that tab goes away. Every history starts from a copy of it. */
function kurulumAl(betikler) {
  if (betikler.kurulum) return betikler.kurulum;
  const t = new Tarayici(betikler, {mod: 'aninda'});
  const sr = t.surecAc(), kur = t.sekmeAc('kur', sr);
  const bugun = kur.I.bugun();
  const baslangic = {};
  HAVUZ.forEach((id, i) => { baslangic[id] = {k: KUTULAR[i], g: bugun - 1 - (i % 3), c: bugun - 3, m: 0}; });
  kur.gorevCalistir('kurulum', () => { if (kur.D.kayitlariYaz('yds-leitner', baslangic) !== true) throw new Error('iki-sekme-modeli: the setup write failed'); }, 'initial records', {tur: 'kurulum'});
  for (let n = 0; ; n++) {
    if (n > 500) throw new Error('iki-sekme-modeli: the setup did not settle');
    let oldu = false;
    while (sr.giden.length) { sr.kaydetBir(); oldu = true; }
    while (sr.imlec < t.kayit.length) { sr.teslimBir(); oldu = true; }
    if (!oldu) break;
  }
  HAVUZ.concat(YENILER).forEach(id => { if (kur.I.ilerlemeKimligi(id, 'kelime') !== id) throw new Error('iki-sekme-modeli: "' + id + '" is aliased by the product, pick another word'); });
  betikler.kurulum = {G: new Map(t.G), mesru: duz(t.mesru), aktorSekme: Object.assign({}, t.aktorSekme), sekmeSayaci: t.sekmeSayaci, bugun};
  return betikler.kurulum;
}

/* Runs one history and judges it (sonuc.ihlal).
   secenek.rng       random scheduling: at every step one of the enabled scheduler steps is drawn by weight
   secenek.program   a fixed schedule: these step labels in order, then everything still pending in order
                     (each remaining action preceded by a full drain). A label that is not enabled when its
                     turn comes is skipped and counted in sonuc.atlanan: after a fix a tab may simply have
                     nothing to write at that point. "c0*" repeats a label while it is enabled, "c0x3" three times
   secenek.senkron   control run without any interleaving: every action is followed by a full drain
   secenek.erkenDur  stop at the first stamp no user action accounts for (the history has failed already;
                     code that echoes can go on exchanging for thousands of steps)
   secenek.iz        record the trace for izYaz                                                              */
function kos(betikler, gecmis, secenek = {}) {
  const mod = gecmis.mod || 'gevsek';
  if (!MODLAR.includes(mod)) throw new Error('iki-sekme-modeli: mod ' + mod);
  const t = new Tarayici(betikler, {mod, iz: secenek.iz});
  const azamiAdim = secenek.azamiAdim || 6000, azamiOlay = secenek.azamiOlay || 400;
  const sonuc = {ihlal: [], program: [], gecmis, mod, atlanan: 0, cevap: 0};
  const k = kurulumAl(betikler);
  t.G = new Map(k.G);
  Object.keys(k.mesru).forEach(alan => { t.mesru[alan] = Object.assign(Object.create(null), duz(k.mesru[alan])); });
  Object.assign(t.aktorSekme, k.aktorSekme);
  t.sekmeSayaci = k.sekmeSayaci;
  t.saat.simdi = T0 + 10000;
  t.kurulumda = false;
  const N = gecmis.sekmeSayisi, surecNo = gecmis.surec || [0, 1, 2].slice(0, N);
  const surecler = [], sekmeler = new Array(N).fill(null);
  const aninda = () => { if (mod === 'aninda') for (const p of t.surecler) while (p.giden.length) p.kaydetBir(); };
  const ac = i => {
    const p = surecNo[i];
    if (!surecler[p]) surecler[p] = t.surecAc();
    sekmeler[i] = t.sekmeAc(SEKME_ADLARI[i], surecler[p]);
    aninda();
  };
  let durdu = false, erken = false, bakilan = 0, sira = 0, kapanan = 0;
  const olayBaz = t.olaySayisi;
  const yankiVar = () => {
    for (; bakilan < t.damgalar.length; bakilan++) if (!t.damgalar[bakilan].mesru) return true;
    return false;
  };
  // stop conditions: durdu = a bound was exceeded (no quiescence); erken = secenek.erkenDur and an unaccounted stamp appeared
  const dur = () => {
    if (secenek.erkenDur && yankiVar()) { erken = true; return true; }
    if (t.adim >= azamiAdim || t.olaySayisi - olayBaz > azamiOlay) { durdu = true; return true; }
    return false;
  };
  // full drain: the browser processes every write, every process observes everything, one event is handled; repeat
  const bosalt = () => {
    for (;;) {
      if (dur()) return false;
      let oldu = false;
      for (const p of t.surecler) while (p.giden.length) { p.kaydetBir(); oldu = true; }
      for (const p of t.surecler) if (p.acikMi()) while (p.imlec < t.kayit.length) { p.teslimBir(); oldu = true; }
      for (const s of t.sekmeler) if (!s.kapali && s.olaylar.length) { t.adim++; s.olayBir(); oldu = true; break; }
      if (!oldu) return true;
    }
  };
  const islemYap = () => {
    const o = gecmis.islemler[sira++];
    if (o.tur === 'kapat') {
      const s = sekmeler[o.sekme];
      if (!s || s.kapali) { if (t.izAcik) t.iz.push({ne: 'not', metin: 'skipped: ' + islemMetni(o)}); return; }
      s.kapali = true; s.olaylar.length = 0; kapanan++;
      if (t.izAcik) t.iz.push({ne: 'not', metin: islemMetni(o)});
      return;
    }
    if (o.tur === 'yenile') {
      const eski = sekmeler[o.sekme];
      if (!eski) { ac(o.sekme); return; }                    // a late tab that was not open yet: this is its load
      if (eski.kapali) { if (t.izAcik) t.iz.push({ne: 'not', metin: 'skipped (tab ' + eski.ad + ' is closed): ' + islemMetni(o)}); return; }
      eski.kapali = true; eski.olaylar.length = 0;
      if (t.izAcik) t.iz.push({ne: 'not', metin: islemMetni(o) + ' -> ' + eski.ad + "'"});
      // the old page's writes reach the browser and are acknowledged before the new page boots (see ASSUMPTIONS)
      const p = eski.surec;
      while (p.giden.length) p.kaydetBir();
      let son = -1;
      for (let i = t.kayit.length - 1; i >= p.imlec; i--) if (t.kayit[i].surec === p) { son = i; break; }
      while (p.imlec <= son) p.teslimBir();
      sekmeler[o.sekme] = t.sekmeAc(eski.ad + "'", eski.surec);
      aninda();
      return;
    }
    if (!sekmeler[o.sekme]) ac(o.sekme);
    const s = sekmeler[o.sekme];
    if (s.kapali) { if (t.izAcik) t.iz.push({ne: 'not', metin: 'skipped (tab ' + s.ad + ' is closed): ' + islemMetni(o)}); return; }
    t.saat.simdi += 1000;                                    // one second per user action: script order = stamp order of user writes
    s.gorevCalistir('kullanici', () => {
      let r;
      if (o.tur === 'terfi' || o.tur === 'yeni') { r = s.I.dogru(o.id, 'kelime'); sonuc.cevap++; }
      else if (o.tur === 'dusur') { r = s.I.yanlis(o.id, 'kelime'); sonuc.cevap++; }
      else if (o.tur === 'yay') r = s.I.birikmisiYay(HAVUZ.concat(YENILER), o.pay, 'kelime').basarili !== false;
      else if (o.tur === 'ayar') r = s.D.yaz('yds-gunluk-yeni', o.deger);
      else if (o.tur === 'bulut') {
        const m = String(o.yeni ? t.saat.simdi + 500 : T0 + 5000) + ':bulut' + sira;
        const kayit = {m, v: {k: o.kutu, g: k.bugun + 9, c: k.bugun, m: 0}};
        const zarf = {surum: 2, alanlar: {'yds-leitner': {i: {}}}};
        zarf.alanlar['yds-leitner'].i[o.id] = duz(kayit);
        t.mesruYaz('yds-leitner', o.id, kayit);
        r = s.E.uygula(zarf, 'bulut').basarili;
      }
      if (r === false) throw new Error('user action failed: ' + islemMetni(o));
    }, islemMetni(o), o);
    aninda();
  };
  // the scheduler steps that are possible right now, with their weights
  const etkin = () => {
    const d = [], a = gecmis.agirlik || {U: 1, c: 1, d: 1, e: 1, A: 1};
    if (sira < gecmis.islemler.length) {
      const o = gecmis.islemler[sira], s = sekmeler[o.sekme], p = surecler[surecNo[o.sekme]];
      if (o.tur === 'kapat' || !p || (s && s.kapali) || !p.mesgul()) d.push({e: 'U', w: a.U, yap: islemYap});
    }
    for (let i = 0; i < N; i++) {
      const s = sekmeler[i], p = surecler[surecNo[i]], y = (gecmis.yavas && gecmis.yavas[i]) || 1;
      if (!s) { if (!p || !p.mesgul()) d.push({e: 'A' + i, w: a.A, yap: () => ac(i)}); continue; }
      if (!s.kapali && !p.mesgul() && s.olaylar.length) d.push({e: 'e' + i, w: a.e * y, yap: () => { s.olayBir(); aninda(); }});
    }
    surecler.forEach((p, no) => {
      if (!p) return;
      const tabs = []; surecNo.forEach((q, i) => { if (q === no) tabs.push(i); });
      const y = Math.max(...tabs.map(i => (gecmis.yavas && gecmis.yavas[i]) || 1));
      if (p.giden.length) d.push({e: 'c' + no, w: a.c, yap: () => p.kaydetBir()});
      if (p.acikMi() && !p.mesgul() && p.imlec < t.kayit.length) d.push({e: 'd' + no, w: a.d * y, yap: () => p.teslimBir()});
    });
    return d;
  };
  const adimAt = secim => { t.adim++; if (t.izAcik) t.iz.push({ne: 'adim', e: secim.e, no: t.adim}); sonuc.program.push(secim.e); secim.yap(); };
  let kayitBaz = 0;
  try {
    for (let i = 0; i < N; i++) if (i !== gecmis.gec) ac(i);
    if (!bosalt()) { if (!erken) throw new Error('the initial page loads did not settle'); }
    t.iz.length = 0; sonuc.program.length = 0; kayitBaz = t.kayit.length;
    if (erken) { /* a tab minted a stamp while loading on a settled storage */ }
    else if (secenek.senkron) {
      while (sira < gecmis.islemler.length) { islemYap(); if (!bosalt()) break; }
      if (!durdu && !erken) { for (let i = 0; i < N; i++) if (!sekmeler[i]) ac(i); bosalt(); }
    } else if (secenek.program) {
      for (const etiket of secenek.program) {
        const m = /^([UAcde]\d?)(\*|x(\d+))?$/.exec(etiket);
        if (!m) throw new Error('schedule label: ' + etiket);
        const kez = m[2] === '*' ? 500 : m[3] ? Number(m[3]) : 1;
        for (let n = 0; n < kez; n++) {
          if (dur()) break;
          const s = etkin().find(x => x.e === m[1]);
          if (!s) { if (m[2] !== '*') sonuc.atlanan++; break; }
          adimAt(s);
        }
        if (durdu || erken) break;
      }
      if (t.izAcik) t.iz.push({ne: 'not', metin: 'TAIL: from here on everything pending is processed in order'});
      while (!durdu && !erken && sira < gecmis.islemler.length) { if (!bosalt()) break; if (t.izAcik) t.iz.push({ne: 'adim', e: 'U (tail)', no: ++t.adim}); islemYap(); }
      for (let i = 0; i < N && !durdu && !erken; i++) if (!sekmeler[i]) { if (bosalt()) ac(i); }
      if (!durdu && !erken) bosalt();
    } else {
      const rng = secenek.rng;
      for (;;) {
        if (dur()) break;
        const d = etkin();
        if (!d.length) break;
        let toplam = 0; for (const x of d) toplam += x.w;
        let z = rng() * toplam, secim = d[d.length - 1];
        for (const x of d) { z -= x.w; if (z < 0) { secim = x; break; } }
        adimAt(secim);
      }
    }
    // the next visit: when a tab was closed, a fresh tab is loaded once everything has settled
    if (kapanan && !durdu && !erken) {
      if (t.izAcik) t.iz.push({ne: 'not', metin: 'a fresh tab Z is loaded (next visit)'});
      sekmeler.push(t.sekmeAc('Z', t.surecAc())); aninda();
      bosalt();
    }
  } catch (h) {
    sonuc.ihlal.push({tur: 'hata', metin: String(h && h.stack || h).split('\n').slice(0, 4).join(' | ')});
    durdu = true;
  }
  sonuc.olay = t.olaySayisi - olayBaz;
  sonuc.adim = t.adim;
  sonuc.yazim = t.kayit.length - kayitBaz;
  // writes a tab issued while handling a storage event (after the initial page loads), per tab name
  sonuc.olayYazimi = {};
  for (let i = kayitBaz; i < t.kayit.length; i++) { const y = t.kayit[i].yazim; if (y.gorev && y.gorev.tur === 'olay') sonuc.olayYazimi[y.sekme.ad] = (sonuc.olayYazimi[y.sekme.ad] || 0) + 1; }
  sonuc.erken = erken;
  if (durdu && !sonuc.ihlal.length) sonuc.ihlal.push({tur: 'yakinsama', metin: 'no quiescence within ' + azamiAdim + ' steps / ' + azamiOlay + ' storage-event deliveries (deliveries so far: ' + sonuc.olay + ')'});
  sonuc.damgalar = t.damgalar.slice();
  denetle(t, sekmeler.filter(s => s && !s.kapali), sonuc, durdu || erken, k);
  sonuc.iz = t.iz; sonuc.t = t;
  return sonuc;
}

/* The oracle; the classes are described in the header. yarim: the history did not reach quiescence, so only
   the stamps can be judged. */
function denetle(t, sekmeler, sonuc, yarim, k) {
  const M = t.M, es = (a, b) => (a === undefined || b === undefined ? a === b : M.kararliJson(a) === M.kararliJson(b));
  const kisa = m => kisaDamga(t, m);
  const yanki = sonuc.damgalar.filter(d => !d.mesru);
  sonuc.yanki = yanki;
  sonuc.sayim = {};                                  // fresh stamps per tab: {A: {kullanici: n, olay: n, acilis: n}}
  sonuc.damgalar.forEach(d => { const s = sonuc.sayim[d.sekme] || (sonuc.sayim[d.sekme] = {}); const a = d.mesru ? 'kullanici' : d.gorevTuru === 'kullanici' ? 'yabanci' : d.gorevTuru; s[a] = (s[a] || 0) + 1; });
  for (const sinif of ['yanki-damga', 'yanki-damga-sayac', 'yabanci-damga']) {
    const liste = yanki.filter(d => d.sinif === sinif);
    if (!liste.length) continue;
    const say = {}; liste.forEach(d => { const a = 'tab ' + d.sekme + ' while ' + (d.gorevTuru === 'olay' ? 'handling a storage event' : d.gorevTuru === 'acilis' ? 'loading' : 'a user action'); say[a] = (say[a] || 0) + 1; });
    const ilk = liste[0];
    sonuc.ihlal.push({tur: sinif, metin: liste.length + ' fresh stamp(s) ' + (sinif === 'yabanci-damga' ? 'minted by a user action for a record it did not write ' : 'minted without a user action ') + JSON.stringify(say) +
      '; first: tab ' + ilk.sekme + ', ' + ilk.alan + '/' + ilk.id + ' = ' + JSON.stringify(ilk.kayit.v || {d: 1}) + ' @' + kisa(ilk.m)});
  }
  if (yarim) return;
  const c = t.zarfCoz(t.G.has(ZARF) ? t.G.get(ZARF) : null);
  if (!c || c.hata) { sonuc.ihlal.push({tur: 'uyusmazlik', metin: 'disk envelope unreadable: ' + (c && c.hata)}); return; }
  if (c.b) sonuc.ihlal.push({tur: 'uyusmazlik', metin: 'disk envelope still carries an open transaction (b) at quiescence'});
  const paket = duz(M.paket(c.zarf));
  for (const anahtar of Object.keys(M.TIPLER)) {
    const ham = t.G.has(anahtar) ? JSON.parse(t.G.get(anahtar)) : undefined;
    if (!es(ham, paket[anahtar])) sonuc.ihlal.push({tur: 'uyusmazlik', metin: 'classic key ' + anahtar + ' on disk differs from the disk envelope: ' + farkMetni(ham, paket[anahtar])});
  }
  const L = paket['yds-leitner'] || {};
  for (const s of sekmeler) {                      // first of all: the read-only checks below merge silently
    const kotu = Object.keys(L).filter(id => s.I.kutu(id, 'kelime') !== L[id].k);
    if (kotu.length) sonuc.ihlal.push({tur: 'bellek', metin: 'tab ' + s.ad + ' in-memory Ilerleme copy (what the page shows) differs from disk for ' + kotu.map(id => id + ': k' + s.I.kutu(id, 'kelime') + ' vs k' + L[id].k).join(', ')});
  }
  for (const s of sekmeler) {
    const p = duz(s.E.paket());
    if (!es(p, paket)) {
      const alan = Object.keys(M.TIPLER).find(a => !es(p[a], paket[a]));
      sonuc.ihlal.push({tur: 'uyusmazlik', metin: 'tab ' + s.ad + ' EsitlemeDepo.paket() differs from the disk envelope in ' + alan + ': ' + farkMetni(p[alan], paket[alan])});
    }
    if (s.surec.giden.length) sonuc.ihlal.push({tur: 'uyusmazlik', metin: 'tab ' + s.ad + ' wrote during the final read-only check'});
  }
  const yankiKume = new Set(yanki.map(d => d.alan + '|' + d.id + '|' + d.m));
  for (const alan of Object.keys(M.TIPLER)) {
    if (SAYAC_ALANLARI[alan]) continue;
    const beklenen = t.mesru[alan] || {}, gercek = ((c.zarf.alanlar || {})[alan] || {}).i || {};
    const ids = new Set(Object.keys(beklenen).concat(Object.keys(gercek)));
    for (const id of ids) {
      const b = beklenen[id], g = gercek[id];
      if (b && g && es(b, g)) continue;
      const degerAyni = b && g && es(b.v, g.v) && !!b.d === !!g.d;
      const yankiAltinda = g && yankiKume.has(alan + '|' + id + '|' + g.m);
      const tur = degerAyni ? 'damga-kalici' : yankiAltinda ? 'deger' : 'kayip';
      const ne = degerAyni ? 'right value, but not under the stamp of the newest legitimate write' : yankiAltinda ? 'REVERTED: an older value sits under a fresh stamp no user action minted' : 'LOST UPDATE: the newest legitimate write is not on disk';
      sonuc.ihlal.push({tur, alan, id,
        metin: alan + '/' + id + ': ' + ne + ' - newest legitimate write ' + (b ? JSON.stringify(b.v || {d: 1}) + ' @' + kisa(b.m) : 'none') + ', final ' + (g ? JSON.stringify(g.v || {d: 1}) + ' @' + kisa(g.m) : 'missing')});
    }
  }
  const gunluk = (paket['yds-gunluk-kayit'] || {})[String(k.bugun)];
  const sayilan = gunluk && typeof gunluk.t === 'number' ? gunluk.t : 0;
  if (sayilan < sonuc.cevap) sonuc.ihlal.push({tur: 'sayac-eksik', metin: "today's answer counter (yds-gunluk-kayit t) is " + sayilan + ' after ' + sonuc.cevap + ' answers'});
}

function farkMetni(a, b) {
  if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a)) {
    const ids = [...new Set(Object.keys(a).concat(Object.keys(b)))].filter(id => JSON.stringify(a[id]) !== JSON.stringify(b[id]));
    return ids.slice(0, 3).map(id => id + ': ' + JSON.stringify(a[id]) + ' vs ' + JSON.stringify(b[id])).join('; ') + (ids.length > 3 ? ' …' : '');
  }
  return JSON.stringify(a) + ' vs ' + JSON.stringify(b);
}

// a stamp as "<seconds since the start>:<tab that minted it>"
function kisaDamga(t, m) {
  if (typeof m !== 'string') return String(m);
  const yer = m.indexOf(':'), z = Number(m.slice(0, yer)), a = m.slice(yer + 1);
  return ((z - T0) / 1000).toFixed(3) + ':' + (t.aktorSekme[a] || a);
}

/* The trace of a run made with secenek.iz, as lines of text. tam: every key (default: the envelope and
   yds-leitner only). A record is shown as k<box>@<seconds since the start>:<tab that minted the stamp>. */
function izYaz(sonuc, tam) {
  const t = sonuc.t, ids = HAVUZ.concat(YENILER), out = [];
  const kayitMetni = r => (r ? (r.d ? 'deleted' : 'k' + (r.v && r.v.k)) + '@' + kisaDamga(t, r.m) : '-');
  const deger = (k, v) => {
    if (v === null || v === undefined) return '(none)';
    if (k === ZARF) {
      const c = t.zarfCoz(v); if (!c || c.hata) return 'ENVELOPE?';
      const L = ((c.zarf.alanlar || {})['yds-leitner'] || {}).i || {};
      return 'envelope' + (c.b ? '+b' : '') + '{' + ids.filter(id => L[id]).map(id => id + '=' + kayitMetni(L[id])).join(' ') + '}';
    }
    if (k === 'yds-leitner') { let o; try { o = JSON.parse(v); } catch (h) { return '?'; } return 'leitner{' + ids.filter(id => o[id]).map(id => id + '=k' + o[id].k).join(' ') + '}'; }
    return v.length > 40 ? v.slice(0, 37) + '…' : v;
  };
  const dar = k => !tam && k !== ZARF && k !== 'yds-leitner';
  for (const x of sonuc.iz) {
    if (x.ne === 'adim') out.push('step ' + String(x.no).padStart(3) + '  ' + x.e);
    else if (x.ne === 'not') out.push('  -- ' + x.metin);
    else if (x.ne === 'gorev') {
      if (x.tur === 'kullanici') out.push('    ' + x.sekme + ' USER   ' + x.bilgi);
      else if (x.tur === 'acilis') out.push('    ' + x.sekme + ' LOAD   (its boot code runs against its view of the storage)');
      else if (x.tur === 'olay') out.push('    ' + x.sekme + ' EVENT  ' + x.bilgi.k + (dar(x.bilgi.k) ? '' : '  old=' + deger(x.bilgi.k, x.bilgi.eski) + '  new=' + deger(x.bilgi.k, x.bilgi.yeni)) + '   (log #' + x.bilgi.sira + ', written by ' + x.bilgi.sekme.ad + ')');
    } else if (x.ne === 'yaz') {
      if (dar(x.y.k)) continue;
      out.push('        ' + x.sekme + ' writes ' + (x.y.k === ZARF ? '' : x.y.k + ' = ') + deger(x.y.k, x.y.v) + '   (its own view before: ' + deger(x.y.k, x.y.once) + ')' + (x.y.yigin ? '   [' + x.y.yigin.split(' < ').slice(0, 4).join(' < ') + ']' : ''));
    } else if (x.ne === 'damga') {
      out.push('        ' + x.sekme + ' STAMP  ' + (x.d.mesru ? '(user action)' : x.d.sinif === 'yabanci-damga' ? '(USER ACTION, BUT NOT ITS RECORD)' : '(NO USER ACTION)') + ' ' + x.d.alan + '/' + x.d.id + ' = ' + JSON.stringify(x.d.kayit.v || {d: 1}) + ' @' + kisaDamga(t, x.d.m));
    } else if (x.ne === 'kaydet') {
      if (dar(x.g.k)) continue;
      out.push('    browser: log #' + x.g.sira + ' ' + x.sekme + ' ' + (x.g.degisti ? deger(x.g.k, x.g.eski) + '  ->  ' + deger(x.g.k, x.g.yeni) : x.g.k + ' unchanged (acknowledged, no event)') +
        (x.g.degisti && x.g.eski !== x.g.yazim.once ? '   << OVERWRITES a value the writer had not seen (it believed: ' + deger(x.g.k, x.g.yazim.once) + ')' : ''));
    } else if (x.ne === 'teslim') {
      if (dar(x.g.k)) continue;
      out.push('    ' + x.surec + ' observes log #' + x.g.sira + ' (' + x.g.k + ' by ' + x.g.sekme.ad + ')' + (x.kendi ? '  own process: acknowledged' : x.maskeli ? '  NOT applied to its copy: its own write to this key is still unacknowledged' : '') + (x.g.degisti ? '' : '  (no event)'));
    }
  }
  return out;
}

module.exports = {derle, kos, gecmisUret, zamanlamaRng, izYaz, islemMetni, gecmisMetni, HAVUZ, KUTULAR, YENILER, SERT, BILGI};
