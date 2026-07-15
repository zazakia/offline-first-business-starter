/**
 * ─── Appointment Entity Definition ───────────────────────────
 */

import { EntityRegistry } from '@repo/core'
import type { EntityDefinition } from '@repo/core'
import type { Appointment } from './appointment.schema'
import { AppointmentHooks } from './appointment.hooks'

export const AppointmentEntity: EntityDefinition<Appointment> = {
  name: 'appointment',

  ui: {
    label: 'Appointment',
    labelPlural: 'Appointments',
    icon: 'Calendar',
    routePath: 'appointments',
    color: 'purple',
    showInNav: true,
    navOrder: 30,
  },

  sync: {
    enabled: true,
    conflictStrategy: 'lww',
    priority: 'critical',
  },

  audit: {
    enabled: true,
    excludeFields: ['version'],
  },

  rbac: {
    enabled: true,
    permissionPrefix: 'appointment',
  },

  hooks: AppointmentHooks,

  pagination: 'cursor',

  tenant: { enabled: true, field: 'tenantId' },
  softDelete: { enabled: true, field: 'deletedAt' },
}

EntityRegistry.register(AppointmentEntity)
