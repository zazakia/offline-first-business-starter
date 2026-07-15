/**
 * ─── Appointment UI Configuration (English) ──────────────────
 */

import React from 'react'
import type { Appointment } from './appointment.schema'
import { APPOINTMENT_STATUS_LABELS, APPOINTMENT_TYPE_LABELS, AppointmentTypeSchema } from './appointment.schema'

export interface ColumnDef<T> { key: keyof T | string; label: string; sortable?: boolean; filterable?: boolean; searchable?: boolean; width?: string; render?: (value: unknown, row: T) => React.ReactNode }
export interface FormFieldDef { name: string; label: string; type: 'text' | 'email' | 'tel' | 'url' | 'select' | 'textarea' | 'tags' | 'number' | 'date' | 'datetime-local' | 'section'; placeholder?: string; required?: boolean; defaultValue?: unknown; options?: Array<{ label: string; value: string }>; helperText?: string }
export interface DetailSectionDef { title: string; fields: Array<{ label: string; key: string; render?: (value: unknown) => React.ReactNode }> }

const typeOptions = AppointmentTypeSchema.options.map(t => ({ label: APPOINTMENT_TYPE_LABELS[t], value: t }))

export const AppointmentUIConfig = {
  defaultColumns: [
    { key: 'scheduledStart', label: 'Date/Time', sortable: true, width: '160px' },
    { key: 'patientId', label: 'Patient', sortable: true, searchable: true, width: '180px' },
    { key: 'doctorId', label: 'Doctor', sortable: true, filterable: true, width: '180px' },
    { key: 'type', label: 'Type', sortable: true, filterable: true, width: '130px' },
    { key: 'reason', label: 'Reason', sortable: true, searchable: true, width: '200px' },
    { key: 'status', label: 'Status', sortable: true, filterable: true, width: '120px' },
    { key: 'priority', label: 'Priority', sortable: true, filterable: true, width: '100px' },
  ] satisfies ColumnDef<Appointment>[],

  formFields: {
    create: [
      { name: 'patientId', label: 'Patient ID', type: 'text', required: true, placeholder: 'Patient UUID' },
      { name: 'doctorId', label: 'Doctor ID', type: 'text', required: true, placeholder: 'Doctor UUID' },
      { name: 'type', label: 'Appointment Type', type: 'select', required: true, options: typeOptions, defaultValue: 'consultation' },
      { name: 'scheduledStart', label: 'Date & Time', type: 'datetime-local', required: true },
      { name: 'durationMinutes', label: 'Duration (minutes)', type: 'number', required: true, defaultValue: 30 },
      { name: 'reason', label: 'Reason for Visit', type: 'textarea', required: true, placeholder: 'Persistent headache...' },
      { name: 'priority', label: 'Priority', type: 'select', options: [{label:'Normal',value:'normal'},{label:'Urgent',value:'urgent'},{label:'Emergency',value:'emergency'}], defaultValue: 'normal' },
      { name: 'room', label: 'Room', type: 'text' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ] satisfies FormFieldDef[],
    edit: [
      { name: 'doctorId', label: 'Doctor ID', type: 'text' },
      { name: 'type', label: 'Type', type: 'select', options: typeOptions },
      { name: 'scheduledStart', label: 'Date/Time', type: 'datetime-local' },
      { name: 'durationMinutes', label: 'Duration (min)', type: 'number' },
      { name: 'reason', label: 'Reason', type: 'textarea' },
      { name: 'status', label: 'Status', type: 'select', options: [
        {label:'Scheduled',value:'scheduled'},{label:'Confirmed',value:'confirmed'},
        {label:'In Progress',value:'in_progress'},{label:'Completed',value:'completed'},
        {label:'Cancelled',value:'cancelled'},{label:'No Show',value:'no_show'},
      ]},
      { name: 'priority', label: 'Priority', type: 'select', options: [{label:'Normal',value:'normal'},{label:'Urgent',value:'urgent'},{label:'Emergency',value:'emergency'}] },
      { name: 'room', label: 'Room', type: 'text' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
      { name: 'cancellationReason', label: 'Cancellation Reason', type: 'textarea' },
    ] satisfies FormFieldDef[],
  },

  detailSections: [
    { title: 'Appointment Details', fields: [
      {label:'Patient',key:'patientId'},{label:'Doctor',key:'doctorId'},
      {label:'Type',key:'type'},{label:'Status',key:'status'},
      {label:'Priority',key:'priority'},{label:'Reason',key:'reason'},
    ]},
    { title: 'Schedule', fields: [
      {label:'Scheduled Start',key:'scheduledStart'},{label:'Scheduled End',key:'scheduledEnd'},
      {label:'Duration',key:'durationMinutes'},{label:'Actual Start',key:'actualStart'},
      {label:'Actual End',key:'actualEnd'},
    ]},
    { title: 'Additional Info', fields: [
      {label:'Room',key:'room'},{label:'Notes',key:'notes'},
      {label:'Cancellation Reason',key:'cancellationReason'},
    ]},
  ] satisfies DetailSectionDef[],

  quickActions: [
    { label: 'Confirm', action: 'confirm', icon: 'CheckCircle' },
    { label: 'Start Consult', action: 'start', icon: 'Play' },
    { label: 'Cancel', action: 'cancel', icon: 'XCircle' },
    { label: 'Prescribe', action: 'prescribe', icon: 'Pill' },
    { label: 'View Record', action: 'view_record', icon: 'FileText' },
  ],
}
