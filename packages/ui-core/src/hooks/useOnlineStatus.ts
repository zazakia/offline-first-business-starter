import { useState, useEffect, useCallback } from 'react'

interface OnlineStatus {
  online: boolean
  wasOffline: boolean
  lastChangedAt: number | null
  connectionType?: string
  downlink?: number // Mbps
}

/**
 * Hook to track online/offline status with connection info.
 * Essential for offline-first apps.
 */
export function useOnlineStatus(): OnlineStatus {
  const [status, setStatus] = useState<OnlineStatus>(() => ({
    online: navigator.onLine,
    wasOffline: !navigator.onLine,
    lastChangedAt: null,
  }))

  const handleOnline = useCallback(() => {
    setStatus((prev) => ({
      online: true,
      wasOffline: prev.online === false ? true : prev.wasOffline,
      lastChangedAt: Date.now(),
      connectionType: getConnectionType(),
      downlink: getDownlink(),
    }))
  }, [])

  const handleOffline = useCallback(() => {
    setStatus((prev) => ({
      online: false,
      wasOffline: true,
      lastChangedAt: Date.now(),
      connectionType: getConnectionType(),
      downlink: getDownlink(),
    }))
  }, [])

  const handleConnectionChange = useCallback(() => {
    setStatus((prev) => ({
      ...prev,
      connectionType: getConnectionType(),
      downlink: getDownlink(),
    }))
  }, [])

  useEffect(() => {
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Listen for connection type changes (Chrome-only)
    const connection = getNetworkInformation()
    if (connection) {
      connection.addEventListener('change', handleConnectionChange)
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange)
      }
    }
  }, [handleOnline, handleOffline, handleConnectionChange])

  // Reset wasOffline after it's been read
  useEffect(() => {
    if (status.online && status.wasOffline) {
      const timer = setTimeout(() => {
        setStatus((prev) => ({ ...prev, wasOffline: false }))
      }, 3000)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [status.online, status.wasOffline])

  return status
}

function getConnectionType(): string | undefined {
  const connection = getNetworkInformation()
  return connection?.type ?? connection?.effectiveType ?? undefined
}

function getDownlink(): number | undefined {
  const connection = getNetworkInformation()
  return connection?.downlink ?? undefined
}

function getNetworkInformation(): (NetworkInformation & EventTarget) | null {
  if (typeof navigator !== 'undefined' && 'connection' in navigator) {
    return (navigator as any).connection as NetworkInformation & EventTarget
  }
  return null
}

interface NetworkInformation {
  type: 'bluetooth' | 'cellular' | 'ethernet' | 'wifi' | 'wimax' | 'mixed' | 'other' | 'unknown'
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g'
  downlink: number
  downlinkMax: number
  rtt: number
  saveData: boolean
}
