/**
 * ─── Department Hooks ────────────────────────────────────────
 */

import type { EntityHooks, HookContext, EntityId } from '@repo/core'
import type { Department } from './department.schema'
import { DepartmentService } from './department.service'

export const DepartmentHooks: EntityHooks<Department> = {
  beforeCreate: async (input: Record<string, unknown>, ctx: HookContext): Promise<Record<string, unknown>> => {
    const prepared = DepartmentService.prepareForCreate(input)
    prepared.tenantId = ctx.tenantId
    prepared.createdBy = ctx.userId
    return prepared
  },

  afterCreate: async (entity: Department, ctx: HookContext): Promise<void> => {
    console.log(`[DepartmentHook] Created department ${entity.code}: ${entity.name}`)
  },

  beforeUpdate: async (id: EntityId, input: Record<string, unknown>, ctx: HookContext): Promise<Record<string, unknown>> => {
    if (input.code && typeof input.code === 'string') {
      input.code = (input.code as string).toUpperCase().trim()
    }
    return input
  },

  afterUpdate: async (entity: Department, ctx: HookContext): Promise<void> => {
    if (!entity.isActive) {
      console.log(`[DepartmentHook] Department ${entity.code} deactivated`)
    }
  },

  beforeDelete: async (id: EntityId, ctx: HookContext): Promise<void> => {
    console.log(`[DepartmentHook] Soft-deleting department ${id}`)
  },

  afterDelete: async (entity: Department, ctx: HookContext): Promise<void> => {},

  beforeRead: async (id: EntityId, ctx: HookContext): Promise<void> => {},

  afterRead: async (entity: Department | null, ctx: HookContext): Promise<Department | null> => {
    if (!entity) return null
    ;(entity as unknown as Record<string, unknown>)._isOpen = DepartmentService.isCurrentlyOpen(entity)
    return entity
  },
}
