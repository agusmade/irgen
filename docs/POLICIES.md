# Policies Reference

This document summarizes all policies currently used in irgen for backend and frontend (including static-site). Use it as a branching map when adding new features.

## Entry Point: `app(...)` vs `frontend(...)`

irgen has two DSL entry points because their DomainIRs are different:

- `app(...)` → produces **backend DomainIR** (entities, services, operations).
- `frontend(...)` → produces **frontend DomainIR** (pages, components, marketing blocks).

Implications:

- **Backend targets** can only start from `app(...)`.
- **Frontend / Electron / static-site targets** start from `frontend(...)` (static-site uses FrontendIR).
- When the CLI runs `--targets=backend,frontend`, irgen **aggregates** two DSLs (app + frontend) if both exist.

Why everything does not start from `app(...)`:

- Backend and frontend require very different data structures.
- Frontend has page/layout/component concepts that do not exist in backend.
- Separating entry points keeps the IR deterministic and avoids forcing one DSL to cover two different domains.

In short: **`app(...)` for backend**, **`frontend(...)` for UI/HTML/Electron/static-site**.

## Usage (DSL)

In DSL, policies live under `policies` and are selected by target. Example:

```ts
frontend("MyApp", {
  policies: {
    backend: { core: { generateId: "uuid_v4" } },
    frontend: { styling: { theme: { primaryColor: "#4f46e5" } } },
    staticSite: { baseUrl: "/", assets: { hashing: true } },
    electron: { window: { width: 1200, height: 800 } },
  },
}, (app) => { /* ... */ });
```

Note: `static-site` can be written as `staticSite` in DSL (both are recognized).

## Backend Policies (`backend`)

Source: `src/ir/target/backend.policy.ts`

- `backend.interfaces.rest`
  - `enabled` (boolean)
  - `basePath` (string, default `/api`)
  - `openapi`
    - `enabled` (boolean)
    - `title` (string)
    - `version` (string)
    - `serverUrl` (string?)
  - `publicRoutes` (string[])
- `backend.envelope`
  - `type` = `standard_v1`
  - `keys` (`data`, `meta`, `error`)
  - `meta.requestIdKey`
  - `errorShape` (`codeKey`, `messageKey`, `detailsKey`)
- `backend.pagination`
  - `type` = `page_limit`
  - `defaults` (`page`, `limit`, `maxLimit`)
  - `meta` (`pageKey`, `limitKey`, `totalKey`, `hasNextKey`)
- `backend.auth.jwt`
  - `enabled` (boolean)
  - `algorithm` = `HS256` | `RS256`
  - `secret` (string, HS256 only)
  - `jwksUrl` (string, RS256 only)
  - `issuer`, `audience` (string?)
  - `clockToleranceSec` (number)
  - `claims` (`subjectKey`, `rolesKey`)
- `backend.core`
  - `generateId` = `uuid_v4` | `shortid` | `custom`
  - `loggerImpl` = `console` | `pino` | `winston` | `custom`
  - `httpClient` = `fetch` | `axios` | `got` | `custom`
  - `formatter` = `prettier` | `biome`
  - `db` (`provider` = `prisma`, `url`)
- `backend.logging`
  - `enabled` (boolean)
  - `level` = `debug` | `info` | `warn` | `error`
  - `format` = `json` | `pretty`
  - `redact` (string[])
- `backend.health`
  - `enabled` (boolean)
  - `endpoint` (string)
  - `metrics` (`enabled`, `endpoint`)

## Frontend Policies (`frontend`)

Source: `src/ir/target/frontend.policy.ts`

- `frontend.styling`
  - `cssFramework` = `tailwind` | `none`
  - `theme`
    - `primaryColor` (string)
    - `borderRadius` = `none` | `sm` | `md` | `lg` | `full`
- `frontend.framework`
  - `library` = `react`
  - `runtime` = `vite` | `none`
  - `router` = `react-router-dom` | `none`
  - `iconLibrary` = `lucide-react` | `none`
- `frontend.errorBoundary`
  - `enabled` (boolean)
  - `componentName` (string)
  - `fallback` = `simple` | `detailed`
  - `rendering`
    - `mode` = `csr` | `ssg` | `hybrid`
    - `prerender`
      - `enabled` (boolean)
      - `routes` = `auto` | string[]
      - `outDir` (string)
      - `emitSitemap` (boolean)
      - `emitRobotsTxt` (boolean)

