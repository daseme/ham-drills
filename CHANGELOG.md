# Changelog

The version is `APP_VERSION` in version.js; it shows in the footer, and raising it is what makes installed copies update. All dates are 2026.

## 71 (November 27)
- The streak line under the week's dots now says whether this week is counted: "3 weeks in a row before this week." while the week is still open, and "4 weeks in a row including this week." once it is made.

## 70 (November 25)
- The plain-language limits now cover every piece of learner-facing text, not only the explanations: each question's short note, the topic primers, the flash cards, the symbols, the math steps and mistake notes, deck intros and the cheat sheets. 55 long sentences were split, most of them in the primers. The figure G7-1 parts, the amplifier classes and the Q signals are now lists. The band chart's notes are three short paragraphs.
- test/plain-language.test.js checks all of it. test/fixtures/bandchart.svg now ends at the drawing, so it guards the chart and not the notes under it.

## 69 (November 25)
- Every explanation, in both exams, now keeps to plain-language limits taken from ASD-STE100 Simplified Technical English and applied under ISO 24495-1: no sentence over 25 words, no paragraph over 6 sentences. 102 long sentences were split, and 33 passive sentences were recast in the active voice where that names who does what. The meaning of each is unchanged. test/plain-language.test.js keeps it that way.

## 68 (November 25)
- Nine G3 and G6 explanations rewritten with a picture or worked numbers: the long-path echo timed by the speed of light (G3B01), the MUF and LUF as a window's two edges, with frequencies, and what happens when it closes (G3B05, G3B11), hop distance as a flashlight on a ceiling (G3B09), the critical frequency and angle as skipping a stone (G3C02, G3C04), a battery's internal resistance with a 20 A example (G6A02), an inductor's self-resonance (G6A11), and why a switching transistor lives at saturation and cutoff (G6A07).

## 67 (November 25)
- Ten G9 and G5 explanations rewritten with a picture or worked numbers: why a tuner leaves the line's SWR alone (G9A08), how a lossy line makes a 3:1 SWR read 1.7:1 (G9A11), the ground as a mirror under a low dipole (G9B05), dBi and dBd as two yardsticks (G9C04), how traps make one wire work two bands (G9D04), why a multiband antenna radiates harmonics (G9D11), series and parallel resonance as a short and an open (G5A01), RMS as the voltage that heats like DC (G5B07), why a step-up transformer's primary is thicker (G5C05), and why the turns ratio is the square root of the impedance ratio (G5C07).

## 66 (November 25)
- Ten Technician explanations rewritten to show why: inductance as a flywheel for current (T5C03), impedance and why reactance depends on frequency (T5C12), a tuned circuit as a pendulum (T6D11), SWR as a wave on a rope (T7C04, T9B12), how a 5/8-wave whip puts its signal toward the horizon (T9A09), why coax loses more at higher frequencies, with numbers (T9B05), why a rubber duck is inefficient (T9A04), a temperature inversion as a duct (T3C08), and why the radio horizon is farther than the visual one (T3C11).

## 65 (November 25)
- Twenty more explanations rewritten to show why, ten each in G7 and G4, with a picture or worked numbers. G7: why switchmode parts are small (G7A08), neutralizing as microphone feedback (G7B01), why Class C is efficient (G7B02), an oscillator as a PA squeal with a filter (G7B07), why Class C suits FM (G7B11), the balanced modulator and product detector with frequencies (G7C02, G7C04), a DDS as a crystal-timed counter (G7C05), I and Q as a clock hand's two shadows (G7C09, G7C10). G4: reverse sideband as a window (G4A02), the plate-current dip and the LOAD control (G4A04, G4A08), what a tuner can and can't change (G4A06), meter loading with numbers (G4B05), why the two tones aren't harmonics (G4B07), ground leads as antennas and quarter-wave transformers (G4C05, G4C06), common-mode current and the ferrite choke (G4C08), why a short antenna is narrow (G4E06).

## 64 (November 25)
- Ten G8 explanations rewritten to show why, not only what, each with a picture or worked numbers: phase modulation as a metronome nudged early or late (G8A02); where a reactance modulator sits deciding PM or FM (G8A04); the three reasons behind QPSK31 (G8A06); QPSK's phases as a clock hand (G8A12); link budget and margin as a bank balance in decibels, with numbers (G8A13, G8A14); where odd- and even-order products land, with frequencies (G8B05); why faster symbols need more bandwidth (G8B10); forward error correction as phonetics on a noisy band (G8C10); what an FT8 report of +3 measures (G8C15).

