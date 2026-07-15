/**
 * ─── Prescription Hooks ──────────────────────────────────────
 */

import type { EntityHooks, HookContext, EntityId } from '@repo/core'
import type { Prescription } from './prescription.schema'
import { PrescriptionService } from './prescription.service'

export const PrescriptionHooks: EntityHooks<Prescription> = {
  beforeCreate: async (input: Record<string, unknown>, ctx: HookContext): Promise<Record<string, unknown>> => {
    const prepared = PrescriptionService.prepareForCreate(input)
    prepared.tenantId = ctx.tenantId
    prepared.createdBy = ctx.userId

    // Check controlled substances
    const medications = prepared.medications as Prescription['medications'] | undefined
    if (medications) {
      for (const med of medications) {
        if (PrescriptionService.requiresSpecialForm(med)) {
          if (!ctx.metadata?.controlledSubstanceAuthorized) {
            throw new Error(`El medicamento "${med.name}" requiere receta especial para controlados`)
          }
        }
      }
    }

    return prepared
  },

  afterCreate: async (entity: Prescription, ctx: HookContext): Promise<void> => {
    const medNames = entity.medications.map(m => m.name).join(', ')
    console.log(`[PrescriptionHook] Created prescription ${entity.id}: ${medNames}`)
  },

  beforeUpdate: async (id: EntityId, input: Record<string, unknown>, ctx: HookContext): Promise<Record<string, unknown>> => {
    // If discontinuing, reason is required
    if (input.status === 'discontinued' && !input.discontinuationReason) {
      throw new Error('Se requiere motivo de descontinuación')
    }

    return input
  },

  afterUpdate: async (entity: Prescription, ctx: HookContext): Promise<void> => {
    if (entity.status === 'discontinued') {
      console.log(`[PrescriptionHook] Discontinued prescription ${entity.id}: ${entity.discontinuationReason}`)
    }
    if (entity.status === 'dispensed') {
      console.log(`[PrescriptionHook] Prescription ${entity.id} dispensed by ${entity.dispensedBy}`)
    }
  },

  beforeDelete: async (id: EntityId, ctx: HookContext): Promise<void> => {
    console.log(`[PrescriptionHook] Soft-deleting prescription ${id}`)
  },

  afterDelete: async (entity: Prescription, ctx: HookContext): Promise<void> => {
    console.log(`[PrescriptionHook] Soft-deleted prescription ${entity.id}`)
  },

  beforeRead: async (id: EntityId, ctx: HookContext): Promise<void> => {},

  afterRead: async (entity: Prescription | null, ctx: HookContext): Promise<Prescription | null> => {
    if (!entity) return null
    ;(entity as unknown as Record<string, unknown>)._isExpired = PrescriptionService.isExpired(entity)
    ;(entity as unknown as Record<string, unknown>)._interactions = PrescriptionService.checkInteractions(entity.medications)
    ;(entity as unknown as Record<string, unknown>)._remainingRefills = PrescriptionService.getRemainingRefills(entity)
    return entity
  },
}
