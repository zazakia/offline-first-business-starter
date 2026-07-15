/**
 * ─── Entity CRUD Router ──────────────────────────────────────
 * Generic CRUD routes for any clinic entity.
 * Used by all clinic entities: patients, doctors, appointments, etc.
 *
 * Provides:
 *   GET    /api/:entity          — List (with pagination, filtering, search)
 *   GET    /api/:entity/:id      — Get by ID
 *   POST   /api/:entity          — Create
 *   PUT    /api/:entity/:id      — Update
 *   DELETE /api/:entity/:id      — Soft-delete
 */

import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { serverStore } from '../db/store'
import { authMiddleware, requireRole, requireAnyRole } from '../middleware/auth'
import type { AuthContext } from '../middleware/auth'

type Variables = AuthContext

// ─── Query Schema ────────────────────────────────────────────

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(500).default(50),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
  status: z.string().optional(),
}).passthrough() // Allow additional filter params

// ─── Entity-Specific RBAC Maps ───────────────────────────────

const ENTITY_RBAC: Record<string, { create: string[]; read: string[]; update: string[]; delete: string[] }> = {
  patient: {
    create: ['admin', 'doctor', 'receptionist'],
    read: ['admin', 'doctor', 'nurse', 'receptionist', 'pharmacist', 'billing'],
    update: ['admin', 'doctor', 'nurse', 'receptionist'],
    delete: ['admin'],
  },
  doctor: {
    create: ['admin'],
    read: ['admin', 'doctor', 'nurse', 'receptionist', 'billing', 'pharmacist'],
    update: ['admin'],
    delete: ['admin'],
  },
  appointment: {
    create: ['admin', 'doctor', 'receptionist'],
    read: ['admin', 'doctor', 'nurse', 'receptionist', 'billing'],
    update: ['admin', 'doctor', 'receptionist', 'nurse'],
    delete: ['admin'],
  },
  medicalRecord: {
    create: ['admin', 'doctor', 'nurse'],
    read: ['admin', 'doctor', 'nurse', 'pharmacist', 'receptionist'],
    update: ['admin', 'doctor', 'nurse'],
    delete: ['admin'],
  },
  prescription: {
    create: ['admin', 'doctor'],
    read: ['admin', 'doctor', 'nurse', 'pharmacist'],
    update: ['admin', 'doctor', 'pharmacist'],
    delete: ['admin'],
  },
  billing: {
    create: ['admin', 'billing', 'receptionist'],
    read: ['admin', 'doctor', 'billing', 'receptionist'],
    update: ['admin', 'billing'],
    delete: [], // Invoices cannot be deleted
  },
  inventory: {
    create: ['admin', 'nurse', 'pharmacist'],
    read: ['admin', 'doctor', 'nurse', 'pharmacist'],
    update: ['admin', 'nurse', 'pharmacist'],
    delete: ['admin'],
  },
  department: {
    create: ['admin'],
    read: ['admin', 'doctor', 'nurse', 'receptionist', 'billing', 'pharmacist'],
    update: ['admin'],
    delete: ['admin'],
  },
}

// ─── Router Factory ─────────────────────────────────────────

export function createEntityRouter(entityName: string): Hono<{ Variables: Variables }> {
  const rbac = ENTITY_RBAC[entityName] ?? {
    create: ['admin'],
    read: ['admin'],
    update: ['admin'],
    delete: ['admin'],
  }

  const router = new Hono<{ Variables: Variables }>()

  // Apply auth to all routes
  router.use('*', authMiddleware)

  // ─── LIST ──────────────────────────────────────────────────
  router.get('/', requireAnyRole(rbac.read), async (c) => {
    const query = c.req.query()
    const tenantId = c.get('tenantId')

    const page = parseInt(query.page ?? '1', 10)
    const pageSize = Math.min(parseInt(query.pageSize ?? '50', 10), 500)
    const search = query.search?.toLowerCase()
    const status = query.status

    let entities = serverStore.getEntitiesByType(entityName, tenantId)

    // Apply search
    if (search) {
      entities = entities.filter((e) => {
        const searchable = JSON.stringify(e.data).toLowerCase()
        return searchable.includes(search)
      })
    }

    // Apply status filter
    if (status) {
      entities = entities.filter((e) => e.data.status === status)
    }

    // Sort by updatedAt desc
    entities.sort((a, b) => (b.data.updatedAt as number ?? 0) - (a.data.updatedAt as number ?? 0))

    // Paginate
    const total = entities.length
    const start = (page - 1) * pageSize
    const items = entities.slice(start, start + pageSize).map((e) => e.data)

    return c.json({
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  })

  // ─── GET BY ID ─────────────────────────────────────────────
  router.get('/:id', requireAnyRole(rbac.read), async (c) => {
    const id = c.req.param('id')
    const tenantId = c.get('tenantId')

    const entity = serverStore.getEntity(id, tenantId)
    if (!entity) {
      return c.json({ error: 'Not found', code: 'NOT_FOUND' }, 404)
    }

    return c.json(entity.data)
  })

  // ─── CREATE ────────────────────────────────────────────────
  router.post('/', requireAnyRole(rbac.create), async (c) => {
    const tenantId = c.get('tenantId')
    const userId = c.get('userId')
    const body = await c.req.json()

    try {
      const entity = serverStore.createEntity(entityName, body, tenantId, userId)
      return c.json(entity.data, 201)
    } catch (err: any) {
      return c.json({ error: err.message, code: 'CREATE_FAILED' }, 400)
    }
  })

  // ─── UPDATE ────────────────────────────────────────────────
  router.put('/:id', requireAnyRole(rbac.update), async (c) => {
    const id = c.req.param('id')
    const tenantId = c.get('tenantId')
    const body = await c.req.json()

    try {
      const entity = serverStore.updateEntity(entityName, id, body, tenantId)
      if (!entity) {
        return c.json({ error: 'Not found', code: 'NOT_FOUND' }, 404)
      }
      return c.json(entity.data)
    } catch (err: any) {
      return c.json({ error: err.message, code: 'UPDATE_FAILED' }, 400)
    }
  })

  // ─── DELETE (Soft) ─────────────────────────────────────────
  router.delete('/:id', requireAnyRole(rbac.delete.length > 0 ? rbac.delete : ['superadmin']), async (c) => {
    const id = c.req.param('id')
    const tenantId = c.get('tenantId')

    const success = serverStore.softDeleteEntity(entityName, id, tenantId)
    if (!success) {
      return c.json({ error: 'Not found', code: 'NOT_FOUND' }, 404)
    }

    return c.json({ deleted: true, id })
  })

  // ─── COUNT ─────────────────────────────────────────────────
  router.get('/count', requireAnyRole(rbac.read), async (c) => {
    const tenantId = c.get('tenantId')
    const query = c.req.query()

    let filter: Record<string, unknown> = {}
    if (query.status) filter.status = query.status

    const count = serverStore.countEntities(entityName, tenantId, filter)
    return c.json({ count })
  })

  return router
}
