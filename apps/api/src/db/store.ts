/**
 * ─── Server-Side Data Store ─────────────────────────────────
 * In-memory store for the API server.
 * In production, this is PostgreSQL via Supabase.
 *
 * Supports: full CRUD, tenant isolation, soft-delete,
 * pagination, filtering, sorting, and change log for sync.
 */

import type { ChangeLogEntry, EntityId, TimestampMillis } from '@repo/core'
import { v4 as uuidv4 } from 'uuid'

// Ensure uuid is available — add polyfill if needed
const generateId = (): string => {
  try {
    return uuidv4()
  } catch {
    return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  }
}

export interface ServerEntity {
  id: string
  tenantId: string
  type: string
  data: Record<string, unknown>
  version: number
  createdAt: TimestampMillis
  updatedAt: TimestampMillis
  deletedAt: TimestampMillis | null
}

class ServerStore {
  private entities = new Map<string, ServerEntity>()
  private changeLog: ChangeLogEntry[] = []
  private entityCounters: Record<string, number> = {}

  // ─── CRUD Operations ───────────────────────────────────────

  /** Create a new entity */
  createEntity(
    type: string,
    data: Record<string, unknown>,
    tenantId: string,
    userId: string,
  ): ServerEntity {
    const id = (data.id as string) || generateId()
    const now = Date.now()

    const entity: ServerEntity = {
      id,
      tenantId,
      type,
      data: {
        ...data,
        id,
        tenantId,
        createdAt: data.createdAt ?? now,
        updatedAt: now,
        deletedAt: null,
        version: 1,
        createdBy: userId,
        updatedBy: userId,
      },
      version: 1,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    }

    this.entities.set(id, entity)
    this.logChange(type, id, 'create', entity.data, undefined, tenantId, userId)

    return entity
  }

  /** Get entity by ID (tenant-scoped) */
  getEntity(id: string, tenantId?: string): ServerEntity | undefined {
    const entity = this.entities.get(id)
    if (!entity) return undefined
    if (entity.deletedAt) return undefined
    if (tenantId && entity.tenantId !== tenantId) return undefined
    return entity
  }

  /** List entities by type (tenant-scoped, non-deleted) */
  getEntitiesByType(type: string, tenantId: string): ServerEntity[] {
    return Array.from(this.entities.values()).filter(
      (e) => e.type === type && e.tenantId === tenantId && !e.deletedAt,
    )
  }

  /** Update an existing entity */
  updateEntity(
    type: string,
    id: string,
    data: Record<string, unknown>,
    tenantId: string,
  ): ServerEntity | null {
    const existing = this.entities.get(id)
    if (!existing) return null
    if (existing.tenantId !== tenantId) return null
    if (existing.deletedAt) return null

    // Optimistic concurrency check
    if (data.version != null && existing.version !== (data.version as number)) {
      throw new Error(`Version conflict: expected ${existing.version}, got ${data.version}`)
    }

    const now = Date.now()
    const previousData = { ...existing.data }

    existing.data = {
      ...existing.data,
      ...data,
      id,
      tenantId,
      updatedAt: now,
      version: existing.version + 1,
      updatedBy: data.updatedBy ?? 'api',
    }
    existing.version++
    existing.updatedAt = now

    this.entities.set(id, existing)
    this.logChange(type, id, 'update', existing.data, previousData, tenantId, 'api')

    return existing
  }

  /** Soft-delete an entity */
  softDeleteEntity(type: string, id: string, tenantId: string): boolean {
    const existing = this.entities.get(id)
    if (!existing || existing.tenantId !== tenantId || existing.deletedAt) {
      return false
    }

    const now = Date.now()
    existing.data.deletedAt = now
    existing.data.updatedAt = now
    existing.deletedAt = now
    existing.updatedAt = now

    this.entities.set(id, existing)
    this.logChange(type, id, 'delete', existing.data, undefined, tenantId, 'api')

    return true
  }

  /** Count entities with optional filter */
  countEntities(type: string, tenantId: string, filter?: Record<string, unknown>): number {
    let entities = this.getEntitiesByType(type, tenantId)

    if (filter) {
      for (const [key, value] of Object.entries(filter)) {
        entities = entities.filter((e) => e.data[key] === value)
      }
    }

    return entities.length
  }

  // ─── Sync Operations ───────────────────────────────────────

  /** Upsert entity from sync push */
  upsertEntity(type: string, data: Record<string, unknown>, tenantId: string): ServerEntity {
    const id = data.id as string
    const existing = this.entities.get(id)
    const now = Date.now()

    if (existing) {
      existing.data = { ...existing.data, ...data }
      existing.version = (data.version as number) ?? existing.version + 1
      existing.updatedAt = now
      if (data.deletedAt) {
        existing.deletedAt = data.deletedAt as number
      }
      this.entities.set(id, existing)
      return existing
    }

    const entity: ServerEntity = {
      id,
      tenantId,
      type,
      data: { ...data },
      version: (data.version as number) ?? 1,
      createdAt: (data.createdAt as number) ?? now,
      updatedAt: now,
      deletedAt: (data.deletedAt as number | null) ?? null,
    }
    this.entities.set(id, entity)
    return entity
  }

