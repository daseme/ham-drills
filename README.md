# Technician drills

A single offline web app holding all 12 Technician drills: T1 through T0, electronics math, and schematic symbols. Every question has a prewritten "Explain this more" panel, so the app makes no network calls once installed.

## What's in the folder

| File | Purpose |
|---|---|
| index.html | The app |
| data.js | All 409 pool questions, primers, formulas, symbols and explanations |
| seed.js | Your progress as of October 18, 2026, loaded on first launch |
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

## Progress

Progress is stored on the phone. The seed in seed.js loads only on first launch. After that, use the app rather than the old Claude artifacts, since the two don't sync.

Export progress on the home screen produces a JSON backup. Import progress merges a backup into the phone, keeping the newer record for each card. Use it before clearing browser data or moving to a new phone.

## Badges

Each section carries a badge: a radio tower with one, two or three signal arcs. Bronze means every card in the section has been seen, silver that every card has been answered correctly at least once, and gold that every card is mastered. A rung, once earned, stays, along with the day it was earned, but the badge dims while the section's current standing is below its best rung. Badges travel with Export and Import.

## Updating

After changing any file, raise the VERSION string at the top of sw.js (for example, hamdrill-v2). Phones pick up the new copy the next time the app opens online.
