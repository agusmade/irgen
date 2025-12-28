# Architecture Overview (Current Implementation)

Ringkasan arsitektur proyek *ir-codegen* — tujuan, alur transformasi (DSL → DeclIR → Lowering → Domain IR → Emitter), komponen utama, dan panduan singkat untuk memperluas atau menjalankan pipeline (backend & frontend dipisahkan).

---

## 🔎 Tujuan singkat
Proyek ini adalah generator kode minimal yang memungkinkan developer menulis DSL (TypeScript) untuk mendeskripsikan aplikasi (backend dan/atau frontend), lalu menjalankan pipeline yang menghasilkan kode TypeScript nyata (services, controllers, models, komponen React). Arsitektur dirancang agar komponen-komponen (DSL, IR, lowering, emitter) terpisah dan dapat dikembangkan secara independen.

---

## 🧭 Overview (flow)

```mermaid
flowchart TB
  %% =========================
  %%  AUTHORING / INPUTS
  %% =========================
  subgraph A[Authoring & Inputs]
    DSL["Developer DSL\n(JS/TS)\napp/page/entity/service..."]
    SCHEMA["Schema / Models\n(DB schema / table/relasi / OpenAPI)\noptional"]
    ASSETS["Assets/Resources\n(files, templates? optional)\noptional"]
  end

  %% =========================
  %%  EXECUTION / IR
  %% =========================
  subgraph B["Build Pipeline (deterministic)"]
    CLI["CLI / Runner\n(mytool build ...)"]
    RT["DSL Runtime / Evaluator\n(exec DSL, collect declarations)"]
    DECL["DeclIR (Unified Declarative IR)\nagnostic, dekat ke DSL"]
    VALID["Validate + Normalize\ncanonical naming rules"]
    MAP["Domain Mapper\nDeclIR -> DomainIR"]
  end

  %% =========================
  %%  DOMAIN IRS
  %% =========================
  subgraph C["Domain IRs (schema can differ)"]
    FEIR["FrontendIR\n(routes, pages, forms, tables)"]
    BEIR["BackendIR\n(entities, ops, services, controllers)"]
    CLIIR["CLIR\n(commands, flags, workflows)"]
  end

  %% =========================
  %%  LOWERING / TARGET IR
  %% =========================
  subgraph D["Lowering Rules (the 'brain')"]
    LOWER["Lowering Pipeline\nDomainIR -> TargetIR\n(conventions, policies)"]
    REACTIR[ReactIR]
    NESTIR[Nest/FastifyIR]
    ELECIR[ElectronIR]
  end

  %% =========================
  %%  EMIT / OUTPUT
  %% =========================
  subgraph E["Emitters (no string templates)"]
    AST["AST Builders\n(ts-morph / babel AST)"]
    PRINT["Printer/Formatter\n(prettier/biome optional)"]
    FS["File Emitter\n(write files, folder layout)"]
  end

  subgraph F["Generated Codebase (real source)"]
    GEN["Project Output\n(src/*, package.json, routes, services...)"]
    SHARED["Shared Adapters (single point of truth)\n/lib/id.ts\n/lib/http.ts\n/lib/logger.ts\n..."]
  end

  %% =========================
  %%  FLOWS
  %% =========================
  CLI --> RT
  DSL --> RT

  SCHEMA --> MAP
  ASSETS --> MAP

  RT --> DECL --> VALID --> MAP
  MAP --> FEIR
  MAP --> BEIR
  MAP --> CLIIR

  FEIR --> LOWER
  BEIR --> LOWER
  CLIIR --> LOWER

  LOWER --> REACTIR
  LOWER --> NESTIR
  LOWER --> ELECIR

  REACTIR --> AST
  NESTIR --> AST
  ELECIR --> AST

  AST --> PRINT --> FS --> GEN
  FS --> SHARED

  %% =========================
  %%  CONSISTENCY ENFORCEMENT EXAMPLE
  %% =========================
  subgraph G[Consistency Example: ID generation]
    IR_OP["IR Contract\nOperation: GENERATE_ID\n(no uuid/uniqid in IR)"]
    LOWER_ID["Lowering picks implementation\n(uuid_v4 | uniqid | ...)"]
    WRAP["Shared wrapper\nnewId() in /lib/id.ts"]
    USE["All generated files use:\nimport { newId } from '@/lib/id'\nconst id = newId();"]
  end

  BEIR --> IR_OP
  IR_OP --> LOWER_ID --> WRAP --> USE
  WRAP --> SHARED
```