  /** Get all changes since timestamp (for pull) */
  getChangesSince(since: TimestampMillis, tenantId: string): ChangeLogEntry[] {
    return this.changeLog
      .filter((c) => c.timestamp > since && c.tenantId === tenantId)
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(0, 1000) // Limit to 1000 changes per pull
  }

  /** Append change log entry */
  appendChangeLog(entry: ChangeLogEntry): void {
    this.changeLog.push(entry)
    if (this.changeLog.length > 100000) {
      this.changeLog = this.changeLog.slice(-50000)
    }
  }

  private logChange(
    entityType: string,
    entityId: string,
    operation: 'create' | 'update' | 'delete',
    data: Record<string, unknown>,
    previousData: Record<string, unknown> | undefined,
    tenantId: string,
    performedBy: string,
  ): void {
    this.appendChangeLog({
      id: generateId(),
      entityType,
      entityId,
      operation,
      data,
      previousData,
      timestamp: Date.now(),
      clientId: 'server',
      tenantId,
      performedBy,
      status: 'synced',
      retryCount: 0,
    })
  }

  // ─── Analytics Helpers ─────────────────────────────────────

  /** Get aggregated counts for dashboard */
  getTenantStats(tenantId: string) {
    const types = ['patient', 'doctor', 'appointment', 'billing', 'inventory', 'medicalRecord', 'prescription']

    const stats: Record<string, { total: number; active?: number; draft?: number }> = {}

    for (const type of types) {
      const entities = this.getEntitiesByType(type, tenantId)
      stats[type] = { total: entities.length }

      if (type === 'patient') {
        stats[type].active = entities.filter((e) => e.data.status === 'active').length
      }
      if (type === 'doctor') {
        stats[type].active = entities.filter((e) => e.data.status === 'active').length
      }
      if (type === 'appointment') {
        stats[type].active = entities.filter(
          (e) => ['scheduled', 'confirmed'].includes(e.data.status as string),
        ).length
      }
      if (type === 'billing') {
        stats[type].active = entities.filter(
          (e) => e.data.status === 'paid',
        ).length
        stats[type].draft = entities.filter(
          (e) => e.data.status !== 'paid' && e.data.status !== 'cancelled',
        ).length
      }
      if (type === 'inventory') {
        stats[type].active = entities.filter(
          (e) => e.data.status === 'out_of_stock' || e.data.status === 'low_stock',
        ).length
      }
    }

    return stats
  }

  // ─── Health ──────────────────────────────────────────────────

  getHealth() {
    return {
      status: 'healthy',
      totalEntities: this.entities.size,
      activeEntities: Array.from(this.entities.values()).filter((e) => !e.deletedAt).length,
      changeLogEntries: this.changeLog.length,
      entityTypes: [...new Set(Array.from(this.entities.values()).map((e) => e.type))],
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    }
  }

  getServerTime(): TimestampMillis {
    return Date.now()
  }

  // ─── Seed / Demo Data ──────────────────────────────────────

