/**
 * ─── Department Entity Definition ────────────────────────────
 */

import { EntityRegistry } from '@repo/core'
import type { EntityDefinition } from '@repo/core'
import type { Department } from './department.schema'
import { DepartmentHooks } from './department.hooks'

export const DepartmentEntity: EntityDefinition<Department> = {
  name: 'department',

  ui: {
    label: 'Department',
    labelPlural: 'Departments',
    icon: 'Building2',
    routePath: 'departments',
    color: 'purple',
    showInNav: true,
    navOrder: 80,
  },

  sync: {
    enabled: true,
    conflictStrategy: 'lww',
    priority: 'background',
  },

  audit: {
    enabled: true,
    excludeFields: ['version'],
  },

  rbac: {
    enabled: true,
    permissionPrefix: 'department',
  },

  hooks: DepartmentHooks,

  pagination: 'offset',

  tenant: { enabled: true, field: 'tenantId' },
  softDelete: { enabled: true, field: 'deletedAt' },
}

EntityRegistry.register(DepartmentEntity)
