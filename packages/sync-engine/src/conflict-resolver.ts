/**
 * ─── Conflict Resolution ────────────────────────────────────
 * Pluggable conflict resolution strategies.
 * Each entity can use a different strategy.
 */

import type { ConflictStrategyType, BaseEntity, SyncConflict } from '@repo/core'

export interface ConflictResolver<T extends BaseEntity = BaseEntity> {
  /** Resolve a conflict between local and remote versions */
  resolve(
    local: T,
    remote: T,
    base: T,
    strategy: ConflictStrategyType,
  ): { resolution: 'local' | 'remote' | 'custom'; data: Partial<T> }
}

/**
 * Last-writer-wins: takes the version with the latest updatedAt timestamp.
 * Fastest, safest for non-critical data.
 */
function lwwResolve<T extends BaseEntity>(local: T, remote: T): { resolution: 'local' | 'remote'; data: Partial<T> } {
  if (local.updatedAt >= remote.updatedAt) {
    return { resolution: 'local', data: local }
  }
  return { resolution: 'remote', data: remote }
}

/**
 * Per-field merge: for each field, take the most recently modified value.
 * More granular than LWW, good for forms with independent fields.
 */
function perFieldResolve<T extends BaseEntity>(local: T, remote: T, base: T): { resolution: 'custom'; data: Partial<T> } {
  const merged: Record<string, unknown> = {}
  
  const fields = new Set([
    ...Object.keys(local),
    ...Object.keys(remote),
  ])

  for (const field of fields) {
    // Skip internal fields
    if (['id', 'tenantId', 'version', 'createdAt', 'createdBy'].includes(field)) continue

    const localVal = (local as any)[field]
    const remoteVal = (remote as any)[field]
    const baseVal = (base as any)[field]

    if (localVal === remoteVal) {
      // Same value — take either
      merged[field] = localVal
    } else if (localVal === baseVal) {
      // Only remote changed — take remote
      merged[field] = remoteVal
    } else if (remoteVal === baseVal) {
      // Only local changed — take local
      merged[field] = localVal
    } else {
      // Both changed — take the one with later timestamp
      // (In a real system, you'd track per-field timestamps)
      merged[field] = local.updatedAt >= remote.updatedAt ? localVal : remoteVal
    }
  }

  return {
    resolution: 'custom',
    data: merged as Partial<T>,
  }
}

/**
 * Default conflict resolver using the configured strategy.
 */
export class DefaultConflictResolver<T extends BaseEntity> implements ConflictResolver<T> {
  resolve(
    local: T,
    remote: T,
    base: T,
    strategy: ConflictStrategyType,
  ): { resolution: 'local' | 'remote' | 'custom'; data: Partial<T> } {
    switch (strategy) {
      case 'lww':
        return lwwResolve(local, remote)
      case 'per-field':
        return perFieldResolve(local, remote, base)
      case 'manual':
        // Manual resolution — return both versions for user to decide
        throw new ManualConflictError(local, remote, base)
      case 'crdt':
        // CRDT-based merge (simplified — real CRDT needs per-field LWW registers)
        return perFieldResolve(local, remote, base)
      default:
        return lwwResolve(local, remote)
    }
  }
}

export class ManualConflictError<T> extends Error {
  constructor(
    public readonly local: T,
    public readonly remote: T,
    public readonly base: T,
  ) {
    super('Manual conflict resolution required')
    this.name = 'ManualConflictError'
  }
}
