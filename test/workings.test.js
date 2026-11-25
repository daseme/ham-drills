/* The math questions' worked solutions: each formula box may carry steps (a rule in words, then the calculation) and
   notes naming the mistake behind a wrong option. The box shows wherever the question is met, its pool section as
   well as the Math deck; the steps are open after a miss and behind Show the work after a right answer. A question
   missed on half its tries or more, three times at least, gets a box of other ways in, once per drill, with the
   explanation opened and a memory hook to write, which is kept, shown after the question and backed up. */
"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const {load}=require("./harness");

for(const exam of ["technician","general"]){
  test(`${exam}: every math question's steps and mistake notes are well formed`,()=>{
    const a=load({exam}),m=a.run("DECK.math");
    for(const q of m.Q){const F=m.F[q[0]];
      assert.ok(Array.isArray(F)&&F.length>=2&&F.length<=4,q[0]);
      if(F[2]){assert.ok(F[2].length,q[0]);
        for(const s of F[2])assert.ok(typeof s==="string"||(Array.isArray(s)&&s.length===2&&s[0]+s[1]),`${q[0]}: ${JSON.stringify(s)}`)}
      if(F[3])for(const k in F[3]){
        assert.ok(+k!==q[3]&&k in q[2],`${q[0]}: a note for option ${k}, the answer or no option`);
        assert.ok(F[3][k].length>10,`${q[0]}: note for ${k}`)}}
  });
}

/* Runs a list drill of one pool-section question and picks the given option. */
function answerIn(exam,deck,id,pick){
  const a=load({exam});
  a.run(`drill({cards:[{d:DECK.${deck},q:DECK.${deck}.Q.find(q=>q[0]==="${id}")}],title:"t",sub:"s"})`);
  const oi=pick==="right"?a.run(`DECK.${deck}.Q.find(q=>q[0]==="${id}")[3]`):pick;
  a.run(`[...$("ans").children].find(b=>+b.dataset.oi===${oi}).onclick();0`);
  return a.run(`$("after").innerHTML`);
}

test("a math question met in its pool section shows the formula and the steps, behind Show the work when right",()=>{
  const h=answerIn("general","g5","G5B03","right");
  assert.match(h,/class="fx"/);
  assert.match(h,/<details class="work"><summary>Show the work<\/summary>/);
  assert.match(h,/Power equals voltage squared divided by resistance\./);
  assert.doesNotMatch(h,/class="why"/);
});

test("a miss opens the steps and names the mistake behind the option picked",()=>{
  const h=answerIn("general","g5","G5B03",0);
  assert.match(h,/<div class="work">/);
  assert.match(h,/<p class="why">That is E ÷ R, the current in amperes\./);
});

test("a wrong option with no known mistake gets the steps and no note",()=>{
  const h=answerIn("technician","t5","T5D09",0);
  assert.match(h,/<div class="work">/);
  assert.doesNotMatch(h,/class="why"/);
});

/* Misses one card n times, a fresh drill each time so the once-per-drill rule does not hide the box; then, if given,
   answers it right m times. Returns the app and the last feedback. */
function missTimes(exam,deck,id,n,m=0){
  const a=load({exam}),q=`DECK.${deck}.Q.find(q=>q[0]==="${id}")`;
  const once=oi=>{a.run(`drill({cards:[{d:DECK.${deck},q:${q}}],title:"t",sub:"s"})`);a.run(`[...$("ans").children].find(b=>+b.dataset.oi===${oi}).onclick();0`)};
  const ans=a.run(`${q}[3]`);
  for(let i=0;i<n;i++)once((ans+1)%4);
  for(let i=0;i<m;i++)once(ans);
  return {a,h:a.run(`$("after").innerHTML`),miss:()=>{once((ans+1)%4);return a.run(`$("after").innerHTML`)}};
}

test("the third miss of a question suggests other ways in, opens the explanation, and links its topic's drill",()=>{
  assert.doesNotMatch(missTimes("technician","t1","T1A01",2).h,/class="stuck"/);
  const {a,h}=missTimes("technician","t1","T1A01",3);
  assert.match(h,/<b>Missed 3 of 3 tries\.<\/b>/);
  assert.match(h,/Make a hook/);
  assert.match(h,/<a href="#t1\/p\/[^"]+">Drill the \d+ questions on /);
  assert.equal(a.run(`$("exbox").hidden`),false,"the explanation is open");
  assert.match(h,/<details open><summary>Basics: /);
});

test("a card missed often but answered right more often since gets no stuck box",()=>{
  /* 3 misses and 5 right, then a miss: 4 of 9 tries, under half. */
  const {miss}=missTimes("technician","t1","T1A01",3,5);
  assert.doesNotMatch(miss(),/class="stuck"/);
});

test("within one drill the stuck box shows once per card",()=>{
  const a=load({exam:"technician"}),q=`DECK.t1.Q.find(q=>q[0]==="T1A01")`,ans=a.run(`${q}[3]`);
  a.run(`drill({cards:[{d:DECK.t1,q:${q}}],title:"t",sub:"s"})`);
  const miss=()=>{a.run(`[...$("ans").children].find(b=>+b.dataset.oi===${(ans+1)%4}).onclick();0`);return a.run(`$("after").innerHTML`)};
  for(let i=0;i<2;i++){miss();a.run(`$("next").onclick();0`)}
  assert.match(miss(),/class="stuck"/);a.run(`$("next").onclick();0`);
  assert.doesNotMatch(miss(),/class="stuck"/,"the repeat in the same drill");
});

test("a hook written from the stuck box shows after the question, travels in the backup, and imports without overwriting",()=>{
  const {a}=missTimes("technician","t1","T1A01",3);
  a.run(`$("writeHook").onclick();$("hookText").value="  Eleven bands, think of a soccer team  ";$("saveHook").onclick();0`);
  assert.equal(a.run(`HOOKS.T1A01`),"Eleven bands, think of a soccer team");
  assert.match(a.run(`$("hookArea").innerHTML`),/<b>Your hook:<\/b> Eleven bands, think of a soccer team/);
  assert.equal(JSON.parse(a.run(`JSON.stringify(exportData())`)).hooks.T1A01,"Eleven bands, think of a soccer team");
  assert.equal(a.run(`JSON.stringify(get("hooks",{}))`),JSON.stringify({T1A01:"Eleven bands, think of a soccer team"}));
  a.run(`mergeHooks({T1A01:"other",T1A02:"new one",NOPE:"x",T1A03:7});0`);
  assert.deepEqual(JSON.parse(a.run(`JSON.stringify(HOOKS)`)),{T1A01:"Eleven bands, think of a soccer team",T1A02:"new one"});
  a.run(`saveHook("T1A02","   ");0`);
  assert.equal(a.run(`"T1A02" in HOOKS`),false,"an empty hook removes it");
});
