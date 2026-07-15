/**
 * ─── Clinic Config Resolver ──────────────────────────────────
 * THE metadata-driven engine. Merges per-tenant clinic settings
 * with sensible defaults. Zero hardcoding — everything comes
 * from the tenant's JSONB settings.
 *
 * Usage:
 *   const config = getClinicConfig(tenant)
 *   config.appointmentTypes  // tenant's custom appointment types
 *   config.billing.taxRate   // tenant's tax rate or default 16%
 *   config.customFields.patient  // tenant's custom patient fields
 */

import type { Tenant } from '@repo/multi-tenant'
import type {
  ClinicSettings,
  ClinicInfo,
  AppointmentTypeConfig,
  ClinicSchedule,
  BillingConfig,
  ClinicalConfig,
  InventoryConfig,
  CustomFieldDefinition,
  ClinicWorkflow,
} from './clinic-config.types'

// ─── Sensible Defaults ───────────────────────────────────────

export const DEFAULT_APPOINTMENT_TYPES: AppointmentTypeConfig[] = [
  {
    key: 'consulta_general',
    label: 'Consulta General',
    defaultDuration: 30,
    color: '#3B82F6',
    defaultPriority: 'normal',
    allowOnlineBooking: true,
    bufferBefore: 0,
    bufferAfter: 5,
    basePrice: 500,
  },
  {
    key: 'consulta_especialidad',
    label: 'Consulta de Especialidad',
    defaultDuration: 45,
    color: '#8B5CF6',
    defaultPriority: 'normal',
    allowOnlineBooking: true,
    bufferBefore: 0,
    bufferAfter: 10,
    basePrice: 800,
  },
  {
    key: 'urgencia',
    label: 'Urgencia',
    defaultDuration: 20,
    color: '#EF4444',
    defaultPriority: 'emergency',
    allowOnlineBooking: false,
    bufferBefore: 0,
    bufferAfter: 0,
    basePrice: 1200,
  },
  {
    key: 'control',
    label: 'Control / Seguimiento',
    defaultDuration: 20,
    color: '#10B981',
    defaultPriority: 'normal',
    allowOnlineBooking: true,
    bufferBefore: 0,
    bufferAfter: 5,
    basePrice: 350,
  },
  {
    key: 'procedimiento',
    label: 'Procedimiento',
    defaultDuration: 60,
    color: '#F59E0B',
    defaultPriority: 'urgent',
    allowOnlineBooking: false,
    bufferBefore: 15,
    bufferAfter: 15,
    basePrice: 1500,
  },
]

export const DEFAULT_SCHEDULE: ClinicSchedule[] = [
  { dayOfWeek: 1, isOpen: true, openTime: '08:00', closeTime: '14:00', blockedRanges: [] },
  { dayOfWeek: 1, isOpen: true, openTime: '16:00', closeTime: '20:00', blockedRanges: [] },
  { dayOfWeek: 2, isOpen: true, openTime: '08:00', closeTime: '14:00', blockedRanges: [] },
  { dayOfWeek: 2, isOpen: true, openTime: '16:00', closeTime: '20:00', blockedRanges: [] },
  { dayOfWeek: 3, isOpen: true, openTime: '08:00', closeTime: '14:00', blockedRanges: [] },
  { dayOfWeek: 3, isOpen: true, openTime: '16:00', closeTime: '20:00', blockedRanges: [] },
  { dayOfWeek: 4, isOpen: true, openTime: '08:00', closeTime: '14:00', blockedRanges: [] },
  { dayOfWeek: 4, isOpen: true, openTime: '16:00', closeTime: '20:00', blockedRanges: [] },
  { dayOfWeek: 5, isOpen: true, openTime: '08:00', closeTime: '14:00', blockedRanges: [] },
  { dayOfWeek: 5, isOpen: true, openTime: '16:00', closeTime: '20:00', blockedRanges: [] },
  { dayOfWeek: 6, isOpen: true, openTime: '09:00', closeTime: '13:00', blockedRanges: [] },
  { dayOfWeek: 0, isOpen: false, openTime: '00:00', closeTime: '00:00', blockedRanges: [] },
]

export const DEFAULT_BILLING: BillingConfig = {
  currency: 'MXN',
  defaultTaxRate: 0.16,
  enableCFDI: true,
  defaultPaymentTerms: 30,
  autoGenerateAfterConsultation: true,
  acceptedPaymentMethods: ['cash', 'credit_card', 'debit_card', 'bank_transfer'],
  invoicePrefix: 'FAC-',
  invoiceStartNumber: 1,
}

export const DEFAULT_CLINICAL: ClinicalConfig = {
  defaultFollowUpDays: 30,
  requireVitalSigns: true,
  requireDiagnosis: true,
  cieVersion: 'CIE-10',
  enableDrugInteractionCheck: true,
  requireConsent: true,
}

