# Phase 8 — Examples & Docs (1–3 days)

## Goals
- Provide worked examples that exercise backend and frontend generation separately and together.
- Add example DSLs, an `examples/README.md`, and short HOWTOs in the top-level `README.md`.
- Add automated tests that exercise the CLI `--mode=frontend` and `--mode=combined` flows.

## Acceptance criteria
- `npm run gen:frontend` generates frontend artifacts under `generated/` using `examples/frontend.dsl.ts`.
- `npm run gen:combined` generates both backend and frontend artifacts in one run.
- `npm run test:gen-frontend` passes in CI.

## Notes
- Keep examples minimal and focused on developer-experience and discoverability.
- Keep golden tests separate (Phase 7) and use `test:gen-frontend` to validate generation exists and compiles.
