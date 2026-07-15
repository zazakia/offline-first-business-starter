/**
 * ─── Patient Service ─────────────────────────────────────────
 * Pure business logic for Patient management.
 * Zero I/O — operates on data in memory.
 */

import type { Patient, PatientStatus } from './patient.schema'

export class PatientService {
  /**
   * Validate and normalize patient data before creation.
   */
  static prepareForCreate(input: Record<string, unknown>): Record<string, unknown> {
    const data = { ...input }

    // Normalize full name (title case)
    if (typeof data.fullName === 'string') {
      data.fullName = data.fullName.trim().replace(/\b\w/g, (c: string) => c.toUpperCase())
    }

    // Normalize email
    if (typeof data.email === 'string' && data.email) {
      data.email = (data.email as string).toLowerCase().trim()
    }

    // Normalize phone
    if (typeof data.phone === 'string') {
      data.phone = (data.phone as string).replace(/\s+/g, '').trim()
    }

    // Set defaults
    if (!data.status) data.status = 'active'
    if (!data.tags) data.tags = []
    if (!data.preferredLanguage) data.preferredLanguage = 'es'

    return data
  }

  /**
   * Calculate patient age from date of birth.
   */
  static calculateAge(dateOfBirth: string): number {
    const dob = new Date(dateOfBirth)
    const today = new Date()
    let age = today.getFullYear() - dob.getFullYear()
    const monthDiff = today.getMonth() - dob.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--
    }
    return age
  }

  /**
   * Get age category for clinical decision support.
   */
  static getAgeCategory(age: number): 'pediatric' | 'adult' | 'geriatric' {
    if (age < 18) return 'pediatric'
    if (age >= 65) return 'geriatric'
    return 'adult'
  }

  /**
   * Check if patient has any critical conditions that need flagging.
   */
  static hasCriticalConditions(patient: Patient): string[] {
    const critical: string[] = []
    const allergies = (patient.allergies ?? '').toLowerCase()
    const conditions = (patient.chronicConditions ?? '').toLowerCase()

    if (allergies.includes('penicillin') || allergies.includes('penicilina')) {
      critical.push('Alergia a penicilina')
    }
    if (allergies.includes('latex')) {
      critical.push('Alergia al látex')
    }
    if (conditions.includes('diabetes')) {
      critical.push('Diabetes')
    }
    if (conditions.includes('hipertensión') || conditions.includes('hipertension')) {
      critical.push('Hipertensión')
    }
    if (conditions.includes('cardiac') || conditions.includes('cardíac')) {
      critical.push('Condición cardíaca')
    }

    return critical
  }

  /**
   * Generate a display name for the patient.
   */
  static getDisplayName(patient: Patient): string {
    if (patient.preferredName) {
      return `${patient.preferredName} ${patient.fullName.split(' ').slice(-1)[0] || ''}`
    }
    return patient.fullName
  }

  /**
   * Validate if patient can be marked as transferred.
   */
  static canTransfer(patient: Patient): { allowed: boolean; reason?: string } {
    if (patient.status === 'deceased') {
      return { allowed: false, reason: 'No se puede transferir un paciente fallecido' }
    }
    if (patient.status === 'transferred') {
      return { allowed: false, reason: 'El paciente ya está transferido' }
    }
    return { allowed: true }
  }

  /**
   * Get recommended follow-up date based on chronic conditions.
   */
  static recommendFollowUp(patient: Patient): number | null {
    const conditions = (patient.chronicConditions ?? '').toLowerCase()
    const now = Date.now()
    const DAY = 1000 * 60 * 60 * 24

    if (conditions.includes('diabetes')) return now + (90 * DAY) // 3 months
    if (conditions.includes('hipertensión') || conditions.includes('hipertension')) return now + (180 * DAY) // 6 months
    if (patient.status === 'active') return now + (365 * DAY) // annual checkup

    return null
  }

  /**
   * Search helper: generate searchable text from patient fields.
   */
  static getSearchableText(patient: Patient): string {
    return [
      patient.fullName,
      patient.preferredName,
      patient.email,
      patient.phone,
      patient.nationalId,
      patient.addressLine1,
      patient.city,
      patient.allergies,
      patient.chronicConditions,
      patient.insuranceProvider,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
  }
}