## 63 (November 25)
- G8B02 (image response) explains the image from the ground up: the local oscillator as a mirror, a worked example with real frequencies (14.2 MHz wanted, 9 MHz IF, the image at 32.2 MHz), why that is two IFs away, and how a filter before the mixer and a higher IF deal with it. Its short note gives the mirror picture.

## 62 (November 25)
- The box for a question that keeps being missed now shows only for a real struggle: three misses or more, on at least half the tries, so a card missed often long ago but answered right since stays quiet. It shows once per card in a drill, not on every later miss, and reads "Missed 4 of 6 tries".
- With it, the explanation and the topic's Basics open by themselves, instead of waiting behind Explain this more.
- A memory hook can be written there and saved for the question. It shows after the question each time it is answered, with Edit, whether met in its section or in Math. Hooks travel in Export progress; an import adds the backup's hooks for questions with none, and keeps any written on this device.

## 61 (November 25)
- From the third miss of a question on, the feedback suggests coming at it another way: say in your own words why the right answer is right and the picked one is not, make a memory hook, or drill the questions of the topic it belongs to, with a link to that topic's drill.

## 60 (November 25)
- Every math question, in both exams, now shows its working the way the Ohm's law drill does: each step said in words, then the formula with the numbers in it, with unit conversions as steps of their own and, where there are two routes, the short way and the long way. After a miss the steps are open; after a right answer they wait behind Show the work.
- A wrong option that a common mistake produces is named when picked: the current where the power was asked, a ratio upside down, series added where parallel was meant, peak-to-peak taken for peak, a decibel read as the ratio itself, and so on. Options no single slip explains get no note.
- The formula box now shows wherever a math question comes up, in its pool section (G5, T5 and the rest) as well as the Math deck; before, a G5 drill showed only the one-line note.

## 59 (November 25)
- The Ohm's law and power drill names the likely mistake behind a wrong answer when it matches one: multiplying where it should divide, a division upside down, a forgotten square or a doubled one, or the voltage or current given where the power was asked.
- A missed kind of problem comes back as the third question after the miss, with new numbers and a line saying so; answering it right says "Fixed it."

## 58 (November 25)
- General gains an Ohm's law and power drill, a page of its own beside the app (general/ohms-law-drill.html): endless generated problems in Ohm's law, power, and milliamps and kilohms, each with a worked solution, a note when the digits are right but the decimal point is off, and more of the kinds of problem you miss. The Electronics math deck's drill and study page link to it. It is cached for offline use with the rest of General, and keeps its own tallies on the phone, apart from the review records.

## 57 (November 5)
- Once today's reviews are done, home's headline reads what comes back tomorrow, "23 will be back tomorrow", with "That's all for today." on the line under it, instead of a zero due today. That is the number the icon badge already shows at that point. With nothing due tomorrow either, the zero stays.

## 56 (November 5)
- A tap on any toast dismisses it early. Taps no longer pass through it to what sits underneath, so a tap meant for a button under the toast closes the toast instead, and the next tap lands.

## 55 (November 5)
- The badge toast (Bronze, Silver, Gold) stays eight seconds instead of about three, long enough to read and take a screenshot. Other toasts are unchanged.

## 54 (November 4)
- The splash's HamTube link now points at hamtube.org, the catalog's own domain.

## 53 (November 3)
- Each app's home footer link to the splash reads Ham drills, the site's name, rather than Home, which is also what the app calls its own first screen. About and Resources keep Home.

## 52 (November 2)
- The splash's footer links to HamTube, the amateur radio video catalog at daseme.github.io/hamtube. The links back to the splash, from About, Resources and each app's home footer, now read Home instead of All exams.

## 51 (November 2)
- Resources gains a FEMA courses section: how to get a FEMA Student ID, and the four independent study courses the ARRL's ARES task book requires (IS-100, IS-200, IS-700, IS-800), each with a line on what it covers. The page's intro and description, and the splash's footer line, name it.

## 50 (November 2)
- A miss of a card answered right before now alternates between "Good God, Lemon!" and "Difficult difficult, lemon difficult.", taking turns through the visit; the symbol drill too. A miss of a card never yet answered right still says "Not quite."

## 49 (November 2)
- The splash's No account line reads "Stays on your phone and nowhere else".

