/**
 * ─── Doctor Schema ───────────────────────────────────────────
 * Healthcare provider / physician entity.
 */

import { z } from 'zod'
import {
  emailSchema,
  phoneSchema,
  tagsSchema,
  statusSchema,
  notesSchema,
  createQuerySchema,
  createUpdateSchema,
} from '@repo/core'

// ─── Types ───────────────────────────────────────────────────

export type DoctorStatus = 'active' | 'inactive' | 'on_leave' | 'suspended'
export type DoctorSpecialty =
  | 'general_medicine'
  | 'internal_medicine'
  | 'pediatrics'
  | 'cardiology'
  | 'dermatology'
  | 'gastroenterology'
  | 'gynecology'
  | 'neurology'
  | 'ophthalmology'
  | 'orthopedics'
  | 'otolaryngology'
  | 'psychiatry'
  | 'pulmonology'
  | 'radiology'
  | 'urology'
  | 'oncology'
  | 'endocrinology'
  | 'nephrology'
  | 'rheumatology'
  | 'traumatology'
  | 'anesthesiology'
  | 'emergency_medicine'
  | 'surgery_general'
  | 'dentistry'
  | 'other'

export interface Doctor {
  id: string
  tenantId: string
  /** Professional license number */
  licenseNumber: string
  /** Full name with title */
  fullName: string
  /** Primary specialty */
  specialty: DoctorSpecialty
  /** Secondary specialties */
  subSpecialties: string[]
  email: string
  phone: string
  /** Office/consultation room number */
  officeNumber?: string
  /** Department ID (references Department) */
  departmentId?: string
  /** Years of experience */
  yearsOfExperience?: number
  /** University / medical school */
  education?: string
  /** Board certifications */
  certifications: string[]
  /** Languages spoken */
  languages: string[]
  /** Consultation duration in minutes (default) */
  defaultConsultDuration: number
  /** Consultation fee (base) */
  consultationFee?: number
  /** Maximum patients per day */
  maxPatientsPerDay?: number
  /** Available days of week (0=Sun, 1=Mon, ..., 6=Sat) */
  availableDays: number[]
  /** Working hours start (HH:mm, 24h) */
  workHoursStart?: string
  /** Working hours end (HH:mm, 24h) */
  workHoursEnd?: string
  status: DoctorStatus
  notes?: string
  tags: string[]
  /** Photo/avatar URL */
  photoUrl?: string
  /** Average patient rating (1-5) */
  rating?: number
  /** Total consultations completed */
  totalConsultations: number
  createdAt: number
  updatedAt: number
  deletedAt: number | null
  version: number
  createdBy: string
  updatedBy: string
}

// ─── Schemas ─────────────────────────────────────────────────

export const DoctorStatusSchema = z.enum(['active', 'inactive', 'on_leave', 'suspended'])

export const DoctorSpecialtySchema = z.enum([
  'general_medicine', 'internal_medicine', 'pediatrics', 'cardiology',
  'dermatology', 'gastroenterology', 'gynecology', 'neurology',
  'ophthalmology', 'orthopedics', 'otolaryngology', 'psychiatry',
  'pulmonology', 'radiology', 'urology', 'oncology',
  'endocrinology', 'nephrology', 'rheumatology', 'traumatology',
  'anesthesiology', 'emergency_medicine', 'surgery_general', 'dentistry',
  'other',
])

export const CreateDoctorSchema = z.object({
  tenantId: z.string().min(1),
  licenseNumber: z.string().min(1, 'Número de cédula requerido').max(50),
  fullName: z.string().min(1, 'Nombre requerido').max(200),
  specialty: DoctorSpecialtySchema,
  subSpecialties: z.array(z.string()).default([]),
  email: emailSchema,
  phone: phoneSchema,
  officeNumber: z.string().max(50).optional(),
  departmentId: z.string().uuid().optional(),
  yearsOfExperience: z.number().int().min(0).optional(),
  education: z.string().max(500).optional(),
  certifications: z.array(z.string()).default([]),
  languages: z.array(z.string()).default(['es']),
  defaultConsultDuration: z.number().int().min(5).max(120).default(30),
  consultationFee: z.number().min(0).optional(),
  maxPatientsPerDay: z.number().int().min(1).max(100).optional(),
  availableDays: z.array(z.number().int().min(0).max(6)).default([1, 2, 3, 4, 5]),
  workHoursStart: z.string().regex(/^\d{2}:\d{2}$/).optional().default('08:00'),
  workHoursEnd: z.string().regex(/^\d{2}:\d{2}$/).optional().default('17:00'),
  status: DoctorStatusSchema.default('active'),
  notes: notesSchema,
  tags: tagsSchema,
  photoUrl: z.string().url().optional(),
})

export const UpdateDoctorSchema = createUpdateSchema({
  licenseNumber: z.string().min(1).max(50).optional(),
  fullName: z.string().min(1).max(200).optional(),
  specialty: DoctorSpecialtySchema.optional(),
  subSpecialties: z.array(z.string()).optional(),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  officeNumber: z.string().max(50).optional(),
  departmentId: z.string().uuid().optional(),
  yearsOfExperience: z.number().int().min(0).optional(),
  education: z.string().max(500).optional(),
  certifications: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  defaultConsultDuration: z.number().int().min(5).max(120).optional(),
  consultationFee: z.number().min(0).optional(),
  maxPatientsPerDay: z.number().int().min(1).max(100).optional(),
  availableDays: z.array(z.number().int().min(0).max(6)).optional(),
  workHoursStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  workHoursEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  status: DoctorStatusSchema.optional(),
  notes: notesSchema.optional(),
  tags: tagsSchema.optional(),
  photoUrl: z.string().url().optional(),
})

export const DoctorQuerySchema = createQuerySchema({
  status: DoctorStatusSchema.optional(),
  specialty: DoctorSpecialtySchema.optional(),
  departmentId: z.string().uuid().optional(),
})

// ─── Display Helpers ─────────────────────────────────────────

export const DOCTOR_STATUS_LABELS: Record<DoctorStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  on_leave: 'On Leave',
  suspended: 'Suspended',
}

export const DOCTOR_SPECIALTY_LABELS: Record<DoctorSpecialty, string> = {
  general_medicine: 'General Medicine',
  internal_medicine: 'Internal Medicine',
  pediatrics: 'Pediatrics',
  cardiology: 'Cardiology',
  dermatology: 'Dermatology',
  gastroenterology: 'Gastroenterology',
  gynecology: 'Gynecology',
  neurology: 'Neurology',
  ophthalmology: 'Ophthalmology',
  orthopedics: 'Orthopedics',
  otolaryngology: 'Otolaryngology',
  psychiatry: 'Psychiatry',
  pulmonology: 'Pulmonology',
  radiology: 'Radiology',
  urology: 'Urology',
  oncology: 'Oncology',
  endocrinology: 'Endocrinology',
  nephrology: 'Nephrology',
  rheumatology: 'Rheumatology',
  traumatology: 'Traumatology',
  anesthesiology: 'Anesthesiology',
  emergency_medicine: 'Emergency Medicine',
  surgery_general: 'General Surgery',
  dentistry: 'Dentistry',
  other: 'Other',
}

export const DOCTOR_STATUS_COLORS: Record<DoctorStatus, 'green' | 'gray' | 'yellow' | 'red'> = {
  active: 'green',
  inactive: 'gray',
  on_leave: 'yellow',
  suspended: 'red',
}
