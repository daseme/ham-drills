# Band edges as pairs: design

Date: 2026-10-29. Kurt tried the Band edges cards (the 2026-10-29 band-edges design) and did not want them: "What I want is to drill which meter maps to which MHz bandwidth. 160m is 1.8-2MHz. So a card can ask what [range] is 160 and the answer is 1.8-2MHz. Or the card shows 1.8-2MHz and the answer is 160m. There are 11 ... so we would have 22 different things the user could see." The eleventh is 6 meters. This replaces the earlier design's deck; the drill, the chart and the bar are kept.

## Intent

Recall of the band name from its frequency range and the range from its name, for the ten HF bands a General gets and 6 meters, with nothing else on the card. The General segments (where CW ends, where General phone starts) stay on the Bands chart and in its primer and notes; these cards carry only the outer edges, in the plain form Kurt used: "1.8 to 2.0 MHz".

Goals: 22 cards, two per band, each direction with its own review record so a band you know one way keeps coming back only the way you miss; the same drill, scheduler, badges and study page as any flash deck; one source of truth for the numbers. Non-goals: segments on the cards, VHF and UHF beyond 6 m, Technician cards, a change to the scheduler, a change to the chart.

## The deck

The `edges` deck in general/data.js keeps its id, code (Edges) and route, and is rewritten: name "Band edges", exam 0, a new intro ("Which band is which: the eleven bands' outer edges, each asked both ways..."), no deck-level `prompt`, and 22 cards. A card gains an optional `p`, its own prompt line, shown in place of the deck's `prompt`. The forward card for a band is `{k:"160-range", p:"Frequency range of", n:"160 m", a:"1.8 to 2.0 MHz", t:<hook>}` and the reverse is `{k:"160-band", p:"Which band is", n:"1.8 to 2.0 MHz", a:"160 m", t:<hook>}`. The forward card's text ends with the band's power limit, as Kurt asked after seeing the cards ("show allowable pep power as well on the MHz side"): "1.8 to 2.0 MHz, 1500 W PEP", with 200 W PEP on 30 m and 100 W ERP on 60 m, each held to the pool's answers by a test. The reverse card's name is the forward card's range alone, since the limit would give 30 m and 60 m away. The keys are stable, so rewording a range or a hook later does not reset a card. Deck order is the eleven forward cards, 160 m to 6 m, then the eleven reverse cards in the same order; the drill shuffles anyway.

Ranges, in MHz: 160 m 1.8 to 2.0; 80 m 3.5 to 4.0; 60 m 5.330 to 5.407; 40 m 7.0 to 7.3; 30 m 10.1 to 10.15; 20 m 14.0 to 14.35; 17 m 18.068 to 18.168; 15 m 21.0 to 21.45; 12 m 24.89 to 24.99; 10 m 28.0 to 29.7; 6 m 50 to 54. Trailing zeros are kept only where the pair would otherwise read oddly ("1.8 to 2.0", "3.5 to 4.0", "7.0 to 7.3", "28.0 to 29.7"), and the exact edges 18.068, 24.89 and 5.330/5.407 are written out because those are the ones an exam asks.

The hook is the same on both cards of a band and gives the arithmetic that ties the two sides together: 300 divided by the frequency in MHz is the wavelength in meters, with a divisor inside the band and "≈" unless it comes out exact. "300 ÷ 1.9 ≈ 160" on 160 m, "300 ÷ 3.75 = 80" on 80 m, "300 ÷ 50 = 6" on 6 m, and so on; 60 m says "≈ 56, and the band is called 60". Where a band has one defining fact, it follows in a few words (30 m: CW, RTTY and data only, 200 W; 60 m: four channels and one 15 kHz segment, USB, 100 W ERP; 6 m: VHF, a Technician already has all of it, the bottom 100 kHz CW only).

