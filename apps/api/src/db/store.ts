/**
 * ─── Server-Side Data Store ─────────────────────────────────
 * In-memory store for the API server.
 * In production, this would be PostgreSQL/SQLite.
 */

import type { ChangeLogEntry, EntityId, TimestampMillis } from '@repo/core'
import { v4 as uuidv4 } from 'uuid'

export interface ServerEntity {
  id: string
  tenantId: string
  type: string
  data: Record<string, unknown>
  version: number
  createdAt: TimestampMillis
  updatedAt: TimestampMillis
  deletedAt: TimestampMillis | null
}

class ServerStore {
  private entities = new Map<string, ServerEntity>()
  private changeLog: ChangeLogEntry[] = []

  /** Upsert an entity from sync */
  upsertEntity(type: string, data: Record<string, unknown>, tenantId: string): ServerEntity {
    const id = data.id as string
    const existing = this.entities.get(id)
    
    const now = Date.now()
    const entity: ServerEntity = existing ?? {
      id,
      tenantId,
      type,
      data: {},
      version: 0,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    }

    entity.data = { ...entity.data, ...data }
    entity.version++
    entity.updatedAt = now
    if (data.deletedAt) {
      entity.deletedAt = data.deletedAt as number
    }
    this.entities.set(id, entity)
    return entity
  }

  /** Get entity by ID */
  getEntity(id: string): ServerEntity | undefined {
    return this.entities.get(id)
  }

  /** Get all changes since a timestamp for a tenant */
  getChangesSince(since: TimestampMillis, tenantId: string): ChangeLogEntry[] {
    return this.changeLog
      .filter((c) => c.timestamp > since && c.tenantId === tenantId)
      .sort((a, b) => a.timestamp - b.timestamp)
  }

  /** Append to change log */
  appendChangeLog(entry: ChangeLogEntry): void {
    this.changeLog.push(entry)
    // Keep only last 10000 entries
    if (this.changeLog.length > 10000) {
      this.changeLog.splice(0, this.changeLog.length - 10000)
    }
  }

  /** Get server time */
  getServerTime(): TimestampMillis {
    return Date.now()
  }

  /** Health check */
  getHealth() {
    return {
      status: 'healthy',
      entities: this.entities.size,
      changeLogEntries: this.changeLog.length,
      uptime: process.uptime(),
    }
  }
}

export const serverStore = new ServerStore()
