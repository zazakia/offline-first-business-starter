/**
 * ─── Dexie.js DB Adapter ─────────────────────────────────────
 * Implements the Repository interface for IndexedDB via Dexie.
 * Used by the web app (PWA).
 */

import Dexie, { type Table } from 'dexie'
import { v4 as uuidv4 } from 'uuid'
import {
  AppError,
  DatabaseError,
  NotFoundError,
  ConflictError,
} from '@repo/core'
import type {
  BaseEntity,
  CreateInput,
  UpdateInput,
  QueryParams,
  QueryResultType,
  Repository,
  WriteOptions,
  CursorQuery,
  OffsetQuery,
  EntityId,
  TimestampMillis,
  ChangeLogEntry,
  FilterRule,
} from '@repo/core'
import { isCursorQuery } from '@repo/core'

// ─── Database Class ────────────────────────────────────────

class OfflineDatabase extends Dexie {
  public changeLog!: Table<ChangeLogEntry, string>

  constructor(dbName: string) {
    super(dbName)

    // Define all entity tables and the change log
    this.version(2).stores({
      changeLog: '++id, entityType, entityId, status, timestamp, tenantId',
      customer: 'id, tenantId, email, status, company, createdAt, updatedAt, deletedAt, [tenantId+deletedAt], [tenantId+status], [tenantId+createdAt]',
      patient: 'id, tenantId, fullName, phone, email, dateOfBirth, gender, bloodType, status, lastVisitDate, createdAt, updatedAt, deletedAt, [tenantId+deletedAt], [tenantId+status]',
      doctor: 'id, tenantId, fullName, licenseNumber, specialty, email, phone, status, createdAt, updatedAt, deletedAt, [tenantId+deletedAt], [tenantId+status]',
      appointment: 'id, tenantId, patientId, doctorId, type, scheduledStart, scheduledEnd, status, priority, createdAt, updatedAt, deletedAt, [tenantId+deletedAt], [tenantId+status], [tenantId+patientId], [tenantId+doctorId]',
      medicalRecord: 'id, tenantId, patientId, doctorId, appointmentId, type, status, encounterDate, createdAt, updatedAt, deletedAt, [tenantId+deletedAt], [tenantId+patientId]',
      prescription: 'id, tenantId, patientId, doctorId, medicalRecordId, status, startDate, createdAt, updatedAt, deletedAt, [tenantId+deletedAt], [tenantId+patientId], [tenantId+status]',
      billing: 'id, tenantId, patientId, invoiceNumber, status, issueDate, totalAmount, paidAmount, balanceDue, createdAt, updatedAt, deletedAt, [tenantId+deletedAt], [tenantId+status], [tenantId+invoiceNumber]',
      inventory: 'id, tenantId, name, sku, category, quantityOnHand, status, isControlled, createdAt, updatedAt, deletedAt, [tenantId+deletedAt], [tenantId+status], [tenantId+sku]',
      department: 'id, tenantId, name, code, type, isActive, createdAt, updatedAt, deletedAt, [tenantId+deletedAt], [tenantId+code]',
      pharmacy: 'id, tenantId, patientId, prescriptionId, type, status, receivedAt, createdAt, updatedAt, deletedAt, [tenantId+deletedAt], [tenantId+status], [tenantId+patientId]',
      laboratory: 'id, tenantId, patientId, doctorId, status, priority, orderedAt, createdAt, updatedAt, deletedAt, [tenantId+deletedAt], [tenantId+patientId], [tenantId+status]',
    })

    this.changeLog = this.table('changeLog')
  }
}

// ─── Global DB Instance ────────────────────────────────────

let globalDb: OfflineDatabase | null = null

function getDb(dbName?: string): OfflineDatabase {
  if (!globalDb) {
    globalDb = new OfflineDatabase(dbName ?? 'OfflineFirstApp')
  }
  return globalDb
}

// ─── Helper Functions ──────────────────────────────────────

/**
 * Apply filter rules to a Dexie collection.
 * Returns a filtered collection.
 */
