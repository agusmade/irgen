# Phase 6 — CLI Orchestration & Flags

Status: **Done** ✅

This phase implements a more expressive CLI orchestration for building one or more targets from DSL sources and inspecting intermediate IRs.

## New CLI features
- `--targets=backend,frontend` — run the pipeline for the listed targets (decl aggregation → lowering → emission). Each target is emitted into a subfolder of the `outDir` (e.g., `generated/backend`, `generated/frontend`).
- `--inspect-ir` — prints the lowered TargetIR(s) (JSON) to stdout to aid debugging.
- `--inspect-decl` — prints the aggregated DeclBundle (useful to debug the input to mappers/lowering).
<<<<<<< ours
- `--policies='{"generateId":"shortid"}'` — optional JSON policies override; default policies now bisa dibawa lewat DSL/meta sehingga flag ini hanya dipakai saat butuh override cepat.
=======
- `--policies='{"generateId":"shortid"}'` — optional JSON policies override; default policies can now be supplied via DSL/meta, so this flag is only for quick overrides.
>>>>>>> theirs
- `--emitter-map='{"backend":"my-backend-emitter"}'` — JSON mapping that overrides which emitter runs for each target (useful to test or choose alternate emitters at runtime).
- `--ext=./path/to/ext.ts` — optional extension module(s) to load; extensions can register mappers/transforms/emitters/target mappings (same interface as programmatic usage).
## What I implemented
- `src/cli.ts`: added argument parsing and orchestration logic to aggregate DeclBundle, run the lowering transform for each requested target (`backend` and `frontend`), optionally print TargetIR with `--inspect-ir`, and invoke registered emitters (via `emitterEngine`) with output paths under the provided `outDir`.
- `src/lowering/frontend.ts`: made frontend lowering tolerant when no frontend-specific pages/components exist (generates empty arrays), and registered the frontend transform with the engine so it can be orchestrated by the CLI.
- Tests:
  - `scripts/cli-build.test.js` verifies orchestration for both `backend` and `frontend` targets and that `--inspect-ir` prints the IRs.

## Acceptance
- `npm run test:cli-build` passes locally and confirms both targets are produced and IR inspection works.

## Notes & follow-ups
- We currently infer which emitter to run for `backend`/`frontend` targets (using `backend-tsmorph` / `frontend-tsmorph`). Future iterations could support a registry mapping target -> emitter and allow `--emitter` override per target.
- Add an `--inspect-decl` flag and richer debugging output (source mapping) as follow-ups.
