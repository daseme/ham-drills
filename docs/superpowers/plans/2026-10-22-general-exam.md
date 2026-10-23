# General Exam Drills Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the Technician app unchanged to `/ham-drills/technician/` behind a splash page, and add a General app at `/ham-drills/general/` from the same code, shipped section by section with reviewed explanations.

**Architecture:** The app's script and styles move out of index.html into shared `app/app.js` and `app/app.css`. Each exam is a folder (`technician/`, `general/`) holding a thin index.html, its `exam.js` (settings and figures), `data.js` (questions and content), manifest and a small sw.js. Nothing Technician-specific stays in the shared code. No build step: the repo is what ships.

**Tech Stack:** Plain HTML/CSS/JS, service workers, GitHub Pages; Node 22+ built-in test runner; headless Chrome over CDP for screenshots; `gh` CLI.

**Spec:** `docs/superpowers/specs/2026-10-22-general-exam-design.md`

## Global Constraints

- Technician screens stay pixel-identical to today's, except the version number in the footer and About. Any other difference blocks the release.
- Technician progress keeps the `hamdrill:` localStorage namespace; its demo keeps `hamdemo:`. Nothing anywhere may clear localStorage except demo Exit and Reset (which clear only `hamdemo:`).
- Service-worker cache prefixes: Technician `hamdrills-technician-v`, General `hamdrills-general-v`. Neither may start with `hamdrill-v`. Each worker deletes only its own older caches.
- General localStorage namespace: `hamgeneral:`. Export `app` id: Technician `hamdrill` (unchanged), General `hamdrill-general`.
- One `APP_VERSION`, in root `version.js`, raised in every commit that changes a shipped file. CHANGELOG.md gets an entry each version.
- No build step, no npm packages. Opening an app's index.html from disk still works.
- General pool: `private/ncvec/general-2023-2027-errata6-feb4-2026.docx` (6th errata, February 4, 2026); withdrawn questions are excluded. Exam: 35 questions, 26 to pass, Element 3.
- A General section ships only with every question's note and explanation and its primers, after an independent review.
- Pushes to GitHub for Task 5's repository steps wait for Kurt's explicit go. General sections ship without waiting (approved in the spec).

## Review Focus

1. Kurt's wife's iPhone home-screen icon opens the old address: the forwarding page must keep `?demo` and `#hash`, never loop, and never touch localStorage. Pinned in Task 4.
2. The old address's service worker deletes `hamdrill-v*` caches: the moved apps' caches must not match that prefix. Pinned in Task 2 and Task 4.
3. A Technician backup imported into General, or the reverse, must be refused, not merged. Pinned in Task 6.
4. General with only some sections: no crash on `#symbols` or a missing deck, no estimate, the first-visit line and Start button name the first live section. Pinned in Task 6.
5. After the move, every relative path (fonts in CSS, icons in manifest, files in the precache list) must resolve. Pinned in Task 2.

---

### Task 0: Screenshot tool and Technician baseline

**Files:**
- Create: `tools/screens.mjs`
- Baseline output (not committed): `private/baseline/`

**Interfaces:**
- Produces: `node tools/screens.mjs <baseUrl> <outDir> [--progress file.json] [--query ?demo] [--screens ",t1,t5/study,about,symbols,due"]` writes one PNG per screen named `home.png`, `t1.png`, `t5_study.png`… at 412 px wide, light scheme, reduced motion, Math.random seeded, full page height. `node tools/compare-screens.mjs <dirA> <dirB>` prints `identical` or the differing box per file and exits 1 if any differ.

