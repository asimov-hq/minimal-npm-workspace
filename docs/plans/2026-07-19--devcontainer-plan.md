# Plan: add a devcontainer (Node + Codex + Claude)

**Date:** 2026-07-19
**Goal:** a reproducible dev environment where "clone → Reopen in Container" gives you Node
(matching `engines`) plus the two agent CLIs — **Codex** and **Claude Code** — preinstalled,
so an agent-driven workflow works with zero host setup. This directly serves the scaffold's
mission ("agents start without long prompts") and is a *functional* asset a copy inherits.

## Reference: what asimov-happy's `.devcontainer/` does

`devcontainer.json` + `Dockerfile` + `devcontainer-lock.json`. The clean, reusable core:

- base image `mcr.microsoft.com/devcontainers/typescript-node:1-22-bookworm` (Node 22, Debian)
- `remoteUser: "node"` — non-root, so mounted-workspace files aren't root-owned
- `customizations.vscode.extensions` (eslint, spell-checker)
- global npm installs baked in the Dockerfile (`npm install -g …`)
- `postCreateCommand` to prep the shell

**Deliberately NOT copied** (all environment-specific to their setup):

- corporate proxy fixes (Squid `proxy.lstwien:8080`, `no_proxy`), OpenSSL `SECLEVEL`, SSH
  `Port 75` — local-network hacks
- `docker-outside-of-docker` feature + `happy-network-local` network + `runArgs --network`
  — they reach host DB/Testcontainers; we have none (JSON-file storage)
- `${localEnv:HOME} → /exchange` bind mount — host-specific convenience
- Antigravity CLI, German spell-checker

## Proposed files

### `.devcontainer/devcontainer.json` (recommended: single file, no Dockerfile)

```jsonc
{
  "name": "asimov minimal workspace",
  "image": "mcr.microsoft.com/devcontainers/typescript-node:1-22-bookworm",
  "customizations": {
    "vscode": {
      "extensions": [
        "dbaeumer.vscode-eslint",
        "streetsidesoftware.code-spell-checker"
      ]
    }
  },
  "remoteUser": "node",
  // installs the agent CLIs globally + the workspace deps, once after create.
  // runs as `node`; the MS image's global npm prefix is writable by that user.
  "postCreateCommand": "npm install -g @openai/codex @anthropic-ai/claude-code && npm install",
  // pass API keys through from the host env if present (never commit secrets)
  "remoteEnv": {
    "ANTHROPIC_API_KEY": "${localEnv:ANTHROPIC_API_KEY}",
    "OPENAI_API_KEY": "${localEnv:OPENAI_API_KEY}"
  }
}
```

**The npm packages** (the crux of the request):
- Claude Code → `@anthropic-ai/claude-code`
- Codex CLI → `@openai/codex`

### Decisions

- **Node 22** in the image matches our `engines: ">=22"` floor (our `node --test` glob needs
  ≥21). Pin the image tag rather than "latest" for reproducibility.
- **No Dockerfile** — the base image + `postCreateCommand` is the minimal shape and keeps it
  one file. *Alternative:* a 3-line `Dockerfile` (`FROM …` + `RUN npm install -g …`) bakes the
  CLIs into an image layer (cached across rebuilds, pinnable versions) instead of reinstalling
  on each container create. Recommend the single-file form for minimalism; switch to the
  Dockerfile if you want the CLIs version-pinned or faster rebuilds.
- **`remoteEnv` key passthrough** lets the CLIs authenticate from host env vars. Installing ≠
  authenticating: without a key (or an interactive `claude` / `codex` login inside the
  container) the CLIs run but can't call their APIs. Keys are read from the host at runtime —
  nothing secret is committed.
- **eslint + spell-checker extensions**: eslint matches our typed-lint gate; the spell-checker
  is already in play (the repo emits cSpell diagnostics). Both are low-cost quality-of-life.

## Copy behavior

`.devcontainer/` is **copied** by `copy.sh` (it's functional infra, unlike the template-local
`README`/`FEATURES`/`docs` that are excluded) — so every project made from the scaffold
inherits the agent-ready container. No `copy.sh` change needed; the copy-smoke keeps passing
(it only runs the gates, which the devcontainer doesn't touch).

## Docs to update

- `FEATURES.md` — a "devcontainer" row in the Developer-experience table.
- `AGENTS.md` — one line in the post-copy checklist (the container is inherited; rebuild it
  after renaming) and/or the repo map.
- `README.md` — a short "Dev container" note under Quick start.

## Verification

- `devcontainer build --workspace-folder .` (devcontainers CLI) or VS Code **Reopen in
  Container** builds cleanly.
- Inside the container: `node -v` ≥ 22; `codex --version` and `claude --version` resolve;
  `npm test` passes (proves the workspace is wired in the container).
- *Optional CI:* a `devcontainers/ci` GitHub Action job that builds the container and runs
  `npm test` inside — heavier (image pull + build per run), so add only if devcontainer drift
  becomes a real risk; not part of the default gates.

## Out of scope (seams)

- Baked/pinned CLI versions (the Dockerfile alternative above).
- docker-compose / multi-service dev (no external services here).
- Prebuilt image published to a registry (`devcontainer` prebuilds) for instant starts.
