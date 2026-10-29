/* Reads an NCVEC question pool .docx: every live question with its answer, the questions withdrawn by errata, and
   each section's name and exam count. Shared by pool-check.js, pool-import.js, pool-snapshot.js and pool-fetch.js.
   A question is its id line "G1A05 (A) [97.301(d)]", the stem, options A. to D., then a "~~" line; a withdrawn one is
   a line like "G1A04  Question Deleted (section not renumbered)".
   The same shape also comes from a snapshot, pools/<exam>.json: the parsed pool with where it came from, written by
   pool-snapshot.js and committed, so the comparison with the official pool runs anywhere, with no .docx at hand. */
"use strict";
const fs=require("fs"),path=require("path"),crypto=require("crypto");
const {docxParagraphs}=require("./docx-text");

function parsePool(file,letter){
  const lines=docxParagraphs(file),L=letter;
  const questions=new Map(),withdrawn=[],sections={},groups={},problems=[];
  /* @ stands for the exam's id letter (T, G). */
  const re=(src,f)=>new RegExp(src.replace(/@/g,L),f);
  const idLine=re(String.raw`^(@\d[A-Z]\d\d)\s*\(([A-D])\)`),gone=re(String.raw`^(@\d[A-Z]\d\d)\s+Question Deleted`,"i");
  const sectionLine=re(String.raw`^SUBELEMENT (@\d)\s*[–-]\s*(.+?)\s*\[(\d+) Exam Questions`,"i"),groupLine=re(String.raw`^(@\d[A-Z])\s+(?:[–-]\s*)?(\D.*)$`);
  for(let i=0;i<lines.length;i++){
    const l=lines[i];let m;
    if((m=l.match(sectionLine))){sections[m[1]]={name:m[2],exam:+m[3]};continue}
    if((m=l.match(gone))){withdrawn.push(m[1]);continue}
    if((m=l.match(idLine))){
      const block=[];for(i++;i<lines.length&&lines[i]!=="~~";i++)block.push(lines[i]);
      const at=block.findIndex(x=>/^A\.\s/.test(x)),opts=block.slice(at,at+4);
      if(at<1||opts.length!==4||!opts.every((o,k)=>o.startsWith("ABCD"[k]+"."))){problems.push(`${m[1]}: couldn't parse in the pool file`);continue}
      const stem=block.slice(0,at).join(" "),fig=(stem.match(/figure\s+([A-Z]\d?-\d+)/i)||[])[1];
      questions.set(m[1],{stem,opts:opts.map(o=>o.slice(2).trim()),ans:"ABCD".indexOf(m[2]),fig:fig&&fig.toUpperCase()});
      continue;
    }
    if((m=l.match(groupLine)))groups[m[1]]=m[2].trim();
  }
  return {questions,withdrawn,sections,groups,problems};
}

const sha256=file=>crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const snapshotPath=exam=>path.join(__dirname,"..","pools",exam+".json");

/* A snapshot from a parsed pool and a record of its source. fig is kept only where there is one. */
function makeSnapshot(pool,source){
  const questions={};
  for(const [id,q] of pool.questions)questions[id]=q.fig?{stem:q.stem,opts:q.opts,ans:q.ans,fig:q.fig}:{stem:q.stem,opts:q.opts,ans:q.ans};
  return {source,sections:pool.sections,groups:pool.groups,withdrawn:pool.withdrawn,questions};
}
/* The snapshot's layout: the header fields, then one question per line, so a change diffs as the questions it touched. */
function snapshotText(s){
  const head=Object.entries(s).filter(([k])=>k!=="questions").map(([k,v])=>JSON.stringify(k)+":"+JSON.stringify(v));
  return "{\n"+head.join(",\n")+",\n\"questions\":{\n"+Object.entries(s.questions).map(([id,q])=>JSON.stringify(id)+":"+JSON.stringify(q)).join(",\n")+"\n}}\n";
}
/* A pool from a .docx or from a snapshot, in the same shape; a snapshot also carries its source. */
function loadPool(file,letter){
  if(!/\.json$/i.test(file))return parsePool(file,letter);
  const s=JSON.parse(fs.readFileSync(file,"utf8"));
  return {questions:new Map(Object.entries(s.questions)),withdrawn:s.withdrawn,sections:s.sections,groups:s.groups,problems:[],source:s.source};
}
/* What changed from pool a to pool b: questions added, gone or altered in stem, options, answer or figure, and
   section exam counts. Empty when they are the same pool. */
function diffPools(a,b){
  const out=[];
  for(const id of b.questions.keys())if(!a.questions.has(id))out.push(`${id}: new`);
  for(const [id,q] of a.questions){const p=b.questions.get(id);
    if(!p){out.push(`${id}: gone${b.withdrawn.includes(id)?" (withdrawn)":""}`);continue}
    if(q.stem!==p.stem)out.push(`${id}: stem changed`);
    q.opts.forEach((o,k)=>{if(o!==p.opts[k])out.push(`${id}: option ${"ABCD"[k]} changed`)});
    if(q.ans!==p.ans)out.push(`${id}: answer changed from ${"ABCD"[q.ans]} to ${"ABCD"[p.ans]}`);
    if((q.fig||null)!==(p.fig||null))out.push(`${id}: figure changed`)}
  for(const c in b.sections)if(!a.sections[c]||a.sections[c].exam!==b.sections[c].exam)out.push(`${c}: now ${b.sections[c].exam} exam questions`);
  return out;
}
module.exports={parsePool,loadPool,sha256,snapshotPath,makeSnapshot,snapshotText,diffPools};
