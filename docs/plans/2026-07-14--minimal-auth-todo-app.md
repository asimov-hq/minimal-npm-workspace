# minimal-npm-workspace — minimal multi-user todo app (auth + tags)

**Date:** 2026-07-14
**Goal:** turn the template into a *working* minimal app so coding agents can start from this
scaffold without long prompts. Users register with a username and password (email optional — no
verification flow), log in, and get a clean minimal todo app with tags. Different browser tabs
can be logged in as different users.

This supersedes **Phase 2 of `2026-07-06--workspace-template-kaizen-plan.md`** (which proposed
dropping the 8 server deps for a zero-dep `node:http` server). New direction: the backend libs
stay and every one of them becomes load-bearing. All other phases of that plan (copy.sh, config
simplification, CI/LICENSE, README) remain valid follow-ups.

---

## 1. Why this architecture (three-backend comparison, condensed)

Surveyed `../batcave`, `../asimov-happy`, `../asimov-freud` (full notes in session):

| | batcave | asimov-happy | asimov-freud |
|---|---|---|---|
| Shape | `buildApp(config)` factory, route module per resource (~1.5k LOC) | same, grown to 6 features, 3-layer folders (~4.7k LOC) | monolithic 1062-line `app.ts` (anti-pattern) |
| Validation | Ajv 2020 + versioned on-disk schemas + response-contract hook | same registry idea, 33 schemas | responses only; requests hand-validated (weakness) |
| Errors | RFC7807 `problem+json`, `{meta,data}` envelope | RFC7807 central handler, `{data}` envelope | RFC7807 |
| JWT | sign-only, **no route protected** | declared, **never used** | **only repo where JWT is enforced** (`authenticate` decorator, scopes, refresh) |
| undici | dead dep | dead dep | genuinely used (upstream HTTP) |
| Persistence | 400-LOC `JsonFileDb` w/ flush policies | simple per-entity JSON-file stores: Map + atomic tmp+rename + version 409 | none |
| Tests | none | **only repo with tests**: `node:test` + tsx + `app.inject()`, temp data dirs | none |
| OpenAPI | generated from route schemas | generated | hand-authored 433-line doc (drift risk) |

**Take:** batcave's compact shape (it is this scaffold's ancestor — identical dep list), with
asimov-happy's store simplicity + testing pattern, and freud's *actually enforced* JWT. Generate
OpenAPI from route schemas (never hand-author). Deliberate deviations for minimalism: schemas
inline in TS next to routes (no on-disk versioned registry), no optimistic-versioning field on
todos, `{data}` envelope (happy style, not `{meta,data}`).

Every server dep earns its place:

| Dep | Use |
|---|---|
| fastify | the server |
| @fastify/jwt | sign on signup/login; `authenticate` decorator protects `/v1/me` + `/v1/todos*` |
| ajv + ajv-formats | own `createAjv()` (2020-12 + formats) via `setValidatorCompiler` — house style in all three repos |
| @fastify/swagger + swagger-ui | `/openapi.json` + `/docs` generated from the route schemas |
| @fastify/static | serve the built web app (`packages/web/dist`) when present → `npm run build && npm run start:server` = whole app on :3001 |
| undici | HTTP client in the real-listen smoke test (one test boots the server on an ephemeral port and hits it over real HTTP; all other tests use `app.inject()`) |

Web: `preact-iso` is removed (single view, no routing — dead dep otherwise). Shared gains the
domain types (`User`, `Todo`) + username rules so all packages genuinely consume it.

---

## 2. Product spec

- **Sign up:** username (`^[a-z0-9_-]{3,20}$`), optional email, password typed twice. The
  match-check of the two password fields is client-side; the server validates username pattern,
  password `minLength: 8`, and email format (`ajv-formats`) — no verification email, account is
  live immediately. 409 if the username is taken.
- **Log in:** username + password. 401 with the *same* problem detail for unknown user and wrong
  password (no user enumeration via login).
- **Passwords:** hashed with `node:crypto` scrypt (per-user random salt, `timingSafeEqual`
  compare) — zero new dependencies. The hash never leaves the server: the shared `User` type is
  the public shape; the store record privately adds `passwordHash`.
- **Per-tab sessions:** JWT kept in `sessionStorage` (per-tab by nature) → two tabs, two users.
- **Todos (per user):** add (title + optional comma-separated tags), toggle done, delete, tag
  chips on each item; click a chip to filter by tag, click again to clear. Clean minimal styling,
  single small CSS file, system fonts.

## 3. API (all JSON; errors are RFC7807 `application/problem+json`; success bodies `{ data: … }`)

