/**
 * ─── Shared Test Utilities ───────────────────────────────────
 * Entity factories, mocks, and helpers for testing.
 */

import type { BaseEntity, EntityId, TimestampMillis } from '@repo/core'
import { v4 as uuidv4 } from 'uuid'

/**
 * Create a mock base entity with defaults.
 */
export function createMockBase(overrides?: Partial<BaseEntity>): BaseEntity {
  const now = Date.now()
  return {
    id: uuidv4(),
    tenantId: 'test-tenant',
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    version: 1,
    createdBy: 'test-user',
    updatedBy: 'test-user',
    ...overrides,
  }
}

/**
 * Factory for creating test entities.
 */
export function createFactory<T extends BaseEntity>(
  defaults: () => Omit<T, keyof BaseEntity>,
) {
  return (overrides?: Partial<T>): T => {
    const base = createMockBase()
    const data = defaults()
    return { ...base, ...data, ...overrides } as T
  }
}

/**
 * Create a mock repository for testing.
 */
export function createMockRepository<T extends BaseEntity>() {
  const store = new Map<EntityId, T>()

  return {
    findById: async (id: EntityId) => store.get(id) ?? null,
    findMany: async ({ page, pageSize }: any) => {
      const items = Array.from(store.values())
        .filter((i) => !i.deletedAt)
        .slice((page - 1) * pageSize, page * pageSize)
      return { items, total: store.size, page, pageSize, totalPages: Math.ceil(store.size / pageSize) }
    },
    create: async (input: any) => {
      const entity = { ...createMockBase(), ...input } as T
      store.set(entity.id, entity)
      return entity
    },
    update: async (id: EntityId, input: any) => {
      const existing = store.get(id)
      if (!existing) throw new Error('Not found')
      const updated = { ...existing, ...input, version: existing.version + 1 } as T
      store.set(id, updated)
      return updated
    },
    delete: async (id: EntityId) => {
      const existing = store.get(id)
      if (existing) {
        existing.deletedAt = Date.now()
      }
    },
    count: async () => store.size,
  }
}

/**
 * Wait for a condition to be true (for testing async behavior).
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout = 5000,
  interval = 100,
): Promise<void> {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    if (await condition()) return
    await new Promise((r) => setTimeout(r, interval))
  }
  throw new Error('waitFor timed out')
}
