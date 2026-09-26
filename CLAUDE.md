# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Filerz is a peer-to-peer file transfer app (file.pizza-style): a file goes directly from one browser to another over WebRTC, never touching a server the project controls. The sender picks a file, gets a one-time link + QR code (plus a short code that can be typed or read out loud); the receiver opens the link, scans the QR (with the device camera, from the page itself), or types the code, and the transfer starts with a progress bar, speed, and ETA on both sides. It's also an installable PWA (works offline for the shell, not for transfers) with a bilingual (ES/EN) UI and a light/dark theme.

The whole app is one self-contained file, **`index.html`**, at the repo root — no build step for the app itself. PeerJS, `qrcodejs`, and `jsQR` are loaded from CDN (jsDelivr / cdnjs) directly in `<head>`. A handful of small supporting static files exist alongside it for the PWA/hosting bits: `manifest.json`, `sw.js` (service worker), `vercel.json`, and `icons/*.png` — everything else about the app's behavior still lives in `index.html`. `package.json` and `tests/` do exist, but they're dev-only tooling for the test suite (see Commands) and are deliberately kept out of the deploy (see Deployment).

## Commands

There is nothing to install or build. To work on the app locally:

```bash
python3 -m http.server 8080
# or: npx serve
```

Then open `http://localhost:8080/`. **Do not open `index.html` via `file://`** (double-click) — `location.origin` breaks under the `file:` protocol, which corrupts the generated share link/QR. The app detects this (`location.protocol === 'file:'`) and shows a translated error instead of generating a broken link (see `handleFile()`); the service worker also skips registration under `file:`.

There's a real test suite under `tests/` (dev-only — `package.json` is not consumed by the deploy, see Deployment below) and a GitHub Actions CI pipeline that runs it on every push to `main` and every pull request:

```bash
npm install        # once
npm test           # unit + e2e
npm run test:unit  # node --test on tests/unit/*.test.mjs — pure logic, no browser, fast
npm run test:e2e   # playwright test — spins up its own http.server per playwright.config.js
```

Before writing a new test, debugging a failing/flaky one, or touching `playwright.config.js` or `.github/workflows/test.yml`, load the **`filerz-tests`** skill — it has the testing-specific conventions and gotchas (why the unit tests extract logic from `index.html` instead of importing it, a Playwright/WebKit trap in the mobile test, why the locale is pinned, CI job details) that would otherwise have to be rediscovered.

## Architecture

Everything lives in one IIFE (`<script>` near the end of `<body>`) that branches into exactly one of two modes based on the URL hash, decided once at load, by reading `#r=<peerId>` via `URLSearchParams` on `location.hash`:

- **Receiver mode** (`receiveId` present): hides the sender UI, creates its own `Peer()`, and calls `peer.connect(receiveId, { reliable: true })`.
- **Sender mode** (no `r` param): shows the drop zone. On file selection it calls `startPeer()`, which creates `new Peer(generateShortId())` — an explicit **custom short ID** (8 chars, `SHORT_ID_ALPHABET` excludes ambiguous characters like `0/O/1/I/L`, rendered as `ABCD-1234`) instead of PeerJS's default long UUID. If PeerJS reports `unavailable-id` (collision), it retries with a fresh id up to 4 times (`startPeer(idRetriesLeft)`). Once `peer.on('open')` fires, the share link (`location.origin + location.pathname + '#r=' + id`) is rendered as text, as its own short-code-only field, and as a QR (`qrcodejs`).

There are three ways to get from the sender's own screen into receiver mode without the link: typing the code into `#codeInput`, pasting a full URL into it (`normalizeCode()` tries `new URL(...)` first and pulls `r` out of its hash, falling back to treating the input as a bare code), or scanning a QR with the device camera (`getUserMedia` + `jsQR` decoding a `<canvas>` snapshot on a `requestAnimationFrame` loop). All three funnel into `goToReceiveCode()`, which sets `location.hash` and reloads the page — the actual mode switch is still just the branch above.

**Signaling only**: PeerJS's public cloud broker exchanges connection info between the two peers. Once `conn.on('open')` fires on both sides, bytes flow directly over the resulting `RTCDataChannel`.

