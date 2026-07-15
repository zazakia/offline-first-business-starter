/**
 * ─── Appointment Schema ──────────────────────────────────────
 * Appointment scheduling for patients with doctors.
 */

import { z } from 'zod'
import { createQuerySchema, createUpdateSchema, notesSchema } from '@repo/core'

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
export type AppointmentType = 'consultation' | 'follow_up' | 'emergency' | 'procedure' | 'surgery' | 'lab' | 'imaging' | 'vaccination' | 'other'

export interface Appointment {
  id: string
  tenantId: string
  /** Patient ID (references Patient) */
  patientId: string
  /** Doctor ID (references Doctor) */
  doctorId: string
  /** Appointment type */
  type: AppointmentType
  /** Scheduled start time (timestamp ms) */
  scheduledStart: number
  /** Scheduled end time (timestamp ms) */
  scheduledEnd: number
  /** Actual start time (when patient arrived) */
  actualStart?: number
  /** Actual end time */
  actualEnd?: number
  /** Duration in minutes */
  durationMinutes: number
  /** Reason for visit (chief complaint) */
  reason: string
  /** Status */
  status: AppointmentStatus
  /** Notes / special instructions */
  notes?: string
  /** Priority: used for triage */
  priority: 'normal' | 'urgent' | 'emergency'
  /** Whether this is a recurring appointment */
  isRecurring: boolean
  /** Recurring rule (RRULE string, optional) */
  recurringRule?: string
  /** Parent recurring appointment ID */
  recurringParentId?: string
  /** Room/consultation room */
  room?: string
  /** Confirmation method (SMS, email, call, in_person) */
  confirmationMethod?: string
  /** When the patient was reminded */
  remindedAt?: number
  /** Cancellation reason */
  cancellationReason?: string
  /** Cancelled by user ID */
  cancelledBy?: string
  createdAt: number
  updatedAt: number
  deletedAt: number | null
  version: number
  createdBy: string
  updatedBy: string
}

export const AppointmentStatusSchema = z.enum([
  'scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show',
])

export const AppointmentTypeSchema = z.enum([
  'consultation', 'follow_up', 'emergency', 'procedure', 'surgery',
  'lab', 'imaging', 'vaccination', 'other',
])

export const CreateAppointmentSchema = z.object({
  tenantId: z.string().min(1),
  patientId: z.string().uuid('ID de paciente inválido'),
  doctorId: z.string().uuid('ID de doctor inválido'),
  type: AppointmentTypeSchema.default('consultation'),
  scheduledStart: z.number().positive('Fecha de inicio requerida'),
  scheduledEnd: z.number().positive('Fecha de fin requerida'),
  durationMinutes: z.number().int().min(5).max(480).default(30),
  reason: z.string().min(1, 'Motivo de consulta requerido').max(500),
  notes: notesSchema,
  priority: z.enum(['normal', 'urgent', 'emergency']).default('normal'),
  isRecurring: z.boolean().default(false),
  recurringRule: z.string().optional(),
  room: z.string().max(50).optional(),
  confirmationMethod: z.enum(['sms', 'email', 'call', 'in_person']).optional(),
})

export const UpdateAppointmentSchema = createUpdateSchema({
  doctorId: z.string().uuid().optional(),
  type: AppointmentTypeSchema.optional(),
  scheduledStart: z.number().positive().optional(),
  scheduledEnd: z.number().positive().optional(),
  durationMinutes: z.number().int().min(5).max(480).optional(),
  reason: z.string().min(1).max(500).optional(),
  status: AppointmentStatusSchema.optional(),
  notes: notesSchema.optional(),
  priority: z.enum(['normal', 'urgent', 'emergency']).optional(),
  actualStart: z.number().positive().optional(),
  actualEnd: z.number().positive().optional(),
  room: z.string().max(50).optional(),
  cancellationReason: z.string().max(500).optional(),
  cancelledBy: z.string().optional(),
})

export const AppointmentQuerySchema = createQuerySchema({
  patientId: z.string().uuid().optional(),
  doctorId: z.string().uuid().optional(),
  status: AppointmentStatusSchema.optional(),
  type: AppointmentTypeSchema.optional(),
  scheduledStart: z.number().optional(),
  scheduledEnd: z.number().optional(),
})

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled: 'Scheduled',
  confirmed: 'Confirmed',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
}

export const APPOINTMENT_STATUS_COLORS: Record<AppointmentStatus, 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'purple'> = {
  scheduled: 'blue',
  confirmed: 'green',
  in_progress: 'yellow',
  completed: 'purple',
  cancelled: 'red',
  no_show: 'gray',
}

export const APPOINTMENT_TYPE_LABELS: Record<AppointmentType, string> = {
  consultation: 'Consultation',
  follow_up: 'Follow-up',
  emergency: 'Emergency',
  procedure: 'Procedure',
  surgery: 'Surgery',
  lab: 'Laboratory',
  imaging: 'Imaging',
  vaccination: 'Vaccination',
  other: 'Other',
}
