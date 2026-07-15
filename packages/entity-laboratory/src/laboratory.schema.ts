/**
 * ─── Laboratory Schema — Metadata-Driven Lab Management ──────
 * Covers: lab orders, sample tracking, test catalog,
 * results entry, reference ranges, reporting.
 */

import { z } from 'zod'
import { createQuerySchema, createUpdateSchema, notesSchema } from '@repo/core'

// ─── Types ───────────────────────────────────────────────────

export type LabOrderStatus = 'ordered' | 'collected' | 'in_lab' | 'processing' | 'completed' | 'partial' | 'cancelled'
export type LabOrderPriority = 'routine' | 'urgent' | 'stat'
export type SampleType = 'blood' | 'urine' | 'stool' | 'swab' | 'tissue' | 'sputum' | 'csf' | 'other'

export interface LabOrder {
  id: string
  tenantId: string
  /** Patient ID */
  patientId: string
  /** Ordering doctor ID */
  doctorId: string
  /** Medical record ID (encounter) */
  medicalRecordId?: string
  /** Status */
  status: LabOrderStatus
  /** Priority */
  priority: LabOrderPriority
  /** Tests requested */
  tests: LabTestRequest[]
  /** Sample collection info */
  sample?: LabSample
  /** Results */
  results?: LabResult[]
  /** When the order was placed */
  orderedAt: number
  /** When sample was collected */
  collectedAt?: number
  /** When results were completed */
  completedAt?: number
  /** Clinical diagnosis / reason */
  clinicalReason?: string
  /** Fasting required */
  fastingRequired: boolean
  /** Notes */
  notes?: string
  /** Lab technician who processed */
  processedBy?: string
  /** Verified by (pathologist/senior tech) */
  verifiedBy?: string
  createdAt: number
  updatedAt: number
  deletedAt: number | null
  version: number
  createdBy: string
  updatedBy: string
}

export interface LabTestRequest {
  id: string
  /** Test code (e.g., "CBC", "GLUC", "LIPID") */
  testCode: string
  /** Test name */
  testName: string
  /** Test category */
  category: 'hematology' | 'chemistry' | 'microbiology' | 'immunology' | 'urinalysis' | 'pathology' | 'genetics' | 'other'
  /** Whether this test is included in a panel */
  isPanel: boolean
  /** Parent panel name if part of a panel */
  panelName?: string
  /** Specimen type required */
  specimenType: SampleType
  /** Whether results exist */
  hasResults: boolean
  /** Status of this individual test */
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
}

export interface LabSample {
  /** Sample ID / barcode */
  sampleId: string
  /** Type of sample */
  type: SampleType
  /** Collection date/time */
  collectedAt: number
  /** Who collected the sample */
  collectedBy: string
  /** Collection site (e.g., "left arm", "midstream") */
  collectionSite?: string
  /** Sample volume/quantity */
  volume?: string
  /** Whether sample is adequate */
  isAdequate: boolean
  /** Rejection reason if rejected */
  rejectionReason?: string
  /** Storage conditions */
  storageConditions?: string
}

export interface LabResult {
  id: string
  /** Test code this result belongs to */
  testCode: string
  /** Test name */
  testName: string
  /** Result value (numeric or text) */
  value: string
  /** Unit of measurement */
  unit: string
  /** Reference range — normal */
  referenceRange?: string
  /** Whether the result is abnormal */
  isAbnormal: boolean
  /** Severity of abnormality */
  abnormalFlag?: 'L' | 'H' | 'LL' | 'HH' | 'A' // Low, High, Critically Low/High, Abnormal
  /** Interpretation notes */
  interpretation?: string
  /** Result entered by */
  enteredBy?: string
  /** Result entered at */
  enteredAt?: number
  /** Verified by */
  verifiedBy?: string
  /** Verified at */
  verifiedAt?: number
  /** Instrument used */
  instrument?: string
}

/** Test catalog — defines available tests and their reference ranges. Metadata-driven per tenant. */
export interface LabTestCatalog {
  id: string
  tenantId: string
  testCode: string
  testName: string
  category: LabTestRequest['category']
  specimenType: SampleType
  unit: string
  /** Reference range lower bound */
  refRangeLow: number
  /** Reference range upper bound */
  refRangeHigh: number
  /** Critical low threshold */
  criticalLow?: number
  /** Critical high threshold */
  criticalHigh?: number
  /** Whether this test is active */
  isActive: boolean
  /** Whether this test is part of a panel */
  isPanel: boolean
  /** Panel members (test codes) */
  panelMembers?: string[]
  /** Turnaround time in hours */
  turnaroundHours: number
  /** Cost (for billing) */
  cost: number
  /** Price (patient charge) */
  price: number
}

// ─── Schemas ─────────────────────────────────────────────────

