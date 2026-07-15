/**
 * ─── Pharmacy Service — Metadata-Driven ──────────────────────
 */

import type { PharmacyOrder, PharmacyOrderItem } from './pharmacy.schema'
import { PHARMACY_ORDER_STATUS_LABELS } from './pharmacy.schema'

export class PharmacyService {
  static prepareForCreate(input: Record<string, unknown>): Record<string, unknown> {
    const data = { ...input }
    data.status = 'pending'
    data.receivedAt = Date.now()
    data.counseledPatient = false

    // Calculate totals
    const items = data.items as PharmacyOrderItem[] | undefined
    if (items) {
      let totalCost = 0
      for (const item of items) {
        item.total = item.quantity * item.unitPrice
        totalCost += item.total
      }
      data.totalCost = totalCost
      data.insuranceCoverage = 0
      data.patientPay = totalCost
    }

    return data
  }

  /** Check if order contains controlled substances */
  static hasControlledSubstances(order: PharmacyOrder): boolean {
    return order.items.some((item) => item.isControlled)
  }

  /** State machine transitions */
  static ALLOWED_TRANSITIONS: Record<string, string[]> = {
    pending: ['processing', 'cancelled', 'rejected'],
    processing: ['ready', 'cancelled', 'rejected'],
    ready: ['dispensed', 'cancelled'],
    dispensed: ['partial'],
    partial: ['dispensed', 'cancelled'],
    cancelled: [],
    rejected: ['pending'],
  }

  static canTransition(from: string, to: string): boolean {
    return PharmacyService.ALLOWED_TRANSITIONS[from]?.includes(to) ?? false
  }

  /** Generate dispensing label */
  static generateLabel(item: PharmacyOrderItem, patientName: string): string {
    return [
      `Patient: ${patientName}`,
      `Medication: ${item.medicationName} ${item.strength}`,
      `Quantity: ${item.quantity}`,
      item.sigInstructions ? `Directions: ${item.sigInstructions}` : '',
      item.lotNumber ? `Lot: ${item.lotNumber}` : '',
      item.expirationDate ? `Exp: ${new Date(item.expirationDate).toLocaleDateString()}` : '',
      `Date: ${new Date().toLocaleDateString()}`,
    ].filter(Boolean).join('\n')
  }
}
