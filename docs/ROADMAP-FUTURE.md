# irgen Roadmap: Stage 3 & Beyond (v0.3.0+)

Following the successful stabilization of v0.2.2, this document outlines the vision for the next major evolution of the `irgen` toolchain.

## 1. Robustness & Observability (Enterprise Ready)
- [ ] **Built-in Logging & Tracing**: Automatic integration with OpenTelemetry or Winston/Pino in generated backends.
- [ ] **Error Boundary Contract**: Visual policy for handling runtime errors in frontend with auto-generated UI fallback components.
- [ ] **Health-check Emitter**: Automatic generation of `/health` and `/metrics` (Prometheus) endpoints based on IR operations.

## 2. Deployment & Cloud Native
- [ ] **Containerization Policy**: Optimized `Dockerfile` and `docker-compose.yml` generation based on project meta (provider DB, etc).
- [ ] **Serverless Adapters**: New targets for AWS Lambda, Vercel Functions, or Google Cloud Functions.
- [ ] **Edge SSR Support**: Enable hybrid targets for Edge runtimes like Cloudflare Workers or Deno.

## 3. Developer Experience (DX) & Tooling
- [ ] **`irgen init` Command**: Scaffolding for new projects with best-practice folder structures and modular `.dsl.ts` skeletons.
- [ ] **DSL Linker/LSP**: Simple Language Server support for VS Code to provide intelligent autocompletion for DSL methods and types.
- [ ] **Studio Preview**: Instant UI preview for components and layouts during DSL editing without requiring a full manual build.

## 4. Expansion of Ecosystem
- [ ] **Pluggable UI Library**: Support for external libraries like `shadcn/ui`, `Mantine`, or `Material UI` via visual policy overrides.
- [ ] **I18n First-class Support**: Dedicated localization contracts for multi-language keys in both static and runtime targets.
- [ ] **Mobile Target**: Multi-target expansion to Capacitor or React Native leveraging the existing frontend IR.

## 5. Advanced Logic Engine
- [ ] **Multi-field Dependencies**: Enhanced reactive logic for inter-field state management and cross-operation side-effects.
- [ ] **Shared Validation Schema**: Unified validation (Zod/Valibot) generated from IR and shared consistently between frontend and backend.
