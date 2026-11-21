(function(){
"use strict";
const data=window.SEAT_MATRIX_DATA||[],history=window.ROUND1_ALLOTMENTS||[],verified=window.ROUND2_VERIFIED_CANDIDATES||[],eligible=window.ROUND2_ELIGIBLE||[];
const cats=window.SEAT_MATRIX_META.categoryLabels,$=id=>document.getElementById(id),fmt=n=>Number(n).toLocaleString("en-IN"),E=WBPG.esc;
const patterns={
"Orthopaedics":/ORTHOP|ORTH\b/i,
"General Medicine":/GENERAL MEDICINE|GMED/i,
"Paediatrics":/PAEDIATR|PAED\b/i,
"Psychiatry":/PSYCHIAT/i,
"Radiodiagnosis":/RADIO.DIAG|RADD/i,
"Dermatology":/DERMAT|DERM|VENE|DV-L/i,
"Obstetrics & Gynaecology":/OBST|GYNAE|OBGY/i,
"General Surgery":/GENERAL SURGERY|GSUR/i,
"Anaesthesiology":/ANAESTH|ASTH/i
};
const rank=$('rankInput'),cat=$('rankCategory'),kind=$('rankKind'),pwd=$('rankPwd'),input=$('candidateSearch'),status=$('candidateSearchStatus');
const chosen=['Orthopaedics','General Medicine','Paediatrics','Psychiatry'];let dragging=null;
const picker=$('rankSubjectPicker'),list=$('rankPreferredList');
const pick=document.createElement('select');pick.className='pick';pick.setAttribute('aria-label','Add a preferred specialty');
pick.innerHTML='<option value="">Add a specialty…</option>';
Object.keys(patterns).forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v;pick.append(o)});
const add=document.createElement('button');add.className='btn primary';add.textContent='Add specialty';picker.append(pick,add);
function draw(){
 list.innerHTML=chosen.map((x,i)=>'<li draggable="true" data-position="'+i+'"><span class="grip" aria-hidden="true">⠿</span><span class="ordinal">'+(i+1)+'</span><span class="grow">'+E(x)+'</span><button type="button" data-up="'+i+'" aria-label="Move preference up">↑</button><button type="button" data-down="'+i+'" aria-label="Move preference down">↓</button><button type="button" data-del="'+i+'" aria-label="Remove preference">×</button></li>').join('')||'<li class="muted">Add at least one specialty.</li>'
}
function move(i,j){if(i<0||j<0||i>=chosen.length||j>=chosen.length)return;const x=chosen.splice(i,1)[0];chosen.splice(j,0,x);draw();run()}
add.onclick=()=>{if(pick.value&&!chosen.includes(pick.value)){chosen.push(pick.value);draw();run()}pick.value=''};
list.onclick=e=>{const d=e.target.dataset;if(d.up!==undefined)move(+d.up,+d.up-1);else if(d.down!==undefined)move(+d.down,+d.down+1);else if(d.del!==undefined){chosen.splice(+d.del,1);draw();run()}};
list.addEventListener('dragstart',e=>{const el=e.target.closest('li[data-position]');if(el){dragging=+el.dataset.position;e.dataTransfer.effectAllowed='move'}});
list.addEventListener('dragover',e=>{if(e.target.closest('li[data-position]'))e.preventDefault()});
list.addEventListener('drop',e=>{const el=e.target.closest('li[data-position]');if(el&&dragging!==null){e.preventDefault();move(dragging,+el.dataset.position)}dragging=null});
list.addEventListener('dragend',()=>dragging=null);
function candidateSearch(){
 const q=input.value.trim().toLowerCase();if(!q){status.textContent='Search the decoded Round 2 eligible-candidates list by name or AIR.';return}
 const found=eligible.filter(x=>String(x.rank).includes(q)||x.name.toLowerCase().includes(q));
 const exact=found.find(x=>String(x.rank)===q||x.name.toLowerCase()===q)||found[0];
 if(exact){rank.value=exact.rank;const eligibleType=exact.candidate_type;status.textContent=(found.length>1?fmt(found.length)+' matches. First: ':'')+exact.name+' · AIR '+fmt(exact.rank)+' · '+exact.category+' · '+eligibleType+' · source page '+exact.page;
 if(/OBC/i.test(exact.category))cat.value='OBC';else if(/EWS/i.test(exact.category))cat.value='EWS';else if(/SC/i.test(exact.category))cat.value='SC';else if(/ST/i.test(exact.category))cat.value='ST';else cat.value='UR';
 pwd.checked=/^yes$/i.test(exact.pwd);run();
 }else if(/^\d+$/.test(q)){rank.value=Number(q);status.textContent='Rank not found in decoded eligible list. Rank-based comparison remains possible.';run()}
 else status.textContent='No name found in the decoded eligibility list. Check spelling or search by AIR.';
}
input.addEventListener('input',candidateSearch);
const columns=()=>pwd.checked?['UR PwD',...(cat.value==='UR'?[]:[cat.value+' PwD'])]:cat.value==='UR'?['UR']:['UR',cat.value];
const count=(r,cols)=>cols.reduce((n,c)=>n+(r.category[cats.indexOf(c)]||0),0);
const regular=r=>['MD','MS','MD/MS'].includes(r.degree);
function run(){
 const rnk=Number(rank.value),cols=columns();
 if(!Number.isInteger(rnk)||rnk<1){$('rankResults').innerHTML='<p class="notice">Enter a valid positive AIR.</p>';return}
 const known=eligible.find(x=>x.rank===rnk),profile=verified.find(x=>x.rank===rnk);
 const ahead=eligible.filter(x=>x.candidate_type==='In-Service'&&x.rank<rnk),behind=eligible.filter(x=>x.candidate_type==='In-Service'&&x.rank>rnk);
 let html='<h2>Rank evidence · AIR '+fmt(rnk)+'</h2>';
 if(known)html+='<p class="rank-note"><strong>'+E(known.name)+'</strong> · '+E(known.category)+' · '+E(known.candidate_type)+' · Eligibility PDF p.'+known.page+'</p>';
 if(profile)html+='<p class="small">Previously verified Round 1 allotment: '+E(profile.round1Course)+' · '+E(profile.round1College)+'.</p>';
 html+='<div class="rank-metrics"><div><strong>'+fmt(ahead.length)+'</strong><span>In-Service eligible ranks ahead</span></div><div><strong>'+fmt(behind.length)+'</strong><span>In-Service eligible ranks behind</span></div><div><strong>'+fmt(ahead.filter(x=>/OBC/i.test(x.category)).length)+'</strong><span>OBC In-Service ahead</span></div><div><strong>'+fmt(chosen.length)+'</strong><span>Preferred specialties</span></div></div>';
 html+='<div class="notice">Eligible-candidate counts show potential competition, not confirmed demand for any subject. Future preferences, upgrade applications, joining decisions and allotment probabilities are unknown. Ranking below is based on the preferences you enter.</div>';
 if(!chosen.length)html+='<p>Add preferred specialties above to see vacancy evidence.</p>';
 chosen.forEach((name,i)=>{
  const pat=patterns[name],vac=data.filter(r=>/Government/i.test(r.type)&&r.quota.startsWith('In-Service')&&pat.test(r.program+' '+r.subject)&&(kind.value==='all'||(kind.value==='regular'?regular(r):!regular(r))));
  const matching=vac.map(r=>({...r,matchSeats:count(r,cols)})).filter(r=>r.matchSeats>0);
  const n=matching.reduce((x,r)=>x+r.matchSeats,0);
  const previous=history.filter(r=>pat.test(r.subject)&&(kind.value==='all'||(kind.value==='regular'?!/NBEMS|DNB|DIPLOMA/i.test(r.subject):/NBEMS|DNB|DIPLOMA/i.test(r.subject)))).filter(r=>{const seat=(r.category||'').split('/')[0].trim();return seat==='UR'||seat===cat.value});
  const high=previous.filter(x=>x.rank<rnk).length,low=previous.filter(x=>x.rank>=rnk).length;
  const nearest=[...previous].sort((a,b)=>Math.abs(a.rank-rnk)-Math.abs(b.rank-rnk)).slice(0,6);
  html+='<div class="rank-evidence"><h3>'+(i+1)+'. '+E(name)+'</h3><div class="rank-metrics"><div><strong>'+fmt(n)+'</strong><span>Compatible Round 2 seats</span></div><div><strong>'+fmt(matching.length)+'</strong><span>Matching vacancy rows</span></div><div><strong>'+fmt(high)+'</strong><span>Round 1 matching allotments ahead of AIR</span></div><div><strong>'+fmt(low)+'</strong><span>Round 1 matching allotments at/below AIR</span></div></div>';
  html+='<div class="scroll"><table class="rank-table"><thead><tr><th>Government college</th><th>Course</th><th>Quota</th><th>Compatible seats</th><th>Reference</th></tr></thead><tbody>';
  html+=matching.length?matching.map(r=>'<tr><td>'+E(r.college)+'</td><td>'+E(r.degree)+'</td><td>'+E(r.quota)+'</td><td>'+r.matchSeats+'</td><td>p.'+r.page+' #'+r.id+'</td></tr>').join(''):'<tr><td colspan="5">No compatible vacancies in the published matrix.</td></tr>';
  html+='</tbody></table></div><p class="small">Nearby Round 1 records: '+(nearest.map(x=>'AIR '+fmt(x.rank)+' ('+E(x.category)+')').join(' · ')||'None in the available shortlist')+'</p></div>';
 });
 html+='<p class="small">Method: '+fmt(history.length)+' extracted Round 1 shortlist records and '+fmt(eligible.length)+' decoded Round 2 eligible candidates. Round 1 rank samples do not prove that those candidates requested upgradation. UR compatibility is indicative, subject to official WBMCC rules. No statistical success percentage is justified by these data.</p>';
 $('rankResults').innerHTML=html;
}
[rank,cat,kind,pwd].forEach(x=>x.addEventListener('change',run));
$('runRank').onclick=run;
input.value='93750';candidateSearch();draw();run();
})();