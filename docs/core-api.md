# Core API

Public surface is re-exported from `src/index.ts` → `./engine`, `./components`, `./utils`.

## Engine

```ts
const engine = new Engine();
await engine.init(canvas, {
  width: 800,
  height: 600,
  resolution: 1,
  resizeToScreen: false,
  transparent: false, // maps to Pixi backgroundAlpha
  backgroundColor: 0x000000,
  antialias: true,
  gameLoopType: GameLoopType.VARIABLE, // or FIXED
  gameLoopThreshold: 300,
  gameLoopFixedTick: 16,
  speed: 1,
  // SceneConfig fields also accepted here:
  tagsSearchEnabled: true,
  namesSearchEnabled: true,
  flagsSearchEnabled: false,
  statesSearchEnabled: false,
  notifyAttributeChanges: false,
  notifyStateChanges: false,
  notifyFlagChanges: false,
  notifyTagChanges: false,
  debugEnabled: false,
});
```

PixiJS v8 requires async Application setup — `Engine.init` is therefore `async` and must be awaited.

| Member | Meaning |
|--------|---------|
| `app` | `PIXI.Application` |
| `canvas` | `app.canvas` (Pixi v8; formerly `app.view`) |
| `scene` | Active `Scene` |
| `virtualWidth` / `virtualHeight` | Logical size |
| `running` | Loop flag |
| `destroy()` | Stops loop, destroys app |

Query strings: `?debug` enables debug; `?responsive` enables resize (unless debug).

## Scene

Owns stage, indexes, message bus, delayed calls.

`scene.width` / `scene.height` are the logical Pixi screen size in world units (`renderer.width` / `renderer.height`). On Pixi 8 these are already CSS pixels — do not divide by `resolution` again.

### Globals (stage)

| Method | Notes |
|--------|-------|
| `addGlobalComponent` / `addGlobalComponentAndRun` | Attach to `stage` |
| `findGlobalComponentByName` / `removeGlobalComponent` | By `component.name` |
| `assignGlobalAttribute` / `getGlobalAttribute` / `removeGlobalAttribute` | Stage attributes |

### Lookups

| Method | Requires config |
|--------|-----------------|
| `findObjectById` | always |
| `findObjectByName` / `findObjectsByName` | `namesSearchEnabled` |
| `findObjectByTag` / `findObjectsByTag` | `tagsSearchEnabled` |
| `findObjectByFlag` / `findObjectsByFlag` | `flagsSearchEnabled` |
| `findObjectByState` / `findObjectsByState` | `statesSearchEnabled` |
| `findObjectsByQuery(QueryCondition)` | linear scan of all objects |

`QueryCondition` fields (all optional): `ownerId`, `ownerName`, `ownerTag`, `ownerState`, `ownerFlag`.

### Timing & scene reset

- `callWithDelay(ms, fn)` — game-clock delay; `0` = end of current update. **Do not use `setTimeout` for gameplay.**
- `clearScene(newConfig?)` — **throws if called during update**. Use `clearSceneAsync` or `callWithDelay(0, () => clearScene())`.
- `currentDelta` / `currentAbsolute` — time of the update in progress.

### Messaging

```ts
scene.sendMessage(new Message(action, component?, gameObject?, data?), tagFilter?);
// Prefer from inside a component:
this.sendMessage(action, data?, tagFilter?);
```

## Component

```ts
class MyCmp extends Component<MyProps> {
  onInit() {}
  onAttach() {}
  onMessage(msg: Message) {}
  onFixedUpdate(delta: number, absolute: number) {}
  onUpdate(delta: number, absolute: number) {}
  onDetach() {}
  onRemove() {}
  onFinish() {}
}
```

| Field / method | Notes |
|----------------|-------|
| `props` | Constructor props (`T`, default `void`) |
| `owner` | Colfio `Container` (null until attached) |
| `scene` | Set when added |
| `name` | `_name` or `constructor.name` (minification caveat for `findComponentByName`) |
| `fixedFrequency` | Hz; if unset, `onFixedUpdate` never runs |
| `subscribe` / `unsubscribe` | Message actions |
| `sendMessage` | Builds `Message` and forwards to scene |
| `finish()` | `onFinish` → remove from owner (only if RUNNING) |