- [ ] **Step 1:** Write `tools/screens.mjs` from the CDP approach used on 2026-10-21 (spawn Chrome headless with `--remote-debugging-port`, seed `Math.random` via `Page.addScriptToEvaluateOnNewDocument`, load progress into `hamdrill:` keys, set `hamdrill:examDay` to today+16 and `hamdrill:prefs` to `{"showDate":true}`, capture with `captureBeyondViewport`). Write `tools/compare-screens.mjs` using a pure-Node PNG decode (zlib inflate of IDAT, unfilter) so no packages are needed.
- [ ] **Step 2:** Serve the current tree (`python -m http.server 8812`) and capture the baseline twice: `--progress private/kurt-progress-2026-10-18.json` into `private/baseline/real`, and `--query ?demo --screens ",t8,due"` into `private/baseline/demo`. Run `compare-screens` of each against a second capture: expect `identical` throughout (proves the tool is deterministic).
- [ ] **Step 3:** Commit the two tools.

### Task 1: Exam settings out of the code (still at the root)

**Files:**
- Create: `exam.js` (Technician settings), `test/exam-config.test.js`
- Modify: `index.html` (load `exam.js` before `data.js`; read every exam-specific value from it), `test/harness.js` (load `exam.js`), `sw.js` (precache `exam.js`)

**Interfaces:**
- Produces: `window.EXAM_CONFIG` with: `id` ("technician"), `ns` ("hamdrill:"), `demoNs` ("hamdemo:" or null), `cachePrefix`, `exportApp` ("hamdrill"), `exportName` ("ham-drill"), `shortName` ("Technician"), `over` ("Amateur Radio Service"), `title` ("Technician Class Operator License"), `studyTitle` ("Technician study guide"), `poolYears` ("2026-2030"), `aboutFacts` (the About sentence starting "FCC license class Technician…"), `examQ` (35), `pass` (26), `sections` (10, the number of pool sections), `mathGroups` (["T5B","T5C","T5D"]), `figures` ({FIGS, FIG_KEY} moved verbatim from index.html), `demo` ({plan: DEMO_PLAN, lapse: DEMO_LAPSE, seed: DEMO_SEED} moved verbatim, or null).
- The `"74%"` text becomes `Math.round(pass/examQ*100)+"%"` (74 for 26/35).
- Constants stay the same names inside app code (`NS`, `IV`, `FIGS`…) so later tasks and the tests keep working.

- [ ] **Step 1: Write the failing test** `test/exam-config.test.js`:
  - `"Technician settings are what the app used to hard-code"`: `load()` then `run("EXAM_CONFIG")` has `examQ===35`, `pass===26`, `ns==="hamdrill:"`, `exportApp==="hamdrill"`; `run("NS")==="hamdrill:"`.
  - `"no Technician-specific text is left in the shared code"`: read index.html's script; assert it contains none of `Technician`, `T5B`, `Element 2`, `2026-2030`, `of 35`, `pass is 26`, `26 passes`, `74%`, `T-1`.
- [ ] **Step 2:** Run `node --test "test/*.test.js"`; expect the two new tests to fail.
- [ ] **Step 3:** Create `exam.js`; replace each hard-coded value in index.html with the setting (`home`'s h1 and estimate line, `planBlock`'s pass check `e.lo>=pass`, About, study pages, drill subtitle, the end-of-drill pass percentage, `grpOf`, `FIGS`, the demo plan, export `app` and file name, `<title>`, storage namespace). The first-visit line uses `POOL.length` sections and `POOL[0].code`.
- [ ] **Step 4:** Run the tests and `node tools/pool-check.js`; expect all pass.
- [ ] **Step 5:** Capture with `tools/screens.mjs` into `private/after1/real` and `/demo`; `compare-screens` against the baseline. Expected: only the footer/About version digits differ (Step 6 bumps it); before bumping, expect `identical`.
- [ ] **Step 6:** Raise `APP_VERSION`, CHANGELOG entry ("Exam settings moved into exam.js; no visible change"), commit.

### Task 2: The ham-drills layout

