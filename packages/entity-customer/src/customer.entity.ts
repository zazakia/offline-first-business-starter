/**
 * ─── Customer Entity Definition ──────────────────────────────
 * Self-registers with the Entity Registry on import.
 *
 * To add this entity to an app, simply:
 *   import '@repo/entity-customer'
 */

import { EntityRegistry } from '@repo/core'
import type { EntityDefinition } from '@repo/core'
import type { Customer } from './customer.schema'
import { CustomerHooks } from './customer.hooks'
import { CustomerPolicies } from './customer.policies'

/**
 * Customer entity definition.
 * This is the contract that tells the framework everything it needs
 * to know about this entity: how to display it, sync it, secure it.
 */
export const CustomerEntity: EntityDefinition<Customer> = {
  name: 'customer',
  
  ui: {
    label: 'Customer',
    labelPlural: 'Customers',
    icon: 'Users',
    routePath: 'customers',
    color: 'blue',
    showInNav: true,
    navOrder: 10,
  },

  sync: {
    enabled: true,
    conflictStrategy: 'lww',
    priority: 'normal',
    excludeFields: ['notes'], // Notes are local-only to avoid sync conflicts
  },

  audit: {
    enabled: true,
    excludeFields: ['version'], // Version changes are noise
  },

  rbac: {
    enabled: true,
    permissionPrefix: 'customer',
  },

  hooks: CustomerHooks,

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

// ─── Self-Register ───────────────────────────────────────────
// Importing this module is enough to register the entity.
EntityRegistry.register(CustomerEntity)
