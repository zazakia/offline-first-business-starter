/**
 * ─── Doctor Hooks ────────────────────────────────────────────
 */

import type { EntityHooks, HookContext, EntityId } from '@repo/core'
import type { Doctor } from './doctor.schema'
import { DoctorService } from './doctor.service'

export const DoctorHooks: EntityHooks<Doctor> = {
  beforeCreate: async (input: Record<string, unknown>, ctx: HookContext): Promise<Record<string, unknown>> => {
    const prepared = DoctorService.prepareForCreate(input)
    prepared.tenantId = ctx.tenantId
    prepared.createdBy = ctx.userId
    prepared.totalConsultations = 0
    return prepared
  },

  afterCreate: async (entity: Doctor, ctx: HookContext): Promise<void> => {
    console.log(`[DoctorHook] Created doctor ${entity.id}: ${entity.fullName}`)
  },

  beforeUpdate: async (id: EntityId, input: Record<string, unknown>, ctx: HookContext): Promise<Record<string, unknown>> => {
    if (input.fullName && typeof input.fullName === 'string') {
      input.fullName = (input.fullName as string).trim()
    }
    if (input.licenseNumber && typeof input.licenseNumber === 'string') {
      input.licenseNumber = (input.licenseNumber as string).toUpperCase().trim()
    }
    return input
  },

  afterUpdate: async (entity: Doctor, ctx: HookContext): Promise<void> => {
    console.log(`[DoctorHook] Updated doctor ${entity.id}`)
  },

  beforeDelete: async (id: EntityId, ctx: HookContext): Promise<void> => {
    console.log(`[DoctorHook] Soft-deleting doctor ${id}`)
  },

  afterDelete: async (entity: Doctor, ctx: HookContext): Promise<void> => {
    console.log(`[DoctorHook] Soft-deleted doctor ${entity.id}`)
  },

  beforeRead: async (id: EntityId, ctx: HookContext): Promise<void> => {
    // No-op
  },

  afterRead: async (entity: Doctor | null, ctx: HookContext): Promise<Doctor | null> => {
    if (!entity) return null;
    (entity as unknown as Record<string, unknown>)._professionalName = DoctorService.getProfessionalName(entity)
    return entity
  },
}
