/**
 * ─── Customer Schema ─────────────────────────────────────────
 * Zod schemas for the Customer entity.
 * These define the shape, validation, and TypeScript types.
 */

import { z } from 'zod'
import {
  baseEntitySchema,
  emailSchema,
  phoneSchema,
  tagsSchema,
  statusSchema,
  notesSchema,
  createQuerySchema,
  createUpdateSchema,
} from '@repo/core'

// ─── Types ───────────────────────────────────────────────────

export type CustomerStatus = 'active' | 'inactive' | 'lead' | 'churned'

export interface Customer {
  id: string
  tenantId: string
  name: string
  email: string
  phone?: string
  company?: string
  website?: string
  status: CustomerStatus
  tags: string[]
  notes?: string
  avatar?: string
  lifetimeValue?: number
  lastContactedAt?: number
  createdAt: number
  updatedAt: number
  deletedAt: number | null
  version: number
  createdBy: string
  updatedBy: string
}

// ─── Schemas ─────────────────────────────────────────────────

export const CustomerStatusSchema = z.enum(['active', 'inactive', 'lead', 'churned'])

/**
 * Schema for creating a new customer.
 * Auto-generated fields (id, createdAt, etc.) are omitted.
 */
export const CreateCustomerSchema = z.object({
  tenantId: z.string().min(1, 'Tenant is required'),
  name: z.string().min(1, 'Name is required').max(200, 'Name too long'),
  email: emailSchema,
  phone: phoneSchema,
  company: z.string().max(200).optional(),
  website: z.string().url('Invalid URL').max(500).optional(),
  status: CustomerStatusSchema.default('active'),
  tags: tagsSchema,
  notes: notesSchema,
  avatar: z.string().url().optional(),
  lifetimeValue: z.number().min(0).optional(),
  lastContactedAt: z.number().positive().optional(),
})

/**
 * Schema for updating a customer.
 * Requires version for optimistic concurrency.
 */
export const UpdateCustomerSchema = createUpdateSchema({
  name: z.string().min(1).max(200).optional(),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  company: z.string().max(200).optional(),
  website: z.string().url().max(500).optional(),
  status: CustomerStatusSchema.optional(),
  tags: tagsSchema.optional(),
  notes: notesSchema.optional(),
  avatar: z.string().url().optional(),
  lifetimeValue: z.number().min(0).optional(),
  lastContactedAt: z.number().positive().optional(),
})

/**
 * Schema for querying customers.
 */
export const CustomerQuerySchema = createQuerySchema({
  status: CustomerStatusSchema.optional(),
  tags: z.string().optional(),
})

/**
 * Schema for CSV export / bulk import.
 */
export const CustomerImportSchema = z.array(
  z.object({
    name: z.string().min(1),
    email: emailSchema,
    phone: phoneSchema.optional(),
    company: z.string().optional(),
    status: CustomerStatusSchema.default('active'),
    tags: z.string().optional(), // Comma-separated
  })
)

// ─── Display Helpers ────────────────────────────────────────

export const CUSTOMER_STATUS_LABELS: Record<CustomerStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  lead: 'Lead',
  churned: 'Churned',
}

export const CUSTOMER_STATUS_COLORS: Record<CustomerStatus, 'green' | 'gray' | 'yellow' | 'red'> = {
  active: 'green',
  inactive: 'gray',
  lead: 'yellow',
  churned: 'red',
}
