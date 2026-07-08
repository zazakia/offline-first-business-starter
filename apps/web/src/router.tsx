/**
 * ─── Router ──────────────────────────────────────────────────
 * TanStack Router with type-safe routes.
 * Uses direct imports for now — code splitting can be added later.
 */

import {
  createRouter,
  createRootRoute,
  createRoute,
  Outlet,
} from '@tanstack/react-router'
import { AppShell } from './components/AppShell'
import { DashboardPage } from './routes/index'
import { CustomerListPage } from './routes/customers/index'
import { CreateCustomerPage } from './routes/customers/new'
import { CustomerDetailPage } from './routes/customers/$id'

// ─── Root Layout ─────────────────────────────────────────────

const rootRoute = createRootRoute({
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
  notFoundComponent: () => (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900">Page not found</h2>
        <p className="mt-2 text-gray-500">The page you're looking for doesn't exist.</p>
      </div>
    </div>
  ),
})

// ─── Index Route (Dashboard) ────────────────────────────────

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DashboardPage,
})

// ─── Customer Routes ────────────────────────────────────────

const customersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'customers',
  component: () => <Outlet />,
})

const customersIndexRoute = createRoute({
  getParentRoute: () => customersRoute,
  path: '/',
  component: CustomerListPage,
})

const customersNewRoute = createRoute({
  getParentRoute: () => customersRoute,
  path: 'new',
  component: CreateCustomerPage,
})

const customerDetailRoute = createRoute({
  getParentRoute: () => customersRoute,
  path: '$id',
  component: CustomerDetailPage,
})

// ─── Route Tree ──────────────────────────────────────────────

const routeTree = rootRoute.addChildren([
  indexRoute,
  customersRoute.addChildren([
    customersIndexRoute,
    customersNewRoute,
    customerDetailRoute,
  ]),
])

// ─── Router Instance ─────────────────────────────────────────

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  defaultViewTransition: true,
})

// Register the router for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
