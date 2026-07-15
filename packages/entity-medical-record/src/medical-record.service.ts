/**
 * ─── Medical Record Service ──────────────────────────────────
 */

import type { MedicalRecord, VitalSigns } from './medical-record.schema'

export class MedicalRecordService {
  static prepareForCreate(input: Record<string, unknown>): Record<string, unknown> {
    const data = { ...input }

    if (typeof data.chiefComplaint === 'string') {
      data.chiefComplaint = (data.chiefComplaint as string).trim()
    }

    if (!data.vitalSigns) data.vitalSigns = {}
    if (!data.diagnoses) data.diagnoses = []
    if (!data.status) data.status = 'draft'

    return data
  }

  /**
   * Calculate BMI from weight (kg) and height (cm).
   */
  static calculateBMI(weightKg: number, heightCm: number): number {
    const heightM = heightCm / 100
    return Math.round((weightKg / (heightM * heightM)) * 10) / 10
  }

  /**
   * Interpret BMI value.
   */
  static interpretBMI(bmi: number): string {
    if (bmi < 18.5) return 'Bajo peso'
    if (bmi < 25) return 'Normal'
    if (bmi < 30) return 'Sobrepeso'
    if (bmi < 35) return 'Obesidad Grado I'
    if (bmi < 40) return 'Obesidad Grado II'
    return 'Obesidad Grado III'
  }

  /**
   * Check for abnormal vital signs.
   */
  static checkAbnormalVitals(vitals: VitalSigns): string[] {
    const alerts: string[] = []

    if (vitals.temperature != null) {
      if (vitals.temperature > 38.0) alerts.push(`Fiebre: ${vitals.temperature}°C`)
      if (vitals.temperature < 35.0) alerts.push(`Hipotermia: ${vitals.temperature}°C`)
    }
    if (vitals.heartRate != null) {
      if (vitals.heartRate > 100) alerts.push(`Taquicardia: ${vitals.heartRate} bpm`)
      if (vitals.heartRate < 60) alerts.push(`Bradicardia: ${vitals.heartRate} bpm`)
    }
    if (vitals.oxygenSaturation != null && vitals.oxygenSaturation < 92) {
      alerts.push(`Hipoxemia: SpO2 ${vitals.oxygenSaturation}%`)
    }
    if (vitals.bloodPressureSystolic != null && vitals.bloodPressureSystolic > 140) {
      alerts.push(`Hipertensión sistólica: ${vitals.bloodPressureSystolic}`)
    }
    if (vitals.bloodPressureDiastolic != null && vitals.bloodPressureDiastolic > 90) {
      alerts.push(`Hipertensión diastólica: ${vitals.bloodPressureDiastolic}`)
    }
    if (vitals.bloodGlucose != null) {
      if (vitals.bloodGlucose > 200) alerts.push(`Hiperglucemia: ${vitals.bloodGlucose} mg/dL`)
      if (vitals.bloodGlucose < 70) alerts.push(`Hipoglucemia: ${vitals.bloodGlucose} mg/dL`)
    }
    if (vitals.painLevel != null && vitals.painLevel >= 7) {
      alerts.push(`Dolor severo: ${vitals.painLevel}/10`)
    }

    return alerts
  }

  /**
   * Check if the record can be finalized (signed).
   */
  static canFinalize(record: MedicalRecord): { allowed: boolean; reason?: string } {
    if (record.status === 'final' || record.status === 'cancelled') {
      return { allowed: false, reason: 'El expediente ya está finalizado o cancelado' }
    }
    if (!record.chiefComplaint) {
      return { allowed: false, reason: 'Falta el motivo de consulta' }
    }
    if (!record.diagnoses || record.diagnoses.length === 0) {
      return { allowed: false, reason: 'Se requiere al menos un diagnóstico' }
    }
    if (!record.treatmentPlan && !record.followUpInstructions) {
      return { allowed: false, reason: 'Se requiere plan de tratamiento o instrucciones de seguimiento' }
    }
    return { allowed: true }
  }

  /**
   * Get a summary of the medical record suitable for display in a timeline.
   */
  static getSummary(record: MedicalRecord): string {
    const parts: string[] = []
    if (record.chiefComplaint) parts.push(`MC: ${record.chiefComplaint}`)
    if (record.diagnoses?.length) {
      const principal = record.diagnoses.find(d => d.type === 'principal')
      if (principal) parts.push(`Dx: ${principal.code} - ${principal.description}`)
    }
    if (record.treatmentPlan) parts.push('Tx: Incluido')
    return parts.join(' | ') || 'Sin resumen disponible'
  }
}
