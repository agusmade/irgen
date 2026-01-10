# Frontend Runtime Contract v0

**Status:** v0 (stable-enough for extensions)
**Audience:** End users, extension authors, contributors
**Scope:** Frontend target runtime + its public hooks/contract (CSR/SSG/Hybrid compatible)

## 0. Purpose

The Frontend target generates a **backend-agnostic, operation-oriented** client runtime.
It enables you to generate:

* frontend apps only,
* backend targets only,
* or both—sharing the same contracts,
  **or running independently and integrating with existing frontend and/or backend systems.**

This contract defines the stable surface of the generated **Headless Runtime** (typically `src/lib/runtime.ts`) and how the UI binds to backend communication through **Operations** and **DataSources**.

---

## 1. Core Concepts

### 1.1 Operation vs Action

* **Operation** is the **backend-facing contract**: method, path, params, body/response types, adapters, auth requirements.
  Operations are the **architectural atom**.

* **Action** is the **UI binding** to an operation: loading state, retry/confirm UX, success/error handling, row/bulk contexts, etc.
  Actions do **not** change the backend contract; they change *how the UI triggers it*.

> CRUD is a common pattern of operations, not a requirement.

### 1.2 DataSource

A **DataSource** represents where requests go and how authentication is applied.

* Auth is resolved **per DataSource**.
* A single app may use multiple DataSources (cookie session + bearer token, etc.).

### 1.3 Resource (Sugar)

A **Resource** is a convenience abstraction that expands into (or references) Operations:

* list/get/create/update/delete,
* pagination/filter semantics,
* shared cache keys.

Resources must not replace the Operation model; they sit on top of it.

---

## 2. Generated Runtime Surface

### 2.1 Files

A generated Frontend output must include (names may vary by templates, but the roles must exist):

* `src/lib/runtime.ts`
  The single source of truth for request execution, auth wiring, and response normalization.

* `src/lib/registries/*` or equivalent
  Registries for adapters/strategies used by operations.

* `src/lib/hooks/*` or equivalent
  Hooks that expose operations/resources to UI.

### 2.2 Runtime Responsibilities

The runtime MUST:

1. Resolve DataSource config (baseUrl, headers, credentials, timeouts).
2. Attach auth per DataSource via **AuthStrategy**.
3. Serialize request body (json/text/multipart/form).
4. Execute request (fetch-like transport).
5. Parse response by declared **ResponseType** (json/text/html/blob).
6. Apply **EnvelopeAdapter** and **PaginationAdapter** if configured.
7. Normalize all failures into a single **NormalizedError** model.
8. Provide hooks for UI consumption (Operations + Resources).

The runtime MUST NOT:

* hardcode backend conventions (envelopes, field names, pagination rules),
* embed UI logic (routing, modals, layout),
* interpret policy directly (policy is resolved during lowering).

---

## 3. Operation Contract

An Operation contract is fully decided during lowering and emitted as TargetIR-backed runtime definitions.

### 3.1 OperationSpec (Conceptual)

An OperationSpec must define:

* `id`
* `datasourceId`
* `method`
* `path` (supports `:param` tokens)
* request mappings (optional)

  * `pathParams(input, ctx)`
  * `query(input, ctx)`
  * `headers(input, ctx)`
  * `bodySpec` (type + builder)
* `responseSpec` (type + adapters)
* optional `requiresAuth` / `requiredRoles`
* optional *headless* result signals (invalidate/redirect/download/toast) — see §7

> The exact TS type name may differ internally, but these fields and behaviors are the contract.

### 3.2 Body Types

Supported request body types (v0):

* `none`
* `json`
* `text`
* `multipart` (FormData)
* `formUrlEncoded` (optional but recommended)

Rules:

* `multipart` MUST NOT manually set `Content-Type` boundary.
* `json` SHOULD set `Content-Type: application/json`.
* Body builder must be deterministic given (input, ctx).

### 3.3 Response Types

Supported response types (v0):

* `json`
* `text`
* `html` (string, content-type text/html)
* `blob` (downloads/binary)

Rules:

* If response type is `json`, parsing failures must produce a normalized error.
* `html` is treated as text but may carry different UI presentation downstream.

---

## 4. Adapter Contract

### 4.1 EnvelopeAdapter

Purpose: map backend-specific envelopes into runtime’s standard shape.

Must support:

* `extractData(payload)`
* `extractMeta(payload)` (optional)
* `extractErrorPayload(payload)` (optional)

Rules:

* EnvelopeAdapter MUST NOT normalize errors into UI messages; it only extracts structured pieces.
* Error normalization is done by the ErrorNormalizer.

