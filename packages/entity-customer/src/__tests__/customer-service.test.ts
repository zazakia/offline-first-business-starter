import { describe, it, expect } from 'vitest'
import { CustomerService } from '../customer.service'
import type { Customer } from '../customer.schema'

const createMockCustomer = (overrides?: Partial<Customer>): Customer => ({
  id: 'abc-123',
  tenantId: 'tenant-1',
  name: 'John Doe',
  email: 'john@example.com',
  status: 'active',
  tags: [],
  createdAt: 1000,
  updatedAt: 1000,
  deletedAt: null,
  version: 1,
  createdBy: 'user-1',
  updatedBy: 'user-1',
  ...overrides,
})

describe('CustomerService.prepareForCreate', () => {
  it('should normalize name (trim + capitalize)', () => {
    const result = CustomerService.prepareForCreate({ name: '  john doe  ' })
    expect(result.name).toBe('John Doe')
  })

  it('should lowercase email', () => {
    const result = CustomerService.prepareForCreate({ email: 'JOHN@EXAMPLE.COM' })
    expect(result.email).toBe('john@example.com')
  })

  it('should set default status to active', () => {
    const result = CustomerService.prepareForCreate({ name: 'Test' })
    expect(result.status).toBe('active')
  })

  it('should preserve provided status', () => {
    const result = CustomerService.prepareForCreate({ name: 'Test', status: 'lead' })
    expect(result.status).toBe('lead')
  })

  it('should initialize empty tags', () => {
    const result = CustomerService.prepareForCreate({ name: 'Test' })
    expect(result.tags).toEqual([])
  })

  it('should preserve provided tags', () => {
    const result = CustomerService.prepareForCreate({ name: 'Test', tags: ['vip'] })
    expect(result.tags).toEqual(['vip'])
  })
})

describe('CustomerService.validateEmail', () => {
  it('should validate correct email format', () => {
    const result = CustomerService.validateEmail('test@example.com')
    expect(result.valid).toBe(true)
    expect(result.normalizedEmail).toBe('test@example.com')
  })

  it('should reject invalid email format', () => {
    const result = CustomerService.validateEmail('not-an-email')
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('Invalid email format')
  })

  it('should reject disposable email domains', () => {
    const result = CustomerService.validateEmail('user@mailinator.com')
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('Disposable')
  })
})

describe('CustomerService.canActivate', () => {
  it('should allow activating a lead with email', () => {
    const customer = createMockCustomer({ status: 'lead' })
    const result = CustomerService.canActivate(customer)
    expect(result.allowed).toBe(true)
  })

  it('should reject activating non-lead customers', () => {
    const customer = createMockCustomer({ status: 'active' })
    const result = CustomerService.canActivate(customer)
    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('lead')
  })
})

describe('CustomerService.getLTVSegment', () => {
  it('should return vip for LTV >= 100000', () => {
    expect(CustomerService.getLTVSegment(100000)).toBe('vip')
    expect(CustomerService.getLTVSegment(200000)).toBe('vip')
  })

  it('should return high for LTV >= 25000', () => {
    expect(CustomerService.getLTVSegment(25000)).toBe('high')
    expect(CustomerService.getLTVSegment(50000)).toBe('high')
  })

  it('should return medium for LTV >= 5000', () => {
    expect(CustomerService.getLTVSegment(5000)).toBe('medium')
    expect(CustomerService.getLTVSegment(24000)).toBe('medium')
  })

  it('should return low for LTV < 5000', () => {
    expect(CustomerService.getLTVSegment(1000)).toBe('low')
    expect(CustomerService.getLTVSegment(0)).toBe('low')
  })
})

describe('CustomerService.merge', () => {
  it('should merge two customers, taking primary fields first', () => {
    const primary = createMockCustomer({ name: 'Primary', company: 'Acme' })
    const secondary = createMockCustomer({ name: 'Secondary', company: 'Other' })
    const merged = CustomerService.merge(primary, secondary)
    expect(merged.name).toBe('Primary') // From primary
    expect(merged.company).toBe('Acme') // From primary
  })

  it('should combine tags uniquely', () => {
    const primary = createMockCustomer({ tags: ['vip'] })
    const secondary = createMockCustomer({ tags: ['enterprise'] })
    const merged = CustomerService.merge(primary, secondary) as any
    expect(merged.tags).toContain('vip')
    expect(merged.tags).toContain('enterprise')
  })

  it('should combine lifetime value', () => {
    const primary = createMockCustomer({ lifetimeValue: 1000 })
    const secondary = createMockCustomer({ lifetimeValue: 2000 })
    const merged = CustomerService.merge(primary, secondary) as any
    expect(merged.lifetimeValue).toBe(3000)
  })
})

describe('CustomerService.shouldAutoChurn', () => {
  it('should return false for active customers with recent contact', () => {
    const customer = createMockCustomer({ status: 'active', lastContactedAt: Date.now() })
    expect(CustomerService.shouldAutoChurn(customer)).toBe(false)
  })

  it('should return true for inactive customers with no contact in a year', () => {
    const twoYearsAgo = Date.now() - 2 * 365 * 24 * 60 * 60 * 1000
    const customer = createMockCustomer({ status: 'inactive', lastContactedAt: twoYearsAgo })
    expect(CustomerService.shouldAutoChurn(customer)).toBe(true)
  })

  it('should return false for already churned customers', () => {
    const customer = createMockCustomer({ status: 'churned' })
    expect(CustomerService.shouldAutoChurn(customer)).toBe(false)
  })
})
