/**
 * ─── Appointment Calendar Page ───────────────────────────────
 * Visual day/week calendar for clinic appointments.
 * Color-coded by appointment type, with drag-to-create support.
 */

import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Card, CardHeader, CardContent, cn } from '@repo/ui-core'
import { appointmentRepo } from '../../lib/db'
import type { Appointment } from '@repo/entity-appointment'
import { APPOINTMENT_STATUS_LABELS, APPOINTMENT_TYPE_LABELS } from '@repo/entity-appointment'
import { DEFAULT_APPOINTMENT_TYPES } from '@repo/clinic-config'
import type { AppointmentTypeConfig } from '@repo/clinic-config'
import {
  ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon,
  Clock, MapPin, User, Stethoscope,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────

type ViewMode = 'day' | 'week'

interface CalendarAppointment extends Appointment {
  _position: { top: number; height: number }
  _color: string
  _typeLabel: string
}

// ─── Constants ───────────────────────────────────────────────

const HOUR_HEIGHT = 60 // px per hour
const HOUR_START = 7   // 7:00 AM
const HOUR_END = 21    // 9:00 PM
const TOTAL_HOURS = HOUR_END - HOUR_START

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

// ─── Calendar Page ───────────────────────────────────────────

export function AppointmentCalendarPage() {
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('week')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)

  // Load appointments
  useEffect(() => {
    appointmentRepo.findMany({ page: 1, pageSize: 500 }).then((r) => {
      setAppointments('items' in r ? r.items as Appointment[] : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  // Load type configs from localStorage or defaults
  const typeConfigs = useMemo(() => {
    try {
      const saved = localStorage.getItem('clinicMetaSettings')
      if (saved) {
        const settings = JSON.parse(saved)
        return (settings.appointmentTypes as AppointmentTypeConfig[]) ?? DEFAULT_APPOINTMENT_TYPES
      }
    } catch {}
    return DEFAULT_APPOINTMENT_TYPES
  }, [])

  // ─── Date Navigation ───────────────────────────────────────

  const navigateDays = (days: number) => {
    const d = new Date(currentDate)
    d.setDate(d.getDate() + days)
    setCurrentDate(d)
  }

  const goToToday = () => setCurrentDate(new Date())

  // ─── Week Calculation ──────────────────────────────────────

  const weekStart = useMemo(() => {
    const d = new Date(currentDate)
    const day = d.getDay()
    d.setDate(d.getDate() - day)
    d.setHours(0, 0, 0, 0)
    return d
  }, [currentDate])

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart)
      d.setDate(d.getDate() + i)
      return d
    })
  }, [weekStart])

  // ─── Filter Appointments for View ──────────────────────────

  const viewAppointments = useMemo(() => {
    const startOfView = viewMode === 'day'
      ? new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0, 0, 0)
      : new Date(weekStart)
    const endOfView = viewMode === 'day'
      ? new Date(startOfView.getTime() + 86400000)
      : new Date(startOfView.getTime() + 7 * 86400000)

    return appointments
      .filter((a) => {
        if (a.status === 'cancelled' || a.status === 'no_show') return false
        return a.scheduledStart >= startOfView.getTime() && a.scheduledStart < endOfView.getTime()
      })
      .map((a) => {
        const typeConfig = typeConfigs.find((t) => t.key === a.type) ?? typeConfigs[0]
        const startDate = new Date(a.scheduledStart)
        const endDate = new Date(a.scheduledEnd)
        const hourStart = startDate.getHours() + startDate.getMinutes() / 60
        const hourEnd = endDate.getHours() + endDate.getMinutes() / 60
        const top = (hourStart - HOUR_START) * HOUR_HEIGHT
        const height = Math.max((hourEnd - hourStart) * HOUR_HEIGHT, 30)

        return {
          ...a,
          _position: { top, height },
          _color: typeConfig?.color ?? '#3B82F6',
          _typeLabel: typeConfig?.label ?? a.type,
        } as CalendarAppointment
      })
      .sort((a, b) => a.scheduledStart - b.scheduledStart)
  }, [appointments, viewMode, currentDate, weekStart, typeConfigs])

  // Group by day
  const appointmentsByDay = useMemo(() => {
    const map = new Map<number, CalendarAppointment[]>()
    const days = viewMode === 'day' ? [currentDate] : weekDays

    for (const day of days) {
      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime()
      const dayEnd = dayStart + 86400000
      const dayApps = viewAppointments.filter((a) => a.scheduledStart >= dayStart && a.scheduledStart < dayEnd)
      map.set(dayStart, dayApps)
    }
    return map
  }, [viewAppointments, viewMode, currentDate, weekDays])

  // ─── Render ────────────────────────────────────────────────

  const headerDateStr = viewMode === 'day'
    ? `${DAY_NAMES[currentDate.getDay()]}, ${currentDate.getDate()} de ${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`
    : `${weekDays[0].getDate()}-${weekDays[6].getDate()} de ${MONTH_NAMES[weekDays[0].getMonth()]} ${weekDays[0].getFullYear()}`

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6 h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="h-[600px] animate-pulse rounded-lg bg-gray-100" />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={goToToday}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Hoy
          </button>
          <button onClick={() => navigateDays(viewMode === 'day' ? -1 : -7)} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button onClick={() => navigateDays(viewMode === 'day' ? 1 : 7)} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100">
            <ChevronRight className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900 ml-2">{headerDateStr}</h2>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-300 bg-gray-50 p-0.5">
            <button
              onClick={() => setViewMode('day')}
              className={`rounded-md px-3 py-1 text-xs font-medium ${viewMode === 'day' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
            >
              Día
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`rounded-md px-3 py-1 text-xs font-medium ${viewMode === 'week' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
            >
              Semana
            </button>
          </div>
          <button
            onClick={() => navigate({ to: '/appointments/new' })}
            className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-700"
          >
            <Plus className="h-4 w-4" />
            New Appointment
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex flex-1 overflow-hidden">
        {/* Time Labels */}
        <div className="w-16 shrink-0 border-r border-gray-200 bg-white">
          <div className="h-10" /> {/* Header spacer */}
          {Array.from({ length: TOTAL_HOURS }, (_, i) => {
            const hour = HOUR_START + i
            return (
              <div
                key={hour}
                className="flex items-start justify-end pr-2"
                style={{ height: HOUR_HEIGHT }}
              >
                <span className="text-xs text-gray-400 -mt-2">
                  {String(hour).padStart(2, '0')}:00
                </span>
              </div>
            )
          })}
        </div>

        {/* Day Columns */}
        <div className="flex flex-1 overflow-auto">
          {viewMode === 'day' ? (
            <DayColumn
              date={currentDate}
              appointments={appointmentsByDay.get(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()).getTime()) ?? []}
              onSelect={setSelectedAppointment}
              selected={selectedAppointment}
            />
          ) : (
            weekDays.map((day) => {
              const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime()
              return (
                <DayColumn
                  key={dayStart}
                  date={day}
                  appointments={appointmentsByDay.get(dayStart) ?? []}
                  onSelect={setSelectedAppointment}
                  selected={selectedAppointment}
                  isToday={day.toDateString() === new Date().toDateString()}
                />
              )
            })
          )}
        </div>
      </div>

      {/* Appointment Detail Panel */}
      {selectedAppointment && (
        <AppointmentDetailPanel
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          typeConfigs={typeConfigs}
        />
      )}
    </div>
  )
}

