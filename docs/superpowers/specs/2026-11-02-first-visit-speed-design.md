# First-visit speed: fonts preloaded, scripts deferred, explanations split out

Measured on 2026-11-02 against the live site over an emulated 1.6 Mbps, 150 ms link: a first visit shows the blank shell at 0.5 s, home at 1.2 s and the fonts swap in at 1.8 s. Repeat visits come from the service worker in under 0.1 s. The first visit is 180 KB gzipped, of which technician/data.js is 91 KB (general's is 102 KB); a third of each data.js is `window.EXPLAIN`, the long explanations behind "Explain this more", which no one reads before answering a question. The four fonts are requested only once home has rendered, because nothing on the empty page uses them.

Script work is not a cost: home renders in 2 to 3 ms with real progress loaded, and the day log's rebuild is under a millisecond.

Three changes, all to the first visit; repeat visits are unchanged.

## 1. Preload the four fonts home is set in

In both exam pages' heads, before the stylesheet, one `<link rel="preload" as="font" type="font/woff2" crossorigin>` per font file: Atkinson 400 and 700, Barlow Condensed 500 and 600.

All four are on home's first paint (the overline and section codes are Barlow 500, section names and the main button are Atkinson 700), so preloading two would have swapped home's text twice. 
## 2. `defer` on the four script tags

`version.js`, `exam.js`, `data.js`, `app.js` all get `defer`. They still run in that order, once the page is parsed, which is what app.js assumes (it reads `#app` at its top level). The parser no longer pauses on each one, and the preload scanner requests all four at once, which it already did; the gain is small and mostly in the shell paint.

## 3. The explanations load after the first screen

- `technician/explain.js` and `general/explain.js` hold `window.EXPLAIN={...}`, one explanation per line, under a short head comment. `data.js` keeps `window.DECKS` only. The values are moved, not changed.
- app.js reads `(window.EXPLAIN||{})[id]` where it reads `EXPLAIN[id]` today, so a card answered before the file arrives does not throw. The "Explain this more" button renders when there is an explanation or a Basics primer, since the primer sits in the same box; before the file arrives it opens on Basics alone.
- app.js fetches the file itself, after the first `route()`:

  `loadExplain(then)` appends a `<script src="explain.js">` once, and resets on the tag's `onerror`, or on `onload` with no `window.EXPLAIN` defined (a captive portal's page, a proxy's error), so `pick()`, which calls it before reading the explanation, asks again at the next answer. `then` runs once: on load, on error, when the file is already there, or after four seconds.
- The service worker's registration moves inside that `then`: its first precache refetches every file past the HTTP cache (over 200 KB), and on the slow first visit it would otherwise share the link with the one file the learner may need next. A dynamically inserted script is async and never blocks rendering, so the request starts after the DOM for home is built.
- Accepted limit: on a first visit only, a question answered before the file lands has no explanation behind the button; the next question has it. Repeat visits and installed copies have the file in the worker's cache. During a version update, a request the outgoing worker still answers can recreate its emptied cache for a moment; the next activation clears it, and explain.js keys on question ids, so a new copy against an older data.js is harmless.
- `app/sw-core.js` adds `"explain.js"` to `FILES`, so offline copies have it and every version bump refreshes it.
- `tools/data-format.js` formats either kind of file: one holding `DECKS`, one holding `EXPLAIN`. A file that sets both, or neither, is refused with a message naming the split. CI's `--check` runs on all four files.
- `test/harness.js` loads `explain.js` after `data.js`, unless `load({data})` supplied its own source (the fixture is then the whole data) or `load({explain:false})` asks for the page as it is before the file arrives.
- Tests: data-format's tests write the two kinds of file; paths.test.js's "every precached file exists" covers the new file; a new `test/explain.test.js` checks that answering with no explanations loaded neither throws nor shows the button and does ask for `explain.js`, and that with them loaded the button is there.
- Docs: ARCHITECTURE's file table (new row, the index.html and data.js rows, data-format's row) and its data.js paragraph, the README's data-format line, app.js's and the harness's head comments, the changelog, version 45.

Line endings: the working tree holds these files with CRLF and the index with LF; scripted edits match `\r\n`, and new files are written to match their neighbours.

## Measured

First visits to the Technician page, before (version 44) and after, on a local server that gzips as GitHub Pages does, in headless Chrome over an emulated 1.6 Mbps, 150 ms link; two runs each, within 80 ms of each other.

| | Before | After |
|---|---|---|
| Scripts in | 1.0 s | 1.3 s |
| Fonts in | 1.7 s | 0.8 s |
| Home painted | 1.2 s, in fallback fonts, swapped at 1.7 s | 1.4 s, in its own fonts |
| Explanations in | with the scripts | 1.7 s, after home |
| Downloaded before home | 203 KB | 181 KB |

The fonts (77 KB) now share the link with the scripts, which is what moves home's paint later and the finished screen earlier; the explanations (35 KB) leaving the scripts is what makes the finished screen earlier still. Had the fonts stayed as they were, home would paint at about 1.0 s and swap at about 1.5 s. The choice made here is the settled screen; the other is one line per page to undo.

## Red team

A fresh reviewer read the design against the code before anything was built. What it found, and what changed:

1. Home is set in all four font weights, not two (Barlow 500 for the overline and section codes, Atkinson 700 for section names and the main button), so preloading two would swap the text twice. All four are preloaded.
2. The Basics primer sits inside the explanation box, reachable only through "Explain this more", so a card answered before the file landed would have lost Basics too. The button now renders for an explanation or a primer.
3. data-format.js keyed its head comment on `window.DECKS=`, threw unless a file set both globals, and always wrote both; CI's `--check` and two of its tests assumed one combined file. Rewritten per kind, CI checks four files, the tests cover both kinds and the refusals.
4. The worker's first precache (over 200 KB, past the HTTP cache) started at the same moment as explain.js and shared the slow link. Registration now waits for the explanations, with a four-second fallback.
5. The harness copies results through JSON, and an element stub's `firstChild` makes a fresh element on every read, so returning a tag recurses forever; the tests return `src` strings. A screen's rebuild empties every stub element including the body, so tags are counted as they are made.
6. `onerror` does not fire for a 200 that is not the script, which would have disabled the retry for the session. `onload` without `window.EXPLAIN` resets as well.
7. A request the outgoing worker still answers during an update can recreate its emptied cache. Noted above as harmless.
8. Docs the list missed: README's data-format line, ARCHITECTURE's data.js paragraph, app.js's and the harness's head comments. Added.
