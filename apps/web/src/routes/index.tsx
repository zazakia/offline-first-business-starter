/**
 * ─── Dashboard Page ──────────────────────────────────────────
 * Overview of key metrics and recent activity.
 * Demonstrates reading from the offline DB.
 */

import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Card, CardHeader, CardContent, cn } from '@repo/ui-core'
import { customerRepo } from '../lib/db'
import { useOnlineStatus } from '@repo/ui-core'
import { useSyncStore } from '../store/app'
import {
  Users,
  TrendingUp,
  Activity,
  AlertCircle,
  ArrowRight,
} from 'lucide-react'

interface DashboardMetrics {
  totalCustomers: number
  activeCustomers: number
  leadCustomers: number
  monthlyGrowth: number
}

export function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalCustomers: 0,
    activeCustomers: 0,
    leadCustomers: 0,
    monthlyGrowth: 0,
  })
  const [loading, setLoading] = useState(true)
  const { online } = useOnlineStatus()
  const { pendingCount, lastSyncAt } = useSyncStore()

  useEffect(() => {
    async function loadMetrics() {
      try {
        const [total, active, leads] = await Promise.all([
          customerRepo.count({}),
          customerRepo.count({ filter: [{ field: 'status', operator: 'eq', value: 'active' }] }),
          customerRepo.count({ filter: [{ field: 'status', operator: 'eq', value: 'lead' }] }),
        ])

        setMetrics({
          totalCustomers: total,
          activeCustomers: active,
          leadCustomers: leads,
          monthlyGrowth: total > 0 ? Math.round((active / total) * 100) : 0,
        })
      } catch (error) {
        console.error('Failed to load dashboard metrics:', error)
      } finally {
        setLoading(false)
      }
    }

    loadMetrics()
  }, [])

  const statCards = [
    {
      label: 'Total Customers',
      value: metrics.totalCustomers,
      icon: Users,
      color: 'blue',
      link: '/customers',
    },
    {
      label: 'Active Customers',
      value: metrics.activeCustomers,
      icon: TrendingUp,
      color: 'green',
      link: '/customers',
    },
    {
      label: 'Leads',
      value: metrics.leadCustomers,
      icon: Activity,
      color: 'yellow',
      link: '/customers',
    },
    {
      label: 'Activation Rate',
      value: `${metrics.monthlyGrowth}%`,
      icon: TrendingUp,
      color: 'purple',
      link: '/customers',
    },
  ] as const

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          {online ? 'Online' : 'Offline'} · {pendingCount} pending syncs
          {lastSyncAt && ` · Last sync: ${new Date(lastSyncAt).toLocaleTimeString()}`}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Link key={card.label} to={card.link}>
            <Card className="transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{card.label}</p>
                  {loading ? (
                    <div className="mt-1 h-8 w-16 animate-pulse rounded bg-gray-200" />
                  ) : (
                    <p className="mt-1 text-2xl font-semibold text-gray-900">
                      {card.value}
                    </p>
                  )}
                </div>
                <div
                  className={cn(
                    'rounded-xl p-3',
                    card.color === 'blue' && 'bg-blue-100 text-blue-600',
                    card.color === 'green' && 'bg-green-100 text-green-600',
                    card.color === 'yellow' && 'bg-yellow-100 text-yellow-600',
                    card.color === 'purple' && 'bg-purple-100 text-purple-600',
                  )}
                >
                  <card.icon className="h-6 w-6" />
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader
          title="Quick Actions"
          description="Common tasks to get started"
        />
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              to="/customers/new"
              className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:border-blue-300 hover:bg-blue-50"
            >
              <Users className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Add Customer</p>
                <p className="text-xs text-gray-500">Create a new customer record</p>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </Link>

            <Link
              to="/customers"
              className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:border-blue-300 hover:bg-blue-50"
            >
              <Activity className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">View Customers</p>
                <p className="text-xs text-gray-500">Browse and manage your customers</p>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </Link>

            <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-4">
              <AlertCircle className="h-5 w-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {online ? 'System Online' : 'Working Offline'}
                </p>
                <p className="text-xs text-gray-500">
                  {online
                    ? 'Changes sync in real-time'
                    : `${pendingCount} changes queued for sync`}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
