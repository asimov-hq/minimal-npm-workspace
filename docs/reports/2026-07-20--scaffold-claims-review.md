# Scaffold Claims Review

Date: 2026-07-20

## Scope

This report reviews the claim that this repository is a near-perfect scaffold for coding
agents and a good example of a TypeScript npm workspace application. The review focused on
the current checkout as an implementation artifact: workspace structure, validation, API
boundaries, auth, persistence, tests, docs, and copy workflow.

No code changes were made.

## Summary

The scaffold is strong. It demonstrates a real server/web/cli/shared npm workspace, strict
TypeScript wiring, generated OpenAPI, route validation, RFC 7807 errors, auth scoping,
JSON persistence, browser-driven e2e coverage, and a copy smoke test. The core "good
scaffold" claim is supported by the current implementation and verification results.

The "perfect scaffold" claim is not supported. There are a few concrete flaws that matter
because agents are expected to copy and extend the patterns. The most important is a
write-order race in the JSON store. There are also boundary and documentation issues that
are small individually but weaken the repository as an architecture reference.

## Verification Performed

The required gates were run from the repository root in order:

```shell
npm run lint
npm run typecheck
npm run build
npm test
```

All four passed.

Additional checks:

```shell
npm run test:e2e
npm run smoke:copy
```

Both passed.

A focused concurrency probe against `createStore()` reproduced a stale final on-disk
snapshot after overlapping writes. One run persisted 28 records when 30 had been set.

## Findings

### 1. JSON Store Writes Are Not Serialized

Severity: high

The store keeps collection state in a `Map` and writes a whole JSON file through
`tmp-file + rename` on each mutation. This is single-process, but it is not single-request.
Concurrent `set()` or `delete()` calls can start overlapping `save()` operations. The last
rename to finish wins, even if that save captured an older snapshot.

Relevant code:

- `packages/server/src/lib/store.ts`: `save()` builds and writes a full snapshot.
- `packages/server/src/lib/store.ts`: `set()` mutates the map, then awaits `save()`.
- `packages/server/src/lib/store.ts`: `delete()` mutates the map, then awaits `save()`.

Why this matters:

- The scaffold is explicitly a multi-user app.
- Agents will treat `createStore()` as the persistence pattern to extend.
- Atomic rename protects against partial files, but not against out-of-order saves.

Clean architecture recommendation:

Make the store responsible for its own write ordering. Route handlers should not need to
know that persistence is file-based or that writes must be queued.

Kaizen recommendation:

1. Add a failing regression test in `packages/server/src/lib/store.test.ts` that performs
   overlapping writes and asserts the final file contains the latest complete collection.
2. Add an internal write queue to `createStore()`, for example by chaining saves on a
   promise held inside the store closure.
3. Keep the public `Store<T>` interface unchanged.
4. Rerun `lint`, `typecheck`, `build`, and `test` in order.

Acceptance criteria:

- Overlapping mutations cannot leave an older snapshot on disk.
- Existing route and CLI code does not change.
- The store remains dependency-free and easy to replace later.

### 2. Closed Request Schemas Silently Strip Extra Fields

Severity: medium

Route schemas use `additionalProperties: false`, but Ajv is configured with
`removeAdditional: true`. In practice, unknown fields are accepted and removed rather than
rejected. For example, `POST /v1/auth/signup` with an extra `role` field returns `201`.

Relevant code:

- `packages/server/src/app.ts`: Ajv is configured with `removeAdditional: true`.
- `packages/server/src/auth/routes.ts`: signup uses `additionalProperties: false`.
- `packages/server/src/todos/routes.ts`: todo create/update schemas use
  `additionalProperties: false`.

Why this matters:

- Readers generally interpret `additionalProperties: false` as a rejection contract.
- The AGENTS.md guidance says validation happens in route schemas and handlers can trust
  `request.body`.
- Silent stripping is a valid policy only when it is explicit and tested.

Clean architecture recommendation:

Choose one validation policy and make it visible at the boundary. Either reject unknown
fields or document and test a "sanitize by stripping" policy.

Kaizen recommendation:

Preferred path:

1. Add regression tests asserting unknown body/query fields return `400`.
2. Remove `removeAdditional: true` from the global Ajv config.
3. Confirm current schemas are complete enough to pass existing app and e2e flows.

Alternative path:

1. Keep `removeAdditional: true`.
2. Rename the convention from "closed schemas reject extra fields" to "schemas sanitize
   extra fields".
3. Add tests proving extra fields are stripped and never reach handlers.

Acceptance criteria:

- The behavior matches the documented contract.
- Agent-facing instructions do not imply the opposite behavior.

### 3. Todo API Exposes Internal Ownership Shape

Severity: medium

The shared `Todo` type includes `ownerId`, and API responses return it. Auth/user handling
has a cleaner split: `UserRecord` is stored internally and converted to public `User`.
Todos do not have an equivalent public shape.

