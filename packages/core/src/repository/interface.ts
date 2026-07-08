/**
 * ─── Repository Interface ────────────────────────────────────
 * The data access abstraction.
 * Every DB adapter (Dexie, SQLite, Postgres, etc.) implements this.
 * Business logic NEVER touches the database directly.
 */

import type { BaseEntity, CreateInput, UpdateInput, Query, QueryResult, WriteOptions, EntityId, CursorQuery, OffsetQuery } from '../types'

export type QueryParams<T extends BaseEntity> = Query<T>
export type QueryResultType<T extends BaseEntity> = QueryResult<T>

/**
 * Repository interface — 6 core methods.
 * This is the ONLY contract between business logic and data storage.
 */
export interface Repository<T extends BaseEntity> {
  /** Get a single entity by ID */
  findById(id: EntityId, options?: WriteOptions): Promise<T | null>

  /** Query entities with filtering, sorting, pagination */
  findMany(query: QueryParams<T>, options?: WriteOptions): Promise<QueryResultType<T>>

  /** Create a new entity */
  create(input: CreateInput<T>, options?: WriteOptions): Promise<T>

  /** Update an existing entity (with optimistic concurrency via version) */
  update(id: EntityId, input: UpdateInput<T>, options?: WriteOptions): Promise<T>

  /** Soft-delete an entity */
  delete(id: EntityId, options?: WriteOptions): Promise<void>

  /** Count entities matching a query */
  count(query: Pick<CursorQuery, 'filter' | 'search' | 'includeDeleted'>): Promise<number>
}

/**
 * Helper type guard to check pagination type.
 */
export function isCursorQuery(query: Query<never>): query is CursorQuery {
  return 'cursor' in query
}

export function isOffsetQuery(query: Query<never>): query is OffsetQuery {
  return 'page' in query
}
