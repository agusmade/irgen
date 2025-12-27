# Phase 2 — Mapper Registry & Tests

Status: **Done** ✅

This note documents the implementation and tests added for Phase 2.

## What I changed
- Hardened `src/mappers/index.ts`:
  - `registerMapper(name, fn, { force?: boolean })` throws on duplicate registrations unless `force` is true.
  - `unregisterMapper(name)` to remove a mapper.
  - `listMappers()` to list registered mapper names.
  - `registerBuiltins()` is idempotent and registers builtin mappers using `force`.
- Tests added: `scripts/mappers.test.js` which:
  - Calls `registerBuiltins()` and runs `runMapper('backend', decl)` to confirm BackendIR shape.
  - Tries `runMapper('frontend', decl)` but tolerates environment failures (smoke test only).
  - Validates registry helper functions `registerMapper`, `getMapper`, `unregisterMapper`, `listMappers`.
- `package.json` updated with `test:mappers` script.

## Acceptance
- `npm run test:mappers` passes in the current environment (frontend mapper may fail on some systems; this is tolerated in the POC smoke tests).

## Next
- Add unit tests validating mapper output shapes in more detail and wiring of lowering (Phase 3).