export const LabOrderStatusSchema = z.enum(['ordered', 'collected', 'in_lab', 'processing', 'completed', 'partial', 'cancelled'])
export const LabOrderPrioritySchema = z.enum(['routine', 'urgent', 'stat'])
export const SampleTypeSchema = z.enum(['blood', 'urine', 'stool', 'swab', 'tissue', 'sputum', 'csf', 'other'])

export const LabTestRequestSchema = z.object({
  id: z.string().min(1),
  testCode: z.string().min(1),
  testName: z.string().min(1),
  category: z.enum(['hematology', 'chemistry', 'microbiology', 'immunology', 'urinalysis', 'pathology', 'genetics', 'other']),
  isPanel: z.boolean().default(false),
  panelName: z.string().optional(),
  specimenType: SampleTypeSchema,
  hasResults: z.boolean().default(false),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).default('pending'),
})

export const LabSampleSchema = z.object({
  sampleId: z.string().min(1),
  type: SampleTypeSchema,
  collectedAt: z.number().positive(),
  collectedBy: z.string().min(1),
  collectionSite: z.string().optional(),
  volume: z.string().optional(),
  isAdequate: z.boolean().default(true),
  rejectionReason: z.string().optional(),
  storageConditions: z.string().optional(),
})

export const LabResultSchema = z.object({
  id: z.string().min(1),
  testCode: z.string().min(1),
  testName: z.string().min(1),
  value: z.string().min(1),
  unit: z.string(),
  referenceRange: z.string().optional(),
  isAbnormal: z.boolean().default(false),
  abnormalFlag: z.enum(['L', 'H', 'LL', 'HH', 'A']).optional(),
  interpretation: z.string().optional(),
  enteredBy: z.string().optional(),
  enteredAt: z.number().optional(),
  verifiedBy: z.string().optional(),
  verifiedAt: z.number().optional(),
  instrument: z.string().optional(),
})

export const CreateLabOrderSchema = z.object({
  tenantId: z.string().min(1),
  patientId: z.string().uuid('Patient ID required'),
  doctorId: z.string().uuid('Doctor ID required'),
  medicalRecordId: z.string().uuid().optional(),
  priority: LabOrderPrioritySchema.default('routine'),
  tests: z.array(LabTestRequestSchema).min(1, 'At least one test required'),
  clinicalReason: z.string().max(500).optional(),
  fastingRequired: z.boolean().default(false),
  notes: notesSchema,
})

export const UpdateLabOrderSchema = createUpdateSchema({
  status: LabOrderStatusSchema.optional(),
  priority: LabOrderPrioritySchema.optional(),
  tests: z.array(LabTestRequestSchema).optional(),
  sample: LabSampleSchema.optional(),
  results: z.array(LabResultSchema).optional(),
  collectedAt: z.number().optional(),
  completedAt: z.number().optional(),
  processedBy: z.string().optional(),
  verifiedBy: z.string().optional(),
})

export const CreateLabTestCatalogSchema = z.object({
  tenantId: z.string().min(1),
  testCode: z.string().min(1).max(20),
  testName: z.string().min(1).max(200),
  category: z.enum(['hematology', 'chemistry', 'microbiology', 'immunology', 'urinalysis', 'pathology', 'genetics', 'other']),
  specimenType: SampleTypeSchema,
  unit: z.string().min(1),
  refRangeLow: z.number(),
  refRangeHigh: z.number(),
  criticalLow: z.number().optional(),
  criticalHigh: z.number().optional(),
  isActive: z.boolean().default(true),
  isPanel: z.boolean().default(false),
  panelMembers: z.array(z.string()).optional(),
  turnaroundHours: z.number().int().min(1).default(24),
  cost: z.number().min(0).default(0),
  price: z.number().min(0).default(0),
})

// ─── Display Labels ──────────────────────────────────────────

export const LAB_ORDER_STATUS_LABELS: Record<LabOrderStatus, string> = {
  ordered: 'Ordered',
  collected: 'Sample Collected',
  in_lab: 'In Lab',
  processing: 'Processing',
  completed: 'Completed',
  partial: 'Partial Results',
  cancelled: 'Cancelled',
}

export const LAB_ORDER_PRIORITY_LABELS: Record<LabOrderPriority, string> = {
  routine: 'Routine',
  urgent: 'Urgent',
  stat: 'STAT',
}

export const LAB_CATEGORY_LABELS: Record<LabTestRequest['category'], string> = {
  hematology: 'Hematology',
  chemistry: 'Clinical Chemistry',
  microbiology: 'Microbiology',
  immunology: 'Immunology',
  urinalysis: 'Urinalysis',
  pathology: 'Pathology',
  genetics: 'Genetics',
  other: 'Other',
}

export const SAMPLE_TYPE_LABELS: Record<SampleType, string> = {
  blood: 'Blood', urine: 'Urine', stool: 'Stool', swab: 'Swab',
  tissue: 'Tissue', sputum: 'Sputum', csf: 'CSF', other: 'Other',
}
