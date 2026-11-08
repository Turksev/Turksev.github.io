/* Salt okunur istatistik modeli: mevcut ilerleme verisini değiştirmez. */
(function () {
  'use strict';
  var YDS = window.YDS = window.YDS || {};
  var DAY = 86400000, FIELDS = ['t', 'y', 'd', 'm', 'z', 'n', 'b'];
  function number(n) { return Number.isSafeInteger(n) && n >= 0 ? n : 0; }
  function empty() { return {t:0,y:0,d:0,m:0,z:0,n:0,b:0}; }
  function weekday(g) { return (new Date(g * DAY).getUTCDay() + 6) % 7; }
  function calendarDay(d) { return Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/DAY; }
  function create(raw, cards, today, calendar) {
    var days = Object.create(null), traces = Object.create(null), first = null;
    var storedToday=today, unknown=Object.create(null), converted=Object.create(null), unresolved=0;
    var decode=calendar && calendar.decode;
    if (decode) today=calendarDay(calendar.today);
    function convert(g) {
      if (!decode) return g;
      if (!Object.prototype.hasOwnProperty.call(converted,g)) {
        var d=decode(g);converted[g]=d?calendarDay(d):null;
      }
      return converted[g];
    }
    Object.keys(raw || {}).forEach(function (key) {
      var g = Number(key), row = raw[key];
      if (!/^\d+$/.test(key) || !Number.isSafeInteger(g) || g < 0 || g > storedToday || !row || typeof row !== 'object' || Array.isArray(row)) return;
      var stored=g;g=convert(g);
      if (g===null) {
        unresolved++;
        for(var i=0;i<=1;i++) {
          var base=new Date((stored+i)*DAY),candidate=new Date(base.getUTCFullYear(),base.getUTCMonth(),base.getUTCDate(),12);
          if(!calendar.encode || calendar.encode(candidate)===stored)unknown[stored+i]=true;
        }
        return;
      }
      if (g>today) return;
      days[g] = empty();
      FIELDS.forEach(function (f) { days[g][f] = number(row[f]); });
      if (first === null || g < first) first = g;
    });
    Object.keys(cards || {}).forEach(function (id) {
      var g = cards[id] && cards[id].c;
      if (!Number.isSafeInteger(g) || g < 0 || g > storedToday) return;
      g=convert(g);
      if (g===null || g>today || (first !== null && g >= first)) return;
      traces[g] = (traces[g] || 0) + 1;
    });
    return {days:days,traces:traces,first:first,today:today,unknown:unknown,unresolved:unresolved};
  }
  function known(m,g) { return m.first!==null && g>=m.first && g<=m.today && !m.unknown[g]; }
  function day(m, g) { return m.days[g] || empty(); }
  function sum(m, start, end) {
    var total = empty();
    for (var g = start; g <= Math.min(end,m.today); g++) {
      if(m.unknown[g])continue;
      FIELDS.forEach(function (f) { total[f] += day(m,g)[f]; });
    }
    return total;
  }
  function observed(m, start, end) {
    if (m.first===null) return 0;
    var count=0;
    for(var g=Math.max(start,m.first);g<=Math.min(end,m.today);g++)if(known(m,g))count++;
    return count;
  }
  function average(m, end, length) {
    var n = observed(m,end-length+1,end);
    return n ? sum(m,end-length+1,end).t / n : null;
  }
  function period(m, length) {
    if ([1,7,30,90].indexOf(length) === -1) length = 30;
    var start = m.today-length+1, total = sum(m,start,m.today), days = observed(m,start,m.today);
    var previous = sum(m,start-length,start-1), complete = days === length && observed(m,start-length,start-1) === length;
    var active = 0, answerDays = 0, best = null, inconsistent = false;
    for (var g = Math.max(start,m.first === null ? m.today+1:m.first); g <= m.today; g++) {
      if(!known(m,g))continue;
      var row = day(m,g);
      if (row.t > 0) active++;
      if (row.t > 0) answerDays++;
      // Yeni n/b ayrı ölçülür; eski cihaz sayaçlarının eksikliği bu oranı bozmaz.
      if (row.b > row.n) inconsistent = true;
      if (row.t && (!best || row.t > best.t)) best = {g:g,t:row.t};
    }
    var speed = days ? total.t/days : null;
    var delta = complete ? speed - previous.t/length : null;
    return {start:start,length:length,total:total,observed:days,active:active,answerDays:answerDays,best:best,speed:speed,
      previous:previous,delta:delta,percent:complete && previous.t>0 ? (total.t-previous.t)/previous.t*100:null,
      accuracy:total.n && !inconsistent ? total.b/total.n*100:null,inconsistent:inconsistent,legacy:Math.max(0,total.t-total.n),
      activeSpeed:answerDays ? total.t/answerDays:null};
  }
  function streak(m) {
    function active(g) { var r=day(m,g); return known(m,g)&&r.t>0; }
    if (m.first===null) return {current:0,longest:0};
    var g=active(m.today)?m.today:m.today-1, current=0, longest=0, n=0;
    while (g>=m.first && active(g)) {current++;g--;}
    for (g=m.first;g<=m.today;g++) { n=active(g)?n+1:0; longest=Math.max(longest,n); }
    return {current:current,longest:longest};
  }
  function weeks(m) {
    var monday=m.today-weekday(m.today), items=[];
    for (var i=11;i>=0;i--) {
      var start=monday-i*7, end=Math.min(start+6,m.today);
      items.push({start:start,end:end,total:sum(m,start,end).t,observed:observed(m,start,end),ongoing:i===0});
    }
    var elapsed=weekday(m.today)+1, earlier=monday-7;
    var comparable=observed(m,monday,m.today)===elapsed && observed(m,earlier,earlier+elapsed-1)===elapsed;
    return {items:items,elapsed:elapsed,current:sum(m,monday,m.today).t,previous:sum(m,earlier,earlier+elapsed-1).t,comparable:comparable};
  }
  function plan(remaining, pace) {
    if (!Number.isInteger(pace) || pace<1 || pace>1000) return null;
    return Math.ceil(Math.max(0,remaining)/pace);
  }
  // Ayrıntılı olaylardan yalnız mevcut sözlük kelimeleri. Günlük toplamlar,
  // vade tarihi ve eski son-çalışma izi geçmiş olay üretmek için kullanılmaz.
  function history(raw, dictionary, today, decodeIdentity) {
    raw=raw||{};
    var catalog=Object.create(null), words=Object.create(null), seen=Object.create(null), events=[], partial=!!raw.partial;
    (dictionary||[]).forEach(function(item){if(item && typeof item.e==='string')catalog[item.e]=true;});
    function name(row) {
      if(!row || row.kind!=='kelime' || typeof row.card!=='string')return null;
      var decoded;try{decoded=decodeIdentity?decodeIdentity(row.card):{ad:row.card};}catch(error){partial=true;return null;}
      if(decoded&&decoded.tur&&decoded.tur!=='kelime')return null;
      var word=decoded&&decoded.ad;
      return typeof word==='string' && catalog[word]?word:null;
    }
    function stamp(value){return Number.isSafeInteger(value)&&value>=0&&Number.isFinite(new Date(value).getTime());}
    function box(value){return Number.isInteger(value)&&value>=0&&value<=5;}
    function ensure(word){if(!words[word])words[word]={word:word,events:[],total:0,drops:0,pruned:0,firstAt:null,lastAt:null,aggregate:false};return words[word];}
    (Array.isArray(raw.cards)?raw.cards:[]).forEach(function(row){
      var word=name(row);if(!word)return;
      if(![row.total,row.drops,row.pruned].every(function(v){return Number.isSafeInteger(v)&&v>=0;}) || row.drops>row.total || row.pruned>row.total){partial=true;return;}
      if(stamp(row.lastAt)&&calendarDay(new Date(row.lastAt))>today){partial=true;return;}
      var w=ensure(word);w.aggregate=true;w.total+=row.total;w.drops+=row.drops;w.pruned+=row.pruned;
      if(stamp(row.firstAt))w.firstAt=w.firstAt===null?row.firstAt:Math.min(w.firstAt,row.firstAt);
      if(stamp(row.lastAt))w.lastAt=w.lastAt===null?row.lastAt:Math.max(w.lastAt,row.lastAt);
    });
    (Array.isArray(raw.events)?raw.events:[]).forEach(function(row){
      var word=name(row);if(!word)return;
      if(typeof row.id!=='string'||!row.id||!stamp(row.at)||!box(row.from)||!box(row.to)||['bildim','bilemedim','zaten','sifirla'].indexOf(row.result)===-1){partial=true;return;}
      if(seen[row.id])return;seen[row.id]=true;
      var day=calendarDay(new Date(row.at));if(day>today)return;
      var previous=stamp(row.previousAt)&&row.previousAt<=row.at?row.previousAt:null;
      if(row.previousAt!==null && row.previousAt!==undefined && previous===null)partial=true;
      var recall=row.result!=='sifirla' && previous!==null;
      var e={id:row.id,word:word,card:row.card,at:row.at,day:day,result:row.result,from:row.from,to:row.to,
        previousAt:previous,elapsedDays:previous===null?null:Math.floor((row.at-previous)/DAY),recall:recall,
        drop:row.result==='bilemedim'&&row.to<row.from,source:row.source};
      var w=ensure(word);events.push(e);w.events.push(e);
      if(!w.aggregate){w.total++;if(e.drop)w.drops++;}
      w.firstAt=w.firstAt===null?row.at:Math.min(w.firstAt,row.at);w.lastAt=w.lastAt===null?row.at:Math.max(w.lastAt,row.at);
    });
    function order(a,b){return a.at-b.at||a.id.localeCompare(b.id);}
    events.sort(order);
    var first=null,pruned=0;
    Object.keys(words).forEach(function(word){var w=words[word];w.events.sort(order);pruned+=w.pruned;
      if(w.firstAt!==null)first=first===null?w.firstAt:Math.min(first,w.firstAt);});
    return {available:raw.available===true,partial:partial,truncated:!!raw.truncated||pruned>0,
      events:events,words:words,firstAt:first,pruned:pruned,perCardLimit:number(raw.perCardLimit),today:today};
  }
  function recallPeriod(model,length) {
    if([1,7,30,90].indexOf(length)===-1)length=30;
    var start=model.today-length+1, all=model.events.filter(function(e){return e.day>=start&&e.day<=model.today;}),
      samples=all.filter(function(e){return e.recall;}), groups=Object.create(null), known=0,drops=all.filter(function(e){return e.drop;}).length;
    samples.forEach(function(e){
      var key=String(e.elapsedDays),g=groups[key]||(groups[key]={days:e.elapsedDays,known:0,unknown:0,total:0});
      g.total++;if(e.result==='bildim'||e.result==='zaten'){known++;g.known++;}else g.unknown++;
    });
    return {start:start,total:samples.length,known:known,unknown:samples.length-known,drops:drops,events:all.length,
      excluded:all.length-samples.length,words:new Set(samples.map(function(e){return e.word;})).size,
      accuracy:samples.length?known/samples.length*100:null,
      intervals:Object.keys(groups).map(function(key){var g=groups[key];g.accuracy=g.known/g.total*100;return g;}).sort(function(a,b){return a.days-b.days;}),
      repeatedDrops:Object.keys(model.words).map(function(word){return model.words[word];}).filter(function(w){return w.drops>=2;})
        .sort(function(a,b){return b.drops-a.drops||(b.lastAt||0)-(a.lastAt||0)||a.word.localeCompare(b.word);})};
  }
  function dayReview(model,day) {
    var events=model.events.filter(function(e){return e.day===day&&e.result!=='sifirla';}),words=Object.create(null),moves=Object.create(null),known=0,already=0,up=0,down=0,same=0;
    events.forEach(function(e){
      var success=e.result==='bildim'||e.result==='zaten';if(success)known++;if(e.result==='zaten')already++;
      if(e.to>e.from)up++;else if(e.to<e.from)down++;else same++;
      var w=words[e.word]||(words[e.word]={word:e.word,known:0,unknown:0,already:0,boxes:[e.from],events:0});
      if(success)w.known++;else w.unknown++;if(e.result==='zaten')w.already++;w.events++;
      // Preserve every recorded step, including a reset or an unobserved edit
      // between answers. Never invent a direct transition across that gap.
      if(w.boxes[w.boxes.length-1]!==e.from)w.boxes.push(null,e.from);
      w.boxes.push(e.to);
      var key=e.from+':'+e.to,m=moves[key]||(moves[key]={from:e.from,to:e.to,total:0,words:new Set()});m.total++;m.words.add(e.word);
    });
    return {day:day,covered:!!model.available&&model.firstAt!==null&&calendarDay(new Date(model.firstAt))<=day,
      partial:!!model.partial||!!model.truncated,total:events.length,known:known,unknown:events.length-known,already:already,
      words:Object.keys(words).length,up:up,down:down,same:same,
      rows:Object.keys(words).sort(function(a,b){return a.localeCompare(b);}).map(function(k){return words[k];}),
      transitions:Object.keys(moves).map(function(k){var m=moves[k];return {from:m.from,to:m.to,total:m.total,words:m.words.size};}).sort(function(a,b){return a.from-b.from||a.to-b.to;})};
  }
  YDS.IstatistikHesap={create:create,day:day,known:known,calendarDay:calendarDay,sum:sum,observed:observed,average:average,period:period,streak:streak,weeks:weeks,weekday:weekday,plan:plan,history:history,recallPeriod:recallPeriod,dayReview:dayReview};
})();
