# minimal-npm-workspace — template quality kaizen plan

**Date:** 2026-07-06
**Scope:** the whole repository — it *is* the product (a copyable template).
**Nature:** staged kaizen plan per the asimov-happy approach: small, coherent, independently
shippable slices; fix broken gates before cleanup, cleanup before features; no hacks; each slice
verifiable on its own.

The bar for a template is higher than for an app: every advertised command must work on a **fresh
clone**, and every line of config must earn its place, because downstream projects inherit both the
wiring and the cruft.

---

## 1. Current state (verified 2026-07-06)

What was actually run, not inferred:

| Check | Result |
|---|---|
| `npm run build` | ✅ passes |
| `npm run typecheck` (after build) | ✅ passes |
| `npm run typecheck` (fresh clone / after `clean`) | ❌ **fails** — TS2307 in server+cli (shared `dist` types missing, `--noEmit` prevents emitting them) and TS6310 from `packages/web/tsconfig.build.json` |
| `npm run lint` | ❌ **fails as shipped** — 2 × `@typescript-eslint/no-unsafe-call` in `server/src/main.ts` and `cli/src/main.ts`: the `paths` mapping `"@asimov/minimal-shared": ["../shared/src"]` maps to a *directory*, which NodeNext resolution does not expand to `index.ts`, so ESLint sees the import as untyped |
| `npx tsx src/main.ts` in server/cli with no `dist` present | ✅ dev flow works on a clean checkout |
| `./scripts/copy.sh <dest>` | ⚠️ copies volatile build artifacts (`packages/web/.tsbuildinfo`, `packages/web/dist-types/**` — visible in the README's own sample output) and **omits** root `tsconfig.json`, `tsconfig.dev.json`, `eslint.config.js`, so the copied project cannot run `build`, `typecheck`, `dev:ts`, or `lint` |

Honesty gaps between README and code:

- `packages/server` declares **8 unused runtime dependencies** (fastify, @fastify/jwt,
  @fastify/static, @fastify/swagger, @fastify/swagger-ui, ajv, ajv-formats, undici) while
  `src/main.ts` is a single `console.log`. This contradicts the headline claim *"almost no external
  dependencies apart from vite and preact"*.
- `packages/web` declares preact / preact-iso / @preact/preset-vite and the README highlights
  preact, but `src/main.ts` is vanilla DOM — preact is never rendered.
- `vite.config.ts` proxies `/v1` → `localhost:3001`, but no server listens anywhere and no code
  defines port 3001. Dead config.

Cruft inherited from the parent project:

- `eslint.config.js` ignores `shell/**`, `src/core/solver/**`, `public/**`, `cache/**`, `docs/**`,
  `scripts/**` — paths that (mostly) don't exist here — and carries a commented-out rules block with
  the invalid value `"on"`.
- `.gitignore` is the ~150-line generic GitHub Node template (Bower, Grunt, Gatsby, Nuxt,
  vuepress…), the opposite of minimal.
- `docs/sessions/2026-01-17-copy-template.ms` — `.ms` extension typo (should be `.md`).
- tsconfig layering is inconsistent across packages: `shared` has no `tsconfig.build.json` (root
  `tsconfig.json` references the folder while the other three are referenced via
  `tsconfig.build.json`); `server`/`cli` `tsconfig.dev.json` reference `../shared` (the *emitting*
  config) instead of shared's dev config; `shared/tsconfig.dev.json` combines `composite: true`
  (inherited) with `noEmit: true`.

Missing for a public template:

- No tests and no `test` script (the kaizen approach this repo's sibling follows is explicitly TDD).
- No CI — which is exactly what would have caught "typecheck fails on fresh clone".
- No LICENSE, despite the README inviting `git clone` from public GitHub.

What is already good and must be preserved: strict `tsconfig.base.json`
(`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, …), project references with incremental
builds, dev-mode source resolution via `paths` (fast, no prebuild needed), committed
`package-lock.json`, no artifacts tracked in git, careful argument handling in `copy.sh`.

---

## 2. Phases

Ordered by the kaizen rule: **restore truth of the quality gates first**, then correctness of the
product (the copy), then honesty of the manifest, then simplification, then guardrails, then docs.
Every phase is independently shippable and leaves the repo green.

### Phase 0 — make the advertised gates pass (broken → green)

**Goal:** `lint` and `typecheck` pass from a fresh clone, in any order.

1. **Fix ESLint type resolution of the shared package.** Change the `paths` value in
   `packages/server/tsconfig.json`, `packages/cli/tsconfig.json` (and web's) from
   `["../shared/src"]` to `["../shared/src/index.ts"]`, or move the mapping into the
   `tsconfig.eslint.json` files only. Pick whichever keeps dev (`tsx`) and Vite behavior unchanged —
   verify both.
2. **Make `typecheck` order-independent.** Root `typecheck` is `tsc -b --noEmit`, which cannot
   materialize the shared `dist` types that server/cli build configs (with `paths: {}`) resolve
   through. Two clean options; pick one, don't keep both:
   - (a) `typecheck` = `tsc -b` (accept that type-checking a project-references graph emits — it is
     the same work `build:ts` does), or
   - (b) make the noEmit graph self-consistent: point every `tsconfig.dev.json` reference at the
     referenced package's *dev* config and use `tsc -b tsconfig.dev.json` as the typecheck entry.
   Option (a) is the smaller change and removes a whole failure class; recommend (a).
3. Fix `packages/web/tsconfig.build.json`'s TS6310 as part of whichever option lands.

**Acceptance:** `git clean -xfd && npm ci && npm run typecheck && npm run lint` passes; then
`npm run clean && npm run lint && npm run typecheck` also passes (both orders).
**Verification:** run exactly those command sequences; also `npm run dev:server` still resolves
shared from source without a prebuild.

### Phase 1 — make `copy.sh` produce a working project

**Goal:** the copy is deterministic and self-sufficient — `npm install && npm run build && npm run
lint` works in the destination.

1. Replace the hand-maintained include/exclude lists with **`git ls-files` as the source of truth**
   (minus template-local files: `docs/`, `package-lock.json` if desired). This simultaneously stops
   copying volatile artifacts (`.tsbuildinfo`, `dist-types/`) and starts copying the forgotten root
   files (`tsconfig.json`, `tsconfig.dev.json`, `eslint.config.js`, `.gitignore` handling stays).
   One mechanism instead of two duplicated `find` invocations.
2. Regenerate the sample output in `README.md` (the current sample proudly lists the artifact-
   copying bug).

**Acceptance:** copying into an empty dir twice (before and after a local `npm run build`) produces
identical file lists; in the destination `npm install && npm run build && npm run typecheck &&
npm run lint` passes.
**Verification:** scripted smoke run into a temp dir (this becomes the CI smoke test in Phase 4).

### Phase 2 — make the manifest honest (deps match code)

> **SUPERSEDED (2026-07-14):** direction reversed — the backend libs stay and become
> load-bearing instead of being deleted. See
> `2026-07-14--minimal-auth-todo-app.md` (implemented: fastify server with enforced JWT
> auth, ajv validation, generated OpenAPI, JSON-file persistence, preact todo UI, tests).
> The other phases of this plan remain valid follow-ups.

**Goal:** every declared dependency is exercised by the example; the README claims become true.

1. **Server:** delete the 8 unused dependencies. Replace the `console.log` with the smallest real
   server that justifies the existing `/v1` Vite proxy: a `node:http` (zero-dep) handler serving
   `GET /v1/hello` via `hello()` from shared, listening on 3001. If fastify is meant to be part of
   the template's value proposition, keep *only* `fastify` and drop the other 7 — but zero-dep
   `node:http` fits "minimal" better; recommend that.
2. **Web:** render one minimal preact component (`app.tsx`) that calls shared *and* fetches
   `/v1/hello` through the proxy — this makes preact, the JSX config, and the proxy all load-bearing,
   and demonstrates the actual point of the workspace (one function used from web, server, and cli).
   Drop `preact-iso` unless routing is demonstrated; it currently isn't.
3. Update README highlights to match reality.

**Acceptance:** `npx depcheck` (or manual audit) shows no unused deps in any package; `npm run
dev:app` serves a page whose content came through the proxy from the server; install footprint
shrinks (record before/after `du -sh node_modules`).
**Verification:** manual browser check of `dev:app`, `curl localhost:3001/v1/hello`, plus gates.

### Phase 3 — behavior-preserving simplification of config

**Goal:** every remaining config line earns its place; one canonical tsconfig pattern.

1. **ESLint:** switch `parserOptions.project` (4 files) to `projectService: true` and **delete the
   four `tsconfig.eslint.json` files**. Trim `ignores` to paths that exist (`dist`, `dist-types`,
   `.vite`, `node_modules`). Delete the commented-out rules block. Drop the redundant
   `ecmaVersion`/`sourceType` (defaults are fine with typescript-eslint).
2. **tsconfig layering:** give `shared` the same `tsconfig.build.json` shape as the other packages
   (or, inversely, collapse build configs where they only set `paths: {}`) — one pattern, applied
   uniformly; root `tsconfig.json` references the same filename in all four packages. Resolve the
   `composite`+`noEmit` tension in the dev configs in line with the Phase 0 decision.
3. **.gitignore:** replace the 150-line boilerplate with the ~12 lines this template actually
   produces: `node_modules/`, `dist/`, `dist-types/`, `*.tsbuildinfo*`, `.vite/`, `.eslintcache`,
   `*.log`, `.env*` (keeping `!.env.example`).
4. Rename `docs/sessions/2026-01-17-copy-template.ms` → `.md`. Remove the stray trailing `+ " "` in
   `web/src/main.ts` (absorbed by Phase 2's rewrite if that lands first).

**Acceptance:** file count drops (≥4 config files deleted); `git clean -xfd && npm ci` + all gates
still green; `git status` clean after a full build (proves .gitignore still covers everything).
**Verification:** the Phase 0 command sequences, plus the copy smoke from Phase 1.

### Phase 4 — guardrails (tests + CI + license)

**Goal:** regressions like "fails on fresh clone" become impossible to ship.

1. **Minimal tests, zero new deps:** `node:test` + `node --test` for `shared` (one test for
   `hello`), mirrored trivially in server/cli if Phase 2 added logic worth testing. Root
   `"test": "npm run -ws --if-present test"`.
2. **CI workflow** (GitHub Actions, single job): `npm ci` → `lint` → `typecheck` → `build` → `test`
   → copy-smoke (Phase 1's script into a temp dir + install + build there). Fresh-clone semantics of
   CI is precisely the regression net this repo lacked.
3. **LICENSE** (MIT unless the owner prefers otherwise) + `license` field in root package.json.

**Acceptance:** CI green on main; a deliberate re-introduction of the Phase 0 bug (revert the
typecheck fix locally) makes the pipeline fail.
**Verification:** push a branch, observe the workflow run both passing and failing states.

### Phase 5 — README and docs polish

**Goal:** the README teaches the one non-obvious thing this template contains.

1. Document the **tsconfig layering** (what `tsconfig.json` / `tsconfig.build.json` /
   `tsconfig.dev.json` each do and why `paths` exists for dev but is emptied for build) — this is
   the template's actual educational payload and is currently undocumented.
2. Command table (like asimov-happy's AGENTS.md): dev/build/typecheck/lint/test/clean.
3. State Node `>=20` requirement; fix the copied-files sample output (done in Phase 1); keep the
   jokes.

**Acceptance:** a newcomer can answer "why four tsconfigs per package?" from the README alone.
**Verification:** read-through; no gate changes.

---

## 3. Review standard (from asimov-happy AGENTS.md, applied per phase)

Before closing any phase: behavior correct? design simpler than before? responsibilities in the
right files? gates green from a fresh clone? diffs focused, no unrelated churn? If any answer is
no, do the next small kaizen step before handing off.