// ─── Day Column ──────────────────────────────────────────────

function DayColumn({
  date,
  appointments,
  onSelect,
  selected,
  isToday,
}: {
  date: Date
  appointments: CalendarAppointment[]
  onSelect: (a: Appointment) => void
  selected: Appointment | null
  isToday?: boolean
}) {
  return (
    <div className={`flex-1 border-r border-gray-200 min-w-[120px] ${isToday ? 'bg-blue-50/30' : ''}`}>
      {/* Day Header */}
      <div className={`h-10 flex items-center justify-center border-b border-gray-200 ${isToday ? 'bg-blue-100' : 'bg-gray-50'}`}>
        <div className="text-center">
          <p className={`text-xs font-medium ${isToday ? 'text-blue-700' : 'text-gray-500'}`}>
            {DAY_NAMES[date.getDay()]}
          </p>
          <p className={`text-sm font-semibold ${isToday ? 'text-blue-900' : 'text-gray-700'}`}>
            {date.getDate()}
          </p>
        </div>
      </div>

      {/* Time Slots */}
      <div className="relative">
        {Array.from({ length: TOTAL_HOURS }, (_, i) => (
          <div
            key={i}
            className="border-b border-gray-100"
            style={{ height: HOUR_HEIGHT }}
          />
        ))}

        {/* Appointments */}
        {appointments.map((apt) => (
          <div
            key={apt.id}
            onClick={() => onSelect(apt)}
            className={cn(
              'absolute left-1 right-1 rounded-md border px-2 py-1 cursor-pointer transition-all hover:shadow-md z-10',
              selected?.id === apt.id ? 'ring-2 ring-offset-1 ring-blue-500 shadow-lg' : '',
            )}
            style={{
              top: apt._position.top,
              height: apt._position.height,
              backgroundColor: `${apt._color}18`,
              borderColor: apt._color,
            }}
          >
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: apt._color }} />
              <p className="text-xs font-medium truncate" style={{ color: apt._color }}>
                {apt._typeLabel}
              </p>
            </div>
            <p className="text-xs text-gray-600 truncate mt-0.5">{apt.reason}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {new Date(apt.scheduledStart).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Appointment Detail Panel ────────────────────────────────

function AppointmentDetailPanel({
  appointment,
  onClose,
  typeConfigs,
}: {
  appointment: Appointment
  onClose: () => void
  typeConfigs: AppointmentTypeConfig[]
}) {
  const typeConfig = typeConfigs.find((t) => t.key === appointment.type)
  const color = typeConfig?.color ?? '#3B82F6'
  const navigate = useNavigate()

  return (
    <div className="border-t border-gray-200 bg-white p-4 shadow-lg">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
            <h3 className="font-semibold text-gray-900">
              {typeConfig?.label ?? appointment.type}
            </h3>
            <span className={cn(
              'rounded-full px-2 py-0.5 text-xs font-medium',
              appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
              appointment.status === 'confirmed' ? 'bg-green-100 text-green-700' :
              appointment.status === 'completed' ? 'bg-purple-100 text-purple-700' :
              'bg-gray-100 text-gray-700',
            )}>
              {APPOINTMENT_STATUS_LABELS[appointment.status]}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-x-8 gap-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">
                {new Date(appointment.scheduledStart).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                {' — '}
                {new Date(appointment.scheduledEnd).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">Patient: {appointment.patientId.slice(0, 8)}...</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Stethoscope className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">Doctor: {appointment.doctorId.slice(0, 8)}...</span>
            </div>
            {appointment.room && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Room: {appointment.room}</span>
              </div>
            )}
          </div>

          <p className="mt-2 text-sm text-gray-700">{appointment.reason}</p>
          {appointment.notes && (
            <p className="mt-1 text-xs text-gray-500 italic">{appointment.notes}</p>
          )}
        </div>

        <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
          ✕
        </button>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => navigate({ to: '/appointments/$id', params: { id: appointment.id } })}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          View Details
        </button>
        <button className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700">
          Confirm Appointment
        </button>
        <button className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">
          Start Consultation
        </button>
      </div>
    </div>
  )
}
