/**
 * ─── Medical Record Hooks ────────────────────────────────────
 */

import type { EntityHooks, HookContext, EntityId } from '@repo/core'
import type { MedicalRecord } from './medical-record.schema'
import { MedicalRecordService } from './medical-record.service'

export const MedicalRecordHooks: EntityHooks<MedicalRecord> = {
  beforeCreate: async (input: Record<string, unknown>, ctx: HookContext): Promise<Record<string, unknown>> => {
    const prepared = MedicalRecordService.prepareForCreate(input)
    prepared.tenantId = ctx.tenantId
    prepared.createdBy = ctx.userId
    prepared.sharedWithPatient = false
    prepared.status = 'draft'

    // Auto-calculate BMI if weight and height are provided
    const vitals = prepared.vitalSigns as Record<string, unknown> | undefined
    if (vitals?.weight && vitals?.height) {
      vitals.bmi = MedicalRecordService.calculateBMI(vitals.weight as number, vitals.height as number)
    }

    return prepared
  },

  afterCreate: async (entity: MedicalRecord, ctx: HookContext): Promise<void> => {
    const summary = MedicalRecordService.getSummary(entity)
    console.log(`[MedicalRecordHook] Created record ${entity.id}: ${summary}`)
  },

  beforeUpdate: async (id: EntityId, input: Record<string, unknown>, ctx: HookContext): Promise<Record<string, unknown>> => {
    // Prevent editing a finalized record without amending
    if (ctx.metadata?.existingStatus === 'final' && !input.status) {
      throw new Error('Los expedientes finalizados requieren estado "enmendado" para editarse')
    }

    // Auto-recalculate BMI
    const vitals = input.vitalSigns as Record<string, unknown> | undefined
    if (vitals?.weight && vitals?.height) {
      vitals.bmi = MedicalRecordService.calculateBMI(vitals.weight as number, vitals.height as number)
    }

    return input
  },

  afterUpdate: async (entity: MedicalRecord, ctx: HookContext): Promise<void> => {
    if (entity.status === 'final') {
      console.log(`[MedicalRecordHook] Record ${entity.id} finalized`)
    }
  },

  beforeDelete: async (id: EntityId, ctx: HookContext): Promise<void> => {
    // Medical records should NEVER be hard-deleted for legal reasons
    // Only soft-delete with audit
    console.log(`[MedicalRecordHook] Soft-deleting record ${id}`)
  },

  afterDelete: async (entity: MedicalRecord, ctx: HookContext): Promise<void> => {
    console.log(`[MedicalRecordHook] Soft-deleted record ${entity.id}`)
  },

  beforeRead: async (id: EntityId, ctx: HookContext): Promise<void> => {},

  afterRead: async (entity: MedicalRecord | null, ctx: HookContext): Promise<MedicalRecord | null> => {
    if (!entity) return null
    ;(entity as unknown as Record<string, unknown>)._summary = MedicalRecordService.getSummary(entity)
    ;(entity as unknown as Record<string, unknown>)._abnormalVitals = MedicalRecordService.checkAbnormalVitals(entity.vitalSigns)
    if (entity.vitalSigns?.bmi) {
      ;(entity as unknown as Record<string, unknown>)._bmiInterpretation = MedicalRecordService.interpretBMI(entity.vitalSigns.bmi)
    }
    return entity
  },
}
