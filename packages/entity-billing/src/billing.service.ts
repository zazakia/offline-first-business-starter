/**
 * ─── Billing Service ─────────────────────────────────────────
 * Pure business logic for Billing — DOUBLE-ENTRY LEDGER.
 *
 * THE IMMUTABLE RULE:
 *   "Never mutate a balance directly. Always create a ledger entry."
 *   Every payment, credit, void, or adjustment MUST produce
 *   a LedgerEntry + re-calculate running balances.
 */

import type { Invoice, InvoiceItem, LedgerEntry, InvoiceStatus } from './billing.schema'

export class BillingService {
  static prepareForCreate(input: Record<string, unknown>): Record<string, unknown> {
    const data = { ...input }

    const items = data.items as InvoiceItem[] | undefined
    if (items) {
      // Calculate totals from items
      let subTotal = 0
      let taxAmount = 0
      let totalDiscount = 0

      for (const item of items) {
        const itemTotal = item.quantity * item.unitPrice
        const itemDiscount = item.discount ?? 0
        const taxableAmount = itemTotal - itemDiscount
        item.total = itemTotal
        item.discount = itemDiscount

        subTotal += itemTotal
        totalDiscount += itemDiscount
        taxAmount += item.taxExempt ? 0 : Math.round(taxableAmount * item.taxRate * 100) / 100
      }

      data.subTotal = Math.round(subTotal * 100) / 100
      data.taxAmount = Math.round(taxAmount * 100) / 100
      data.discountAmount = Math.round(totalDiscount * 100) / 100
      data.totalAmount = Math.round((subTotal + taxAmount - totalDiscount) * 100) / 100
    }

    data.status = 'draft'
    data.paidAmount = 0
    data.balanceDue = data.totalAmount ?? 0
    data.issueDate = Date.now()
    data.sentToPatient = false

    return data
  }

  /**
   * Record a payment via double-entry.
   * Creates TWO ledger entries (one debit, one credit) to maintain
   * the fundamental accounting equation: Assets = Liabilities + Equity.
   *
   * Entry 1 (DEBIT):  Increases Accounts Receivable (patient owes less)
   * Entry 2 (CREDIT): Increases Revenue (clinic earned money)
   */
  static recordPayment(
    invoice: Invoice,
    amount: number,
    paymentMethod: string,
    reference: string,
    createdBy: string,
  ): {
    entries: Array<Omit<LedgerEntry, 'id' | 'isImmutable'>>
    newPaidAmount: number
    newBalanceDue: number
    newStatus: InvoiceStatus
  } {
    if (amount <= 0) throw new Error('El monto del pago debe ser positivo')
    if (invoice.status === 'paid') throw new Error('La factura ya está pagada')
    if (invoice.status === 'cancelled') throw new Error('No se puede pagar una factura cancelada')
    if (amount > invoice.balanceDue) throw new Error('El pago excede el saldo pendiente')

    const newPaid = invoice.paidAmount + amount
    const newBalance = invoice.totalAmount - newPaid

    let newStatus: InvoiceStatus
    if (newBalance <= 0.01) {
      newStatus = 'paid'
    } else if (newPaid > 0) {
      newStatus = 'partial'
    } else {
      newStatus = invoice.status
    }

    // Running balance: current balance - payment
    const afterPaymentBalance = invoice.totalAmount - newPaid

    const entry1: Omit<LedgerEntry, 'id' | 'isImmutable'> = {
      tenantId: invoice.tenantId,
      invoiceId: invoice.id,
      entryNumber: 1,
      type: 'debit',
      amount,
      description: `Pago recibido - ${paymentMethod}${reference ? ` Ref: ${reference}` : ''}`,
      paymentMethod: paymentMethod as any,
      reference,
      accountCode: '1101', // Accounts Receivable
      runningBalance: afterPaymentBalance,
      entryDate: Date.now(),
      createdBy,
    }

    const entry2: Omit<LedgerEntry, 'id' | 'isImmutable'> = {
      tenantId: invoice.tenantId,
      invoiceId: invoice.id,
      entryNumber: 2,
      type: 'credit',
      amount,
      description: `Ingreso por servicios médicos - Factura ${invoice.invoiceNumber}`,
      accountCode: '4101', // Medical Services Revenue
      runningBalance: afterPaymentBalance,
      entryDate: Date.now(),
      createdBy,
    }

    return {
      entries: [entry1, entry2],
      newPaidAmount: newPaid,
      newBalanceDue: newBalance,
      newStatus,
    }
  }

  /**
   * Record a refund (credit note) via double-entry.
   * Reverses the original entries.
   */
  static recordRefund(
    invoice: Invoice,
    amount: number,
    reason: string,
    createdBy: string,
  ): {
    entries: Array<Omit<LedgerEntry, 'id' | 'isImmutable'>>
    newPaidAmount: number
    newBalanceDue: number
    newStatus: InvoiceStatus
  } {
    if (amount <= 0) throw new Error('El monto del reembolso debe ser positivo')
    if (invoice.status !== 'paid' && invoice.status !== 'partial') {
      throw new Error('Solo se puede reembolsar una factura pagada')
    }
    if (amount > invoice.paidAmount) throw new Error('El reembolso excede lo pagado')

    const newPaid = invoice.paidAmount - amount
    const newBalance = invoice.totalAmount - newPaid

    const entry1: Omit<LedgerEntry, 'id' | 'isImmutable'> = {
      tenantId: invoice.tenantId,
      invoiceId: invoice.id,
      entryNumber: 1,
      type: 'credit',
      amount,
      description: `Reembolso - ${reason}`,
      accountCode: '1101', // Accounts Receivable (increase — reverse of payment)
      runningBalance: newBalance,
      entryDate: Date.now(),
      createdBy,
    }

    const entry2: Omit<LedgerEntry, 'id' | 'isImmutable'> = {
      tenantId: invoice.tenantId,
      invoiceId: invoice.id,
      entryNumber: 2,
      type: 'debit',
      amount,
      description: `Devolución por servicios - Factura ${invoice.invoiceNumber} - ${reason}`,
      accountCode: '4101', // Revenue (decrease)
      runningBalance: newBalance,
      entryDate: Date.now(),
      createdBy,
    }

    return {
      entries: [entry1, entry2],
      newPaidAmount: newPaid,
      newBalanceDue: newBalance,
      newStatus: newPaid <= 0 ? 'refunded' : 'partial',
    }
  }

  /**
   * Generate the next invoice number for a clinic.
   * Format: F-YYYY-NNNNN (e.g., F-2026-00001)
   */
  static generateInvoiceNumber(lastNumber: number): string {
    const year = new Date().getFullYear()
    const next = lastNumber + 1
    return `F-${year}-${String(next).padStart(5, '0')}`
  }

  /**
   * Calculate aging (days past due).
   */
  static getDaysPastDue(invoice: Invoice): number {
    if (!invoice.dueDate) return 0
    if (invoice.status === 'paid' || invoice.status === 'cancelled') return 0
    return Math.max(0, Math.floor((Date.now() - invoice.dueDate) / (1000 * 60 * 60 * 24)))
  }

  /**
   * Get aging category for collections.
   */
  static getAgingCategory(daysPastDue: number): 'current' | '30' | '60' | '90' | '120+' {
    if (daysPastDue <= 0) return 'current'
    if (daysPastDue <= 30) return '30'
    if (daysPastDue <= 60) return '60'
    if (daysPastDue <= 90) return '90'
    return '120+'
  }
}
