# Source map

## Layout

```
src/
  index.ts                 # public exports
  engine/
    engine.ts              # Engine, EngineConfig, GameLoopType
    scene.ts               # Scene, SceneConfig
    component.ts           # Component, ComponentState
    game-object.ts         # GameObject interface, isGameObject
    game-object-proxy.ts   # shared ECS implementation + update
    builder.ts             # Builder
    message.ts             # Message, MessageResponses
    constants.ts           # Messages enum + change payloads
    index.ts
    game-objects/
      container.ts         # root wrapper pattern (addChild overrides)
      sprite.ts, text.ts, graphics.ts, …
      index.ts
  components/
    func-component.ts
    chain-component.ts
    async-component.ts     # experimental
    key-input-component.ts
    pointer-input-component.ts
    virtual-gamepad-component.ts
    debug-component.ts
    index.ts
  utils/
    vector.ts
    flags.ts
    lookup-map.ts
    query-condition.ts
    helpers.ts             # resizeContainer, isMobileDevice, Func, Action
    stack.ts, cmd-node.ts  # Chain internals
    index.ts
tests/                     # Jest
web-docs/                  # Docusaurus (ignored by root .gitignore for some setups)
APH_examples/              # examples (gitignored at root; local sibling checkout)
```

## Where to change what

| Goal | Primary files |
|------|----------------|
| Game loop / resize / Pixi bootstrap | `engine/engine.ts` |
| Queries, messaging, clearScene, indexes | `engine/scene.ts` |
| Component lifecycle API | `engine/component.ts` |
| Attach/detach/update/component queue | `engine/game-object-proxy.ts` |
| Pixi child hooks / destroy | `engine/game-objects/container.ts` (+ siblings) |
| Fluent construction | `engine/builder.ts` |
| New built-in behavior | `components/*` + export in `components/index.ts` |
| New display type | new file under `game-objects/`, export, add Builder `asX` + `ObjectType` |
| Search/query helpers | `utils/query-condition.ts`, `utils/lookup-map.ts` |

## Wrapper pattern checklist

Every game-object file follows `container.ts`:

1. `extends PIXI.X implements GameObject`
2. Construct `_proxy`
3. Forward id/name/scene/component/attribute/tag/flag/state/detach/destroy
4. Override `addChild` / `removeChild` / … when the Pixi type supports children
5. Implement `asX()` casts (self returns `this`; others throw)
6. Export from `game-objects/index.ts`

## Peer dependency

`pixi.js` `>=6.1.2` (peer). Dev/tests pin `^6.1.2`. Examples also use Pixi 6. Do not casually bump major without validating wrappers and examples.
