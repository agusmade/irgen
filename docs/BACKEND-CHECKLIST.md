# Backend Checklist — REST v1

**Status: scope ditetapkan, implementasi bertahap**

Checklist ini mendefinisikan **apa saja yang harus diurusi** untuk backend REST v1 di *ir-codegen*.
Centang **hanya** jika sudah benar-benar diimplementasikan dan diverifikasi.

---

## 1) Backend Interface (Transport)

* [ ] Backend mendukung **lebih dari satu interface**
* [x] **REST** sebagai interface pertama
* [ ] Interface bersifat **komposisional** (REST sekarang, RPC/WebSocket nanti)
* [x] Interface dikonfigurasi via **BackendPolicy**, bukan emitter

📌 Catatan:
Ini **fondasi konseptual**, belum dianggap selesai sebelum:

* policy ada
* TargetIR memuatnya
* emitter patuh

---

## 2) REST Resource Convention

* [x] Resource berbasis **entity**
* [x] CRUD standar:

  * `GET /resources`
  * `POST /resources`
  * `GET /resources/:id`
  * `PATCH /resources/:id`
  * `DELETE /resources/:id`
* [x] Controller tipis (request/response only)
* [x] Business logic di service
* [x] Akses data lewat repository

📌 Belum termasuk v1:

* nested resource kompleks
* bulk mutation
* soft delete semantics

---

## 3) Response Envelope

* [x] Semua response memakai **envelope standar**

```json
{ "data": ..., "meta": ..., "error": ... }
```

* [x] `data === null` saat error
* [x] `error === null` saat sukses
* [x] Struktur error distandarkan (`code`, `message`, `details`)
* [x] Envelope dibangun via **adapter tunggal** (`lib/response.ts`)
* [x] Controller tidak membuat response manual

---

## 4) Pagination

* [x] Strategi pagination: **page / limit**
* [x] `page` mulai dari 1
* [x] `limit` punya default & max
* [x] Metadata pagination ada di `meta`

```json
{ "page", "limit", "total", "hasNext" }
```

* [x] Semua list endpoint memakai helper yang sama (`lib/pagination.ts`)

---

## 5) Authentication

* [ ] Mekanisme auth **bisa digabung**
* [x] **JWT** sebagai auth pertama
* [x] JWT diverifikasi via adapter (`lib/auth.ts`)
* [x] Claims minimal:

  * `sub`
  * `roles`
* [x] Auth guard di middleware
* [x] Role guard terpisah dari controller

📌 Tidak termasuk v1:

* API key
* session cookie
* wallet signature

---

## 6) Error Handling

* [x] Semua error diturunkan dari `AppError`
* [x] Mapping error → HTTP status tersentral
* [x] Error response selalu memakai envelope
* [x] Controller **tidak** set status code manual
* [x] Error boundary global (`lib/http-handler.ts`)

---

## 7) Request Context

* [x] Setiap request punya `requestId`
* [x] `requestId` tersedia di:

  * logger
  * response meta
* [x] Context request disimpan di `req.ctx`
* [x] Middleware context terpasang global

---

## 8) Validation

* [x] Semua input divalidasi (body/query/params)
* [x] Validation memakai schema (zod)
* [x] Error validasi distandarkan (`VALIDATION_ERROR`)
* [x] Controller tidak parsing input manual

---

## 9) OpenAPI

* [x] OpenAPI di-*emit* dari **TargetIR**
* [x] OpenAPI mencerminkan:

  * routes
  * schemas
  * pagination
  * JWT bearer auth
  * error responses
* [x] OpenAPI menjadi artefak output resmi

---

## 10) Arsitektur & Prinsip Inti

* [x] Semua keputusan backend berada di
  **BackendPolicy → BackendTargetIR**
* [x] Tidak ada default tersembunyi di emitter
* [x] Adapter `/lib/*` sebagai single source of truth
* [x] Regenerasi aman (generation gap terjaga)

---

## 11) Sengaja **tidak termasuk** REST v1

*(bukan pekerjaan, hanya penanda scope)*

* [ ] RPC / WebSocket / Socket.IO
* [ ] Offline-first sync
* [ ] Event sourcing
* [ ] GraphQL
* [ ] Headless dApp auth
* [ ] Fullstack unified output (Next.js-style)

---

### Catatan penutup (penting secara praktik)

Checklist ini sekarang berfungsi sebagai:

* **peta kerja** (apa yang harus diurusi)
* **alat kontrol scope**
* **alat refleksi progres**

Begitu satu poin benar-benar:

* ada di policy
* dibekukan di TargetIR
* dipakai emitter
* punya test/golden

➡️ **baru layak dicentang.**
