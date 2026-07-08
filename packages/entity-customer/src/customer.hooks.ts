/**
 * ─── Customer Hooks ──────────────────────────────────────────
 * Lifecycle hooks for the Customer entity.
 * These run automatically during CRUD operations.
 */

import type { EntityHooks, HookContext, EntityId } from '@repo/core'
import type { Customer } from './customer.schema'
import { CustomerService } from './customer.service'

/**
 * Customer entity lifecycle hooks.
 * Demonstrates the hook pattern: before/after every CRUD operation.
 */
export const CustomerHooks: EntityHooks<Customer> = {
  /**
   * Runs BEFORE creating a customer.
   * Can modify input or throw to abort.
   */
  beforeCreate: async (input: Record<string, unknown>, ctx: HookContext): Promise<Record<string, unknown>> => {
    // 1. Apply business logic transformations
    const prepared = CustomerService.prepareForCreate(input)

    // 2. Validate email business rules
    if (prepared.email) {
      const emailCheck = CustomerService.validateEmail(prepared.email as string)
      if (!emailCheck.valid) {
        throw new Error(`Email validation failed: ${emailCheck.reason}`)
      }
      prepared.email = emailCheck.normalizedEmail
    }

    // 3. Enforce tenant isolation
    prepared.tenantId = ctx.tenantId
    prepared.createdBy = ctx.userId

    return prepared
  },

  /**
   * Runs AFTER creating a customer.
   * Used for side effects like notifications, analytics, etc.
   */
  afterCreate: async (entity: Customer, ctx: HookContext): Promise<void> => {
    // Example: could emit domain event, send notification, etc.
    // eventBus.emit('entity.created', { entityType: 'customer', ... })
    console.log(`[CustomerHook] Created customer ${entity.id} by ${ctx.userId}`)
  },

  /**
   * Runs BEFORE updating a customer.
   */
  beforeUpdate: async (id: EntityId, input: Record<string, unknown>, ctx: HookContext): Promise<Record<string, unknown>> => {
    // Normalize email if being updated
    if (input.email && typeof input.email === 'string') {
      const emailCheck = CustomerService.validateEmail(input.email as string)
      if (!emailCheck.valid) {
        throw new Error(`Email validation failed: ${emailCheck.reason}`)
      }
      input.email = emailCheck.normalizedEmail
    }

    return input
  },

  /**
   * Runs AFTER updating a customer.
   */
  afterUpdate: async (entity: Customer, ctx: HookContext): Promise<void> => {
    console.log(`[CustomerHook] Updated customer ${entity.id} by ${ctx.userId}`)
  },

  /**
   * Runs BEFORE deleting a customer.
   * Throw to prevent deletion.
   */
  beforeDelete: async (id: EntityId, ctx: HookContext): Promise<void> => {
    console.log(`[CustomerHook] Deleting customer ${id} by ${ctx.userId}`)
  },

  /**
   * Runs AFTER deleting (soft-delete) a customer.
   */
  afterDelete: async (entity: Customer, ctx: HookContext): Promise<void> => {
    console.log(`[CustomerHook] Deleted customer ${entity.id} by ${ctx.userId}`)
  },

  /**
   * Runs BEFORE reading a customer.
   */
  beforeRead: async (id: EntityId, ctx: HookContext): Promise<void> => {
    // Could check permissions here
  },

  /**
   * Runs AFTER reading a customer.
   * Can modify the returned data (e.g., add computed fields).
   */
  afterRead: async (entity: Customer | null, ctx: HookContext): Promise<Customer | null> => {
    if (!entity) return null

    // Add computed fields that aren't stored in DB
    return {
      ...entity,
      // `lifetimeValueSegment` is computed, not stored
      ...(entity.lifetimeValue != null && {
        _ltvSegment: CustomerService.getLTVSegment(entity.lifetimeValue),
      }),
    } as Customer
  },
}
