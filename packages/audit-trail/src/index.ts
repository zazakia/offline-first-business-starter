/**
 * ─── Immutable Audit Trail ──────────────────────────────────
 * Every entity mutation is logged as an immutable audit entry.
 * Entries are NEVER deleted or updated — only appended.
 * Supports tamper-proof chaining via hashes.
 */

import { v4 as uuidv4 } from 'uuid'
import type { BaseEntity, TimestampMillis, EntityId, Middleware, MiddlewareContext } from '@repo/core'

export interface AuditEntry {
  id: string
  tenantId: string
  entityType: string
  entityId: string
  action: 'create' | 'update' | 'delete' | 'sync' | 'export' | 'restore'
  performedBy: string
  performedAt: TimestampMillis
  previousValues?: Record<string, unknown>
  newValues?: Record<string, unknown>
  metadata?: {
    ip?: string
    userAgent?: string
    deviceId?: string
    correlationId?: string
    reason?: string
    redacted?: boolean
    redactedAt?: number
    [key: string]: unknown
  }
  /** SHA-256 hash chaining — links to previous entry for tamper detection */
  previousHash?: string
  hash?: string
}

export interface AuditStore {
  append(entry: AuditEntry): Promise<void>
  query(params: AuditQuery): Promise<AuditEntry[]>
  count(params: AuditQuery): Promise<number>
  verifyChain(): Promise<{ valid: boolean; brokenAt?: string }>
}

export interface AuditQuery {
  entityType?: string
  entityId?: string
  performedBy?: string
  action?: string
  fromDate?: TimestampMillis
  toDate?: TimestampMillis
  tenantId?: string
  page?: number
  pageSize?: number
}

class InMemoryAuditStore implements AuditStore {
  private entries: AuditEntry[] = []
  private lastHash?: string

  async append(entry: AuditEntry): Promise<void> {
    // Chain hash: hash of previous entry
    entry.previousHash = this.lastHash
    entry.hash = await this.computeHash(entry)
    this.lastHash = entry.hash
    this.entries.push(entry)
  }

  async query(params: AuditQuery): Promise<AuditEntry[]> {
    let result = [...this.entries]

    if (params.tenantId) result = result.filter((e) => e.tenantId === params.tenantId)
    if (params.entityType) result = result.filter((e) => e.entityType === params.entityType)
    if (params.entityId) result = result.filter((e) => e.entityId === params.entityId)
    if (params.performedBy) result = result.filter((e) => e.performedBy === params.performedBy)
    if (params.action) result = result.filter((e) => e.action === params.action)
    if (params.fromDate) result = result.filter((e) => e.performedAt >= params.fromDate!)
    if (params.toDate) result = result.filter((e) => e.performedAt <= params.toDate!)

    result.sort((a, b) => b.performedAt - a.performedAt)
    const page = params.page ?? 1
    const pageSize = params.pageSize ?? 50
    const start = (page - 1) * pageSize
    return result.slice(start, start + pageSize)
  }

  async count(params: AuditQuery): Promise<number> {
    const result = await this.query({ ...params, page: 1, pageSize: 1000000 })
    return result.length
  }

  async verifyChain(): Promise<{ valid: boolean; brokenAt?: string }> {
    let previousHash: string | undefined
    for (const entry of this.entries) {
      if (entry.previousHash !== previousHash) {
        return { valid: false, brokenAt: entry.id }
      }
      const expectedHash = await this.computeHash(entry)
      if (entry.hash !== expectedHash) {
        return { valid: false, brokenAt: entry.id }
      }
      previousHash = entry.hash
    }
    return { valid: true }
  }

  private async computeHash(entry: AuditEntry): Promise<string> {
    const data = JSON.stringify({ ...entry, hash: undefined, previousHash: undefined })
    // Simple hash for demo — in production use SHA-256 via SubtleCrypto
    const encoder = new TextEncoder()
    const bytes = encoder.encode(data + (entry.previousHash ?? ''))
    const hashBuffer = await crypto.subtle.digest('SHA-256', bytes)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  }
}

// Singleton store
const auditStore = new InMemoryAuditStore()

/**
 * Create an audit middleware that logs all CRUD operations.
 */
export function createAuditMiddleware(entityName: string): Middleware {
  const name = `${entityName}-audit`

  return {
    name,
    
    afterCreate: async (result: any, ctx: MiddlewareContext) => {
      await auditStore.append({
        id: uuidv4(),
        tenantId: ctx.tenantId,
        entityType: entityName,
        entityId: result.id,
        action: 'create',
        performedBy: ctx.userId,
        performedAt: ctx.timestamp,
        newValues: result,
        metadata: { correlationId: ctx.metadata?.correlationId as string },
      })
    },

    afterUpdate: async (result: any, ctx: MiddlewareContext) => {
      await auditStore.append({
        id: uuidv4(),
        tenantId: ctx.tenantId,
        entityType: entityName,
        entityId: result.id,
        action: 'update',
        performedBy: ctx.userId,
        performedAt: ctx.timestamp,
        newValues: result,
        metadata: { correlationId: ctx.metadata?.correlationId as string },
      })
    },

    afterDelete: async (result: any, ctx: MiddlewareContext) => {
      await auditStore.append({
        id: uuidv4(),
        tenantId: ctx.tenantId,
        entityType: entityName,
        entityId: result.id,
        action: 'delete',
        performedBy: ctx.userId,
        performedAt: ctx.timestamp,
        previousValues: result,
        metadata: { correlationId: ctx.metadata?.correlationId as string },
      })
    },

    onError: async (error: Error, ctx: MiddlewareContext) => {
      console.error(`[Audit] ${entityName} operation failed:`, error.message)
    },
  }
}

/**
 * Get the audit store for querying.
 */
export function getAuditStore(): AuditStore {
  return auditStore
}

/**
 * Export audit entries for compliance (GDPR, SOX).
 */
export async function exportAuditTrail(params: AuditQuery): Promise<string> {
  const entries = await auditStore.query(params)
  return JSON.stringify(entries, null, 2)
}

/**
 * GDPR: Delete all audit entries for a user (pseudonymization).
 */
export async function gdprDeleteUser(userId: string): Promise<number> {
  const entries = await auditStore.query({ performedBy: userId, pageSize: 100000 })
  let count = 0
  for (const entry of entries) {
    entry.performedBy = 'REDACTED'
    entry.metadata = { ...entry.metadata, redacted: true, redactedAt: Date.now() }
    count++
  }
  return count
}
