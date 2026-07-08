/**
 * ─── Retry Engine ────────────────────────────────────────────
 * Exponential backoff with jitter for sync operations.
 * Includes dead letter queue for permanently failed changes.
 */

import type { ChangeLogEntry, TimestampMillis } from '@repo/core'

export interface RetryConfig {
  maxRetries: number
  baseDelayMs: number
  maxDelayMs: number
  jitterMs: number
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 5,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  jitterMs: 500,
}

export interface DeadLetterEntry {
  change: ChangeLogEntry
  failedAt: TimestampMillis
  error: string
  retryCount: number
}

/**
 * Calculate delay with exponential backoff and jitter.
 */
export function calculateDelay(
  attempt: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
): number {
  const exponentialDelay = config.baseDelayMs * Math.pow(2, attempt - 1)
  const clampedDelay = Math.min(exponentialDelay, config.maxDelayMs)
  const jitter = Math.random() * config.jitterMs
  return clampedDelay + jitter
}

/**
 * Determine if a change should be retried based on retry count.
 */
export function shouldRetry(
  change: ChangeLogEntry,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
): boolean {
  return change.retryCount < config.maxRetries
}

/**
 * Classify errors as retriable or not.
 */
export function isRetriableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    // Network errors are retriable
    if (message.includes('network') || message.includes('timeout') || message.includes('fetch')) {
      return true
    }
    // Server errors (5xx) are retriable
    if (message.includes('500') || message.includes('502') || message.includes('503') || message.includes('504')) {
      return true
    }
    // Rate limiting is retriable
    if (message.includes('429') || message.includes('rate limit')) {
      return true
    }
    // Conflict errors are NOT retriable — they need resolution
    if (message.includes('409') || message.includes('conflict') || message.includes('version')) {
      return false
    }
    // Validation errors are NOT retriable
    if (message.includes('400') || message.includes('validation')) {
      return false
    }
    // Auth errors are NOT retriable
    if (message.includes('401') || message.includes('403') || message.includes('auth')) {
      return false
    }
  }
  // Default: retry
  return true
}

/**
 * Dead letter queue for permanently failed changes.
 */
export class DeadLetterQueue {
  private entries: DeadLetterEntry[] = []

  add(change: ChangeLogEntry, error: string): void {
    this.entries.push({
      change,
      failedAt: Date.now(),
      error,
      retryCount: change.retryCount,
    })
    // Keep only last 1000 entries
    if (this.entries.length > 1000) {
      this.entries.shift()
    }
  }

  getAll(): DeadLetterEntry[] {
    return [...this.entries]
  }

  getUnresolved(): DeadLetterEntry[] {
    return this.entries
  }

  remove(changeId: string): void {
    this.entries = this.entries.filter((e) => e.change.id !== changeId)
  }

  clear(): void {
    this.entries = []
  }

  retryAll(): DeadLetterEntry[] {
    const toRetry = [...this.entries]
    this.entries = []
    return toRetry
  }
}
