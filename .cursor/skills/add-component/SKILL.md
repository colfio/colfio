---
name: add-component
description: >-
  Adds a new built-in Colfio Component under src/components. Use when creating
  engine-level components (input helpers, utilities, scripting) that ship with the library.
---

# Add built-in Component

## Steps

1. Read `docs/built-in-components.md` and an existing similar component (e.g. `key-input-component.ts` or `func-component.ts`).
2. Create `src/components/<name>-component.ts`:
   - `export class X extends Component<Props>`
   - Set `_name` if discoverable via `findComponentByName`
   - Use `onAttach`/`onDetach` for external listeners
3. Export from `src/components/index.ts`.
4. Add tests covering init/attach/update/message/remove as applicable.
5. Document in `docs/built-in-components.md`.

## Do not

- Put game-specific logic (tetris scoring, level loaders) in built-ins.
- Expand `AsyncComponent` instead of `ChainComponent` for new scripting features.

## Validate

```bash
npm test
npm run lint
```
