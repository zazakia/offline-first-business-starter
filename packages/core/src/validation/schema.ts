/**
 * ─── Schema Utilities ────────────────────────────────────────
 * Zod-based schema helpers for entity validation.
 */

import { z } from 'zod'
import type { EntityId, TimestampMillis } from '../types'

/** UUID v4 pattern */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/** Entity ID validation */
export const entityIdSchema = z.string().uuid('Must be a valid UUID').regex(UUID_REGEX)

/** Timestamp validation (milliseconds since epoch) */
export const timestampSchema = z.number().int().positive('Timestamp must be a positive integer')

/** Email validation */
export const emailSchema = z.string().email('Invalid email address').max(255).toLowerCase().trim()

/** Phone validation (loose — accepts international formats) */
export const phoneSchema = z.string().max(30).regex(/^[+\d][\d\s\-().]{4,29}$/, 'Invalid phone number').optional()

/** URL validation */
export const urlSchema = z.string().url('Invalid URL').max(2048).optional()

/** Base entity fields (auto-generated, should never come from user input) */
export const baseEntitySchema = z.object({
  id: entityIdSchema,
  tenantId: z.string().min(1),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  deletedAt: timestampSchema.nullable(),
  version: z.number().int().positive(),
  createdBy: z.string().min(1),
  updatedBy: z.string().min(1),
})

/** Tags field (common across many entities) */
export const tagsSchema = z.array(z.string().max(100)).max(20).default([])

/** Status enum (common across many entities) */
export const statusSchema = z.enum(['active', 'inactive', 'archived']).default('active')

/** Notes field (common) */
export const notesSchema = z.string().max(5000).optional()

/**
 * Helper to create a pagination query schema.
 */
export function createQuerySchema<T extends z.ZodRawShape>(filterFields: T) {
  return z.object({
    cursor: z.string().optional(),
    limit: z.number().int().min(1).max(500).default(50),
    filter: z.array(
      z.object({
        field: z.string(),
        operator: z.enum(['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in', 'nin', 'contains', 'startsWith', 'endsWith', 'between']),
        value: z.unknown(),
      })
    ).optional(),
    sort: z.array(
      z.object({
        field: z.string(),
        direction: z.enum(['asc', 'desc']),
      })
    ).optional(),
    search: z.string().max(200).optional(),
    includeDeleted: z.boolean().optional(),
  })
}

/**
 * Helper to extract a typed entity ID from params.
 */
export function parseEntityId(value: unknown): EntityId {
  return entityIdSchema.parse(value)
}

/**
 * Helper to create update schema with version requirement.
 */
export function createUpdateSchema<T extends z.ZodRawShape>(fields: T) {
  return z.object({
    ...fields,
    version: z.number().int().positive('Version is required for optimistic concurrency'),
  }).partial().refine((data) => Object.keys(data).length > 1, {
    message: 'At least one field besides version must be provided',
  })
}
