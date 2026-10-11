'use strict';
/* Two tabs, one localStorage: the sync store under the schedules a real browser allows.

   Background (2026-10): with a second tab open, an answer could be reverted for good. A tab that merely
   received another tab's write "completed" that write from its own older view, the stale classic key landed
   on top of the writer's next answer, and the writer imported it as a new edit under a fresh stamp (which
   then also won in the cloud). The fix in assets/js/esitleme-depo.js has four rules:
     1. a classic-key storage event never mints a stamp; a stamped record keeps the envelope's value;
     2. the reconciliation at page load follows the same rule;
     3. a tab that brings nothing new does not write: the writer finishes its own transaction;
     4. fields a read merged silently are announced to the page with the next 'sekme'/'bulut' notification.
   yerel-zarf-regresyon-test.js pins these rules one by one on a synchronous store. This test runs the real
   product files on a browser model (iki-sekme-modeli.js: what it assumes about browsers and why, and what
   its oracle checks) and asks only for the outcome: whatever the schedule, no stamp without a user action,
   no reverted or lost write, disk, mirror and every tab agree, every page shows what is on disk, and the
   exchange settles.

   1. Fixed scenarios: the interleavings that were traced in the browser or found by the explorer, as
      explicit schedules. Each is also run without interleaving (the control), which must pass for the
      scenario to be about the race. A tab that only listens must not write while handling storage events.
   2. A seeded sample of random histories and schedules (model.gecmisUret): always the same seeds, so the
      test is deterministic. It runs in short-lived child processes: every history creates several vm
      contexts, and V8 keeps them far longer than the run needs (a first in-process draft of this explorer
      grew to 13 GB). A child handles one chunk and exits; its heap is capped, so a leak fails loudly.

   Not covered, on purpose: a history in which every page that took part in an exchange goes away before
   the exchange has settled (tabs closed, or the last one navigating). localStorage has no compare-and-swap,
   so one tab's envelope write can replace another's that it had not seen yet; the tabs repair that while at
   least one of them stays, and an answer can be lost when none does. Known and accepted.

   Usage: node iki-sekme-yarisi-test.js [tree root] [options]        (default root: two directories up)
     --tohum=<n>[,<n>]   run only these seeds, in this process, and say what each one does
     --senaryo=<n>       run only this fixed scenario
     --iz | --iz=tam     with the two above: the step-by-step trace (envelope and yds-leitner lines | every key)
     --ilk=<n> --adet=<n>   another seed range for the sample (default 1..120)
   Prints one summary line. Exit code 1 when a scenario or a history violates a hard check (the seeds are
   named), 2 when the test itself could not run.
   When it fails:        node tools/test-uretim/iki-sekme-yarisi-test.js --tohum=<seed> --iz
   After changing the store itself, once:  node tools/test-uretim/iki-sekme-yarisi-test.js --adet=3000
   (a few minutes; the fix of 2026-10 was accepted with no hard failure in seeds 1..6000)                     */
const path = require('path'), os = require('os'), cp = require('child_process');
const model = require('./iki-sekme-modeli.js');

/* The sample: seeds ILK .. ILK+ADET-1. A history costs about 90 ms of CPU, almost all of it in the product code,
   and the whole file has to stay well under a minute on a busy machine. */
const ILK = 1, ADET = 120;
/* ... plus the seeds up to 1300 whose history has a page load in the middle of an exchange that used to mint a
   stamp (found by running the seeds against the store without the page-load rule). Such histories are rare
   among random ones (about 2 in 100), so these are added to every run. The choice is tied to the store's
   write pattern of 2026-10: after a change to it they are still valid histories, just no longer chosen ones. */
const ACILIS_TOHUMLARI = [206, 222, 225, 362, 389, 460, 573, 577, 616, 623, 697, 733, 734, 749, 777, 866, 875, 906, 919, 931, 956, 963, 970, 998,
  1022, 1097, 1276, 1300];
const PARCA = 20;                     // histories per child process
const AZAMI_OLAY = 400;               // a history that needs more storage-event deliveries has not settled
const SURE_SINIRI = 240000;           // ms for the default sample; the runner allows 300 s per file. Normal: well under a minute
const sinifla = s => [...new Set(s.ihlal.map(i => i.tur))];
const sertMi = s => s.ihlal.some(i => model.SERT.includes(i.tur));