**Files:**
- Create: `app/app.js` (the script block from index.html), `app/app.css` (the style block, font URLs as `../fonts/…`), `app/sw-core.js`, `technician/index.html`, `technician/sw.js`, `technician/manifest.webmanifest`, `test/paths.test.js`
- Move (git mv): `exam.js`, `data.js` into `technician/`; keep `version.js`, `fonts/`, `icons/` at the root
- Delete: root `index.html`, `sw.js`, `manifest.webmanifest` (root index.html returns in Task 3 as the splash)
- Modify: `test/harness.js` (`load({exam="technician", search=""})` reads `app/app.js` and `<exam>/exam.js`, `<exam>/data.js`), `tools/pool-check.js` (Task 6 generalizes it; here only the data path becomes `technician/data.js`), `.github/workflows/check.yml`, `tools/screens.mjs` default paths, README, ARCHITECTURE.md

**Interfaces:**
- Consumes: `EXAM_CONFIG` from Task 1.
- Produces: `technician/index.html` is head + `<div id="demobar" hidden>` + `<main id="app">` + `<input type="file" id="importFile" hidden>` + scripts in order `../version.js`, `exam.js`, `data.js`, `../app/app.js`. The badge SVG `<defs>` block moves into app.js, which inserts it at start. `technician/sw.js` is two lines: `self.EXAM_CACHE="hamdrills-technician-v"; importScripts("../version.js","../app/sw-core.js");`. `app/sw-core.js` precaches `["./","index.html","exam.js","data.js","manifest.webmanifest","../version.js","../app/app.js","../app/app.css",<icons>,<fonts>]` under `EXAM_CACHE+APP_VERSION`, and on activate deletes only keys starting with `EXAM_CACHE` that are not the current one.
- Manifest: name "Technician drills", short_name "Ham drills" (unchanged), `start_url` and `scope` "./", icons `../icons/…`.

- [ ] **Step 1: Write the failing test** `test/paths.test.js`:
  - `"every precached file exists"`: evaluate `app/sw-core.js` in a stub (as done for sw.js on 2026-10-21) for each exam folder; every FILES entry resolved against the folder exists on disk.
  - `"every url() in app.css resolves from app/"` and `"every manifest icon resolves from its folder"`.
  - `"no cache prefix collides with the old address"`: for each exam folder's sw.js, `EXAM_CACHE` does not start with `"hamdrill-v"`.
  - `"activation keeps other apps' caches"`: with keys `["hamdrill-v23","hamdrills-general-v30","hamdrills-technician-v29","other-v1"]` and current version 30, the Technician worker deletes only `hamdrills-technician-v29`.
- [ ] **Step 2:** Run tests; expect the new ones to fail.
- [ ] **Step 3:** Make the moves and files above.
- [ ] **Step 4:** Run `node --test "test/*.test.js"` and `node tools/pool-check.js`; expect all pass.
- [ ] **Step 5:** Serve the repo root; capture `http://127.0.0.1:8812/technician/` into `private/after2/real` and `/demo`; `compare-screens` against the baseline; expect `identical` (version not yet bumped). Also open `file:///…/technician/index.html` through `screens.mjs` and check the h1 reads the Technician title and a localStorage write reads back.
- [ ] **Step 6:** Raise `APP_VERSION`, CHANGELOG, update README and ARCHITECTURE.md (file map, run instructions, `node --test`), commit.

### Task 3: Splash page

**Files:**
- Create: `index.html` (root), `test/splash.test.js`

**Interfaces:**
- Produces: a static page in the app's palette and fonts (`app/app.css` tokens or a small inline subset), title "Ham drills", a heading, one line per exam ("Technician: the entry license, 35 questions from 409." / "General: HF privileges, 35 questions from 423."), and links `technician/` and `general/`. No storage, no service worker. While General has no live section, its link is absent (it appears in Task 7).

- [ ] **Step 1:** Write `test/splash.test.js`: `"splash links to the Technician app"` (the file contains `href="technician/"`), `"splash uses no storage and registers no worker"` (no `localStorage`, no `serviceWorker`).
- [ ] **Step 2:** Run; expect fail. **Step 3:** Write the page. **Step 4:** Run; expect pass; screenshot it at 412 px and look at it.
- [ ] **Step 5:** Raise `APP_VERSION`, CHANGELOG, commit.

