# Phase 7 — Tests & Golden Files

Status: **Done** ✅

This phase implements a comprehensive golden test suite that verifies emitted artifacts against expected fixtures, ensuring code generation remains deterministic and regression-free.

## Goals
- Establish golden test infrastructure for verifying emitted code artifacts
- Provide automated regression testing for code generation pipeline
- Enable easy fixture updates when intentional changes are made
- Integrate formatting step to ensure consistent code output

## What I implemented

### 1. Golden Test Suite (`scripts/golden-test.js`)
- Main golden test script that verifies emitted artifacts match expected fixtures
- Supports both text and JSON file comparison
- Covers core backend artifacts:
  - Models (`lib/models.ts`)
  - Services (`services/*.service.ts`)
  - Controllers (`controllers/*.controller.ts`)
  - Adapters (`lib/id.ts`, `lib/logger.ts`, `lib/http.ts`)
  - Package configuration (`package.json`)
- Covers frontend artifacts:
  - Entry points (`src/index.tsx`, `src/index.css`)
  - Shared libraries (`src/lib/logic.ts`)
  - Pages (`src/pages/*.tsx`)
  - Components (`src/components/*.tsx`)
- Handles missing files gracefully with clear error messages
- JSON files are normalized (sorted keys) before comparison

### 2. Update Golden Fixtures Script (`scripts/update-golden.js`)
- Automated script to regenerate golden fixtures from current generator output
- Copies generated artifacts to `test/golden/*` directory structure
- Maps generated files to expected fixture locations:
  - Backend artifacts → `test/golden/*.expected.{ts,json}`
  - Frontend artifacts → `test/golden/frontend/**/*.expected.{tsx,ts,css}`
- Creates directory structure as needed
- Provides clear feedback on what was updated

### 3. Specialized Golden Tests

#### Backend-Specific (`scripts/backend-golden.test.js`)
- Tests backend artifacts with policy configurations
- Verifies:
  - Server setup (`server.ts`)
  - OpenAPI specification (`openapi.json`)
- Uses `gen:backend-policy` generation script

#### Electron-Specific (`scripts/electron-golden.test.js`)
- Tests Electron target artifacts
- Verifies:
  - Main process (`electron/main.ts`)
  - Preload script (`electron/preload.ts`)
  - IPC handlers (`electron/ipc-handlers.ts`)
- Uses `gen:electron-docs` generation script

### 4. Formatting Integration (`src/emit/format.ts`)
- Implemented `formatDirectory()` function to apply code formatting to generated output
- Supports policy-driven formatter selection:
  - `prettier` (default): Uses `npx prettier --write` on generated files
  - `none`: Skips formatting
- Formats common file types: `.ts`, `.js`, `.json`, `.md`
- Integrated into backend emitter (`src/emit/backend/backend-tsmorph.ts`):
  - Called after all files are written via `project.save()`
  - Respects `ir.policies.formatter` setting
  - Gracefully handles formatter failures (continues without formatting if unavailable)

### 5. Package.json Integration
- Added `prettier` as dev dependency to ensure formatting is available in CI
- Added npm scripts:
  - `test:golden`: Run main golden test suite
  - `test:golden:backend`: Run backend-specific golden tests
  - `test:golden:electron`: Run electron-specific golden tests
  - `test:ci`: Run all golden tests (used in CI)
  - `update-golden`: Regenerate golden fixtures

### 6. CI Integration
- `npm run test:ci` command runs all golden test suites
- Ensures generated code matches expected fixtures in automated environments
- Fails build if any golden test mismatches are detected

## Acceptance Criteria

✅ **All criteria met:**

1. ✅ Golden test suite verifies emitted artifacts against `test/golden/*` fixtures
2. ✅ `scripts/update-golden.js` script exists to regenerate fixtures
3. ✅ `npm run test:golden` passes and detects mismatches
4. ✅ `npm run update-golden` updates fixtures from current generator output
5. ✅ Formatter step (prettier) runs on generated output (configurable via policy)
6. ✅ CI can run `npm run test:ci` to validate all golden tests
7. ✅ Backend-specific and Electron-specific golden tests exist and pass

