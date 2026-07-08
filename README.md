# 🏢 Offline-First Business App Starter Kit

Enterprise-grade starter kit for building offline-first business applications that run on **web (PWA)**, **mobile (iOS/Android)**, and **desktop (Windows/Mac/Linux)**.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Monorepo (Turborepo + pnpm)         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────┐  │
│  │   Web    │  │  Mobile  │  │ Desktop  │  │ API │  │
│  │ (React)  │  │  (Expo)  │  │ (Tauri)  │  │(Hono)│  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──┬──┘  │
│       └──────────────┼──────────────┘          │      │
│                      ▼                         │      │
│          ┌──────────────────────┐              │      │
│          │    packages/core     │ ◄────────────┘      │
│          │ (interfaces, types,  │                     │
│          │  registry, errors)   │                     │
│          └──────────────────────┘                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐    │
│  │ DbAdapter│  │  Entity  │  │    UI Core       │    │
│  │ (Dexie)  │  │(Customer)│  │(Components/Hooks)│    │
│  └──────────┘  └──────────┘  └──────────────────┘    │
└─────────────────────────────────────────────────────┘
```

## Features

- **Offline-First**: All data written to local DB first, synced in background
- **Cross-Platform**: Same business logic on web, mobile, desktop
- **Entity Registry**: Self-registering business modules
- **Repository Pattern**: Swap databases without touching logic
- **Middleware Pipeline**: Validation, auth, audit, tenant isolation
- **Pluggable Sync**: LWW, CRDT, or custom conflict resolution
- **Enterprise Ready**: RBAC with policies, audit trail, multi-tenancy
- **Typed Errors**: Full error hierarchy with structured metadata

## Quick Start

```bash
pnpm install
pnpm dev
```

Open http://localhost:5173 in your browser.

## Project Structure

```
packages/
├── core/              # Interfaces, types, registry, middleware
├── db-adapter-dexie/  # IndexedDB adapter (web)
├── ui-core/           # Design system components
└── entity-customer/   # Customer business module

apps/
└── web/               # React + Vite + PWA application
```

## Adding a New Entity

1. Create `packages/entity-yourname/`
2. Define types, Zod schemas, service, policies, hooks
3. Register with `EntityRegistry.register()`
4. Add repository in `apps/web/src/lib/db.ts`
5. Add routes in `apps/web/src/router.tsx`
6. Build your UI

## Tech Stack

| Layer | Technology |
|---|---|
| Monorepo | Turborepo + pnpm |
| Language | TypeScript 5.x |
| Web | React 19 + Vite 6 + Tailwind CSS |
| Mobile | Expo (future) |
| Desktop | Tauri v2 (future) |
| Local DB | Dexie.js (IndexedDB) |
| Validation | Zod |
| State | TanStack Query + Zustand |
| PWA | vite-plugin-pwa + Workbox |
| UI | Custom design system (Radix-based, future) |
