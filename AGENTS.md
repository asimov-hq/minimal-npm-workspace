# AGENTS.md

## Purpose

This repository uses a strict change-and-verify workflow.

When making code changes, do not stop after editing code. Validate the workspace in the same order CI expects, fix errors, and only then hand off.

## Required Verification Order

After making code changes, run these commands in this exact order:

1. `npm run build`
2. `npm run lint`

Rules:

- If `npm run build` fails, fix the errors before running `npm run lint`.
- Only run `npm run lint` after `npm run build` succeeds.
- Do not report success on code changes unless both commands succeed.

Exception:

- Documentation-only changes do not require `npm run build` or `npm run lint`.

This is the default verification method for future changes in this repo.

## CI Failure Handling

If CI reports a failure:

1. Reproduce it locally with `npm run build`.
2. Fix build errors first.
3. Re-run `npm run build`.
4. After build passes, run `npm run lint`.
5. Fix lint errors if present.
6. Re-run `npm run lint` until clean.

## Sandbox / Local Execution Notes

Some commands in this workspace may need permission to write build artifacts or cache files.

Known examples:

- `npm run build`
  - may need to write TypeScript build output such as `.tsbuildinfo` and `dist-types`
- `npm run lint`
  - may need to write `.eslintcache`

If a verification command fails because of filesystem permission restrictions rather than code issues, rerun the same required command with the needed write permissions. Do not skip the command.

## Current App Direction

The current `packages/web` app is a small browser driving demo with:

- a raw WebGL renderer
- keyboard controls
- HTML Gamepad API support
- simple top-down Micro Machines-inspired handling
- a small HUD
- a compact obstacle course with ramps, walls, and checkpoints

This app currently lives in:

- `packages/web/src/main.ts`

## Product Direction

The broader project direction established so far is:

- first ship a fun, simple browser vehicle demo
- keep the implementation understandable and lightweight
- use vanilla browser APIs where practical
- keep physics/game feel responsive and arcade-friendly
- leave room to evolve toward a more XPBD-inspired rover/car simulation later

For now, playability and CI cleanliness take priority over deeper physics complexity.

## Implementation Style

When updating the web demo:

- prefer clear, direct code over premature abstraction
- keep the app runnable in the browser with minimal setup
- preserve keyboard and gamepad parity
- avoid breaking the existing verification flow

If the file grows further, the next logical refactor is to split `packages/web/src/main.ts` into modules such as:

- `input`
- `physics`
- `render`
- `track`

## Definition Of Done

A code change is not done until:

- the requested code changes are implemented
- `npm run build` succeeds
- `npm run lint` succeeds
- any CI-relevant issues found during that process are fixed

For shared naming and project conventions, also see `README.md`.