Notes:
- For `mode="ssg"`, prerendered HTML is written to the root `outDir` (folder-style routing).
- `index.html` stays as the SPA fallback (CSR entry), and SSG copies it to `index.spa.html` before overwriting.
- `SITE_URL` (env var) is used for `sitemap.xml`/`robots.txt` when enabled.

## Static Site Policies (`static-site` / `staticSite`)

Source: `src/ir/target/static-site.policy.ts`

- `staticSite.enabled` (boolean)
- `staticSite.baseUrl` (string)
- `staticSite.trailingSlash` (boolean)
- `staticSite.outDir` (string, default `.`)
- `staticSite.customCssPath` (string?)
- `staticSite.assets`
  - `hashing` (boolean)
  - `publicDir` (string?)
- `staticSite.enhancements`
  - `enabled` (boolean)
  - `features` = `sidebarToggle` | `copyCode` | `themeToggle` | `tocScrollSpy` | `tabs` | `accordion` | `search` | `mermaid`
- `staticSite.codeHighlight`
  - `mode` = `pre` | `client` | `none`
  - `theme` (string?)
  - `addCopyButton` (boolean)
- `staticSite.search`
  - `mode` = `none` | `client_index` | `remote`
  - `indexFile` (string)
- `staticSite.seo`
  - `defaultTitle` (string)
  - `titleTemplate` (string)
  - `defaultDescription` (string)
  - `canonicalBaseUrl` (string | null)
  - `sitemap.enabled` (boolean)
  - `robotsTxt.enabled` (boolean)
  - `openGraph.enabled` (boolean)
- `staticSite.theme`
  - `mode` = `light` | `dark` | `auto`
  - `accentColor` (string)
  - `radius` = `sm` | `md` | `lg`
- `staticSite.security`
  - `csp.enabled` (boolean)
  - `csp.value` (string?)
  - `externalLinks.noopener` (boolean)
  - `externalLinks.noreferrer` (boolean)
- `staticSite.navbar`
  - `links` = array of `{ label: string, href: string }`
- `staticSite.sidebar`
  - `groups` = array of `{ label: string, items: string[] }`
    - `items` accepts route paths (e.g. `"/policies/"`) or page ids (e.g. `"policies"`).

## Electron Policies (`electron`)

Source: `src/ir/target/electron.policy.ts`

- `electron.window`
  - `width`, `height` (number?)
  - `resizable` (boolean?)
  - `fullscreen` (boolean?)
  - `devTools` (boolean?)
- `electron.security`
  - `contextIsolation` (boolean?)
  - `sandbox` (boolean?)
  - `ipcWhitelist` (string[]?)
  - `csp` (string?)
- `electron.packaging`
  - `tool` = `electron-builder`
  - `appId`, `productName`, `artifactName`, `outputDir`, `buildResources`, `icon` (string?)
  - `asar` (boolean?)
  - `extraFiles` (string[]?)
  - `extraResources` (string[] | { from, to? }[])
  - `mac`, `win`, `linux` (record?)
- `electron.autoUpdate`
  - `enabled` (boolean?)
  - `provider` = `generic` | `github` | `spaces` | `s3`
  - `url`, `channel` (string?)
  - `publish` (record?)
  - `allowPrerelease` (boolean?)
  - `requestHeaders` (record<string, string>?)
  - `retryOnFail` (boolean?)
  - `retryDelayMs` (number?)
- `electron.reliability`
  - `singleInstance` (boolean?)
  - `logging` (`enabled`, `level`, `fileMaxSizeMB`, `console`)
  - `performance.disableBackgroundThrottling` (boolean?)
  - `crashReporting` (`enabled`, `provider`, `submitURL`, `dsn`, `productName`, `companyName`, `environment`)
  - `session` (`restoreWindowBounds`, `windowStateFile`, `saveOnClose`)
- `electron.ipc`
  - `whitelist` (string[]?)
  - `handlers` ({ channel, description? }[])
- `electron.loading`
  - `devUrl` (string?)
  - `prodIndex` (string?)
  - `splashHtml` (string?)

## CLI Target (`cli`)

Source: `src/ir/target/cli.ts`

- No specific policies for the CLI target at this time (Domain IR only).
- The CLI policy schema is an empty `passthrough` object (not strictly validated).

## Core Principles (Summary)

- Policies are decided in lowering (TargetIR); emitters read the results.
- Static-site only emits JS if capabilities are actually used.
- HTML-first: remains readable without JS.
