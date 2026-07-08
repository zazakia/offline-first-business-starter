/**
 * ─── Tauri SQL DB Adapter ────────────────────────────────────
 * Implements the Repository interface for SQLite via Tauri SQL plugin.
 */

import { v4 as uuidv4 } from 'uuid'
import type {
  BaseEntity,
  CreateInput,
  UpdateInput,
  QueryParams,
  QueryResultType,
  Repository,
  WriteOptions,
  EntityId,
} from '@repo/core'
import { DatabaseError } from '@repo/core'

// In a real implementation, this would use @tauri-apps/plugin-sql:
// import Database from '@tauri-apps/plugin-sql'

/**
 * Placeholder for Tauri SQL adapter.
 * In production, replace with real @tauri-apps/plugin-sql calls.
 */
export function createTauriSqlRepository<T extends BaseEntity>(
  entityName: string,
  options?: { dbPath?: string },
): Repository<T> {
  // const db = await Database.load(options?.dbPath ?? 'sqlite:app.db')
  //
  // Schema same as Expo SQLite adapter (see db-adapter-expo-sqlite)

  return {
    async findById(id: EntityId): Promise<T | null> {
      throw new DatabaseError('Tauri SQL adapter not yet implemented. Use Dexie adapter for web.')
    },
    async findMany(query: QueryParams<T>): Promise<QueryResultType<T>> {
      throw new DatabaseError('Tauri SQL adapter not yet implemented. Use Dexie adapter for web.')
    },
    async create(input: CreateInput<T>, options?: WriteOptions): Promise<T> {
      throw new DatabaseError('Tauri SQL adapter not yet implemented. Use Dexie adapter for web.')
    },
    async update(id: EntityId, input: UpdateInput<T>, options?: WriteOptions): Promise<T> {
      throw new DatabaseError('Tauri SQL adapter not yet implemented. Use Dexie adapter for web.')
    },
    async delete(id: EntityId, options?: WriteOptions): Promise<void> {
      throw new DatabaseError('Tauri SQL adapter not yet implemented. Use Dexie adapter for web.')
    },
    async count(query: Pick<any, 'filter' | 'search' | 'includeDeleted'>): Promise<number> {
      throw new DatabaseError('Tauri SQL adapter not yet implemented. Use Dexie adapter for web.')
    },
  }
}
