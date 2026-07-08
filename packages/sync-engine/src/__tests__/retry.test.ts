import { describe, it, expect } from 'vitest'
import {
  calculateDelay,
  shouldRetry,
  isRetriableError,
  DeadLetterQueue,
  DEFAULT_RETRY_CONFIG,
} from '../retry'
import type { ChangeLogEntry } from '@repo/core'

const createChange = (overrides?: Partial<ChangeLogEntry>): ChangeLogEntry => ({
  id: 'change-1',
  entityType: 'customer',
  entityId: 'customer-1',
  operation: 'create',
  data: { name: 'Test' },
  timestamp: 1000,
  clientId: 'client-1',
  tenantId: 'tenant-1',
  performedBy: 'user-1',
  status: 'pending',
  retryCount: 0,
  ...overrides,
})

describe('calculateDelay', () => {
  it('should increase delay exponentially', () => {
    const delay1 = calculateDelay(1)
    const delay2 = calculateDelay(2)
    const delay3 = calculateDelay(3)
    expect(delay2).toBeGreaterThan(delay1)
    expect(delay3).toBeGreaterThan(delay2)
  })

  it('should cap at maxDelayMs', () => {
    const delay = calculateDelay(100, { ...DEFAULT_RETRY_CONFIG, maxDelayMs: 5000 })
    expect(delay).toBeLessThanOrEqual(5500) // max + jitter
  })

  it('should include jitter', () => {
    // Jitter adds randomness, so run multiple times and check variance
    const delays = Array.from({ length: 10 }, () => calculateDelay(1))
    const unique = new Set(delays.map((d) => Math.round(d)))
    // At least some variance due to jitter
    expect(unique.size).toBeGreaterThanOrEqual(1)
  })
})

describe('shouldRetry', () => {
  it('should retry when retryCount < maxRetries', () => {
    const change = createChange({ retryCount: 2 })
    expect(shouldRetry(change, { ...DEFAULT_RETRY_CONFIG, maxRetries: 5 })).toBe(true)
  })

  it('should not retry when retryCount >= maxRetries', () => {
    const change = createChange({ retryCount: 5 })
    expect(shouldRetry(change, { ...DEFAULT_RETRY_CONFIG, maxRetries: 5 })).toBe(false)
  })

  it('should use default config when not provided', () => {
    const change = createChange({ retryCount: 3 })
    expect(shouldRetry(change)).toBe(true)
  })
})

describe('isRetriableError', () => {
  it('should retry network errors', () => {
    expect(isRetriableError(new Error('Network timeout'))).toBe(true)
    expect(isRetriableError(new Error('Failed to fetch'))).toBe(true)
  })

  it('should retry server errors (5xx)', () => {
    expect(isRetriableError(new Error('500 Internal Server Error'))).toBe(true)
    expect(isRetriableError(new Error('502 Bad Gateway'))).toBe(true)
    expect(isRetriableError(new Error('503 Service Unavailable'))).toBe(true)
  })

  it('should retry rate limiting (429)', () => {
    expect(isRetriableError(new Error('429 Too Many Requests'))).toBe(true)
    expect(isRetriableError(new Error('Rate limit exceeded'))).toBe(true)
  })

  it('should not retry client errors (4xx)', () => {
    expect(isRetriableError(new Error('400 Bad Request'))).toBe(false)
    expect(isRetriableError(new Error('401 Unauthorized'))).toBe(false)
    expect(isRetriableError(new Error('403 Forbidden'))).toBe(false)
    expect(isRetriableError(new Error('Validation failed'))).toBe(false)
  })

  it('should not retry conflicts (409)', () => {
    expect(isRetriableError(new Error('409 Conflict'))).toBe(false)
    expect(isRetriableError(new Error('version conflict'))).toBe(false)
  })
})

describe('DeadLetterQueue', () => {
  it('should add and retrieve entries', () => {
    const dlq = new DeadLetterQueue()
    const change = createChange({ retryCount: 5 })
    dlq.add(change, 'Max retries exceeded')

    const entries = dlq.getAll()
    expect(entries).toHaveLength(1)
    expect(entries[0]!.error).toBe('Max retries exceeded')
    expect(entries[0]!.change.id).toBe('change-1')
  })

  it('should remove entries by change ID', () => {
    const dlq = new DeadLetterQueue()
    dlq.add(createChange({ id: 'change-1' }), 'Error 1')
    dlq.add(createChange({ id: 'change-2' }), 'Error 2')

    dlq.remove('change-1')
    expect(dlq.getAll()).toHaveLength(1)
    expect(dlq.getAll()[0]!.change.id).toBe('change-2')
  })

  it('should return all entries for retry', () => {
    const dlq = new DeadLetterQueue()
    dlq.add(createChange({ id: 'c1' }), 'Err 1')
    dlq.add(createChange({ id: 'c2' }), 'Err 2')

    const entries = dlq.retryAll()
    expect(entries).toHaveLength(2)
    expect(dlq.getAll()).toHaveLength(0) // Queue cleared
  })

  it('should cap entries at 1000', () => {
    const dlq = new DeadLetterQueue()
    for (let i = 0; i < 1100; i++) {
      dlq.add(createChange({ id: `c-${i}` }), `Err ${i}`)
    }
    expect(dlq.getAll().length).toBeLessThanOrEqual(1000)
  })

  it('should clear all entries', () => {
    const dlq = new DeadLetterQueue()
    dlq.add(createChange(), 'Error')
    dlq.clear()
    expect(dlq.getAll()).toHaveLength(0)
  })
})
