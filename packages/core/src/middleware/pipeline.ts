/**
 * ─── Middleware Pipeline ─────────────────────────────────────
 * Middleware chain for all entity operations.
 * Each middleware can inspect, modify, or abort operations.
 */

import type { BaseEntity, CreateInput, UpdateInput, WriteOptions, EntityId } from '../types'

export interface MiddlewareContext {
  userId: string
  tenantId: string
  timestamp: number
  entityName: string
  operation: 'create' | 'update' | 'delete' | 'read' | 'sync'
  metadata?: Record<string, unknown>
}

export interface Middleware<T extends BaseEntity = BaseEntity> {
  name: string
  beforeCreate?: (input: Record<string, unknown>, ctx: MiddlewareContext) => Promise<Record<string, unknown>>
  afterCreate?: (result: T, ctx: MiddlewareContext) => Promise<void>
  beforeUpdate?: (id: EntityId, input: Record<string, unknown>, ctx: MiddlewareContext) => Promise<Record<string, unknown>>
  afterUpdate?: (result: T, ctx: MiddlewareContext) => Promise<void>
  beforeDelete?: (id: EntityId, ctx: MiddlewareContext) => Promise<void>
  afterDelete?: (result: T, ctx: MiddlewareContext) => Promise<void>
  beforeRead?: (id: EntityId, ctx: MiddlewareContext) => Promise<void>
  afterRead?: (result: T | null, ctx: MiddlewareContext) => Promise<T | null>
  beforeQuery?: (query: Record<string, unknown>, ctx: MiddlewareContext) => Promise<Record<string, unknown>>
  afterQuery?: (results: T[], ctx: MiddlewareContext) => Promise<T[]>
  onError?: (error: Error, ctx: MiddlewareContext) => Promise<void>
}

export class MiddlewarePipeline<T extends BaseEntity = BaseEntity> {
  private middlewares: Middleware<T>[] = []

  /** Register a middleware (order matters — first registered, first executed) */
  use(middleware: Middleware<T>): void {
    this.middlewares.push(middleware)
  }

  /** Insert middleware at a specific position */
  insertAt(index: number, middleware: Middleware<T>): void {
    this.middlewares.splice(index, 0, middleware)
  }

  /** Remove a middleware by name */
  remove(name: string): void {
    this.middlewares = this.middlewares.filter((m) => m.name !== name)
  }

  /** Get all registered middlewares */
  list(): Middleware<T>[] {
    return [...this.middlewares]
  }

  /** Clear all middlewares */
  clear(): void {
    this.middlewares = []
  }

  /** Run the middleware chain for a create operation */
  async runBeforeCreate(input: Record<string, unknown>, ctx: MiddlewareContext): Promise<Record<string, unknown>> {
    let current = { ...input }
    for (const mw of this.middlewares) {
      if (mw.beforeCreate) {
        current = await mw.beforeCreate(current, ctx)
      }
    }
    return current
  }

  async runAfterCreate(result: T, ctx: MiddlewareContext): Promise<void> {
    for (const mw of this.middlewares) {
      if (mw.afterCreate) {
        await mw.afterCreate(result, ctx)
      }
    }
  }

  async runBeforeUpdate(id: EntityId, input: Record<string, unknown>, ctx: MiddlewareContext): Promise<Record<string, unknown>> {
    let current = { ...input }
    for (const mw of this.middlewares) {
      if (mw.beforeUpdate) {
        current = await mw.beforeUpdate(id, current, ctx)
      }
    }
    return current
  }

  async runAfterUpdate(result: T, ctx: MiddlewareContext): Promise<void> {
    for (const mw of this.middlewares) {
      if (mw.afterUpdate) {
        await mw.afterUpdate(result, ctx)
      }
    }
  }

  async runBeforeDelete(id: EntityId, ctx: MiddlewareContext): Promise<void> {
    for (const mw of this.middlewares) {
      if (mw.beforeDelete) {
        await mw.beforeDelete(id, ctx)
      }
    }
  }

  async runAfterDelete(result: T, ctx: MiddlewareContext): Promise<void> {
    for (const mw of this.middlewares) {
      if (mw.afterDelete) {
        await mw.afterDelete(result, ctx)
      }
    }
  }

  async runBeforeRead(id: EntityId, ctx: MiddlewareContext): Promise<void> {
    for (const mw of this.middlewares) {
      if (mw.beforeRead) {
        await mw.beforeRead(id, ctx)
      }
    }
  }

  async runAfterRead(result: T | null, ctx: MiddlewareContext): Promise<T | null> {
    let current = result
    for (const mw of this.middlewares) {
      if (mw.afterRead) {
        current = await mw.afterRead(current, ctx)
      }
    }
    return current
  }

  async runBeforeQuery(query: Record<string, unknown>, ctx: MiddlewareContext): Promise<Record<string, unknown>> {
    let current = { ...query }
    for (const mw of this.middlewares) {
      if (mw.beforeQuery) {
        current = await mw.beforeQuery(current, ctx)
      }
    }
    return current
  }

  async runAfterQuery(results: T[], ctx: MiddlewareContext): Promise<T[]> {
    let current = [...results]
    for (const mw of this.middlewares) {
      if (mw.afterQuery) {
        current = await mw.afterQuery(current, ctx)
      }
    }
    return current
  }

  async handleError(error: Error, ctx: MiddlewareContext): Promise<void> {
    for (const mw of this.middlewares) {
      if (mw.onError) {
        try {
          await mw.onError(error, ctx)
        } catch {
          // Swallow error handler errors — don't let them cascade
        }
      }
    }
  }
}
