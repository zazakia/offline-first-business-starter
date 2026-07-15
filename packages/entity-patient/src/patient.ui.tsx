/**
 * ─── Patient UI Configuration (English) ──────────────────────
 * Metadata-driven — all labels, fields, and sections are configurable per tenant.
 */

import React from 'react'
import type { Patient, PatientStatus } from './patient.schema'
import { PATIENT_STATUS_LABELS, PATIENT_STATUS_COLORS, GENDER_LABELS } from './patient.schema'

export interface ColumnDef<T> {
  key: keyof T | string
  label: string
  sortable?: boolean
  filterable?: boolean
  searchable?: boolean
  width?: string
  render?: (value: unknown, row: T) => React.ReactNode
}

export interface FormFieldDef {
  name: string
  label: string
  type: 'text' | 'email' | 'tel' | 'url' | 'select' | 'textarea' | 'tags' | 'number' | 'date' | 'section'
  placeholder?: string
  required?: boolean
  defaultValue?: string
  options?: Array<{ label: string; value: string }>
  helperText?: string
}

export interface DetailSectionDef {
  title: string
  fields: Array<{ label: string; key: string; render?: (value: unknown) => React.ReactNode }>
}

export const PatientUIConfig = {
  defaultColumns: [
    { key: 'fullName', label: 'Full Name', sortable: true, searchable: true, width: '200px' },
    { key: 'dateOfBirth', label: 'DOB', sortable: true, width: '120px' },
    { key: 'gender', label: 'Gender', sortable: true, filterable: true, width: '80px' },
    { key: 'phone', label: 'Phone', sortable: true, searchable: true, width: '150px' },
    { key: 'email', label: 'Email', sortable: true, searchable: true, width: '200px' },
    { key: 'bloodType', label: 'Blood', sortable: true, filterable: true, width: '100px' },
    { key: 'status', label: 'Status', sortable: true, filterable: true, width: '120px' },
    { key: 'lastVisitDate', label: 'Last Visit', sortable: true, width: '140px' },
  ] satisfies ColumnDef<Patient>[],

  formFields: {
    create: [
      { name: 'section_personal', label: '─ Personal Information ─', type: 'section' },
      { name: 'fullName', label: 'Full Name', type: 'text', required: true, placeholder: 'John Smith' },
      { name: 'preferredName', label: 'Preferred Name', type: 'text' },
      { name: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true },
      { name: 'gender', label: 'Gender', type: 'select', required: true,
        options: [{label:'Male',value:'male'},{label:'Female',value:'female'},{label:'Other',value:'other'}], defaultValue: 'undisclosed' },
      { name: 'nationalId', label: 'National ID / SSN', type: 'text' },
      { name: 'section_contact', label: '─ Contact Information ─', type: 'section' },
      { name: 'phone', label: 'Phone', type: 'tel', required: true, placeholder: '+1 555 123 4567' },
      { name: 'email', label: 'Email', type: 'email', placeholder: 'patient@email.com' },
      { name: 'section_address', label: '─ Address ─', type: 'section' },
      { name: 'addressLine1', label: 'Address Line 1', type: 'text' },
      { name: 'city', label: 'City', type: 'text' },
      { name: 'state', label: 'State / Province', type: 'text' },
      { name: 'postalCode', label: 'Postal Code', type: 'text' },
      { name: 'section_medical', label: '─ Medical Information ─', type: 'section' },
      { name: 'bloodType', label: 'Blood Type', type: 'select',
        options: ['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(v=>({label:v,value:v})) },
      { name: 'allergies', label: 'Known Allergies', type: 'textarea', placeholder: 'Penicillin, latex, etc.' },
      { name: 'chronicConditions', label: 'Chronic Conditions', type: 'textarea', placeholder: 'Diabetes, hypertension...' },
      { name: 'currentMedications', label: 'Current Medications', type: 'textarea', placeholder: 'Metformin 500mg...' },
      { name: 'section_emergency', label: '─ Emergency Contact ─', type: 'section' },
      { name: 'emergencyContactName', label: 'Contact Name', type: 'text' },
      { name: 'emergencyContactPhone', label: 'Contact Phone', type: 'tel' },
      { name: 'emergencyContactRelation', label: 'Relationship', type: 'text', placeholder: 'Spouse, Parent...' },
      { name: 'section_insurance', label: '─ Insurance ─', type: 'section' },
      { name: 'insuranceProvider', label: 'Insurance Provider', type: 'text', placeholder: 'Blue Cross, Aetna...' },
      { name: 'insurancePolicyNumber', label: 'Policy Number', type: 'text' },
      { name: 'section_other', label: '─ Additional Info ─', type: 'section' },
      { name: 'maritalStatus', label: 'Marital Status', type: 'text' },
      { name: 'occupation', label: 'Occupation', type: 'text' },
      { name: 'preferredLanguage', label: 'Preferred Language', type: 'text', defaultValue: 'en' },
      { name: 'tags', label: 'Tags', type: 'tags', placeholder: 'vip, diabetic...' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ] satisfies FormFieldDef[],

    edit: [
      { name: 'fullName', label: 'Full Name', type: 'text', required: true },
      { name: 'preferredName', label: 'Preferred Name', type: 'text' },
      { name: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true },
      { name: 'gender', label: 'Gender', type: 'select', options: [{label:'Male',value:'male'},{label:'Female',value:'female'},{label:'Other',value:'other'}] },
      { name: 'phone', label: 'Phone', type: 'tel', required: true },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'bloodType', label: 'Blood Type', type: 'select', options: ['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(v=>({label:v,value:v})) },
      { name: 'allergies', label: 'Allergies', type: 'textarea' },
      { name: 'chronicConditions', label: 'Chronic Conditions', type: 'textarea' },
      { name: 'currentMedications', label: 'Current Medications', type: 'textarea' },
      { name: 'insuranceProvider', label: 'Insurance Provider', type: 'text' },
      { name: 'insurancePolicyNumber', label: 'Policy Number', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: [
        {label:'Active',value:'active'},{label:'Inactive',value:'inactive'},
        {label:'Deceased',value:'deceased'},{label:'Transferred',value:'transferred'},
      ]},
      { name: 'tags', label: 'Tags', type: 'tags' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ] satisfies FormFieldDef[],
  },

  detailSections: [
    { title: 'Personal Information', fields: [
      {label:'Full Name',key:'fullName'},{label:'Preferred Name',key:'preferredName'},
      {label:'Date of Birth',key:'dateOfBirth'},{label:'Age',key:'_age'},
      {label:'Gender',key:'gender'},{label:'National ID',key:'nationalId'},
      {label:'Marital Status',key:'maritalStatus'},{label:'Occupation',key:'occupation'},
      {label:'Language',key:'preferredLanguage'},
    ]},
    { title: 'Contact', fields: [
      {label:'Phone',key:'phone'},{label:'Email',key:'email'},
      {label:'Address',key:'addressLine1'},{label:'City',key:'city'},
      {label:'State',key:'state'},{label:'Postal Code',key:'postalCode'},
    ]},
    { title: 'Emergency Contact', fields: [
      {label:'Name',key:'emergencyContactName'},{label:'Phone',key:'emergencyContactPhone'},
      {label:'Relationship',key:'emergencyContactRelation'},
    ]},
    { title: 'Medical Information', fields: [
      {label:'Blood Type',key:'bloodType'},{label:'Allergies',key:'allergies'},
      {label:'Chronic Conditions',key:'chronicConditions'},{label:'Current Medications',key:'currentMedications'},
      {label:'Critical Alerts',key:'_criticalFlags'},
    ]},
    { title: 'Insurance', fields: [
      {label:'Provider',key:'insuranceProvider'},{label:'Policy #',key:'insurancePolicyNumber'},
      {label:'Group #',key:'insuranceGroupNumber'},
    ]},
    { title: 'Activity', fields: [
      {label:'Status',key:'status'},{label:'Last Visit',key:'lastVisitDate'},
      {label:'Created',key:'createdAt'},{label:'Updated',key:'updatedAt'},
    ]},
  ] satisfies DetailSectionDef[],

  quickActions: [
    { label: 'Schedule Appointment', action: 'schedule', icon: 'Calendar' },
    { label: 'New Medical Record', action: 'new_record', icon: 'FileText' },
    { label: 'New Prescription', action: 'prescribe', icon: 'Pill' },
    { label: 'Create Invoice', action: 'invoice', icon: 'Receipt' },
    { label: 'Call', action: 'call', icon: 'Phone' },
    { label: 'Export', action: 'export', icon: 'Download' },
  ],
}
