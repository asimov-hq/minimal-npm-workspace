# minimal-npm-workspace

A minimal npm-workspace scaffold (`server` / `web` / `cli` / `shared`) that ships as a small
**working app**: multi-user todos with tags. Pick a username, set a password, go — no email
verification. Each browser tab can be logged in as a different user.

Meant as a starting point for coding agents (and humans): the wiring is real, small, and tested.

## Quick start

```
git clone git@github.com:asimov-hq/minimal-npm-workspace.git
cd minimal-npm-workspace
npm install
npm run dev:app
```

Open http://localhost:8888 — vite serves the preact app and proxies `/v1` to the fastify server
on port 3001. API docs live at http://localhost:3001/docs.

Production-style, one process:

```
npm run build
npm run start:server   # fastify serves the built web app AND the API on :3001
```

## Commands

| command | what it does |
|---|---|
| `npm run dev:app` | server + web with hot reload (concurrently) |
| `npm run dev:server` / `dev:web` / `dev:cli` | one package in dev mode |
| `npm run build` | compile all packages + bundle the web app |
| `npm test` | server tests (node:test via tsx, `app.inject()` + one real-socket smoke test) |
| `npm run typecheck` | `tsc -b` over the project-references graph |
| `npm run lint` | eslint with typed rules |
| `npm run clean` | remove build artifacts |

## The app

- **Sign up:** username (`a-z 0-9 - _`, 3–20 chars), optional email, password typed twice
  (min 8 chars). The account is live immediately — no verification email.
- **Log in:** username + password. Unknown user and wrong password get the same 401.
- **Per-tab sessions:** the JWT lives in `sessionStorage`, so two tabs can be two users.
- **Todos:** add with comma-separated tags, toggle, delete; click a tag chip to filter.

## API

Success bodies are `{ "data": … }`; errors are RFC 7807 `application/problem+json`.
Explore it live at `/docs` (OpenAPI generated from the route schemas — never hand-written).

| method & path | auth | body |
|---|---|---|
| `POST /v1/auth/signup` | – | `{username, password, email?}` → 201, 409 if taken |
| `POST /v1/auth/login` | – | `{username, password}` → 200 |
| `GET /v1/me` | Bearer | → the authenticated user |
| `GET /v1/todos` | Bearer | → your todos |
| `POST /v1/todos` | Bearer | `{title, tags?}` → 201 |
| `PATCH /v1/todos/:id` | Bearer | `{title?, done?, tags?}` |
| `DELETE /v1/todos/:id` | Bearer | → 204 |
| `GET /healthz` | – | liveness |

## Server notes

- fastify 5 with an `authenticate` decorator (`@fastify/jwt`); protected routes 401 with
  problem+json when the bearer token is missing or bad
- request validation via ajv + ajv-formats (`setValidatorCompiler`), schemas inline on routes
- passwords are scrypt-hashed (`node:crypto`, per-user salt, timing-safe compare) and never
  leave the server
- persistence is JSON files in `packages/server/data/` (in-memory map, atomic tmp+rename
  writes) — delete the directory to reset
- config via env: `PORT` (3001), `HOST` (127.0.0.1), `JWT_SECRET` (**dev default — set your
  own in anything real**), `DATA_DIR` (`data`)

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

```shellsession
me@alpaca minimal-npm-workspace % ./scripts/copy.sh ../my-awesome-new-project
Copied files:
  - .gitignore
  - tsconfig.base.json
  - package.json
  - packages/… (the template sources)
me@alpaca minimal-npm-workspace % cd ../my-awesome-new-project
me@alpaca my-awesome-new-project % claude
```
