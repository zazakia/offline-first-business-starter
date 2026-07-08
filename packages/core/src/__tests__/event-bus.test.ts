import { describe, it, expect, beforeEach, vi } from 'vitest'
import { eventBus } from '../event/bus'

describe('EventBus', () => {
  beforeEach(() => {
    eventBus.clear()
  })

  it('should publish and receive events', async () => {
    const handler = vi.fn()
    eventBus.on('entity.created', handler)

    await eventBus.emit('entity.created', { id: 'abc', type: 'customer' })

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'entity.created',
        data: { id: 'abc', type: 'customer' },
      }),
    )
  })

  it('should pass metadata to handlers', async () => {
    const handler = vi.fn()
    eventBus.on('sync.completed', handler)

    await eventBus.emit('sync.completed', 
      { items: 5 },
      { userId: 'user-1', tenantId: 'tenant-1', correlationId: 'corr-1' },
    )

    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          userId: 'user-1',
          tenantId: 'tenant-1',
          correlationId: 'corr-1',
        }),
      }),
    )
  })

  it('should support unsubscribe', async () => {
    const handler = vi.fn()
    const subscription = eventBus.on('entity.created', handler)
    subscription.unsubscribe()

    await eventBus.emit('entity.created', { id: 'abc' })

    expect(handler).not.toHaveBeenCalled()
  })

  it('should support wildcard handlers (onAny)', async () => {
    const handler = vi.fn()
    eventBus.onAny(handler)

    await eventBus.emit('entity.created', { id: '1' })
    await eventBus.emit('sync.completed', {})
    await eventBus.emit('auth.login', { userId: 'u1' })

    expect(handler).toHaveBeenCalledTimes(3)
  })

  it('should not throw when handler throws', async () => {
    const throwingHandler = vi.fn().mockRejectedValue(new Error('Handler crash'))
    eventBus.on('entity.created', throwingHandler)

    const stableHandler = vi.fn()
    eventBus.on('entity.created', stableHandler)

    // Should not throw
    await expect(
      eventBus.emit('entity.created', { test: true }),
    ).resolves.not.toThrow()

    expect(stableHandler).toHaveBeenCalledTimes(1)
  })

  it('should store event history', async () => {
    await eventBus.emit('entity.created', { id: '1' })
    await eventBus.emit('entity.updated', { id: '1' })
    await eventBus.emit('entity.deleted', { id: '1' })

    const history = eventBus.getHistory()
    expect(history).toHaveLength(3)
    expect(history[0]!.type).toBe('entity.created')
    expect(history[2]!.type).toBe('entity.deleted')
  })

  it('should track handler count', () => {
    expect(eventBus.getHandlerCount()).toBe(0)

    eventBus.on('entity.created', () => {})
    eventBus.on('entity.updated', () => {})
    eventBus.onAny(() => {})

    expect(eventBus.getHandlerCount()).toBe(3)
  })

  it('should emit events with unique IDs', async () => {
    const events: string[] = []
    eventBus.on('entity.created', (e) => { events.push(e.id) })

    await eventBus.emit('entity.created', {})
    await eventBus.emit('entity.created', {})

    expect(events[0]).not.toBe(events[1])
  })

  it('should handle multiple handlers for same event', async () => {
    const handler1 = vi.fn()
    const handler2 = vi.fn()
    eventBus.on('sync.started', handler1)
    eventBus.on('sync.started', handler2)

    await eventBus.emit('sync.started', { timestamp: Date.now() })

    expect(handler1).toHaveBeenCalledTimes(1)
    expect(handler2).toHaveBeenCalledTimes(1)
  })

  it('should handle clear properly', () => {
    eventBus.on('entity.created', () => {})
    eventBus.onAny(() => {})
    expect(eventBus.getHandlerCount()).toBe(2)

    eventBus.clear()
    expect(eventBus.getHandlerCount()).toBe(0)
    expect(eventBus.getHistory()).toHaveLength(0)
  })
})
