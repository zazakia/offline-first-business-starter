/**
 * ─── Offline Banner ──────────────────────────────────────────
 * Shows a persistent banner when the app is offline.
 * Dismissible, but reappears if still offline after navigation.
 */

import { useState, useEffect } from 'react'
import { useOnlineStatus } from '@repo/ui-core'
import { WifiOff } from 'lucide-react'
import { cn } from '@repo/ui-core'

export function OfflineBanner() {
  const { online, wasOffline } = useOnlineStatus()
  const [dismissed, setDismissed] = useState(false)

  // Re-show if user was offline and comes back
  useEffect(() => {
    if (online) {
      const timer = setTimeout(() => setDismissed(false), 10000)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [online])

  if (online && !wasOffline) return null
  if (dismissed && online) return null

  return (
    <div
      className={cn(
        'fixed bottom-4 left-1/2 z-50 -translate-x-1/2 transform transition-all duration-500',
        online ? 'translate-y-0 opacity-100' : 'translate-y-0 opacity-100',
      )}
    >
      <div
        className={cn(
          'flex items-center gap-3 rounded-full px-4 py-2 shadow-lg backdrop-blur-sm',
          online
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-yellow-50 text-yellow-800 border border-yellow-200',
        )}
      >
        <WifiOff className="h-4 w-4" />
        <span className="text-sm font-medium">
          {online
            ? 'Back online — syncing your changes...'
            : 'You are offline — changes will sync automatically'}
        </span>
        <button
          onClick={() => setDismissed(true)}
          className="ml-2 rounded-full p-1 hover:bg-black/5"
          aria-label="Dismiss"
        >
          <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}
