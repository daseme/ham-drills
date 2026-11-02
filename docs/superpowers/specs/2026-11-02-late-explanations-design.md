# Version 46: the explanation arrives on the card that was waiting for it; LF everywhere

Two small follow-ups to version 45. A third candidate, the icon fetched twice on load, turned out to be nothing: Chrome coalesces the second request with the first and it transfers zero bytes.

## 1. A card answered before explain.js lands gets its explanation when it does

Version 45 accepted that, on a first visit, a card answered before the explanations arrive shows no "Explain this more" (or only Basics) until the next card. Now the card fills in.

- `afterQ`, a top-level `let`: the answered card on screen as `{id, ex, more}` (its question id, whether its explanation is in the box, whether the button exists), set at the end of `pick()`, cleared to `null` at the top of the drill's `render()` and of `route()`.
- `toggleExplain`, a named top-level function, is what the button's `onclick` was inline: it is needed from two places now.
- `fillExplain()`: if `afterQ` is set, its explanation is not in the box, `window.EXPLAIN` has one for its id, and `#exbox` exists in the page, then the paragraphs go in at the top of `#exbox` and, if the card had no button, one is inserted after `#next` with `toggleExplain` as its handler. Each step sets its flag so it runs once per card.
- `loadExplain`'s `onload` calls `fillExplain()` when `window.EXPLAIN` arrived.
- The flash, symbol and exam screens never set `afterQ`, so they are untouched. Leaving a drill for home nulls it through `route()`; a stale value would in any case find no `#exbox` in the page.
- Tests, in test/explain.test.js: a card answered with the explanations absent has no paragraphs; after `window.EXPLAIN` is set and the tag's `onload` fires, `afterQ` reports the explanation and the button present; a second `onload` changes nothing; after "Next question", `afterQ` is null again, and a late arrival with no card showing does nothing. The harness's stub elements make `insertAdjacentHTML` a no-op, so the markup itself is checked in headless Chrome against the served app, as version 45's was.
- Changelog, version 46.

## 2. LF in the working tree

Every file is LF in the index and, on this Windows checkout with `core.autocrlf=true`, CRLF in the working tree; every scripted edit has had to allow for both. A `.gitattributes` of `* text=auto eol=lf` makes the working tree LF too, on any platform, and leaves binaries alone (`text=auto` detects them). After it is committed, the working tree is re-checked out once so existing files follow it. No file's content changes in the index. tools/data-format.js keeps stripping `\r\n` before judging a layout, since an editor can still save CRLF; its comment says so.

## Red team

A fresh reviewer read the design against the code before anything was built. What it found, and what changed:

1. "All sections" reaches home without the router when there is no pushed history state (the hash was typed, or came from a link), since `goHome` then calls `home()` directly. `home()` nulls `afterQ` as well; the `#exbox` check stays as the browser-side guard.
2. `git reset --hard` rewrites nothing git considers clean, and under `eol=lf` the CRLF working files still count as clean against the LF index, so the re-checkout is `git rm -r --cached . && git reset --hard`. Two test files were mixed-ending and normalise with the rest.
3. The inline handler used `this`, which a bare call would break under strict mode. `toggleExplain` finds its button by id.
4. Two `pick()` calls cannot happen without a `render()` between (the answer buttons are disabled, and the key shortcuts check for that), so a stale `afterQ` never meets another card's box. The gate for inserting the button is the flag, not a DOM lookup: the harness's `$()` always returns a stub, so a DOM gate would be untestable.
5. The existing test fires `onload` with no EXPLAIN while a card is answered; `fillExplain` runs only in the branch that has it. A card with a Basics primer already has the button, so the test asserts the explanation's arrival and accepts the button either way. A tag re-created after a failed fetch fills the card answered at that time, a bonus.
6. Placement after `#next` is where the static markup puts the button, as the second flex child. Focus and the live region are untouched by a late insert.
7. The memory note about CRLF files becomes wrong once the tree is LF; updated in the same session. The formatter's comment about CRLF checkouts now speaks of editors.
