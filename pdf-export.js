(function(){
"use strict";
const ascii=s=>String(s??"").normalize("NFKD").replace(/[^\x20-\x7e]/g," ").replace(/\\/g,"/").replace(/[()]/g,"");
function pdfBuild(title,columns,records,summary){
 const W=842,H=595, left=35, right=807, rowH=23, top=135,bottom=55;
 const widths=columns.map(c=>c.width||Math.floor((right-left)/columns.length));
 const pages=[],pageMax=Math.floor((H-top-bottom)/rowH);
 for(let i=0;i<Math.max(1,records.length);i+=pageMax)pages.push(records.slice(i,i+pageMax));
 const objects=[null], add=v=>(objects.push(v),objects.length-1);
 const catalog=add(""),root=add(""),font=add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
 const bold=add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
 const pageIds=[];
 const e=s=>ascii(s).slice(0,240);
 function txt(x,y,s,size=10,face="F1",color="0.10 0.22 0.34 rg"){
  return color+"\nBT /"+face+" "+size+" Tf 1 0 0 1 "+x+" "+y+" Tm ("+e(s)+") Tj ET\n";
 }
 function line(x1,y1,x2,y2,color="0.84 0.89 0.92 RG"){return color+"\n"+x1+" "+y1+" m "+x2+" "+y2+" l S\n"}
 pages.forEach((set,p)=>{
  let stream="q\n1 1 1 rg 0 0 "+W+" "+H+" re f\nQ\n";
  stream+="q 0.95 0.97 0.985 rg 0 510 842 85 re f Q\n";
  stream+="q 0.07 0.38 0.50 rg 35 529 45 45 re f Q\n";
  stream+=txt(44,547,"PG",21,"F2","1 1 1 rg");
  stream+=txt(93,557,title,18,"F2");
  stream+=txt(93,536,"WB PG Seat Finder  |  2026 Round 2",10);
  stream+=txt(35,494,summary,9);
  stream+=txt(35,480,"Source: WBMCC 2026 Round 2 matrix  |  Verify official counselling notices",8);
  stream+="q /GS1 gs 0.92 0.95 0.97 rg 260 177 325 210 re f Q\n";
  stream+=txt(315,267,"WB PG",74,"F2","0.92 0.94 0.96 rg");
  let x=left;
  columns.forEach((c,i)=>{stream+=txt(x+3,443,c.name,9,"F2");x+=widths[i]});
  stream+=line(left,435,right,435);
  set.forEach((record,i)=>{
   const y=420-i*rowH;
   if(i%2===0)stream+="q 0.97 0.98 0.99 rg "+left+" "+(y-8)+" "+(right-left)+" "+rowH+" re f Q\n";
   let xx=left;
   record.forEach((v,j)=>{const max=Math.max(5,Math.floor((widths[j]-7)/5.2));let s=e(v);if(s.length>max)s=s.slice(0,max-2)+"..";stream+=txt(xx+3,y,s,8);xx+=widths[j]});
   stream+=line(left,y-9,right,y-9);
  });
  stream+=line(left,43,right,43);
  stream+=txt(left,27,"Made by Mainul  |  mainul.pages.dev",9);
  stream+=txt(745,27,"Page "+(p+1)+" / "+pages.length,9);
  const streamId=add("<< /Length "+new TextEncoder().encode(stream).length+" >>\nstream\n"+stream+"\nendstream");
  const page=add("<< /Type /Page /Parent "+root+" 0 R /MediaBox [0 0 "+W+" "+H+"] /Resources << /Font << /F1 "+font+" 0 R /F2 "+bold+" 0 R >> /ExtGState << /GS1 << /Type /ExtGState /ca 0.3 >> >> >> /Contents "+streamId+" 0 R >>");
  pageIds.push(page);
 });
 objects[root]="<< /Type /Pages /Count "+pageIds.length+" /Kids ["+pageIds.map(id=>id+" 0 R").join(" ")+"] >>";
 objects[catalog]="<< /Type /Catalog /Pages "+root+" 0 R >>";
 let output="%PDF-1.4\n", offsets=[0];
 objects.slice(1).forEach((o,i)=>{offsets.push(output.length);output+=(i+1)+" 0 obj\n"+o+"\nendobj\n"});
 const start=output.length;output+="xref\n0 "+objects.length+"\n0000000000 65535 f \n";
 offsets.slice(1).forEach(n=>output+=String(n).padStart(10,"0")+" 00000 n \n");
 output+="trailer\n<< /Size "+objects.length+" /Root "+catalog+" 0 R >>\nstartxref\n"+start+"\n%%EOF";
 return new Blob([output],{type:"application/pdf"});
}
let previewUrl;
function preview(blob,name){
 if(previewUrl)URL.revokeObjectURL(previewUrl);
 previewUrl=URL.createObjectURL(blob);
 let modal=document.getElementById("wbpg-pdf-modal");
 if(!modal){modal=document.createElement("dialog");modal.id="wbpg-pdf-modal";modal.className="pdf-dialog";modal.innerHTML='<div class="pdf-head"><strong>PDF preview</strong><div><a id="wbpg-pdf-download" class="pdf-download">Download PDF</a><button type="button" id="wbpg-pdf-close">Close</button></div></div><iframe title="PDF preview"></iframe>';document.body.append(modal);modal.querySelector("#wbpg-pdf-close").onclick=()=>modal.close();modal.addEventListener("close",()=>{modal.querySelector("iframe").src="about:blank"});}
 const a=modal.querySelector("a");a.href=previewUrl;a.download=name;
 modal.querySelector("iframe").src=previewUrl;
 if(!modal.open)modal.showModal();
}
window.WBPG_PDF={build:pdfBuild,preview};
})();