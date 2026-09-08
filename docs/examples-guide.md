# Examples guide (APH_examples)

Local folder `APH_examples/` (often a sibling checkout; may be gitignored at repo root). Package alias:

```json
"alias": { "colfio": "../src/index.ts" }
```

Engine changes are validated by running examples against live `src/`.

## Base classes (`src/utils/APHExample.ts`)

| Class | Role |
|-------|------|
| `ECSExample` | `new Engine()` → `init(canvas, config)` → `load()` — **canonical Colfio template** |
| `PIXIExample` | Raw Pixi without Colfio |
| `ThreeJSExample` | Three.js demos (not Colfio) |

## Directory map

| Folder | Teaches | Colfio intensity |
|--------|---------|------------------|
| `03-components` | Components, flags, messaging, tags, Builder, FuncComponent, KeyInput | **Core curriculum** |
| `04-space` | Spatial algos via `libs/aph-math`; Colfio as display host | Light–medium |
| `05-dynamics` | Integration, Ackermann, steering | Medium |
| `06-physics` | Matter bind / DIY collisions / platformer | Medium–high |
| `07-graphics` | Shaders (`asMesh`), tweens, vision cone | Medium |
| `08-ai` | Bots + pursue (pathfinding/steering + components) | High |
| `09-network` | Dual-canvas sync via network-emulator | High |
| `others` | Dialog (NineSlicePlane), progress, hit-test | Medium |
| `game_blockbreaker` | Tags, message collision pipeline, Builder | **High** |
| `game_tetris` | Global controllers, Chain sequences, clearScene transitions | **High** |
| `game_vlak` | Builders + Actions + Selectors + VirtualGamepad | **Highest** |

`01-helloworld` / most of `02-*` are Pixi/Three intros; Colfio starts in earnest at **03**.

## Critical APIs games actually use

1. **Engine + Scene + stage**
2. **Custom `Component` / `Component<Props>`** with `subscribe` / `sendMessage` / `onUpdate`
3. **Builder** (`.asSprite`, `.withTag`, `.withComponent`, `.withChild`, `.withParent`, positions)
4. **Tags + `findObject(s)ByTag`** as primary query
5. **Attributes + global attributes** (models, velocity, `key_input`)
6. **KeyInputComponent** (+ VirtualGamepad in Vlak)
7. **FuncComponent** and **ChainComponent**
8. **`callWithDelay(0, …)` before `clearScene`**
9. **`addGlobalComponent(AndRun)`** for scene services
10. **`fixedFrequency`** for tick-rate logic

Underused in examples despite existing in engine: `QueryCondition` / `findObjectsByQuery`, flags/states search indexes, `notify*Changes`, `DebugComponent` (except via `?debug`), `AsyncComponent`.

## Full games — engine surface

### BlockBreaker

- KeyInput as global component + `'key_input'` attribute
- Builder for paddle/ball; imperative sprites + tags for bricks
- Attributes: velocity, scene height
- `stateId` for ball attach/release
- Message pipeline: attach → collide → resolve → game manager
- DIY AABB (no Matter)

### Tetris

- Entire game as global components (controller, renderer, sound)
- Message enums for gameplay ↔ SFX ↔ UI
- ChainComponent for row-clear / game-over sequences
- Scene transitions via `callWithDelay` + `clearScene`
- `Keys` + `handleKey` for input edge control

### Vlak

- Richest Builder usage (`withChild`, BitmapText, TilingSprite)
- VirtualGamepad / KeyInput swap
- ChainComponent “Actions” scripts (`waitFor`, `waitTime`, `mergeWith`)
- Selectors over global attributes
- Sync components listening to state messages
- Explicit clearScene rehydration of globals
- zIndex hack via FuncComponent (Builder gap)

## Engine vs example-local

| Feature | In Colfio core? | Where in examples |
|---------|-----------------|-------------------|
| ECS / messaging / Builder | Yes | everywhere |
| Key / pointer / gamepad | Yes | games + physics |
| Chain / Func | Yes | tetris, vlak, others |
| Physics | No | `libs/pixi-matter` + Matter.js |
| Steering / pathfinding / Perlin / QuadTree | No | `libs/aph-math` |
| Networking | No | `libs/network-emulator` |
| Tweens / DynamicsComponent | No | `src/utils/animation.ts`, `dynamics*.ts` |
| Audio | No | pixi-sound |
| Shaders | Thin (`asMesh`) | GLSL in `07-graphics` |

## Extension gaps visible from examples

1. Builder **zIndex** (and similar Pixi props)
2. Cleaner **KeyInput** discovery (drop dual attribute pattern)
3. First-class **scene transition** helper wrapping clearScene + delay
4. Optional promotion of Dynamics / tween helpers (only if keeping core still thin)
5. Document/fix oddities (e.g. messaging when adding some components via Builder children)

## Acceptance fixtures for engine PRs

Prefer validating against:

1. `03-components/graphics.ts` — messaging + tags + KeyInput
2. `game_blockbreaker` — tags + messages + Builder
3. `game_tetris` — Chain + clearScene + globals
4. `game_vlak` — Builder hierarchy + VirtualGamepad + Actions

If these still compile and run, most public API contracts are intact.