## 48 (November 2)
- The splash keeps two of version 47's four facts, No account and Works offline, and moves them to the footer; Free and Spaced review are gone from the page. The share image is unchanged.

## 47 (November 2)
- The front door, for visitors who arrive from a search or a shared link. The splash states what the drills are: free, no account, works offline, spaced review; and offers the Technician demo to anyone not sure yet. The About page says who built the site and why, what it is and is not, that nothing leaves the phone, and where to report a problem. Every page has a description, a canonical address and a share image (icons/og.png, drawn by tools/og-image.mjs), so a link pasted into a chat shows a card; sitemap.xml lists the five pages for Google Search Console. Nothing in the apps' screens changes. The design is in docs/superpowers/specs/2026-11-02-front-door-design.md.

## 46 (November 2)
- On a first visit, a card answered before the explanations arrive now gets its explanation, and its "Explain this more" button, the moment they land, instead of waiting for the next card.
- The repository's text files are LF in the working tree on every platform (.gitattributes); nothing in the app changes.

## 45 (November 2)
- A first visit settles sooner. The explanations behind "Explain this more" now live in explain.js and load after the first screen, a third less to download before home; the four fonts are asked for with the page, so home paints in its own typefaces instead of swapping them in afterwards; and the scripts no longer pause the page's parse. The service worker's first precache waits for the explanations. On a slow link, home paints a quarter second later than before but is finished a third of a second sooner; on a fast one the difference is a few tens of milliseconds. Repeat visits and installed copies are unchanged.
- On a first visit, a card answered in the moment before the explanations arrive shows no "Explain this more" until the next card; the Basics panel stays behind the button whenever its topic has one.
- tools/data-format.js formats data.js and explain.js separately, and CI checks all four files.

## 44 (November 1)
- Fixes a blank screen on the first open after version 43 in browsers with the Badging API (Chrome, Edge, Safari) when a stored record needed tidying on load: the day log's rebuild now runs just before the first screen, after everything it touches exists.
- A rebuilt day, from before the log or from a backup without one, takes what was answered as its floor, so a steady learner's recent days keep their credit instead of showing as days off.
- A demo sample seeded before version 43 is seeded again, so it has the day log.
- A day log entry dated after today, from a damaged backup, is dropped on load.
- The README's workflow badge points at this repository.

## 43 (November 1)
- Home shows the week: seven dots, Monday to Sunday, under a goal of 7 days with 2 days off in reserve, so 5 studied days make the week. A day counts at 10 questions in any section, or everything due when fewer are due, or a practice exam; a missed day spends a day off on its own; weeks made in a row are counted. The session that fills today's dot says "Today's in." on its end screen. Nothing is shown until the first answers, no line ever names a lost week, and a learner coming back after a gap is told the cards waited. The design and the research behind it are in docs/superpowers/specs/2026-11-01-study-week-design.md.
- The day log travels with export and import; a backup from before it rebuilds the last two weeks from the records. The demo's sample shows the week.
- How it works explains the week.

## 42 (October 30)
- The in-app About is now How it works, on the home footer and as the page heading, since the splash has an About of its own: who built the site and why. Its credits line names KO6PRL.
- Resources gains a Licensing section: getting an FCC Registration Number, the FCC license search, and QRZ. And an Exam sessions section: the W5YI VEC and the HamStudy session finder.

## 41 (October 30)
- A Resources page off the splash: the ARRL, the San Francisco, East Bay, San Mateo and Millbrae radio clubs, and the SF NERT, Berkeley CERT and Central County Fire CERT volunteer programs. Each app's home footer gains All exams, back to the splash.
- An About page off the splash, one paragraph on why the site exists. The splash and its pages are not cached, so neither it nor the Resources page's later wording fixes needed a new version.

## 40 (October 30)
- The drill counters say what they count. The session line reads "46 due today, 4 still to get right, 0 of 52 mastered" (the 46 is what was due when the session began, and a miss stays in the 4 until it is got right); the position reads "Question 49 of 52, including 6 repeats" once a miss has come back; the score reads "37 of 43 questions right on the first try", and counts each question once. A repeat is marked Repeat on the card, for screen readers too. Start over is hidden when nothing is left due. Same in the flash-card and symbol drills.

## 39 (October 29)
- The Band edges cards carry the power limit on the range side: "1.8 to 2.0 MHz, 1500 W PEP", 200 W on 30 meters, 100 W ERP on 60. The reverse card still asks the bare range.

