# Examples

This folder contains example DSLs to exercise the generator.

- `app.dsl.ts` — full-stack demo that exercises backend generation and optional frontend generation via `a.meta("frontend", { react: true })`.
- `frontend.dsl.ts` — minimal frontend-only DSL. Use:

```bash
npm run gen:frontend
```

or generate both infra with:

```bash
npm run gen:combined
```
