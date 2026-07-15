/**
 * ─── Inventory Entity Definition ─────────────────────────────
 */

import { EntityRegistry } from '@repo/core'
import type { EntityDefinition } from '@repo/core'
import type { InventoryItem } from './inventory.schema'
import { InventoryHooks } from './inventory.hooks'

export const InventoryEntity: EntityDefinition<InventoryItem> = {
  name: 'inventory',

  ui: {
    label: 'Inventory',
    labelPlural: 'Inventory',
    icon: 'Package',
    routePath: 'inventory',
    color: 'green',
    showInNav: true,
    navOrder: 70,
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
    permissionPrefix: 'inventory',
  },

  hooks: InventoryHooks,

  pagination: 'offset',

  tenant: { enabled: true, field: 'tenantId' },
  softDelete: { enabled: true, field: 'deletedAt' },
}

EntityRegistry.register(InventoryEntity)
