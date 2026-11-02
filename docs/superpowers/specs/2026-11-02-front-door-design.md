# The front door: the splash's pitch, the About page, page descriptions, a share image and a sitemap

Date: 2026-11-02. Kurt's request, from a review of what the site needs before strangers arrive: the front door undersells. The About page says the site was built for him and friends and sends people to HamStudy; the exam pages have no meta description or Open Graph image; there is no sitemap. The pitch that is true and distinctive is free, offline, no account, and spaced review. Say that on the landing page.

## Intent

Today a visitor reaches the site through a link from Kurt. Soon they will reach it from a search result, a Reddit thread or a text from a friend, and the first screen has to say what this is and why it is worth a tap. Nothing in the apps' screens changes; this is the splash, the About page, the pages' heads, one image, and one XML file.

## Goals, non-goals

- Goals: a splash that states the four facts; an About page that stands behind the site; a description and share preview on every page; a sitemap Google Search Console can be given.
- Non-goals: analytics, a privacy page beyond one sentence, a custom domain, SEO landing pages per section, changes to the app's screens, a new look. The pages keep the app's styles.
- Anti-goals: claims that are not true of the site (no "proven", no "the best"); any text that would have to change when the site moves hosts, beyond the absolute URLs listed under "Moving later".

## What gets built

### 1. The splash (index.html)

Head:

- `<title>Ham drills: Technician and General exam practice</title>` (48 characters; the title is what a search result shows).
- `<meta name="description">`: "Free drills for the ham radio Technician and General exams: every pool question, worded as on the exam, with spaced review and an explanation for each answer. No account; works offline." (under 190 characters; Google shows about 160, so the first clause carries the pitch).
- `<link rel="canonical" href="https://daseme.github.io/ham-drills/">`.
- Open Graph and Twitter: `og:type` website, `og:title` (the title), `og:description` (the description), `og:url` (the canonical), `og:image` `https://daseme.github.io/ham-drills/icons/og.png`, `og:image:width` 1200, `og:image:height` 630, `og:image:alt`, `twitter:card` summary_large_image. Open Graph images must be absolute URLs, so these tags, the canonical and `og:url` are the only places a page names its host.

Body, in order:

- `.over` "Amateur Radio Service" and `h1` "License exam drills", unchanged.
- `.sub`: "Every question in the Technician and General pools, worded exactly as on the exam, with a short note and a longer explanation for each answer. Choose your exam; it installs to your phone's home screen."
- A new `ul.why` of four items, each a bold lead and one plain sentence, in the app's muted body size:
  - **Free.** No ads, no upsell, no paid tier; the code is open under the MIT license.
  - **No account.** Progress stays on your phone and nowhere else; export a backup file whenever you like.
  - **Works offline.** Installed to the home screen, it runs with no signal.
  - **Spaced review.** A card comes back after one day, then three, then seven; three right answers on separate days master it.
- The two exam rows, unchanged.
- Under the rows, one line: "Not sure yet? <a href="technician/?demo">See it with three weeks of sample progress</a>." The demo is the fastest way for a stranger to see the home screen, a drill and a badge without committing to anything. The Technician app already offers the same link from a fresh home screen (General has no demo).
- The footer line, unchanged: Resources, About.

Styles: `.why` in the splash's own `<style>` block, as the splash already does for `a.row` and `.row .code`: a list with no bullets, `font-size:15px`, `color:var(--muted)`, items spaced 6px, the lead in `color:var(--ink);font-weight:700`. Nothing in app.css changes, so the apps' screenshots are untouched.

### 2. About (about.html)

The same page shell. Title "About Ham drills", description "Who built the drills and why, what they are and are not, and where to report a problem." Canonical and Open Graph as on the splash, with the About title and description and the same image.

Body, after the back link and the overline, `h1` "About this site", then paragraphs in the About style (`.about h2` headings in amber):

- Opening paragraph: "Built by KO6PRL to study for the exams with friends, and to try out some ideas about how a question pool is best learned: the exact wording, an explanation for every answer, and reviews spaced so a card comes back just before it would be forgotten. It worked for us, so it is here for anyone." (The "me and friends" origin is true and worth keeping; it is the framing that changes, from an apology to a provenance.)
- **What it is**: the full Technician and General pools, checked on every change against a snapshot of the NCVEC's published pool; a practice exam drawn the way the real one is; a score estimate; badges; the week's seven dots; everything on the phone, offline, with no account.
- **What it is not**: a course or a license manual. The primers cover each topic's basics, not the theory behind them. For practice exams under exam conditions and for finding a session, HamStudy.org is excellent.
- **Your data**: progress is stored on the phone and nowhere else. The site sets no cookies and runs no analytics. (True today; the sentence is one line to change if analytics is added.)
- **Problems and suggestions**: a wrong explanation, a typo, an idea: open an issue at https://github.com/daseme/ham-drills/issues. The code is MIT licensed; the pool text is the NCVEC's and public domain.

The splash test requires `KO6PRL` on the page and that every outward link is https with `rel="noopener"`; both hold. The GitHub link opens in a new tab like the HamStudy one.

### 2b. Resources (resources.html)

Only the head changes: a canonical (`https://daseme.github.io/ham-drills/resources.html`) and the Open Graph and Twitter tags, with its title, its existing description and the shared image.

### 3. The exam pages (technician/index.html, general/index.html)

Each head gains, after `<title>`:

- `<meta name="description">`. Technician: "Every question of the 2026-2030 Technician pool, worded as on the exam, with spaced review and an explanation for each answer. Free, no account, works offline." General: the same with "2023-2027 General". The years are the `poolYears` in each exam.js; a test keeps them in step.
- Canonical (`https://daseme.github.io/ham-drills/technician/`, `.../general/`), Open Graph and Twitter as on the splash, with the page's title and description and the shared image.

