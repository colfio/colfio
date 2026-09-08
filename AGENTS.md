# AGENTS.md — Colfio engine development

You are working on **Colfio** (`colfio`), a PixiJS-backed component-oriented game **miniengine**. This repository is for **extending the library**, not for shipping games.

## First reads

1. [docs/README.md](docs/README.md) — documentation index  
2. [docs/architecture.md](docs/architecture.md) — mental model  
3. [docs/lifecycle.md](docs/lifecycle.md) — hard invariants  
4. [docs/extending-the-engine.md](docs/extending-the-engine.md) — how to change code safely  

For API detail: [docs/core-api.md](docs/core-api.md), [docs/built-in-components.md](docs/built-in-components.md), [docs/source-map.md](docs/source-map.md).  
For real-world usage constraints: [docs/examples-guide.md](docs/examples-guide.md) (folder `APH_examples/`).

## Mission

- Change and improve `src/` (Engine, Scene, Component, GameObject wrappers, Builder, messaging, built-ins, utils).
- Keep the public API stable unless the user requests a breaking change.
- Keep physics, networking, pathfinding, audio, and tweens **out of core** unless explicitly promoting them.
- Use `tests/` and (when present) `APH_examples/` as acceptance checks.

## Non-negotiable invariants

- `addComponent` is deferred; `addComponentAndRun` is immediate (object must be on scene).
- Never call `scene.clearScene()` during an update — use `clearSceneAsync` or `callWithDelay(0, …)`.
- Prefer `scene.callWithDelay` over `setTimeout` / `setInterval` for game-clock work.
- Messaging: no self-delivery; honor `expired` and optional `tagFilter`.
- Custom game components must not rely on `_proxy` internals; use the GameObject API.
- Default scene search: tags + names enabled; flags/states/notify* disabled unless opted in.

## Code conventions

- TypeScript, `strict`, tabs, match neighboring file style.
- Use `import type` for type-only imports (eslint enforced).
- Export new public symbols from the appropriate `index.ts`.
- Pixi peer `>=6.1.2`; do not bump major without validating wrappers + examples.

## Verify before finishing

```bash
npm run lint
npm test
npm run test:typescript
npm run build
```

Update docs under `docs/` when behavior or public API changes.

## Cursor helpers

- Rules: `.cursor/rules/`
- Skills: `.cursor/skills/` (extend-engine, add-component, add-game-object, validate-changes)

## Reference trees (may be local-only)

| Path | Use |
|------|-----|
| `web-docs/` | Public tutorial narrative (WIP) |
| `APH_examples/` | Usage patterns; `colfio` aliases to `../src` |
