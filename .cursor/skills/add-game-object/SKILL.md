---
name: add-game-object
description: >-
  Adds a new Pixi-backed Colfio GameObject wrapper and Builder support. Use when
  wrapping another PIXI display object type into the ECS facade.
---

# Add GameObject wrapper

## Steps

1. Read `docs/source-map.md` and copy the pattern from `src/engine/game-objects/sprite.ts` or `container.ts`.
2. Implement class: `extends PIXI.X implements GameObject`, construct `GameObjectProxy`, forward API.
3. Override child mutators if the Pixi type has children.
4. Export from `src/engine/game-objects/index.ts`.
5. Update `GameObject` interface casts in `game-object.ts` and all wrapper `asX()` methods.
6. Extend `Builder`: `ObjectType`, `asX(...)`, `process()` construction branch.
7. Add Builder/construction tests if non-trivial.
8. Note the new type in `docs/core-api.md` / `docs/source-map.md`.

## Validate

```bash
npm test
npm run test:typescript
npm run build
```
