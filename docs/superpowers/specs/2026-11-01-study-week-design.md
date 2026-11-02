# A study week on the home screen: design

Date: 2026-11-01. Kurt wants to encourage the learners who like building a streak, or at least seeing that they studied 5 of the last 7 days, and asked for what the research supports. The feature is for the first-license learner above all: the Technician pool, a few weeks of study, one exam to pass. It works the same in General.

## What the research says, in short

- A goal of "7 days a week with 2 days off in reserve" beat both "5 days a week" and "7 days a week" in a month-long field study, though it is arithmetically 5 of 7 (Sharif & Shu, JMR 2017; OBHDP 2019). People reached the goal up to 40% more often and got back on track after a miss 55% of the time, against 44% for the easy goal and 37% for the hard one. The reserve has to feel like it costs something; labelled "bonus" it stopped working.
- Rigid routines form weaker habits than flexible ones (Beshears, Lee, Milkman et al., Management Science 2021).
- Showing someone a broken streak lowers later engagement; showing an intact one raises it. The damage is worse when they blame themselves and smaller when the streak can be repaired. Never send "you broke your streak" (Silverman & Barasch, JCR 2023). Khan Academy retired streaks in 2021 partly for this reason.
- One missed day does not slow habit formation (Lally et al. 2010).
- Streaks do sustain use: a 60,000-student randomized trial found messages highlighting a weekly streak kept students on a maths platform better than personalized reminders (Cristia, Cueto, Malamud, Aulagnon, Economics of Education Review 2025).
- The streak and the daily goal should be separate things. When Duolingo made the streak depend on the daily goal, fewer learners kept one; splitting them raised daily learners on a streak by 19%. The floor for "a day" should be low; the amount to do belongs elsewhere.
- Monitoring progress visibly raises goal attainment (Harkin et al., Psychological Bulletin 2016), and people recommit at natural boundaries, Mondays especially (Dai, Milkman, Riis 2014). So the week resets on Monday, quietly.

The SHRM Learning System, which Kurt had heard of, has no streak: an exam date, pretests, an adaptive plan and reminders. The app already has the equivalents (exam date, spaced scheduling, section badges).

## Intent

The home screen shows the current week as seven dots, Monday to Sunday, under a goal of 7 days with 2 days off in reserve: 5 studied days make the week. A missed day spends a day off on its own; nothing has to be declared. The long count is weeks made in a row. A missed week drops the count and Monday is a clean row. The strip never names a loss and never scolds; the steady learner has something to protect and grow, and the returning learner sees a week that is still winnable.

Goals: a visible, forgiving reason to open the app most days; a thing to keep for the steady learner; a soft re-entry for the lapsed one.

Non-goals: changing the scheduler, the due count, the estimate or the badges; notifications or reminders (there is no server, and the research against streaks is mostly about nagging); settings for the floor or the number of days off; daily or weekly history beyond what the strip and the count need.

Anti-goals: a "0 of 7" shown to a new learner; any sentence that says a streak or a week was lost; a first day back that is harder than an ordinary day.

## What counts as a day

A day is in when the learner has answered the floor's worth of distinct questions, cards or symbols, in any deck, or has finished a practice exam. The floor is 10, or the number of pool questions that were due at the day's first touch when that is lower and at least 1. So: 3 due, 3 answered, day in; nothing due, 10 answered, day in; 87 due, 10 answered, day in. There is no rest-day credit: a day with nothing due still takes 10 of anything (practice anyway, Math, Symbols). Distinct means a question answered twice in a session, the second time as a repeat of a miss, counts once.

Days are the app's local day numbers (`dayNum`), so the floor and the dots never depend on the hour. The week runs Monday to Sunday: with day 0 a Thursday, `weekday = (day + 3) % 7` gives Monday 0, and the week starts at `day - weekday`.

## Storage

