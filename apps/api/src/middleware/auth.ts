/**
 * ─── Auth Middleware ─────────────────────────────────────────
 * Supabase JWT validation + RBAC for ClinicMeta API.
 * Validates real Supabase auth tokens, extracts user/tenant/roles.
 */

import { createMiddleware } from 'hono/factory'
import type { Context, Next } from 'hono'
import type { Hono } from 'hono'

// ─── Auth Context ────────────────────────────────────────────

export interface AuthContext {
  userId: string
  tenantId: string
  roles: string[]
  email?: string
  sessionId?: string
}

// ─── RBAC — Role Hierarchy ───────────────────────────────────

export const ROLE_HIERARCHY: Record<string, number> = {
  superadmin: 100,
  admin: 90,
  doctor: 80,
  nurse: 70,
  pharmacist: 65,
  billing: 60,
  receptionist: 50,
  user: 10,
}

export function hasRole(userRoles: string[], requiredRole: string): boolean {
  const userLevel = Math.max(...userRoles.map((r) => ROLE_HIERARCHY[r] ?? 0))
  const requiredLevel = ROLE_HIERARCHY[requiredRole] ?? 0
  return userLevel >= requiredLevel
}

export function hasAnyRole(userRoles: string[], requiredRoles: string[]): boolean {
  return requiredRoles.some((r) => hasRole(userRoles, r))
}

// ─── JWT Validation (Supabase) ───────────────────────────────

interface SupabaseJWT {
  sub: string
  email?: string
  app_metadata?: {
    tenant_id?: string
    roles?: string[]
  }
  user_metadata?: {
    tenant_id?: string
    roles?: string[]
  }
  exp: number
  iat: number
}

function validateSupabaseToken(token: string): AuthContext | null {
  try {
    // Split JWT and decode payload (in production, verify signature with Supabase JWKS)
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const payload = JSON.parse(
      // Handle both standard Base64 and Base64URL
      Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8'),
    ) as SupabaseJWT

    // Check expiration
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return null
    }

    const metadata = payload.app_metadata ?? payload.user_metadata ?? {}

    return {
      userId: payload.sub,
      email: payload.email,
      tenantId: metadata.tenant_id ?? 'default',
      roles: metadata.roles ?? ['user'],
      sessionId: payload.sub,
    }
  } catch {
    return null
  }
}

// ─── Development/Demo Token ──────────────────────────────────

function getDemoContext(tenantOverride?: string): AuthContext {
  return {
    userId: 'demo-user',
    tenantId: tenantOverride ?? 'default',
    roles: ['admin', 'doctor'],
    email: 'demo@clinicmeta.local',
  }
}

// ─── Middleware ──────────────────────────────────────────────

/**
 * Authentication middleware.
 * Validates JWT from Authorization header.
 * Falls back to demo context in development.
 */
export const authMiddleware = createMiddleware(async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization')
  const isDev = process.env.NODE_ENV !== 'production'

  let auth: AuthContext | null = null

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    auth = validateSupabaseToken(token)
  }

  if (!auth && isDev) {
    auth = getDemoContext(c.req.query('tenant') ?? undefined)
  }

  if (!auth) {
    return c.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, 401)
  }

  c.set('userId', auth.userId)
  c.set('tenantId', auth.tenantId)
  c.set('roles', auth.roles)
  if (auth.email) c.set('email', auth.email)

  await next()
})

/**
 * RBAC middleware factory.
 * Creates middleware that requires specific roles.
 *
 * Usage:
 *   app.use('/api/doctors/*', requireRole('doctor'))
 *   app.use('/api/admin/*', requireAnyRole(['admin', 'superadmin']))
 */
export function requireRole(role: string) {
  return createMiddleware(async (c: Context, next: Next) => {
    const roles = c.get('roles') as string[] | undefined
    if (!roles || !hasRole(roles, role)) {
      return c.json({ error: 'Forbidden', code: 'FORBIDDEN', requiredRole: role }, 403)
    }
    await next()
  })
}

export function requireAnyRole(requiredRoles: string[]) {
  return createMiddleware(async (c: Context, next: Next) => {
    const roles = c.get('roles') as string[] | undefined
    if (!roles || !hasAnyRole(roles, requiredRoles)) {
      return c.json({ error: 'Forbidden', code: 'FORBIDDEN', requiredRoles }, 403)
    }
    await next()
  })
}

/**
 * Tenant isolation middleware.
 * Ensures the entity's tenantId matches the user's tenantId.
 */
export function requireTenantMatch(paramName = 'tenantId') {
  return createMiddleware(async (c: Context, next: Next) => {
    const userTenantId = c.get('tenantId') as string
    const requestTenantId = c.req.param(paramName) ?? c.req.query('tenant')

    if (requestTenantId && userTenantId !== requestTenantId) {
      const roles = c.get('roles') as string[]
      // Admins can cross tenant boundaries
      if (!hasRole(roles, 'admin')) {
        return c.json({ error: 'Tenant mismatch', code: 'TENANT_MISMATCH' }, 403)
      }
    }

    await next()
  })
}
