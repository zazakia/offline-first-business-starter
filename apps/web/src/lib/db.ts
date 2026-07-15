/**
 * ─── Database Setup ──────────────────────────────────────────
 * Initializes Dexie repositories for all clinic entities.
 */

import { createDexieRepository } from '@repo/db-dexie'
import type { Repository } from '@repo/core'
import type { Customer } from '@repo/entity-customer'
import type { Patient } from '@repo/entity-patient'
import type { Doctor } from '@repo/entity-doctor'
import type { Appointment } from '@repo/entity-appointment'
import type { MedicalRecord } from '@repo/entity-medical-record'
import type { Prescription } from '@repo/entity-prescription'
import type { Invoice } from '@repo/entity-billing'
import type { InventoryItem } from '@repo/entity-inventory'
import type { Department } from '@repo/entity-department'
import type { PharmacyOrder } from '@repo/entity-pharmacy'
import type { LabOrder } from '@repo/entity-laboratory'

// Register all entity packages
import '@repo/entity-customer'
import '@repo/entity-patient'
import '@repo/entity-doctor'
import '@repo/entity-appointment'
import '@repo/entity-medical-record'
import '@repo/entity-prescription'
import '@repo/entity-billing'
import '@repo/entity-inventory'
import '@repo/entity-department'
import '@repo/entity-pharmacy'
import '@repo/entity-laboratory'

export const customerRepo: Repository<Customer> = createDexieRepository<Customer>('customer')
export const patientRepo: Repository<Patient> = createDexieRepository<Patient>('patient')
export const doctorRepo: Repository<Doctor> = createDexieRepository<Doctor>('doctor')
export const appointmentRepo: Repository<Appointment> = createDexieRepository<Appointment>('appointment')
export const medicalRecordRepo: Repository<MedicalRecord> = createDexieRepository<MedicalRecord>('medicalRecord')
export const prescriptionRepo: Repository<Prescription> = createDexieRepository<Prescription>('prescription')
export const billingRepo: Repository<Invoice> = createDexieRepository<Invoice>('billing')
export const inventoryRepo: Repository<InventoryItem> = createDexieRepository<InventoryItem>('inventory')
export const departmentRepo: Repository<Department> = createDexieRepository<Department>('department')
export const pharmacyRepo: Repository<PharmacyOrder> = createDexieRepository<PharmacyOrder>('pharmacy')
export const labRepo: Repository<LabOrder> = createDexieRepository<LabOrder>('laboratory')

export const clinicRepos = {
  patient: patientRepo, doctor: doctorRepo, appointment: appointmentRepo,
  medicalRecord: medicalRecordRepo, prescription: prescriptionRepo,
  billing: billingRepo, inventory: inventoryRepo, department: departmentRepo,
  pharmacy: pharmacyRepo, laboratory: labRepo,
} as const

export type ClinicEntityName = keyof typeof clinicRepos

export async function checkDbHealth() {
  try {
    const { getDatabase } = await import('@repo/db-dexie')
    const db = getDatabase()
    const tables = db.tables
    let totalRecords = 0
    for (const table of tables) totalRecords += await table.count()
    return { ok: true, tableCount: tables.length, totalRecords }
  } catch { return { ok: false, tableCount: 0, totalRecords: 0 } }
}
