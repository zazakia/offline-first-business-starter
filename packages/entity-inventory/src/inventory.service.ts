/**
 * ─── Inventory Service ───────────────────────────────────────
 */

import type { InventoryItem, InventoryTransaction } from './inventory.schema'

export class InventoryService {
  static prepareForCreate(input: Record<string, unknown>): Record<string, unknown> {
    const data = { ...input }

    if (typeof data.name === 'string') {
      data.name = (data.name as string).trim()
    }

    // Auto-determine initial status
    const qty = data.quantityOnHand as number ?? 0
    const minQty = data.minimumQuantity as number ?? 10

    if (qty <= 0) {
      data.status = 'out_of_stock'
    } else if (qty <= minQty) {
      data.status = 'low_stock'
    } else {
      data.status = 'in_stock'
    }

    return data
  }

  /**
   * Record a stock adjustment — note: this creates a transaction,
   * never mutates quantity directly without a transaction log.
   */
  static calculateQuantityChange(
    currentQty: number,
    changeType: InventoryTransaction['type'],
    changeQty: number,
  ): {
    newQuantity: number
    newStatus: string
    transaction: Partial<InventoryTransaction>
  } {
    let newQty: number

    switch (changeType) {
      case 'reception':
      case 'return':
        newQty = currentQty + changeQty
        break
      case 'dispense':
      case 'expiry':
        if (changeQty > currentQty) {
          throw new Error(`Stock insuficiente. Disponible: ${currentQty}, solicitado: ${changeQty}`)
        }
        newQty = currentQty - changeQty
        break
      case 'transfer':
      case 'adjustment':
        newQty = currentQty + changeQty // Can be positive or negative
        if (newQty < 0) throw new Error('El ajuste resultaría en stock negativo')
        break
      default:
        newQty = currentQty
    }

    return {
      newQuantity: newQty,
      newStatus: newQty <= 0 ? 'out_of_stock' : 'in_stock',
      transaction: {
        quantity: changeType === 'dispense' || changeType === 'expiry' ? -changeQty : changeQty,
        runningQuantity: newQty,
        type: changeType,
      },
    }
  }

  /**
   * Check if item is near expiry (within 30 days).
   */
  static isNearExpiry(item: InventoryItem): boolean {
    if (!item.expirationDate) return false
    const thirtyDays = 30 * 24 * 60 * 60 * 1000
    return item.expirationDate - Date.now() <= thirtyDays
  }

  /**
   * Check if item has expired.
   */
  static isExpired(item: InventoryItem): boolean {
    if (!item.expirationDate) return false
    return Date.now() > item.expirationDate
  }

  /**
   * Get reorder recommendation.
   */
  static getReorderQuantity(item: InventoryItem): number {
    if (item.quantityOnHand >= item.minimumQuantity) return 0
    return item.maximumQuantity - item.quantityOnHand
  }

  /**
   * Calculate total inventory value.
   */
  static getInventoryValue(items: InventoryItem[]): number {
    return items.reduce((sum, item) => sum + item.quantityOnHand * item.unitCost, 0)
  }

  /**
   * Check if controlled substance dispensing needs special authorization.
   */
  static requiresControlledSubstanceCheck(item: InventoryItem): boolean {
    return item.isControlled && item.category === 'medication'
  }
}
