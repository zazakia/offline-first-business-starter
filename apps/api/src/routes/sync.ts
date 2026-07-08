/**
 * ─── Sync Routes ─────────────────────────────────────────────
 * Push/pull endpoints for the offline sync engine.
 */

import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { serverStore } from '../db/store'

type Variables = {
  userId: string
  tenantId: string
  roles: string[]
}

const syncRouter = new Hono<{ Variables: Variables }>()

// ─── Push Schema ─────────────────────────────────────────

const pushSchema = z.object({
  changes: z.array(z.object({
    id: z.string(),
    entityType: z.string(),
    entityId: z.string(),
    operation: z.enum(['create', 'update', 'delete']),
    data: z.record(z.unknown()),
    previousData: z.record(z.unknown()).optional(),
    timestamp: z.number(),
    clientId: z.string(),
    tenantId: z.string(),
    performedBy: z.string(),
    status: z.string(),
    retryCount: z.number(),
  })),
})

// ─── Push ────────────────────────────────────────────────

syncRouter.post('/push', zValidator('json', pushSchema), async (c) => {
  const { changes } = c.req.valid('json')
  const tenantId = c.var.tenantId ?? 'default'

  const syncedIds: string[] = []
  const errors: Array<{ id: string; error: string }> = []
  const conflicts: Array<{ id: string; entityType: string; entityId: string; localVersion: number; remoteVersion: number }> = []

  for (const change of changes) {
    try {
      if (change.tenantId !== tenantId) {
        errors.push({ id: change.id, error: 'Tenant mismatch' })
        continue
      }

      const existing = serverStore.getEntity(change.entityId)

      if (change.operation === 'delete') {
        serverStore.upsertEntity(change.entityType, {
          ...change.data,
          deletedAt: Date.now(),
        }, tenantId)
        syncedIds.push(change.id)
      } else {
        if (existing && existing.version !== (change.data.version as number)) {
          conflicts.push({
            id: change.id,
            entityType: change.entityType,
            entityId: change.entityId,
            localVersion: existing.version,
            remoteVersion: change.data.version as number,
          })
          continue
        }

        serverStore.upsertEntity(change.entityType, change.data, tenantId)
        syncedIds.push(change.id)
      }

      serverStore.appendChangeLog({
        ...change,
        status: 'synced',
      })
    } catch (err: any) {
      errors.push({ id: change.id, error: err.message })
    }
  }

  return c.json({
    success: errors.length === 0,
    syncedCount: syncedIds.length,
    failedCount: errors.length,
    conflicts,
    errors,
  })
})

// ─── Pull ─────────────────────────────────────────────────

syncRouter.get('/pull', async (c) => {
  const since = parseInt(c.req.query('since') ?? '0', 10)
  const tenantId = c.var.tenantId ?? 'default'

  const changes = serverStore.getChangesSince(since, tenantId)

  return c.json({
    changes,
    serverTime: serverStore.getServerTime(),
  })
})

// ─── Health ──────────────────────────────────────────────

syncRouter.get('/health', (c) => {
  return c.json(serverStore.getHealth())
})

export { syncRouter }
