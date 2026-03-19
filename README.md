# minimal-npm-workspace

## Project Conventions

### Verification Order

For code changes, run verification in this exact order:

1. `npm run build`
2. `npm run lint`

Rules:

- If `npm run build` fails, fix it before running `npm run lint`.
- Only run `npm run lint` after `npm run build` succeeds.
- Do not report success on code changes unless both commands succeed.

Exception:

- documentation-only changes do not require `npm run build` or `npm run lint`

### Documentation Locations

- plans go in `docs/plans/`
- saved contexts go in `docs/saved-contexts/`

### Timestamped Documentation Naming

For timestamped documentation files such as plans and saved contexts, use this format:

- `YYYY-MM-DD--HH-MM`

Examples:

- `2026-03-19--14-09`
- `2026-03-19--14-09--performance-improvement-plan.md`

Separator rules:

- single `-` separates parts within the date or within the time
  - `2026-03-19`
  - `14-09`
- double `--` separates the date section from the time section
  - `2026-03-19--14-09`

Recommended filename pattern:

- `<YYYY-MM-DD--HH-MM>--<tags>.md`

### Frontend Conventions

- themes apply to UI only, not the game rendering
- frontend hash routes currently use:
  - `#/` for the game view
  - `#/settings` for the settings view