Relevant code:

- `packages/shared/src/todos.ts`: `Todo` includes `ownerId`.
- `packages/server/src/todos/routes.ts`: `todoSchema` requires and returns `ownerId`.
- `packages/server/src/todos/routes.ts`: route handlers return stored todos directly.

Why this matters:

- It leaks persistence and authorization detail into the public API.
- It gives agents an inconsistent pattern: users separate stored/public shape, todos do not.
- It makes later API changes harder because clients are coupled to internal ownership data.

Clean architecture recommendation:

Separate stored records from public API models. Ownership belongs in the persistence/domain
record; public todo responses should expose only fields the client needs.

Kaizen recommendation:

1. Introduce `TodoRecord` for stored data and `Todo` or `PublicTodo` for API/client data.
2. Add `toPublicTodo(record)` next to todo route registration or in a small domain mapper.
3. Update route response schemas to omit `ownerId`.
4. Keep owner scoping in handlers exactly where it is.
5. Update CLI types if it needs stored records for admin operations.

Acceptance criteria:

- API responses no longer include `ownerId`.
- Owner scoping behavior and 404-for-foreign-record behavior remain unchanged.
- Shared client types represent public API contracts, not storage records.

### 4. Node Version Contract Is Looser Than CI Coverage

Severity: low to medium

The root package declares Node `>=22`, the devcontainer is Node 22, CI runs Node 24, and
dev dependencies include `@types/node` 25. This can allow code to typecheck against APIs
that are not available on the documented minimum runtime.

Relevant code:

- `package.json`: `"engines": { "node": ">=22" }`
- `.github/workflows/ci.yml`: CI uses Node 24.
- `package.json`: `@types/node` is version 25.
- `README.md`: devcontainer is described as Node 22.

Why this matters:

- Scaffolds are often copied into long-lived projects.
- Runtime support should be boring and explicit.
- Agents may add code that typechecks locally but fails under the documented minimum.

Clean architecture recommendation:

Make the runtime contract a single explicit project constraint and verify it in CI.

Kaizen recommendation:

1. Decide the minimum supported Node version: Node 22, 24, or current LTS.
2. Pin `@types/node` to the matching major version.
3. Run CI against the minimum version. Optionally also run the latest supported version.
4. Update README and devcontainer text if the minimum changes.

Acceptance criteria:

- The version in `engines`, CI, devcontainer docs, and Node types agree.
- The minimum supported runtime is actually tested.

### 5. Documentation Counts Are Stale

Severity: low

`FEATURES.md` says the repository has 51 unit/integration tests and a 22-assertion browser
e2e suite. Current runs show 56 unit/integration tests and 28 e2e checks.

Relevant code:

- `FEATURES.md`: top-level coverage claim.
- `scripts/e2e-browser.mjs`: current e2e check list.

Why this matters:

- The stale numbers do not affect behavior.
- They do weaken trust in a document that is intended as an agent-facing index of truth.

Clean architecture recommendation:

Avoid hard-coded aggregate counts in durable docs unless a test updates or verifies them.

Kaizen recommendation:

1. Replace exact counts with qualitative language, or
2. Add a small docs guard that checks the count if exact numbers are considered important.

Acceptance criteria:

- `FEATURES.md` no longer goes stale from ordinary test additions.

## Strengths Worth Preserving

- The repository is a real working app, not a hollow template.
- Workspace boundaries are clear: `server`, `web`, `cli`, and `shared`.
- TypeScript project references and dev/build config separation are well documented.
- Server assembly through `buildApp(config)` makes tests straightforward.
- Route-level schemas and generated OpenAPI are the right direction.
- RFC 7807 error handling is centralized.
- Owner scoping and no-user-enumeration behavior are covered by tests.
- The CLI reuses the server store instead of duplicating persistence logic.
- The copy workflow is deterministic and verified by `smoke:copy`.
- Browser e2e coverage exercises meaningful user flows, including per-tab sessions and
  optimistic concurrency.

## Recommended Remediation Order

1. Fix the store write-order race.
2. Decide and enforce the unknown-field validation policy.
3. Split stored todo records from public todo API models.
4. Align Node runtime, CI, and type versions.
5. Remove or verify hard-coded documentation counts.

This order starts with correctness, then boundary clarity, then ecosystem hygiene, then
documentation polish. Each item can be reviewed independently and verified with the existing
gate sequence.

## Overall Assessment

The scaffold is a good example of a TypeScript npm workspace app. It is especially useful
for agents because it contains working examples of routing, validation, auth, persistence,
testing, UI, and copy verification.

It should not be called perfect. The persistence race is a real correctness issue, and the
validation/API boundary issues are exactly the kind of pattern drift that an agent-oriented
scaffold should avoid. After the first three remediation items, the repository would be much
closer to the standard implied by its own AGENTS.md.
