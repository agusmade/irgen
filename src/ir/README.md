# IR module

Struktur IR dipisah sesuai pipeline: DeclIR (input) ➜ DomainIR (semantik) ➜ TargetIR (emitter).

- `decl/` — DSL-facing schemas (Zod) per domain: `backend.raw.schema.ts`, `frontend.raw.schema.ts`, `cli.raw.schema.ts`, plus bundle/normalize untuk agregasi `DeclBundle`.
- `domain/` — DomainIR per domain: `backend.ts`, `frontend.ts`, `cli.ts` (murni tipe semantik, tanpa schema DSL/policy).
- `target/` — TargetIR per domain: emitter-facing. Backend target memuat `policies.backend.*` hasil target-lowering; frontend/cli masih passthrough placeholder.

Barrel lama dan shim telah dihapus; gunakan impor per-domain di atas. Utilities umum ada di `src/utils/`.
