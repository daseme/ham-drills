/* Prints one section of an NCVEC pool as a data.js deck skeleton (JSON), to paste into an exam's data.js and fill in:
     node tools/pool-import.js <pool.docx> G1
   Stems and options are copied verbatim (HTML-escaped); notes, primers (P) and topics (CON) are left empty, and the
   deck's name and group names are the pool's own, to be shortened by hand. Withdrawn questions are left out. */
"use strict";
const {parsePool}=require("./pool-parse");

const [file,code]=process.argv.slice(2);
if(!file||!/^[A-Z]\d$/.test(code||"")){console.error("usage: node tools/pool-import.js <pool.docx> <section, e.g. G1>");process.exit(2)}
const pool=parsePool(file,code[0]),sec=pool.sections[code];
if(!sec){console.error(`no section ${code} in ${file}`);process.exit(1)}
const html=s=>s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const Q=[...pool.questions].filter(([id])=>id.startsWith(code)).map(([id,q])=>{
  const row=[id,html(q.stem),q.opts.map(html),q.ans,""];if(q.fig)row.push(q.fig);return row});
const G=Object.fromEntries(Object.entries(pool.groups).filter(([g])=>g.startsWith(code)));
console.log(JSON.stringify({id:code.toLowerCase(),code,name:sec.name,exam:sec.exam,G,Q,P:{},CON:{}},null,1));
