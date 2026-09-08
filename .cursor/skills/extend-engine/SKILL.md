---
name: extend-engine
description: >-
  Extends the Colfio miniengine core (Engine, Scene, Component, Builder, messaging, utils).
  Use when adding or changing library features in src/, fixing engine bugs, or improving
  public API — not when building games.
---

# Extend Colfio engine

## Before coding

1. Read `docs/architecture.md` and `docs/extending-the-engine.md`.
2. Identify touch points via `docs/source-map.md`.
3. Check usage impact in `docs/examples-guide.md` (Vlak / Tetris / BlockBreaker / 03-components).

## Principles

- Keep core thin: no Matter, networking, pathfinding, or audio unless explicitly requested.
- Prefer additive APIs; avoid renames/breaks without user approval.
- Preserve lifecycle and clearScene invariants (`docs/lifecycle.md`).

## Implementation steps

1. Edit the minimal set of files under `src/`.
2. Export new public symbols from the correct `index.ts`.
3. Add or update Jest tests in `tests/` mirroring existing suites.
4. Update the matching doc under `docs/`.
5. Run validation (see skill `validate-changes` or `docs/development-workflow.md`).

## Reference

- API: `docs/core-api.md`
- Built-ins: `docs/built-in-components.md`
- Agent entry: `AGENTS.md`
