'use strict';
// Only an isolated demo emulator. No real account, project configuration or progress.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {initializeTestEnvironment,assertSucceeds,assertFails}=require('@firebase/rules-unit-testing');
const {doc,setDoc,getDoc,deleteDoc,runTransaction}=require('firebase/firestore');
const projectId='demo-yds-rules',host='127.0.0.1',port=8185;
assert.equal(process.env.FIRESTORE_EMULATOR_HOST,host+':'+port,'Refuse non-local or missing emulator');
assert.ok(!process.env.GCLOUD_PROJECT||process.env.GCLOUD_PROJECT===projectId,'Refuse real Firebase project');
const root=path.resolve(__dirname,'..'),rules=fs.readFileSync(path.join(root,'firestore.rules'),'utf8');
const window={YDS:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'assets/js/esitleme-veri.js'),'utf8'),{window,console});
const M=window.YDS.EsitlemeMotoru;
const historyFields=Array.from({length:16},(_,i)=>'yds-kart-gecmisi-'+i);
const resultField='yds-gunluk-sonuc',favoriteField='yds-favoriler',newFields=[...historyFields,resultField,favoriteField];
assert.equal(M.TIPLER[resultField],'nesne','The new hint-inclusive daily results must be synchronized');
assert.deepEqual(Object.keys(M.TIPLER).filter(key=>key.startsWith('yds-kart-gecmisi-')).sort(),historyFields.slice().sort(),
  'The deployed rules test must cover exactly the 16 runtime history fields');
