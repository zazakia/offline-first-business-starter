/**
 * ─── Inventory Hooks ─────────────────────────────────────────
 */

import type { EntityHooks, HookContext, EntityId } from '@repo/core'
import type { InventoryItem } from './inventory.schema'
import { InventoryService } from './inventory.service'

export const InventoryHooks: EntityHooks<InventoryItem> = {
  beforeCreate: async (input: Record<string, unknown>, ctx: HookContext): Promise<Record<string, unknown>> => {
    const prepared = InventoryService.prepareForCreate(input)
    prepared.tenantId = ctx.tenantId
    prepared.createdBy = ctx.userId

    // Check controlled substances
    if (prepared.isControlled && !ctx.metadata?.controlledSubstanceAuthorized) {
      // Log warning but allow creation (physical inventory can be registered, dispensing is what's restricted)
    }

    return prepared
  },

  afterCreate: async (entity: InventoryItem, ctx: HookContext): Promise<void> => {
    if (entity.status === 'out_of_stock') {
      console.log(`[InventoryHook] WARNING: ${entity.name} created with zero stock`)
    }
  },

  beforeUpdate: async (id: EntityId, input: Record<string, unknown>, ctx: HookContext): Promise<Record<string, unknown>> => {
    // If quantity is being changed, validate it's via a proper transaction
    if (input.quantityOnHand != null) {
      const newQty = input.quantityOnHand as number
      if (newQty < 0) throw new Error('La cantidad no puede ser negativa')

      const minQty = (input.minimumQuantity as number) ?? ctx.metadata?.existingMinimumQuantity as number ?? 0
      if (newQty <= 0) {
        input.status = 'out_of_stock'
      } else if (newQty <= minQty) {
        input.status = 'low_stock'
      } else {
        input.status = 'in_stock'
      }
    }

    return input
  },

  afterUpdate: async (entity: InventoryItem, ctx: HookContext): Promise<void> => {
    if (entity.status === 'out_of_stock') {
      console.log(`[InventoryHook] ${entity.name} is out of stock — reorder needed`)
    }
    if (InventoryService.isNearExpiry(entity)) {
      console.log(`[InventoryHook] ${entity.name} expires at ${new Date(entity.expirationDate!).toLocaleDateString()}`)
    }
  },

  beforeDelete: async (id: EntityId, ctx: HookContext): Promise<void> => {
    console.log(`[InventoryHook] Soft-deleting inventory item ${id}`)
  },

  afterDelete: async (entity: InventoryItem, ctx: HookContext): Promise<void> => {},

  beforeRead: async (id: EntityId, ctx: HookContext): Promise<void> => {},

  afterRead: async (entity: InventoryItem | null, ctx: HookContext): Promise<InventoryItem | null> => {
    if (!entity) return null
    ;(entity as unknown as Record<string, unknown>)._isNearExpiry = InventoryService.isNearExpiry(entity)
    ;(entity as unknown as Record<string, unknown>)._isExpired = InventoryService.isExpired(entity)
    ;(entity as unknown as Record<string, unknown>)._reorderQuantity = InventoryService.getReorderQuantity(entity)
    return entity
  },
}
