# Changelog

All notable changes to the `irgen` project will be documented in this file.

## [0.2.0] - 2026-01-10

### General Purpose Frontend & Headless Runtime (Phase 3)

#### Core Architecture
- **Operation-Oriented Runtime**: Transitioned from a "frontend for a specific backend" to a "general-purpose webapp generator". The runtime now treats **Operations** as the atom of interaction.
- **Headless Client Runtime**: Implemented a backend-agnostic runtime (`lib/runtime.ts`) that manages operation execution, authentication, and response normalization without being tied to a specific UI framework.
- **React Hooks Integration**: Introduced `useOperation` and `useResource` hooks for headless interaction, providing built-in loading, error, and data state management.
- **DataSource Abstraction**: Support for multiple `datasources` with specialized `AuthStrategy`, `EnvelopeAdapter`, and `PaginationAdapter` to connect to any API (REST, GraphQL, etc.).

#### UI & Components
- **Operation-Bound Components**: Refactored Form and Select components to use the new `useOperation` hook.
- **Table Component**: New first-class `Table` component with direct binding to operations or resources, featuring premium styling and automatic data fetching.
- **Multi-App Deployment**: Support for `basePath` in frontend policies and IR, allowing multiple applications (e.g., `PublicSite` and `AdminPortal`) to be routed correctly under different subpaths.

#### DSL Enhancements
- **Modernized Frontend DSL**: `frontend()` now supports defining entities (`datasources`, `operations`, `resources`) directly via the options object or as standalone function calls within the callback.
- **Improved Type Safety**: Refined `RuntimeComponent` and DSL helper types for better developer experience.

## [Unreleased] - 2026-01-01

### Major Features (Phases 9-10)

#### Static-site (HTML-first)
- **Static-site target**: HTML-first emitter with policy-driven routing, SEO, theming, and asset management.
- **Progressive enhancements**: Optional sidebar toggle, copy-code, theme toggle, TOC scroll spy, and search.
- **Code highlighting**: Build-time Shiki highlighting with optional Prism client runtime.
- **SEO output**: `<title>`, description, canonical, OpenGraph, sitemap, and robots.txt.
- **Assets**: CSS generation, hashing, public asset passthrough, font preload hints, and CSP meta support.
- **Search**: Client-side search index + MiniSearch integration (fallback to basic search).
- **Examples & tests**: Static-site DSL examples and golden test coverage.

#### Frontend & UI
- **Global Dark Mode**: Implemented a comprehensive dark mode system with a persistent toggle in the main Navbar, `localStorage` state persistence, and adaptive styling for all components (Forms, Marketing, Layouts).
- **Multi-page SPA Support**: Added full support for complex, multi-page websites via `react-router-dom`, including a high-quality global Navbar and Footer.
- **Marketing Component Expansion**: Introduced 20+ rich marketing and content components (Hero, Features, Testimonials, FAQ, Logos, CTA, Stats, Timeline) with professional dark mode variants.
- **Native Syntax Highlighter**: Added a dedicated `CodeBlock` component and `code()` DSL helper, with automatic dependency management (injects `react-syntax-highlighter` into `package.json` only when needed).
- **Layout Refinement**: Enhanced Tabs, Panels, and Grid components with premium aesthetics, smooth transitions, and better active states.

#### CLI & Engine
- **CLI Flag: `--outDir`**: Added support for specifying a custom output directory via flag or positional argument.
- **Improved DSL Loading**: Solved relative import issues when loading DSLs through temporary transpile files by ensuring temp files reside in the same directory as the source.
- **Robustness**: Fixed interpolation bugs in the React emitter and relaxed Zod validation for internal URLs in form submissions.
- **Mapping & Lowering**: Updated mapping logic to preserve new component properties (like `codeBlock`) through the lowering pipeline.
#### Rebranding & Identity
- **Project Renaming**: Officially rebranded from `ir-codegen` to `irgen` for a modern, CLI-friendly identity (consistent with tools like `esbuild` and `vite`).
- **New Positioning**: Reframed the toolchain as a "compiler-style code generation toolchain built around Intermediate Representation (IR)".
- **Tagline Update**: Adopted "Compiler-style code generation via Intermediate Representation" as the primary tagline.
- **Documentation Overhaul**: Updated `README.md` and `ARCHITECTURE.md` to reflect the new policy-driven, compiler-oriented philosophy.
- **Example Refresh**: Updated `irgen-web.dsl.ts` with the new brand voice and positioning statements.

## [0.1.0] - 2025-12-28

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
- **SSG/Hybrid Rendering (React)**: Added Vite-based SSG pipeline with SSR bundle + prerender step, manifest-based CSS/JS injection, static HTML output in root `outDir`, and SPA fallback preserved as `index.spa.html`. Hybrid mode hydrates only when needed (currently all routes due to App shell theme toggle).
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
- **Frontend technical optimizations**:
  - **Logic Lowering**: Moved complex validation rules, visibility predicates, and computed value logic from React emitters to the lowering stage, reducing runtime overhead and emitter complexity.
  - **Shared Logic Library**: Extracted common evaluation logic (`evalLogic`, `getByPath`, `isEmptyVal`) into a generated `src/lib/logic.ts` library, shared across all components.
  - **Policy-Driven UI**: Introduced `FrontendTargetIR` with resolved policies for styling (e.g., custom primary colors) and framework configuration, enabling consistent UI decisions across the generated project.
  - **Dependency Tracking**: Implemented automatic dependency extraction for logical expressions, allowing generated `useEffect` hooks to trigger only when necessary (optimized rerenders).
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
