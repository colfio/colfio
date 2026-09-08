# Extending the engine

This repository extends **Colfio itself**. Do not add game-specific content to `src/`.

## Decision tree

1. **Is it generic Pixi+ECS infrastructure?** → candidate for `src/`.
2. **Is it domain logic (physics world, pathfinding, netcode, audio)?** → keep in examples/libs unless promoting a stable abstraction.
3. **Does it change Component / Scene / Proxy contracts?** → update tests + docs; validate against Vlak/Tetris/BlockBreaker patterns.
4. **Does it only help Builder convenience?** → prefer additive Builder methods; do not break existing fluent chains.

## Safe extension patterns

### New built-in component

1. Add `src/components/my-component.ts` extending `Component<Props>`.
2. Set stable `_name` if it must be found by name.
3. Use `onAttach`/`onDetach` for DOM/Pixi listeners.
4. Export from `src/components/index.ts`.
5. Add Jest coverage for lifecycle and messaging interactions.
6. Document in `docs/built-in-components.md`.

### New game-object wrapper

1. Copy the pattern from `container.ts` / `sprite.ts`.
2. Export from `game-objects/index.ts`.
3. Add `ObjectType` + `asX(...)` + constructor branch in `builder.ts`.
4. Add `asX()` cast on `GameObject` interface and implementations.
5. Test via Builder if construction is non-trivial.

### Scene / messaging features

1. Prefer opt-in `SceneConfig` flags (memory cost of indexes).
2. Emit built-in `Messages.*` only when corresponding `notify*` is enabled (existing pattern).
3. Never allow `clearScene` during `isUpdating` without the async path.
4. Preserve tagFilter and self-message exclusion semantics.

### Builder features

1. Keep fluent `return this`.
2. Support `number | Vector` overloads where position/scale/anchor already do.
3. Remember `componentBuilders` vs `components` for reusable builders.
4. Apply attributes/components **before** parenting when possible (avoids notification noise) — existing `process()` order.

## Compatibility constraints

- **Pixi peer:** `>=8.0.0`; examples may still pin older Pixi until migrated.
- **TypeScript:** project uses TS 5.x; `strict: true`; prefer `import type` (eslint `consistent-type-imports`).
- **Package manager:** pnpm (see `packageManager` in `package.json`).
- **Tabs** for indentation (historical changelog note; match existing files).
- Do not rename public exports casually — examples import `colfio` deeply.

## What not to break

| Contract | Why |
|----------|-----|
| Component hook names & order | All games |
| `addComponent` deferral vs `AndRun` | Timing-sensitive logic |
| `callWithDelay` / `clearScene` rules | Scene transitions |
| Tag search default ON | Primary query style |
| `KeyInputComponent.name` lookup | Controllers |
| ChainComponent command API | Tetris / Vlak scripts |
| Builder method names | Ubiquitous in examples |
| `GameObjectProxy` as private implementation | Docs warn custom components must not depend on `_proxy` internals except casts |

## Testing expectations

After behavioral changes:

```bash
npm run lint
npm test
npm run test:typescript
npm run build
```

Optionally compile examples: `cd APH_examples && npm run compile-test`.

## Documentation expectations

- Update the relevant file under `docs/` when adding public API.
- Keep `AGENTS.md` accurate if workflow/commands change.
- Public site (`web-docs`) can lag; agent docs here must stay current.
