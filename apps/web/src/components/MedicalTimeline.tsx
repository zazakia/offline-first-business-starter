/**
 * ─── Medical Record Timeline ─────────────────────────────────
 * Patient's complete clinical history displayed as a vertical timeline.
 * Shows: medical records, prescriptions, appointments, invoices.
 */

import React, { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Card, CardHeader, CardContent, cn } from '@repo/ui-core'
import { medicalRecordRepo, prescriptionRepo, appointmentRepo, billingRepo } from '../lib/db'
import type { MedicalRecord } from '@repo/entity-medical-record'
import type { Prescription } from '@repo/entity-prescription'
import type { Appointment } from '@repo/entity-appointment'
import type { Invoice } from '@repo/entity-billing'
import { RECORD_TYPE_LABELS, RECORD_STATUS_LABELS } from '@repo/entity-medical-record'
import { PRESCRIPTION_STATUS_LABELS } from '@repo/entity-prescription'
import { APPOINTMENT_STATUS_LABELS } from '@repo/entity-appointment'
import { InvoiceStatusLabels } from '@repo/entity-billing'
import {
  FileText, Pill, Calendar, Receipt, Activity, ChevronRight,
  Stethoscope, AlertCircle, TrendingUp, Clock,
} from 'lucide-react'

// ─── Unified Timeline Event ──────────────────────────────────

interface TimelineEvent {
  id: string
  type: 'appointment' | 'medical_record' | 'prescription' | 'billing'
  date: number
  title: string
  subtitle: string
  status: string
  statusColor: string
  icon: React.ReactNode
  details: Array<{ label: string; value: string }>
  alerts?: string[]
  link: string
}

// ─── Timeline Component ──────────────────────────────────────

interface MedicalTimelineProps {
  patientId: string
  className?: string
}

