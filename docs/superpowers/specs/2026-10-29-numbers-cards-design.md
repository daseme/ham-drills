# Numbers to know: design

Date: 2026-10-29. After the band-edges cards shipped, Kurt asked what else was ripe for flash cards and took the recommendation: one deck of the scattered numbers the General pool asks for once each, and nothing else (Q-signals stay four-choice; formulas are Math; the G7-1 symbols are five questions on one figure).

## Intent

Thirty-one facts spread across the pool, each a number you either know or guess, with nothing in the pool that ties them together: rules, decibels, spacings, parts and propagation. A flip-card deck like Band edges, so the number is recalled rather than recognised.

Goals: one card per fact (a few cards hold two or three facts that belong together, such as the two diode voltages); every number on a card comes from the pool's own correct answer, checked by a test; the card says which question it comes from. Non-goals: anything already in Band edges (60 m, 30 m power, beacons' frequencies live there as hooks), anything that is a calculation (Math), Q-signals and prosigns, Technician.

## The deck

`{id:"facts", code:"Facts", name:"Numbers to know", exam:0, intro, flash:[...]}` in general/data.js after Edges. A card is `{n, a, t, q}`: `n` the front (a short phrase naming the fact), `a` the back (the number in a sentence), `t` a hook, `q` the source question id or an array of ids. `prompt` is a new optional deck field: Edges gets `prompt:"General privileges on"` (today hard-coded in `flash()`); Facts has none, so its front is the phrase alone, and the answer group is labelled by the phrase.

The cards (front | back | hook | sources):

1. Antenna height before the FAA must be told | 200 feet above ground, away from a public-use airport. | Taller, and the structure needs FAA notification and FCC registration; near an airport, the limit is lower. | G1B01
2. How long a CSCE is good for | 365 days. | A year to use the exam credit toward the next element. | G1D09
3. Minimum age for a Volunteer Examiner | 18 years. | Plus a General, Advanced or Extra license that has never been suspended or revoked. | G1D10
4. Power limit for spread spectrum | 10 watts PEP output. | The lowest limit in the rules: a wide signal has to stay quiet. | G1E08
5. Power limit for a beacon | 100 watts PEP output; on HF, beacons sit only at 28.200 to 28.300 MHz. | Beacons run unattended, so the rules keep them small and in one place. | G1B10, G1B09
6. How often RACES may drill | No more than 1 hour a week without special authorization. | RACES is civil defense; routine drills are capped so the frequencies stay free. | G2B11
7. ITU region for the Americas | Region 2. | Region 1 is Europe, Africa and northern Asia; Region 3 the rest of Asia and the Pacific. | G1E06
8. One S unit | 6 dB, about 4 times the power. | S8 to S9 takes roughly four times the power out. | G4D06, G4D07
9. 20 dB over S9 | 100 times the power of S9. | Each 10 dB is ten times; two of them, a hundred. | G4D05
10. Doubling power, in dB | About 3 dB. | 10 dB is ten times, 20 dB a hundred, 6 dB four times. | G5B01
11. A 1 dB loss | 20.6 percent of the power lost. | About a fifth gone, four fifths through; 3 dB would be half. | G5B10
12. dBi against dBd | dBi is 2.15 dB higher than dBd for the same antenna. | A dipole has 2.15 dBi; dBd counts the dipole as zero. | G9C04
13. Two stacked three-element Yagis against one | About 3 dB higher, with the pair half a wavelength apart. | Doubling the antenna is like doubling the power. | G9C09
14. Spacing between CW signals | 150 to 500 Hz. | A CW signal is only about 150 Hz wide. | G2B04
15. Spacing between SSB signals | 2 to 3 kHz. | One signal width: SSB is about 3 kHz wide. | G2B05
16. Usual RTTY shift on HF | 170 Hz between mark and space. | The two tones are 170 Hz apart; 45 baud is the usual speed. | G2E06
17. FM bandwidth with 5 kHz deviation and 3 kHz audio | 16 kHz: twice the sum, 2 × (5 + 3). | Carson's rule: twice the deviation plus the highest audio frequency. | G8B06
18. Where digital modes sit on 20 meters | 14.070 to 14.100 MHz. | At the low end of the band, inside the CW, RTTY and data segment. | G2E08
19. FT8 on 20 meters | About 14.074 to 14.077 MHz. | Inside the digital segment; one 3 kHz window the software shares. | G2E15
20. Diode forward voltage | Silicon 0.7 volts; germanium 0.3 volts. | The voltage a diode drops before it conducts. | G6A05, G6A03
21. Open-circuit voltage of a silicon solar cell | About 0.5 volts in full sun. | Cells go in series to make a useful voltage. | G4E09
22. Lowest safe discharge for a 12 V lead-acid battery | 10.5 volts. | Below that the plates sulfate and the battery ages fast. | G6A01
23. Delay from a solar flare's UV and X-rays | About 8 minutes: they arrive at the speed of light. | The sudden ionospheric disturbance that wipes out HF, with no warning possible. | G3A03
24. Delay from a coronal mass ejection | 15 hours to several days. | Charged particles are slow; the geomagnetic storm follows the flare. | G3A11
25. Longest single hop | F2 region about 2,500 miles; E region about 1,200 miles. | Higher layer, longer hop. | G3B09, G3B10
26. Window line impedance | 450 ohms, nominally. | Open-wire ladder line is about 600; coax is 50 or 75. | G9A03
27. Wire and fuse sizes | AWG 12 wire for a 20 ampere breaker; a 15 ampere fuse for AWG 14 wire. | Thinner wire, smaller fuse: the fuse protects the wire. | G0B02, G0B03
28. Rectifier conduction | Half-wave 180 degrees of the AC cycle; full-wave 360. | Half-wave uses one half of each cycle; full-wave both halves. | G7A05, G7A06
29. Dipole and monopole lengths | 468 divided by MHz gives half-wave feet, 234 divided by MHz a quarter wave: 14.250 MHz is 33 feet, 3.550 MHz is 132 feet, and a 28.5 MHz quarter wave is 8 feet. | Halve the frequency, double the wire. | G9B10, G9B11, G9B12
30. Upper frequency for low-SWR BNC connectors | About 4 GHz. | Type N goes higher; the SO-239 isn't a constant-impedance connector at all. | G6B04
31. Phase between I and Q in an SDR | 90 degrees. | In-phase and quadrature: two copies a quarter cycle apart carry both amplitude and phase. | G7C09

