/**
 * ─── @repo/sync-engine — Barrel Export ───────────────────────
 */

export { OfflineSyncEngine } from './sync-engine'
export type { SyncEngineConfig } from './sync-engine'

export { DefaultConflictResolver, ManualConflictError } from './conflict-resolver'
export type { ConflictResolver } from './conflict-resolver'

export { DeadLetterQueue, calculateDelay, shouldRetry, isRetriableError } from './retry'
export type { RetryConfig, DeadLetterEntry } from './retry'
