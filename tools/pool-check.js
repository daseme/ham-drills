/* Checks an exam's data.js: shape, answer range, unique ids, exam counts, that Math's copies match their pool
   originals, and every question's id, stem, options and answer against the official pool. The pool is the committed
   snapshot pools/<exam>.json unless a .docx is given, in which case the snapshot must also be that file's.
     node tools/pool-check.js                                   (Technician, against pools/technician.json)
     node tools/pool-check.js general                           (against pools/general.json)
     node tools/pool-check.js general private/ncvec/general-2023-2027-errata6-feb4-2026.docx
   While an exam's sections are still being written, sections absent from data.js are reported as "not yet added",
   not as failures; a section that is present must hold every live question of its pool section. Questions withdrawn
   by errata are skipped. --data <file> checks another data file (for tests). Exits 1 on any failure. */
"use strict";
const fs=require("fs"),path=require("path"),vm=require("vm");
const {loadPool,sha256,snapshotPath,diffPools}=require("./pool-parse");

const ROOT=path.join(__dirname,"..");
const args=process.argv.slice(2),flag=k=>{const i=args.indexOf(k);return i<0?null:args.splice(i,2)[1]};
const dataFile=flag("--data");
const exam=["technician","general"].includes(args[0])?args.shift():"technician";
const file=args[0]||(fs.existsSync(snapshotPath(exam))?snapshotPath(exam):null);

const ctx={window:{}};vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT,exam,"exam.js"),"utf8"),ctx);
vm.runInContext(fs.readFileSync(dataFile||path.join(ROOT,exam,"data.js"),"utf8"),ctx);
const C=ctx.window.EXAM_CONFIG,DECKS=ctx.window.DECKS;

const fails=[],notes=[];
const fail=m=>fails.push(m);

/* ---------- data checks ---------- */
const POOL=DECKS.filter(d=>d.exam>0),byId=new Map(),complete=POOL.length===C.sections;
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
if(complete&&examSum!==C.examQ)fail(`exam counts sum to ${examSum}, not ${C.examQ}`);
for(const d of DECKS.filter(d=>!d.exam&&d.Q))for(const q of d.Q){
  const o=byId.get(q[0]);
  if(!o)fail(`${d.id} ${q[0]}: not in any pool section`);
  else if(JSON.stringify(q.slice(1,4))!==JSON.stringify(o.q.slice(1,4)))fail(`${d.id} ${q[0]}: differs from its copy in ${o.deck}`);
}
/* A flash-card deck: cards keyed once each (the short key, else the name), with text and a hook; sources, when
   given, are pool questions. */
for(const d of DECKS.filter(d=>d.flash)){const seen=new Set();
  if("prompt" in d&&(typeof d.prompt!=="string"||!d.prompt.trim()))fail(`${d.id}: prompt must be a non-empty string`);
  for(const c of d.flash){
    const key=c.k||c.n;
    if(typeof c.n!=="string"||!c.n.trim())fail(`${d.id}: a card has no name`);
    if("k" in c&&(typeof c.k!=="string"||!/^[a-z0-9-]+$/.test(c.k)))fail(`${d.id}: card ${c.n} has a bad key`);
    if(seen.has(key))fail(`${d.id}: card key ${key} appears twice`);
    seen.add(key);
    if(typeof c.a!=="string"||!c.a.trim()||typeof c.t!=="string")fail(`${d.id}: card ${c.n} needs text and a hook`);
    for(const q of c.q==null?[]:[].concat(c.q))if(!byId.has(q))fail(`${d.id}: card ${c.n} cites ${q}, not a pool question`)}}
notes.push(`${C.shortName} data: ${byId.size} pool questions in ${POOL.length} sections${complete?`, exam counts sum to ${examSum}`:` of ${C.sections}`}`);

