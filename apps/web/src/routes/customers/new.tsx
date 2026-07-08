/**
 * ─── Create Customer Page ────────────────────────────────────
 * Form to create a new customer.
 * Validates with Zod, writes to local Dexie DB, and syncs in background.
 */

import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Card, CardHeader, Button, Input } from '@repo/ui-core'
import { customerRepo } from '../../lib/db'
import { CreateCustomerSchema } from '@repo/entity-customer'
import { ChevronLeft, Save } from 'lucide-react'

interface FormErrors {
  [key: string]: string
}

export function CreateCustomerPage() {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    website: '',
    status: 'active' as const,
    tags: '',
    notes: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setErrors({})

    try {
      // Parse tags
      const tags = formData.tags
        ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : []

      // Validate with Zod
      const parsed = CreateCustomerSchema.parse({
        tenantId: 'default',
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        company: formData.company || undefined,
        website: formData.website || undefined,
        status: formData.status,
        tags,
        notes: formData.notes || undefined,
      })

      // Write to local DB (offline-first)
      const customer = await customerRepo.create(parsed)

      // Navigate to the new customer
      navigate({ to: '/customers/$id', params: { id: customer.id } })
    } catch (error: any) {
      if (error?.issues) {
        // Zod validation errors
        const formErrors: FormErrors = {}
        for (const issue of error.issues) {
          const path = issue.path.join('.')
          formErrors[path] = issue.message
        }
        setErrors(formErrors)
      } else {
        setErrors({ _form: error?.message ?? 'An unexpected error occurred' })
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ to: '/customers' })}
          icon={<ChevronLeft className="h-4 w-4" />}
        >
          Back to Customers
        </Button>
      </div>

      <Card className="max-w-2xl">
        <CardHeader title="Add Customer" description="Create a new customer record" />

        <form onSubmit={handleSubmit} className="space-y-6">
          {errors._form && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {errors._form}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Input
                label="Full Name"
                required
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                error={errors.name}
              />
            </div>

            <div>
              <Input
                label="Email"
                required
                type="email"
                placeholder="john@company.com"
                value={formData.email}
                onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))}
                error={errors.email}
              />
            </div>

            <div>
              <Input
                label="Phone"
                type="tel"
                placeholder="+1 555-0123"
                value={formData.phone}
                onChange={(e) => setFormData((f) => ({ ...f, phone: e.target.value }))}
                error={errors.phone}
              />
            </div>

            <div>
              <Input
                label="Company"
                placeholder="Acme Inc."
                value={formData.company}
                onChange={(e) => setFormData((f) => ({ ...f, company: e.target.value }))}
                error={errors.company}
              />
            </div>

            <div className="sm:col-span-2">
              <Input
                label="Website"
                type="url"
                placeholder="https://acme.com"
                value={formData.website}
                onChange={(e) => setFormData((f) => ({ ...f, website: e.target.value }))}
                error={errors.website}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData((f) => ({ ...f, status: e.target.value as any }))}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="lead">Lead</option>
                <option value="churned">Churned</option>
              </select>
            </div>

            <div>
              <Input
                label="Tags"
                placeholder="vip, enterprise, support (comma-separated)"
                value={formData.tags}
                onChange={(e) => setFormData((f) => ({ ...f, tags: e.target.value }))}
                helperText="Separate tags with commas"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                rows={3}
                placeholder="Any additional notes..."
                value={formData.notes}
                onChange={(e) => setFormData((f) => ({ ...f, notes: e.target.value }))}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button
              variant="secondary"
              type="button"
              onClick={() => navigate({ to: '/customers' })}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={saving}
              icon={<Save className="h-4 w-4" />}
            >
              Save Customer
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
