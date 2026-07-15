/**
 * ─── Patient Hooks ───────────────────────────────────────────
 * Lifecycle hooks for the Patient entity.
 */

import type { EntityHooks, HookContext, EntityId } from '@repo/core'
import type { Patient } from './patient.schema'
import { PatientService } from './patient.service'

export const PatientHooks: EntityHooks<Patient> = {
  beforeCreate: async (input: Record<string, unknown>, ctx: HookContext): Promise<Record<string, unknown>> => {
    const prepared = PatientService.prepareForCreate(input)
    prepared.tenantId = ctx.tenantId
    prepared.createdBy = ctx.userId

    // Validate date of birth
    if (prepared.dateOfBirth) {
      const dob = new Date(prepared.dateOfBirth as string)
      if (isNaN(dob.getTime())) {
        throw new Error('Fecha de nacimiento inválida')
      }
      if (dob > new Date()) {
        throw new Error('La fecha de nacimiento no puede ser futura')
      }
    }

    return prepared
  },

  afterCreate: async (entity: Patient, ctx: HookContext): Promise<void> => {
    // Could emit domain event for new patient registration
    console.log(`[PatientHook] Created patient ${entity.id}: ${entity.fullName}`)
  },

  beforeUpdate: async (id: EntityId, input: Record<string, unknown>, ctx: HookContext): Promise<Record<string, unknown>> => {
    if (input.fullName && typeof input.fullName === 'string') {
      input.fullName = (input.fullName as string).trim().replace(/\b\w/g, (c: string) => c.toUpperCase())
    }
    if (input.email && typeof input.email === 'string') {
      input.email = (input.email as string).toLowerCase().trim()
    }
    return input
  },

  afterUpdate: async (entity: Patient, ctx: HookContext): Promise<void> => {
    console.log(`[PatientHook] Updated patient ${entity.id}: ${entity.fullName}`)
  },

  beforeDelete: async (id: EntityId, ctx: HookContext): Promise<void> => {
    // Soft-delete only — patient records must be preserved for legal reasons
    console.log(`[PatientHook] Soft-deleting patient ${id}`)
  },

  afterDelete: async (entity: Patient, ctx: HookContext): Promise<void> => {
    console.log(`[PatientHook] Soft-deleted patient ${entity.id}`)
  },

  beforeRead: async (id: EntityId, ctx: HookContext): Promise<void> => {
    // Read is always allowed (policy-checked separately)
  },

  afterRead: async (entity: Patient | null, ctx: HookContext): Promise<Patient | null> => {
    if (!entity) return null

    // Add computed fields
    const dob = entity.dateOfBirth ? new Date(entity.dateOfBirth) : null
    if (dob && !isNaN(dob.getTime())) {
      (entity as unknown as Record<string, unknown>)._age = PatientService.calculateAge(entity.dateOfBirth)
      ;(entity as unknown as Record<string, unknown>)._ageCategory = PatientService.getAgeCategory(
        PatientService.calculateAge(entity.dateOfBirth),
      )
    }
    ;(entity as unknown as Record<string, unknown>)._criticalFlags = PatientService.hasCriticalConditions(entity)
    ;(entity as unknown as Record<string, unknown>)._displayName = PatientService.getDisplayName(entity)

    return entity
  },
}
