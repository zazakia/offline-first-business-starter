/**
 * ─── Auth Provider Interface ─────────────────────────────────
 * Authentication and authorization abstraction.
 * Swap Supabase, Clerk, Auth0, Keycloak, or custom.
 */

import type { EntityId, TimestampMillis } from '../types'

export interface Session {
  userId: string
  tenantId: string
  email: string
  name: string
  roles: string[]
  permissions: string[]
  expiresAt: TimestampMillis
  metadata?: Record<string, unknown>
}

export interface LoginInput {
  email: string
  password?: string
  provider?: 'password' | 'google' | 'github' | 'magic-link' | 'sso'
  code?: string
}

export interface RegisterInput {
  email: string
  password: string
  name: string
  tenantId?: string
  inviteToken?: string
}

export interface AuthProvider {
  /** Authenticate a user */
  login(input: LoginInput): Promise<Session>

  /** Register a new user */
  register(input: RegisterInput): Promise<Session>

  /** Log the current user out */
  logout(): Promise<void>

  /** Get the current session (null if not authenticated) */
  getSession(): Promise<Session | null>

  /** Refresh the session if expired */
  refreshSession(): Promise<Session | null>

  /** Check if user has a specific permission */
  hasPermission(permission: string, resource?: string): Promise<boolean>

  /** Check if user has a specific role */
  hasRole(role: string): Promise<boolean>

  /** Listen for session changes (login/logout/token refresh) */
  onSessionChange(cb: (session: Session | null) => void): () => void

  /** Get the stored session for offline use */
  getOfflineSession(): Promise<Session | null>

  /** Store session for offline use */
  persistSession(session: Session): Promise<void>

  /** Clear stored session */
  clearSession(): Promise<void>
}
