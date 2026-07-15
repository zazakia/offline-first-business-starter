/**
 * ─── Pharmacy Hooks ──────────────────────────────────────────
 */

import type { EntityHooks, HookContext, EntityId } from '@repo/core'
import type { PharmacyOrder } from './pharmacy.schema'
import { PharmacyService } from './pharmacy.service'

export const PharmacyHooks: EntityHooks<PharmacyOrder> = {
  beforeCreate: async (input, ctx) => {
    const prepared = PharmacyService.prepareForCreate(input)
    prepared.tenantId = ctx.tenantId
    prepared.createdBy = ctx.userId
    return prepared
  },
  afterCreate: async (entity, ctx) => {
    console.log(`[Pharmacy] Order created: ${entity.id}`)
  },
  beforeUpdate: async (id, input, ctx) => {
    if (input.status) {
      const existing = ctx.metadata?.existingStatus as string
      if (existing && !PharmacyService.canTransition(existing, input.status as string)) {
        throw new Error(`Cannot transition from "${existing}" to "${input.status}"`)
      }
    }
    return input
  },
  afterUpdate: async (entity, ctx) => {
    if (entity.status === 'dispensed') {
      console.log(`[Pharmacy] Order ${entity.id} dispensed`)
    }
  },
  beforeDelete: async () => {},
  afterDelete: async () => {},
  beforeRead: async () => {},
  afterRead: async (entity) => entity,
}
