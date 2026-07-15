/**
 * ─── Department Policies ─────────────────────────────────────
 */

import type { Department } from './department.schema'

export interface PolicyContext {
  userId: string; tenantId: string; roles: string[]; permissions: string[]
  resource?: Department; metadata?: Record<string, unknown>
}

export type PolicyAction = 'create' | 'read' | 'update' | 'delete' | '*'

export interface Policy {
  effect: 'allow' | 'deny'; action: PolicyAction
  conditions?: (ctx: PolicyContext) => boolean; priority?: number
}

export const DepartmentPolicies: Policy[] = [
  { effect: 'allow', action: '*', conditions: (ctx) => ctx.roles.includes('admin') || ctx.roles.includes('superadmin'), priority: 100 },
  { effect: 'allow', action: 'read', conditions: (ctx) => ['doctor', 'nurse', 'receptionist', 'billing', 'pharmacist'].some(r => ctx.roles.includes(r)), priority: 90 },
  { effect: 'deny', action: 'delete', priority: 50 },
  { effect: 'deny', action: 'update', conditions: (ctx) => !['admin', 'superadmin'].some(r => ctx.roles.includes(r)), priority: 49 },
]

export function evaluatePolicies(
  action: Policy['action'], context: PolicyContext,
  policies: Policy[] = DepartmentPolicies,
): { allowed: boolean; reason?: string } {
  const sorted = [...policies].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
  for (const policy of sorted) {
    if (policy.action !== '*' && policy.action !== action) continue
    const conditionsMet = policy.conditions ? policy.conditions(context) : true
    if (conditionsMet) {
      return policy.effect === 'deny' ? { allowed: false, reason: `${action} en departamento denegado` } : { allowed: true }
    }
  }
  return { allowed: false, reason: `Ninguna política permite ${action} en departamento` }
}