/* The fixed scenarios. gecmis: the tabs (surec: the renderer process each tab lives in), the timing level and
   the user actions; program: the schedule (labels as in iki-sekme-modeli.js; "c0*" = repeat while possible),
   after which everything still pending is processed in order. dinleyen: tabs that take no action. */
const terfi = (sekme, id) => ({sekme, tur: 'terfi', id});
const SENARYOLAR = [
  {
    ad: 'stale completion: the listening tab finishes answer 1 from what it saw, and that lands after answer 2',
    ne: ['A answers "alfa", then "beta". B has seen only the first of the three writes of answer 1 (the envelope that opens the',
      'transaction) when it handles that event. Before the fix B completed the transaction itself - envelope, classic key,',
      'envelope, all from the state after answer 1 - and the browser processed these writes after A\'s second answer:',
      'yds-leitner went from {beta: k3} back to {beta: k2}, A took that for an edit and stamped beta = k2 afresh.'],
    gecmis: {sekmeSayisi: 2, surec: [0, 1], gec: null, mod: 'siki', islemler: [terfi(0, 'alfa'), terfi(0, 'beta')]},
    program: ['U', 'c0*', 'd1', 'e1', 'U', 'c0*', 'c1*'], dinleyen: ['B']
  },
  {
    ad: 'mixed view: the listening tab overwrites a classic key it can see is newer (the path measured in the browser)',
    ne: ['A answers "alfa", then "beta". Before the fix B closed the transaction of answer 1 with an envelope write of its own;',
      'while that write was unacknowledged B\'s copy ignored A\'s later envelopes but took A\'s classic keys. Handling an old',
      'envelope event, B saw "envelope = my state, yds-leitner differs" and rewrote yds-leitner from its own state.'],
    gecmis: {sekmeSayisi: 2, surec: [0, 1], gec: null, mod: 'gevsek', islemler: [terfi(0, 'alfa'), terfi(0, 'beta')]},
    program: ['U', 'c0*', 'd1x2', 'e1', 'U', 'c0*', 'd1*', 'e1x2', 'c1*'], dinleyen: ['B']
  },
  {
    ad: 'late handling: the listening tab writes nothing stale, it only handles answer 1\'s events after answer 2 is visible',
    ne: ['A answers "gama" wrong (k3 -> k2) and then right (k2 -> k3). B handles the events of the first answer when its copy',
      'already shows the second. Before the fix the classic-key event "gama k3 -> k2" did not match what B expected (k3), so',
      'B imported k2 as an edit under a fresh stamp, and at the next event imported k3 under another.'],
    gecmis: {sekmeSayisi: 2, surec: [0, 1], gec: null, mod: 'aninda', islemler: [{sekme: 0, tur: 'dusur', id: 'gama'}, terfi(0, 'gama')]},
    program: ['U', 'U', 'd1*', 'e1*'], dinleyen: ['B']
  },
  {
    ad: 'one renderer process: two tabs that share a process change a setting one after the other',
    ne: ['B sets the daily goal to 77, a second later A sets it to 55. Both live in one renderer process, so A already sees 77',
      'when it writes; the storage event of B\'s write reaches A only afterwards. Before the fix A found 77 in that event,',
      'expected 55 and imported 77 as an edit under a fresh stamp: the goal ended as 77.'],
    gecmis: {sekmeSayisi: 2, surec: [0, 0], gec: null, mod: 'gevsek', islemler: [{sekme: 1, tur: 'ayar', deger: 77}, {sekme: 0, tur: 'ayar', deger: 55}]},
    program: ['U', 'U'], dinleyen: []
  },
  {
    ad: 'window closed right after the listening tab\'s turn: the second answer must be on disk at the next visit',
    ne: ['As the first scenario, but A is closed as soon as B had its chance to write, and B after it. Before the fix B\'s',
      'three stale writes had put envelope and yds-leitner back to the state after answer 1, and with nobody left to repair',
      'that, the next visit (tab Z) found a consistent disk without the second answer.'],
    gecmis: {sekmeSayisi: 2, surec: [0, 1], gec: null, mod: 'siki', islemler: [terfi(0, 'alfa'), terfi(0, 'beta'), {sekme: 0, tur: 'kapat'}, {sekme: 1, tur: 'kapat'}]},
    program: ['U', 'c0*', 'd1', 'e1', 'U', 'c0*', 'c1*', 'U', 'U'], dinleyen: ['B']
  },
  {
    ad: 'silent merge: the listening tab reads the second write while it handles the events of the first',
    ne: ['A changes the daily goal, then answers "gama" (k3 -> k4). B handles the goal\'s envelope event; when it handles the',
      'goal\'s classic-key event its copy already holds the envelope of the answer, and the read inside that handler merges',
      'it without telling the page. Before the fix the answer\'s own events then found nothing changed, no',
      '"yds-depo-degisti" fired, and B\'s page went on showing gama in box 3.'],
    gecmis: {sekmeSayisi: 2, surec: [0, 1], gec: null, mod: 'aninda', islemler: [{sekme: 0, tur: 'ayar', deger: 55}, terfi(0, 'gama')]},
    program: ['U', 'd1', 'e1', 'U', 'd1*', 'e1*'], dinleyen: ['B']
  },
  {
    ad: 'page load beside a foreign mirror: a tab reloads while its copy holds its own envelope and the other tab\'s classic key',
    ne: ['B answers "epsilon" (k2 -> k3); A, which has not seen that yet, answers "gama" (k3 -> k4), so A\'s yds-leitner still says',
      'epsilon k2. B\'s copy ignores A\'s envelope (B\'s own envelope writes are unacknowledged) but takes A\'s yds-leitner.',
      'Then B navigates: the new page finds its own committed envelope next to a classic key that differs in two cards.',
      'Before the fix the page-load reconciliation imported both as edits of a pre-envelope tab: epsilon went back to k2',
      'under a fresh stamp - B\'s own answer reverted for good - and gama k4 got a stamp nobody\'s answer had minted.'],
    gecmis: {sekmeSayisi: 2, surec: [0, 1], gec: null, mod: 'siki', islemler: [terfi(1, 'epsilon'), terfi(0, 'gama'), {sekme: 1, tur: 'yenile'}]},
    program: ['U', 'c1', 'c1', 'c1', 'U', 'c0', 'c1', 'c0', 'c1', 'c1', 'U'], dinleyen: []
  }
];