  /** Seed demo data for development */
  seedDemoData(tenantId: string): void {
    const now = Date.now()

    // Seed departments
    const dept1 = this.createEntity('department', {
      name: 'Medicina General', code: 'MG', type: 'clinical',
      floor: '1', building: 'A', roomCount: 5, isActive: true,
    }, tenantId, 'system')
    const dept2 = this.createEntity('department', {
      name: 'Pediatría', code: 'PED', type: 'clinical',
      floor: '2', building: 'A', roomCount: 3, isActive: true,
    }, tenantId, 'system')
    const dept3 = this.createEntity('department', {
      name: 'Farmacia', code: 'FAR', type: 'pharmacy',
      floor: 'PB', building: 'A', roomCount: 1, isActive: true,
    }, tenantId, 'system')

    // Seed doctors
    const doc1 = this.createEntity('doctor', {
      fullName: 'Dr. Carlos Mendoza López', licenseNumber: 'CED-12345678',
      specialty: 'general_medicine', phone: '+52 555 100 2001',
      email: 'carlos.mendoza@clinicmeta.local', consultationFee: 500,
      yearsOfExperience: 15, status: 'active', totalConsultations: 3450,
      departmentId: dept1.id,
    }, tenantId, 'system')

    const doc2 = this.createEntity('doctor', {
      fullName: 'Dra. María González Ruiz', licenseNumber: 'CED-87654321',
      specialty: 'pediatrics', phone: '+52 555 100 2002',
      email: 'maria.gonzalez@clinicmeta.local', consultationFee: 600,
      yearsOfExperience: 12, status: 'active', totalConsultations: 2100,
      departmentId: dept2.id,
    }, tenantId, 'system')

    // Seed patients
    const patient1 = this.createEntity('patient', {
      fullName: 'Ana García Hernández', dateOfBirth: '1985-03-15',
      gender: 'female', phone: '+52 555 300 4001', bloodType: 'O+',
      allergies: 'Penicilina', status: 'active', primaryDoctorId: doc1.id,
    }, tenantId, 'system')

    const patient2 = this.createEntity('patient', {
      fullName: 'Roberto Sánchez Díaz', dateOfBirth: '2018-07-22',
      gender: 'male', phone: '+52 555 300 4002', bloodType: 'A+',
      status: 'active', primaryDoctorId: doc2.id,
    }, tenantId, 'system')

    const patient3 = this.createEntity('patient', {
      fullName: 'Laura Martínez Vega', dateOfBirth: '1972-11-08',
      gender: 'female', phone: '+52 555 300 4003', bloodType: 'AB+',
      chronicConditions: 'Diabetes tipo 2, Hipertensión', status: 'active',
      primaryDoctorId: doc1.id,
    }, tenantId, 'system')

    // Seed appointments
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); tomorrow.setHours(9, 0, 0, 0)
    const tomorrow2 = new Date(tomorrow); tomorrow2.setHours(10, 0, 0, 0)
    const tomorrow3 = new Date(tomorrow); tomorrow3.setHours(11, 0, 0, 0)

    this.createEntity('appointment', {
      patientId: patient1.id, doctorId: doc1.id, type: 'consulta_general',
      scheduledStart: tomorrow.getTime(), scheduledEnd: tomorrow2.getTime(),
      durationMinutes: 30, reason: 'Control de rutina', status: 'scheduled',
      priority: 'normal',
    }, tenantId, 'system')

    this.createEntity('appointment', {
      patientId: patient2.id, doctorId: doc2.id, type: 'consulta_especialidad',
      scheduledStart: tomorrow2.getTime(), scheduledEnd: tomorrow3.getTime(),
      durationMinutes: 30, reason: 'Revisión pediátrica', status: 'confirmed',
      priority: 'normal',
    }, tenantId, 'system')

    // Seed inventory
    this.createEntity('inventory', {
      name: 'Paracetamol 500mg', genericName: 'Paracetamol', category: 'medication',
      unit: 'tablet', quantityOnHand: 500, minimumQuantity: 50, maximumQuantity: 1000,
      unitCost: 0.50, sellingPrice: 2.00, supplier: 'Farmacéutica Nacional',
      status: 'in_stock', location: 'FAR-A1',
    }, tenantId, 'system')

    this.createEntity('inventory', {
      name: 'Guantes de Látex (Caja 100)', category: 'ppe', unit: 'box',
      quantityOnHand: 25, minimumQuantity: 10, maximumQuantity: 50,
      unitCost: 85, sellingPrice: 150, supplier: 'Medical Supplies MX',
      status: 'in_stock', location: 'FAR-B3',
    }, tenantId, 'system')

    this.createEntity('inventory', {
      name: 'Jeringas 5ml', category: 'supplies', unit: 'piece',
      quantityOnHand: 8, minimumQuantity: 50, maximumQuantity: 200,
      unitCost: 3.50, status: 'low_stock', location: 'FAR-A2',
    }, tenantId, 'system')

    // Seed billing
    this.createEntity('billing', {
      invoiceNumber: 'FAC-2026-00001', patientId: patient1.id, doctorId: doc1.id,
      items: [{ id: '1', description: 'Consulta General', quantity: 1, unitPrice: 500, total: 500, category: 'consultation', taxRate: 0.16, taxExempt: false }],
      subTotal: 500, taxAmount: 80, discountAmount: 0, totalAmount: 580,
      paidAmount: 580, balanceDue: 0, status: 'paid', issueDate: now - 86400000 * 7,
      currency: 'MXN', invoiceType: 'recibo',
    }, tenantId, 'system')

    console.log(`✅ Seeded demo data for tenant: ${tenantId}`)
    console.log(`   Departments: ${dept1.data.name}, ${dept2.data.name}, ${dept3.data.name}`)
    console.log(`   Doctors: ${(doc1.data as any).fullName}, ${(doc2.data as any).fullName}`)
    console.log(`   Patients: ${(patient1.data as any).fullName}, ${(patient2.data as any).fullName}, ${(patient3.data as any).fullName}`)
    console.log(`   Appointments: 2 scheduled`)
    console.log(`   Inventory: 3 items (1 low stock ⚠️)`)
    console.log(`   Billing: 1 paid invoice`)
  }
}

export const serverStore = new ServerStore()