async function applyFilters<T>(
  collection: Dexie.Collection<T, string>,
  filter?: FilterRule[],
  search?: string,
  includeDeleted?: boolean,
): Promise<Dexie.Collection<T, string>> {
  let result = collection
  
  if (!includeDeleted) {
    // For soft-delete filtering, we need to filter in-memory since
    // we may not have an index on deletedAt
    result = result.filter((item: any) => item.deletedAt === null) as any
  }

  if (filter && filter.length > 0) {
    for (const rule of filter) {
      switch (rule.operator) {
        case 'eq':
          // Try to use indexed where if possible
          try {
            const table = (result as any)._table
            if (table) {
              const whereResult = await table.where(rule.field).equals(rule.value).toArray()
              // This approach is limited - for simplicity, filter in memory
              result = result.filter((item: any) => item[rule.field] === rule.value) as any
            }
          } catch {
            result = result.filter((item: any) => item[rule.field] === rule.value) as any
          }
          break
        case 'neq':
          result = result.filter((item: any) => item[rule.field] !== rule.value) as any
          break
        case 'contains':
          result = result.filter((item: any) => {
            const val = item[rule.field]
            return typeof val === 'string' && 
              val.toLowerCase().includes(String(rule.value as string).toLowerCase())
          }) as any
          break
        case 'gt':
          result = result.filter((item: any) => item[rule.field] > (rule.value as number)) as any
          break
        case 'gte':
          result = result.filter((item: any) => item[rule.field] >= (rule.value as number)) as any
          break
        case 'lt':
          result = result.filter((item: any) => item[rule.field] < (rule.value as number)) as any
          break
        case 'lte':
          result = result.filter((item: any) => item[rule.field] <= (rule.value as number)) as any
          break
        case 'in':
          result = result.filter((item: any) => 
            (rule.value as unknown[]).includes(item[rule.field])
          ) as any
          break
        case 'startsWith':
          result = result.filter((item: any) => {
            const val = item[rule.field]
            return typeof val === 'string' && 
              val.toLowerCase().startsWith(String(rule.value as string).toLowerCase())
          }) as any
          break
      }
    }
  }

  if (search) {
    const searchLower = search.toLowerCase()
    result = result.filter((item: any) => {
      return (
        (item.name && String(item.name).toLowerCase().includes(searchLower)) ||
        (item.email && String(item.email).toLowerCase().includes(searchLower))
      )
    }) as any
  }

  return result
}

/**
 * Sort items in memory.
 */
function applySort<T>(items: T[], sort?: { field: string; direction: 'asc' | 'desc' }[]): T[] {
  if (!sort || sort.length === 0) {
    return items.reverse() // newest first by default
  }

  return [...items].sort((a, b) => {
    for (const rule of sort) {
      const aVal = (a as any)[rule.field]
      const bVal = (b as any)[rule.field]
      if (aVal == null && bVal == null) continue
      if (aVal == null) return 1
      if (bVal == null) return -1
      if (aVal < bVal) return rule.direction === 'asc' ? -1 : 1
      if (aVal > bVal) return rule.direction === 'asc' ? 1 : -1
    }
    return 0
  })
}

/**
 * Write a change log entry for sync.
 */
async function writeChangeLog(
  operation: 'create' | 'update' | 'delete',
  entityName: string,
  entityId: EntityId,
  data: Record<string, unknown>,
  previousData: Record<string, unknown> | undefined,
  options?: WriteOptions,
): Promise<void> {
  if (options?.skipSync) return

  const db = getDb()
  const entry: ChangeLogEntry = {
    id: uuidv4(),
    entityType: entityName,
    entityId,
    operation,
    data,
    previousData,
    timestamp: options?.performedAt ?? Date.now(),
    clientId: 'web-client',
    tenantId: (data.tenantId as string) ?? 'default',
    performedBy: options?.performedBy ?? 'system',
    status: 'pending',
    retryCount: 0,
  }

  await db.changeLog.add(entry)
}

// ─── Entity Table Manager ──────────────────────────────────

const entityTables = new Map<string, string>()

/**
 * Register the Dexie table name for an entity.
 * Called by createDexieRepository.
 */
