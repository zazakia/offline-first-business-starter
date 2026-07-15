/**
 * ─── Billing Entity Definition ───────────────────────────────
 */

import { EntityRegistry } from '@repo/core'
import type { EntityDefinition } from '@repo/core'
import type { Invoice } from './billing.schema'
import { BillingHooks } from './billing.hooks'

export const BillingEntity: EntityDefinition<Invoice> = {
  name: 'billing',

  ui: {
    label: 'Invoice',
    labelPlural: 'Billing',
    icon: 'Receipt',
    routePath: 'billing',
    color: 'yellow',
    showInNav: true,
    navOrder: 60,
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
    permissionPrefix: 'billing',
  },

  hooks: BillingHooks,

  pagination: 'cursor',

  tenant: { enabled: true, field: 'tenantId' },
  softDelete: { enabled: false }, // Invoices cannot be deleted, only cancelled
}

EntityRegistry.register(BillingEntity)
