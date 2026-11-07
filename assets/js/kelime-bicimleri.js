/* Karttaki çağdaş temel biçim ilişkisi. Veri hazırdır; ek silerek kök tahmini yapmaz. */
(function(){
  'use strict';
  var Y=window.YDS=window.YDS||{};
  var catalog=Object.create(null);
  (window.KELIME_DIZIN||[]).forEach(function(d){catalog[d.e]=d;});
  function aciklama(row){
    if(row.kind==='comparison')return row.a==='superlative'?'Üstünlük biçimi: en …':'Karşılaştırma biçimi: daha …';
    if(row.kind==='derivation')return '-'+row.a+' yapım eki; yeni bir sözcük oluşturur.';
    var f=row.f||[],s=[];
    if(f.indexOf('ing')!==-1)s.push('-ing biçimi; cümlede fiil yapısında, isim veya sıfat olarak kullanılabilir.');
    if(f.indexOf('past')!==-1&&f.indexOf('pp')!==-1)s.push('Geçmiş zaman / V3 biçimi; sıfat görevinde de kullanılabilir.');
    else if(f.indexOf('past')!==-1)s.push('Fiilin geçmiş zaman biçimi (V2).');
    else if(f.indexOf('pp')!==-1)s.push('Fiilin üçüncü biçimi (V3); sıfat görevinde de kullanılabilir.');
    if(f.indexOf('s')!==-1)s.push('Fiilin geniş zamanda üçüncü tekil kişi biçimi.');
    if(f.indexOf('pl')!==-1)s.push('İsmin çoğul biçimi; bazı anlamları kalıplaşmış olabilir.');
    return s.join(' ');
  }
  function pattern(word,row){
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
    return (data[word]||[]).filter(function(r){return catalog[r.b];}).map(function(r){
      return {base:r.b,meaning:catalog[r.b].t,pattern:pattern(word,r),description:aciklama(r),note:r.n||''};
    });
  }
  Y.KelimeBicimleri={entries:entries};
})();
