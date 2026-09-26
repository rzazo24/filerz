---
name: filerz-deploy
description: CI/CD and deployment internals for Filerz — the GitHub Actions workflow, vercel.json, the service worker's CACHE_NAME automation, .vercelignore, and the changelog/git-tag release convention. Use this whenever touching .github/workflows/test.yml, vercel.json, sw.js, .vercelignore, or manifest.json, whenever cutting a version tag, or whenever a Vercel deploy fails or behaves unexpectedly. This repo has broken production twice before from exactly this kind of config change — read this before editing any of these files, not after something breaks.
---

# Deploying and releasing Filerz

Filerz deploys as a static site to Vercel from `rzazo24/filerz` on GitHub,
auto-deploying on every push to `main`. There is no build step for the app
itself — `package.json` exists only to run the test suite (see the
`filerz-tests` skill), not to drive the Vercel build. That gap between "there
is tooling here" and "none of it should touch the deploy" is where both of
this repo's real production incidents came from, so the gotchas below are
worth internalizing rather than skimming.

## CI: two jobs in `.github/workflows/test.yml`

- **`test`** — runs `npm run test:unit` + `npm run test:e2e` on every push to
  `main` and every pull request. Installs only Chromium (`npx playwright
  install --with-deps chromium`), not Firefox/WebKit, since nothing in the
  suite needs them (see `filerz-tests` for why a mobile-viewport test doesn't
  need WebKit either).
- **`update-sw-cache`** — push-to-`main` only, gated on `test` passing. Runs
  `scripts/update-sw-cache-name.mjs` and, if it changed `sw.js`, commits and
  pushes that change with `git commit -m "... [skip ci]"`. The `[skip ci]` is
  load-bearing: without it, this auto-commit would trigger another workflow
  run on `main`, which would trigger another auto-commit check, and so on.

## `CACHE_NAME` is generated, not written

A PWA's browser only notices a new service worker version when `sw.js`'s
*bytes* change. Early on, `CACHE_NAME` in `sw.js` was a manually-incremented
counter (`filerz-shell-v15`) — easy to forget to bump, and forgetting it means
the "update available" toast silently never appears for installed users, with
no error anywhere to notice.

It's now `filerz-shell-<hash>`, where `<hash>` is a SHA-256 of the actual
contents of the files listed in `SHELL_ASSETS` (computed by
`scripts/update-sw-cache-name.mjs`, single source of truth — it reads
`SHELL_ASSETS` out of `sw.js` itself rather than keeping a second list
somewhere). This means the cache name changes if and only if the shell
actually changed, with no human required to remember anything. The
`update-sw-cache` CI job runs it after every push to `main`.

**Don't hand-edit `CACHE_NAME`.** Any manual edit gets silently overwritten by
the next push's CI run anyway. If you need to force a cache-bust locally to
test something, run `npm run update-sw-cache` and let it compute the real
value.

## The `vercel.json` `buildCommand` trap (broke production once)

`vercel.json` overrides `installCommand` to a no-op:

```json
"installCommand": "echo 'Sitio estático...'"
```

This exists because `package.json`'s mere presence makes Vercel's zero-config
detection want to run `npm install` on every deploy — which would install
`@playwright/test` as a side effect and trigger its browser-download
postinstall step, for a static site that has no use for Playwright at deploy
time.

**Do not also add a `buildCommand` override**, even a harmless-looking no-op
`echo`. Declaring *any* `buildCommand` switches Vercel from "static site,
serve the repo as-is" into "real build, please" mode — and in that mode it
expects the build's output in a `public/` directory. With no such directory,
the deploy fails outright:

```
Error: No Output Directory named "public" found after the Build completed.
```

This is exactly what happened here once already. The fix is to have
`installCommand` only, and no `buildCommand` key at all — Vercel then falls
back to serving the repo root directly, which is what this app needs. If you
ever think you need a build step, that's a sign the "no build step" premise of
this whole project (see `CLAUDE.md`) needs revisiting first, not something to
route around with `vercel.json`.

## `.vercelignore`

Keeps `tests/`, `playwright.config.js`, and `CLAUDE.md` out of the deployed
static output. Without it, Vercel's static builder happily serves *everything*
in the repo it doesn't specifically know to exclude — these three would
otherwise be publicly reachable at `https://filerz.vercel.app/tests/e2e/...`
etc. `package.json`/`package-lock.json`/`node_modules` are excluded by
Vercel's own defaults and don't need to be listed here.

## The file must be named `index.html` (broke production once)

Static hosts resolve `/` to `index.html`. When the app's main file was still
named `filerz.html`, visiting the bare production domain 404'd — only
`/filerz.html` worked. If you ever consider renaming the main file again,
remember the root path depends on that exact name.

## `sw.js` cache headers

`vercel.json` also forces `Cache-Control: no-cache` specifically on `/sw.js`,
so browsers always revalidate that one file against the server instead of
serving an HTTP-cached copy — which could otherwise mask a real update
independently of the `CACHE_NAME` mechanism above.

## Versioning: a tag per change, on the merge commit

Every notable change — including docs-only ones — gets a `CHANGELOG.md` entry
(Keep a Changelog format, Spanish only) and a matching annotated git tag
(`vX.Y.Z`), even within the `0.x` range. Recent history was produced by a
PR-style workflow where a content commit is followed by a `Merge: ...` commit
for the same change — tag the **merge commit**, not the content commit, since
that's the point where `main`'s tip actually advanced. See existing tags
(`v0.1.0` onward) for the granularity expected before deciding whether
something is "notable" enough to tag.
