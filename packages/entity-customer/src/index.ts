/**
 * ─── @repo/entity-customer — Barrel Export ──────────────────
 * Import this package to register the Customer entity.
 *
 *   import '@repo/entity-customer'
 *   // or
 *   import { CustomerEntity, createCustomerSchema } from '@repo/entity-customer'
 */

// Self-registers on import
export { CustomerEntity } from './customer.entity'

// Types
export type { Customer, CustomerStatus } from './customer.schema'

// Schemas
export {
  CreateCustomerSchema,
  UpdateCustomerSchema,
  CustomerQuerySchema,
  CustomerImportSchema,
  CustomerStatusSchema,
  CUSTOMER_STATUS_LABELS,
  CUSTOMER_STATUS_COLORS,
} from './customer.schema'

// Service
export { CustomerService } from './customer.service'

// Policies
export { CustomerPolicies, evaluatePolicies } from './customer.policies'
export type { Policy, PolicyContext } from './customer.policies'

// Hooks
export { CustomerHooks } from './customer.hooks'

// UI Config
export { CustomerUIConfig } from './customer.ui'
export type { ColumnDef, FormFieldDef, DetailSectionDef } from './customer.ui'
