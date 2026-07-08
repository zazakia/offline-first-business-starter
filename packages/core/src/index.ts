/**
 * ─── @repo/core — Barrel Export ─────────────────────────────
 * The heart of the architecture. Zero platform dependencies.
 */

// Types
export type * from './types'

// Errors
export {
  AppError,
  ValidationError,
  NotFoundError,
  AuthError,
  ForbiddenError,
  ConflictError,
  SyncError,
  DataIntegrityError,
  NetworkError,
  TenantMismatchError,
  DatabaseError,
  RateLimitError,
} from './errors'

// Repository
export type { Repository, QueryParams, QueryResultType } from './repository/interface'
export { isCursorQuery, isOffsetQuery } from './repository/interface'

// Sync
export type { SyncEngine, PushResult, PullResult } from './sync/interface'

// Auth
export type { AuthProvider, Session, LoginInput, RegisterInput } from './auth/interface'

// Entity Registry
export { EntityRegistry } from './entity/registry'
export type { EntityDefinition, EntityUIConfig, EntitySyncConfig, EntityHooks, HookContext } from './entity/registry'

// Validation
export {
  entityIdSchema,
  timestampSchema,
  emailSchema,
  phoneSchema,
  urlSchema,
  baseEntitySchema,
  tagsSchema,
  statusSchema,
  notesSchema,
  createQuerySchema,
  createUpdateSchema,
  parseEntityId,
} from './validation/schema'

// Middleware
export { MiddlewarePipeline } from './middleware/pipeline'
export type { Middleware, MiddlewareContext } from './middleware/pipeline'

// Events
export { eventBus } from './event/bus'
export type { DomainEvent, DomainEventType, EventHandler, EventSubscription } from './event/bus'
