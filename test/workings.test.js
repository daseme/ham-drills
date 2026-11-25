/* The math questions' worked solutions: each formula box may carry steps (a rule in words, then the calculation) and
   notes naming the mistake behind a wrong option. The box shows wherever the question is met, its pool section as
   well as the Math deck; the steps are open after a miss and behind Show the work after a right answer. */
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
