/**
 * ─── Doctor Entity Definition ───────────────────────────────
 */

import { EntityRegistry } from '@repo/core'
import type { EntityDefinition } from '@repo/core'
import type { Doctor } from './doctor.schema'
import { DoctorHooks } from './doctor.hooks'

export const DoctorEntity: EntityDefinition<Doctor> = {
  name: 'doctor',

  ui: {
    label: 'Doctor',
    labelPlural: 'Doctors',
    icon: 'Stethoscope',
    routePath: 'doctors',
    color: 'green',
    showInNav: true,
    navOrder: 20,
  },

  sync: {
    enabled: true,
    conflictStrategy: 'lww',
    priority: 'normal',
  },

  audit: {
    enabled: true,
    excludeFields: ['version'],
  },

  rbac: {
    enabled: true,
    permissionPrefix: 'doctor',
  },

  hooks: DoctorHooks,

  pagination: 'cursor',

  tenant: {
    enabled: true,
    field: 'tenantId',
  },

  softDelete: {
    enabled: true,
    field: 'deletedAt',
  },
}

EntityRegistry.register(DoctorEntity)
