/**
 * ─── Router ──────────────────────────────────────────────────
 * TanStack Router with type-safe routes.
 * Clinic management system — patients, doctors, appointments,
 * medical records, prescriptions, billing, inventory, departments.
 */

import {
  createRouter,
  createRootRoute,
  createRoute,
  Outlet,
} from '@tanstack/react-router'
import { AppShell } from './components/AppShell'
import { DashboardPage } from './routes/index'

// ─── Route Components (lazy load via barrel imports) ─────────
// These are placeholder pages that the new routes point to.
// Replace with actual page components when building the UI layer.

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
        <h2 className="text-2xl font-semibold text-gray-900">Página no encontrada</h2>
        <p className="mt-2 text-gray-500">La página que busca no existe.</p>
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

// ─── Legacy Customer Routes ─────────────────────────────────

const customersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'customers',
  component: () => <Outlet />,
})

const customersIndexRoute = createRoute({
  getParentRoute: () => customersRoute,
  path: '/',
  component: () => import('./routes/customers/index').then(m => ({ default: m.CustomerListPage })),
})

const customersNewRoute = createRoute({
  getParentRoute: () => customersRoute,
  path: 'new',
  component: () => import('./routes/customers/new').then(m => ({ default: m.CreateCustomerPage })),
})

const customerDetailRoute = createRoute({
  getParentRoute: () => customersRoute,
  path: '$id',
  component: () => import('./routes/customers/$id').then(m => ({ default: m.CustomerDetailPage })),
})

// ─── Patient Routes ─────────────────────────────────────────

const patientsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'patients',
  component: () => <Outlet />,
})

import { PatientListPage } from './routes/patients/index'
import { CreatePatientPage } from './routes/patients/new'
import { PatientDetailPage } from './routes/patients/$id'

const patientsIndexRoute = createRoute({
  getParentRoute: () => patientsRoute,
  path: '/',
  component: PatientListPage,
})

const patientsNewRoute = createRoute({
  getParentRoute: () => patientsRoute,
  path: 'new',
  component: CreatePatientPage,
})

const patientDetailRoute = createRoute({
  getParentRoute: () => patientsRoute,
  path: '$id',
  component: PatientDetailPage,
})

// ─── Doctor Routes ──────────────────────────────────────────

import { DoctorListPage } from './routes/doctors/index'
import { CreateDoctorPage } from './routes/doctors/new'
import { DoctorDetailPage } from './routes/doctors/$id'

const doctorsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'doctors',
  component: () => <Outlet />,
})

const doctorsIndexRoute = createRoute({
  getParentRoute: () => doctorsRoute,
  path: '/',
  component: DoctorListPage,
})

const doctorsNewRoute = createRoute({
  getParentRoute: () => doctorsRoute,
  path: 'new',
  component: CreateDoctorPage,
})

const doctorDetailRoute = createRoute({
  getParentRoute: () => doctorsRoute,
  path: '$id',
  component: DoctorDetailPage,
})

// ─── Appointment Routes ─────────────────────────────────────

import { AppointmentListPage } from './routes/appointments/index'
import { CreateAppointmentPage } from './routes/appointments/new'
import { AppointmentDetailPage } from './routes/appointments/$id'
import { AppointmentCalendarPage } from './routes/appointments/calendar'

const appointmentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'appointments',
  component: () => <Outlet />,
})

const appointmentsIndexRoute = createRoute({
  getParentRoute: () => appointmentsRoute,
  path: '/',
  component: AppointmentListPage,
})

const appointmentsNewRoute = createRoute({
  getParentRoute: () => appointmentsRoute,
  path: 'new',
  component: CreateAppointmentPage,
})

const appointmentDetailRoute = createRoute({
  getParentRoute: () => appointmentsRoute,
  path: '$id',
  component: AppointmentDetailPage,
})

const appointmentCalendarRoute = createRoute({
  getParentRoute: () => appointmentsRoute,
  path: 'calendar',
  component: AppointmentCalendarPage,
})

// ─── Medical Record Routes ──────────────────────────────────

import { MedicalRecordListPage } from './routes/medical-records/index'
import { CreateMedicalRecordPage } from './routes/medical-records/new'
import { MedicalRecordDetailPage } from './routes/medical-records/$id'

const medicalRecordsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'medical-records',
  component: () => <Outlet />,
})

const medicalRecordsIndexRoute = createRoute({
  getParentRoute: () => medicalRecordsRoute,
  path: '/',
  component: MedicalRecordListPage,
})

const medicalRecordsNewRoute = createRoute({
  getParentRoute: () => medicalRecordsRoute,
  path: 'new',
  component: CreateMedicalRecordPage,
})

const medicalRecordDetailRoute = createRoute({
  getParentRoute: () => medicalRecordsRoute,
  path: '$id',
  component: MedicalRecordDetailPage,
})

// ─── Prescription Routes ────────────────────────────────────

import { PrescriptionListPage } from './routes/prescriptions/index'
import { CreatePrescriptionPage } from './routes/prescriptions/new'
import { PrescriptionDetailPage } from './routes/prescriptions/$id'

const prescriptionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'prescriptions',
  component: () => <Outlet />,
})

const prescriptionsIndexRoute = createRoute({
  getParentRoute: () => prescriptionsRoute,
  path: '/',
  component: PrescriptionListPage,
})

const prescriptionsNewRoute = createRoute({
  getParentRoute: () => prescriptionsRoute,
  path: 'new',
  component: CreatePrescriptionPage,
})

const prescriptionDetailRoute = createRoute({
  getParentRoute: () => prescriptionsRoute,
  path: '$id',
  component: PrescriptionDetailPage,
})

