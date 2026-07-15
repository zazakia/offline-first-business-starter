/**
 * ─── @repo/entity-doctor — Barrel Export ───────────────────
 */

export { DoctorEntity } from './doctor.entity'
export type { Doctor, DoctorStatus, DoctorSpecialty } from './doctor.schema'
export {
  CreateDoctorSchema,
  UpdateDoctorSchema,
  DoctorQuerySchema,
  DoctorStatusSchema,
  DoctorSpecialtySchema,
  DOCTOR_STATUS_LABELS,
  DOCTOR_SPECIALTY_LABELS,
  DOCTOR_STATUS_COLORS,
} from './doctor.schema'
export { DoctorService } from './doctor.service'
export { DoctorPolicies, evaluatePolicies } from './doctor.policies'
export type { Policy, PolicyContext } from './doctor.policies'
export { DoctorHooks } from './doctor.hooks'
export { DoctorUIConfig } from './doctor.ui'
export type { ColumnDef, FormFieldDef, DetailSectionDef } from './doctor.ui'