### 4.2 PaginationAdapter

Purpose: extract pagination info regardless of envelope format.

Must support:

* `extract(payload) -> { total?, nextCursor?, prevCursor? }`

Rules:

* PaginationAdapter must be independent from EnvelopeAdapter to avoid “mega-adapters”.

---

## 5. Authentication Contract

### 5.1 DataSource-Centric Auth

Each DataSource may specify an auth strategy:

* cookie-based session (credentials include)
* bearer token
* custom (extension-provided)

Auth MUST be applied per DataSource, not globally.

### 5.2 AuthStrategy

An AuthStrategy must be able to:

* attach credentials to request (headers and/or credentials mode)
* optionally load/refresh auth state

Rules:

* The runtime must allow multiple AuthStrategies registered by extensions.
* Route guards (UI-level) must check auth state; runtime enforces auth only if `requiresAuth` is declared.

---

## 6. Error Contract

All failures must be represented as a `NormalizedError`:

* `code` (e.g., UNAUTHORIZED, VALIDATION_ERROR, NETWORK_ERROR, etc.)
* `message`
* `status` (optional)
* `details` (optional)
* `fieldErrors` (optional for forms)

Rules:

* Raw backend errors may be attached as `raw`/`cause` (not for UI).
* UI should never depend on backend error shape directly.

---

## 7. Result Signals (Headless Outcome)

Operations may optionally emit **headless signals** to help UI stay declarative. Examples:

* invalidate caches (resource list/detail, operation keys)
* redirect to path
* open URL
* download with filename
* toast hints

Rules:

* These are **signals**, not UI implementation.
* UI decides how to interpret/execute them.
* v0 does not require all signals; but if a signal is present it must be emitted consistently.

---

## 8. Hooks Contract (UI Consumption)

Generated UI must consume backend interactions through runtime hooks, not inline fetches.

### 8.1 Required Hooks (v0)

At minimum:

* `useOperation(operationId)`
  Executes an operation (command/mutation) and returns status + execute function.

* `useResource(resourceId)`
  Provides resource state, list/detail, and mutations (sugar layer built on operations).

> Some implementations may split into `useQueryOperation` / `useMutationOperation`. That is allowed, as long as the emitted templates and docs remain consistent.

### 8.2 Hook Guarantees

Hooks must provide:

* loading / success / error state
* access to normalized errors
* deterministic cache keys for list/detail (when using resources)
* revalidation/invalidation (directly or via signals)

---

## 9. Rendering Modes Compatibility

Frontend target supports different rendering modes (policy-driven):

* CSR
* SSG
* Hybrid (SSG + selective hydration)

Contract guarantees:

* Operations/data sources are defined the same way regardless of rendering mode.
* The runtime must remain the single source of truth for communication.
* In SSG/Hybrid, prerendering must not require UI to embed backend assumptions.

---

## 10. Extension Points

Extensions may register:

* `EnvelopeAdapters`
* `PaginationAdapters`
* `AuthStrategies`
* (optional) UI components/widgets, if supported by the UI layer

Rules:

* Lowering must bind operation references to adapter/strategy IDs.
* Emitters must not hardcode adapter behavior.

---

## 11. Stability & Versioning Rules (v0)

### 11.1 What is stable in v0

* The **conceptual contract**: DataSource, Operation, Resource, adapters, normalized error.
* The existence and role of `lib/runtime.ts` as communication source of truth.
* The requirement that UI templates do not embed inline transport logic.
* The runtime behavior guarantees described above.

### 11.2 What may change in v0

* Exact filenames (as long as roles exist and docs reflect it).
* Hook naming (`useOperation` vs split query/mutation), if documentation and templates match.
* Internal TargetIR structure and lowering implementation details.

### 11.3 Breaking changes

A change is breaking if it:

* requires end users to rewrite DSL definitions for DataSource/Operation semantics,
* changes normalized error shape expected by templates,
* removes adapter/strategy extension points,
* reintroduces inline fetch logic in templates.

---

## 12. Non-Goals (Explicit)

* Supporting WebSocket as a special case in v0.
  (If added later, it must appear as a streaming operation type, not a runtime side-channel.)

* Enforcing a single backend style (REST-only, CRUD-only, envelope-only).

* Making policies a runtime concern.
  (Policies are compile-time lowering inputs.)

---

## Appendix A: Mental Model Summary

* **DSL expresses intent**
* **Policy expresses constraints/preferences**
* **Lowering decides**
* **Emitters serialize**
* **Frontend runtime executes**
* **UI binds to operations via hooks**
