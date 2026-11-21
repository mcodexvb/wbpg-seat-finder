(function(){
"use strict";
const data=window.SEAT_MATRIX_DATA||[], history=window.ROUND1_ALLOTMENTS||[], verified=window.ROUND2_VERIFIED_CANDIDATES||[];
const cats=window.SEAT_MATRIX_META?.categoryLabels||["UR","UR PwD","EWS","EWS PwD","OBC","OBC PwD","SC","SC PwD","ST","ST PwD"];
const $=id=>document.getElementById(id);
const fmt=n=>Number(n).toLocaleString("en-IN");
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const specialtyMatch={
 "Orthopaedics":/ORTHOP|ORTH\b/i,
 "Paediatrics":/PAEDIATR|PAED\b/i,
 "General Medicine":/GENERAL MEDICINE|\bGMED\b/i,
 "Radiodiagnosis":/RADIO.DIAGNOSIS|RADIO.DIAG|\bRADD\b/i,
 "Dermatology":/DERMAT|DERM.,VE|\bDV-L\b/i,
 "Obstetrics & Gynaecology":/OBST|GYNAE|\bOBGY\b/i,
 "General Surgery":/GENERAL SURGERY|\bGSUR\b/i,
 "Anaesthesiology":/ANAESTH|\bASTH\b/i
};
const subject=$("rankSubject"),rank=$("rankInput"),category=$("rankCategory"),pwd=$("rankPwd"),kind=$("rankKind");
function mappedSubject(r){return Object.keys(specialtyMatch).find(n=>specialtyMatch[n].test(r.program||r.subject||""))||r.subject;}
function isRegular(r){return ["MD","MS","MD/MS"].includes(r.degree)}
function isEligibleCategory(r){
 if(pwd.checked)return (r.category.reduce((n,v)=>n+v,0)>0);
 const allowed=category.value==="UR"?["UR"]:["UR",category.value];
 return allowed.some(c=>r.category[cats.indexOf(c)]>0);
}
function countEligible(r){
 if(pwd.checked)return r.seats;
 return (category.value==="UR"?["UR"]:["UR",category.value]).reduce((n,c)=>n+(r.category[cats.indexOf(c)]||0),0);
}
function historyMatch(r){
 const matcher=specialtyMatch[subject.value];
 if(!matcher||!matcher.test(r.subject))return false;
 if(kind.value==="regular" && !(/M\.D\.|M\.S\.|MD\/MS/.test(r.subject)))return false;
 if(kind.value==="dnb" && !/NBEMS|DNB/.test(r.subject))return false;
 return true;
}
function compareHistory(r){
 const status=(r.category||"").split("/").map(s=>s.trim());
 const seatCategory=status[0];
 return !pwd.checked && (seatCategory==="UR" || (seatCategory===category.value&&category.value!=="UR"));
}
function run(){
 const rnk=Number(rank.value);
 if(!Number.isInteger(rnk)||rnk<1){$("rankResults").innerHTML="<p>Enter a valid positive rank.</p>";return}
 const course=subject.value;
 const all=data.filter(r=>/Government/.test(r.type)&&r.quota.startsWith("In-Service")&&mappedSubject(r)===course && (kind.value==="all"||kind.value==="regular"&&isRegular(r)||kind.value==="dnb"&&!isRegular(r)));
 const compatible=all.filter(isEligibleCategory);
 const seats=compatible.reduce((n,r)=>n+countEligible(r),0);
 const hist=history.filter(historyMatch);
 const histCategory=hist.filter(compareHistory);
 const more=histCategory.filter(r=>r.rank>=rnk);
 const before=histCategory.filter(r=>r.rank<rnk);
 const maxRank=histCategory.length?Math.max(...histCategory.map(x=>x.rank)):null;
 const rowHtml=compatible.sort((a,b)=>countEligible(b)-countEligible(a)).map(r=>'<tr><td>'+esc(r.college)+'</td><td>'+esc(r.degree)+'</td><td>'+esc(r.quota)+'</td><td>'+cats.map((c,i)=>!pwd.checked && (c==="UR"||c===category.value)&&r.category[i]?esc(c)+': '+r.category[i]:pwd.checked&&r.category[i]?esc(c)+': '+r.category[i]:"").filter(Boolean).join(", ")+'</td><td>'+countEligible(r)+'</td><td>'+r.page+'</td></tr>').join("");
 const examples=histCategory.sort((a,b)=>Math.abs(a.rank-rnk)-Math.abs(b.rank-rnk)).slice(0,7).map(r=>'<tr><td>'+fmt(r.rank)+'</td><td>'+esc(r.subject)+'</td><td>'+esc(r.category)+'</td><td>'+esc(r.page)+'</td></tr>').join("");
 const candidate=verified.find(x=>x.rank===rnk);
 $("rankResults").innerHTML=
 (candidate?'<p class="rank-note"><strong>Verified candidate:</strong> '+esc(candidate.name)+' · '+esc(candidate.category)+' · Round 1: '+esc(candidate.round1Course)+', '+esc(candidate.round1College)+'. Round 2 eligible-candidates list: page '+candidate.eligibilityPage+', serial '+candidate.eligibilitySerial+'.</p>':'')+
 '<div class="rank-metrics"><div><strong>'+fmt(seats)+'</strong><span>Category-compatible Round 2 seats</span></div><div><strong>'+fmt(compatible.length)+'</strong><span>Eligible seat-matrix entries</span></div><div><strong>'+fmt(before.length)+'</strong><span>Prior Round 1 matching allotments above your rank</span></div><div><strong>'+fmt(more.length)+'</strong><span>Prior Round 1 matching allotments at/below your rank</span></div></div>'+
 '<p class="hint"><strong>Historical comparison:</strong> '+(maxRank?"Last matching recorded Round 1 allotment: AIR "+fmt(maxRank)+".":"No matched Round 1 allotment in the uploaded list.")+' Only allotment seat categories are compared; Round 1 candidate category, government/private status and PwD are not fully structured. Treat this as descriptive evidence, <strong>not an allotment probability or cutoff</strong>.</p>'+
 '<h3>Matching Round 2 government vacancies</h3><div class="scroll"><table class="rank-table"><thead><tr><th>Institution</th><th>Course</th><th>Quota</th><th>Eligible category columns</th><th>Seats</th><th>PDF page</th></tr></thead><tbody>'+(rowHtml||'<tr><td colspan="6">No category-compatible vacancies found in the uploaded Round 2 matrix.</td></tr>')+'</tbody></table></div>'+
 '<h3>Nearby matching Round 1 allotments</h3><div class="scroll"><table class="rank-table"><thead><tr><th>AIR</th><th>Course</th><th>Allotment category / candidate category</th><th>Source page</th></tr></thead><tbody>'+(examples||'<tr><td colspan="4">No comparable historical records.</td></tr>')+'</tbody></table></div>'+
 '<p class="hint">Source limitations: Round 1 is a shortlist of 244 allotments, not a complete set of all applicants. The Round 2 eligibility document has unreliable text encoding; only the rank 93,750 candidate profile is directly verified. Future preferences, upgrades, joining status, full competition pool and rank-based probabilities are unknown. Verify reservation and upgrade rules with WBMCC.</p>';
}
const c=verified.find(x=>x.rank===93750);
if(c){rank.value=c.rank;category.value="OBC"}
[rank,subject,category,pwd,kind].forEach(x=>x.addEventListener("change",run));
$("runRank").addEventListener("click",run);
run();
})();
