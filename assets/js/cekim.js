/* ============================================================
   Çekim motoru — kelime testinin şıklarını doğru biçime sokar

   Test cümlesinde boşluğa gelen biçim çekimliyse (prompted, cities,
   undergoing) çeldiriciler de aynı çekimle gösterilmeli; yoksa biçim
   uyumu doğru cevabı ele verir. Bu modül sözlük biçiminden istenen
   biçimi üretir:

     cek('adopt', 'past')  -> 'adopted'
     cek('take', 'pp')     -> 'taken'
     cek('carry', 's')     -> 'carries'
     cek('analysis', 'pl') -> 'analyses'
     cek('refer', 'ing')   -> 'referring'

   Biçimler: '' (sözlük), 's', 'past', 'pp', 'ing', 'pl'.
   Düzensiz fiil ve isimler tabloda; önekli türevler (undertake,
   withstand) tablodaki köke indirgenir. Üretilemeyen biçim için null
   döner; test o çeldiriciyi kullanmaz.
   ============================================================ */
(function () {
  'use strict';

  /* kök: [geçmiş, 3. hal] — aynıysa tek yazılır */
  var DUZENSIZ_FIIL = {
    arise: ['arose', 'arisen'], awake: ['awoke', 'awoken'], be: ['was', 'been'],
    bear: ['bore', 'borne'], beat: ['beat', 'beaten'], become: ['became', 'become'],
    begin: ['began', 'begun'], bend: ['bent'], bet: ['bet'], bid: ['bid'],
    bind: ['bound'], bite: ['bit', 'bitten'], bleed: ['bled'], blow: ['blew', 'blown'],
    break: ['broke', 'broken'], breed: ['bred'], bring: ['brought'], broadcast: ['broadcast'],
    build: ['built'], burn: ['burned'], burst: ['burst'], buy: ['bought'], cast: ['cast'],
    catch: ['caught'], choose: ['chose', 'chosen'], cling: ['clung'], come: ['came', 'come'],
    cost: ['cost'], creep: ['crept'], cut: ['cut'], deal: ['dealt'], dig: ['dug'],
    do: ['did', 'done'], draw: ['drew', 'drawn'], drink: ['drank', 'drunk'],
    drive: ['drove', 'driven'], dwell: ['dwelt'], eat: ['ate', 'eaten'], fall: ['fell', 'fallen'],
    feed: ['fed'], feel: ['felt'], fight: ['fought'], find: ['found'], flee: ['fled'],
    fling: ['flung'], fly: ['flew', 'flown'], forbid: ['forbade', 'forbidden'],
    forecast: ['forecast'], forget: ['forgot', 'forgotten'], forgive: ['forgave', 'forgiven'],
    forgo: ['forwent', 'forgone'], freeze: ['froze', 'frozen'], get: ['got'],
    give: ['gave', 'given'], go: ['went', 'gone'], grind: ['ground'], grow: ['grew', 'grown'],
    hang: ['hung'], have: ['had'], hear: ['heard'], hide: ['hid', 'hidden'], hit: ['hit'],
    hold: ['held'], hurt: ['hurt'], keep: ['kept'], kneel: ['knelt'], know: ['knew', 'known'],
    lay: ['laid'], lead: ['led'], lean: ['leaned'], leap: ['leapt'], learn: ['learned'],
    leave: ['left'], lend: ['lent'], let: ['let'], lie: ['lay', 'lain'], light: ['lit'],
    lose: ['lost'], make: ['made'], mean: ['meant'], meet: ['met'], pay: ['paid'],
    prove: ['proved', 'proven'], put: ['put'], quit: ['quit'], read: ['read'], rid: ['rid'],
    ride: ['rode', 'ridden'], ring: ['rang', 'rung'], rise: ['rose', 'risen'], run: ['ran', 'run'],
    say: ['said'], see: ['saw', 'seen'], seek: ['sought'], sell: ['sold'], send: ['sent'],
    set: ['set'], shake: ['shook', 'shaken'], shed: ['shed'], shine: ['shone'], shoot: ['shot'],
    show: ['showed', 'shown'], shrink: ['shrank', 'shrunk'], shut: ['shut'],
    sing: ['sang', 'sung'], sink: ['sank', 'sunk'], sit: ['sat'], sleep: ['slept'],
    slide: ['slid'], speak: ['spoke', 'spoken'], speed: ['sped'], spend: ['spent'],
    spin: ['spun'], spit: ['spat'], split: ['split'], spread: ['spread'], spring: ['sprang', 'sprung'],
    stand: ['stood'], steal: ['stole', 'stolen'], stick: ['stuck'], sting: ['stung'],
    strike: ['struck'], strive: ['strove', 'striven'], swear: ['swore', 'sworn'],
    sweep: ['swept'], swell: ['swelled', 'swollen'], swim: ['swam', 'swum'], swing: ['swung'],
    take: ['took', 'taken'], teach: ['taught'], tear: ['tore', 'torn'], tell: ['told'],
    think: ['thought'], throw: ['threw', 'thrown'], thrust: ['thrust'], tread: ['trod', 'trodden'],
    wake: ['woke', 'woken'], wear: ['wore', 'worn'], weave: ['wove', 'woven'], weep: ['wept'],
    win: ['won'], wind: ['wound'], withdraw: ['withdrew', 'withdrawn'], withhold: ['withheld'],
    withstand: ['withstood'], wring: ['wrung'], write: ['wrote', 'written']
  };

  /* Kökü tabloda olan önekli fiiller (undertake -> take). */
  var ONEKLER = ['under', 'over', 'out', 'mis', 're', 'un', 'fore', 'with', 'up', 'be', 'inter'];

  var DUZENSIZ_ISIM = {
    child: 'children', man: 'men', woman: 'women', person: 'people', foot: 'feet',
    tooth: 'teeth', mouse: 'mice', goose: 'geese', ox: 'oxen', louse: 'lice',
    criterion: 'criteria', phenomenon: 'phenomena', analysis: 'analyses', crisis: 'crises',
    thesis: 'theses', hypothesis: 'hypotheses', basis: 'bases', diagnosis: 'diagnoses',
    emphasis: 'emphases', oasis: 'oases', synthesis: 'syntheses', axis: 'axes',
    datum: 'data', medium: 'media', bacterium: 'bacteria', curriculum: 'curricula',
    memorandum: 'memoranda', stratum: 'strata', stimulus: 'stimuli', fungus: 'fungi',
    nucleus: 'nuclei', radius: 'radii', alumnus: 'alumni', syllabus: 'syllabi',
    index: 'indices', appendix: 'appendices', matrix: 'matrices', vertex: 'vertices',
    formula: 'formulae', larva: 'larvae', vertebra: 'vertebrae',
    sheep: 'sheep', fish: 'fish', species: 'species', series: 'series', means: 'means',
    deer: 'deer', aircraft: 'aircraft', offspring: 'offspring', headquarters: 'headquarters',
    life: 'lives', knife: 'knives', wife: 'wives', leaf: 'leaves', half: 'halves',
    wolf: 'wolves', shelf: 'shelves', self: 'selves', calf: 'calves', loaf: 'loaves',
    thief: 'thieves', elf: 'elves'
  };

  /* Sayılamayan ya da çoğulu kullanılmayan isimler: 'pl' üretilmez. */
  var SAYILMAZ = {
    information: 1, advice: 1, research: 1, equipment: 1, evidence: 1, furniture: 1,
    knowledge: 1, luggage: 1, news: 1, progress: 1, traffic: 1, weather: 1, money: 1,
    homework: 1, software: 1, hardware: 1, machinery: 1, behaviour: 1, behavior: 1,
    health: 1, wealth: 1, poverty: 1, literacy: 1, access: 1, feedback: 1, legislation: 1
  };

  /* Son hece vurgulu olduğu için son ünsüzü ikileyen çok heceli fiiller. */
  var IKILE = {
    admit: 1, commit: 1, omit: 1, permit: 1, submit: 1, transmit: 1, emit: 1, remit: 1,
    begin: 1, forget: 1, regret: 1, upset: 1, occur: 1, incur: 1, concur: 1, recur: 1,
    prefer: 1, refer: 1, defer: 1, confer: 1, infer: 1, deter: 1, transfer: 1,
    control: 1, patrol: 1, enrol: 1, compel: 1, propel: 1, expel: 1, dispel: 1, rebel: 1,
    excel: 1, repel: 1, equip: 1, acquit: 1, allot: 1, format: 1, kidnap: 1, handicap: 1,
    program: 1, worship: 1, unwrap: 1, outwit: 1, forbid: 1, beset: 1, abet: 1,
    travel: 1, label: 1, model: 1, cancel: 1, channel: 1, fuel: 1, level: 1, quarrel: 1,
    signal: 1, total: 1, marvel: 1, counsel: 1, tunnel: 1, rival: 1, equal: 1
  };

  var UNLU = /[aeiou]/;

  function unluSayisi(s) {
    var m = s.match(/[aeiouy]+/g);
    return m ? m.length : 0;
  }

  /* Tek heceli ünsüz-ünlü-ünsüz (stop, plan) ya da listede: son harfi ikile. */
  function ikilenirMi(k) {
    if (IKILE[k]) return true;
    if (k.length < 3) return false;
    var son = k.charAt(k.length - 1), orta = k.charAt(k.length - 2), bas = k.charAt(k.length - 3);
    if (!/[bcdfgklmnprstvz]/.test(son)) return false;       // w, x, y ikilenmez
    if (!UNLU.test(orta) || UNLU.test(bas)) return false;   // tek ünlü olmalı (plan ✓, plain ✗)
    return unluSayisi(k) === 1;
  }

  function ucuncuTekil(k) {
    if (/(s|x|z|ch|sh)$/.test(k)) return k + 'es';
    if (/[^aeiou]y$/.test(k)) return k.slice(0, -1) + 'ies';
    if (/[^aeiou]o$/.test(k)) return k + 'es';                // go, do, echo, veto
    return k + 's';
  }

  function duzenliGecmis(k) {
    if (/e$/.test(k)) return k + 'd';
    if (/[^aeiou]y$/.test(k)) return k.slice(0, -1) + 'ied';
    if (ikilenirMi(k)) return k + k.charAt(k.length - 1) + 'ed';
    return k + 'ed';
  }

  function ingHali(k) {
    if (/ie$/.test(k)) return k.slice(0, -2) + 'ying';         // die, lie, tie
    if (/[^eoy]e$/.test(k)) return k.slice(0, -1) + 'ing';     // make -> making; see, agree, dye kalır
    if (ikilenirMi(k)) return k + k.charAt(k.length - 1) + 'ing';
    return k + 'ing';
  }

  function duzensizFiil(k) {
    if (DUZENSIZ_FIIL[k]) return DUZENSIZ_FIIL[k];
    for (var i = 0; i < ONEKLER.length; i++) {
      var on = ONEKLER[i];
      if (k.length > on.length + 2 && k.indexOf(on) === 0) {
        var kok = duzensizFiil(k.slice(on.length));          // misunderstand -> understand -> stand
        if (kok) return kok.map(function (b) { return on + b; });
      }
    }
    return null;
  }

  function cogul(k) {
    if (SAYILMAZ[k]) return null;
    if (DUZENSIZ_ISIM[k]) return DUZENSIZ_ISIM[k];
    if (/(s|x|z|ch|sh)$/.test(k)) return k + 'es';
    if (/[^aeiou]y$/.test(k)) return k.slice(0, -1) + 'ies';
    if (/[^aeiou]o$/.test(k) && !/(photo|piano|radio|video|memo|logo|kilo|zero|solo)$/.test(k)) return k + 'es';
    return k + 's';
  }

  /* Tek kelimelik sözlük biçimini istenen biçime çevirir; üretilemezse null. */
  function cek(kelime, bicim) {
    var k = String(kelime || '').toLowerCase();
    if (!k || /[^a-z]/.test(k)) return bicim ? null : k;   // "give up" gibi çok kelimeliler çekilmez
    var d;
    switch (bicim || '') {
      case '': return k;
      case 's': return ucuncuTekil(k);
      case 'pl': return cogul(k);
      case 'past':
        d = duzensizFiil(k);
        return d ? d[0] : duzenliGecmis(k);
      case 'pp':
        d = duzensizFiil(k);
        return d ? (d[1] || d[0]) : duzenliGecmis(k);
      case 'ing': return ingHali(k);
      default: return null;
    }
  }

  /* Verilen biçim bu kelimeden üretilebiliyor mu? (Veri doğrulaması için.) */
  function uyarMi(kelime, bicim, hedef) {
    var k = String(kelime || '').toLowerCase();
    if (/[^a-z]/.test(k)) {                       // have-not, give up: yalnız basit ekler
      return hedef === k || ((bicim === 's' || bicim === 'pl') && (hedef === k + 's' || hedef === k + 'es'));
    }
    var u = cek(k, bicim);
    if (u === null) return false;
    if (u === hedef) return true;
    // İngiliz/Amerikan ikileme farkı: travelled / traveled, fuelling / fueling
    if (/l$/.test(k) && IKILE[k]) {
      if ((bicim === 'past' || bicim === 'pp') && hedef === k + 'ed') return true;
      if (bicim === 'ing' && hedef === k + 'ing') return true;
    }
    // Düzensiz fiilde ikinci/üçüncü hal farklı yazılabilir (learned/learnt, proved/proven)
    if (bicim !== 'past' && bicim !== 'pp') return false;
    var d = duzensizFiil(kelime);
    if (d) return d.indexOf(hedef) !== -1 || hedef === duzenliGecmis(kelime);   // burned/burnt, proved/proven
    // learnt, dreamt, spelt gibi -t biçimleri
    return /[^aeiou]t$/.test(hedef) && duzenliGecmis(kelime) === hedef.slice(0, -1) + 'ed';
  }

  window.YDS = window.YDS || {};
  window.YDS.Cekim = { cek: cek, uyarMi: uyarMi, duzensizFiil: duzensizFiil };
})();
