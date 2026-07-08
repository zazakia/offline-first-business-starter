/**
 * ─── Customer List Page ──────────────────────────────────────
 * Displays all customers with search, filter, and pagination.
 * Fully offline — reads from local IndexedDB via Dexie.
 */

import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Card, CardHeader, Badge, Button, Input, cn } from '@repo/ui-core'
import { customerRepo } from '../../lib/db'
import type { Customer } from '@repo/entity-customer'
import { CUSTOMER_STATUS_LABELS, CUSTOMER_STATUS_COLORS } from '@repo/entity-customer'
import { Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react'

const PAGE_SIZE = 20

export function CustomerListPage() {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const loadCustomers = useCallback(async () => {
    setLoading(true)
    try {
      const filter = []
      if (statusFilter) {
        filter.push({ field: 'status', operator: 'eq' as const, value: statusFilter })
      }

      const result = await customerRepo.findMany({
        page,
        pageSize: PAGE_SIZE,
        filter: filter.length > 0 ? filter : undefined,
        search: search || undefined,
        sort: [{ field: 'updatedAt', direction: 'desc' }],
      })

      if ('items' in result) {
        setCustomers(result.items as Customer[])
        setTotal(result.total ?? 0)
      }
    } catch (error) {
      console.error('Failed to load customers:', error)
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter])

  useEffect(() => {
    loadCustomers()
  }, [loadCustomers])

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setPage(1)
  }, [search, statusFilter])

  return (
    <div className="p-6">
      <Card>
        <CardHeader
          title="Customers"
          description={`${total} customer${total !== 1 ? 's' : ''} total`}
          action={
            <Link to="/customers/new">
              <Button icon={<Plus className="h-4 w-4" />}>
                Add Customer
              </Button>
            </Link>
          }
        />

        {/* Search & Filter */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="lead">Lead</option>
            <option value="churned">Churned</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Company
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                    {search || statusFilter
                      ? 'No customers match your search'
                      : 'No customers yet. Create your first customer!'}
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="cursor-pointer transition-colors hover:bg-gray-50"
                    onClick={() => navigate({ to: '/customers/$id', params: { id: customer.id } })}
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                      {customer.name}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                      {customer.email}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                      {customer.company || '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Badge color={CUSTOMER_STATUS_COLORS[customer.status]}>
                        {CUSTOMER_STATUS_LABELS[customer.status]}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                      <Link
                        to="/customers/$id"
                        params={{ id: customer.id }}
                        className="font-medium text-blue-600 hover:text-blue-800"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages} ({total} total)
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                icon={<ChevronLeft className="h-4 w-4" />}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                icon={<ChevronRight className="h-4 w-4" />}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
