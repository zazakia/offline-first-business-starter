/**
 * ─── App Shell ───────────────────────────────────────────────
 * Main application layout with sidebar, topbar, and content area.
 */

import React, { useState } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { useOnlineStatus } from '@repo/ui-core'
import {
  LayoutDashboard,
  Users,
  Menu,
  X,
  RefreshCw,
  WifiOff,
  CloudOff,
} from 'lucide-react'
import { useSyncStore, useAppStore } from '../store/app'
import { cn } from '@repo/ui-core'

interface NavItem {
  label: string
  icon: React.ReactNode
  path: string
  badge?: number
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" />, path: '/' },
  { label: 'Customers', icon: <Users className="h-5 w-5" />, path: '/customers' },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { online } = useOnlineStatus()
  const { pendingCount } = useSyncStore()
  const location = useLocation()

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white border-r border-gray-200 transition-transform duration-300 lg:relative lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <span className="text-sm font-bold text-white">OB</span>
            </div>
            <span className="text-lg font-semibold text-gray-900">OfflineBiz</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path)

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100',
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    {item.badge != null && item.badge > 0 && (
                      <span className="ml-auto rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Offline indicator */}
        <div className="border-t border-gray-200 p-4">
          {!online ? (
            <div className="flex items-center gap-2 rounded-lg bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
              <WifiOff className="h-4 w-4" />
              <span>Offline — changes will sync when connected</span>
            </div>
          ) : pendingCount > 0 ? (
            <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>{pendingCount} pending changes</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-500">
              <CloudOff className="h-4 w-4" />
              <span>All changes synced</span>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 items-center gap-4 border-b border-gray-200 bg-white px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>
          {!online && (
            <div className="flex items-center gap-2 rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800">
              <WifiOff className="h-3 w-3" />
              Offline
            </div>
          )}
          {pendingCount > 0 && online && (
            <div className="flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
              <RefreshCw className="h-3 w-3 animate-spin" />
              Syncing ({pendingCount})
            </div>
          )}
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