function ensureTableSchema(entityName: string, extraIndexes?: string[]): void {
  // Schema must be defined upfront in the Dexie version() call.
  // For new entities, we'd need to handle schema migration.
  // For now, we check if the table exists and throw if not.
  const db = getDb()
  if (!db.tables.some((t) => t.name === entityName)) {
    throw new DatabaseError(
      `Entity table "${entityName}" is not defined in the Dexie schema. ` +
      `Add it to the version() call in OfflineDatabase constructor. ` +
      `Schema format: 'id, tenantId, ...indexes'`
    )
  }
}

// ─── Repository Factory ────────────────────────────────────

/**
 * Create a Dexie-backed Repository for a given entity.
 *
 * Usage:
 *   const customerRepo = createDexieRepository<Customer>('customer')
 *   const customers = await customerRepo.findMany({ limit: 50 })
 */
export function createDexieRepository<T extends BaseEntity>(
  entityName: string,
  options?: {
    dbName?: string
  },
): Repository<T> {
  const db = getDb(options?.dbName)
  
  // Verify the table exists (schema must be defined in OfflineDatabase constructor)
  ensureTableSchema(entityName)

  const table = db.table<T, string>(entityName)

  // ─── Repository Implementation ───────────────────────

  return {
    async findById(id: EntityId, _options?: WriteOptions): Promise<T | null> {
      try {
        const item = await table.get(id)
        if (!item) return null
        if (item.deletedAt) return null // Soft-deleted
        return item
      } catch (error) {
        throw new DatabaseError(`Failed to find ${entityName} by id`, { id, error })
      }
    },

    async findMany(query: QueryParams<T>, _options?: WriteOptions): Promise<QueryResultType<T>> {
      try {
        // Get all items from table
        let allItems = await table.toArray()

        // Apply filters in memory
        let filtered = allItems
        if (!query.includeDeleted) {
          filtered = filtered.filter((item) => item.deletedAt === null)
        }

        if (query.filter) {
          for (const rule of query.filter) {
            filtered = filtered.filter((item) => {
              const itemVal = (item as any)[rule.field]
              switch (rule.operator) {
                case 'eq': return itemVal === rule.value as string
                case 'neq': return itemVal !== rule.value as string
                case 'gt': return itemVal > (rule.value as number)
                case 'gte': return itemVal >= (rule.value as number)
                case 'lt': return itemVal < (rule.value as number)
                case 'lte': return itemVal <= (rule.value as number)
                case 'contains':
                  return typeof itemVal === 'string' && 
                    itemVal.toLowerCase().includes(String(rule.value as string).toLowerCase())
                case 'startsWith':
                  return typeof itemVal === 'string' && 
                    itemVal.toLowerCase().startsWith(String(rule.value as string).toLowerCase())
                case 'in':
                  return (rule.value as unknown[]).includes(itemVal)
                case 'between':
                  if (Array.isArray(rule.value) && rule.value.length === 2) {
                    return itemVal >= rule.value[0] && itemVal <= rule.value[1]
                  }
                  return true
                default:
                  return true
              }
            })
          }
        }

        if (query.search) {
          const searchLower = query.search.toLowerCase()
          filtered = filtered.filter((item) => {
            const itemAny = item as any
            return (
              (itemAny.name && String(itemAny.name).toLowerCase().includes(searchLower)) ||
              (itemAny.email && String(itemAny.email).toLowerCase().includes(searchLower))
            )
          })
        }

        // Apply sorting
        if (query.sort && query.sort.length > 0) {
          filtered = applySort(filtered, query.sort)
        } else {
          filtered = filtered.reverse() // newest first
        }

        const total = filtered.length

        // Apply pagination
        if (isCursorQuery(query)) {
          const limit = query.limit ?? 50
          let startIndex = 0

          if (query.cursor) {
            const cursorIndex = filtered.findIndex((item) => item.id === query.cursor)
            if (cursorIndex >= 0) {
              startIndex = cursorIndex + 1
            }
          }

          const items = filtered.slice(startIndex, startIndex + limit)
          const nextCursor = items.length === limit ? items[items.length - 1]?.id : undefined

          return { items, nextCursor, total }
        } else {
          const offsetQuery = query as OffsetQuery
          const page = offsetQuery.page ?? 1
          const pageSize = offsetQuery.pageSize ?? 50
          const offset = (page - 1) * pageSize

          const items = filtered.slice(offset, offset + pageSize)

          return {
            items,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
          }
        }
      } catch (error) {
        if (error instanceof AppError) throw error
        throw new DatabaseError(`Failed to query ${entityName}`, { query, error })
      }
    },

    async create(input: CreateInput<T>, options?: WriteOptions): Promise<T> {
      const timestamp = options?.performedAt ?? Date.now()
      const userId = options?.performedBy ?? 'system'

      const entity = {
        ...input,
        id: uuidv4(),
        createdAt: timestamp,
        updatedAt: timestamp,
        deletedAt: null,
        version: 1,
        createdBy: userId,
        updatedBy: userId,
      } as unknown as T

      try {
        await table.add(entity as any)

        await writeChangeLog(
          'create',
          entityName,
          entity.id,
          entity as unknown as Record<string, unknown>,
          undefined,
          options,
        )

        return entity
      } catch (error) {
        throw new DatabaseError(`Failed to create ${entityName}`, { input, error })
      }
    },

    async update(id: EntityId, input: UpdateInput<T>, options?: WriteOptions): Promise<T> {
      try {
        const existing = await table.get(id)
        if (!existing) {
          throw new NotFoundError(entityName, id)
        }

        // Optimistic concurrency check
        if (input.version !== existing.version) {
          throw new ConflictError(entityName, id, input.version, existing.version)
        }

        const timestamp = options?.performedAt ?? Date.now()
        const userId = options?.performedBy ?? 'system'

        const previousData = { ...existing } as unknown as Record<string, unknown>

        const updated = {
          ...existing,
          ...input,
          id,
          createdAt: existing.createdAt,
          createdBy: existing.createdBy,
          updatedAt: timestamp,
          updatedBy: userId,
          version: existing.version + 1,
        } as unknown as T

        await table.put(updated as any)

        await writeChangeLog(
          'update',
          entityName,
          id,
          updated as unknown as Record<string, unknown>,
          previousData,
          options,
        )

        return updated
      } catch (error) {
        if (error instanceof AppError) throw error
        throw new DatabaseError(`Failed to update ${entityName}`, { id, input, error })
      }
    },

    async delete(id: EntityId, options?: WriteOptions): Promise<void> {
      try {
        const existing = await table.get(id)
        if (!existing) {
          throw new NotFoundError(entityName, id)
        }

        const timestamp = options?.performedAt ?? Date.now()
        const userId = options?.performedBy ?? 'system'

        // Soft delete
        const updated = {
          ...existing,
          deletedAt: timestamp,
          updatedAt: timestamp,
          updatedBy: userId,
          version: existing.version + 1,
        } as T

        await table.put(updated as any)

        await writeChangeLog(
          'delete',
          entityName,
          id,
          { id, deletedAt: timestamp },
          { ...existing } as unknown as Record<string, unknown>,
          options,
        )
      } catch (error) {
        if (error instanceof AppError) throw error
        throw new DatabaseError(`Failed to delete ${entityName}`, { id, error })
      }
    },

    async count(query: Pick<CursorQuery, 'filter' | 'search' | 'includeDeleted'>): Promise<number> {
      try {
        let items = await table.toArray()

        if (!query.includeDeleted) {
          items = items.filter((item) => item.deletedAt === null)
        }

        if (query.filter) {
          for (const rule of query.filter) {
            if (rule.operator === 'eq') {
              items = items.filter((item) => (item as any)[rule.field] === rule.value)
            }
          }
        }

        return items.length
      } catch (error) {
        throw new DatabaseError(`Failed to count ${entityName}`, { query, error })
      }
    },
  }
}

/**
 * Get the underlying Dexie database instance.
 */
export function getDatabase(): OfflineDatabase {
  return getDb()
}

/**
 * Close the database connection.
 */
export function closeDatabase(): void {
  if (globalDb) {
    globalDb.close()
    globalDb = null
  }
}

/**
 * Reset the database (for testing).
 */
export async function resetDatabase(): Promise<void> {
  if (globalDb) {
    const tables = globalDb.tables
    for (const table of tables) {
      await table.clear()
    }
  }
}
