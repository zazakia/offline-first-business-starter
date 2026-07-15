/**
 * ─── Prescription Entity Definition ──────────────────────────
 */

import { EntityRegistry } from '@repo/core'
import type { EntityDefinition } from '@repo/core'
import type { Prescription } from './prescription.schema'
import { PrescriptionHooks } from './prescription.hooks'

export const PrescriptionEntity: EntityDefinition<Prescription> = {
  name: 'prescription',

  ui: {
    label: 'Prescription',
    labelPlural: 'Prescriptions',
    icon: 'Pill',
    routePath: 'prescriptions',
    color: 'yellow',
    showInNav: true,
    navOrder: 50,
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
    permissionPrefix: 'prescription',
  },

  hooks: PrescriptionHooks,

  pagination: 'cursor',

  tenant: { enabled: true, field: 'tenantId' },
  softDelete: { enabled: true, field: 'deletedAt' },
}

EntityRegistry.register(PrescriptionEntity)
