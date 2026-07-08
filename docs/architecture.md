# Architecture Overview

## Monorepo Structure

```
offline-first-starter/
├── packages/
│   ├── core/                  # Interfaces, types, entity registry, middleware, event bus
│   ├── db-adapter-dexie/      # Dexie.js (IndexedDB) adapter for web
│   ├── db-adapter-expo-sqlite/# Expo SQLite adapter for mobile (future)
│   ├── db-adapter-tauri-sql/  # Tauri SQL adapter for desktop (future)
│   ├── entity-customer/       # Customer business module (example)
│   ├── ui-core/               # Design system components
│   └── codegen/               # Code generator (future)
├── apps/
│   ├── web/                   # React + Vite + PWA (this app)
│   ├── mobile/                # Expo (future)
│   ├── desktop/               # Tauri (future)
│   └── api/                   # Hono backend (future)
└── docs/                      # Documentation
```

## Key Patterns

### 1. Repository Pattern
Every data source implements the `Repository<T>` interface (6 methods). Business logic never touches the database directly.

### 2. Entity Registry Pattern
Every business entity self-registers via `EntityRegistry.register()`. The registry auto-wires sync, API routes, UI navigation, and RBAC.

### 3. Middleware Pipeline
Every CRUD operation flows through a middleware chain: validation → auth → tenant check → audit → hooks → DB → events.

### 4. Adapter Pattern
DB adapters, auth providers, sync engines all implement interfaces. Swap by changing one import.

### 5. Offline-First
All writes go to local DB first. Sync engine pushes changes when online. Conflicts are detected and resolved via pluggable strategies.

## Adding a New Entity

```bash
# Future: pnpm codegen entity Order
# Manual (current):
# 1. Create packages/entity-order/
# 2. Define entity, schema, service, policies, hooks
# 3. Register: EntityRegistry.register(OrderEntity)
# 4. In app: add repository and routes
```

## Data Flow

```
User Action → Zustand (UI state) → Repository (local DB) → Change Log (sync)
                                                                     ↓
                                                              When online:
                                                              Push to API
                                                              Pull remote changes
                                                              Merge conflicts
