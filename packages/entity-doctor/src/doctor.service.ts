/**
 * ─── Doctor Service ──────────────────────────────────────────
 * Pure business logic for Doctor management.
 */

import type { Doctor } from './doctor.schema'
import { DOCTOR_SPECIALTY_LABELS } from './doctor.schema'

export class DoctorService {
  static prepareForCreate(input: Record<string, unknown>): Record<string, unknown> {
    const data = { ...input }

    if (typeof data.fullName === 'string') {
      data.fullName = (data.fullName as string).trim()
    }
    if (typeof data.email === 'string') {
      data.email = (data.email as string).toLowerCase().trim()
    }
    if (typeof data.licenseNumber === 'string') {
      data.licenseNumber = (data.licenseNumber as string).toUpperCase().trim()
    }

    if (!data.languages) data.languages = ['es']
    if (!data.certifications) data.certifications = []
    if (!data.subSpecialties) data.subSpecialties = []
    if (!data.defaultConsultDuration) data.defaultConsultDuration = 30
    if (!data.availableDays) data.availableDays = [1, 2, 3, 4, 5]

    return data
  }

  /**
   * Get specialty display name.
   */
  static getSpecialtyLabel(specialty: string): string {
    return DOCTOR_SPECIALTY_LABELS[specialty as keyof typeof DOCTOR_SPECIALTY_LABELS] ?? specialty
  }

  /**
   * Check if doctor is available on a given day of week.
   */
  static isAvailableOnDay(doctor: Doctor, dayOfWeek: number): boolean {
    if (doctor.status !== 'active') return false
    return doctor.availableDays.includes(dayOfWeek)
  }

  /**
   * Calculate if doctor has reached max patients for the day.
   * (Actual count check happens at repository level.)
   */
  static canAcceptMorePatients(doctor: Doctor, currentDayCount: number): boolean {
    if (!doctor.maxPatientsPerDay) return true
    return currentDayCount < doctor.maxPatientsPerDay
  }

  /**
   * Get time slot duration in ms.
   */
  static getSlotDurationMs(doctor: Doctor): number {
    return (doctor.defaultConsultDuration ?? 30) * 60 * 1000
  }

  /**
   * Get full professional name with title.
   */
  static getProfessionalName(doctor: Doctor): string {
    const specialty = DOCTOR_SPECIALTY_LABELS[doctor.specialty]
    return specialty ? `Dr/a. ${doctor.fullName} (${specialty})` : `Dr/a. ${doctor.fullName}`
  }

  /**
   * Get searchable text.
   */
  static getSearchableText(doctor: Doctor): string {
    return [
      doctor.fullName,
      doctor.licenseNumber,
      doctor.specialty,
      ...doctor.subSpecialties,
      doctor.email,
      doctor.phone,
      doctor.education,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
  }
}
