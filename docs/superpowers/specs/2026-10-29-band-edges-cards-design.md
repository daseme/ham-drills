# Band edges flash cards: design

Superseded the same day by the band-pairs design (2026-10-29-band-pairs-design.md): Kurt did not want the segments on the cards. The drill, the bar and the study page built here are kept; the deck's cards are replaced.

Date: 2026-10-29. Kurt asked for flash cards on the General band plan: "160 m is 1.8 to 2 MHz, 40 m is x, 20 m is y. I just need to be drilled on these."

## Intent

Plain recall of the General privileges on each HF band, drilled by the scheduler like everything else. The existing Bands deck drills the pool's questions and shows the chart; this adds the bare numbers as cards you flip and grade yourself, because the pool's four-choice questions let you recognise an edge without being able to say it.

Goals: ten cards, one per HF band, front is the band, back is the General segments with a short hook; graded by the person (Got it / Missed it); scheduled, counted and badged like the symbol drill; one source of truth for the numbers. Non-goals: VHF and UHF (General adds nothing there), Technician cards, a "which band is this frequency" mode, any change to the scheduler.

## The deck

A new deck in general/data.js after Bands: `{id:"edges", code:"Edges", name:"Band edges", exam:0, intro, flash:[...]}` where each card is `{n:"40 m", a:"CW, RTTY and data 7.025 to 7.125 MHz. Phone and image 7.175 to 7.300 MHz.", t:"The 50 kHz between them, 7.125 to 7.175, is Extra-only phone."}`. `n` is the card's id for review records, as `n` is for symbols. 60 m's card gives the four channels and the small band, with USB, 100 W ERP and 2.8 kHz. 160 m says all modes across the whole band; 30 m says CW, RTTY and data only, 200 W.

`itemIds(d)` gains the `flash` case, so stats, due counts, badges, export and import, validation and the home row all work unchanged. The home row reads "10 cards. Not started." `hardCards()` skips decks without `Q`. The review-all sentence lists it: "Math, Bands and Edges are reviewed on their own."

The numbers in the cards are typed in data.js; a test checks every General segment edge in `EXAM_CONFIG.bands` appears, to three decimals, on its band's card, and that every card names a band in the table. The card back also shows that band's bar from the chart: `bandChart` is split so one band can be drawn alone, exposed as `EXAM_CONFIG.art.edges(name)`; the app shows `C.art[deck.id](card.n)` when it exists.

## The drill

`#edges` routes to `flash(deck)`, modelled on `symbols()`: Back, title, sub line from `intro`, Due today checkbox, the srs line, position and first-try score, progress bar, one card, reset link. Cards due (or all, with Due today off) are shuffled.

Front: prompt "General privileges on", the band name large, and one button "Show" in the `#ans` group, focused, so Enter, Space or 1 flips it. Back: the band's bar, the text, the hook in muted type, and two buttons in `#ans`: "Got it" and "Missed it", so keys 1 and 2 grade. Grading records the answer and moves straight to the next card; a miss with Due today on requeues the card four places on, as in the symbol drill. First-try score counts only the first showing. End screen as the symbol drill's: first-try fraction, how many are still due, how many return tomorrow.

Study page for the deck (`#edges/study`): the intro, then every card with its bar, text and hook, so the page is the printable list. Home's "New to Edges? Read its basics first" link works through `d.flash` as it does through `d.P` and `d.S`.

## Checks and docs

Tests: deck shape and drift against `EXAM_CONFIG.bands`; flash drill renders front, flips, records a level on Got it, requeues on Missed it, end screen; home row and review-all sentence; Technician untouched. General screens in CI gain `edges` and `edges/study`; home changes, so a rebaseline follows the build. CHANGELOG, ARCHITECTURE (the `flash` field, `art`), README one clause. Version 36.

## Red team

A fresh reviewer read the design against the code before the build. What changed as a result:

- Three crashes avoided: the whole study guide, the router and the hardest-cards list each assumed every non-symbol deck has questions. The study page gains a flash branch, the router matches on the `flash` field (so a Technician flash deck later needs no router change), and `hardCards` skips any deck without `Q`.
- The drift test parses every number on a card and checks the table's edges numerically, since 5.3515 to three decimals is not on the card; it also covers the 60 m channels and requires one card per band in the table.
- The home row says "cards", not "questions"; the badge sash takes seven columns once a deck list passes twelve, so Edges doesn't sit alone on a third row; Technician's six-column sash is untouched.
- A band's bar is `aria-hidden`; the front's answer group is labelled by the band and the back's by the text and hook, so a screen reader hears the card when focus lands on its button. The full chart is kept byte for byte through the refactor, checked against a fixture.
- Key repeats are ignored in the drills, so holding 1 cannot flip a card and grade it unseen.
- pool-check checks a flash deck's shape: unique names, text and a hook on every card.
- The Bands chart primer links to the cards; ARCHITECTURE notes that the record key is the card name.

Accepted as is: Edges cards due today never join the home headline, the icon badge or the review-all drill, as Math and Bands don't; the toast "Edges Band edges" repeats a word, as "Bands Bands and privileges" does.
