/**
 * ─── Clinic Analytics ────────────────────────────────────────
 * Analytics queries and reporting for clinic operations.
 * Designed to work with both local DB (offline) and Supabase.
 */

import type { Repository } from '@repo/core'

// ─── Types ───────────────────────────────────────────────────

export interface AnalyticsSnapshot {
  generatedAt: number
  period: { start: number; end: number }

  // Patients
  patients: {
    total: number
    active: number
    newThisPeriod: number
    byGender: Record<string, number>
    byAgeGroup: Record<string, number>
    byStatus: Record<string, number>
  }

  // Appointments
  appointments: {
    total: number
    completed: number
    cancelled: number
    noShow: number
    byType: Record<string, number>
    byDoctor: Record<string, number>
    averageWaitMinutes: number
    totalConsultHours: number
  }

  // Billing & Revenue
  billing: {
    totalInvoiced: number
    totalCollected: number
    outstanding: number
    byPaymentMethod: Record<string, number>
    averageInvoiceAmount: number
    collectionRate: number
  }

  // Inventory
  inventory: {
    totalItems: number
    totalValue: number
    lowStock: number
    outOfStock: number
    expiringSoon: number
    byCategory: Record<string, number>
  }

  // Clinical
  clinical: {
    totalRecords: number
    totalPrescriptions: number
    topDiagnoses: Array<{ code: string; description: string; count: number }>
    topMedications: Array<{ name: string; count: number }>
    averagePrescriptionsPerRecord: number
  }
}

export interface DoctorPerformance {
  doctorId: string
  doctorName: string
  totalConsultations: number
  completedAppointments: number
  cancelledAppointments: number
  noShowRate: number
  averageConsultDuration: number
  totalRevenue: number
  patientSatisfaction?: number
}

// ─── Analytics Engine ────────────────────────────────────────

export class ClinicAnalytics {
  private repos: Record<string, Repository<any>>

  constructor(repos: Record<string, Repository<any>>) {
    this.repos = repos
  }

  /**
   * Generate a complete analytics snapshot for a time period.
   */
  async generateSnapshot(start: number, end: number): Promise<AnalyticsSnapshot> {
    const [patients, appointments, invoices, inventory, records, prescriptions] =
      await Promise.all([
        this.loadAll('patient'),
        this.loadAll('appointment'),
        this.loadAll('billing'),
        this.loadAll('inventory'),
        this.loadAll('medicalRecord'),
        this.loadAll('prescription'),
      ])

    const newPatients = patients.filter((p: any) => p.createdAt >= start && p.createdAt <= end)
    const periodAppointments = appointments.filter((a: any) =>
      a.scheduledStart >= start && a.scheduledStart <= end,
    )
    const periodInvoices = invoices.filter((i: any) =>
      i.issueDate >= start && i.issueDate <= end,
    )
    const periodRecords = records.filter((r: any) =>
      r.encounterDate >= start && r.encounterDate <= end,
    )
    const periodPrescriptions = prescriptions.filter((rx: any) =>
      rx.startDate >= start && rx.startDate <= end,
    )

    return {
      generatedAt: Date.now(),
      period: { start, end },

      patients: {
        total: patients.length,
        active: patients.filter((p: any) => p.status === 'active').length,
        newThisPeriod: newPatients.length,
        byGender: this.countBy(newPatients, 'gender'),
        byAgeGroup: this.ageGroups(patients),
        byStatus: this.countBy(patients, 'status'),
      },

      appointments: {
        total: periodAppointments.length,
        completed: periodAppointments.filter((a: any) => a.status === 'completed').length,
        cancelled: periodAppointments.filter((a: any) => a.status === 'cancelled').length,
        noShow: periodAppointments.filter((a: any) => a.status === 'no_show').length,
        byType: this.countBy(periodAppointments, 'type'),
        byDoctor: this.countBy(periodAppointments, 'doctorId'),
        averageWaitMinutes: this.avgWait(periodAppointments),
        totalConsultHours: this.totalConsultHours(periodAppointments),
      },

      billing: {
        totalInvoiced: this.sumBy(periodInvoices, 'totalAmount'),
        totalCollected: this.sumBy(periodInvoices, 'paidAmount'),
        outstanding: this.sumBy(periodInvoices, 'balanceDue'),
        byPaymentMethod: {},
        averageInvoiceAmount: periodInvoices.length > 0
          ? this.sumBy(periodInvoices, 'totalAmount') / periodInvoices.length
          : 0,
        collectionRate: this.sumBy(periodInvoices, 'totalAmount') > 0
          ? this.sumBy(periodInvoices, 'paidAmount') / this.sumBy(periodInvoices, 'totalAmount')
          : 0,
      },

      inventory: {
        totalItems: inventory.length,
        totalValue: inventory.reduce((sum: number, i: any) => sum + (i.quantityOnHand ?? 0) * (i.unitCost ?? 0), 0),
        lowStock: inventory.filter((i: any) =>
          i.quantityOnHand > 0 && i.quantityOnHand <= (i.minimumQuantity ?? 10),
        ).length,
        outOfStock: inventory.filter((i: any) => i.quantityOnHand <= 0).length,
        expiringSoon: inventory.filter((i: any) =>
          i.expirationDate && i.expirationDate <= Date.now() + 30 * 86400000,
        ).length,
        byCategory: this.countBy(inventory, 'category'),
      },

      clinical: {
        totalRecords: periodRecords.length,
        totalPrescriptions: periodPrescriptions.length,
        topDiagnoses: this.topDiagnoses(periodRecords, 10),
        topMedications: this.topMedications(periodPrescriptions, 10),
        averagePrescriptionsPerRecord: periodRecords.length > 0
          ? periodPrescriptions.length / periodRecords.length
          : 0,
      },
    }
  }

