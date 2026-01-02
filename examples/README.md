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
Demonstrates a complete backend + frontend configuration. Backend and frontend are generated independently into their own subdirectories, ensuring clean separation and target-specific optimizations.

Output: `generated/fullstack/backend` and `generated/fullstack/frontend`

### 5. Electron + Web (shared DSL) - `electron-docs.dsl.ts`
Demonstrates generating web/PWA and Electron shell from the same FrontendIR. Electron policies set window defaults, IPC whitelist, packaging meta, and custom IPC handlers (emitted into `ipc-handlers.ts`).

Output: `generated/electron-docs/frontend` and `generated/electron-docs/electron`

Dev quickstart:
- `npm run gen:electron-docs`
- In `generated/electron-docs/frontend`: `npm install && npm run dev` (serves web/PWA on 5173)
- In `generated/electron-docs/electron`: `npm install && npm run start:electron:dev` (uses `ELECTRON_START_URL` to open the dev server) or `npm run start:electron:file` after building frontend to load `dist/index.html`. Custom IPC stubs live in `ipc-handlers.ts`; defaults include `ping` and `open-file-dialog`.

### 6. Multi-page Website Showcase - `irgen-web.dsl.ts`
The most comprehensive example showing:
- **Multi-page Architecture**: Home, Features, Documentation, Showcase, and CLI pages.
- **Global UI Elements**: Navbar with global theme toggle and glassmorphism styling.
- **Rich Content**: 20+ specialized components including AI Copilot chat simulation and native Syntax Highlighting.
- **Responsive Layouts**: Premium adaptive grids and panels for a polished look.

Output: `generated/irgen-web-full/`

Dev quickstart:
- `npx tsx src/cli.ts examples/irgen-web.dsl.ts generated/irgen-web-full --mode=frontend`
- In `generated/irgen-web-full`: `npm install && npm run dev`