The band table `EXAM_CONFIG.bands` (ten HF rows) is unchanged, so the chart is unchanged, byte for byte, and the fixture test keeps saying so. A second list in general/exam.js adds 6 m (50 to 54 MHz; 50.0 to 50.1 CW only, the rest every mode) for the bar only; `EXAM_CONFIG.bands` is still the HF table. `bandBar` now takes the card, not a name, and draws the band whose name is the card's name or its text, so both cards of a band show the same bar on the back; a card naming no band draws nothing. `EXAM_CONFIG.art[deck id]` is therefore a function from card to markup, and the app passes the card.

## The drill and the study page

The flash drill is unchanged except that the prompt line above the name is `card.p || deck.prompt`, on the front and on the back, the front's answer group is labelled by the prompt and the name when either card or deck has a prompt, and the shuffle keeps the two cards of a pair apart (one's answer being the other's name), since the first's back would give the second away; a requeued miss may still land beside its partner. Keys 1 and 2, the Show button, requeueing on a miss, first-try scoring and the end screen are as they were.

The study page (`#edges/study`, and the same section inside `#study`) lists every card: its prompt in muted type, its name in bold, the bar, the text and the hook. Twenty-two entries, forward then reverse, so the first eleven read as the table and the second eleven as the quiz in print.

Records from the earlier cards (`srs:edges` keyed "160 m" and so on) no longer match any card, and `loadSrs` drops unknown keys the first time the deck is read, as it does withdrawn questions; an import skips them. Nothing migrates them: the old cards asked for segments, and a level earned on segments says nothing about the pairing. The Bronze badge earned on them would survive, since badges are kept per deck id, so a deck gains an optional `gen` (Edges: 2); a badge records the deck's generation when it has one, and a badge of another generation is dropped at startup and ignored on import.

## Checks and docs

pool-check accepts `p` on a flash card (a non-empty string when present) and `gen` on a deck (a positive whole number). The test harness can seed localStorage (`load({storage})`). Tests: test/edges.test.js is rewritten for 22 cards: two per band, keys `<band>-range` and `<band>-band`, every reverse name equal to its forward text, the forward text's numbers equal to the table's `lo` and `hi` for the ten HF bands and 50 and 54 for 6 m (parsed with a regex that takes whole numbers too, so "50 to 54" counts), hooks present and identical within a pair, each hook's "300 ÷ x" with x inside the band and 300/x within a tenth of the band (exact where the hook says "="), the shuffle never placing a pair side by side over forty runs, old records and an old-generation badge dropped, `itemIds` is the 22 keys, the chart fixture, the bar for either card of a band and nothing for a card of another deck, the drill's prompt line per card, home "22 cards", study pages with 22 entries. test/facts.test.js's "Edges keeps its prompt" case checks the per-card prompt instead. The General screens in CI already include edges and edges/study; a rebaseline follows the build. CHANGELOG 38, ARCHITECTURE (`p`, art takes the card), README unchanged ("flash cards for the band edges" still describes it). Version 38. The earlier design note gets a line at the top pointing here.

## Red team

A fresh reviewer read the design against the code before the build. What changed as a result:

- The 60 m card had said "five channels" where the chart, its notes and the Bands primer say four channels and a 15 kHz segment; the card now matches them, and the channel detail sits in the hook so the reverse card's front is the bare range.
- 6 m is not every mode across the whole band: 50.0 to 50.1 MHz is CW only, so the bar and the hook say so.
- The hook arithmetic is only exact for 80 m and 6 m; every other hook uses "≈" with a divisor inside the band, and a test parses each one.
- The Bronze badge from the old cards would have survived on the home row and in the sash; the deck generation number was added for it.
- The drift test's number regex took only decimals, so "50 to 54" would have failed; it takes whole numbers now.
- Orphaned records are dropped on first read, not merely ignored, so the text above says that.
- Both cards of a pair could land side by side in the shuffle, the first's back giving the second away; the drill now spreads them.
- The Facts test's check that Edges keeps its prompt matched "General privileges on" and a name ending in "m"; it now matches either prompt and any name.

Accepted as is: the CHANGELOG 36 entry describes what version 36 shipped and stays; the README's "flash cards for the band edges" still describes the deck.
