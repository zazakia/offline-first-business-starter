/**
 * ─── Prescription Schema ─────────────────────────────────────
 * Medication prescription management.
 * Every prescription is linked to a patient, doctor, and medical record.
 */

import { z } from 'zod'
import { createQuerySchema, createUpdateSchema, notesSchema } from '@repo/core'

export type PrescriptionStatus = 'draft' | 'active' | 'dispensed' | 'partially_dispensed' | 'discontinued' | 'expired'
export type DosageFrequency = 'once_daily' | 'twice_daily' | 'three_times_daily' | 'four_times_daily' | 'every_4h' | 'every_6h' | 'every_8h' | 'every_12h' | 'as_needed' | 'once' | 'custom'
export type Route = 'oral' | 'sublingual' | 'intravenous' | 'intramuscular' | 'subcutaneous' | 'topical' | 'ophthalmic' | 'otic' | 'nasal' | 'inhaled' | 'rectal' | 'vaginal' | 'transdermal'

export interface Medication {
  name: string
  /** Active ingredient */
  activeIngredient?: string
  /** Strength (e.g., "500mg") */
  strength: string
  /** Form (tablet, capsule, syrup, injection, cream) */
  form: string
  /** Dosage (e.g., "1 tablet") */
  dosage: string
  /** Frequency */
  frequency: DosageFrequency
  /** Custom frequency text (when frequency is "custom") */
  customFrequency?: string
  /** Route of administration */
  route: Route
  /** Duration in days */
  durationDays: number
  /** Total quantity prescribed */
  quantity: number
  /** Special instructions */
  instructions?: string
  /** Whether generic substitution is allowed */
  allowGeneric: boolean
  /** Refills allowed */
  refills: number
  /** Whether this is a controlled substance */
  isControlled: boolean
}

export interface Prescription {
  id: string
  tenantId: string
  /** Patient ID (references Patient) */
  patientId: string
  /** Doctor ID (references Doctor) */
  doctorId: string
  /** Medical record ID (references MedicalRecord) */
  medicalRecordId?: string
  /** Appointment ID (references Appointment) */
  appointmentId?: string
  /** Status */
  status: PrescriptionStatus
  /** Medications prescribed (supports multiple meds per prescription) */
  medications: Medication[]
  /** Diagnosis for this prescription */
  diagnosis?: string
  /** Total days of treatment */
  totalDays?: number
  /** Start date */
  startDate?: number
  /** End date (calculated from start + duration) */
  endDate?: number
  /** Notes / additional instructions */
  notes?: string
  /** Whether the prescription has been printed */
  printed: boolean
  /** Digital signature of the doctor */
  digitalSignature?: string
  /** Pharmacy where dispensed */
  dispensedAt?: string
  /** When dispensed */
  dispensedDate?: number
  /** Pharmacist who dispensed */
  dispensedBy?: string
  /** Discontinuation reason */
  discontinuationReason?: string
  createdAt: number
  updatedAt: number
  deletedAt: number | null
  version: number
  createdBy: string
  updatedBy: string
}

export const PrescriptionStatusSchema = z.enum([
  'draft', 'active', 'dispensed', 'partially_dispensed', 'discontinued', 'expired',
])

export const DosageFrequencySchema = z.enum([
  'once_daily', 'twice_daily', 'three_times_daily', 'four_times_daily',
  'every_4h', 'every_6h', 'every_8h', 'every_12h',
  'as_needed', 'once', 'custom',
])

export const RouteSchema = z.enum([
  'oral', 'sublingual', 'intravenous', 'intramuscular', 'subcutaneous',
  'topical', 'ophthalmic', 'otic', 'nasal', 'inhaled',
  'rectal', 'vaginal', 'transdermal',
])

export const MedicationSchema = z.object({
  name: z.string().min(1, 'Nombre del medicamento requerido').max(300),
  activeIngredient: z.string().max(300).optional(),
  strength: z.string().min(1, 'Concentración requerida').max(100),
  form: z.string().min(1, 'Forma farmacéutica requerida').max(100),
  dosage: z.string().min(1, 'Dosis requerida').max(200),
  frequency: DosageFrequencySchema,
  customFrequency: z.string().max(200).optional(),
  route: RouteSchema,
  durationDays: z.number().int().min(1).max(365),
  quantity: z.number().int().min(1),
  instructions: z.string().max(500).optional(),
  allowGeneric: z.boolean().default(true),
  refills: z.number().int().min(0).max(12).default(0),
  isControlled: z.boolean().default(false),
})

export const CreatePrescriptionSchema = z.object({
  tenantId: z.string().min(1),
  patientId: z.string().uuid('ID de paciente requerido'),
  doctorId: z.string().uuid('ID de doctor requerido'),
  medicalRecordId: z.string().uuid().optional(),
  appointmentId: z.string().uuid().optional(),
  medications: z.array(MedicationSchema).min(1, 'Al menos un medicamento requerido'),
  diagnosis: z.string().max(500).optional(),
  totalDays: z.number().int().min(1).max(365).optional(),
  startDate: z.number().positive().optional(),
  notes: notesSchema,
})

export const UpdatePrescriptionSchema = createUpdateSchema({
  status: PrescriptionStatusSchema.optional(),
  medications: z.array(MedicationSchema).min(1).optional(),
  diagnosis: z.string().max(500).optional(),
  totalDays: z.number().int().min(1).max(365).optional(),
  startDate: z.number().positive().optional(),
  notes: notesSchema.optional(),
  printed: z.boolean().optional(),
  digitalSignature: z.string().optional(),
  dispensedAt: z.string().optional(),
  dispensedDate: z.number().optional(),
  dispensedBy: z.string().optional(),
  discontinuationReason: z.string().max(500).optional(),
})

export const PrescriptionQuerySchema = createQuerySchema({
  patientId: z.string().uuid().optional(),
  doctorId: z.string().uuid().optional(),
  status: PrescriptionStatusSchema.optional(),
  appointmentId: z.string().uuid().optional(),
})

export const PRESCRIPTION_STATUS_LABELS: Record<PrescriptionStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  dispensed: 'Dispensed',
  partially_dispensed: 'Partially Dispensed',
  discontinued: 'Discontinued',
  expired: 'Expired',
}

export const DOSAGE_FREQUENCY_LABELS: Record<DosageFrequency, string> = {
  once_daily: 'Once Daily',
  twice_daily: 'Twice Daily',
  three_times_daily: '3 Times Daily',
  four_times_daily: '4 Times Daily',
  every_4h: 'Every 4 Hours',
  every_6h: 'Every 6 Hours',
  every_8h: 'Every 8 Hours',
  every_12h: 'Every 12 Hours',
  as_needed: 'As Needed (PRN)',
  once: 'Single Dose',
  custom: 'Custom',
}

export const ROUTE_LABELS: Record<Route, string> = {
  oral: 'Oral',
  sublingual: 'Sublingual',
  intravenous: 'Intravenous (IV)',
  intramuscular: 'Intramuscular (IM)',
  subcutaneous: 'Subcutaneous (SC)',
  topical: 'Topical',
  ophthalmic: 'Ophthalmic',
  otic: 'Otic',
  nasal: 'Nasal',
  inhaled: 'Inhaled',
  rectal: 'Rectal',
  vaginal: 'Vaginal',
  transdermal: 'Transdermal',
}
