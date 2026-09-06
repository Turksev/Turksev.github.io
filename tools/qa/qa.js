'use strict';
const frame = document.getElementById('ornek');
const output = document.getElementById('sonuc');
const routes = ['index.html','kelimeler.html','obekler.html','aileler.html','cumleler.html','baglaclar.html','gramer.html','konular.html','quiz.html','deneme.html','ara.html','durum.html','ayarlar.html','yontem.html','konu/T01.html','konu/E68.html'];
const results = [];
document.getElementById('baslat').onclick = async function () {
  this.disabled = true;
  try {
    results.length=0;
    for (const theme of ['light','dark']) for (const width of [375, 1280]) for (const route of routes) {
      output.textContent = JSON.stringify({state:'running',next:{theme,width,route},results},null,2);
      frame.style.width = width+'px';
      await new Promise((resolve,reject)=>{
        frame.onload=resolve;frame.onerror=reject;
        frame.src='../../'+route;
      });
      const doc=frame.contentDocument;
      doc.documentElement.setAttribute('data-theme',theme);
      // Tema değişimi ve 150 ms CSS geçişi bitmeden renk örnekleme yapma.
      await new Promise(resolve => frame.contentWindow.requestAnimationFrame(() =>
        frame.contentWindow.requestAnimationFrame(() => setTimeout(resolve, 200))));
      await new Promise((resolve,reject)=>{
        const script=doc.createElement('script');
        script.src='/node_modules/axe-core/axe.min.js';script.onload=resolve;script.onerror=reject;
        doc.head.appendChild(script);
      });
      const report=await frame.contentWindow.axe.run(doc,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}});
      results.push({theme,width,route,viewport:doc.documentElement.clientWidth,overflow:doc.documentElement.scrollWidth>doc.documentElement.clientWidth+1,
        headings:doc.querySelectorAll('h1').length,skip:doc.querySelectorAll('.skip-link,.atla').length,
        violations:report.violations.map(v=>({id:v.id,impact:v.impact,count:v.nodes.length,nodes:v.nodes.slice(0,3).map(n=>({target:n.target,html:n.html,summary:n.failureSummary}))}))});
    }
    output.textContent=JSON.stringify({state:'complete',results},null,2);
  } catch (error) {output.textContent=JSON.stringify({state:'failed',error:String(error),results},null,2);}
  this.disabled=false;
};
