# Development workflow

## Prerequisites

- Node `>=18`
- **pnpm** `>=9` (this repo uses pnpm, not npm). Enable via Corepack or `npm i -g pnpm`.

## Library commands (repo root)

| Script | Purpose |
|--------|---------|
| `pnpm install` | Install deps (`prepare` runs build) |
| `pnpm run build` | Clean + CJS (`dist/cjs`) + ESM (`dist/esm`) |
| `pnpm run build:cjs` / `build:esm` | Individual module builds |
| `pnpm test` | Jest |
| `pnpm run test:cov` | Coverage |
| `pnpm run test:typescript` | `tsc --noEmit` |
| `pnpm run lint` | ESLint on `src` + `tests` |
| `pnpm run typedoc` | Markdown API docs → `api-docs/` |
| `pnpm run clean` | Remove `dist` + `coverage` |

Publish gate (`prepublishOnly`): clean → lint → test.

## Examples workflow

```bash
cd APH_examples
pnpm install
pnpm run compile-test   # typecheck against aliased ../src (Pixi 8 + async Engine.init)
pnpm run generate-views && pnpm run dev   # Parcel gallery
```

`APH_examples` uses pnpm + Pixi `^8` and aliases `colfio` → `../src/index.ts`, so example runs exercise unreleased engine code.

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