export const DEFAULT_INVENTORY: InventoryConfig = {
  defaultReorderThreshold: 0.2,
  autoDecrementOnDispense: true,
  trackLotNumbers: true,
  trackExpirationDates: true,
  expiryWarningDays: 90,
  requireAuthForControlled: true,
}

export const DEFAULT_WORKFLOWS: ClinicWorkflow[] = [
  {
    name: 'Appointment to Medical Record',
    description: 'When an appointment is completed, prompt to create a medical record',
    trigger: { entity: 'appointment', event: 'statusChange', status: 'completed' },
    actions: [
      { type: 'createEntity', config: { entity: 'medicalRecord', mapFields: { patientId: 'patientId', doctorId: 'doctorId', appointmentId: 'id' } }, order: 1 },
    ],
    enabled: true,
  },
  {
    name: 'Medical Record to Billing',
    description: 'When a medical record is finalized, auto-generate an invoice',
    trigger: { entity: 'medicalRecord', event: 'statusChange', status: 'final' },
    actions: [
      {
        type: 'createEntity',
        config: {
          entity: 'billing',
          mapFields: { patientId: 'patientId', doctorId: 'doctorId' },
          autoItems: [{ description: 'Consulta Médica', category: 'consultation', quantity: 1 }],
        },
        order: 1,
      },
    ],
    enabled: false, // Disabled by default — clinics opt-in
  },
  {
    name: 'Low Stock Alert',
    description: 'When inventory reaches low stock, alert pharmacy',
    trigger: { entity: 'inventory', event: 'statusChange', status: 'low_stock' },
    actions: [
      { type: 'sendNotification', config: { channel: 'in_app', targetRole: 'pharmacist', template: 'low_stock_alert' }, order: 1 },
    ],
    enabled: true,
  },
]

// ─── Resolver ────────────────────────────────────────────────

/**
 * Extract clinic settings from a tenant object.
 * Merges tenant-specific config with defaults.
 */
export function getClinicConfig(tenant: Tenant): ClinicSettings {
  const raw = (tenant.settings?.clinic ?? {}) as Partial<ClinicSettings>

  return {
    // Identity
    clinic: raw.clinic ?? {
      name: tenant.name,
      type: 'consultorio',
    },

    // Custom fields — no defaults, tenant-specific only
    customFields: raw.customFields ?? {},

    // Appointment types — merge, don't replace
    appointmentTypes: mergeAppointmentTypes(
      DEFAULT_APPOINTMENT_TYPES,
      raw.appointmentTypes ?? [],
    ),

    // Schedule
    schedule: raw.schedule ?? DEFAULT_SCHEDULE,

    // Billing
    billing: { ...DEFAULT_BILLING, ...raw.billing },

    // Clinical
    clinical: { ...DEFAULT_CLINICAL, ...raw.clinical },

    // Inventory
    inventory: { ...DEFAULT_INVENTORY, ...raw.inventory },

    // Module toggles
    modules: {
      prescriptions: true,
      billing: true,
      inventory: true,
      labOrders: false,
      imaging: false,
      surgery: false,
      inpatient: false,
      telemedicine: false,
      patientPortal: false,
      ...raw.modules,
    },

    // Workflows
    workflows: mergeWorkflows(DEFAULT_WORKFLOWS, raw.workflows ?? []),

    // Notifications
    notifications: {
      appointmentReminders: false,
      reminderHoursBefore: 24,
      smsEnabled: false,
      emailEnabled: true,
      whatsappEnabled: false,
      ...raw.notifications,
    },

    metadata: raw.metadata ?? {},
  }
}

/**
 * Merge tenant appointment types with defaults.
 * Tenant types with the same key override defaults.
 * Tenant types with new keys are added.
 */
function mergeAppointmentTypes(
  defaults: AppointmentTypeConfig[],
  tenantOverrides: AppointmentTypeConfig[],
): AppointmentTypeConfig[] {
  const map = new Map<string, AppointmentTypeConfig>()

  // Load defaults first
  for (const d of defaults) {
    map.set(d.key, d)
  }

  // Tenant overrides win
  for (const t of tenantOverrides) {
    map.set(t.key, t)
  }

  return Array.from(map.values())
}

/**
 * Merge workflows. Tenant workflows with the same name override defaults.
 */
function mergeWorkflows(
  defaults: ClinicWorkflow[],
  tenantOverrides: ClinicWorkflow[],
): ClinicWorkflow[] {
  const map = new Map<string, ClinicWorkflow>()

  for (const d of defaults) {
    map.set(d.name, d)
  }

  for (const t of tenantOverrides) {
    map.set(t.name, t)
  }

  return Array.from(map.values())
}

