# Changelog

All notable changes to the `ir-codegen` project will be documented in this file.

## [Unreleased] - 2024-XX-XX

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
- **Rich UI Components**: Added support for:
  - Select Inputs (Static Options & Async Data Source).
  - Icons (Lucide React integration).
  - Advanced Input props (placeholder, description).
- **Client-Side Routing**: Transformed frontend output into a Single Page Application (SPA) using `react-router-dom` with auto-generated routes.
- **Optional PWA Output**: Frontend DSL/policies now accept `pwa.enabled=true` to emit `manifest.webmanifest`, service worker, and icons (defaults remain off).
- **Vite-Based Frontend Scaffolding**: Generated frontends include Vite config + plugins and ESM-compatible `postcss.config.js`, with entry pointing to `/src/index.tsx`.
- **React Import Safety**: Generated `App.tsx` explicitly imports React to avoid `React is not defined` when plugins are misconfigured.
- **Form Field Enhancements**: Frontend DSL supports typed fields (text/number/select/textarea/checkbox/radio/date/datetime/email/password) with validators (required, min/max, minLength/maxLength, pattern); emitter renders new controls and validations.
- **Layout & Content Components**: Added layout configs (row/column/panel/tabs) and non-form content/button blocks to frontend DSL; emitter renders basic containers and CTA buttons with variants.
- **Form Logic & UX**: Conditional visible/disabled/required-if, default/compute expressions, async select UX (loading/error/search), multiple select, prefix/suffix/tooltip support.
- **Submission Pipeline**: Optional form submit config (url/method/success/error messages) with success/error UI and loading state; mock submit when not configured.

### Pending / Parity Gaps vs Form.io (Future PRs)
- Components: file upload (storage/adapter), signature, currency/slider/survey, phone/url/time/day/datetime-range, tags/chips, resource/select grid, address/geo, nested form/wizard/steps, edit grid/repeater.
- Layout: columns/panel/tabs with real child components (not placeholders), rich HTML templates.
- Validation/Logic: unique/custom validation functions/JSONLogic, compare fields, min/max for date/time, email/url built-in, conditional show/hide/disable with JSONLogic, safer expression sandbox (replace `Function`).
- UX: async select pagination/filter/debounce, clearable selects, per-field error/loading skeletons, aria/i18n.
- Actions: lifecycle hooks (before/after submit), custom action handlers, draft save, redirect/confirmation.
- Styling/Templates: custom render templates per component, richer tooltip/help/prefix/suffix on more field types.
#### Developer Experience
- **Unified DSL**: Updated `app.dsl.ts` and introduced `fullstack.dsl.ts` examples.
- **Examples Organization**: `generate-examples.sh` script to manage multiple example outputs in dedicated folders.
- **Runtime Typing**: Improved TypeScript types for DSL runtime (`frontend-runtime.ts`).