  /**
   * Generate doctor performance metrics.
   */
  async getDoctorPerformance(start: number, end: number): Promise<DoctorPerformance[]> {
    const doctors = await this.loadAll('doctor')
    const appointments = (await this.loadAll('appointment'))
      .filter((a: any) => a.scheduledStart >= start && a.scheduledStart <= end)
    const invoices = (await this.loadAll('billing'))
      .filter((i: any) => i.issueDate >= start && i.issueDate <= end)

    return doctors.map((doc: any) => {
      const docApps = appointments.filter((a: any) => a.doctorId === doc.id)
      const completed = docApps.filter((a: any) => a.status === 'completed')
      const cancelled = docApps.filter((a: any) => a.status === 'cancelled')
      const noShows = docApps.filter((a: any) => a.status === 'no_show')
      const docInvoices = invoices.filter((i: any) => i.doctorId === doc.id)

      const avgDuration = completed.length > 0
        ? completed.reduce((sum: number, a: any) => {
            return sum + (a.actualEnd && a.actualStart ? (a.actualEnd - a.actualStart) / 60000 : a.durationMinutes)
          }, 0) / completed.length
        : 0

      return {
        doctorId: doc.id,
        doctorName: doc.fullName,
        totalConsultations: docApps.length,
        completedAppointments: completed.length,
        cancelledAppointments: cancelled.length,
        noShowRate: docApps.length > 0 ? noShows.length / docApps.length : 0,
        averageConsultDuration: Math.round(avgDuration),
        totalRevenue: this.sumBy(docInvoices, 'totalAmount'),
        patientSatisfaction: doc.rating,
      }
    })
  }

