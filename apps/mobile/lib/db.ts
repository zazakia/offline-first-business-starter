/**
 * ─── Mobile Database Setup ───────────────────────────────────
 * Initializes Expo SQLite repositories for all clinic entities.
 */

import { createExpoSqliteRepository } from '@repo/db-expo-sqlite'
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

// ─── Register all entity packages ───────────────────────────
import '@repo/entity-customer'
import '@repo/entity-patient'
import '@repo/entity-doctor'
import '@repo/entity-appointment'
import '@repo/entity-medical-record'
import '@repo/entity-prescription'
import '@repo/entity-billing'
import '@repo/entity-inventory'
import '@repo/entity-department'

// ─── Repository Instances ────────────────────────────────────

export const customerRepo: Repository<Customer> = createExpoSqliteRepository<Customer>('customer')
export const patientRepo: Repository<Patient> = createExpoSqliteRepository<Patient>('patient')
export const doctorRepo: Repository<Doctor> = createExpoSqliteRepository<Doctor>('doctor')
export const appointmentRepo: Repository<Appointment> = createExpoSqliteRepository<Appointment>('appointment')
export const medicalRecordRepo: Repository<MedicalRecord> = createExpoSqliteRepository<MedicalRecord>('medicalRecord')
export const prescriptionRepo: Repository<Prescription> = createExpoSqliteRepository<Prescription>('prescription')
export const billingRepo: Repository<Invoice> = createExpoSqliteRepository<Invoice>('billing')
export const inventoryRepo: Repository<InventoryItem> = createExpoSqliteRepository<InventoryItem>('inventory')
export const departmentRepo: Repository<Department> = createExpoSqliteRepository<Department>('department')
