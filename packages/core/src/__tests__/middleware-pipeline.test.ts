import { describe, it, expect, vi } from 'vitest'
import { MiddlewarePipeline } from '../middleware/pipeline'
import type { Middleware, MiddlewareContext } from '../middleware/pipeline'
import type { BaseEntity } from '../types'

interface TestEntity extends BaseEntity {
  name: string
  email: string
}

const mockContext: MiddlewareContext = {
  userId: 'test-user',
  tenantId: 'test-tenant',
  timestamp: Date.now(),
  entityName: 'test',
  operation: 'create',
}

describe('MiddlewarePipeline', () => {
  it('should run middlewares in order', async () => {
    const pipeline = new MiddlewarePipeline()
    const order: number[] = []

    pipeline.use({
      name: 'first',
      beforeCreate: async (input) => { order.push(1); return input },
    })
    pipeline.use({
      name: 'second',
      beforeCreate: async (input) => { order.push(2); return input },
    })
    pipeline.use({
      name: 'third',
      beforeCreate: async (input) => { order.push(3); return input },
    })

    await pipeline.runBeforeCreate({ name: 'test' }, mockContext)
    expect(order).toEqual([1, 2, 3])
  })

  it('should allow middlewares to modify input', async () => {
    const pipeline = new MiddlewarePipeline()

    pipeline.use({
      name: 'add-timestamp',
      beforeCreate: async (input) => ({ ...input, timestamp: Date.now() }),
    })
    pipeline.use({
      name: 'add-tenant',
      beforeCreate: async (input) => ({ ...input, tenantId: mockContext.tenantId }),
    })

    const result = await pipeline.runBeforeCreate({ name: 'test' }, mockContext)
    expect(result.name).toBe('test')
    expect(result.tenantId).toBe('test-tenant')
    expect(result.timestamp).toBeGreaterThan(0)
  })

  it('should run afterCreate hooks', async () => {
    const pipeline = new MiddlewarePipeline()
    const afterHook = vi.fn()

    pipeline.use({
      name: 'test-after',
      afterCreate: afterHook,
    })

    const entity = { id: '1', name: 'test' } as any
    await pipeline.runAfterCreate(entity, mockContext)
    expect(afterHook).toHaveBeenCalledWith(entity, mockContext)
  })

  it('should support removing middlewares by name', async () => {
    const pipeline = new MiddlewarePipeline()
    const sensitive = vi.fn()

    pipeline.use({ name: 'sensitive', afterCreate: sensitive })
    pipeline.use({ name: 'normal', afterCreate: async () => {} })

    expect(pipeline.list()).toHaveLength(2)
    pipeline.remove('sensitive')
    expect(pipeline.list()).toHaveLength(1)
    expect(pipeline.list()[0]!.name).toBe('normal')
  })

  it('should support inserting at a position', async () => {
    const pipeline = new MiddlewarePipeline()
    const order: number[] = []

    pipeline.use({ name: 'first', beforeCreate: async (i) => { order.push(1); return i } })
    pipeline.use({ name: 'last', beforeCreate: async (i) => { order.push(3); return i } })
    pipeline.insertAt(1, { name: 'middle', beforeCreate: async (i) => { order.push(2); return i } })

    await pipeline.runBeforeCreate({}, mockContext)
    expect(order).toEqual([1, 2, 3])
  })

  it('should run beforeUpdate / afterUpdate hooks', async () => {
    const pipeline = new MiddlewarePipeline()
    const beforeUpdate = vi.fn((i) => i)
    const afterUpdate = vi.fn()

    pipeline.use({
      name: 'update-test',
      beforeUpdate,
      afterUpdate,
    })

    const input = { name: 'updated' }
    const result = await pipeline.runBeforeUpdate('id-1', input, mockContext)
    expect(beforeUpdate).toHaveBeenCalledWith('id-1', input, mockContext)

    const entity = { id: 'id-1', name: 'updated' } as any
    await pipeline.runAfterUpdate(entity, mockContext)
    expect(afterUpdate).toHaveBeenCalledWith(entity, mockContext)
  })

  it('should run beforeDelete / afterDelete hooks', async () => {
    const pipeline = new MiddlewarePipeline()
    const beforeDelete = vi.fn()
    const afterDelete = vi.fn()

    pipeline.use({
      name: 'delete-test',
      beforeDelete,
      afterDelete,
    })

    await pipeline.runBeforeDelete('id-1', mockContext)
    expect(beforeDelete).toHaveBeenCalledWith('id-1', mockContext)

    const entity = { id: 'id-1' } as any
    await pipeline.runAfterDelete(entity, mockContext)
    expect(afterDelete).toHaveBeenCalledWith(entity, mockContext)
  })

  it('should handle errors gracefully', async () => {
    const pipeline = new MiddlewarePipeline()
    const errorHandler = vi.fn()

    pipeline.use({
      name: 'error-handler',
      onError: errorHandler,
    })

    const error = new Error('Something broke')
    await pipeline.handleError(error, mockContext)
    expect(errorHandler).toHaveBeenCalledWith(error, mockContext)
  })

  it('should run beforeRead / afterRead hooks', async () => {
    const pipeline = new MiddlewarePipeline()
    const beforeRead = vi.fn()
    const afterRead = vi.fn()

    pipeline.use({
      name: 'read-test',
      beforeRead,
      afterRead: async (result, ctx) => {
        afterRead(result, ctx)
        return result
      },
    })

    await pipeline.runBeforeRead('id-1', mockContext)
    expect(beforeRead).toHaveBeenCalledWith('id-1', mockContext)

    const entity = { id: 'id-1' } as any
    const result = await pipeline.runAfterRead(entity, mockContext)
    expect(afterRead).toHaveBeenCalledWith(entity, mockContext)
    expect(result).toBe(entity)
  })

  it('should run beforeQuery / afterQuery hooks', async () => {
    const pipeline = new MiddlewarePipeline()
    const beforeQuery = vi.fn((q) => q)
    const afterQuery = vi.fn((r) => r)

    pipeline.use({
      name: 'query-test',
      beforeQuery,
      afterQuery,
    })

    const query = { limit: 10 }
    const queryResult = await pipeline.runBeforeQuery(query, mockContext)
    expect(beforeQuery).toHaveBeenCalledWith(query, mockContext)

    const results = [{ id: '1', name: 'test' }] as any[]
    const processedResults = await pipeline.runAfterQuery(results, mockContext)
    expect(afterQuery).toHaveBeenCalledWith(results, mockContext)
    expect(processedResults).toEqual(results)
  })

  it('should clear all middlewares', () => {
    const pipeline = new MiddlewarePipeline()
    pipeline.use({ name: 'a', beforeCreate: async (i) => i })
    pipeline.use({ name: 'b', beforeCreate: async (i) => i })

    expect(pipeline.list()).toHaveLength(2)
    pipeline.clear()
    expect(pipeline.list()).toHaveLength(0)
  })
})
