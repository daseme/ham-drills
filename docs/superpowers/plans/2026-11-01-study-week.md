# Study Week Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The home screen shows the current week as seven dots under a goal of 7 days with 2 days off in reserve, with weeks made in a row, fed by a per-day log that every answer and practice exam updates.

**Architecture:** One new storage key, `days`, written by `record`, `saveExam` and the first touch of a day, read by pure helpers (`dayFloor`, `dayMet`, `weekState`) that the home screen, the three drill end screens and the exam result render from. Everything lives in app/app.js and app/app.css as the rest of the app does; tests run the real script in test/harness.js, which gains a way to pin the clock.

**Tech Stack:** Vanilla JS, no build; Node's `node:test`; the harness in test/harness.js.

**Spec:** docs/superpowers/specs/2026-11-01-study-week-design.md

## Global Constraints

- The floor is 10 distinct items, or the pool reviews due at the day's first touch when that is lower and at least 1; a finished practice exam meets the day on its own; there is no rest-day credit.
- The week runs Monday to Sunday: `weekday = (day + 3) % 7`, Monday 0; the week starts at `day - weekday`.
- `n` never goes down. Entries older than 400 days are dropped on write.
- No sentence anywhere names a lost streak or a lost week. No "0 of 7": the strip is hidden until the log has an entry with `n >= 1` or `x`.
- Copy is exactly as the spec's "The strip on home" and "Session-end acknowledgement" sections give it.
- Every commit that changes an app file carries `APP_VERSION` 43 (bumped once in the first such commit; nothing is pushed until the feature is whole). CHANGELOG entry 43.
- House style: one-line arrow functions, `get`/`put` for storage, no new files in app/, tests in `test/*.test.js` through `load()`.

## Review Focus

- A damaged or hand-edited `days` value (a string, an array, entries with a negative `n`) must not break home: `loadDays` validates as `loadSrs` does. Pinned in Task 2.
- A learner who opens the app at 23:59 and answers at 00:01: the entry for the new day is created by `record`, `d` taken then, and yesterday's dot stays as it was. Pinned in Task 2.
- A section reset after the dot filled: `n` keeps its value. Pinned in Task 2.
- A visit on a Sunday with the week unmade and no days off left: "Today makes this week." and never "the next 0 days". Pinned in Task 3.
- An import of a backup from before this feature (no `days`): the week is rebuilt from the imported records' `last` days. Pinned in Task 5.

---

### Task 1: Pin the clock in the harness, and the week arithmetic

