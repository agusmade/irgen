# Changelog

All notable changes to the `irgen` project will be documented in this file.

## [0.3.1] - 2026-02-03

### New Features
- **🐘 PHP Hybrid App Platform**: Major enhancement to the `php-shared-hosting` extension, transforming it into a full-stack platform for shared hosting.
    - **Multi-App Support**: Host any number of React SPAs (Admin, Portal, User App) on a single shared hosting account with automatic dynamic routing.
    - **MySQL/REST Engine**: DSL `entity()` declarations automatically generate secure PHP REST controllers using a shared PDO-based storage engine.
    - **Aesthetic Blogging**: Premium flat-file blogging system with refined typography, dark mode, RSS, and Sitemap.
- **Extension CLI Contributions**: Extensions can now contribute custom logic to core CLI commands.
- **Pluggable Validators**: Use `ctx.registerValidator` to add custom semantic checks to `irgen check`.
- **Pluggable Templates**: Use `ctx.registerTemplate` for project starters in `irgen init`.

### Enhancements
- **Improved Extension Loading**: Unified extension loader with robust path resolution for local files and npm packages.
- **Improved Multi-DSL Aggragation**: Core now supports flattening and merging applications from multiple DSL files into a single IR bundle.

## [0.3.0] - 2026-02-01

### New Features
- **Project Scaffolding**: Introduced `irgen init` for interactive project setup and best-practice templates.
- **Semantic Validator (Linker)**: New `irgen check` command to validate DSL integrity, including entity references, name uniqueness, and cross-file consistency.
- **Studio Preview Dashboard**: Real-time web-based visualization tool (`irgen studio`) to see project architecture and component trees as you edit.
- **Structured Logging**: Built-in `pino` integration in generated backends for production-ready observability.
- **Health & Metrics**: Automatic generation of `/health` and `/metrics` (Prometheus) endpoints.
- **Error Boundary Contract**: Policy-driven Error Boundary for frontend reliability and user feedback.

### Enhancements
- **CLI Robustness**: Resolved command fall-through issues and improved error reporting.
- **Documentation**: Significant updates to policy references, architecture guides, and roadmaps.

## [0.2.3] - 2026-01-21

### Bug Fixes
- **Frontend Emitter**: Fixed `ReferenceError: rowActionIcons is not defined` in `frontend-react.ts` when rendering table row actions.
- **Frontend Components**: Resolved `[object Object]` AST leak in code blocks by ensuring `React` is correctly imported and utilized for runtime element creation.

### Documentation & Verification
- **Test Suite**: Verified all core golden tests (Backend, Electron, Static Site) pass with the latest fixes.
- **Cleanup**: Improved documentation quality and consistency in core emitters.

## [0.2.2] - 2026-01-18

