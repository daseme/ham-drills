# Seven improvements: design

Date: 2026-10-27. Seven changes picked from a review of the app, each red-teamed before building. All dates in this document are 2026.

## Intent

Make the drills safer with data, better at pointing the learner at weak spots, better at bringing them back each day, and able to check the home-screen estimate against a real exam-shaped run; and make the content and screens cheaper to maintain.

Goals: each change works offline, on a phone, with no packages, inside the existing one-file app. Non-goals: accounts, sync, a server, push notifications, any change to the scheduler. Anti-goal: a change that makes an existing test, screen or backup behave differently without a reason written here.

## 1. Validated backups (review item 2)

Import today merges any object found under a known deck id. A record missing `due` or holding a string `lv` is stored as is; `isDue` then returns false for ever and `tierNow` counts the card as seen.

Design. `validRecord(r)` is a pure function in app.js. It accepts a record when: `lv` is an integer from 0 to `IV.length-1`; `due` is an integer; `last` and `fail` are each an integer, null or absent; `n` and `w` are non-negative integers or absent, with `w` no greater than `n` when both are present; `ts` is a number or absent. It returns a cleaned copy holding only those seven fields, with `due` clamped to at most today plus the longest interval, so a far-future `due` cannot lock a card. `importDecks` keeps only keys that are ids in that deck and records that pass; it counts what it dropped. The toast reads "Imported progress for 5 sections." and, when something was dropped, "Imported progress for 5 sections; 3 records were damaged and skipped." `mergeBadges` accepts only positive integer days. `examDay` is taken only when it is an integer.