// ─── Custom Field Helpers ────────────────────────────────────

/**
 * Get custom fields for a specific entity in a clinic.
 */
export function getCustomFields(
  config: ClinicSettings,
  entity: keyof NonNullable<ClinicSettings['customFields']>,
): CustomFieldDefinition[] {
  const fields = config.customFields?.[entity]
  if (!fields || !Array.isArray(fields)) return []
  return [...fields].sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
}

/**
 * Extract custom field values from an entity's data.
 */
export function extractCustomFieldValues(
  data: Record<string, unknown>,
  customFields: CustomFieldDefinition[],
): CustomFieldDefinition[] {
  return customFields.map((field) => ({
    ...field,
    defaultValue: data[field.key] ?? field.defaultValue,
  }))
}

/**
 * Validate custom field values against their definitions.
 */
export function validateCustomFields(
  values: Record<string, unknown>,
  fields: CustomFieldDefinition[],
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {}

  for (const field of fields) {
    const value = values[field.key]

    // Required check
    if (field.required && (value == null || value === '')) {
      errors[field.key] = `${field.label} es requerido`
      continue
    }

    // Skip empty optional fields
    if (value == null || value === '') continue

    // Type-specific validation
    switch (field.type) {
      case 'number': {
        const num = Number(value)
        if (isNaN(num)) {
          errors[field.key] = `${field.label} debe ser un número`
        } else if (field.min != null && num < field.min) {
          errors[field.key] = `${field.label} mínimo: ${field.min}`
        } else if (field.max != null && num > field.max) {
          errors[field.key] = `${field.label} máximo: ${field.max}`
        }
        break
      }
      case 'select': {
        if (field.options && !field.options.some((o) => o.value === value)) {
          errors[field.key] = `${field.label}: opción no válida`
        }
        break
      }
      case 'multiselect': {
        if (field.options && Array.isArray(value)) {
          const invalid = value.filter((v) => !field.options!.some((o) => o.value === v))
          if (invalid.length > 0) {
            errors[field.key] = `${field.label}: opciones no válidas`
          }
        }
        break
      }
    }
  }

  return { valid: Object.keys(errors).length === 0, errors }
}

// ─── Schedule Helpers ────────────────────────────────────────

/**
 * Check if the clinic is open at a specific time.
 */
export function isClinicOpen(config: ClinicSettings, date: Date): boolean {
  const day = date.getDay()
  const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  const schedule = config.schedule ?? DEFAULT_SCHEDULE

  const daySchedules = schedule.filter((s) => s.dayOfWeek === day && s.isOpen)
  if (daySchedules.length === 0) return false

  return daySchedules.some((s) => {
    if (timeStr < s.openTime || timeStr > s.closeTime) return false

    // Check blocked ranges
    if (s.blockedRanges) {
      return !s.blockedRanges.some((b) => timeStr >= b.start && timeStr <= b.end)
    }

    return true
  })
}

/**
 * Get available time slots for a given day.
 */
export function getAvailableSlots(
  config: ClinicSettings,
  date: Date,
  slotDurationMinutes: number,
): Array<{ start: string; end: string }> {
  const day = date.getDay()
  const schedule = config.schedule ?? DEFAULT_SCHEDULE
  const daySchedules = schedule.filter((s) => s.dayOfWeek === day && s.isOpen)
  const slots: Array<{ start: string; end: string }> = []

  for (const s of daySchedules) {
    const [openH, openM] = s.openTime.split(':').map(Number)
    const [closeH, closeM] = s.closeTime.split(':').map(Number)
    let currentMinutes = openH * 60 + openM
    const endMinutes = closeH * 60 + closeM

    while (currentMinutes + slotDurationMinutes <= endMinutes) {
      const startStr = `${String(Math.floor(currentMinutes / 60)).padStart(2, '0')}:${String(currentMinutes % 60).padStart(2, '0')}`
      const endMinutesSlot = currentMinutes + slotDurationMinutes
      const endStr = `${String(Math.floor(endMinutesSlot / 60)).padStart(2, '0')}:${String(endMinutesSlot % 60).padStart(2, '0')}`

      // Skip blocked ranges
      const isBlocked = s.blockedRanges?.some((b) => {
        const [bStartH, bStartM] = b.start.split(':').map(Number)
        const [bEndH, bEndM] = b.end.split(':').map(Number)
        const bStart = bStartH * 60 + bStartM
        const bEnd = bEndH * 60 + bEndM
        return currentMinutes < bEnd && endMinutesSlot > bStart
      })

      if (!isBlocked) {
        slots.push({ start: startStr, end: endStr })
      }

      currentMinutes += slotDurationMinutes
    }
  }

  return slots
}
