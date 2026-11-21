(function(){'use strict';const menu=document.querySelector('#menuToggle'),nav=document.querySelector('#siteNav');menu?.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open))});const key='wbpg-theme';const saved=(()=>{try{return localStorage.getItem(key)}catch{return null}})();if(saved==='dark')document.body.classList.add('dark');const toggle=document.querySelector('#themeToggle');if(toggle){toggle.textContent=document.body.classList.contains('dark')?'☀':'☾';toggle.addEventListener('click',()=>{const dark=document.body.classList.toggle('dark');toggle.textContent=dark?'☀':'☾';try{localStorage.setItem(key,dark?'dark':'light')}catch{}})}document.querySelectorAll('.nav a').forEach(a=>{if(a.pathname===location.pathname||a.pathname.endsWith(location.pathname.replace(/^.*\//,''))&&a.pathname.endsWith(location.pathname.split('/').pop()))a.classList.add('active')});window.WBPG={format:n=>Number(n).toLocaleString('en-IN'),esc:s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),csv:(name,rows)=>{const out=rows.map(row=>row.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\r\n');const url=URL.createObjectURL(new Blob(['\uFEFF',out],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1200)},pdf:(title,description,head,body)=>{const widths=head.map((_,i)=>{const base=[35,185,130,65,95,145,55,62];return base[i]||Math.floor(770/head.length)});const total=widths.reduce((n,x)=>n+x,0),columns=head.map((name,i)=>({name,width:Math.round(widths[i]*772/total)}));const blob=window.WBPG_PDF.build(title,columns,body,description);window.WBPG_PDF.preview(blob,title.toLowerCase().replace(/[^a-z0-9]+/g,'-')+'.pdf')}}})();

/* Native social share with a copy-link fallback. */
(function(){
"use strict";
const nav=document.getElementById("siteNav");if(!nav)return;
const messages={
"index.html":"Explore WB PG Seat Finder: search Round 2 medical seats, build preference lists and compare rank evidence.",
"seats.html":"Find West Bengal PG Medical Counselling Round 2 seats by college, specialty, category and quota.",
"choices.html":"Build and reorder your PG medical counselling choice list with WB PG Seat Finder.",
"rank.html":"Explore counselling rank evidence and Round 2 eligible candidates on WB PG Seat Finder."
};
const path=location.pathname.split("/").pop()||"index.html";
const btn=document.createElement("button");btn.type="button";btn.id="shareSiteBtn";btn.className="menu-btn share-site-btn";
btn.textContent="↗ Share";btn.setAttribute("aria-label","Share this page");
btn.style.display="inline-flex";btn.style.alignItems="center";btn.style.justifyContent="center";btn.style.gap="5px";
nav.insertBefore(btn,document.getElementById("themeToggle")||null);
const info=document.createElement("span");info.id="shareSiteStatus";info.setAttribute("role","status");info.className="share-site-status";nav.append(info);
btn.addEventListener("click",async()=>{
 const data={title:document.title,text:messages[path]||messages["index.html"],url:location.href.split("#")[0]};
 try{
  if(navigator.share){await navigator.share(data);return}
  const message=data.text+"\n"+data.url;
  if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(message);info.textContent="Message and link copied";}
  else {const input=document.createElement("textarea");input.value=message;input.style.position="fixed";input.style.opacity="0";document.body.append(input);input.select();const ok=document.execCommand("copy");input.remove();info.textContent=ok?"Message and link copied":"Copy link: "+data.url}
 }catch(e){if(e?.name!=="AbortError"){info.textContent="Sharing unavailable; copy this page URL"}}
});
})();