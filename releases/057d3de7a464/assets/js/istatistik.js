/* Salt okunur görünüm: ilerlemeye, kotaya veya eşitlemeye yazmaz. */
(function () {
  'use strict';
  var YDS=window.YDS, Il=YDS.Ilerleme, Veri=YDS.Veri, Depo=YDS.Depo, H=YDS.IstatistikHesap;
  var esc=YDS.kacar, $=function(id){return document.getElementById(id);};
  var range=30, model, summary, remaining=0, selectedDay=null, pending=null, DAY=86400000;
  function n(v,d){return Number(v||0).toLocaleString('tr-TR',{maximumFractionDigits:d||0,minimumFractionDigits:d||0});}
  function date(g,long){return new Date(g*DAY).toLocaleDateString('tr-TR',{day:'numeric',month:long?'long':'short',year:long?'numeric':undefined,timeZone:'UTC'});}
  function iso(g){return new Date(g*DAY).toISOString().slice(0,10);}
  function text(id,value){$(id).textContent=value;}
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
    text('donemTarih',date(summary.start)+' – '+date(model.today));text('kayitKapsam',n(summary.observed)+' günlük kayıt');
    text('hizDeger',summary.speed===null?'—':n(summary.speed,1));
    var compare;
    if(summary.delta===null)compare='Önceki '+range+' günle kıyaslamak için yeterli kayıt yok.';
    else if(summary.percent===null)compare='Önceki dönemde yanıt yok · şimdi '+n(summary.speed,1)+' yanıt/gün.';
    else compare=(summary.delta>0?'↑ ':summary.delta<0?'↓ ':'→ ')+n(Math.abs(summary.percent),1)+'% '+(summary.delta>0?'artış':summary.delta<0?'azalış':'değişim')+' · önceki '+range+' güne göre';
    text('hizKiyas',compare);
    var today=H.day(model,model.today),metrics=[
      ['Bugün',n(today.t),'yanıt · '+n(today.z)+' ayrı ayıklama'],
      ['Dönem toplamı',n(summary.total.t),'yanıt · tekrarlar dahil'],
      ['Aktif gün',n(summary.active)+' / '+n(summary.observed),'yanıt veya ayıklama yapılan gün'],
      ['Bildim oranı',summary.accuracy===null?'—':n(summary.accuracy,1)+'%','ipucusuz “Bildim” / tüm yanıtlar']
    ];
    $('ozet').innerHTML=metrics.map(function(row){return '<div class="stats-metric"><span>'+esc(row[0])+'</span><b>'+esc(row[1])+'</b><small>'+esc(row[2])+'</small></div>';}).join('');
    var streak=H.streak(model);
    $('ritimOzet').innerHTML='<span>Güncel seri <strong>'+n(streak.current)+' gün</strong></span><span>Kayıtlardaki en uzun seri <strong>'+n(streak.longest)+' gün</strong></span><span>'+(summary.observed<range?'Seçili '+range+' günün yalnız '+n(summary.observed)+' günü ölçüm kapsamında.':'Bugün henüz tamamlanmadı; sayılar gün içinde değişir.')+'</span>';
    $('bosDurum').hidden=model.first!==null;mini();
  }
  function axes(W,height,top,bottom,max){
    var out='';[0,.5,1].forEach(function(r){var y=top+(height-top-bottom)*(1-r),value=max*r;var caption=value>=10000?value.toLocaleString('tr-TR',{notation:'compact',maximumFractionDigits:1}):n(value,value%1?1:0);out+='<line x1="48" y1="'+y+'" x2="'+(W-12)+'" y2="'+y+'" class="axis"/>'+label(39,y+5,caption,'end');});return out;
  }
  function daily(){
    var W=640,height=252,top=24,bottom=34,left=48,area=W-left-12,plot=height-top-bottom,step=area/range,rows=[],max=0,points=[];
    for(var g=summary.start;g<=model.today;g++){
      var known=model.first!==null&&g>=model.first,row=H.day(model,g),avg=H.average(model,g,7);
      rows.push({g:g,row:row,known:known,avg:avg});max=Math.max(max,row.t,avg||0);
    }
    max=ceiling(max);function y(v){return top+plot-v/max*plot;}
    var unknown=rows.filter(function(r){return !r.known;}).length;
    var body=unknown?rect(left,top,unknown*step,plot,'unknown-area','Bu tarihlerde günlük ölçüm yok.'):'';
    body+=axes(W,height,top,bottom,max);
    rows.forEach(function(r,i){
      var x=left+step*(i+.16);
      if(r.known)body+=rect(x,y(r.row.t),step*.68,plot+top-y(r.row.t),'answer-bar',date(r.g,true)+': '+n(r.row.t)+' yanıt');
      if(r.avg!==null)points.push((left+step*(i+.5)).toFixed(2)+','+y(r.avg).toFixed(2));
    });
    if(points.length>1)body+='<polyline points="'+points.join(' ')+'" class="mean-line"/>';
    if(points.length===1){var p=points[0].split(',');body+='<circle cx="'+p[0]+'" cy="'+p[1]+'" r="3" fill="var(--stats-amber)"/>';}
    [0,Math.floor((range-1)/2),range-1].forEach(function(i,j){body+=label(left+step*(i+.5),height-8,date(summary.start+i),j===0?'start':j===2?'end':'middle');});
    $('gunlukGrafik').innerHTML=svg(W,height,'Son '+range+' gün: '+n(summary.total.t)+' kayıtlı yanıt. '+n(summary.observed)+' günlük ölçüm kapsamı.',body);
    text('gunlukOzet',n(summary.total.t)+' yanıt · '+n(summary.observed)+' günlük kayıt');$('tahminNot').hidden=!unknown;
    $('gunSec').min=iso(summary.start);$('gunSec').max=iso(model.today);
    if(selectedDay===null||selectedDay<summary.start||selectedDay>model.today)selectedDay=model.today;
    $('gunSec').value=iso(selectedDay);
    $('gunlukTablo').innerHTML=rows.slice().reverse().map(function(r){return '<tr><th scope="row">'+esc(date(r.g,true))+'</th>'+['t','d','y','z'].map(function(f){return '<td>'+(r.known?n(r.row[f]):'<span aria-label="Ölçüm yok">—</span>')+'</td>';}).join('')+'</tr>';}).join('');
    detail();
  }
  function detail(){
    if(selectedDay===null){text('gunDetay','Gün ayrıntısını görmek için geçerli bir tarih seç.');return;}
    var row=H.day(model,selectedDay),content;
    if(model.first===null||selectedDay<model.first)content='Günlük ölçüm yok. '+(model.traces[selectedDay]?n(model.traces[selectedDay])+' kartta bu güne ait son çalışma izi var; bu, toplam yanıt sayısı değildir.':'Bu günü sıfır çalışma olarak değerlendirmiyoruz.');
    else content=n(row.t)+' yanıt · '+n(row.d)+' “Bildim” · '+n(row.y)+' ilk kayıt · '+n(row.z)+' ayıklama · '+n(row.m)+' kez 5. kutuya geçiş';
    $('gunDetay').innerHTML='<strong>'+esc(date(selectedDay,true))+'</strong>'+esc(content);
  }
  function balance(){
    var ratio=summary.accuracy,ratioText=ratio===null?'—':n(ratio,1)+'%';
    $('yanitDengesi').innerHTML='<div class="stats-ratio">'+ratioText+' <span>“Bildim” yanıtı</span></div><div class="stats-balance-bar" aria-hidden="true"><i style="width:'+(ratio===null?0:ratio)+'%"></i></div><p class="stats-meta">'+(summary.inconsistent?'Kayıttaki sayaçlar tutarsız; oran gösterilmiyor.':n(summary.total.d)+' “Bildim” · '+n(Math.max(0,summary.total.t-summary.total.d))+' yanlış veya ipucuyla')+'</p>';
    var facts=[['Yanıt verilen gün başına',summary.activeSpeed===null?'—':n(summary.activeSpeed,1)+' yanıt'],['En yoğun gün',summary.best?date(summary.best.g)+' · '+n(summary.best.t):'—'],['İlk kez kayda alınan',n(summary.total.y)+' kart'],['“Zaten biliyorum”',n(summary.total.z)+' işaretleme'],['5. kutuya geçiş',n(summary.total.m)+' kez']];
    $('donemAyrinti').innerHTML=facts.map(function(row){return '<div><dt>'+esc(row[0])+'</dt><dd>'+esc(row[1])+'</dd></div>';}).join('');
  }
  function calendar(){
    var monday=model.today-H.weekday(model.today),start=monday-25*7,W=680,cell=18,step=24,left=45,top=27,body='',active=0,answers=0;
    for(var week=0;week<26;week++)for(var d=0;d<7;d++){
      var g=start+week*7+d;if(g>model.today)continue;
      var row=H.day(model,g),trace=model.traces[g],known=model.first!==null&&g>=model.first;
      var level=row.t===0?0:row.t<10?1:row.t<30?2:row.t<60?3:4;
      var caption=date(g,true)+': '+(known?n(row.t)+' yanıt, '+n(row.z)+' ayıklama':trace?n(trace)+' kartta son çalışma izi; günlük ölçüm yok':'günlük ölçüm yok');
      body+=rect(left+week*step,top+d*step,cell,cell,trace?'history-cell':known?'s'+level:'unknown-cell',caption);
      if(row.z)body+='<circle cx="'+(left+week*step+cell/2)+'" cy="'+(top+d*step+cell/2)+'" r="2" class="sort-dot"/>';
      if(known){answers+=row.t;if(row.t+row.z>0)active++;}
    }
    ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'].forEach(function(name,d){body+=label(36,top+d*step+14,name,'end');});
    [0,6,12,18,25].forEach(function(week){body+=label(left+week*step,17,date(start+week*7),week===25?'end':'start');});
    $('isiGrafik').innerHTML=svg(W,204,'Son 26 haftada kayıtlara göre '+n(active)+' aktif gün, '+n(answers)+' yanıt. Kesikli hücreler ölçülmemiş eski çalışma izleridir.',body);
    text('isiOzet',n(active)+' kayıtlı aktif gün · '+n(answers)+' yanıt');
  }
  function weekly(){
    var weeks=H.weeks(model),W=640,height=206,top=22,bottom=34,plot=height-top-bottom,step=(W-60)/12;
    var max=ceiling(Math.max.apply(null,weeks.items.map(function(w){return w.total;}))),body=axes(W,height,top,bottom,max);
    weeks.items.forEach(function(w,i){
      var x=48+step*(i+.2),y=top+plot-w.total/max*plot;
      body+=rect(x,y,step*.6,top+plot-y,w.ongoing?'current-bar':'answer-bar',date(w.start,true)+' haftası: '+n(w.total)+' kayıtlı yanıt'+(w.ongoing?' (sürüyor)':'')+'; '+w.observed+' günlük kapsam.');
      if(i%3===0||i===11)body+=label(x+step*.3,height-8,date(w.start),i===11?'end':'middle');
    });
    $('haftalikGrafik').innerHTML=svg(W,height,'Son 12 haftanın kayıtlı yanıtları. Bu hafta '+n(weeks.current)+' yanıt; hafta sürüyor.',body);
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
  function refresh(){model=H.create(Il.gunlukKayitlar(),Il.tumKayitlar(),Il.bugun());summary=H.period(model,range);overview();daily();balance();calendar();weekly();accumulation();}
  function schedule(){if(pending!==null)window.clearTimeout(pending);pending=window.setTimeout(function(){pending=null;refresh();},60);}
  var initial=Il.gunlukHedef();$('planHiz').value=Number.isInteger(initial)&&initial>0&&initial<=1000?String(initial):'10';
  $('aralik').addEventListener('click',function(event){
    var button=event.target.closest('button[data-gun]');if(!button)return;
    var next=Number(button.getAttribute('data-gun'));if([7,30,90].indexOf(next)===-1)return;range=next;
    Array.prototype.forEach.call(this.querySelectorAll('button[data-gun]'),function(b){var active=Number(b.getAttribute('data-gun'))===range;b.classList.toggle('acik',active);b.setAttribute('aria-pressed',String(active));});refresh();
  });
  $('gunSec').addEventListener('change',function(){var value=this.value,g=/^\d{4}-\d{2}-\d{2}$/.test(value)?Date.parse(value+'T00:00:00Z')/DAY:NaN;selectedDay=Number.isInteger(g)&&iso(g)===value&&g>=summary.start&&g<=model.today?g:null;detail();});
  $('planHiz').addEventListener('input',plan);
  window.addEventListener('yds-depo-degisti',function(e){var keys=e&&e.detail&&e.detail.anahtarlar;if(!keys||keys.some(function(k){return ['yds-leitner','yds-gunluk-kayit','yds-katmanlar'].indexOf(k)!==-1;}))schedule();});
  window.addEventListener('focus',schedule);window.addEventListener('pageshow',schedule);
  document.addEventListener('visibilitychange',function(){if(!document.hidden)schedule();});
  window.setInterval(function(){if(!document.hidden&&model&&Il.bugun()!==model.today)schedule();},60000);
  refresh();
})();
