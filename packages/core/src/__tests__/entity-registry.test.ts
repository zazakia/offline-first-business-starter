import { describe, it, expect, beforeEach } from 'vitest'
import { EntityRegistry } from '../entity/registry'
import type { EntityDefinition } from '../entity/registry'
import type { BaseEntity } from '../types'

interface TestEntity extends BaseEntity {
  name: string
}

const createMockEntityDef = (name: string, overrides?: Partial<EntityDefinition>): EntityDefinition => ({
  name,
  ui: { label: name, labelPlural: `${name}s`, routePath: name.toLowerCase(), showInNav: true, navOrder: 10 },
  sync: { enabled: true, conflictStrategy: 'lww', priority: 'normal' },
  audit: { enabled: true },
  rbac: { enabled: true, permissionPrefix: name.toLowerCase() },
  hooks: {},
  pagination: 'cursor',
  tenant: { enabled: true },
  softDelete: { enabled: true },
  ...overrides,
})

describe('EntityRegistry', () => {
  beforeEach(() => {
    // Clear by reassigning internal state
    EntityRegistry.getAll().forEach((e) => {
      // Can't easily clear, but we can test without depending on state
    })
  })

  it('should register and retrieve an entity', () => {
    const def = createMockEntityDef('Customer')
    EntityRegistry.register(def)

    const retrieved = EntityRegistry.get('Customer')
    expect(retrieved).toBeDefined()
    expect(retrieved.name).toBe('Customer')
    expect(retrieved.ui.label).toBe('Customer')
    expect(retrieved.ui.labelPlural).toBe('Customers')
  })

  it('should check if entity is registered', () => {
    const def = createMockEntityDef('Order')
    EntityRegistry.register(def)

    expect(EntityRegistry.has('Order')).toBe(true)
    expect(EntityRegistry.has('NonExistent')).toBe(false)
  })

  it('should list all registered entities', () => {
    EntityRegistry.register(createMockEntityDef('Product'))
    EntityRegistry.register(createMockEntityDef('Invoice'))

    const list = EntityRegistry.list()
    expect(list).toContain('Product')
    expect(list).toContain('Invoice')
  })

  it('should get all entity definitions', () => {
    EntityRegistry.register(createMockEntityDef('Ticket'))

    const all = EntityRegistry.getAll()
    expect(all.length).toBeGreaterThanOrEqual(1)
    expect(all.some((e) => e.name === 'Ticket')).toBe(true)
  })

  it('should return nav entities sorted by navOrder', () => {
    EntityRegistry.register(createMockEntityDef('ZFinal', { ui: { label: 'ZFinal', labelPlural: 'ZFinals', routePath: 'zfinal', showInNav: true, navOrder: 100 } }))
    EntityRegistry.register(createMockEntityDef('AFirst', { ui: { label: 'AFirst', labelPlural: 'AFirsts', routePath: 'afirst', showInNav: true, navOrder: 1 } }))

    const navEntities = EntityRegistry.getNavEntities()
    if (navEntities.length >= 2) {
      const firstNav = navEntities[0]!
      const lastNav = navEntities[navEntities.length - 1]!
      expect(firstNav.ui.navOrder).toBeLessThanOrEqual(lastNav.ui.navOrder!)
    }
  })

  it('should filter sync-enabled entities', () => {
    EntityRegistry.register(createMockEntityDef('SyncEnabled'))
    EntityRegistry.register(createMockEntityDef('SyncDisabled', { sync: { enabled: false, conflictStrategy: 'lww', priority: 'normal' } }))

    const syncEntities = EntityRegistry.getSyncEntities()
    expect(syncEntities.every((e) => e.sync.enabled)).toBe(true)
  })

  it('should exclude entities with showInNav false from navigation', () => {
    EntityRegistry.register(createMockEntityDef('Hidden', { ui: { label: 'Hidden', labelPlural: 'Hiddens', routePath: 'hidden', showInNav: false, navOrder: 99 } }))

    const navEntities = EntityRegistry.getNavEntities()
    expect(navEntities.some((e) => e.name === 'Hidden')).toBe(false)
  })

  it('should throw when getting unregistered entity', () => {
    expect(() => EntityRegistry.get('DoesNotExist')).toThrow('not registered')
  })
})