const fixture={'yds-leitner':{alpha:{k:1,g:20703,c:20703,m:0}},'yds-gunluk-kayit':{'20703':{t:1,d:1,y:1,z:0,m:0}}};
fixture[resultField]={'20703':{n:1,b:1,p:{emutest01:{n:1,b:1}},q:0}};
fixture[favoriteField]={alpha:1794344400000};
historyFields.forEach((key,i)=>{
  const at=1792886400000+i,id=at.toString(36)+'-emutest01';
  const event={id,at,day:20703,result:'bildim',from:1,to:2,previousAt:null,dueDay:20703,source:'kart'};
  const record={v:1,q:0,k:0,p:{emutest01:[1,0,0,0,1]},f:at,u:[id,0],e:[M.kartGecmisiOlayKodla(event)]};
  assert.equal(M.kartGecmisiKaydiGecerli(record),true,'Use a valid runtime history record');
  fixture[key]={'kelime:alpha':record};
});
const envelope=M.zarfaCevir(fixture);
const make=(key,extra={})=>({surum:key==='yds-leitner'||key==='yds-test-yanlis'?3:2,anahtar:key,zaman:100,json:envelope.alanlar[key]?M.bulutAlanJson(key,envelope.alanlar[key]):'{}',...extra});
const route=(uid,key)=>'kullanicilar/'+uid+'/alanlar/'+key;
let environment,checks=0;
async function check(name,work){await work();checks++;console.log('OK '+name);}
async function start(source){return initializeTestEnvironment({projectId,firestore:{host,port,rules:source}});}
async function main(){
  environment=await start(rules);await environment.clearFirestore();
  let own=environment.authenticatedContext('stats-owner').firestore();
  const other=environment.authenticatedContext('stats-other').firestore(),anon=environment.unauthenticatedContext().firestore();
  const daily=route('stats-owner','yds-gunluk-kayit'),leitner=route('stats-owner','yds-leitner');
  await check('owner can create and update daily logs',async()=>{
    await assertSucceeds(setDoc(doc(own,daily),make('yds-gunluk-kayit')));
    await assertSucceeds(setDoc(doc(own,daily),make('yds-gunluk-kayit',{zaman:101})));
  });
  await check('actual serializers: Leitner and daily log in one transaction',async()=>{
    await assertSucceeds(runTransaction(own,async tx=>{
      await tx.get(doc(own,daily));await tx.get(doc(own,leitner));
      tx.set(doc(own,leitner),make('yds-leitner'));tx.set(doc(own,daily),make('yds-gunluk-kayit',{zaman:102}));
    }));
    assert.equal((await getDoc(doc(own,daily))).data().zaman,102);
  });
  await check('other user and anonymous access denied',async()=>{
    for(const db of [other,anon]){
      await assertFails(getDoc(doc(db,daily)));await assertFails(setDoc(doc(db,daily),make('yds-gunluk-kayit')));
    }
  });
  await check('unknown field name denied',()=>assertFails(setDoc(doc(own,route('stats-owner','yds-unknown')),make('yds-unknown'))));
  await check('favorites: owner can persist actual v2 records; other users cannot read, write or delete',async()=>{
    const ref=doc(own,route('stats-owner',favoriteField));
    await assertSucceeds(setDoc(ref,make(favoriteField)));
    assert.deepEqual(JSON.parse((await assertSucceeds(getDoc(ref))).data().json),JSON.parse(M.bulutAlanJson(favoriteField,envelope.alanlar[favoriteField])));
    await assertSucceeds(setDoc(ref,make(favoriteField,{zaman:101})));
    for(const db of [other,anon]){
      const foreign=doc(db,route('stats-owner',favoriteField));
      await assertFails(getDoc(foreign));await assertFails(setDoc(foreign,make(favoriteField)));await assertFails(deleteDoc(foreign));
    }
    for(const extra of [{anahtar:'yds-leitner'},{surum:3},{extra:true},{json:''}])await assertFails(setDoc(ref,make(favoriteField,extra)));
    await assertSucceeds(deleteDoc(ref));await assertSucceeds(setDoc(ref,make(favoriteField)));
  });
  await check('schema, identity and daily version validation',async()=>{
    for(const extra of [{anahtar:'yds-leitner'},{extra:true},{zaman:'100'},{json:17},{json:''},{surum:3},{surum:1}])await assertFails(setDoc(doc(own,daily),make('yds-gunluk-kayit',extra)));
  });
  await check('oversized JSON denied below Firestore document ceiling',()=>assertFails(setDoc(doc(own,daily),make('yds-gunluk-kayit',{json:'x'.repeat(921600)}))));
  await check('all 16 history shards use their actual v2 serializer',async()=>{
    for(const key of historyFields){
      const ref=doc(own,route('stats-owner',key));
      await assertSucceeds(setDoc(ref,make(key)));
      await assertSucceeds(setDoc(ref,make(key,{zaman:120})));
      const saved=(await assertSucceeds(getDoc(ref))).data();
      assert.equal(saved.surum,2);assert.equal(saved.anahtar,key);
      assert.deepEqual(JSON.parse(saved.json),JSON.parse(M.bulutAlanJson(key,envelope.alanlar[key])));
    }
  });
  await check('new daily results create, update and read with their actual v2 serializer',async()=>{
    const ref=doc(own,route('stats-owner',resultField));
    await assertSucceeds(setDoc(ref,make(resultField)));
    await assertSucceeds(setDoc(ref,make(resultField,{zaman:120})));
    const saved=(await assertSucceeds(getDoc(ref))).data();
    assert.equal(saved.surum,2);assert.equal(saved.anahtar,resultField);
    assert.deepEqual(JSON.parse(saved.json),JSON.parse(M.bulutAlanJson(resultField,envelope.alanlar[resultField])));
  });
  await check('history and new daily results require the owner for read, write and delete',async()=>{
    for(const db of [other,anon])for(const key of [historyFields[0],historyFields[15],resultField]){
      const ref=doc(db,route('stats-owner',key));
      await assertFails(getDoc(ref));await assertFails(setDoc(ref,make(key)));await assertFails(deleteDoc(ref));
    }
    const key=historyFields[15],ref=doc(own,route('stats-owner',key));
    await assertSucceeds(deleteDoc(ref));await assertSucceeds(setDoc(ref,make(key,{zaman:121})));
  });
  await check('out-of-range and lookalike history shard names denied',async()=>{
    for(const key of ['yds-kart-gecmisi','yds-kart-gecmisi-','yds-kart-gecmisi--1','yds-kart-gecmisi-00',
      'yds-kart-gecmisi-01','yds-kart-gecmisi-16','yds-kart-gecmisi-99','yds-kart-gecmisi-1x',
      'xyds-kart-gecmisi-1','yds-kart-gecmisi-1-extra','yds-kart-gecmisi-1\n']){
      await assertFails(setDoc(doc(own,route('stats-owner',key)),make(key)));
    }
  });
  await check('history and new daily results preserve strict schema, identity and v2 policy',async()=>{
    for(const key of [historyFields[0],resultField]){
    const ref=doc(own,route('stats-owner',key));
    for(const extra of [{anahtar:historyFields[1]},{extra:true},{zaman:'100'},{zaman:0.5},
      {json:17},{json:''},{surum:3},{surum:1}])await assertFails(setDoc(ref,make(key,extra)));
    for(const field of ['surum','anahtar','zaman','json']){
      const missing=make(key);delete missing[field];await assertFails(setDoc(ref,missing));
    }
    // Rules validate the outer serialized document; event validity is tested in
    // the data engine. Keep the same byte ceiling as every other v2 field.
    await assertSucceeds(setDoc(ref,make(key,{json:'x'.repeat(921599)})));
    await assertFails(setDoc(ref,make(key,{json:'x'.repeat(921600)})));
    await assertSucceeds(setDoc(ref,make(key,{zaman:122})));
    }
  });
  await check('history, daily results and Leitner commit atomically; denied shard cannot partly save',async()=>{
    const history=doc(own,route('stats-owner',historyFields[0]));
    const result=doc(own,route('stats-owner',resultField));
    await assertSucceeds(runTransaction(own,async tx=>{
      await tx.get(doc(own,leitner));await tx.get(doc(own,daily));await tx.get(history);await tx.get(result);
      tx.set(doc(own,leitner),make('yds-leitner',{zaman:130}));
      tx.set(doc(own,daily),make('yds-gunluk-kayit',{zaman:130}));
      tx.set(history,make(historyFields[0],{zaman:130}));
      tx.set(result,make(resultField,{zaman:130}));
    }));
    const invalidKey='yds-kart-gecmisi-16',invalid=doc(own,route('stats-owner',invalidKey));
    await assertFails(runTransaction(own,async tx=>{
      await tx.get(doc(own,leitner));await tx.get(history);await tx.get(result);await tx.get(invalid);
      tx.set(doc(own,leitner),make('yds-leitner',{zaman:131}));
      tx.set(history,make(historyFields[0],{zaman:131}));tx.set(result,make(resultField,{zaman:131}));tx.set(invalid,make(invalidKey));
    }));
    assert.equal((await getDoc(doc(own,leitner))).data().zaman,130);
    assert.equal((await getDoc(history)).data().zaman,130);
    assert.equal((await getDoc(result)).data().zaman,130);
    assert.equal((await getDoc(invalid)).exists(),false);
  });
  await check('v2 to v3 allowed; downgrade denied',async()=>{
    const ref=doc(own,route('stats-owner','yds-test-yanlis'));
    await assertSucceeds(setDoc(ref,make('yds-test-yanlis',{surum:2})));
    await assertSucceeds(setDoc(ref,make('yds-test-yanlis')));
    await assertFails(setDoc(ref,make('yds-test-yanlis',{surum:2})));
  });
  await check('deletion marker prevents stale clients from recreating data',async()=>{
    await assertSucceeds(setDoc(doc(own,'kullanicilar/stats-owner/yonetim/durum'),{silindi:true,zaman:200}));
    await assertFails(setDoc(doc(own,daily),make('yds-gunluk-kayit')));
    for(const key of newFields){
      const ref=doc(own,route('stats-owner',key));
      await assertFails(setDoc(ref,make(key,{zaman:201})));
      await assertSucceeds(deleteDoc(ref));
      await assertFails(setDoc(ref,make(key,{zaman:202})));
    }
  });
  await environment.clearFirestore();await environment.cleanup();
  const oldRules=rules.replace(/\s*\|\| alan == 'yds-gunluk-kayit'/,'');assert.notEqual(oldRules,rules);
  environment=await start(oldRules);own=environment.authenticatedContext('stats-owner').firestore();
  await check('missing daily permission reproduces rejection with no partial write',async()=>{
    await setDoc(doc(own,leitner),make('yds-leitner',{zaman:300}));
    await assertFails(runTransaction(own,async tx=>{
      await tx.get(doc(own,leitner));await tx.get(doc(own,daily));
      tx.set(doc(own,leitner),make('yds-leitner',{zaman:301}));tx.set(doc(own,daily),make('yds-gunluk-kayit'));
    }));
    assert.equal((await getDoc(doc(own,leitner))).data().zaman,300);assert.equal((await getDoc(doc(own,daily))).exists(),false);
  });
  console.log('Firestore emulator: '+checks+' security scenarios passed; no production data used.');
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{if(environment)await environment.cleanup();});
