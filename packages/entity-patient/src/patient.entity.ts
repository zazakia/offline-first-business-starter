/**
 * ─── Patient Entity Definition ───────────────────────────────
 * Self-registers with the Entity Registry on import.
 */

import { EntityRegistry } from '@repo/core'
import type { EntityDefinition } from '@repo/core'
import type { Patient } from './patient.schema'
import { PatientHooks } from './patient.hooks'

export const PatientEntity: EntityDefinition<Patient> = {
  name: 'patient',

  ui: {
    label: 'Patient',
    labelPlural: 'Patients',
    icon: 'HeartPulse',
    routePath: 'patients',
    color: 'blue',
    showInNav: true,
    navOrder: 10,
  },

  sync: {
    enabled: true,
    conflictStrategy: 'per-field',
    priority: 'normal',
    excludeFields: ['notes'],
  },

  audit: {
    enabled: true,
    excludeFields: ['version'],
  },

  rbac: {
    enabled: true,
    permissionPrefix: 'patient',
  },

  hooks: PatientHooks,

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

EntityRegistry.register(PatientEntity)
