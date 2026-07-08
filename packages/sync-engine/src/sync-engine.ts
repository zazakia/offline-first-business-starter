/**
 * ─── Sync Engine Implementation ──────────────────────────────
 * Full sync engine with push/pull, conflict resolution, retry,
 * and dead letter queue.
 */

import { v4 as uuidv4 } from 'uuid'
import type {
  SyncEngine,
  SyncStatusInfo,
  ChangeLogEntry,
  SyncConflict,
  PushResult,
  PullResult,
  Repository,
  EntityDefinition,
  BaseEntity,
  TimestampMillis,
  ConflictStrategyType,
} from '@repo/core'
import { SyncError, eventBus } from '@repo/core'
import { DefaultConflictResolver } from './conflict-resolver'
import { calculateDelay, shouldRetry, isRetriableError, DeadLetterQueue, DEFAULT_RETRY_CONFIG } from './retry'
import type { RetryConfig } from './retry'

export interface SyncEngineConfig {
  /** API base URL for sync endpoints */
  apiBaseUrl: string
  /** Polling interval in ms when online (default: 30000 = 30s) */
  pollIntervalMs?: number
  /** Batch size for push/pull (default: 50) */
  batchSize?: number
  /** Retry configuration */
  retry?: Partial<RetryConfig>
  /** Auth token getter */
  getAuthToken?: () => Promise<string | null>
  /** Entity registry getter */
  getEntityDefinitions: () => EntityDefinition[]
  /** DB change log repository */
  changeLogRepo: Repository<ChangeLogEntry & BaseEntity>
  /** Repositories keyed by entity name */
  getRepository: (entityName: string) => Repository<any>
}

export class OfflineSyncEngine implements SyncEngine {
  private status: SyncStatusInfo = {
    online: navigator.onLine,
    pendingChanges: 0,
    lastSyncAt: null,
    lastSyncStatus: 'success',
    conflicts: 0,
    failedChanges: 0,
  }

  private statusListeners = new Set<(status: SyncStatusInfo) => void>()
  private config: Required<SyncEngineConfig>
  private conflictResolver = new DefaultConflictResolver()
  private deadLetterQueue = new DeadLetterQueue()
  private pollTimer: ReturnType<typeof setInterval> | null = null
  private syncing = false

  constructor(config: SyncEngineConfig) {
    this.config = {
      pollIntervalMs: 30000,
      batchSize: 50,
      retry: {},
      getAuthToken: async () => null,
      ...config,
    }

    // Start polling
    this.startPolling()

    // Listen for online/offline
    window.addEventListener('online', () => {
      this.updateStatus({ online: true })
      this.triggerSync()
    })
    window.addEventListener('offline', () => {
      this.updateStatus({ online: false })
      this.stopPolling()
    })
  }

  // ─── Private Helpers ───────────────────────────────────

  private updateStatus(partial: Partial<SyncStatusInfo>): void {
    this.status = { ...this.status, ...partial }
    this.statusListeners.forEach((cb) => cb(this.status))
  }

