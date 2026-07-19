# minimal-npm-workspace

A minimal npm-workspace scaffold (`server` / `web` / `cli` / `shared`) that ships as a small
**working app**: multi-user todos with tags. Pick a username, set a password, go — no email
verification. Each browser tab can be logged in as a different user.

Meant as a starting point for coding agents (and humans): the wiring is real, small, and tested.
Agent-facing working rules (verification order, kaizen approach, conventions) live in
[`AGENTS.md`](AGENTS.md); [`FEATURES.md`](FEATURES.md) indexes every pattern the scaffold
demonstrates and where to find it.

## Quick start

```
git clone git@github.com:asimov-hq/minimal-npm-workspace.git
cd minimal-npm-workspace
npm install
npm run dev:app
```

Open http://localhost:8989 — vite serves the preact app and proxies `/v1` to the fastify server
on port 3939. API docs live at http://localhost:3939/docs. `dev:app` picks the API port before
starting anything: it prefers 3939 (override with `API_PORT`), and if that's taken it falls
back to a free port and points the proxy there automatically — no crash, no collision with
sibling projects. Watch the `[dev]` line for the chosen port. Vite likewise auto-bumps its own
UI port if 8989 is busy.

Production-style, one process:

```
npm run build
npm run start:server   # fastify serves the built web app AND the API on :3939
```

## Commands

| command | what it does |
|---|---|
| `npm run dev:app` | server + web with hot reload (`scripts/dev.mjs`; auto-picks a free API port) |
| `npm run dev:server` / `dev:web` / `dev:cli` | one package in dev mode |
| `npm run build` | compile all packages + bundle the web app |
| `npm test` | unit/integration tests (node:test via tsx, `app.inject()` + one real-socket smoke test) |
| `npm run test:e2e` | headless-browser e2e (two tabs = two users); needs `npm run build` + `npx playwright install chromium` once |
| `npm run smoke:copy` | copy the template to a temp dir and run all gates there |
| `npm run typecheck` | `tsc -b` over the project-references graph |
| `npm run lint` | eslint with typed rules |
| `npm run clean` | remove build artifacts |

## The app

- **Sign up:** username (`a-z 0-9 - _`, 3–20 chars), optional email, password typed twice
  (min 8 chars). The account is live immediately — no verification email.
- **Log in:** username + password. Unknown user and wrong password get the same 401.
- **Per-tab sessions:** the JWT lives in `sessionStorage`, so two tabs can be two users.
- **Todos:** add with comma-separated tags, toggle, delete; click a tag chip to filter.
- **Themes:** dark (default), light, ocean, forest, volcano, violet northern lights —
  picker top right, persisted in `localStorage`. All styling flows through semantic CSS
  custom properties (`--surface`, `--accent`, …); a unit test fails if a color literal
  appears outside the token blocks, so the CSS stays theme-clean by construction.
- **Conflict-safe edits (optimistic concurrency):** every todo has an integer `version`;
  writes send the version they saw and get a 409 if someone else changed it first — try
  editing the same todo from two tabs. The UI reloads the list and asks you to retry.

## API

Success bodies are `{ "data": … }`; errors are RFC 7807 `application/problem+json`.
Explore it live at `/docs` (OpenAPI generated from the route schemas — never hand-written).

| method & path | auth | body |
|---|---|---|
| `POST /v1/auth/signup` | – | `{username, password, email?}` → 201, 409 if taken |
| `POST /v1/auth/login` | – | `{username, password}` → 200 |
| `GET /v1/me` | Bearer | → the authenticated user |
| `GET /v1/todos` | Bearer | → your todos; `?tag=…&done=…` filters |
| `GET /v1/todos/:id` | Bearer | → one todo (404 if not yours) |
| `POST /v1/todos` | Bearer | `{title, tags?}` → 201 (`version: 1`) |
| `PATCH /v1/todos/:id` | Bearer | `{title?, done?, tags?, version}` → 200; **409 if stale** |
| `DELETE /v1/todos/:id?version=…` | Bearer | → 204; **409 if stale** |
| `GET /healthz` | – | liveness |

## Admin CLI

`packages/cli` is a small admin tool over the server's data files (build first, or use
`npm run dev:cli --`):

```
npx asimov users                                    # list all users
npx asimov todos alice --tag home                   # a user's todos, filtered by tag
npx asimov todos alice --open                       # only unfinished (--done for finished)
npx asimov remove-user bob                          # delete a user AND their todos
```

