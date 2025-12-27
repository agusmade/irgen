# Phase 3 — Policy Validation (zod)

Status: **Done** ✅

This note documents the addition of `zod`-based policy schema validation to the Lowering engine.

## What I implemented
- `src/lowering/engine.ts` now supports registering a zod schema per transform via `registerPolicySchema(name, schema)` and will parse/validate policies passed to `runTransform`.
- `src/lowering/backend.ts` registers a zod schema `{ generateId?: enum('uuid_v4','shortid','custom') }` and therefore rejects invalid policy values with a ZodError that includes `issues`.
- `scripts/policy-zod.test.js` exercises the behavior and asserts an invalid policy is rejected with a zod error.

## Why this matters
- Gives more structured and actionable validation errors when users pass invalid policy values.
- Prepares the codebase to accept richer, typed policy objects in the future.

## Next ideas
- Add zod schemas for other domain transforms and centralize policy schema registration.
- Surface policy schema errors in CLI with friendly messages and examples.