### Core Extensions & Architecture (Phase 10)
- **Universal Action Model**: Introduced `ActionSpec` type and `onClick` support for buttons, enabling a consistent "invoke operation" or "navigate" behavior across all UI components.
- **Operation-Backed Forms**: Updated `DeclFormSchema` to support `operationId` in submission configuration, allowing forms to bind directly to backend operations instead of hardcoded URLs.
- **Micro-Frontend Support**: Added `macro` field to `DeclComponentSchema`, enabling the definition of "Page Templates" (like `TablePage`, `EditorPage`) as single high-level components with props.
- **Dependency Declaration**: Added `requiredComponentKeys` to `DeclFrontendAppSchema`, allowing extensions and presets to explicitly declare their UI component dependencies.
- **Active Runtime Signals**: Implemented functional execution of `toast`, `redirect`, `openUrl`, and `downloadAs` signals in the headless runtime (`BaseRuntime`), replacing passive data with active behavior.
- **Frontend auth contract**: Added `frontend.auth` to declare login/logout operations, login path, and nav visibility rules in a deterministic, policy-driven way.
- **Form lifecycle upgrades**: Added `form.load` with args/when/mapFields, plus `form.submit.label` for configurable submit text.
- **Table UX contracts**: Added `table.rowNavigateTo` (row click navigation) and `table.rowActions` with per-row actions and optional confirm dialogs.
- **Runtime logic evaluation**: Frontend runtime now evaluates logic expressions for path params, action arguments, and field mapping, enabling dynamic behaviors without recompilation.
- **Frontend build hooks**: Added `build.copyTo`/`build.postbuild` policy to emit postbuild copy scripts in frontend outputs (`copyToPublic` is deprecated).
- **Component UI variants**: Added `component.props.uiVariant` (`header`/`inline`) and `component.props.layoutVariant` (`header`) to control header-style layouts without card wrappers.
- **Visual policy (best-effort)**: Emitter reads `policies.frontend.visual` knobs (`navLayout`, `contentWidth`, `density`) without adding schema validation.
- **Topbar controls (best-effort)**: `visual.topbarControls` controls right-side navbar items (search/notifications/theme/avatar), avatar visibility, and optional custom links.
- **Branding controls (best-effort)**: `visual.brand` can hide/show logos and override logo src/text/icon in topbar/sidebar.
- **Nav overrides (best-effort)**: `visual.navItems` can define separate menus for topbar and sidebar, and hide topbar.
- **Footer/search overrides (best-effort)**: `visual.footerLinks` and `visual.search` allow replacing footer links and search copy without core edits.
- **Footer layout (best-effort)**: `visual.footer` can disable or compact footer and override footer text.
- **Form styling (best-effort)**: `visual.form` allows overriding form label/input/error/button/form classes.
- **Button styling (best-effort)**: `visual.button` allows overriding base/variant button classes.
- **Table styling (best-effort)**: `visual.table` allows overriding table container/row/cell/action classes.
- **Tabs styling (best-effort)**: `visual.tabs` allows overriding tabs container/header/button/panel classes.
- **Marketing blocks (best-effort)**: `visual.marketing` allows overriding hero/features/logos/etc container/title classes.
- **Card styling (best-effort)**: `visual.cards` allows overriding card/empty/placeholder classes.
- **Prose styling (best-effort)**: `visual.prose` allows overriding markdown/prose wrapper class.
- **Motion styling (best-effort)**: `visual.motion` allows overriding page enter + hover/alert/tag motion classes.
- **Copy overrides (best-effort)**: `visual.copy` allows overriding empty/placeholder/table/tab strings plus common UI labels, including runtime error text.
- **Token overrides (best-effort)**: `visual.tokens` allows overriding typography/spacing/radius/shadow/color/motion tokens.
- **Icon overrides (best-effort)**: `visual.icons` allows overriding default UI chrome icons, including docs section + docs item + nav + footer + search modal + row action icons.
- **SSR fix**: ensure `App.tsx` imports React when using `React.createElement` in generated UI.
- **Breakpoint overrides (best-effort)**: `visual.breakpoints` allows overriding responsive layout classes (padding/sidebar/docs grid).
- **Docs/background overrides (best-effort)**: `visual.docs` and `visual.background` control docs labels/sidebar/TOC and decorative gradients.
- **Labels/avatar overrides (best-effort)**: `visual.labels.sidebarLabel` and `visual.topbarControls.avatar.src` replace hardcoded sidebar label and avatar URL.

## [0.2.1] - 2026-01-11

### GitHub Pages (SSG/Hybrid)
- Generate and build SSG/hybrid output for `examples/irgen-web.dsl.ts` in CI.
- Fix basePath handling so nav/docs links keep `/irgen` prefix after hydration.
- Add favicon/apple-touch-icon links in SSG output.
- Fix PWA manifest icon path and service worker cache paths under basePath.
- Set `SITE_URL` in Pages workflow for correct sitemap/robots URLs.

### Packaging
- Remove TypeScript sourcemaps and declaration maps from build output.
- Align README outputs with generated examples and keep example script in sync.

## [0.2.0] - 2026-01-11

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

## [0.1.0] - pre-public history

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
