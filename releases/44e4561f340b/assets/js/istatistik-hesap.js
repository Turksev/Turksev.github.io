/* Salt okunur istatistik modeli: mevcut ilerleme verisini değiştirmez. */
(function () {
  'use strict';
  var YDS = window.YDS = window.YDS || {};
  var DAY = 86400000, FIELDS = ['t', 'y', 'd', 'm', 'z'];
  function number(n) { return Number.isSafeInteger(n) && n >= 0 ? n : 0; }
  function empty() { return {t:0,y:0,d:0,m:0,z:0}; }
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
    if ([7,30,90].indexOf(length) === -1) length = 30;
    var start = m.today-length+1, total = sum(m,start,m.today), days = observed(m,start,m.today);
    var previous = sum(m,start-length,start-1), complete = days === length && observed(m,start-length,start-1) === length;
    var active = 0, answerDays = 0, best = null, inconsistent = false;
    for (var g = Math.max(start,m.first === null ? m.today+1:m.first); g <= m.today; g++) {
      if(!known(m,g))continue;
      var row = day(m,g);
      if (row.t + row.z > 0) active++;
      if (row.t > 0) answerDays++;
      if (row.d > row.t) inconsistent = true;
      if (row.t && (!best || row.t > best.t)) best = {g:g,t:row.t};
    }
    var speed = days ? total.t/days : null;
    var delta = complete ? speed - previous.t/length : null;
    return {start:start,length:length,total:total,observed:days,active:active,answerDays:answerDays,best:best,speed:speed,
      previous:previous,delta:delta,percent:complete && previous.t>0 ? (total.t-previous.t)/previous.t*100:null,
      accuracy:total.t && !inconsistent ? total.d/total.t*100:null,inconsistent:inconsistent,
      activeSpeed:answerDays ? total.t/answerDays:null};
  }
  function streak(m) {
    function active(g) { var r=day(m,g); return known(m,g)&&r.t+r.z>0; }
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
  YDS.IstatistikHesap={create:create,day:day,known:known,calendarDay:calendarDay,sum:sum,observed:observed,average:average,period:period,streak:streak,weeks:weeks,weekday:weekday,plan:plan};
})();