  private async getHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    const token = await this.config.getAuthToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    return headers
  }

  private startPolling(): void {
    if (this.pollTimer) return
    this.pollTimer = setInterval(() => {
      if (navigator.onLine && !this.syncing) {
        this.sync().catch(() => {})
      }
    }, this.config.pollIntervalMs)
  }

  private stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer)
      this.pollTimer = null
    }
  }

  private async triggerSync(): Promise<void> {
    // Debounce: wait a moment then sync
    await new Promise((r) => setTimeout(r, 1000))
    if (navigator.onLine) {
      await this.sync().catch(() => {})
    }
  }

  // ─── Push ──────────────────────────────────────────────

  async push(): Promise<PushResult> {
    const result: PushResult = {
      success: true,
      syncedCount: 0,
      failedCount: 0,
      conflicts: [],
      errors: [],
    }

    try {
      // Get pending changes
      const pendingResponse = await this.config.changeLogRepo.findMany({
        page: 1,
        pageSize: this.config.batchSize,
        filter: [{ field: 'status', operator: 'eq', value: 'pending' }],
        sort: [{ field: 'timestamp', direction: 'asc' }],
      })

      const pending = 'items' in pendingResponse ? pendingResponse.items as (ChangeLogEntry & BaseEntity)[] : []

      if (pending.length === 0) return result

      this.updateStatus({ lastSyncStatus: 'in-progress' })

      // Send changes to server
      const response = await fetch(`${this.config.apiBaseUrl}/sync/push`, {
        method: 'POST',
        headers: await this.getHeaders(),
        body: JSON.stringify({ changes: pending }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new SyncError(`Push failed: ${response.status} ${errorText}`)
      }

      const serverResult = await response.json() as PushResult

      // Process results
      for (const syncError of serverResult.errors) {
        const change = pending.find((c) => c.id === syncError.id)
        if (change) {
          change.status = 'failed'
          change.errorMessage = syncError.error
          change.retryCount++
          await this.config.changeLogRepo.update(change.id, change as any)

          if (!shouldRetry(change, { ...DEFAULT_RETRY_CONFIG, ...this.config.retry })) {
            this.deadLetterQueue.add(change, syncError.error)
          }
        }
      }

      for (const conflict of serverResult.conflicts) {
        const change = pending.find((c) => c.id === conflict.id)
        if (change) {
          change.status = 'conflict'
          await this.config.changeLogRepo.update(change.id, change as any)
        }
      }

      // Mark synced changes
      const syncedIds = pending
        .filter((c) => !serverResult.errors.find((e) => e.id === c.id))
        .filter((c) => !serverResult.conflicts.find((e) => e.id === c.id))
        .map((c) => c.id)

      for (const id of syncedIds) {
        const change = pending.find((c) => c.id === id)
        if (change) {
          change.status = 'synced'
          await this.config.changeLogRepo.update(id, change as any)
        }
      }

      result.syncedCount = syncedIds.length
      result.failedCount = serverResult.errors.length
      result.conflicts = serverResult.conflicts
      result.errors = serverResult.errors

      // Update pending count
      const countResponse = await this.config.changeLogRepo.count({
        filter: [{ field: 'status', operator: 'eq', value: 'pending' }],
      })
      this.updateStatus({ pendingChanges: countResponse })

    } catch (error: any) {
      result.success = false
      // Mark changes with retriable errors
      if (isRetriableError(error)) {
        this.updateStatus({ lastSyncStatus: 'error' })
      }
    }

    return result
  }

  // ─── Pull ──────────────────────────────────────────────

  async pull(): Promise<PullResult> {
    const result: PullResult = {
      success: true,
      changesReceived: 0,
      changesApplied: 0,
      conflicts: [],
      serverTime: Date.now(),
    }

    try {
      const lastSync = this.status.lastSyncAt ?? 0

      const response = await fetch(
        `${this.config.apiBaseUrl}/sync/pull?since=${lastSync}`,
        { headers: await this.getHeaders() },
      )

      if (!response.ok) {
        const errorText = await response.text()
        throw new SyncError(`Pull failed: ${response.status} ${errorText}`)
      }

      const serverData = await response.json() as {
        changes: ChangeLogEntry[]
        serverTime: number
      }

      result.changesReceived = serverData.changes.length
      result.serverTime = serverData.serverTime

      // Apply remote changes
      for (const change of serverData.changes) {
        try {
          const repository = this.config.getRepository(change.entityType)
          const def = this.config.getEntityDefinitions().find((d) => d.name === change.entityType)

          if (!repository || !def) {
            console.warn(`No repository or definition for entity: ${change.entityType}`)
            continue
          }

          if (change.operation === 'delete') {
            // Check if local version exists
            const local = await repository.findById(change.entityId)
            if (local) {
              await repository.delete(change.entityId, { skipSync: true })
            }
            result.changesApplied++
          } else {
            // Create or update
            const local = await repository.findById(change.entityId)
            
            if (!local) {
              // New entity from server
              await repository.create(change.data as any, { skipSync: true })
              result.changesApplied++
            } else if (local.updatedAt < change.timestamp) {
              // Server has newer version — update
              const updateData = { ...change.data, version: local.version }
              await repository.update(change.entityId, updateData as any, { skipSync: true })
              result.changesApplied++
            } else if (local.version !== change.data.version) {
              // Conflict detected
              const strategy = def.sync.conflictStrategy as ConflictStrategyType
              
              let resolutionResult: { resolution: 'local' | 'remote' | 'custom'; data: Partial<any> }
              let isManualConflict = false
              
              try {
                resolutionResult = this.conflictResolver.resolve(
                  local,
                  change.data as any,
                  local,
                  strategy,
                )
              } catch (conflictErr) {
                // Manual conflict resolution required
                isManualConflict = true
                resolutionResult = { resolution: 'local', data: local }
              }

              if (resolutionResult.resolution === 'remote') {
                await repository.update(change.entityId, resolutionResult.data as any, { skipSync: true })
                result.changesApplied++
              }

              result.conflicts.push({
                id: uuidv4(),
                entityType: change.entityType,
                entityId: change.entityId,
                localVersion: local.version,
                remoteVersion: change.data.version as number,
                localData: local as any,
                remoteData: change.data,
                baseData: local as any,
                strategy,
                resolved: !isManualConflict,
              })
            }
          }
        } catch (err) {
          console.error(`Failed to apply remote change:`, change, err)
        }
      }

      // Update last sync time
      this.updateStatus({
        lastSyncAt: serverData.serverTime,
        lastSyncStatus: 'success',
        conflicts: result.conflicts.length,
      })

    } catch (error: any) {
      result.success = false
      this.updateStatus({ lastSyncStatus: 'error' })
    }

    return result
  }

  // ─── Full Sync ─────────────────────────────────────────

  async sync(): Promise<{ push: PushResult; pull: PullResult }> {
    if (this.syncing) return { push: { success: false, syncedCount: 0, failedCount: 0, conflicts: [], errors: [] }, pull: { success: false, changesReceived: 0, changesApplied: 0, conflicts: [], serverTime: Date.now() } }
    
    this.syncing = true
    eventBus.emit('sync.started', {}).catch(() => {})

    try {
      const pushResult = await this.push()
      const pullResult = await this.pull()

      eventBus.emit('sync.completed', {
        pushSynced: pushResult.syncedCount,
        pullApplied: pullResult.changesApplied,
        conflicts: pushResult.conflicts.length + pullResult.conflicts.length,
      }).catch(() => {})

      return { push: pushResult, pull: pullResult }
    } catch (error) {
      eventBus.emit('sync.failed', { error: String(error) }).catch(() => {})
      throw error
    } finally {
      this.syncing = false
    }
  }

  // ─── Status & Events ───────────────────────────────────

  getStatus(): SyncStatusInfo {
    return { ...this.status }
  }

  onStatusChange(cb: (status: SyncStatusInfo) => void): () => void {
    this.statusListeners.add(cb)
    cb(this.status)
    return () => {
      this.statusListeners.delete(cb)
    }
  }

  async getPendingChanges(): Promise<ChangeLogEntry[]> {
    const response = await this.config.changeLogRepo.findMany({
      page: 1,
      pageSize: 1000,
      filter: [{ field: 'status', operator: 'eq', value: 'pending' }],
    })
    return ('items' in response ? response.items : []) as ChangeLogEntry[]
  }

  async getConflicts(): Promise<SyncConflict[]> {
    // Conflicts are stored as change log entries with status 'conflict'
    const response = await this.config.changeLogRepo.findMany({
      page: 1,
      pageSize: 1000,
      filter: [{ field: 'status', operator: 'eq', value: 'conflict' }],
    })
    const conflicts = ('items' in response ? response.items : []) as (ChangeLogEntry & BaseEntity)[]
    
    return conflicts.map((c) => ({
      id: c.id,
      entityType: c.entityType,
      entityId: c.entityId,
      localVersion: 0,
      remoteVersion: 0,
      localData: c.previousData ?? {},
      remoteData: c.data,
      baseData: c.previousData ?? {},
      strategy: 'lww',
      resolved: false,
    }))
  }

  async resolveConflict(conflictId: string, resolution: 'local' | 'remote' | 'custom', customData?: Record<string, unknown>): Promise<void> {
    const conflict = await this.config.changeLogRepo.findById(conflictId)
    if (!conflict) throw new Error(`Conflict ${conflictId} not found`)

    if (resolution === 'local') {
      // Discard remote change — keep local
      await this.config.changeLogRepo.delete(conflictId)
    } else if (resolution === 'remote') {
      // Accept remote change — apply to local DB
      const repo = this.config.getRepository(conflict.entityType)
      if (repo) {
        const local = await repo.findById(conflict.entityId)
        if (local) {
          await repo.update(conflict.entityId, { ...conflict.data, version: local.version } as any, { skipSync: true })
        }
      }
      await this.config.changeLogRepo.delete(conflictId)
    } else if (resolution === 'custom' && customData) {
      const repo = this.config.getRepository(conflict.entityType)
      if (repo) {
        const local = await repo.findById(conflict.entityId)
        if (local) {
          await repo.update(conflict.entityId, { ...customData, version: local.version } as any, { skipSync: true })
        }
      }
      await this.config.changeLogRepo.delete(conflictId)
    }
  }

  async retryFailed(): Promise<PushResult> {
    // Move dead letter entries back to pending
    const entries = this.deadLetterQueue.retryAll()
    for (const entry of entries) {
      const change = await this.config.changeLogRepo.findById(entry.change.id)
      if (change) {
        change.status = 'pending'
        change.retryCount = 0
        change.errorMessage = undefined
        await this.config.changeLogRepo.update(entry.change.id, change as any)
      }
    }
    return this.push()
  }

  async forceSync(): Promise<{ push: PushResult; pull: PullResult }> {
    this.stopPolling()
    try {
      return await this.sync()
    } finally {
      this.startPolling()
    }
  }

  async pruneChangeLog(olderThan: TimestampMillis): Promise<number> {
    const response = await this.config.changeLogRepo.findMany({
      page: 1,
      pageSize: 10000,
      filter: [
        { field: 'timestamp', operator: 'lt', value: olderThan },
        { field: 'status', operator: 'eq', value: 'synced' },
      ],
    })
    const items = ('items' in response ? response.items : []) as (ChangeLogEntry & BaseEntity)[]
    
    for (const item of items) {
      await this.config.changeLogRepo.delete(item.id)
    }
    
    return items.length
  }

  /** Clean up resources */
  destroy(): void {
    this.stopPolling()
    this.statusListeners.clear()
    this.deadLetterQueue.clear()
  }
}

export { DeadLetterQueue } from './retry'
export { DefaultConflictResolver, ManualConflictError } from './conflict-resolver'
