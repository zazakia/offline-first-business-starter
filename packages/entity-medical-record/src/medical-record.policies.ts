/**
 * ─── Medical Record Policies ─────────────────────────────────
 */

import type { MedicalRecord } from './medical-record.schema'

export interface PolicyContext {
  userId: string; tenantId: string; roles: string[]; permissions: string[]
  resource?: MedicalRecord; metadata?: Record<string, unknown>
}

export type PolicyAction = 'create' | 'read' | 'update' | 'delete' | 'sign' | 'share' | 'view_clinical' | '*'

export interface Policy {
  effect: 'allow' | 'deny'; action: PolicyAction
  conditions?: (ctx: PolicyContext) => boolean; priority?: number
}

export const MedicalRecordPolicies: Policy[] = [
  { effect: 'allow', action: '*', conditions: (ctx) => ctx.roles.includes('admin') || ctx.roles.includes('superadmin'), priority: 100 },
  { effect: 'allow', action: '*', conditions: (ctx) => ctx.roles.includes('doctor'), priority: 90 },
  { effect: 'allow', action: 'read', conditions: (ctx) => ctx.roles.includes('nurse'), priority: 85 },
  { effect: 'allow', action: 'create', conditions: (ctx) => ctx.roles.includes('nurse'), priority: 85 },
  { effect: 'allow', action: 'update', conditions: (ctx) => ctx.roles.includes('nurse'), priority: 85 },
  { effect: 'allow', action: 'read', conditions: (ctx) => ctx.roles.includes('pharmacist'), priority: 80 },
  { effect: 'allow', action: 'read', conditions: (ctx) => ctx.roles.includes('receptionist'), priority: 75 },
  { effect: 'deny', action: 'sign', conditions: (ctx) => !ctx.roles.includes('doctor') && !ctx.roles.includes('admin'), priority: 60 },
  { effect: 'deny', action: 'delete', priority: 50 },
  { effect: 'deny', action: 'view_clinical', conditions: (ctx) => {
    const clinical = ['doctor', 'nurse', 'admin', 'superadmin']
    return !clinical.some(r => ctx.roles.includes(r))
  }, priority: 49 },
]

export function evaluatePolicies(
  action: Policy['action'], context: PolicyContext,
  policies: Policy[] = MedicalRecordPolicies,
): { allowed: boolean; reason?: string } {
  const sorted = [...policies].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
  for (const policy of sorted) {
    if (policy.action !== '*' && policy.action !== action) continue
    const conditionsMet = policy.conditions ? policy.conditions(context) : true
    if (conditionsMet) {
      return policy.effect === 'deny' ? { allowed: false, reason: `${action} en expediente denegado` } : { allowed: true }
    }
  }
  return { allowed: false, reason: `Ninguna política permite ${action} en expediente` }
}
