# Built-in components

Exported from `src/components/`.

## FuncComponent

Lightweight component with fluent handlers — preferred for one-off behavior and Builder inline logic.

```ts
new FuncComponent('animator')
  .setFixedFrequency(10)
  .setDuration(5000) // optional auto-finish
  .doOnInit(cmp => { … })
  .doOnAttach(cmp => { … })
  .doOnUpdate((cmp, delta, absolute) => { … })
  .doOnFixedUpdate((cmp, delta, absolute) => { … })
  .doOnMessage('FOO', (cmp, msg) => { … })
  .doOnMessageOnce('BAR', (cmp, msg) => { … })
  .doOnMessageConditional('BAZ', { ownerTag: 'ENEMY' }, (cmp, msg) => { … })
  .doOnDetach / doOnRemove / doOnFinish …
```

`onAttach` auto-subscribes registered message keys. Conditional handlers filter on `msg.gameObject` via `QueryCondition`.

## ChainComponent

Update-loop command script (repeat / while / if / wait / call). **Preferred over `AsyncComponent`.**

Key fluent API (non-exhaustive):

| Method | Purpose |
|--------|---------|
| `beginRepeat` / `endRepeat` | Counted or infinite loops |
| `beginWhile` / `endWhile` | Condition loops |
| `beginInterval` / `endInterval` | Timed intervals |
| `beginIf` / `else` / `endIf` | Branching |
| `call(fn)` | Run closure |
| `waitTime` / `waitFrames` / `waitUntil` | Delays |
| `waitForMessage` / `waitForMessageCondition` | Message barriers |
| `waitFor` / `waitForFirst` / `waitForAll` | Wait on components finishing |
| `addComponent` / `removeComponent` | Mutate owner (or target) |
| `detachGameObject` / `destroyGameObject` (+ ByQuery variants) | Structural ops |
| `mergeWith` / `mergeAtBeginning` | Compose chains (not while RUNNING) |
| `executeUpon(obj)` | `addComponentAndRun` helper |
| `abortIf(fn)` | Abort checks |

All waits are bound to the **game update loop**, not browser timers. Full games (Tetris, Vlak) use Chain for cutscenes and sequenced gameplay.

## AsyncComponent

Generator-based experimental alternative to Chain. Source file warns: **use ChainComponent instead.** Keep for compatibility; do not expand unless requested.

## KeyInputComponent

Global keyboard poller. Does **not** send messages.

```ts
scene.addGlobalComponentAndRun(new KeyInputComponent());
const keys = scene.findGlobalComponentByName<KeyInputComponent>(KeyInputComponent.name);
if (keys.isKeyPressed(Keys.KEY_LEFT)) { … }
keys.handleKey(Keys.KEY_SPACE); // mark handled
```

- Registers `keydown`/`keyup` on `document` in `onAttach`; removes in `onDetach`.
- Sets `_name = KeyInputComponent.name` for stable lookup.
- `Keys` const map of key codes.

**Example convention (not engine):** many games also `assignGlobalAttribute('key_input', keyInput)` and read via attribute. TODOs in examples ask the engine to simplify this dual pattern — a good extension candidate.

## VirtualGamepadComponent

Extends `KeyInputComponent`. Renders on-screen buttons that synthesize key presses. Construct with a mapper (`KEY_UP`, `KEY_DOWN`, …). Omit keys to hide buttons. Drop-in replacement for keyboard on mobile (`isMobileDevice()` / `?mobile` in Vlak).

## PointerInputComponent

Canvas-level pointer/touch → messages. Configure which events to capture:

```ts
new PointerInputComponent({
  handleClick: true,
  handlePointerDown: false,
  handlePointerOver: false,
  handlePointerRelease: false,
});
```

Actions (`PointerMessages`): `pointer-tap`, `pointer-down`, `pointer-over`, `pointer-release`. Messages are queued and sent during `onUpdate`.

## DebugComponent

Injected automatically when `debugEnabled` or `?debug`. Renders an HTML debug panel beside the canvas. Can also be added manually to stage.
