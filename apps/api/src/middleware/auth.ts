/**
 * ─── Auth Middleware ─────────────────────────────────────────
 * Simple JWT-like auth for the sync API.
 * In production, validate real JWT tokens from your auth provider.
 */

import { createMiddleware } from 'hono/factory'
import type { Context, Next } from 'hono'

interface AuthContext {
  userId: string
  tenantId: string
  roles: string[]
}

// Simple token validation (demo purposes)
function validateToken(token: string): AuthContext | null {
  try {
    const decoded = JSON.parse(atob(token.split('.')[1] ?? ''))
    return {
      userId: decoded.sub ?? 'anonymous',
      tenantId: decoded.tenant ?? 'default',
      roles: decoded.roles ?? ['user'],
    }
  } catch {
    return null
  }
}

export const authMiddleware = createMiddleware(async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization')
  
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const auth = validateToken(token)
    if (auth) {
      c.set('userId', auth.userId)
      c.set('tenantId', auth.tenantId)
      c.set('roles', auth.roles)
    }
  }

  // For demo, provide default context if no token
  if (!c.get('userId')) {
    c.set('userId', 'demo-user')
    c.set('tenantId', c.req.query('tenant') ?? 'default')
    c.set('roles', ['user'])
  }

  await next()
})
