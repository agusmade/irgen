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
- **Rich UI Components**: Forms with Async Selects, Icons (`lucide-react`), and validation.
- **Tailwind CSS**: Automated styling configuration (`tailwind.config.js`, `postcss.config.js`).
- **Type Safety**: End-to-end type safety from DSL to UI.

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
- **Fullstack**: `generated/fullstack/`

## Manual Generation
You can generate artifacts from a specific DSL file using the CLI:

```bash
# General Backend
npx tsx src/cli.ts examples/app.dsl.ts generated/my-app --mode=backend

# Frontend (FormIO style)
npx tsx src/cli.ts examples/form-io.dsl.ts generated/my-frontend --mode=frontend
```

### Optional: enable PWA for frontend outputs
- Opt-in via CLI policies:  
  `npx tsx src/cli.ts examples/fullstack.dsl.ts generated/fullstack --targets=backend,frontend --policies='{"frontend":{"pwa":{"enabled":true,"name":"IR Codegen Docs","shortName":"IRDocs"}}}'`
- This writes `manifest.webmanifest`, `icons/icon.svg`, and `pwa-sw.js`, then registers the service worker in the generated frontend entry. Defaults stay off unless you set `pwa.enabled=true` (either via `--policies` or by passing `{ pwa: { enabled: true } }` as the options argument to `frontend(...)` in your DSL).
- Frontend outputs now include a minimal Vite setup. After generation run `npm install` then `npm run dev` inside the frontend folder (e.g. `generated/fullstack/frontend`) to serve the app.

## Architecture
See [docs/architecture.md](docs/architecture.md) for details on:
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
