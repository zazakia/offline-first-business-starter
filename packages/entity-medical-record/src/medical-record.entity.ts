/**
 * ─── Medical Record Entity Definition ────────────────────────
 */

import { EntityRegistry } from '@repo/core'
import type { EntityDefinition } from '@repo/core'
import type { MedicalRecord } from './medical-record.schema'
import { MedicalRecordHooks } from './medical-record.hooks'

export const MedicalRecordEntity: EntityDefinition<MedicalRecord> = {
  name: 'medicalRecord',

  ui: {
    label: 'Medical Record',
    labelPlural: 'Medical Records',
    icon: 'FileText',
    routePath: 'medical-records',
    color: 'red',
    showInNav: true,
    navOrder: 40,
  },

  sync: {
    enabled: true,
    conflictStrategy: 'per-field',
    priority: 'critical',
  },

  audit: {
    enabled: true,
    excludeFields: ['version'],
  },

  rbac: {
    enabled: true,
    permissionPrefix: 'medicalRecord',
  },

  hooks: MedicalRecordHooks,

  pagination: 'cursor',

  tenant: { enabled: true, field: 'tenantId' },
  softDelete: { enabled: true, field: 'deletedAt' },
}

EntityRegistry.register(MedicalRecordEntity)
