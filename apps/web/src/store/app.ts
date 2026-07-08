/**
 * ─── App Store (Zustand) ─────────────────────────────────────
 * Lightweight client state management.
 * NOT for server data — that goes in TanStack Query.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ThemeState {
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  resolvedTheme: 'light' | 'dark'
  setResolvedTheme: (theme: 'light' | 'dark') => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'system',
      resolvedTheme: 'light',
      setTheme: (theme) => set({ theme }),
      setResolvedTheme: (resolvedTheme) => set({ resolvedTheme }),
    }),
    { name: 'app-theme' },
  ),
)

interface SyncState {
  pendingCount: number
  lastSyncAt: number | null
  syncing: boolean
  hasConflicts: boolean
  setPendingCount: (count: number) => void
  setLastSyncAt: (timestamp: number) => void
  setSyncing: (syncing: boolean) => void
  setHasConflicts: (has: boolean) => void
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set) => ({
      pendingCount: 0,
      lastSyncAt: null,
      syncing: false,
      hasConflicts: false,
      setPendingCount: (pendingCount) => set({ pendingCount }),
      setLastSyncAt: (lastSyncAt) => set({ lastSyncAt }),
      setSyncing: (syncing) => set({ syncing }),
      setHasConflicts: (hasConflicts) => set({ hasConflicts }),
    }),
    { name: 'app-sync' },
  ),
)

interface AppState {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  currentTenant: string
  setCurrentTenant: (tenant: string) => void
}

export const useAppStore = create<AppState>()((set) => ({
  sidebarOpen: true,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  currentTenant: 'default',
  setCurrentTenant: (currentTenant) => set({ currentTenant }),
}))
