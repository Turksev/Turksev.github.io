'use strict';
// Only an isolated demo emulator. No real account, project configuration or progress.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {initializeTestEnvironment,assertSucceeds,assertFails}=require('@firebase/rules-unit-testing');
const {doc,setDoc,getDoc,runTransaction}=require('firebase/firestore');
const projectId='demo-yds-rules',host='127.0.0.1',port=8185;
assert.equal(process.env.FIRESTORE_EMULATOR_HOST,host+':'+port,'Refuse non-local or missing emulator');
assert.ok(!process.env.GCLOUD_PROJECT||process.env.GCLOUD_PROJECT===projectId,'Refuse real Firebase project');
const root=path.resolve(__dirname,'..'),rules=fs.readFileSync(path.join(root,'firestore.rules'),'utf8');
const window={YDS:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'assets/js/esitleme-veri.js'),'utf8'),{window,console});
const M=window.YDS.EsitlemeMotoru;
const envelope=M.zarfaCevir({'yds-leitner':{alpha:{k:1,g:20703,c:20703,m:0}},'yds-gunluk-kayit':{'20703':{t:1,d:1,y:1,z:0,m:0}}});
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
  await check('schema, identity and daily version validation',async()=>{
    for(const extra of [{anahtar:'yds-leitner'},{extra:true},{zaman:'100'},{json:17},{json:''},{surum:3},{surum:1}])await assertFails(setDoc(doc(own,daily),make('yds-gunluk-kayit',extra)));
  });
  await check('oversized JSON denied below Firestore document ceiling',()=>assertFails(setDoc(doc(own,daily),make('yds-gunluk-kayit',{json:'x'.repeat(921600)}))));
  await check('v2 to v3 allowed; downgrade denied',async()=>{
    const ref=doc(own,route('stats-owner','yds-test-yanlis'));
    await assertSucceeds(setDoc(ref,make('yds-test-yanlis',{surum:2})));
    await assertSucceeds(setDoc(ref,make('yds-test-yanlis')));
    await assertFails(setDoc(ref,make('yds-test-yanlis',{surum:2})));
  });
  await check('deletion marker prevents stale clients from recreating data',async()=>{
    await assertSucceeds(setDoc(doc(own,'kullanicilar/stats-owner/yonetim/durum'),{silindi:true,zaman:200}));
    await assertFails(setDoc(doc(own,daily),make('yds-gunluk-kayit')));
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
