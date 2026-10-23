# Architecture

One shared app, and a folder per exam holding that exam's settings and questions. No framework, no build step, no server: the files in the repo are the files that ship.

## Files

| File | What it holds |
|---|---|
| index.html | The splash page at /ham-drills/, linking to each exam's app |
| app/app.js, app/app.css | The whole app: script and styles, shared by every exam; names no exam |
| app/sw-core.js | The service worker every exam shares |
| technician/index.html | The Technician page: loads version.js, its exam.js and data.js, then app.js |
| technician/exam.js | `window.EXAM_CONFIG`: Technician's names, pool years, question count and pass mark, storage namespace, figures, demo plan |
| technician/data.js | `window.DECKS` (the twelve sections) and `window.EXPLAIN` (the longer explanation for each question) |
| technician/sw.js, technician/manifest.webmanifest | Technician's cache name, then the shared worker; its home-screen install |
| general/ | The same files for General: its own exam.js (storage `hamgeneral:`, cache `hamdrills-general-v`, figure G7-1, no demo) and data.js (G1 to G0 and Math, 423 pool questions) |
| forward/ | The content of the daseme/ham-technicians-drills repository: the old address forwards here, and its last service worker retires the old offline copy |
| version.js | `APP_VERSION`, the one version number for the repo; read by the footers and the service workers |
| icons/, fonts/ | Shared icons and bundled typefaces |
| tools/pool-check.js | Checks an exam's data.js (`technician` or `general`); compares it with the NCVEC pool .docx when given one, skipping withdrawn questions |
| tools/pool-parse.js, tools/pool-import.js | Read an NCVEC pool .docx; print one section as a data.js deck skeleton, stems and options verbatim |
| tools/docx-text.js | Reads a .docx's paragraphs with no dependencies (a .docx is a zip) |
| test/ | Node tests; test/harness.js loads app/app.js with an exam's files into a stub page |
| tools/screens.mjs, tools/compare-screens.mjs | Screenshots of every screen in headless Chrome, compared pixel for pixel; how a change is shown to leave screens untouched |
| .github/workflows/check.yml | Runs the pool check and the tests on every push and pull request |

## Data

Each deck in `DECKS` has an `id` (`t1` … `t0` or `g1` … `g0`, `math`, and `symbols` for Technician), a display `code`, a `name`, and `exam`, the number of the 35 exam questions it supplies (0 for Math and Symbols, whose questions already sit in the pool sections). Question decks hold:

- `Q`: questions as `[id, stem, [four options], answer index, short note, figure?]`. Text is HTML.
- `G`: group names, keyed by the three-character group (`T1A`).
- `P` and `CON`: the primers ("basics") as `[title, html]`, and which primer each question belongs to.
- Math adds `F` (worked formulas) and `cheat` (a formula sheet). Symbols has `S` instead of `Q`: `{n, def, f, d, t}` per symbol.

data.js was produced once from the NCVEC pool and is maintained by hand. `tools/pool-check.js` is what keeps it honest: it currently matches the February 19, 2026 errata release exactly.

## Storage

Progress lives in `localStorage` on the device and nowhere else. Every read and write goes through `get` and `put`, which add the namespace: `hamdrill:`, or `hamdemo:` in demo mode.

| Key | Value |
|---|---|
| `srs:<deck id>` | One record per card: `{lv, due, last, fail, n, w, ts}` |
| `badges` | `{<deck id>: {1: day, 2: day, 3: day}}`, the day each rung was first earned |
| `examDay` | The exam date, or absent |
| `prefs` | `showEst`, `showDate`, `haveFRN` |
| `seeded` | Demo mode only: the sample has been created |

Days are whole numbers, local days since 1970 (`dayNum`), so "due today" never depends on the hour.

Export writes the same records to a JSON file; import merges them card by card, keeping whichever record was answered more recently (`mergeSrs`).

## Scheduler

`IV = [0, 1, 3, 7, 16, 35]` is the interval table in days, and level 3 (`MASTER`) is mastered. `step(record, ok, day)` is the whole scheduler, a pure function; `record` applies it and saves.

- Right on a new day: up one level, due in `IV[level]` days.
- Right again the same day: no change, so mastery takes right answers on three separate days.
- Wrong: level 0, due today.
- Right later the same day as a miss: still level 0, due tomorrow.

`capInterval` applies the exam date: nothing is scheduled on or past the exam, and inside the last week each interval is at most half the days left, so every card comes back at least once more.

## Estimate

`estimate` returns a low and a high for the 35-question exam. Each pool section contributes its exam count times a weighted share of its cards: mastered, answered right at least once, missed, or unseen. Two weightings (`EST_W`) give the range; unseen cards count as a guess (0.25) in both. It also names the two sections with the most to gain.

## Badges

`tierNow` judges a deck on every card: bronze when all are seen, silver when none sits at level 0, gold when all are mastered. `awardBadges` records each rung the first day it is reached, and a rung once earned is kept. The badge shows dimmed while `tierNow` is below the best rung earned.

## Screens

The page is a hash router (`route`): home, a deck's drill (`#t1`), a primer drill (`#t1/p/<key>`), study pages (`#t1/study`, `#study`), `#due`, `#symbols`, `#about`. Each screen function rebuilds `#app` from a template string. In-app moves push history entries carrying their depth, so the phone's Back button retraces them.

In a drill, reviews come first, shuffled; new cards follow grouped by topic in pool order, each topic's primer shown before its first new card. Answer order is shuffled except where an option reads "All these choices are correct".

## Demo mode

`?demo` switches the namespace to `hamdemo:` and seeds a learner three weeks in (`seedDemo`). The learner is simulated day by day through `step` from fixed per-deck seeds (`DEMO_PLAN`, `DEMO_SEED`), so every record is one the scheduler could have written and badge dates are the days they were earned. Dates are relative to the visit, so the demo looks the same any day. test/demo.test.js pins the result.

## Offline and releases

Each exam's sw.js sets its cache name (`hamdrills-technician-v`) and imports app/sw-core.js, which precaches the exam's files and the shared ones under `<name><APP_VERSION>` and answers every request from cache (`ignoreSearch`, so `?demo` works offline). On activation it deletes only its own older caches: every site on daseme.github.io shares one origin, and so one set of caches and one localStorage. The old address's `hamdrill-v*` caches are left to the old address.

To release, change files and raise `APP_VERSION` in version.js. The new service worker installs, takes over, and the page reloads at the next safe moment (on home, or when the app goes to the background), with a toast naming the version.

## Why no framework

The app is twelve decks and a few screens, read on phones, often offline. A single file with template strings loads instantly, needs nothing installed to run or change, and can be opened straight from disk. A framework would add a build step and dependencies to keep current without making any screen better. That would change if the app grew real shared state across many screens, accounts, or sync between devices.
