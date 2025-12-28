# Phase 4 — Emitter Pipeline & Standardization

Status: **Done** ✅

This document summarizes the small emitter pipeline I implemented as part of Phase 4 and how the backend/frontend emitters were adapted to it.

## What I implemented
- `src/emit/engine.ts` — a tiny Emitter engine that lets modules register emitters via `registerEmitter(name, fn)` and run them via `runEmitter(name, ir, outDir)`.
- Adapted existing emitters:
  - `src/emit/backend-tsmorph.ts` now exposes `emitBackendToProject(project, outDir, ir)` and registers a `backend-tsmorph` emitter that creates a `ts-morph` Project, delegates emission and saves files.
  - `src/emit/frontend-react.ts` registers a `frontend-tsmorph` emitter with the engine.
- `src/cli.ts` was updated to call the emitter engine (`emitterEngine.runEmitter(...)`) for both backend and frontend flows instead of directly instantiating `ts-morph` Projects.
- Test: `scripts/emitter.test.js` verifies the emitter engine can run the backend emitter and produce expected files.

## Acceptance
- `npm run test:emitter` passes and generated files appear in `generated-emitter-test/` as expected.
- Existing generation flows (`npm run gen`, `npm run gen:frontend`, `npm run gen:backend`) remain functionally equivalent.

## Notes
- This is intentionally minimal: the engine focuses on registration and execution. Future improvements could add emit pipelines (pre-/post-steps), formatters, and hooks for golden test integrations.

---

**CLI updates**

- **`--emitters`** — prints the list of registered emitters and exits (useful to discover available emitters).
- **`--emitter=<name>`** — runs a single registered emitter by name. You can pass a DSL entry and outDir as positional args, for example:

  ```bash
  npx tsx src/cli.ts examples/app.dsl.ts generated --emitter=backend-tsmorph
  ```

  The CLI will try to infer the IR mode from the emitter name (contains `backend` or `frontend`) unless you pass `--mode=backend|frontend` explicitly.
