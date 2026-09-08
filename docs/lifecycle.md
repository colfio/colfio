# Lifecycle invariants

These rules are enforced by code and tests. Breaking them breaks games (especially Tetris / Vlak / BlockBreaker).

## Component lifecycle

```
addComponent (queued)
  → next owner update / attach
      → onInit          → INITIALIZED
      → onAttach        → RUNNING
      → onUpdate / onFixedUpdate / onMessage while RUNNING
detach owner or remove
  → onDetach          → DETACHED  (still on owner, no update/messages)
re-attach owner
  → onAttach          → RUNNING
finish() or removeComponent
  → onFinish (if was RUNNING) → FINISHED
  → onDetach → DETACHED
  → onRemove → REMOVED
  → owner = null
```

### Rules

1. **Deferred add:** `addComponent` does not run until the owner’s update (or attach). Use `addComponentAndRun` / `addGlobalComponentAndRun` for immediate init.
2. **One owner:** A component cannot be on two objects. Reuse only after removal.
3. **No self-messages:** Scene skips the sending component.
4. **Detached = silent:** Detached components do not update and are removed from message subscribers until re-attached.
5. **`finish()` only when RUNNING:** Otherwise no-op for removal path.
6. **Preferred hooks:** Init in `onInit`, cleanup in `onRemove`, unless you need attach/detach symmetry (DOM listeners → `onAttach`/`onDetach`).
7. **Name lookup:** `findComponentByName` uses `component.name`. Set `_name` in constructor for stable names under minification (`KeyInputComponent` does this).

## Object lifecycle

```
NEW → addChild onto scene tree → ATTACHED
  → Scene._onObjectAdded (indexes + OBJECT_ADDED message)
  → init pending components
DETACHED (removeChild / detach)
  → components onDetach; indexes cleared; OBJECT_REMOVED
DESTROYED (destroy)
  → removeAllComponents; OBJECT_REMOVED; Pixi destroy
```

### Rules

1. Objects are **added to the scene immediately** when parented under an attached Colfio object.
2. **Do not add the same object twice** — proxy throws if already `ATTACHED`.
3. `detach()` keeps the instance reusable; `destroy()` does not.
4. Destroying a parent destroys Colfio children via proxy recursion.

## Scene update & clearScene

```
_update:
  isUpdating = true
  stage.update(...)
  isUpdating = false
  process pendingInvocations (callWithDelay)
```

### Hard rules

1. **`clearScene()` throws during update.** Always:
   ```ts
   this.scene.callWithDelay(0, () => this.scene.clearScene());
   // or
   this.scene.clearSceneAsync();
   ```
2. After `clearScene`, stage is a **new** `Container`; re-add global components/attributes (Vlak `LevelFactory.clearScene` pattern).
3. `callWithDelay(0, fn)` runs at end of the same frame’s update — correct place for structural scene changes.
4. If a delayed action clears the scene, remaining invocations in that batch are aborted (`sceneCleared` check).

## Message delivery order

1. All subscribers of `msg.action` (minus sender, minus expired, optional tag filter).
2. Then all `Messages.ANY` subscribers.
3. Responses aggregated on `msg.responses`.

Pointer input **queues** messages and flushes them in `onUpdate` so they land on the game clock.

## Game loop vs component fixedFrequency

| Mechanism | Scope | Purpose |
|-----------|-------|---------|
| `EngineConfig.gameLoopType` FIXED/VARIABLE | Whole scene tick | How `delta`/`absolute` advance |
| `component.fixedFrequency` | Per component | Extra `onFixedUpdate` cadence in Hz |

They are independent. Games often use VARIABLE loop + selective `fixedFrequency` (spritesheet anim, train ticks).

## Tests covering lifecycle

See `tests/lifecycle.test.ts`, `tests/messaging.test.ts`, `tests/async.test.ts`, `tests/chain.test.ts`, `tests/builder.test.ts`, `tests/search.test.ts`.
