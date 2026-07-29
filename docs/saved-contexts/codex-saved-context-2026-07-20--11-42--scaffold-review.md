# Saved Context: Minimal npm Workspace Scaffold Review

Date: 2026-07-20 11:42 Europe/Vienna

## Current Task

The user asked for a critical review of this repository as a minimal npm workspaces scaffold for coding agents:

- Does everything work?
- Is it a good scaffold?
- Does it promote good architecture?

No code fixes were requested yet. The last completed assistant response was a review summary with verification results and prioritized findings.

## Repository Context

Workspace root:

```text
/home/wizard/projects/asimov/minimal-npm-workspace
```

Important repo instructions are in `AGENTS.md`. Key constraints:

- Extend existing patterns instead of inventing new ones.
- Required verification order after code changes:
  1. `npm run lint`
  2. `npm run typecheck`
  3. `npm run build`
  4. `npm test`
- Documentation-only changes are exempt.
- Server behavior changes should follow TDD with `node:test` and `app.inject()`.
- Errors use RFC 7807 `application/problem+json`.
- Success bodies are enveloped as `{ "data": ... }`.
- OpenAPI is generated from route schemas.
- Protected routes use `preHandler`/`onRequest` auth and owner-scope data.
- JSON persistence lives in `packages/server/src/lib/store.ts`.

## What Was Reviewed

Files and areas inspected:

- Root workspace config: `package.json`, `tsconfig*.json`, `eslint.config.js`
- README and scaffold/copy docs
- Server:
  - `packages/server/src/app.ts`
  - `packages/server/src/auth/routes.ts`
  - `packages/server/src/todos/routes.ts`
  - `packages/server/src/lib/store.ts`
  - `packages/server/src/lib/problem.ts`
  - `packages/server/src/lib/workspace.ts`
  - server tests
- Web:
  - `packages/web/src/app.tsx`
  - `packages/web/src/api.ts`
  - `packages/web/vite.config.ts`
  - style/theme tests
- CLI:
  - `packages/cli/src/commands.ts`
- Scaffold copy/CI:
  - `scripts/copy.sh`
  - `scripts/copy-smoke.sh`
  - `.github/workflows/ci.yml`

## Verification Already Run

The worktree was clean before the saved-context file was created.

Required gates:

```text
npm run lint       -> passed
npm run typecheck  -> passed
npm run build      -> passed
npm test           -> initially failed in sandbox due to localhost bind EPERM,
                      passed when rerun with permission to bind 127.0.0.1
```

Extra verification:

```text
npm run test:e2e     -> passed
npm run smoke:copy   -> passed
```

Important detail: `npm test` includes a real-socket smoke test at `packages/server/src/smoke.test.ts`. In this managed sandbox it failed with:

```text
Error: listen EPERM: operation not permitted 127.0.0.1
```

After rerunning with elevated permission, all tests passed.

## Review Verdict Already Given

Overall verdict:

- The scaffold works.
- It is a good scaffold overall.
- It promotes mostly good architecture:
  - small workspace packages (`server`, `web`, `cli`, `shared`)
  - strict TS
  - route-level validation
  - generated OpenAPI
  - central problem+json errors
  - owner-scoped data
  - temp data dirs in tests
  - copy smoke proving a fresh copied scaffold passes gates
  - e2e coverage for per-tab sessions and stale-write conflict flow

Main caveat:

- The persistence pattern has concurrency issues and should be fixed before calling the scaffold excellent, because scaffold code teaches future agents how to build.

## Findings To Carry Forward

1. Medium: JSON store writes are not serialized.

   File: `packages/server/src/lib/store.ts`

   Relevant area:

   - `createStore`
   - `entries` `Map`
   - `save()`
   - `set`
   - `delete`

   Problem:

   - `set`/`delete` mutate the in-memory map and then asynchronously write the whole collection.
   - Concurrent writes can interleave. An older snapshot may rename after a newer snapshot and leave stale data on disk.
   - This is especially bad in a scaffold because it models an unsafe persistence pattern.

   Likely fix:

   - Add per-store write serialization, probably with a promise queue.
   - Better yet, expose a transactional/mutation helper so read-check-write sequences can be serialized too.

2. Medium: username uniqueness has a race.

   File: `packages/server/src/auth/routes.ts`

   Relevant area:

   - `findByUsername(users, username)` before password hashing
   - `await hashPassword(password)`
   - `await users.set(record.id, record)`

   Problem:

   - Two concurrent signups for the same username can both pass the uniqueness check before either write completes.
   - Users are keyed by random id, so the store does not naturally enforce unique usernames.

   Likely fix:

   - Solve together with store-level transaction support.
   - A signup should perform "check username and insert user" as one serialized operation.
   - Alternative: key users by username, but that has wider model/API implications because user ids are currently random `usr_...`.

3. Low: browser API boundary uses unchecked casts.

   File: `packages/web/src/api.ts`

   Relevant area:

   - `const json: unknown = await res.json()`
   - cast to `ProblemBody`
   - cast to `Envelope<T>`

   Problem:

   - The client treats arbitrary JSON as trusted by cast.
   - The repo instructions emphasize narrowing `unknown` at trust boundaries.

   Likely fix:

   - Add small helpers like `problemMessageFromUnknown(json, fallback)` and `unwrapEnvelope<T>(json)`.
   - Keep it minimal; do not introduce a large schema-validation dependency unless the project direction calls for it.

4. Low: default `npm test` needs socket permission in restricted agent environments.

   File: `packages/server/src/smoke.test.ts`

   Relevant area:

   - `app.listen({ port: 0, host: "127.0.0.1" })`

   Problem:

   - Good test, but it can fail in sandboxes even when app behavior is correct.
   - This could confuse agents or users running the documented required gates.

   Likely fix:

   - Document in `AGENTS.md` that `npm test` may need permission to bind localhost.
   - Or split the real-socket smoke into a separate command if frictionless restricted-sandbox operation matters more than always-on socket verification.

## Suggested Next Step If Continuing

If the user asks to improve the scaffold, start with the store/username race because it is the most architectural and most scaffold-relevant issue.

Recommended implementation path:

1. Write failing tests first:
   - a store test showing concurrent writes persist the final state deterministically
   - an auth test showing concurrent duplicate signups result in exactly one success and one `409`
2. Add a store-level serialized mutation API, keeping the existing `get`, `values`, `set`, and `delete` API if possible for minimal churn.
3. Refactor signup to use the serialized mutation path for check-and-insert.
4. Run the required gates in order.
5. Consider the smaller API-boundary cleanup after the persistence fix.

## Command Permission Notes

Previously approved command prefixes in this session included:

- `npm test`
- `npm run test:e2e`
- `npm run smoke:copy`

In a new session these approvals may not carry over. If `npm test` fails with `listen EPERM`, rerun with escalation because the real-socket smoke test needs to bind `127.0.0.1`.
