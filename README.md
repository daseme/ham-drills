# Technician drills

A single offline web app holding all 12 Technician drills: T1 through T0, electronics math, and schematic symbols. Every question has a prewritten "Explain this more" panel, so the app makes no network calls once installed.

The live copy is at https://daseme.github.io/ham-technicians-drills/.

## What's in the folder

| File | Purpose |
|---|---|
| index.html | The app |
| data.js | All 409 pool questions, primers, formulas, symbols and explanations |
| sw.js | Service worker; caches everything for offline use |
| manifest.webmanifest, icons/ | Home-screen install |
| fonts/ | Bundled typefaces, so nothing loads from Google |

## Hosting

Android will only install a web app served over HTTPS. Upload the folder's contents, not the folder itself, to any static host. Two simple routes:

**GitHub Pages.** Create a repository, upload these files to its root, then open Settings > Pages and publish from the main branch. The site appears at https://<username>.github.io/<repo>/.

**Your own server.** Any web server with a valid certificate works. Serve the files as static content; no server-side code is involved.

To try it on a Windows PC first, open a terminal in this folder and run `python -m http.server 8000`, then browse to http://localhost:8000. Service workers are allowed on localhost without HTTPS.

## Installing on Android

1. Open the hosted address in Chrome.
2. Tap the three-dot menu, then Add to Home screen (or Install app).
3. Launch it from the new icon. It opens full screen and works with no signal.

On an iPhone, open the address in Safari, tap Share, then Add to Home Screen. Use the home-screen icon rather than a bookmark: Safari clears saved data for ordinary websites after a week without a visit, and that would wipe progress.

## Progress

Progress is stored on the phone and nowhere else. The app asks the browser to keep its storage through cleanups, but Export progress is the only real backup.

Export progress on the home screen produces a JSON backup. Import progress merges a backup into the phone, keeping the newer record for each card. Use it before clearing browser data or moving to a new phone.

## Screens

Home: title, the count of cards due today, a short plan card (estimated score and exam date, both optional), the review button, the section list, the badge sash, and a one-line footer with Export, Import, Study guide, About and the version. The explanatory text lives on the About page at #about. On the drill screen the group chips stay visible; shuffle, Basics first and Due today sit behind an Options line that reports the current settings. The question text leads the card; the pool ID is a small label beside the topic.

## Exam date and estimate

Both optional. The home screen shows an estimated exam score as a range: each section's exam count weighted by how far along its cards are (mastered near full credit, answered-right-once partial, unseen a guess). Hide it with the link beside it. Set an exam date and intervals are capped so nothing is scheduled past the exam; inside the last week every card comes back at least once more. The date block links to the HamStudy and ARRL session finders and to the FCC page on getting an FRN, which first-time applicants need before test day. The date travels with Export and Import.

## Study pages

Every section has a study page with its basics in pool order, each primer naming the questions it covers and offering to drill just those. Open one from the section's drill screen, or from the home screen for a section not yet started. The whole guide at #study is one page built for printing. The primers are the same text that Basics first shows before each group of questions and that the explanation panel draws on; they live once, in data.js.

## Badges

Each section carries a badge: a radio tower with one, two or three signal arcs. Bronze means every card in the section has been seen, silver that every card has been answered correctly at least once, and gold that every card is mastered. A rung, once earned, stays, along with the day it was earned, but the badge dims while the section's current standing is below its best rung. Badges travel with Export and Import.

## Testing yourself

This app teaches the pool. For practice exams under exam conditions, use HamStudy.org; the footer links to it.

## Updating

After changing any file, raise APP_VERSION in version.js (for example, from "11" to "12"); the footer and the service-worker cache key both read it. Phones fetch the new copy the next time the app opens online and switch to it at the next safe moment: right away if the home screen is showing, otherwise on the next return home or when the app goes to the background. A short notice names the new version. The footer shows the version a phone is running.

Files in private/ are ignored by git; keep personal progress exports there.
