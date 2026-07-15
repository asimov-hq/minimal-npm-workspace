# AGENTS.md

## Purpose

This repository is a minimal npm-workspace scaffold that ships as a small **working app**:
multi-user todos with tags (username/password auth, per-tab sessions). Its job is to let
coding agents start real work without long prompts: the patterns for routing, validation,
auth, persistence, testing, and UI are already in place. **Extend the existing patterns
instead of inventing new ones.**

## Repo Map

| Where | What |
|---|---|
| `packages/shared/src/index.ts` | shared types (`User`, `Todo`) + helpers, consumed by all packages |
| `packages/server/src/app.ts` | `buildApp(config)` factory: ajv, jwt + `authenticate`, swagger, static web |
| `packages/server/src/{auth,todos}/routes.ts` | route modules (`registerXRoutes(app, store)`), schemas inline |
| `packages/server/src/lib/` | `store.ts` (JSON-file persistence), `password.ts` (scrypt), `problem.ts` (RFC7807) |
| `packages/server/src/config.ts` | env → typed `AppConfig` (`PORT`, `HOST`, `JWT_SECRET`, `DATA_DIR`) |
| `packages/server/src/*.test.ts` | node:test suites; `createTestApp()` lives in `test-helpers.ts` |
| `packages/web/src/app.tsx` | the preact UI; `api.ts` is the fetch wrapper |
| `packages/cli/src/` | CLI entry |
| `docs/plans/` | plans (kaizen style); `docs/sessions/` session notes |

## Required Verification Order

After making code changes, run from the repo root, in this order:

1. `npm run lint`
2. `npm run typecheck`
3. `npm run build`
4. `npm test`

Rules:

- Fix failures at each step before moving to the next.
- Do not report success unless all four succeed.
- Documentation-only changes are exempt.
- These commands write `.eslintcache`, `*.tsbuildinfo*`, and `dist*/` directories — if a
  sandbox blocks those writes, rerun with the needed permissions; do not skip the command.

## Conventions (Do Not Break)

- **Errors** are RFC 7807 `application/problem+json` via the central handler in
  `lib/problem.ts` — throw `new Problem(status, title, detail)` in handlers.
- **Success bodies** are enveloped: `{ "data": … }`.
- **OpenAPI is generated** from the route schemas (`/openapi.json`, `/docs`). Never
  hand-write the spec; add/extend schemas on the routes instead.
- **Validation** happens in route schemas (ajv + ajv-formats). Handlers can trust
  `request.body`.
- **Auth**: protected routes use `preHandler: [app.authenticate]` and read
  `request.user.sub`. Owner-scope every data access; other users' records answer 404.
- **Persistence**: JSON files in `packages/server/data/` (gitignored — delete to reset)
  through `createStore` (in-memory Map, atomic tmp+rename writes). The server loads data at
  startup and won't see external file edits until restarted.
- **Secrets**: `JWT_SECRET` has a dev default; anything deployed must set its own.

## Kaizen Programming Approach

Kaizen here means continuous improvement through small, coherent, reviewable steps. The goal
is not just to make a change work; it is to leave the codebase easier to understand, safer to
change, and less surprising than before.

### Core Principles

- No hacks. No broad `any`, unchecked casts, hidden flags, duplicated state, or magic
  constants papering over design problems.
- Make the smallest change that fully solves the current problem without creating avoidable
  future cleanup.
- Fix broken quality gates before cleanup, cleanup before features.
- Prefer behavior-preserving cleanup first when existing structure blocks a clean
  implementation.
- Keep domain logic separate from routes, UI, and persistence.
- Prefer explicit contracts over implicit coupling.
- Leave unrelated code alone; keep diffs focused, no formatting churn.
- When a shortcut is tempting, stop and name the underlying design problem.

### Planning Work

- Start by reading the relevant code and docs; let the existing architecture guide the change.
- Non-trivial work gets a plan in `docs/plans/` (dated filename) before implementation.
- Split large work into slices that can be reviewed and verified independently — each with a
  behavioral goal, affected files, acceptance criteria, and verification steps.
- Do not mix unrelated refactors with behavior changes.

### TypeScript And Safety

- Preserve strict TypeScript (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, …).
  Do not weaken types to get past the compiler.
- Use `unknown` at trust boundaries, then parse or narrow.
- Do not silence lint rules casually; a lint fix should improve safety or clarity.

### Testing (TDD)

- This is a TDD repo: for server behavior changes, write the failing test first
  (Red–Green–Refactor), in `packages/server/src/*.test.ts` using node:test and
  `app.inject()` against `createTestApp()` (temp data dir per test).
- Bug fixes come with a regression test.
- For visual/interaction changes, verify manually in the browser and say what was checked.
- If a check cannot be run, say so and explain the remaining risk.

## Measurement Principles

- **Measure, don't guess.** Never claim a performance, size, or speed improvement from
  intuition or a single noisy number.
- **Baseline before work:** capture the relevant measurement (test-suite duration, bundle
  size from the `vite build` output, response timing, `du -sh node_modules`, …) before
  changing code. Rerun the same measurement after. Report both.
- Keep performance changes attributable: do not mix algorithm changes, cleanup, and UI work
  in one unreviewable patch.
- Prefer removing work — allocations, duplicate computation, unneeded dependencies — before
  adding complexity. No caching without clear invalidation rules.
- Record baseline, result, and the keep/revert decision in the plan or in a
  `docs/progress/<date>--<tag>.md` note.

## Definition Of Done

A code change is not done until:

- the requested change is implemented,
- lint, typecheck, build, and tests all pass in the order above,
- issues discovered along the way are fixed (or explicitly written down),
- docs are updated when behavior, commands, or contracts changed.

## Review Standard

Before calling work done, ask:

- Is the behavior correct?
- Is the design simpler or clearer than before?
- Are responsibilities in the right modules?
- Are trust boundaries validated?
- Are tests or manual checks appropriate for the risk?
- Did the change avoid repo-specific hacks and preserve future options?

If any answer is no, do the next small kaizen step before handing off.

For commands and the API surface, see `README.md`.
