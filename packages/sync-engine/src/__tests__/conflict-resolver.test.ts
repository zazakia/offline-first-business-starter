import { describe, it, expect } from 'vitest'
import { DefaultConflictResolver, ManualConflictError } from '../conflict-resolver'
import type { BaseEntity } from '@repo/core'

interface TestEntity extends BaseEntity {
  name: string
  email: string
  score: number
}

const createEntity = (overrides: Partial<TestEntity> & { id?: string }): TestEntity => ({
  id: 'test-id',
  tenantId: 'tenant-1',
  name: 'Base',
  email: 'base@test.com',
  score: 50,
  createdAt: 1000,
  updatedAt: 1000,
  deletedAt: null,
  version: 1,
  createdBy: 'user-1',
  updatedBy: 'user-1',
  ...overrides,
})

describe('DefaultConflictResolver', () => {
  const resolver = new DefaultConflictResolver<TestEntity>()

  describe('LWW strategy', () => {
    it('should take local when local is newer', () => {
      const local = createEntity({ name: 'Local', updatedAt: 2000 })
      const remote = createEntity({ name: 'Remote', updatedAt: 1000 })
      const base = createEntity({ name: 'Base', updatedAt: 500 })

      const result = resolver.resolve(local, remote, base, 'lww')
      expect(result.resolution).toBe('local')
      expect((result.data as any).name).toBe('Local')
    })

    it('should take remote when remote is newer', () => {
      const local = createEntity({ name: 'Local', updatedAt: 1000 })
      const remote = createEntity({ name: 'Remote', updatedAt: 2000 })
      const base = createEntity({ name: 'Base', updatedAt: 500 })

      const result = resolver.resolve(local, remote, base, 'lww')
      expect(result.resolution).toBe('remote')
      expect((result.data as any).name).toBe('Remote')
    })

    it('should take local when timestamps are equal', () => {
      const local = createEntity({ name: 'Local', updatedAt: 1000 })
      const remote = createEntity({ name: 'Remote', updatedAt: 1000 })
      const base = createEntity({ name: 'Base', updatedAt: 500 })

      const result = resolver.resolve(local, remote, base, 'lww')
      expect(result.resolution).toBe('local')
    })
  })

  describe('per-field strategy', () => {
    it('should take remote fields that changed', () => {
      const base = createEntity({ name: 'Base', email: 'base@test.com', updatedAt: 500 })
      const local = createEntity({ name: 'Local', email: 'base@test.com', updatedAt: 1000 })
      const remote = createEntity({ name: 'Base', email: 'remote@test.com', updatedAt: 1500 })

      const result = resolver.resolve(local, remote, base, 'per-field')
      expect(result.resolution).toBe('custom')
      // name: only local changed → local wins (or remote has base, so local)
      // email: only remote changed → remote wins
      expect((result.data as any).name).toBe('Local')
      expect((result.data as any).email).toBe('remote@test.com')
    })

    it('should take local when only local changed', () => {
      const base = createEntity({ name: 'Base', score: 50, updatedAt: 500 })
      const local = createEntity({ name: 'Local', score: 50, updatedAt: 1000 })
      const remote = createEntity({ name: 'Base', score: 50, updatedAt: 800 })

      const result = resolver.resolve(local, remote, base, 'per-field')
      expect((result.data as any).name).toBe('Local')
    })
  })

  describe('manual strategy', () => {
    it('should throw ManualConflictError', () => {
      const local = createEntity({ name: 'Local', updatedAt: 1000 })
      const remote = createEntity({ name: 'Remote', updatedAt: 2000 })
      const base = createEntity({ name: 'Base', updatedAt: 500 })

      expect(() => resolver.resolve(local, remote, base, 'manual')).toThrow(ManualConflictError)
    })
  })

  describe('default strategy fallback', () => {
    it('should fall back to LWW for unknown strategies', () => {
      const local = createEntity({ name: 'Local', updatedAt: 2000 })
      const remote = createEntity({ name: 'Remote', updatedAt: 1000 })
      const base = createEntity({ name: 'Base', updatedAt: 500 })

      const result = (resolver as any).resolve(local, remote, base, 'unknown')
      expect(result.resolution).toBe('local')
    })
  })
})
