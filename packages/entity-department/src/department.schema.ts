/**
 * ─── Department Schema ───────────────────────────────────────
 * Hospital / clinic departments and service areas.
 */

import { z } from 'zod'
import { createQuerySchema, createUpdateSchema, notesSchema } from '@repo/core'

export type DepartmentType = 'clinical' | 'administrative' | 'diagnostic' | 'support' | 'pharmacy' | 'emergency' | 'surgery' | 'inpatient' | 'outpatient' | 'other'

export interface Department {
  id: string
  tenantId: string
  /** Department name */
  name: string
  /** Department code (short identifier) */
  code: string
  /** Type */
  type: DepartmentType
  /** Description */
  description?: string
  /** Floor number */
  floor?: string
  /** Building / wing */
  building?: string
  /** Phone extension */
  phoneExtension?: string
  /** Head of department (Doctor ID) */
  headDoctorId?: string
  /** Parent department ID for hierarchy */
  parentDepartmentId?: string
  /** Operating hours start (HH:mm) */
  operatingHoursStart?: string
  /** Operating hours end (HH:mm) */
  operatingHoursEnd?: string
  /** Whether department operates 24/7 */
  is24x7: boolean
  /** Number of consultation rooms */
  roomCount: number
  /** Whether this department is active */
  isActive: boolean
  /** Notes */
  notes?: string
  /** Emoji or icon for display */
  icon?: string
  createdAt: number
  updatedAt: number
  deletedAt: number | null
  version: number
  createdBy: string
  updatedBy: string
}

export const DepartmentTypeSchema = z.enum([
  'clinical', 'administrative', 'diagnostic', 'support', 'pharmacy',
  'emergency', 'surgery', 'inpatient', 'outpatient', 'other',
])

export const CreateDepartmentSchema = z.object({
  tenantId: z.string().min(1),
  name: z.string().min(1, 'Nombre requerido').max(200),
  code: z.string().min(1, 'Código requerido').max(20).toUpperCase(),
  type: DepartmentTypeSchema,
  description: z.string().max(500).optional(),
  floor: z.string().max(50).optional(),
  building: z.string().max(100).optional(),
  phoneExtension: z.string().max(20).optional(),
  headDoctorId: z.string().uuid().optional(),
  parentDepartmentId: z.string().uuid().optional(),
  operatingHoursStart: z.string().regex(/^\d{2}:\d{2}$/).optional().default('08:00'),
  operatingHoursEnd: z.string().regex(/^\d{2}:\d{2}$/).optional().default('17:00'),
  is24x7: z.boolean().default(false),
  roomCount: z.number().int().min(0).default(1),
  isActive: z.boolean().default(true),
  icon: z.string().max(50).optional(),
  notes: notesSchema,
})

export const UpdateDepartmentSchema = createUpdateSchema({
  name: z.string().min(1).max(200).optional(),
  code: z.string().min(1).max(20).optional(),
  type: DepartmentTypeSchema.optional(),
  description: z.string().max(500).optional(),
  floor: z.string().max(50).optional(),
  building: z.string().max(100).optional(),
  phoneExtension: z.string().max(20).optional(),
  headDoctorId: z.string().uuid().optional(),
  parentDepartmentId: z.string().uuid().optional(),
  operatingHoursStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  operatingHoursEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  is24x7: z.boolean().optional(),
  roomCount: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  icon: z.string().max(50).optional(),
  notes: notesSchema.optional(),
})

export const DepartmentQuerySchema = createQuerySchema({
  type: DepartmentTypeSchema.optional(),
  isActive: z.boolean().optional(),
  parentDepartmentId: z.string().uuid().optional(),
})

export const DEPARTMENT_TYPE_LABELS: Record<DepartmentType, string> = {
  clinical: 'Clinical',
  administrative: 'Administrative',
  diagnostic: 'Diagnostic',
  support: 'Support',
  pharmacy: 'Pharmacy',
  emergency: 'Emergency',
  surgery: 'Surgery',
  inpatient: 'Inpatient',
  outpatient: 'Outpatient',
  other: 'Other',
}

export const DEPARTMENT_TYPE_ICONS: Record<DepartmentType, string> = {
  clinical: 'Stethoscope',
  administrative: 'Building2',
  diagnostic: 'Microscope',
  support: 'Wrench',
  pharmacy: 'Pill',
  emergency: 'Siren',
  surgery: 'Scalpel',
  inpatient: 'Bed',
  outpatient: 'Users',
  other: 'Folder',
}