**Wire protocol** (objects sent over the data channel): `meta` (name/size/mime, sent once by the sender on connect) → `ready` (sent by the *receiver* once it's actually prepared to accept bytes — immediately for normal transfers, or only after the user picks a save location for large files; the sender's `sendFileInChunks` doesn't start until this arrives) → a stream of `chunk` (16 KB `ArrayBuffer` slices) → `done`. Either side can also send `cancel`, and the sender can send `error` with a `code` matching an `I18N` key (e.g. `linkAlreadyUsed`, `transferInProgress`) instead of pre-translated text, so each side renders it in its own language regardless of the other end's language setting.

**Single-use enforcement**: the sender only tracks one `activeConn`. A second incoming connection while one is active, or any connection after the transfer already `finished`, is immediately sent an `error` and closed — this is what makes the link "one-time use."

**Backpressure**: `sendFileInChunks` reads chunks with `FileReader` as before, but before sending each one it awaits `waitForDrain()`, which resolves immediately unless the `RTCDataChannel.bufferedAmount` is above a high-water mark (4 MB), in which case it waits for the `bufferedamountlow` event (threshold set to a 1 MB low-water mark). Prevents unbounded buffering when the sender is faster than the receiver/network can drain.

**Large-file disk streaming**: if `window.showSaveFilePicker` exists and `meta.size > STREAM_TO_DISK_THRESHOLD` (200 MB), the receiver prompts for a save location *before* sending `ready`, then writes each `chunk` straight to a `FileSystemWritableFileStream` instead of pushing it into the in-memory `received` array. Browsers without that API (Firefox, Safari) or smaller files keep using the original in-memory `Blob` + download-link path.

**Speed/ETA**: `makeSpeedTracker(el)` returns a closure holding a rolling window (bytes since last sample / elapsed time); called from both the sender's and receiver's chunk handlers independently — there's no explicit speed message on the wire.

### i18n

`I18N` is a plain object with `es`/`en` keys, each a flat map of translation keys to strings (some with `{placeholder}` interpolation, e.g. `couldNotConnect: "No se pudo conectar ({type})..."`). `t(key, vars)` looks up the current `lang`, falling back to `es`. Static markup is translated by tagging elements with `data-i18n="key"` (sets `textContent`) or `data-i18n-label="key"` (sets `aria-label`), applied via `applyStaticTranslations()`. Text that changes at runtime (status labels, error messages) goes through `setKeyedText(el, key, vars)`, which remembers the key/vars on the element (`el._i18nKey`) so `retranslateKeyed()` can re-render everything currently on screen when the language toggles, without reloading the page. `lang` is decided once at load — saved `localStorage['filerz-lang']`, else `navigator.language` starting with `en`, else `es` — and an early inline `<script>` in `<head>` (before the stylesheet/fonts) applies the saved `lang` and `data-theme` attributes ahead of first paint to avoid a flash of the wrong language/theme.

### Styling

Single 8-bit/pixel-art design system, all in one `<style>` block:
- CSS custom properties on `:root` (dark, default) and `:root[data-theme="light"]`, toggled at runtime by the header's theme button (moon/sun glyph), persisted to `localStorage['filerz-theme']`.
- Two Google Fonts: `Press Start 2P` for short labels (title, header icon buttons, file-type glyph) and `Pixelify Sans` for everything else (replaced `VT323`, which read as too narrow/thin). `font-variant-ligatures: none` + `font-feature-settings: "liga" 0, "clig" 0` are set globally — Pixelify Sans was rendering the "fi" ligature as a broken glyph on some devices (e.g. "file" looked like "Ale").
- The lack of `border-radius`, the hard-offset (no blur) shadows, and buttons that `transform: translate()` on `:active` instead of easing are deliberate pixel-art choices, not oversights — don't "clean them up" into softer/rounder defaults when touching this CSS.
- Header (`.top`) has four same-size square icon buttons — help (`?`), language (`EN`/`ES`), theme (`☾`/`☀`), and the status pill (now icon-only; its text is visually hidden via `.sr-only` and exposed as a `title` attribute + `role="status"` for screen readers/hover) — that wrap to a second line on narrow screens instead of overflowing the card.
- One responsive breakpoint, `@media (max-width: 480px)`, bumps font sizes and stacks paired input+button rows (link/code copy rows, not just the QR/link row) vertically. Keep new text elements' mobile sizing in this same breakpoint — a previous bug had the stacking rule at a narrower breakpoint (380px) than the font-size bump, which left inputs squeezed on real phones (~390-430px wide); a later bug had the pixel-art fonts' real on-device metrics differ from the fallback used while testing, causing the stacked Copy buttons to overflow the card edge, fixed by having the input/button pair stack regardless of the font's actual measured width rather than relying on them fitting one row.
- The help modal and the camera-scan overlay use the same `env(safe-area-inset-*)`-based padding as the rest of the app (notch / installed-PWA status bar), and the help modal's max-height is recalculated so it doesn't overflow small screens.

## PWA

`manifest.json` (name, icons, `display: standalone`, colors) + `sw.js` make Filerz installable and instant-loading offline for the shell (`/`, `/index.html`, `/manifest.json`, the two non-maskable icons) — registered from `index.html` only when `'serviceWorker' in navigator && location.protocol !== 'file:'`. The service worker deliberately does **not** call `skipWaiting()` on install, so an update sits in `waiting` until the user confirms via an in-app toast (`updateToast`); only then does the page `postMessage({type: 'SKIP_WAITING'})` and reload on `controllerchange`. This avoids yanking the shell out from under an in-progress transfer.

The browser only notices a new service worker version when `sw.js`'s *bytes* change — that's the only thing that reliably triggers the update-available toast. `CACHE_NAME` is auto-generated from a content hash and **must not be hand-edited** (any manual change gets overwritten by CI anyway). Load the **`filerz-deploy`** skill before touching `sw.js`, `vercel.json`, `.vercelignore`, or CI config — this repo has broken production twice already from exactly that kind of change, and the skill has the full story.

Vercel Analytics is wired via a single deferred `<script src="/_vercel/insights/script.js">` tag — no package, no build step — but does nothing until "Web Analytics" is enabled for the project in the Vercel dashboard.

## Deployment

Static hosting, no build command — deployed on Vercel from `rzazo24/filerz` on GitHub, auto-deploying on push to `main`. The main app file **must** be named `index.html` at the repo root; static hosts resolve `/` to `index.html` (this app previously 404'd at the root when the file was named `filerz.html`).

`package.json` exists only for the test suite (see Commands) and is **not** meant to drive the Vercel build. Load the **`filerz-deploy`** skill before changing `vercel.json` or `.vercelignore` — it covers a `buildCommand` mistake that already took production down once, and isn't obvious from reading `vercel.json` alone.

## Versioning

Changes are tracked in `CHANGELOG.md` (Keep a Changelog format, Spanish only — `README.en.md` exists for the English-speaking reader, but the changelog itself isn't translated) with a matching annotated git tag (`vX.Y.Z`) per notable change, including docs-only changes, even within the 0.x range. Recent history was produced by a PR-style workflow (a content commit followed by a `Merge: ...` commit for the same change) — tag the **merge commit**, not the content commit, since that's the point where `main`'s tip actually advanced.
