/**
 * ─── Prescription Policies ───────────────────────────────────
 */

import type { Prescription } from './prescription.schema'

export interface PolicyContext {
  userId: string; tenantId: string; roles: string[]; permissions: string[]
  resource?: Prescription; metadata?: Record<string, unknown>
}

export type PolicyAction = 'create' | 'read' | 'update' | 'delete' | 'dispense' | 'discontinue' | 'print' | '*'

export interface Policy {
  effect: 'allow' | 'deny'; action: PolicyAction
  conditions?: (ctx: PolicyContext) => boolean; priority?: number
}

export const PrescriptionPolicies: Policy[] = [
  { effect: 'allow', action: '*', conditions: (ctx) => ctx.roles.includes('admin') || ctx.roles.includes('superadmin'), priority: 100 },
  { effect: 'allow', action: '*', conditions: (ctx) => ctx.roles.includes('doctor'), priority: 90 },
  { effect: 'allow', action: 'read', conditions: (ctx) => ctx.roles.includes('nurse'), priority: 85 },
  { effect: 'allow', action: 'read', conditions: (ctx) => ctx.roles.includes('pharmacist'), priority: 84 },
  { effect: 'allow', action: 'dispense', conditions: (ctx) => ctx.roles.includes('pharmacist'), priority: 84 },
  { effect: 'allow', action: 'print', conditions: (ctx) => ['doctor', 'nurse', 'pharmacist'].some(r => ctx.roles.includes(r)), priority: 83 },
  { effect: 'allow', action: 'discontinue', conditions: (ctx) => ctx.roles.includes('doctor'), priority: 82 },
  { effect: 'deny', action: 'delete', priority: 50 },
  { effect: 'deny', action: 'create', conditions: (ctx) => !['doctor', 'admin', 'superadmin'].some(r => ctx.roles.includes(r)), priority: 49 },
]

export function evaluatePolicies(
  action: Policy['action'], context: PolicyContext,
  policies: Policy[] = PrescriptionPolicies,
): { allowed: boolean; reason?: string } {
  const sorted = [...policies].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
  for (const policy of sorted) {
    if (policy.action !== '*' && policy.action !== action) continue
    const conditionsMet = policy.conditions ? policy.conditions(context) : true
    if (conditionsMet) {
      return policy.effect === 'deny' ? { allowed: false, reason: `${action} en receta denegado` } : { allowed: true }
    }
  }
  return { allowed: false, reason: `Ninguna política permite ${action} en receta` }
}
