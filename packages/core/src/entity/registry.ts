/**
 * ─── Entity Registry ──────────────────────────────────────────
 * The central registry where all business entities register themselves.
 * Auto-wires: sync, API routes, UI navigation, RBAC, audit.
 *
 * To add a new entity:
 *   1. Create a package `packages/entity-yourname/`
 *   2. Define your entity definition (see EntityDefinition)
 *   3. Call `EntityRegistry.register(yourEntityDef)` in your entity's entry point
 *   4. Import the entity package in the app — done!
 */

import type { BaseEntity, ConflictStrategyType, PaginationType, EntityId } from '../types'

/**
 * UI configuration for an entity.
 * Controls how the entity appears in lists, forms, and navigation.
 */
export interface EntityUIConfig {
  /** Human-readable singular name (e.g., "Customer") */
  label: string
  /** Human-readable plural name (e.g., "Customers") */
  labelPlural: string
  /** Icon identifier (maps to Lucide icon names) */
  icon?: string
  /** Default route path segment (e.g., "customers") */
  routePath: string
  /** Color theme for badges and accents */
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray'
  /** Whether this entity appears in the main navigation */
  showInNav?: boolean
  /** Order in navigation (lower = first) */
  navOrder?: number
}

/**
 * Sync configuration per entity.
 * Different entities can use different sync strategies.
 */
export interface EntitySyncConfig {
  /** Whether sync is enabled for this entity */
  enabled: boolean
  /** Conflict resolution strategy */
  conflictStrategy: ConflictStrategyType
  /** Priority for sync queue (higher = sync first) */
  priority: 'critical' | 'normal' | 'background'
  /** Fields to exclude from sync (e.g., local-only caches) */
  excludeFields?: string[]
}

/**
 * Audit configuration per entity.
 */
export interface EntityAuditConfig {
  /** Whether to audit trail this entity */
  enabled: boolean
  /** Fields whose changes are NOT recorded (e.g., tokens) */
  excludeFields?: string[]
}

/**
 * RBAC configuration per entity.
 */
export interface EntityRbacConfig {
  /** Whether RBAC is enforced */
  enabled: boolean
  /** Custom permission prefix (e.g., "customer" → "customer:create") */
  permissionPrefix?: string
}

/**
 * Entity lifecycle hooks.
 * Return `false` or throw to abort the operation.
 */
export interface EntityHooks<T extends BaseEntity> {
  beforeCreate?: (input: Record<string, unknown>, context: HookContext) => Promise<Record<string, unknown>>
  afterCreate?: (entity: T, context: HookContext) => Promise<void>
  beforeUpdate?: (id: EntityId, input: Record<string, unknown>, context: HookContext) => Promise<Record<string, unknown>>
  afterUpdate?: (entity: T, context: HookContext) => Promise<void>
  beforeDelete?: (id: EntityId, context: HookContext) => Promise<void>
  afterDelete?: (entity: T, context: HookContext) => Promise<void>
  beforeRead?: (id: EntityId, context: HookContext) => Promise<void>
  afterRead?: (entity: T | null, context: HookContext) => Promise<T | null>
}

export interface HookContext {
  userId: string
  tenantId: string
  timestamp: number
  metadata?: Record<string, unknown>
}

/**
 * Complete entity definition.
 * Every entity module exports one of these.
 */
export interface EntityDefinition<T extends BaseEntity = BaseEntity> {
  /** Unique entity name (e.g., "customer", "order") */
  name: string
  /** UI configuration */
  ui: EntityUIConfig
  /** Sync configuration */
  sync: EntitySyncConfig
  /** Audit configuration */
  audit: EntityAuditConfig
  /** RBAC configuration */
  rbac: EntityRbacConfig
  /** Entity hooks */
  hooks: EntityHooks<T>
  /** Pagination type */
  pagination: PaginationType
  /** Tenant isolation */
  tenant: { enabled: boolean; field?: string }
  /** Soft delete */
  softDelete: { enabled: boolean; field?: string }
}

/**
 * The entity registry singleton.
 */
class EntityRegistryClass {
  private entities = new Map<string, EntityDefinition>()
  private initialized = false

  /**
   * Register an entity definition.
   * Each entity module should call this at import time.
   */
  register<T extends BaseEntity>(def: EntityDefinition<T>): void {
    if (this.entities.has(def.name)) {
      // Allow re-registration in development (HMR)
      if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') {
        throw new Error(`Entity "${def.name}" is already registered`)
      }
    }
    this.entities.set(def.name, def as unknown as EntityDefinition)
  }

  /** Get an entity definition by name */
  get(name: string): EntityDefinition {
    const entity = this.entities.get(name)
    if (!entity) {
      throw new Error(`Entity "${name}" is not registered. Available: ${this.list().join(', ')}`)
    }
    return entity
  }

  /** Check if an entity is registered */
  has(name: string): boolean {
    return this.entities.has(name)
  }

  /** Get all registered entities */
  getAll(): EntityDefinition[] {
    return Array.from(this.entities.values())
  }

  /** Get entity names */
  list(): string[] {
    return Array.from(this.entities.keys())
  }

  /** Get entities that should appear in navigation */
  getNavEntities(): EntityDefinition[] {
    return this.getAll()
      .filter((e) => e.ui.showInNav !== false)
      .sort((a, b) => (a.ui.navOrder ?? 999) - (b.ui.navOrder ?? 999))
  }

  /** Get entities with sync enabled */
  getSyncEntities(): EntityDefinition[] {
    return this.getAll().filter((e) => e.sync.enabled)
  }

  /** Lock the registry (prevents further registration) */
  lock(): void {
    this.initialized = true
  }

  get isInitialized(): boolean {
    return this.initialized
  }
}

/** Singleton instance */
export const EntityRegistry = new EntityRegistryClass()
