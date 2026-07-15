/**
 * ─── Auth Hook ───────────────────────────────────────────────
 * ClinicMeta authentication — Supabase Auth + role management.
 * Handles: login, logout, session persistence, role checks.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ─── Types ───────────────────────────────────────────────────

export type ClinicRole = 'superadmin' | 'admin' | 'doctor' | 'nurse' | 'pharmacist' | 'billing' | 'receptionist' | 'user'

export interface ClinicUser {
  id: string
  email: string
  fullName: string
  role: ClinicRole
  tenantId: string
  tenantName: string
  avatarUrl?: string
  licenseNumber?: string // For doctors
  departmentId?: string
}

interface AuthState {
  user: ClinicUser | null
  session: string | null
  isLoading: boolean
  error: string | null

  login: (email: string, password: string) => Promise<void>
  logout: () => void
  switchTenant: (tenantId: string) => void
  hasRole: (role: ClinicRole | ClinicRole[]) => boolean
  clearError: () => void
}

// ─── Demo Users (Development) ────────────────────────────────

const DEMO_USERS: Record<string, ClinicUser & { password: string }> = {
  'admin@clinicmeta.local': {
    id: 'user-admin-001',
    email: 'admin@clinicmeta.local',
    password: 'admin123',
    fullName: 'Administrador del Sistema',
    role: 'admin',
    tenantId: 'default',
    tenantName: 'ClinicMeta Demo',
  },
  'doctor@clinicmeta.local': {
    id: 'user-doc-001',
    email: 'doctor@clinicmeta.local',
    password: 'doctor123',
    fullName: 'Dr. Carlos Mendoza',
    role: 'doctor',
    tenantId: 'default',
    tenantName: 'ClinicMeta Demo',
    licenseNumber: 'CED-12345678',
  },
  'nurse@clinicmeta.local': {
    id: 'user-nurse-001',
    email: 'nurse@clinicmeta.local',
    password: 'nurse123',
    fullName: 'Enfra. Patricia López',
    role: 'nurse',
    tenantId: 'default',
    tenantName: 'ClinicMeta Demo',
  },
  'reception@clinicmeta.local': {
    id: 'user-recep-001',
    email: 'reception@clinicmeta.local',
    password: 'recep123',
    fullName: 'Recepcionista Sistema',
    role: 'receptionist',
    tenantId: 'default',
    tenantName: 'ClinicMeta Demo',
  },
  'pharma@clinicmeta.local': {
    id: 'user-pharm-001',
    email: 'pharma@clinicmeta.local',
    password: 'pharma123',
    fullName: 'Farm. Jorge Ramírez',
    role: 'pharmacist',
    tenantId: 'default',
    tenantName: 'ClinicMeta Demo',
  },
  'billing@clinicmeta.local': {
    id: 'user-bill-001',
    email: 'billing@clinicmeta.local',
    password: 'billing123',
    fullName: 'Contador Sistema',
    role: 'billing',
    tenantId: 'default',
    tenantName: 'ClinicMeta Demo',
  },
}

// ─── Role Hierarchy ──────────────────────────────────────────

const ROLE_LEVELS: Record<ClinicRole, number> = {
  superadmin: 100,
  admin: 90,
  doctor: 80,
  nurse: 70,
  pharmacist: 65,
  billing: 60,
  receptionist: 50,
  user: 10,
}

// ─── Store ───────────────────────────────────────────────────

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })

        // Simulate network delay
        await new Promise((r) => setTimeout(r, 600))

        const demoUser = DEMO_USERS[email.toLowerCase()]
        if (!demoUser || demoUser.password !== password) {
          set({ isLoading: false, error: 'Credenciales inválidas' })
          return
        }

        const { password: _, ...user } = demoUser
        set({
          user,
          session: `session-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          isLoading: false,
          error: null,
        })
      },

      logout: () => {
        set({ user: null, session: null, error: null })
      },

      switchTenant: (tenantId: string) => {
        const user = get().user
        if (user) {
          set({ user: { ...user, tenantId } })
        }
      },

      hasRole: (role: ClinicRole | ClinicRole[]) => {
        const user = get().user
        if (!user) return false

        const roles = Array.isArray(role) ? role : [role]
        const userLevel = ROLE_LEVELS[user.role] ?? 0
        return roles.some((r) => userLevel >= (ROLE_LEVELS[r] ?? 0))
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'clinicmeta-auth',
      partialize: (state) => ({
        user: state.user,
        session: state.session,
      }),
    },
  ),
)

// ─── Navigation Guards ───────────────────────────────────────

export function useRequireAuth() {
  const { user, isLoading } = useAuth()
  return { isAuthenticated: !!user, isLoading }
}

export function useRequireRole(role: ClinicRole | ClinicRole[]) {
  const { user, isLoading, hasRole } = useAuth()
  return {
    isAuthorized: !!user && hasRole(role),
    isLoading,
    user,
  }
}

// ─── Demo Login Quick-Access ─────────────────────────────────

export const DEMO_CREDENTIALS = Object.entries(DEMO_USERS).map(([email, user]) => ({
  email,
  password: (user as any).password,
  role: user.role,
  label: user.fullName,
}))