/* ---------- pool comparison ---------- */
if(file){
  const pool=loadPool(file,C.idLetter);
  pool.problems.forEach(fail);
  /* Given the .docx itself, the committed snapshot must be a snapshot of it, or CI is checking against stale text. */
  if(!pool.source&&fs.existsSync(snapshotPath(exam))){const snap=loadPool(snapshotPath(exam)),d=diffPools(snap,pool);
    if(d.length||sha256(file)!==snap.source.sha256)fail(`pools/${exam}.json is not a snapshot of ${path.basename(file)}${d.length?":\n    "+d.join("\n    "):" (same text, different file)"}; run tools/pool-snapshot.js`)}
  /* Typography is compared loosely (curly quotes, dashes, spacing); words, numbers and the answer exactly. */
  const norm=s=>s.normalize("NFKC").replace(/[‘’ʼ′]/g,"'").replace(/[“”″]/g,'"').replace(/[‐-―−]/g,"-").replace(/\s+/g," ").trim();
  /* data.js text is HTML (&sup2;, &times;), so it is compared as a learner sees it. */
  const ENT={amp:"&",lt:"<",gt:">",quot:'"',apos:"'",sup2:"²",sup3:"³",times:"×",divide:"÷",minus:"−",micro:"µ",lambda:"λ",asymp:"≈",ldquo:"“",rdquo:"”",Omega:"Ω",deg:"°",plusmn:"±"};
  const text=h=>h.replace(/<[^>]+>/g,"").replace(/&(#x?[0-9a-f]+|\w+);/gi,(m,c)=>c[0]==="#"?String.fromCodePoint(c[1]==="x"?parseInt(c.slice(2),16):+c.slice(1)):ENT[c]??m);
  const written=new Set(POOL.map(d=>d.code)),notYet=new Set();
  let exact=0,loose=0;
  for(const [id,p] of pool.questions){
    const o=byId.get(id);
    if(!o){if(written.has(id.slice(0,2)))fail(`${id}: in the pool, missing from data.js`);else notYet.add(id.slice(0,2));continue}
    const stem=text(o.q[1]),opts=o.q[2].map(text),ans=o.q[3];
    if(stem===p.stem&&opts.every((x,k)=>x===p.opts[k])&&ans===p.ans){exact++;continue}
    if(ans!==p.ans)fail(`${id}: answer is ${"ABCD"[ans]} in data.js, ${"ABCD"[p.ans]} in the pool`);
    if(norm(stem)!==norm(p.stem))fail(`${id}: stem differs\n    pool: ${p.stem}\n    data: ${stem}`);
    opts.forEach((x,k)=>{if(norm(x)!==norm(p.opts[k]))fail(`${id}: option ${"ABCD"[k]} differs\n    pool: ${p.opts[k]}\n    data: ${x}`)});
    if(ans===p.ans&&norm(stem)===norm(p.stem)&&opts.every((x,k)=>norm(x)===norm(p.opts[k])))loose++;
  }
  for(const id of byId.keys())if(!pool.questions.has(id))fail(`${id}: in data.js, not in the pool${pool.withdrawn.includes(id)?" (withdrawn)":""}`);
  for(const d of POOL){const s=pool.sections[d.code];if(s&&s.exam!==d.exam)fail(`${d.code}: ${d.exam} exam questions in data.js, ${s.exam} in the pool`)}
  notes.push(`${pool.source?`pools/${exam}.json (${pool.source.file})`:path.basename(file)}: ${pool.questions.size} questions (${pool.withdrawn.length} withdrawn); ${exact} match exactly, ${loose} differ only in typography`);
  /* Sections run 1 to 9, then 0. */
  const rank=code=>code[1]==="0"?10:+code[1];
  if(notYet.size)notes.push(`not yet added: ${[...notYet].sort((a,b)=>rank(a)-rank(b)).join(", ")}`);
}

for(const n of notes)console.log(n);
if(fails.length){console.log(`\n${fails.length} problem${fails.length===1?"":"s"}:`);for(const f of fails)console.log("  "+f);process.exit(1)}
console.log("OK");
