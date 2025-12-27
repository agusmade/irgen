# Phase 3 — Lowering Engine & Policies

Status: **Done** ✅

This note documents the Phase 3 implementation: a minimal lowering policy contract and wiring into backend lowering and emitters.

## What I implemented
- `src/lowering/backend.ts`:
  - Added `LoweringPolicies` type and `DEFAULT_POLICIES`.
  - `declToBackendIR(app, policies?)` now validates/merges policies and includes `policies.generateId` and resolved `idProvider` in the returned BackendIR.
- `src/emit/backend-tsmorph.ts`:
  - `emitIdAdapter(project, outDir, ir?)` now reads `ir.policies.generateId` and emits a suitable `lib/id.ts` implementation for `uuid_v4` (uses `uuid`) and `shortid` (uses `node:crypto` randomBytes).
- `scripts/policy.test.js` — integration test that:
  - Calls `declToBackendIR` with default and `shortid` policies and asserts the policy is present in IR.
  - Runs `emitBackend` with the `shortid` IR and verifies `generated-policy-test/lib/id.ts` contains `crypto`-based implementation.
- `package.json` updated with `test:policy`.

## Acceptance
- `npm run test:policy` passed in the current environment.

## Notes
- This is a minimal policy implementation designed for POC. Next step is to extract a general Lowering engine that supports pluggable transforms and richer policy validation (Phase 3 follow-ups).
