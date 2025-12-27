# Changelog

All notable changes to the `ir-codegen` project will be documented in this file.

## [Unreleased] - 2024-XX-XX

### Major Features (Phases 1-8 Completion)

#### Architecture
- **Generation Gap Pattern**: Refactored backend service generation to separate base classes (auto-generated) from user service implementations (scaffolded once).
- **Repository Pattern**: Introduced `BaseRepository` and concrete repositories with Dependency Injection (DI) support.
- **Prisma ORM**: Integrated Prisma as the data layer, replacing in-memory mocks.

#### Backend
- **Dependency Injection**: Services and Controllers now use constructor injection for better testability.
- **Extensibility Hooks**: Added `beforeCreate`, `afterCreate`, etc., hooks in `BaseService` for validation and business logic.
- **Automated Testing**: Integrated `vitest` and auto-generated test files for services.

#### Frontend
- **Tailwind CSS**: Full integration with automated `tailwind.config.js` and `postcss.config.js` generation.
- **Rich UI Components**: Added support for:
  - Select Inputs (Static Options & Async Data Source).
  - Icons (Lucide React integration).
  - Advanced Input props (placeholder, description).
- **Client-Side Routing**: Transformed frontend output into a Single Page Application (SPA) using `react-router-dom` with auto-generated routes.

#### Developer Experience
- **Unified DSL**: Updated `app.dsl.ts` and introduced `fullstack.dsl.ts` examples.
- **Examples Organization**: `generate-examples.sh` script to manage multiple example outputs in dedicated folders.
- **Runtime Typing**: Improved TypeScript types for DSL runtime (`frontend-runtime.ts`).
