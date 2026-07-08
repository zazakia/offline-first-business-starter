import { describe, it, expect } from 'vitest'
import {
  CreateCustomerSchema,
  UpdateCustomerSchema,
  CustomerQuerySchema,
  CustomerStatusSchema,
} from '../customer.schema'

describe('CustomerStatusSchema', () => {
  it('should accept valid statuses', () => {
    expect(CustomerStatusSchema.parse('active')).toBe('active')
    expect(CustomerStatusSchema.parse('inactive')).toBe('inactive')
    expect(CustomerStatusSchema.parse('lead')).toBe('lead')
    expect(CustomerStatusSchema.parse('churned')).toBe('churned')
  })

  it('should reject invalid statuses', () => {
    expect(() => CustomerStatusSchema.parse('deleted')).toThrow()
    expect(() => CustomerStatusSchema.parse('')).toThrow()
  })
})

describe('CreateCustomerSchema', () => {
  const validInput = {
    tenantId: 'tenant-1',
    name: 'John Doe',
    email: 'john@example.com',
  }

  it('should accept valid input', () => {
    const result = CreateCustomerSchema.parse(validInput)
    expect(result.name).toBe('John Doe')
    expect(result.email).toBe('john@example.com')
    expect(result.status).toBe('active') // default
    expect(result.tags).toEqual([]) // default
  })

  it('should require name', () => {
    expect(() => CreateCustomerSchema.parse({ ...validInput, name: '' })).toThrow()
    expect(() => CreateCustomerSchema.parse({ ...validInput, name: undefined })).toThrow()
  })

  it('should require valid email', () => {
    expect(() => CreateCustomerSchema.parse({ ...validInput, email: 'not-an-email' })).toThrow()
    expect(() => CreateCustomerSchema.parse({ ...validInput, email: '' })).toThrow()
  })

  it('should validate phone format when provided', () => {
    expect(() => CreateCustomerSchema.parse({ ...validInput, phone: '+1 555-0123' })).not.toThrow()
  })

  it('should validate URL format when provided', () => {
    const result = CreateCustomerSchema.parse({ ...validInput, website: 'https://acme.com' })
    expect(result.website).toBe('https://acme.com')
  })

  it('should reject invalid URL', () => {
    expect(() => CreateCustomerSchema.parse({ ...validInput, website: 'not-a-url' })).toThrow()
  })

  it('should accept optional fields', () => {
    const withAll = {
      ...validInput,
      phone: '+1 555-0123',
      company: 'Acme Inc',
      website: 'https://acme.com',
      status: 'lead',
      tags: ['vip', 'enterprise'],
      notes: 'A good customer',
    }
    const result = CreateCustomerSchema.parse(withAll)
    expect(result.phone).toBe('+1 555-0123')
    expect(result.company).toBe('Acme Inc')
    expect(result.status).toBe('lead')
    expect(result.tags).toEqual(['vip', 'enterprise'])
  })

  it('should reject tags array longer than 20', () => {
    const manyTags = Array.from({ length: 21 }, (_, i) => `tag-${i}`)
    expect(() => CreateCustomerSchema.parse({ ...validInput, tags: manyTags })).toThrow()
  })
})

describe('UpdateCustomerSchema', () => {
  it('should require version', () => {
    expect(() => UpdateCustomerSchema.parse({ name: 'New Name' })).toThrow()
  })

  it('should accept version with fields', () => {
    const result = UpdateCustomerSchema.parse({
      name: 'Updated Name',
      version: 1,
    })
    expect(result.name).toBe('Updated Name')
    expect(result.version).toBe(1)
  })

  it('should accept partial updates', () => {
    const result = UpdateCustomerSchema.parse({ email: 'new@email.com', version: 2 })
    expect(result.email).toBe('new@email.com')
    expect(result.version).toBe(2)
  })
})

describe('CustomerQuerySchema', () => {
  it('should create a query with default limit', () => {
    const query = CustomerQuerySchema.parse({})
    expect(query.limit).toBe(50)
  })

  it('should accept optional filters', () => {
    const query = CustomerQuerySchema.parse({
      filter: [{ field: 'status', operator: 'eq', value: 'active' }],
      limit: 10,
    })
    expect(query.filter).toHaveLength(1)
    expect(query.limit).toBe(10)
  })
})
