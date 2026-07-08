/**
 * ─── API Server ──────────────────────────────────────────────
 * Hono backend with sync endpoints for offline-first apps.
 * Start: npx tsx src/index.ts
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { syncRouter } from './routes/sync'

// Augment Hono's context variables
type Variables = {
  userId: string
  tenantId: string
  roles: string[]
}

const app = new Hono<{ Variables: Variables }>()

// ─── Global Middleware ───────────────────────────────────

app.use('*', cors())
app.use('*', logger())

// Simple auth middleware
app.use('/sync/*', async (c, next) => {
  c.set('userId', 'demo-user')
  c.set('tenantId', c.req.query('tenant') ?? 'default')
  c.set('roles', ['user'])
  await next()
})

// ─── Routes ──────────────────────────────────────────────

app.route('/sync', syncRouter)

app.get('/', (c) => {
  return c.json({
    name: 'OfflineBiz Sync API',
    version: '0.1.0',
    endpoints: {
      push: { method: 'POST', path: '/sync/push' },
      pull: { method: 'GET', path: '/sync/pull?since=<timestamp>' },
      health: { method: 'GET', path: '/sync/health' },
    },
  })
})

// ─── Start ───────────────────────────────────────────────

const port = parseInt(process.env.PORT ?? '3001', 10)

// Check if running with tsx (direct execution)
if (process.argv[1]?.includes('index.ts')) {
  const { serve } = await import('@hono/node-server')
  serve({ fetch: app.fetch, port })
  console.log(`🚀 Sync API running at http://localhost:${port}`)
}

export { app }
