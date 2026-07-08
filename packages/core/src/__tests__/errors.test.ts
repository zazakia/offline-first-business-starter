import { describe, it, expect } from 'vitest'
import {
  AppError,
  ValidationError,
  NotFoundError,
  AuthError,
  ForbiddenError,
  ConflictError,
  SyncError,
  DataIntegrityError,
  NetworkError,
  TenantMismatchError,
  DatabaseError,
  RateLimitError,
} from '../errors'

describe('AppError', () => {
  it('should create a base error with correct properties', () => {
    const error = new AppError('Test error', 'INTERNAL_ERROR', 500, { key: 'value' })
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toBe('Test error')
    expect(error.code).toBe('INTERNAL_ERROR')
    expect(error.statusCode).toBe(500)
    expect(error.metadata).toEqual({ key: 'value' })
    expect(error.timestamp).toBeGreaterThan(0)
  })

  it('should serialize to JSON correctly', () => {
    const error = new AppError('JSON test', 'VALIDATION_ERROR', 400)
    const json = error.toJSON()
    expect(json.code).toBe('VALIDATION_ERROR')
    expect(json.message).toBe('JSON test')
    expect(json.statusCode).toBe(400)
  })
})

describe('ValidationError', () => {
  it('should include validation issues', () => {
    const issues = [
      { path: 'name', message: 'Name is required', code: 'required' },
      { path: 'email', message: 'Invalid email', code: 'invalid_string' },
    ]
    const error = new ValidationError('Validation failed', issues)
    expect(error.code).toBe('VALIDATION_ERROR')
    expect(error.statusCode).toBe(400)
    expect(error.issues).toHaveLength(2)
    expect(error.issues[0]!.path).toBe('name')
  })
})

describe('NotFoundError', () => {
  it('should format message with entity type and id', () => {
    const error = new NotFoundError('Customer', 'abc-123')
    expect(error.message).toContain('Customer')
    expect(error.message).toContain('abc-123')
    expect(error.statusCode).toBe(404)
    expect(error.code).toBe('NOT_FOUND')
  })
})

describe('AuthError', () => {
  it('should have 401 status', () => {
    const error = new AuthError()
    expect(error.statusCode).toBe(401)
    expect(error.code).toBe('AUTH_ERROR')
  })

  it('should accept custom message', () => {
    const error = new AuthError('Token expired')
    expect(error.message).toBe('Token expired')
  })
})

describe('ForbiddenError', () => {
  it('should have 403 status', () => {
    const error = new ForbiddenError()
    expect(error.statusCode).toBe(403)
    expect(error.code).toBe('FORBIDDEN')
  })
})

describe('ConflictError', () => {
  it('should include version information', () => {
    const error = new ConflictError('Customer', 'abc-123', 1, 3)
    expect(error.message).toContain('abc-123')
    expect(error.message).toContain('1')
    expect(error.message).toContain('3')
    expect(error.statusCode).toBe(409)
    expect(error.code).toBe('CONFLICT')
  })
})

describe('SyncError', () => {
  it('should have 500 status', () => {
    const error = new SyncError('Push failed')
    expect(error.statusCode).toBe(500)
    expect(error.code).toBe('SYNC_ERROR')
  })
})

describe('DataIntegrityError', () => {
  it('should have descriptive message', () => {
    const error = new DataIntegrityError('Checksum mismatch on entity')
    expect(error.message).toContain('Checksum')
    expect(error.code).toBe('DATA_INTEGRITY_ERROR')
  })
})

describe('NetworkError', () => {
  it('should have status 0 (no HTTP status)', () => {
    const error = new NetworkError()
    expect(error.statusCode).toBe(0)
    expect(error.code).toBe('NETWORK_ERROR')
  })

  it('should accept custom message', () => {
    const error = new NetworkError('Connection timed out')
    expect(error.message).toBe('Connection timed out')
  })
})

describe('TenantMismatchError', () => {
  it('should include entity and tenant details', () => {
    const error = new TenantMismatchError('Customer', 'abc', 'tenant-1')
    expect(error.message).toContain('Customer')
    expect(error.message).toContain('abc')
    expect(error.metadata).toEqual({ entityType: 'Customer', entityId: 'abc', tenantId: 'tenant-1' })
    expect(error.statusCode).toBe(403)
    expect(error.code).toBe('TENANT_MISMATCH')
  })
})

describe('DatabaseError', () => {
  it('should wrap database failures', () => {
    const error = new DatabaseError('Connection pool exhausted', { poolSize: 10 })
    expect(error.code).toBe('DB_ERROR')
    expect(error.metadata).toEqual({ poolSize: 10 })
  })
})

describe('RateLimitError', () => {
  it('should include retry delay', () => {
    const error = new RateLimitError(5000)
    expect(error.message).toContain('Rate limit')
    expect(error.statusCode).toBe(429)
    expect(error.metadata).toEqual({ retryAfterMs: 5000 })
  })
})
