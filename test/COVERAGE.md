# irgen Core Feature Coverage (v0.2.2)

This document tracks the verification status of all features claimed in the `irgen` v0.2.2 release.

## Legend
- **Smoke Tested**: Verified presence of expected code patterns in generated output.
- **Runtime Verified**: Verified absence of runtime errors and correct behavior in a browser/terminal environment.
- **Drafted**: Feature is in a DSL example but lacks automated verification.

## Core Features
| Feature | DSL Example | Test Script | Status |
| :--- | :--- | :--- | :--- |
| Universal Action Model | `v022-features.dsl.ts` | `v022-features.test.js` | ✅ Runtime Verified |
| Operation-Backed Forms | `form-operation.dsl.ts` | `form-operation.test.js` | ✅ Smoke Tested |
| Micro-Frontend Support (Macros) | `v022-features.dsl.ts` | `v022-features.test.js` | ✅ Runtime Verified |
| Dependency Declaration | `v022-features.dsl.ts` | `v022-features.test.js` | ✅ Smoke Tested |
| Active Runtime Signals | `v022-features.dsl.ts` | `v022-features.test.js` | ✅ Smoke Tested |
| Frontend Auth Contract | `frontend-contracts.dsl.ts` | `frontend-contracts.test.js` | ✅ Smoke Tested |
| Form Lifecycle Upgrades | `form-lifecycle.dsl.ts` | — | ⚠️ Drafted |
| Table UX Contracts | `frontend-contracts.dsl.ts` | `frontend-contracts.test.js` | ✅ Smoke Tested |
| Runtime Logic Evaluation | `v022-features.dsl.ts` | — | ⚠️ Drafted |
| Frontend Build Hooks | `ssg-hooks.dsl.ts` | — | ⚠️ Drafted |
| Visual Policy Contracts | `visual-contracts.dsl.ts` | `visual-policy.test.js` | ✅ Pass (14/14 Knobs) |

## Scoping & Infrastructure Stability
| Test Type | Description | Status |
| :--- | :--- | :--- |
| DSL Aggregator | Verified fixing of module cache bug with cache-busting | ✅ Pass |
| Scoping Verification | Scanned all examples for unescaped template variables | ✅ Pass |
| ESM Compatibility | Verified `.js` extensions in DSL examples | ✅ Pass |

## Recently Fixed Regressions
- [x] **ReferenceError: rowActionIcons**: Fixed in `frontend-components.ts`.
- [x] **ReferenceError: topbarLinksWrapClass**: Fixed in `frontend-react.ts`.
- [x] **[object Object] AST Leak**: Fixed in `frontend-components.ts` (highlighter import).
- [x] **DSL Loading Race Condition**: Fixed in `runtime.ts` and `frontend-runtime.ts` (cache busting).

## Known Gaps & Future Work
- **Logic Sandbox Runtime Tests**: Need a dedicated test to verify complex `evalLogic` expressions actually yield correct results at runtime in the browser.
- **PWA/SSG Verification**: While SSG code is generated, the automated build-and-prerender pipeline needs periodic validation against real build outputs.
- **Build Hooks Execution**: Verify directed copy operations (`build.copyTo`) actually move files in the generated environment.
