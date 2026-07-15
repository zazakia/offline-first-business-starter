/**
 * ─── Billing Policies ────────────────────────────────────────
 */

import type { Invoice } from './billing.schema'

export interface PolicyContext {
  userId: string; tenantId: string; roles: string[]; permissions: string[]
  resource?: Invoice; metadata?: Record<string, unknown>
}

export type PolicyAction = 'create' | 'read' | 'update' | 'delete' | 'payment' | 'refund' | 'export' | '*'

export interface Policy {
  effect: 'allow' | 'deny'; action: PolicyAction
  conditions?: (ctx: PolicyContext) => boolean; priority?: number
}

export const BillingPolicies: Policy[] = [
  { effect: 'allow', action: '*', conditions: (ctx) => ctx.roles.includes('admin') || ctx.roles.includes('superadmin'), priority: 100 },
  { effect: 'allow', action: '*', conditions: (ctx) => ctx.roles.includes('billing'), priority: 90 },
  { effect: 'allow', action: 'read', conditions: (ctx) => ctx.roles.includes('doctor'), priority: 85 },
  { effect: 'allow', action: 'read', conditions: (ctx) => ctx.roles.includes('receptionist'), priority: 80 },
  { effect: 'allow', action: 'create', conditions: (ctx) => ctx.roles.includes('receptionist'), priority: 79 },
  { effect: 'allow', action: 'payment', conditions: (ctx) => ['receptionist', 'billing'].some(r => ctx.roles.includes(r)), priority: 78 },
  { effect: 'deny', action: 'refund', conditions: (ctx) => !['admin', 'superadmin', 'billing'].some(r => ctx.roles.includes(r)), priority: 70 },
  { effect: 'deny', action: 'delete', priority: 50 },
]

export function evaluatePolicies(
  action: Policy['action'], context: PolicyContext,
  policies: Policy[] = BillingPolicies,
): { allowed: boolean; reason?: string } {
  const sorted = [...policies].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
  for (const policy of sorted) {
    if (policy.action !== '*' && policy.action !== action) continue
    const conditionsMet = policy.conditions ? policy.conditions(context) : true
    if (conditionsMet) {
      return policy.effect === 'deny' ? { allowed: false, reason: `${action} en facturación denegado` } : { allowed: true }
    }
  }
  return { allowed: false, reason: `Ninguna política permite ${action} en facturación` }
}
