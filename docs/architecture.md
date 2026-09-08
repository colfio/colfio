# Architecture

## What Colfio is

A **thin ECS-style layer on PixiJS display objects**:

- **Entities** ≈ Pixi display objects wrapped as Colfio game objects (`Container`, `Sprite`, …).
- **Components** ≈ behavior units with lifecycle hooks (`onUpdate`, `onMessage`, …).
- **Scene** ≈ object registry + message bus + update root.
- **Engine** ≈ Pixi `Application` bootstrap + game loop that drives `Scene._update`.

It is **not** a pure ECS (no separate archetype store or system scheduler). Systems are components attached to objects (or to `scene.stage` as globals).

## Stack

```
┌─────────────────────────────────────────────┐
│  Game / examples (components, factories)    │
├─────────────────────────────────────────────┤
│  Colfio: Engine · Scene · Component ·       │
│          Builder · Message · wrappers       │
├─────────────────────────────────────────────┤
│  PixiJS: Application · Ticker · Container…  │
└─────────────────────────────────────────────┘
```

## Core types

| Type | Role |
|------|------|
| `Engine` | Creates `PIXI.Application` via async `init()`, owns `Scene`, runs rAF loop (FIXED or VARIABLE), optional resize |
| `Scene` | Stage root, lookups (name/tag/flag/state/id/query), subscribers, delayed invocations, `clearScene` |
| `Component<T>` | Behavior; typed `props`; optional `fixedFrequency` |
| `GameObject` | Interface of Colfio methods on display objects |
| `GameObjectProxy` | Shared implementation (attributes, tags, flags, components, update) |
| `Container` / `Sprite` / … | Subclass Pixi types, implement `GameObject` by delegating to `_proxy` |
| `Builder` | Fluent construction of objects + metadata + components + children |
| `Message` | Inter-component message with action, sender, optional data, responses, `expired` |

## Pixi–Colfio bridge

JavaScript has no multiple inheritance. Pattern:

1. `class Sprite extends PIXI.Sprite implements GameObject`
2. Constructor creates `this._proxy = new GameObjectProxy(name, this)`
3. Colfio methods (`addComponent`, `assignAttribute`, …) forward to `_proxy`
4. Pixi hierarchy methods (`addChild`, `removeChild`, …) are overridden so attach/detach/destroy notify the proxy and scene

**Rule:** Prefer Colfio wrappers over raw Pixi constructors when objects participate in ECS. Raw Pixi children under a Colfio parent are possible but will not receive Colfio updates or messaging.

`GameObject` casting helpers (`asSprite()`, `asGraphics()`, …) throw if the runtime type does not match. Modern code usually holds the concrete Colfio type and uses Pixi fields directly (`position`, `rotation`, `texture`).

## Update loop

```
requestAnimationFrame
  → Engine.loop(time)
      → compute dt (clamped by gameLoopThreshold, scaled by speed)
      → Scene._update(delta, absolute)
          → stage._proxy.update(…)
              → init deferred components
              → each RUNNING component: onUpdate (+ onFixedUpdate if due)
              → recurse children
          → run pending callWithDelay invocations
      → PIXI.Ticker.update(gameTime)
```

- **VARIABLE** (default): delta = real elapsed (capped).
- **FIXED**: always advances by `gameLoopFixedTick` (default 16ms).

Component-level **fixed update** is separate: set `component.fixedFrequency` (Hz). Scene does not have a global fixed step for components.

## Scene graph vs ECS data

- **Visual hierarchy** = Pixi parent/child tree rooted at `scene.stage` (a Colfio `Container` assigned to `app.stage`).
- **ECS metadata** lives on `GameObjectProxy`: components map, attributes map, tags set, bit flags, `stateId`.
- **Lookup indexes** on Scene are optional (see SceneConfig). Default: **names + tags ON**; flags/states/notify* **OFF**.

## Messaging model

Publish/subscribe keyed by string `action`. Scene holds `LookupMap<action, Component>`. Delivery rules:

- Sender does not receive its own message.
- Expired messages stop further delivery.
- Optional `tagFilter`: only components whose owner has at least one listed tag.
- `onMessage` return values collected into `Message.responses`.
- Subscribers to `Messages.ANY` see everything (debug).

## What belongs in core vs examples

**Core (`src/`):** loop, scene, components, wrappers, builder, messaging, input helpers, chain/func/async, vector/flags/query utils.

**Examples / libs (`APH_examples/`):** Matter physics bridge, aph-math (pathfinding, steering, Perlin, QuadTree), network emulator, tween helpers, audio via pixi-sound, full game factories.

When extending: keep core thin. Promote example-local code into core only when it is generic, well-tested, and repeatedly needed.
