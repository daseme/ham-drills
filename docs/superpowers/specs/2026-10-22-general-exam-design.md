# General exam drills: design

Date: 2026-10-22. Status: draft for Kurt's approval.

## Why

Kurt passed the Technician exam on 2026-10-21 and is now studying for General, on the current 2023-2027 pool. He used the explanations regularly while studying Technician, so General is only useful with them.

The Technician app stays in use: Kurt's wife has progress in it, and four more people are about to start. Several of them are less technical. For them Technician must stay exactly as it is, and flawless; that matters more than General.

## What gets built

A splash page and two apps from one codebase, all on daseme.github.io:

| Address | What |
|---|---|
| `/ham-drills/` | Splash page: a title, one line about each exam, and links to the two apps. This is the link to hand out from now on. |
| `/ham-drills/technician/` | The Technician app, moved here unchanged. |
| `/ham-drills/general/` | The General app: the same app, with the General pool and its own content. |
| `/ham-technicians-drills/` | The old address. Forwards to `/ham-drills/technician/`, keeping any `?demo` and `#...`. |

Each app is installed and used on its own: its own home-screen icon, its own progress, exam date, estimate and badges, and only its own exam on screen. A Technician learner never sees General, and Kurt lives in General.

## Goals

1. Technician is unchanged for its learners, apart from its address.
2. Kurt's wife's Technician progress is never at risk, and reaches the new address with at most a two-minute, one-time hand-off done with Kurt (see Repository and migration).
3. Kurt can start drilling General section by section, each section complete with its explanations.
4. One codebase: a fix to the app is made once and reaches both exams.

## Anti-goals (failure even if it works)

- Any visible change to a Technician screen, or any new choice put in front of a Technician learner.
- Lost or mixed-up progress in either app.
- A General explanation that is wrong, or disagrees with the answer NCVEC keys. A wrong explanation is worse than none.
- A General section shown before its explanations and basics exist.

## Non-goals (for now)

- A General demo mode (`?demo`), for the portfolio. Later.
- Amateur Extra.
- Any link between the two apps' progress, or a switch inside an app.
- Making the splash page installable or offline.

## Decisions made with Kurt

- Separate apps behind a splash page, not an exam switch inside one app.
- One codebase in one repository, with the addresses above.
- General uses the current 2023-2027 pool with all errata through the 6th (February 4, 2026).
- Each General section ships complete: questions, short notes, full explanations, topic basics.

## Repository and migration

My call: rename the existing `daseme/ham-technicians-drills` repository to `ham-drills`, so its history, tests and GitHub check carry over, then create a new, tiny `daseme/ham-technicians-drills` repository that only forwards. (After the rename, GitHub Pages serves the renamed repo at `/ham-drills/`, and the old path is free for the forwarding repo.)

The forwarding repo holds:
- `index.html` that sends the browser to `/ham-drills/technician/`, carrying over the query string and hash.
- A `sw.js` at the same path as the old one, so phones that installed the old app pick it up as an update. It must delete only the old `hamdrill-v*` caches, unregister itself, and never touch anything else.

Checked 2026-10-22: there is no `daseme/ham-drills` repository, no `daseme.github.io` user site, and no custom domain, so nothing collides. The builder does the GitHub steps (rename, create the forwarding repo, turn on Pages) in one sitting with `gh`, after Kurt approves, so the old address is down for minutes at most; installed copies keep working from cache meanwhile.

Progress carries over by itself: all these addresses are one origin (daseme.github.io), so they share localStorage, and the moved Technician app keeps reading the same `hamdrill:` keys.

Kurt's wife uses an iPhone, from a home-screen icon (confirmed 2026-10-22). On iOS a home-screen web app keeps its storage apart from Safari and from any other icon, so her progress lives in the old icon's own storage, and an icon added fresh from the new address would start empty. Therefore:

- Nothing in the move may clear localStorage: the forwarding page and the forwarding `sw.js` delete only old `hamdrill-v*` caches. Her progress stays intact in the old icon whatever happens.
- She keeps using her old icon; it forwards to `/ham-drills/technician/`. The expectation is that progress comes along, because the forwarded page runs inside the old icon's storage, but this can't be verified off-device: iOS versions differ on out-of-scope navigation in home-screen apps.
- Right after step 1 ships, Kurt checks on her phone that her progress shows at the new address. If it does, she is done. If not, Kurt does a one-time hand-off with her: Export progress in the old icon, add the app to her home screen from Safari at the new address, Import progress there. The builder writes these steps for Kurt in plain words before step 1 ships.
- Kurt holds off sending links to the four newcomers until step 1 ships, so they install from the new address.

