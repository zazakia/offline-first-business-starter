/**
 * ─── Sync Engine Interface ───────────────────────────────────
 * The sync abstraction. Different strategies (LWW, CRDT, custom)
 * all implement this same interface.
 */

import type { ChangeLogEntry, SyncConflict, SyncStatusInfo, TimestampMillis } from '../types'

export interface PushResult {
  success: boolean
  syncedCount: number
  failedCount: number
  conflicts: SyncConflict[]
  errors: Array<{ id: string; error: string }>
}

export interface PullResult {
  success: boolean
  changesReceived: number
  changesApplied: number
  conflicts: SyncConflict[]
  serverTime: TimestampMillis
}

export interface SyncEngine {
  /** Push local changes to the server */
  push(): Promise<PushResult>

  /** Pull remote changes from the server */
  pull(): Promise<PullResult>

  /** Full sync: push + pull */
  sync(): Promise<{ push: PushResult; pull: PullResult }>

  /** Get current sync status */
  getStatus(): SyncStatusInfo

  /** Subscribe to status changes */
  onStatusChange(cb: (status: SyncStatusInfo) => void): () => void

  /** Get pending (unsynced) changes */
  getPendingChanges(): Promise<ChangeLogEntry[]>

  /** Get unresolved conflicts */
  getConflicts(): Promise<SyncConflict[]>

  /** Resolve a specific conflict */
  resolveConflict(conflictId: string, resolution: 'local' | 'remote' | 'custom', customData?: Record<string, unknown>): Promise<void>

  /** Retry failed changes */
  retryFailed(): Promise<PushResult>

  /** Force a sync now regardless of backoff */
  forceSync(): Promise<{ push: PushResult; pull: PullResult }>

  /** Clean up old change log entries */
  pruneChangeLog(olderThan: TimestampMillis): Promise<number>
}
