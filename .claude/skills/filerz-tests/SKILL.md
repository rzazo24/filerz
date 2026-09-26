---
name: filerz-tests
description: Testing conventions, gotchas, and commands for Filerz's test suite (tests/unit/*.test.mjs, tests/e2e/*.spec.js, playwright.config.js). Use this whenever writing a new test, running the suite, or debugging a failing or flaky test in this repo — especially a "missing dependencies to run browsers" error from Playwright, a language/locale-dependent test failure, or a unit test that seems to be checking stale logic. Consult before adding any mobile-emulation test or touching playwright.config.js.
---

# Testing Filerz

Filerz has no build step and no framework, but it does have a real test suite,
kept deliberately separate from the app itself (`index.html` stays a plain
static file either way).

## Running tests

```bash
npm install        # once
npm test           # unit + e2e
npm run test:unit  # node --test, tests/unit/*.test.mjs — pure logic, no browser, fast
npm run test:e2e   # playwright test — spins up its own http.server per playwright.config.js
```

## Unit tests: extraction, not import

`index.html` is not a JS module — it's a self-contained HTML page with an IIFE
inside a `<script>` tag, on purpose (see the repo's `CLAUDE.md` for why). So
`tests/unit/pure-logic.test.mjs` can't `import` anything from it. Instead it
reads the raw HTML text, slices out a known function/object between two
marker strings (e.g. `'function normalizeCode(raw) {'` ... `'\n\n  function
goToReceiveCode'`), and evaluates that slice in isolation with `new
Function(...)`.

This covers `I18N`, `generateShortId`/`SHORT_ID_ALPHABET`, and
`normalizeCode`. If you rename one of those identifiers in `index.html`, the
test throws "marker not found" instead of silently testing whatever the old
markers happened to still match — that's the point, not a bug. When you
rename something these tests depend on, update the marker strings in the same
commit.

If you add a new pure function worth unit-testing, follow the same pattern:
find or add stable anchor strings around it rather than trying to make
`index.html` importable — turning it into a module would undo the single-file
architecture the whole project is built around.

## E2E tests: what's covered and why

`tests/e2e/*.spec.js` (Playwright) replaced what used to be ad hoc manual
checks:

- **`sender-flow.spec.js`** — picking a file generates a working link, short
  code, and QR; QR is decoded with `jsqr` and checked against `#linkInput`;
  cancel button resets the UI.
- **`full-transfer.spec.js`** — a complete sender→receiver transfer over the
  *real* PeerJS Cloud broker (this hits the network, so it's the slowest and
  most network-dependent test in the suite), plus single-use-link rejection
  (a second connection to an already-completed link gets an error).
- **`file-protocol-guard.spec.js`** — opening via `file://` shows the warning
  instead of a broken link (regression test for a real bug that shipped once).
- **`mobile-layout.spec.js`** — no horizontal overflow at phone widths
  (regression test for a real bug: stacked Copy buttons overflowing the card).
- **`language-toggle.spec.js`** — the ES/EN toggle actually changes visible
  text, and the help modal opens/closes.

### The `devices['iPhone 13']` trap

`mobile-layout.spec.js` only wants a phone-sized *viewport* to check CSS
overflow — it has no interest in testing Safari's rendering engine. But
Playwright's `devices['iPhone 13']` preset bundles `defaultBrowserType:
'webkit'` (because real iPhones use WebKit), and if you spread the whole
preset into `test.use()`, Playwright quietly launches WebKit instead of
Chromium for that file. If this environment (or CI) doesn't have WebKit's
system dependencies installed, you get:

```
Host system is missing dependencies to run browsers.
```

which reads like a broken environment but is actually just this. The fix
already in place: destructure `defaultBrowserType` out before spreading the
rest of the device preset:

```js
const { defaultBrowserType, ...iPhone13Viewport } = devices['iPhone 13'];
test.use({ ...iPhone13Viewport });
```

Do the same for any new test that needs a mobile-sized viewport/UA — you
almost never actually want WebKit here, just the dimensions.

### Locale is pinned on purpose

`playwright.config.js` sets `locale: 'es-ES'` at the top level. The app
auto-detects its language from `navigator.language` when nothing is saved in
`localStorage`, so without pinning this, `language-toggle.spec.js`'s
assumption of "starts in Spanish" would pass or fail depending on whichever
machine (or CI runner) happens to run it. If you write a test that depends on
the app's starting language, rely on this config rather than re-deriving the
locale yourself.

### A 404 you'll see and should ignore

`GET /_vercel/insights/script.js` returns 404 in every local/CI test run —
Vercel Analytics only resolves on an actual Vercel deployment with Web
Analytics enabled. It's expected noise, not something to fix or assert
against.

## Debugging a CI failure

`playwright.config.js` sets `trace: 'on-first-retry'` and `screenshot:
'only-on-failure'`. When the `test` job in `.github/workflows/test.yml` fails,
it uploads `playwright-report/` as an artifact — download it and open it
locally (`npx playwright show-report`) rather than trying to guess what went
wrong from the CI log alone.
