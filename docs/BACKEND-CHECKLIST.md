# Backend Checklist — REST v1

**Status: Scope established, gradual implementation**

This checklist defines **what needs to be handled** for the REST v1 backend in *irgen*.
Check off **only** when it has been fully implemented and verified.

---

## 1) Backend Interface (Transport)

* [ ] Backend supports **more than one interface**
* [x] **REST** as the first interface
* [ ] Interfaces are **compositional** (REST now, RPC/WebSocket later)
* [x] Interface configured via **BackendPolicy**, not the emitter

📌 Notes:
This is a **conceptual foundation**, not considered complete until:

* policy exists
* TargetIR includes it
* emitter complies

---

## 2) REST Resource Convention

* [x] Resource-based on **entity**
* [x] Standard CRUD:

  * `GET /resources`
  * `POST /resources`
  * `GET /resources/:id`
  * `PATCH /resources/:id`
  * `DELETE /resources/:id`
* [x] Thin controllers (request/response only)
* [x] Business logic in services
* [x] Data access via repositories

📌 Not included in v1:

* complex nested resources
* bulk mutations
* soft delete semantics

---

## 3) Response Envelope

* [x] All responses use a **standard envelope**

```json
{ "data": ..., "meta": ..., "error": ... }
```

* [x] `data === null` on error
* [x] `error === null` on success
* [x] Standardized error structure (`code`, `message`, `details`)
* [x] Envelope built via a **single adapter** (`lib/response.ts`)
* [x] Controllers do not create responses manually

---

## 4) Pagination

* [x] Pagination strategy: **page / limit**
* [x] `page` starts at 1
* [x] `limit` has default & max
* [x] Pagination metadata lives in `meta`

```json
{ "page", "limit", "total", "hasNext" }
```

* [x] All list endpoints use the same helper (`lib/pagination.ts`)

---

## 5) Authentication

* [ ] Auth mechanisms **can be combined**
* [x] **JWT** as the first auth method
* [x] JWT verified via adapter (`lib/auth.ts`)
* [x] Minimal claims:

  * `sub`
  * `roles`
* [x] Auth guard in middleware
* [x] Role guard separate from controller

📌 Not included in v1:

* API key
* session cookies
* wallet signature

---

## 6) Error Handling

* [x] All errors derive from `AppError`
* [x] Error-to-HTTP-status mapping is centralized
* [x] Error responses always use the envelope
* [x] Controllers **do not** set status codes manually
* [x] Global error boundary (`lib/http-handler.ts`)

---

## 7) Request Context

* [x] Every request has a `requestId`
* [x] `requestId` available in:

  * logger
  * response meta
* [x] Request context stored in `req.ctx`
* [x] Context middleware installed globally

---

## 8) Validation

* [x] All inputs validated (body/query/params)
* [x] Validation uses schemas (zod)
* [x] Validation errors standardized (`VALIDATION_ERROR`)
* [x] Controllers do not parse input manually

---

## 9) OpenAPI

* [x] OpenAPI emitted from **TargetIR**
* [x] OpenAPI reflects:

  * routes
  * schemas
  * pagination
  * JWT bearer auth
  * error responses
* [x] OpenAPI becomes an official output artifact

---

## 10) Architecture & Core Principles

* [x] All backend decisions reside in
  **BackendPolicy → BackendTargetIR**
* [x] No hidden defaults in the emitter
* [x] `/lib/*` adapters as single source of truth
* [x] Safe regeneration (generation gap preserved)

---

## 11) Intentionally **not included** in REST v1

*(Scope markers, not pending tasks)*

* [ ] RPC / WebSocket / Socket.IO
* [ ] Offline-first sync
* [ ] Event sourcing
* [ ] GraphQL
* [ ] Headless dApp auth
* [ ] Fullstack unified output (Next.js-style)

---

### Closing Notes (Practical Importance)

This checklist now serves as:

* **workflow map** (what needs care)
* **scope control tool**
* **progress reflection tool**

Once a point truly:

* exists in policy
* is frozen in TargetIR
* is used by the emitter
* has tests/goldens

➡️ **only then it is worthy of a checkmark.**
