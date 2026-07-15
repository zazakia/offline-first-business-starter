/**
 * ─── Patient Schema ──────────────────────────────────────────
 * Zod schemas for the Patient entity.
 * Every patient is a person receiving healthcare services.
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

export type PatientStatus = 'active' | 'inactive' | 'deceased' | 'transferred'
export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-'
export type Gender = 'male' | 'female' | 'other' | 'undisclosed'

export interface Patient {
  id: string
  tenantId: string
  /** Patient's full legal name */
  fullName: string
  /** Preferred/nickname */
  preferredName?: string
  /** Date of birth (ISO 8601 date string) */
  dateOfBirth: string
  gender: Gender
  /** National ID / SSN (encrypted at rest) */
  nationalId?: string
  email: string
  phone: string
  /** Emergency contact info */
  emergencyContactName?: string
  emergencyContactPhone?: string
  emergencyContactRelation?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
  /** Medical identifiers */
  bloodType?: BloodType
  /** Known allergies (free text, searchable) */
  allergies?: string
  /** Chronic conditions (free text) */
  chronicConditions?: string
  /** Current medications (free text) */
  currentMedications?: string
  /** Primary care physician ID (references Doctor) */
  primaryDoctorId?: string
  /** Insurance provider name */
  insuranceProvider?: string
  /** Insurance policy number */
  insurancePolicyNumber?: string
  /** Insurance group number */
  insuranceGroupNumber?: string
  /** Marital status */
  maritalStatus?: string
  /** Occupation */
  occupation?: string
  /** Preferred language for communication */
  preferredLanguage?: string
  /** Patient status */
  status: PatientStatus
  /** Clinical notes */
  notes?: string
  /** Tags for categorization (e.g., "vip", "diabetic", "pediatric") */
  tags: string[]
  /** Profile photo URL */
  photoUrl?: string
  /** Last visit date */
  lastVisitDate?: number
  createdAt: number
  updatedAt: number
  deletedAt: number | null
  version: number
  createdBy: string
  updatedBy: string
}

// ─── Schemas ─────────────────────────────────────────────────

export const PatientStatusSchema = z.enum(['active', 'inactive', 'deceased', 'transferred'])
export const BloodTypeSchema = z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
export const GenderSchema = z.enum(['male', 'female', 'other', 'undisclosed'])

export const CreatePatientSchema = z.object({
  tenantId: z.string().min(1, 'Tenant is required'),
  fullName: z.string().min(1, 'Full name is required').max(200, 'Name too long'),
  preferredName: z.string().max(100).optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  gender: GenderSchema,
  nationalId: z.string().max(50).optional(),
  email: emailSchema.optional(),
  phone: phoneSchema,
  emergencyContactName: z.string().max(200).optional(),
  emergencyContactPhone: phoneSchema.optional(),
  emergencyContactRelation: z.string().max(100).optional(),
  addressLine1: z.string().max(300).optional(),
  addressLine2: z.string().max(300).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().max(100).optional().default('MX'),
  bloodType: BloodTypeSchema.optional(),
  allergies: z.string().max(2000).optional(),
  chronicConditions: z.string().max(2000).optional(),
  currentMedications: z.string().max(2000).optional(),
  primaryDoctorId: z.string().uuid().optional(),
  insuranceProvider: z.string().max(200).optional(),
  insurancePolicyNumber: z.string().max(100).optional(),
  insuranceGroupNumber: z.string().max(100).optional(),
  maritalStatus: z.string().max(50).optional(),
  occupation: z.string().max(200).optional(),
  preferredLanguage: z.string().max(50).optional().default('es'),
  status: PatientStatusSchema.default('active'),
  notes: notesSchema,
  tags: tagsSchema,
  photoUrl: z.string().url().optional(),
})

export const UpdatePatientSchema = createUpdateSchema({
  fullName: z.string().min(1).max(200).optional(),
  preferredName: z.string().max(100).optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  gender: GenderSchema.optional(),
  nationalId: z.string().max(50).optional(),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  emergencyContactName: z.string().max(200).optional(),
  emergencyContactPhone: phoneSchema.optional(),
  emergencyContactRelation: z.string().max(100).optional(),
  addressLine1: z.string().max(300).optional(),
  addressLine2: z.string().max(300).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().max(100).optional(),
  bloodType: BloodTypeSchema.optional(),
  allergies: z.string().max(2000).optional(),
  chronicConditions: z.string().max(2000).optional(),
  currentMedications: z.string().max(2000).optional(),
  primaryDoctorId: z.string().uuid().optional(),
  insuranceProvider: z.string().max(200).optional(),
  insurancePolicyNumber: z.string().max(100).optional(),
  insuranceGroupNumber: z.string().max(100).optional(),
  maritalStatus: z.string().max(50).optional(),
  occupation: z.string().max(200).optional(),
  preferredLanguage: z.string().max(50).optional(),
  status: PatientStatusSchema.optional(),
  notes: notesSchema.optional(),
  tags: tagsSchema.optional(),
  photoUrl: z.string().url().optional(),
})

export const PatientQuerySchema = createQuerySchema({
  status: PatientStatusSchema.optional(),
  gender: GenderSchema.optional(),
  bloodType: BloodTypeSchema.optional(),
  primaryDoctorId: z.string().uuid().optional(),
  tags: z.string().optional(),
})

// ─── Display Helpers ─────────────────────────────────────────

export const PATIENT_STATUS_LABELS: Record<PatientStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  deceased: 'Deceased',
  transferred: 'Transferred',
}

export const PATIENT_STATUS_COLORS: Record<PatientStatus, 'green' | 'gray' | 'red' | 'yellow'> = {
  active: 'green',
  inactive: 'gray',
  deceased: 'red',
  transferred: 'yellow',
}

export const BLOOD_TYPE_LABELS: Record<BloodType, string> = {
  'A+': 'A+', 'A-': 'A-',
  'B+': 'B+', 'B-': 'B-',
  'AB+': 'AB+', 'AB-': 'AB-',
  'O+': 'O+', 'O-': 'O-',
}

export const GENDER_LABELS: Record<Gender, string> = {
  male: 'Male',
  female: 'Female',
  other: 'Other',
  undisclosed: 'Undisclosed',
}
