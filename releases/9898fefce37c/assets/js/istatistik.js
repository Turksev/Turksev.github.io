/* Salt okunur görünüm: ilerlemeye, kotaya, kullanıma veya eşitlemeye yazmaz.
   Seçilen dönem ve bölümlerin açık/kapalı durumu bu tarayıcıda saklanır.
   Ayrı kullanım izleyicisi kendi yaşam döngüsünde kayıt tutar. */
(function () {
  'use strict';
  var YDS=window.YDS, Il=YDS.Ilerleme, Veri=YDS.Veri, Depo=YDS.Depo, H=YDS.IstatistikHesap;
  var esc=YDS.kacar, $=function(id){return document.getElementById(id);};
  var RANGE_KEY='yds-istatistik-aralik';
  var SECTIONS_KEY='yds-istatistik-bolumler';
  var range=Depo.oku(RANGE_KEY,1), model, summary, remaining=0, selectedDay=null, pending=null, DAY=86400000;
  if([1,7,30,90].indexOf(range)===-1)range=1;
  var usagePending=null,usageDeferred=false,usageMarkup={};
  var historyModel=null,historySummary=null,historyWord='',wordCatalog=Object.create(null);
  Veri.dizin.forEach(function(item){wordCatalog[item.e.toLowerCase()]=item.e;});
  var graphIds=['gunlukGrafik','isiGrafik','haftalikGrafik'],followLatest={};
  graphIds.forEach(function(id){followLatest[id]=true;});
  function paint(id,markup){
    var el=$(id),position=el.scrollLeft||0;el.innerHTML=markup;
    el.scrollLeft=followLatest[id]?(el.scrollWidth||0):position;
  }
  function n(v,d){return Number(v||0).toLocaleString('tr-TR',{maximumFractionDigits:d||0,minimumFractionDigits:d||0});}
  function date(g,long){return new Date(g*DAY).toLocaleDateString('tr-TR',{day:'numeric',month:long?'long':'short',year:long?'numeric':undefined,timeZone:'UTC'});}
  function iso(g){return new Date(g*DAY).toISOString().slice(0,10);}
  function text(id,value){var el=$(id);if(el.textContent!==value)el.textContent=value;}
  function usageHtml(id,value){if(usageMarkup[id]!==value){$(id).innerHTML=value;usageMarkup[id]=value;}}
  function svg(w,h,label,body){return '<svg viewBox="0 0 '+w+' '+h+'" role="img" aria-label="'+esc(label)+'">'+body+'</svg>';}
  function label(x,y,value,align){return '<text x="'+x+'" y="'+y+'" text-anchor="'+(align||'start')+'">'+esc(value)+'</text>';}
  function rect(x,y,w,h,cls,title){return '<rect x="'+x.toFixed(2)+'" y="'+y.toFixed(2)+'" width="'+Math.max(0,w).toFixed(2)+'" height="'+Math.max(0,h).toFixed(2)+'" rx="3" class="'+cls+'"><title>'+esc(title||'')+'</title></rect>';}
  function ceiling(value){if(value<=5)return 5;var power=Math.pow(10,Math.floor(Math.log10(value)));return Math.ceil(value/power*2)/2*power;}
  function mini(){
    var values=[];
    for(var g=summary.start;g<=model.today;g++)if(model.first!==null&&g>=model.first)values.push(H.average(model,g,7));
    if(!values.length){$('hizMini').innerHTML='';return;}
    var max=Math.max.apply(null,values.concat([1])),points=values.map(function(v,i){return (i*280/Math.max(1,values.length-1)).toFixed(1)+','+(36-v/max*30).toFixed(1);});
    $('hizMini').innerHTML='<svg viewBox="0 0 280 42" preserveAspectRatio="none"><polyline points="'+points.join(' ')+'" fill="none" stroke="#a6dceb" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>';
  }
  function overview(){
    text('donemTarih',range===1?'Bugün · '+date(model.today):date(summary.start)+' – '+date(model.today));text('kayitKapsam',n(summary.observed)+' günlük kayıt');
    text('hizBaslik',range===1?'Bugünkü yanıtların':'Günlük yanıt ortalaması');text('hizBirim',range===1?'yanıt':'yanıt / gün');
    text('hizDeger',summary.speed===null?'—':n(summary.speed,1));
    var compare;
    if(range===1)compare=summary.delta===null?'Dünle karşılaştırmak için yeterli günlük kayıt yok.':
      'Dün '+n(summary.previous.t)+' yanıt · bugün '+(summary.delta===0?'aynı sayıda':n(Math.abs(summary.delta))+' yanıt '+(summary.delta>0?'fazla':'az'))+'. Bugün devam ediyor.';
    else if(summary.delta===null)compare='Önceki '+range+' günle kıyaslamak için yeterli kayıt yok.';
    else if(summary.percent===null)compare='Önceki dönemde yanıt yok · şimdi '+n(summary.speed,1)+' yanıt/gün.';
    else compare=(summary.delta>0?'↑ ':summary.delta<0?'↓ ':'→ ')+n(Math.abs(summary.percent),1)+'% '+(summary.delta>0?'artış':summary.delta<0?'azalış':'değişim')+' · önceki '+range+' güne göre';
    text('hizKiyas',compare);
    var metrics=[
      ['Bildim',n(summary.total.b),'sonucu bilinen yanıtlar'],
      ['Bilemedim',n(Math.max(0,summary.total.n-summary.total.b)),'sonucu bilinen yanıtlar'],
      ['Bildim oranı',summary.accuracy===null?'—':n(summary.accuracy,1)+'%',n(summary.total.b)+' / '+n(summary.total.n)+' sonucu bilinen yanıt'],
      ['5. kutuya geçiş',n(summary.total.m),'seçili dönemdeki geçişler']
    ];
    $('ozet').innerHTML=metrics.map(function(row){return '<div class="stats-metric"><span>'+esc(row[0])+'</span><b>'+esc(row[1])+'</b><small>'+esc(row[2])+'</small></div>';}).join('');
    var streak=H.streak(model);
    $('ritimOzet').innerHTML='<span>Güncel seri <strong>'+n(streak.current)+' gün</strong></span><span>Kayıtlardaki en uzun seri <strong>'+n(streak.longest)+' gün</strong></span><span>'+(summary.observed<range?'Seçili '+range+' günün yalnız '+n(summary.observed)+' günü ölçüm kapsamında.':'Bugün henüz tamamlanmadı; sayılar gün içinde değişir.')+'</span>';
    $('bosDurum').hidden=model.first!==null||model.unresolved>0;
    $('takvimNot').hidden=!model.unresolved;
    text('takvimNot',model.unresolved?n(model.unresolved)+' eski günlük kaydın tarihi tek bir güne ayrılamıyor. Bu kayıtlar korunuyor; belirsiz tarihler hız ve dönem karşılaştırmasına katılmıyor.':'');mini();
  }
  function axes(W,height,top,bottom,max){
    var out='';[0,.5,1].forEach(function(r){var y=top+(height-top-bottom)*(1-r),value=max*r;var caption=value>=10000?value.toLocaleString('tr-TR',{notation:'compact',maximumFractionDigits:1}):n(value,value%1?1:0);out+='<line x1="48" y1="'+y+'" x2="'+(W-12)+'" y2="'+y+'" class="axis"/>'+label(39,y+5,caption,'end');});return out;
  }
  function daily(){
    var W=640,height=252,top=24,bottom=34,left=48,area=W-left-12,plot=height-top-bottom,step=area/range,rows=[],max=0,points=[];
    for(var g=summary.start;g<=model.today;g++){
      var known=H.known(model,g),row=H.day(model,g),avg=H.average(model,g,7);
      rows.push({g:g,row:row,known:known,avg:avg});max=Math.max(max,row.t,avg||0);
    }
    max=ceiling(max);function y(v){return top+plot-v/max*plot;}
    var unknown=rows.filter(function(r){return !r.known;}).length;
    var body=rows.map(function(r,i){return r.known?'':rect(left+i*step,top,step,plot,'unknown-area','Bu tarihte kesin günlük ölçüm yok.');}).join('');
    body+=axes(W,height,top,bottom,max);
    rows.forEach(function(r,i){
      var x=left+step*(i+.16);
      if(r.known)body+=rect(x,y(r.row.t),step*.68,plot+top-y(r.row.t),'answer-bar'+(r.g===model.today?' today-bar':''),date(r.g,true)+': '+n(r.row.t)+' yanıt');
      if(r.avg!==null)points.push((left+step*(i+.5)).toFixed(2)+','+y(r.avg).toFixed(2));
    });
    if(points.length>1)body+='<polyline points="'+points.join(' ')+'" class="mean-line"/>';
    if(points.length===1){var p=points[0].split(',');body+='<circle cx="'+p[0]+'" cy="'+p[1]+'" r="3" fill="var(--stats-amber)"/>';}
    Array.from(new Set([0,Math.floor((range-1)/2),range-1])).forEach(function(i,j,all){body+=label(left+step*(i+.5),height-8,date(summary.start+i),all.length===1?'middle':j===0?'start':j===all.length-1?'end':'middle');});
    paint('gunlukGrafik',svg(W,height,'Son '+range+' gün: '+n(summary.total.t)+' kayıtlı yanıt. '+n(summary.observed)+' günlük ölçüm kapsamı.',body));
    text('gunlukOzet',n(summary.total.t)+' yanıt · '+n(summary.observed)+' günlük kayıt');$('tahminNot').hidden=!unknown;
    $('gunSec').min=iso(summary.start);$('gunSec').max=iso(model.today);
    if(selectedDay===null||selectedDay<summary.start||selectedDay>model.today)selectedDay=model.today;
    $('gunSec').value=iso(selectedDay);
    $('gunlukTablo').innerHTML=rows.slice().reverse().map(function(r){return '<tr><th scope="row">'+esc(date(r.g,true))+'</th>'+['t','b','y','z'].map(function(f){var value=f==='b'?(r.row.n?n(r.row.b)+' / '+n(r.row.n):'—'):n(r.row[f]);return '<td>'+(r.known?value:'<span aria-label="Ölçüm yok">—</span>')+'</td>';}).join('')+'</tr>';}).join('');
    detail();
  }
  function detail(){
    if(selectedDay===null){text('gunDetay','Gün ayrıntısını görmek için geçerli bir tarih seç.');return;}
    var row=H.day(model,selectedDay),content;
    if(!H.known(model,selectedDay))content=(model.unknown[selectedDay]?'Eski günlük kaydın kesin takvim tarihi bilinmiyor. ':'Günlük ölçüm yok. ')+(model.traces[selectedDay]?n(model.traces[selectedDay])+' kartta bu güne ait son çalışma izi var; bu, toplam yanıt sayısı değildir.':'Bu günü sıfır çalışma olarak değerlendirmiyoruz.');
    else content=n(row.t)+' yanıt · '+(row.n?n(row.b)+' / '+n(row.n)+' sonucu bilinen yanıtta “Bildim”':'Sonucu ayrıştırılabilen yanıt yok')+' · '+n(row.y)+' ilk kayıt · '+n(row.z)+' “Zaten biliyorum” (Bildim toplamına dahil) · '+n(row.m)+' kez 5. kutuya geçiş'+(row.t>row.n?'. '+n(row.t-row.n)+' eski yanıtın ipucuyla bilinen/yanlış ayrımı bilinmiyor.':'');
    $('gunDetay').innerHTML='<strong>'+esc(date(selectedDay,true))+'</strong>'+esc(content);
  }
  function balance(){
    var ratio=summary.accuracy,ratioText=ratio===null?'—':n(ratio,1)+'%';
    $('yanitDengesi').innerHTML='<div class="stats-ratio">'+ratioText+' <span>“Bildim” yanıtı</span></div><div class="stats-balance-bar" aria-hidden="true"><i style="width:'+(ratio===null?0:ratio)+'%"></i></div><p class="stats-meta">'+(summary.inconsistent?'Kayıttaki sayaçlar tutarsız; oran gösterilmiyor.':n(summary.total.b)+' “Bildim” / '+n(summary.total.n)+' sonucu bilinen yanıt · '+n(Math.max(0,summary.total.n-summary.total.b))+' “Bilemedim”. İpucuyla bilinenler ve “Zaten biliyorum” Bildim sayılır.')+'</p><p class="stats-meta">'+(summary.legacy?n(summary.legacy)+' eski yanıtın ipucuyla bilinen/yanlış ayrımı bilinmediği için bu orana katılmıyor.':'Bu oran ilk yanıtları da içerir. Gerçek tekrar aralıkları ayrıca gösterilir.')+'</p>';
    var facts=[['Yanıt verilen gün başına',summary.activeSpeed===null?'—':n(summary.activeSpeed,1)+' yanıt'],['En yoğun gün',summary.best?date(summary.best.g)+' · '+n(summary.best.t):'—'],['İlk kez kayda alınan',n(summary.total.y)+' kart'],['“Zaten biliyorum”',n(summary.total.z)+' işaretleme'],['5. kutuya geçiş',n(summary.total.m)+' kez']];
    $('donemAyrinti').innerHTML=facts.map(function(row){return '<div><dt>'+esc(row[0])+'</dt><dd>'+esc(row[1])+'</dd></div>';}).join('');
  }
  function calendar(){
    var monday=model.today-H.weekday(model.today),start=monday-25*7,W=680,cell=18,step=24,left=45,top=27,body='',active=0,answers=0;
    for(var week=0;week<26;week++)for(var d=0;d<7;d++){
      var g=start+week*7+d;if(g>model.today)continue;
      var row=H.day(model,g),trace=model.traces[g],known=H.known(model,g);
      var level=row.t===0?0:row.t<10?1:row.t<30?2:row.t<60?3:4;
      var caption=date(g,true)+': '+(known?n(row.t)+' yanıt':trace?n(trace)+' kartta son çalışma izi; günlük ölçüm yok':'günlük ölçüm yok');
      body+=rect(left+week*step,top+d*step,cell,cell,(trace?'history-cell':known?'s'+level:'unknown-cell')+(g===model.today?' today-cell':''),caption);
      if(known){answers+=row.t;if(row.t>0)active++;}
    }
    ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'].forEach(function(name,d){body+=label(36,top+d*step+14,name,'end');});
    [0,6,12,18,25].forEach(function(week){body+=label(left+week*step,17,date(start+week*7),week===25?'end':'start');});
    paint('isiGrafik',svg(W,204,'Son 26 haftada kayıtlara göre '+n(active)+' aktif gün, '+n(answers)+' yanıt. Kesikli hücreler ölçülmemiş eski çalışma izleridir.',body));
    text('isiOzet',n(active)+' kayıtlı aktif gün · '+n(answers)+' yanıt');
  }
  function weekly(){
    var weeks=H.weeks(model),W=Math.max(480,Math.round($('haftalikGrafik').clientWidth||640)),height=206,top=22,bottom=34,plot=height-top-bottom,step=(W-60)/12;
    var max=ceiling(Math.max.apply(null,weeks.items.map(function(w){return w.total;}))),body=axes(W,height,top,bottom,max);
    weeks.items.forEach(function(w,i){
      var x=48+step*(i+.2),y=top+plot-w.total/max*plot;
      body+=rect(x,y,step*.6,top+plot-y,w.ongoing?'current-bar':'answer-bar',date(w.start,true)+' haftası: '+n(w.total)+' kayıtlı yanıt'+(w.ongoing?' (sürüyor)':'')+'; '+w.observed+' günlük kapsam.');
      if(i%3===0||i===11)body+=label(x+step*.3,height-8,date(w.start),i===11?'end':'middle');
    });
    paint('haftalikGrafik',svg(W,height,'Son 12 haftanın kayıtlı yanıtları. Bu hafta '+n(weeks.current)+' yanıt; hafta sürüyor.',body));
    text('haftalikOzet','Bu hafta '+n(weeks.current)+' yanıt · '+(weeks.comparable?'geçen haftanın aynı '+weeks.elapsed+' gününde '+n(weeks.previous)+' yanıt':'aynı günlerle kıyas için yeterli kayıt yok'));
  }
  function accumulation(){
    var boxes=[0,0,0,0,0,0],selected=Depo.oku('yds-katmanlar',[2]),pool=0,started=0;
    if(!Array.isArray(selected))selected=[2];
    selected=selected.map(Number).filter(function(k,i,a){return Number.isInteger(k)&&k>=1&&k<=7&&a.indexOf(k)===i;});
    if(!selected.length)selected=[2];
    Veri.dizin.forEach(function(item){var k=Il.kutu(item.e,'kelime');if(!Number.isInteger(k)||k<0||k>5)k=0;boxes[k]++;if(selected.indexOf(item.k)!==-1){pool++;if(k>0)started++;}});
    var total=Veri.dizin.length,learned=total-boxes[0];remaining=Math.max(0,pool-started);
    text('birikimOzet',n(learned)+' / '+n(total)+' kelimeye başlandı · '+n(boxes[5])+' kelime 5. kutuda');
    $('kutuGrafik').setAttribute('role','img');$('kutuGrafik').setAttribute('aria-label',n(learned)+' kelimeye başlandı, '+n(boxes[0])+' kelimeye başlanmadı.');
    $('kutuGrafik').innerHTML=boxes.map(function(value,k){return '<span class="box'+k+'" style="width:'+(total?value/total*100:0)+'%"></span>';}).join('');
    $('kutuEfsane').innerHTML=boxes.map(function(value,k){return '<div><i class="box'+k+'"></i>'+(k?k+'. kutu':'Başlanmamış')+'<b>'+n(value)+'</b><small>'+(total?n(value/total*100,1):'0')+'%</small></div>';}).join('');plan();
  }
  function plan(){
    var input=$('planHiz'),value=Number(input.value),days=H.plan(remaining,value);input.setAttribute('aria-invalid',days===null?'true':'false');
    if(days===null)text('tahminMetin','1 ile 1.000 arasında tam sayı gir.');
    else if(!remaining)text('tahminMetin','Seçili katmanlardaki bütün kelimelere ilk kaydın oluşturulmuş.');
    else text('tahminMetin',n(remaining)+' kelimeye henüz başlanmamış. Günde '+n(value)+' yeni kelimeyle ilk tur için '+n(days)+' gün planlayabilirsin.');
  }
  function intervalLabel(days){return days===0?'1 günden az':n(days)+'–'+n(days+1)+' gün';}
  function historyDate(at){return new Date(at).toLocaleString('tr-TR',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});}
  function historySuggestions(){
    var query=$('tekrarKelimeAra').value.trim().toLowerCase();
    var matches=query?Veri.dizin.filter(function(item){return item.e.toLowerCase().indexOf(query)!==-1;}):[];
    matches.sort(function(a,b){return (a.e.toLowerCase()===query?-1:0)-(b.e.toLowerCase()===query?-1:0)||a.e.localeCompare(b.e);});
    usageHtml('tekrarKelimeOnerileri',matches.slice(0,20).map(function(item){return '<option value="'+esc(item.e)+'"></option>';}).join(''));
  }
  function wordHistory(){
    if(!historyWord){$('tekrarGecmisKutu').hidden=true;text('tekrarKelimeDurum','Geçmişini görmek istediğin kelimeyi yaz.');return;}
    var w=historyModel.words[historyWord],events=w?w.events:[];
    if(!events.length){
      $('tekrarGecmisKutu').hidden=true;
      var box=Il.kutu(historyWord,'kelime'),current=box?('Şu anda '+box+'. kutuda. '):'';
      text('tekrarKelimeDurum',historyWord+': '+current+(w&&w.total?n(w.total)+' ayrıntılı işlem sayılmış, ancak olay ayrıntıları artık elde değil.':'Ayrıntılı olay kaydı henüz yok. Eski kutu bilgisinden önceki sonuçları ve tarihleri çıkarmıyoruz.'));
      usageHtml('tekrarGecmis','');return;
    }
    var total=Math.max(w.total,events.length),missing=Math.max(0,total-events.length);
    $('tekrarGecmisKutu').hidden=false;
    text('tekrarGecmisAciklama',historyWord+' — eldeki kayıtlar, en yeniden eskiye');
    text('tekrarKelimeDurum',historyWord+': '+n(events.length)+' / '+n(total)+' kayıt gösteriliyor.'+(missing?' '+n(missing)+' eski olayın ayrıntısı saklama sınırı nedeniyle gösterilemiyor.':'')+' Ayrıntılı kayıttan önceki geçmiş bilinmiyor.');
    var resultNames={bildim:'Bildim',bilemedim:'Bilemedim',zaten:'Zaten biliyorum',sifirla:'Kart sıfırlandı'};
    var sourceNames={kart:'Kelime kartı',oyun:'Kelimeyi yaz',"gunun-testi":'Günün testi',durum:'Durumum'};
    usageHtml('tekrarGecmis',events.slice().reverse().map(function(e){
      var result=resultNames[e.result],note=sourceNames[e.source]||'',interval;
      if(e.result==='sifirla')interval='Tekrar hesabı dışında';
      else if(e.from===0&&e.previousAt===null){result+=' · ilk karşılaşma';interval='İlk karşılaşma';}
      else interval=e.elapsedDays===null?'Önceki çalışma zamanı bilinmiyor':intervalLabel(e.elapsedDays);
      var before=e.from?e.from+'. kutu':'Başlanmamış',after=e.to?e.to+'. kutu':'Başlanmamış';
      return '<tr><th scope="row">'+esc(historyDate(e.at))+'</th><td>'+esc(result)+(note?'<span class="stats-history-note">'+esc(note)+'</span>':'')+'</td><td>'+esc(before+' → '+after)+'</td><td>'+esc(interval)+'</td></tr>';
    }).join(''));
  }
  function histories(){
    var raw;
    try{raw=typeof Il.kartGecmisi==='function'?Il.kartGecmisi():{available:false};}catch(e){raw={available:false,partial:true};}
    historyModel=H.history(raw,Veri.dizin,model.today,typeof Il.kimlikCoz==='function'?Il.kimlikCoz:null);
    historySummary=H.recallPeriod(historyModel,range);
    var r=historySummary,m=historyModel;
    text('tekrarDonem',range===1?'Tekrar özeti: bugün':'Tekrar özeti: son '+range+' gün');
    var coverage=m.firstAt===null?'Ayrıntılı kelime kaydı henüz yok. Yeni çalışmalarınla bu bölüm oluşacak.':
      'İlk ayrıntılı kelime kaydı: '+date(H.calendarDay(new Date(m.firstAt)),true)+'. Dönem hesabı eldeki '+n(r.events)+' olaydan, önceki gerçek çalışma zamanı bilinen '+n(r.total)+' tekrarı kullanıyor. '+n(r.excluded)+' olay tekrar oranına katılmıyor.';
    if(!m.available)coverage='Ayrıntılı kelime kayıtları şu anda okunamıyor. Günlük toplamlar ve mevcut kutu bilgileri ayrı gösterilmeye devam eder.';
    coverage+=' Eski kayıtlardan geçmiş ipucu sayıları veya tekrar aralıkları tahmin edilmez.';
    if(m.perCardLimit)coverage+=' Her kelimenin en çok son '+n(m.perCardLimit)+' olay ayrıntısı tutulur.';
    if(m.truncated)coverage+=' Saklama sınırı nedeniyle bazı eski olay ayrıntıları kaldırılmıştır; dönemin tekrar tablosu eksik olabilir. Birikimli kutu düşüşü sayıları ayrı korunur.';
    if(m.partial)coverage+=' Bazı ayrıntılar okunamadı veya kaydedilemedi; görünen sayılar eksik olabilir.';
    text('tekrarKapsam',coverage);
    var metrics=[['Aralığı bilinen tekrar',n(r.total),n(r.words)+' farklı kelime'],
      ['Bildim',r.accuracy===null?'—':n(r.known)+' / '+n(r.total),r.accuracy===null?'Henüz hesaplanabilir tekrar yok':n(r.accuracy,1)+'% · '+n(r.unknown)+' Bilemedim'],
      ['Kutu düşüşü',n(r.drops),'seçili dönemdeki elde tutulan olaylarda']];
    usageHtml('tekrarOzet',metrics.map(function(row){return '<div class="stats-metric"><span>'+esc(row[0])+'</span><b>'+esc(row[1])+'</b><small>'+esc(row[2])+'</small></div>';}).join(''));
    $('tekrarAralikKutu').hidden=!r.intervals.length;
    text('tekrarAralikBos',r.intervals.length?'Aralıklar 24 saatlik süreye göre gruplanır; aynı gün içindeki tekrarlar ilk satırdadır. Her satırın paydası o aralıktaki kayıtlı tekrar sayısıdır.':'Bu dönemde önceki gerçek çalışma zamanı bilinen kelime tekrarı yok. İlk karşılaşmaları veya tarihi bilinmeyen eski kayıtları sıfır gün saymıyoruz.');
    usageHtml('tekrarAraliklar',r.intervals.map(function(g){return '<tr><th scope="row">'+esc(intervalLabel(g.days))+'</th><td>'+n(g.known)+'</td><td>'+n(g.unknown)+'</td><td>'+n(g.known)+' / '+n(g.total)+' · '+n(g.accuracy,1)+'%</td></tr>';}).join(''));
    text('tekrarDusmeBos',r.repeatedDrops.length?'':'Ayrıntılı kayıtlar içinde en az iki kutu düşüşü sayılan kelime yok. Ayrıntısız eski dönemler hakkında buradan sonuç çıkarılmaz.');
    var markup=r.repeatedDrops.map(function(w){return '<li><button type="button" lang="en" data-history-word="'+esc(w.word)+'">'+esc(w.word)+'</button><span>'+n(w.drops)+' kutu düşüşü'+(w.lastAt!==null?' · son kayıt '+esc(date(H.calendarDay(new Date(w.lastAt)))):'')+'</span></li>';}).join('');
    // Arka plandaki yenileme, kullanıcının üzerinde olduğu kelime düğmesini kaldırmasın.
    if(!$('tekrarDusmeler').contains || !$('tekrarDusmeler').contains(document.activeElement))usageHtml('tekrarDusmeler',markup);
    wordHistory();dayRecap();
  }
  function dayRecap(){
    var today=H.dayReview(historyModel,model.today),yesterday=H.dayReview(historyModel,model.today-1);
    function previous(field){return yesterday.covered?n(yesterday[field]):'kayıt yok';}
    var rows=[['Farklı kelime','words'],['Bildim','known'],['Bilemedim','unknown'],['Kutu yükselişi','up'],['Kutu düşüşü','down'],['Aynı kutuda','same']];
    usageHtml('bugunKelimeOzet',rows.map(function(row){return '<div class="stats-metric"><span>'+esc(row[0])+'</span><b>'+(today.covered?n(today[row[1]]):'—')+'</b><small>Dün: '+esc(previous(row[1]))+'</small></div>';}).join(''));
    text('bugunKelimeKapsam',!today.covered?'Bugün için ayrıntılı kelime kaydı henüz yok. Yeni çalışmaların burada görünecek.':
      'Bugün '+n(today.words)+' farklı kelimede '+n(today.total)+' yanıt kaydedildi. Bildim ve Bilemedim yanıt sayılarıdır; aynı kelimeye tekrar yanıt verebilirsin.'+
      ((today.partial||yesterday.partial)?' Saklama sınırı veya eksik kayıtlar nedeniyle bu döküm ve dünkü karşılaştırma eksik olabilir.':''));
    text('bugunZatenDetay',n(today.already)+' “Zaten biliyorum” yanıtı Bildim toplamına dahil.');
    function box(k){return k?k+'. kutu':'Başlanmamış';}
    usageHtml('bugunKutuGecisleri',today.transitions.map(function(t){return '<li><strong>'+esc(box(t.from)+' → '+box(t.to))+'</strong><span>'+n(t.total)+' yanıt · '+n(t.words)+' farklı kelime</span></li>';}).join(''));
    usageHtml('bugunKelimeTablo',today.rows.map(function(w){return '<tr><th scope="row" lang="en">'+esc(w.word)+'</th><td>'+n(w.known)+'</td><td>'+n(w.unknown)+'</td><td>'+esc(w.boxes.map(function(k){return k===null?' / ':box(k);}).join(' → ').replace(/ →  \/  → /g,' / '))+'</td></tr>';}).join(''));
    $('bugunKelimeDetay').hidden=!today.total;
  }
  function usageProtected(){
    var section=$('kullanim'),active=document.activeElement,selection=window.getSelection?window.getSelection():null;
    // Keep focused descendants and selected text nodes in place while the report changes.
    if(active&&['kullanimPaylar','kullanimSayfalar','kullanimOzellikler'].some(function(id){var el=$(id);return active!==el&&el.contains&&el.contains(active);}))return true;
    if(section&&selection&&!selection.isCollapsed){
      for(var i=0;i<selection.rangeCount;i++)if(selection.getRangeAt(i).intersectsNode(section))return true;
    }
    return false;
  }
  function usage(){
    if(usagePending!==null){window.clearTimeout(usagePending);usagePending=null;}
    if(usageProtected()){usageDeferred=true;return;}
    usageDeferred=false;
    var reader=YDS.Kullanim,calculator=YDS.KullanimHesap,report=null;
    if(reader&&calculator&&typeof reader.oku==='function'&&typeof calculator.rapor==='function'){
      try{report=calculator.rapor(reader.oku(),range);}catch(e){report=null;}
    }
    var pages=report&&Array.isArray(report.pages)?report.pages:[],features=report&&Array.isArray(report.features)?report.features:[];
    var started=report&&Number.isInteger(report.startedDay)?report.startedDay:null;
    var seconds=report&&Number.isFinite(report.seconds)?Math.max(0,report.seconds):0;
    function count(value){return Number.isFinite(value)&&value>=0?value:0;}
    function measured(value,decimals){return started===null?'—':n(count(value),decimals);}
    function last(day){return Number.isInteger(day)?date(day,true):'Kayıt yok';}
    function missing(ids,rows){return (ids||[]).map(function(id){var row=rows.find(function(item){return item.id===id;});return row?row.label:id;}).join(', ');}
    var visits=pages.reduce(function(total,row){return total+count(row.visits);},0);
    var actions=features.reduce(function(total,row){return total+count(row.count);},0);
    var hasRecords=visits>0||seconds>0||actions>0;
    text('kullanimOzet',started===null?'Kullanım ölçümü henüz başlamadı.':'Son '+range+' günde '+n(seconds/60,1)+' dakika tahmini aktif kullanım · '+n(visits)+' ziyaret · '+n(actions)+' özellik eylemi');
    var coverage=started===null?'Ölçüm öncesi kullanım bilinmiyor; eski ilerleme kayıtlarından kullanım süresi çıkarılmaz.':
      'Ölçüm başlangıcı: '+date(started,true)+'. '+(Number.isInteger(report.observedDays)?'Seçili dönemde '+n(report.observedDays)+' günde kayıt var. ':'')+'Tablodaki sayılar seçili döneme, son kullanım ise eldeki tüm geçmişe aittir. Kayıt olmayan günler kesin sıfır kullanım anlamına gelmez.';
    if(report&&report.capacityLimited&&Number.isInteger(report.retainedFromDay))coverage+=' Depolama sınırı nedeniyle '+date(report.retainedFromDay,true)+' tarihinden önceki günlük ayrıntılar kaldırıldı; seçili dönemin toplamları eksik olabilir.';
    if(report&&report.partial)coverage+=' Bazı kullanım kayıtları kaydedilemedi veya okunamadı; görünen toplamlar eksik olabilir.';
    text('kullanimKapsam',coverage);
    if($('kullanimBos').hidden!==hasRecords)$('kullanimBos').hidden=hasRecords;
    usageHtml('kullanimPaylar',pages.filter(function(row){return count(row.seconds)>0;}).sort(function(a,b){return b.seconds-a.seconds;}).map(function(row){
      var share=seconds?Math.min(100,count(row.seconds)/seconds*100):0;
      return '<div class="stats-usage-bar"><span>'+esc(row.label)+'</span><b>'+n(row.seconds/60,1)+' dk · '+n(share,1)+'%</b><span class="stats-usage-track" aria-hidden="true"><i style="width:'+share.toFixed(2)+'%"></i></span></div>';
    }).join(''));
    usageHtml('kullanimSayfalar',pages.map(function(row){return '<tr data-page="'+esc(row.id)+'"><th scope="row">'+esc(row.label)+'</th><td>'+measured(row.visits)+'</td><td>'+measured(count(row.seconds)/60,1)+'</td><td>'+measured(row.days)+'</td><td>'+esc(last(row.lastDay))+'</td></tr>';}).join(''));
    usageHtml('kullanimOzellikler',features.map(function(row){return '<tr data-feature="'+esc(row.id)+'"><th scope="row">'+esc(row.label)+'</th><td>'+measured(row.count)+'</td><td>'+measured(row.days)+'</td><td>'+esc(last(row.lastDay))+'</td></tr>';}).join(''));
    var emptyPages=report&&Array.isArray(report.emptyPages)?report.emptyPages:[],emptyFeatures=report&&Array.isArray(report.emptyFeatures)?report.emptyFeatures:[];
    text('kullanimBosSayfalar',started===null?'Sayfalar için henüz ölçüm yok.':emptyPages.length?'Bu dönemde kullanım kaydı olmayan sayfalar: '+missing(emptyPages,pages)+'.':'Bu dönemde izlenen bütün sayfalarda kullanım kaydı var.');
    text('kullanimBosOzellikler',started===null?'Özellikler için henüz ölçüm yok.':emptyFeatures.length?'Bu dönemde eylem kaydı olmayan özellikler: '+missing(emptyFeatures,features)+'.':'Bu dönemde izlenen bütün özelliklerde eylem kaydı var.');
  }
  function refresh(){model=H.create(Il.gunlukKayitlar(),Il.tumKayitlar(),Il.bugun(),{decode:Il.gunTarihi,encode:Il.tarihGunu,today:new Date()});summary=H.period(model,range);overview();daily();balance();calendar();weekly();accumulation();histories();usage();}
  function schedule(){if(pending!==null)window.clearTimeout(pending);pending=window.setTimeout(function(){pending=null;refresh();},60);}
  function scheduleUsage(){if(usagePending!==null)window.clearTimeout(usagePending);usagePending=window.setTimeout(usage,60);}
  function resumeUsage(){if(usageDeferred)scheduleUsage();}
  var savedSections=Depo.oku(SECTIONS_KEY,{}),sectionState={};
  if(!savedSections||typeof savedSections!=='object'||Array.isArray(savedSections))savedSections={};
  Array.prototype.forEach.call(document.querySelectorAll('details[data-stats-section]'),function(panel){
    var name=panel.getAttribute('data-stats-section');
    if(Object.prototype.hasOwnProperty.call(savedSections,name)&&typeof savedSections[name]==='boolean'){
      panel.open=savedSections[name];sectionState[name]=panel.open;
    }
    var previous=panel.open;
    panel.addEventListener('toggle',function(){
      if(panel.open===previous)return;
      previous=panel.open;sectionState[name]=panel.open;Depo.yaz(SECTIONS_KEY,sectionState);
      if(panel.open)schedule();
    });
  });
  var initial=Il.gunlukHedef();$('planHiz').value=Number.isInteger(initial)&&initial>0&&initial<=1000?String(initial):'10';
  function rangeButtons(){
    Array.prototype.forEach.call($('aralik').querySelectorAll('button[data-gun]'),function(b){var active=Number(b.getAttribute('data-gun'))===range;b.classList.toggle('acik',active);b.setAttribute('aria-pressed',String(active));});
  }
  $('aralik').addEventListener('click',function(event){
    var button=event.target.closest('button[data-gun]');if(!button)return;
    var next=Number(button.getAttribute('data-gun'));if([1,7,30,90].indexOf(next)===-1)return;range=next;
    Depo.yaz(RANGE_KEY,range);
    graphIds.forEach(function(id){followLatest[id]=true;});
    rangeButtons();refresh();
  });
  $('gunSec').addEventListener('change',function(){var value=this.value,g=/^\d{4}-\d{2}-\d{2}$/.test(value)?Date.parse(value+'T00:00:00Z')/DAY:NaN;selectedDay=Number.isInteger(g)&&iso(g)===value&&g>=summary.start&&g<=model.today?g:null;detail();});
  $('planHiz').addEventListener('input',plan);
  $('tekrarKelimeAra').addEventListener('input',historySuggestions);
  $('tekrarKelimeForm').addEventListener('submit',function(event){
    event.preventDefault();var query=$('tekrarKelimeAra').value.trim().toLowerCase(),word=wordCatalog[query];
    if(!word){historyWord='';$('tekrarGecmisKutu').hidden=true;text('tekrarKelimeDurum','Bu başlık sözlükte bulunamadı. Önerilen İngilizce kelimelerden birini seçebilirsin.');return;}
    historyWord=word;wordHistory();
  });
  $('tekrarDusmeler').addEventListener('click',function(event){
    var button=event.target.closest('button[data-history-word]');if(!button)return;
    var word=button.getAttribute('data-history-word');if(!wordCatalog[word.toLowerCase()])return;
    historyWord=word;$('tekrarKelimeAra').value=word;wordHistory();
    $('kelimeGecmisBaslik').focus();
  });
  graphIds.forEach(function(id){$(id).addEventListener('scroll',function(){if(this.scrollWidth>this.clientWidth+3)followLatest[id]=this.scrollWidth-this.clientWidth-this.scrollLeft<=3;},{passive:true});});
  window.addEventListener('yds-depo-degisti',function(e){var keys=e&&e.detail&&e.detail.anahtarlar;if(!keys||keys.some(function(k){return ['yds-leitner','yds-gunluk-kayit','yds-gunluk-sonuc','yds-katmanlar'].indexOf(k)!==-1||k.indexOf('yds-kart-gecmis')===0;}))schedule();});
  window.addEventListener('yds:kullanim-degisti',scheduleUsage);
  document.addEventListener('selectionchange',resumeUsage);
  document.addEventListener('focusout',resumeUsage);
  window.addEventListener('focus',schedule);window.addEventListener('pageshow',schedule);
  window.addEventListener('resize',schedule);
  document.addEventListener('visibilitychange',function(){if(!document.hidden)schedule();});
  window.setInterval(function(){if(!document.hidden&&model&&H.calendarDay(new Date())!==model.today)schedule();},60000);
  rangeButtons();refresh();
})();