---

## Short explanation
- The pipeline separates *authoring* (developer DSL, optional schemas/assets) from *code generation* (emitters).
- A **Unified DeclIR** captures the declarations from any source in a canonical format.
- **Domain mappers** convert the DeclIR into domain-specific IRs (BackendIR, FrontendIR, CLIIR). Each DomainIR is tailored to what generators in that domain need.
- The **Lowering Pipeline** applies policies and conventions to the DomainIR to produce TargetIRs (e.g., ReactIR, NestIR) — this is where choices such as `GENERATE_ID` implementations are decided.
- Backend and frontend targets are independent: enabling one does not auto-enable the other, and each emitter writes its own package/tooling (backend stays backend-only; frontend ships React/router/Tailwind).
- **Emitters** use AST builders (no string templates), printers and file emitters to write the final project scaffolding and code.

---

## Implementation plan (phased)
This is a practical, incremental plan. Each phase lists goals, key tasks, and suggested acceptance criteria.

### Phase 0 — Discovery & Design (1–2 days) — **Done** ✅
- Write concise design notes and finalise terminology (DeclIR, DomainIR, TargetIR, Lowering, Emit pipeline). ✅
- Decide policy keys (e.g., GENERATE_ID, LOGGER_IMPL, HTTP_CLIENT). ✅
- Acceptance: design doc committed to `docs/DESIGN-PHASE-0.md`. ✅

### Phase 1 — Decl Aggregator & Validation (2–4 days) — **Done** ✅
- Implement **DeclUnified** schema and an aggregator that runs DSL loaders and optional schema readers. ✅
- Add central validation & normalization pass (pluralization, id defaults, operation normalization). ✅
- Acceptance: aggregator returns validated `DeclUnified` for sample DSLs (see `scripts/decl-validate.test.js`). ✅

### Phase 2 — Mapper Registry (2–3 days) — **Done** ✅
- Implement mapper registry (register mapper for `backend`, `frontend`, `cli`). ✅
- Port `declToBackendIR` and `declToFrontendIR` to consume `DeclUnified` (via mappers). ✅
- Acceptance: produce BackendIR & FrontendIR from same DeclUnified source (see `scripts/mappers.test.js`). ✅

### Phase 3 — Lowering Engine & Policies (3–7 days) — **Done** ✅
- Create Lowering engine to convert DomainIR → TargetIR(s) with policy injection (POC: `declToBackendIR(app, policies?)`). ✅
- Extract policy contracts (e.g., ID policy) from lowering steps and expose `policies.generateId` and resolved `idProvider`. ✅
- Acceptance: Lowering yields IR with policy decisions and emitters honor policies (see `scripts/policy.test.js`). ✅
- Follow-up: Added a lightweight Lowering engine facade and registered backend lowering with it; added `scripts/lowering.test.js` to exercise transform registration and policy validation. ✅
- Policy validation: added zod-based policy schema support in the engine and switched backend to register a `generateId` schema; tests added (`scripts/policy-zod.test.js`). ✅

### Phase 4 — Emitter Pipeline (3–5 days) — **Done** ✅
- Implemented a small Emitter Engine (`src/emit/engine.ts`) allowing emitters to register and be invoked by name.
- Reworked emitters to register with the engine and support AST-based emission (`src/emit/backend-tsmorph.ts`, `src/emit/frontend-react.ts`).
- Added CLI discovery and invocation flags (`--emitters`, `--emitter=<name>`) and improved argument parsing (`src/cli.ts`).
- Added smoke tests: `scripts/emitter.test.js` (engine run) and `scripts/emitter-cli.test.js` (CLI list/run). All tests pass in CI/local runs.
- Acceptance: generator outputs remain functionally equivalent for sample runs; emitter engine and CLI smoke tests pass.

**Notes / follow-ups:**
- Remaining polish items (not required for Phase 4 acceptance): add a formatting/printer step (Prettier/Biome) before saving files, and add golden tests to assert emitted artifacts. These are tracked as follow-ups and fit into Phase 7 (Tests & Golden Files).

### Phase 5 — Shared Adapters & Library (2–4 days) — **Done** ✅
- Implemented `/lib/*` adapters generation: `lib/id.ts`, `lib/logger.ts`, and `lib/http.ts` via the backend emitter.
- Wired policies (`loggerImpl`, `httpClient`) into the lowering step and registered zod validation for them.
- Added `scripts/adapters.test.js` to validate adapter generation and contents; test passes locally.
- Acceptance: generated projects import and use `@/lib` stubs and the lowering + emitter flows honor policy choices.

