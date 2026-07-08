/**
 * ─── Observability ───────────────────────────────────────────
 * Structured logging, metrics, error tracking, and performance monitoring.
 * Works across all platforms (browser, server, mobile).
 */

import { eventBus } from '@repo/core'
import type { DomainEvent, EventSubscription } from '@repo/core'

// ─── Log Levels ──────────────────────────────────────────

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: number
  module?: string
  correlationId?: string
  userId?: string
  tenantId?: string
  metadata?: Record<string, unknown>
  error?: { name: string; message: string; stack?: string }
}

// ─── Metrics ─────────────────────────────────────────────

export interface MetricPoint {
  name: string
  value: number
  tags?: Record<string, string>
  timestamp: number
}

class MetricsCollector {
  private metrics: MetricPoint[] = []
  private counters = new Map<string, number>()
  private timers = new Map<string, number>()

  /** Increment a counter */
  increment(name: string, by = 1, tags?: Record<string, string>): void {
    const key = `${name}:${JSON.stringify(tags ?? {})}`
    this.counters.set(key, (this.counters.get(key) ?? 0) + by)
    this.record(name, by, tags)
  }

  /** Start a timer */
  startTimer(name: string): () => number {
    const start = performance.now()
    return () => {
      const duration = performance.now() - start
      this.record(`${name}.duration`, duration)
      return duration
    }
  }

  /** Record a metric point */
  record(name: string, value: number, tags?: Record<string, string>): void {
    this.metrics.push({ name, value, tags, timestamp: Date.now() })
    if (this.metrics.length > 10000) {
      this.metrics.splice(0, 1000)
    }
  }

  /** Get counter value */
  getCounter(name: string): number {
    let total = 0
    for (const [key, value] of this.counters) {
      if (key.startsWith(name)) total += value
    }
    return total
  }

  /** Get all recent metrics */
  getMetrics(): MetricPoint[] {
    return [...this.metrics]
  }

  /** Get summary of key metrics */
  getSummary(): Record<string, number> {
    return {
      syncPushes: this.getCounter('sync.push'),
      syncPulls: this.getCounter('sync.pull'),
      conflicts: this.getCounter('sync.conflict'),
      errors: this.getCounter('error'),
      creates: this.getCounter('entity.create'),
      updates: this.getCounter('entity.update'),
      deletes: this.getCounter('entity.delete'),
    }
  }
}

export const metrics = new MetricsCollector()

// ─── Structured Logger ───────────────────────────────────

class StructuredLogger {
  private entries: LogEntry[] = []
  private maxEntries = 1000

  debug(message: string, meta?: Omit<LogEntry, 'level' | 'message' | 'timestamp'>): void {
    this.log('debug', message, meta)
  }

  info(message: string, meta?: Omit<LogEntry, 'level' | 'message' | 'timestamp'>): void {
    this.log('info', message, meta)
  }

  warn(message: string, meta?: Omit<LogEntry, 'level' | 'message' | 'timestamp'>): void {
    this.log('warn', message, meta)
  }

  error(message: string, meta?: Omit<LogEntry, 'level' | 'message' | 'timestamp'>): void {
    this.log('error', message, meta)
    if (meta?.module) {
      metrics.increment('error', 1, { module: meta.module })
    } else {
      metrics.increment('error', 1)
    }
  }

  private log(level: LogLevel, message: string, meta?: Partial<LogEntry>): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: Date.now(),
      ...meta,
    }

    // Console output in dev
    const isDev = typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production'
    if (isDev) {
      const prefix = `[${level.toUpperCase()}]${meta?.module ? ` [${meta.module}]` : ''}`
      switch (level) {
        case 'debug': console.debug(prefix, message, meta?.metadata ?? ''); break
        case 'info': console.info(prefix, message, meta?.metadata ?? ''); break
        case 'warn': console.warn(prefix, message, meta?.metadata ?? ''); break
        case 'error': console.error(prefix, message, meta?.error ?? meta?.metadata ?? ''); break
      }
    }

    this.entries.push(entry)
    if (this.entries.length > this.maxEntries) {
      this.entries.shift()
    }
  }

  /** Get recent log entries */
  getLogs(level?: LogLevel, limit = 100): LogEntry[] {
    let filtered = level ? this.entries.filter((e) => e.level === level) : this.entries
    return filtered.slice(-limit)
  }

  /** Attach logger to event bus for automatic logging */
  attachToEventBus(): EventSubscription {
    return eventBus.onAny((event: DomainEvent) => {
      if (event.type.startsWith('error') || event.type.startsWith('sync.failed')) {
        this.error(`Event: ${event.type}`, {
          metadata: event.data,
          correlationId: event.metadata.correlationId,
        })
      } else if (event.type.startsWith('sync')) {
        this.info(`Event: ${event.type}`, {
          metadata: event.data,
          correlationId: event.metadata.correlationId,
        })
      }
    })
  }
}

export const logger = new StructuredLogger()

// ─── Performance Monitoring ─────────────────────────────

export function monitorPerformance(thresholdMs = 100): EventSubscription {
  return eventBus.onAny((event: DomainEvent) => {
    if (event.type.startsWith('entity.')) {
      metrics.increment(`entity.${event.type.split('.')[1]}`, 1)
    }
    if (event.type.startsWith('sync')) {
      metrics.increment(event.type, 1)
    }
  })
}

// ─── Health Report ───────────────────────────────────────

export interface HealthReport {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: number
  uptime: number
  metrics: Record<string, number>
  errors: LogEntry[]
  version: string
}

export function generateHealthReport(): HealthReport {
  const errorLogs = logger.getLogs('error', 10)
  return {
    status: errorLogs.length > 5 ? 'degraded' : 'healthy',
    timestamp: Date.now(),
    uptime: performance.now(),
    metrics: metrics.getSummary(),
    errors: errorLogs,
    version: '0.1.0',
  }
}
