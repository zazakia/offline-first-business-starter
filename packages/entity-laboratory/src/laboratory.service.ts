/**
 * ─── Laboratory Service — Metadata-Driven ────────────────────
 */

import type { LabOrder, LabResult, LabTestCatalog } from './laboratory.schema'

export class LabService {
  static prepareForCreate(input: Record<string, unknown>): Record<string, unknown> {
    const data = { ...input }
    data.status = 'ordered'
    data.orderedAt = Date.now()
    data.fastingRequired = data.fastingRequired ?? false

    const tests = data.tests as any[]
    if (tests) {
      for (const t of tests) {
        t.hasResults = false
        t.status = 'pending'
      }
    }

    return data
  }

  /** Check if a result is abnormal based on catalog reference ranges */
  static checkAbnormal(result: LabResult, catalog?: LabTestCatalog): { isAbnormal: boolean; flag?: string } {
    if (!catalog) return { isAbnormal: false }

    const value = parseFloat(result.value)
    if (isNaN(value)) return { isAbnormal: false }

    if (catalog.criticalLow != null && value <= catalog.criticalLow) {
      return { isAbnormal: true, flag: 'LL' }
    }
    if (catalog.criticalHigh != null && value >= catalog.criticalHigh) {
      return { isAbnormal: true, flag: 'HH' }
    }
    if (value < catalog.refRangeLow) {
      return { isAbnormal: true, flag: 'L' }
    }
    if (value > catalog.refRangeHigh) {
      return { isAbnormal: true, flag: 'H' }
    }

    return { isAbnormal: false }
  }

  /** Generate reference range string */
  static formatReferenceRange(catalog: LabTestCatalog): string {
    return `${catalog.refRangeLow} - ${catalog.refRangeHigh} ${catalog.unit}`
  }

  /** Check if all tests in order have results */
  static isComplete(order: LabOrder): boolean {
    if (!order.tests || order.tests.length === 0) return false
    return order.tests.every((t) => t.status === 'completed' || t.status === 'cancelled')
  }

  /** Get critical results in order */
  static getCriticalResults(order: LabOrder): LabResult[] {
    if (!order.results) return []
    return order.results.filter((r) => r.abnormalFlag === 'LL' || r.abnormalFlag === 'HH')
  }

  /** Get turnaround status */
  static getTurnaroundStatus(order: LabOrder, catalog: LabTestCatalog): 'on_time' | 'delayed' | 'completed' {
    if (order.status === 'completed') return 'completed'
    const elapsed = (Date.now() - order.orderedAt) / 3600000
    return elapsed > catalog.turnaroundHours ? 'delayed' : 'on_time'
  }
}