### Phase 6 — CLI Orchestration & Flags (1–2 days) — **Done** ✅
- Added `--targets=backend,frontend` to orchestrate the pipeline from DSL to emitted outputs (generates target subfolders under the chosen `outDir`).
- Added `--inspect-ir` to print the lowered TargetIR for debugging and `--policies='{"key":"val"}'` for passing policies to the lowering engine.
- Acceptance: CLI runs orchestration for requested targets; `scripts/cli-build.test.js` exercises and validates the behavior. ✅

### Phase 7 — Tests & Golden Files (3–7 days) — **Done** ✅
- Added golden test suite (`scripts/golden-test.js`) that verifies emitted artifacts (models, services, controllers, adapters, package.json) against `test/golden/*` fixtures.
- Added `scripts/update-golden.js` and `npm run update-golden` to regenerate and commit golden fixtures.
- Implemented optional formatting step in the backend emitter (uses `ir.policies.formatter`, default `prettier`) and added `prettier` as a dev dependency to make formatting available in CI.
- Acceptance: CI/test runner can run `npm run test:golden` and will fail on mismatches. Run `npm run update-golden` to refresh fixtures when intentional changes are made.

### Phase 8 — Examples & Docs (1–3 days) — **Done** ✅
- Added `examples/frontend.dsl.ts` (frontend DSL) and `examples/app.dsl.ts` demonstrates combined backend+frontend generation.
- Added `examples/README.md` and `docs/PHASE-8.md` with usage and acceptance criteria.
- Added `scripts/gen-frontend.test.js` (CIable test) and `npm run test:gen-frontend` to validate frontend generation.
- Acceptance: `npm run gen:frontend` and `npm run gen:combined` work and `npm run test:gen-frontend` passes locally.

---

## Estimates & Notes
- Total rough estimate for a faithful implementation: **2–4 weeks** for a robust, tested pipeline (depending on team size and depth of emitter rework).
- The migration can be iterative: start with DeclUnified + mapper registry (POC), then progressively rewire lowering and emitters.
- Early tests and golden files are critical to keep regressions manageable.

---

## Acceptance Criteria (explicit)
- Single CLI run can consume DSL and produce one or more DomainIRs and TargetIRs.
- Policies such as ID generation are decided in lowering and implemented via shared adapters (no concrete implementation embedded in IR).
- Emitters use AST builders and produce normalized, formatted code that passes linting.
- Golden tests are available for core examples and CI enforces them.

---

## Migration strategy (high level)
1. Implement **POC**: DeclUnified + mapper registry → run backend generation via new flow (keeps emitters untouched temporarily).
2. Implement Lowering engine and policy contracts; migrate backend lowering into engine.
3. Swap emitters to emit via AST pipeline and add printers.
4. Expand tests and examples.

---

## Risks
- Scope can grow quickly; mitigate with strict PO/phase gate reviews.
- Golden tests can be brittle; provide `update-golden` workflow.
- Must freeze common AST formatting early to avoid churn.

---

## Next steps (recommended immediate action)
1. Create the POC for DeclUnified + mapper registry (2–3 days). ✅
2. Add minimal golden tests for POC.
3. Review policy key list and agree on initial adapters (id, logger, http).

---

## POC scaffold (what I added)
I scaffolded a small POC to demonstrate the unified flow end-to-end (minimal, iterative):

- `src/ir/decl-unified.ts` — `DeclUnified` type and helper
- `src/decl/aggregator.ts` — aggregator that loads DSLs and merges them into `DeclUnified`
- `src/mappers/index.ts` — simple mapper registry and builtin registration for `backend` and `frontend`
- `scripts/poc-smoke.js` — a minimal smoke test that runs `npm run gen:combined` and checks `generated/lib/models.ts` and `generated/services`
- `package.json` scripts added: `gen:combined` and `test:poc`

How to run the POC:

- `npm run gen:combined` — generates backend (and attempts frontend) from `examples/*` DSLs into `generated/`
- `npm run test:poc` — runs the smoke test and reports success or failure

Notes:
- The frontend loader may fail on some systems during this POC due to runtime module resolution; the POC aggregator is resilient and will proceed with backend generation even if frontend DSL fails to load.
- This is intentionally minimal — next step is to harden the frontend loader and add golden tests and CI integration.
