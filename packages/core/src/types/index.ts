/**
 * ─── Core Types ───────────────────────────────────────────────
 * Base types used by every entity, adapter, and layer.
 * No platform-specific imports allowed in this file.
 */

/** ISO timestamp in milliseconds (Date.now()) */
export type TimestampMillis = number

/** UUID v4 string */
export type EntityId = string

/**
 * Base entity that ALL business entities extend.
 * Every entity gets these fields automatically.
 */
export interface BaseEntity {
  /** Unique identifier (UUID v4) */
  id: EntityId
  /** Tenant isolation — every entity belongs to a tenant */
  tenantId: string
  /** Created timestamp (set once) */
  createdAt: TimestampMillis
  /** Updated timestamp (bumped on every change) */
  updatedAt: TimestampMillis
  /** Soft-delete: null = active, timestamp = deleted */
  deletedAt: TimestampMillis | null
  /** Optimistic concurrency: bumped on every write */
  version: number
  /** Who created this record */
  createdBy: string
  /** Who last updated this record */
  updatedBy: string
}

/**
 * Query operators for filtering.
 */
export type FilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' 
  | 'in' | 'nin' | 'contains' | 'startsWith' | 'endsWith' | 'between'

export interface FilterRule {
  field: string
  operator: FilterOperator
  value: unknown
}

export type SortDirection = 'asc' | 'desc'

export interface SortRule {
  field: string
  direction: SortDirection
}

/**
 * Cursor-based pagination (enterprise-grade, avoids offset drift).
 */
export interface CursorQuery {
  /** Last ID or timestamp from previous page */
  cursor?: string
  /** Max results (default 50, max 500) */
  limit: number
  /** Filters */
  filter?: FilterRule[]
  /** Sort rules */
  sort?: SortRule[]
  /** Search across indexed fields */
  search?: string
  /** Include soft-deleted records */
  includeDeleted?: boolean
}

export interface CursorResult<T> {
  items: T[]
  nextCursor?: string
  total?: number
}

/**
 * Offset-based pagination (simpler, use for small datasets).
 */
export interface OffsetQuery {
  page: number
  pageSize: number
  filter?: FilterRule[]
  sort?: SortRule[]
  search?: string
  includeDeleted?: boolean
}

export interface OffsetResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type Query<T> = CursorQuery | OffsetQuery

export type QueryResult<T> = CursorResult<T> | OffsetResult<T>

/**
 * Write options for create/update/delete.
 */
export interface WriteOptions {
  /** Skip audit logging (system operations) */
  skipAudit?: boolean
  /** Skip sync queue (internal operations) */
  skipSync?: boolean
  /** Custom user ID (for system/service writes) */
  performedBy?: string
  /** Custom timestamp */
  performedAt?: TimestampMillis
}

/**
 * Generic create input — omits auto-generated fields.
 */
export type CreateInput<T extends BaseEntity> = Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'createdBy' | 'updatedBy' | 'deletedAt'>

/**
 * Generic update input — partial fields plus version for concurrency.
 */
export type UpdateInput<T extends BaseEntity> = Partial<Omit<T, 'id' | 'createdAt' | 'createdBy'>> & {
  /** Required for optimistic concurrency check */
  version: number
}

/**
 * Entity status for sync tracking.
 */
export type SyncStatus = 'pending' | 'synced' | 'conflict' | 'failed'

/**
 * Change log entry — records every mutation for sync.
 */
export interface ChangeLogEntry {
  id: string
  entityType: string
  entityId: string
  operation: 'create' | 'update' | 'delete'
  data: Record<string, unknown>
  previousData?: Record<string, unknown>
  timestamp: TimestampMillis
  clientId: string
  tenantId: string
  performedBy: string
  status: SyncStatus
  errorMessage?: string
  retryCount: number
  serverVersion?: number
}

/**
 * Sync conflict when local and remote diverge.
 */
export interface SyncConflict {
  id: string
  entityType: string
  entityId: string
  localVersion: number
  remoteVersion: number
  localData: Record<string, unknown>
  remoteData: Record<string, unknown>
  baseData: Record<string, unknown>
  strategy: ConflictStrategyType
  resolved: boolean
  resolvedAt?: TimestampMillis
  resolvedBy?: string
  resolution?: 'local' | 'remote' | 'custom'
}

export type ConflictStrategyType = 'lww' | 'per-field' | 'manual' | 'crdt'

/**
 * Sync status for the UI.
 */
export interface SyncStatusInfo {
  online: boolean
  pendingChanges: number
  lastSyncAt: TimestampMillis | null
  lastSyncStatus: 'success' | 'error' | 'in-progress'
  conflicts: number
  failedChanges: number
}

/**
 * Pagination type selection.
 */
export type PaginationType = 'cursor' | 'offset'