## Usage

### Running Golden Tests

```bash
# Run main golden test suite (backend + frontend)
npm run test:golden

# Run backend-specific golden tests
npm run test:golden:backend

# Run electron-specific golden tests
npm run test:golden:electron

# Run all golden tests (for CI)
npm run test:ci
```

### Updating Golden Fixtures

When you make intentional changes to the generator that alter output format or structure:

```bash
# Regenerate golden fixtures from current generator output
npm run update-golden

# Review the changes
git diff test/golden/

# Commit if the changes are expected
git add test/golden/
git commit -m "Update golden fixtures for [description of changes]"
```

### Formatter Configuration

The formatter is controlled via backend policies:

```typescript
// In DSL
app("My App", {
  policies: {
    backend: {
      formatter: "prettier" // or "none"
    }
  }
}, (a) => {
  // ...
});
```

Default is `"prettier"` if not specified.

## Test Coverage

The golden test suite covers:

### Backend Artifacts
- ✅ Models generation (`lib/models.ts`)
- ✅ Service generation with Generation Gap Pattern (`services/*.service.ts`)
- ✅ Controller generation (`controllers/*.controller.ts`)
- ✅ Adapter generation (`lib/id.ts`, `lib/logger.ts`, `lib/http.ts`)
- ✅ Package configuration (`package.json`)
- ✅ Server setup with policies (`server.ts`)
- ✅ OpenAPI specification (`openapi.json`)

### Frontend Artifacts
- ✅ Entry points and routing setup (`src/index.tsx`, `src/index.css`)
- ✅ Shared logic library (`src/lib/logic.ts`)
- ✅ Page generation (`src/pages/*.tsx`)
- ✅ Component generation (`src/components/*.tsx`)

### Electron Artifacts
- ✅ Main process (`electron/main.ts`)
- ✅ Preload script with security (`electron/preload.ts`)
- ✅ IPC handler generation (`electron/ipc-handlers.ts`)

## Notes & Design Decisions

### Why Golden Tests?

Golden tests are ideal for code generation because:
1. **Determinism**: Generated code should be identical for identical inputs
2. **Regression Detection**: Changes to generation logic are immediately visible
3. **Documentation**: Golden fixtures serve as examples of expected output
4. **Maintainability**: Easy to update when intentional changes are made

### Formatting Strategy

Formatting is applied **after** file emission rather than during AST construction:
- **Pros**: Simpler implementation, leverages existing formatter tools, ensures consistent output
- **Cons**: Slightly slower (extra process), requires formatter availability

The formatter step is optional (`formatter: "none"`) to allow users to skip formatting if needed.

### Fixture Management

Golden fixtures are stored in `test/golden/` with a clear naming convention:
- Pattern: `{original-path}.expected.{extension}`
- Example: `lib/models.ts` → `test/golden/models.expected.ts`
- Frontend artifacts are grouped in `test/golden/frontend/` subdirectory

This structure mirrors the generated output structure for easy mapping.

## Future Enhancements

Potential improvements (not required for Phase 7 acceptance):
- [ ] Snapshot testing for IR structures (DeclIR, DomainIR, TargetIR)
- [ ] Visual diff output for better mismatch diagnostics
- [ ] Selective fixture updates (update only changed files)
- [ ] Support for binary file comparison (images, fonts, etc.)
- [ ] Biome formatter support as alternative to Prettier

---

## Related Documentation

- `docs/ARCHITECTURE.md`: Overall architecture including Phase 7 summary
- `docs/ARCHITECTURE-PLAN.md`: Implementation plan including Phase 7 scope
- `docs/PHASE-4.md`: Emitter pipeline (precursor to formatting integration)
- `docs/PHASE-5.md`: Shared adapters (golden tested in this phase)

