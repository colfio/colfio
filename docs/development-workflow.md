# Development workflow

## Prerequisites

- Node `>=16` (package engines); Node 18+ recommended (web-docs install guide).
- npm `>=8`.

## Library commands (repo root)

| Script | Purpose |
|--------|---------|
| `npm install` | Install deps (`prepare` runs build) |
| `npm run build` | Clean + CJS (`dist/cjs`) + ESM (`dist/esm`) |
| `npm run build:cjs` / `build:esm` | Individual module builds |
| `npm test` | Jest |
| `npm run test:cov` | Coverage |
| `npm run test:typescript` | `tsc --noEmit` |
| `npm run lint` | ESLint on `src` + `tests` |
| `npm run typedoc` | Markdown API docs → `api-docs/` |
| `npm run clean` | Remove `dist` + `coverage` |

Publish gate (`prepublishOnly`): clean → lint → test.

## Examples workflow

```bash
cd APH_examples
npm install
npm run compile-test   # typecheck against aliased ../src
npm run dev            # Parcel gallery
```

`APH_examples/package.json` aliases `colfio` → `../src/index.ts`, so example runs exercise unreleased engine code.

## Docs site

```bash
cd web-docs
npm install
npm start
```

Public docs are thin (installation + WIP first steps). Prefer updating `docs/` here for agent/engine knowledge.

## Suggested agent loop for a feature

1. Read `docs/architecture.md` + relevant source.
2. Implement in `src/` with matching style.
3. Add/adjust tests under `tests/`.
4. Run lint + test + `test:typescript` + build.
5. Update `docs/` for public behavior changes.
6. If API is user-visible in games, sanity-check patterns from `docs/examples-guide.md`.

## Git notes

- Root `.gitignore` currently ignores `APH_examples/` and `web-docs/` (local reference checkouts) plus `dist`, `coverage`, `api-docs`.
- Do not commit secrets. Do not force-push. Commit only when asked.
