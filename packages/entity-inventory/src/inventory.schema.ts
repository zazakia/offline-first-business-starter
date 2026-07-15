/**
 * ─── Inventory Schema ────────────────────────────────────────
 * Medical supplies, medications, and equipment inventory.
 */

import { z } from 'zod'
import { createQuerySchema, createUpdateSchema, notesSchema } from '@repo/core'

export type InventoryCategory = 'medication' | 'supplies' | 'equipment' | 'lab_reagent' | 'ppe' | 'surgical' | 'dental' | 'cleaning' | 'office' | 'other'
export type InventoryUnit = 'tablet' | 'capsule' | 'vial' | 'ampule' | 'bottle' | 'box' | 'pack' | 'piece' | 'pair' | 'liter' | 'ml' | 'kg' | 'g' | 'mg' | 'unit' | 'kit'
export type InventoryStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'expired' | 'discontinued' | 'on_order'

export interface InventoryItem {
  id: string
  tenantId: string
  /** Product name */
  name: string
  /** Generic / active ingredient name */
  genericName?: string
  /** Category */
  category: InventoryCategory
  /** Unit of measurement */
  unit: InventoryUnit
  /** SKU / barcode */
  sku?: string
  /** Current quantity in stock */
  quantityOnHand: number
  /** Minimum quantity before reorder alert */
  minimumQuantity: number
  /** Maximum quantity to stock */
  maximumQuantity: number
  /** Unit cost */
  unitCost: number
  /** Selling price (if sold to patients) */
  sellingPrice?: number
  /** Supplier name */
  supplier?: string
  /** Supplier product code */
  supplierCode?: string
  /** Batch / lot number */
  lotNumber?: string
  /** Expiration date (for medications/supplies) */
  expirationDate?: number
  /** Storage location (e.g., "A-3-2") */
  location?: string
  /** Whether this is a controlled substance */
  isControlled: boolean
  /** Status */
  status: InventoryStatus
  /** Notes */
  notes?: string
  /** Department ID where this is stored */
  departmentId?: string
  createdAt: number
  updatedAt: number
  deletedAt: number | null
  version: number
  createdBy: string
  updatedBy: string
}

/**
 * Inventory Transaction — every stock movement is recorded.
 */
export interface InventoryTransaction {
  id: string
  tenantId: string
  /** Inventory item ID */
  itemId: string
  /** Transaction type */
  type: 'reception' | 'dispense' | 'transfer' | 'adjustment' | 'expiry' | 'return'
  /** Quantity change (positive = added, negative = removed) */
  quantity: number
  /** Quantity after transaction */
  runningQuantity: number
  /** Reference: patient ID, prescription ID, purchase order, etc. */
  referenceType?: string
  referenceId?: string
  /** Reason for adjustment */
  reason?: string
  /** Lot number for this specific transaction */
  lotNumber?: string
  /** Transaction date */
  transactionDate: number
  /** Who performed the transaction */
  performedBy: string
  createdAt: number
}

export const InventoryCategorySchema = z.enum([
  'medication', 'supplies', 'equipment', 'lab_reagent', 'ppe',
  'surgical', 'dental', 'cleaning', 'office', 'other',
])

export const InventoryUnitSchema = z.enum([
  'tablet', 'capsule', 'vial', 'ampule', 'bottle', 'box', 'pack',
  'piece', 'pair', 'liter', 'ml', 'kg', 'g', 'mg', 'unit', 'kit',
])

export const InventoryStatusSchema = z.enum([
  'in_stock', 'low_stock', 'out_of_stock', 'expired', 'discontinued', 'on_order',
])

export const CreateInventoryItemSchema = z.object({
  tenantId: z.string().min(1),
  name: z.string().min(1, 'Nombre requerido').max(300),
  genericName: z.string().max(300).optional(),
  category: InventoryCategorySchema,
  unit: InventoryUnitSchema,
  sku: z.string().max(100).optional(),
  quantityOnHand: z.number().int().min(0).default(0),
  minimumQuantity: z.number().int().min(0).default(10),
  maximumQuantity: z.number().int().min(1).default(100),
  unitCost: z.number().min(0).default(0),
  sellingPrice: z.number().min(0).optional(),
  supplier: z.string().max(200).optional(),
  supplierCode: z.string().max(100).optional(),
  lotNumber: z.string().max(100).optional(),
  expirationDate: z.number().positive().optional(),
  location: z.string().max(100).optional(),
  isControlled: z.boolean().default(false),
  departmentId: z.string().uuid().optional(),
  notes: notesSchema,
})

export const UpdateInventoryItemSchema = createUpdateSchema({
  name: z.string().min(1).max(300).optional(),
  genericName: z.string().max(300).optional(),
  category: InventoryCategorySchema.optional(),
  unit: InventoryUnitSchema.optional(),
  sku: z.string().max(100).optional(),
  minimumQuantity: z.number().int().min(0).optional(),
  maximumQuantity: z.number().int().min(1).optional(),
  unitCost: z.number().min(0).optional(),
  sellingPrice: z.number().min(0).optional(),
  supplier: z.string().max(200).optional(),
  supplierCode: z.string().max(100).optional(),
  lotNumber: z.string().max(100).optional(),
  expirationDate: z.number().positive().optional(),
  location: z.string().max(100).optional(),
  isControlled: z.boolean().optional(),
  status: InventoryStatusSchema.optional(),
  departmentId: z.string().uuid().optional(),
  notes: notesSchema.optional(),
})

export const InventoryQuerySchema = createQuerySchema({
  category: InventoryCategorySchema.optional(),
  status: InventoryStatusSchema.optional(),
  isControlled: z.boolean().optional(),
  departmentId: z.string().uuid().optional(),
})

export const INVENTORY_CATEGORY_LABELS: Record<InventoryCategory, string> = {
  medication: 'Medication',
  supplies: 'Supplies',
  equipment: 'Equipment',
  lab_reagent: 'Lab Reagent',
  ppe: 'PPE',
  surgical: 'Surgical',
  dental: 'Dental',
  cleaning: 'Cleaning',
  office: 'Office',
  other: 'Other',
}

export const INVENTORY_STATUS_LABELS: Record<InventoryStatus, string> = {
  in_stock: 'In Stock',
  low_stock: 'Low Stock',
  out_of_stock: 'Out of Stock',
  expired: 'Expired',
  discontinued: 'Discontinued',
  on_order: 'On Order',
}
