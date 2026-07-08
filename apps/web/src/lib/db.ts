/**
 * ─── Database Setup ──────────────────────────────────────────
 * Initializes Dexie repositories for all entities.
 * 
 * To add a new entity:
 *   1. Import its entity package (auto-registers with registry)
 *   2. Add its repository here
 */

import { createDexieRepository } from '@repo/db-dexie'
import type { Repository } from '@repo/core'
import type { Customer } from '@repo/entity-customer'
import '@repo/entity-customer' // Registers Customer entity

// ─── Repository Instances ────────────────────────────────────
// These are the single source of truth for all data access.

export const customerRepo: Repository<Customer> = createDexieRepository<Customer>('customer')

// Future entities would be added here:
// import '@repo/entity-order'
// export const orderRepo: Repository<Order> = createDexieRepository<Order>('order', { ... })

// ─── Database Health ─────────────────────────────────────────

export interface DbHealth {
  ok: boolean
  tableCount: number
  totalRecords: number
  storageEstimate?: { usage: number; quota: number }
}

export async function checkDbHealth(): Promise<DbHealth> {
  try {
    const { getDatabase } = await import('@repo/db-dexie')
    const db = getDatabase()
    const tables = db.tables
    let totalRecords = 0

    for (const table of tables) {
      totalRecords += await table.count()
    }

    let storageEstimate: { usage: number; quota: number } | undefined
    if (navigator.storage?.estimate) {
      const estimate = await navigator.storage.estimate()
      storageEstimate = {
        usage: estimate.usage ?? 0,
        quota: estimate.quota ?? 0,
      }
    }

    return {
      ok: true,
      tableCount: tables.length,
      totalRecords,
      storageEstimate,
    }
  } catch (error) {
    return {
      ok: false,
      tableCount: 0,
      totalRecords: 0,
    }
  }
}
