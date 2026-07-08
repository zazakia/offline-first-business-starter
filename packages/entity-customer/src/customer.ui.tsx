/**
 * ─── Customer UI Configuration ───────────────────────────────
 * Defines how the Customer entity renders in tables, forms, and details.
 * This is consumed by the UI layer to auto-generate views.
 * 
 * Each entity module defines its own UI config, keeping the
 * presentation logic colocated with the business logic.
 */

import React from 'react'
import type { Customer, CustomerStatus } from './customer.schema'
import { CUSTOMER_STATUS_LABELS, CUSTOMER_STATUS_COLORS } from './customer.schema'

/**
 * Column definition for data tables.
 */
export interface ColumnDef<T> {
  key: keyof T | string
  label: string
  sortable?: boolean
  filterable?: boolean
  searchable?: boolean
  width?: string
  render?: (value: unknown, row: T) => React.ReactNode
}

/**
 * Field definition for forms.
 */
export interface FormFieldDef {
  name: string
  label: string
  type: 'text' | 'email' | 'tel' | 'url' | 'select' | 'textarea' | 'tags' | 'number' | 'date'
  placeholder?: string
  required?: boolean
  defaultValue?: string
  options?: Array<{ label: string; value: string }>
  helperText?: string
  validation?: Record<string, unknown>
}

/**
 * Section in the detail view.
 */
export interface DetailSectionDef {
  title: string
  fields: Array<{
    label: string
    key: string
    render?: (value: unknown) => React.ReactNode
  }>
}

/**
 * Customer UI configuration.
 * This is what the auto-CRUD UI reads to render views.
 */
export const CustomerUIConfig = {
  /** Default columns for the customer list table */
  defaultColumns: [
    { key: 'name', label: 'Name', sortable: true, searchable: true, width: '200px' },
    { key: 'email', label: 'Email', sortable: true, searchable: true, width: '250px' },
    { key: 'company', label: 'Company', sortable: true, searchable: true, width: '200px' },
    { key: 'status', label: 'Status', sortable: true, filterable: true, width: '120px' },
    { key: 'tags', label: 'Tags', width: '200px' },
    { key: 'updatedAt', label: 'Last Updated', sortable: true, width: '180px' },
  ] satisfies ColumnDef<Customer>[],

  /** Fields for the create/edit form */
  formFields: {
    create: [
      { name: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'John Doe' },
      { name: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'john@company.com' },
      { name: 'phone', label: 'Phone Number', type: 'tel', placeholder: '+1 555-0123' },
      { name: 'company', label: 'Company', type: 'text', placeholder: 'Acme Inc.' },
      { name: 'website', label: 'Website', type: 'url', placeholder: 'https://acme.com' },
      { 
        name: 'status', label: 'Status', type: 'select', 
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
          { label: 'Lead', value: 'lead' },
          { label: 'Churned', value: 'churned' },
        ],
        defaultValue: 'active',
      },
      { name: 'tags', label: 'Tags', type: 'tags', placeholder: 'Add a tag...' },
      { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Any additional notes...' },
    ] satisfies FormFieldDef[],

    edit: [
      { name: 'name', label: 'Full Name', type: 'text', required: true },
      { name: 'email', label: 'Email Address', type: 'email', required: true },
      { name: 'phone', label: 'Phone Number', type: 'tel' },
      { name: 'company', label: 'Company', type: 'text' },
      { name: 'website', label: 'Website', type: 'url' },
      { 
        name: 'status', label: 'Status', type: 'select',
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
          { label: 'Lead', value: 'lead' },
          { label: 'Churned', value: 'churned' },
        ],
      },
      { name: 'tags', label: 'Tags', type: 'tags' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ] satisfies FormFieldDef[],
  },

  /** Sections in the detail view */
  detailSections: [
    {
      title: 'Contact Information',
      fields: [
        { label: 'Name', key: 'name' },
        { label: 'Email', key: 'email' },
        { label: 'Phone', key: 'phone' },
        { label: 'Website', key: 'website' },
      ],
    },
    {
      title: 'Business Details',
      fields: [
        { label: 'Company', key: 'company' },
        { label: 'Status', key: 'status' },
        { label: 'Tags', key: 'tags' },
      ],
    },
    {
      title: 'Activity',
      fields: [
        { label: 'Lifetime Value', key: 'lifetimeValue' },
        { label: 'Last Contacted', key: 'lastContactedAt' },
        { label: 'Created', key: 'createdAt' },
        { label: 'Updated', key: 'updatedAt' },
      ],
    },
  ] satisfies DetailSectionDef[],

  /** Quick actions for the customer */
  quickActions: [
    { label: 'Send Email', action: 'email', icon: 'Mail' },
    { label: 'Call', action: 'call', icon: 'Phone' },
    { label: 'Add Note', action: 'note', icon: 'FileText' },
    { label: 'Export', action: 'export', icon: 'Download' },
  ],
}
