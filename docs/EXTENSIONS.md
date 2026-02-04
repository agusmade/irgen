# Extension Contract

- **What you can register** via the provided `ExtensionContext`:
  - `registerMapper(name, fn)` — DeclBundle → DomainIR mapper
  - `registerTransform(name, fn)` — Target transform (e.g., to-backend)
  - `registerPolicySchema(name, zodSchema)` — Validates policies passed to a transform
  - `registerEmitter(name, fn)` — Emitters for target IR
  - `registerTargetEmitter(target, emitterName)` — Map target → emitter
  - `registerValidator(id, fn)` — Semantic bundle validator (runs during `irgen check`)
  - `registerTemplate(templateDef)` — Project scaffolding template (available in `irgen init`)
  - `unregisterMapper`, `listMappers`
  - `logger` — A namespaced logger (`info`, `warn`, `error`, `success`, `debug`)
  - `namespace(ns)` — returns a namespaced context that prefixes names with `ns:` to avoid collisions.
  - `root` — access to the original, non-namespaced context (useful to escape namespacing).
- **Order**: built-in mappers/transforms are registered first; extensions are applied afterward in the order they are loaded (CLI `--ext` order or `Codegen` options order).
- **Namespacing/conflicts**:
  - Prefer namespaced registrations to avoid collisions (`ctx.namespace("myExt").registerMapper("frontend", ...)` → mapper name `myExt:frontend`).
  - If you register a name that already exists and `force` is not set, registration will throw; use namespacing instead of `force` where possible.
- **Automatic Namespacing (v0.3.1+)**:  
  The CLI automatically wraps your extension function in a namespaced context based on your extension's name (detected from `extensionMetadata` or filename). This means `ctx.registerMapper("foo", ...)` will automatically become `myExt:foo`. If you need to register something globally, use `ctx.root.registerMapper(...)`.
   You can also pass an installed package name (e.g., `--ext=irgen-ext-php-shared-hosting`) as long as it exports a function (ESM default export or CJS `module.exports`).

> [!CAUTION]
> **CLI Entry Files**: Although the CLI accepts multiple DSL files, the second positional argument is always interpreted as the `outDir`. To avoid file swallowing, always use a **single main entry file** that imports others, or use the explicit `--outDir` flag.
- **Programmatic usage**:
  ```ts
  import { Codegen } from "irgen";
  import myExt from "./my-extension.js";

  const cg = new Codegen({ extensions: [myExt] });
  await cg.generate({ entries: ["./my.dsl.ts"], targets: ["frontend"] });
  ```
- **Policies**: Extension transforms may define policy schemas; policies passed via DSL meta or `--policies` are merged and validated if a schema is registered under the transform name.

## Phases & scopes (for plugin hygiene)
- **Phases** are separated and run deterministically:  
  1) `map` (DeclBundle → DomainIR via mappers)  
  2) `lower/transform` (DomainIR → TargetIR via transforms + policy validation)  
  3) `emit` (TargetIR → files via emitters)  
  Extensions should only **register** hooks for these phases; avoid side effects at import time.
- **Scopes**: use `ctx.namespace("myExt")` so mapper/transform/emitter names are prefixed (`myExt:frontend`, `myExt:to-electron`, etc.). This keeps multiple extensions from colliding.
- **Target emitter mapping**: `registerTargetEmitter(target, emitterName)` sets the emitter for a target. If you override a built-in mapping, prefer namespaced emitters (e.g., `ctx.registerEmitter("myExt:electron-shell", fn); ctx.registerTargetEmitter("electron", "myExt:electron-shell");`) instead of reusing built-in names.

### Collision example
- **Bad (collision-prone)**:
  ```ts
  export default (ctx) => {
    ctx.registerEmitter("electron-shell", myEmitter, { force: true }); // overwrites built-in
  };
  ```
- **Better (namespaced, no force)**:
  ```ts
  export default (ctx) => {
    const ns = ctx.namespace("myExt");
    ns.registerEmitter("electron-shell", myEmitter); // name = myExt:electron-shell
    ctx.registerTargetEmitter("electron", "myExt:electron-shell"); // opt-in mapping
  };
  ```
  Namespacing avoids accidental overrides and makes it clear which extension provided the emitter. Use `force` only when you intentionally replace a built-in and understand the impact.

## Logging

Extensions should use `ctx.logger` instead of `console.log`. This ensures logs are consistently formatted and prefixed with your extension's name.

```ts
export default (ctx) => {
  ctx.logger.info("Initializing extension...");
  ctx.logger.success("Ready to generate!");
};
```

## Extension Metadata
Export `extensionMetadata` to help `irgen` identify your extension and display its version in reports.

```ts
export const extensionMetadata = {
  name: "my-cool-extension",
  version: "1.0.0",
};

export default (ctx) => {
  // ...
};
```

## Resolution rules (avoid ambiguity)
- **Name collisions (mapper/transform/emitter)**: registering a name that already exists **throws** unless you pass `{ force: true }`. Prefer namespaced names instead of `force`.
- **Target → emitter mapping**: `registerTargetEmitter` will **error** if a mapping already exists unless you pass `{ force: true }`. Recommended: use namespaced emitter names and opt-in mapping (see example above) instead of overwriting built-ins.
- **Policy schemas**: `registerPolicySchema(name, schema)` is keyed by `name`; calling twice with the same name overwrites the previous schema (last registration wins). Avoid sharing names; use namespacing to keep schemas distinct.
