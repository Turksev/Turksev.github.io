'use strict';
/* Tarayıcı takımları için bellek içi sahte Firebase (compat API'nin sitenin kullandığı kadarı).
   Dosya adı → betik metni; takım gstatic isteklerini bu metinlerle yanıtlar. Yalnız yalıtılmış test
   bağlamında yüklenir: gerçek hesaba ya da buluta dokunulmaz. Sayfa içinde window.__qaBulut ile
   bulut belgeleri okunur/yazılır (belge, yaz, islemler, akisOlu). */
module.exports={
  'firebase-app-compat.js':'window.firebase={apps:[],initializeApp:function(c){this.apps.push({options:c});return this.apps[0];}};',
  'firebase-auth-compat.js':`(function(){
    var kisi={uid:'qa-u1',email:'qa@example.com',displayName:'Test'},dinleyen=null;
    var auth={currentUser:null,
      onAuthStateChanged:function(fn){dinleyen=fn;setTimeout(function(){auth.currentUser=kisi;fn(kisi);},0);return function(){};},
      getRedirectResult:function(){return Promise.resolve(null);},
      signInWithPopup:function(){auth.currentUser=kisi;if(dinleyen)dinleyen(kisi);return Promise.resolve({user:kisi});},
      signInWithRedirect:function(){return Promise.resolve();},
      signOut:function(){window.__qaCikis=(window.__qaCikis||0)+1;auth.currentUser=null;if(dinleyen)dinleyen(null);return Promise.resolve();}};
    window.firebase.auth=function(){return auth;};
    window.firebase.auth.GoogleAuthProvider=function(){};
  })();`,
  'firebase-firestore-compat.js':`(function(){
    var belgeler=new Map(),dinleyiciler=[],q=window.__qaBulut={islemler:[],akisOlu:false};
    function foto(yol){var v=belgeler.get(yol);return {exists:!!v,data:function(){return v;},metadata:{fromCache:false}};}
    function yaz(yol,v){belgeler.set(yol,v);if(q.akisOlu)return;
      dinleyiciler.forEach(function(d){if(d.aktif&&d.yol===yol)d.fn(foto(yol));});}
    function ref(yol){return {path:yol,
      collection:function(ad){return {doc:function(id){return ref(yol+'/'+ad+'/'+id);}};},
      onSnapshot:function(fn){var d={yol:yol,fn:fn,aktif:true};dinleyiciler.push(d);
        setTimeout(function(){if(d.aktif&&!q.akisOlu)fn(foto(yol));},0);return function(){d.aktif=false;};}};}
    var db={collection:function(ad){return {doc:function(id){return ref(ad+'/'+id);}};},
      runTransaction:function(calistir){var kayit={okunan:[]},yazilan=[];q.islemler.push(kayit);
        var islem={get:function(r){kayit.okunan.push(r.path);return Promise.resolve(foto(r.path));},
          set:function(r,v){yazilan.push([r.path,v]);}};
        return Promise.resolve(calistir(islem)).then(function(s){yazilan.forEach(function(y){yaz(y[0],y[1]);});return s;});}};
    q.belge=function(yol){return belgeler.get(yol);};
    q.yaz=yaz;
    window.firebase.firestore=function(){return db;};
  })();`
};
