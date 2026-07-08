/**
 * ─── Mobile Database Setup ───────────────────────────────────
 * Initializes Expo SQLite repositories.
 */

import { createExpoSqliteRepository } from '@repo/db-expo-sqlite'
import type { Repository } from '@repo/core'
import type { Customer } from '@repo/entity-customer'
import '@repo/entity-customer'

export const customerRepo: Repository<Customer> = createExpoSqliteRepository<Customer>('customer')

// Future entities:
// export const orderRepo = createExpoSqliteRepository<Order>('order')
