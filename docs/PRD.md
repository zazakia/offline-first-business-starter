# Product Requirements Document: Offline-First Business App Starter Kit

## 1. Executive Summary

**Product Name:** OfflineBiz Starter Kit
**Version:** 0.1.0
**Status:** ✅ Released — All 5 phases complete

A modular, enterprise-grade starter kit for building offline-first business applications that run on **web (PWA)**, **mobile (iOS/Android via Expo)**, and **desktop (Windows/Mac/Linux via Tauri)**. Built with a swappable adapter architecture — every layer (DB, auth, sync, UI) can be replaced without touching business logic.

## 2. Problem Statement

Building offline-first business apps today requires stitching together incompatible tools:
- WatermelonDB works on mobile but not desktop, and its web support uses an in-memory LokiJS adapter
- Supabase is great for online but requires significant custom work for true offline-first
- No starter kit exists that targets all three platforms (web, mobile, desktop) with the same codebase
- Enterprise features (RBAC, audit trail, multi-tenancy, feature flags) must be rebuilt for every project

## 3. Target Audience

| Audience | Need |
|---|---|
| **Startups** | Rapidly prototype and ship cross-platform business apps |
| **Enterprise teams** | Build internal tools with offline support for field workers |
| **Agencies** | White-label business apps for multiple clients |
| **Independent developers** | Learn and apply offline-first architecture patterns |

## 4. Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Monorepo (Turborepo + pnpm)                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │
│  │ Web/PWA  │  │  Mobile  │  │ Desktop  │  │  API Server  │ │
│  │ React 19 │  │  Expo    │  │  Tauri   │  │  Hono        │ │
│  │ Dexie.js │  │ SQLite   │  │ SQLite   │  │  (optional)  │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘ │
│       └──────────────┼──────────────┘              │         │
│                      ▼                             │         │
│          ┌──────────────────────┐                  │         │
│          │   packages/core      │ ◄────────────────┘         │
│          │(Interfaces, Registry,│                            │
│          │  Middleware, Events) │                            │
│          └──────────────────────┘                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────────┐   │
│  │ DB Adapter│  │  Entity  │  │  Enterprise Features    │   │
│  │ (Dexie)  │  │(Customer)│  │  (Tenant, Flags, Audit) │   │
│  └──────────┘  └──────────┘  └──────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

## 5. Feature Breakdown by Phase

### Phase 1: Foundation ✅
**Goal:** Working offline-first web app with Customer CRUD

| Feature | Status | Details |
|---|---|---|
| Monorepo skeleton | ✅ | Turborepo + pnpm, 14 packages |
| Entity Registry | ✅ | Self-registering modules, auto-wiring |
| Repository Interface | ✅ | 6-method contract for all data access |
| Typed Error Hierarchy | ✅ | 11 error classes with structured metadata |
| Middleware Pipeline | ✅ | Before/after hooks for all CRUD operations |
| Domain Event Bus | ✅ | Typed events, wildcard handlers, history |
| Dexie.js DB Adapter | ✅ | Full IndexedDB implementation with change tracking |
| UI Design System | ✅ | Button, Input, Badge, Card, Modal, Toast, ErrorBoundary |
| Customer Entity Module | ✅ | Schema, service, RBAC policies, lifecycle hooks, UI config |
| PWA Setup | ✅ | Service worker, manifest, precaching, install prompt |
| Customer CRUD Pages | ✅ | List (search/filter/paginate), create form, detail/edit |

### Phase 2: Sync & Backend ✅
**Goal:** Changes sync to server, conflicts are resolved

| Feature | Status | Details |
|---|---|---|
| Sync Engine | ✅ | Push/pull with configurable batch size |
| Conflict Resolution | ✅ | LWW, per-field merge, manual, CRDT strategies |
| Exponential Backoff | ✅ | Configurable retry with jitter |
| Dead Letter Queue | ✅ | Permanently failed changes stored for admin review |
| Audit Trail | ✅ | Immutable append-only with SHA-256 hashing |
| Tamper Detection | ✅ | Hash chain verification |
| Hono Sync API | ✅ | POST /sync/push, GET /sync/pull, GET /sync/health |
| GDPR Compliance | ✅ | User data redaction, audit export |

### Phase 3: Enterprise Features ✅
**Goal:** Production-ready security and operations

| Feature | Status | Details |
|---|---|---|
| Multi-Tenancy | ✅ | Tenant isolation middleware, cross-tenant access control |
| RBAC with Policies | ✅ | Attribute-based, priority-ordered policy evaluation |
| Feature Flags | ✅ | Environment, tenant, user, percentage targeting |
| Observability | ✅ | Structured logger, metrics collector, health reports |
| Event Bus Integration | ✅ | Automatic logging of all domain events |

### Phase 4: Mobile & Desktop ✅
**Goal:** Same business logic runs on all platforms

| Feature | Status | Details |
|---|---|---|
| Expo SQLite Adapter | ✅ | Repository interface for React Native |
| Tauri SQL Plugin Adapter | ✅ | Repository interface for desktop SQLite |
| Expo Mobile App | ✅ | Expo Router, customer list, create form, offline storage |
| Tauri Desktop App | ✅ | Rust backend, SQLite, system tray, React frontend |

