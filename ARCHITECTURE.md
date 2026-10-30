# Architecture

One shared app, and a folder per exam holding that exam's settings and questions. No framework, no build step, no server: the files in the repo are the files that ship.

## Files

| File | What it holds |
|---|---|
| index.html | The splash page at /ham-drills/, linking to each exam's app |
| resources.html | A page of outward links off the splash: the ARRL, Bay Area clubs, NERT and CERT; no script, not cached |
| app/app.js, app/app.css | The whole app: script and styles, shared by every exam; names no exam |
| app/sw-core.js | The service worker every exam shares |
| technician/index.html | The Technician page: loads version.js, its exam.js and data.js, then app.js |
| technician/exam.js | `window.EXAM_CONFIG`: Technician's names, pool years, question count and pass mark, storage namespace, figures, demo plan |
| technician/data.js | `window.DECKS` (the twelve sections) and `window.EXPLAIN` (the longer explanation for each question) |
| technician/sw.js, technician/manifest.webmanifest | Technician's cache name, then the shared worker; its home-screen install |
| general/ | The same files for General: its own exam.js (storage `hamgeneral:`, cache `hamdrills-general-v`, figure G7-1, the band chart, no demo) and data.js (G1 to G0, Math, Bands, Edges and Facts, 423 pool questions) |
| forward/ | The content of the daseme/ham-technicians-drills repository: the old address forwards here, and its last service worker retires the old offline copy |
| version.js | `APP_VERSION`, the one version number for the repo; read by the footers and the service workers |
| icons/, fonts/ | Shared icons and bundled typefaces |
| pools/ | A snapshot of each exam's official pool, parsed from the NCVEC .docx with its source recorded (file, SHA-256, link, the page's file list); one question per line |
| tools/pool-check.js | Checks an exam's data.js (`technician` or `general`) against its snapshot, every question; given the .docx, also checks the snapshot is that file's |
| tools/pool-snapshot.js, tools/pool-fetch.js | Write a snapshot from a .docx; download the pools from the NCVEC and compare them with the snapshots (by hand: the NCVEC's Cloudflare refuses GitHub's runners, so the pool-watch workflow is manual) |
| tools/data-format.js | Writes data.js in its fixed layout, one question per line; `--check` is what CI runs |
| tools/pool-parse.js, tools/pool-import.js | Read an NCVEC pool .docx; print one section as a data.js deck skeleton, stems and options verbatim |
| tools/docx-text.js | Reads a .docx's paragraphs with no dependencies (a .docx is a zip) |
| test/ | Node tests; test/harness.js loads app/app.js with an exam's files into a stub page |
| tools/screens.mjs, tools/compare-screens.mjs | Screenshots of every screen in headless Chrome, compared pixel for pixel; the clock stands still and the version is masked, so a screen changes only when the app does |
| test/screens/ | The screenshot baselines, made only by the CI runner's Chrome: run the workflow by hand with rebaseline on |
| .github/workflows/check.yml | Runs the pool check, the layout check and the tests on every push and pull request, and shoots the screens and compares them with the baselines |

## Data

Each deck in `DECKS` has an `id` (`t1` … `t0` or `g1` … `g0`, `math`, and `symbols` for Technician), a display `code`, a `name`, and `exam`, the number of the 35 exam questions it supplies (0 for Math and Symbols, whose questions already sit in the pool sections). Question decks hold:

- `Q`: questions as `[id, stem, [four options], answer index, short note, figure?]`. Text is HTML.
- `G`: group names, keyed by the three-character group (`T1A`).
- `P` and `CON`: the primers ("basics") as `[title, html]`, and which primer each question belongs to.
- Math adds `F` (worked formulas) and `cheat` (a formula sheet). Symbols has `S` instead of `Q`: `{n, def, f, d, t}` per symbol. A flash-card deck has `flash` instead: `{n, a, t, k?, p?, q?}` per card (name, the back's text, a hook, a short key, the card's own prompt line, source question ids); the key, or the name when there is none, is the card's review-record key, so `srs:edges` reads `{"40-range":{...}}` and `srs:facts` reads `{"faa":{...}}`, where the `n` inside is the answer count as on every record. Give a card a key when its name might be reworded, since a renamed key resets the card. A flash deck may set `prompt`, the line above every card's name, which a card's `p` overrides. A deck rebuilt from different cards sets `gen` (Edges is 2): badges carry the deck's generation, and one from another generation is dropped at startup and ignored on import, since "every card seen" meant other cards. `EXAM_CONFIG.art[deck id]` may map a card to a drawing: General's Edges deck gets the bar of the band a card names or answers with.
- A deck with no exam count may set `intro` (its study-page line) and `cheatName` (the label on its cheat sheet). A cheat sheet can also come from exam.js, under `EXAM_CONFIG.cheats[deck id]`: General's Bands deck gets its band chart that way, drawn by `bandChart()` from the `BANDS` table (Part 97 §97.301(d), §97.305(c), §97.313, Region 2), which the config also exposes as `bands` for the tests.

data.js was produced once from the NCVEC pool and is maintained by hand, one question per line so a fix diffs as the lines it touched; `tools/data-format.js` rewrites the layout and CI refuses a file that strays from it. `tools/pool-check.js` is what keeps the content honest: every push compares every question with the committed snapshot of the official pool, and both exams match their current release exactly. `tools/pool-fetch.js`, run by hand, re-downloads the pools from the NCVEC and fails when a file or the NCVEC's file list changes.

