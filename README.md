# IR Codegen (DSL → IR → Lowering → AST Emit)

[![pipeline status](https://gitlab.com/agusmade/ir-codegen/-/badges/main/pipeline.svg)](https://gitlab.com/agusmade/ir-codegen/-/pipelines)

Proyek kecil untuk memulai tooling seperti yang kita bahas:

## CI (GitLab)

This repository uses GitLab CI to run a deterministic test suite and golden tests on push and merge requests. The pipeline will: check there are no tracked generated artifacts, install dependencies, run mapper & policy validation tests, and run the golden test suite (`npm run test:ci`). If the golden tests fail, update fixtures locally with `npm run update-golden` and open a new MR.

Note: If you host this repo on GitHub the existing `.github/workflows/ci.yml` will provide equivalent checks via GitHub Actions.

- Developer menulis DSL (JS/TS) yang pendek.
- CLI mengeksekusi DSL → menghasilkan DeclIR.
- DeclIR divalidasi → di-map ke DomainIR (contoh: BackendIR).
- Lowering (sederhana dulu) → TargetIR.
- Emitter berbasis AST (ts-morph) → generate source code nyata.

## Quick start

```bash
npm i
npm run gen
```

Output akan muncul di folder `generated/`.
CLI flags

- `--emitters` — list registered emitters and exit.
- `--emitter=<name>` — run a specific emitter (pass DSL entry and outDir as positional args). Example:

```bash
npx tsx src/cli.ts examples/app.dsl.ts generated --emitter=backend-tsmorph
```
## Struktur
- `src/dsl/` : DSL runtime + IR builder
- `src/ir/`  : Decl IR (`decl.ts`) dan Backend IR (`backend.ts`) — terpisah untuk struktur dan tanggung jawab yang lebih jelas
- DSL now supports `model(...)` on `entity(...)` to declare entity fields (used to generate TypeScript `interface`s), and gives hooks to customize operations; generators now also emit `controllers/`.
- CRUD now includes `update` and `remove` operations; services/controllers generate typed methods for those operations.
- Pluralization: the generator pluralizes entity names for list methods (e.g. `Category` -> `listCategories`). You can override plural form by adding `plural("...")` in the DSL (or by setting `plural` in the DeclEntity).
- Frontend: add `a.meta("frontend", { react: true, tailwind: true })` to the app to enable generation of simple React components (optional Tailwind classes).

- Separate frontend pipeline: You can create a frontend DSL using `frontend("Name", ...)` in `examples/frontend.dsl.ts` and run `npm run gen:frontend` to generate frontend-only artifacts into `generated/frontend/`.
- `src/lowering/` : aturan lowering (minimal)
- `src/emit/` : AST emitter (ts-morph)
- `examples/app.dsl.ts` : contoh DSL

## Catatan
- Tool ini sengaja minimal dan deterministik.
- Untuk sekarang, generator hanya menghasilkan:
  - `generated/lib/id.ts` (single point of truth untuk ID)
  - `generated/services/<entity>.service.ts`
