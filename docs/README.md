# Colfio — Agentic Development Documentation

This folder is the **canonical knowledge base for extending the Colfio miniengine**, not for shipping games.

Colfio (COLF.IO — *Component-Oriented Library For Interactive Objects*) is a PixiJS-backed ECS-style TypeScript library. This repository develops and maintains that library. Reference material for game authors lives in `web-docs/` and `APH_examples/`; treat those as sources of truth for *usage*, and treat `src/` plus this folder as the source of truth for *engine work*.

## Read order (agents)

1. [Architecture](./architecture.md) — mental model, Pixi bridge, what is / is not in core
2. [Core API](./core-api.md) — Engine, Scene, Component, GameObject, Builder, messaging, queries
3. [Lifecycle](./lifecycle.md) — hard invariants for updates, attach/detach, clearScene
4. [Built-in components](./built-in-components.md) — Func, Chain, Async, input, debug
5. [Source map](./source-map.md) — where code lives in `src/`
6. [Examples guide](./examples-guide.md) — how real games use the API; extension gaps
7. [Extending the engine](./extending-the-engine.md) — safe change patterns
8. [Development workflow](./development-workflow.md) — build, test, lint, examples

## Agentic redesign (planning only — no `src/` change yet)

Proposal to reshape the **game-author / AI-agent API** around composable gameplay primitives. Do not treat this folder as current engine truth until a migration phase lands.

1. [Analysis report](./agentic-redesign/00-analysis-report.md) — friction, concept audit, before/after metrics, risks
2. [Target API](./agentic-redesign/01-target-api.md) — locked agent-facing surface and architecture
3. [Prototype sketches](./agentic-redesign/02-prototype-sketches.md) — hypothetical BlockBreaker / platformer + genre tests
4. [Examples expansion](./agentic-redesign/03-examples-expansion.md) — `m-*` / `g-*` / `b-*` catalog
5. [Migration plan](./agentic-redesign/04-migration-plan.md) — P0–P6 refactor steps and gates

## Related paths

| Path | Purpose |
|------|---------|
| `src/` | Library source (what you change) |
| `tests/` | Jest coverage of lifecycle, messaging, builder, chain, search |
| `docs/installation.md` / `docs/tutorial-basics/` | Game-author quick start (mirrors web-docs) |
| `web-docs/` | Public Docusaurus site |
| `APH_examples/` | Tutorial gallery + full games; aliases `colfio` → `../src/index.ts` |
| `AGENTS.md` | Short agent entrypoint |
| `.cursor/rules/` | Always-on / scoped Cursor rules |
| `.cursor/skills/` | Task skills for engine work |

## Scope reminder

- **In scope:** Engine, Scene, Component, GameObject wrappers, Builder, messaging, built-in components, utils, tests, Typedoc, packaging.
- **Out of scope for core (unless explicitly requested):** Matter.js physics, pathfinding/steering math, networking, audio, tweens — those live in `APH_examples/libs` or example utils and are intentionally external.