Red team, resolved. Version 1 exports (the author's own backup from October 18) have no `w` on cards never missed and no `ts` on some records, so every optional field must stay optional. Clamping `due` must not touch a legitimate level-5 card due in 35 days: the clamp is today + 35, which is the longest legitimate value. Dropping unknown ids is correct for withdrawn questions. A record from another exam's app is already refused by the app-name check.

## 2. App-icon badge (review item 4)

With no server there is no push. The Badging API sets a number on an installed app's icon.

Design. `updateBadge()` sets the badge to the pool questions due today (the home headline's number); when that is zero it sets the questions that come due tomorrow, so the icon carries a reminder into the next day; when both are zero it clears the badge. It runs after every recorded answer, when home renders, and when the page is hidden. It does nothing in demo mode or where the API is absent.

On iOS the badge shows only once the app has notification permission, which can only be requested from a tap. When the app is installed on iOS (`navigator.standalone`), the API exists and permission is still "default", the plan box shows one muted line: "Show the due count on the app icon" which requests permission and then updates the badge. The app never sends a notification. On Android and desktop Chrome no permission is needed and the line never appears.

Red team, resolved. A number for tomorrow shows all afternoon after today's reviews are done, which can read as unfinished work; accepted, since without background execution the only alternative is an icon that never reminds anyone. The About page says what the number means. The count follows the headline, pool sections only, so the icon and the home screen agree.

## 3. Practice exam (review item 5)

The real exam draws one question from each of the pool's 35 groups; both pools have exactly 35 groups and each section's group count equals its exam count.

Design. `#exam` is a screen for exams whose sections are all in. `examDraw()` picks one random question per group, in pool order, with answers shuffled as in the drills. The screen is a continuous scroll of all 35 question cards, modelled on the testing software: the current card is full size and opaque, popped out with a shadow and an amber border; every other card is faded (about half opacity) and slightly smaller. Tapping an answer marks it with no right-or-wrong feedback and makes the next unanswered card current, scrolled into view. Tapping any card makes it current, so an answer can be changed. The current card's answer group carries the id the keyboard shortcuts use, so 1 to 4 and A to D still work. A short line at the top counts answered of 35. A Finish button sits under the last card and reads "Finish" or "Finish with 4 unanswered"; unanswered questions score as wrong.

The results screen shows the score as "29 of 35", pass or not against the pass mark, the time taken, what the home estimate had said, a per-section row of right out of asked, and every missed question with the answer given, the correct answer and the short note. A button "Drill the 6 you missed" opens a drill of exactly those cards, due or not, which records answers normally. The exam itself never touches the review records. The last ten results are stored under `exams` as `{day, right, missed:[ids], secs}`; the plan box on home shows "Last practice exam: 29 of 35, Oct 20." with a link to take another, and the About page gains a paragraph. Leaving the screen discards an unfinished exam, and the intro says so.

Red team, resolved. Recording exam answers into the scheduler would change the thing the exam measures and would reset mastered cards on a single lapse without any feedback shown; so results are kept apart and the missed-cards drill is how they feed back. Faded cards remain in the document and readable by a screen reader; the fade is visual emphasis, not hiding. Reduced-motion users get no scale transition. A reload mid-exam loses the draw; acceptable and stated. `#exam/missed` needs the last result, so it falls back to `#exam` when there is none.

## 4. Group chips with miss counts (review item 6)

Design. In a section drill each group chip shows a small count of that group's cards sitting at level 0 after being seen, which is the count missed at their last answer. The All chip shows the section's total. A chip with a count is tinted with the miss colour. The counts refresh after every answer. The chip's accessible name reads "T6A, 3 missed".

Red team, resolved. Showing due counts instead would make every untouched section's chips shout their totals; the miss count is quiet until something is actually wrong. One signal per chip.

## 5. Hardest-for-you drill (review item 7)

Design. `hardCards()` lists the pool and math cards missed at least twice and not currently mastered, ordered by misses, then by level. Home shows, under the review button, "12 questions you've missed more than once. Drill the hardest." linking to `#hard`, only when there is at least one. The drill is a plain drill of those cards in that order, due or not, recording normally; each card's topic line adds "Missed 4 times". The end screen is the ordinary one.

Red team, resolved. Misses count retries inside a session, so the number can run ahead of separate sittings; it is labelled "times", not "days". Mastered cards drop out so the list shrinks as it should. Symbols are left out; they have their own drill.

## 6. One question per line in data.js (review item 9)

Design. `tools/data-format.js` loads an exam's data.js the way the tests do and writes it back in a fixed layout: the header comment if any, then `window.DECKS=[`, each deck as an object whose scalar fields and `G` sit on one line, `Q` with one question per line, `P` with one primer per line, `CON` one entry per line, `S` and `F` one entry per line, `cheat` on one line; then `window.EXPLAIN={` with one id per line. Values are emitted with `JSON.stringify`, so the data is unchanged byte for byte in meaning, and the file ends with a newline. `--check` exits 1 when a file is not already in that layout. The CI check runs it; a test shows the format is idempotent and round-trips both pools. Both files are reformatted once in their own commit, with the pool check proving them unchanged.

Red team, resolved. Technician's file is Python-dumped JSON with spaces, General's is compact; the formatter normalises both. Line endings are LF; git's autocrlf setting maps them on Windows and the index already holds LF. Nothing reads data.js by line, so the layout is free to change.

## 7. Screenshots compared in CI (review item 10)

Design. The workflow gains a second job that serves the repo with Python's http.server, shoots the demo screens with tools/screens.mjs using the runner's Chrome, and compares them with baselines committed under test/screens/<screen>.png using tools/compare-screens.mjs. The job always uploads its screenshots as an artifact. When baselines are missing, or when the workflow is run by hand with `rebaseline` set, the job commits the new screenshots to the branch instead of failing.

Red team, resolved. Font rasterisation differs between Windows and Linux, so baselines must come from the runner itself, never from a developer's machine: the rebaseline path is the only way they are made. The demo's dates are relative to the visit, so the exam-date line changes every day; screens.mjs now freezes the clock at a fixed instant on every page, which also fixes "Exam in 16 days" and the badge days. Chrome upgrades on the runner may shift a pixel; the compare stays exact and the fix is a deliberate rebaseline, so drift is seen rather than hidden. Random shuffles are already seeded.

## Version and docs

One version bump covers the app changes; the data reformat and the CI job change no app behaviour and ship under the same number. CHANGELOG, README, and ARCHITECTURE describe the new screens, the backup validation, the badge, the formatter and the screenshot job.

## Red team, second round

A fresh reviewer read the design against the code before the screens were built. What changed as a result:

- Practice exam: an update taking over while an exam was open would have reloaded the page and lost it. The draw, answer orders, picks and start time now sit in sessionStorage and a reload comes back to the same exam. The result has its own hash, `#exam/result`, drawn from the stored result, so Back from the missed-cards drill lands on the result rather than a fresh draw.
- Keyboard: a card becomes current when focus enters it, so 1 to 4 answer the card the person is on, and focus moves to the next unanswered card after an answer.
- Faded cards sit at 70% opacity, which keeps the question text above 4.5:1 on the panel, with each card's own question id and `aria-current` on the current one.
- Chips count "missed at the last answer" (level 0 with `due` still equal to `fail`), so a same-day retry that goes right clears the count; before, it would have stayed until the next day.
- Validation also runs over stored records on first read, and `last` and `fail` are clamped to today, so a stray future day cannot win every merge.
- The badge updates from the save path (`saveSrs`), which covers resets and imports as well as answers, and before the reload check on hiding. Chrome for Android has no Badging API, so the About page says iPhone and desktop, and that line appears only where the API exists.
- Export and import carry the practice exam results.
- Screenshots: the version number is masked before capture, the progress path's exam date comes from the frozen clock, capture waits for fonts and two frames, the comparison reports a screen missing on either side, and baselines are committed only from a manual run. The demo list gains `exam` and `hard`; General is shot too.
- The formatter refuses a data.js that sets anything but DECKS and EXPLAIN, rather than silently dropping it.

Accepted as is: a badge showing tomorrow's count all afternoon; Chrome drift on the runner surfacing as a deliberate rebaseline; misses counted per answer rather than per sitting in the hardest drill.
