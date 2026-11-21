(function(){
"use strict";
const matrix=window.SEAT_MATRIX_DATA||[],hist=window.ROUND1_ALLOTMENTS||[],verified=window.ROUND2_VERIFIED_CANDIDATES||[];
const cats=window.SEAT_MATRIX_META.categoryLabels,$=id=>document.getElementById(id),fmt=n=>Number(n).toLocaleString("en-IN");
const esc=s=>String(s??"").replace(/[&<>"']/g,x=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[x]));
const patterns={"Orthopaedics":/ORTHOP|ORTH\b/i,"Paediatrics":/PAEDIATR|PAED\b/i,"General Medicine":/GENERAL MEDICINE|GMED/i,"Radiodiagnosis":/RADIO.DIAG|RADD/i,"Dermatology":/DERMAT|DERM.|VENERE|DV-L/i,"Obstetrics & Gynaecology":/OBST|GYNAE|OBGY/i,"General Surgery":/GENERAL SURGERY|GSUR/i,"Anaesthesiology":/ANAESTH|ASTH/i,"Psychiatry":/PSYCHIAT/i};
const section=$("rank-analyzer"),intro=section.querySelector(".fields");
const searchBox=document.createElement("div");searchBox.innerHTML='<label for="candidateSearch">Find candidate by name or rank</label><input id="candidateSearch" type="search" placeholder="Enter name or AIR (e.g., 93750)" autocomplete="off" style="width:100%;padding:12px;border:1px solid #aabfcf;border-radius:9px"><p id="candidateSearchStatus" class="hint" aria-live="polite"></p>';
intro.prepend(searchBox);
const chooser=document.createElement("div");chooser.style.gridColumn="1 / -1";chooser.innerHTML='<label>Rank preferred specialties (select multiple, highest preference first)</label><div id="rankPreferences" class="rank-pref"></div><p class="hint">Preferences are hypothetical and editable; the eligible-upgrader document does not disclose other candidates’ choice orders.</p>';intro.append(chooser);
const style=document.createElement("style");style.textContent='.rank-pref{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.rank-pref label{display:flex;gap:8px;align-items:center;padding:9px;border:1px solid #a9c3d2;border-radius:9px;font-size:12px;font-weight:550;color:inherit}.rank-pref input{width:17px;height:17px;accent-color:#0a7794}.rank-evidence{padding:12px 14px;border:1px solid #b8d2dd;border-radius:10px;margin-top:12px}.rank-evidence h3{margin:0 0 8px!important}.rank-evidence p{margin:5px 0}.rank-evidence small{color:#657d8e}.rank-evidence table{min-width:580px}.rank-evidence .metric{font-size:23px;font-weight:800;color:#0b7797}.rank-warn{border-left:3px solid #cc8c18;padding:12px;background:#fff8e8;color:#553d15;border-radius:5px}body.dark .rank-warn{background:#463d23;color:#f4e8bf}body.dark .rank-evidence{border-color:#42657b}body.dark .rank-evidence small{color:#bdd1e0}@media(max-width:760px){.rank-pref{grid-template-columns:repeat(2,minmax(0,1fr))}}';document.head.append(style);
const defaultPrefs=["Orthopaedics","General Medicine","Paediatrics","Psychiatry"];
Object.keys(patterns).forEach((s,i)=>{const l=document.createElement("label"),c=document.createElement("input");c.type="checkbox";c.value=s;c.checked=defaultPrefs.includes(s);l.append(c,document.createTextNode(s));$("rankPreferences").append(l)});
const rank=$("rankInput"),cat=$("rankCategory"),pwd=$("rankPwd"),kind=$("rankKind");
const findName=()=>{
 const q=$("candidateSearch").value.trim().toLowerCase();
 if(!q){$("candidateSearchStatus").textContent="Enter a rank or a name available in the verified records.";return}
 const found=verified.filter(x=>String(x.rank).includes(q)||(x.name||"").toLowerCase().includes(q));
 const historic=hist.filter(x=>String(x.rank).includes(q)).slice(0,5);
 if(found.length){const x=found[0];rank.value=x.rank;$("candidateSearchStatus").textContent=x.name+" · AIR "+fmt(x.rank)+" · "+x.round1Course+" · "+x.round1College;}
 else if(/^\d+$/.test(q)){rank.value=Number(q);$("candidateSearchStatus").textContent=historic.length?"Matching historical allotment rank(s): "+historic.map(x=>fmt(x.rank)+" ("+x.subject+")").join("; "):"AIR "+fmt(Number(q))+" · No individual candidate record found; aggregate analysis is still available."}
 else $("candidateSearchStatus").textContent="Name not in the available verified dataset. Search by AIR instead.";
};
$("candidateSearch").addEventListener("input",findName);
const originalSelect=$("rankSubject");originalSelect.parentElement.style.display="none";
const allowed=()=>pwd.checked?["UR PwD",...(cat.value==="UR"?[]:[cat.value+" PwD"])]:cat.value==="UR"?["UR"]:["UR",cat.value];
const subset=()=>[...$("rankPreferences").querySelectorAll("input:checked")].map(x=>x.value);
function run(){
 const rnk=Number(rank.value),selected=subset();
 if(!Number.isInteger(rnk)||rnk<1){$("rankResults").innerHTML='<p class="rank-warn">Enter a valid positive rank.</p>';return}
 if(!selected.length){$("rankResults").innerHTML='<p class="rank-warn">Select at least one specialty.</p>';return}
 const eligible=allowed(),candidate=verified.find(x=>x.rank===rnk);
 let html=candidate?'<p class="rank-note"><strong>Verified candidate: '+esc(candidate.name)+'</strong> · '+esc(candidate.category)+' · Round 1: '+esc(candidate.round1Course)+', '+esc(candidate.round1College)+' · Upgrade eligibility source p.'+candidate.eligibilityPage+', serial '+candidate.eligibilitySerial+'</p>':'<p class="hint">No individually verified candidate profile for AIR '+fmt(rnk)+'. The following analysis uses rank and category only.</p>';
 html+='<p class="rank-warn"><strong>Interpretation:</strong> This is a preference-ranked evidence report, not a probability forecast. Other candidates’ preference orders, joining decisions and complete upgrade demand are unavailable. A Round 1 allotment is not proof that its holder applied for upgradation.</p>';
 let found=0;
 selected.forEach((name,index)=>{
  const pat=patterns[name];
  const vacant=matrix.filter(r=>/Government/i.test(r.type)&&r.quota.startsWith("In-Service")&&pat.test(r.program+" "+r.subject)&&(kind.value==="all"||(kind.value==="regular"?["MD","MS","MD/MS"].includes(r.degree):!["MD","MS","MD/MS"].includes(r.degree))));
  const matched=vacant.map(r=>({...r,compatible:eligible.reduce((n,c)=>n+(r.category[cats.indexOf(c)]||0),0)})).filter(x=>x.compatible>0);
  const seats=matched.reduce((n,r)=>n+r.compatible,0);found+=seats;
  const previous=hist.filter(x=>pat.test(x.subject)&&(!(/DNB|DIPLOMA|NBEMS/i.test(x.subject))||kind.value!=="regular")&&(kind.value!=="dnb"||/DNB|DIPLOMA|NBEMS/i.test(x.subject))).filter(x=>{const s=x.category.split("/")[0].trim();return s==="UR"||s===cat.value});
  const nearest=[...previous].sort((a,b)=>Math.abs(a.rank-rnk)-Math.abs(b.rank-rnk)).slice(0,4);
  const beyond=previous.filter(x=>x.rank>=rnk).length,above=previous.filter(x=>x.rank<rnk).length;
  const last=previous.length?Math.max(...previous.map(x=>x.rank)):null;
  html+='<div class="rank-evidence"><h3>'+(index+1)+'. '+esc(name)+'</h3><div class="rank-metrics"><div><strong>'+fmt(seats)+'</strong><span>Compatible listed seats</span></div><div><strong>'+fmt(matched.length)+'</strong><span>Matrix entries</span></div><div><strong>'+fmt(above)+'</strong><span>Matching Round 1 ranks better than yours</span></div><div><strong>'+fmt(beyond)+'</strong><span>Matching Round 1 ranks at/beyond yours</span></div></div><p class="hint">Lowest-priority (highest AIR) matching Round 1 record: <strong>'+(last?fmt(last):"not available")+'</strong>. This is not an official cutoff.</p><div class="scroll"><table><thead><tr><th>Government institution</th><th>Course</th><th>Quota</th><th>Compatible seats</th><th>Source</th></tr></thead><tbody>';
  html+=matched.length?matched.map(r=>'<tr><td>'+esc(r.college)+'</td><td>'+esc(r.degree)+'</td><td>'+esc(r.quota)+'</td><td>'+r.compatible+'</td><td>p.'+r.page+' #'+r.id+'</td></tr>').join(""):'<tr><td colspan="5">No category-compatible Round 2 vacancy in this matrix.</td></tr>';
  html+='</tbody></table></div><p class="hint">Nearest matching historical AIRs: '+(nearest.map(x=>fmt(x.rank)+" ("+esc(x.category)+", p."+x.page+")").join("; ")||"none in available records")+'.</p></div>';
 });
 html+='<p class="hint">Total compatible seats across selected specialties: <strong>'+fmt(found)+'</strong> (matrix counts, not an offer forecast). The Round 1 dataset contains '+fmt(hist.length)+' extracted records, not the full competition pool. UR eligibility is assumed for comparison and must be verified against WBMCC rules. Individual upgrade status is not reliably linked to these historical records.</p>';
 $("rankResults").innerHTML=html;
}
$("runRank").onclick=run;
[rank,cat,pwd,kind,$("rankPreferences")].forEach(el=>el.addEventListener("change",run));
$("candidateSearch").value="93750";findName();run();
})();