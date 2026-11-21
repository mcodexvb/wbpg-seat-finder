(function(){
"use strict";
const matrix=window.SEAT_MATRIX_DATA||[],cats=window.SEAT_MATRIX_META.categoryLabels;
const section=document.createElement("section");section.className="panel";section.id="choice-builder";
section.innerHTML='<h2>Choice list builder</h2><p class="hint">Choose several subjects and reservation categories, then order the matching college choices. Selections within a filter are combined.</p><div class="choice-grid"><div><label for="cbSubjects">Preferred subjects (multiple)</label><select id="cbSubjects" multiple size="7" aria-label="Preferred subjects"></select></div><div><label for="cbCategories">Eligible reservation categories (multiple)</label><div id="cbCategories" class="choice-checks"></div></div><div><label for="cbQuota">Quota</label><div id="cbQuota" class="choice-checks"></div><label class="check"><input id="cbGov" type="checkbox" checked>Government institutions only</label></div></div><div class="tools"><span class="hint">Use Ctrl/Command to select multiple subjects on desktop; tap to toggle subjects on mobile.</span><div class="buttons"><button id="cbGenerate" class="primary">Generate choices</button><button id="cbClear">Clear choices</button></div></div><p id="cbMessage" class="hint" aria-live="polite"></p><div id="cbList" class="choice-list"></div><div class="buttons" style="margin-top:14px"><button id="cbCSV" disabled>Download CSV</button><button id="cbPDF" class="primary" disabled>Preview / download PDF</button></div>';
const target=document.getElementById("rank-analyzer");target.parentNode.insertBefore(section,target);
const style=document.createElement("style");style.textContent='.choice-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin:16px 0}.choice-grid select{width:100%;min-height:175px}.choice-checks{display:grid;gap:8px;padding:10px;border:1px solid #cbd9e3;border-radius:9px;margin-bottom:12px}.choice-checks label{font-size:13px;color:inherit;font-weight:500;display:flex;align-items:center;gap:8px}.choice-checks input{accent-color:#087b9b;width:16px;height:16px}.choice-item{display:flex;align-items:center;gap:12px;padding:12px;border:1px solid #d1e0e9;border-radius:10px;margin-top:8px;background:#f7fafc}.choice-item .choice-detail{min-width:0;flex:1}.choice-item strong{display:block;font-size:13px}.choice-item small{display:block;margin-top:3px}.choice-move{display:flex;gap:5px}.choice-move button{padding:8px 10px;min-width:36px}.choice-number{font-weight:800;color:#126c89;font-size:16px;min-width:25px}.choice-item[draggable=true]{cursor:grab}body.dark .choice-item{background:#23384b;border-color:#3e596d}body.dark .choice-checks{border-color:#486174}body.dark .choice-grid select{background:#1b2e42;color:#fff}@media(max-width:760px){.choice-grid{grid-template-columns:1fr}.choice-grid select{min-height:150px}.choice-item{align-items:flex-start;flex-wrap:wrap}.choice-move{width:100%;justify-content:flex-end}}';document.head.append(style);
const $=id=>document.getElementById(id),fmt=n=>Number(n).toLocaleString("en-IN");
const subjects=[...new Set(matrix.map(r=>r.subject))].sort((a,b)=>a.localeCompare(b));
subjects.forEach(s=>{const o=document.createElement("option");o.value=s;o.textContent=s;$("cbSubjects").append(o)});
function checks(id,opts,checked){opts.forEach(o=>{const l=document.createElement("label"),c=document.createElement("input");c.type="checkbox";c.value=o;c.checked=checked.includes(o);l.append(c,document.createTextNode(o));$(id).append(l)})}
checks("cbCategories",cats,["UR"]);checks("cbQuota",[...new Set(matrix.map(r=>r.quota))],["In-Service"]);
let list=[];const chosen=id=>[...$(id).querySelectorAll("input:checked")].map(c=>c.value);
function redraw(){
 $("cbMessage").textContent=list.length+" ordered college/subject choices";
 $("cbCSV").disabled=$("cbPDF").disabled=!list.length;
 $("cbList").replaceChildren();
 list.forEach((r,i)=>{
  const box=document.createElement("div");box.className="choice-item";box.draggable=true;box.dataset.index=i;
  const n=document.createElement("span");n.className="choice-number";n.textContent=i+1;
  const details=document.createElement("div");details.className="choice-detail";
  const title=document.createElement("strong");title.textContent=r.subject+" — "+r.college;
  const meta=document.createElement("small");meta.textContent=r.degree+" · "+r.quota+" · "+r.matches+" eligible-column seats · matrix p."+r.page+" #"+r.id;
  details.append(title,meta);
  const buttons=document.createElement("div");buttons.className="choice-move";
  [["↑",()=>move(i,-1),"Move up"],["↓",()=>move(i,1),"Move down"],["×",()=>{list.splice(i,1);redraw()},"Remove"]].forEach(([v,fn,label])=>{const b=document.createElement("button");b.textContent=v;b.title=label;b.setAttribute("aria-label",label+" choice "+(i+1));b.onclick=fn;buttons.append(b)});
  box.append(n,details,buttons);$("cbList").append(box);
  box.ondragstart=e=>{e.dataTransfer.setData("text/plain",String(i));e.dataTransfer.effectAllowed="move"};
  box.ondragover=e=>e.preventDefault();
  box.ondrop=e=>{e.preventDefault();const from=Number(e.dataTransfer.getData("text/plain"));if(Number.isInteger(from)&&from>=0&&from<list.length){const item=list.splice(from,1)[0];list.splice(i,0,item);redraw()}};
 });
}
function move(i,delta){const j=i+delta;if(j<0||j>=list.length)return;[list[i],list[j]]=[list[j],list[i]];redraw()}
$("cbGenerate").onclick=()=>{
 const selection=[...$("cbSubjects").selectedOptions].map(o=>o.value),categories=chosen("cbCategories"),quotas=chosen("cbQuota");
 if(!selection.length||!categories.length||!quotas.length){$("cbMessage").textContent="Select at least one subject, category and quota.";return}
 const candidates=matrix.filter(r=>selection.includes(r.subject)&&quotas.includes(r.quota)&&(!$("cbGov").checked||/Government/i.test(r.type))).map(r=>({...r,matches:categories.reduce((n,c)=>n+(r.category[cats.indexOf(c)]||0),0)})).filter(r=>r.matches);
 const order=new Map(selection.map((v,i)=>[v,i]));
 candidates.sort((a,b)=>order.get(a.subject)-order.get(b.subject)||a.college.localeCompare(b.college));
 list=candidates;redraw();
};
$("cbClear").onclick=()=>{list=[];redraw()};
$("cbCSV").onclick=()=>{const rows=[["Choice","Subject","Institution","Degree","Quota","Seats","PDF page","Matrix row"],...list.map((r,i)=>[i+1,r.subject,r.college,r.degree,r.quota,r.matches,r.page,r.id])];const csv=rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(",")).join("\r\n");const blob=new Blob(["\uFEFF",csv],{type:"text/csv;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="wbpg-choice-list.csv";a.click();setTimeout(()=>URL.revokeObjectURL(url),3000)};
$("cbPDF").onclick=()=>{const columns=[{name:"No.",width:36},{name:"Specialty",width:140},{name:"Institution",width:283},{name:"Degree",width:60},{name:"Quota",width:120},{name:"Seats",width:55},{name:"Ref",width:78}],records=list.map((r,i)=>[i+1,r.subject,r.college,r.degree,r.quota,r.matches,"p"+r.page+" #"+r.id]);window.WBPG_PDF.preview(window.WBPG_PDF.build("ORDERED CHOICE LIST",columns,records,list.length+" preferences | Individual counselling eligibility must be verified"),"wbpg-ordered-choices.pdf")};
$("cbSubjects").addEventListener("pointerdown",e=>{if(e.pointerType==="touch"&&e.target.tagName==="OPTION"){e.preventDefault();e.target.selected=!e.target.selected}});
redraw();
})();