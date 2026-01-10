# Phase 9 — Headless Runtime & Operation-Oriented Architecture

Status: **Done** ✅

This phase marks the transition of `irgen` from a "frontend for a specific backend" generator into a **general-purpose webapp generator**.

## Key Achievements

### 1. Headless Client Runtime
We implemented a robust, backend-agnostic runtime located in `lib/runtime.ts` (generated).
- **BaseRuntime**: Handles the core execution loop for operations.
- **Normalization**: Automatically normalizes response data using `EnvelopeAdapter`.
- **Authentication**: Pluggable `AuthStrategy` (cookies, bearer tokens).
- **React Hooks**: `useOperation` and `useResource` provide a declarative way to interact with the runtime from UI components.

### 2. Operation-Oriented Interaction
The frontend model now treats **Operations** (Actions) as the primary unit of interaction rather than raw resource endpoints.
- **Atomic Actions**: Components bind to operations (e.g., `publish-post`, `get-inventory`).
- **DataSource Abstraction**: Allows a single app to connect to multiple different backends (e.g., a PHP legacy API and a new Node.js service).

### 3. Integrated UI Components
- **Form Refactoring**: Forms now use the `useOperation` hook for both data fetching (select options) and submission.
- **Table Component**: A new standard component that binds directly to a list operation or resource, handling loading and error states automatically.

### 4. Multi-App Deployment (`basePath`)
Support for `basePath` routing allows multiple generated applications to be deployed under different subpaths (e.g., `/` for public, `/admin` for dashboard) within the same project.

### 5. DSL Modernization
The `frontend()` DSL was enhanced to support:
- Defining `datasources`, `operations`, and `resources` directly in the entry point options.
- Standalone helper function calls within the callback (e.g., `datasource(...)` instead of `app.datasource(...)`).

## Verification
- **Acceptance DSL**: `examples/phase1-acceptance.dsl.ts` exercises all the new features.
- **Generated Code**: Verified total decoupling of the UI from the backend fetching logic in `generated/phase1-acceptance/`.

## Next Steps
- Implement remaining component types (Survey, Geo, etc.).
- Add support for WebSocket/SSE in the headless runtime.
- Enhanced i18n support for runtime messages.
