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

### 5. Electron + Web (shared DSL) - `electron-docs.dsl.ts`
Demonstrates generating web/PWA and Electron shell from the same FrontendIR. Electron policies set window defaults, IPC whitelist, packaging meta, and custom IPC handlers (emitted into `ipc-handlers.ts`).

Output: `generated/electron-docs/frontend` and `generated/electron-docs/electron`

Dev quickstart:
- `npm run gen:electron-docs`
- In `generated/electron-docs/frontend`: `npm install && npm run dev` (serves web/PWA on 5173)
- In `generated/electron-docs/electron`: `npm install && npm run start:electron:dev` (uses `ELECTRON_START_URL` to open the dev server) or `npm run start:electron:file` after building frontend to load `dist/index.html`. Custom IPC stubs live in `ipc-handlers.ts`; defaults include `ping` and `open-file-dialog`.
