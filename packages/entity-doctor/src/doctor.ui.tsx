/**
 * ─── Doctor UI Configuration (English) ───────────────────────
 * Metadata-driven — all labels configurable per tenant.
 */

import React from 'react'
import type { Doctor } from './doctor.schema'
import { DOCTOR_STATUS_LABELS, DOCTOR_SPECIALTY_LABELS, DoctorSpecialtySchema } from './doctor.schema'

export interface ColumnDef<T> {
  key: keyof T | string; label: string; sortable?: boolean; filterable?: boolean
  searchable?: boolean; width?: string; render?: (value: unknown, row: T) => React.ReactNode
}
export interface FormFieldDef {
  name: string; label: string
  type: 'text' | 'email' | 'tel' | 'url' | 'select' | 'textarea' | 'tags' | 'number' | 'date' | 'section'
  placeholder?: string; required?: boolean; defaultValue?: string | number | string[]
  options?: Array<{ label: string; value: string }>; helperText?: string
}
export interface DetailSectionDef {
  title: string; fields: Array<{ label: string; key: string; render?: (value: unknown) => React.ReactNode }>
}

const specialtyOptions = DoctorSpecialtySchema.options.map(s => ({ label: DOCTOR_SPECIALTY_LABELS[s], value: s }))

export const DoctorUIConfig = {
  defaultColumns: [
    { key: 'fullName', label: 'Name', sortable: true, searchable: true, width: '200px' },
    { key: 'specialty', label: 'Specialty', sortable: true, filterable: true, width: '180px' },
    { key: 'licenseNumber', label: 'License #', sortable: true, searchable: true, width: '120px' },
    { key: 'phone', label: 'Phone', sortable: true, width: '140px' },
    { key: 'email', label: 'Email', sortable: true, width: '200px' },
    { key: 'status', label: 'Status', sortable: true, filterable: true, width: '110px' },
    { key: 'totalConsultations', label: 'Consults', sortable: true, width: '100px' },
  ] satisfies ColumnDef<Doctor>[],

  formFields: {
    create: [
      { name: 'section_professional', label: '─ Professional Details ─', type: 'section' },
      { name: 'fullName', label: 'Full Name', type: 'text', required: true, placeholder: 'Dr. John Smith' },
      { name: 'licenseNumber', label: 'License Number', type: 'text', required: true, placeholder: '12345678' },
      { name: 'specialty', label: 'Specialty', type: 'select', required: true, options: specialtyOptions },
      { name: 'subSpecialties', label: 'Sub-Specialties', type: 'tags', placeholder: 'Interventional cardiology...' },
      { name: 'yearsOfExperience', label: 'Years of Experience', type: 'number' },
      { name: 'education', label: 'Education', type: 'textarea', placeholder: 'University...' },
      { name: 'certifications', label: 'Certifications', type: 'tags', placeholder: 'Board certified in...' },
      { name: 'section_contact', label: '─ Contact ─', type: 'section' },
      { name: 'phone', label: 'Phone', type: 'tel', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'officeNumber', label: 'Office Number', type: 'text' },
      { name: 'section_schedule', label: '─ Consultation Schedule ─', type: 'section' },
      { name: 'defaultConsultDuration', label: 'Consult Duration (min)', type: 'number', defaultValue: 30 },
      { name: 'consultationFee', label: 'Consultation Fee', type: 'number' },
      { name: 'maxPatientsPerDay', label: 'Max Patients/Day', type: 'number' },
      { name: 'availableDays', label: 'Available Days', type: 'tags', placeholder: '1,2,3,4,5' },
      { name: 'workHoursStart', label: 'Start Time', type: 'text', defaultValue: '08:00' },
      { name: 'workHoursEnd', label: 'End Time', type: 'text', defaultValue: '17:00' },
      { name: 'section_other', label: '─ Additional ─', type: 'section' },
      { name: 'languages', label: 'Languages', type: 'tags', placeholder: 'en, es' },
      { name: 'tags', label: 'Tags', type: 'tags' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ] satisfies FormFieldDef[],
    edit: [
      { name: 'fullName', label: 'Full Name', type: 'text', required: true },
      { name: 'licenseNumber', label: 'License Number', type: 'text', required: true },
      { name: 'specialty', label: 'Specialty', type: 'select', options: specialtyOptions },
      { name: 'phone', label: 'Phone', type: 'tel', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'officeNumber', label: 'Office Number', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: [
        { label: 'Active', value: 'active' }, { label: 'Inactive', value: 'inactive' },
        { label: 'On Leave', value: 'on_leave' }, { label: 'Suspended', value: 'suspended' },
      ]},
      { name: 'tags', label: 'Tags', type: 'tags' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ] satisfies FormFieldDef[],
  },

  detailSections: [
    { title: 'Professional Information', fields: [
      {label:'Name',key:'fullName'},{label:'License',key:'licenseNumber'},
      {label:'Specialty',key:'specialty'},{label:'Sub-Specialties',key:'subSpecialties'},
      {label:'Years of Experience',key:'yearsOfExperience'},{label:'Education',key:'education'},
      {label:'Certifications',key:'certifications'},{label:'Languages',key:'languages'},
    ]},
    { title: 'Contact & Office', fields: [
      {label:'Phone',key:'phone'},{label:'Email',key:'email'},
      {label:'Office',key:'officeNumber'},{label:'Department',key:'departmentId'},
    ]},
    { title: 'Schedule & Consultations', fields: [
      {label:'Consult Duration',key:'defaultConsultDuration'},{label:'Consult Fee',key:'consultationFee'},
      {label:'Max Patients/Day',key:'maxPatientsPerDay'},{label:'Available Days',key:'availableDays'},
      {label:'Hours',key:'_workHours'},
    ]},
    { title: 'Statistics', fields: [
      {label:'Status',key:'status'},{label:'Total Consults',key:'totalConsultations'},
      {label:'Rating',key:'rating'},
    ]},
  ] satisfies DetailSectionDef[],

  quickActions: [
    { label: 'View Schedule', action: 'schedule', icon: 'Calendar' },
    { label: 'Patients', action: 'patients', icon: 'Users' },
    { label: 'Call', action: 'call', icon: 'Phone' },
    { label: 'Email', action: 'email', icon: 'Mail' },
  ],
}
