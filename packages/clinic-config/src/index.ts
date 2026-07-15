/**
 * ─── @repo/clinic-config — Barrel Export ────────────────────
 * Metadata-driven clinic configuration engine.
 *
 * Usage:
 *   import { getClinicConfig, getCustomFields, isClinicOpen } from '@repo/clinic-config'
 *
 *   const config = getClinicConfig(tenant)
 *   const patientFields = getCustomFields(config, 'patient')
 */

// Types
export type {
  ClinicSettings,
  ClinicInfo,
  AppointmentTypeConfig,
  ClinicSchedule,
  BillingConfig,
  ClinicalConfig,
  InventoryConfig,
  CustomFieldDefinition,
  CustomFieldValue,
  ClinicWorkflow,
  WorkflowAction,
} from './clinic-config.types'

// Resolver
export {
  getClinicConfig,
  getCustomFields,
  extractCustomFieldValues,
  validateCustomFields,
  isClinicOpen,
  getAvailableSlots,
} from './clinic-config.resolver'

// Default configs (useful for admin UI seed data)
export {
  DEFAULT_APPOINTMENT_TYPES,
  DEFAULT_SCHEDULE,
  DEFAULT_BILLING,
  DEFAULT_CLINICAL,
  DEFAULT_INVENTORY,
  DEFAULT_WORKFLOWS,
} from './clinic-config.resolver'
