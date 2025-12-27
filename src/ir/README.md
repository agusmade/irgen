# IR module

This folder contains the IR types used by the pipeline. For clarity the IR is split into:

- `decl.ts` — DeclIR (DSL-facing) schemas and types (Zod schemas + inferred types).
- `backend.ts` — BackendIR types (domain-specific types used by lowering and emitters).

The old `types.ts` remains as a re-export for backward compatibility.

Utilities such as string transformers (`pascal`, `camel`, `kebab`) have been moved to `src/utils/` for cross-domain reuse.

💡 Next steps for backend improvements: make `policies.idProvider` extensible, add typed DTOs, and provide interfaces for service adapters.