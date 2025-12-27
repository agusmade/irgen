# Vision: Sustainable IR Codegen

Saat ini, `ir-codegen` bertindak sebagai purely **Boilerplate Generator** (sekali pakai). Untuk menjadikannya alat **Sustainable Development**, kita perlu mengubah arsitektur generasi kode agar mendukung siklus hidup aplikasi jangka panjang (CI/CD, perubahan requirement, maintenance).

## Core Philosophy: "Generated code is owned by the tool, User code is owned by the human."

Kita harus memisahkan **Generated Space** dan **User Space**.

## 1. The Generation Gap Pattern
Alih-alih menimpa `product.service.ts` setiap kali regenerate, kita akan memecahnya menjadi dua:

1.  **`generated/base/product.service.base.ts`** (Generated, Overwritten)
    *   Berisi logika CRUD standar.
    *   Berisi type definition dan helper methods (validasi, serialization).
    *   **JANGAN EDIT FILE INI.**

2.  **`src/services/product.service.ts`** (User, Scaffolded Once)
    *   `export class ProductService extends ProductServiceBase { ... }`
    *   File ini dibuat **hanya jika belum ada**.
    *   Disinilah developer menambahkan logika bisnis khusus ("Diskon 10% kalau beli 5").
    *   Generator tidak akan pernah menyentuh file ini lagi setelah dibuat.

## 2. Hexagonal Architecture (Ports & Adapters)
Saat ini codingan hardcode `new Map()` (In-Memory). Aplikasi nyata butuh Database, API Calls, dll.

*   **Ports (Interfaces):** Generator membuat `IProductRepository` di folder Generated.
*   **Adapters (Implementation):**
    *   `InMemoryProductRepository` (Default, Generated).
    *   `PostgresProductRepository` (User implementation).
*   **Dependency Injection:** Gunakan pola DI sederhana agar Service tidak men-instantiate Repository secara langsung.

## 3. Extensibility Hooks
Untuk hal-hal cross-cutting (Logging, Auth), kita sediakan "Hooks" di level DSL yang diterjemahkan menjadi middleware atau interceptor di kode jadi.

## Roadmap Implementasi

### Phase 1: Separation of Concerns (Minggu 1)
*   Refactor Emitter untuk mendukung pola **Base Class**.
*   Ubah output directory structure:
    *   `generated/` -> **Artifacts** (Disposable).
    *   `src/app/` -> **User Code** (Persistent).

### Phase 2: Dependency Injection (Minggu 2)
*   Perkenalkan konsep `Repository` pattern di DSL.
*   Generate `Factory` atau `Container` untuk wiring dependencies.

### Phase 3: Real World Adapters (Minggu 3)
*   Tambahkan support untuk generate SQL DDL atau Prisma Schema dari DSL.