`--data-dir <dir>` (or `DATA_DIR`) selects the data directory. The server keeps data in
memory — stop it before `remove-user`, or restart it afterwards.

## Server notes

- fastify 5 with an `authenticate` decorator (`@fastify/jwt`); protected routes 401 with
  problem+json when the bearer token is missing or bad
- request validation via ajv + ajv-formats (`setValidatorCompiler`), schemas inline on routes
- passwords are scrypt-hashed (`node:crypto`, per-user salt, timing-safe compare) and never
  leave the server
- persistence is JSON files in `data/` at the workspace root (in-memory map, atomic
  tmp+rename writes) — delete the directory to reset. The location is resolved by walking up
  to the `package.json` with a `workspaces` field, then: `DATA_DIR` env >
  `"config": {"dataDir": …}` in the root package.json > `data/`. Server and CLI share the
  resolver, so they always agree. Data is untracked by design; `git add -f data/todos.json`
  if you ever want a snapshot in history (never commit real accounts — `users.json` holds
  password hashes)
- config via env: `PORT` / `API_PORT` (3939), `HOST` (127.0.0.1), `JWT_SECRET` (**dev
  default — set your own in anything real**), `TOKEN_TTL` (`7d`), `DATA_DIR` (see above)
- demo-scope auth, on purpose: logout is client-side only (a token stays valid until
  `TOKEN_TTL` runs out — there is no revocation list) and login has no rate limiting.
  Anything real needs both.

## How the TypeScript wiring works

This is the template's one non-obvious part. Each package has up to three tsconfigs:

| file | used by | key idea |
|---|---|---|
| `tsconfig.json` | editor, `tsx` dev, eslint | `paths` maps workspace imports to **source** (`../shared/src/index.ts`), so dev and linting need no prebuild |
| `tsconfig.build.json` | `npm run build` / `tsc -b` | empties `paths` (`{}`), so builds resolve workspace imports through node_modules to the **built** `dist` types; excludes test files |
| `tsconfig.dev.json` | `npm run dev:ts` | `noEmit` watch variant for a fast type-checking loop |

The root `tsconfig.json` is the `tsc -b` build graph (referencing each package's build
config); the root `tsconfig.dev.json` is the watch graph. `shared` imports nothing from the
workspace, so its build config has no `paths` to empty — it exists only to exclude the test
files from `dist`. `web`'s build config uses `emitDeclarationOnly` because composite projects
must emit *something* to participate in `tsc -b`; vite does the real bundling.

The same dev/build split powers the CLI's import of the server's store:
`@asimov/server/store` resolves to `../server/src/lib/store.ts` in dev (`paths`) and
to `dist/lib/store.js` in builds (the server's `exports` map) — one persistence
implementation, no duplication.

## Workspace highlights

* minimal, clean setup for server, web, cli and shared packages
* npm workspaces + TypeScript project references; strict base tsconfig; typed linting
* one `shared` package consumed by server, web, and cli (types + code)
* vite for the frontend (it is best by test)
* preact minimizes vanilla HTML/CSS code bloat since components can be extracted and reused
* blazing fast startup and hot reload time in dev mode
* blazing fast build time

## Possible applications

* **scaffold for your coding agents** — auth, validation, docs, tests and persistence patterns
  are already in place; agents extend instead of inventing
* scaffold for your 100% hand typed artisan organic ts project ;)
* learn about npm workspaces (that was my motivation in creating this)

## Copy it

`copy.sh` copies every git-tracked file (via `git ls-files`) except the template-local
`docs/`, `README.md`, and `LICENSE` — so the copy always matches the repo, build artifacts
never sneak in, and `AGENTS.md` + all configs come along. `npm run smoke:copy` proves the
copy passes all gates on its own (CI runs it too). After copying, follow the
**After copying the template** checklist in [`AGENTS.md`](AGENTS.md) (rename the scope, adapt
ports, set a real `JWT_SECRET`, …).

```shellsession
me@alpaca minimal-npm-workspace % ./scripts/copy.sh ../my-awesome-new-project
Copied files:
  - .github/workflows/ci.yml
  - .gitignore
  - AGENTS.md
  - eslint.config.js
  - package.json
  - packages/… (all package sources and configs)
  - scripts/copy.sh
  - tsconfig.base.json …
me@alpaca minimal-npm-workspace % cd ../my-awesome-new-project
me@alpaca my-awesome-new-project % claude
```
