'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..');let uid=0;
const scripts=['kullanim-hesap.js','kullanim.js'].map(file=>new vm.Script(fs.readFileSync(path.join(root,'assets/js',file),'utf8'),{filename:file}));
class Storage {
  constructor(){this.map=new Map();this.blocked=false;this.writes=0;this.enumerations=0;this.cachedKeys=null;}
  get length(){return this.map.size;}
  key(i){if(i===0){this.enumerations++;this.cachedKeys=Array.from(this.map.keys());}return (this.cachedKeys||Array.from(this.map.keys()))[i]??null;}
  getItem(k){if(this.blocked)throw Error('storage disabled');return this.map.get(k)??null;}
  setItem(k,v){if(this.blocked)throw Error('quota');this.writes++;this.map.set(k,String(v));}
  removeItem(k){if(this.blocked)throw Error('storage disabled');this.map.delete(k);}
}
function browser(options={}){
  const storage=options.storage||new Storage(),sessionStorage=options.sessionStorage||new Storage();
  let clock=options.now??new Date(2026,8,26,12).getTime(),monotonic=0;
  class FakeDate extends Date{constructor(...a){super(...(a.length?a:[clock]));}static now(){return clock;}}
  const events={},timers=[];
  const listen=(type,fn)=>{(events[type]||(events[type]=[])).push(fn);};
  const document={visibilityState:options.hidden?'hidden':'visible',addEventListener:listen};
  const window={YDS:{},localStorage:storage,sessionStorage,location:{pathname:options.path||'/kelimeler.html'},
    performance:{now:()=>monotonic,getEntriesByType:()=>[{type:options.reload?'reload':'navigate'}]},
    crypto:{randomUUID:()=>`00000000-0000-4000-8000-${String(++uid).padStart(12,'0')}`},CustomEvent:class{constructor(type){this.type=type;}},
    addEventListener:listen,dispatchEvent:e=>emit(e.type,e),setInterval:fn=>{timers.push(fn);return timers.length;}};
  function emit(type,event={}){for(const fn of events[type]||[])fn(event);}
  const context=vm.createContext({window,document,Date:FakeDate,console});
  if(options.animationFrames)window.requestAnimationFrame=fn=>options.animationFrames.push(fn);
  for(const script of scripts)script.runInContext(context);
  const H=window.YDS.KullanimHesap,K=window.YDS.Kullanim;
  return {H,K,storage,sessionStorage,document,window,emit,advance(ms,mono=ms){clock+=ms;monotonic+=mono;},
    checkpoint(){return K.yaz();},tick(){for(const fn of timers)fn();},
    report(range=30){return H.rapor(K.oku(),range,H.gun(new FakeDate()));},
    visibility(hidden){document.visibilityState=hidden?'hidden':'visible';emit('visibilitychange');}};
}
module.exports={Storage,browser};