### Task 4: Forwarding files for the old address

**Files:**
- Create: `forward/index.html`, `forward/sw.js`, `forward/README.md`, `test/forward.test.js`

**Interfaces:**
- Produces: `forward/index.html` computes the target with `forwardUrl(search, hash)` returning `"/ham-drills/technician/" + search + hash`, calls `location.replace`, and shows a plain link to the same target for when scripts are off (plus `<meta http-equiv="refresh">` to the bare path). `forward/sw.js`: `install` → `skipWaiting`; `activate` → delete caches whose name starts with `"hamdrill-v"`, then `self.registration.unregister()`, then navigate every window client to its own URL so it reloads into the forwarding page. No `fetch` handler. Neither file mentions `localStorage`.
- `forward/README.md`: one paragraph saying this is the content of the `daseme/ham-technicians-drills` repository, copied there in Task 5.

- [ ] **Step 1: Write the failing test** `test/forward.test.js`:
  - `forwardUrl("?demo","#t1")==="/ham-drills/technician/?demo#t1"`; `forwardUrl("","")==="/ham-drills/technician/"`.
  - The target never contains `ham-technicians-drills` (no loop).
  - Simulated `sw.js` with keys `["hamdrill-v23","hamdrill-v1","hamdrills-technician-v30","hamdrills-general-v30","other-v1"]`: after activate only the two `hamdrill-v*` keys are gone, `unregister` was called once.
  - Neither forward file contains the text `localStorage`.
- [ ] **Step 2:** Run; expect fail. **Step 3:** Write the files. **Step 4:** Run; expect pass. **Step 5:** Commit (no version bump: these files ship from the other repository).

### Task 5: Ship the move

**Files:**
- Create: `docs/moving-technician.md` (Kurt's steps for his wife's phone)
- Modify: CHANGELOG.md, README.md (addresses), `Claude outputs/showcase-spec.md` is not touched

**Interfaces:**
- Consumes: Tasks 1-4.

- [ ] **Step 1:** Before any GitHub step, ask Kurt to have his wife tap Export progress in her current icon and keep the file (Files or email). Once the old address forwards, her old icon can no longer export, so this file is the fallback. Wait for his confirmation.
- [ ] **Step 2:** Write `docs/moving-technician.md` in plain words for Kurt: (a) after the move, open her old Technician icon; it should land on the new address with her sections, due count and badges as before; (b) if it does, she's done and keeps using that icon; (c) if it shows the first-visit screen or zero seen, open `daseme.github.io/ham-drills/technician/` in Safari, Share, Add to Home Screen, open the new icon, tap Import progress and choose the file from Step 1; then remove the old icon.
- [ ] **Step 3:** Ask Kurt for the go to do the GitHub steps. On go, in one sitting:
  - `git push` the branch; wait for the check to pass.
  - `gh api -X PATCH repos/daseme/ham-technicians-drills -f name=ham-drills`; `git remote set-url origin https://github.com/daseme/ham-drills.git`.
  - Create `daseme/ham-technicians-drills` (public), push the contents of `forward/` as its root on `main`, enable Pages from `main` `/` with `gh api -X POST repos/daseme/ham-technicians-drills/pages -f "source[branch]=main" -f "source[path]=/"`.
  - Wait for both Pages deployments.
- [ ] **Step 4: Verify live:** `curl -sI` each address returns 200: `/ham-drills/`, `/ham-drills/technician/`, `/ham-technicians-drills/`. In headless Chrome: opening `/ham-technicians-drills/?demo#t8` ends at `/ham-drills/technician/?demo#t8`; with `hamdrill:` progress set on the origin, `/ham-drills/technician/` shows it.
- [ ] **Step 5:** Tell Kurt it's live, give him `docs/moving-technician.md`, and that the four newcomers can now be sent `daseme.github.io/ham-drills/`.