export function MedicalTimeline({ patientId, className }: MedicalTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [recordsR, prescriptionsR, appointmentsR, invoicesR] = await Promise.all([
          medicalRecordRepo.findMany({ filter: [{ field: 'patientId', operator: 'eq', value: patientId }], limit: 100 }),
          prescriptionRepo.findMany({ filter: [{ field: 'patientId', operator: 'eq', value: patientId }], limit: 100 }),
          appointmentRepo.findMany({ filter: [{ field: 'patientId', operator: 'eq', value: patientId }], limit: 100 }),
          billingRepo.findMany({ filter: [{ field: 'patientId', operator: 'eq', value: patientId }], limit: 100 }),
        ])

        const records = 'items' in recordsR ? recordsR.items as MedicalRecord[] : []
        const prescriptions = 'items' in prescriptionsR ? prescriptionsR.items as Prescription[] : []
        const appointments = 'items' in appointmentsR ? appointmentsR.items as Appointment[] : []
        const invoices = 'items' in invoicesR ? invoicesR.items as Invoice[] : []

        const all: TimelineEvent[] = [
          ...records.map((r): TimelineEvent => ({
            id: r.id,
            type: 'medical_record',
            date: r.encounterDate,
            title: RECORD_TYPE_LABELS[r.type] ?? r.type,
            subtitle: r.chiefComplaint,
            status: RECORD_STATUS_LABELS[r.status] ?? r.status,
            statusColor: r.status === 'final' ? 'text-purple-700 bg-purple-100' :
              r.status === 'draft' ? 'text-gray-700 bg-gray-100' : 'text-blue-700 bg-blue-100',
            icon: <FileText className="h-5 w-5" />,
            details: [
              { label: 'Doctor', value: r.doctorId.slice(0, 8) + '...' },
              ...(r.diagnoses?.length ? [{ label: 'Diagnosis', value: r.diagnoses.map((d: any) => `${d.code} - ${d.description}`).join('; ') }] : []),
              ...(r.treatmentPlan ? [{ label: 'Treatment', value: r.treatmentPlan.slice(0, 100) }] : []),
            ],
            alerts: (r as any)._abnormalVitals ?? [],
            link: `/medical-records/${r.id}`,
          })),

          ...prescriptions.map((rx): TimelineEvent => ({
            id: rx.id,
            type: 'prescription',
            date: rx.startDate ?? rx.createdAt,
            title: 'Medical Prescription',
            subtitle: rx.medications?.map((m: any) => m.name).join(', ') ?? 'No medications',
            status: PRESCRIPTION_STATUS_LABELS[rx.status] ?? rx.status,
            statusColor: rx.status === 'active' ? 'text-green-700 bg-green-100' :
              rx.status === 'dispensed' ? 'text-blue-700 bg-blue-100' :
              rx.status === 'discontinued' ? 'text-red-700 bg-red-100' : 'text-gray-700 bg-gray-100',
            icon: <Pill className="h-5 w-5" />,
            details: [
              { label: 'Doctor', value: rx.doctorId.slice(0, 8) + '...' },
              ...(rx.diagnosis ? [{ label: 'Diagnosis', value: rx.diagnosis }] : []),
              { label: 'Medicamentos', value: String(rx.medications?.length ?? 0) },
              ...(rx.totalDays ? [{ label: 'Duration', value: `${rx.totalDays} days` }] : []),
            ],
            alerts: (rx as any)._interactions?.length ? (rx as any)._interactions : undefined,
            link: `/prescriptions/${rx.id}`,
          })),

          ...appointments.map((a): TimelineEvent => ({
            id: a.id,
            type: 'appointment',
            date: a.scheduledStart,
            title: 'Medical Appointment',
            subtitle: a.reason,
            status: APPOINTMENT_STATUS_LABELS[a.status] ?? a.status,
            statusColor: a.status === 'completed' ? 'text-purple-700 bg-purple-100' :
              a.status === 'scheduled' || a.status === 'confirmed' ? 'text-blue-700 bg-blue-100' :
              a.status === 'cancelled' ? 'text-red-700 bg-red-100' : 'text-gray-700 bg-gray-100',
            icon: <Calendar className="h-5 w-5" />,
            details: [
              { label: 'Doctor', value: a.doctorId.slice(0, 8) + '...' },
              { label: 'Date', value: new Date(a.scheduledStart).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) },
              ...(a.room ? [{ label: 'Room', value: a.room }] : []),
            ],
            link: `/appointments/${a.id}`,
          })),

          ...invoices.map((inv): TimelineEvent => ({
            id: inv.id,
            type: 'billing',
            date: inv.issueDate,
            title: inv.invoiceNumber,
            subtitle: `$${inv.totalAmount?.toLocaleString('en-US') ?? inv.totalAmount} ${inv.currency}`,
            status: InvoiceStatusLabels[inv.status] ?? inv.status,
            statusColor: inv.status === 'paid' ? 'text-green-700 bg-green-100' :
              inv.status === 'sent' || inv.status === 'partial' ? 'text-yellow-700 bg-yellow-100' :
              inv.status === 'cancelled' ? 'text-red-700 bg-red-100' : 'text-gray-700 bg-gray-100',
            icon: <Receipt className="h-5 w-5" />,
            details: [
              { label: 'Total', value: `$${inv.totalAmount?.toLocaleString('en-US') ?? inv.totalAmount}` },
              { label: 'Pagado', value: `$${inv.paidAmount?.toLocaleString('en-US') ?? inv.paidAmount}` },
              { label: 'Saldo', value: `$${inv.balanceDue?.toLocaleString('en-US') ?? inv.balanceDue}` },
            ],
            link: `/billing/${inv.id}`,
          })),
        ]

        // Sort by date descending (newest first)
        all.sort((a, b) => b.date - a.date)

        setEvents(all)
      } catch (err) {
        console.error('Failed to load timeline:', err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [patientId])

  if (loading) {
    return (
      <div className={cn('space-y-3', className)}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <Card className={className}>
        <CardContent>
          <div className="py-8 text-center">
            <Activity className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-2 text-sm font-medium text-gray-500">No clinical history</p>
            <p className="text-xs text-gray-400">No consultations, prescriptions or appointments recorded yet.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const typeIcons = {
    appointment: 'bg-blue-100 text-blue-600',
    medical_record: 'bg-purple-100 text-purple-600',
    prescription: 'bg-green-100 text-green-600',
    billing: 'bg-yellow-100 text-yellow-600',
  }

  return (
    <div className={cn('relative', className)}>
      {/* Vertical Line */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

      <div className="space-y-6">
        {events.map((event, idx) => (
          <div key={event.id} className="relative pl-14">
            {/* Timeline Dot */}
            <div className={cn(
              'absolute left-3.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white shadow',
              typeIcons[event.type],
            )}>
              {event.icon}
            </div>

            {/* Event Card */}
            <Link to={event.link as any} className="block">
              <div className="rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-gray-900">{event.title}</h4>
                      <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', event.statusColor)}>
                        {event.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{event.subtitle}</p>
                  </div>
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock className="h-3 w-3" />
                    {new Date(event.date).toLocaleDateString('es-MX', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </span>
                </div>

                {/* Details */}
                {event.details.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1">
                    {event.details.map((d) => (
                      <div key={d.label} className="flex items-center gap-1">
                        <span className="text-xs text-gray-400">{d.label}:</span>
                        <span className="text-xs font-medium text-gray-600 truncate">{d.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Alerts */}
                {event.alerts && event.alerts.length > 0 && (
                  <div className="mt-3 rounded-md bg-red-50 p-2">
                    {event.alerts.map((alert, i) => (
                      <div key={i} className="flex items-center gap-1 text-xs text-red-700">
                        <AlertCircle className="h-3 w-3" />
                        {alert}
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-2 flex items-center justify-end text-xs text-gray-400">
                  Ver detalles <ChevronRight className="h-3 w-3 ml-1" />
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
