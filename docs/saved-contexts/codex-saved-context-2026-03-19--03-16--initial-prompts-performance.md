# Saved Context

## Repo

- Workspace: `/Users/wizard23/projects/asimov/minimal-npm-workspace`
- Main frontend file right now: `packages/web/src/main.ts`

## Current Product State

The frontend is a small browser driving demo inspired by Micro Machines:

- raw WebGL rendering
- keyboard controls
- HTML Gamepad API support
- simple top-down arcade vehicle handling
- HUD
- collapsible performance monitor in the top right

There is now also a simple frontend route system using hash routes:

- `#/` = game view
- `#/settings` = settings view

The settings route currently allows the user to select a UI theme.

## Current Theme Support

Themes apply to UI only, not to the game rendering itself.

Available themes:

- dark
- light
- ocean
- forest
- volcano
- purple
- turquoise
- orange
- navy
- army
- air force

Theme selection is persisted in `localStorage`.

## Performance Monitor State

The FPS monitor was corrected so:

- `FPS` uses real `requestAnimationFrame` cadence
- `Frame` shows real frame interval in ms
- `Input CPU`, `Physics CPU`, `Render CPU`, `Resize CPU` are CPU-side timings

## Important Recent Finding

After adding the themed settings route, the user reported a noticeable framerate drop.

Do not assume the root cause is the theme logic itself.

Current root cause analysis:

1. The app still fully simulates and renders the game every frame, even while on the settings route.
2. `hud.innerHTML` is rebuilt every frame.
3. `perfBody.innerHTML` is rebuilt every frame.
4. The UI now has more styled floating panels.
5. Multiple UI surfaces use `backdrop-filter: blur(...)`, which is likely expensive over a constantly changing WebGL canvas.

Most likely ranking:

1. `backdrop-filter`
2. repeated DOM replacement via `innerHTML`
3. full game loop still running under the settings overlay
4. extra layout/paint/compositing from the added UI

No performance fix has been implemented yet after this analysis.

## Verification Workflow

This repo has an explicit required verification order.

After code changes always run:

1. `npm run build`
2. `npm run lint`

Rules:

- If `build` fails, fix it before running `lint`.
- If `lint` fails, fix it and then rerun `build` and `lint` in order if the code changed again.
- Do not stop before both are clean.

This was explicitly requested by the user and is documented in `AGENTS.md`.

## Known Execution Note

In this environment, `npm run build` and `npm run lint` may need escalated permissions because they write:

- TypeScript build outputs
- Vite build outputs
- `.eslintcache`

Do not skip verification because of sandbox write errors. Rerun with the needed permissions.

## Files Of Interest

- `AGENTS.md`
- `packages/web/src/main.ts`

## Likely Next Task

The likely next step is to optimize the new UI/settings implementation without changing product behavior.

Most promising areas to inspect first:

1. eliminate or reduce `backdrop-filter`
2. stop updating HUD/perf DOM with `innerHTML` every frame
3. pause or reduce simulation/render cost when on `#/settings`
4. separate UI updates from the render loop where possible
