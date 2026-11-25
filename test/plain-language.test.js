/* House limits for the explanations, taken from the countable rules of ASD-STE100 Simplified Technical English and
   applied under ISO 24495-1 plain language: no sentence over 25 words, no paragraph over 6 sentences. The pool's own
   question text is exempt; it must match the NCVEC's word for word. */
"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("fs"),path=require("path"),vm=require("vm");

const ROOT=path.join(__dirname,"..");
const MAX_WORDS=25,MAX_SENTENCES=6;

/* Splits a paragraph into sentences: at . ! or ? followed by a space and a capital, digit, sign or opening mark;
   not inside decimals or after common abbreviations. A sentence may also start with a unit such as dBi. */
function sentences(p){
  const held=p.replace(/(\d)\.(\d)/g,"$1·$2").replace(/\b(e\.g|i\.e|vs|approx|etc|U\.S|St|Dr|Mr|Ms)\./g,m=>m.replace(/\./g,"·"));
  return held.split(/(?<=[.!?]["”)]?)\s+(?=[A-Z0-9"“(+−\-]|dB)/).map(s=>s.replace(/·/g,".").trim()).filter(Boolean);
}
const words=s=>s.split(/\s+/).filter(w=>/[A-Za-z0-9]/.test(w)).length;

function explain(exam){const ctx={window:{}};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(ROOT,exam,"explain.js"),"utf8"),ctx);return ctx.window.EXPLAIN}

test("the splitter keeps decimals and abbreviations whole, and splits at a sign or a digit",()=>{
  assert.deepEqual(sentences("It is 2.5 kHz, e.g. one channel. +3 is strong. 20 dB is 100 times. dBi is higher."),["It is 2.5 kHz, e.g. one channel.","+3 is strong.","20 dB is 100 times.","dBi is higher."]);
});

for(const exam of ["technician","general"]){
  test(`${exam}: no explanation has a sentence over ${MAX_WORDS} words or a paragraph over ${MAX_SENTENCES} sentences`,()=>{
    const bad=[];
    for(const [id,t] of Object.entries(explain(exam)))for(const p of t.split(/\n\s*\n/)){
      const ss=sentences(p);
      if(ss.length>MAX_SENTENCES)bad.push(`${id}: a paragraph of ${ss.length} sentences`);
      for(const s of ss)if(words(s)>MAX_WORDS)bad.push(`${id} (${words(s)} words): ${s}`)}
    assert.deepEqual(bad,[]);
  });
}

module.exports={sentences,words};