### Task 6: General app shell and tools

**Files:**
- Create: `general/index.html`, `general/exam.js`, `general/data.js` (empty decks list), `general/sw.js`, `general/manifest.webmanifest`, `tools/pool-import.js`, `test/general.test.js`, `test/pool-tools.test.js`
- Modify: `app/app.js` (partial-pool behaviour), `tools/pool-check.js` (exam argument, G ids, withdrawn, not-yet-added), `test/harness.js` if needed, `.github/workflows/check.yml` (check both exams), `test/data.test.js`

**Interfaces:**
- Consumes: `EXAM_CONFIG` shape (Task 1), layout (Task 2).
- Produces:
  - `general/exam.js`: `id:"general"`, `ns:"hamgeneral:"`, `demoNs:null`, `cachePrefix`/`EXAM_CACHE` `"hamdrills-general-v"`, `exportApp:"hamdrill-general"`, `exportName:"ham-general"`, `shortName:"General"`, `title:"General Class Operator License"`, `studyTitle:"General study guide"`, `poolYears:"2023-2027"`, `aboutFacts` ("FCC license class General, exam Element 3, radio service code HG."), `examQ:35`, `pass:26`, `sections:10`, `mathGroups` (set when Math ships), `figures:{FIGS:{}, FIG_KEY:{}}`, `demo:null`.
  - In app.js: `const COMPLETE = POOL.length === EXAM_CONFIG.sections`. When not complete: the estimate line is replaced by `<p class="muted">The estimate appears once all ${sections} sections are in.</p>`; everything else uses the live decks. `#symbols` and any deck route that doesn't exist go home. With `demoNs` null, `?demo` is ignored (normal namespace, no banner). Import refuses a file whose `app` differs from `exportApp` with the toast "That backup is from another exam's drills."
  - `node tools/pool-check.js <technician|general> [pool.docx]` (no argument means technician, so existing commands keep working). Id pattern from the exam (`T` or `G`). A pool entry `^(G\d[A-Z]\d\d)\s+Question Deleted` is skipped and counted as withdrawn. Pool questions whose section deck is absent from data.js are reported as `not yet added: G2, G3…` and are not failures; a present deck missing any of its pool questions is a failure. Exam counts must sum to 35 only when all sections are present.
  - `node tools/pool-import.js <pool.docx> <G1>` prints a deck skeleton as JSON: `{id:"g1",code:"G1",name,exam,G:{group:name},Q:[[id,stem,[a,b,c,d],answerIndex,"",fig?]],P:{},CON:{}}`, stems and options HTML-escaped (`& < >`), figure set when the stem names "figure G7-1".

- [ ] **Step 1: Write the failing tests.** `test/general.test.js` (load `{exam:"general"}` with a fixture data.js holding only a 3-question g1 deck):
  - `"General uses its own storage"`: after `record("g1",…)`, every stored key starts with `hamgeneral:`.
  - `"no estimate until every section is in"`: home HTML contains "The estimate appears once all 10 sections are in." and not "Likely".
  - `"first visit names the first live section"`: home HTML contains "Start with G1".
  - `"#symbols on General goes home without error"`.
  - `"?demo on General is ignored"`: `load({exam:"general",search:"?demo"})` stores nothing under `hamdemo:`, `run("DEMO")===false`.
  - `"a Technician backup is refused by General"` and `"a General backup is refused by Technician"`: the import handler leaves SRS unchanged.
  `test/pool-tools.test.js`:
  - `"pool-import reads G1 verbatim"`: on the real General docx (skip the test with a message if `private/ncvec/` lacks it, since CI has no pool file), G1's count equals the `G1…(` entries in the docx text, none of the withdrawn G1A04, G1C08, G1C09, G1C10, G1E09 appear, and G1A05's answer index is 0.
  - `"pool-check reports unwritten sections, not failures"`: with the fixture, output contains `not yet added` and exit code 0 when the fixture's questions match the pool.
