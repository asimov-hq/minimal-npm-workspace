# FEATURES.md

What this scaffold demonstrates, and where to find each pattern. It's an **index of
reference implementations** — when you extend the app, copy the pattern already here instead
of inventing a new one (see [`AGENTS.md`](AGENTS.md) for the working rules). Every item below
is real, exercised, and covered by the gates (51 unit/integration tests + a 22-assertion
browser e2e + a copy self-test).

Legend: paths are repo-relative; `@asimov/*` are the workspace packages.

---

## Workspace & TypeScript mechanics

| Feature | What it shows | Where |
|---|---|---|
| npm workspaces | one repo, four packages, one lockfile | root `package.json` (`workspaces`), `packages/*` |
| TS project references | incremental `tsc -b` across packages | root `tsconfig.json`, per-package `tsconfig.build.json` |
| tsconfig layering | `paths` → **source** in dev, emptied → **dist** in build; noEmit watch graph | `packages/*/tsconfig{,.build,.dev}.json` (explained in README) |
| strict base config | `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, NodeNext | `tsconfig.base.json` |
| one shared package | types + pure logic consumed by server, web, cli | `packages/shared/src/` |
| subpath exports | server exposes `/store` and `/workspace` to the cli without leaking internals | `packages/server/package.json` (`exports`) |
| dev-vs-build resolution | `tsx`/vite read shared source (no prebuild); builds resolve dist via node_modules | `paths` in `tsconfig.json` vs `paths: {}` in `tsconfig.build.json` |

## Backend (Fastify) patterns

| Feature | What it shows | Where |
|---|---|---|
| `buildApp(config)` factory | testable app assembly; config is the only injection seam | `packages/server/src/app.ts` |
| typed env config | env → validated `AppConfig`; dev defaults | `packages/server/src/config.ts` |
| route modules | `registerXRoutes(app, store)` per resource; schemas inline | `packages/server/src/{auth,todos}/routes.ts` |
| request validation | own Ajv + `ajv-formats` via `setValidatorCompiler` | `app.ts` + route `schema` blocks |
| query-string validation | ajv coercion of `?tag=&done=` (booleans, etc.) | `todos/routes.ts` (`GET /v1/todos`) |
| RFC 7807 errors | central handler → `application/problem+json`; `throw new Problem(...)` | `packages/server/src/lib/problem.ts` |
| `{ data }` envelope | uniform success shape | every route; type in `packages/shared/src/api.ts` |
| generated OpenAPI | `/openapi.json` + `/docs` from route schemas — never hand-written | `app.ts` (`@fastify/swagger` + `swagger-ui`) |
| enforced JWT auth | `authenticate` decorator as `onRequest` guard; 401 before body validation | `app.ts`, routes, `types/fastify-jwt.d.ts` |
| token expiry | `expiresIn` from `TOKEN_TTL`; expired → 401 | `app.ts`, `config.ts` |
| password hashing | scrypt + per-user salt + `timingSafeEqual`, zero deps; hash never serialized | `packages/server/src/lib/password.ts` |
| static + SPA serving | fastify serves built web app in prod, SPA fallback for non-`/v1` GETs | `app.ts` (`@fastify/static`) |
| graceful shutdown | SIGINT/SIGTERM close | `packages/server/src/main.ts` |
| health check | `GET /healthz` | `app.ts` |

## Persistence

| Feature | What it shows | Where |
|---|---|---|
| JSON-file store | in-memory `Map` + atomic tmp-file+`rename` writes; one file per collection | `packages/server/src/lib/store.ts` |
| optimistic concurrency | integer `version`; stale write → **409**, nothing changed | `todos/routes.ts`, model in `shared/src/todos.ts` |
| owner scoping | every access filtered by owner; foreign records → **404** (no id leak) | `todos/routes.ts` |
| data-dir resolution | walk to the `workspaces` package.json; `DATA_DIR` > `config.dataDir` > `<root>/data` | `packages/server/src/lib/workspace.ts` |
| prefixed ids | `usr_`/`todo_` + `crypto.randomUUID()` | `auth/routes.ts`, `todos/routes.ts` |

## Auth & domain model

| Feature | What it shows | Where |
|---|---|---|
| username/password signup + login | live account, no email verification | `auth/routes.ts` |
| no user enumeration | unknown user and wrong password return an identical 401 | `auth/routes.ts` (dummy-hash compare) |
| per-tab sessions | JWT in `sessionStorage` → two tabs = two users | `packages/web/src/api.ts` |
| shared validators | one rule set for username/password, used by server schema **and** web | `packages/shared/src/users.ts` |
| pure domain logic | `normalizeTags`, `parseTags`, `matchesTodoFilter` reused by server, web, cli | `packages/shared/src/todos.ts` |
| public vs stored shape | `User` (public) vs `UserRecord` (adds `passwordHash`) | `shared/src/users.ts`, `auth/routes.ts` |

Full model reference: [`docs/documentations/developer/data-models.md`](docs/documentations/developer/data-models.md).

## Frontend (Preact + Vite)

| Feature | What it shows | Where |
|---|---|---|
| Preact SPA | auth screen + todo list, no router (single view) | `packages/web/src/app.tsx` |
| typed fetch wrapper | Bearer injection, `{data}` unwrap, problem+json → `ApiError` | `packages/web/src/api.ts` |
| vite dev proxy | `/v1` → API; port driven by `API_PORT` | `packages/web/vite.config.ts` |
| client-side validation | shared rules give instant feedback before the round-trip | `app.tsx` (consumes `shared/src/users.ts`) |
| conflict UX | 409 → reload list + "changed in another tab, retry" | `app.tsx` (`handle`) |
| theme system | 6 themes via semantic CSS custom properties + `data-theme` + localStorage | `packages/web/src/theme.ts`, `styles.css` |
| CSS token discipline | colors only in token blocks; a test fails on literals elsewhere | `styles.css`, `styles.test.ts` |

## CLI (admin tooling)

| Feature | What it shows | Where |
|---|---|---|
| admin over the store | `users`, `todos <user> [--tag/--done/--open]`, `remove-user` (cascade) | `packages/cli/src/commands.ts` |
| zero-dep arg parsing | `node:util` `parseArgs` | `packages/cli/src/main.ts` |
| reuse, not duplicate | imports the server's store via `@asimov/server/store` | `commands.ts` |

## Testing & quality gates

| Feature | What it shows | Where |
|---|---|---|
| zero-dep test runner | `node:test` via `tsx` — no jest/vitest | every `*.test.ts`; scripts in package.json |
| integration tests | `app.inject()` against `createTestApp()` with mkdtemp data dirs | `packages/server/src/*.test.ts`, `test-helpers.ts` |
| real-socket smoke | boots on an ephemeral port, hits it with `undici` | `packages/server/src/smoke.test.ts` |
| contract tests | api.ts against a stub `fetch` + fake `sessionStorage` | `packages/web/src/api.test.ts` |
| structural guard tests | CSS-token purity + theme-contract completeness | `packages/web/src/styles.test.ts` |
| TDD discipline | new behavior lands with a failing test first | history + `AGENTS.md` |
| headless browser e2e | two tabs as two users, conflict, theme, reload — local-only | `scripts/e2e-browser.mjs` (`npm run test:e2e`) |
| template self-test | copy to a temp dir, assert contents, run all gates there | `scripts/copy-smoke.sh` (`npm run smoke:copy`) |
| typed linting | `projectService`, order-independent gates | `eslint.config.js` |
| CI | `npm ci` → lint → typecheck → build → test → copy-smoke | `.github/workflows/ci.yml` |

## Developer experience & tooling

| Feature | What it shows | Where |
|---|---|---|
| smart dev launcher | picks a free API port (prefers 3939), points the proxy at it, clean tree teardown | `scripts/dev.mjs` (`npm run dev:app`) |
| deterministic copy | `git ls-files` as the source of truth; artifacts never leak | `scripts/copy.sh` |
| post-copy checklist | rename scope, adapt ports, set secret, … | `AGENTS.md` |
| agent working rules | kaizen approach, verification order, measurement, review standard | `AGENTS.md` |
| plans & docs | dated plans; developer docs | `docs/plans/`, `docs/documentations/developer/` |
| MIT licensed | ready to copy and ship | `LICENSE` |

---

## Deliberately out of scope (seams, not gaps)

A *generic* scaffold demonstrates patterns, not a finished product. These are intentionally
absent — each has a clean place to grow when a real app needs it:

| Not included | Why omitted | Where it would go |
|---|---|---|
| token revocation / refresh tokens | logout is client-side; demo scope | new store + `/v1/auth/refresh`, check in `authenticate` |
| login rate limiting | demo scope | a fastify plugin / hook before `auth/routes.ts` |
| email verification / password reset | "pick a username and go" | `auth/routes.ts` + a mail seam |
| pagination on list endpoints | ten-item demo lists | `GET /v1/todos` query schema + response `{items,total,limit,offset}` |
| one-file-per-record storage | one-file-per-collection is right at this scale | swap the write strategy in `lib/store.ts` |
| richer todo model (status enum, priority, description) | app flavor, not a new pattern | `shared/src/todos.ts` + route schemas |
| a real database | JSON files keep it dependency-light and inspectable | replace `lib/store.ts` behind its `Store<T>` interface |
| SSR / routing | single-view SPA | add `preact-iso` (removed as unused) back |

When you add one of these, it becomes a *feature* — move its row up into the catalog above.
