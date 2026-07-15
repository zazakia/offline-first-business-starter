/**
 * ─── Pharmacy Policies — Metadata-Driven RBAC ────────────────
 */

import type { PharmacyOrder } from './pharmacy.schema'

export interface PolicyContext {
  userId: string; tenantId: string; roles: string[]; permissions: string[]
  resource?: PharmacyOrder; metadata?: Record<string, unknown>
}
export type PolicyAction = 'create' | 'read' | 'update' | 'delete' | 'dispense' | 'verify' | '*'
export interface Policy { effect: 'allow' | 'deny'; action: PolicyAction; conditions?: (ctx: PolicyContext) => boolean; priority?: number }

export const PharmacyPolicies: Policy[] = [
  { effect: 'allow', action: '*', conditions: (ctx) => ctx.roles.includes('admin') || ctx.roles.includes('superadmin'), priority: 100 },
  { effect: 'allow', action: '*', conditions: (ctx) => ctx.roles.includes('pharmacist'), priority: 90 },
  { effect: 'allow', action: 'read', conditions: (ctx) => ctx.roles.includes('doctor'), priority: 85 },
  { effect: 'allow', action: 'read', conditions: (ctx) => ctx.roles.includes('nurse'), priority: 80 },
  { effect: 'allow', action: 'dispense', conditions: (ctx) => ctx.roles.includes('pharmacist'), priority: 79 },
  { effect: 'allow', action: 'verify', conditions: (ctx) => ['pharmacist', 'admin'].some(r => ctx.roles.includes(r)), priority: 78 },
  { effect: 'deny', action: 'delete', priority: 50 },
]

export function evaluatePolicies(action: Policy['action'], context: PolicyContext, policies = PharmacyPolicies) {
  const sorted = [...policies].sort((a,b) => (b.priority??0)-(a.priority??0))
  for (const p of sorted) {
    if (p.action !== '*' && p.action !== action) continue
    if (p.conditions ? p.conditions(context) : true) return p.effect === 'deny' ? { allowed: false, reason: `${action} denied` } : { allowed: true }
  }
  return { allowed: false, reason: `No policy allows ${action}` }
}