## 38 (October 29)
- Band edges is now the pairing, asked both ways: "Frequency range of 160 m" and "Which band is 1.8 to 2.0 MHz", 22 cards for the ten HF bands and 6 meters, each direction with its own record, and a pair never side by side in the shuffle. The hook on each is the arithmetic (300 divided by the MHz is the meters) and the band's one defining fact. The General segments stay on the Bands chart. The old cards' badge is dropped, since it was earned on other cards.

## 37 (October 29)
- The official pools are committed as snapshots of the NCVEC files and every push compares every question with them; `node tools/pool-fetch.js` downloads the pools again and fails if the NCVEC has published anything new.
- General gains Numbers to know: 31 flash cards for the numbers the pool asks for once each and nothing ties together, from the FAA height limit to the RTTY shift. Each card names the questions it comes from, and a test holds every number on a card to the pool's own answer.

## 36 (October 29)
- General gains Band edges: ten flash cards, one per HF band, front the band and back its General segments with that band's bar from the chart and a hook. Flip, then grade yourself; the cards are scheduled and badged like everything else, with their own records. The Bands chart primer links to them.
- Holding a key no longer answers twice: key repeats are ignored in the drills.

## 35 (October 27)
- General gains a Bands and privileges deck: the 32 pool questions on frequencies, modes, sidebands and power limits, under five primers, with a General band chart drawn from Part 97 as its cheat sheet. It does for General what the Symbols deck does for Technician: the near-miss numbers in one place. Questions stay in their sections too; the deck keeps its own review records.

## 34 (October 27)
- A practice exam: 35 questions drawn one per group as the real exam draws them, on one scrolling page with the current question popped out and the rest faded, nothing marked until Finish. The result shows the score against the pass mark, the time, what the estimate had said, a row per section and every miss with the answer given, and offers the misses as a drill. The last result shows on home. A reload mid-exam comes back to the same exam.
- Hardest for you: home offers a drill of the questions missed more than once and not mastered since, hardest first, each card saying how often.
- In a section drill, each group's chip counts the questions missed at their last answer.
- Installed on an iPhone or a desktop, the app icon shows how many questions are due, or how many come due tomorrow once today's are done. iPhones ask once for permission; Android has no icon badges.
- Backups are checked record by record on import, and stored records on first read: a damaged record or an unknown question is dropped and the import says how many. Backups now carry practice exam results.
- data.js is one question per line, so a content fix shows as the lines it touched; tools/data-format.js keeps the layout and CI checks it.
- CI shoots every screen in Chrome and compares it with committed baselines; the screenshot tool's clock stands still.

## 33 (October 24)
- The estimated score waits until a tenth of the pool has been seen, instead of greeting a newcomer with a failing guess.
- On a keyboard, 1 to 4 or A to D picks an answer; Enter goes on.
- Screen readers hear the question as the answers' label and the verdict once, rather than the whole card again at every step.
- The exam-date box is shorter: Find a session sits on the exam line, the FRN reminder on one line.
- A finished section reads "All 68 mastered."
- A reset left untapped for five seconds disarms.
- Technician's home-screen name is "Tech drills", so it can't be confused with General.

## 32 (October 24)
- Technician notes, explanations and basics reviewed section by section for accuracy and clarity, the way General's were: 34 errors fixed (mostly rules details, such as which call-sign groups each class may hold, the model-craft ID exemption and the CW-only bottom of 6 and 2 meters), about 75 explanations made clearer for newcomers, and the symbol drill corrected on figure T-1's part 5 (a ground, not a connector). Every fix was re-checked.

## 31 (October 22)
- Each app's offline copy now answers only from its own cache. Someone who used both exams could be served the other app's older shared code.
- The old Technician address keeps working offline: its worker stays installed and forwards to the new address without a signal.
- General's review-all screen no longer mentions a Symbols section it doesn't have.

## 30 (October 22)
- General drills complete: G7 to G0 and an Electronics math section with worked solutions, so all 423 questions of the 2023-2027 pool, each section independently reviewed. Figure G7-1 is redrawn in the app. The estimate now shows on General's home screen.

## 29 (October 22)
- General drills, first six sections: G1 to G6 (272 questions), each with notes, explanations and topic basics, checked against the 2023-2027 pool (6th errata) and current Part 97, and independently reviewed. The splash page links to General.
- An exam without a demo no longer offers one in its footer.

