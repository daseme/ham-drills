# Changelog

The version is `APP_VERSION` in version.js; it shows in the footer, and raising it is what makes installed copies update. All dates are 2026.

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
