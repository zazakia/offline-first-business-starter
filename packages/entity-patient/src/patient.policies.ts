/**
 * ─── Patient RBAC Policies ───────────────────────────────────
 * Permission rules for Patient operations.
 * Clinical data is highly sensitive — strict access control.
 */

import type { Patient } from './patient.schema'

export interface PolicyContext {
  userId: string
  tenantId: string
  roles: string[]
  permissions: string[]
  resource?: Patient
  metadata?: Record<string, unknown>
}

export type PolicyAction = 'create' | 'read' | 'update' | 'delete' | 'export' | 'view_clinical' | 'bulk_import' | '*'

export interface Policy {
  effect: 'allow' | 'deny'
  action: PolicyAction
  conditions?: (ctx: PolicyContext) => boolean
  priority?: number
}

export const PatientPolicies: Policy[] = [
  // Admin: full access
  {
    effect: 'allow',
    action: '*',
    conditions: (ctx) => ctx.roles.includes('admin') || ctx.roles.includes('superadmin'),
    priority: 100,
  },

  // Doctor: full clinical access
  {
    effect: 'allow',
    action: '*',
    conditions: (ctx) => ctx.roles.includes('doctor'),
    priority: 90,
  },

  // Nurse: read and update basic info, view clinical
  {
    effect: 'allow',
    action: 'read',
    conditions: (ctx) => ctx.roles.includes('nurse'),
    priority: 85,
  },
  {
    effect: 'allow',
    action: 'update',
    conditions: (ctx) => ctx.roles.includes('nurse'),
    priority: 85,
  },
  {
    effect: 'allow',
    action: 'view_clinical',
    conditions: (ctx) => ctx.roles.includes('nurse'),
    priority: 85,
  },

  // Receptionist: create, read, update demographic info, NOT clinical
  {
    effect: 'allow',
    action: 'read',
    conditions: (ctx) => ctx.roles.includes('receptionist'),
    priority: 80,
  },
  {
    effect: 'allow',
    action: 'create',
    conditions: (ctx) => ctx.roles.includes('receptionist'),
    priority: 80,
  },
  {
    effect: 'allow',
    action: 'update',
    conditions: (ctx) => ctx.roles.includes('receptionist'),
    priority: 80,
  },

  // Pharmacist: read patients for prescription validation
  {
    effect: 'allow',
    action: 'read',
    conditions: (ctx) => ctx.roles.includes('pharmacist'),
    priority: 75,
  },

  // Billing staff: read demographics only
  {
    effect: 'allow',
    action: 'read',
    conditions: (ctx) => ctx.roles.includes('billing'),
    priority: 70,
  },

  // Deny delete for non-admins (patients are never truly deleted — legal requirement)
  {
    effect: 'deny',
    action: 'delete',
    priority: 50,
  },

  // Deny clinical data access to non-clinical staff
  {
    effect: 'deny',
    action: 'view_clinical',
    conditions: (ctx) => {
      const clinical = ['doctor', 'nurse', 'admin', 'superadmin']
      return !clinical.some((r) => ctx.roles.includes(r))
    },
    priority: 49,
  },
]

export function evaluatePolicies(
  action: Policy['action'],
  context: PolicyContext,
  policies: Policy[] = PatientPolicies,
): { allowed: boolean; reason?: string } {
  const sorted = [...policies].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))

  for (const policy of sorted) {
    if (policy.action !== '*' && policy.action !== action) continue
    const conditionsMet = policy.conditions ? policy.conditions(context) : true

    if (conditionsMet) {
      if (policy.effect === 'deny') {
        return { allowed: false, reason: `${action} en paciente denegado` }
      }
      return { allowed: true }
    }
  }

  return { allowed: false, reason: `Ninguna política permite ${action} en paciente` }
}
