/**
 * ─── Billing Hooks ───────────────────────────────────────────
 */

import type { EntityHooks, HookContext, EntityId } from '@repo/core'
import type { Invoice } from './billing.schema'
import { BillingService } from './billing.service'

export const BillingHooks: EntityHooks<Invoice> = {
  beforeCreate: async (input: Record<string, unknown>, ctx: HookContext): Promise<Record<string, unknown>> => {
    const prepared = BillingService.prepareForCreate(input)
    prepared.tenantId = ctx.tenantId
    prepared.createdBy = ctx.userId

    if (typeof prepared.totalAmount === 'number' && prepared.totalAmount <= 0) {
      throw new Error('El total de la factura debe ser mayor a cero')
    }

    return prepared
  },

  afterCreate: async (entity: Invoice, ctx: HookContext): Promise<void> => {
    console.log(`[BillingHook] Created invoice ${entity.invoiceNumber} for patient ${entity.patientId}: $${entity.totalAmount}`)
  },

  beforeUpdate: async (id: EntityId, input: Record<string, unknown>, ctx: HookContext): Promise<Record<string, unknown>> => {
    // Prevent modifying a paid/cancelled/refunded invoice
    const existingStatus = ctx.metadata?.existingStatus as string
    if (existingStatus && ['paid', 'cancelled', 'refunded'].includes(existingStatus)) {
      throw new Error(`No se puede modificar una factura con estado "${existingStatus}"`)
    }

    if (input.items) {
      const result = BillingService.prepareForCreate({
        items: input.items,
      }) as Record<string, unknown>
      Object.assign(input, result)
    }

    return input
  },

  afterUpdate: async (entity: Invoice, ctx: HookContext): Promise<void> => {
    if (entity.status === 'paid') {
      console.log(`[BillingHook] Invoice ${entity.invoiceNumber} fully paid`)
    }
  },

  beforeDelete: async (id: EntityId, ctx: HookContext): Promise<void> => {
    throw new Error('Las facturas no pueden ser eliminadas. Use cancelación.')
  },

  afterDelete: async (entity: Invoice, ctx: HookContext): Promise<void> => {},

  beforeRead: async (id: EntityId, ctx: HookContext): Promise<void> => {},

  afterRead: async (entity: Invoice | null, ctx: HookContext): Promise<Invoice | null> => {
    if (!entity) return null
    ;(entity as unknown as Record<string, unknown>)._daysPastDue = BillingService.getDaysPastDue(entity)
    ;(entity as unknown as Record<string, unknown>)._agingCategory = BillingService.getAgingCategory(
      BillingService.getDaysPastDue(entity),
    )
    return entity
  },
}
