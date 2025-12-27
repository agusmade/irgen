# Architecture Documentation

`ir-codegen` is built on the philosophy of **Sustainable Code Generation**. It aims to produce code that is maintainable, testable, and extensible, solving the "one-off scaffolding" problem of traditional generators.

## 1. The Generation Gap Pattern
We solve the problem of overwriting user changes by separating the code into two spaces:

### Generated Space (`generated/base/`)
- **Files**: `*.base.ts` (e.g., `ProductServiceBase`).
- **Ownership**: The Generator.
- **Behavior**: Completely overwritten on every generation.
- **Content**: Standard CRUD logic, validation, type definitions.

### User Space (`src/services/`)
- **Files**: Standard headers (e.g., `ProductService`).
- **Ownership**: The Developer.
- **Behavior**: Created *only if it doesn't exist*. Never overwritten.
- **Content**: User business logic.
- **Mechanism**: `ProductService` extends `ProductServiceBase`.

```typescript
// generated/base/product.service.base.ts
export class ProductServiceBase {
  async create(data) { ... } // Standard implementation
}

// src/services/product.service.ts
export class ProductService extends ProductServiceBase {
  // Override or extend here
  async create(data) {
    console.log("Custom Logic");
    return super.create(data);
  }
}
```

## 2. Repository Pattern & Dependency Injection
Services do not access the database directly. They depend on `IRepository`.

- **Interface**: Generated in `generated/services/`.
- **Implementation**: `PrismaRepository` (or In-Memory for testing).
- **Injection**: Dependencies are injected via constructor, facilitating unit testing.

## 3. Frontend Architecture
The frontend generator emits a **React + Tailwind** application structure.

- **DSL Runtime**: `src/dsl/frontend-runtime.ts` captures component definitions.
- **IR**: Lowered into `FrontendIR` (Pages, Components, Props).
- **Emitter**: `src/emit/frontend-react.ts` generates:
  - `App.tsx`: Router configuration.
  - `components/`: Reusable UI components.
  - `pages/`: Page assemblies.
  - `tailwind.config.js`: Design token configuration.

## 4. Extensibility Hooks
Base services expose protected methods that act as hooks:
- `onBeforeCreate(data)`
- `onAfterCreate(result)`
- `onBeforeUpdate(id, data)`

Developers override these in the User Space service to inject logic without touching generated code.
