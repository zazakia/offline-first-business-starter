import { describe, it, expect } from 'vitest'
import { createTenantMiddleware, canAccessTenant, getTenantContext } from '../index'

describe('createTenantMiddleware', () => {
  const middleware = createTenantMiddleware('customer')

  it('should inject tenantId on create', async () => {
    const result = await middleware.beforeCreate!({ name: 'test' }, {
      userId: 'u1', tenantId: 'tenant-1', timestamp: 1000, entityName: 'customer', operation: 'create',
    })
    expect(result.tenantId).toBe('tenant-1')
  })

  it('should reject tenantId change on update', async () => {
    await expect(
      middleware.beforeUpdate!('id-1', { tenantId: 'other-tenant', version: 1 }, {
        userId: 'u1', tenantId: 'my-tenant', timestamp: 1000, entityName: 'customer', operation: 'update',
      }),
    ).rejects.toThrow('Tenant mismatch')
  })
})

describe('canAccessTenant', () => {
  it('should allow same tenant', () => {
    expect(canAccessTenant('tenant-1', 'tenant-1', ['user'])).toBe(true)
  })

  it('should allow admin across tenants', () => {
    expect(canAccessTenant('tenant-1', 'tenant-2', ['admin'])).toBe(true)
  })

  it('should deny different tenant for non-admin', () => {
    expect(canAccessTenant('tenant-1', 'tenant-2', ['user'])).toBe(false)
  })
})

describe('getTenantContext', () => {
  it('should return enterprise features for enterprise roles', () => {
    const ctx = getTenantContext('u1', 't1', ['enterprise'])
    expect(ctx.features).toContain('audit')
  })

  it('should return basic features for non-enterprise roles', () => {
    const ctx = getTenantContext('u1', 't1', ['user'])
    expect(ctx.features).toContain('basic')
  })
})
