# Macro System Documentation

This document explains the **Macro System** in `irgen`, a powerful mechanism allowing high-level abstractions in the frontend DSL to be expanded into standard components during the lowering phase.

## Concept

Macros are **Lowering-Time Instructions**. They allow you to define complex UI patterns (like a CRUD Table Page, Authentication Form, or Pricing Table) using a simple, declarative signature.

When `irgen` processes your DSL:
1.  It reads the **DeclIR** (Declarative IR), where components may be marked as macros.
2.  During the **Lowering Phase** (`Decl` → `Domain`), it detects these macros.
3.  It **Expands** each macro into one or more standard `DeclComponent` objects (e.g., Layouts, Tables, Forms).
4.  The resulting **DomainIR** contains *only* standard components. The original macro instruction is fully removed.
5.  The **Emitter** generates code based on these standard components, completely unaware that macros ever existed.

This ensures that the Emitter logic remains simple and backend-agnostic, while DSL users enjoy high-level productivity.

## Invariant

> [!IMPORTANT]  
> **Macro Lifecycle Rules**
> *   ✅ **DeclIR**: MAY contain `macro`.
> *   ❌ **DomainIR / TargetIR**: MUST NOT contain `macro`.
> *   ❌ **Runtime / Emitter**: MUST NOT have logic that reads `macro`.
>
> This invariant ensures that the complexity of high-level abstractions is fully resolved during the lowering phase, keeping the emitter simple and backend-agnostic.

## Usage

There are two primary ways to interact with macros, depending on your role.

### 1. For DSL Users (Frontend Developers)

If you are writing a `.dsl.ts` file to define your application, use the ergonomic `useMacro` helper.

```typescript
// examples/my-app.dsl.ts

frontend("MyApp", (f) => {
  f.page("Pricing", { path: "/pricing" }, (p) => {
    
    // Define a component that uses a macro
    p.component("PricingSection", (c) => {
      c.useMacro("PricingTable", {
        tier: "Pro",
        accent: "emerald",
        badge: "Best Value"
      });
    });

  });
});
```

**Note on Props:** The `useMacro("Name", props)` call is the single source of truth for the macro's properties. These are stored in `component.props`. While the implementation distinguishes between `macro` (the instruction) and `props` (the data), DSL users should conceptually treat them as a single operation.

### 2. For Extension Developers (Code Generators)

If you are building an Extension (like `php-shared-hosting`) or writing a preset generator that outputs `DeclIR` JSON programmatically, you interact with the data structure directly.

You should produce a JSON object that matches the `DeclComponentSchema`:

```typescript
// extensions/my-extension/src/presets.ts

const myComponent = {
  type: "component",
  name: "GeneratedTable",
  
  // Direct property assignment
  macro: "TablePage", 
  props: {
    title: "Users List",
    queryOperationId: "users.list",
    columns: [
      { key: "id", label: "ID" },
      { key: "email", label: "Email" }
    ]
  }
};
```

This distinction exists because Extensions operate at the **meta-level** (generating the IR configuration), whereas DSL users operate at the **coding-level** (using the fluent API).

## Advanced Policies

### Nested Macros
The lowering engine supports recursive expansion (macros expanding into other macros), but this is **discouraged for v0**.
*   **Best Practice**: Expanders should output only standard components.
*   **Reasoning**: Ensures deterministic lowering and simplifies tracking of component origins.

## Registering New Macros

To add a new macro to `irgen`, you must implement an **Expander** and register it.

### 1. Implement Expander
Create a file in `src/lowering/frontend/macros/myMacro.ts`.
An expander function takes the macro `props` and the `original` component definition, and returns an array of expanded components.

```typescript
import type { DeclComponent } from "../../../ir/decl/frontend.raw.schema.js";
import type { MacroExpander } from "./registry";

export const expandMyMacro: MacroExpander = (props: any, original: DeclComponent): DeclComponent[] => {
  return [{
      type: "component",
      name: original.name, // Usually preserve the original name for the container
      layout: { kind: "column", items: [`${original.name}_Child`] },
      content: `<h1>${props.title}</h1>`
  }];
};
```

> Preserving `original.name` is recommended but not required; expanders may generate multiple named components.

### 2. Register
Update `src/lowering/frontend/macros/index.ts` to register your new macro.

```typescript
import { expandMyMacro } from "./myMacro.js";

export function initMacros() {
  // ...
  registerMacro("MyMacro", expandMyMacro);
}
```

## Built-in Macros

Currently, `irgen` ships with the following built-in macros:

### Core Macros (Stable)
*   **`TablePage`**: Generates a full administration table page with layout, toolbar, and filters.
*   **`AuthPage`**: Generates a complete login/register form sequence.
*   **`EditorPage`**: Generates a content editor layout with title, actions, and form handling.

### Experimental / Demo
*   **`PricingTable`**: Demonstates HTML injection capabilities and layout composition.

