/**
 * ─── Customer Detail Page ────────────────────────────────────
 * View and edit a single customer.
 * Reads from local DB, demonstrates offline-first CRUD.
 */

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { Card, CardHeader, Button, Input, Badge, Modal } from '@repo/ui-core'
import { customerRepo } from '../../lib/db'
import type { Customer } from '@repo/entity-customer'
import { CUSTOMER_STATUS_LABELS, CUSTOMER_STATUS_COLORS } from '@repo/entity-customer'
import { UpdateCustomerSchema } from '@repo/entity-customer'
import { ChevronLeft, Edit3, Trash2, Save, X } from 'lucide-react'

export function CustomerDetailPage() {
  // Use useParams with a simple approach
  // In TanStack Router v1, we access params differently
  const params = useParams({ from: '/customers/$id' })
  const id = (params as any).id ?? (params as any).$id ?? ''
  const navigate = useNavigate()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState<Record<string, string>>({})

  useEffect(() => {
    async function load() {
      try {
        const result = await customerRepo.findById(id)
        setCustomer(result)
        if (result) {
          setFormData({
            name: result.name,
            email: result.email,
            phone: result.phone ?? '',
            company: result.company ?? '',
            website: result.website ?? '',
            status: result.status,
            notes: result.notes ?? '',
          })
        }
      } catch (error) {
        console.error('Failed to load customer:', error)
      } finally {
        setLoading(false)
      }
    }
    if (id) load()
  }, [id])

  async function handleSave() {
    if (!customer) return
    setSaving(true)
    setErrors({})

    try {
      // Build update payload from form data
      const updatePayload: Record<string, unknown> = {
        ...formData,
        version: customer.version,
      }
      if (updatePayload.phone === '') updatePayload.phone = undefined
      if (updatePayload.company === '') updatePayload.company = undefined
      if (updatePayload.website === '') updatePayload.website = undefined
      if (updatePayload.notes === '') updatePayload.notes = undefined

      const parsed = UpdateCustomerSchema.parse(updatePayload)

      const updated = await customerRepo.update(id, parsed as any)
      setCustomer(updated)
      setEditing(false)
    } catch (error: any) {
      if (error?.issues) {
        const formErrors: Record<string, string> = {}
        for (const issue of error.issues) {
          const path = issue.path.join('.')
          formErrors[path] = issue.message
        }
        setErrors(formErrors)
      } else {
        setErrors({ _form: error?.message ?? 'Update failed' })
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!customer) return
    try {
      await customerRepo.delete(id)
      navigate({ to: '/customers' })
    } catch (error) {
      console.error('Failed to delete customer:', error)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-gray-200" />
          <div className="h-64 rounded-xl bg-gray-200" />
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="p-6">
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900">Customer not found</h2>
            <p className="mt-2 text-sm text-gray-500">This customer may have been deleted.</p>
            <Button className="mt-4" variant="secondary" onClick={() => navigate({ to: '/customers' })}>
              Back to Customers
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: '/customers' })}
            icon={<ChevronLeft className="h-4 w-4" />}
          >
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{customer.name}</h1>
            <p className="text-sm text-gray-500">
              Created {new Date(customer.createdAt).toLocaleDateString()} · v{customer.version}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!editing ? (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setEditing(true)}
                icon={<Edit3 className="h-4 w-4" />}
              >
                Edit
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowDeleteModal(true)}
                icon={<Trash2 className="h-4 w-4" />}
              >
                Delete
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditing(false)
                  setFormData({
                    name: customer.name,
                    email: customer.email,
                    phone: customer.phone ?? '',
                    company: customer.company ?? '',
                    website: customer.website ?? '',
                    status: customer.status,
                    notes: customer.notes ?? '',
                  })
                  setErrors({})
                }}
                icon={<X className="h-4 w-4" />}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                loading={saving}
                onClick={handleSave}
                icon={<Save className="h-4 w-4" />}
              >
                Save
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <Card className="lg:col-span-2">
          <CardHeader title="Contact Information" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {editing ? (
              <>
                <Input
                  label="Name"
                  value={formData.name}
                  onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                  error={errors.name}
                />
                <Input
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))}
                  error={errors.email}
                />
                <Input
                  label="Phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData((f) => ({ ...f, phone: e.target.value }))}
                  error={errors.phone}
                />
                <Input
                  label="Company"
                  value={formData.company}
                  onChange={(e) => setFormData((f) => ({ ...f, company: e.target.value }))}
                  error={errors.company}
                />
                <div className="sm:col-span-2">
                  <Input
                    label="Website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData((f) => ({ ...f, website: e.target.value }))}
                    error={errors.website}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData((f) => ({ ...f, status: e.target.value }))}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="lead">Lead</option>
                    <option value="churned">Churned</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData((f) => ({ ...f, notes: e.target.value }))}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            ) : (
              <>
                <InfoField label="Email" value={customer.email} />
                <InfoField label="Phone" value={customer.phone} />
                <InfoField label="Company" value={customer.company} />
                <InfoField label="Website" value={customer.website} />
                <div className="sm:col-span-2">
                  <span className="block text-sm font-medium text-gray-500 mb-1">Status</span>
                  <Badge color={CUSTOMER_STATUS_COLORS[customer.status]}>
                    {CUSTOMER_STATUS_LABELS[customer.status]}
                  </Badge>
                </div>
                {customer.tags.length > 0 && (
                  <div className="sm:col-span-2">
                    <span className="block text-sm font-medium text-gray-500 mb-1">Tags</span>
                    <div className="flex flex-wrap gap-1">
                      {customer.tags.map((tag) => (
                        <Badge key={tag} color="gray" size="sm">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {customer.notes && (
                  <div className="sm:col-span-2">
                    <span className="block text-sm font-medium text-gray-500 mb-1">Notes</span>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{customer.notes}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </Card>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader title="Activity" />
            <dl className="space-y-3">
              <MetaItem label="Created" value={new Date(customer.createdAt).toLocaleDateString()} />
              <MetaItem label="Updated" value={new Date(customer.updatedAt).toLocaleDateString()} />
              <MetaItem label="Version" value={`v${customer.version}`} />
              <MetaItem label="Created by" value={customer.createdBy} />
              <MetaItem label="Last updated by" value={customer.updatedBy} />
            </dl>
          </Card>

          {customer.lifetimeValue != null && (
            <Card>
              <CardHeader title="Value" />
              <p className="text-2xl font-semibold text-gray-900">
                ${customer.lifetimeValue.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">Lifetime value</p>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Customer"
        description={`Are you sure you want to delete "${customer.name}"? This action can be undone by an administrator.`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete Customer
            </Button>
          </>
        }
      />
    </div>
  )
}

// ─── Helper Components ───────────────────────────────────────

function InfoField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <span className="block text-sm font-medium text-gray-500 mb-1">{label}</span>
      <p className="text-sm text-gray-900">{value || '—'}</p>
    </div>
  )
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="text-sm font-medium text-gray-900">{value}</dd>
    </div>
  )
}