A new key, `days`, documented in ARCHITECTURE's storage table: an object keyed by day number, each `{d, n, x?}`: `d` is the pool reviews due at the day's first touch (`reviewsDue` summed over the pool, as the home headline counts), `n` the distinct items answered that day, `x` true when a practice exam was finished that day. The first thing to run on a new day, home or `record`, writes the entry with `d` and `n: 0`. `record` then recounts the records across every deck whose `last` is today, the distinct items answered today, and writes the larger of that and the stored `n`: `n` never goes down, so a section reset (which deletes the section's records) cannot empty a dot that has filled. `saveExam` sets `x`. Entries older than 400 days are dropped on write. Demo mode has its own namespace as everything does.

A day is met when `x`, or `n >= floor`, with `floor = d >= 1 ? min(10, d) : 10`. A day with no entry was not met.

Backfill, once, for learners who were already studying when this ships: on the first run with no `days` key, build entries for the last 14 days from the records, `n` = records whose `last` is that day, no `d` (so the floor is 10). The steady learner's recent days keep their credit; nothing is invented for days with no answers. The backfill runs after a successful import too, for imported days with no entry, so a learner moving devices before export carries days keeps their week.

Export writes `days` beside the decks (format version stays 2; a file without `days` imports as before). Import merges day by day, keeping the larger `n`, `x` if either has it, and `d` from whichever has one (the smaller when both do).

The demo seed writes `days` for its 21 simulated days as it goes, `d` the seen cards due before that day's answers (the same count `reviewsDue` would give) and `n` the cards answered. Its two skipped days, T-9 and T-16, are never in the current week, so the strip shows this week as it falls from the visit's weekday (in the frozen-clock screenshot, a Tuesday: Monday done, today open, "1 day this week, 2 days off left." and "2 weeks in a row."). The first simulated day, T-21, answers seven cards with nothing due and so is not met; that is fine and not asserted.

## The strip on home

Placement: after the due headline, the reach line, the Review button and the "missed more than once" line when there is one, and before the plan panel, as its own block `.week` with a top rule, as in the mockup. The plan panel's gap above it (`.actions+.plan`) is matched with a `.week+.plan` rule. Hidden until the days log has any entry with `n >= 1` or `x`, so a new learner sees nothing until the first answers.

Seven dots in a `<ul class="days" aria-label="This week">`, one `<li>` each with the weekday initial under the dot (M T W T F S S) and an `aria-label` that says the day and its state: "Monday, studied", "Wednesday, day off", "Thursday, today, not yet", "Friday". States:

- `done`: amber fill with a check, a day this week that was met.
- `off`: dashed muted ring with a dash, a day before today that was not met, on or after the log's first day. A day before the log began (the learner started on a Thursday, say) is not a day off; it shows as empty, with the bare weekday as its label.
- `now`: a heavier ink ring, today when not yet met. Today once met is `done` and also `now`.
- `bonus`: green ring and check, a met day after the week was made (the sixth and seventh studied days), so there is something to fill without moving the goal.
- empty: faint ring, a day still to come.

The line under the dots, `.wl`, with `done` the met days this week, `off` the days off spent (unmet days before today, from the log's first day on), `left = 2 - off - (days this week before the log began)`, so a late start uses up slack without being shown as days off, and the week winnable when `done` plus the days left (today when not yet met, and the days after it to Sunday) reaches 5:

- Week made (`done >= 5`): "Week made, 5 days." or "Week made, 6 days." in green for the first two words.
- Not winnable: "2 days this week." or "Nothing yet this week." and no clause about days off. The dots still show the days that were met. Monday starts fresh. (This covers both three days off spent and a start too late in the week.)
- Winnable with a day off in hand (`left > 0`): "3 days this week, 1 day off left." Singular and plural as needed; with `done = 0`: "Nothing yet this week, 2 days off left."
- Winnable with none in hand (`left = 0`), with `k = 5 - done` the studied days still needed: today not met, "Today and the next 3 days make this week." (k - 1 more days; "Today and tomorrow make this week." at k = 2, "Today makes this week." at k = 1); today met, "3 days this week; the next 2 make it." ("the next one makes it." at k = 1).

A second, smaller muted line (`.wl small`):

- "4 weeks in a row." when the count is 2 or more. The count is consecutive made weeks ending with last week, plus this week if it is already made. A missed last week makes it 0 and the line is absent; it comes back at 2.
- On a return after a gap, instead: "The cards waited. A missed stretch doesn't undo the spacing." Shown when today is not yet met and no day in the last three (today - 1 to today - 3) was met, and at least one day ever was. Once today is met, the normal lines.

Only one small line shows; the welcome-back line wins.

## Session-end acknowledgement

The dot fills when the floor is crossed; the app does not interrupt to say so. The end screen of each of the three drills, and the practice-exam result, adds one line when today became met during that session: "Today's in." followed by the main week line, for instance "Today's in. 4 days this week, 1 day off left." When today was already met before the session, nothing is added. The three drills capture whether today was met in `start`. The practice exam has no `start` and its result screen is a route that can be reopened or reloaded later: the Finish handler compares met-before with met-after `saveExam` and passes the flag to `examResult` once, so the line shows on the result reached from Finish and not on a revisit.

## How it works

The in-app How it works gets a section, "The week", after the badges: a goal of 7 days with 2 days off in reserve, so 5 make the week; what counts as a day (10 questions in any deck, or everything due when fewer are due, or a practice exam); days off are spent on their own; weeks in a row; and that a missed week just starts over on Monday, with the one-sentence reason (missing a day doesn't undo spacing; the cards wait).

## Styles

From the mockup: `.week{margin:16px 0 0;padding:12px 0 0;border-top:1px solid var(--line)}`, dots 30px with 2px rings, `--amber` for done, `--muted` dashed for off, `--ink` 3px for now, `--ok` on `--ok-bg` for bonus, `--none` for empty; labels in Barlow Condensed 13px. Light and dark both come from the existing tokens. `.week` joins the print rule that hides the buttons, footer and toast; the rest of home prints as it does now.

## Checks and docs

Tests, test/week.test.js: the weekday and week-start math (a known Monday, a Sunday, the day-0 Thursday); the floor rule at due 0, 3, 10 and 87; `n` as distinct items after a miss and its repeat; the exam marking the day; the entry written on the first touch of a day by home and by `record`; the three mockup moments rendered from fixed days logs (steady Thursday, week made Saturday, back after ten days on Wednesday) asserting dot classes, aria-labels and both lines; the not-winnable line; weeks in a row at 0, 1, 2 and 5 and after a missed week; the strip hidden with an empty log; the welcome-back condition on and off; the backfill from records; export carrying `days` and import merging it; `n` not falling after a section reset; the demo seed producing a log with T-9 and T-16 unmet and T-20 to T-1 otherwise met; the end-screen line present only when the day was met in that session, in a drill and on the exam result from Finish, and absent on the result route reopened. The harness's stub DOM may need `ul`/`li` children kept, as counters.test.js did for buttons.

Screens: the demo home screenshot changes, so a rebaseline follows. ARCHITECTURE: the storage table gains `days`, and a short Week paragraph after Scheduler. CHANGELOG 43, version 43. `.superpowers/` goes in `.gitignore`.

## Red team

A fresh reviewer read the design against the code and replayed the demo seed under the floor rule before the build. What changed as a result:

- The demo's skipped days, T-9 and T-16, can never fall in the current week, so the sample cannot show them as days off; the strip shows this week as it falls, and the sentence claiming otherwise is gone. The seed's first day answers seven cards with nothing due and is not met; accepted and not asserted.
- `n` is monotonic. A section reset deletes today's records, which a plain recount would turn into an emptied dot.
- The "missed more than once" line sits between the Review button and the plan panel on the busiest home state; the strip goes after it, and the panel's gap gets a `.week+.plan` rule.
- The practice exam has no `start` and its result screen is a reopenable route; the Finish handler passes the flag once.
- The "none in hand" line was pinned as one sentence; it is now a rule with its singular forms.
- The print rule hides only the buttons, footer and toast, not "home chrome"; `.week` joins that list.
- The mockup says "A day with nothing due counts on its own" and "Week made. 5 days, and Saturday on top."; the design, which drops the rest day and reads "Week made, 6 days.", wins.

Found by the whole-branch review after the build: when an answer was the day's first touch (the app left open past midnight, or opened at a bookmarked section), the due count was taken after that answer had moved its card, so a learner with one card due could not meet the day; `record` now touches the day before the step. The review also corrected which screenshots the rebaseline should change: Technician home and both About pages, not General home.

Found while planning: a learner whose first study day is a Thursday would have seen Monday to Wednesday as days off, and "1 day this week, 2 days off left" for a week that cannot reach five days. Days before the log's first day are now neutral, and winnable is computed from the days actually left.

## Left to the builder

Where in app.js the week helpers sit (a `week` block after the drill counters is natural); whether `n` is recounted on every `record` or batched per session end, so long as the dot is right by the end screen and after a reload; the exact SVG or CSS for the check and dash; how the harness fakes the day for the fixed-log tests.

Found in review, version 44: a rebuilt day with no `d` had the floor of 10, so a steady learner whose days had fewer answers saw them as days off, against the intent above; rebuilt days now carry `d = n`. The backfill also ran at load before `badgeCount` was defined, so a deck rewritten on the way (a withdrawn id, say) crashed startup in browsers with the Badging API; it now runs just before the first screen. A demo sample seeded before the log is seeded again, and a log entry dated after today is dropped.