  /**
   * Get daily appointment summary for a week.
   */
  async getWeeklySummary(startDate: number): Promise<Array<{
    date: string
    appointments: number
    completed: number
    cancelled: number
    revenue: number
  }>> {
    const endDate = startDate + 7 * 86400000
    const appointments = (await this.loadAll('appointment'))
      .filter((a: any) => a.scheduledStart >= startDate && a.scheduledStart <= endDate)
    const invoices = (await this.loadAll('billing'))
      .filter((i: any) => i.issueDate >= startDate && i.issueDate <= endDate)

    const days: Array<{ date: string; appointments: number; completed: number; cancelled: number; revenue: number }> = []

    for (let i = 0; i < 7; i++) {
      const dayStart = startDate + i * 86400000
      const dayEnd = dayStart + 86400000
      const dayStr = new Date(dayStart).toISOString().split('T')[0]

      const dayApps = appointments.filter((a: any) => a.scheduledStart >= dayStart && a.scheduledStart < dayEnd)
      const dayInvoices = invoices.filter((i: any) => i.issueDate >= dayStart && i.issueDate < dayEnd)

      days.push({
        date: dayStr,
        appointments: dayApps.length,
        completed: dayApps.filter((a: any) => a.status === 'completed').length,
        cancelled: dayApps.filter((a: any) => a.status === 'cancelled').length,
        revenue: this.sumBy(dayInvoices, 'totalAmount'),
      })
    }

    return days
  }

  // ─── Helpers ───────────────────────────────────────────────

  private async loadAll(entity: string): Promise<any[]> {
    const repo = this.repos[entity]
    if (!repo) return []
    try {
      // Use offset pagination to get everything (for analytics, data is local)
      const result = await repo.findMany({ page: 1, pageSize: 10000 })
      return 'items' in result ? result.items : []
    } catch {
      return []
    }
  }

  private countBy(items: any[], field: string): Record<string, number> {
    const counts: Record<string, number> = {}
    for (const item of items) {
      const val = item[field] ?? 'unknown'
      counts[val] = (counts[val] || 0) + 1
    }
    return counts
  }

  private sumBy(items: any[], field: string): number {
    return items.reduce((sum, item) => sum + (Number(item[field]) || 0), 0)
  }

  private ageGroups(patients: any[]): Record<string, number> {
    const groups: Record<string, number> = { '0-12': 0, '13-17': 0, '18-35': 0, '36-50': 0, '51-65': 0, '65+': 0 }
    const now = Date.now()
    for (const p of patients) {
      if (!p.dateOfBirth) continue
      const dob = new Date(p.dateOfBirth)
      const age = Math.floor((now - dob.getTime()) / (365.25 * 86400000))
      if (age <= 12) groups['0-12']++
      else if (age <= 17) groups['13-17']++
      else if (age <= 35) groups['18-35']++
      else if (age <= 50) groups['36-50']++
      else if (age <= 65) groups['51-65']++
      else groups['65+']++
    }
    return groups
  }

  private avgWait(appointments: any[]): number {
    const withWait = appointments.filter((a: any) => a.actualStart && a.scheduledStart)
    if (withWait.length === 0) return 0
    return withWait.reduce((sum, a) => sum + (a.actualStart - a.scheduledStart), 0) / withWait.length / 60000
  }

  private totalConsultHours(appointments: any[]): number {
    const completed = appointments.filter((a: any) => a.status === 'completed')
    return completed.reduce((sum, a) => {
      if (a.actualEnd && a.actualStart) return sum + (a.actualEnd - a.actualStart)
      return sum + (a.durationMinutes ?? 30) * 60000
    }, 0) / 3600000
  }

  private topDiagnoses(records: any[], limit: number): Array<{ code: string; description: string; count: number }> {
    const counts = new Map<string, { code: string; description: string; count: number }>()
    for (const r of records) {
      const diagnoses = r.diagnoses ?? []
      if (Array.isArray(diagnoses)) {
        for (const d of diagnoses) {
          const key = d.code ?? d.description
          if (!key) continue
          const existing = counts.get(key)
          if (existing) {
            existing.count++
          } else {
            counts.set(key, { code: d.code ?? '', description: d.description ?? '', count: 1 })
          }
        }
      }
    }
    return Array.from(counts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
  }

  private topMedications(prescriptions: any[], limit: number): Array<{ name: string; count: number }> {
    const counts = new Map<string, number>()
    for (const rx of prescriptions) {
      const meds = rx.medications ?? []
      if (Array.isArray(meds)) {
        for (const m of meds) {
          const name = m.name ?? 'Unknown'
          counts.set(name, (counts.get(name) || 0) + 1)
        }
      }
    }
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
  }
}
