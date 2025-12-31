# Changelog

All notable changes to the `ir-codegen` project will be documented in this file.

## [Unreleased] - 2025-12-XX

### Architecture/IR
- Refined IR layering to match DeclIR → DomainIR → TargetIR: DSL schemas now live under `src/ir/decl/*`, DomainIR files are schema/policy-free, and TargetIR holds emitter-facing policies (backend target now carries `policies.backend.*`).
- Removed legacy/unified/compat shims in favor of explicit bundle/normalize (`DeclBundle`) aggregation.
- Mapper/CLI paths always go through bundle → mapper → lowering engine → target transform → emitter; backend target lowering now handles policy defaults/validation.
- DSL can carry `meta`/`policies` that flow into DeclBundle; CLI merges DSL policies with `--policies` overrides. Extensions can be loaded via CLI `--ext` or programmatic API.
- CLI: registers built-in mappers before extensions, supports `--ext` loading, defaults to frontend DSL for frontend-like targets (electron/electrobun), prefers frontend loader when those targets requested, and logs actual targets (mode auto when no flag).

### Major Features (Phases 1-8 Completion)

#### Cross-cutting
- **Backend/Frontend decoupling**: Frontend generation is now driven by its own pipeline (lowering + emitter) and ships with its own `package.json`. Backend generation no longer injects frontend/tailwind dependencies or calls the frontend emitter; running backend and frontend together is an additive choice (run one, the other, or both).

#### Architecture
- **Generation Gap Pattern**: Refactored backend service generation to separate base classes (auto-generated) from user service implementations (scaffolded once).
- **Repository Pattern**: Introduced `BaseRepository` and concrete repositories with Dependency Injection (DI) support.
- **Prisma ORM**: Integrated Prisma as the data layer, replacing in-memory mocks.

#### Backend
- **Dependency Injection**: Services and Controllers now use constructor injection for better testability.
- **Extensibility Hooks**: Added `beforeCreate`, `afterCreate`, etc., hooks in `BaseService` for validation and business logic.
- **Automated Testing**: Integrated `vitest` and auto-generated test files for services.

#### Frontend
- **Tailwind CSS**: Full integration with automated `tailwind.config.js` and `postcss.config.js` generation.
- **Rich UI Components**:
  - Form fields now cover text/number/select/textarea/checkbox/radio/date/datetime/time/url/phone/password/daterange, slider, currency, tags/chips, file upload, signature.
  - Select supports static options and async data sources with search/pagination/debounce, clearable, loading/error skeletons.
  - Prefix/suffix/tooltip/helpHtml/className for richer templating; icons via Lucide React.
- **Client-Side Routing**: Transformed frontend output into a Single Page Application (SPA) using `react-router-dom` with auto-generated routes.
- **Optional PWA Output**: Frontend DSL/policies now accept `pwa.enabled=true` to emit `manifest.webmanifest`, service worker, and icons (defaults remain off).
- **Vite-Based Frontend Scaffolding**: Generated frontends include Vite config + plugins and ESM-compatible `postcss.config.js`, with entry pointing to `/src/index.tsx`.
- **React Import Safety**: Generated `App.tsx` explicitly imports React to avoid `React is not defined` when plugins are misconfigured.
- **Layout & Content Components**: Layout configs (row/column/panel/tabs) now render real child components; content/html blocks; CTA buttons with variants.
- **Validation & Logic**: JSONLogic-like sandbox (no `Function`), compare fields, min/max for numbers and dates (including date range), email/url built-ins, conditional visible/disabled/required-if, custom logic validators, required/empty checks that understand arrays/objects.
- **UX & Accessibility**: Async select UX (loading/error/search), multiple select, prefix/suffix/tooltip, aria-labels, error display; loading skeletons for async select.
- **Submission Pipeline & Actions**: Optional submit config (url/method/success/error messages) with loading/success/error UI, confirm dialog, lifecycle hooks (before/after submit, onSuccess/onError), redirect, draft save (localStorage), mock submit when not configured.
- **Electron Target (Multi-frontend)**: Added Electron target lowering + emitter (`electron-shell`) that generates `main.ts`, `preload.ts`, `ipc-handlers.ts`, `package.json`, `tsconfig.json`, and helper scripts. IPC whitelist + custom handler stubs come from DSL policies (`policies.electron.ipc`), and the emitter avoids double-registering built-in handlers. FrontendIR is shared between Web/PWA and Electron via policy-driven lowering.
- **Electrobun Extension (sample)**: Optional extension emits Electrobun bundle (config, IR summary, page/component stubs, barrel, main stub, package.json with Bun+electrobun scripts). Upstream Electrobun CLI may have platform limitations (see electrobun issue #10).
- **Target lowering rename**: Target transforms standardized to `lowering/targets/to-*.ts` (to-backend, to-frontend, to-electron, etc.) for clarity.
- **Electron hardening & lifecycle**: Added security defaults (window.open/will-navigate guards, CSP header, eval/Function disabled), reliability (single instance, window state persist/restore), logging, crash reporting slot, auto-update wiring with renderer status events and retry-on-fail, and session-aware IPC cleanup. Auto-update policies support provider/url/channel, prerelease opt-in, headers, and retry tuning.

### Pending / Parity Gaps vs Form.io (Future PRs)
- Components: survey, address/geo, select grid/resource grid, nested form/wizard/steps, edit grid/repeater, file upload storage adapter.
- Validation/Logic: stronger JSONLogic coverage (full operator set), i18n-friendly messages, richer unique/async validation.
- UX: dedicated i18n, richer per-field skeletons, configurable async select adapters, select grid.
- Actions: custom action handlers beyond submit (custom buttons/hooks).
- Styling/Templates: custom render templates per component/theme slots.
#### Developer Experience
- **Unified DSL**: Updated `app.dsl.ts` and introduced `fullstack.dsl.ts` examples.
- **Examples Organization**: `generate-examples.sh` script to manage multiple example outputs in dedicated folders.
- **Runtime Typing**: Improved TypeScript types for DSL runtime (`frontend-runtime.ts`).
