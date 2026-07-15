/**
 * ─── Lab Entity Definition — Metadata-Driven ─────────────────
 */

import { EntityRegistry } from '@repo/core'
import type { EntityDefinition } from '@repo/core'
import type { LabOrder } from './laboratory.schema'
import { LabHooks } from './laboratory.hooks'

export const LabEntity: EntityDefinition<LabOrder> = {
  name: 'laboratory',

  ui: {
    label: 'Laboratory',
    labelPlural: 'Laboratory',
    icon: 'Microscope',
    routePath: 'laboratory',
    color: 'blue',
    showInNav: true,
    navOrder: 45,
  },

  sync: { enabled: true, conflictStrategy: 'per-field', priority: 'critical' },
  audit: { enabled: true, excludeFields: ['version'] },
  rbac: { enabled: true, permissionPrefix: 'lab' },
  hooks: LabHooks,
  pagination: 'cursor',
  tenant: { enabled: true, field: 'tenantId' },
  softDelete: { enabled: true, field: 'deletedAt' },
}

EntityRegistry.register(LabEntity)