Intro: "31 numbers the pool asks for once each, with nothing to tie them together: rules, decibels, spacings, parts and propagation. Each card names the question it comes from."

## App changes

- `flash()`: the prompt line comes from `d.prompt` and is omitted when absent; the front's group is then labelled by the name alone. The back's hook gains the source ids in small type, as does the study page's card. `artOf` returns "" for Facts (no `art` entry), so no bar.
- Nothing else: routing, home row ("31 cards. Not started."), study pages, review-all sentence ("Math, Bands, Edges and Facts are reviewed on their own."), badges, export and import all work through the `flash` field. The sash is already seven columns for General (14 decks: two full rows).

## Checks and docs

- pool-check: a flash card's `q`, when present, must name pool questions that exist.
- test/facts.test.js: 31 cards, unique fronts, every source exists; every number in each source's correct answer (commas removed) appears on the card's back; drill front has no prompt line for Facts and keeps "General privileges on" for Edges; study page renders with the sources; review-all sentence. Existing tests that match the review-all sentence are updated.
- CI screens gain `facts`; home changes, so a rebaseline follows.
- CHANGELOG, ARCHITECTURE (`q`, `prompt`), README; version 37.

## Red team

A fresh reviewer checked every card against the pool and the design against the code. What changed:

- Facts: "the lowest limit in the rules" for spread spectrum was false (2200 m and 630 m are lower); the beacon card repeated the Edges 10 m hook and overstated the rule, so it cites G1B10 alone; the VE-age hook now says what the pool says instead of a half-right reading of 97.509; the Yagi spacing moved to the front, where the question puts it; the RTTY "45 baud" clause, the SO-239 claim and the ladder-line wording were unsupported or confusable and were replaced with pool-backed lines (Type N to 10 GHz, bare open wire nearer 600 ohms); the FAA hook keeps the pool's "can be lower"; Region 1 names the Middle East; the flare, CME and diode hooks are tightened.
- Cards: the digital-segment and FT8 cards merged; the dipole card split from the monopole card so neither is a paragraph; Carson's rule is framed as recall with the inputs on the back; the three dB cards no longer restate one another; the S-unit and wire-and-fuse fronts say what is asked.
- Keys: a card's front was its record key, so rewording a card would have reset its progress. Cards may carry a short `k`, used for the record; Facts cards all do.
- The number test strips thousands commas on both sides (2,500 miles).
- Code: the front's group is labelled by the name alone when a deck has no prompt, and Edges gets `prompt` in data.js so its markup is unchanged; the source ids are a sibling line after the hook, outside the group's label; pool-check accepts `q` as a string or array, requires each id to be a pool question, and checks `prompt` and `k`; the two tests that matched the review-all sentence are updated; CI shoots `facts` and `facts/study`; the docs list Facts.

Accepted as is: cards that Math also derives (the dB ladder, the dipole lengths) are kept as recall, since knowing them beats working them under time.