| Method & path | Auth | Body | Result |
|---|---|---|---|
| `POST /v1/auth/signup` | – | `{username, password, email?}` | 201 `{user, token}`; 409 taken |
| `POST /v1/auth/login` | – | `{username, password}` | 200 `{user, token}`; 401 bad credentials |
| `GET /v1/me` | Bearer | – | 200 `{user}` |
| `GET /v1/todos` | Bearer | – | 200 `{todos}` (owner's only) |
| `POST /v1/todos` | Bearer | `{title, tags?}` | 201 `{todo}` |
| `PATCH /v1/todos/:id` | Bearer | `{title?, done?, tags?}` | 200 `{todo}`; 404 if missing/not owner |
| `DELETE /v1/todos/:id` | Bearer | – | 204 |
| `GET /healthz` | – | – | 200 |
| `GET /openapi.json`, `GET /docs` | – | – | generated OpenAPI + UI |

Tokens: `@fastify/jwt`, payload `{sub: userId, username}`, dev-default secret from config.
Persistence: `packages/server/data/{users,todos}.json` (gitignored) — in-memory Map, atomic
writes (tmp file + rename), prefixed ids (`usr_…`, `todo_…` via `crypto.randomUUID`).

## 4. File layout (target)

```
packages/shared/src/
  index.ts              hello() stays; + User, Todo types, USERNAME_PATTERN
packages/server/src/
  main.ts               entry: envConfig() → buildApp → listen(3001) + graceful shutdown
  app.ts                buildApp(config): ajv, jwt + authenticate, swagger, error handler,
                        routes, static web (prod)
  config.ts             AppConfig + envConfig() (PORT, JWT_SECRET, DATA_DIR — dev defaults)
  lib/problem.ts        RFC7807 helper + central error handler
  lib/store.ts          tiny JSON-file store factory (load, Map, atomic save)
  lib/password.ts       scrypt hash + timing-safe verify (node:crypto, no deps)
  auth/routes.ts        signup / login / me (+ inline JSON schemas)
  todos/routes.ts       CRUD (+ inline JSON schemas)
  types/fastify-jwt.d.ts ambient typing for request.user (freud pattern)
  app.test.ts           node:test + app.inject(), mkdtemp data dirs (happy pattern)
  smoke.test.ts         real listen + undici request()
packages/web/src/
  main.tsx  app.tsx  api.ts  styles.css   (main.ts deleted; index.html → /src/main.tsx)
```

## 5. Phases (each independently shippable, gates green after each)

### Phase 0 — fix the broken gates (prereq, tiny)
1. `paths` `"../shared/src"` → `"../shared/src/index.ts"` in `packages/{server,cli}/tsconfig.json`
   (fixes the 2 shipped lint errors; web keeps Bundler resolution, unaffected).
2. Root `typecheck` → `tsc -b` (order-independent; option (a) from the kaizen plan).
**Accept:** `npm run clean && npm run lint && npm run typecheck` green in any order.

### Phase 1 — server skeleton + test harness
`config.ts`, `app.ts` (`buildApp`), `main.ts`, `lib/problem.ts`, ajv validator-compiler,
swagger + `/docs`, `/healthz`. Test scripts: server `"test": node --import tsx --test`
(exact invocation verified against Node 20), root `"test": npm run -ws --if-present test`.
First tests: healthz via inject; smoke via undici. Add `packages/server/data/` to `.gitignore`.
**Accept:** `npm test` green; `curl :3001/healthz` and `/docs` work under `npm run dev:server`.

### Phase 2 — accounts + JWT (TDD)
`lib/store.ts`, `lib/password.ts`, user store, `auth/routes.ts` (signup/login/me),
`authenticate` decorator, `fastify-jwt.d.ts`. Tests: signup (with/without email), duplicate →
409 problem+json, weak password / bad email → 400, login, unknown user and wrong password →
identical 401, `passwordHash` never appears in any response body, me with/without token,
persistence across app restarts (same temp dir).
**Accept:** full signup→login→me flow via curl; tests green.

### Phase 3 — todos with tags (TDD)
Todo store + `todos/routes.ts`, owner-scoping enforced in every handler. Tests: CRUD, tags
round-trip, 404 on another user's todo, 401 without token, validation errors → 400 problem+json.
**Accept:** two users' todos isolated (test-proven); OpenAPI shows all routes.

### Phase 4 — preact web UI + prod static serving
Auth screen with login/signup toggle — login: username + password; signup: username, optional
email, password + confirm (submit blocked until the two match, mismatch shown inline). Todo list
with tags + tag-filter, `sessionStorage` token, logout;
`api.ts` fetch wrapper (Bearer header, problem+json → thrown messages); drop `preact-iso`;
`@fastify/static` serves `web/dist` when built (SPA fallback for non-`/v1` GETs).
**Accept:** `npm run dev:app` → sign up in tab A, tab B as another user, both see only their own
todos; `npm run build && npm run start:server` serves the same app on :3001.

### Phase 5 — docs truth
README: what the app is, command table, API table, per-tab-session note, auth model note
(scrypt, no email verification); regenerate anything stale. Mark Phase 2 of the 2026-07-06 plan
superseded (pointer to this plan).
**Accept:** README describes only what exists; a newcomer can run the app from README alone.

## 6. Out of scope (deliberate)
Email verification / password reset, refresh tokens, on-disk versioned schema registry,
optimistic concurrency (409 versions), CLI todo commands, CI/LICENSE/copy.sh fixes (still
Phases 1/3/4 of the 2026-07-06 plan). Each has a clean seam if wanted later.

## 7. Verification standard (per asimov-happy review checklist)
After every phase: `npm run clean && npm ci`-equivalent fresh gates (`lint`, `typecheck`,
`build`, `test`) green; behavior exercised end-to-end (curl / browser); diffs focused.
