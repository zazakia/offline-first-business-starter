/**
 * ─── @repo/entity-patient — Barrel Export ───────────────────
 */

export { PatientEntity } from './patient.entity'
export type { Patient, PatientStatus, BloodType, Gender } from './patient.schema'
export {
  CreatePatientSchema,
  UpdatePatientSchema,
  PatientQuerySchema,
  PatientStatusSchema,
  BloodTypeSchema,
  GenderSchema,
  PATIENT_STATUS_LABELS,
  PATIENT_STATUS_COLORS,
  BLOOD_TYPE_LABELS,
  GENDER_LABELS,
} from './patient.schema'
export { PatientService } from './patient.service'
export { PatientPolicies, evaluatePolicies } from './patient.policies'
export type { Policy, PolicyContext } from './patient.policies'
export { PatientHooks } from './patient.hooks'
export { PatientUIConfig } from './patient.ui'
export type { ColumnDef, FormFieldDef, DetailSectionDef } from './patient.ui'
