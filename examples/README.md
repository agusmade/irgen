# Examples

This folder contains example DSLs to exercise the generator.

## Running All Examples
We provide a helper script to generate all examples into distinct folders in `generated/`.

```bash
./scripts/generate-examples.sh
```

## Included Examples

### 1. Form IO (Rich Frontend) - `form-io.dsl.ts`
Demonstrates advanced frontend capabilities:
- **Async Selects**: Fetching data from APIs.
- **Icons**: Lucide React integration.
- **Validations**: Form input rules.
- **Client-Side Routing**: SPA navigation.

Output: `generated/form-io/`

### 2. Backend Only - `backend-only.dsl.ts`
Demonstrates a pure backend API with Prisma integration and complex entity relationships.

Output: `generated/backend-only/`

### 3. Frontend Only - `frontend-only.dsl.ts`
Demonstrates generating simple React components.

Output: `generated/frontend-only/`

### 4. Fullstack - `fullstack.dsl.ts`
Demonstrates a complete backend configuration (frontend part is currently mapped to backend entities).

Output: `generated/fullstack/`


