/**
 * ─── Pharmacy Entity Definition — Metadata-Driven ────────────
 */

import { EntityRegistry } from '@repo/core'
import type { EntityDefinition } from '@repo/core'
import type { PharmacyOrder } from './pharmacy.schema'
import { PharmacyHooks } from './pharmacy.hooks'

export const PharmacyEntity: EntityDefinition<PharmacyOrder> = {
  name: 'pharmacy',

  ui: {
    label: 'Pharmacy',
    labelPlural: 'Pharmacy',
    icon: 'PillBottle',
    routePath: 'pharmacy',
    color: 'green',
    showInNav: true,
    navOrder: 55,
  },

  sync: { enabled: true, conflictStrategy: 'lww', priority: 'critical' },
  audit: { enabled: true, excludeFields: ['version'] },
  rbac: { enabled: true, permissionPrefix: 'pharmacy' },
  hooks: PharmacyHooks,
  pagination: 'cursor',
  tenant: { enabled: true, field: 'tenantId' },
  softDelete: { enabled: true, field: 'deletedAt' },
}

EntityRegistry.register(PharmacyEntity)
