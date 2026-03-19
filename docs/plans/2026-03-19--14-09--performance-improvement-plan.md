# Performance Improvement Plan

## Goal

Improve frontend performance without changing the product direction:

- keep the raw WebGL driving demo
- keep the settings route
- keep theme selection
- keep the performance monitor

The immediate objective is to recover the framerate regression introduced by the heavier UI layer.

Primary target:

- sustained `60 FPS`

## Current Performance Risks

Known likely bottlenecks:

1. multiple `backdrop-filter: blur(...)` UI panels over a constantly changing WebGL canvas
2. rebuilding HUD HTML every frame with `innerHTML`
3. rebuilding performance monitor HTML every frame with `innerHTML`
4. running full simulation and rendering while on the settings route
5. extra style/layout/compositing cost from more UI elements

## Measurement First

Before optimizing, preserve and extend measurement quality. Measurements must be concrete and repeatable.

### Required Core Measurements

Measure these separately:

- real FPS
- game engine / physics time
- render time

Additional measurements if useful:

- UI update time
- route state
- whether settings/editor UI is visible
- number of DOM updates per frame

Important:

- sample each scenario for at least `10 seconds`
- define results per scenario, not just single-frame snapshots
- avoid confusing labels

### Measurement Modes

We need to distinguish between:

1. real game mode
   - only the canvas remains
   - every additional DOM element is removed
   - main loop should have `0` DOM updates
   - performance monitor may exist only if it updates at a very low cadence
2. configure / track editor mode
   - additional DOM is allowed
   - this mode may carry more UI cost

### Baseline Test Scenarios

At minimum, record measurements for:

1. game mode, idle
2. game mode, driving
3. configure/settings mode open

For each scenario, sample at least `10 seconds` and record:

- average FPS
- average frame time
- average physics time
- average render time
- whether DOM updates occur in the main loop

### Improvement Criteria

An optimization counts as useful if it improves one or more of:

- average FPS
- average frame time
- average physics time
- average render time

without breaking behavior.

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

Concrete requirement:

- real game mode should have `0` DOM updates in the main loop

### Phase 3: UI Architecture Cleanup

Refactor the current single-file UI logic so UI updates are cheaper and easier to reason about.

Targets:

- separate HUD rendering from game rendering
- separate performance monitor rendering from frame loop
- update monitor on a slower cadence, defaulting to about once per second and making that configurable
- avoid rebuilding settings UI after initial render

Expected payoff:

- less layout and style recalculation
- easier profiling of the remaining hotspots

### Phase 4: Simulation Efficiency

After UI/compositing fixes, reassess the game loop itself.

Check:

- whether `PHYSICS_SUBSTEPS = 10` is still justified
- whether route state should influence simulation cadence
- whether some calculations can be skipped at very low speeds

Expected payoff:

- lower CPU cost in physics-heavy scenes

Priority note:

- collision-check reduction is low priority for now

## Concrete Tasks

### Task Group A: Improve Instrumentation

- add `uiUpdateMs`
- count HUD updates
- count perf monitor updates
- log whether the current route is `game` or `settings`
- add a simple switch to compare blurred vs non-blurred panels
- add a configurable monitor refresh interval

If useful and practical:

- try to distinguish CPU, GPU, and compositor cost

This is optional unless it helps reach `60 FPS`.

### Task Group B: Reduce UI Churn

- create fixed DOM nodes for HUD values
- create fixed DOM nodes for performance values
- update only text content
- stop rewriting whole panels every frame
- ensure real game mode has `0` DOM updates in the main loop

### Task Group C: Reduce Settings Route Cost

- define expected behavior on settings route
- if live game is not required there, pause simulation
- if the background scene should remain visible, consider low-frequency rendering
- distinguish clearly between pure game mode and configure/editor mode

### Task Group D: Re-test

After each change:

1. compare FPS on game route
2. compare FPS on settings route
3. compare CPU timings
4. check that controls, themes, and routing still work

These need to be real tests, not informal observation.

### Task Group E: Text Rendering Test

Write a focused test to measure the cost of text/UI updates.

Goal:

- determine whether repeated text updates are materially affecting frame rate even after removing `innerHTML` churn

### Task Group F: Perf Monitor Cost Control

- update the performance monitor only about once per second
- make the update cadence configurable
- ensure the monitor itself does not materially distort measurements

### Task Group G: Physics Performance Tests

Write one or more tests to measure physics cost directly.

Goals:

- measure the effect of `PHYSICS_SUBSTEPS = 10`
- compare multiple substep counts
- provide a basis for later optimization work

This should be treated as a real benchmark task, not guesswork.

### Task Group H: Correctness Regression Tests

Create real tests or repeatable checks for:

- route behavior
- theme persistence
- controls
- FPS monitor accuracy
- game feel / basic playability

Each performance change should be checked against these so speed improvements do not quietly break the app.

## Acceptance Criteria

The performance work is successful when:

- game route framerate is back near pre-regression levels
- settings route is cheaper than game route
- game mode has `0` DOM updates in the main loop
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
