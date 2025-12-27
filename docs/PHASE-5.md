# Phase 5 — Shared Adapters & Library

Status: **Done** ✅

This phase implements generation of small shared adapters into `/lib/*` for generated projects and wires these to lowering policies so generated code uses the chosen adapters.

## What I implemented
- `src/lowering/backend.ts`: Added `loggerImpl` and `httpClient` to policy type, default values, and zod schema registration so policies are validated by the Lowering engine.
- `src/emit/backend-tsmorph.ts`: Emitters now generate `lib/logger.ts` and `lib/http.ts` based on `ir.policies.loggerImpl` and `ir.policies.httpClient` respectively. Implementations are minimal by design:
  - `logger` — `console` implementation (simple wrapper); placeholders for `pino`/`winston` include a note to add dependency.
  - `http` — `fetch` implementation (wrapper using global `fetch`); `axios` adapter suggests adding `axios` dependency.
- Tests: `scripts/adapters.test.js` ensures the lowering+emitter flows generate `lib/id.ts`, `lib/logger.ts`, and `lib/http.ts` and that adapter contents match the chosen policies.
- Package dependency injection: the backend emitter now writes a minimal `package.json` into generated projects and injects dependencies based on policies (e.g., `axios` for `httpClient: 'axios'`, `pino` for `loggerImpl: 'pino'`, `uuid` for `generateId: 'uuid_v4'`). Verified by `scripts/package-deps.test.js`.
- Dev toolchain + frontend deps: generated `package.json` now includes basic devDependencies and scripts (Prettier, TypeScript) and injects frontend deps when frontend generation is enabled (React + ReactDOM, Tailwind when opted in). Verified by `scripts/package-frontend.test.js`.

## Acceptance
- `npm run test:adapters` passes locally and verifies adapters are generated and contain policy-expected content.
- `npm run gen` continues to produce backend artifacts and now includes `/lib/logger.ts` and `/lib/http.ts` in generated outputs.

## Notes & follow-ups
- These adapters are intentionally small and pragmatic. Follow-ups could include richer adapters, dependency insertion into generated `package.json`, or adding adapter interfaces for stronger typing.
- Adding golden tests for adapter content is recommended and fits naturally into Phase 7 (Tests & Golden Files).

---

If you'd like, I can now add package.json modifications for generated projects to include the required runtime dependencies (e.g., add `axios` when `httpClient: 'axios'`). Want me to add that? (Yes/No)