## 28 (October 22)
- The General app's frame in general/: its own storage (`hamgeneral:`), backups and offline copy. While its sections are still being written, home lists the finished ones and holds back the estimate.
- A backup from one exam's drills is refused by the other's.
- tools/pool-import.js turns a pool section into a data skeleton; tools/pool-check.js checks either exam, skips withdrawn questions, and reports unwritten sections as not yet added.

## 27 (October 22)
- A splash page at the repo root (/ham-drills/) linking to each exam's drills.

## 26 (October 22)
- The app is split into shared code (app/) and a folder per exam; Technician now lives in technician/. Its own service-worker cache name, `hamdrills-technician-v`. No visible change.

## 25 (October 22)
- Exam settings moved into exam.js: names, pool years, question count and pass mark, figures, the demo plan. No visible change; this prepares for General.

## 24 (October 21)
- Shorter home-screen wording: "339 of 409 seen", "26 passes. Most to gain", "Have your FRN?", "Set your exam date to time reviews to it", "New to T2? Read its basics first." The Math and Symbols due sentence is gone; their rows show their own counts.

## 23 (October 21)
- The service worker clears only its own old caches. Every site on daseme.github.io shares one origin, and it was deleting every cache there.

## 22 (October 21)
- 29 Node tests (scheduler, exam cap, estimate, badges, demo, question data) and a GitHub check that runs them with the pool check on every push.
- The low estimate rounds 31.5 up; adding up by section had made it 31.4999 and shown 31.

## 21 (October 21)
- Fewer options. Questions and answers are always shuffled (answers keep their order when one reads "All these choices are correct"). Basics first is automatic: reviews come first, then new questions grouped by topic, each topic's basics shown before its first new question. Due today is the one setting left.

## 20 (October 21)
- tools/pool-check.js checks data.js against the NCVEC pool .docx. All 409 questions match the February 19, 2026 errata release.
- Five T5 options showed "I2" where the pool prints I² (T5C08, T5D01, T5D02).

## 19 (October 21)
- Demo mode: `?demo` opens the app as a sample learner three weeks in, under its own storage, with a banner to exit or reset. An empty app offers it in the footer. A sample export can't be imported as real progress.

## 18 (October 21)
- With an exam date set, the app asks whether you have your FRN, and keeps the link to the FCC's page until you say yes.
- A perfect first-try section plays a full-screen overlay: the score, then "Wouldn't that be just like you?"

## 17 (October 21)
- "Good God, Lemon!" in place of "Not quite." on a miss of a card answered right before.

## 16 (October 21)
- The phone's Back button retraces in-app moves.
- Exam date: Change opens the picker filled in; typed partial years are ignored.
- New versions load by themselves at the next safe moment, with a short notice.
- The home headline counts pool questions; first-run and nothing-due screens offer the next section.
- Export falls back to a download and says where the file went; Import accepts any file type.

## 15 (October 21)
- A perfect first-try section ends with "Wouldn't that be just like you?" instead of the pass mark.
- Back links render home directly, fixing a screen that could stick after a section.

## 14 (October 20)
- Pool figures T-1, T-2 and T-3 redrawn as inline SVG; questions show their figure above the text.

## 13 (October 20)
- Precaching bypasses the HTTP cache, so a phone can't get stuck on an old build.

## 12 (October 20)
- One version number, in version.js, read by both the footer and the service worker.

## 10 (October 20)
- Badge artwork: steel-blue silver, signal waves from the antenna tip, a muted bronze. The footer had stayed at 7 through these releases (8 and 9 went out under the cache name only); it caught up at 10.

## 7 (October 18)
- One headline figure on home; About page; drill settings behind an Options line; the question leads the card.

## 6 (October 18)
- Optional exam date: intervals capped so nothing is scheduled past it, tighter in the last week.
- Estimated score as a low-to-high range, with the two sections offering the most to gain.

## 5 (October 18)
- Taps pass through the badge toast; home buttons render directly.

## 4 (October 18)
- Study pages: each section's basics, a printable whole guide, and drilling by primer.

## 3 (October 18)
- Ready for other people: no preloaded personal progress, persistent storage, answers shuffled, version in the footer, screen-reader text, MIT license.
- Formal license title on home.

## 2 (October 18)
- Section badges: bronze when every card is seen, silver when every card has been answered right, gold when every card is mastered.

## 1 (October 18)
- The app: all 409 Technician pool questions in twelve sections, spaced review, explanations, electronics math and schematic symbols, offline.
