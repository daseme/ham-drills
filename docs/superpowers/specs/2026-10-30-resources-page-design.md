# Resources page and a way back to the splash

Date: 2026-10-30. Kurt's request: a link from the Technician and General apps back to the "main" page (the splash at /ham-drills/), and on the splash a new link to a Resources page listing the ARRL, the San Francisco, Berkeley and Burlingame radio clubs (if there is one), and SF NERT and the Berkeley and Burlingame equivalents.

## Intent

Someone drilling for the exam is about to become a ham. The splash should point them at the national association, a local club, and the local emergency-response volunteer program, since those are where a new license gets used. The apps themselves live in their own folders and today have no way back to the splash.

## What gets built

### 1. Back to the splash from each app

The home screen's footer line (`.foot .links` in `home()`, app/app.js) gains an `<a href="../">All exams</a>` link, first among the links after the Export and Import buttons, before Study guide and About. Relative, so it works at daseme.github.io/ham-drills/technician/ and from any other host. Not added to About, whose back button already returns home.

Known and accepted: in an installed copy (standalone display), following a link out of the manifest's scope opens a browser view rather than the app. That is the right behaviour: the splash is not part of the installed app.

### 2. resources.html at the repo root

A static page like the splash: no script, no storage, no service worker, not precached by either app, so it needs a connection. It loads app/app.css and uses the about-page styles (`.over`, `h1`, `.about h2`, `.about p`) plus a few lines of its own in a `<style>` block, as the splash does.

Content, each entry a link in a sentence or short line saying what it is:

- **National**: ARRL, The National Association for Amateur Radio, https://www.arrl.org/ . Also the ARRL exam-session finder, https://www.arrl.org/find-an-amateur-radio-license-exam-session (already linked from About).
- **Clubs**
  - San Francisco Radio Club, https://www.sfarc.org/ (founded 1909; the city's club).
  - East Bay Amateur Radio Club, W6CUS, https://www.ebarc.org/ (serves Berkeley and the rest of the East Bay; meets in Kensington and on Zoom). Berkeley has no city club of its own; the UC Berkeley club, W6BB, is a student club whose site does not resolve.
  - San Mateo Radio Club, W6UQ, https://www.w6uq.org/ (the Peninsula club nearest Burlingame; it has run hands-on sessions for new hams at the Burlingame library).
  - Millbrae Amateur Radio Club, https://www.millbraearc.org/ (next door to Burlingame; holds exam sessions before its monthly meeting).
  - A line saying Burlingame has no club of its own, so the two nearest are listed, and pointing at the ARRL club search, https://www.arrl.org/find-a-club .
- **Emergency response volunteers**
  - SF NERT, Neighborhood Emergency Response Team, San Francisco Fire Department, https://sf-fire.org/nert .
  - Berkeley CERT, Community Emergency Response Team, City of Berkeley, https://berkeleyca.gov/CERT .
  - Central County Fire CERT, for Burlingame, Hillsborough and Millbrae, https://ccfd.specialdistrict.org/cert .

Every external link opens in a new tab (`target="_blank" rel="noopener"`). A back link at the top, `<a class="back" href="./">&larr; All exams</a>`, returns to the splash.

### 3. The splash links to it

index.html gains a footer line under the exam list: `<div class="foot"><p class="links"><a href="resources.html">Resources</a></p></div>`, with a short descriptor: "Resources: the ARRL, Bay Area clubs, NERT and CERT."

### 4. Tests

test/splash.test.js gains: the splash links to resources.html; resources.html exists, links back to the splash, uses no storage or worker, every external link is https and has `rel="noopener"`, and every relative file it loads exists.

### 5. Release

APP_VERSION 40 to 41 (app.js changed). CHANGELOG entry 41. The Technician and General home screenshots change, so the check workflow is run by hand with rebaseline on after the push.

## Not doing

- No offline copy of the resources page; it is a page of outward links.
- No per-exam resources (the clubs are the same for both).
- No link to the UC Berkeley club until it has a working site.

## Red team

Kurt asked for the build and the push before the fresh reviewer reported. Its findings, and what they changed, follow in a later commit.
