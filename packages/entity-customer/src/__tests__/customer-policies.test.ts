import { describe, it, expect } from 'vitest'
import { evaluatePolicies, CustomerPolicies } from '../customer.policies'
import type { PolicyContext } from '../customer.policies'
import type { Customer } from '../customer.schema'

const createContext = (overrides?: Partial<PolicyContext>): PolicyContext => ({
  userId: 'user-1',
  tenantId: 'tenant-1',
  roles: ['user'],
  permissions: [],
  ...overrides,
})

describe('evaluatePolicies', () => {
  it('should allow admin to do everything', () => {
    const ctx = createContext({ roles: ['admin'] })
    expect(evaluatePolicies('create', ctx).allowed).toBe(true)
    expect(evaluatePolicies('read', ctx).allowed).toBe(true)
    expect(evaluatePolicies('update', ctx).allowed).toBe(true)
    expect(evaluatePolicies('delete', ctx).allowed).toBe(true)
    expect(evaluatePolicies('export', ctx).allowed).toBe(true)
  })

  it('should allow manager to create, read, update, export', () => {
    const ctx = createContext({ roles: ['manager'] })
    expect(evaluatePolicies('create', ctx).allowed).toBe(true)
    expect(evaluatePolicies('read', ctx).allowed).toBe(true)
    expect(evaluatePolicies('update', ctx).allowed).toBe(true)
    expect(evaluatePolicies('export', ctx).allowed).toBe(true)
  })

  it('should deny delete for non-admins', () => {
    const ctx = createContext({ roles: ['manager'] })
    const result = evaluatePolicies('delete', ctx)
    expect(result.allowed).toBe(false)
  })

  it('should allow sales_rep to read all customers', () => {
    const ctx = createContext({ roles: ['sales_rep'] })
    expect(evaluatePolicies('read', ctx).allowed).toBe(true)
  })

  it('should allow sales_rep to update their own customers', () => {
    const customer = { createdBy: 'user-1' } as Customer
    const ctx = createContext({ roles: ['sales_rep'], resource: customer })
    expect(evaluatePolicies('update', ctx).allowed).toBe(true)
  })

  it('should deny sales_rep to update other customers', () => {
    const customer = { createdBy: 'other-user' } as Customer
    const ctx = createContext({ roles: ['sales_rep'], resource: customer })
    expect(evaluatePolicies('update', ctx).allowed).toBe(false)
  })

  it('should allow support to read', () => {
    const ctx = createContext({ roles: ['support'] })
    expect(evaluatePolicies('read', ctx).allowed).toBe(true)
  })

  it('should deny bulk_import for non-managers', () => {
    const ctx = createContext({ roles: ['user'] })
    expect(evaluatePolicies('bulk_import', ctx).allowed).toBe(false)
  })

  it('should allow bulk_import for managers', () => {
    const ctx = createContext({ roles: ['manager'] })
    const result = evaluatePolicies('bulk_import', ctx)
    // Managers don't have explicit bulk_import permission; should be denied
    expect(result.allowed).toBe(false)
  })
})
