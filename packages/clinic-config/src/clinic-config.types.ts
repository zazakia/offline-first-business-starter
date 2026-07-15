/**
 * ─── Clinic Configuration Types ──────────────────────────────
 * Metadata-driven clinic configuration — the heart of the
 * "no hardcoding" principle. Every clinic tenant gets a
 * JSONB settings blob that drives runtime behavior.
 *
 * These types define what a clinic can customize without
 * any code changes or redeploys.
 */

import type { z } from 'zod'

// ─── Clinic Identity ─────────────────────────────────────────

export interface ClinicInfo {
  /** Display name of the clinic */
  name: string
  /** Legal/business name */
  legalName?: string
  /** Tax ID (RFC in Mexico) */
  taxId?: string
  /** Address */
  address?: {
    street: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  /** Contact */
  phone?: string
  email?: string
  website?: string
  /** Logo URL */
  logoUrl?: string
  /** Clinic type */
  type: 'consultorio' | 'clinica' | 'hospital' | 'consultorio_dental' | 'laboratorio' | 'otro'
}

// ─── Custom Fields ───────────────────────────────────────────
// Each clinic can define additional fields per entity.
// These are rendered in forms and displayed in detail views.

export interface CustomFieldDefinition {
  /** Machine name (e.g., "alergia_latex") */
  key: string
  /** Human-readable label */
  label: string
  /** Field type */
  type: 'text' | 'number' | 'select' | 'multiselect' | 'date' | 'boolean' | 'textarea' | 'url'
  /** For select/multiselect: available options */
  options?: Array<{ label: string; value: string }>
  /** Whether this field is required */
  required?: boolean
  /** Placeholder text */
  placeholder?: string
  /** Help text */
  helpText?: string
  /** Default value */
  defaultValue?: unknown
  /** Minimum value (for number) */
  min?: number
  /** Maximum value (for number) */
  max?: number
  /** Order in the form (lower = first) */
  order: number
  /** Which section of the form this belongs to */
  section?: string
  /** Whether this field is searchable */
  searchable?: boolean
  /** Whether this field appears in list views */
  showInList?: boolean
}

export interface CustomFieldValue {
  key: string
  value: unknown
}

// ─── Appointment Configuration ───────────────────────────────

export interface AppointmentTypeConfig {
  /** Type identifier (e.g., "consulta_general") */
  key: string
  /** Display label */
  label: string
  /** Default duration in minutes */
  defaultDuration: number
  /** Color for calendar display */
  color: string
  /** Which doctor specialties can handle this type */
  allowedSpecialties?: string[]
  /** Whether this type requires a specific room/equipment */
  requiredResources?: string[]
  /** Default priority */
  defaultPriority: 'normal' | 'urgent' | 'emergency'
  /** Whether online booking is enabled for this type */
  allowOnlineBooking: boolean
  /** Buffer time before appointment (minutes) */
  bufferBefore: number
  /** Buffer time after appointment (minutes) */
  bufferAfter: number
  /** Base price for this appointment type */
  basePrice?: number
}

export interface ClinicSchedule {
  /** Day of week (0 = Sunday, 6 = Saturday) */
  dayOfWeek: number
  /** Whether the clinic is open this day */
  isOpen: boolean
  /** Opening time (HH:mm) */
  openTime: string
  /** Closing time (HH:mm) */
  closeTime: string
  /** Block time ranges that are unavailable (lunch breaks, etc.) */
  blockedRanges?: Array<{ start: string; end: string }>
}

// ─── Billing Configuration ───────────────────────────────────

export interface BillingConfig {
  /** Currency (default: MXN) */
  currency: string
  /** Default tax rate (IVA in Mexico: 0.16) */
  defaultTaxRate: number
  /** Whether to generate CFDI electronic invoices */
  enableCFDI: boolean
  /** Default payment terms in days */
  defaultPaymentTerms: number
  /** Whether to auto-generate invoice after consultation */
  autoGenerateAfterConsultation: boolean
  /** Late payment fee percentage */
  lateFeePercentage?: number
  /** Default consultation price (if not set per doctor) */
  defaultConsultationPrice?: number
  /** Accepted payment methods */
  acceptedPaymentMethods: string[]
  /** Invoice prefix (e.g., "FAC-") */
  invoicePrefix: string
  /** Starting invoice number */
  invoiceStartNumber: number
}

// ─── Clinical Configuration ──────────────────────────────────

export interface ClinicalConfig {
  /** Default follow-up period in days */
  defaultFollowUpDays: number
  /** Whether to require vital signs for every consultation */
  requireVitalSigns: boolean
  /** Whether to require diagnosis for every medical record */
  requireDiagnosis: boolean
  /** Default CIE-10 coding system version */
  cieVersion: 'CIE-10' | 'CIE-11'
  /** Whether to enable drug interaction checks */
  enableDrugInteractionCheck: boolean
  /** Whether to require patient consent for procedures */
  requireConsent: boolean
  /** Lab result normal ranges (per test type) */
  labNormalRanges?: Record<string, { min: number; max: number; unit: string }>
}

// ─── Inventory Configuration ─────────────────────────────────

export interface InventoryConfig {
  /** Default reorder threshold as percentage of max stock */
  defaultReorderThreshold: number
  /** Whether to auto-decrement stock on prescription dispense */
  autoDecrementOnDispense: boolean
  /** Whether to track lot numbers */
  trackLotNumbers: boolean
  /** Whether to track expiration dates */
  trackExpirationDates: boolean
  /** Expiry warning days before expiration */
  expiryWarningDays: number
  /** Whether to require authorization for controlled substances */
  requireAuthForControlled: boolean
}

// ─── Complete Clinic Settings ────────────────────────────────

/**
 * The complete clinic configuration stored as JSONB
 * in the tenant's `settings` field.
 * Every setting is OPTIONAL — the clinic config resolver
 * merges with sensible defaults.
 */
export interface ClinicSettings {
  /** Clinic identity and branding */
  clinic?: ClinicInfo

