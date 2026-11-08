/* Karttaki çağdaş temel biçim ilişkisi. Veri hazırdır; ek silerek kök tahmini yapmaz. */
(function(){
  'use strict';
  var Y=window.YDS=window.YDS||{};
  var catalog=Object.create(null);
  (window.KELIME_DIZIN||[]).forEach(function(d){catalog[d.e]=d;});
  function aciklama(row){
    if(row.kind==='family')return 'Kelime ailesindeki bağlantı; doğrudan ek çıkarma kuralı değildir.';
    if(row.kind==='prefix')return row.a+'- ön eki; temel sözcüğün anlamını değiştirir.';
    if(row.kind==='comparison')return row.a==='superlative'?'Üstünlük biçimi: en …':'Karşılaştırma biçimi: daha …';
    if(row.kind==='derivation')return '-'+row.a+' yapım eki; yeni bir sözcük oluşturur.';
    var f=row.f||[],s=[];
    if(f.indexOf('ing')!==-1)s.push('-ing biçimi; cümlede fiil yapısında, isim veya sıfat olarak kullanılabilir.');
    if(f.indexOf('past')!==-1&&f.indexOf('pp')!==-1)s.push('Geçmiş zaman / V3 biçimi; sıfat görevinde de kullanılabilir.');
    else if(f.indexOf('past')!==-1)s.push('Fiilin geçmiş zaman biçimi (V2).');
    else if(f.indexOf('pp')!==-1)s.push('Fiilin üçüncü biçimi (V3); sıfat görevinde de kullanılabilir.');
    if(f.indexOf('s')!==-1)s.push('Fiilin geniş zamanda üçüncü tekil kişi biçimi.');
    if(f.indexOf('present')!==-1)s.push('Fiilin geniş/şimdiki zamanda kişiye göre çekimli biçimi.');
    if(f.indexOf('pl')!==-1)s.push('İsmin çoğul biçimi; bazı anlamları kalıplaşmış olabilir.');
    return s.join(' ');
  }
  function pattern(word,row){
    if(row.p)return row.p.indexOf('→')!==-1?row.p:row.p+' → '+word;
    if(row.kind==='family')return row.b+' → '+word+' (kelime ailesi)';
    if(row.kind==='prefix')return row.a+'- + '+row.b+' → '+word;
    if(row.kind==='derivation')return row.b+' + -'+row.a+' → '+word;
    if(row.kind==='comparison')return row.b+' → '+word;
    if(row.f.indexOf('ing')!==-1)return row.b+' + -ing → '+word;
    if((row.f.indexOf('past')!==-1||row.f.indexOf('pp')!==-1)&&/ed$/.test(word)&&word.length>row.b.length)return row.b+' + -ed → '+word;
    if(row.f.indexOf('s')!==-1||row.f.indexOf('pl')!==-1){
      if(word===row.b+'s'||word===row.b+'es'||(/y$/.test(row.b)&&word===row.b.slice(0,-1)+'ies'))return row.b+' + -s/-es → '+word;
    }
    return row.b+' → '+word+' (düzensiz biçim)';
  }
  function entries(word){
    var data=window.KELIME_BICIMLERI||{};
    function view(target,r){return {base:r.b,kind:r.kind,meaning:r.m||(catalog[r.b]&&catalog[r.b].t),pattern:pattern(target,r),description:aciklama(r),note:r.n||''};}
    return (data[word]||[]).filter(function(r){return catalog[r.b]||r.m;}).map(function(r){
      var result=view(word,r),seen=Object.create(null),current=r.b;result.chain=[];seen[word]=true;seen[current]=true;
      // Follow only an unambiguous reviewed link. Never pick one of several
      // meanings or turn a cycle into an asserted linguistic root.
      for(var depth=0;r.kind!=='family'&&!(r.m&&catalog[r.b])&&depth<4;depth++){
        var next=data[current];if(!next||next.length!==1)break;
        var parent=next[0];if(parent.kind==='family'||parent.contextual||seen[parent.b]||(!catalog[parent.b]&&!parent.m))break;
        result.chain.push(view(current,parent));seen[parent.b]=true;current=parent.b;
        if(parent.m&&catalog[parent.b])break;
      }
      return result;
    });
  }
  Y.KelimeBicimleri={entries:entries};
})();
