/**
 * ─── ClinicMeta API Server ───────────────────────────────────
 * Hono backend — Supabase-connected, auth-enforced, entity CRUD.
 *
 * Endpoints:
 *   GET  /api/patients          — List patients
 *   POST /api/patients          — Create patient
 *   GET  /api/patients/:id      — Get patient by ID
 *   PUT  /api/patients/:id      — Update patient
 *   DEL  /api/patients/:id      — Soft-delete patient
 *   ...same for doctors, appointments, medical-records,
 *       prescriptions, billing, inventory, departments
 *
 *   POST /sync/push             — Push local changes
 *   GET  /sync/pull             — Pull remote changes
 *   GET  /api/stats             — Dashboard stats
 *   GET  /api/health            — Server health
 *   POST /api/seed              — Seed demo data (dev only)
 *
 * Start:
 *   npx tsx src/index.ts
 *   PORT=3001 npx tsx src/index.ts
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { showRoutes } from 'hono/dev'

import { authMiddleware, requireAnyRole } from './middleware/auth'
import { createEntityRouter } from './routes/entity-crud'
import { syncRouter } from './routes/sync'
import { serverStore } from './db/store'

import type { AuthContext } from './middleware/auth'

// ─── App ─────────────────────────────────────────────────────

const app = new Hono()

// ─── Global Middleware ───────────────────────────────────────

app.use('*', cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'exp://*'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Authorization', 'Content-Type', 'X-Tenant-Id'],
  exposeHeaders: ['X-Total-Count', 'X-Page'],
  maxAge: 86400,
}))

app.use('*', logger())
app.use('*', prettyJSON())

// ─── Public Routes ───────────────────────────────────────────

app.get('/', (c) => {
  return c.json({
    name: 'ClinicMeta API',
    version: '1.0.0',
    description: 'Sistema de Gestión Clínica y Hospitalaria — API REST',
    docs: '/api',
    health: '/api/health',
    entities: [
      'patients', 'doctors', 'appointments', 'medical-records',
      'prescriptions', 'billing', 'inventory', 'departments',
    ],
    sync: { push: '/sync/push', pull: '/sync/pull' },
  })
})

app.get('/api', (c) => {
  return c.json({
    entities: {
      patients: { list: 'GET /api/patients', create: 'POST /api/patients', get: 'GET /api/patients/:id', update: 'PUT /api/patients/:id', delete: 'DELETE /api/patients/:id' },
      doctors: { list: 'GET /api/doctors', create: 'POST /api/doctors', get: 'GET /api/doctors/:id', update: 'PUT /api/doctors/:id', delete: 'DELETE /api/doctors/:id' },
      appointments: { list: 'GET /api/appointments', create: 'POST /api/appointments', get: 'GET /api/appointments/:id', update: 'PUT /api/appointments/:id', delete: 'DELETE /api/appointments/:id' },
      'medical-records': { list: 'GET /api/medical-records', create: 'POST /api/medical-records', get: 'GET /api/medical-records/:id', update: 'PUT /api/medical-records/:id', delete: 'DELETE /api/medical-records/:id' },
      prescriptions: { list: 'GET /api/prescriptions', create: 'POST /api/prescriptions', get: 'GET /api/prescriptions/:id', update: 'PUT /api/prescriptions/:id', delete: 'DELETE /api/prescriptions/:id' },
      billing: { list: 'GET /api/billing', create: 'POST /api/billing', get: 'GET /api/billing/:id', update: 'PUT /api/billing/:id', delete: 'DELETE /api/billing/:id' },
      inventory: { list: 'GET /api/inventory', create: 'POST /api/inventory', get: 'GET /api/inventory/:id', update: 'PUT /api/inventory/:id', delete: 'DELETE /api/inventory/:id' },
      departments: { list: 'GET /api/departments', create: 'POST /api/departments', get: 'GET /api/departments/:id', update: 'PUT /api/departments/:id', delete: 'DELETE /api/departments/:id' },
    },
    sync: { push: 'POST /sync/push', pull: 'GET /sync/pull?since=<timestamp>' },
    analytics: { stats: 'GET /api/stats?tenant=<id>', health: 'GET /api/health' },
    auth: 'Bearer <supabase-jwt-token>',
  })
})

// Health check (public)
app.get('/api/health', (c) => {
  return c.json(serverStore.getHealth())
})

// ─── Entity CRUD Routes (Auth-Protected) ─────────────────────

const entities = [
  'patients',
  'doctors',
  'appointments',
  'medical-records',
  'prescriptions',
  'billing',
  'inventory',
  'departments',
]

for (const entity of entities) {
  const router = createEntityRouter(entity)
  app.route(`/api/${entity}`, router)
}

// ─── Analytics Routes ────────────────────────────────────────

app.get('/api/stats', authMiddleware, async (c) => {
  const tenantId = c.get('tenantId')
  const stats = serverStore.getTenantStats(tenantId)
  return c.json({
    tenantId,
    generatedAt: Date.now(),
    ...stats,
  })
})

// ─── Sync Routes ─────────────────────────────────────────────

app.route('/sync', syncRouter)

// ─── Dev: Seed Demo Data ─────────────────────────────────────

app.post('/api/seed', authMiddleware, requireAnyRole(['admin', 'superadmin']), async (c) => {
  const tenantId = c.get('tenantId')
  try {
    serverStore.seedDemoData(tenantId)
    return c.json({ seeded: true, tenantId })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// ─── 404 Handler ─────────────────────────────────────────────

app.notFound((c) => {
  return c.json({
    error: 'Not found',
    code: 'NOT_FOUND',
    path: c.req.path,
    method: c.req.method,
    hint: 'See /api for available endpoints',
  }, 404)
})

// ─── Global Error Handler ────────────────────────────────────

app.onError((err, c) => {
  console.error('API Error:', err)
  return c.json({
    error: err.message || 'Internal server error',
    code: 'INTERNAL_ERROR',
  }, 500)
})

// ─── Start Server ────────────────────────────────────────────

const port = parseInt(process.env.PORT ?? '3001', 10)

async function start() {
  // Check if running directly (not imported as module)
  const isDirectRun = process.argv[1]?.includes('index.ts') || process.argv[1]?.includes('index.js')

  if (isDirectRun) {
    const { serve } = await import('@hono/node-server')

    // Auto-seed in dev
    if (process.env.NODE_ENV !== 'production') {
      serverStore.seedDemoData('default')
    }

    serve({ fetch: app.fetch, port })
    console.log(`
╔══════════════════════════════════════════════════════╗
║           🏥 ClinicMeta API Server                   ║
║                                                      ║
║   Local:   http://localhost:${port}                      ║
║   Docs:    http://localhost:${port}/api                  ║
║   Health:  http://localhost:${port}/api/health           ║
║                                                      ║
║   Entities: patients, doctors, appointments,         ║
║             medical-records, prescriptions,          ║
║             billing, inventory, departments          ║
║                                                      ║
║   ${process.env.NODE_ENV === 'production' ? '🔒 Production mode' : '🔧 Development mode (demo data seeded)'}   ║
╚══════════════════════════════════════════════════════╝
    `)
  }
}

start()

export { app }
export type { AuthContext }
