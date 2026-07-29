# Performance / Heap Trash Flow

Use this flow when you are evaluating a performance optimization or a heap-churn reduction
attempt in the DevApp or related high-frequency paths.

The point is not just to collect numbers. The point is to decide whether the change actually
improved the system enough to keep it.

## Record Location

Do **not** append new entries to [2026-05-30--heap-churn-diary.md](/home/wizard/projects/asimov/asimov-happy/docs/progress/2026-05-30--heap-churn-diary.md:1).

That file is now historical archive only.

From now on, record new performance investigations here:

- `docs/progress/performance/<year>/<month>/<timestamp>--<tag>.md`

Example:

- `docs/progress/performance/2026/06/2026-06-04T08-15-00Z--monitoring-toolbar-phase-local-benchmark.md`

Each progress note should be standalone and should include:

- what changed
- why the change was attempted
- exact commands run
- raw or summarized benchmark output
- interpretation
- keep/revert decision

## Baseline-Then-Experiment Rule

Always measure in this order:

1. capture a baseline before changing code
2. make one narrow optimization or experiment
3. rerun the same measurements
4. compare baseline vs result
5. keep the change only if the comparison is meaningfully better or structurally necessary

If the result is flat, noisy, inconclusive, or worse, revert the experiment unless there is a
strong separate reason to keep it.

## Commands

Run from `code/v001`.

**Run benchmark commands one at a time, never in parallel.** Each benchmark spawns a Chromium
browser, a Vite server, and a Fastify server. Running two benchmarks simultaneously causes them
to compete for CPU and memory, producing inflated allocation numbers and unreliable timing.
Always wait for one command to finish before starting the next.

Core regression and phase-local benchmark set:

```bash
npm run bench:devapp:assert
npm run bench:devapp
npm run bench:devapp:monitoring
```

Deeper timing and scaling:

```bash
npm run bench:devapp:timing
npm run bench:devapp:scaling
```

Smart-pick hover benchmark:

```bash
npm run bench:devapp:smart-pick
```

This runs a 2 s hover sweep with the smart-pick tool active, using the full canonical harness
(isolated Vite server, CDP heap profiling, constructor counts, DOM mutations). Use it before
and after any optimization that touches `smart-pick.ts`, `tools.ts`, or the `resolvePreviewAtCell`
→ `readActiveGrid` call chain.

Hot-path and allocation-attribution tools:

```bash
npm run bench:devapp:circle-drag:slow
npm run bench:devapp:circle-drag:fast
npx tsx scripts/profile-devapp-circle-drag-allocations.ts
```

### `e2e/tool-preview-perf.mjs` — lightweight sanity check only

`code/v001/e2e/tool-preview-perf.mjs` is a lightweight Playwright script that connects to an
already-running `npm run dev:app` server. It measures heap MB, canvas count, DOM mutation rate,
and constructor Proxy counts across four passes (circle brush + smart-pick, stopped + active).

**It is not a substitute for the canonical harness.** It lacks CDP heap sampling, so it
produces no `allocBytesTotal` or `allocBytesPerSec`. The `performance.memory` heap delta is the
weakest metric (GC-dependent). Use it for quick interactive investigation or to cross-check a
result, not as the progress-note harness.

For canonical smart-pick measurements, use `npm run bench:devapp:smart-pick`.

### Machine Profiles

Record the machine model or a stable machine identifier in every performance note. Compare
results only when the machine, benchmark profile, command, and relevant app state match.

The targeted circle-drag benchmark has two named profiles:

- `slow`: `256x256@8`, `512x512@4`, and `1024x1024@2`
- `fast`: `512x512@4`, `1024x1024@2`, and `2048x2048@1`

Use `slow` on older laptops, thermally constrained systems, virtual machines, or systems where
the `2048x2048` scenario makes iteration impractically long. Use `fast` on machines that can
complete the larger scenario reliably.

Do not compare a slow-profile run directly with a fast-profile run. Shared scenarios may be
compared only when all other comparison conditions match.

`ASIMOV_BENCH_SCENARIOS` remains available for an explicitly documented custom scenario list and
takes precedence over the named profile. Custom runs are not substitutes for a named-profile
baseline.

Verification before handoff:

```bash
npm run build
npm run lint
```

## What The Metrics Mean

### Primary decision metrics

These are the metrics that should drive optimization decisions first:

1. `allocBytesTotal`
2. `allocBytesPerSec`
3. `domMutations`
4. phase-local timing:
   - `simMsAvg`
   - `compositeMsAvg`
   - `frameBodyMsAvg`

### Supporting metrics

These help interpret the result but should not dominate the decision on their own:

- `constructorAllocations`
- `stepsTotal`
- `framesCollected`
- `topAllocators`
- `usedHeapBytes` delta

### Weakest metric

`usedHeapBytes` delta is the weakest performance signal here.

Reason:

- GC timing can make it go positive, flat, or negative without reflecting true allocation pressure

Use it as context, not as the primary reason to keep or reject an optimization.

## How To Judge A Result

### Keep the optimization when

- `allocBytesTotal` or `allocBytesPerSec` goes down in a repeatable way
- `domMutations` go down or stay at zero
- timing gets better without regressions elsewhere
- the improvement is consistent across repeated runs
- the code remains kaizen-clean

### Revert the optimization when

- gross allocation metrics do not improve
- timing is flat or worse
- the result only looks better because `stepsTotal` or `framesCollected` collapsed
- the measurement window is contaminated by startup/reload turbulence
- the code gets more complex without measurable benefit

### Mark the result inconclusive when

- the metrics move in opposite directions
- the sample counts differ too much to compare honestly
- a startup effect, toolbar transition, or runtime settle issue likely polluted the phase
- a one-off allocator sample cannot be reproduced in follow-up runs

Inconclusive results should not justify keeping speculative optimization code.

## Comparison Checklist

Before trusting a comparison, verify:

- same machine
- same machine profile
- same benchmark script
- same phase
- same relevant app state
- similar `stepsTotal`
- similar `framesCollected`
- no startup or dependency re-optimize reload during the measured window

If those conditions do not hold, the comparison is not good enough.

## Recommended Workflow For One Optimization Attempt

1. Describe the target.
   Example: “reduce monitoring HUD hover-path churn.”

2. Capture baseline.
   Run the narrowest relevant benchmark set first.

3. Save a progress note.
   Create a new file in `docs/progress/performance/<year>/<month>/...`.

4. Make one narrow change.
   Avoid bundling unrelated cleanup with the experiment.

5. Rerun the same benchmark set.
   Use the same commands and same route state where possible.

6. Compare the primary metrics first.
   Gross allocation and DOM/timing come before net heap delta.

7. Decide:
   - keep
   - revert
   - inconclusive, investigate measurement first

8. Record the decision in the progress note.

## Notes For Agents

- Do not optimize based on intuition alone.
- Do not report “improvement” from timing numbers if the phase boundaries differ.
- Do not report “heap improvement” from net heap delta alone.
- Prefer one clean experiment over multiple overlapping tweaks.
- If the benchmark itself is suspect, fix the benchmark first.
