/**
 * ─── Pharmacy Entity — Metadata-Driven Pharmacy Management ───
 * Fully integrated with hospital management system.
 * All labels/config driven by tenant JSONB metadata.
 *
 * Covers: prescription fulfillment, inventory dispensing,
 * controlled substance tracking, pharmacy sales, supplier management.
 */

import { z } from 'zod'
import { createQuerySchema, createUpdateSchema, notesSchema } from '@repo/core'

// ─── Types ───────────────────────────────────────────────────

export type PharmacyOrderStatus = 'pending' | 'processing' | 'ready' | 'dispensed' | 'partial' | 'cancelled' | 'rejected'
export type PharmacyOrderType = 'prescription' | 'otc_sale' | 'refill' | 'compounding'

export interface PharmacyOrder {
  id: string
  tenantId: string
  /** Prescription ID (if from a prescription) */
  prescriptionId?: string
  /** Patient ID */
  patientId: string
  /** Doctor ID who prescribed */
  doctorId?: string
  /** Order type */
  type: PharmacyOrderType
  /** Status */
  status: PharmacyOrderStatus
  /** Medications being dispensed */
  items: PharmacyOrderItem[]
  /** Total cost to patient */
  totalCost: number
  /** Amount paid by insurance */
  insuranceCoverage: number
  /** Amount paid by patient */
  patientPay: number
  /** Pharmacist who processed */
  processedBy?: string
  /** Pharmacy location / branch */
  pharmacyLocation?: string
  /** When the order was received */
  receivedAt: number
  /** When processing started */
  processingStartedAt?: number
  /** When order was completed */
  completedAt?: number
  /** Special instructions */
  instructions?: string
  /** Notes (internal) */
  notes?: string
  /** Whether the patient was counseled */
  counseledPatient: boolean
  /** Controlled substance authorization reference */
  controlledAuthRef?: string
  createdAt: number
  updatedAt: number
  deletedAt: number | null
  version: number
  createdBy: string
  updatedBy: string
}

export interface PharmacyOrderItem {
  id: string
  /** Inventory item ID */
  inventoryItemId: string
  /** Medication name (denormalized for display) */
  medicationName: string
  /** Strength */
  strength: string
  /** Quantity dispensed */
  quantity: number
  /** Unit price */
  unitPrice: number
  /** Total for this line */
  total: number
  /** Whether this is a controlled substance */
  isControlled: boolean
  /** Lot number dispensed */
  lotNumber?: string
  /** Expiration date of the dispensed batch */
  expirationDate?: number
  /** Dosage instructions (SIG) */
  sigInstructions?: string
  /** Refills authorized */
  refillsAuthorized: number
}

// ─── Supplier ────────────────────────────────────────────────

export interface Supplier {
  id: string
  tenantId: string
  name: string
  contactPerson?: string
  phone: string
  email: string
  address?: string
  taxId?: string
  /** Categories supplied */
  categories: string[]
  /** Whether this supplier is active */
  isActive: boolean
  /** Payment terms in days */
  paymentTerms: number
  /** Notes */
  notes?: string
  /** Products supplied (IDs) */
  products: string[]
  createdAt: number
  updatedAt: number
  deletedAt: number | null
  version: number
  createdBy: string
  updatedBy: string
}

// ─── Purchase Order ──────────────────────────────────────────

export interface PurchaseOrder {
  id: string
  tenantId: string
  supplierId: string
  status: 'draft' | 'sent' | 'partial' | 'received' | 'cancelled'
  items: PurchaseOrderItem[]
  totalAmount: number
  expectedDeliveryDate?: number
  receivedDate?: number
  notes?: string
  createdAt: number
  updatedAt: number
  deletedAt: number | null
  version: number
  createdBy: string
  updatedBy: string
}

export interface PurchaseOrderItem {
  id: string
  inventoryItemId: string
  itemName: string
  quantity: number
  unitCost: number
  total: number
  receivedQuantity: number
}

// ─── Schemas ─────────────────────────────────────────────────

export const PharmacyOrderStatusSchema = z.enum([
  'pending', 'processing', 'ready', 'dispensed', 'partial', 'cancelled', 'rejected',
])

export const PharmacyOrderTypeSchema = z.enum([
  'prescription', 'otc_sale', 'refill', 'compounding',
])

export const PharmacyOrderItemSchema = z.object({
  id: z.string().min(1),
  inventoryItemId: z.string().min(1),
  medicationName: z.string().min(1),
  strength: z.string(),
  quantity: z.number().int().min(1),
  unitPrice: z.number().min(0),
  total: z.number().min(0),
  isControlled: z.boolean().default(false),
  lotNumber: z.string().optional(),
  expirationDate: z.number().optional(),
  sigInstructions: z.string().optional(),
  refillsAuthorized: z.number().int().min(0).default(0),
})

export const CreatePharmacyOrderSchema = z.object({
  tenantId: z.string().min(1),
  prescriptionId: z.string().uuid().optional(),
  patientId: z.string().uuid('Patient ID required'),
  doctorId: z.string().uuid().optional(),
  type: PharmacyOrderTypeSchema.default('prescription'),
  items: z.array(PharmacyOrderItemSchema).min(1, 'At least one item required'),
  pharmacyLocation: z.string().max(100).optional(),
  instructions: z.string().max(500).optional(),
  notes: notesSchema,
})

export const UpdatePharmacyOrderSchema = createUpdateSchema({
  status: PharmacyOrderStatusSchema.optional(),
  items: z.array(PharmacyOrderItemSchema).optional(),
  processedBy: z.string().optional(),
  processingStartedAt: z.number().optional(),
  completedAt: z.number().optional(),
  counseledPatient: z.boolean().optional(),
  controlledAuthRef: z.string().optional(),
  notes: notesSchema.optional(),
})

export const CreateSupplierSchema = z.object({
  tenantId: z.string().min(1),
  name: z.string().min(1, 'Supplier name required'),
  contactPerson: z.string().optional(),
  phone: z.string().min(1, 'Phone required'),
  email: z.string().email().optional(),
  address: z.string().optional(),
  taxId: z.string().optional(),
  categories: z.array(z.string()).default([]),
  paymentTerms: z.number().int().min(0).default(30),
  products: z.array(z.string()).default([]),
  notes: notesSchema,
})

// ─── Display Labels (English) ────────────────────────────────────

export const PHARMACY_ORDER_STATUS_LABELS: Record<PharmacyOrderStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  ready: 'Ready for Pickup',
  dispensed: 'Dispensed',
  partial: 'Partially Dispensed',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
}

export const PHARMACY_ORDER_TYPE_LABELS: Record<PharmacyOrderType, string> = {
  prescription: 'Prescription',
  otc_sale: 'OTC Sale',
  refill: 'Refill',
  compounding: 'Compounding',
}
