# Phase 0 — Discovery & Design

Status: **Done** ✅

This short design note captures the terminology decisions, policy keys, and initial conventions chosen for the unified pipeline POC.

## Finalized terminology
- DeclIR: Declarative IR captured from DSLs and schema inputs. Close to authoring surface-level concepts (apps, entities, pages, operations).
- DeclBundle: A normalized collection of one or more DeclIR instances; canonical input to mappers.
- DomainIR: Domain-specific IR derived from DeclUnified (BackendIR, FrontendIR, CLIIR). Shaped for domain lowering steps.
- Lowering: The deterministic transformation from DomainIR → TargetIR(s); where policy decisions and conventions are applied.
- TargetIR: Concrete IR tailored to an emitter (e.g., ReactIR, NestIR) that is straightforward to convert to AST.
- Emitter: Module that builds AST (ts-morph / Babel AST) from TargetIR, prints and writes files.
- Policy keys: Named knobs that inform lowering choices and adapter wiring (see below).

## Policy keys (initial proposed set)
These keys will be used by lowering to make pluggable decisions and to wire shared adapters in generated output.
- generateId (string) — choice of id provider: `uuid_v4` | `shortid` | `custom`. (IR should only express GENERATE_ID contract.)
- loggerImpl (string) — `console` | `pino` | `winston` | `custom`.
- httpClient (string) — `fetch` | `axios` | `got` | `custom`.
- formatter (string) — `prettier` | `biome` | `none`.
- frontendFramework (string) — `react` | `next` | `svelte` | `vue`.
- authStrategy (string) — `none` | `jwt` | `oauth` | `custom`.
- dbAdapter (string) — `in-memory` | `postgres` | `mongo` | `custom`.

Notes: Policy values are strings and should be validated in the lowering phase. Defaults will be chosen conservatively in the POC (e.g., `generateId=uuid_v4`, `formatter=prettier`).

## Conventions & decisions
- Emitters will use AST builders (ts-morph) rather than string templates to reduce brittle formatting and make refactors safer.
- IR will be kept free of runtime implementation details (e.g., no raw `uuid()` calls in IR; instead have a GENERATE_ID policy concept). Lowering binds this policy to concrete implementations and generated code imports `@/lib/id` wrapper.
- Canonical naming rules: use `pascal` for types/classes, `camel` for variables/functions, `kebab` for file paths. Pluralization is via `pluralize()` with optional per-entity override (e.plural in DSL).
- DSL loaders should be resilient: support both ESM dynamic import and a transpile fallback to a temporary `.mjs` when necessary.

## Acceptance criteria for Phase 0
- A short design doc is committed to `docs/DESIGN-PHASE-0.md` (this file). ✅
- Terminology and policy key list are agreed and documented. ✅
- Minimal conventions are documented (naming, emitter approach, ID policy). ✅

## Next steps following Phase 0
- Proceed to Phase 1 POC (DeclUnified aggregator already scaffolded) and add validation rules and canonical normalizations.
- Add policy validation in lowering POC and wire simple adapters (`/lib/id.ts`) as a proof-of-concept.

---

(If you want any policy key added or renamed, tell me and I’ll update this file.)
