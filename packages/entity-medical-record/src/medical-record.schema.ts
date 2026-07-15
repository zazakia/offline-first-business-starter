/**
 * ─── Medical Record Schema ───────────────────────────────────
 * Clinical encounter / visit record for a patient.
 * This is the core of the electronic health record (EHR).
 */

import { z } from 'zod'
import { createQuerySchema, createUpdateSchema, notesSchema } from '@repo/core'

export type RecordType = 'consultation' | 'emergency' | 'follow_up' | 'procedure' | 'surgery' | 'lab_result' | 'imaging_result'
export type RecordStatus = 'draft' | 'in_progress' | 'final' | 'amended' | 'cancelled'

export interface VitalSigns {
  temperature?: number    // °C
  heartRate?: number      // bpm
  respiratoryRate?: number // breaths/min
  bloodPressureSystolic?: number
  bloodPressureDiastolic?: number
  oxygenSaturation?: number // % SpO2
  weight?: number          // kg
  height?: number          // cm
  bmi?: number             // calculated
  bloodGlucose?: number    // mg/dL
  painLevel?: number       // 0-10
}

export interface MedicalRecord {
  id: string
  tenantId: string
  /** Patient ID (references Patient) */
  patientId: string
  /** Doctor ID (references Doctor) */
  doctorId: string
  /** Appointment ID (references Appointment, optional) */
  appointmentId?: string
  /** Record type */
  type: RecordType
  /** Status */
  status: RecordStatus
  /** Chief complaint (motivo de consulta) */
  chiefComplaint: string
  /** History of present illness */
  presentIllness?: string
  /** Physical examination findings */
  physicalExam?: string
  /** Vital signs snapshot */
  vitalSigns: VitalSigns
  /** Diagnosis (CIE-10 codes and descriptions) */
  diagnoses: Array<{
    code: string
    description: string
    type: 'principal' | 'secondary' | 'suspected'
  }>
  /** Treatment plan */
  treatmentPlan?: string
  /** Follow-up instructions */
  followUpInstructions?: string
  /** Lab orders placed */
  labOrders?: string[]
  /** Imaging orders placed */
  imagingOrders?: string[]
  /** Referrals to specialists */
  referrals?: Array<{
    specialty: string
    reason: string
    doctorId?: string
    priority: 'normal' | 'urgent'
  }>
  /** Attachments / documents */
  attachments?: Array<{
    name: string
    url: string
    type: string
    size: number
  }>
  /** Notes (internal, not shared with patient) */
  notes?: string
  /** Date of the encounter */
  encounterDate: number
  /** Signed off by doctor */
  signedBy?: string
  /** When signed */
  signedAt?: number
  /** Whether this record has been shared with the patient */
  sharedWithPatient: boolean
  createdAt: number
  updatedAt: number
  deletedAt: number | null
  version: number
  createdBy: string
  updatedBy: string
}

export const RecordTypeSchema = z.enum([
  'consultation', 'emergency', 'follow_up', 'procedure', 'surgery', 'lab_result', 'imaging_result',
])

export const RecordStatusSchema = z.enum(['draft', 'in_progress', 'final', 'amended', 'cancelled'])

export const VitalSignsSchema = z.object({
  temperature: z.number().min(30).max(45).optional(),
  heartRate: z.number().int().min(20).max(300).optional(),
  respiratoryRate: z.number().int().min(4).max(80).optional(),
  bloodPressureSystolic: z.number().int().min(40).max(300).optional(),
  bloodPressureDiastolic: z.number().int().min(20).max(200).optional(),
  oxygenSaturation: z.number().min(0).max(100).optional(),
  weight: z.number().min(0).max(500).optional(),
  height: z.number().min(0).max(300).optional(),
  bmi: z.number().min(0).max(100).optional(),
  bloodGlucose: z.number().min(0).max(1000).optional(),
  painLevel: z.number().int().min(0).max(10).optional(),
})

export const CreateMedicalRecordSchema = z.object({
  tenantId: z.string().min(1),
  patientId: z.string().uuid('ID de paciente requerido'),
  doctorId: z.string().uuid('ID de doctor requerido'),
  appointmentId: z.string().uuid().optional(),
  type: RecordTypeSchema.default('consultation'),
  chiefComplaint: z.string().min(1, 'Motivo de consulta requerido').max(1000),
  presentIllness: z.string().max(5000).optional(),
  physicalExam: z.string().max(5000).optional(),
  vitalSigns: VitalSignsSchema.default({}),
  diagnoses: z.array(z.object({
    code: z.string().min(1),
    description: z.string().min(1),
    type: z.enum(['principal', 'secondary', 'suspected']),
  })).default([]),
  treatmentPlan: z.string().max(5000).optional(),
  followUpInstructions: z.string().max(2000).optional(),
  labOrders: z.array(z.string().uuid()).optional(),
  imagingOrders: z.array(z.string().uuid()).optional(),
  referrals: z.array(z.object({
    specialty: z.string().min(1),
    reason: z.string().min(1),
    doctorId: z.string().uuid().optional(),
    priority: z.enum(['normal', 'urgent']),
  })).optional(),
  notes: notesSchema,
  encounterDate: z.number().positive().default(() => Date.now()),
})

export const UpdateMedicalRecordSchema = createUpdateSchema({
  type: RecordTypeSchema.optional(),
  status: RecordStatusSchema.optional(),
  chiefComplaint: z.string().min(1).max(1000).optional(),
  presentIllness: z.string().max(5000).optional(),
  physicalExam: z.string().max(5000).optional(),
  vitalSigns: VitalSignsSchema.optional(),
  diagnoses: z.array(z.object({
    code: z.string().min(1),
    description: z.string().min(1),
    type: z.enum(['principal', 'secondary', 'suspected']),
  })).optional(),
  treatmentPlan: z.string().max(5000).optional(),
  followUpInstructions: z.string().max(2000).optional(),
  labOrders: z.array(z.string().uuid()).optional(),
  imagingOrders: z.array(z.string().uuid()).optional(),
  referrals: z.array(z.object({
    specialty: z.string().min(1),
    reason: z.string().min(1),
    doctorId: z.string().uuid().optional(),
    priority: z.enum(['normal', 'urgent']),
  })).optional(),
  notes: notesSchema.optional(),
  signedBy: z.string().optional(),
  signedAt: z.number().optional(),
  sharedWithPatient: z.boolean().optional(),
})

export const MedicalRecordQuerySchema = createQuerySchema({
  patientId: z.string().uuid().optional(),
  doctorId: z.string().uuid().optional(),
  type: RecordTypeSchema.optional(),
  status: RecordStatusSchema.optional(),
  appointmentId: z.string().uuid().optional(),
})

export const RECORD_TYPE_LABELS: Record<RecordType, string> = {
  consultation: 'Consultation',
  emergency: 'Emergency',
  follow_up: 'Follow-up',
  procedure: 'Procedure',
  surgery: 'Surgery',
  lab_result: 'Lab Result',
  imaging_result: 'Imaging Result',
}

export const RECORD_STATUS_LABELS: Record<RecordStatus, string> = {
  draft: 'Draft',
  in_progress: 'In Progress',
  final: 'Final',
  amended: 'Amended',
  cancelled: 'Cancelled',
}
