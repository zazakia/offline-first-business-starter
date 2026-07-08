import { describe, it, expect, beforeEach } from 'vitest'
import { logger, metrics, generateHealthReport } from '../index'

describe('MetricsCollector', () => {
  beforeEach(() => {
    // Reset metrics between tests by checking from zero
  })

  it('should increment counters', () => {
    metrics.increment('test.counter')
    expect(metrics.getCounter('test.counter')).toBe(1)
  })

  it('should increment by custom amounts', () => {
    metrics.increment('test.batch', 5)
    expect(metrics.getCounter('test.batch')).toBe(5)
  })

  it('should record metric points', () => {
    metrics.record('test.point', 42, { type: 'demo' })
    const allMetrics = metrics.getMetrics()
    expect(allMetrics.some((m) => m.name === 'test.point' && m.value === 42)).toBe(true)
  })

  it('should start and stop timers', () => {
    const end = metrics.startTimer('test.duration')
    end()
    const allMetrics = metrics.getMetrics()
    const durations = allMetrics.filter((m) => m.name === 'test.duration.duration')
    expect(durations.length).toBeGreaterThanOrEqual(1)
    expect(durations[0]!.value).toBeGreaterThan(0)
  })

  it('should provide summary', () => {
    metrics.increment('sync.push')
    metrics.increment('sync.pull')
    const summary = metrics.getSummary()
    expect(summary.syncPushes).toBeGreaterThanOrEqual(1)
    expect(summary.syncPulls).toBeGreaterThanOrEqual(1)
  })
})

describe('StructuredLogger', () => {
  it('should log messages at different levels', () => {
    logger.info('Test info message', { module: 'test' })
    logger.warn('Test warning', { module: 'test' })
    logger.error('Test error', { module: 'test' })
    const logs = logger.getLogs()
    expect(logs.length).toBeGreaterThanOrEqual(3)
  })

  it('should filter logs by level', () => {
    logger.error('Only error', { module: 'test' })
    const errorLogs = logger.getLogs('error')
    expect(errorLogs.every((l) => l.level === 'error')).toBe(true)
  })

  it('should include metadata in log entries', () => {
    logger.info('With meta', { module: 'test', userId: 'u1', metadata: { key: 'val' } })
    const logs = logger.getLogs()
    const found = logs.find((l) => l.message === 'With meta')
    expect(found).toBeDefined()
    expect(found!.userId).toBe('u1')
    expect(found!.metadata).toEqual({ key: 'val' })
  })
})

describe('HealthReport', () => {
  it('should generate a health report', () => {
    const report = generateHealthReport()
    expect(report.status).toBe('healthy')
    expect(report.timestamp).toBeGreaterThan(0)
    expect(report.metrics).toBeDefined()
    expect(report.version).toBe('0.1.0')
  })
})
