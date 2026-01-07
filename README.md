# irgen (Robust Fullstack Generator)

[![pipeline status](https://gitlab.com/agusmade/irgen/-/badges/main/pipeline.svg)](https://gitlab.com/agusmade/irgen/-/pipelines)

> **Compiler-style code generation via Intermediate Representation.**

irgen is a compiler-style code generation toolchain built around Intermediate Representation (IR). You describe your system in terms of **domain and policy**, and irgen performs IR transformations to generate backend, frontend, desktop, mobile, and documentation targets for you.

irgen is designed for developers who want architectural clarity without maintaining endless glue code. Unlike typical scaffolders, **source code is owned by the tool**, while **user code is preserved** via the [Generation Gap Pattern](https://martinfowler.com/dslwip/GenerationGap.html).

### What irgen is NOT
irgen focuses on **architecture and determinism**, not convenience shortcuts. irgen is **not**:
- A framework or a library
- A simple scaffolding tool
- A template generator
- An AI-driven code writer

## Key Features

### Backend (Node.js/TypeScript)
- **Generation Gap Architecture**: Separates generated base classes from user implementation. Regenerate safely without losing manual changes.
- **Repository Pattern**: Auto-generated repositories with Dependency Injection (DI) support.
- **Prisma Integration**: Database schema and client management out-of-the-box.
- **Extensibility Hooks**: `beforeCreate`, `afterCreate`, etc., in services for custom business logic.
- **Automated Testing**: Auto-generated `vitest` unit tests for services.

### Frontend (React/Vite)
- **Multi-page SPA Support**: Generates a complete React Router based app with support for complex multi-page sites (Home, Features, Docs, etc.).
- **Global Dark Mode**: Built-in persistence (`localStorage`) and toggle in a sleek, glassmorphism Navbar.
- **Rich UI Components**:
  - **Forms**: text/number/select/textarea/checkbox/radio/date/datetime/time/url/phone/password/daterange, slider, currency, tags/chips, file upload, signature.
  - **Marketing**: Responsive Hero, Features, Testimonials, FAQ, Logos, CTA, Stats, and Timeline sections.
  - **Dev Tools**: Native **Syntax Highlighter** (`CodeBlock`) with automatic dependency management.
- **Tailwind CSS**: Automated styling configuration and adaptive dark mode variant support for all components.
- **Layout & Content**: Row/column/panel/tabs containers; smooth transitions and premium micro-interactions.
- **Form Logic & UX**: JSONLogic-like predicates, dependency-tracked `useEffect` hooks, async select with debounce/pagination/search.
- **Submission Pipeline**: lifecycle hooks, confirm dialogs, and draft persistence.

### Static Site (HTML-first)
- **HTML-only output**: emits final HTML (no React hydration), JS is strictly progressive enhancement.
- **Policy-driven output**: routing, SEO/meta, assets, theming, and enhancements are controlled via `staticSite` policy.
- **Optional enhancements**: sidebar toggle, copy code, theme toggle, TOC scroll spy, and client-side search.
- **Build-time highlighting**: Shiki for pre-highlight, optional Prism runtime for client mode.

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Examples
We provide a script to generate all example projects into `generated/` folders:

```bash
./scripts/generate-examples.sh
```

### 3. Explore Outputs
- **Backend Only**: `generated/backend-only/`
- **Rich Frontend**: `generated/form-io/` (Run `npm install && npm run dev` inside to see the UI)
- **Multi-page Website**: `generated/irgen-web-full/` (from `examples/irgen-web.dsl.ts`)
- **Fullstack**: `generated/fullstack/` (backend and frontend are generated independently)
- **Docs (PWA-ready)**: `generated/docs/` (from `examples/docs.dsl.ts`)
- **Static Docs (HTML-first)**: `generated/static-docs/` (from `examples/docs.dsl.ts` with `--targets=static-site`)

## Manual Generation
You can generate artifacts from a specific DSL file using the CLI:

```bash
# General Backend
npx irgen examples/app.dsl.ts generated/my-app --mode=backend

# Frontend (FormIO style)
npx irgen examples/form-io.dsl.ts generated/my-frontend --mode=frontend

# Backend + Frontend (separate targets)
npx irgen examples/app.dsl.ts --targets=backend,frontend --outDir=generated/fullstack
# -> backend in generated/fullstack/backend, frontend in generated/fullstack/frontend

# Static-site (HTML-first)
npx irgen examples/docs.dsl.ts --targets=static-site --outDir=generated/static-docs
```

### Optional: enable PWA for frontend outputs
- Opt-in via CLI policies:  
`npx irgen examples/fullstack.dsl.ts generated/fullstack --targets=backend,frontend`
- This writes `manifest.webmanifest`, `icons/icon.svg`, and `pwa-sw.js`, then registers the service worker in the generated frontend entry. Defaults stay off unless you set `pwa.enabled=true` (recommended via the options argument to `frontend(...)` in your DSL; you can still override with `--policies='{"frontend":{"pwa":{"enabled":true,"name":"irgen Docs","shortName":"IRDocs"}}}'` if you prefer CLI flags).
- Frontend outputs now include a minimal Vite setup. After generation run `npm install` then `npm run dev` inside the frontend folder (e.g. `generated/fullstack/frontend`) to serve the app.
- Backend and frontend packages are decoupled: backend outputs stay backend-only; frontend outputs ship their own `package.json` with React/router/Tailwind toolchain.

## JS Module API & Extensions
- Import the DSL helpers directly:
  ```ts
  import { app, frontend } from "irgen";

  app("My Backend", { policies: { backend: { generateId: "uuid_v4" } } }, (be) => { /* ... */ });
  frontend("My Frontend", { pwa: { enabled: true } }, (fe) => { /* ... */ });
  ```
- Programmatic generation with extensions:
  ```ts
  import { Codegen } from "irgen";
  import myExtension from "./my-extension.js";

  const codegen = new Codegen({ extensions: [myExtension] });
  await codegen.generate({ entries: ["./myapp.ts"], targets: ["backend", "frontend"], outDir: "generated" });
  ```
- Extension shape: export a function `(ctx, options?) => void|Promise<void>` and use the provided `ctx` to register mappers/transforms/emitters/target mappings:
  ```ts
  // my-extension.ts
  export default (ctx) => {
    ctx.registerTargetEmitter("my-target", "my-emitter");
    ctx.registerMapper("my-target", (decl) => {/* ... */}, { force: true });
  };
  ```
- CLI can load extensions too: `npx irgen ./myapp.ts --targets=backend,frontend --ext=./my-extension.ts`
- Electron target: IPC whitelist and handler stubs can be declared in the DSL via `policies.electron.ipc` (whitelist + `handlers`), and the emitter generates `ipc-handlers.ts` wired to `main.ts`, `preload.ts`, and `load-file.js`. Electron shell includes security hardening (contextIsolation/nodeIntegration off, navigation/CSP guards), session restore (window state persisted to userData), crash reporting slot, auto-update wiring with renderer status events (`auto-update-status`), and optional retry on failure.
- Extension namespacing & order: built-ins register first; extensions load in order. Use `ctx.namespace("myExt")` to prefix registrations (e.g., `myExt:frontend`) to avoid collisions. See `docs/EXTENSIONS.md` for details.

Notes:
- Published CLI (`npx irgen`) can load `.dsl.ts` (and its `.ts` imports) directly using the built-in tsx loader.
- For local development inside this repo, you can still run `npx tsx src/cli.ts ...` if preferred.

## Architecture
See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for details on:
- Generation Gap Pattern
- Port & Adapters (Hexagonal)
- Frontend Runtime & IR
- Frontend SSG plan: [docs/FRONTEND-SSG-PLAN.md](docs/FRONTEND-SSG-PLAN.md)

## Roadmap
- [x] Separation of Concerns (Generated vs User space)
- [x] Dependency Injection & Repositories
- [x] Prisma ORM Adapter
- [x] Extensibility Hooks
- [x] Automated Testing
- [x] Rich Frontend Components & Routing
- [x] Frontend SSG/Hybrid (Vite prerender)