- [ ] **Step 2:** Run; expect fail. **Step 3:** Implement. **Step 4:** Run all tests and `node tools/pool-check.js technician`; expect pass; Technician pixel check against the baseline still `identical` apart from the version.
- [ ] **Step 5:** Raise `APP_VERSION`, CHANGELOG, commit. General is not linked from the splash yet.

### Task 7: G1 content, reviewed, shipped

**Files:**
- Modify: `general/data.js` (deck g1, its `EXPLAIN` entries, `P`, `CON`), `index.html` (splash: add the General link), CHANGELOG.md

**Interfaces:**
- Consumes: `tools/pool-import.js`, `tools/pool-check.js general`, the content format of `technician/data.js`.

This is the section recipe; Task 8 repeats it.

- [ ] **Step 1:** `node tools/pool-import.js private/ncvec/general-2023-2027-errata6-feb4-2026.docx G1` → paste into `general/data.js`. Run `node tools/pool-check.js general private/ncvec/general-…docx`: expect 0 problems, others "not yet added".
- [ ] **Step 2: Write the content.** Read ten Technician questions' notes and `EXPLAIN` entries and two primers first, and match their voice and length. For each topic in the section: a primer `[title, html]` in `P` and every question mapped in `CON`. For each question: the note (one or two sentences, why the keyed answer is right and the tempting wrong one wrong) and `EXPLAIN[id]` (a short paragraph or two). For G1 questions, read the Part 97 section cited beside the question in the pool (eCFR, 47 CFR Part 97) before writing.
- [ ] **Step 3: Review.** Dispatch a fresh reviewer agent with: the pool text of the section, the drafted entries, the cited Part 97 sections, and this checklist: each note and explanation agrees with the keyed answer; no factual error about rules, frequencies, power limits or physics; every question has a note, explanation and primer; nothing contradicts another entry. Fix every finding; re-review if any fix was substantive.
- [ ] **Step 4:** `pool-check general` with the docx: 0 problems. Tests pass. Screenshot `general/` home and a G1 drill card; look at both.
- [ ] **Step 5:** Add the General link to the splash. Raise `APP_VERSION`, CHANGELOG ("General: G1"), commit, push, confirm the check passes and Pages deploys. Tell Kurt G1 is live at `daseme.github.io/ham-drills/general/`.

### Task 8: G2 to G0, one section per pass

Repeat Task 7's recipe (Steps 1-5, without the splash link) for G2, G3, G4, G5, G6, G7, G8, G9, G0 in that order, one commit and one push per section. For G7, also draw figure G7-1 (from `http://www.ncvec.org/downloads/G7-1 diagram 2023 Figure G7-1.jpg`, saved to `private/ncvec/`) as inline SVG in `general/exam.js` `figures`, same line style as Technician's figures, numbered as in the original, and check it on each of the five G7 questions that use it.

### Task 9: General Math and completion

**Files:**
- Modify: `general/data.js` (math deck), `general/exam.js` (`mathGroups`), `tools/pool-check.js` expectations, README, ARCHITECTURE.md, CHANGELOG.md, the spec's status line

- [ ] **Step 1:** Build the math deck: every pool question whose answer requires a calculation, copied verbatim from its section (pool-check already requires copies to match originals), each with a worked solution in `F` and a formula sheet in `cheat`, like Technician's Math. Review as in Task 7 Step 3, checking every number.
- [ ] **Step 2:** With all ten sections present: `pool-check general <docx>` reports 423 questions, 0 problems, no "not yet added", exam counts sum to 35. The estimate shows on General's home. Add tests: `"General's estimate shows once complete"`, `"General has 423 pool questions"` (in `test/data.test.js`, from data.js alone).
- [ ] **Step 3:** README and ARCHITECTURE.md describe both exams; the spec's status becomes "built". Raise `APP_VERSION`, CHANGELOG, commit, push.
