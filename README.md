# IR Codegen (Robust Fullstack Generator)

[![pipeline status](https://gitlab.com/agusmade/ir-codegen/-/badges/main/pipeline.svg)](https://gitlab.com/agusmade/ir-codegen/-/pipelines)

An advanced Domain Specific Language (DSL) to Intermediate Representation (IR) codegen framework. It transforms concise declarative code into production-ready, maintainable fullstack applications.

Unlike typical scaffolders, **source code is owned by the tool**, while **user code is preserved** via the [Generation Gap Pattern](https://martinfowler.com/dslwip/GenerationGap.html).

## Key Features

### Backend (Node.js/TypeScript)
- **Generation Gap Architecture**: Separates generated base classes from user implementation. Regenerate safely without losing manual changes.
- **Repository Pattern**: Auto-generated repositories with Dependency Injection (DI) support.
- **Prisma Integration**: Database schema and client management out-of-the-box.
- **Extensibility Hooks**: `beforeCreate`, `afterCreate`, etc., in services for custom business logic.
- **Automated Testing**: Auto-generated `vitest` unit tests for services.

### Frontend (React/Vite)
- **Single Page Application (SPA)**: Generates a complete React Router based app.
- **Rich UI Components**: Forms covering text/number/select/textarea/checkbox/radio/date/datetime/time/url/phone/password/daterange, slider, currency, tags/chips, file upload, signature; static and async select with pagination/search/debounce; icons via `lucide-react`.
- **Tailwind CSS**: Automated styling configuration (`tailwind.config.js`, `postcss.config.js`).
- **Layout & Content**: Row/column/panel/tabs containers render real child components; static content/HTML blocks; CTA buttons with variants.
- **Form Logic & UX**: JSONLogic-like visibility/disable/required-if, default/compute expressions, compare fields, min/max (number/date), email/url built-ins, custom validators, prefix/suffix/tooltip/helpHtml/className, async select loading/error/skeleton, clearable selects.
- **Submission Pipeline & Actions**: Optional POST with success/error messaging, confirm dialog, lifecycle hooks (before/after, onSuccess/onError), redirect, local draft save; mock submit when URL not set.

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
- **Fullstack**: `generated/fullstack/` (backend and frontend are generated independently; install/run inside each target folder)
- **Docs (PWA-ready)**: `generated/docs/` (from `examples/docs.dsl.ts`, run frontend with `npm run dev`)

## Manual Generation
You can generate artifacts from a specific DSL file using the CLI:

```bash
# General Backend
npx tsx src/cli.ts examples/app.dsl.ts generated/my-app --mode=backend

# Frontend (FormIO style)
npx tsx src/cli.ts examples/form-io.dsl.ts generated/my-frontend --mode=frontend

# Backend + Frontend (separate targets)
npx tsx src/cli.ts examples/app.dsl.ts --targets=backend,frontend --outDir=generated/fullstack
# -> backend in generated/fullstack/backend, frontend in generated/fullstack/frontend
```

### Optional: enable PWA for frontend outputs
- Opt-in via CLI policies:  
`npx tsx src/cli.ts examples/fullstack.dsl.ts generated/fullstack --targets=backend,frontend`
- This writes `manifest.webmanifest`, `icons/icon.svg`, and `pwa-sw.js`, then registers the service worker in the generated frontend entry. Defaults stay off unless you set `pwa.enabled=true` (recommended via the options argument to `frontend(...)` in your DSL; you can still override with `--policies='{"frontend":{"pwa":{"enabled":true,"name":"IR Codegen Docs","shortName":"IRDocs"}}}'` if you prefer CLI flags).
- Frontend outputs now include a minimal Vite setup. After generation run `npm install` then `npm run dev` inside the frontend folder (e.g. `generated/fullstack/frontend`) to serve the app.
- Backend and frontend packages are decoupled: backend outputs stay backend-only; frontend outputs ship their own `package.json` with React/router/Tailwind toolchain.

## JS Module API & Extensions
- Import the DSL helpers directly:
  ```ts
  import { app, frontend } from "ir-codegen";

  app("My Backend", { policies: { backend: { generateId: "uuid_v4" } } }, (be) => { /* ... */ });
  frontend("My Frontend", { pwa: { enabled: true } }, (fe) => { /* ... */ });
  ```
- Programmatic generation with extensions:
  ```ts
  import { Codegen } from "ir-codegen";
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
- CLI can load extensions too: `npx tsx src/cli.ts ./myapp.ts --targets=backend,frontend --ext=./my-extension.ts`
- Electron target: IPC whitelist and handler stubs can be declared in the DSL via `policies.electron.ipc` (whitelist + `handlers`), and the emitter generates `ipc-handlers.ts` wired to `main.ts`, `preload.ts`, and `load-file.js`.

## Architecture
See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for details on:
- Generation Gap Pattern
- Port & Adapters (Hexagonal)
- Frontend Runtime & IR

## Roadmap
- [x] Separation of Concerns (Generated vs User space)
- [x] Dependency Injection & Repositories
- [x] Prisma ORM Adapter
- [x] Extensibility Hooks
- [x] Automated Testing
- [x] Rich Frontend Components & Routing
