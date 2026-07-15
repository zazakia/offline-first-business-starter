/**
 * ─── Lab Hooks ───────────────────────────────────────────────
 */

import type { EntityHooks, HookContext, EntityId } from '@repo/core'
import type { LabOrder } from './laboratory.schema'
import { LabService } from './laboratory.service'

export const LabHooks: EntityHooks<LabOrder> = {
  beforeCreate: async (input, ctx) => {
    const prepared = LabService.prepareForCreate(input)
    prepared.tenantId = ctx.tenantId
    prepared.createdBy = ctx.userId
    return prepared
  },
  afterCreate: async (entity, ctx) => {
    console.log(`[Lab] Order created: ${entity.id} — ${entity.tests.length} tests`)
  },
  beforeUpdate: async (id, input, ctx) => {
    if (input.results) {
      const results = input.results as any[]
      for (const r of results) {
        if (r.value != null && r.isAbnormal === undefined) {
          r.isAbnormal = false
        }
      }
      input.completedAt = Date.now()
      input.status = 'completed'
    }
    return input
  },
  afterUpdate: async (entity, ctx) => {
    const critical = LabService.getCriticalResults(entity)
    if (critical.length > 0) {
      console.log(`[Lab] ⚠️ CRITICAL results in order ${entity.id}: ${critical.map(r => r.testName).join(', ')}`)
    }
  },
  beforeDelete: async () => {},
  afterDelete: async () => {},
  beforeRead: async () => {},
  afterRead: async (entity) => entity,
}