## Storage and caches

Everything on daseme.github.io shares one localStorage and one Cache Storage (see ARCHITECTURE.md). So:

| App | localStorage namespace | Service-worker cache prefix |
|---|---|---|
| Technician | `hamdrill:` (unchanged, so existing progress carries over); demo stays `hamdemo:` | new prefix, not `hamdrill-v` (the old address's service worker clears `hamdrill-v*`) |
| General | its own, e.g. `hamgeneral:` | its own |

Each service worker deletes only its own older caches. Each app's service worker lives in its own folder, so its scope is that folder.

## The app becomes exam-neutral

Everything Technician-specific moves out of the app's code into each exam's data: the exam name and titles, element number, pool years, number of exam questions (35 for both), pass mark (26 for both), the "74%" pass percentage, the About page's facts, the figures (Technician's T-1, T-2, T-3 are inline SVG in index.html today), Math's topic grouping (hard-coded to T5B/T5C/T5D today), the storage namespace and cache prefix, and the demo plan (Technician only).

How the files are arranged is the builder's call, with these constraints: no build step (the files in the repo are what ships), each app folder works as its own installable app, and opening an app's index.html from disk still works.

One version number for the whole repo, raised on every change, as now (my call). CHANGELOG.md continues.

## Proving Technician is unchanged

Before the move and after it, screenshot every Technician screen with real progress loaded (the existing headless-Chrome method: home, a drill, a study page, About, Symbols, the review-all drill, and demo home), and compare pixel for pixel. The only allowed difference is the version number in the footer and About. Any other difference blocks the release.

The existing tests and pool check must pass for Technician throughout, and keep running on every push.

## General content

Source: `General Class Pool and Syllabus 2023-2027 Public Release with 6th Errata Feb 4 2026.docx` from https://ncvec.org/index.php/2023-2027-general-question-pool-release (a copy is in `private/ncvec/`). It holds 423 live questions in ten subelements, G1 to G0, supplying 5, 5, 3, 5, 3, 2, 3, 3, 4, 2 exam questions (35). Withdrawn questions appear as a line like `G1A04  Question Deleted (section not renumbered)` and are left out.

Sections are G1 to G0 plus a Math section of the pool's calculation questions with worked solutions, like Technician's. No symbol drill: figure G7-1 (schematic symbols) is drawn in, in the same style as Technician's figures, and shown on the five questions that use it.

For every question, the same content Technician has: the question and options verbatim, a short note shown after answering, and a longer "Explain this more" explanation; for every topic, a primer ("basics") shown before its first new question and on the study pages. Same voice and length as Technician's.

Accuracy rules:
- Every note and explanation must agree with the answer NCVEC keys.
- Rules questions (mostly G1) are checked against the Part 97 section cited beside each question in the pool.
- Each section gets a separate review pass, by a reviewer who did not write it, before it goes live. My call: the reviewer is a separate AI agent given the pool text, the cited Part 97 sections and the draft; findings are fixed, and the builder ships the section without waiting on Kurt (he can't judge General content yet, and he wants to start). Kurt reports anything that looks wrong while studying.
- `tools/pool-check.js` learns General: G ids, withdrawn questions skipped, and data compared with the pool file. It must pass for General with zero problems.

## While General is incomplete

My call, for the weeks when only some sections are live:
- The home screen lists only live sections.
- The estimated score is hidden, with one line instead, e.g. "The estimate appears once all ten sections are in." An estimate from G1 alone would mislead. "Untouched sections hold N exam questions" counts live sections only.
- The exam date works normally.
- The pool check compares the live sections with the pool, question for question, and reports pool sections not yet written as "not yet added" rather than as failures. Once all ten are live, full coverage and the 35-question sum are required, as for Technician.
- This is driven by the exam's data, so Technician (always complete) behaves exactly as today.

## Order of work

1. Make the app exam-neutral and move Technician to `/ham-drills/technician/`, with the forwarding repo and the splash page. Technician pixel check passes. Ship.
2. Stand up the General app with G1 complete and reviewed. Ship, so Kurt can start.
3. G2 to G0 and Math, one section at a time, each reviewed and shipped as it is done.

## Left to the builder

- File layout and how an app loads its exam's data and settings.
- The splash page's look, within the app's existing style.
- The General storage namespace and cache prefix names.
- How the Math section is drawn from the pool.
- Test structure for two exams.