### Phase 5: Tooling & DX ✅
**Goal:** Developer experience polished

| Feature | Status | Details |
|---|---|---|
| Code Generator | ✅ | `pnpm codegen entity <Name>` scaffolds full module |
| Test Utilities | ✅ | Mock factories, mock repositories, async wait helpers |
| Unit Tests | ✅ | 161 tests across 7 packages |
| E2E Tests | ✅ | Playwright customer CRUD flow tests |
| CI/CD Pipeline | ✅ | Type check → lint → test → build → E2E |
| Architecture Docs | ✅ | Overview, ADRs (Turborepo, Repository pattern) |

## 6. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Package Manager | pnpm | 9.6+ |
| Monorepo | Turborepo | 2.10+ |
| Language | TypeScript | 5.5+ (strict mode) |
| Web Framework | React | 19 |
| Bundler | Vite | 6 |
| Routing | TanStack Router | 1.x |
| Data Fetching | TanStack Query | 5.x |
| Client State | Zustand | 5.x |
| CSS | Tailwind CSS | 3.4 |
| Validation | Zod | 3.23 |
| Local DB (Web) | Dexie.js (IndexedDB) | 4.x |
| Local DB (Mobile) | expo-sqlite | 14.x |
| Local DB (Desktop) | @tauri-apps/plugin-sql | 2.x |
| API Server | Hono | 4.x |
| Mobile | Expo | 52 |
| Desktop | Tauri | 2 |
| Testing | Vitest + Playwright | Latest |
| PWA | vite-plugin-pwa | 0.20 |

## 7. Key Architecture Decisions

### ADR-001: Turborepo + pnpm
**Context:** Multi-package monorepo with shared types, UI, adapters, and apps.
**Decision:** Turborepo for build orchestration + pnpm for strict dependency management.
**Status:** ✅ Accepted

### ADR-002: Repository Pattern
**Context:** Need to support IndexedDB (web), SQLite (mobile/desktop), PostgreSQL (server).
**Decision:** All data access through 6-method `Repository<T>` interface.
**Status:** ✅ Accepted

### ADR-003: Custom Sync Engine
**Context:** WatermelonDB locks you into its protocol; RxDB is heavy.
**Decision:** Build a ~500-line sync engine with pluggable conflict strategies.
**Status:** ✅ Accepted

## 8. Project Structure

```
offline-first-starter/
├── packages/
│   ├── core/                    # Interfaces, types, registry, middleware, events
│   ├── db-adapter-dexie/        # IndexedDB adapter (web)
│   ├── db-adapter-expo-sqlite/  # SQLite adapter (mobile)
│   ├── db-adapter-tauri-sql/    # SQLite adapter (desktop)
│   ├── ui-core/                 # Design system components
│   ├── entity-customer/         # Customer business module (example)
│   ├── sync-engine/             # Push/pull sync, conflict resolution, retry
│   ├── audit-trail/             # Immutable audit log
│   ├── multi-tenant/            # Tenant isolation
│   ├── feature-flags/           # Runtime feature toggles
│   ├── observability/           # Logging, metrics, health
│   ├── codegen/                 # Entity scaffolding CLI
│   └── testing/                 # Shared test utilities
├── apps/
│   ├── web/                     # React + Vite + PWA
│   ├── mobile/                  # Expo (iOS + Android)
│   ├── desktop/                 # Tauri (Win + Mac + Linux)
│   └── api/                     # Hono sync backend
├── e2e/                         # Playwright E2E tests
├── docs/                        # Documentation + ADRs
└── .github/workflows/           # CI/CD pipelines
```

## 9. Quality Metrics

| Metric | Value |
|---|---|
| TypeScript strict mode | ✅ Enabled |
| Type errors | **0** across all 14 packages |
| Unit tests | **161** passing across 7 test suites |
| Build size (web) | **551KB** gzip (242KB app + 163KB core + 129KB vendor) |
| PWA score | Service worker, manifest, precaching ✅ |
| API endpoints | Push/pull/health verified ✅ |
| CI pipeline | Type check → lint → test → build → E2E ✅ |

## 10. Getting Started

```bash
# Clone
git clone https://github.com/zazakia/offline-first-business-starter.git
cd offline-first-business-starter

# Install
pnpm install

# Run web app (PWA)
cd apps/web && npx vite

# Run API server (optional, for sync)
cd apps/api && npx tsx src/index.ts

# Run mobile app
cd apps/mobile && npx expo start

# Run desktop app
cd apps/desktop && pnpm tauri dev

# Generate a new entity
pnpm codegen entity Order
```

## 11. Future Roadmap

| Feature | Priority |
|---|---|
| Real-time sync via WebSocket | Medium |
| Offline-first file attachments | Medium |
| Role-based UI (hide/show features by role) | Low |
| Multi-language (i18n) | Low |
| Visual entity builder UI | Low |
| Supabase adapter for backend | Low |
