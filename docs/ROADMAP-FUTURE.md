# irgen Roadmap: Stage 3 & Beyond (v0.3.0+)

Following the successful stabilization of v0.2.2, this document outlines the vision for the next major evolution of the `irgen` toolchain.

## 1. Robustness & Observability (Enterprise Ready)
- [x] **Built-in Logging & Tracing**: Automatic integration with OpenTelemetry or Winston/Pino in generated backends.
- [x] **Error Boundary Contract**: Visual policy for handling runtime errors in frontend with auto-generated UI fallback components.
- [x] **Health-check Emitter**: Automatic generation of `/health` and `/metrics` (Prometheus) endpoints based on IR operations.

## 2. Deployment & Cloud Native
- [ ] **Containerization Policy**: Optimized `Dockerfile` and `docker-compose.yml` generation based on project meta (provider DB, etc).
- [ ] **Serverless Adapters**: New targets for AWS Lambda, Vercel Functions, or Google Cloud Functions.
- [ ] **Edge SSR Support**: Enable hybrid targets for Edge runtimes like Cloudflare Workers or Deno.

## 3. Developer Experience (DX) & Tooling
- [x] **`irgen init` Command**: Scaffolding for new projects with best-practice folder structures and modular `.dsl.ts` skeletons.
- [x] **DSL Linker/LSP**: Integrated semantic validator (`irgen check`) to provide intelligent integrity checks for DSL references and names.
- [x] **Studio Preview**: Instant web-based dashboard (`irgen studio`) to visualize project architecture and IR in real-time.

## 4. Expansion of Ecosystem
- [ ] **Pluggable UI Library**: Support for external libraries like `shadcn/ui`, `Mantine`, or `Material UI` via visual policy overrides.
- [ ] **I18n First-class Support**: Dedicated localization contracts for multi-language keys in both static and runtime targets.
- [ ] **Mobile Target**: Multi-target expansion to Capacitor or React Native leveraging the existing frontend IR.

## 5. Advanced Logic Engine
- [ ] **Multi-field Dependencies**: Enhanced reactive logic for inter-field state management and cross-operation side-effects.
- [ ] **Shared Validation Schema**: Unified validation (Zod/Valibot) generated from IR and shared consistently between frontend and backend.

---

# Completed Feature Documentation

## Built-in Logging & Tracing (v0.3.0)

**Overview**
The backend generator now integrates `pino` and `pino-http` to provide production-ready structured logging out of the box.

**Key Features**
- **Structured JSON Logs**: Uses `pino` for high-performance JSON logging.
- **Request Tracing**: Automatic request ID generation and propagation using `AsyncLocalStorage`.
- **HTTP Logging**: `pino-http` middleware logs all incoming requests, responses, and duration.
- **Auto-Injection**: `logger` is injected into `BaseService` and automatically used in generated Controllers associated with operations.

**Configuration**
Logging behavior is fully configurable via the `logging` policy in your DSL:

```typescript
// Example: src/ir/target/backend.policy.ts
export const MyPolicy = BackendPolicy({
  logging: {
    enabled: true,
    level: "debug",   // 'debug' | 'info' | 'warn' | 'error'
    format: "pretty", // 'json' (default) or 'pretty' (reads nicer in dev console)
    redact: ["password", "token", "secret", "authorization"], // keys to auto-redact
  }
});
```

**Generated Code Structure**
- `lib/logger.ts`: Singleton logger instance configured with policy settings.
- `server.ts`: Applies `pinoHttp` middleware and request context.
- `package.json`: Automatically adds `pino`, `pino-http`, and `pino-pretty` (dev) dependencies.

## Health-check Emitter (v0.3.0)

**Overview**
Automatic generation of health check and metrics endpoints for production monitoring (Kubernetes, Prometheus).

**Configuration**
```typescript
// Example: src/ir/target/backend.policy.ts
export const MyPolicy = BackendPolicy({
  health: {
    enabled: true,         // default: true
    endpoint: "/health",   // default: "/health"
    metrics: {             // Optional Prometheus metrics
      enabled: true,
      endpoint: "/metrics"
    }
  }
});
```

**Features**
- **Health Endpoint**: Returns 200 OK with uptime and timestamp.
- **Metrics Endpoint**: (Optional) Exposes Node.js metrics using `prom-client`.
- **Zero Config**: Works out of the box with defaults.

## Error Boundary Contract (v0.3.0)

**Overview**
A visual policy for handling runtime errors in the frontend by wrapping the application in a generated Error Boundary component.

**Configuration**
```typescript
// Example: src/ir/target/frontend.policy.ts
export const MyFrontendPolicy = FrontendPolicy({
  errorBoundary: {
    enabled: true,           // default: true
    componentName: "ErrorBoundary",
    fallback: "simple"       // "simple" | "detailed"
  }
});
```

**Features**
- **Automatic Wrapping**: The generated `App.tsx` is automatically wrapped in `<ErrorBoundary>`.
- **Fallback UI**: Generates a clean, utilitarian fallback UI component in `src/components/ErrorBoundary.tsx`.
- **Zero Dependency**: Uses a class-based React component, requiring no external libraries.

## `irgen init` Command (v0.3.0)

**Overview**
A project scaffolding tool that generates a standard `irgen` project structure with best-practice configurations.

**Key Features**
- **Interactive Setup**: Prompts for project name and template selection.
- **Templates**: Supports `combined`, `backend-only`, and `frontend-only` project types.
- **Auto-Config**: Generates `package.json`, `tsconfig.json`, and initial `.dsl` examples.

## DSL Linker / Semantic Validator (v0.3.0)

**Overview**
The `irgen check` command implements the core logic of a Language Server (LSP) by validating the semantic integrity of the DSL bundle before any code generation occurs.

**Key Features**
- **Referential Integrity**: Ensures `entityRef` on components points to valid Entities.
- **Page-Component Binding**: Verifies that pages only call defined components.
- **Uniqueness Enforcement**: Detects duplicate entity names across the entire project bundle.
- **Cross-File Support**: Can validate multiple DSL files concurrently to ensure cross-module consistency.

**Usage**
```bash
npx irgen check examples/*.dsl.ts
```

## Studio Preview Dashboard (v0.3.0)

**Overview**
An instant web-based visualization tool (`irgen studio`) that provides a real-time architectural overview of the project.

**Key Features**
- **Visual Mapping**: See all Apps, Entities, and Page component trees at a glance.
- **Live Watcher**: Automatically re-aggregates and refreshes the dashboard when any DSL file is saved.
- **Interactive UI**: Clean, premium dashboard designed with modern dark-mode aesthetics for high-end developer experience.

**Usage**
```bash
npx irgen studio examples/app.dsl.ts
```