  /** Custom fields per entity */
  customFields?: {
    patient?: CustomFieldDefinition[]
    doctor?: CustomFieldDefinition[]
    appointment?: CustomFieldDefinition[]
    medicalRecord?: CustomFieldDefinition[]
    prescription?: CustomFieldDefinition[]
    billing?: CustomFieldDefinition[]
    inventory?: CustomFieldDefinition[]
  }

  /** Appointment types and scheduling */
  appointmentTypes?: AppointmentTypeConfig[]
  /** Clinic operating schedule */
  schedule?: ClinicSchedule[]

  /** Billing and invoicing */
  billing?: BillingConfig

  /** Clinical workflows */
  clinical?: ClinicalConfig

  /** Inventory management */
  inventory?: InventoryConfig

  /** Module toggles (overrides feature flags at tenant level) */
  modules?: {
    prescriptions?: boolean
    billing?: boolean
    inventory?: boolean
    labOrders?: boolean
    imaging?: boolean
    surgery?: boolean
    inpatient?: boolean
    telemedicine?: boolean
    patientPortal?: boolean
  }

  /** Workflow definitions (appointment → record → prescription → billing) */
  workflows?: ClinicWorkflow[]

  /** Notification settings */
  notifications?: {
    appointmentReminders?: boolean
    reminderHoursBefore?: number
    smsEnabled?: boolean
    emailEnabled?: boolean
    whatsappEnabled?: boolean
  }

  /** Any additional metadata the clinic wants to store */
  metadata?: Record<string, unknown>
}

// ─── Clinic Workflow ─────────────────────────────────────────

export interface ClinicWorkflow {
  /** Workflow name */
  name: string
  /** Description */
  description?: string
  /** Triggering event */
  trigger: {
    entity: string
    event: 'afterCreate' | 'afterUpdate' | 'statusChange'
    status?: string
  }
  /** Actions to perform */
  actions: WorkflowAction[]
  /** Whether this workflow is enabled */
  enabled: boolean
}

export interface WorkflowAction {
  /** Action type */
  type: 'createEntity' | 'updateEntity' | 'sendNotification' | 'generateDocument' | 'callWebhook'
  /** Configuration for this action */
  config: Record<string, unknown>
  /** Order in the sequence */
  order: number
  /** Condition: only execute if this evaluates to true */
  condition?: string
}
