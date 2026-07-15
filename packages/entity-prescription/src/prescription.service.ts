/**
 * ─── Prescription Service ────────────────────────────────────
 */

import type { Prescription, Medication } from './prescription.schema'

export class PrescriptionService {
  static prepareForCreate(input: Record<string, unknown>): Record<string, unknown> {
    const data = { ...input }

    // Set default start date to now if not provided
    if (!data.startDate) data.startDate = Date.now()

    // Calculate total days as max of all medication durations
    const medications = data.medications as Medication[] | undefined
    if (medications) {
      data.totalDays = Math.max(...medications.map(m => m.durationDays))
      const start = data.startDate as number
      data.endDate = start + (data.totalDays as number) * 24 * 60 * 60 * 1000
    }

    data.status = 'active'
    data.printed = false

    return data
  }

  /**
   * Generate the standard sig (instructions) string.
   * Format: "Tomar 1 tableta cada 8 horas por 7 días"
   */
  static generateSig(med: Medication): string {
    const parts: string[] = []
    parts.push(med.dosage)

    const freqLabels: Record<string, string> = {
      once_daily: 'cada 24 horas', twice_daily: 'cada 12 horas',
      three_times_daily: 'cada 8 horas', four_times_daily: 'cada 6 horas',
      every_4h: 'cada 4 horas', every_6h: 'cada 6 horas',
      every_8h: 'cada 8 horas', every_12h: 'cada 12 horas',
      as_needed: 'según necesidad', once: 'dosis única',
      custom: med.customFrequency ?? '',
    }
    const freqLabel = freqLabels[med.frequency] ?? med.frequency
    if (freqLabel) parts.push(freqLabel)

    parts.push(`por ${med.durationDays} día${med.durationDays > 1 ? 's' : ''}`)

    if (med.instructions) parts.push(`(${med.instructions})`)

    return parts.join(' ')
  }

  /**
   * Check if prescription has expired.
   */
  static isExpired(prescription: Prescription): boolean {
    if (prescription.status === 'expired') return true
    if (prescription.status === 'dispensed' || prescription.status === 'discontinued') return false
    if (prescription.endDate && Date.now() > prescription.endDate) return true
    return false
  }

  /**
   * Check for potential interactions (simplified, would use drug DB in production).
   */
  static checkInteractions(medications: Medication[]): string[] {
    const warnings: string[] = []

    const allMeds = medications.map(m => m.name.toLowerCase())

    // Simplified interaction checks
    if (allMeds.some(m => m.includes('warfarina')) && allMeds.some(m => m.includes('aspirina'))) {
      warnings.push('⚠️ Interacción: Warfarina + Aspirina — riesgo elevado de sangrado')
    }
    if (allMeds.some(m => m.includes('metformina')) && allMeds.some(m => m.includes('contraste'))) {
      warnings.push('⚠️ Interacción: Metformina + Contraste iodado — riesgo de acidosis láctica')
    }
    if (allMeds.some(m => m.includes('ibuprofeno')) && allMeds.some(m => m.includes('enalapril'))) {
      warnings.push('⚠️ Interacción: AINE + IECA — posible reducción del efecto antihipertensivo')
    }

    return warnings
  }

  /**
   * Check if controlled substance requires special handling.
   */
  static requiresSpecialForm(medication: Medication): boolean {
    if (!medication.isControlled) return false

    // In Mexico, controlled substances require special prescription forms (receta especial)
    const controlledPatterns = [
      'codeína', 'tramadol', 'morfina', 'fentanilo', 'metilfenidato',
      'diazepam', 'clonazepam', 'alprazolam', 'lorazepam',
    ]
    return controlledPatterns.some(p =>
      medication.name.toLowerCase().includes(p) ||
      (medication.activeIngredient ?? '').toLowerCase().includes(p),
    )
  }

  /**
   * Calculate remaining refills.
   */
  static getRemainingRefills(prescription: Prescription): number {
    let usedRefills = 0
    for (const med of prescription.medications) {
      usedRefills = Math.max(usedRefills, med.refills)
    }
    // In practice, would track actual dispensations
    return Math.max(0, usedRefills)
  }
}