The pages are precached, so this is an app change: APP_VERSION rises. The screenshot baselines do not change, since nothing in the head draws.

### 4. The share image (icons/og.png)

One 1200 by 630 PNG, used by every page. Dark scheme (`#11171D`), the overline in amber Barlow Condensed, "License exam drills" large in Barlow Condensed 600, the four leads ("Free. No account. Works offline. Spaced review.") in Atkinson, and the address `daseme.github.io/ham-drills` in muted. No screenshot in it: screenshots date, and the facts do not.

It is drawn by `tools/og-image.mjs`, a dev-only script like tools/screens.mjs: it writes a one-off HTML page using the bundled fonts, opens it in headless Chrome at 1200 by 630 (device scale 1) over the Chrome DevTools Protocol, waits for `document.fonts.ready`, and saves the screenshot. The HTML lives in the script, not in the repo as a page, so nothing serves it. Run by hand when the wording changes; the PNG is committed. Not precached: only link previews fetch it.

Three details from the review: the font URLs are built with `pathToFileURL`, since a Windows path's backslashes are not a URL; after `fonts.ready` the script checks every `FontFace` has `status === "loaded"` and exits 1 otherwise, because `fonts.ready` resolves even when every font errored and the image would silently ship in a system face; and the body is fixed at 1200 by 630 with overflow hidden so the layout and the clip agree.

### 5. The sitemap (sitemap.xml)

At the repo root, listing the five pages with absolute URLs: the splash, `technician/`, `general/`, `about.html`, `resources.html`. No `lastmod` (it would churn with every release and Google ignores it unless it is accurate), no priorities. The old address and `forward/` are not listed. It is submitted to Google Search Console by hand; nothing on the site links to it. Search Console takes a sitemap only for a verified property, and a URL-prefix property for `https://daseme.github.io/ham-drills/` is verified either by a `google<token>.html` file at the repo root or a `<meta name="google-site-verification">` tag on index.html; the token comes from Kurt's Search Console account, so that step is his, after this ships. Either form is committed, since verification is rechecked; neither trips a test.

No robots.txt: GitHub Pages serves this repo under `daseme.github.io/ham-drills/`, and a robots.txt is only read at the origin root, which belongs to the `daseme.github.io` repository. A `Sitemap:` line there could point at this file, but that is another repo's change and is not needed; Search Console takes the sitemap URL directly.

### 6. Tests (test/splash.test.js, extended, or a new test/front.test.js if it grows past the splash's concerns)

- The splash names the four facts: the body matches /Free\./, /No account\./, /Works offline\./, /Spaced review\./.
- The splash links to the demo: `href="technician/?demo"`.
- Every page (splash, about, resources, each exam page) has one `<meta name="description">` of 50 to 200 characters, a canonical whose path matches the page, `og:title`, `og:description`, `og:image` and `twitter:card`; `og:description` equals the description.
- `og:image` on every page is the same URL, its path resolves to a file in the repo, and that file is a PNG whose IHDR says 1200 by 630 (bytes 16 to 23 of the file).
- Each exam page's description contains that exam's `poolYears` from exam.js and its `shortName`.
- sitemap.xml: every `<loc>` is under `https://daseme.github.io/ham-drills/` and maps to a file that exists (`/` and `x/` to index.html); the five pages are all listed; nothing under `forward/`.
- about.html links to the GitHub issues page.

The existing splash tests ("every file the splash loads exists") read `src` and `href` values with no colon, so absolute Open Graph URLs are ignored by them, as intended.

### 7. Docs and release

- APP_VERSION 47; CHANGELOG entry under 47.
- ARCHITECTURE's file table: index.html and about.html rows updated; rows for sitemap.xml, icons/og.png and tools/og-image.mjs.
- README: nothing (the links and the demo are already there).

## Moving later

The absolute URLs are only in: each page's canonical and `og:url`, every page's `og:image`, and the sitemap. A move to a custom domain is a search-and-replace of `https://daseme.github.io/ham-drills/` across the five HTML files and sitemap.xml, plus a new robots.txt at the new origin's root. The test that checks the canonical path against the page keeps the paths honest through that move.

## After shipping

Version 48, the same day: Kurt kept two of the four facts, No account and Works offline, and moved them to the footer above the Resources and About links; Free and Spaced review are off the page. The share image still shows all four.

## Red team

A fresh reviewer read the design against the repo before anything was built. What it changed:

- resources.html was in the tests but not in the build: section 2b adds its canonical and Open Graph tags.
- The About page's claim that the pools are "kept identical to the NCVEC's own files by a check that runs on every change" overstated it: CI checks against the committed snapshot, and only the manual pool-fetch notices an errata. Reworded to "checked on every change against a snapshot of the NCVEC's published pool".
- "licence" was the only British spelling in the repo; "many people use both" was a claim about people, not the site; "a week strip" is not a term the site uses. All three reworded.
- "The apps already offer the demo link" was true only of Technician; General has no demo.
- The image script: `fonts.ready` resolves even when every font failed, so the script now checks each face's status; font URLs go through `pathToFileURL`; the body is fixed to the clip's size.
- Search Console needs a verified property before it takes a sitemap; the verification step is Kurt's and is written down.

Checked and found fine, so not worth rechecking: the PNG IHDR offsets; the splash and paths tests' regexes against the new markup (absolute URLs and `content=` attributes are skipped; `technician/?demo` has no extension so the file-exists test skips it); the demo link's safety (demo mode is decided from the query alone, seeds under its own namespace, and the manifest's start_url is the real app); the Open Graph tag set; robots.txt being read only at the origin root; every factual sentence in the new text against README, ARCHITECTURE, app.js and LICENSE; the exam pages needing only the version bump, with no baseline change.
