/**
 * ─── Inventory Policies ──────────────────────────────────────
 */

import type { InventoryItem } from './inventory.schema'

export interface PolicyContext {
  userId: string; tenantId: string; roles: string[]; permissions: string[]
  resource?: InventoryItem; metadata?: Record<string, unknown>
}

export type PolicyAction = 'create' | 'read' | 'update' | 'delete' | 'dispense' | 'receive' | 'adjust' | '*'

export interface Policy {
  effect: 'allow' | 'deny'; action: PolicyAction
  conditions?: (ctx: PolicyContext) => boolean; priority?: number
}

export const InventoryPolicies: Policy[] = [
  { effect: 'allow', action: '*', conditions: (ctx) => ctx.roles.includes('admin') || ctx.roles.includes('superadmin'), priority: 100 },
  { effect: 'allow', action: '*', conditions: (ctx) => ctx.roles.includes('nurse'), priority: 85 },
  { effect: 'allow', action: 'read', conditions: (ctx) => ctx.roles.includes('doctor'), priority: 80 },
  { effect: 'allow', action: 'read', conditions: (ctx) => ctx.roles.includes('pharmacist'), priority: 80 },
  { effect: 'allow', action: 'dispense', conditions: (ctx) => ['pharmacist', 'nurse'].some(r => ctx.roles.includes(r)), priority: 79 },
  { effect: 'allow', action: 'receive', conditions: (ctx) => ['pharmacist', 'nurse'].some(r => ctx.roles.includes(r)), priority: 78 },
  { effect: 'deny', action: 'delete', priority: 50 },
]

export function evaluatePolicies(
  action: Policy['action'], context: PolicyContext,
  policies: Policy[] = InventoryPolicies,
): { allowed: boolean; reason?: string } {
  const sorted = [...policies].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
  for (const policy of sorted) {
    if (policy.action !== '*' && policy.action !== action) continue
    const conditionsMet = policy.conditions ? policy.conditions(context) : true
    if (conditionsMet) {
      return policy.effect === 'deny' ? { allowed: false, reason: `${action} en inventario denegado` } : { allowed: true }
    }
  }
  return { allowed: false, reason: `Ninguna política permite ${action} en inventario` }
}
