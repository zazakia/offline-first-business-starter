/**
 * ─── Appointment Hooks ───────────────────────────────────────
 */

import type { EntityHooks, HookContext, EntityId } from '@repo/core'
import type { Appointment, AppointmentStatus } from './appointment.schema'
import { AppointmentService } from './appointment.service'

export const AppointmentHooks: EntityHooks<Appointment> = {
  beforeCreate: async (input: Record<string, unknown>, ctx: HookContext): Promise<Record<string, unknown>> => {
    const prepared = AppointmentService.prepareForCreate(input)
    prepared.tenantId = ctx.tenantId
    prepared.createdBy = ctx.userId

    // Prevent scheduling in the past
    if (typeof prepared.scheduledStart === 'number' && prepared.scheduledStart < Date.now() - 60000) {
      throw new Error('No se pueden agendar citas en el pasado')
    }

    return prepared
  },

  afterCreate: async (entity: Appointment, ctx: HookContext): Promise<void> => {
    console.log(`[AppointmentHook] Created appointment ${entity.id} for patient ${entity.patientId}`)
  },

  beforeUpdate: async (id: EntityId, input: Record<string, unknown>, ctx: HookContext): Promise<Record<string, unknown>> => {
    // Validate status transitions
    if (input.status) {
      // The repository layer will provide the existing entity for validation
      const existingStatus = (ctx.metadata?.existingStatus as AppointmentStatus)
      if (existingStatus && !AppointmentService.canTransition(existingStatus, input.status as AppointmentStatus)) {
        throw new Error(AppointmentService.getTransitionError(existingStatus, input.status as AppointmentStatus))
      }
    }

    if (input.reason && typeof input.reason === 'string') {
      input.reason = (input.reason as string).trim()
    }

    return input
  },

  afterUpdate: async (entity: Appointment, ctx: HookContext): Promise<void> => {
    if (entity.status === 'completed') {
      console.log(`[AppointmentHook] Appointment ${entity.id} completed`)
    }
    if (entity.status === 'cancelled') {
      console.log(`[AppointmentHook] Appointment ${entity.id} cancelled: ${entity.cancellationReason ?? 'No reason given'}`)
    }
  },

  beforeDelete: async (id: EntityId, ctx: HookContext): Promise<void> => {
    console.log(`[AppointmentHook] Deleting appointment ${id}`)
  },

  afterDelete: async (entity: Appointment, ctx: HookContext): Promise<void> => {
    console.log(`[AppointmentHook] Deleted appointment ${entity.id}`)
  },

  beforeRead: async (id: EntityId, ctx: HookContext): Promise<void> => {},

  afterRead: async (entity: Appointment | null, ctx: HookContext): Promise<Appointment | null> => {
    if (!entity) return null
    const now = Date.now()
    ;(entity as unknown as Record<string, unknown>)._isPast = entity.scheduledEnd < now
    ;(entity as unknown as Record<string, unknown>)._isUpcoming = AppointmentService.isUpcoming(entity)
    return entity
  },
}
