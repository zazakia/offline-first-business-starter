/**
 * ─── Customer RBAC Policies ──────────────────────────────────
 * Permission rules for Customer operations.
 * Supports role-based and attribute-based conditions.
 */

import type { Customer } from './customer.schema'

export interface PolicyContext {
  userId: string
  tenantId: string
  roles: string[]
  permissions: string[]
  resource?: Customer
  metadata?: Record<string, unknown>
}

export type PolicyAction = 'create' | 'read' | 'update' | 'delete' | 'export' | 'bulk_import' | '*'

export interface Policy {
  effect: 'allow' | 'deny'
  action: PolicyAction
  conditions?: (ctx: PolicyContext) => boolean
  priority?: number // Higher = evaluated first
}

/**
 * Customer-specific policies.
 * These are evaluated AFTER global RBAC checks.
 */
export const CustomerPolicies: Policy[] = [
  // Admins can do everything
  {
    effect: 'allow',
    action: '*',
    conditions: (ctx) => ctx.roles.includes('admin'),
    priority: 100,
  },

  // Managers can create, read, update, export (but not delete)
  {
    effect: 'allow',
    action: 'read',
    conditions: (ctx) => ctx.roles.includes('manager'),
    priority: 90,
  },
  {
    effect: 'allow',
    action: 'create',
    conditions: (ctx) => ctx.roles.includes('manager'),
    priority: 90,
  },
  {
    effect: 'allow',
    action: 'update',
    conditions: (ctx) => ctx.roles.includes('manager'),
    priority: 90,
  },
  {
    effect: 'allow',
    action: 'export',
    conditions: (ctx) => ctx.roles.includes('manager'),
    priority: 90,
  },

  // Sales reps can read and update customers they own
  {
    effect: 'allow',
    action: 'read',
    conditions: (ctx) => ctx.roles.includes('sales_rep'),
    priority: 80,
  },
  {
    effect: 'allow',
    action: 'update',
    conditions: (ctx) =>
      ctx.roles.includes('sales_rep') &&
      ctx.resource?.createdBy === ctx.userId,
    priority: 80,
  },

  // Support agents can read all, update status only
  {
    effect: 'allow',
    action: 'read',
    conditions: (ctx) => ctx.roles.includes('support'),
    priority: 70,
  },

  // Deny delete for everyone except admins (already handled above)
  {
    effect: 'deny',
    action: 'delete',
    priority: 50,
  },

  // Deny bulk import for everyone except managers and admins
  {
    effect: 'deny',
    action: 'bulk_import',
    priority: 50,
  },
]

/**
 * Evaluate policies for a given action and context.
 */
export function evaluatePolicies(
  action: Policy['action'],
  context: PolicyContext,
  policies: Policy[] = CustomerPolicies,
): { allowed: boolean; reason?: string } {
  // Sort by priority (highest first)
  const sorted = [...policies].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))

  for (const policy of sorted) {
    // Skip policies that don't apply to this action
    if (policy.action !== '*' && policy.action !== action) continue

    // Check conditions
    const conditionsMet = policy.conditions ? policy.conditions(context) : true

    if (conditionsMet) {
      if (policy.effect === 'deny') {
        return { allowed: false, reason: `${action} on customer is denied` }
      }
      return { allowed: true }
    }
  }

  // Default deny
  return { allowed: false, reason: `No policy allows ${action} on customer` }
}
