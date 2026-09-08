---
name: validate-changes
description: >-
  Runs Colfio library validation (lint, Jest, TypeScript, build) and optionally
  examples typecheck. Use after engine edits before considering work done.
---

# Validate Colfio changes

## Required (repo root)

```bash
npm run lint
npm test
npm run test:typescript
npm run build
```

Fix failures before finishing. If a test reveals an invariant (`clearScene` during update, component double-owner, etc.), fix the implementation — do not weaken the test unless the user requests a deliberate behavior change.

## Optional examples check

If `APH_examples/` is present:

```bash
cd APH_examples
npm run compile-test
```

## Docs

If public behavior changed, update the relevant file(s) under `docs/` and keep `AGENTS.md` accurate for command/workflow drifts.

## Manual acceptance (when UI/behavior is subtle)

Mentally or manually exercise patterns from `docs/examples-guide.md`:

- Messaging + tags (`03-components/graphics.ts`)
- Builder + collision messages (`game_blockbreaker`)
- Chain + clearScene (`game_tetris`)
- Nested Builder + VirtualGamepad (`game_vlak`)
