# Drill counters that say what they count: design

Date: 2026-10-30. Feedback on a drill screen that read "4 due today, 0 of 52 mastered", "Question 49 of 52", "37 of 43 right first try": questions kept coming after the header said four were due, and the first-try denominator lagged the position. The counts were right. Three different things are counted (the section's due questions, the session's list with repeats of misses, and distinct questions answered) and no label says which. Kurt: "we need clarity of language. this is teaching after all."

## Intent

Every counter on a drill screen names what it counts, and a repeat is marked as one when it comes round, so a learner can tell how much review is due, how much of the session is done, and when it ends. The counting itself does not change: reviews are still shuffled, a miss still comes back four places on, a repeat still counts for nothing on the first-try score.

Non-goals: changing the scheduler, the repeat distance, the end screen's arithmetic, the home screen or the practice exam.

## The three drills

The question drill (`drill`), the flash-card drill (`flash`) and the symbol drill (`symbols`) each have the same three lines and get the same wording, with "question", "card" or "symbol" as the noun.

The session line (`#srsline`), with Due today on (and always in the review-all drill): "46 due today, 4 still to get right, 0 of 52 mastered." The 46 is the session's start pool, the items due when `start` ran (`startPool`, recomputed on every start: a chip, the Due today box, Reset and Start over all call it); the 4 is how many of those are still due, which falls when one is answered right on any showing and stays when it is missed, since a miss is due again today. Counting the start pool rather than everything due keeps the line true after midnight, when tomorrow's cards become due: they are not in the session and are not counted. When nothing is left: "46 due today, all answered right, 0 of 52 mastered." When nothing was due to begin with: "Nothing due today, 0 of 52 mastered." The review-all drill has no mastered clause: "46 due today, 4 still to get right, 3 coming up tomorrow." With Due today off, the session is not the due set, so the line stays as it is: "4 due today, 0 of 52 mastered." The hardest list's line is unchanged.

The position (`#pos`): "Question 49 of 52" when there are no repeats; "Question 49 of 52, including 6 repeats" once a miss has added one (`items.length - startPool.length`; the list only ever grows by the repeat spliced in on a miss). Singular: "including 1 repeat".

The score (`#score`): "37 of 43 questions right on the first try" (cards, symbols; singular when one). The noun says it counts distinct questions, the phrase matches the end screen's "right on the first try", and the repeats clause on the position line explains the gap to the position.

The card itself marks a repeat: the question drill's topic line starts "Repeat · " before the question id (ahead of "Missed n times" in the hardest list, so the session mark is not read as part of the lifetime count); the flash and symbol drills show a `<p class="topic rep" id="qrep">Repeat</p>` line above the prompt, on the flash back too. The mark has the id `qrep`, and on a repeat card it is prepended to the answer group's `aria-labelledby`, so a screen reader hears "Repeat" before the question when focus lands on the first button. The mark is amber and bold.

The end screen's Start over button is hidden when Due today is on and nothing is left due, since starting over would show "Nothing is due here today".

The status line may wrap on a phone now that both spans are longer: `.status` gains `flex-wrap:wrap`. The three lines are built by shared helpers (`sessionLine`, `posLine`, `scoreLine`) so the drills cannot drift apart.

## Checks and docs

Tests: the Edges test's score strings are updated (nothing else asserted these lines); a new test/counters.test.js walks a miss in each of the three drills and asserts the three lines and the Repeat mark (text and aria) before and after the repeat comes round, the session line's three states, the midnight case (a card outside the start pool becoming due does not change the line), Due today off, the review-all line, and the hidden Start over. The test harness keeps appended children so the question drill's answer buttons can be clicked. CHANGELOG 40, version 40. Screens: every drill screenshot in CI changes where a session line shows (`t1`, `due`, `symbols`, `g1`, `edges`, `facts`), so a rebaseline follows. ARCHITECTURE's drill paragraph gets a sentence on the start pool. The README's drill screenshot, made by hand, still shows the old score wording; left as is.

## Red team

A fresh reviewer read the design against the code before the build. What changed as a result:

- The live count was to be everything due in the section, which after midnight can exceed what the session started with ("50 of 46"). It now counts the session's own start pool.
- "Screen readers get it as part of the card text" was false: focus lands on the first button and the group is labelled by the question alone. The Repeat mark has an id and is prepended to the label on repeat cards.
- The flash drill's head took the card, not the item, so the repeat flag was out of reach; it is threaded through, on the back as well.
- The review-all line has no mastered clause, so its form is stated.
- Start over after an all-right session shows "Nothing is due here today"; the button is hidden then.
- Wording: the line leads with the pool as before ("46 due today, 4 still to get right"), "including 6 repeats" replaced "6 of them repeats", and "right on the first try" matches the end screen.
- The `due` screen was missing from the rebaseline list.

Accepted as is: with the status line wrapping, the second span sits flush left under the first.