// ─── Billing Routes ─────────────────────────────────────────

import { BillingListPage } from './routes/billing/index'
import { CreateInvoicePage } from './routes/billing/new'
import { InvoiceDetailPage } from './routes/billing/$id'

const billingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'billing',
  component: () => <Outlet />,
})

const billingIndexRoute = createRoute({
  getParentRoute: () => billingRoute,
  path: '/',
  component: BillingListPage,
})

const billingNewRoute = createRoute({
  getParentRoute: () => billingRoute,
  path: 'new',
  component: CreateInvoicePage,
})

const invoiceDetailRoute = createRoute({
  getParentRoute: () => billingRoute,
  path: '$id',
  component: InvoiceDetailPage,
})

// ─── Inventory Routes ───────────────────────────────────────

import { InventoryListPage } from './routes/inventory/index'
import { CreateInventoryItemPage } from './routes/inventory/new'
import { InventoryItemDetailPage } from './routes/inventory/$id'

const inventoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'inventory',
  component: () => <Outlet />,
})

const inventoryIndexRoute = createRoute({
  getParentRoute: () => inventoryRoute,
  path: '/',
  component: InventoryListPage,
})

const inventoryNewRoute = createRoute({
  getParentRoute: () => inventoryRoute,
  path: 'new',
  component: CreateInventoryItemPage,
})

const inventoryDetailRoute = createRoute({
  getParentRoute: () => inventoryRoute,
  path: '$id',
  component: InventoryItemDetailPage,
})

// ─── Department Routes ──────────────────────────────────────

import { DepartmentListPage } from './routes/departments/index'
import { CreateDepartmentPage } from './routes/departments/new'
import { DepartmentDetailPage } from './routes/departments/$id'

import { ClinicSettingsPage } from './routes/settings/index'
import { LoginPage } from './routes/auth/login'
import { useAuth } from './hooks/useAuth'

const departmentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'departments',
  component: () => <Outlet />,
})

const departmentsIndexRoute = createRoute({
  getParentRoute: () => departmentsRoute,
  path: '/',
  component: DepartmentListPage,
})

const departmentsNewRoute = createRoute({
  getParentRoute: () => departmentsRoute,
  path: 'new',
  component: CreateDepartmentPage,
})

const departmentDetailRoute = createRoute({
  getParentRoute: () => departmentsRoute,
  path: '$id',
  component: DepartmentDetailPage,
})

// ─── Pharmacy Routes ───────────────────────────────────────

import { PharmacyListPage } from './routes/pharmacy/index'
import { CreatePharmacyOrderPage } from './routes/pharmacy/new'
import { PharmacyOrderDetailPage } from './routes/pharmacy/$id'

const pharmacyRoute = createRoute({ getParentRoute: () => rootRoute, path: 'pharmacy', component: () => <Outlet /> })
const pharmacyIndexRoute = createRoute({ getParentRoute: () => pharmacyRoute, path: '/', component: PharmacyListPage })
const pharmacyNewRoute = createRoute({ getParentRoute: () => pharmacyRoute, path: 'new', component: CreatePharmacyOrderPage })
const pharmacyDetailRoute = createRoute({ getParentRoute: () => pharmacyRoute, path: '$id', component: PharmacyOrderDetailPage })

// ─── Laboratory Routes ──────────────────────────────────────

import { LabListPage } from './routes/laboratory/index'
import { CreateLabOrderPage } from './routes/laboratory/new'
import { LabOrderDetailPage } from './routes/laboratory/$id'

const labRoute = createRoute({ getParentRoute: () => rootRoute, path: 'laboratory', component: () => <Outlet /> })
const labIndexRoute = createRoute({ getParentRoute: () => labRoute, path: '/', component: LabListPage })
const labNewRoute = createRoute({ getParentRoute: () => labRoute, path: 'new', component: CreateLabOrderPage })
const labDetailRoute = createRoute({ getParentRoute: () => labRoute, path: '$id', component: LabOrderDetailPage })

// ─── Login Route ─────────────────────────────────────────────

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'login',
  component: LoginPage,
})

// ─── Route Tree ──────────────────────────────────────────────

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'settings',
  component: ClinicSettingsPage,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  // Legacy
  customersRoute.addChildren([customersIndexRoute, customersNewRoute, customerDetailRoute]),
  // Clinic
  patientsRoute.addChildren([patientsIndexRoute, patientsNewRoute, patientDetailRoute]),
  doctorsRoute.addChildren([doctorsIndexRoute, doctorsNewRoute, doctorDetailRoute]),
  appointmentsRoute.addChildren([appointmentsIndexRoute, appointmentsNewRoute, appointmentDetailRoute, appointmentCalendarRoute]),
  medicalRecordsRoute.addChildren([medicalRecordsIndexRoute, medicalRecordsNewRoute, medicalRecordDetailRoute]),
  prescriptionsRoute.addChildren([prescriptionsIndexRoute, prescriptionsNewRoute, prescriptionDetailRoute]),
  billingRoute.addChildren([billingIndexRoute, billingNewRoute, invoiceDetailRoute]),
  inventoryRoute.addChildren([inventoryIndexRoute, inventoryNewRoute, inventoryDetailRoute]),
  departmentsRoute.addChildren([departmentsIndexRoute, departmentsNewRoute, departmentDetailRoute]),
  pharmacyRoute.addChildren([pharmacyIndexRoute, pharmacyNewRoute, pharmacyDetailRoute]),
  labRoute.addChildren([labIndexRoute, labNewRoute, labDetailRoute]),
  // Settings
  settingsRoute,
])

// ─── Router Instance ─────────────────────────────────────────

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  defaultViewTransition: true,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
