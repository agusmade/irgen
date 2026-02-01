# Backend Policy — Current Implementation

This document summarizes **backend policies that are actually implemented** in the code (per `src/ir/target/backend.policy.ts`, lowering `to-backend.ts`, and backend emitters). Sections that are still planned/placeholder are marked.

## Source of truth
- Schema + defaults: `src/ir/target/backend.policy.ts`
- Normalization & legacy merge: `src/lowering/targets/to-backend.ts` (registered as transform `backend-target`)
- Emitter consumption: `src/emit/backend/backend-tsmorph.ts` (helper `getBackendPolicies`)

## Working today
- **Interfaces**
  - REST only (`interfaces.rest.enabled`), `basePath` default `/api`
  - OpenAPI flag/title/version/serverUrl are forwarded to `emitOpenAPI`
  - `publicRoutes` is used by auth middleware to bypass per prefix
- **Envelope**
  - Type `standard_v1` with keys `data/meta/error`; used in `lib/response.ts` + controller responses
  - `requestIdKey` is injected via `withRequestId` (middleware context)
- **Pagination**
  - `page_limit` defaults: `page=1`, `limit=20`, `maxLimit=100`; meta keys `page/limit/total/hasNext`
- **Auth**
  - JWT (HS256/RS256 in schema); runtime `lib/auth.ts` **always uses shared secret** (`jsonwebtoken.verify` with `JWT_SECRET`) ⇒ RS256/JWKS not active yet (see “Planned”)
  - `claims.subjectKey` & `claims.rolesKey` map into `req.user`; `requireRoles` helper is available
- **Core knobs**
  - `generateId`: `uuid_v4` (uuid), `shortid` (crypto), `custom` throws error (no hook yet)
- **Logging**
  - `loggerImpl`: `console` is real console; `pino` is a fully integrated structured JSON logger.
  - `logging` policy controls level, format (pretty/json), and redaction.
- **Health & Metrics**
  - `health` policy generates `/health` and `/metrics` (via `prom-client`).
- **HTTP Client**
  - `httpClient`: `fetch` (default); `axios` adapter exists; `got/custom` not implemented
  - `formatter`: `prettier` or `biome`; emitter calls `formatDirectory` (package.json only adds Prettier)
  - `db`: optional `provider: "prisma", url`; if prisma is selected, schema+repo+Prisma deps and `db:generate/db:push` scripts are written
- **Packaging**
  - `package.json` adds deps based on `generateId` (uuid), `httpClient` (axios/got), `loggerImpl` (pino/winston), `db` (prisma). Dev deps: prettier, typescript, tsx, vitest, @types, express tooling, jsonwebtoken, cors.
  - `tsconfig.json` CJS target, strict off
- **Server runtime**
  - Express server with CORS/JSON, request context (requestId + scoped logger), auth (conditional), validation (zod), pagination helper, envelope response
  - CRUD routes per entity (CREATE/GET/LIST/UPDATE/REMOVE) with simple zod schemas based on primitive model types

## Planned / not implemented yet
- **JWT RS256/JWKS**: schema accepts `algorithm: "RS256"` + `jwksUrl`, but `lib/auth.ts` does not verify JWKS; runtime uses shared secret.
- **httpClient "got"/"custom"**: `lib/http.ts` adapter has no implementation.
- **loggerImpl "winston"**: adapter only wraps console.
- **generateId "custom"**: adapter throws error; no injection hook yet.
- **Non-REST transports**: REST only; no RPC/WS/GraphQL.
- **Other envelope/pagination variants**: only `standard_v1` and `page_limit`.
- **DB providers besides Prisma**: Prisma only (or in-memory repo).
- **Formatter "biome"**: schema accepts it, but package.json does not add Biome; `formatDirectory` is still called with that value.

## Default BackendPolicy (effective out-of-box)
```json
{
  "interfaces": {
    "rest": {
      "enabled": true,
      "basePath": "/api",
      "openapi": {
        "enabled": true,
        "title": "API",
        "version": "1.0.0"
      },
      "publicRoutes": []
    }
  },
  "envelope": {
    "type": "standard_v1",
    "keys": { "data": "data", "meta": "meta", "error": "error" },
    "meta": { "requestIdKey": "requestId" },
    "errorShape": { "codeKey": "code", "messageKey": "message", "detailsKey": "details" }
  },
  "pagination": {
    "type": "page_limit",
    "defaults": { "page": 1, "limit": 20, "maxLimit": 100 },
    "meta": { "pageKey": "page", "limitKey": "limit", "totalKey": "total", "hasNextKey": "hasNext" }
  },
  "auth": {
    "jwt": {
      "enabled": true,
      "algorithm": "HS256",
      "secret": "CHANGE_ME_SUPER_SECRET_MIN_16_CHARS",
      "issuer": null,
      "audience": null,
      "clockToleranceSec": 30,
      "claims": { "subjectKey": "sub", "rolesKey": "roles" }
    }
  },
  "core": {
    "generateId": "uuid_v4",
    "loggerImpl": "console",
    "httpClient": "fetch",
    "formatter": "prettier"
  }
}
```

## How to customize
- **Policy via DSL**: `app("...", { policies: { backend: { ... } } }, ...)`
- **Override via CLI**: `--policies='{"backend":{"loggerImpl":"pino","generateId":"shortid","db":{"provider":"prisma","url":"file:./dev.db"}}}'`
- **Public routes**: add `interfaces.rest.publicRoutes` (e.g., `["/auth/login","/health"]`) to bypass auth.
- **OpenAPI**: disable with `interfaces.rest.openapi.enabled=false` or set `serverUrl` for prod.
- **JWT RS256 (planned)**: schema exists; runtime JWKS must be added before use.
- **DB**: set `core.db` to `{"provider":"prisma","url":"file:./dev.db"}` to write Prisma schema + repos.
- **Formatter**: choose `prettier`/`biome`; only Prettier is added as a dev dependency automatically.
- **Custom ID/logger/http**: currently throws error or wraps console; extend adapters for custom implementations.

## Quick references
- Schema: `src/ir/target/backend.policy.ts`
- Lowering & legacy merge: `src/lowering/targets/to-backend.ts`
- Emitters/adapters: `src/emit/backend/backend-tsmorph.ts`, `src/emit/backend/adapters.ts`, `src/emit/backend/server.ts`, `src/emit/backend/packaging.ts`
