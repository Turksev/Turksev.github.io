'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const c={window:{KELIME_DIZIN:[{e:'know',t:'bilmek'},{e:'known',t:'bilinen'},{e:'unknown',t:'bilinmeyen'}],KELIME_BICIMLERI:{
  unknown:[{b:'known',f:[],kind:'prefix',a:'un'}],known:[{b:'know',f:['pp'],kind:'inflection'}],
  imprisoned:[{b:'imprison',m:'hapsetmek',f:['past','pp'],kind:'inflection'}]
}}};
vm.runInNewContext(fs.readFileSync(path.resolve(__dirname,'../../assets/js/kelime-bicimleri.js'),'utf8'),c);
const api=c.window.YDS.KelimeBicimleri,map=c.window.KELIME_BICIMLERI;
let result=api.entries('unknown');
assert.equal(result[0].base,'known');assert.equal(result[0].chain[0].base,'know');
assert.equal(result[0].chain[0].meaning,'bilmek');assert.match(result[0].pattern,/un- \+ known/);
assert.equal(api.entries('imprisoned')[0].meaning,'hapsetmek','Reviewed external bases remain available');
map.known.push({b:'other',m:'başka anlam',f:[],kind:'derivation',a:'n'});
assert.equal(api.entries('unknown')[0].chain.length,0,'Do not choose among ambiguous base links');
map.known=[{b:'unknown',f:['pp'],kind:'inflection'}];
assert.equal(api.entries('unknown')[0].chain.length,0,'Do not repeat a cyclic base');
map.known=[{b:'missing',f:['pp'],kind:'inflection'}];
assert.equal(api.entries('unknown')[0].chain.length,0,'Missing translations are not displayed');
map.known=[{b:'know',f:[],kind:'family'}];
assert.equal(api.entries('unknown')[0].chain.length,0,'A family link is not silently presented as a root chain');
assert.match(api.entries('known')[0].description,/doğrudan ek çıkarma kuralı değildir/);
map.known=[{b:'know',f:['pp'],kind:'inflection',contextual:true}];
assert.equal(api.entries('unknown')[0].chain.length,0,'A contextual inflection does not become another word’s root');
assert.equal(api.entries('known')[0].base,'know','Contextual forms still appear on their own card');
map.known=[{b:'know',f:['pp'],kind:'inflection'}];map.unknown[0].m='bağlamdaki özel anlam';
assert.equal(api.entries('unknown')[0].chain.length,0,'A sense-specific base does not inherit another sense’s chain');
assert.equal(api.entries('absent').length,0);
console.log('Base chains: prefix, translation, ambiguity, cycles and missing data PASS.');
