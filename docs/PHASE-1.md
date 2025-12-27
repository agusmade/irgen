# Phase 1 — Decl Aggregator & Validation

Status: **Done** ✅

This short note documents what we implemented for Phase 1: a validated and normalized DeclUnified POC and test.

## What I implemented
- `src/ir/decl-unified.schema.ts` — zod schema for `DeclUnified` and `validateDeclUnified()` that performs:
  - Schema validation of aggregated `DeclApp`s
  - Normalization: ensure `entity.plural` is set (via `pluralize()`), ensure `entity.id` exists, normalize and deduplicate operation names
- `src/decl/aggregator.ts` — now calls `validateDeclUnified()` before returning, so aggregator returns a validated, normalized `DeclUnified`.
- `scripts/decl-validate.test.js` — a smoke test that runs `aggregateDecls(["examples/app.dsl.ts"])` and asserts expected normalized properties.
- `package.json` script `test:decl` runs the new test via `tsx`.

## Acceptance
- Aggregator returns a validated `DeclUnified` for `examples/app.dsl.ts` (test `npm run test:decl` passes).

## Notes
- Normalization choices (pluralization, id defaulting) are conservative and can be adjusted via DSL overrides (e.g., `e.plural(...)`) or by extending normalization rules.
- Next: implement mapper registry hardening and add unit tests for mapper outputs (Phase 2) and start wiring policy validation into lowering (Phase 3).