**Files:**
- Modify: `test/harness.js:19-26` (the `load` options and the context's `Date`)
- Modify: `app/app.js:108` (after `dueTomorrow`, before the app-icon-badge section): a new `/* ---------- the week ---------- */` block
- Test: `test/week.test.js` (new)

**Interfaces:**
- Produces: `load({now})` in the harness, `now` in ms since the epoch; inside the app `new Date()` and `Date.now()` give that instant, `new Date(x)` works as before.
- Produces in app.js: `const weekday=day=>…` (Monday 0), `const weekStart=day=>…`, `const dayFloor=e=>…` (10, or `min(10, e.d)` when `e.d >= 1`), `const dayMet=e=>…` (`!!e && (!!e.x || (e.n||0) >= dayFloor(e))`).

- [ ] **Step 1: Write the failing tests**

```js
/* The study week: the day log, the floor, the strip on home, weeks in a row, the end-screen line. */
"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const {load}=require("./harness");

/* Noon UTC on a known Thursday, 2026-10-22; dayNum is local, and noon keeps the date the same in every zone. */
const THU=Date.UTC(2026,9,22,12);
const at=(ms,o={})=>load({now:ms,...o});

test("the harness pins the clock, and the week starts on Monday",()=>{
  const a=at(THU),T=a.run("dayNum()");
  assert.equal(a.run("new Date().toISOString().slice(0,10)"),"2026-10-22");
  assert.equal(a.run(`weekday(${T})`),3);
  assert.equal(a.run(`weekStart(${T})`),T-3);
  assert.equal(a.run("weekday(0)"),3,"day 0 is Thursday 1970-01-01");
  assert.equal(a.run(`weekday(${T+3})`),6,"Sunday");
  assert.equal(a.run(`weekStart(${T+3})`),T-3,"Sunday is still this week");
  assert.equal(a.run(`weekStart(${T+4})`),T+4,"Monday starts the next");
});

test("the floor is 10, or what was due when fewer, and a practice exam meets the day on its own",()=>{
  const a=at(THU);
  assert.equal(a.run("dayFloor(undefined)"),10);
  assert.equal(a.run("dayFloor({d:0,n:0})"),10);
  assert.equal(a.run("dayFloor({d:3,n:0})"),3);
  assert.equal(a.run("dayFloor({d:10,n:0})"),10);
  assert.equal(a.run("dayFloor({d:87,n:0})"),10);
  assert.equal(a.run("dayMet(undefined)"),false);
  assert.equal(a.run("dayMet({d:3,n:3})"),true);
  assert.equal(a.run("dayMet({d:3,n:2})"),false);
  assert.equal(a.run("dayMet({d:0,n:9})"),false);
  assert.equal(a.run("dayMet({d:0,n:10})"),true);
  assert.equal(a.run("dayMet({d:87,n:10})"),true);
  assert.equal(a.run("dayMet({d:87,n:0,x:true})"),true);
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `node --test test/week.test.js`
Expected: FAIL, `weekday is not defined` (and the clock test fails on the date).

- [ ] **Step 3: Add `now` to the harness and the four helpers to app.js**

In `load`, accept `now`; when given, the context's `Date` is a subclass whose no-argument constructor and `static now()` return `now`. The helpers go in a new section comment block headed `the week` after `dueTomorrow`, one line each.

- [ ] **Step 4: Run the tests**

Run: `node --test test/week.test.js`
Expected: PASS (2 tests). Then `node --test "test/*.test.js"`: everything else still passes.

- [ ] **Step 5: Commit**

```bash
git add test/harness.js test/week.test.js app/app.js version.js
git commit -m "The week: Monday-start arithmetic and the day floor; the test harness can pin the clock; version 43"
```

Set `APP_VERSION="43"` in version.js in this commit.

---

### Task 2: The day log

**Files:**
- Modify: `app/app.js` the week block from Task 1; `record` (app.js:96-99); `saveExam` (app.js:192); `home` (app.js:284, first lines)
- Test: `test/week.test.js`

**Interfaces:**
- Consumes: `dayFloor`, `dayMet`, `reviewsDue`, `srsOf`, `get`/`put`, `dayNum`, `POOL`, `DECKS`.
- Produces: `let DAYS` (the validated log, `{[day]: {d?, n, x?}}`), `const saveDays=()=>…` (drops entries older than `dayNum()-400`, then `put("days",DAYS)`), `const poolDue=()=>…` (`reviewsDue` summed over `POOL`), `const answeredOn=t=>…` (records across every deck with `last===t`), `function touchDay(t=dayNum())` (creates `DAYS[t]={d:poolDue(),n:0}` when absent, saves, returns the entry), `const todayMet=()=>dayMet(DAYS[dayNum()])`, `function backfillDays()` (when `get("days",null)` is null: for `t` from `dayNum()-13` to `dayNum()`, `n=answeredOn(t)`, set `DAYS[t]={n}` when `n>0`; saves only when something was found).

Rules the implementer cannot infer:
- `record` calls `touchDay(t)` then sets `e.n=Math.max(e.n, answeredOn(t))` and saves, every answer.
- `saveExam(e)` calls `touchDay(e.day)` and sets `.x=true`, saves.
- `home()` calls `touchDay()` only when some pool deck has a seen card (`POOL.some(d=>stats(d).seen)`), so a fresh app writes nothing to storage (test/demo.test.js asserts an empty store without `?demo`).
- `backfillDays()` runs once at startup, right after `DAYS` is loaded.
- `loadDays()` keeps an entry only when the key is a whole number and the value an object whose `n` is a whole number ≥ 0; keeps `d` only when a whole number ≥ 0 and `x` only when `true`; anything else is dropped, a non-object value is `{}`.

- [ ] **Step 1: Write the failing tests**

```js
const rec=(T,o={})=>JSON.stringify({lv:1,due:T+1,last:T,fail:null,n:1,w:0,...o});

test("the first touch of a day records what was due; answers count distinct items and never go down",()=>{
  const a=at(THU),T=a.run("dayNum()");
  a.run("home()");
  assert.equal(a.run("get('days',null)"),null,"nothing seen, nothing written");
  a.run("record('t1','T1A01',true);record('t1','T1A01',false);record('t1','T1A02',true)");
  assert.deepEqual(a.run(`DAYS[${T}]`),{d:0,n:2},"two distinct items; a repeat is not a third");
  a.run("SRS.t1={};saveSrs('t1');record('t2','T2A01',true)");
  assert.equal(a.run(`DAYS[${T}].n`),2,"a section reset cannot lower n");
  a.run("saveExam({day:dayNum(),right:30,missed:[],secs:60})");
  assert.equal(a.run(`DAYS[${T}].x`),true);
  assert.equal(a.run("todayMet()"),true);
  assert.deepEqual(a.run("get('days')"),a.run("DAYS"),"saved");
});

test("home takes the due count once a card has been seen, and a new day gets its own entry",()=>{
  const T=load({now:THU}).run("dayNum()");
  const a=at(THU,{storage:{"hamdrill:srs:t1":JSON.stringify({T1A01:JSON.parse(rec(T-1)),T1A02:JSON.parse(rec(T-3,{due:T+4}))})}});
  a.run("home()");
  assert.deepEqual(a.run(`DAYS[${T}]`),{d:1,n:0});
  const b=at(THU+86400000,{storage:{"hamdrill:srs:t1":JSON.stringify({T1A01:JSON.parse(rec(T-1))}),"hamdrill:days":JSON.stringify({[T]:{d:1,n:1}})}});
  b.run("record('t1','T1A01',true)");
  assert.deepEqual(b.run(`DAYS[${T}]`),{d:1,n:1},"yesterday is untouched");
  assert.deepEqual(b.run(`DAYS[${T+1}]`),{d:1,n:1});
});

test("a damaged log is dropped entry by entry, and old entries fall away on save",()=>{
  const T=load({now:THU}).run("dayNum()");
  const bad={[T-1]:{d:2,n:3},[T-2]:{n:-1},[T-3]:"x",[T-4]:{n:2,d:-1,x:1},[T-500]:{n:5},abc:{n:1}};
  const a=at(THU,{storage:{"hamdrill:days":JSON.stringify(bad)}});
  assert.deepEqual(a.run("DAYS"),{[T-1]:{d:2,n:3},[T-4]:{n:2},[T-500]:{n:5}});
  a.run("saveDays()");
  assert.deepEqual(Object.keys(a.run("get('days')")),[String(T-4),String(T-1)]);
  assert.deepEqual(at(THU,{storage:{"hamdrill:days":"[1,2]"}}).run("DAYS"),{});
});

test("with no log, the last fourteen days are rebuilt from the records",()=>{
  const T=load({now:THU}).run("dayNum()");
  const srs={T1A01:JSON.parse(rec(T-2)),T1A02:JSON.parse(rec(T-2)),T1A03:JSON.parse(rec(T-14,{due:T+20}))};
  const a=at(THU,{storage:{"hamdrill:srs:t1":JSON.stringify(srs)}});
  assert.deepEqual(a.run("DAYS"),{[T-2]:{n:2}},"fourteen days back is outside the window");
  assert.deepEqual(a.run("get('days')"),{[T-2]:{n:2}});
  assert.deepEqual(load({now:THU}).keys(),[],"nothing to rebuild writes nothing");
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `node --test test/week.test.js`
Expected: FAIL, `DAYS is not defined`.

- [ ] **Step 3: Implement the log**

`loadDays`, `DAYS`, `saveDays`, `poolDue`, `answeredOn`, `touchDay`, `todayMet`, `backfillDays` in the week block; the three call sites in `record`, `saveExam`, `home`; `backfillDays()` called once after `DAYS` is set. `DAYS` must be defined before `seedDemo()` runs (app.js:145), which the block's position guarantees.

- [ ] **Step 4: Run all tests**

Run: `node --test "test/*.test.js"`
Expected: PASS, including test/demo.test.js's empty-store test.

- [ ] **Step 5: Commit**

```bash
git add app/app.js test/week.test.js
git commit -m "The week: a day log, written by answers, practice exams and the day's first touch, rebuilt from records once"
```

---

### Task 3: The strip on home

**Files:**
- Modify: `app/app.js` week block; `home` (app.js:311-317: the strip goes after the `hard` line, before `${planBlock()}`)
- Modify: `app/app.css` (after `.sash-cap`, app.css:71; and the print rule at app.css:144)
- Test: `test/week.test.js`

**Interfaces:**
- Consumes: `DAYS`, `dayMet`, `weekday`, `weekStart`, `dayNum`.
- Produces: `function weekMade(ws)` (met days in `ws..ws+6` ≥ 5), `function weeksInARow(t)` (consecutive made weeks ending with last week, plus this week when made), `function weekState(t=dayNum())` returning `{shown, made, dots:[{wd, cls, label}], line, small}`, and `const weekBlock=()=>` the HTML, `""` when not shown.

The values the spec pins, restated as data:
- `dots[i].wd` is `"MTWTFSS"[i]`; `cls` is one of `done`, `done now`, `now`, `off`, `bonus`, `bonus now`, `""`; `label` is the weekday name plus `", studied"`, `", day off"`, `", today, not yet"`, `", today, studied"`, or nothing for a day to come. The sixth and seventh met days of a made week are `bonus`.
- `start` is the smallest key in `DAYS` (an entry with `n: 0` counts: the app was opened). A past unmet day is `off` only when `day >= start`; before that it is empty with the bare weekday label.
- `line`: with `done` met days this week, `off` unmet days before today on or after `start`, `left = 2 - off`, `remaining` the days from today to Sunday with today counted only when unmet, `winnable = done + remaining >= 5`, `k = 5 - done`:
  - `done >= 5`: `<span class="ok">Week made,</span> ${done} days.`
  - not winnable: `${done ? `${done} day${s} this week.` : "Nothing yet this week."}`
  - `left > 0`: `${done ? `${done} day${s} this week` : "Nothing yet this week"}, ${left} day${s} off left.`
  - `left === 0`, today unmet: `k === 1 ? "Today makes this week." : k === 2 ? "Today and tomorrow make this week." : \`Today and the next ${k-1} days make this week.\``
  - `left === 0`, today met: `${done} day${s} this week; ${k === 1 ? "the next one makes it." : \`the next ${k} make it.\`}`
- `small`: the welcome-back sentence `The cards waited. A missed stretch doesn't undo the spacing.` when today is unmet, none of `t-1..t-3` is met, and some day in the log is met; else `${w} weeks in a row.` when `w >= 2`; else `""`.
- `shown`: some entry has `n >= 1` or `x`.

HTML: `<div class="week"><ul class="days" aria-label="This week">` then one `<li class="d ${cls}" aria-label="${label}"><i></i>${wd}</li>` per dot, `</ul><p class="wl">${line}${small ? `<small>${small}</small>` : ""}</p></div>`.

CSS, from the mockup, light and dark from the existing tokens: `.week{margin:16px 0 0;padding:12px 0 0;border-top:1px solid var(--line)}`, `.week+.plan{margin-top:14px}`, `.days{list-style:none;display:flex;justify-content:space-between;gap:4px;margin:0 0 6px;padding:0}`, `.d` a column with the Barlow Condensed 13px label in `--muted`, `.d i` a 30px circle with a 2px `--none` ring, `.d.done i` filled `--amber` with a `--bg` check drawn by `::after`, `.d.off i` a dashed `--muted` ring with a short dash, `.d.now i` a 3px `--ink` ring and `.d.now` in `--ink`, `.d.bonus i` `--ok-bg` fill with a `--ok` ring and check, `.wl{margin:0;font-size:15px}`, `.wl .ok{color:var(--ok);font-weight:700}`, `.wl small{display:block;color:var(--muted);font-size:14px}`. Add `.week` to the print hide list.

- [ ] **Step 1: Write the failing tests**

```js
/* A log for this week relative to a pinned day: met days as {d:3,n:3}, days off as {d:3,n:0}. */
const log=(T,met,unmet=[])=>{const o={};for(const t of met)o[t]={d:3,n:3};for(const t of unmet)o[t]={d:3,n:0};return o};
const state=(ms,days,extra={})=>at(ms,{storage:{"hamdrill:days":JSON.stringify(days),...extra}}).run("weekState()");
const home=(ms,days)=>{const a=at(ms,{storage:{"hamdrill:days":JSON.stringify(days)}});a.run("home()");return a.run(`$("app").innerHTML`)};
const SAT=THU+2*86400000,SUN=THU+3*86400000,WED=THU-86400000,MON=THU-3*86400000;
const T=load({now:THU}).run("dayNum()"),MO=T-3;

test("steady on Thursday: three days, one off, today in, four weeks in a row",()=>{
  const days=log(T,[MO,MO+1,T],[MO+2]);
  for(let w=1;w<=4;w++)for(let k=0;k<5;k++)days[MO-7*w+k]={d:3,n:3};
  const s=state(THU,days);
  assert.equal(s.shown,true);assert.equal(s.made,false);
  assert.deepEqual(s.dots.map(d=>d.cls),["done","done","off","done now","","",""]);
  assert.deepEqual(s.dots.map(d=>d.label),["Monday, studied","Tuesday, studied","Wednesday, day off","Thursday, today, studied","Friday","Saturday","Sunday"]);
  assert.equal(s.line,"3 days this week, 1 day off left.");
  assert.equal(s.small,"4 weeks in a row.");
});

test("week made on Saturday, with the sixth day as a bonus",()=>{
  const s=state(SAT,log(T,[MO,MO+1,MO+3,MO+4,MO+5],[MO+2]));
  assert.equal(s.made,true);
  assert.deepEqual(s.dots.map(d=>d.cls),["done","done","off","done","done","done now",""]);
  assert.equal(s.line,'<span class="ok">Week made,</span> 5 days.');
  assert.equal(s.small,"","one made week is not a row yet");
  const six=state(SUN,log(T,[MO,MO+1,MO+2,MO+3,MO+4,MO+5,MO+6]));
  assert.deepEqual(six.dots.map(d=>d.cls),["done","done","done","done","done","bonus","bonus now"]);
  assert.equal(six.line,'<span class="ok">Week made,</span> 7 days.');
});

test("back after ten days on Wednesday: two days off spent, the week still winnable, the cards waited",()=>{
  const s=state(WED,log(T,[MO-12,MO-11,MO-10]));
  assert.deepEqual(s.dots.map(d=>d.cls),["off","off","now","","","",""]);
  assert.equal(s.line,"Today and the next 4 days make this week.");
  assert.equal(s.small,"The cards waited. A missed stretch doesn't undo the spacing.");
  const after=state(WED,log(T,[MO-12,MO-11,MO-10,MO+2]));
  assert.equal(after.line,"1 day this week; the next 4 make it.");
  assert.equal(after.small,"");
});

test("the other lines: nothing yet, singulars, none in hand on Sunday, and a week that can't be made",()=>{
  assert.equal(state(MON,{[MO-7]:{d:3,n:3}}).line,"Nothing yet this week, 2 days off left.");
  assert.equal(state(THU,log(T,[T],[MO,MO+1,MO+2])).line,"1 day this week.","three days off: no clause about days off");
  assert.equal(state(THU,log(T,[MO-7],[MO,MO+1,MO+2])).line,"Nothing yet this week.");
  assert.equal(state(SUN,log(T,[MO,MO+1,MO+2,MO+3],[MO+4,MO+5])).line,"Today makes this week.");
  assert.equal(state(SAT,log(T,[MO,MO+1,MO+2],[MO+3,MO+4])).line,"Today and tomorrow make this week.");
  assert.equal(state(SAT,log(T,[MO,MO+1,MO+2,MO+5],[MO+3,MO+4])).line,"4 days this week; the next one makes it.");
});

test("a learner who starts on a Thursday: the earlier days are neither studied nor off, and the week can't be made",()=>{
  const s=state(THU,log(T,[T]));
  assert.deepEqual(s.dots.map(d=>d.cls),["","","","done now","","",""]);
  assert.deepEqual(s.dots.slice(0,3).map(d=>d.label),["Monday","Tuesday","Wednesday"]);
  assert.equal(s.line,"1 day this week.");
  assert.equal(state(WED,log(T,[MO+2])).line,"1 day this week; the next 4 make it.","Wednesday is just in time");
  assert.equal(state(THU,{[MO]:{d:0,n:0},[T]:{d:3,n:3}}).dots[0].cls,"off","an opened app with nothing done is a day off");
});

test("weeks in a row: a missed week drops it, this week counts once made",()=>{
  const row=(n,extra=[])=>{const d={};for(let w=1;w<=n;w++)for(let k=0;k<5;k++)d[MO-7*w+k]={d:3,n:3};for(const t of extra)d[t]={d:3,n:3};return d};
  const a=at(THU,{storage:{"hamdrill:days":JSON.stringify(row(5))}});
  assert.equal(a.run("weeksInARow(dayNum())"),5);
  assert.equal(at(THU,{storage:{"hamdrill:days":JSON.stringify(row(5,[MO,MO+1,MO+2,MO+3,T]))}}).run("weeksInARow(dayNum())"),6);
  const gap=row(3);for(let k=0;k<5;k++)delete gap[MO-7+k];
  assert.equal(at(THU,{storage:{"hamdrill:days":JSON.stringify(gap)}}).run("weeksInARow(dayNum())"),0);
  assert.equal(state(THU,row(1)).small,"");
  assert.equal(state(THU,row(2)).small,"2 weeks in a row.");
});

test("home shows the strip after the first answers, after the hard line and before the plan panel, and hides it before",()=>{
  assert.doesNotMatch(home(THU,{}),/class="week"/);
  assert.doesNotMatch(home(THU,{[T]:{d:0,n:0}}),/class="week"/);
  const h=home(THU,log(T,[MO,MO+1,T],[MO+2]));
  assert.match(h,/<div class="week"><ul class="days" aria-label="This week"><li class="d done" aria-label="Monday, studied"><i><\/i>M<\/li>/);
  assert.match(h,/<li class="d done now" aria-label="Thursday, today, studied"><i><\/i>T<\/li>/);
  assert.match(h,/<p class="wl">3 days this week, 1 day off left\.<\/p>/);
  assert.ok(h.indexOf('class="week"')<h.indexOf('class="plan"'));
  const a=at(THU,{storage:{"hamdrill:days":JSON.stringify(log(T,[T]))}});
  a.run(`SRS.t1={T1A01:{lv:0,due:dayNum(),last:dayNum()-1,fail:dayNum()-1,n:3,w:2}};saveSrs("t1");home()`);
  const hh=a.run(`$("app").innerHTML`);
  assert.ok(hh.indexOf('class="reach hard"')<hh.indexOf('class="week"'),"after the hard line");
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `node --test test/week.test.js`
Expected: FAIL, `weekState is not defined`.

- [ ] **Step 3: Implement `weekMade`, `weeksInARow`, `weekState`, `weekBlock`; insert `${weekBlock()}` in `home`; add the CSS**

`weeksInARow` walks back from `weekStart(t)-7` while `weekMade`, then adds one when `weekMade(weekStart(t))`.

- [ ] **Step 4: Run all tests**

Run: `node --test "test/*.test.js"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/app.js app/app.css test/week.test.js
git commit -m "The week on home: seven dots, two days off in reserve, weeks in a row, and a soft line for the learner coming back"
```

---

### Task 4: The session-end line

**Files:**
- Modify: `app/app.js` `drill` (`start` at app.js:521, end screen at app.js:542-545), `flash` (`start` app.js:679, end at 686-689), `symbols` (`start` app.js:736, end at 740-743), the exam Finish handler (app.js:628-630) and `examResult` (app.js:634-636)
- Test: `test/week.test.js`

**Interfaces:**
- Consumes: `todayMet`, `weekState`.
- Produces: `const todayLine=was=>` returning `<p class="win">Today's in. ${weekState().line}</p>` when `!was && todayMet()`, else `""`; `examResult(won=false)`; `function examFinish(draw,picks,s)`, the body of the Finish handler once the unanswered check has passed (score, `saveExam`, `examClear`, the history replace, `examResult`, scroll to top).

Rules: each drill's `start` sets a closure variable `metAtStart=todayMet()`; the end screen's `.end` div gets `todayLine(metAtStart)` after its first `<p>`. `examFinish` does `const was=todayMet();saveExam(…);…;examResult(!was&&todayMet())`; `examResult(won)` adds `todayLine(!won)` after the score paragraph. The route `exam/result` calls `examResult()` with no argument, so a reopened result has no line.

- [ ] **Step 1: Write the failing tests**

```js
const card=a=>a.run(`$("card").innerHTML`);
const basics=a=>{if(card(a).includes('id="go"'))a.run(`$("go").onclick();0`)};
const answer=a=>a.run(`(()=>{const id=$("card").innerHTML.match(/class="qid">([^<]+)</)[1];const q=POOL.flatMap(d=>d.Q).find(q=>q[0]===id);const b=[...$("ans").children].find(b=>+b.dataset.oi===q[3]);b.onclick();return id})()`);
const next=a=>a.run(`$("next").onclick();0`);

test("the drill's end screen says Today's in once, the session that met the day",()=>{
  const a=at(MON);a.run("drill({deck:DECK.t1})");
  const N=a.run("DECK.t1.Q.length");
  for(let k=0;k<N;k++){basics(a);answer(a);next(a)}
  assert.match(card(a),/<p class="win">Today's in\. 1 day this week, 2 days off left\.<\/p>/);
  a.run(`$("dueOnly").checked=false;$("dueOnly").onchange();0`);
  for(let k=0;k<N;k++){basics(a);answer(a);next(a)}
  assert.doesNotMatch(card(a),/Today's in/,"already met before this session");
});

test("the practice exam's result says Today's in from Finish, not when the result is reopened",()=>{
  /* Finish as the screen's button does, with a draw scored as test/exam.test.js scores one. */
  const a=at(MON);
  a.run(`(()=>{const draw=examDraw();examFinish(draw,draw.map(x=>x.q[3]),{t0:Date.now()-60000,est:null})})()`);
  assert.match(a.run(`$("app").innerHTML`),/<p class="win">Today's in\. 1 day this week, 2 days off left\.<\/p>/);
  a.run("examResult()");
  assert.doesNotMatch(a.run(`$("app").innerHTML`),/Today's in/);
});
```

(The flash and symbol drills get the same line through the shared `todayLine`; one assertion each that their end screens contain `class="win"` after a full due session, driven as test/counters.test.js drives them.)

- [ ] **Step 2: Run them to see them fail**

Run: `node --test test/week.test.js`
Expected: FAIL on the missing `Today's in`.

- [ ] **Step 3: Implement `todayLine`, the `metAtStart` captures, the exam flag**

- [ ] **Step 4: Run all tests**

Run: `node --test "test/*.test.js"`
Expected: PASS; test/counters.test.js and test/exam.test.js unchanged.

- [ ] **Step 5: Commit**

```bash
git add app/app.js test/week.test.js
git commit -m "The week: the end of the session that fills today's dot says so, in the drills and on the practice exam"
```

---

### Task 5: Export and import carry the log

**Files:**
- Modify: `app/app.js` `exportProgress` (app.js:377), the import handler (app.js:393-401)
- Test: `test/week.test.js` (and test/import.test.js's existing round trips keep passing)

**Interfaces:**
- Consumes: `DAYS`, `loadDays`-style validation, `answeredOn`, `saveDays`.
- Produces: `function mergeDays(src)`: validates `src` as `loadDays` does, then per day keeps the larger `n`, `x` when either has it, `d` from whichever has one and the smaller when both do; then for `t` in the last fourteen days with no entry, `answeredOn(t)>0` makes `{n}`; saves.

Rules: `exportProgress` adds `days:DAYS` to `data` (format `version` stays 2). The import handler calls `mergeDays(d.days)` after `importDecks` (so the backfill sees the merged records) and before the toast.

- [ ] **Step 1: Write the failing tests**

```js
test("export carries the log; import merges it day by day and rebuilds days a backup never had",()=>{
  const a=at(THU,{storage:{"hamdrill:days":JSON.stringify({[T-1]:{d:4,n:4},[T-2]:{d:2,n:1}})}});
  assert.deepEqual(JSON.parse(a.run("JSON.stringify(exportData())")).days,{[T-1]:{d:4,n:4},[T-2]:{d:2,n:1}});
  a.run(`mergeDays(${JSON.stringify({[T-1]:{d:6,n:2,x:true},[T-2]:{n:5},[T-3]:"bad",[T-4]:{n:1}})})`);
  assert.deepEqual(a.run("DAYS"),{[T-1]:{d:4,n:4,x:true},[T-2]:{d:2,n:5},[T-4]:{n:1}});
  const b=at(THU,{storage:{"hamdrill:days":"{}"}});
  b.run(`importDecks({t1:{T1A01:${rec(T-5)},T1A02:${rec(T-5)}}});mergeDays(undefined)`);
  assert.deepEqual(b.run("DAYS"),{[T-5]:{n:2}},"a backup from before the log still fills the week");
});
```

`exportData()` is the object `exportProgress` builds, pulled into its own function so the test can read it without a `Blob`.

- [ ] **Step 2: Run to see it fail**

Run: `node --test test/week.test.js`
Expected: FAIL, `exportData is not defined`.

- [ ] **Step 3: Implement `exportData`, `mergeDays`, the two call sites**

- [ ] **Step 4: Run all tests**

Run: `node --test "test/*.test.js"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/app.js test/week.test.js
git commit -m "The week travels with export and import, and a backup from before it rebuilds the last two weeks"
```

---

### Task 6: The demo's log

**Files:**
- Modify: `app/app.js` `seedDemo` (app.js:125-143)
- Test: `test/demo.test.js`

**Interfaces:**
- Consumes: `DAYS`, `saveDays`, the seed's `cards`, `srsOf`.

Rules: inside the day loop, before the day's answers, `d` = seeded cards with a record whose `due <= t`; after the answers (and the lapses on T-1), `n` = records with `last === t`; `DAYS[t]={d,n}` for every simulated day including the two skipped ones; `saveDays()` once at the end with the other `put` calls.

- [ ] **Step 1: Write the failing test** (in test/demo.test.js)

```js
test("the sample's day log skips its two days off, and every other day from the second is met",()=>{
  const T=demo.run("dayNum()"),days=demo.run("DAYS");
  for(let t=T-21;t<T;t++)assert.ok(days[t],`day ${t-T}`);
  assert.equal(demo.run(`dayMet(DAYS[${T-9}])`),false);
  assert.equal(demo.run(`dayMet(DAYS[${T-16}])`),false);
  for(let t=T-20;t<T;t++)if(t!==T-9&&t!==T-16)assert.equal(demo.run(`dayMet(DAYS[${t}])`),true,`day ${t-T}`);
  assert.equal(days[T-9].n,0);
  assert.ok(demo.run("weekState().shown"));
});
```

- [ ] **Step 2: Run to see it fail**

Run: `node --test test/demo.test.js`
Expected: FAIL, `days[T-21]` undefined.

- [ ] **Step 3: Implement the seed's log**

- [ ] **Step 4: Run all tests**

Run: `node --test "test/*.test.js"`
Expected: PASS, including "the sample is the same on every load" and the standings.

- [ ] **Step 5: Commit**

```bash
git add app/app.js test/demo.test.js
git commit -m "The demo's sample carries a day log, so its home shows the week"
```

---

### Task 7: How it works, docs, changelog, gitignore

**Files:**
- Modify: `app/app.js` `about` (after the Badges paragraph, app.js:452)
- Modify: `ARCHITECTURE.md` (storage table after the `seeded` row, line 56; a `## Week` section before `## Estimate`, line 77)
- Modify: `CHANGELOG.md` (new `## 43 (November 1)` entry at the top)
- Modify: `.gitignore` (add `.superpowers/`)
- Test: `test/week.test.js`

Copy for How it works, after Badges:

```html
<h2>The week</h2>
<p>Home shows the week as seven dots, Monday to Sunday. The goal is 7 days with 2 days off in reserve, so 5 studied days make the week; a missed day spends a day off on its own. A day counts once you've answered 10 questions in any section, or everything due when fewer are due, or finished a practice exam. Weeks made in a row are counted. A missed week just starts over on Monday: missing days doesn't undo the spacing, the cards wait.</p>
```

ARCHITECTURE rows and section:

```
| `days` | `{<day>: {d, n, x}}`: for each day touched, the pool reviews due at its first touch, the distinct items answered (never lowered), and whether a practice exam was finished |
```

```
## Week

`days` is the log the home strip reads. A day is met when `x`, or `n >= floor`, with `floor = d >= 1 ? min(10, d) : 10`; the week runs Monday to Sunday (`weekday = (day + 3) % 7`), five met days make it, and `weeksInARow` counts made weeks back from last week, plus this one once made. `record`, `saveExam` and home's first visit of a day write the log; with no log at all, the last fourteen days are rebuilt from the records' `last`.
```

CHANGELOG 43: one bullet for the week on home (what it shows, what counts, days off, weeks in a row, the end-screen line), one that export and import carry it and the demo shows it, one that How it works explains it.

- [ ] **Step 1: Write the failing test**

```js
test("How it works explains the week",()=>{
  const a=at(THU);a.run("about()");
  assert.match(a.run(`$("app").innerHTML`),/<h2>The week<\/h2>\s*<p>Home shows the week as seven dots/);
});
```

- [ ] **Step 2: Run to see it fail**, **Step 3: Add the copy and the docs**, **Step 4: Run all tests**

Run: `node --test "test/*.test.js"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/app.js ARCHITECTURE.md CHANGELOG.md .gitignore test/week.test.js docs/superpowers/specs/2026-11-01-study-week-design.md docs/superpowers/plans/2026-11-01-study-week.md
git commit -m "The week in How it works, ARCHITECTURE and the changelog; the design and plan; .superpowers ignored"
```

---

### After the build

- `node --test "test/*.test.js"` green; `node tools/data-format.js --check` and `node tools/pool-check.js technician` unchanged and green.
- Push, then run the check workflow by hand with rebaseline on: the demo home screenshot (`technician` and `general`) changes because the strip appears. That is Kurt's push.