## Storage

Progress lives in `localStorage` on the device and nowhere else. Every read and write goes through `get` and `put`, which add the namespace: `hamdrill:`, or `hamdemo:` in demo mode.

| Key | Value |
|---|---|
| `srs:<deck id>` | One record per card: `{lv, due, last, fail, n, w, ts}` |
| `badges` | `{<deck id>: {1: day, 2: day, 3: day}}`, the day each rung was first earned |
| `examDay` | The exam date, or absent |
| `prefs` | `showEst`, `showDate`, `haveFRN` |
| `exams` | The last ten practice exams: `{day, right, missed:[[deck, id, answer given]], secs, est}` |
| `seeded` | Demo mode only: the sample has been created |

A practice exam in progress sits in `sessionStorage` under `<namespace>exam` (ids, answer orders, picks, start time), so a reload comes back to it; Finish and Back clear it.

Records are checked by `validRecord` on import and the first time a deck is read: `lv` and `due` must be whole numbers in range, the other fields the right kind when present, and only those seven fields are kept; `due` is clamped to today plus the longest interval and `last` and `fail` to today. A damaged record, or one for an id no longer in the deck, is dropped.

Days are whole numbers, local days since 1970 (`dayNum`), so "due today" never depends on the hour.

Export writes the same records to a JSON file, with the badges, the exam date and the practice exams; import merges records card by card, keeping whichever was answered more recently (`mergeSrs`), and takes the exams only when there are none yet.

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

The page is a hash router (`route`): home, a deck's drill (`#t1`), a primer drill (`#t1/p/<key>`), study pages (`#t1/study`, `#study`), `#due`, `#hard`, `#symbols`, a flash-card deck (`#edges`, `#facts`), `#about`, and the practice exam (`#exam`, `#exam/result`, `#exam/missed`). Each screen function rebuilds `#app` from a template string. In-app moves push history entries carrying their depth, so the phone's Back button retraces them.

In a drill, reviews come first, shuffled; new cards follow grouped by topic in pool order, each topic's primer shown before its first new card. Answer order is shuffled except where an option reads "All these choices are correct". A list drill (`drill({cards})`, used by `#hard` and `#exam/missed`) runs the cards it is given in that order, due or not. A miss comes back four places on as a repeat (`re`), which counts for nothing on the first-try score. The three counter lines are shared (`sessionLine`, `posLine`, `scoreLine`): the session line counts the session's own start pool (`startPool`, set in `start`), so it reads "N due today, M still to get right" and M never exceeds N however the day rolls over; the position counts the list with its repeats; the score counts distinct items. Each group chip in a section drill counts the cards whose last answer was a miss (`lastMissed`: level 0 with `due` still equal to `fail`).

`hardCards` lists the pool and math cards missed at least twice (`w`) and not mastered, hardest first, one entry per question id.

## Practice exam

`examDraw` picks one random question from each group in pool order, 35 in all, which is how the real exam is built; both pools have exactly 35 groups and each section's group count equals its exam count. The screen is a continuous scroll of every card: the current one full size with an amber border and shadow, the rest at 70% opacity and 97% size, with `aria-current` on the current card and the keyboard-shortcut id `ans` on its answers alone. A tap or a keyboard focus makes a card current. `examScore` turns the picks into right, missed (with the answer given) and per-section counts; unanswered counts as wrong. Results never touch the review records; the misses are offered as a list drill, which does.

## App icon badge

`badgeCount` is the pool reviews due today, or the cards due tomorrow once today's are done. `updateBadge` sets or clears the icon badge from `saveSrs`, `home` and the page going hidden; it does nothing in demo mode or where the Badging API is missing. iOS shows the badge only after notification permission, asked from a line on home that appears on an installed iOS copy; Chrome for Android has no Badging API.

## Demo mode

`?demo` switches the namespace to `hamdemo:` and seeds a learner three weeks in (`seedDemo`). The learner is simulated day by day through `step` from fixed per-deck seeds (`DEMO_PLAN`, `DEMO_SEED`), so every record is one the scheduler could have written and badge dates are the days they were earned. Dates are relative to the visit, so the demo looks the same any day. test/demo.test.js pins the result.

## Offline and releases

Each exam's sw.js sets its cache name (`hamdrills-technician-v`) and imports app/sw-core.js, which precaches the exam's files and the shared ones under `<name><APP_VERSION>` and answers every request from cache (`ignoreSearch`, so `?demo` works offline). On activation it deletes only its own older caches: every site on daseme.github.io shares one origin, and so one set of caches and one localStorage. The old address's `hamdrill-v*` caches are left to the old address.

To release, change files and raise `APP_VERSION` in version.js. The new service worker installs, takes over, and the page reloads at the next safe moment (on home, or when the app goes to the background), with a toast naming the version.

## Why no framework

The app is twelve decks and a few screens, read on phones, often offline. A single file with template strings loads instantly, needs nothing installed to run or change, and can be opened straight from disk. A framework would add a build step and dependencies to keep current without making any screen better. That would change if the app grew real shared state across many screens, accounts, or sync between devices.