`ComponentState`: `NEW` → `INITIALIZED` → `RUNNING` → `DETACHED` / `FINISHED` / `REMOVED`.

## GameObject metadata

On every Colfio wrapper:

| Feature | API | Typical use |
|---------|-----|-------------|
| Attributes | `assignAttribute` / `getAttribute` / `removeAttribute` | Velocity, models, shared refs |
| Tags | `addTag` / `removeTag` / `hasTag` | Primary query key in games |
| Flags | `setFlag` / `resetFlag` / `hasFlag` / `invertFlag` | Bit flags (Flags util, indices ~0–127) |
| State | `stateId` getter/setter | Small numeric FSM |
| Components | `addComponent` / `addComponentAndRun` / `findComponentByName` / `removeComponent` | Behavior |
| Lifecycle | `detach()` / `destroy()` / `destroyChildren()` | Scene membership |

`addComponent` queues until next owner update (or until attach). `addComponentAndRun` requires object already on scene and not detached; runs `onUpdate` immediately if the owner already ran this tick.

## Builder

```ts
new Builder(scene)
  .withName('paddle')
  .withTag('PADDLE')
  .withAttribute('velocity', vec)
  .withFlag(1)
  .withState(0)
  .withComponent(new PaddleController())
  .withComponent(() => new Other()) // factory form for reusable builders
  .localPos(x, y)       // or relativePos / globalPos
  .anchor(0.5)
  .scale(1)
  .withParent(scene.stage)
  .withChild(childBuilder)
  .asSprite(texture)    // or asContainer, asGraphics, asText, asBitmapText,
                        // asTilingSprite, asMesh, asAnimatedSprite, asNineSlicePlane, …
  .build();
```

Also: `buildAndKeepData()`, `buildInto(existing)`, `buildIntoAndKeepData()`, `clear()`, `withComponents([])`.

**Known gap used in examples:** no Builder `zIndex` helper — games hack via a short-lived `FuncComponent` in `doOnInit`.

## Built-in `Messages` enum

From `src/engine/constants.ts`:

`ANY`, `OBJECT_ADDED`, `OBJECT_REMOVED`, `COMPONENT_ADDED`, `COMPONENT_DETACHED`, `COMPONENT_REMOVED`, `ATTRIBUTE_ADDED`, `ATTRIBUTE_CHANGED`, `ATTRIBUTE_REMOVED`, `STATE_CHANGED`, `FLAG_CHANGED`, `TAG_ADDED`, `TAG_REMOVED`, `SCENE_CLEAR`.

Attribute/state/flag/tag notifications only fire when matching `notify*Changes` is enabled.

## Utils

| Export | Role |
|--------|------|
| `Vector` | 2D vector helper |
| `Flags` | Bit-flag storage used by proxy |
| `QueryCondition` / `queryConditionCheck` | Query helper |
| `LookupMap` | Multi-map for scene indexes / subscribers |
| `Stack`, `CmdNode` | ChainComponent internals |
| `isMobileDevice`, `resizeContainer` | Responsive helpers |
| `Func`, `Action` | Callback types |

## Game object wrappers

| Class | Extends |
|-------|---------|
| `Container` | `PIXI.Container` |
| `Sprite` | `PIXI.Sprite` |
| `AnimatedSprite` | `PIXI.AnimatedSprite` |
| `TilingSprite` | `PIXI.TilingSprite` |
| `Text` | `PIXI.Text` |
| `BitmapText` | `PIXI.BitmapText` |
| `Graphics` | `PIXI.Graphics` |
| `ParticleContainer` | `PIXI.ParticleContainer` |
| `Mesh` | `PIXI.Mesh` |
| `SimpleMesh` / `SimplePlane` / `SimpleRope` | Pixi equivalents |
| `NineSlicePlane` | `PIXI.NineSlicePlane` |

Constructors typically take `(name: string, …pixiArgs)`.
