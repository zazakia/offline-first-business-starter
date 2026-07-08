# Implementation Plan — Offline-First Business App Starter Kit

## Overview

Build an enterprise-grade offline-first starter kit for business applications that targets **web (PWA)**, **mobile (iOS/Android via Expo)**, and **desktop (Windows/Mac/Linux via Tauri)** with a single shared codebase.

## Core Architecture Principles

1. **🧱 Modular** — Every piece is a swappable package with a clean API (Repository pattern, Adapter pattern)
2. **🔌 Extensible** — New business entities via code generation; plugins via lifecycle hooks
3. **📈 Scalable** — Cursor pagination, compound indexes, batched sync, lazy loading
4. **🏢 Enterprise** — Multi-tenancy, RBAC with policies, immutable audit trails, feature flags
5. **🛡️ Reliable** — Transactional writes, exponential backoff + jitter, dead letter queues, typed errors

---

## Phase 1 — Foundation ✅

**Goal:** Working offline-first web app with Customer CRUD demonstrating the architecture.

### Deliverables

| Item | Lines | Status |
|---|---|---|
| Monorepo skeleton (Turborepo + pnpm) | ~50 | ✅ |
| `packages/core` — Entity registry, Repository interface, types, errors, validation | ~800 | ✅ |
| `packages/db-adapter-dexie` — Full Dexie.js implementation | ~500 | ✅ |
| `packages/ui-core` — 10+ design system components | ~1,200 | ✅ |
| `packages/entity-customer` — Complete business module | ~1,000 | ✅ |
| `apps/web` — React 19 + Vite 6 + Tailwind + TanStack Router + PWA | ~2,000 | ✅ |

**Files created:** ~43 source files
**Verification:** TypeScript clean, Vite production build, PWA service worker

---

## Phase 2 — Sync & Backend ✅

**Goal:** Local changes sync to server, conflicts are detected and resolved.

### Deliverables

| Item | Lines | Status |
|---|---|---|
| `packages/sync-engine` — Push/pull with conflict resolution, retry, dead letter queue | ~700 | ✅ |
| `packages/audit-trail` — Immutable append-only log with hash chaining | ~350 | ✅ |
| `apps/api` — Hono server with `/sync/push`, `/sync/pull`, `/sync/health` | ~400 | ✅ |

**Files created:** ~10 source files
**Verification:** Push/pull endpoints tested, health check returns correct state

---

## Phase 3 — Enterprise Features ✅

**Goal:** Production-ready security and observability.

### Deliverables

| Item | Lines | Status |
|---|---|---|
| `packages/multi-tenant` — Tenant isolation middleware, access control | ~150 | ✅ |
| `packages/feature-flags` — Runtime flag evaluation with multi-target rules | ~250 | ✅ |
| `packages/observability` — Structured logger, metrics, health reports | ~350 | ✅ |

**Files created:** ~6 source files
**Verification:** All flag strategies tested, health report generated, tenant isolation enforced

---

## Phase 4 — Mobile & Desktop ✅

**Goal:** Same business logic runs on all three platforms via adapter implementations.

### Deliverables

| Item | Lines | Status |
|---|---|---|
| `packages/db-adapter-expo-sqlite` — Expo SQLite adapter | ~150 | ✅ |
| `packages/db-adapter-tauri-sql` — Tauri SQL plugin adapter | ~100 | ✅ |
| `apps/mobile` — Expo app with router, customer list, create form | ~500 | ✅ |
| `apps/desktop` — Tauri v2 with Rust backend, SQLite, React UI | ~400 | ✅ |

**Files created:** ~12 source files
**Verification:** TypeScript clean, Tauri/Rust configs complete, Expo router configured

---

## Phase 5 — Tooling & DX ✅

**Goal:** Developer experience polished — code generation, testing, CI/CD, documentation.

### Deliverables

| Item | Lines | Status |
|---|---|---|
| `packages/codegen` — `pnpm codegen entity <Name>` CLI | ~400 | ✅ |
| `packages/testing` — Mock factories, repositories, async helpers | ~150 | ✅ |
| Unit tests — 161 tests across 7 packages | ~3,500 | ✅ |
| E2E tests — Playwright customer CRUD flow | ~80 | ✅ |
| CI/CD — `.github/workflows/ci.yml` | ~50 | ✅ |
| Docs — Architecture overview, ADRs, PRD | ~500 | ✅ |

**Files created:** ~6 source files + 13 test files
**Verification:** All 161 tests passing, CI pipeline configured

---

## Final Verification

| Check | Result |
|---|---|
| TypeScript strict mode | ✅ 0 errors across 14 packages |
| Production build | ✅ 551KB, PWA enabled |
| API server | ✅ Push/pull/health endpoints working |
| Unit tests | ✅ 161/161 passing |
| E2E tests | ✅ Playwright flow configured |
| GitHub push | ✅ https://github.com/zazakia/offline-first-business-starter |

---

## How to Add a New Entity

```bash
# 1. Generate the scaffold
pnpm codegen entity Order

# 2. Add to web app
#    apps/web/src/lib/db.ts — add repository
#    apps/web/src/router.tsx — add routes
#    apps/web/src/ — build UI pages

# 3. Write tests
#    packages/entity-order/src/__tests__/
```

## How to Add a New Adapter

```bash
# 1. Create packages/db-adapter-xyz/
# 2. Implement the Repository<T> interface (6 methods)
# 3. Use in the target app
```

## How to Deploy

```bash
# Web (Vercel/Netlify)
cd apps/web && pnpm build
# Deploy dist/

# API (Railway/Fly.io)
cd apps/api && pnpm start

# Mobile (EAS Build)
cd apps/mobile && npx eas build --platform all

# Desktop (Tauri)
cd apps/desktop && pnpm tauri build
```
