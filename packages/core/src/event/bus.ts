/**
 * ─── Domain Event Bus ────────────────────────────────────────
 * Lightweight typed event bus for domain events.
 * Enables loose coupling between modules.
 *
 * Example:
 *   eventBus.on('customer.created', async (event) => {
 *     await sendWelcomeEmail(event.data.email)
 *   })
 */

import type { EntityId, TimestampMillis } from '../types'

export type DomainEventType = 
  | 'entity.created'
  | 'entity.updated'
  | 'entity.deleted'
  | 'entity.restored'
  | 'sync.started'
  | 'sync.completed'
  | 'sync.failed'
  | 'sync.conflict'
  | 'sync.conflict.resolved'
  | 'auth.login'
  | 'auth.logout'
  | 'auth.session.expired'
  | 'auth.session.refreshed'
  | 'tenant.changed'
  | 'system.error'
  | 'system.warning'

export interface DomainEvent {
  id: string
  type: DomainEventType
  entityType?: string
  entityId?: EntityId
  data: Record<string, unknown>
  metadata: {
    timestamp: TimestampMillis
    userId?: string
    tenantId?: string
    correlationId?: string
  }
}

export type EventHandler = (event: DomainEvent) => Promise<void> | void

export interface EventSubscription {
  unsubscribe: () => void
}

/**
 * Typed event bus.
 */
class EventBusClass {
  private handlers = new Map<DomainEventType, Set<EventHandler>>()
  private wildcardHandlers = new Set<(event: DomainEvent) => void>()
  private history: DomainEvent[] = []
  private maxHistory = 100

  /** Subscribe to a specific event type */
  on(type: DomainEventType, handler: EventHandler): EventSubscription {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set())
    }
    this.handlers.get(type)!.add(handler)

    return {
      unsubscribe: () => {
        this.handlers.get(type)?.delete(handler)
      },
    }
  }

  /** Subscribe to ALL events (for logging, analytics, etc.) */
  onAny(handler: (event: DomainEvent) => void): EventSubscription {
    this.wildcardHandlers.add(handler)
    return {
      unsubscribe: () => {
        this.wildcardHandlers.delete(handler)
      },
    }
  }

  /** Subscribe to events by pattern (e.g., 'entity.*') */
  onPattern(pattern: RegExp, handler: EventHandler): EventSubscription {
    const wrappedHandler: EventHandler = (event) => {
      if (pattern.test(event.type)) {
        return handler(event)
      }
    }
    return this.onAny(wrappedHandler as any)
  }

  /** Publish an event */
  async emit(type: DomainEventType, data: Record<string, unknown>, metadata?: Partial<DomainEvent['metadata']>): Promise<void> {
    const event: DomainEvent = {
      id: crypto.randomUUID(),
      type,
      data,
      metadata: {
        timestamp: Date.now(),
        ...metadata,
      },
    }

    // Store in history
    this.history.push(event)
    if (this.history.length > this.maxHistory) {
      this.history.shift()
    }

    // Notify wildcard handlers
    const promises: Promise<void>[] = []
    for (const handler of this.wildcardHandlers) {
      try {
        const result = handler(event) as Promise<void> | void
        if (result && typeof (result as Promise<void>).then === 'function') {
          promises.push(result as Promise<void>)
        }
      } catch (error) {
        console.error(`[EventBus] Wildcard handler error for ${type}:`, error)
      }
    }

    // Notify specific handlers
    const specificHandlers = this.handlers.get(type)
    if (specificHandlers) {
      for (const handler of specificHandlers) {
        try {
          const result = handler(event) as Promise<void> | void
          if (result && typeof (result as Promise<void>).then === 'function') {
            promises.push(result as Promise<void>)
          }
        } catch (error) {
          console.error(`[EventBus] Handler error for ${type}:`, error)
        }
      }
    }

    await Promise.allSettled(promises)
  }

  /** Remove all handlers (for testing) */
  clear(): void {
    this.handlers.clear()
    this.wildcardHandlers.clear()
    this.history = []
  }

  /** Get event history (for debugging) */
  getHistory(): DomainEvent[] {
    return [...this.history]
  }

  /** Get handler count */
  getHandlerCount(): number {
    let count = this.wildcardHandlers.size
    for (const handlers of this.handlers.values()) {
      count += handlers.size
    }
    return count
  }
}

/** Singleton instance */
export const eventBus = new EventBusClass()
