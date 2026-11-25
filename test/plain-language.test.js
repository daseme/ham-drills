/* House limits for every piece of learner-facing text, taken from the countable rules of ASD-STE100 Simplified
   Technical English and applied under ISO 24495-1 plain language: no sentence over 25 words, no paragraph over 6
   sentences. Covered: the explanations, each question's short note, the primers, the flash cards, the symbols, the
   math steps and mistake notes, deck intros and the cheat sheets. The pool's own question and answer text is exempt;
   it must match the NCVEC's word for word. */
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

/* HTML to text: block ends become paragraph breaks, a list item is its own paragraph, entities become a character. */
const strip=h=>String(h).replace(/<(br|\/p|\/li|\/h\d|\/tr|\/td|\/th|\/div|\/ul|\/ol|\/figcaption)[^>]*>/gi,"\n\n").replace(/<[^>]+>/g,"").replace(/&[a-z]+;|&#\d+;/gi,"x");
function load(exam,file){const ctx={window:{}};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(ROOT,exam,file),"utf8"),ctx);return ctx.window}
/* Every piece of learner-facing text in an exam's data.js and exam.js, as [label, text]. */
function texts(exam){
  const out=[],{DECKS}=load(exam,"data.js"),{EXAM_CONFIG:C}=load(exam,"exam.js");
  for(const d of DECKS){
    for(const q of d.Q||[])out.push([`${q[0]} note`,strip(q[4])]);
    for(const k in d.P||{})out.push([`${d.id} primer ${k}`,strip(d.P[k][1])]);
    for(const c of d.flash||[])out.push([`${d.id} card ${c.k||c.n}`,strip(c.a)+"\n\n"+strip(c.t)]);
    for(const x of d.S||[])out.push([`symbol ${x.n}`,strip(x.def)+"\n\n"+strip(x.t)]);
    for(const id in d.F||{}){const F=d.F[id];
      for(const st of F[2]||[])if(Array.isArray(st))out.push([`${id} step`,strip(st[0])]);
      for(const k in F[3]||{})out.push([`${id} mistake ${k}`,strip(F[3][k])])}
    if(d.intro)out.push([`${d.id} intro`,d.intro]);
    if(d.cheat)out.push([`${d.id} cheat sheet`,strip(d.cheat)]);
  }
  for(const k in C.cheats||{})out.push([`${k} cheat sheet`,strip(C.cheats[k].replace(/<svg[\s\S]*?<\/svg>/g,""))]);
  return out;
}
function check(items){
  const bad=[];
  for(const [id,t] of items)for(const p of String(t).split(/\n\s*\n/)){
    const ss=sentences(p.replace(/\s+/g," ").trim());
    if(ss.length>MAX_SENTENCES)bad.push(`${id}: a paragraph of ${ss.length} sentences`);
    for(const s of ss)if(words(s)>MAX_WORDS)bad.push(`${id} (${words(s)} words): ${s}`)}
  return bad;
}

function explain(exam){const ctx={window:{}};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(ROOT,exam,"explain.js"),"utf8"),ctx);return ctx.window.EXPLAIN}

test("the splitter keeps decimals and abbreviations whole, and splits at a sign or a digit",()=>{
  assert.deepEqual(sentences("It is 2.5 kHz, e.g. one channel. +3 is strong. 20 dB is 100 times. dBi is higher."),["It is 2.5 kHz, e.g. one channel.","+3 is strong.","20 dB is 100 times.","dBi is higher."]);
});

for(const exam of ["technician","general"]){
  test(`${exam}: notes, primers, cards, symbols, math steps, intros and cheat sheets keep to the same limits`,()=>{
    const items=texts(exam);
    assert.ok(items.length>500,`${items.length} pieces of text`);
    assert.deepEqual(check(items),[]);
  });
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
