/**
 * ─── Typed Error Hierarchy ───────────────────────────────────
 * Every error that can occur in the system is typed and structured.
 * No more guessing what went wrong.
 */

export type ErrorCode = 
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'AUTH_ERROR'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'SYNC_ERROR'
  | 'DATA_INTEGRITY_ERROR'
  | 'RATE_LIMIT_ERROR'
  | 'TENANT_MISMATCH'
  | 'DB_ERROR'
  | 'NETWORK_ERROR'
  | 'INTERNAL_ERROR'

export class AppError extends Error {
  public readonly timestamp: number

  constructor(
    message: string,
    public readonly code: ErrorCode,
    public readonly statusCode: number = 500,
    public readonly metadata?: Record<string, unknown>,
  ) {
    super(message)
    this.name = this.constructor.name
    this.timestamp = Date.now()
    Object.setPrototypeOf(this, new.target.prototype)
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      metadata: this.metadata,
    }
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    public readonly issues: Array<{ path: string; message: string; code: string }>,
    metadata?: Record<string, unknown>,
  ) {
    super(message, 'VALIDATION_ERROR', 400, { ...metadata, issues })
  }
}

export class NotFoundError extends AppError {
  constructor(entityType: string, id: string, metadata?: Record<string, unknown>) {
    super(`${entityType} with id "${id}" not found`, 'NOT_FOUND', 404, { entityType, id, ...metadata })
  }
}

export class AuthError extends AppError {
  constructor(message = 'Authentication required', metadata?: Record<string, unknown>) {
    super(message, 'AUTH_ERROR', 401, metadata)
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied', metadata?: Record<string, unknown>) {
    super(message, 'FORBIDDEN', 403, metadata)
  }
}

export class ConflictError extends AppError {
  constructor(
    entityType: string,
    entityId: string,
    localVersion: number,
    remoteVersion: number,
    metadata?: Record<string, unknown>,
  ) {
    super(
      `Concurrent modification: ${entityType} "${entityId}" version ${localVersion} vs server ${remoteVersion}`,
      'CONFLICT',
      409,
      { entityType, entityId, localVersion, remoteVersion, ...metadata },
    )
  }
}

export class SyncError extends AppError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, 'SYNC_ERROR', 500, metadata)
  }
}

export class DataIntegrityError extends AppError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, 'DATA_INTEGRITY_ERROR', 500, metadata)
  }
}

export class NetworkError extends AppError {
  constructor(message = 'Network request failed', metadata?: Record<string, unknown>) {
    super(message, 'NETWORK_ERROR', 0, metadata)
  }
}

export class TenantMismatchError extends AppError {
  constructor(entityType: string, entityId: string, tenantId: string) {
    super(
      `Tenant mismatch on ${entityType} "${entityId}"`,
      'TENANT_MISMATCH',
      403,
      { entityType, entityId, tenantId },
    )
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, 'DB_ERROR', 500, metadata)
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfterMs: number, metadata?: Record<string, unknown>) {
    super('Rate limit exceeded', 'RATE_LIMIT_ERROR', 429, { retryAfterMs, ...metadata })
  }
}