function gecmisYaz(g, program) {
  const satir = ['   ' + model.gecmisMetni(g) + '; initial records: ' + model.HAVUZ.map((id, i) => id + ' k' + model.KUTULAR[i]).join(', ')];
  g.islemler.forEach((o, j) => satir.push('   action ' + (j + 1) + ': ' + model.islemMetni(o)));
  if (program) satir.push('   schedule: ' + program.join(' ') + '  (then everything pending, in order)');
  return satir;
}

/* Runs one fixed scenario; hata: what went wrong (empty = passed), cikti: the lines to print about it. */
function senaryoKos(betikler, sn, no, izAcik) {
  const hata = [];
  const kontrol = model.kos(betikler, sn.gecmis, {senkron: true, azamiOlay: AZAMI_OLAY});
  kontrol.ihlal.filter(x => model.SERT.includes(x.tur)).forEach(x => hata.push('control without interleaving: [' + x.tur + '] ' + x.metin));
  const s = model.kos(betikler, sn.gecmis, {program: sn.program, azamiOlay: AZAMI_OLAY, iz: izAcik});
  s.ihlal.filter(x => model.SERT.includes(x.tur)).forEach(x => hata.push('[' + x.tur + '] ' + x.metin));
  sn.dinleyen.forEach(ad => { if (s.olayYazimi[ad]) hata.push('[dinleyen-yazdi] tab ' + ad + ', which only listens, wrote ' + s.olayYazimi[ad] + ' time(s) while handling storage events (a tab that brings nothing new must not write)'); });
  const cikti = ['scenario ' + no + ': ' + sn.ad].concat(sn.ne.map(l => '   ' + l), gecmisYaz(sn.gecmis, sn.program), hata.map(h => '   FAIL ' + h));
  if (izAcik) model.izYaz(s, izAcik === 'tam').forEach(l => cikti.push('     ' + l));
  return {hata, cikti};
}

function tohumKos(betikler, tohum, izAcik) {
  const g = model.gecmisUret(tohum);
  // without a trace a history stops at its first unaccounted stamp, as in the sample: it has failed already
  return {g, s: model.kos(betikler, g, {rng: model.zamanlamaRng(tohum), erkenDur: !izAcik, azamiOlay: AZAMI_OLAY, iz: izAcik})};
}

