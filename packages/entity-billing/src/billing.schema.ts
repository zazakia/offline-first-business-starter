/**
 * ─── Billing Schema ──────────────────────────────────────────
 * Clinic billing & invoicing with immutable double-entry ledger.
 * NEVER mutate a balance directly — always create ledger entries.
 */

import { z } from 'zod'
import { createQuerySchema, createUpdateSchema, notesSchema } from '@repo/core'

export type InvoiceStatus = 'draft' | 'sent' | 'partial' | 'paid' | 'cancelled' | 'refunded' | 'collection'
export type LedgerEntryType = 'debit' | 'credit'
export type PaymentMethod = 'cash' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'insurance' | 'voucher' | 'other'

export interface Invoice {
  id: string
  tenantId: string
  /** Sequential invoice number (per clinic) */
  invoiceNumber: string
  /** Patient ID (references Patient) */
  patientId: string
  /** Appointment ID (optional) */
  appointmentId?: string
  /** Doctor ID */
  doctorId?: string
  /** Status */
  status: InvoiceStatus
  /** Issue date */
  issueDate: number
  /** Due date */
  dueDate?: number
  /** Line items */
  items: InvoiceItem[]
  /** Subtotal before tax */
  subTotal: number
  /** Tax amount (IVA 16% for MX) */
  taxAmount: number
  /** Discount amount */
  discountAmount: number
  /** Total amount (subTotal + tax - discount) */
  totalAmount: number
  /** Amount paid so far */
  paidAmount: number
  /** Balance remaining */
  balanceDue: number
  /** Currency (MXN, USD) */
  currency: string
  /** Tax ID / RFC (for legal invoices) */
  taxId?: string
  /** Legal invoice type: 'factura' = legal, 'recibo' = simple receipt */
  invoiceType: 'factura' | 'recibo' | 'nota_venta'
  /** CFDI UUID for Mexican electronic invoicing */
  cfdiUuid?: string
  /** Whether this has been sent to the patient */
  sentToPatient: boolean
  /** Notes */
  notes?: string
  createdAt: number
  updatedAt: number
  deletedAt: number | null
  version: number
  createdBy: string
  updatedBy: string
}

export interface InvoiceItem {
  id: string
  /** Description of the service/product */
  description: string
  /** Quantity */
  quantity: number
  /** Unit price */
  unitPrice: number
  /** Total for this line */
  total: number
  /** Service/product code */
  code?: string
  /** Category */
  category: 'consultation' | 'procedure' | 'lab' | 'imaging' | 'medication' | 'supplies' | 'other'
  /** Tax rate applied */
  taxRate: number
  /** Whether this item is tax-exempt */
  taxExempt: boolean
  /** Discount for this line */
  discount?: number
}

/**
 * DOUBLE-ENTRY LEDGER — IMMUTABLE
 * Every financial mutation creates a LedgerEntry.
 * The balance is DERIVED, never directly mutated.
 */
export interface LedgerEntry {
  id: string
  tenantId: string
  /** Invoice this entry belongs to */
  invoiceId: string
  /** Sequential entry number (per invoice) */
  entryNumber: number
  /** Debit or credit */
  type: LedgerEntryType
  /** Amount (always positive) */
  amount: number
  /** Description of the transaction */
  description: string
  /** Payment method (if payment) */
  paymentMethod?: PaymentMethod
  /** Reference number (check number, transaction ID) */
  reference?: string
  /** Account code for accounting */
  accountCode: string
  /** Running balance after this entry */
  runningBalance: number
  /** Entry timestamp */
  entryDate: number
  /** Who created the entry */
  createdBy: string
  /** This entry can NEVER be modified or deleted */
  isImmutable: boolean
}

export const InvoiceStatusSchema = z.enum([
  'draft', 'sent', 'partial', 'paid', 'cancelled', 'refunded', 'collection',
])

export const InvoiceItemSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1).max(500),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
  total: z.number().min(0),
  code: z.string().max(50).optional(),
  category: z.enum(['consultation', 'procedure', 'lab', 'imaging', 'medication', 'supplies', 'other']),
  taxRate: z.number().min(0).max(1).default(0.16),
  taxExempt: z.boolean().default(false),
  discount: z.number().min(0).optional(),
})

export const CreateInvoiceSchema = z.object({
  tenantId: z.string().min(1),
  patientId: z.string().uuid('ID de paciente requerido'),
  appointmentId: z.string().uuid().optional(),
  doctorId: z.string().uuid().optional(),
  items: z.array(InvoiceItemSchema).min(1, 'Al menos un concepto requerido'),
  dueDate: z.number().positive().optional(),
  currency: z.string().length(3).default('MXN'),
  taxId: z.string().max(20).optional(),
  invoiceType: z.enum(['factura', 'recibo', 'nota_venta']).default('recibo'),
  notes: notesSchema,
})

export const UpdateInvoiceSchema = createUpdateSchema({
  status: InvoiceStatusSchema.optional(),
  items: z.array(InvoiceItemSchema).min(1).optional(),
  dueDate: z.number().positive().optional(),
  taxId: z.string().max(20).optional(),
  invoiceType: z.enum(['factura', 'recibo', 'nota_venta']).optional(),
  cfdiUuid: z.string().optional(),
  sentToPatient: z.boolean().optional(),
  notes: notesSchema.optional(),
})

export const InvoiceQuerySchema = createQuerySchema({
  patientId: z.string().uuid().optional(),
  status: InvoiceStatusSchema.optional(),
  appointmentId: z.string().uuid().optional(),
  doctorId: z.string().uuid().optional(),
})

export const InvoiceStatusLabels: Record<InvoiceStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  partial: 'Partial Payment',
  paid: 'Paid',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
  collection: 'In Collection',
}

export const InvoiceStatusColors: Record<InvoiceStatus, 'gray' | 'blue' | 'yellow' | 'green' | 'red' | 'purple'> = {
  draft: 'gray',
  sent: 'blue',
  partial: 'yellow',
  paid: 'green',
  cancelled: 'red',
  refunded: 'purple',
  collection: 'yellow',
}

export const PaymentMethodLabels: Record<PaymentMethod, string> = {
  cash: 'Cash',
  credit_card: 'Credit Card',
  debit_card: 'Debit Card',
  bank_transfer: 'Bank Transfer',
  insurance: 'Insurance',
  voucher: 'Voucher',
  other: 'Other',
}
