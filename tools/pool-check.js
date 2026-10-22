/* Checks data.js. With no argument, the checks that need no pool file: shape, answer range, unique ids, exam
   counts, and that Math's copies match their pool originals. With the NCVEC pool .docx, also compares every
   question's id, stem, options and answer against it.
     node tools/pool-check.js
     node tools/pool-check.js "private/ncvec/2026-2030 Technician Pool and Syllabus Public Release Feb 19 2026.docx"
   data.js was produced once from the pool and is maintained by hand; this is how it is kept honest. Exits 1 on
   any failure. */
"use strict";
const fs=require("fs"),path=require("path"),vm=require("vm");
const {docxParagraphs}=require("./docx-text");

const ROOT=path.join(__dirname,"..");
const ctx={window:{}};vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT,"data.js"),"utf8"),ctx);
const DECKS=ctx.window.DECKS;

const fails=[],notes=[];
const fail=m=>fails.push(m);

/* ---------- data checks ---------- */
const POOL=DECKS.filter(d=>d.exam>0),byId=new Map();
for(const d of POOL){
  for(const q of d.Q){
    const [id,stem,opts,ans,why]=q;
    if(byId.has(id))fail(`${id}: appears in ${byId.get(id).deck} and ${d.id}`);
    byId.set(id,{deck:d.id,q});
    if(!id.startsWith(d.code))fail(`${id}: filed under ${d.code}`);
    if(!d.G||!d.G[id.slice(0,3)])fail(`${id}: group ${id.slice(0,3)} has no name in ${d.id}.G`);
    if(typeof stem!=="string"||!stem.trim())fail(`${id}: empty stem`);
    if(!Array.isArray(opts)||opts.length!==4||opts.some(o=>typeof o!=="string"||!o.trim()))fail(`${id}: needs four non-empty options`);
    if(!Number.isInteger(ans)||ans<0||ans>3)fail(`${id}: answer index ${ans} out of range`);
    if(typeof why!=="string"||!why.trim())fail(`${id}: no explanation`);
  }
}
const examSum=POOL.reduce((a,d)=>a+d.exam,0);
if(examSum!==35)fail(`exam counts sum to ${examSum}, not 35`);
for(const d of DECKS.filter(d=>!d.exam&&d.Q))for(const q of d.Q){
  const o=byId.get(q[0]);
  if(!o)fail(`${d.id} ${q[0]}: not in any pool section`);
  else if(JSON.stringify(q.slice(1,4))!==JSON.stringify(o.q.slice(1,4)))fail(`${d.id} ${q[0]}: differs from its copy in ${o.deck}`);
}
notes.push(`data.js: ${byId.size} pool questions in ${POOL.length} sections, exam counts sum to ${examSum}`);

/* ---------- pool comparison ---------- */
const file=process.argv[2];
if(file){
  /* A question is its id line "T1A01 (C) [97.1]", the stem, options A. to D., then a "~~" line. */
  const lines=docxParagraphs(file),pool=new Map();
  for(let i=0;i<lines.length;i++){
    const m=lines[i].match(/^(T\d[A-Z]\d\d)\s*\(([A-D])\)/);if(!m)continue;
    const block=[];for(i++;i<lines.length&&lines[i]!=="~~";i++)block.push(lines[i]);
    const at=block.findIndex(l=>/^A\.\s/.test(l)),opts=block.slice(at,at+4);
    if(at<1||opts.length!==4||!opts.every((o,k)=>o.startsWith("ABCD"[k]+".")))fail(`${m[1]}: couldn't parse in the pool file`);
    pool.set(m[1],{stem:block.slice(0,at).join(" "),opts:opts.map(o=>o.slice(2).trim()),ans:"ABCD".indexOf(m[2])});
  }
  /* Typography is compared loosely (curly quotes, dashes, spacing); words, numbers and the answer exactly. */
  const norm=s=>s.normalize("NFKC").replace(/[‘’ʼ′]/g,"'").replace(/[“”″]/g,'"').replace(/[‐-―−]/g,"-").replace(/\s+/g," ").trim();
  /* data.js text is HTML (&sup2;, &times;), so it is compared as a learner sees it. */
  const ENT={amp:"&",lt:"<",gt:">",quot:'"',apos:"'",sup2:"²",sup3:"³",times:"×",divide:"÷",minus:"−",micro:"µ",lambda:"λ",asymp:"≈",ldquo:"“",rdquo:"”",Omega:"Ω",deg:"°",plusmn:"±"};
  const text=h=>h.replace(/<[^>]+>/g,"").replace(/&(#x?[0-9a-f]+|\w+);/gi,(m,c)=>c[0]==="#"?String.fromCodePoint(c[1]==="x"?parseInt(c.slice(2),16):+c.slice(1)):ENT[c]??m);
  let exact=0,loose=0;
  for(const [id,p] of pool){
    const o=byId.get(id);if(!o){fail(`${id}: in the pool, missing from data.js`);continue}
    const stem=text(o.q[1]),opts=o.q[2].map(text),ans=o.q[3];
    if(stem===p.stem&&opts.every((x,k)=>x===p.opts[k])&&ans===p.ans){exact++;continue}
    if(ans!==p.ans)fail(`${id}: answer is ${"ABCD"[ans]} in data.js, ${"ABCD"[p.ans]} in the pool`);
    if(norm(stem)!==norm(p.stem))fail(`${id}: stem differs\n    pool: ${p.stem}\n    data: ${stem}`);
    opts.forEach((x,k)=>{if(norm(x)!==norm(p.opts[k]))fail(`${id}: option ${"ABCD"[k]} differs\n    pool: ${p.opts[k]}\n    data: ${x}`)});
    if(ans===p.ans&&norm(stem)===norm(p.stem)&&opts.every((x,k)=>norm(x)===norm(p.opts[k])))loose++;
  }
  for(const id of byId.keys())if(!pool.has(id))fail(`${id}: in data.js, not in the pool`);
  notes.push(`${path.basename(file)}: ${pool.size} questions; ${exact} match exactly, ${loose} differ only in typography`);
}

for(const n of notes)console.log(n);
if(fails.length){console.log(`\n${fails.length} problem${fails.length===1?"":"s"}:`);for(const f of fails)console.log("  "+f);process.exit(1)}
console.log("OK");
