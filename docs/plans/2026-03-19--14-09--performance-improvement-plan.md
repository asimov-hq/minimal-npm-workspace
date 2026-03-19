# Performance Improvement Plan

## Timestamp Format

Use this timestamp format for plan and saved-context filenames:

- `YYYY-MM-DD--HH-MM`

Meaning:

- single `-` separates date or time components
  - example: `2026-03-19`
  - example: `14-09`
- double `--` separates the date part from the time part
  - example: `2026-03-19--14-09`

Recommended full filename shape:

- `<YYYY-MM-DD--HH-MM>--<tags>.md`

Example:

- `2026-03-19--14-09--performance-improvement-plan.md`

## Goal

Improve frontend performance without changing the product direction:

- keep the raw WebGL driving demo
- keep the settings route
- keep theme selection
- keep the performance monitor

The immediate objective is to recover the framerate regression introduced by the heavier UI layer.

## Current Performance Risks

Known likely bottlenecks:

1. multiple `backdrop-filter: blur(...)` UI panels over a constantly changing WebGL canvas
2. rebuilding HUD HTML every frame with `innerHTML`
3. rebuilding performance monitor HTML every frame with `innerHTML`
4. running full simulation and rendering while on the settings route
5. extra style/layout/compositing cost from more UI elements

## Measurement First

Before optimizing, preserve and extend measurement quality.

Add or confirm measurements for:

- real frame time
- real FPS
- input CPU
- physics CPU
- render CPU
- UI update CPU
- route state
- whether settings are open
- number of DOM updates per frame

Important:

- distinguish CPU-side render submission from true frame rate
- avoid confusing labels

## Optimization Order

### Phase 1: Fastest High-Confidence Wins

1. Remove or reduce `backdrop-filter` on floating panels.
2. Replace per-frame `innerHTML` replacement with stable DOM nodes and text updates.
3. Stop updating HUD/perf content when values have not meaningfully changed.

Expected payoff:

- reduced paint/compositing cost
- reduced DOM churn
- lower main-thread work per frame

### Phase 2: Route-Aware Work Reduction

When on `#/settings`:

- pause or heavily reduce physics updates
- pause or reduce render frequency if possible
- avoid unnecessary HUD updates
- consider pausing gameplay entirely unless there is a reason to keep it live

Expected payoff:

- settings route becomes materially cheaper
- UI navigation no longer carries full game-loop cost

### Phase 3: UI Architecture Cleanup

Refactor the current single-file UI logic so UI updates are cheaper and easier to reason about.

Targets:

- separate HUD rendering from game rendering
- separate performance monitor rendering from frame loop
- update monitor on a slower cadence, for example 4-10 times per second
- avoid rebuilding settings UI after initial render

Expected payoff:

- less layout and style recalculation
- easier profiling of the remaining hotspots

### Phase 4: Simulation Efficiency

After UI/compositing fixes, reassess the game loop itself.

Check:

- whether `PHYSICS_SUBSTEPS = 10` is still justified
- whether collision checks can be reduced
- whether route state should influence simulation cadence
- whether some calculations can be skipped at very low speeds

Expected payoff:

- lower CPU cost in physics-heavy scenes

## Concrete Tasks

### Task Group A: Improve Instrumentation

- add `uiUpdateMs`
- count HUD updates
- count perf monitor updates
- log whether the current route is `game` or `settings`
- add a simple switch to compare blurred vs non-blurred panels

### Task Group B: Reduce UI Churn

- create fixed DOM nodes for HUD values
- create fixed DOM nodes for performance values
- update only text content
- stop rewriting whole panels every frame

### Task Group C: Reduce Settings Route Cost

- define expected behavior on settings route
- if live game is not required there, pause simulation
- if the background scene should remain visible, consider low-frequency rendering

### Task Group D: Re-test

After each change:

1. compare FPS on game route
2. compare FPS on settings route
3. compare CPU timings
4. check that controls, themes, and routing still work

## Acceptance Criteria

The performance work is successful when:

- game route framerate is back near pre-regression levels
- settings route is cheaper than game route
- FPS monitor still reports real FPS
- theme selection still works
- routing still works
- build and lint remain clean

## Verification Workflow

For code changes, always run:

1. `npm run build`
2. `npm run lint`

If one fails, fix it before moving on.

## Likely First Implementation Pass

The first pass should probably do only these three things:

1. remove or reduce `backdrop-filter`
2. stop using per-frame `innerHTML` updates for HUD and perf monitor
3. pause or throttle the game loop while on `#/settings`

That is the most likely path to recover a large portion of the lost frame rate quickly.
