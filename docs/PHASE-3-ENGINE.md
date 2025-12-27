# Phase 3 Follow-up — Lowering Engine Facade

Status: **Done** ✅

This document records the small Lowering engine facade and how backend lowering is wired into it.

## What I implemented
- `src/lowering/engine.ts` — a tiny facade exposing:
  - `registerTransform(name, fn)` / `unregisterTransform` / `listTransforms`
  - `registerPolicyValidator(name, validator)`
  - `runTransform(name, input, policies?)` which first runs the validator (if present) and then invokes the transform
- `src/lowering/backend.ts` now registers itself with the engine via `engine.registerTransform('backend', ...)` and registers a policy validator that checks `generateId` values.
- Tests: `scripts/lowering.test.js` exercises engine registration, policy validation and transform invocation; `npm run test:lowering` passes.

## Why this approach
- Simple and focused: supports pluggable domain transforms and policy validation without a heavy framework.
- Keeps lowering logic modular and testable: domain lowering modules register themselves and validators with the engine during module initialization.

## Next ideas
- Add transform chaining / pipeline ordering for multi-stage lowering (e.g., `domain->intermediate->target`).
- Add richer policy schema validation using `zod` for better errors.

If you'd like, I can implement transform chaining next (small follow-up), or start moving other domain lowering modules to the engine. Which do you prefer?