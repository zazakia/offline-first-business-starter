/**
 * ─── Appointment Service ─────────────────────────────────────
 */

import type { Appointment, AppointmentStatus } from './appointment.schema'

export class AppointmentService {
  static prepareForCreate(input: Record<string, unknown>): Record<string, unknown> {
    const data = { ...input }

    // Validate time ordering
    if (typeof data.scheduledStart === 'number' && typeof data.scheduledEnd === 'number') {
      if (data.scheduledEnd <= data.scheduledStart) {
        throw new Error('La hora de fin debe ser posterior a la hora de inicio')
      }
    }

    // Auto-calculate duration if not provided
    if (!data.durationMinutes && typeof data.scheduledStart === 'number' && typeof data.scheduledEnd === 'number') {
      data.durationMinutes = Math.round(((data.scheduledEnd as number) - (data.scheduledStart as number)) / 60000)
    }

    if (typeof data.reason === 'string') {
      data.reason = (data.reason as string).trim()
    }

    if (!data.priority) data.priority = 'normal'
    data.status = 'scheduled'

    return data
  }

  /**
   * Check if two time ranges overlap.
   */
  static hasOverlap(
    start1: number, end1: number,
    start2: number, end2: number,
  ): boolean {
    return start1 < end2 && start2 < end1
  }

  /**
   * Valid state transitions for appointments.
   */
  static ALLOWED_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
    scheduled: ['confirmed', 'cancelled'],
    confirmed: ['in_progress', 'cancelled', 'no_show'],
    in_progress: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
    no_show: ['scheduled'], // Re-schedule a no-show
  }

  /**
   * Check if a status transition is valid.
   */
  static canTransition(from: AppointmentStatus, to: AppointmentStatus): boolean {
    const allowed = AppointmentService.ALLOWED_TRANSITIONS[from]
    return allowed?.includes(to) ?? false
  }

  /**
   * Get status transition error message.
   */
  static getTransitionError(from: AppointmentStatus, to: AppointmentStatus): string {
    const labels = {
      scheduled: 'Programada', confirmed: 'Confirmada', in_progress: 'En Progreso',
      completed: 'Completada', cancelled: 'Cancelada', no_show: 'No Asistió',
    }
    return `No se puede cambiar de "${labels[from]}" a "${labels[to]}"`
  }

  /**
   * Check if appointment is within working hours.
   */
  static isWithinWorkingHours(startMs: number, endMs: number, workStart: string, workEnd: string): boolean {
    const start = new Date(startMs)
    const end = new Date(endMs)
    const [wsH = 0, wsM = 0] = workStart.split(':').map(Number)
    const [weH = 0, weM = 0] = workEnd.split(':').map(Number)

    const ws = new Date(start)
    ws.setHours(wsH, wsM, 0, 0)
    const we = new Date(end)
    we.setHours(weH, weM, 0, 0)

    return start.getTime() >= ws.getTime() && end.getTime() <= we.getTime()
  }

  /**
   * Calculate appointment end time from start + duration.
   */
  static calculateEndTime(startMs: number, durationMinutes: number): number {
    return startMs + durationMinutes * 60 * 1000
  }

  /**
   * Get upcoming appointment within a window.
   */
  static isUpcoming(appointment: Appointment, withinHours: number = 24): boolean {
    const now = Date.now()
    const windowEnd = now + withinHours * 60 * 60 * 1000
    return (
      appointment.status === 'scheduled' ||
      appointment.status === 'confirmed'
    ) && appointment.scheduledStart >= now && appointment.scheduledStart <= windowEnd
  }
}