if (process.argv.includes('--isci')) {
  /* child process: one chunk of seeds, then exit */
  process.on('disconnect', () => process.exit(1));          // the parent is gone: do not linger
  process.on('message', a => {
    const betikler = model.derle(a.kok), out = [];
    for (const tohum of a.tohumlar) {
      const {s} = tohumKos(betikler, tohum, false);
      const sert = s.ihlal.find(i => model.SERT.includes(i.tur));
      out.push({tohum, sn: sinifla(s), ilk: sert ? '[' + sert.tur + '] ' + sert.metin : null, olay: s.olay});
      if (out.length % 10 === 0 && global.gc) global.gc();
    }
    process.send({out, rss: process.memoryUsage().rss}, () => process.exit(0));
  });
} else {
  const arg = process.argv.slice(2), deger = ad => { const b = arg.find(x => x.startsWith('--' + ad + '=')); return b ? b.slice(ad.length + 3) : null; };
  const kok = arg[0] && !arg[0].startsWith('--') ? path.resolve(arg[0]) : path.resolve(__dirname, '../..');
  const izAcik = arg.includes('--iz') ? true : deger('iz') === 'tam' ? 'tam' : false;
  const basla = Date.now();
  let betikler;
  try { betikler = model.derle(kok); } catch (h) { console.error('iki-sekme-yarisi: ' + String(h && h.message || h)); process.exit(2); }

  if (deger('tohum') || deger('senaryo')) {
    /* one scenario or a few seeds, in this process, described in full */
    let kotu = 0;
    if (deger('senaryo')) {
      const no = Number(deger('senaryo')), sn = SENARYOLAR[no - 1];
      if (!sn) { console.error('--senaryo: 1..' + SENARYOLAR.length); process.exit(2); }
      const r = senaryoKos(betikler, sn, no, izAcik);
      r.cikti.forEach(l => console.log(l));
      if (r.hata.length) kotu++; else console.log('   ok');
    }
    for (const tohum of (deger('tohum') || '').split(',').filter(Boolean).map(Number)) {
      const {g, s} = tohumKos(betikler, tohum, izAcik);
      console.log('seed ' + tohum + ': ' + s.olay + ' storage events, ' + s.yazim + ' writes' + (s.erken ? ' (stopped at the first stamp no user action accounts for; --iz runs it to the end)' : ''));
      gecmisYaz(g).forEach(l => console.log(l));
      s.ihlal.forEach(i => console.log('   ' + (model.SERT.includes(i.tur) ? 'FAIL' : 'info') + ' [' + i.tur + '] ' + i.metin));
      if (izAcik) model.izYaz(s, izAcik === 'tam').forEach(l => console.log('     ' + l));
      if (sertMi(s)) kotu++; else console.log('   ok');
    }
    process.exit(kotu ? 1 : 0);
  }

  /* 1. the fixed scenarios */
  const hatalar = [];
  let senaryoKotu = 0;
  SENARYOLAR.forEach((sn, i) => { const r = senaryoKos(betikler, sn, i + 1, false); if (r.hata.length) { senaryoKotu++; r.cikti.forEach(l => hatalar.push(l)); } });

  /* 2. the seeded sample, in child processes */
  const ilk = Number(deger('ilk') || ILK), adet = Number(deger('adet') || ADET);
  if (!(ilk >= 0) || !(adet >= 1)) { console.error('--ilk / --adet'); process.exit(2); }
  const tohumlar = [];
  for (let i = 0; i < adet; i++) tohumlar.push(ilk + i);
  const ekler = ACILIS_TOHUMLARI.filter(t => !tohumlar.includes(t));
  const hepsi = tohumlar.concat(ekler), isler = [];
  for (let i = 0; i < hepsi.length; i += PARCA) isler.push(hepsi.slice(i, i + PARCA));
  const W = Math.max(1, Math.min(8, os.cpus().length - 2, isler.length));
  const sonuclar = [], cocuklar = new Set(), yinelenen = new Set();   // yinelenen: chunks given to a second child (see ilerle)
  let sirada = 0, bitti = false, enRss = 0;
  const hepsiniOldur = () => { for (const c of cocuklar) { try { c.kill(); } catch (h) { /* already gone */ } } cocuklar.clear(); };
  const hataylaBit = h => { if (bitti) return; bitti = true; hepsiniOldur(); console.error('iki-sekme-yarisi: ' + String(h && h.stack || h)); process.exit(2); };
  const sinir = Math.max(SURE_SINIRI, hepsi.length * 500);            // a larger sample (--adet) gets half a second per history
  const saat = setTimeout(() => hataylaBit(new Error('not finished after ' + sinir / 1000 + ' s (' + sonuclar.length + ' of ' + hepsi.length + ' histories done)')), sinir);
  process.on('exit', hepsiniOldur);
  const ozet = () => {
    clearTimeout(saat);
    sonuclar.sort((x, y) => x.tohum - y.tohum);
    const kotu = sonuclar.filter(r => r.ilk), bilgi = {};
    sonuclar.forEach(r => r.sn.filter(x => model.BILGI.includes(x)).forEach(x => { bilgi[x] = (bilgi[x] || 0) + 1; }));
    const olaylar = sonuclar.map(r => r.olay).sort((x, y) => x - y);
    kotu.slice(0, 5).forEach(r => {
      hatalar.push('seed ' + r.tohum + ': ' + r.sn.filter(x => model.SERT.includes(x)).join(', '));
      hatalar.push('   FAIL ' + r.ilk);
      hatalar.push('   more: node tools/test-uretim/iki-sekme-yarisi-test.js --tohum=' + r.tohum + ' --iz');
    });
    hatalar.forEach(l => console.error(l));
    const basarisiz = senaryoKotu || kotu.length;
    console.log('iki-sekme-yarisi ' + (basarisiz ? 'FAIL' : 'PASS') + ': ' + (SENARYOLAR.length - senaryoKotu) + '/' + SENARYOLAR.length + ' scenarios ok; ' +
      sonuclar.length + ' histories (seeds ' + ilk + '..' + (ilk + adet - 1) + ' and ' + ekler.length + ' page-load seeds), ' +
      (kotu.length ? kotu.length + ' with a hard failure: seeds ' + kotu.slice(0, 20).map(r => r.tohum).join(' ') + (kotu.length > 20 ? ' …' : '') : 'no hard failure') +
      '; storage events per history median ' + olaylar[olaylar.length >> 1] + ', max ' + olaylar[olaylar.length - 1] +
      '; info ' + (model.BILGI.map(x => x + ' ' + (bilgi[x] || 0)).join(', ')) +
      '; ' + ((Date.now() - basla) / 1000).toFixed(1) + ' s, ' + W + ' child processes at a time, largest ' + Math.round(enRss / 1048576) + ' MB' +
      (yinelenen.size ? '; ' + yinelenen.size + ' chunk(s) of seeds run twice because a child process died' : ''));
    process.exit(basarisiz ? 1 : 0);
  };
  /* A child that ends without a result was killed from outside or could not be started (a machine short of
     memory). The store cannot end it that way: an exception inside a history is caught and reported as the hard
     class "hata". Its chunk is run once more in a new child and the summary line says so; a chunk that fails
     twice ends the test (exit 2), so a child that hits its heap cap still fails loudly. */
  const ilerle = () => {
    if (bitti) return;
    while (cocuklar.size < W && sirada < isler.length) {
      const is = isler[sirada++];
      let c = null, geldi = false, kapandi = false;
      const kapan = neden => {                 // this child is gone, whatever the reason
        if (kapandi || bitti) return;
        kapandi = true;
        if (c) { cocuklar.delete(c); try { c.kill(); } catch (h) { /* already gone */ } }
        if (!geldi) {
          if (yinelenen.has(is)) return hataylaBit(new Error('a child process ended without a result twice (' + neden + '; seeds ' + is[0] + '..' + is[is.length - 1] + ')'));
          yinelenen.add(is); isler.push(is);
        }
        ilerle();
      };
      try {
        c = cp.fork(__filename, ['--isci'], {execArgv: ['--expose-gc', '--max-old-space-size=1024']});
        cocuklar.add(c);
        c.on('message', m => { geldi = true; for (const r of m.out) sonuclar.push(r); if (m.rss > enRss) enRss = m.rss; });
        c.on('error', h => kapan(String(h && h.message || h)));
        c.on('exit', (kod, sinyal) => kapan('exit ' + kod + (sinyal ? ', signal ' + sinyal : '')));
        c.send({kok, tohumlar: is});
      } catch (h) { kapan(String(h && h.message || h)); }
    }
    if (!cocuklar.size && sirada >= isler.length) { bitti = true; ozet(); }
  };
  ilerle();
}
